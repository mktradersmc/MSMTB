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
        let newTime = oldTime + advanceMs;

        // --- WEEKEND FAST FORWARD LOGIC ---
        // Find the absolute closest next tick across all symbols
        let skipToTime = null;
        for (const sym of symbols) {
            const nextTime = db.getNextCandleTime(sym, 'M1', oldTime);
            if (nextTime !== null) {
                if (skipToTime === null || nextTime < skipToTime) {
                    skipToTime = nextTime;
                }
            }
        }

        // If the closest next market tick is further in the future than our step, skip the dead air.
        if (skipToTime !== null && skipToTime > newTime) {
            console.log(`[ReplayEngine] ⏩ Dead Zone Detected! Fast-forwarding clock from ${new Date(newTime).toISOString()} to ${new Date(skipToTime).toISOString()}`);
            newTime = skipToTime;
        }

        // Fetch exactly the M1 candles between oldTime and newTime for relevant symbols
        const updatesBySymbol = {};

        for (const sym of symbols) {
            try {
                // Determine how many M1 candles fit into this skip duration (min 100 for safety, up to exact amount + buffer)
                const maxExpectedCandles = Math.ceil(advanceMs / 60000) + 10;
                const limit = Math.max(100, maxExpectedCandles);

                // We need M1 candles up to newTime to simulate ticking
                const candles = db.getHistory(sym, 'M1', limit, newTime + 60000); // Fetch a bit past to guarantee we get the step candle
                // Filter perfectly to only the step duration (>= oldTime, < newTime) because c.time is the Open Time of the minute.
                const stepCandles = candles.filter(c => c.time >= oldTime && c.time < newTime);
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

    /**
     * Updates the session balance by realizing PnL from closed or partially closed paper trades.
     */
    updateSessionBalance(sessionId) {
        const db = require('./DatabaseService');
        let session = db.getBacktestSession(sessionId);

        if (session) {
            // Recalculate full balance from all trades instead of unreliable deltas
            const trades = db.getBacktestTrades(sessionId);
            let realizedPnlSum = 0;
            for (const t of trades) {
                realizedPnlSum += (t.realized_pl || 0);
            }

            session.current_balance = session.initial_balance + realizedPnlSum;

            db.saveBacktestSession(session);

            // Sync with active replay cache if running
            const replay = this.activeReplays.get(sessionId);
            if (replay) {
                replay.data = session;
            }

            // Broadcast the new balance to the frontend
            try {
                const orchestrator = require('./SystemOrchestrator');
                if (orchestrator.socketServer && orchestrator.socketServer.io) {
                    console.log(`[ReplayEngine] 🚀 Broadcasting backtest_balance_update to ${sessionId} (${session.current_balance})`);
                    orchestrator.socketServer.io.emit('backtest_balance_update', {
                        sessionId: sessionId,
                        balance: session.current_balance
                    });
                } else {
                    console.warn(`[ReplayEngine] 🚨 socketServer or io is MISSING! Cannot broadcast balance.`);
                }
            } catch (e) {
                console.error("[ReplayEngine] Failed to broadcast balance update:", e);
            }

            console.log(`[ReplayEngine] Updated Session ${sessionId} Balance: ${session.current_balance}`);
        }
    }

    /**
     * Jump the backtest simulation time backward, reverting any trades and re-calculating the session balance.
     */
    async jumpTo(sessionId, targetTime) {
        let replay = this.activeReplays.get(sessionId);
        const db = require('./DatabaseService');
        let session = replay ? replay.data : db.getBacktestSession(sessionId);

        if (!session) {
            throw new Error("Backtest Session not found.");
        }

        if (targetTime >= session.simulation_time) {
            console.warn(`[ReplayEngine] Cannot jump completely forward yet or time is unchanged. targetTime=${targetTime}, current=${session.simulation_time}`);
            return session.simulation_time;
        }

        // 1. Revert trades in DB
        db.revertBacktestTrades(sessionId, targetTime);

        // 2. Fetch reverted trades and re-calculate balance
        const trades = db.getBacktestTrades(sessionId);
        let realizedPnlSum = 0;
        for (const t of trades) {
            realizedPnlSum += (t.realized_pl || 0);
        }
        session.current_balance = session.initial_balance + realizedPnlSum;

        // 3. Update simulation time
        session.simulation_time = targetTime;

        // 4. Save to DB
        db.saveBacktestSession(session);

        // Update active replays map
        if (replay) {
            replay.data = session;
        }

        // 5. Broadcast new balance and jump event
        try {
            const orchestrator = require('./SystemOrchestrator');
            if (orchestrator.socketServer && orchestrator.socketServer.io) {
                // Emit balance
                orchestrator.socketServer.io.emit('backtest_balance_update', {
                    sessionId: sessionId,
                    balance: session.current_balance
                });

                // Clear the frontend cache and signal a time jump.
                // Reusing BACKTEST_STEP_COMPLETE forces hooks to resync.
                // We'll also emit a specific BACKTEST_JUMP just in case.
                orchestrator.socketServer.io.emit('BACKTEST_STEP_COMPLETE', {
                    backtestId: sessionId,
                    newTime: targetTime,
                    updates: {},
                    isJump: true // custom flag for UI to clear states
                });
            }
        } catch (e) {
            console.error("[ReplayEngine] Failed to broadcast jump update:", e);
        }

        console.log(`[ReplayEngine] ⏪ Jumped Session ${sessionId} back to ${new Date(targetTime).toISOString()}. Balanced recalculated to ${session.current_balance}`);

        return targetTime;
    }
}

module.exports = new ReplayEngine();
