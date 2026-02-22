
const db = require('./DatabaseService');
const config = require('../config');
const logService = require('./LogService');

class SyncManager {
    constructor() {
        this.socketServer = null;
        this.pipeServer = null; // injected

        // State
        this.availableSymbols = []; // Deprecated: No longer loading global list
        this.configuredSymbols = db.getConfig('selected_symbols') || [];

        console.log(`[SyncManager] Loaded state: ${this.availableSymbols.length} available, ${this.configuredSymbols.length} configured.`);
        console.log("!!! SYNC MANAGER LOADED: VERSION CHECK 999 !!!");

        // --- TASK 0119: GLOBAL PROACTIVE PROVISIONING ---
        // Spawn Workers for ALL configured symbols immediately.
        setTimeout(() => this.provisionWorkers(), 1000); // 1s delay to ensure PipeServer is ready

        // FAILSAFE: Purge Stale Commands from previous sessions (Older than 1 min)
        // This prevents "Death Spiral" leftovers from flooding the pipe on startup.
        db.purgeStaleCommands(60000);

        // --- FEATURES / TOGGLES ---
        this.features = { ...config.DEFAULT_FEATURES, ...db.getConfig('features') };
        console.log("[SyncManager] 🎛️ Loaded Features:", JSON.stringify(this.features, null, 2));


        this.activeSubscriptions = new Map();
        this.botStatus = {};
        this.datafeedBots = new Set(db.getConfig('datafeed_bots') || []);
        this.tradingBots = new Set(db.getConfig('trading_bots') || []);
        this.activeFocus = null;
        this.syncStatus = new Map();
        this.syncLockState = new Map(); // STRICT CONSISTENCY LOCK
        this.hotCandles = new Map();

        // ✅ PERFORMANCE FIX: Map-based Symbol Lookup (O(1) instead of O(n))
        // Eliminates 100,000+ array comparisons/second during tick processing
        this.symbolToBotMap = new Map();      // symbol -> botId
        this.symbolToConfigMap = new Map();   // symbol -> config object
        this.botToSymbolsMap = new Map();     // botId -> Set of symbols
        this.brokerSymbolToConfigMap = new Map(); // BrokerSymbol -> ConfigObject (Reverse)
        this.rebuildSymbolMaps();

        // Time Tracking (Data-Driven)
        this.lastKnownServerTime = 0;

        // Queues (Separate for strict prioritization)
        this.priorityQueue = []; // For Active/Fast tasks
        this.deepQueue = [];     // For Background/Deep tasks
        this.isSyncing = false;

        // Startup
        this.pendingRequests = new Map();

        // SYNC ASSET MAPPINGS FROM CONFIG
        const assetMappingService = require('./AssetMappingService');

        // IMMEDIATE: Try to restore symbols from Broker Cache to avoid waiting for Bots
        // We do this in a short timeout to ensure DB and Services are ready
        setTimeout(() => {
            if (this.features.ENABLE_STARTUP_RESTORATION) {
                this.tryRestoreSymbolsFromCache(assetMappingService);
            } else {
                console.log("[Sync] ⏭️ Skipping Startup Restoration (Feature DISABLED)");
            }
        }, 500);

        setTimeout(() => {
            // Ensure Asset Mapping table is populated from existing config
            if (this.configuredSymbols.length > 0) {
                console.log("[SyncManager] Synchronizing Asset Mappings with Config...");
                assetMappingService.syncWithConfig(this.configuredSymbols);
            }
            this.triggerStartupSync();
        }, 5000);

        // OPTIMIZATION: Scheduled Bulk Sync (Replces Aggressive Polling)
        if (this.features.ENABLE_CONSISTENCY_SCHEDULER) {
            this.setupOptimizedScheduler();
        } else {
            console.log("[Sync] ⏭️ Skipping Scheduler Setup (Feature DISABLED)");
        }

        // Sanity Check Service
        const sanityService = require('./SanityCheckService');
        sanityService.setSyncManager(this);

        // IMMEDIATE SANITY CHECK AT STARTUP
        // Delay slightly to ensure Bots are registered/Heartbeating
        setTimeout(() => {
            if (this.features.ENABLE_STARTUP_SANITY_CHECK) {
                console.log("[Sync] 🚀 Triggering STARTUP Sanity Check...");
                // Iterate all Known Bots (Datafeed & Trading)
                const allBots = new Set([...this.datafeedBots, ...this.tradingBots]);
                allBots.forEach(botId => {
                    sanityService.runSanityCheck(botId).catch(console.error);
                });
            } else {
                console.log("[Sync] ⏭️ Skipping Startup Sanity Check (Feature DISABLED)");
            }
        }, 10000); // 10s after boot
    }

    setPipeServer(server) {
        this.pipeServer = server;
    }

    tryRestoreSymbolsFromCache(assetMappingService) {
        if (!assetMappingService) return;

        console.log("[Sync] 💾 Attempting to restore symbols from Broker Cache...");
        const allBots = new Set([...this.datafeedBots, ...this.tradingBots]);
        let totalRestored = 0;

        allBots.forEach(botId => {
            const cachedSymbols = assetMappingService.getBrokerSymbols(botId);
            if (cachedSymbols && cachedSymbols.length > 0) {
                console.log(`[Sync] 📥 Restored ${cachedSymbols.length} symbols for ${botId} from DB.`);
                // PASS TRUE to skip redundant persistence
                this.setAvailableSymbols(cachedSymbols, botId, true);
                totalRestored += cachedSymbols.length;
            }
        });

        if (totalRestored > 0) {
            console.log(`[Sync] ✅ Cache Restoration Complete. Total: ${totalRestored} symbols.`);
        } else {
            console.log("[Sync] ℹ️ Cache Restoration: No symbols found in DB.");
        }
    }

    // --- FEATURE MANAGEMENT ---
    getFeatures() {
        return this.features;
    }

    updateFeatures(newFeatures) {
        this.features = { ...this.features, ...newFeatures };
        db.setConfig('features', this.features);
        console.log("[Sync] 🎛️ Features Updated:", this.features);
        return this.features;
    }

    setupOptimizedScheduler() {
        // Run every minute at Seconds=02
        const now = new Date();
        const delay = (62 - now.getSeconds()) % 60;

        console.log(`[Sync] ⏳ Optimization Scheduler starting in ${delay} seconds (at :02)`);

        setTimeout(() => {
            // PUSH PROTOCOL: Polling Loop DISABLED
            // this.triggerBulkSync();
            // Interval thereafter
            // setInterval(() => this.triggerBulkSync(), 60000);
            console.log("[Sync] ℹ️ Bulk Sync Polling DISABLED (Push Protocol Active)");
        }, delay * 1000);

        // Schedule Consistency Checks
        this.setupConsistencyScheduler();
    }

    setupConsistencyScheduler() {
        console.log("[Sync] 🛡️ Starting Consistency Scheduler (Hourly & Minutely)");

        // HOURLY: Check Full History Integrity + Complete Flags
        setInterval(() => {
            this.runConsistencyCheck('HOURLY');
        }, 60 * 60 * 1000);

        // MINUTELY + 2s: Check Recent Integrity
        // We stagger this to :02 seconds to allow normal rollovers to finish
        const now = new Date();
        const delay = (62 - now.getSeconds()) % 60;
        setTimeout(() => {
            this.runConsistencyCheck('RECENT');
            setInterval(() => this.runConsistencyCheck('RECENT'), 60000);
        }, delay * 1000);
    }

    async runConsistencyCheck(mode) {
        if (!this.configuredSymbols || this.configuredSymbols.length === 0) return;

        console.log(`[Sync] 🛡️ Running Consistency Check: ${mode}`);

        // USE DATA-DRIVEN TIME
        const serverNow = this.getServerTime();
        const start = Date.now();
        console.log(`[PROCESS] START Consistency Check: ${mode} (Server Time: ${new Date(serverNow).toISOString()})`);
        const nowSec = Math.floor(serverNow / 1000);

        // --- PRIORITY MODE: SKIP RECENT CHECK IF BUSY WITH LIVE CHART ---
        if (mode === 'RECENT' && this.activeFocus) {
            console.log(`[Sync] ⏭️ Skipping RECENT check (Focus Active: ${this.activeFocus.symbol}).`);
            return;
        }

        // ✅ PERFORMANCE FIX: Process in smaller batches with more frequent yields
        let checksPerformed = 0;
        const YIELD_EVERY = 5; // Yield every 5 checks instead of every symbol

        for (const item of this.configuredSymbols) {
            const sym = item.symbol || item.name || item;

            // Check critical timeframes
            const timeframes = (mode === 'HOURLY') ? config.DEFAULT_TIMEFRAMES : ['M1', 'M5'];

            for (const tf of timeframes) {
                // 1. Check for Missing incomplete candles (gaps)
                const lastTime = db.getLastTimestamp(sym, tf);
                const period = this.getSeconds(tf);

                // Expected 'previous' candle time
                // (Current Candle is still open, so we check the one before it)
                const currentBarTime = nowSec - (nowSec % period);
                const prevBarTime = currentBarTime - period;

                if (lastTime > 0 && lastTime < prevBarTime) {
                    console.warn(`[Sync] ⚠️ Consistency Fail: ${sym} ${tf} Last stored: ${lastTime}. Expected completed: ${prevBarTime}. GAP Detected.`);
                    // Trigger Backfill
                    this.enqueueRequest(sym, tf, 'FAST', 0, 10);
                }

                // 2. Check for "Incomplete" candles in DB that should be complete (Self-Healing)
                // We check for any candle older than 'prevBarTime' that is still is_complete=0.
                if (mode === 'HOURLY' || mode === 'RECENT') {
                    try {
                        const safeCutoff = prevBarTime - period;
                        const nastyCandles = db.getIncompletePastCandles(sym, tf, safeCutoff);

                        if (nastyCandles && nastyCandles.length > 0) {
                            console.warn(`[Sync] 🛠️ Found ${nastyCandles.length} incomplete past candles for ${sym} ${tf} in ${mode} check. Triggering REPAIR.`);
                            const minTime = Math.min(...nastyCandles.map(c => c.time));
                            this.enqueueRequest(sym, tf, 'REPAIR', minTime, 8);
                        }
                    } catch (e) {
                        console.error("[Sync] Consistency check error (Incomplete Query)", e);
                    }
                }

                // ✅ TRAFFIC CONTROL: Yield more frequently (every 5 checks instead of every check)
                checksPerformed++;
                if (checksPerformed % YIELD_EVERY === 0) {
                    await new Promise(resolve => setImmediate(resolve));
                }
            }
        }
        console.log(`[PROCESS] END Consistency Check: ${mode} (Duration: ${Date.now() - start}ms, Checks: ${checksPerformed})`);
    }

    executeSyncTask(task) {
        const reqKey = `${task.symbol}_${task.timeframe}`;

        // --- REQUEST DEDUPLICATION ---
        if (this.inflightPromises && this.inflightPromises.has(reqKey)) {
            console.log(`[Sync] ♻️ Reusing Inflight Request for ${reqKey}`);
            return this.inflightPromises.get(reqKey);
        }

        // Resolve Bot FIRST (moved up for Timeout context)
        let targetBot = this.resolveBotId(task.symbol);

        const prom = new Promise((resolve) => {
            const count = task.count || 100; // Use task count or default to 100

            this.updateSyncStatus(task.symbol, task.timeframe, 'SYNCING', task.type);

            // Store resolver
            this.pendingRequests.set(reqKey, resolve);

            // Safety Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(reqKey)) {
                    // Check if Bot is actually online before screaming CRITICAL
                    const isOnline = targetBot ? this.isBotOnline(targetBot) : false;

                    if (isOnline) {
                        console.error(`[Sync] CRITICAL TIMEOUT(10s) waiting for ${reqKey} (Anchor=${task.anchorTime}). Bot=${targetBot} (Online). Unblocking...`);
                    } else {
                        // User requested reduced noise for offline bots
                        // Only log strict warning if we haven't spammed it recently? 
                        // For now, just a standard log, not error.
                        // console.log(`[Sync] ⚠️ Timeout for ${reqKey}: Bot ${targetBot || 'Unknown'} is OFFLINE. Unblocking (Silent).`);
                    }

                    this.updateSyncStatus(task.symbol, task.timeframe, 'READY');
                    const resolver = this.pendingRequests.get(reqKey);
                    if (resolver) resolver(false);
                    this.pendingRequests.delete(reqKey);
                    if (this.inflightPromises) this.inflightPromises.delete(reqKey);
                }
            }, 10000);

            if (!targetBot) {
                console.warn(`[Sync] ⚠️ Datafeed Bot not identified for ${task.symbol}. Cannot fetch history.`);
                // We still let the timeout cleanup happen or resolve immediately? 
                // Original code resolved immediately.
                if (this.pendingRequests.has(reqKey)) {
                    this.pendingRequests.delete(reqKey);
                    this.updateSyncStatus(task.symbol, task.timeframe, 'READY');
                }
                resolve(false);
                return;
            }

            const tzService = require('./TimezoneNormalizationService');

            // Translate Original Symbol to Broker Symbol
            // Use Centralized Helper (O(1) cached)
            // TRUST INTERNAL SYMBOL
            let mappedSymbol = task.symbol;

            // if (mappedSymbol !== task.symbol) { ... } // Removed logging

            // --- ARCHITECTURAL CLEANUP (TASK 0124) ---
            // DEPRECATED: STRICT SYNC LOCK & DELTA REQUESTS (Removed)
            // DEPRECATED: CMD_FETCH_HISTORY (Removed - History is Always-On via TickSpy)

            // --- HANDLING SUBSCRIBE (WORKER DELEGATION) ---
            if (task.type === 'SUBSCRIBE_TICKS') {
                console.log(`[Sync] 🔗 Linking Frontend to Worker Live Stream for ${mappedSymbol}:${task.timeframe} (Bot: ${targetBot})`);

                if (this.pipeServer && this.pipeServer.ensureSymbolSpyPipe) {
                    // 1. Ensure Worker Exists
                    this.pipeServer.ensureSymbolSpyPipe(mappedSymbol, task.timeframe, targetBot);

                    // 2. Send CONTROL Packet (START LIVE)
                    setTimeout(() => {
                        this.pipeServer.sendToWorker(mappedSymbol, {
                            type: 'SUBSCRIBE',
                            timeframe: task.timeframe
                        });
                    }, 100);
                }

                // Resolve immediately (No Lock)
                if (this.pendingRequests.has(reqKey)) {
                    this.pendingRequests.delete(reqKey);
                    this.updateSyncStatus(task.symbol, task.timeframe, 'READY');
                }
                resolve(true);
                return;
            }

            // --- HANDLING OTHER TASKS (FETCH, FAST, DEEP, REPAIR) ---
            // RESTORED (Task 0152): We MUST support on-demand backfill for Timeframes the Worker doesn't track (e.g. H4).
            // Route to Master Bot via PipeServer.

            const command = {
                symbol: mappedSymbol,
                timeframe: task.timeframe,
                from: task.anchorTime ? Math.floor(task.anchorTime / 1000) : 0, // MQL5 expects Seconds
                limit: task.count || 1000
            };

            console.log(`[Sync] 📤 Sending CMD_GET_HISTORY for ${command.symbol} ${command.timeframe} From=${new Date(command.from * 1000).toISOString()}`);

            // Use existing helper to send to Bot
            this.sendCommandToBot(command.symbol, 'CMD_GET_HISTORY', command, targetBot);

            // We do NOT resolve immediately. We wait for data to arrive via ingestHistory.
            // Pending Request will be resolved by ingestHistory or Timeout.
            return;
        });

        // Store inflight promise
        if (!this.inflightPromises) this.inflightPromises = new Map();
        this.inflightPromises.set(reqKey, prom);

        return prom;
    }

    handleHeartbeat(botId, content) {
        if (!this.botStatus[botId]) this.botStatus[botId] = {};
        this.botStatus[botId].lastHeartbeat = Date.now();
        this.botStatus[botId].lastSeen = Date.now(); // Alias for Frontend consistency

        // Lightweight Heartbeat - optional info update
        if (content && content.alive) {
            this.botStatus[botId].alive = true;
        }

        // Emit Status Update to Frontend
        if (this.socketServer) {
            this.socketServer.emit('bot_status', this.botStatus);
        }

        // Trigger Sanity Check (Throttle 5 min)
        if (this.features.ENABLE_PERIODIC_SANITY_CHECK) {
            const sanityService = require('./SanityCheckService');
            const lastCheck = sanityService.lastChecks.get(botId) || 0;
            if (Date.now() - lastCheck > 300000) {
                sanityService.lastChecks.set(botId, Date.now());
                sanityService.runSanityCheck(botId).catch(e => console.error("[Sync] Sanity Error", e));
            }
        }

        // Handle Discovery/Registration Logic
        const fullId = botId;
        if (fullId.includes('_DATAFEED')) {
            if (!this.datafeedBots.has(fullId)) {
                this.handleBotRegister(fullId);
            }
        } else {
            if (!this.tradingBots.has(fullId)) {
                this.handleBotRegister(fullId);
            }
        }

        // Emit Status Update to Frontend
        if (this.socketServer) {
            this.socketServer.emit('bot_status', this.botStatus);
        }
    }

    handleStatusUpdate(botId, content) {
        // console.log(`[Sync] RX StatusUpdate from ${ botId } `, JSON.stringify(content));
        if (!this.botStatus[botId]) this.botStatus[botId] = {};
        this.botStatus[botId].lastSeen = Date.now();

        // Merge Account & Expert Info
        if (content.account) this.botStatus[botId].account = content.account;
        if (content.expert) this.botStatus[botId].expert = content.expert;

        // Emit Status Update to Frontend
        if (this.socketServer) {
            this.socketServer.emit('bot_status', this.botStatus);
        }
    }

    ingestHistory(data, botId) {
        // console.time('IngestHistory');
        const { symbol, timeframe, candles } = data;

        if (!candles || candles.length === 0) {
            // console.timeEnd('IngestHistory');
            return;
        }

        // TRUST INTERNAL SYMBOL (Propagated from TickSpy)
        const internalSymbol = symbol;

        // 2. Timezone & Format Conversion
        const tzService = require('./TimezoneNormalizationService');
        const converted = candles.map(c => {
            let t = Number(c.time);
            // Auto-detect Seconds vs MS (MQL5 sends Seconds)
            if (t < 10000000000) {
                t = tzService.convertBrokerToUtcMs(botId, t);
            }

            return {
                symbol: internalSymbol,
                timeframe: timeframe,
                time: t,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume,
                is_complete: 1 // History is authoritative
            };
        });

        // 3. Database Insertion
        try {
            db.insertCandles(converted);
        } catch (e) {
            console.error(`[Sync] DB Insert Fail (${internalSymbol} ${timeframe}):`, e);
        }

        // 4. Update Server Time (Data-Driven)
        if (converted.length > 0) {
            const lastCandle = converted[converted.length - 1];
            this.updateServerTime(lastCandle.time);
        }

        // 5. Resolve Pending Requests
        // The key used in executeSyncTask is `${symbol}_${timeframe}`
        // But wait, executeSyncTask uses the REQUESTED symbol (which might be internal).
        // Since we mapped 'symbol' (broker) to 'internalSymbol', we should use 'internalSymbol' for the key.
        const reqKey = `${internalSymbol}_${timeframe}`;

        if (this.pendingRequests.has(reqKey)) {
            const resolve = this.pendingRequests.get(reqKey);
            resolve(true);
            this.pendingRequests.delete(reqKey);
            // console.log(`[Sync] ✅ Resolved Pending Request: ${reqKey}`);
        }

        if (this.inflightPromises && this.inflightPromises.has(reqKey)) {
            this.inflightPromises.delete(reqKey);
        }

        this.updateSyncStatus(internalSymbol, timeframe, 'READY');

        // Emit update to frontend if needed (usually history loads don't emit per-candle, but 'history_loaded' event might be useful?)
        // For now, adhering to previous behavior (minimal emission for history to allow bulk load).

        // console.timeEnd('IngestHistory');
    }

    isBotOnline(botId) {
        if (!botId) return false;
        const status = this.botStatus[botId];
        if (!status || !status.lastHeartbeat) return false;
        // 60 seconds timeout
        return (Date.now() - status.lastHeartbeat) < 60000;
    }

    handleBotRegister(botId) {
        console.log(`[Sync] 🆕 Bot Registered: ${botId}. Triggering immediate Sanity Check & Handshake.`);

        // PUSH PROTOCOL HANDSHAKE
        this.sendConfigHandshake(botId);

        // Ensure Bot is known
        const fullId = botId;
        if (fullId.includes('_DATAFEED')) {
            if (!this.datafeedBots.has(fullId)) {
                this.datafeedBots.add(fullId);
                db.setConfig('datafeed_bots', Array.from(this.datafeedBots));
            }
        } else {
            if (!this.tradingBots.has(fullId)) {
                this.tradingBots.add(fullId);
                db.setConfig('trading_bots', Array.from(this.tradingBots));
            }
        }

        // Emit Status Update to Frontend
        if (this.socketServer) {
            this.socketServer.emit('bot_status', this.botStatus);
        }

        // Force Run Sanity Check (Bypass throttle)
        if (this.features.ENABLE_REGISTRATION_SANITY_CHECK) {
            const sanityService = require('./SanityCheckService');
            // Reset last check time to 0 to ensure future thottles work correctly, or just run it.
            // DELAYED: Run Sanity Check after 30s to allow UI to load first (Priority 1 vs 8) (Startup Storm Prevention)
            setTimeout(() => {
                sanityService.lastChecks.set(botId, Date.now());
                sanityService.runSanityCheck(botId).catch(e => console.error("[Sync] Registration Sanity Error", e));
            }, 30000);
        } else {
            console.log(`[Sync] ⏭️ Skipping Registration Sanity Check for ${botId} (Feature DISABLED)`);
        }

        // Reconnect Logic
        this.resendSubscriptions(botId);

        // TRIGGER GAP FILL (Poll on Connect)
        this.triggerGapFillForBot(botId);

        // SYMBOL DISCOVERY (Fix for Empty List)
        // Check if we have symbols for this bot. If not, request them.
        setTimeout(() => {
            if (!this.botSymbolsMap || !this.botSymbolsMap.has(botId) || this.botSymbolsMap.get(botId).length === 0) {
                console.log(`[Sync] 📢 Registration: Triggering Symbol Discovery for ${botId}`);
                this.requestSymbolsForBot(botId);
            }
        }, 1000); // 1s delay to ensure pipe is ready

        const now = Date.now();
        // (Simplified logic from original handleHeartbeat to avoid duplicates)
    }

    getHotCandle(symbol, timeframe) {
        const s = symbol ? symbol.trim() : "";
        const tf = timeframe ? timeframe.trim() : "";
        return this.hotCandles.get(`${s}_${tf}`);
    }

    resetHotCandles(symbol = null) {
        if (symbol) {
            const s = symbol.trim();
            for (const key of this.hotCandles.keys()) {
                if (key.startsWith(s + '_')) this.hotCandles.delete(key);
            }
        } else {
            this.hotCandles.clear();
        }
    }

    getStatusSnapshot(symbol) {
        return Object.fromEntries(this.syncStatus.get(symbol) || new Map());
    }

    // --- TASK 0119: PROACTIVE PROVISIONING ---
    provisionWorkers() {
        if (!this.pipeServer) {
            console.warn("[Sync] ⚠️ PipeServer not ready for Proactive Provisioning. Retrying in 1s...");
            setTimeout(() => this.provisionWorkers(), 1000);
            return;
        }

        console.log(`[Sync] 🚀 STARTING GLOBAL PROVISIONING for ${this.configuredSymbols.length} symbols...`);

        let delay = 0;
        const STAGGER_MS = 50; // 50ms stagger = 20 workers/sec

        // Task 0156: Global Shadow Deduplication
        // (Enrichment now handled globally in rebuildSymbolMaps/constructor)

        // Step 1: Identify "Shadow" Broker Symbols
        // Identify all Broker Symbols (NDX100) that are already mapped to Internal Symbols (US100).
        // If US100 uses NDX100, we must NOT spawn a separate worker for NDX100.
        const usedDatafeedSymbols = new Set();
        this.configuredSymbols.forEach(c => {
            if (c.datafeedSymbol && c.symbol !== c.datafeedSymbol) {
                usedDatafeedSymbols.add(c.datafeedSymbol);
            }
        });

        const activeWorkers = this.configuredSymbols.filter(c => !usedDatafeedSymbols.has(c.symbol));
        console.log(`[Sync] 🛡️ Shadow Filter: Excluded ${this.configuredSymbols.length - activeWorkers.length} duplicates from provisioning.`);

        activeWorkers.forEach(config => {
            const symbol = config.symbol || config.name;
            const botId = config.botId || this.resolveBotId(symbol);

            // Resolve Datafeed Bot if trading bot is specified? 
            // Usually we want the Datafeed Source.
            // If botId is null, we can't spawn correctly?
            // Actually PipeServer handles null botId by just using the symbol pipe, 
            // BUT worker needs botId for timezone?
            // We'll trust resolveBotId or config.

            // Stagger spawning
            setTimeout(() => {
                // Determine 'targetBotId' for the worker (used for valid timezone/broker context)
                // If we don't know it yet (startup), we might default to 'DefaultBot' or wait?
                // But we MUST spawn. 
                // Let's pass what we have.
                const safeBotId = botId || 'UnknownBot';

                this.pipeServer.spawnSymbolWorker(symbol, safeBotId);
            }, delay);

            delay += STAGGER_MS;
        });

        console.log(`[Sync] ✅ Scheduled provisioning for ${this.configuredSymbols.length} workers (Duration: ${(delay / 1000).toFixed(1)}s).`);
    }

    getSeconds(tf) {
        const map = { 'M1': 60, 'M2': 120, 'M3': 180, 'M5': 300, 'M10': 600, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H2': 7200, 'H4': 14400, 'H6': 21600, 'H8': 28800, 'H12': 43200, 'D1': 86400, 'W1': 604800, 'MN1': 2592000 };
        return map[tf] || 60;
    }

    // ✅ PERFORMANCE FIX: O(1) Map Lookup (was O(n) array search)
    // 🔒 STRICT MAPPING (Task 0142): No Auto-Failover. Source of Truth is DB.
    resolveBotId(symbol) {
        // 0. Check for Explicit Prefix "BotID:Symbol"
        if (symbol && symbol.includes(':')) {
            const parts = symbol.split(':');
            if (parts.length === 2 && parts[0].length > 0) {
                return parts[0];
            }
        }

        // 1. ✅ Check Map Cache (O(1))
        // STRICT: If mapped, we MUST use it. Even if offline.
        // The UI/User must know the source is down, rather than getting "Mock" data from another broker.
        const cachedBotId = this.symbolToBotMap.get(symbol);
        if (cachedBotId) {
            // Optional: Log warning if offline, but DO NOT SWITCH.
            if (!this.isBotOnline(cachedBotId)) {
                // console.warn(`[Sync] ⚠️ Request for ${symbol} routed to OFFLINE bot ${cachedBotId} (Strict Mapping)`);
            }
            return cachedBotId;
        }

        // 2. Fallback: Check Available Symbols
        // Only if NOT mapped yet.
        const onlineCandidate = this.availableSymbols.find(s => s.name === symbol && s.botId && this.isBotOnline(s.botId));

        if (onlineCandidate) {
            // Update cache
            this.symbolToBotMap.set(symbol, onlineCandidate.botId);
            return onlineCandidate.botId;
        }

        return null;
    }



    // --- Ingestion ---

    processLiveTick(symbol, tick, botId) {
        // Alias for processLiveTick if needed, or fix callers
        this.processStreamData(symbol, tick, botId);
    }

    processStreamData(symbol, data, botId) {
        if (!botId) {
            console.warn(`[Sync] ⚠️ No BotId provided for stream data(${symbol}).Timezone conversion may default to EET.`);
        }

        // --- DECENTRALIZED ID RESOLUTION ---
        // If botId is a pipe key (e.g. "EURUSD_M1"), resolve the real Bot ID
        if (botId && (botId.includes('_') || botId.includes('.'))) {
            const resolved = this.resolveBotId(symbol); // Using INTERNAL symbol?
            // "symbol" passed here is likely BROKER symbol if coming from Spy?
            // TickSpy uses _Symbol (Broker Symbol).
            // SyncManager.resolveBotId expects Internal or checks Name.
            // resolveBrokerSymbol is better?
            // Actually resolveBotId() checks availableSymbols.name (Internal).
            // But we don't know Internal yet.
            // However, this.resolveInternalSymbol(symbol, null) can find it.
            if (resolved) botId = resolved;
            else {
                // Try looking up via Broker Symbol map
                // We don't have a direct map for BrokerSym -> BotId easily without config interaction.
                // But most of the time resolveInternalSymbol works.
                // Let's rely on TimezoneService falling back safely if botId is invalid.
            }
        }
        // -----------------------------------

        // --- MAP BROKER SYMBOL TO ORIGINAL SYMBOL ---
        // Vital: Store and Key everything by the "Original" (Frontend) name.

        // OLD: Ad-hoc find() -> Slow O(N)
        // NEW: O(1) Reverse Map Lookup
        // TRUST INTERNAL SYMBOL
        let processingSymbol = symbol;

        const rawSymbol = symbol;
        symbol = processingSymbol.trim();

        // Fix Timestamp (MQL5 Seconds -> MS) using TIMEZONE SERVICE
        const tzService = require('./TimezoneNormalizationService');
        if (data.t < 10000000000) {
            data.t = tzService.convertBrokerToUtcMs(botId, data.t);
        }

        if (data.tf) {
            data.tf = data.tf.trim();
            // --- BAR MODE (Authoritative) ---
            const key = `${symbol}_${data.tf}`;

            // --- STRICT CONSISTENCY CHECK ---
            const lock = this.syncLockState.get(key);
            if (lock && lock.syncing) {
                console.log(`[Sync] 🔓 FIRST TICK for ${key}. Emitting SYNC_COMPLETE. (Waited ${Date.now() - lock.timestamp}ms)`);

                // 1. Emit Unlock Event
                if (this.socketServer) {
                    this.socketServer.emit('SYNC_COMPLETE', { symbol, timeframe: data.tf });

                    // Task 0156: Resolve Mapped Symbols (NDX100 -> US100)
                    // Logic: If symbol (NDX100) is a Mapped/Datafeed Symbol, find Parent (US100) and emit for it too.
                    if (this.configuredSymbols) {
                        const parent = this.configuredSymbols.find(c => c.datafeedSymbol === symbol && c.symbol !== symbol);
                        if (parent) {
                            console.log(`[Sync] 🔗 Alias SYNC_COMPLETE: ${symbol} -> ${parent.symbol}`);
                            this.socketServer.emit('SYNC_COMPLETE', { symbol: parent.symbol, timeframe: data.tf });
                        }
                    }
                }

                // 2. Clear Lock
                if (lock.timeout) clearTimeout(lock.timeout);
                this.syncLockState.delete(key);
            }
            // --------------------------------

            console.log(`[Sync:Debug] Incoming BAR for ${symbol} ${data.tf} at ${data.t}`);

            // Construct Authoritative Bar
            const bar = {
                symbol,
                timeframe: data.tf,
                time: Number(data.t),
                open: data.o,
                high: data.h,
                low: data.l,
                close: data.c,
                volume: data.v,
                updatedAt: Date.now()
            };

            // AUTO-CORRECT TIMESTAMP (Seconds vs MS)
            if (bar.time < 10000000000) {
                bar.time = bar.time * 1000;
            }

            // --- DATA-DRIVEN TIME ---
            this.updateServerTime(bar.time);

            // Save to Cache (Persistence Logic for Rollover)
            const existing = this.hotCandles.get(key);
            if (existing && existing.time < bar.time) {
                console.log(`[Sync] 💾 Rollover Detected for ${symbol} ${data.tf}: ${existing.time} -> ${bar.time} `);
                // Trigger a fetch to get the authoritative finished candle from Bot.
                this.enqueueRequest(symbol, data.tf, 'FAST', 0, 5); // Priority 5 (High)
            }

            // New Hot Candle is ALWAYS incomplete
            bar.is_complete = 0;

            this.hotCandles.set(key, bar);

            if (this.socketServer) {
                // VERBOSE TRACE for Chart Debugging
                console.log(`[Sync:Emit] bar_update to room [${symbol}] | Time: ${bar.time} | Close: ${bar.close}`);
                this.socketServer.to(symbol).emit('bar_update', bar);
            }

            if (data.b !== undefined) {
                // TICK MODE (Synthetic)
                const tick = {
                    symbol: symbol,
                    time: data.t * 1000,
                    bid: data.b,
                    ask: data.a,
                    volume: data.v
                };

                if (this.socketServer) {
                    console.log(`[Sync:Emit] tick to room [${symbol}] | Bid: ${tick.bid}`);
                    this.socketServer.to(symbol).emit('tick', tick);
                    if (botId) {
                        const datafeedSymbol = `${botId}:${symbol}`;
                        const dfTick = { ...tick, symbol: datafeedSymbol };
                        this.socketServer.to(datafeedSymbol).emit('tick', dfTick);
                    }
                }
            }
            return;
        }

        // --- PURE TICK MODE (No Timeframe) ---
        // Verify we have Bid/Ask
        if (data.b !== undefined && data.a !== undefined) {
            const tick = {
                symbol,
                time: Number(data.t) < 10000000000 ? Number(data.t) * 1000 : Number(data.t), // Handle Sec vs MS
                bid: data.b,
                ask: data.a,
                volume: data.v || 1,
                is_raw: true
            };

            // Use Server Time for emission if data time is old? No, trust data time?
            // Usually we want 'Date.now()' for visualization if we trust the pipe speed.
            // But let's respect the tick time if valid.

            if (this.socketServer) {
                this.socketServer.to(symbol).emit('tick', tick);

                // Also emit to specific BotID room if needed (for Asset Mapping debugging)
                if (botId) {
                    const datafeedSymbol = `${botId}:${symbol}`;
                    const dfTick = { ...tick, symbol: datafeedSymbol };
                    this.socketServer.to(datafeedSymbol).emit('tick', dfTick);
                }
            }
        }
    }

    ingestHistory(data, botId) {
        if (!data || !data.candles || data.candles.length === 0) {
            return;
        }

        // --- MAP BROKER SYMBOL TO ORIGINAL SYMBOL ---
        // NEW: O(1) Reverse Map Lookup
        // TRUST INTERNAL SYMBOL
        // data.symbol matches internal symbol from TickSpy header
        let processingSymbol = data.symbol;

        // Ensure we actually use the result (redundant but safe)
        data.symbol = processingSymbol;

        const periodSeconds = this.getSeconds(data.timeframe);

        // Define these ONCE
        const historyCandles = [];
        let incomingHot = null;

        const tzService = require('./TimezoneNormalizationService');

        // First pass: Just fix timestamps and basic object structure
        const candles = data.candles.map(c => {
            let t = Number(c.time);

            // Timezone Normalization
            if (t < 10000000000 && botId) {
                t = tzService.convertBrokerToUtcMs(botId, t);
            } else if (t < 10000000000) {
                t = t * 1000;
            }
            return {
                symbol: data.symbol,
                timeframe: data.timeframe,
                ...c,
                time: t,
                updatedAt: Date.now(),
                is_complete: 0
            };
        });

        candles.sort((a, b) => a.time - b.time);

        // Update Server Time from Latest History
        if (candles.length > 0) {
            this.updateServerTime(candles[candles.length - 1].time);
        }

        // USE DATA-DRIVEN TIME
        const serverNow = this.getServerTime();

        for (let i = 0; i < candles.length; i++) {
            const c = candles[i];
            const isLast = (i === candles.length - 1);

            if (!isLast) {
                c.is_complete = 1;
                historyCandles.push(c);
            } else {
                const expectedClose = c.time + (periodSeconds * 1000);
                if (serverNow >= expectedClose) {
                    c.is_complete = 1;
                    historyCandles.push(c);
                } else {
                    console.log(`[Sync] ⚠️ Incomplete Candle Dropped: ${data.symbol} ${data.timeframe} Time=${c.time} ExpectedClose=${expectedClose} ServerNow=${serverNow} Diff=${expectedClose - serverNow}`);
                    c.is_complete = 0;
                    if (!incomingHot || c.time > incomingHot.time) {
                        incomingHot = c;
                    }
                }
            }
        }
        // 1. Save History (Complete Only)
        if (historyCandles.length > 0) {
            db.insertCandles(historyCandles);
            console.log(`[Sync] Ingested ${historyCandles.length} COMPLETED bars for ${data.symbol} ${data.timeframe} `);

            if (this.socketServer) {
                const isBulk = historyCandles.length > 1;
                const isDeep = (historyCandles[0].time < (Date.now() - (periodSeconds * 1000 * 5)));

                if (isBulk || isDeep) {
                    this.socketServer.to(data.symbol).emit('history_update', {
                        symbol: data.symbol, timeframe: data.timeframe, candles: historyCandles
                    });
                }
            }
        }

        // 2. Handle Hot Candle (Merge Logic)
        if (incomingHot) {
            const key = `${data.symbol}_${data.timeframe}`;
            const existingHot = this.hotCandles.get(key);

            let shouldUpdate = true;
            if (existingHot && existingHot.time === incomingHot.time) {
                existingHot.open = incomingHot.open;
                existingHot.high = Math.max(existingHot.high, incomingHot.high);
                existingHot.low = Math.min(existingHot.low, incomingHot.low);
                existingHot.volume = Math.max(existingHot.volume, incomingHot.volume);

                if (existingHot.volume < incomingHot.volume) {
                    existingHot.close = incomingHot.close;
                    existingHot.volume = incomingHot.volume;
                }

                this.hotCandles.set(key, existingHot);
                shouldUpdate = false;
            }

            if (shouldUpdate) {
                this.hotCandles.set(key, { ...incomingHot });
                if (this.socketServer) {
                    this.socketServer.to(data.symbol).emit('bar_update', incomingHot);
                }
            } else {
                if (this.socketServer) {
                    this.socketServer.to(data.symbol).emit('bar_update', this.hotCandles.get(key));
                }
            }
        }

        this.updateSyncStatus(data.symbol, data.timeframe, 'READY');

        // Resolve Pending Requests
        const reqKey = `${data.symbol}_${data.timeframe}`;

        if (this.pendingRequests.has(reqKey)) {
            console.log(`[Sync] Resolving blocked request for ${reqKey}`);
            this.pendingRequests.get(reqKey)(true);
            this.pendingRequests.delete(reqKey);

            if (this.inflightPromises && this.inflightPromises.has(reqKey)) {
                this.inflightPromises.delete(reqKey);
            }
        }

        // Deep Backfill 
        if (candles.length > 0) {
            let minTime = candles[0].time;
            const tf = data.timeframe;
            const now = Math.floor(Date.now() / 1000);
            const tfSeconds = this.getSeconds(tf);

            let years = 0;
            let months = 0;

            if (tfSeconds >= 604800) years = 100;
            else if (tfSeconds >= 86400) years = 10;
            else if (tfSeconds >= 3600) years = 2;
            else if (tfSeconds >= 300) years = 1;
            else months = 6;

            let cutoffSeconds = 0;
            if (years > 0) cutoffSeconds = now - (years * 365 * 24 * 60 * 60);
            if (months > 0) cutoffSeconds = now - (months * 30 * 24 * 60 * 60);

            const currentCount = db.getCandleCount(data.symbol, data.timeframe);
            const needsBoost = currentCount < 1000;

            console.log(`[Sync] 🔎 Decision: ${data.symbol} ${data.timeframe}.Count: ${currentCount} (NeedsBoost = ${needsBoost}).MinTime: ${new Date(minTime).toISOString()}.Cutoff: ${cutoffSeconds}.`);

            if ((minTime / 1000) > cutoffSeconds) {
                if (this.features.ENABLE_DEEP_HISTORY_SYNC) {
                    if (needsBoost) {
                        const isActive = this.activeFocus &&
                            this.activeFocus.symbol === data.symbol &&
                            this.activeFocus.timeframe === data.timeframe;

                        if (isActive) {
                            setTimeout(() => {
                                this.enqueueRequest(data.symbol, data.timeframe, 'BOOST', minTime / 1000, 1);
                            }, 50); // Small delay for active chart
                        } else {
                            setTimeout(() => {
                                this.enqueueRequest(data.symbol, data.timeframe, 'BOOST', minTime / 1000, 5);
                            }, 200); // Longer delay for background
                        }
                    } else {
                        setTimeout(() => {
                            this.enqueueRequest(data.symbol, data.timeframe, 'DEEP', minTime / 1000, 10);
                        }, 500); // 500ms delay for deep backfill to allow ticks to pass
                    }
                } else {
                    // Feature Disabled - Just log
                    // console.log(`[Sync] ⏹️ Deep History Sync BLOCKED for ${data.symbol} ${data.timeframe} (Feature DISABLED)`);
                }
            } else {
                console.log(`[Sync] ✅ Backfill Complete for ${data.symbol} ${data.timeframe} `);
            }
        } else {
            console.log(`[Sync] 🛑 Backfill Stopped for ${data.symbol} ${data.timeframe} (0 candles received)`);
        }
    }

    setAvailableSymbols(list, botId, skipPersistence = false) {
        const assetMappingService = require('./AssetMappingService');

        // OPTIMIZATION: Skip DB Write if data came from DB (Restoration)
        if (!skipPersistence) {
            assetMappingService.updateBrokerSymbols(botId, list);
        }

        if (!this.botSymbolsMap) this.botSymbolsMap = new Map();

        const normalizedList = list.map(item => {
            if (typeof item === 'string') return { name: item, path: '', desc: '', botId: botId };
            return { ...item, botId: botId };
        });

        this.botSymbolsMap.set(botId, normalizedList);

        // Global Aggregation (Restored for UI Compatibility)
        const aggregated = new Map();
        for (const [bId, botSymbols] of this.botSymbolsMap) {
            botSymbols.forEach(s => {
                const name = s.name || s; // Handle objects or strings
                if (!aggregated.has(name)) {
                    aggregated.set(name, s);
                }
            });
        }
        this.availableSymbols = Array.from(aggregated.values());

        console.log(`[Sync] Available Symbols Updated for ${botId}: ${normalizedList.length} items. Global Total: ${this.availableSymbols.length}`);

        // Notify UI that a specific bot's list updated (Targeted Event)
        if (this.socketServer) {
            this.socketServer.emit('broker_symbols_updated', { botId, count: normalizedList.length });

            // FIX: Also emit the full list because DatafeedView.tsx listens to 'all_symbols_list'
            // and might not react to partial updates.
            this.socketServer.emit('all_symbols_list', this.availableSymbols);
        }
    }

    requestAvailableSymbols() {
        console.log(`[PROCESS] START Request Available Symbols`);
        const start = Date.now();

        // OPTIMIZATION: Check DB first. If we have symbols, rely on them to avoid startup storm.
        // The user can manually click "Refresh Symbols" in UI if needed.
        const assetMappingService = require('./AssetMappingService');
        // We need a way to check if ANY symbols exist. 
        // Since we don't have a direct "count" method easily accessible, we check the in-memory map if populated, 
        // or trigger a DB load if empty.

        // Actually, let's just use the botIds we know.
        const allBots = new Set([...this.datafeedBots, ...this.tradingBots]);

        if (allBots.size === 0) {
            // Fallback for empty state
            console.log("[Sync] ℹ️ No active bots for symbol discovery.");
        }

        let requestCount = 0;
        allBots.forEach(botId => {
            // FIX 1: Offline Check (Existing)
            if (!this.isBotOnline(botId)) return;

            // FIX 2: DB Cache Check (New)
            // If we already have symbols for this bot in DB/Memory, skip auto-request.
            if (this.botSymbolsMap && this.botSymbolsMap.has(botId) && this.botSymbolsMap.get(botId).length > 0) {
                // console.log(`[Sync] ⏭️ Skipping discovery for ${botId} (Cache Hit)`);
                return;
            }

            this.requestSymbolsForBot(botId);
            requestCount++;
        });

        console.log(`[PROCESS] END Request Available Symbols (Sent ${requestCount} requests, Duration: ${Date.now() - start}ms)`);
    }

    requestSymbolsForBot(botId) {
        if (!botId) return;
        console.log(`[Sync] 📢 Requesting symbols from ${botId}`);
        // Bypass isBotOnline check to force attempt (useful during registration handshake)
        this.sendCommandToBot(`${botId}:*`, "CMD_GET_SYMBOLS", {});
    }

    setPipeServer(server) {
        this.pipeServer = server;
    }

    /**
     * Resend subscriptions for a specific Bot (Reconnect Logic)
     */
    resendSubscriptions(targetBotId) {
        console.log(`[Sync] ♻️ Resending Active Subscriptions for Reconnected Bot: ${targetBotId}`);
        // Delay slightly to allow socket handshake to finalize?
        // NO delay for Push Protocol!
        // But maybe PipeServer hasn't registered the socket yet?
        // handleBotRegister calls this immediately.

        // Let's add a small yield (100ms) just to be safe, or 0.
        setTimeout(() => {
            this.syncSubscriptionsWithMT5(targetBotId, 'RECONNECT');
        }, 100);
    }

    sendCommandToBot(symbol, type, content, botIdParam = null) {
        symbol = symbol ? symbol.trim() : "";
        // Resolve target Bot
        let botId;
        if (botIdParam) {
            botId = botIdParam;
        } else {
            botId = (symbol === '*' || symbol === '**') ? '**' : this.resolveBotId(symbol);
        }

        // Special case: Discovery (Broadcast)
        if (type === 'CMD_GET_SYMBOLS' && (!botId || botId === '**')) {
            // Broadcast logic handled by PipeServer if we pass '**'
        } else if (!botId) {
            console.warn(`[Sync] ⚠️ Cannot send ${type} for ${symbol}: No Bot Found.`);
            return;
        }

        const cmd = {
            type,
            content,
            botId: botId || '**', // Default to wildcard if missing?
            symbol,
            sender: 'App',
            timestamp: Date.now(),
            customId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };

        let sentViaPipe = false;

        // 1. Try DIRECT PUSH via Pipe
        if (this.pipeServer) {
            // PipeServer expects { targetBotId: ... } for routing
            const pipeCmd = { ...cmd, targetBotId: botId };
            sentViaPipe = this.pipeServer.sendCommand(pipeCmd);
        }

        if (sentViaPipe) {
            console.log(`[Sync] 🚀 PUSHED ${type} to ${botId} (Pipe).Logging audit record(Inactive).`);
        } else {
            // Only log warning if it wasn't a broadcast attempt or if we expected a connection
            if (botId !== '**') console.log(`[Sync] ⚠️ Pipe Push Failed for ${botId}.Fallback to DATABASE POLL.`);
        }

        // 2. Log to DB (Audit + Poll Fallback)
        // If sentViaPipe is TRUE -> isActive = 0 (Audit only)
        // If sentViaPipe is FALSE -> isActive = 1 (Poll Fallback)
        db.logMessage({
            ...cmd,
            isActive: sentViaPipe ? 0 : 1
        });
    }

    broadcastSanityUpdate(data) {
        if (!this.socketServer) return;
        // Broadcast to all clients connected to the 'data-history' room or globally
        // For simplicity, we emit to all since this is an admin feature usually.
        // data: { symbol, timeframe, status, message, timestamp }
        this.socketServer.emit('sanity_update', data);
    }

    async handleSubscribe(socketId, symbol, timeframe, traceId) {
        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";
        if (traceId) console.log(`[Forensic] ${traceId} | 3. SyncManager | Enqueuing for ${symbol}`);

        // --- PRIORITY MODE: ACTIVE FOCUS ---
        console.log(`[${new Date().toISOString()}] [SyncManager] handleSubscribe: ${socketId} wants ${symbol} ${timeframe}`);
        this.setFocus(symbol, timeframe);

        const subscriptionId = `${symbol}|${timeframe}`;

        if (!this.activeSubscriptions.has(subscriptionId)) {
            this.activeSubscriptions.set(subscriptionId, new Set());
        }
        this.activeSubscriptions.get(subscriptionId).add(socketId);

        console.log(`[Sync] ♻️ Refreshing / Enforcing subscription for ${symbol} ${timeframe} (Clients: ${this.activeSubscriptions.get(subscriptionId).size})`);

        this.syncSubscriptionsWithMT5(null, traceId, symbol);

        // --- TASK 0126: IMMEDIATE UNBLOCK (NO LOCK) ---
        // Protocol V13.1: Main Thread delegates and immediately confirms.
        // Frontend receives SYNC_COMPLETE to hide loader.
        // --- TASK 0132: TIMEFRAME SWAP & HANG FIX ---
        // Emit CLEAR_UI_CACHE to prevent frontend displaying stale candles from previous TF
        if (this.socketServer) {
            this.socketServer.emit('CLEAR_UI_CACHE', { symbol, timeframe });
            this.socketServer.emit('SYNC_COMPLETE', { symbol, timeframe });
        }

        // DEPRECATED: ensureFreshHistory is redundant with Always-On Worker.
        // this.ensureFreshHistory(symbol, timeframe).catch(e => {
        //     console.error(`[Sync] Background ensureFreshHistory failed for ${symbol} ${timeframe}: `, e.message);
        // });

        return {
            history: db.getHistory(symbol, timeframe, 1000),
            hot: this.getHotCandle(symbol, timeframe)
        };
    }

    // ... (handleUnsubscribe omitted) ...


    handleUnsubscribe(socketId, symbol, timeframe) {

        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";
        console.log(`[Sync] handleUnsubscribe: ${socketId} -> ${symbol} ${timeframe}`);
        const subscriptionId = `${symbol}|${timeframe}`;

        if (this.activeSubscriptions.has(subscriptionId)) {
            const subscribers = this.activeSubscriptions.get(subscriptionId);
            subscribers.delete(socketId);

            if (subscribers.size === 0) {
                console.log(`[Sync] ⏳ Pending Unsubscribe: ${symbol} ${timeframe} (Waiting 3s for reconnect...)`);

                setTimeout(() => {
                    // Double-check if still empty after delay
                    if (this.activeSubscriptions.has(subscriptionId) && this.activeSubscriptions.get(subscriptionId).size > 0) return;
                    if (!this.activeSubscriptions.has(subscriptionId)) return;

                    this.activeSubscriptions.delete(subscriptionId);

                    const botId = this.resolveBotId(symbol);
                    if (botId) {
                        const conf = this.configuredSymbols.find(c =>
                            (c.symbol === symbol || c.originalName === symbol) &&
                            (!c.botId || c.botId === botId)
                        );
                        const symbolToSend = conf ? (conf.datafeedSymbol || conf.symbol) : symbol;

                        console.log(`[Sync] 🛑 STOPPING LIVE FEED: ${symbol}(${symbolToSend}) ${timeframe} on Bot ${botId}`);

                        // New Hybrid Logic: Do NOT send CMD_UNSUBSCRIBE to Bot.
                        // Instead, tell Worker to STOP LIVE.
                        // And KEEP Worker alive for Always-On History.

                        if (this.pipeServer) {
                            // Send Control Packet to Worker
                            this.pipeServer.sendToWorker(symbolToSend, {
                                type: 'UNSUBSCRIBE',
                                timeframe: timeframe
                            });
                            // CRITICAL: Do NOT terminate worker.
                        }

                        // Log Audit (Inactive)
                        const cmdStub = { type: 'UNSUBSCRIBE_TICKS_INTERNAL', content: { symbol: symbolToSend, timeframe } };
                        db.logMessage({ ...cmdStub, isActive: 0 });
                    }
                }, 500);
            }
        }

        let hasOtherSubscriptions = false;
        for (const [key, subscribers] of this.activeSubscriptions) {
            if (key.startsWith(`${symbol}|`) && subscribers.has(socketId)) {
                hasOtherSubscriptions = true;
                break;
            }
        }

        // If this was the active focus, clear it?
        if (this.activeFocus && this.activeFocus.symbol === symbol) {
            this.activeFocus = null;
            console.log(`[Sync] 🎯 Active Focus Cleared: ${symbol}`);
        }

        return !hasOtherSubscriptions;
    }

    handleDisconnect(socketId) {
        console.log(`[Sync] handleDisconnect: Cleaning up socket ${socketId} `);
        const deadSubscriptions = [];

        for (const [key, subscribers] of this.activeSubscriptions) {
            if (subscribers.has(socketId)) {
                subscribers.delete(socketId);
                if (subscribers.size === 0) {
                    deadSubscriptions.push(key);
                }
            }
        }

        deadSubscriptions.forEach(key => {
            const [symbol, timeframe] = key.split('|').map(s => s.trim());
            console.log(`[Sync] ⏳ Start Graceful Disconnect for ${key}`);

            setTimeout(() => {
                try {
                    if (this.activeSubscriptions.has(key) && this.activeSubscriptions.get(key).size > 0) return;
                    if (!this.activeSubscriptions.has(key)) return;

                    this.activeSubscriptions.delete(key);

                    const botId = this.resolveBotId(symbol);
                    if (botId) {
                        const conf = this.configuredSymbols.find(c =>
                            (c.symbol === symbol || c.originalName === symbol) &&
                            (!c.botId || c.botId === botId)
                        );
                        const symbolToSend = conf ? (conf.datafeedSymbol || conf.symbol) : symbol;

                        console.log(`[Sync] 🛑 Graceful Disconnect: STOPPING LIVE FEED for ${symbol}(${symbolToSend}) ${timeframe} (Bot: ${botId})`);

                        // ARCHITECTURAL PURGE (Task 0125): 
                        // Do NOT send CMD_UNSUBSCRIBE_TICKS to Bot.
                        // Delegate to Worker.

                        if (this.pipeServer) {
                            this.pipeServer.sendToWorker(symbolToSend, {
                                type: 'UNSUBSCRIBE',
                                timeframe: timeframe
                            });
                        }

                        // Internal Audit Log
                        const cmd = {
                            type: 'UNSUBSCRIBE_TICKS_INTERNAL',
                            content: {
                                symbol: symbolToSend,
                                timeframe: timeframe
                            },
                            botId: botId,
                            sender: 'App',
                            isActive: 0
                        };
                        db.logMessage(cmd);
                    }

                    setTimeout(() => {
                        try {
                            // Sync current state (might re-subscribe remaining clients?)
                            this.syncSubscriptionsWithMT5();
                        } catch (e) {
                            console.error("[Sync] handleDisconnect inner error", e);
                        }
                    }, 100);
                } catch (e) {
                    console.error("[Sync] handleDisconnect error", e);
                }
            }, 500);
        });
    }

    // --- TASK 0150: Worker Handover Handler (Unblocks UI) ---
    handleWorkerSyncComplete(symbol, timeframe, maxTime) {
        // Resolve Internal Symbol just in case
        // But Worker usually passes the symbol it was spawned with, which SHOULD be internal (from config).
        // Let's assume 'symbol' is correct.

        console.log(`[Sync] 📥 Worker Handover: ${symbol} ${timeframe} is READY (MaxTime: ${new Date(maxTime).toISOString()})`);

        // 1. Update Internal Status
        this.updateSyncStatus(symbol, timeframe, 'READY');

        // 2. Resolve Pending Requests (Unblock Async Waits)
        const reqKey = `${symbol}_${timeframe}`;
        if (this.pendingRequests.has(reqKey)) {
            // console.log(`[Sync] ✅ Resolving Pending Request for ${reqKey}`);
            this.pendingRequests.get(reqKey)(true);
            this.pendingRequests.delete(reqKey);

            if (this.inflightPromises && this.inflightPromises.has(reqKey)) {
                this.inflightPromises.delete(reqKey);
            }
        }

        // 3. Notify Frontend (Critical for Unblocking Chart Loading)
        if (this.socketServer) {
            // Signal completeness
            this.socketServer.emit('SYNC_COMPLETE', { symbol, timeframe, timestamp: maxTime });

            // Optionally tell UI to reload history if it was waiting?
            // Usually 'SYNC_COMPLETE' is enough for ChartContainer to set isLoading=false
            // And maybe refetch via REST if needed, or we push data?
            // "history_update" with empty array might trigger refetch?
            // Let's just emit SYNC_COMPLETE for now, matching v13.5 protocol.
        }
    }

    syncSubscriptionsWithMT5(targetBotIdRel = null, traceId = null, targetSymbol = null) {
        // console.log(`[Sync] syncSubscriptionsWithMT5 called. Active Subs: ${this.activeSubscriptions.size}. TargetBot: ${targetBotIdRel || 'ALL'} TargetSym: ${targetSymbol || 'ALL'}`);

        // 1. Gather Unique Subscriptions
        const botSubsOriginal = new Map();

        for (const [key, subscribers] of this.activeSubscriptions) {
            if (subscribers.size > 0) {
                const [fullSymbol, timeframe] = key.split('|').map(s => s.trim());

                if (targetSymbol && fullSymbol !== targetSymbol && !fullSymbol.startsWith(targetSymbol + ':')) {
                    continue;
                }

                let targetBotId = this.resolveBotId(fullSymbol);
                let cleanSymbol = fullSymbol;

                if (fullSymbol.includes(':')) {
                    const parts = fullSymbol.split(':');
                    cleanSymbol = parts[1].trim();
                    if (!targetBotId) targetBotId = parts[0].trim();
                }

                if (targetBotId) {
                    if (!botSubsOriginal.has(targetBotId)) botSubsOriginal.set(targetBotId, []);
                    const existing = botSubsOriginal.get(targetBotId);
                    const isDup = existing.some(s => s.symbol === cleanSymbol && s.timeframe === timeframe);
                    if (!isDup) {
                        botSubsOriginal.get(targetBotId).push({ symbol: cleanSymbol, timeframe: timeframe });
                    }
                }
            }
        }

        // 2. Process Subscriptions (DELEGATE TO WORKER)
        for (const [botId, items] of botSubsOriginal) {
            if (targetBotIdRel && botId !== targetBotIdRel) continue;

            items.forEach(item => {
                // ARCHITECTURAL PURGE (Task 0125):
                // Do NOT send CMD_SUBSCRIBE_TICKS to Bot.
                // Delegate purely to Worker.

                const conf = this.configuredSymbols.find(c =>
                    (c.symbol === item.symbol || c.originalName === item.symbol || c.datafeedSymbol === item.symbol) &&
                    (!c.botId || c.botId === botId || botId.startsWith(c.botId))
                );

                // Task 0156: Reverse Mapping Safety Net
                // If item.symbol is 'NDX100', but conf says internal is 'US100', force use of 'US100' for Worker ID.
                const internalSymbol = conf ? conf.symbol : item.symbol;
                const symbolToSend = conf ? (conf.datafeedSymbol || conf.symbol) : item.symbol;

                // --- DECENTRALIZED ARCHITECTURE: SPAWN WORKER ---
                if (this.pipeServer && this.pipeServer.ensureSymbolSpyPipe) {
                    // Task 0156: Use INTERNAL Symbol for Worker Identity (internalSymbol), PASSTHROUGH Broker Symbol (symbolToSend) for Pipe.
                    this.pipeServer.ensureSymbolSpyPipe(internalSymbol, item.timeframe, botId, symbolToSend);

                    // Send Worker Control Command (Delayed slightly to ensure spawn)
                    // Or Immediate if we trust pipe exists?
                    // Better wait 100ms or check readiness?
                    // Just fire and forget via pipeServer.sendToWorker which handles buffering?
                    // pipeServer.sendToWorker queues if pipe not ready? Usually no.
                    // But ensureSymbolSpyPipe spawns async.

                    setTimeout(() => {
                        this.pipeServer.sendToWorker(symbolToSend, {
                            type: 'SUBSCRIBE',
                            timeframe: item.timeframe
                        });
                    }, 50); // Short delay
                }

                console.log(`[Sync] 🚀 Delegated SUBSCRIBE: ${item.symbol} ${item.timeframe} -> Worker (Bot: ${botId})`);

                // Internal Audit Log (Active for tracking)
                const cmd = {
                    type: "SUBSCRIBE_TICKS_INTERNAL",
                    content: {
                        symbol: symbolToSend,
                        timeframe: item.timeframe
                    },
                    botId: botId,
                    symbol: item.symbol,
                    sender: 'App',
                    isActive: 1 // TASK 0126: Mark as ACTIVE so we can trace it in DB
                };
                db.logMessage(cmd);
            });
        }
    }

    async triggerBulkSync() {
        console.log(`[PROCESS] START Bulk Sync(Configured: ${this.configuredSymbols.length})`);
        const start = Date.now();

        if (this.configuredSymbols.length === 0) {
            console.log(`[PROCESS] END Bulk Sync(Skipped - Empty Config)`);
            return;
        }

        if (this.activeFocus) {
            console.log(`[Sync] ⏸️ Skipping Bulk Sync (Active Focus on ${this.activeFocus.symbol})`);
            return;
        }

        const botGroups = new Map();

        for (const item of this.configuredSymbols) {
            const sym = item.symbol || item.name || item;
            const botId = this.resolveBotId(sym);
            if (!botId) continue;

            if (!botGroups.has(botId)) botGroups.set(botId, []);

            const tfs = {};
            config.DEFAULT_TIMEFRAMES.forEach(tf => {
                let lastT = db.getLastTimestamp(sym, tf);
                if (!lastT) lastT = 0;
                tfs[tf] = lastT;
            });

            botGroups.get(botId).push({
                s: sym,
                tfs: tfs
            });
        }

        for (const [botId, items] of botGroups) {
            console.log(`[Sync] 📤 Sending BULK_SYNC to ${botId} with ${items.length} symbols.`);

            const cmd = {
                type: "CMD_BULK_SYNC",
                content: {
                    items: items
                }
            };

            db.logMessage({
                type: cmd.type,
                content: cmd.content,
                botId: botId,
                symbol: '*',
                sender: 'App'
            });
        }
        console.log(`[PROCESS] END Bulk Sync (Duration: ${Date.now() - start}ms)`);
    }

    handleBulkHistoryResponse(content, botId) {
        const updates = content.updates;
        if (!updates || !Array.isArray(updates)) return;

        console.log(`[Sync] 📥 Received BULK RESPONSE with ${updates.length} updates from ${botId}.`);

        updates.forEach(upd => {
            if (upd.candles && upd.candles.length > 0) {
                this.ingestHistory({
                    symbol: upd.symbol,
                    timeframe: upd.timeframe,
                    candles: upd.candles
                }, botId);
            }
        });
    }

    setSocketServer(io) {
        this.socketServer = io;
    }

    updateConfig(symbols) {
        console.log(`[SyncManager] Updating config with ${symbols.length} symbols.Persistence: selected_symbols`);
        this.configuredSymbols = symbols;
        db.setConfig('selected_symbols', symbols);
        this.triggerStartupSync();
    }

    updateSyncStatus(symbol, timeframe, status, type = null) {
        if (!this.syncStatus.has(symbol)) this.syncStatus.set(symbol, new Map());
        const tfMap = this.syncStatus.get(symbol);
        const prev = tfMap.get(timeframe) || {};

        if (prev.status !== status || prev.type !== type) {
            tfMap.set(timeframe, { status, type, lastCheck: Date.now() });
            if (this.socketServer) {
                this.socketServer.to(symbol).emit('sync_status', { symbol, timeframe, status, type });
            }
        }
    }

    triggerStartupSync() {
        // PUSH PROTOCOL: Startup Sync DISABLED
        // Use BACKGROUND phase (Priority 10) to enforce strict serialization
        // and prevent pipe flooding on startup.
        // this.triggerBackgroundSync('BACKGROUND');
        console.log("[Sync] ℹ️ Startup Sync DISABLED (Push Protocol Active)");
    }

    triggerBackgroundSync(phase = 'FAST') {
        if (!this.configuredSymbols || this.configuredSymbols.length === 0) return;
        const timeframes = config.DEFAULT_TIMEFRAMES;
        const priority = phase === 'FAST' ? 2 : 10;

        this.configuredSymbols.forEach(item => {
            const sym = item.symbol || item;
            timeframes.forEach(tf => {
                if (phase === 'FAST') {
                    // Pass 'false' to skip auto-process
                    this.enqueueRequest(sym, tf, 'FAST', 0, priority, 100, false);
                }
            });
        });
        this.processQueue();
    }

    /**
     * Enqueue a request. 
     * @param {boolean} autoProcess - If true, triggers processing immediately. Set false for bulk ops.
     */
    enqueueRequest(symbol, timeframe, type, anchorTime, priority, count = 100, autoProcess = true) {
        return new Promise((resolve, reject) => {
            const targetQueue = (priority < 10) ? this.priorityQueue : this.deepQueue;

            // Deduplication (Optional: reuse existing promise if exact match?)

            const task = { symbol, timeframe, type, anchorTime, priority, count, resolve, reject };

            targetQueue.push(task);

            // ENABLEED: Sorting ensures Priority 1 (UI) jumps ahead of Priority 8 (Sanity)
            targetQueue.sort((a, b) => a.priority - b.priority);

            if (autoProcess) this.processQueue();
        });
    }

    prioritizeTask(symbol, timeframe) {
        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";
        const key = `${symbol}_${timeframe}`;
        console.log(`[Sync] 🚀 BOOSTING Priority for ${symbol} ${timeframe} `);
        // ... (Existing logic needs update to move tasks with their resolvers)
        // Simplified: Just queue a new high-priority one. Old one will resolve redundantly or can be cancelled.
        // Actually, let's keep it simple. User just wants speed.
        this.enqueueRequest(symbol, timeframe, 'FAST', 0, 0);
    }

    setFocus(symbol, timeframe) {
        if (!symbol) {
            this.activeFocus = null;
            return;
        }
        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";
        this.activeFocus = { symbol, timeframe, timestamp: Date.now() };
        console.log(`[Sync] 🎯 Active Focus Set: ${symbol} ${timeframe}`);
        this.enqueueRequest(symbol, timeframe, 'FAST', 0, 1);
    }

    triggerGapFillForBot(botId) {
        console.log(`[Sync] ♻️ Triggering GAP FILL for Bot ${botId} (Poll on Connect)`);

        // Find all symbols for this bot
        // Task 0156: Deduplicate "Shadow" Broker Symbols
        // If 'US100' maps to 'NDX100', we must NOT spawn a separate worker for 'NDX100'.
        // We find all 'datafeedSymbol' values currently in use by Configured Mappings.
        const usedDatafeedSymbols = new Set();
        this.configuredSymbols.forEach(c => {
            if (c.datafeedSymbol && c.symbol !== c.datafeedSymbol) {
                usedDatafeedSymbols.add(c.datafeedSymbol);
            }
        });

        // Filter out any symbol that is purely a 'shadow' (i.e. it is a datafeedSymbol for someone else)
        // UNLESS it is also configured explicitly as a standalone symbol (unlikely in this context)
        const botSymbols = this.configuredSymbols.filter(c =>
            (!c.botId || c.botId === botId) &&
            !usedDatafeedSymbols.has(c.symbol) // Filter: If 'NDX100' is in usedDatafeedSymbols, skip it.
        );

        const standardTFs = ['M1', 'M5', 'H1', 'D1'];



        // ASYNC BATCH PROCESSING (Prevent Event Loop Block)
        // Process symbols in chunks of 5 to allow I/O (Pipe Writes) to interleave.

        const processChunk = async (index) => {
            if (index >= botSymbols.length) {
                console.log(`[Sync] ✅ Gap Fill Check Complete for ${botId}`);
                return;
            }

            const CHUNK_SIZE = 5;
            const end = Math.min(index + CHUNK_SIZE, botSymbols.length);

            for (let i = index; i < end; i++) {
                const conf = botSymbols[i];
                const sym = conf.symbol || conf.originalName;

                // Fire & Forget Promises - Don't await individually, but allow DB ops to queue
                standardTFs.forEach(tf => {
                    // Priority 3 (Background)
                    this.ensureFreshHistory(sym, tf, false, 3).catch(e => console.error(e));
                });
            }

            // Yield to Event Loop
            if (end < botSymbols.length) {
                setTimeout(() => processChunk(end), 50); // 50ms Yield between chunks
            } else {
                console.log(`[Sync] ✅ Gap Fill Check Complete for ${botId}`);
            }
        };

        // Start processing
        processChunk(0);
    }

    async ensureFreshHistory(symbol, timeframe, strict = false, priority = 1) {
        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";
        // this.activeFocus = { symbol, timeframe }; // Don't steal focus just for a background check? 
        // Actually, if user asked for it (Subscribe), yes set focus. 
        // But this method is also called by triggerGapFillForBot... 
        // Let's NOT set focus here, let the caller (handleSubscribe) do it if needed.
        // But handleSubscribe calls this. 

        const lastTime = db.getLastTimestamp(symbol, timeframe);
        const candleCount = db.getCandleCount(symbol, timeframe);
        const tfSeconds = this.getSeconds(timeframe);

        const now = Date.now();
        // Staleness Threshold: If we are behind by more than 3 periods, we definitely need a fill.
        // For M1: 3 mins. For D1: 3 days.
        // STRICT MODE: If strict is true, we tolerate NO gap (0ms).
        const stalenessThreshold = strict ? 0 : (tfSeconds * 1000 * 3);

        // If lastTime is 0, we need sync.
        // If count is low, we need sync.
        // If time diff > threshold, we need sync.

        const isStale = (lastTime > 0) && ((now - lastTime) > stalenessThreshold);
        // Removed candleCount < 100 check here - handled by ensureHistoryDepth
        const needsSync = (lastTime === 0 || isStale);

        if (needsSync) {
            const reason = (lastTime === 0) ? "Empty" : "Stale";
            console.log(`[Sync] ♻️ EnsureFresh(Strict=${strict}): ${symbol} ${timeframe} Needs Sync (${reason}). Last: ${new Date(lastTime).toISOString()}. Triggering DELTA (Prio ${priority}).`);
            return this.enqueueRequest(symbol, timeframe, 'FAST', 0, priority);
        } else {
            // FIX: Self-Healing for "Incomplete" candles that should be complete
            // This catches the "11:00 Candle is complete=0 but current time is 12:00" scenario
            try {
                // Determine cutoff: Current Time - 2 * Period (To be safe, don't touch actively forming candle)
                const cutoff = now - (tfSeconds * 1000 * 2);
                const nastyCandles = db.getIncompletePastCandles(symbol, timeframe, cutoff);
                if (nastyCandles && nastyCandles.length > 0) {
                    console.warn(`[Sync] 🛠️ EnsureFresh DETECTED ${nastyCandles.length} incomplete past candles for ${symbol} ${timeframe}. Triggering REPAIR.`);

                    // Find oldest to repair from
                    const minTime = Math.min(...nastyCandles.map(c => c.time));
                    // Trigger repair with High Priority
                    return this.enqueueRequest(symbol, timeframe, 'REPAIR', minTime, priority + 1, 2000);
                }
            } catch (e) {
                console.error("[Sync] EnsureFresh Self-Healing Check Failed", e);
            }
        }
        return Promise.resolve();
    }

    async ensureHistoryDepth(symbol, timeframe, targetCount = 10000) {
        symbol = symbol ? symbol.trim() : "";
        timeframe = timeframe ? timeframe.trim() : "";

        const count = db.getCandleCount(symbol, timeframe);
        if (count >= targetCount) return Promise.resolve();

        const oldest = db.getOldestCandle(symbol, timeframe);
        let anchorTime = 0;

        if (oldest) {
            anchorTime = oldest.time; // This becomes toTime in executeSyncTask
        }

        console.log(`[Sync] 📉 Depth Check: ${symbol} ${timeframe} Count=${count}/${targetCount}. Triggering DEEP Backfill from ${new Date(anchorTime).toISOString()}.`);

        // Trigger DEEP batch (Priority 5 - Background but important)
        return this.enqueueRequest(symbol, timeframe, 'DEEP', anchorTime, 5, 2000);
    }

    fetchHistoryRange(symbol, timeframe, toTimestamp, limit) {
        // Essential for SocketServer.js 'get_history' backfill
        console.log(`[Sync] 📥 FetchHistoryRange requested for ${symbol} ${timeframe} To=${toTimestamp}`);
        // Priority 1 (High) to bypass any flood backlog
        // Pass toTimestamp (MS), executeSyncTask will divide by 1000 for Broker Time
        return this.enqueueRequest(symbol, timeframe, 'FAST', toTimestamp, 1, limit);
    }

    // NEW PROCESS QUEUE - THROTTLED + STRICT SERIALIZATION
    async processQueue() {
        // Prevent concurrent queue processors from running wildly
        // (Just a safety check, though JS single thread makes race conditions rare, re-entry via awaits is possible)
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        try {
            // Configuration
            const MAX_CONCURRENT_HIGH_PRIORITY = 2; // Allow 2 in pipe (1 blocked = 1 still flowing)
            if (!this.activeFastCount) this.activeFastCount = 0;

            // 1. Handle PRIORITY Queue (Throttled)
            // While we have capacity AND items
            while (this.priorityQueue.length > 0 && this.activeFastCount < MAX_CONCURRENT_HIGH_PRIORITY) {
                // Re-sort to ensure Prio 1 (Focus) always beats Prio 2
                // (Sorting inside loop is O(n log n) but queue should be small usually.
                // If queue is large, this prevents starvation of Prio 1 arriving late.)
                this.priorityQueue.sort((a, b) => a.priority - b.priority);

                const task = this.priorityQueue.shift();
                this.activeFastCount++;

                console.log(`[Sync] 🚀 Dispatching FAST Task: ${task.symbol} ${task.timeframe} (Prio=${task.priority}). Active=${this.activeFastCount}`);

                // Execute with "Finally" decrement
                this.executeSyncTask(task)
                    .then(res => {
                        if (task.resolve) task.resolve(res);
                    })
                    .catch(err => {
                        if (task.reject) task.reject(err);
                    })
                    .finally(() => {
                        this.activeFastCount--;
                        // Output debug only if needed
                        // console.log(`[Sync] ✅ FAST Task Done. Active=${this.activeFastCount}`);
                        // Trigger processing of next item (Recursive step)
                        this.processQueue();
                    });
            }

            // 2. Handle DEEP Queue (Strict Serial - Low Priority)
            // Only process Deep queue if Fast queue is EMPTY?
            // Or just if we have capacity?
            // "Man braucht einen mechanismus, dass die pipe nicht geflutet wird"
            // BETTER: Only run Deep if Active Fast is 0. (Strict Prioritization)

            if (this.deepQueue.length > 0) {
                if (this.activeFastCount > 0) {
                    // Pause Deep processing while Fast is busy
                    // console.log("[Sync] ⏸️ Deep Sync Paused (Fast Queue Busy)");
                } else if (!this.isDeepSyncing) {
                    this.isDeepSyncing = true;
                    const task = this.deepQueue.shift();

                    console.log(`[Sync] 🐢 Dispatching DEEP Task: ${task.symbol} ${task.timeframe}`);

                    try {
                        const result = await this.executeSyncTask(task);
                        if (task.resolve) task.resolve(result);
                    } catch (err) {
                        console.error(`[Sync] Deep Task Error:`, err);
                        if (task.reject) task.reject(err);
                    } finally {
                        this.isDeepSyncing = false;
                        // Recursive call to process next item
                        this.processQueue();
                    }
                }
            }

        } finally {
            this.isProcessingQueue = false;
        }
    }


    // --- PUSH PROTOCOL HANDSHAKE ---
    sendConfigHandshake(botId) {
        console.log(`[Sync] 🤝 Sending Configuration Handshake to ${botId}...`);

        // Filter symbols for this bot
        const internalSymbols = this.configuredSymbols.filter(c =>
            (!c.botId || c.botId === botId)
        ).map(c => c.datafeedSymbol || c.symbol);

        if (internalSymbols.length === 0) {
            console.log(`[Sync] ⚠️ No symbols configured for ${botId}. Skipping Handshake.`);
            return;
        }

        const cmd = {
            type: "CMD_CONFIG_SYMBOLS",
            content: {
                symbols: internalSymbols
            }
        };

        db.logMessage({
            type: cmd.type,
            content: cmd.content,
            botId: botId,
            sender: 'App'
        });
    }


    getServerTime() {
        return this.lastKnownServerTime || Date.now();
    }

    updateServerTime(timestamp) {
        if (timestamp > this.lastKnownServerTime) {
            this.lastKnownServerTime = timestamp;
        }
    }

    // ✅ PERFORMANCE FIX: Rebuild Symbol Maps for O(1) Lookups
    // Called when configuredSymbols changes (initialization, config update)
    rebuildSymbolMaps() {
        this.symbolToBotMap.clear();
        this.symbolToConfigMap.clear();
        this.botToSymbolsMap.clear();

        this.enrichConfiguredSymbols(); // Ensure datafeedSymbol is populated from DB

        for (const item of this.configuredSymbols) {
            const symbol = item.symbol || item.originalName || item;
            const botId = item.botId;

            if (typeof symbol === 'string') {
                // Map symbol -> botId
                if (botId) {
                    this.symbolToBotMap.set(symbol, botId);
                }

                // Map symbol -> config
                if (typeof item === 'object') {
                    this.symbolToConfigMap.set(symbol, item);

                    // Also map originalName if different
                    if (item.originalName && item.originalName !== symbol) {
                        this.symbolToConfigMap.set(item.originalName, item);
                        if (botId) this.symbolToBotMap.set(item.originalName, botId);
                    }
                }

                // Map botId -> symbols
                if (botId) {
                    if (!this.botToSymbolsMap.has(botId)) {
                        this.botToSymbolsMap.set(botId, new Set());
                    }
                    this.botToSymbolsMap.get(botId).add(symbol);
                }
            }

            // REVERSE MAPPING (Broker -> Internal) for Ingestion
            // Keys: "BotID:BrokerSymbol" (Specific) AND "BrokerSymbol" (Generic Fallback)
            const mappedName = item.datafeedSymbol || item.symbol || item; // The name the broker uses

            if (botId && mappedName) {
                // Specific: "FundedNext_123:SPX500" -> Config
                this.brokerSymbolToConfigMap.set(`${botId}:${mappedName}`, item);
            }
            if (mappedName) {
                // Generic: "SPX500" -> Config (First wins? Or conflict?)
                // Generally we want to map back to original. 
                // If we have "US500", "US500.cash", "SPX500", we map them all pointing to "US500" config.
                if (!this.brokerSymbolToConfigMap.has(mappedName)) {
                    this.brokerSymbolToConfigMap.set(mappedName, item);
                }
            }
        }

        console.log(`[Sync] 🗺️ Rebuilt Symbol Maps: ${this.symbolToBotMap.size} symbols, ${this.botToSymbolsMap.size} bots, ${this.brokerSymbolToConfigMap.size} reverse mappings.`);
    }

    // Task 0156: Global Config Enrichment
    enrichConfiguredSymbols() {
        if (!this.configuredSymbols) return;

        // Pull ALL mappings from AssetMappingService
        // (It caches internally, so this is fast-ish, but check DB overhead?)
        // AssetMappingService constructor loads Cache.
        const assetMappingService = require('./AssetMappingService');
        const allMappings = assetMappingService.getAllMappings();

        // Optimize lookup
        const mappingMap = new Map();
        allMappings.forEach(m => mappingMap.set(m.originalSymbol, m.datafeedSymbol));

        let enrichedCount = 0;
        this.configuredSymbols.forEach(c => {
            const mapped = mappingMap.get(c.symbol);
            if (mapped && c.datafeedSymbol !== mapped) {
                c.datafeedSymbol = mapped;
                enrichedCount++;
            }
        });

        if (enrichedCount > 0) {
            console.log(`[Sync] ✨ Enriched ${enrichedCount} symbols with Asset Mapping Data.`);
        }
    }
}

module.exports = new SyncManager();
