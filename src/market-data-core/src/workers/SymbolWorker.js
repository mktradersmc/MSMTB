const AbstractWorker = require('./AbstractWorker');
const db = require('../services/DatabaseService');
const path = require('path');
const { parentPort } = require('worker_threads');
const tzService = require('../services/TimezoneNormalizationService');

class SymbolWorker extends AbstractWorker {
    constructor() {
        super(); // Triggers Handshake

        this.db = null;
        this.syncState = new Map(); // TF -> STATUS
        this.requestQueue = {
            high: [],
            low: [],
            activeCount: 0,
            maxConcurrent: 1
        };
        this.pendingTasks = new Map(); // TF -> { resolve, reject, timer }
        this.STATUS = { IDLE: 'IDLE', READY: 'READY' };

        // Candle Builder State
        this.currentCandle = null;

        // Initialize DB immediately
        this.initDB();
    }

    initDB() {
        try {
            const dbDir = path.join(__dirname, '../../db/symbols');
            const dbPath = path.join(dbDir, `${this.symbol}.db`);

            const Database = require('better-sqlite3');
            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('busy_timeout = 5000');

            const tfs = ['M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1'];
            tfs.forEach(tf => {
                const tableName = `candles_${tf}`;
                this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (time INTEGER PRIMARY KEY, open REAL, high REAL, low REAL, close REAL, tick_volume INTEGER, spread INTEGER, volume REAL, is_complete INTEGER DEFAULT 1)`);
                this.syncState.set(tf, this.STATUS.READY);
            });
            this.log(`DB Connected: ${this.symbol}.db`);
        } catch (e) {
            this.error(`DB Init Failed: ${e.message}`);
        }
    }

    // --- OVERRIDES ---

    onBotConnected(info) {
        this.log(`[Lifecycle] Bot Connected: ${info.botId} (CID: ${info.connectionId}). Triggering Gap Check...`);
        this.checkForGaps();
    }

    onBotDisconnected() {
        this.log(`[Lifecycle] Bot Disconnected. Pausing Queue.`);
    }

    onCommand(msg) {
        if (msg.type === 'CMD_SYNCHRONIZE_DATA' || msg.type === 'CMD_SYNCHRONIZED_UPDATE' || msg.type === 'CMD_START_SYNCHRONIZED_UPDATE') {
            const payload = msg.content || msg;
            this.handleSynchronizedUpdate(payload);
        } else if (msg.type === 'SUBSCRIBE' || msg.type === 'CMD_SUBSCRIBE_TICKS') {
            const payload = msg.content || msg;
            this.subscribe(payload.timeframe);
        } else if (msg.type === 'UNSUBSCRIBE' || msg.type === 'CMD_UNSUBSCRIBE_TICKS') {
            const payload = msg.content || msg;
            this.unsubscribe(payload.timeframe);
        } else if (msg.type === 'EV_BAR_UPDATE') {
            // PROTOCOL V3: Forming Bar (Live)
            this.handleBarEvent(msg, false);
        } else if (msg.type === 'EV_BAR_CLOSED') {
            // PROTOCOL V3: Closed Bar (Persist)
            this.handleBarEvent(msg, true);
        }
    }

    /**
     * Unified Handler for EV_BAR_UPDATE and EV_BAR_CLOSED
     * @param {Object} msg Protocol Message
     * @param {Boolean} isComplete Force completion status based on event type
     */
    handleBarEvent(msg, isComplete) {
        let payload = msg.content || msg.payload || {};
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) {
                this.error(`Failed to parse Bar Event payload: ${payload}`);
                return;
            }
        }
        const { timeframe, candle } = payload;

        if (!timeframe || !candle) {
            console.log(`[SymbolWorker:${this.symbol}] ❌ No timeframe or candle in Bar Event payload: ${JSON.stringify(payload)}`);
            return; // Silent Guard
        }

        const { time, open, high, low, close, volume } = candle;

        let timeMS = time;
        if (timeMS < 10000000000) {
            const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMS);
            timeMS = timeSec * 1000;
        }

        const dbCandle = {
            time: timeMS,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
            tick_volume: parseInt(volume),
            is_complete: isComplete
        };

        // 1. DATA INTEGRITY FILTER
        if (timeMS < 946684800000) return; // Drop invalid

        // 2. GAP DETECTION (Only check on CLOSED bars or strictly sequential updates)
        // (Simplified for V3: Only check on Closed or if time jumped significantly)
        if (isComplete) {
            const lastCandle = this.getLastCandle(timeframe);
            if (lastCandle) {
                const tfMs = this.getPeriodMs(timeframe);
                if (timeMS > lastCandle.time + tfMs + 500) {
                    this.log(`[BarData] 🚨 GAP DETECTED for ${timeframe}. Triggering Sync.`);
                    const lastTimeSec = Math.floor(lastCandle.time / 1000);
                    this.handleSynchronizedUpdate({ timeframe, mode: 'GAP_FILL', lastTime: lastTimeSec, count: 5000 });
                    return; // Don't save gap data yet? Or save and fill? Usually fill first.
                }
            }
            // 3. PERSIST (Only Closed)
            this.saveCandle(timeframe, dbCandle);
            this.updateStatus(timeframe, this.STATUS.READY);
            if (this.features && this.features.ENABLE_BAR_DATA_LOGGING) {
                this.log(`[BarData] 💾 Saved COMPLETE ${timeframe} Bar: ${new Date(timeMS).toISOString()}`);
            }
        }

        // 4. BROADCAST (Both Live and Closed)
        // Map to internal event names for Hub if needed, or keep 1:1
        // User Requirement: "Wir haben doch umgestellt auf EV_BAR_CLOSED und EV_BAR_UPDATE"
        const type = isComplete ? 'EV_BAR_CLOSED' : 'EV_BAR_UPDATE';
        this.sendToHub(type, {
            symbol: this.symbol,
            timeframe: timeframe,
            candle: {
                ...dbCandle
            },
            botId: this.botId // Identity Added (Fixes Routing Identity Error)
        });
    }

    // Legacy Handlers Removed (handleBarData, handleLiveData merged)
    _ignore_handleBarData(msg) { /* ... */ }
    _ignore_handleLiveData(msg) { /* ... */ }

    handleSyncCompleteHandover(msg) {
        const { timeframe } = msg;
        this.log(`[Sync] 🏁 Received SYNC_COMPLETE_HANDOVER for ${timeframe} (No Data / Up-to-Date).`);

        // Resolve Sequential Queue
        if (this.pendingTasks.has(timeframe)) {
            const task = this.pendingTasks.get(timeframe);
            clearTimeout(task.timer);
            task.resolve(true); // Success (Empty is success)
            this.pendingTasks.delete(timeframe);
        }

        // Clear Retry Count
        if (this.retryCounts) this.retryCounts.delete(timeframe);

        // Trigger completion logic in processQueue via loop (or explicit check?)
        // processQueue will continue automatically.
    }

    handleHistorySnapshot(msg) {
        // SystemOrchestrator sends { type: ..., content: { candles, timeframe } }
        // We need to unwrap 'candles' as the content array.
        const payload = msg.content || {};
        const content = payload.candles; // The Array
        const timeframe = payload.timeframe;

        if (!content || !Array.isArray(content) || content.length === 0) {
            this.log(`[Sync:Trace] ⚠️ Received empty HISTORY_SNAPSHOT for ${timeframe}. Setting READY.`);
            this.updateStatus(timeframe, this.STATUS.READY); // FIX: Don't get stuck in SYNCING
            return;
        }

        // Resolve Sequential Queue
        if (this.pendingTasks.has(timeframe)) {
            const task = this.pendingTasks.get(timeframe);
            clearTimeout(task.timer);
            task.resolve(true); // Success
            this.pendingTasks.delete(timeframe);
        }

        // Success - Clear Retry Count
        if (this.retryCounts) this.retryCounts.delete(timeframe);

        this.log(`[Sync] 📥 Ingesting ${content.length} bars for ${timeframe}. First Bar Sample: ${JSON.stringify(content[0])}`);

        // 1. Save to DB
        let maxTime = 0;
        const dbCandles = content.map(c => {
            let timeMS = c.time;
            // FIX: Convert Broker Time (Seconds) to UTC (MS)
            // If < 10B, it's seconds. If > 10B, likely MS (but MQL5 usually sends seconds).
            // We TRUST tzService to handle the conversion from Broker Seconds -> UTC Seconds.
            // But we need to be careful if it's already MS.
            // TickSpy usually sends SECONDS.

            if (timeMS < 10000000000) {
                // It is seconds. Convert using Timezone Service.
                // We need the botId. existing logic uses this.botId.
                const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMS);
                timeMS = timeSec * 1000;
            }

            if (timeMS > maxTime) maxTime = timeMS;
            return {
                time: timeMS,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                tick_volume: c.volume // TickSpy sends 'volume' as tick_volume usually
            };
        });

        this.saveCandleBatch(timeframe, dbCandles);
        this.log(`[Sync] 💾 Persisted ${content.length} bars for ${timeframe} to DB.`);

        // 2. Emit Data Update (Fast UI Refresh)
        this.sendToHub('HISTORY_UPDATE', {
            symbol: this.symbol,
            timeframe: timeframe,
            candles: dbCandles, // Already Normalized
            botId: this.botId
        });

        // 3. Report Completion to Orchestrator (Handover)
        this.sendToHub('SYNC_COMPLETE_HANDOVER', {
            symbol: this.symbol,
            timeframe: timeframe,
            maxTime: maxTime
        });

        // 3. Update Status
        this.updateStatus(timeframe, this.STATUS.READY);
    }

    saveCandleBatch(tf, candles) {
        try {
            const tableName = `candles_${tf}`;
            const insert = this.db.prepare(`INSERT OR REPLACE INTO ${tableName} (time, open, high, low, close, tick_volume, is_complete) VALUES (@time, @open, @high, @low, @close, @tick_volume, 1)`);

            const insertMany = this.db.transaction((cats) => {
                for (const cat of cats) insert.run(cat);
            });

            insertMany(candles);
        } catch (e) {
            this.error(`DB Batch Save Error: ${e.message}`);
        }
    }

    handleInitialDataFailed(msg) {
        // Legacy: Wrapper for new logic
        this.handleSynchronizedUpdateFailed(msg);
    }

    handleSynchronizedUpdateFailed(msg) {
        const payload = msg.content || msg.payload || {};
        const { timeframe, error, mode } = payload;

        if (!timeframe) {
            this.error(`[Sync] ❌ Malformed SYNCHRONIZED_UPDATE_FAILED. Missing Timeframe. Payload: ${JSON.stringify(payload)}`);
            return;
        }

        this.log(`[Sync] ❌ Synchronized Update Failed for ${timeframe} (Mode: ${mode}, Error: ${error}). Checking retries...`);

        if (this.pendingTasks.has(timeframe)) {
            const task = this.pendingTasks.get(timeframe);
            clearTimeout(task.timer);
            task.resolve(false); // Finished but Failed (Queue can proceed, Retry logic handles schedule)
            this.pendingTasks.delete(timeframe);
        }

        if (!this.retryCounts) this.retryCounts = new Map();

        const key = timeframe;
        const currentRetries = this.retryCounts.get(key) || 0;

        if (currentRetries < 5) {
            const nextRetry = currentRetries + 1;
            this.retryCounts.set(key, nextRetry);
            this.log(`[Sync] 🔄 Retrying ${timeframe} (Attempt ${nextRetry}/5) in 2s...`);

            setTimeout(() => {
                // RE-QUEUE: Use the SAME command type that failed.
                // We construct a specific task for this.
                // Since enqueueRequest is generic, we might need a specific helper or just use valid args.
                // But enqueueRequest uses 'INITIAL' or 'GAP' which map to CMD_START_SYNCHRONIZED_UPDATE in executeTask.

                // Mode is 'INITIAL_FILL' or 'GAP_FILL'.
                // executeTask expects type 'INITIAL' or 'GAP'.
                const taskType = (mode === 'INITIAL_FILL') ? 'INITIAL' : 'GAP';

                // We pass 0 as lastTime for INITIAL, but for GAP we might need the original lastTime?
                // The original request is lost, but we can infer: 
                // GAP -> uses DB lastTime. INITIAL -> 0.
                // So calling enqueueRequest with 0 (if INITIAL) or DB time (if GAP) works.

                let lastTime = 0;
                if (taskType === 'GAP') {
                    // Fetch last time from DB to be safe
                    const lastCandle = this.getLastCandle(timeframe);
                    lastTime = lastCandle ? Math.floor(lastCandle.time / 1000) : 0;
                }

                this.enqueueRequest(timeframe, taskType, lastTime, 1, 1000);
            }, 1000);
        } else {
            this.log(`[Sync] 🛑 Max retries (5) reached for ${timeframe}. Giving up.`);
            this.retryCounts.delete(key);
            this.updateStatus(timeframe, this.STATUS.READY); // Release UI
        }
    }

    handleSynchronizedUpdate(payload) {
        const { timeframe, mode, lastTime, count } = payload;
        // this.log(`[Sync] 📥 Received ${mode} Request for ${timeframe}. Enqueuing...`);

        const type = (mode === 'INITIAL_FILL') ? 'INITIAL' : 'GAP';
        const priority = (type === 'INITIAL') ? 1 : 2;

        let timeMs = (lastTime || 0) * 1000;
        if (timeMs === 0 && type === 'GAP') {
            // Fallback to DB or let executeTask handle it
        }

        this.enqueueRequest(timeframe, type, timeMs, priority, count || 1000);
    }

    checkForGaps() {
        if (!this.db) return;
        // this.log("[GapCheck] 🔍 Starting Self-Diagnosis...");
        const NOW = Date.now();

        const tfs = ['M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1'];

        for (const [tf, status] of this.syncState) {
            try {
                const tableName = `candles_${tf}`;
                const last = this.db.prepare(`SELECT time FROM ${tableName} ORDER BY time DESC LIMIT 1`).get();

                if (!last) {
                    this.log(`[Sync] 📉 ${tf}: Missing Data. Requesting Initial Protocol.`);
                    this.enqueueRequest(tf, 'INITIAL', 0, 1, 1000);
                    // Removed SYNCING status update
                    continue;
                }

                let lastTimeMs = last.time;
                if (lastTimeMs < 10000000000) lastTimeMs *= 1000;
                const age = NOW - lastTimeMs;
                const threshold = this.getPeriodMs(tf) * 3;

                if (age > threshold) {
                    this.log(`[GapCheck:Trace] ${tf}: STALE (Age: ${age}ms > ${threshold}). Triggering Update.`);
                    this.enqueueRequest(tf, 'GAP', lastTimeMs, 2, 500);
                    // Removed SYNCING status update
                } else {
                    this.log(`[GapCheck:Trace] ${tf} OK. Age: ${age}ms < Threshold ${threshold}ms. Last: ${new Date(lastTimeMs).toISOString()}`);
                    this.updateStatus(tf, this.STATUS.READY);
                }

            } catch (e) {
                this.error(`[GapCheck] Error on ${tf}: ${e.message}`);
            }
        }
    }

    enqueueRequest(timeframe, type, lastTimeMs, priority, count = 1000) {
        const task = { timeframe, type, lastTimeMs, priority, count };
        if (priority < 10) this.requestQueue.high.push(task);
        else this.requestQueue.low.push(task);

        this.requestQueue.high.sort((a, b) => a.priority - b.priority);
        // this.log(`[Queue] ➕ Enqueued ${type} for ${timeframe}. Depth: High=${this.requestQueue.high.length}, Low=${this.requestQueue.low.length}`);

        this.processQueue();
    }

    processQueue() {
        if (!this.isConnected) return; // Wait for Bot
        if (this.requestQueue.activeCount >= this.requestQueue.maxConcurrent) return;

        let task = null;
        if (this.requestQueue.high.length > 0) task = this.requestQueue.high.shift();
        else if (this.requestQueue.low.length > 0) task = this.requestQueue.low.shift();

        if (!task) return;

        this.requestQueue.activeCount++;

        // STRICT SEQUENTIAL SYNC: Wait for Result (Data or Failure)
        this.executeTask(task)
            .then(() => {
                // Success/Handled
            })
            .catch(err => {
                this.error(`[Queue] ❌ Task Failed: ${err.message}`);
            })
            .finally(() => {
                this.requestQueue.activeCount--;
                this.processQueue(); // Process Next

                // Check Clean Completion
                const tf = task.timeframe;
                const hasPending = this.requestQueue.high.some(t => t.timeframe === tf) ||
                    this.requestQueue.low.some(t => t.timeframe === tf);

                // Retry Check: If we just finished a failed attempt that queued a retry,
                // the retry is technically "Pending" in the timer, not the queue yet.
                // But executeTask now BLOCKS until the retry logic decision is made.
                // If handleFailed(tf) resolves the task, it means "This attempt is done".
                // The retry timer will queue a NEW task later.
                // So momentarily, queue IS empty.
                // FIX: We need to know if a Retry is scheduled.

                const isRetrying = this.retryCounts && this.retryCounts.has(tf);

                if (!hasPending && !isRetrying) {
                    this.log(`[Queue] ✅ No pending tasks for ${tf}. Sending SYNC_COMPLETE.`);
                    this.sendToHub('SYNC_COMPLETE', {
                        symbol: this.symbol,
                        timeframe: tf,
                        timestamp: Date.now()
                    });
                }
            });
    }

    async executeTask(task) {
        const timeframe = task.timeframe;

        // 1. Construct Command
        let cmd = null;
        let lastTimeBroker = Math.floor(task.lastTimeMs / 1000);

        if (task.type === 'INITIAL' || lastTimeBroker <= 0 || isNaN(lastTimeBroker)) {
            this.log(`[Sync] 🆕 Requesting Initial Data (RPC): ${this.symbol} ${timeframe} (Count: 100 [Reduced from ${task.count}])`);
            cmd = {
                type: 'CMD_START_SYNCHRONIZED_UPDATE',
                symbol: this.symbol,
                timeframe,
                mode: 'INITIAL_FILL',
                count: 100, // Reduced to avoid Payload Timeout
                lastTime: 0
            };
        } else {
            let brokerSeconds = 0;
            if (lastTimeBroker !== 0) {
                brokerSeconds = tzService.convertUtcToBroker(this.botId || 'default', lastTimeBroker);
            }
            this.log(`[Sync] 📤 Smart Sync (RPC) for ${this.symbol} ${timeframe}. UTC MS: ${task.lastTimeMs} -> Broker Sec: ${brokerSeconds}`);
            cmd = {
                type: 'CMD_START_SYNCHRONIZED_UPDATE',
                symbol: this.symbol,
                timeframe: timeframe,
                mode: 'GAP_FILL',
                lastTime: brokerSeconds,
                count: 0
            };
        }

        // 2. Execute RPC
        try {
            const response = await this.sendRpc(cmd.type, cmd, 60000); // 60s Timeout

            // 3. Process Response (Standard Protocol v3)
            const payload = response.content || response; // content is preferred
            const data = Array.isArray(payload) ? payload : (payload.content || payload.data || []);

            // Validate
            if (!Array.isArray(data)) {
                this.warn(`[Sync] ⚠️ RPC Response for ${timeframe} is not an array. Status: ${payload.status}`);
            } else if (data.length === 0) {
                this.log(`[Sync] ⚠️ Received 0 bars for ${timeframe}. Up to date.`);
            } else {
                // Ingest Data (Merged Logic from handleHistorySnapshot)
                this.log(`[Sync] 📥 Ingesting ${data.length} bars from RPC for ${timeframe}.`);

                let maxTime = 0;
                const dbCandles = data.map(c => {
                    let timeMS = c.time;
                    // Note: NT8 already returns accurate UTC Milliseconds, unlike MT5 which returned Broker Seconds.
                    // We removed the broker->UTC conversion here since it corrupted NT8 timestamps.

                    if (timeMS < 10000000000) {
                        // Fallback ONLY for actual seconds (e.g. from an MT5 origin)
                        const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMS);
                        timeMS = timeSec * 1000;
                    }

                    if (timeMS > maxTime) maxTime = timeMS;
                    return {
                        time: timeMS,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        tick_volume: c.volume // TickSpy sends 'volume' as tick_volume
                    };
                });

                this.saveCandleBatch(timeframe, dbCandles);
                this.log(`[Sync] 💾 Persisted ${data.length} bars for ${timeframe}`);

                // Emit Update
                this.sendToHub('HISTORY_UPDATE', {
                    symbol: this.symbol,
                    timeframe: timeframe,
                    candles: dbCandles,
                    botId: this.botId
                });
            }

            // Success (Implicitly resolved if no error thrown)
            if (this.retryCounts) this.retryCounts.delete(timeframe);
            this.updateStatus(timeframe, this.STATUS.READY);

        } catch (e) {
            this.error(`[Sync] ❌ RPC Failed for ${timeframe}: ${e.message}`);
            // Logic detects failure via reject/throw -> processQueue catches -> triggers retry logic
            throw e;
        }
    }

    // --- MIGRATED SESSION METHODS ---

    async subscribe(timeframe) {
        this.log(`[Subscription] ➕ Subscribing to ${this.symbol} ${timeframe}`);

        try {
            this.log(`[Subscription] ⏳ Sending SUBSCRIBE_TICKS and fetching current forming bar for ${timeframe}...`);
            const response = await this.sendRpc('CMD_SUBSCRIBE_TICKS', {
                symbol: this.symbol,
                timeframe: timeframe
            }, 5000); // 5 sec timeout

            if (response && response.status === 'OK') {
                this.log(`[Subscription] ✅ Subscription successful for ${timeframe}`);

                // Check if candle is included in response
                if (response.candle) {
                    this.log(`[Subscription] ✅ Current forming bar received via SUBSCRIBE for ${timeframe}`);
                    this.handleBarEvent({
                        content: {
                            symbol: this.symbol,
                            timeframe: timeframe,
                            candle: response.candle
                        }
                    }, false);
                } else {
                    this.warn(`[Subscription] ⚠️ Subscription successful but no forming candle returned for ${timeframe}`);
                }
            } else {
                this.error(`⚠️ Failed to subscribe and get forming bar for ${timeframe}: ${response ? response.message : 'Unknown Error'}`);
            }
        } catch (e) {
            this.error(`⚠️ RPC Error subscribing to ${timeframe}: ${e.message}`);
        }
    }

    unsubscribe(timeframe) {
        this.log(`[Subscription] ➖ Unsubscribing from ${this.symbol} ${timeframe}`);
        this.sendCommand('CMD_UNSUBSCRIBE_TICKS', {
            symbol: this.symbol,
            timeframe: timeframe
        });
    }

    updateStatus(tf, status) {
        const current = this.syncState.get(tf);
        if (current !== status) {
            this.syncState.set(tf, status);
            this.sendToHub('SYNC_UPDATE', { symbol: this.symbol, timeframe: tf, status });
        }
    }

    getLastCandle(tf) {
        try {
            const tableName = `candles_${tf}`;
            return this.db.prepare(`SELECT * FROM ${tableName} ORDER BY time DESC LIMIT 1`).get();
        } catch (e) {
            return null;
        }
    }

    saveCandle(tf, candle) {
        if (!tf) return;
        try {
            let timeMS = candle.time;
            if (timeMS < 10000000000) timeMS *= 1000;
            // FIX: Use provided is_complete, default to 1 if not present (backward compatibility for legacy calls)
            // But for handleBarData calls, it will be explicit.
            const isComplete = (candle.is_complete !== undefined) ? (candle.is_complete ? 1 : 0) : 1;

            const stmt = this.db.prepare(`INSERT OR REPLACE INTO candles_${tf} (time, open, high, low, close, tick_volume, is_complete) VALUES (@time, @open, @high, @low, @close, @tick_volume, @is_complete)`);
            stmt.run({ ...candle, time: timeMS, is_complete: isComplete });
        } catch (e) {
            this.error(`DB Save Error: ${e.message}`);
        }
    }

    getPeriodMs(tf) {
        let ms = 60000;
        if (tf.startsWith('M') && tf !== 'MN1') ms = parseInt(tf.substring(1)) * 60000;
        else if (tf.startsWith('H')) ms = parseInt(tf.substring(1)) * 3600000;
        else if (tf === 'D1') ms = 86400000;
        else if (tf === 'W1') ms = 604800000;
        else if (tf === 'MN1') ms = 2592000000;

        // this.log(`[Trace] getPeriodMs(${tf}) = ${ms}`);
        return ms;
    }
}

// Global Error Handlers
process.on('uncaughtException', (err) => {
    const { parentPort } = require('worker_threads'); // Re-require to be safe
    if (parentPort) {
        parentPort.postMessage({ type: 'ERROR', msg: `[CRITICAL] Uncaught Exception: ${err.message}\n${err.stack}` });
    } else {
        console.error('[CRITICAL] Uncaught Exception:', err);
    }
    // Give time to flush log?
    setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
    if (parentPort) {
        parentPort.postMessage({ type: 'ERROR', msg: `[CRITICAL] Unhandled Rejection: ${reason}` });
    } else {
        console.error('[CRITICAL] Unhandled Rejection:', reason);
    }
});

new SymbolWorker();
