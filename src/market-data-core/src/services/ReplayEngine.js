const db = require('./DatabaseService');
const { v4: uuidv4 } = require('uuid');

class ReplayEngine {
    constructor() {
        // activeReplays: { [sessionId]: { sessionData, activeClients: Set } }
        this.activeReplays = new Map();
    }

    /**
     * Start or resume a backtest session.
     */
    startSession(config) {
        let session;
        if (config.resumeId) {
            session = db.getBacktestSession(config.resumeId);
            if (!session) throw new Error("Backtest Session not found.");
            // Reset status if it was stopped
            if (session.status !== 'ACTIVE') {
                session.status = 'ACTIVE';
                db.saveBacktestSession(session);
            }
        } else {
            session = {
                id: `bt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                name: config.name || `Backtest ${new Date().toISOString().split('T')[0]}`,
                main_symbol: config.main_symbol || 'EURUSD',
                strategy: config.strategy || '',
                start_time: config.start_time,
                simulation_time: config.start_time,
                initial_balance: config.initial_balance || 100000,
                current_balance: config.initial_balance || 100000,
                status: 'ACTIVE',
                created_at: Date.now()
            };
            db.saveBacktestSession(session);
        }

        this.activeReplays.set(session.id, {
            data: session,
            clients: new Set()
        });

        console.log(`[ReplayEngine] ⏪ Started Backtest ${session.id} at simulation_time: ${session.simulation_time}`);
        return session;
    }

    /**
     * Stop a backtest session.
     */
    stopSession(sessionId) {
        let replay = this.activeReplays.get(sessionId);
        if (!replay) {
            const db = require('./DatabaseService');
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
                replay = this.activeReplays.get(sessionId);
            }
        }

        if (replay) {
            replay.data.status = 'STOPPED';
            db.saveBacktestSession(replay.data);
            this.activeReplays.delete(sessionId);
            console.log(`[ReplayEngine] ⏹️ Stopped Backtest ${sessionId}`);
        }
    }

    registerClient(sessionId, socketId) {
        if (!this.activeReplays.has(sessionId)) {
            // Attempt to lazy-load
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
            } else {
                return false;
            }
        }
        this.activeReplays.get(sessionId).clients.add(socketId);
        return true;
    }

    removeClient(socketId) {
        for (const [sid, replay] of this.activeReplays.entries()) {
            replay.clients.delete(socketId);
            if (replay.clients.size === 0) {
                // Auto-pause session if no clients? We just leave it active in memory for now.
            }
        }
    }

    /**
     * Checks if a specific config hash is spoofed (prevent future leaks).
     * @returns augmented config hash.
     */
    getSpoofedConfigHash(sessionId, originalHash) {
        if (!sessionId) return originalHash;
        return `${sessionId}_${originalHash}`;
    }

    getSimulationTime(sessionId) {
        if (!sessionId) return null;
        let replay = this.activeReplays.get(sessionId);

        // Lazy-load if not in memory (e.g. after server restart)
        if (!replay) {
            const db = require('./DatabaseService');
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
                replay = this.activeReplays.get(sessionId);
            }
        }

        return replay ? replay.data.simulation_time : null;
    }

    getSessionBalance(sessionId) {
        if (!sessionId) return null;
        let replay = this.activeReplays.get(sessionId);
        if (!replay) {
            const db = require('./DatabaseService');
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
                replay = this.activeReplays.get(sessionId);
            }
        }
        return replay ? replay.data.current_balance : null;
    }

    updateSessionBalance(sessionId, pnlDelta) {
        let replay = this.activeReplays.get(sessionId);
        if (!replay) {
            const db = require('./DatabaseService');
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
                replay = this.activeReplays.get(sessionId);
            }
        }

        if (replay) {
            replay.data.current_balance += pnlDelta;
            db.saveBacktestSession(replay.data);
            return replay.data.current_balance;
        }
        return null;
    }

    /**
     * Centralized step logic.
     * Moves time forward by N milliseconds and fetches the exact M1 candles to build the new state.
     */
    async stepForward(sessionId, advanceMs, symbols = []) {
        let replay = this.activeReplays.get(sessionId);
        if (!replay) {
            const db = require('./DatabaseService');
            const session = db.getBacktestSession(sessionId);
            if (session && session.status === 'ACTIVE') {
                this.activeReplays.set(sessionId, { data: session, clients: new Set() });
                replay = this.activeReplays.get(sessionId);
            } else {
                throw new Error("Backtest Session not active or not found.");
            }
        }

        const oldTime = replay.data.simulation_time;
        const newTime = oldTime + advanceMs;

        // Fetch exactly the M1 candles between oldTime and newTime for relevant symbols
        const updatesBySymbol = {};

        for (const sym of symbols) {
            try {
                // We need M1 candles up to newTime to simulate ticking
                const candles = db.getHistory(sym, 'M1', 100, newTime + 60000); // Fetch a bit past to guarantee we get the step candle
                // Filter perfectly to only the step duration
                const stepCandles = candles.filter(c => c.time > oldTime && c.time <= newTime);
                if (stepCandles.length > 0) {
                    updatesBySymbol[sym] = stepCandles;
                }
            } catch (e) {
                console.error(`[ReplayEngine] Error loading step candles for ${sym}:`, e);
            }
        }

        // Apply Time Advance
        replay.data.simulation_time = newTime;
        db.saveBacktestSession(replay.data);

        // Process Paper Trades (SL/TP Hits) based on these ticks BEFORE finishing step
        const paperTradeEngine = require('./PaperTradeEngine');
        paperTradeEngine.processSimulationStep(sessionId, updatesBySymbol);

        return {
            newTime,
            updatesBySymbol
        };
    }
}

module.exports = new ReplayEngine();
