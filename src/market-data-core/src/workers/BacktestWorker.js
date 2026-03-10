const AbstractWorker = require('./AbstractWorker');
const db = require('../services/DatabaseService');

/**
 * BacktestWorker
 * 
 * A 100% complete virtual broker environment. 
 * Assumes all roles (DATAFEED, HISTORY, TRADING) simultaneously for a simulated session.
 * 
 * Identity Pattern:
 * botId = SIM-[SessionID]
 */
class BacktestWorker extends AbstractWorker {
    constructor() {
        super();
        this.simulationTime = 0;
        this.sessionData = null;
    }

    /**
     * Triggered immediately after parent setup
     */
    onBotConnected(info) {
        this.log(`[BacktestWorker] 🟢 Virtual Broker initialized for session: ${this.botId}`);
        // Typically, we load the session state from SQLite via the ReplayEngine or directly.
        // The simulation_time dictates reality for this worker.
        this.loadSessionState();
    }

    onBotDisconnected() {
        this.log(`[BacktestWorker] 🔴 Virtual Broker shutting down.`);
    }

    /**
     * Intercept Custom Commands (Step, Fetch History, Place Order)
     */
    onCommand(msg) {
        try {
            const cmdType = msg.command || msg.type;

            switch (cmdType) {
                // --- LIFECYCLE ---
                case 'CMD_BACKTEST_SYNC_STATE':
                    this.simulationTime = msg.content.simulationTime;
                    this.sessionData = msg.content.sessionData;
                    break;

                // --- FAST LOOP (DATAFEED) ---
                case 'CMD_BACKTEST_STEP':
                    this.handleBacktestStep(msg.content, msg.requestId);
                    break;

                // --- HISTORY INTERCEPTION ---
                case 'CMD_FETCH_HISTORY':
                    this.handleFetchHistory(msg.content, msg.requestId);
                    break;

                // --- TRADING INTERCEPTION ---
                case 'CMD_LOCAL_EXECUTE_TRADE':
                    this.handlePlaceOrder(msg.content);
                    break;

                case 'CMD_CLOSE_POSITION':
                case 'CMD_LOCAL_MODIFY_TRADE':
                    this.handleModifyOrder(msg.content);
                    break;

                // --- TICK SPY INTERCEPTION ---
                case 'CMD_SUBSCRIBE_TICKS':
                    const subPayload = msg.content || msg;
                    console.log(`[!!! ALARM-FLOW-TICKSPY 6 !!!] [BacktestWorker:${this.botId}:${this.func}:${this.symbol}] hat Subscribe Command für RoutingKey='${subPayload.routingKey}' empfangen!`);
                    this.subscribe(subPayload.timeframe);
                    break;

                case 'CMD_UNSUBSCRIBE_TICKS':
                    this.log(`[BacktestWorker] 🛑 TICK_SPY Unsubscribe requested for ${msg.content.symbol} ${msg.content.timeframe}`);
                    // Sandbox worker doesn't strictly need to track unsubs since it broadcasts to rooms, 
                    // but we log it for debug parity.
                    break;

                default:
                    this.log(`[BacktestWorker] ⚠️ Unknown command received: ${cmdType}`);
                    break;
            }
        } catch (e) {
            this.error(`Command Processing Error: ${e.stack}`);
        }
    }

    onStreamData(data) {
        // Not used: A BacktestWorker GENERATES stream data, it does not receive it from a bridge.
    }

    /**
     * Loads the Simulation Time and configuration from SQLite
     */
    loadSessionState() {
        const sessionId = this.botId.replace('SIM-', '');
        const session = db.getBacktestSession(sessionId);
        if (session) {
            this.simulationTime = session.simulation_time;
            this.sessionData = session;
            this.log(`[BacktestWorker] 🕰️ Simulation Reality locked at: ${new Date(this.simulationTime).toISOString()}`);
        } else {
            this.error(`[BacktestWorker] 🛑 Session ${sessionId} not found in DB!`);
        }
    }

    /**
     * Handles the "Next Step" command by fetching strictly the M1 candles 
     * up to the new target time, assembling partial HTF candles, and emitting them.
     */
    handleBacktestStep(payload) {
        const { advanceMs, symbols } = payload;

        // 1. Step Forward Time
        const oldTime = this.simulationTime;
        const newTime = oldTime + advanceMs;

        for (const sym of symbols) {
            // Fetch M1 candles surrounding this step
            // We fetch a bit more history to guarantee we cover the HTF anchor
            const candles = db.getHistory(sym, 'M1', 5000, newTime);
            const stepCandles = candles.filter(c => c.time > oldTime && c.time <= newTime);

            if (stepCandles.length === 0) continue;

            const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

            for (const tf of timeframes) {
                const tfMs = this.getTfDurationMs(tf);

                // Determine the start time (Anchor) of the current HTF candle
                // Note: For Daily (D1), UTC math is direct.
                const htfAnchor = Math.floor(newTime / tfMs) * tfMs;

                // Grab all M1 components that belong to this unclosed HTF candle
                const partialM1 = candles.filter(c => c.time >= htfAnchor && c.time <= newTime);

                if (partialM1.length > 0) {
                    const aggregated = {
                        time: htfAnchor,
                        open: partialM1[0].open,
                        high: Math.max(...partialM1.map(c => c.high)),
                        low: Math.min(...partialM1.map(c => c.low)),
                        close: partialM1[partialM1.length - 1].close,
                        tick_volume: partialM1.reduce((acc, c) => acc + c.volume, 0)
                    };

                    // 🛡️ BACKTEST ISOLATION: Emit to Sandbox Room, NOT Global 'EURUSD'
                    const backtestId = this.botId;
                    this.sendToHub('EV_BAR_UPDATE', {
                        symbol: sym, // Keep raw symbol, Orchestrator building room name
                        timeframe: tf,
                        candle: aggregated,
                        backtestId: backtestId
                    });
                }
            }
        }

        // Update Local State
        this.simulationTime = newTime;

        // Respond to RPC if requested
        if (requestId) {
            this.sendToHub('CMD_RESPONSE', {
                requestId,
                success: true,
                data: { newTime }
            });
        }

        // Notify Engine/Hub
        this.sendToHub('SYS_BACKTEST_STEP_OK', { backtestId: this.botId, newTime });
    }

    getTfDurationMs(tf) {
        const map = {
            'M1': 60000, 'M2': 120000, 'M3': 180000, 'M5': 300000,
            'M10': 600000, 'M15': 900000, 'M30': 1800000, 'H1': 3600000,
            'H2': 7200000, 'H3': 10800000, 'H4': 14400000, 'H6': 21600000,
            'H8': 28800000, 'H12': 43200000, 'D1': 86400000, 'W1': 604800000
        };
        return map[tf] || 60000;
    }

    /**
     * Intercepts standard History requests sent by charts, overriding real DB fetching 
     * to ensure absolute Future-Blindness and inclusion of the unclosed simulated candle.
     */
    handleFetchHistory(payload, requestId) {
        const { symbol, timeframe, limit } = payload;

        // 1. Fetch strictly clamped SQLite history
        // db.getHistory returns exactly what has fully closed up to the simulationTime bound (via our WHERE clause)
        const closedCandles = db.getHistory(symbol, timeframe, limit, this.simulationTime);

        // 2. Synthesize the currently open HTF candle using M1 data
        const tfMs = this.getTfDurationMs(timeframe);

        // Anchor calculation (start of current HTF)
        const htfAnchor = Math.floor(this.simulationTime / tfMs) * tfMs;
        let activeCandle = null;

        if (this.simulationTime > htfAnchor) {
            // There is an unclosed portion of this HTF candle
            // Fetch M1 strictly up to simulationTime
            const partialM1Raw = db.getHistory(symbol, 'M1', 5000, this.simulationTime);
            const partialM1 = partialM1Raw.filter(c => c.time >= htfAnchor && c.time <= this.simulationTime);

            if (partialM1.length > 0) {
                activeCandle = {
                    time: htfAnchor,
                    open: partialM1[0].open,
                    high: Math.max(...partialM1.map(c => c.high)),
                    low: Math.min(...partialM1.map(c => c.low)),
                    close: partialM1[partialM1.length - 1].close,
                    volume: partialM1.reduce((acc, c) => acc + c.volume, 0),
                    is_complete: 0
                };
            }
        }

        // 3. Append simulated live candle if it exists
        const finalizedCandles = [...closedCandles];
        if (activeCandle) {
            // Overwrite if DB returned an exact anchor match, or push as new
            if (finalizedCandles.length > 0 && finalizedCandles[finalizedCandles.length - 1].time === htfAnchor) {
                finalizedCandles[finalizedCandles.length - 1] = activeCandle;
            } else {
                finalizedCandles.push(activeCandle);
            }
        }

        // Respond to generic RPC from Orchestrator
        if (requestId) {
            this.sendToHub('CMD_RESPONSE', {
                requestId,
                success: true,
                data: finalizedCandles
            });
        }
    }

    /**
     * Emulates TICK_SPY's behavior on new subscription.
     * Calculates the currently forming candle for the given timeframe up to `simulationTime`,
     * and forces an immediate EV_BAR_UPDATE broadcast to unblock the chart.
     */
    handleSubscribeTicks(payload) {
        const { symbol, timeframe, backtestId } = payload;
        this.log(`[BacktestWorker] 📡 TICK_SPY Subscribe intercepted for ${symbol} ${timeframe} (SimTime: ${this.simulationTime})`);

        // Calculate forming candle up to simulationTime
        const tfMs = this.getTfDurationMs(timeframe);
        const htfAnchor = Math.floor(this.simulationTime / tfMs) * tfMs;

        if (this.simulationTime > htfAnchor) {
            const partialM1Raw = db.getHistory(symbol, 'M1', 5000, this.simulationTime);
            const partialM1 = partialM1Raw.filter(c => c.time >= htfAnchor && c.time <= this.simulationTime);

            if (partialM1.length > 0) {
                const activeCandle = {
                    time: htfAnchor,
                    open: partialM1[0].open,
                    high: Math.max(...partialM1.map(c => c.high)),
                    low: Math.min(...partialM1.map(c => c.low)),
                    close: partialM1[partialM1.length - 1].close,
                    volume: partialM1.reduce((acc, c) => acc + c.volume, 0),
                    is_complete: 0
                };

                // Immediately emit this forming candle to unblock UI chart initialization
                this.sendToHub('EV_BAR_UPDATE', {
                    botId: this.botId,
                    symbol: symbol,
                    timeframe: timeframe,
                    candle: activeCandle,
                    backtestId: this.botId.replace('SIM-', '')
                });
            }
        }
    }

    /**
     * Evaluates simulated trades directly against the locked simulation_time market snapshot.
     */
    handlePlaceOrder(payload) {
        const { masterId, magic, trade } = payload;

        this.log(`[BacktestWorker] 📝 Emulating Trade Execution for MasterID: ${masterId}`);

        // Fake Execution Delay
        setTimeout(() => {
            // 1. Send Order Acknowledgment (TRADE_UPDATE)
            this.sendToHub('TRADE_UPDATE', {
                botId: this.botId,
                symbol: trade.symbol,
                payload: {
                    id: masterId,
                    magic: magic,
                    state: 'PENDING',
                    time_setup: this.simulationTime
                }
            });

            // 2. Send Fill Execution (EXECUTION_UPDATE)
            // Emulate instant fill at requested entry or current price (use last known close)
            // Ideally we'd look up the current price, but for now we just fake it instantly
            this.sendToHub('EXECUTION_UPDATE', {
                botId: this.botId,
                symbol: trade.symbol,
                payload: {
                    tradeId: masterId,
                    magic: magic,
                    price: trade.entry || 1.0, // Fake price
                    volume: trade.volume || 0.01,
                    time: this.simulationTime,
                    type: trade.direction === 'BUY' ? 0 : 1
                }
            });

            // 3. Status Update to RUNNING
            this.sendToHub('TRADE_UPDATE', {
                botId: this.botId,
                symbol: trade.symbol,
                payload: {
                    id: masterId,
                    magic: magic,
                    state: 'RUNNING',
                    time_setup: this.simulationTime,
                    price_open: trade.entry || 1.0
                }
            });
        }, 100);
    }

    handleModifyOrder(payload) {
        this.log(`[BacktestWorker] 🔄 Emulating Trade Modification`);

        try {
            // Unpack command structure generated by TradeDistributionService
            const modCommand = payload.command ? payload.command.content : payload.content || payload;

            // Derive sessionId from the modification object (injected by UI)
            const sessionId = modCommand.backtestId || (this.botId.startsWith('SIM-') ? this.botId.replace('SIM-', '') : null);

            if (sessionId) {
                const paperEngine = require('../services/PaperTradeEngine');
                paperEngine.modifyTrade(sessionId, modCommand);
            } else {
                this.error(`[BacktestWorker] Cannot modify trade: No session ID found in payload.`);
            }
        } catch (e) {
            this.error(`[BacktestWorker] ModifyOrder Error: ${e.stack}`);
        }
    }
}

// Spawn the worker instance
new BacktestWorker();
