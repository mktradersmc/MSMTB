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
                this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (time INTEGER PRIMARY KEY, open REAL, high REAL, low REAL, close REAL, tick_volume INTEGER, spread INTEGER, volume REAL, is_complete INTEGER DEFAULT 1, _raw_binary BLOB)`);
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
            const subPayload = msg.content || msg;
            // console.log(`[!!! ALARM-FLOW-TICKSPY 6 !!!] [SymbolWorker:${this.botId}:${this.func}:${this.symbol}] hat Subscribe Command für RoutingKey='${subPayload.routingKey}' empfangen!`);
            this.subscribe((msg.content || msg).timeframe);
        } else if (msg.type === 'UNSUBSCRIBE' || msg.type === 'CMD_UNSUBSCRIBE_TICKS') {
            const payload = msg.content || msg;
            this.unsubscribe(payload.timeframe);
        } else if (msg.type === 'EV_BAR_UPDATE') {
            // PROTOCOL V3: Forming Bar (Live)
            this.handleBarEvent(msg, false);
        } else if (msg.type === 'EV_BAR_CLOSED') {
            // PROTOCOL V3: Closed Bar (Persist)
            this.handleBarEvent(msg, true);
        } else if (msg.type === 'EV_SYMBOL_ROLLOVER') {
            // ROLOVER EVENT: Secure DB Flush and Re-Sync
            this.handleSymbolRollover(msg.content || msg.payload || msg);
        }
    }

    /**
     * Nightly Rollover Flush Process
     * Triggered securely by C# Bridge when Volume confirmation flips to a new future contract 
     */
    async handleSymbolRollover(payload) {
        this.log(`[Rollover] 🚨 NATIVE ROLLOVER DETECTED: ${payload.old_contract} -> ${payload.new_contract}`);

        try {
            // 1. Physically drop historical tables for this symbol's timeframes
            this.log(`[Rollover] Wiping SQLite Historical Tables to prepare for MergeBackAdjusted Sync...`);

            // Need to drop all timeframe tables for this symbol
            const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candles_%'").all();

            if (tables.length > 0) {
                const dropMany = this.db.transaction((tbls) => {
                    for (const t of tbls) {
                        this.db.prepare(`DROP TABLE IF EXISTS ${t.name}`).run();
                    }
                });
                dropMany(tables);
                this.log(`[Rollover] 🗑️ Successfully dropped ${tables.length} tables.`);
            }

            // 2. Pause queue temporarily while we rebuild
            this.queue.pause();

            // 3. Re-init table schema for active timeframe(s) via subscribe/checkForGaps implicitly
            this.log(`[Rollover] ♻️ Re-initiating GAP_FILL Resync via Protocol...`);

            // This will securely request INITIAL_FILL using the newly bound active contract on the C# side
            this.checkForGaps();

            this.queue.resume();

        } catch (e) {
            this.error(`[Rollover] ❌ DB Flush failed during Rollover! ${e.message}`);
        }
    }

    /**
     * Unified Handler for EV_BAR_UPDATE and EV_BAR_CLOSED
     * @param {Object} msg Protocol Message
     * @param {Boolean} isComplete Force completion status based on event type
     */
    handleBarEvent(msg, isComplete) {
        // v3 Payload standard: timeframe is either in the base object, header, or payload
        let timeframe = msg.timeframe || (msg.header && msg.header.timeframe) || (msg.payload && msg.payload.timeframe) || (msg.content && msg.content.timeframe);
        let candle = null;
        
        // --- 1. MQL5 V3 Binary Protocol Support (IPC Buffer Rehydration) ---
        let rawBin = msg._rawBinary;
        if (rawBin && !Buffer.isBuffer(rawBin)) {
            // IPC often converts Buffers to { type: 'Buffer', data: [...] } or { "0": 123, "1": 45 ... } or Uint8Array
            if (rawBin.type === 'Buffer' && Array.isArray(rawBin.data)) {
                rawBin = Buffer.from(rawBin.data);
            } else if (rawBin instanceof Uint8Array || Array.isArray(rawBin)) {
                rawBin = Buffer.from(rawBin);
            } else if (typeof rawBin === 'object' && rawBin[0] !== undefined) {
                // Object representation {"0":152,"1":29...}
                rawBin = Buffer.from(Object.values(rawBin));
            }
        }

        if (rawBin && Buffer.isBuffer(rawBin) && rawBin.length >= 48) {
            const b = rawBin;
            // Parse 48-byte struct: time(long), open(double), high(double), low(double), close(double), volume(long)
            candle = {
                time: Number(b.readBigInt64LE(0)),
                open: b.readDoubleLE(8),
                high: b.readDoubleLE(16),
                low: b.readDoubleLE(24),
                close: b.readDoubleLE(32),
                volume: Number(b.readBigInt64LE(40)),
                _raw_binary: rawBin
            };
        } else {
            // --- 2. Fallback JSON Parsing (Legacy Bots or NT8) ---
            let payload = msg.content || msg.payload || {};
            if (typeof payload === 'string') {
                try { payload = JSON.parse(payload); } catch (e) {
                    this.error(`Failed to parse Bar Event payload: ${payload}`);
                    return;
                }
            }
            candle = payload.candle;
            if (!timeframe && payload.timeframe) timeframe = payload.timeframe;
        }

        if (!timeframe || !candle) {
            console.log(`[SymbolWorker:${this.symbol}] ❌ No timeframe or candle in Bar Event payload: ${JSON.stringify(msg)}`);
            return; // Silent Guard
        }

        const { time, open, high, low, close, volume } = candle;

        let brokerSec = time;
        if (brokerSec > 10000000000) brokerSec = Math.floor(brokerSec / 1000);

        const isHighTimeframe = timeframe.startsWith('D') || timeframe.startsWith('W') || timeframe.startsWith('MN');
        let timeMS;
        if (isHighTimeframe) {
            timeMS = brokerSec * 1000;
        } else {
            timeMS = tzService.convertBrokerToUtcMs(this.botId || 'default', brokerSec);
        }

        const dbCandle = {
            time: timeMS,
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
            tick_volume: parseInt(volume),
            is_complete: isComplete ? 1 : 0,
            _raw_binary: candle._raw_binary || null
        };

        if (timeMS < 946684800000) return; // Drop invalid

        if (isComplete) {
            const lastCandle = this.getLastCandle(timeframe); 
            if (lastCandle) {
                const tfMs = this.getPeriodMs(timeframe);
                if (timeMS > lastCandle.time + tfMs + 500) {
                    this.log(`[BarData] 🚨 GAP DETECTED for ${timeframe}. Triggering Sync.`);
                    const lastTimeSec = Math.floor(lastCandle.time / 1000);
                    this.handleSynchronizedUpdate({ timeframe, mode: 'GAP_FILL', lastTime: lastTimeSec, count: 5000 });
                    return; 
                }
            }
            this.updateStatus(timeframe, this.STATUS.READY);
            if (this.features && this.features.ENABLE_BAR_DATA_LOGGING) {
                this.log(`[BarData] 💾 Saved COMPLETE ${timeframe} Bar: ${new Date(timeMS).toISOString()}`);
            }
        }

        // 3. PERSIST ALWAYS
        this.saveCandle(timeframe, dbCandle);

        // 4. BROADCAST (Both Live and Closed)
        const type = isComplete ? 'EV_BAR_CLOSED' : 'EV_BAR_UPDATE';
        this.sendToHub(type, {
            symbol: this.symbol,
            timeframe: timeframe,
            candle: {
                ...dbCandle,
                is_complete: isComplete
            },
            botId: this.botId 
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
        const payload = msg.content || {};
        const timeframe = payload.timeframe || msg.timeframe;

        let dbCandles = [];
        const isHighTimeframe = timeframe.startsWith('D') || timeframe.startsWith('W') || timeframe.startsWith('MN');
        let maxTime = 0;

        // --- 1. MQL5 V3 Binary Protocol Support (Bulk) ---
        if (msg._rawBinary && Buffer.isBuffer(msg._rawBinary)) {
            const b = msg._rawBinary;
            const barCount = Math.floor(b.length / 48);
            
            if (barCount > 0) {
                // this.log(`[Sync] 📥 Ingesting ${barCount} bars from Binary Payload (${b.length} bytes) for ${timeframe}.`);
                for (let i = 0; i < barCount; i++) {
                    const offset = i * 48;
                    const c = {
                        time: Number(b.readBigInt64LE(offset)),
                        open: b.readDoubleLE(offset + 8),
                        high: b.readDoubleLE(offset + 16),
                        low: b.readDoubleLE(offset + 24),
                        close: b.readDoubleLE(offset + 32),
                        volume: Number(b.readBigInt64LE(offset + 40))
                    };
                    
                    let timeMS = c.time;
                    if (timeMS < 10000000000) {
                        if (isHighTimeframe) {
                            timeMS = timeMS * 1000;
                        } else {
                            timeMS = tzService.convertBrokerToUtc(this.botId || 'default', timeMS) * 1000;
                        }
                    }

                    if (timeMS > maxTime) maxTime = timeMS;
                    dbCandles.push({
                        time: timeMS,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        tick_volume: c.volume
                    });
                }
            }
        } else {
            // --- 2. Fallback JSON Parsing ---
            const content = payload.candles || payload.data || [];
            if (!content || !Array.isArray(content) || content.length === 0) {
                this.log(`[Sync:Trace] ⚠️ Received empty HISTORY_SNAPSHOT for ${timeframe}. Setting READY.`);
                this.updateStatus(timeframe, this.STATUS.READY); 
                return;
            }

            // this.log(`[Sync] 📥 Ingesting ${content.length} bars for ${timeframe}. First Bar Sample: ${JSON.stringify(content[0])}`);
            dbCandles = content.map(c => {
                let timeMS = c.time;
                if (timeMS < 10000000000) {
                    if (isHighTimeframe) {
                        timeMS = timeMS * 1000;
                    } else {
                        const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMS);
                        timeMS = timeSec * 1000;
                    }
                }
                if (timeMS > maxTime) maxTime = timeMS;
                return {
                    time: timeMS,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    tick_volume: c.volume 
                };
            });
        }

        if (dbCandles.length === 0) {
            this.log(`[Sync:Trace] ⚠️ Processed 0 valid bars for ${timeframe}. Setting READY.`);
            this.updateStatus(timeframe, this.STATUS.READY);
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

        this.saveCandleBatch(timeframe, dbCandles);
        this.log(`[Sync] 💾 Persisted ${dbCandles.length} bars for ${timeframe} to DB.`);

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
            const insert = this.db.prepare(`INSERT OR REPLACE INTO ${tableName} (time, open, high, low, close, tick_volume, is_complete, _raw_binary) VALUES (@time, @open, @high, @low, @close, @tick_volume, 1, @_raw_binary)`);

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
                // MUST filter by is_complete = 1 so we don't gap-anchor onto a forming live candle
                const last = this.db.prepare(`SELECT time FROM ${tableName} WHERE is_complete = 1 ORDER BY time DESC LIMIT 1`).get();

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
            let data = [];
            let rawBin = response._rawBinary;
            
            // --- IPC Buffer Rehydration ---
            if (rawBin && !Buffer.isBuffer(rawBin)) {
                if (rawBin.type === 'Buffer' && Array.isArray(rawBin.data)) {
                    rawBin = Buffer.from(rawBin.data);
                } else if (rawBin instanceof Uint8Array || Array.isArray(rawBin)) {
                    rawBin = Buffer.from(rawBin);
                } else if (typeof rawBin === 'object' && rawBin[0] !== undefined) {
                    rawBin = Buffer.from(Object.values(rawBin));
                }
            }

            if (rawBin && Buffer.isBuffer(rawBin)) {
                const b = rawBin;
                const barCount = Math.floor(b.length / 48);
                for (let i = 0; i < barCount; i++) {
                    const offset = i * 48;
                    const chunk = Buffer.alloc(48);
                    b.copy(chunk, 0, offset, offset + 48);
                    
                    data.push({
                        time: Number(b.readBigInt64LE(offset)),
                        open: b.readDoubleLE(offset + 8),
                        high: b.readDoubleLE(offset + 16),
                        low: b.readDoubleLE(offset + 24),
                        close: b.readDoubleLE(offset + 32),
                        volume: Number(b.readBigInt64LE(offset + 40)),
                        _raw_binary: chunk
                    });
                }
            } else {
                const payload = response.content || response; // content is preferred
                data = Array.isArray(payload) ? payload : (payload.content || payload.data || []);
            }

            // Validate
            if (!Array.isArray(data)) {
                this.warn(`[Sync] ⚠️ RPC Response for ${timeframe} is not an array. Status: ${payload.status}`);
            } else if (data.length === 0) {
                this.log(`[Sync] ⚠️ Received 0 bars for ${timeframe}. Up to date.`);
            } else {
                // Ingest Data (Merged Logic from handleHistorySnapshot)
                this.log(`[Sync] 📥 Ingesting ${data.length} bars from RPC for ${timeframe}.`);

                const isHighTimeframe = timeframe.startsWith('D') || timeframe.startsWith('W') || timeframe.startsWith('MN');

                let maxTime = 0;
                const dbCandles = data.map(c => {
                    let timeMS = c.time;
                    // Note: NT8 already returns accurate UTC Milliseconds, unlike MT5 which returned Broker Seconds.
                    // We removed the broker->UTC conversion here since it corrupted NT8 timestamps.

                    if (timeMS < 10000000000) {
                        if (isHighTimeframe) {
                            timeMS = timeMS * 1000;
                        } else {
                            // Fallback ONLY for actual seconds (e.g. from an MT5 origin)
                            const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMS);
                            timeMS = timeSec * 1000;
                        }
                    }

                    if (timeMS > maxTime) maxTime = timeMS;
                    return {
                        time: timeMS,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        tick_volume: c.volume, // TickSpy sends 'volume' as tick_volume
                        _raw_binary: c._raw_binary
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
            // Gap Checks rely on fully closed history. Ignore forming candles.
            return this.db.prepare(`SELECT * FROM ${tableName} WHERE is_complete = 1 ORDER BY time DESC LIMIT 1`).get();
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

            const stmt = this.db.prepare(`INSERT OR REPLACE INTO candles_${tf} (time, open, high, low, close, tick_volume, is_complete, _raw_binary) VALUES (@time, @open, @high, @low, @close, @tick_volume, @is_complete, @_raw_binary)`);
            stmt.run({ ...candle, time: timeMS, is_complete: isComplete, _raw_binary: candle._raw_binary || null });
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
