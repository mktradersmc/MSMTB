const AbstractWorker = require('./AbstractWorker');
const db = require('../services/DatabaseService');
const tzService = require('../services/TimezoneNormalizationService');

class HistoryWorker extends AbstractWorker {
    constructor() {
        super();
        // Configuration
        this.BATCH_SIZE = 1000;    // Bars per request
        this.MIN_TIMESTAMP = 946684800000; // 2000-01-01 00:00:00 UTC (Sanity Check)

        // Queue System
        this.requestQueue = {
            high: [],
            low: [],
            activeCount: 0,
            maxConcurrent: 1
        };
        this.activeSubscriptions = new Set();
        this.isSyncing = false;
        this.maxHistoryReached = new Set();
    }

    /**
     * Called when Bot connects. Resumes any pending syncs.
     */
    onBotConnected(info) {
        this.log(`[History] 🟢 Connected for ${this.symbol}. Starting history initialization.`);
        this.initializeQueue({});
    }

    /**
     * Handles specific commands routed to this worker.
     */
    onCommand(msg) {
        switch (msg.type) {
            case 'CMD_START_SYNC':
                this.initializeQueue(msg.content);
                break;
            case 'SUBSCRIBE':
            case 'CMD_SUBSCRIBE_TICKS': {
                const tf = msg.content ? msg.content.timeframe : msg.timeframe;
                if (tf) {
                    this.activeSubscriptions.add(tf);
                    this.prioritizeTimeframe(tf);
                }
                break;
            }
            case 'UNSUBSCRIBE':
            case 'CMD_UNSUBSCRIBE_TICKS': {
                const tf = msg.content ? msg.content.timeframe : msg.timeframe;
                if (tf) {
                    this.activeSubscriptions.delete(tf);
                    this.log(`[History] 📉 Removed ${tf} from active subscriptions.`);
                }
                break;
            }
            default:
                this.log(`[History] ⚠️ Unknown command: ${msg.type}`);
        }
    }

    /**
     * Entry point to start syncing a set of timeframes (or all).
     * @param {Object} content - { symbol, timeframes: [] }
     */
    initializeQueue(content) {
        const symbol = content.symbol || this.symbol;
        const timeframes = content.timeframes || ["M1", "M2", "M3", "M5", "M10", "M15", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1"];

        let added = 0;
        timeframes.forEach(tf => {
            // Check if max history reached
            if (this.maxHistoryReached.has(`${symbol}_${tf}`)) {
                // Skip this timeframe from initial background sync
                this.log(`[History] ⏭️ Maximum history already synced for ${symbol} ${tf}. Skipping.`);
                return;
            }

            // Avoid duplicates
            if (!this.requestQueue.low.find(t => t.symbol === symbol && t.timeframe === tf) &&
                !this.requestQueue.high.find(t => t.symbol === symbol && t.timeframe === tf)) {

                this.requestQueue.low.push({ symbol, timeframe: tf });
                added++;
            }
        });

        if (added > 0) {
            this.log(`[History] ➕ Added ${added} TFs to Low Priority Queue.`);
            this.processQueue();
        }
    }

    /**
     * Move timeframe to High Priority
     */
    prioritizeTimeframe(tf) {
        if (!tf) return;
        const symbol = this.symbol;

        // Ensure priority only if we have less than 20,000 candles
        const count = db.getCandleCount(symbol, tf);
        if (count >= 20000) {
            return; // Already enough data for priority
        }

        // Remove from low queue
        const lowIndex = this.requestQueue.low.findIndex(t => t.symbol === symbol && t.timeframe === tf);
        if (lowIndex !== -1) {
            this.requestQueue.low.splice(lowIndex, 1);
        }

        // Add to high if not already there
        if (!this.requestQueue.high.find(t => t.symbol === symbol && t.timeframe === tf)) {
            this.requestQueue.high.push({ symbol, timeframe: tf });
            this.log(`[History] 🚀 Promoted ${symbol} ${tf} to HIGH Priority Queue.`);
        }

        this.processQueue();
    }

    async processQueue() {
        if (!this.isConnected) return; // Wait for Bot connection
        if (this.requestQueue.activeCount >= this.requestQueue.maxConcurrent) return;

        let task = null;
        if (this.requestQueue.high.length > 0) task = this.requestQueue.high.shift();
        else if (this.requestQueue.low.length > 0) task = this.requestQueue.low.shift();

        if (!task) return;

        this.requestQueue.activeCount++;

        try {
            await this.executeTask(task);
        } catch (e) {
            this.error(`[History] ❌ Task Error for ${task.symbol} ${task.timeframe}: ${e.message}`);
            // Retry logic: wait 2 seconds then re-queue
            setTimeout(() => {
                this.log(`[History] 🔄 Re-queueing failed task ${task.timeframe} in 2s...`);
                this.requestQueue.low.push(task); // Requeue to low priority to avoid locking
                this.processQueue();
            }, 2000);
            this.requestQueue.activeCount--;
            return; // Exit early, queue will be processed by setTimeout
        }

        this.requestQueue.activeCount--;
        this.processQueue(); // Process next
    }

    getLimitBoundaryMs(tf) {
        const msPerYear = 31536000000;
        const now = Date.now();
        if (['M1', 'M2', 'M3', 'M5', 'M10', 'M14'].includes(tf)) {
            return now - (2 * msPerYear);
        } else if (['M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12'].includes(tf)) {
            return now - (4 * msPerYear);
        } else {
            return 0; // Max available (0 = epoch/no limit)
        }
    }

    async executeTask(task) {
        const { symbol, timeframe } = task;

        // 1. Check Max History Flag Early
        if (this.maxHistoryReached.has(`${symbol}_${timeframe}`)) return;

        const count = db.getCandleCount(symbol, timeframe);

        // 2. Determine Reference Point (Backwards Walking)
        let oldestTimestampMs = 0;

        if (count > 0) {
            oldestTimestampMs = db.getFirstTimestamp(symbol, timeframe);
            if (oldestTimestampMs <= 0) oldestTimestampMs = Date.now(); // Failsafe
        } else {
            // Start from right now if DB is empty
            oldestTimestampMs = Date.now();
            this.log(`[History] 🆕 No data exists for ${symbol} ${timeframe} yet. Initializing fetch from Date.now().`);
        }

        // Timezone Conversion: UTC (ms) -> Broker Time (Seconds API)
        const lastTimeBrokerSec = tzService.convertUtcToBroker(this.botId || 'default', Math.floor(oldestTimestampMs / 1000));
        const limitBoundaryMs = this.getLimitBoundaryMs(timeframe);
        if (limitBoundaryMs > 0 && oldestTimestampMs < limitBoundaryMs) {
            this.log(`[History] 🛑 Boundary Reached for ${symbol} ${timeframe}. Flagging max_history.`);
            this.maxHistoryReached.add(`${symbol}_${timeframe}`);
            return;
        }

        this.log(`[History] 📉 Fetching ${symbol} ${timeframe} (Depth: ${count}). From BrokerTime: ${lastTimeBrokerSec}`);

        // 3. Execute Synchronous RPC
        const cmd = {
            type: 'CMD_FETCH_HISTORY',
            symbol: symbol,
            timeframe: timeframe,
            from: lastTimeBrokerSec, // Maps to 'from' parameter in MQL5 CFetchHistory
            count: this.BATCH_SIZE
        };

        const response = await this.sendRpc(cmd.type, cmd, 60000);

        // Process Response
        const payload = response.content || response;
        const data = Array.isArray(payload) ? payload : (payload.content || payload.data || []);

        if (!Array.isArray(data) || data.length === 0) {
            this.log(`[History] 🛑 End of Data for ${symbol} ${timeframe}. Flagging max_history.`);
            this.maxHistoryReached.add(`${symbol}_${timeframe}`);
            return;
        }

        // --- PIPELINE: SANITIZE & NORMALIZE ---
        const cleanCandles = [];
        let minTime = Infinity;
        let maxTime = -Infinity;

        for (const raw of data) {
            let t = raw.t || raw.time;

            // Normalize to UTC MS
            let timeMs = t;
            if (timeMs < 10000000000) {
                const timeSec = tzService.convertBrokerToUtc(this.botId || 'default', timeMs);
                timeMs = timeSec * 1000;
            }

            if (timeMs < this.MIN_TIMESTAMP) continue; // Skip 1970 

            cleanCandles.push({
                time: timeMs,
                open: raw.o || raw.open,
                high: raw.h || raw.high,
                low: raw.l || raw.low,
                close: raw.c || raw.close,
                tick_volume: raw.v || raw.volume || raw.tick_volume,
                is_complete: 1
            });

            if (timeMs < minTime) minTime = timeMs;
            if (timeMs > maxTime) maxTime = timeMs;
        }

        // Infinite loop failsafe: If we made no progress backwards, we reached the end
        if (cleanCandles.length > 0 && oldestTimestampMs > 0 && minTime >= oldestTimestampMs) {
            this.log(`[History] 🏁 Reached maximum available broker history for ${symbol} ${timeframe} (minTime ${minTime} >= oldestTime ${oldestTimestampMs}). Proceeding to next timeframe.`);
            this.maxHistoryReached.add(`${symbol}_${timeframe}`);
            return;
        }

        // Persistence
        if (cleanCandles.length > 0) {
            const sdb = db.getSymbolDb(symbol);
            if (sdb) {
                try {
                    const tableName = `candles_${timeframe}`;
                    sdb.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (time INTEGER PRIMARY KEY, open REAL, high REAL, low REAL, close REAL, tick_volume INTEGER, spread INTEGER, volume REAL, is_complete INTEGER DEFAULT 1)`);

                    const insert = sdb.prepare(`INSERT OR REPLACE INTO ${tableName} (time, open, high, low, close, tick_volume, is_complete) VALUES (@time, @open, @high, @low, @close, @tick_volume, 1)`);
                    const insertMany = sdb.transaction((cats) => {
                        for (const cat of cats) insert.run(cat);
                    });
                    insertMany(cleanCandles);

                    const logFirst = new Date(minTime).toISOString();
                    const logLast = new Date(maxTime).toISOString();
                    this.log(`[History] 📊 BATCH SAVED - Symbol: ${symbol} | Timeframe: ${timeframe} | Count: ${cleanCandles.length} | Range: [${logFirst}] to [${logLast}]`);

                    // Notify Orchestrator
                    const totalCountNow = db.getCandleCount(symbol, timeframe);
                    this.sendToHub('HISTORY_UPDATE', {
                        symbol,
                        timeframe,
                        count: cleanCandles.length,
                        first: minTime,
                        last: maxTime,
                        // Only send the array if the frontend still needs it to fill the chart
                        candles: totalCountNow < 10000 ? cleanCandles : undefined,
                        botId: this.botId
                    });
                } catch (e) {
                    this.error(`[History] ❌ DB Insert Error: ${e.message}`);
                }
            } else {
                this.error(`[History] ❌ Could not get Symbol DB for ${symbol}`);
            }
        }

        // Loop Control (Re-queue back in Priority Queue if we have more to fetch)
        if (cleanCandles.length > 0 && minTime > limitBoundaryMs) {
            // Check if we hit early limits based on time array
            // If the query returned something, we expect to queue it again.
            const newCount = db.getCandleCount(symbol, timeframe);
            if (this.activeSubscriptions.has(timeframe) && newCount < 20000) {
                // User Requirement: Keep active timeframe in HIGH priority (round robin) up to 20,000 bars
                this.requestQueue.high.push(task);
            } else {
                this.requestQueue.low.push(task);
            }
        } else if (cleanCandles.length > 0 && minTime <= limitBoundaryMs) {
            this.log(`[History] 🛑 Post-Fetch Boundary Reached for ${symbol} ${timeframe}. Flagging max_history.`);
            db.setConfig(`max_history_${symbol}_${timeframe}`, true);
        } else {
            this.log(`[History] ⚠️ Batch contained only filtered (1970) data. Pausing fetch for this TF.`);
            // Don't flag max_history, just return and let the queue system re-evaluate it later or upon reconnect
            return;
        }
    }
}

new HistoryWorker();


