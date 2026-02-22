const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const db = require('./DatabaseService');
const config = require('../config');
const logService = require('./LogService');
const assetMappingService = require('./AssetMappingService');

const wsManager = require('../framework/transport/WebSocketManager');

const { Worker } = require('worker_threads');
const workerFactory = require('../framework/worker/WorkerFactory'); // NEW: Import Factory
const botConfigService = require('./BotConfigService'); // NEW: Config Service

class SystemOrchestrator {
    constructor() {
        this._instanceId = Math.random().toString(36).substring(7);
        console.log(`[SystemOrchestrator] 🏗️ CONSTRUCTOR CALLED (Instance ${this._instanceId})`);
        this.socketServer = null;
        this.db = db; // FIX: Expose DB Service to instance methods

        this.botServers = new Map();
        // --- STRICT WORKER REGISTRY ---
        // Key: routingKey (BotId:Function:Symbol)
        this.workers = new Map();

        // Async Processing Queue
        this.msgQueue = [];
        this.isProcessingQueue = false;
        this.msgQueue = [];
        this.isProcessingQueue = false;

        // --- SYNC MANAGER STATE ---
        this.availableSymbols = [];
        this.configuredSymbols = db.getConfig('selected_symbols') || [];

        console.log(`[SystemOrchestrator:${this._instanceId}] Loaded state: ${this.availableSymbols.length} available, ${this.configuredSymbols.length} configured.`);

        // --- TASK 0119: GLOBAL PROACTIVE PROVISIONING (DISABLED BY USER REQUEST) ---
        // Spawn Workers for ALL configured symbols immediately.
        // setTimeout(() => this.provisionWorkers(), 1000); 
        console.log("[Sync] 🛑 Global Provisioning DISABLED. Waiting for TickSpy...");

        // FAILSAFE: Purge Stale Commands from previous sessions (Older than 1 min)
        // This prevents "Death Spiral" leftovers from flooding the pipe on startup.
        db.purgeStaleCommands(60000);

        // --- FEATURES / TOGGLES ---
        this.features = { ...config.DEFAULT_FEATURES, ...db.getConfig('features') };
        // FORCE ENABLE (User Request: Heartbeat Monitor)
        this.features.ENABLE_PERIODIC_SANITY_CHECK = true;
        console.log("[SyncManager] 🎛️ Loaded Features:", JSON.stringify(this.features, null, 2));

        // INJECT FEATURES INTO PROTOCOL (Dynamic Logging)
        const unifiedBotProtocol = require('../framework/protocol/UnifiedBotProtocol');
        unifiedBotProtocol.setFeatures(this.features);

        // Start Heartbeat Monitor immediately



        this.activeSubscriptions = new Map();
        // this.sessions = new Map(); // REMOVED (Merged to Workers)
        // this.symbolToSessionMap = new Map(); // REMOVED
        // this.historySessions = new Map(); // REMOVED
        this.botStatus = {};

        // REMOVED: datafeedBots and tradingBots (Incorrect Implementation)
        // We rely on botStatus and Database Config.

        this.activeFocus = null;

        // Fix for Socket Spam Loop
        this._disconnectingBots = new Set();

        this.syncStatus = new Map();
        this.syncLockState = new Map(); // STRICT CONSISTENCY LOCK

        // Bind methods
        this.onBotConnected = this.onBotConnected.bind(this); // STRICT CONSISTENCY LOCK
        this.hotCandles = new Map();

        // ✅ PERFORMANCE FIX: Map-based Symbol Lookup (O(1) instead of O(n))
        // Eliminates 100,000+ array comparisons/second during tick processing
        this.symbolToBotMap = new Map();      // symbol -> botId
        this.symbolToConfigMap = new Map();   // symbol -> config object
        this.botToSymbolsMap = new Map();     // botId -> Set of symbols
        this.brokerSymbolToConfigMap = new Map(); // BrokerSymbol -> ConfigObject (Reverse)

        // Hydrate from DB on startup (Fix for offline configuration availability)
        this.refreshAvailableSymbols();

        this.rebuildSymbolMaps();

        // Time Tracking (Data-Driven)
        this.lastKnownServerTime = 0;

        // Queues (Separate for strict prioritization)
        this.isSyncing = false;

        // --- TASK 0300: Monitoring ---
        this.startSystemFileMonitor(); // Start monitoring MQL5 files

        // --- ASSET MAPPING EVENTS ---
        assetMappingService.on('symbols_ingested', (data) => {
            console.log('[SystemOrchestrator] 📨 RX symbols_ingested Event. Data Type:', typeof data);
            if (typeof data === 'object') {
                console.log('[SystemOrchestrator] Keys:', Object.keys(data));
                console.log('[SystemOrchestrator] Symbols Type:', Array.isArray(data.symbols) ? 'Array' : typeof data.symbols);
                console.log('[SystemOrchestrator] BotId:', data.botId);
            } else {
                console.log('[SystemOrchestrator] Data Value:', data);
            }
            const { symbols, botId } = data;
            this.broadcastAvailableInstruments(symbols, botId);
        });

        // --- WEBSOCKET MANAGER EVENTS ---
        wsManager.on('connected', (data) => {
            // data: { routingKey, id, func, symbol, socket }
            console.log(`[SysOrch:Connect] 🟢 NEW CONNECTION: RoutingKey=${data.routingKey}, ID=${data.id}, Func=${data.func}, Sym=${data.symbol}`);

            if (data.routingKey && !this.botStatus[data.routingKey]) {

                // 2. Setup/Routing
                // The existing onBotConnected call is at the end of the wsManager.on('connected') handler.
                // We should not duplicate it here. The original instruction seems to imply a different structure.
                // For now, we only insert the account auto-discovery logic.
                // The existing `this.onBotConnected(data)` at the end of the `wsManager.on('connected')` block will handle the rest.
                this.botStatus[data.routingKey] = {
                    id: data.id,
                    routingKey: data.routingKey,
                    function: data.func,
                    symbol: data.symbol,
                    platform: data.provider === 'NinjaTrader' || data.provider === 'Apex' ? 'NT8' : 'MT5', // Store Platform
                    connected: true,
                    lastSeen: Date.now()
                };
                console.log(`[SysOrch:Connect] Registered NEW Bot Status: ${data.routingKey}`);
            } else if (data.routingKey) {
                this.botStatus[data.routingKey].connected = true;
                this.botStatus[data.routingKey].lastSeen = Date.now();
                console.log(`[SysOrch:Connect] Re-Connected Existing Bot: ${data.routingKey}`);
            }

            // --- TIMEZONE REGISTRATION (RE-APPLIED) ---
            try {
                const tzService = require('./TimezoneNormalizationService');
                // If handshake has timezone, use it. Otherwise use Config/Default.
                // For now, we assume EET (FTMO etc) if not specified.
                const tzSignature = data.timezone || "EET";
                tzService.registerBotTimezone(data.id, tzSignature);
            } catch (e) {
                console.error("[SysOrch] Failed to register timezone:", e);
            }

            this.onBotConnected(data);
        });

        wsManager.on('disconnected', (data) => {
            // data: { routingKey }
            this.onBotDisconnected(data);
        });

        wsManager.on('activity', (data) => {
            // data: { routingKey, timestamp }
            if (data.routingKey && this.botStatus[data.routingKey]) {
                this.botStatus[data.routingKey].lastSeen = data.timestamp;
                this.botStatus[data.routingKey].connected = true;
            }
        });

        // Start Monitor
        this.startHeartbeatMonitor();

        // FAILSAFE: Reset DB Status on Startup
        this.resetAllBotStatuses();

        // FAILSAFE: Start Process Monitor (Verification against OS)
        this.startProcessMonitor();

        // TASK: System File Monitoring
        this.startSystemFileMonitor();
    }

    // --- HELPER METHODS ---

    startProcessMonitor() {
        // Run every 10 seconds
        setInterval(() => {
            this.checkProcessLiveness();
        }, 10000);
    }

    checkProcessLiveness() {
        // Only valid on Windows for now (tasklist)
        if (process.platform !== 'win32') return;

        exec('tasklist /FI "IMAGENAME eq terminal64.exe" /FO CSV /NH', (err, stdout, stderr) => {
            if (err) {
                console.error(`[ProcessMonitor] Failed to run tasklist: ${err.message}`);
                return;
            }

            // Parse CSV output
            // Format: "terminal64.exe","1234","Console","1","50,000 K"
            const lines = stdout.split('\r\n');
            const runningPids = new Set();
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const pidStr = parts[1].replace(/"/g, '');
                    const pid = parseInt(pidStr, 10);
                    if (!isNaN(pid)) runningPids.add(pid);
                }
            });

            // Compare against DB Records
            const accounts = this.db.getAccounts();
            let updates = 0;

            accounts.forEach(acc => {
                // If tracked as RUNNING with a PID
                if (acc.status === 'RUNNING' && acc.pid > 0) {
                    if (!runningPids.has(acc.pid)) {
                        console.warn(`[ProcessMonitor] 💀 DEAD PROCESS DETECTED: ${acc.botId} (PID: ${acc.pid}) is NOT running.`);

                        // Force STOP
                        acc.status = 'STOPPED';
                        acc.pid = 0; // Clear it so frontend knows it's gone
                        this.db.saveAccount(acc);
                        updates++;
                    }
                }
            });

            if (updates > 0) {
                console.log(`[ProcessMonitor] Cleaned up ${updates} dead processes.`);
            }
        });
    }

    // --- SYSTEM FILE MONITORING ---

    startSystemFileMonitor() {
        // Initial Emit
        setTimeout(() => this.broadcastSystemFileStats(), 2000);

        // Poll every 30 seconds (FS operations are cheap but don't overdo it)
        setInterval(() => {
            this.broadcastSystemFileStats();
        }, 30000);
    }

    async getSystemFileStats() {
        const masterDir = config.MT5_MQL5_DIR;
        // If config not set or default placeholder, warn?
        if (!masterDir || masterDir.includes('D0E8209F77C8CF37AD8BF550E51FF075')) {
            // Just a check, handled in Try/Catch
        }

        const filesToMonitor = [
            { id: 'datafeed_expert', path: 'Experts\\DatafeedExpert.ex5', name: 'DatafeedExpert.ex5' },
            { id: 'trading_expert', path: 'Experts\\TradingExpert.ex5', name: 'TradingExpert.ex5' },
            { id: 'tickspy', path: 'Indicators\\TickSpy.ex5', name: 'TickSpy.ex5' },
            { id: 'history_worker', path: 'Indicators\\HistoryWorker.ex5', name: 'HistoryWorker.ex5' },
            { id: 'web_bridge', path: 'Libraries\\MT5WebBridge.dll', name: 'MT5WebBridge.dll' }
        ];

        const stats = [];

        for (const file of filesToMonitor) {
            try {
                const fullPath = path.join(masterDir, file.path);
                if (fs.existsSync(fullPath)) {
                    const fstat = fs.statSync(fullPath);
                    stats.push({
                        ...file,
                        mtime: fstat.mtime.toISOString(),
                        size: fstat.size,
                        exists: true
                    });
                } else {
                    stats.push({ ...file, exists: false, mtime: null });
                }
            } catch (e) {
                stats.push({ ...file, exists: false, error: e.message });
            }
        }
        return stats;
    }

    async broadcastSystemFileStats() {
        try {
            const stats = await this.getSystemFileStats();
            if (this.socketServer && this.socketServer.io) {
                this.socketServer.io.emit('system_files_update', stats);
            }
        } catch (e) {
            console.error('[SystemMonitor] Failed to broadcast file stats:', e);
        }
    }

    // --- RESTART LOGIC ---

    async restartAccounts(type, targetId = null) {
        console.log(`[System:Restart] Requested: ${type} (Target: ${targetId || 'N/A'})`);

        const accounts = this.db.getAccounts();
        const targets = [];

        if (type === 'SINGLE' && targetId) {
            const acc = accounts.find(a => a.id === targetId || a.botId === targetId);
            if (acc) targets.push(acc);
        } else if (type === 'ACTIVE') {
            // Restart only currently RUNNING accounts
            // OR connected accounts?
            // "Alle aktive" -> All currently running/connected.
            // Check botStats for connection or DB for RUNNING
            accounts.forEach(acc => {
                if (acc.status === 'RUNNING' || this.isBotOnline(acc.id)) {
                    targets.push(acc);
                }
            });
        } else if (type === 'ALL') {
            // Restart ALL accounts (STOPPED ones too)
            targets.push(...accounts);
        }

        console.log(`[System:Restart] identified ${targets.length} targets.`);

        for (const acc of targets) {
            await this.restartAccount(acc);
        }
    }

    async restartAccount(acc) {
        console.log(`[System:Restart] Restarting ${acc.name} (${acc.platform})...`);

        // 1. Terminate Internal Worker (if any)
        // Datafeed/TickSpy are usually shared or specific.
        // If it's a full account restart, we assume external terminal restart.

        if (acc.platform === 'MT5') {
            // EXECUTE SCRIPT
            const scriptPath = path.join(__dirname, '../../scripts/restart_terminal.ps1');

            const pid = acc.pid || 0;
            const instancePath = acc.instancePath || '';
            const configPath = instancePath ? path.join(instancePath, 'config', 'common.ini') : '';

            // Use instance-specific executable if possible
            let exePath = config.MT5_TERMINAL_EXE;
            if (instancePath) {
                exePath = path.join(instancePath, 'terminal64.exe');
            }

            // Spawn PowerShell
            const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -ProcessName "terminal64" -ExecutablePath "${exePath}" -InstancePath "${instancePath}" -ConfigPath "${configPath}" -PidToKill ${pid}`;

            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    console.error(`[System:Restart] Failed to restart ${acc.name}:`, err);
                } else {
                    console.log(`[System:Restart] Output for ${acc.name}:`, stdout.trim());
                }
            });

            // Update DB Status temporarily?
            // ProcessMonitor will detect it anyway.
        } else if (acc.platform === 'NT8') {
            // NT8 restart logic (different script/exe)
            console.log(`[System:Restart] NT8 Restart not fully implemented yet.`);
        }
    }

    // TASK: Ensure DB reflects Reality
    resetAllBotStatuses() {
        try {
            const accounts = db.getAccounts();
            let changed = false;
            accounts.forEach(acc => {
                // If it was marked RUNNING, but we just restarted, it's stale (unless confirmed otherwise).
                // We set it to STOPPED. It will auto-switch to RUNNING when the bot reconnects.
                // FIX: Also clear PID, otherwise SocketServer thinks it's running via PID check.
                if (acc.status === 'RUNNING' || (acc.pid && acc.pid > 0)) {
                    acc.status = 'STOPPED';
                    acc.pid = 0; // Clear Stale PID
                    db.saveAccount(acc);
                    changed = true;
                    console.log(`[Sync] 🛑 Startup Cleanup: Mark ${acc.botId} as STOPPED (PID Cleared).`);
                }
            });
            if (changed) console.log(`[Sync] 🧹 Startup: Reset Stale Bot Statuses complete.`);
        } catch (e) {
            console.error(`[Sync] Startup Status Reset Failed:`, e);
        }
    }

    updateBotDbStatus(botId, status) {
        if (!botId) return;
        try {
            const accounts = db.getAccounts();
            const acc = accounts.find(a => a.botId === botId || a.id === botId);
            if (acc) {
                // Only update if changed
                let shouldSave = false;
                if (acc.status !== status) {
                    acc.status = status;
                    shouldSave = true;
                }

                // If STOPPED, ensure PID is cleared
                if (status === 'STOPPED' && acc.pid !== 0) {
                    acc.pid = 0;
                    shouldSave = true;
                }

                if (shouldSave) {
                    // Also update Connection Status implicitly?
                    // Frontend uses 'brokerConnectionStatus' derived from 'botStatus' RAM.
                    // 'status' is OS Process State.
                    db.saveAccount(acc);
                    console.log(`[Sync] 📝 DB Update: ${botId} -> ${status} (PID: ${acc.pid})`);
                }
            }
        } catch (e) {
            console.error(`[Sync] DB Status Update Failed for ${botId}:`, e);
        }
    }

    setSocketServer(socketServer) {
        this.socketServer = socketServer;
        console.log(`[SystemOrchestrator:${this._instanceId}] SocketServer linked. Keys:`, Object.keys(socketServer));
        if (socketServer.io) console.log(`[SystemOrchestrator:${this._instanceId}] SocketServer has IO instance.`);
        else console.warn(`[SystemOrchestrator:${this._instanceId}] ⚠️ SocketServer MISSING IO instance!`);
    }

    // resolveBotId removed as it breaks dynamic worker routing

    getRoutingKey(botId, func, symbol) {
        return wsManager.makeKey(botId, func, symbol);
    }

    // --- STRICT EVENT HANDLERS ---


    // --- TASK 0239: Datafeed Status Broadcast (Frontend) ---
    refreshSymbolDatafeedStatus(symbol) {
        if (!symbol) return;

        // Logic: Check if ANY 'TICK_SPY' bot is online for this symbol
        // Function Key: TICK_SPY:SYMBOL
        const isOnline = this.isBotOnline(`TICK_SPY:${symbol}`);
        const status = isOnline ? 'READY' : 'OFFLINE';

        console.log(`[Sync] 📡 Datafeed Status Refresh: ${symbol} -> ${status}`);

        // Broadcast to specific symbol room (Chart listens to this)
        // Using 'sync_status' event which useChartData.ts listens to (mapped via sanity_update or direct)
        // Wait, useChartData listens to 'sanity_update' or '/sync-status' endpoint.
        // It DOES NOT listen to 'sync_status' directly? 
        // Let's check socketServer.io.emit usage.

        // We update internal state first
        // We iterate all timeframes to set them all? Or just a generic status?
        // The UI checks specific TFs. We should update all TFs for this symbol.

        const knownTFs = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1']; // Common ones
        knownTFs.forEach(tf => {
            this.updateSyncStatus(symbol, tf, status, 'Datafeed Status');
        });

        // Broadcast Event (Legacy 'sanity_update' for compatibility)
        if (this.socketServer && this.socketServer.io) {
            this.socketServer.io.emit('sanity_update', {
                symbol: symbol,
                status: status,
                timestamp: Date.now()
            });
        }
    }

    handleBotRegister(routingKey, payload) {
        // payload: { id, func, symbol, ... }
        // FIX: Extract ID from routingKey or payload
        const id = payload.id || routingKey.split(':')[0];
        const func = payload.func || 'UNKNOWN';
        const symbol = payload.symbol || 'ALL';

        console.log(`[SystemOrchestrator] 📝 Bot Register: ${routingKey} (Func: ${func})`);

        // --- AUTO-DISCOVERY (NinjaTrader 8) ---
        if (func === 'TRADING' && payload.provider) {
            console.log(`[SystemOrchestrator] 🆕 Auto-Discovering NT8 Account: ${payload.accountName} (${payload.provider})`);

            const accountData = {
                id: id,
                name: payload.accountName,
                brokerId: payload.provider,
                platform: 'NT8',
                type: payload.accountType,
                login: payload.accountName,
                currency: 'USD',
                leverage: 1,
                balance: 0,
                equity: 0,
                isTest: payload.accountType === 'SIMULATION',
                isConnected: true,
                status: 'RUNNING',
                pid: 0 // Bridge managed
            };

            this.db.saveAccount(accountData);
        }

        // 1. Update In-Memory Status
        this.botStatus[routingKey] = {
            id,
            routingKey,
            function: func,
            symbol,
            connected: true, // Mark as Connected
            lastSeen: Date.now(),
            type: func // Store Type (TICK_SPY, TRADE, etc.)
        };

        // 2. Persist to DB (Debounced?)
        // We only persist 'RUNNING' state for the BotID (Account).
        // Individual connections are ephemeral.
        this.updateBotDbStatus(id, 'RUNNING');

        // 3. Trigger Handshakes / Re-Sync
        if (func === 'DATAFEED') {
            // ... existing datafeed logic ...
            this.sendConfigHandshake(id);
        }
        else if (func === 'TICK_SPY') {
            // NEW: Broadcast "ONLINE" status for this symbol
            this.refreshSymbolDatafeedStatus(symbol);
        }
        else if (func === 'DISCOVERY') {
            console.log(`[SystemOrchestrator] 🔍 Discovery Bot Registered: ${id}. Spawning Worker...`);
            // Worker spawning happens below naturally using 'func'
        }

        // 4. Resolve Promises (if any were waiting for this bot)
        // ...

        // Check/Spawn Worker
        if (!this.workers.has(routingKey)) {
            console.log(`[SystemOrchestrator] 🏭 Spawning Worker for ${routingKey}...`);
            this.spawnWorker(routingKey, id, func, symbol);
        } else {
            // ... Worker exists logic
        }
    }



    // --- Datafeed Symbol Aggregation ---
    refreshAvailableSymbols() {
        // STRICT ON-DEMAND FETCH: Get Symbols for all Datafeed Accounts from DB
        console.log(`[SystemOrchestrator] 🔄 Refreshing Available Symbols (Direct DB Fetch)...`);

        const accounts = this.db.getAccounts() || [];
        const datafeedAccounts = accounts.filter(a => a.accountType === 'DATAFEED' || a.isDatafeed);

        let allSymbols = [];
        const seen = new Set();

        const addSymbol = (s, sourceBotId) => {
            const name = (typeof s === 'string') ? s : s.name;
            const key = `${sourceBotId}:${name}`;

            if (!seen.has(key)) {
                seen.add(key);
                allSymbols.push({
                    name: name,
                    botId: sourceBotId,
                    path: (typeof s === 'object' && s.path) ? s.path : 'Unknown',
                    desc: (typeof s === 'object' && s.desc) ? s.desc : '',
                    digits: (typeof s === 'object' && s.digits) ? s.digits : 5
                });
            }
        };

        // Iterate Datafeed Accounts (Source of Truth)
        datafeedAccounts.forEach(acc => {
            const brokerId = acc.brokerId;
            const botId = acc.botId || acc.id;

            if (brokerId && botId) {
                const symbols = this.db.getBrokerSymbols(brokerId);
                if (symbols && Array.isArray(symbols)) {
                    symbols.forEach(s => addSymbol(s, botId));
                }
            }
        });

        // 4. Expose & Emit
        this.availableSymbols = allSymbols;
        console.log(`[SystemOrchestrator] 🔄 Refreshed Available Symbols. Total Count: ${allSymbols.length}`);

        // Push update to UI via SocketServer
        if (this.socketServer && this.socketServer.io) {
            this.socketServer.io.emit('all_symbols_list', allSymbols);
        } else if (this.socketServer && this.socketServer.emit) {
            this.socketServer.emit('all_symbols_list', allSymbols);
        }
    }

    onBotDisconnected(data) {
        const { routingKey } = data;
        const status = this.botStatus[routingKey];

        if (status) {
            console.log(`[SystemOrchestrator] 🔌 Bot Disconnected: ${routingKey}`);
            status.connected = false;
            status.lastSeen = Date.now();
            this.updateBotDbStatus(status.id, 'STOPPED');

            // TASK 0239: Trigger Status Refresh
            if (status.function === 'TICK_SPY' && status.symbol) {
                // Wait briefly for transient disconnects? 
                // No, strict status. If it reconnects, it will flip back to READY.
                this.refreshSymbolDatafeedStatus(status.symbol);
            }

        }

        // TASK: Broadcasting OFFLINE Status to Frontend - handled by refreshSymbolDatafeedStatus above.
        // Legacy 'affectedSymbols' logic removed in favor of centralized refreshSymbolDatafeedStatus.
    }

    startHeartbeatMonitor() {
        setInterval(() => {
            const now = Date.now();
            const staleThreshold = 3000; // USER REQUEST: 3 Seconds (Aggressive)

            Object.entries(this.botStatus).forEach(([key, status]) => {
                // Skip if no lastSeen (Just connected)
                if (!status.lastSeen) return;

                if (now - status.lastSeen > staleThreshold) {
                    if (status.connected) {
                        if (!this._disconnectingBots.has(key)) {
                            this._disconnectingBots.add(key);
                            console.log(`[Heartbeat] 💀 Connectivity Lost: ${key} (> ${staleThreshold}ms). Closing Socket.`);
                            status.connected = false;

                            // FORCE CLOSE SOCKET (Unified Protocol)
                            // This will trigger 'close' event -> onBotDisconnected
                            const wsManager = require('../framework/transport/WebSocketManager');
                            const transportId = wsManager.getTransportIdByKey(key);
                            if (transportId) {
                                wsManager.close(transportId);
                            } else {
                                this.onBotDisconnected({ id: status.id });
                            }

                            // Cleanup set after delay to allow reconnection logic to fire
                            setTimeout(() => this._disconnectingBots.delete(key), 5000);
                        }
                    }

                    // USER REQUEST: Final Termination (Remove from Log / Map)
                    if (now - status.lastSeen > 10000) {
                        // console.log(`[Heartbeat] 🗑️ PURGING Dead Bot: ${key}`);
                        delete this.botStatus[key];
                    }
                }
            });
        }, 1000); // Check every second
    }

    // --- HEARTBEAT & LIVENESS (Fix for Timeout) ---
    refreshBotHeartbeat(botId) {
        this.handleHeartbeat(botId);
    }

    handleHeartbeat(routingKey, payload) {
        if (!routingKey) return;

        // STRICT: Update the specific connection status
        if (this.botStatus[routingKey]) {
            this.botStatus[routingKey].lastSeen = Date.now();
            // console.log(`[Heartbeat] 💓 ${ routingKey } `);
        }
    }



    removeWorker(routingKey) {
        const worker = this.workers.get(routingKey);
        if (worker) {
            console.log(`[SystemOrchestrator] 🗑️ Terminating Worker: ${routingKey} `);
            worker.terminate();
            this.workers.delete(routingKey);
        }
    }



    /**
     * Sends a command to a specific destination (Bot or Worker).
     * Strict Signature: (routingKey, commandName, payload)
     */
    sendCommand(routingKey, commandName, payload, requestId = null) {
        // --- BACKWARD COMPATIBILITY (TradeDistributionService) ---
        if (typeof routingKey === 'object' && routingKey !== null && !commandName) {
            const cmd = routingKey;
            // Map Legacy Object to Strict Params
            // Legacy: { botId, type, content, ... }
            if (cmd.botId && cmd.type) {
                // console.log(`[SystemOrchestrator] ⚠️ Legacy sendCommand detected.Mapping ${ cmd.type } -> ${ cmd.botId } `);
                return this.sendToBot(cmd.botId, cmd.type, cmd.content || cmd.payload || {}, requestId);
            }
        }

        if (!routingKey || !commandName) {
            console.error(`[SystemOrchestrator] ❌ sendCommand: Missing Routing Params.`, routingKey, commandName);
            return false;
        }

        // Determine Target
        // Logic: "Workers" are internal. "Bots" are external.
        // We assume this method is primarily for EXTERNAL Bot Communication via Socket.
        // If we want to send to Worker, use 'sendToWorker'.

        return this.sendToBot(routingKey, commandName, payload, requestId);
    }

    // Alias for code calling this specific name
    sendCommandToBot(routingKey, commandName, payload, requestId = null) {
        return this.sendToBot(routingKey, commandName, payload, requestId);
    }

    getWorkerBySymbol(func, symbol) {
        if (!func || !symbol) return null;
        const cleanFunc = func.trim();
        const cleanSymbol = symbol.trim();
        // Strict Suffix: :FUNC:SYMBOL
        const suffix = `:${cleanFunc}:${cleanSymbol}`;

        for (const [key, worker] of this.workers) {
            if (key.endsWith(suffix)) return worker;
        }

        // Debug: Why not found?
        // Only log if it's not a common probe
        if (cleanFunc === 'TICK_SPY') {
            // console.warn(`[SystemOrchestrator] ⚠️ Worker Lookup Failed. Suffix: '${suffix}'. Available: ${Array.from(this.workers.keys()).join(', ')}`);
        }
        return null;
    }

    sendToWorker(func, symbol, payload) {
        // 1. Strict Suffix Lookup (Bypass BotID resolution)
        const worker = this.getWorkerBySymbol(func, symbol);

        if (worker) {
            worker.postMessage(payload);
            return true;
        }

        console.warn(`[SystemOrchestrator] ⚠️ Worker NOT FOUND: ${func}:${symbol}`);
        return false;
    }

    sendToWorkerByKey(routingKey, payload) {
        const worker = this.workers.get(routingKey);
        if (worker) {
            worker.postMessage(payload);
            return true;
        }
        console.warn(`[SystemOrchestrator] ⚠️ Worker NOT FOUND for Key: ${routingKey}`);
        return false;
    }

    /**
     * Routes a message from UnifiedBotProtocol to the correct Worker.
     * Uses strict func:symbol matching.
     */
    routeToWorker(msg) {
        // msg: { botId, func, symbol, type, payload, ... }
        const { func, symbol } = msg;

        if (!func || !symbol) {
            console.warn(`[SystemOrchestrator] ⚠️ Cannot route message directly to worker. Missing metadata: ${JSON.stringify(msg)}`);
            return false;
        }

        const worker = this.getWorkerBySymbol(func, symbol);
        if (worker) {
            // Forward entire message (Worker expects full envelope with type)
            // But we ensure payload/content is standardized if needed?
            // AbstractWorker passes msg to _handleMessage -> switch(msg.type).
            // So we send 'msg' as is.
            worker.postMessage(msg);
            return true;
        } else {
            // Optional: buffer if startup race condition?
            // For now: Log distinct warning
            console.warn(`[SystemOrchestrator] ⚠️ No Worker active for ${func}:${symbol}. Msg Type: ${msg.type}`);
            return false;
        }
    }

    sendToBot(routingKey, commandName, payloadData, existingRequestId = null) {
        let socket = wsManager.getSocket(routingKey);

        // AUTO-RESOLVE: If routingKey is just a BotID (e.g. "FTMO_123"), find the "TRADING" socket
        if (!socket) {
            // Iterate keys to find match starting with botId + ":"
            const keys = Array.from(wsManager.sockets.keys());
            for (const key of keys) {
                if (key.startsWith(routingKey + ":") && (key.includes(":TRADING:") || key.endsWith(":ALL"))) {
                    // console.log(`[SystemOrchestrator] 🔍 Auto - Resolved BotID ${ routingKey } -> ${ key } `);
                    socket = wsManager.getSocket(key);
                    break;
                }
            }
        }

        if (!socket) {
            console.warn(`[SystemOrchestrator] ⚠️ Bot Socket NOT FOUND: ${routingKey} `);
            // DEBUG: List available keys to see mismatch
            console.warn(`[SystemOrchestrator] 📋 Available Sockets: ${Array.from(wsManager.sockets.keys()).join(', ')} `);
            return false;
        }

        // --- PROTOCOL ENVELOPE (Strict Clean) ---
        // Header: Command Name, ID, Timestamp
        // Payload: The actual data (UNWRAPPED)
        const finalRequestId = existingRequestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        const envelope = {
            header: {
                command: commandName,
                request_id: finalRequestId,
                timestamp: Math.floor(Date.now() / 1000)
            },
            payload: payloadData || {} // Raw Payload
        };

        try {
            const data = JSON.stringify(envelope);

            if (socket.send && socket.readyState === 1) {
                socket.send(data);
                console.log(`[SystemOrchestrator] 📤 To Bot(${routingKey}): ${commandName}`);
                return true;

            }
        } catch (e) {
            console.error(`[SystemOrchestrator] 💥 Send Error(${routingKey}): `, e.message);
        }

        return false;
    }

    handleBotRegister(connectionId, payload) {
        const id = payload.id || payload.botId;
        const func = payload.function || payload.func || 'UNKNOWN';
        const symbol = payload.symbol;

        // Ensure we don't have dual-entry with WSManager
        // SocketServer calls this directly.

        // Update DB Status to RUNNING
        this.updateBotDbStatus(id, 'RUNNING');

        // FIX: If connectionId is null (Legacy Pipe 'REGISTER'), try to recover from WSManager
        let finalConnectionId = connectionId;
        if (!finalConnectionId && wsManager) {
            const compositeKey = wsManager.makeKey(id, func, symbol);
            if (wsManager.compositeIndex.has(compositeKey)) {
                finalConnectionId = wsManager.compositeIndex.get(compositeKey);
                console.log(`[SystemOrchestrator] ♻️ Recovered ConnectionID for ${id}: ${finalConnectionId}`);
            }
        }

        // We just delegate to onBotConnected.
        const routingKey = wsManager.makeKey(id, func, symbol);

        this.onBotConnected({
            routingKey, // Fix: Explicitly pass routingKey
            connectionId: routingKey, // Keep for backward compatibility if needed
            id,
            func,
            symbol
        });
    }

    // --- HEARTBEAT & LIVENESS (Fix for Timeout) ---
    handleHeartbeat(botId, payload) {
        // console.log(`[Heartbeat] 💓 ${ botId } `);

        if (!botId) return;

        // 1. Direct Lookup (if botId is the key)
        if (this.botStatus[botId]) {
            this.botStatus[botId].lastSeen = Date.now();
            this.botStatus[botId].missedHeartbeats = 0;
            return;
        }

        // 2. Search by ID Property (O(N) but necessary for mapped keys)
        // Optimization: Could use a map if this becomes slow.
        for (const key in this.botStatus) {
            const status = this.botStatus[key];
            if (status.id === botId || key.startsWith(botId)) {
                status.lastSeen = Date.now();
                status.missedHeartbeats = 0;
            }
        }
    }

    forwardToWorker(routingKey, message) {
        if (this.workers.has(routingKey)) {
            const worker = this.workers.get(routingKey);
            worker.postMessage(message);
            // console.log(`[SystemOrchestrator] ⏩ Forwarded to ${routingKey}: ${message.type || 'Unknown'}`);
            return true;
        }
        return false;
    }

    // --- GENERIC WORKER SPAWNING ---
    spawnWorker(routingKey, botId, func, symbol, payload = {}) {
        if (this.workers.has(routingKey)) return;

        try {
            // Delegate to Factory. If func is unknown, Factory throws (we catch).
            const worker = workerFactory.createWorker(botId, func, symbol, routingKey, this.features, payload);

            // METADATA ATTACHMENT (Vital for getWorkerForBot lookups)
            worker.botId = botId;
            worker.botFunc = func;
            worker.symbol = symbol;
            worker.routingKey = routingKey;

            // WIRE UP EVENTS
            worker.on('message', (msg) => this.handleWorkerMessage(msg, symbol, null, routingKey));

            worker.on('error', (err) => {
                console.error(`[SystemOrchestrator] 🚨 Worker Error (${routingKey}):`, err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) console.error(`[SystemOrchestrator] 🛑 Worker Exited (${routingKey}) with code ${code}`);
                this.workers.delete(routingKey);
            });

            this.workers.set(routingKey, worker);
            console.log(`[SystemOrchestrator] 🚀 Spawned Worker: ${func} for ${routingKey}`);

        } catch (e) {
            // Valid case: WorkerFactory doesn't support this func.
            console.error(`[SystemOrchestrator] ⚠️ Spawn Failed (${routingKey}): ${e.message}`);
        }
    }

    /**
     * Called when a bot connects (via Socket or Pipe).
     * Handles setup, Worker spawning, and subscription resync.
     */
    onBotConnected(data) {
        const { id, func, symbol, routingKey, connectionId, payload } = data;

        console.log(`[SystemOrchestrator] 🔌 Bot Connected: ${id} (${func}) [${symbol}]`);

        // --- AUTO-DISCOVERY (NinjaTrader 8 / Dynamic Bots) ---
        if (func === 'TRADING' && payload && (payload.provider || payload.accountType)) {
            const existing = this.db.getAccounts().find(a => a.id === id);
            if (!existing) {
                console.log(`[SystemOrchestrator] 🆕 Auto-Discovering NEW Account: ${payload.accountName || id}`);
                // Simple Account Stub
                const accountData = {
                    id: id,
                    name: payload.accountName || id,
                    brokerId: payload.provider || 'UNKNOWN_PROVIDER',
                    platform: id.startsWith('NT8') ? 'NT8' : (payload.platform || 'MT5'),
                    type: payload.accountType || 'TRADING',
                    status: 'RUNNING',
                    isDatafeed: false
                };
                this.db.saveAccount(accountData);
            }
        }

        // 1. Update Internal Status
        const key = routingKey || wsManager.makeKey(id, func, symbol);

        if (!this.botStatus[key]) {
            this.botStatus[key] = {
                id, func, symbol,
                connected: true,
                lastSeen: Date.now(),
                connectionId: connectionId || key
            };
        } else {
            const status = this.botStatus[key];
            status.connected = true;
            status.lastSeen = Date.now();
            status.connectionId = connectionId || key;
        }

        // Timezone Handling
        if (data.timezone) {
            const tzService = require('./TimezoneNormalizationService');
            tzService.registerBotTimezone(id, data.timezone);
            this.botStatus[key].timezone = tzService.getBotZone(id);

            // PERSISTENCE: Save discovered timezone to DB
            this.db.saveAccountTimezone(id, this.botStatus[key].timezone);
        }

        this.updateBotDbStatus(id, 'RUNNING');

        // 2. Handshakes & Resync
        if (func === 'DATAFEED') {
            this.sendConfigHandshake(id); // Push Config
            this.resendSubscriptions(key); // Resend Subs
        }
        else if (func === 'TICK_SPY') {
            this.refreshSymbolDatafeedStatus(symbol);
            this.resendSubscriptions(key);
        }

        // 3. Worker Management
        if (!this.workers.has(key)) {
            this.spawnWorker(key, id, func, symbol);
        } else {
            console.log(`[SystemOrchestrator] ♻️ Re-Connection for existing Worker ${key}`);
            const worker = this.workers.get(key);
            if (worker) {
                worker.postMessage({
                    type: 'CMD_BOT_CONNECTED',
                    botId: id, func, symbol
                });
            }
        }

        // 4. Symbol Discovery
        // LOGIC MOVED TO WORKER (DatafeedWorker.js)
        // The Worker receives CMD_BOT_CONNECTED and initiates the check/request.
        // Orchestrator just logs that it's handing off.
        if (func === 'DATAFEED' || func === 'DISCOVERY') {
            console.log(`[SystemOrchestrator] ⏩ Symbol Discovery delegated to DatafeedWorker for ${id}`);
        }
    }

    /**
     * Checks if a bot/function is online based on strict Key Logic.
     * @param {string} key - RoutingKey (2 colons) or FunctionKey (1 colon)
     */
    isBotOnline(key) {
        if (!key) return false;

        const colons = (key.match(/:/g) || []).length;
        const keys = Object.keys(this.botStatus);

        if (colons >= 2) {
            // Full Routing Key: Exact Match (e.g. FTMO_1:TRADING:ALL)
            const result = this.botStatus[key] && this.botStatus[key].connected;
            if (!result) {
                // Silenced to prevent spam during cross-broker checks
                // console.error(`[isBotOnline] ❌ FAILED Exact Match for '${key}'.\n -> Available Bots(${keys.length}): ${JSON.stringify(keys)}`);
            }
            return result;
        } else if (colons === 0) {
            // Plain BotID (e.g. FTMO_123)
            // Check if ANY routing key starts with this BotID and is connected
            if (this.botStatus[key] && this.botStatus[key].connected) return true;

            const prefix = `${key}:`;
            for (const k of keys) {
                if (k.startsWith(prefix) && this.botStatus[k].connected) {
                    return true;
                }
            }
        } else if (colons === 1) {
            // Function Key: Suffix Match (e.g. TICK_SPY:EURUSD)
            // Check if ANY active bot has this function/symbol pair
            const suffix = `:${key}`;
            for (const k of keys) {
                if (k.endsWith(suffix) && this.botStatus[k].connected) {
                    return true;
                }
            }
            // console.error(`[isBotOnline] ❌ FAILED Suffix Match for '${suffix}'.`);
        }

        return false;
    }

    // --- STATUS & TRADING HANDLERS ---

    handleStatusUpdate(botId, payload) {
        // payload: { account: {...}, expert: {...} }
        // Broadcast to Frontend
        if (this.socketServer && this.socketServer.io) {
            this.socketServer.io.emit('STATUS_UPDATE', {
                botId: botId,
                account: payload.account,
                expert: payload.expert,
                timestamp: Date.now()
            });
            // Also update internal state if needed?
        }
    }



    // --- DUPLICATE REMOVED ---

    getFeatures() {
        return this.features;
    }

    updateFeatures(newFeatures) {
        this.features = { ...this.features, ...newFeatures };
        db.setConfig('features', this.features);
        console.log("[SyncManager] 🎛️ Features Updated:", JSON.stringify(this.features, null, 2));
        return this.features;
    }

    unregisterBot(botId, reason = "Unknown") {
        console.log(`[Sync] 🔌 Unregistering Bot ${botId}: ${reason} `);

        // Update DB Status to STOPPED
        this.updateBotDbStatus(botId, 'STOPPED');

        // This is the Legacy / Heartbeat Cleanup method
        // It should call onBotDisconnected if possible, but it takes botId (Logic ID) not ConnectionID.
        // We iterate botStatus to find the connectionId for this botId?

        let targetConnId = null;
        for (const [connId, status] of Object.entries(this.botStatus)) {
            if (status.id === botId) {
                targetConnId = connId;
                break;
            }
        }

        if (targetConnId) {
            this.onBotDisconnected({
                connectionId: targetConnId,
                descriptor: { id: botId, ...this.botStatus[targetConnId] }
            });
        }
    }

    initNetworkMonitor() {
        if (this.features.ENABLE_TICK_LOGGING) {
            setInterval(() => {
                console.log(`[Sync] 🌐 Network Monitor Active.Bots: ${Object.keys(this.botStatus).length} `);
            }, 60000);
        }
    }

    tryRestoreSymbolsFromCache(assetMappingService) {
        // ... (Keep existing logic)
    }

    unregisterBot(botId, reason = "Unknown") {
        console.log(`[Sync] 🔌 Unregistering Bot ${botId}: ${reason} `);

        // 1. Resolve Connection ID
        let connectionId = botId;
        if (this.botStatus[botId] && this.botStatus[botId].connectionId) {
            connectionId = this.botStatus[botId].connectionId;
        }

        // 2. Clean Status
        delete this.botStatus[botId];
        if (connectionId && this.botStatus[connectionId]) {
            delete this.botStatus[connectionId];
        }

        // 3. Worker Cleanup is handled by 'onBotDisconnected' signal usually.
        // If needed, we could iterate workers and terminate if they match botId.
        // But for now, safe cleanup of status is enough to prevent routing errors.
    }

    initNetworkMonitor() {
        // Simple Interval to check network health or log stats
        // Currently a placeholder to prevent crash
        if (this.features.ENABLE_TICK_LOGGING) {
            setInterval(() => {
                console.log(`[Sync] 🌐 Network Monitor Active.Bots: ${Object.keys(this.botStatus).length} `);
            }, 60000);
        }
    }

    tryRestoreSymbolsFromCache(assetMappingService) {
        console.log("[Sync] ♻️ Attempting to restore symbols from AssetMapping Cache...");
        try {
            const mappings = assetMappingService.getAllMappings();
            if (mappings.length > 0) {
                console.log(`[Sync] Found ${mappings.length} mappings in cache.`);

                // BACKFILL: If configuredSymbols is empty or missing data, restore from Mappings
                if (this.configuredSymbols.length === 0) {
                    console.log("[Sync] ⚠️ Configured Symbols empty. Restoring from Asset Mappings to prevent data loss.");

                    this.configuredSymbols = mappings.map(m => {
                        // datafeedSymbol format: "BotID:Symbol"
                        const parts = m.datafeedSymbol.split(':');
                        const botId = parts.length > 1 ? parts[0] : 'Unknown';
                        return {
                            symbol: m.originalSymbol,
                            botId: botId,
                            originalName: m.originalSymbol
                        };
                    });

                    console.log(`[Sync] Restored ${this.configuredSymbols.length} symbols.`);
                }
            } else {
                console.log("[Sync] AssetMapping Cache is empty.");
            }
        } catch (e) {
            console.error("[Sync] Restore Error:", e);
        }
    }

    notifyBotConnect(symbol, botId, func, connectionId) {
        console.log(`[SystemOrchestrator] 🔔 notifyBotConnect: ${symbol} -> Bot ${botId} (CID: ${connectionId})`);
        this.sendToWorker('TICK_SPY', symbol, {
            type: 'CMD_BOT_CONNECTED',
            botId: botId,
            func: func,
            connectionId: connectionId
        });
    }

    notifyBotDisconnect(symbol, botId) {
        this.sendToWorker('TICK_SPY', symbol, {
            type: 'CMD_BOT_DISCONNECTED',
            botId: botId
        });

        // FIX: Immediately refresh status for all active timeframes to reflect OFFLINE
        this.refreshAllTimeframesForSymbol(symbol);
    }

    refreshAllTimeframesForSymbol(symbol) {
        // Iterate active subscriptions to find timeframes for this symbol
        const seenTfs = new Set();
        for (const key of this.activeSubscriptions.keys()) {
            if (key.startsWith(`${symbol}:`)) {
                const parts = key.split(':');
                if (parts.length >= 2) {
                    const timeframe = parts[1];
                    seenTfs.add(timeframe);
                }
            }
        }

        seenTfs.forEach(tf => this.refreshSymbolDatafeedStatus(symbol, tf));
    }

    refreshSymbolDatafeedStatus(symbol, timeframe) {
        try {
            // 1. Check Data Availability
            const count = db.getCandleCount(symbol, timeframe);
            const hasData = count > 0;

            // 2. Check Bot Status
            const botId = this.resolveBotId(symbol);
            const isBotOnline = botId && this.isBotOnline(botId);

            // 3. Check Gap (Only if we have data)
            let gapExists = false;
            if (hasData) {
                const lastTime = db.getLastTimestamp(symbol, timeframe);
                const tfMs = this.getTfDurationMs(timeframe);
                const now = Date.now();
                // Allow 2 bars tolerance
                const expectedLast = now - (now % tfMs) - (tfMs * 2);
                gapExists = lastTime < expectedLast;
            }

            // 4. Determine Status
            let status = 'READY';
            let statusMsg = 'OK';

            if (!isBotOnline) {
                status = 'OFFLINE';
                statusMsg = 'Bot Disconnected';
            } else if (!hasData) {
                status = 'READY';
                statusMsg = 'Initializing...';
            } else if (gapExists) {
                status = 'READY';
                statusMsg = 'Catching up...';
            } else {
                statusMsg = 'Live';
            }

            // console.log(`[Sync] 🚦 Status Refresh for ${symbol} ${timeframe}: ${status} (Bot: ${isBotOnline})`);

            // 5. Update & Broadcast
            this.updateSyncStatus(symbol, timeframe, status, statusMsg);
            this.broadcastStatus(symbol, status, timeframe);

        } catch (e) {
            console.error(`[Sync] refreshSymbolDatafeedStatus error for ${symbol} ${timeframe}:`, e);
        }
    }

    // --- DUPLICATE REMOVED ---
    // (Consolidated logic is in L422 sendToWorker)

    handleWorkerMessage(msg, symbol, connectionId, routingKey) {
        // KEEP ALIVE
        if (routingKey) this.refreshBotHeartbeat(routingKey);

        if (msg.type === 'CMD_WORKER_READY') {
            console.log(`[SymbolWorker:${symbol}] ✋ Worker Ready.Handshaking... (CID = ${connectionId})`);
            if (this.workers.has(routingKey)) {
                this.workers.get(routingKey).postMessage({
                    type: 'CMD_BOT_CONNECTED',
                    botId: msg.botId || `TickSpy_${symbol}`, // Ensure valid ID
                    func: 'TICK_SPY', // <--- CRITICAL: Enables Protocol Adapter
                    connectionId: connectionId,
                    routingKey: routingKey
                });
                console.log(`[SymbolWorker:${symbol}] 🤝 Handshake Sent(TICK_SPY)`);
            }
            return;
        }
        else if (msg.type === 'LOG') {
            // User Request: Remove internal ConnectionID. Use RoutingKey or Symbol.
            // Format: [SymbolWorker:RoutingKey] Message
            const id = routingKey || symbol;
            const text = msg.content || msg.msg; // Fallback for legacy
            const ts = msg.timestamp || '';
            console.log(`[SymbolWorker:${id}] ${ts} ${text}`);
        }
        else if (msg.type === 'ERROR') {
            const id = routingKey || symbol;
            const text = msg.content || msg.msg;
            const ts = msg.timestamp || '';
            console.error(`[SymbolWorker:${id}] ${ts} 🚨 ${text}`);
        }
        else if (msg.type === 'EV_BAR_CLOSED' || msg.type === 'EV_BAR_UPDATE') {
            const payload = msg.payload || msg.content || msg;
            const { symbol: barSymbol, timeframe, candle } = payload;
            // Use symbol from payload if present, else routing symbol
            const targetSymbol = barSymbol || symbol;

            if (targetSymbol && candle) {
                let io = null;
                if (this.socketServer) {
                    if (this.socketServer.io) io = this.socketServer.io;
                    else if (this.socketServer.to) io = this.socketServer;
                }

                if (io) {
                    const bar = {
                        symbol: targetSymbol,
                        timeframe,
                        time: candle.time,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.tick_volume,
                        is_complete: (msg.type === 'EV_BAR_UPDATE') ? 0 : 1
                    };

                    // Helper method assumed to exist or add it
                    if (this.updateServerTime) this.updateServerTime(bar.time);

                    io.to(targetSymbol).emit('bar_update', bar);
                }
            }
        }
        else if (msg.type === 'HISTORY_BATCH') {
            this.processHistoryBatch(symbol, msg.content, msg.botId, msg.timeframe);
        }
        else if (msg.type === 'HISTORY_UPDATE') {
            const { symbol: hSymbol, timeframe, candles } = msg.content || msg.payload;
            const targetSymbol = hSymbol || symbol;

            if (this.socketServer && this.socketServer.io && candles && candles.length > 0) {
                this.socketServer.io.to(targetSymbol).emit('history_update', {
                    symbol: targetSymbol,
                    timeframe,
                    candles
                });
            }
        }
        else if (msg.type === 'SYNC_COMPLETE_HANDOVER') {
            if (this.handleWorkerSyncComplete) this.handleWorkerSyncComplete(symbol, msg.timeframe, 0);
        }
        else if (msg.type === 'WORKER_SNAPSHOT_RESULT') {
            if (this.handleWorkerSnapshotResult) this.handleWorkerSnapshotResult(symbol, msg.timeframe, msg.inserted, msg.updated);
        }
        else if (msg.type === 'SYNC_UPDATE') {
            // Unify content access
            const { symbol: sSymbol, timeframe, status, message } = msg.content || msg;
            if (sSymbol && timeframe) {
                this.updateSyncStatus(sSymbol, timeframe, status, message);
            } else {
                this.updateSyncStatus(msg.symbol, msg.timeframe, msg.status);
            }
        }
        else if (msg.type === 'SYNC_COMPLETE') {
            const { symbol: sSymbol, timeframe } = msg.content || msg;
            if (this.socketServer && this.socketServer.io) {
                this.socketServer.io.emit('SYNC_COMPLETE', { symbol: sSymbol, timeframe });
                console.log(`[Sync] ✅ Worker Reports SYNC_COMPLETE for ${sSymbol} ${timeframe}`);
            }
        }
        else if (msg.type === 'DISCOVERY_UPDATE') {
            const { source, accounts } = msg.payload || msg.content || {};
            console.log(`[SystemOrchestrator] 📥 DISCOVERY_UPDATE from ${source}: ${accounts ? accounts.length : 0} accounts.`);

            if (accounts && Array.isArray(accounts)) {
                let updated = 0;
                accounts.forEach(acc => {
                    const accountData = {
                        id: acc.name,
                        name: acc.name,
                        brokerId: acc.provider || 'NinjaTrader',
                        platform: 'NT8',
                        type: acc.isTest ? 'SIMULATION' : 'LIVE',
                        login: acc.name,
                        isTest: !!acc.isTest,
                        isConnected: true,
                        status: 'RUNNING',
                        pid: 0
                    };
                    this.db.saveAccount(accountData);
                    updated++;
                });

                const worker = this.workers.get(routingKey);
                if (worker) {
                    worker.postMessage({
                        type: 'COMMAND',
                        command: 'CMD_DB_SYNC_CONFIRMED',
                        content: { count: updated }
                    });
                    console.log(`[SystemOrchestrator] ✅ Confirmed DB Sync to Worker (${updated} accounts).`);
                }
            }
        }
        else if (msg.type === 'COMMAND') {
            // AbstractWorker sends: { type: 'COMMAND', command: '...', content: ... }
            const commandType = msg.command || msg.content.type;
            const targetBotId = msg.botId || this.resolveBotId(symbol);
            const targetFunc = msg.func;
            const requestId = msg.requestId; // Extracted from Worker Envelope

            console.log(`[Sync] 📥 RX SymbolWorker CMD: ${commandType} for ${symbol} -> Bot ${targetBotId} (Func: ${targetFunc}) ReqID: ${requestId || 'Auto'}`);

            if (targetBotId && targetFunc) {
                // STRICT ROUTING KEY CONSTRUCTION
                let routingSymbol = msg.symbol || 'ALL';
                // Exception: DATAFEED/TRADING usually register as ALL. 
                // TICK_SPY registers specific symbol.
                if (targetFunc === 'DATAFEED' || targetFunc === 'TRADING') routingSymbol = 'ALL';
                if (symbol === '*') routingSymbol = 'ALL';

                const routingKey = `${targetBotId}:${targetFunc}:${routingSymbol}`;
                // Pass requestId to allow RPC correlation
                this.sendCommandToBot(routingKey, commandType, msg.content, requestId);
            } else {
                console.warn(`[Sync] ⚠️ Cannot route Worker Command: Missing Identity (BotId=${targetBotId}, Func=${targetFunc})`);
                // Legacy fallback? No, Strict Mode.
            }
        }

    }

    // --- STATUS MANAGEMENT ---
    updateSyncStatus(symbol, timeframe, status, message = null) {
        const key = `${symbol}:${timeframe}`;
        if (!this.syncState) this.syncState = new Map();

        const oldStatus = this.syncState.get(key);
        this.syncState.set(key, { status, message, timestamp: Date.now() });

        if (oldStatus?.status !== status) {
            console.log(`[StatusFlow] 🔄 STATE CHANGE: ${symbol} ${timeframe} | ${oldStatus?.status || 'N/A'} -> ${status} | Msg: ${message || ''} `);
        }

        this.broadcastStatus(symbol, status, timeframe);
    }

    // --- REIMPLEMENTED: TRIGGER STARTUP SYNC ---
    // MOVED TO SESSION CLASSES (DatafeedSession, TickSpySession)
    // triggerFullResync REMOVED


    // --- HISTORY SNAPSHOT ROUTING ---
    handleIncomingHistorySnapshot(payload, botId) {
        // payload: { symbol, timeframe, data: [...] }
        const { symbol, timeframe, data } = payload;

        // Forward to SymbolWorker (TICK_SPY)
        // Worker Key Convention: TICK_SPY:Symbol
        if (symbol) {
            // Send as 'HISTORY_SNAPSHOT' type (SymbolWorker expects this)
            this.sendToWorker('TICK_SPY', symbol, {
                type: 'HISTORY_SNAPSHOT',
                content: data, // SymbolWorker expects content: [...]
                timeframe: timeframe,
                botId: botId,
                timestamp: Date.now()
            });
        }
    }

    handleStatusUpdate(botId, content) {
        // botId here IS the ConnectionId (from PipeServer/Socket)

        // DELEGATE TO WORKER (Non-Blocking)
        if (this.tradeWorker) {
            this.tradeWorker.postMessage({
                type: 'STATUS_UPDATE',
                botId: botId,
                payload: content
            });
        }

        // UDPATE LOCAL STATE FOR DASHBOARD
        // Helper to update a specific session's status
        const updateSessionStatus = (id) => {
            if (!this.botStatus[id]) this.botStatus[id] = {};
            if (content.account) this.botStatus[id].account = content.account;
            if (content.expert) this.botStatus[id].expert = content.expert;
            this.botStatus[id].lastSeen = Date.now();
            this.botStatus[id].lastHeartbeat = Date.now();
            this.botStatus[id].connected = true;

            // Restore Legacy Arrays
            if (this.botStatus[id].function === 'DATAFEED') {
                this.datafeedBots.add(id);
            } else if (this.botStatus[id].function === 'TRADING') {
                this.tradingBots.add(id);
            }
        };

        updateSessionStatus(botId);

        // PROPAGATE TO CHILDREN (Composite Keys)
        // If 'botId' is "conn_123", we might not know children easily unless reverse mapped.
        // But `onBotConnected` stores `connectionId` in `botStatus`.
        // If `botId` is connectionId, we can find the `id` (Real BotID).

        const realStatus = this.botStatus[botId];
        if (realStatus && realStatus.id) {
            const realBotId = realStatus.id;
            Object.values(this.botStatus).forEach(status => {
                // Find children of Real BotID
                if (status.id && status.id !== realBotId && status.id.startsWith(realBotId + "_")) {
                    // Update child status
                    status.lastSeen = Date.now();
                    status.lastHeartbeat = Date.now();
                    status.connected = true;
                }
            });
        }
    }

    // --- SYNC HANDOVER ROUTING ---
    handleSyncCompleteHandover(botId, payload) {
        const { symbol, timeframe } = payload;
        // console.log(`[SystemOrchestrator] 📥 Routing SYNC_COMPLETE_HANDOVER for ${symbol} ${timeframe} from ${botId}`);

        // Forward to SymbolWorker (TICK_SPY)
        // Worker Key Convention: TICK_SPY:Symbol
        if (symbol) {
            this.sendToWorker('TICK_SPY', symbol, {
                type: 'SYNC_COMPLETE_HANDOVER',
                timeframe: timeframe,
                botId: botId,
                timestamp: Date.now()
            });
        }
    }

    // --- GENERIC ROUTER FOR UNIFIED PROTOCOL ---
    routeToWorker(msg) {
        // Msg is the full envelope from Bot
        // We need to route it to the appropriate Worker.
        try {
            const botId = msg.botId || (msg.header ? msg.header.botId : null);
            let func = msg.func || (msg.header ? msg.header.func : 'TRADING'); // Default to TRADING
            let symbol = msg.symbol || (msg.header ? msg.header.symbol : 'ALL');

            if (!botId) {
                // Try to resolve from payload?
                if (msg.payload && msg.payload.botId) {
                    // const botId = msg.payload.botId; // Cannot declare const inside if with same name
                }
                console.warn(`[SystemOrchestrator] ⚠️ routeToWorker: Missing BotID in message. Type: ${msg.type}`);
                return;
            }

            // Construct Worker Key
            let routingSymbol = symbol;
            if (func === 'TRADING' || func === 'DATAFEED' || symbol === '*') routingSymbol = 'ALL';

            const routingKey = wsManager.makeKey(botId, func, routingSymbol);

            if (this.workers.has(routingKey)) {
                const worker = this.workers.get(routingKey);
                // Ensure worker receives expected format
                // UnifiedBotProtocol passes raw msg usually?
                // Or standardized msg?
                // Workers expect { type: ..., content: ... } usually.
                // But UnifiedBotMsg has { header, payload }.
                // Let's pass it as is. AbstractWorker should handle it.
                worker.postMessage(msg);

                if (this.features.ENABLE_RPC_LOGGING) {
                    console.log(`[SystemOrchestrator] ⏩ Routed ${msg.type} to ${routingKey}`);
                }
            } else {
                console.warn(`[SystemOrchestrator] ⚠️ Generic Routing Failed: No Worker for ${routingKey}. MsgType: ${msg.type}`);
            }
        } catch (e) {
            console.error(`[SystemOrchestrator] ❌ routeToWorker Exception: ${e.message}`);
        }
    }

    // --- SYMBOL DISCOVERY ROUTING ---
    handleSymbolsList(botId, content) {
        console.log(`[RPC-TRACE] ⚙️ handleSymbolsList invoked for ${botId}`);

        // Robust Extraction (Array or Object wrapper)
        const symbols = Array.isArray(content) ? content : (content.symbols || content.items || []);

        // 1. Update Global Asset Mapping (Infrastructure)
        console.log(`[SystemOrchestrator] 📥 Handling SYMBOLS_LIST from ${botId}. Count: ${symbols.length}`);

        try {
            const assetMappingService = require('./AssetMappingService');
            assetMappingService.ingestBrokerSymbols(symbols, botId);
            this.refreshAvailableSymbols();
        } catch (e) {
            console.error(`[SystemOrchestrator] ⚠️ Asset Mapping Ingest Failed: ${e.message}`);
        }

        // 2. Route to DatafeedWorker (The Requester)
        // Worker Key: BotID:DATAFEED:ALL
        // DISABLED: RPC Response handles this directly now.
        // const routingKey = wsManager.makeKey(botId, 'DATAFEED', 'ALL');

        // const workerMsg = {
        //    type: 'CMD_AVAILABLE_SYMBOLS',
        //    content: symbols // Send clean array
        // };

        // if (this.workers.has(routingKey)) {
        //    const worker = this.workers.get(routingKey);
        //    worker.postMessage(workerMsg);
        //    console.log(`[SystemOrchestrator] ⏩ Routed SYMBOLS_LIST to Worker ${routingKey}`);
        // } else {
        //    // console.warn(`[SystemOrchestrator] ⚠️ No Worker found for ${routingKey}. Symbols dropped for Worker.`);
        // }
    }

    // --- HELPER: Broadcast Status to Frontend (Task 0244) ---
    broadcastStatus(symbol, status, timeframe = 'M1') {
        if (this.socketServer && this.socketServer.io) {
            // Emitting 'sanity_update' which is what useChartData listens to
            // Payload: { symbol, timeframe, status, message }
            const payload = {
                symbol,
                timeframe,
                status,
                message: `Status Update: ${status} `,
                timestamp: Date.now()
            };
            this.socketServer.io.to(symbol).emit('sanity_update', payload);
            if (this.features.ENABLE_TICK_LOGGING || status !== 'READY') {
                // Log transitions (reduce noise for READY unless debugging)
                console.log(`[StatusFlow] 📡 CAST: ${symbol} ${timeframe} -> ${status} `);
            }
        }
    }

    // --- TASK: SYMBOL DISCOVERY ---
    // Called by AssetMappingService after ingestion
    broadcastAvailableInstruments(payload, botId) {
        if (!Array.isArray(payload)) {
            console.error(`[Sync] ❌ broadcastAvailableInstruments: Payload is not an array. Type: ${typeof payload}`, payload);
            if (payload && payload.symbols && Array.isArray(payload.symbols)) {
                console.log("[Sync] ⚠️ Detected Wrapped Payload inside SystemOrchestrator. Unwrapping...");
                if (payload.botId) {
                    botId = payload.botId;
                    console.log(`[Sync] 🔄 Updated BotID from Wrapper: ${botId}`);
                }
                payload = payload.symbols;
            } else {
                return;
            }
        }

        console.log(`[Sync] 📥 Broadcasting ${payload.length} instruments for ${botId}.`);

        // 1. Notify Frontend
        if (this.socketServer && this.socketServer.io) {
            // ENRICH Payload with Source BotID
            const enrichedPayload = payload.map(s => ({
                ...s,
                botId: botId // Critical for Frontend Grouping
            }));

            this.socketServer.io.emit('available_instruments', enrichedPayload);
            console.log(`[Sync] 📤 Forwarded instruments to Frontend (Event: available_instruments). Source: ${botId}`);
        } else {
            console.warn(`[Sync] ⚠️ SocketServer not available. Cannot forward instruments to Frontend.`);
        }
    }

    // Legacy / Internal Handler REMOVED (Duplicate)
    // See correct definition above around line 1525

    handlePositionsUpdate(botId, payload) {
        if (!payload || (!payload.positions && !payload.closedTrades)) {
            console.log(`[Sync] ❌ MALFORMED PAYLOAD from ${botId}: `, JSON.stringify(payload, null, 2));
            return;
        }

        // UPDATE LOCAL STATE FOR DASHBOARD / API (Hot State)
        if (!this.botStatus[botId]) this.botStatus[botId] = {};
        this.botStatus[botId].lastSeen = Date.now();

        // FIX: Store OPEN trades for /api/positions endpoint
        if (payload.positions) {
            const openTrades = payload.positions.filter(p => p.customStatus !== 'CLOSED'); // MQL5 marks history as CLOSED
            this.botStatus[botId].openTrades = openTrades;
        }

        if (this.socketServer && this.socketServer.io) {
            // Emit lightweight signal (Frontend Polls /api/positions)
            this.socketServer.io.emit('trades_update_signal', { botId, count: payload.positions?.length || 0 });
        }
    }

    // --- TASK: EXECUTION REPORTING ---
    // --- TASK: EXECUTION REPORTING ---
    handleExecutionResult(botId, payload) {
        if (!payload) return;

        console.log(`[Sync] ⚠️ EXECUTION RESULT from ${botId} (Keys: ${Object.keys(payload).join(', ')}): ${payload.status} | ${payload.message}`);

        // 1. Delegate to Worker (Persistence)
        this.sendToWorkerByKey(`${botId}:TRADING:ALL`, {
            type: 'CMD_EXECUTION_RESULT',
            botId: botId,
            content: payload
        });

        // 2. Broadcast to Frontend (ChartOverlay via Socket)
        if (this.socketServer && this.socketServer.io) {
            this.socketServer.io.emit('execution_result', {
                botId: botId,
                status: payload.status,
                message: payload.message,
                requested: payload.requested,
                executed: payload.executed,
                id: payload.id
            });
        }
    }

    getHotCandle(symbol, timeframe) {
        const s = symbol ? symbol.trim() : "";
        const tf = timeframe ? timeframe.trim() : "";
        return this.hotCandles.get(`${s}_${tf} `);
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
    /* provisionWorkers REMOVED - Configured Symbols handled by Database/Cache Restoration */

    getSeconds(tf) {
        const map = { 'M1': 60, 'M2': 120, 'M3': 180, 'M5': 300, 'M10': 600, 'M15': 900, 'M30': 1800, 'H1': 3600, 'H2': 7200, 'H4': 14400, 'H6': 21600, 'H8': 28800, 'H12': 43200, 'D1': 86400, 'W1': 604800, 'MN1': 2592000 };
        return map[tf] || 60;
    }

    // ✅ PERFORMANCE FIX: O(1) Map Lookup (was O(n) array search)
    // 🔒 STRICT MAPPING (Task 0142): No Auto-Failover. Source of Truth is DB.
    // ✅ PERFORMANCE FIX: O(1) Map Lookup (was O(n) array search)
    // 🔒 STRICT MAPPING (Task 0142): No Auto-Failover. Source of Truth is DB.
    resolveBotId(symbol) {
        if (typeof symbol !== 'string') {
            // console.warn(`[SystemOrchestrator] resolveBotId called with non - string: `, symbol);
            return null;
        }
        // 0. PRIORITY: TickSpy Session (Direct Chart Connection)
        // If we have a dedicated TickSpy session for this symbol, ALWAYS use it for data.
        if (this.symbolToTickSpyMap) {
            const tickSpyId = this.symbolToTickSpyMap.get(symbol);
            if (tickSpyId) {
                if (this.isBotOnline(tickSpyId)) {
                    // console.log(`[Sync] 🎯 Resolved ${ symbol } -> ${ tickSpyId } (TickSpy)`);
                    return tickSpyId;
                } else {
                    // console.warn(`[Sync] ⚠️ TickSpy ${ tickSpyId } is OFFLINE.Falling back...`);
                }
            }
        }

        // 0.5. Check for Explicit Prefix "BotID:Symbol"
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

        // 1. Primary Check: Is Mapped Bot Online?
        if (cachedBotId) {
            // AUTO-FAILOVER: If mapped bot is offline, try to find another one.
            if (this.isBotOnline(cachedBotId)) {
                return cachedBotId;
            }
            // If offline, fall through to discovery...
        }

        // 2. Auto-Failover / Discovery
        // If cached is offline OR not found, find ANY online bot with this symbol.
        if (this.botToSymbolsMap) {
            for (const [botId, symbols] of this.botToSymbolsMap) {
                if (symbols && symbols.has(symbol) && this.isBotOnline(botId)) {
                    // Found a LIVE alternative! Update cache for future hits.
                    // console.log(`[Sync] ♻️ Auto-Failover Routing: ${symbol} -> ${botId} (Primary Offline)`);
                    this.symbolToBotMap.set(symbol, botId);
                    return botId;
                }
            }
        }

        // 3. Fallback to cached (even if offline) if no live alternative found
        // This ensures UI shows "Connecting..." for the correct broker instead of failing completely.
        if (cachedBotId) return cachedBotId;

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

    // TASK 0159: History Batch Processing (Finalized Candle Correction)
    // TASK 0159: History Batch Processing (Finalized Candle Correction)
    processHistoryBatch(symbol, batch, botId, timeframe) {
        if (!batch || batch.length === 0) return;

        const tf = timeframe ? timeframe.replace('PERIOD_', '') : 'M1';

        // Forward to HistoryWorker for Persistence (Phase 5)
        if (this.historyWorker) {
            this.historyWorker.postMessage({
                type: 'HISTORY_BATCH',
                payload: {
                    symbol: symbol,
                    timeframe: tf,
                    data: batch // Raw batch from bot
                }
            });
        }
        // Legacy local processing handled by Worker -> Orchestrator feedback loop.
    }

    processLiveTick(symbol, tick, botId) {
        // Alias for processLiveTick if needed, or fix callers
        this.processStreamData(symbol, tick, botId);
    }

    // NEW: Handle Live Market Data from SocketServer (Pure WS Architecture)
    handleIncomingMarketData(tick, botId) {
        // tick: { symbol, bid, ask, last, vol, time }
        if (!tick || !tick.symbol) return;

        // KEEP ALIVE
        if (botId) this.refreshBotHeartbeat(botId);

        this.sendToWorker('TICK_SPY', tick.symbol, {
            type: 'MARKET_DATA', // Mapped to handleMarketData in SymbolWorker
            payload: tick
        });
    }

    // Note: We do NOT emit to frontend here. 
    // SymbolWorker aggregates M1 and sends TICK_DATA back to us.
    // We emit in processStreamData when we get that update.


    // NEW: Handle Closed Bar Data from TickSpy (Pure WS Architecture)
    // NEW: Handle Closed Bar Data from TickSpy (Pure WS Architecture)
    handleIncomingBarData(payload, botId) {
        // Payload: { symbol, timeframe, time, open, high, low, close, volume }
        if (!payload || !payload.symbol) return;

        // FIX: Ensure BotID is sticky
        if (botId && botId !== 'unknown') {
            if (!this.symbolBotIdCache) this.symbolBotIdCache = new Map();
            this.symbolBotIdCache.set(payload.symbol, botId);

            // KEEP ALIVE
            this.refreshBotHeartbeat(botId);
        }

        // Route to 'TICK_SPY' Worker
        this.sendToWorker('TICK_SPY', payload.symbol, {
            type: 'BAR_DATA',
            content: payload
        });
    }

    handleIncomingHistorySnapshot(payload, botId) {
        // Payload: { symbol, timeframe, data: [ { time, open, high, low, close, volume } ] }
        const symbol = payload.symbol;
        const candles = payload.data; // data is standard key from TickSpy

        if (!symbol || !candles || candles.length === 0) return;

        // FIX: Ensure BotID is sticky
        if (botId && botId !== 'unknown') {
            if (!this.symbolBotIdCache) this.symbolBotIdCache = new Map();
            this.symbolBotIdCache.set(symbol, botId);
        }

        // console.log(`[Sync] 📸 Received HISTORY_SNAPSHOT for ${ symbol }(${ candles.length } bars) from ${ botId } `);

        // 1. Send to SymbolWorker (Hot State / DB)
        // STRICT: Workers must be spawned via REGISTER.
        // Construct Routing Key: BotId:TICK_SPY:Symbol
        const routingKey = wsManager.makeKey(botId, 'TICK_SPY', symbol);

        if (this.workers.has(routingKey)) {
            // console.log(`[Trace] ➡️ Dispatching HISTORY_SNAPSHOT to SymbolWorker for ${ symbol }(Route: ${ routingKey })`);
            this.workers.get(routingKey).postMessage({
                type: 'HISTORY_SNAPSHOT',
                content: {
                    candles: candles,
                    timeframe: payload.timeframe
                }
            });
        } else {
            console.warn(`[Sync] ⚠️ Dropping HISTORY_SNAPSHOT for ${symbol}.No SymbolWorker active for ${routingKey}. (Strict Protocol)`);
            return;
        }

        // 2. Notify UI (Unlock)
        // If data is immediately available, we should trigger a UI refresh/unlock
        // The Worker will ingest asynchronously, but it's fast. 
        // We emit SYNC_COMPLETE to tell Frontend to re-fetch candles.
        if (this.socketServer && this.socketServer.io) {
            // Wait a tiny bit for DB insert? Or assume 'handleHistorySnapshot' in Worker is synchronous enough?
            // SQLite write is blocking in the Worker thread, but the Worker message handling is async to Main.
            // But we sent it to Worker just now.
            // Ideally we need an ACK. But for speed, let's delay slightly or just emit.

            // BETTER: We can't guarantee Worker finished insert yet.
            // But 'SYNCING' status in frontend will poll or wait for 'SYNC_COMPLETE'.
            // Let's emit it. Frontend usually re-fetches on this event.
            // To be safe, maybe a small timeout or just trust the race (DB WAL is fast).

            // FIX: RACE CONDITION
            // Give SymbolWorker 500ms to commit to SQLite before telling Frontend to fetch.
            // FIX: RACE CONDITION & UI LAG
            // Give SymbolWorker 500ms to commit to SQLite, BUT send data to UI immediately to unblock it.
            setTimeout(() => {
                if (this.socketServer && this.socketServer.io) {
                    // Update Internal State First
                    this.updateSyncStatus(symbol, payload.timeframe, 'READY');

                    // NEW: PUSH DATA DIRECTLY (Don't wait for re-fetch)
                    // Normalize candles for Frontend (MS Time)
                    const tzService = require('./TimezoneNormalizationService');
                    const normalized = candles.map(c => {
                        let timeMS = c.time;
                        // FIX: Timezone Conversion
                        if (timeMS < 10000000000) {
                            const timeSec = tzService.convertBrokerToUtc(botId || 'default', timeMS);
                            timeMS = timeSec * 1000;
                        }
                        return {
                            ...c,
                            time: timeMS,
                            is_complete: 1
                        };
                    });

                    this.socketServer.io.to(symbol).emit('history_update', {
                        symbol: symbol,
                        timeframe: payload.timeframe,
                        candles: normalized
                    });

                    this.socketServer.io.emit('SYNC_COMPLETE', { symbol, timeframe: payload.timeframe });
                    console.log(`[Sync] 🔓 UI Unblocked: Pushed ${normalized.length} bars & SYNC_COMPLETE for ${symbol}`);
                }
            }, 500);
        }
    }

    handleInitialDataFailed(payload, botId) {
        // payload: { symbol, timeframe, error }
        const symbol = payload.symbol;
        if (symbol) {
            // Route to SymbolWorker
            // Construct Routing Key: BotId:TICK_SPY:Symbol (Best Effort)
            // If botId is not provided, we might need to resolve it.
            // But usually this comes from TickSpy, so botId is valid.

            // We use the generic sendToWorker because it handles resolution if needed, 
            // but we prefer specific routing if we have the botId.

            const routingKey = wsManager.makeKey(botId, 'TICK_SPY', symbol);

            if (this.workers.has(routingKey)) {
                // FIX: sendToWorker signature is (func, symbol, payload).
                // We have the exact key, so use postMessage directly.
                this.workers.get(routingKey).postMessage({
                    type: 'INITIAL_DATA_FAILED',
                    content: payload
                });
            } else {
                // Fallback to generic resolution
                this.sendToWorker('TICK_SPY', symbol, {
                    type: 'INITIAL_DATA_FAILED',
                    content: payload
                });
            }
        }
    }

    handleSynchronizedUpdateFailed(payload, botId) {
        // payload: { symbol, timeframe, mode, error, message }
        const symbol = payload.symbol;
        if (symbol) {
            const success = this.sendToWorker('TICK_SPY', symbol, {
                type: 'SYNCHRONIZED_UPDATE_FAILED',
                content: payload
            });

            if (!success) {
                console.warn(`[Sync] ⚠️ Worker not found for SYNCHRONIZED_UPDATE_FAILED: ${symbol} `);
            }
        }
    }



    // --- ALIAS FOR PIPESERVER COMPATIBILITY ---


    // --- INGESTION (Legacy Removed - Handled by SymbolWorker) ---
    // processHistoryBatch (Duplicate) and ingestHistory removed.
    // SyncManager now only proxies UI events from Worker.

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
                const key = `${bId}:${name}`;
                if (!aggregated.has(key)) {
                    aggregated.set(key, s);
                }
            });
        }
        this.availableSymbols = Array.from(aggregated.values());

        console.log(`[Sync] Available Symbols Updated for ${botId}: ${normalizedList.length} items.Global Total: ${this.availableSymbols.length} `);

        // Notify UI that a specific bot's list updated (Targeted Event)
        if (this.socketServer && this.socketServer.io) {
            this.socketServer.io.emit('broker_symbols_updated', { botId, count: normalizedList.length });

            // FIX: Also emit the full list because DatafeedView.tsx listens to 'all_symbols_list'
            // and might not react to partial updates.
            this.socketServer.io.emit('all_symbols_list', this.availableSymbols);
        }
    }

    requestAvailableSymbols(targetBotId = null) {
        console.log(`[PROCESS] START Request Available Symbols. Target: ${targetBotId || 'ALL'}`);
        const start = Date.now();

        // OPTIMIZATION: Check DB first. If we have symbols, rely on them to avoid startup storm.
        const assetMappingService = require('./AssetMappingService');

        // Dynamically Resolve Bots from Status Map
        const botsToQuery = [];

        if (targetBotId) {
            // TARGETED REQUEST
            if (this.botStatus[targetBotId]) {
                botsToQuery.push(targetBotId);
            } else {
                console.warn(`[Sync] ⚠️ Request Symbols for Unknown Bot: ${targetBotId}`);
            }
        } else {
            // BROADCAST: Find all DATAFEED or TRADING bots in Status Map
            Object.values(this.botStatus).forEach(status => {
                if ((status.function === 'DATAFEED' || status.function === 'TRADING') && status.connected) {
                    // Use the ID from status, or the key if ID is missing
                    const bId = status.id || status.botId;
                    if (bId) botsToQuery.push(bId);
                }
            });
        }

        if (botsToQuery.length === 0) {
            // Fallback for empty state
            console.log("[Sync] ℹ️ No active bots found for symbol discovery.");
            return;
        }

        let requestCount = 0;
        botsToQuery.forEach(botId => {
            // FIX 1: Offline Check (Existing)
            // if (!this.isBotOnline(botId)) return; // Don't skip yet, check cache first.

            // FIX 2: DB Cache Check (New)
            // Always try to load from DB first.
            const cachedSymbols = assetMappingService.getBrokerSymbols(botId);
            if (cachedSymbols && cachedSymbols.length > 0) {
                // Populate Memory Map from DB
                // We reuse setAvailableSymbols logic but skip persistence (already in DB)
                this.setAvailableSymbols(cachedSymbols, botId, true);
                // console.log(`[Sync] 💾 Loaded ${ cachedSymbols.length } symbols from DB for ${ botId }`);
                return; // SKIP Request
            }

            // Only request if NOT in DB
            if (this.isBotOnline(botId)) {
                this.requestSymbolsForBot(botId);
                requestCount++;
            }
        });

        console.log(`[PROCESS] END Request Available Symbols(Sent ${requestCount} requests, Duration: ${Date.now() - start}ms)`);
    }

    async requestSymbolsForBot(botId) {
        if (!botId) return;
        const rpcHelper = require('../framework/protocol/RpcCommandHelper');
        console.log(`[RPC-TRACE] 🚀 Starting Synchronous RPC Request for Symbols from ${botId}...`);

        try {
            // STRICT RPC: Wait for Response
            const startTime = Date.now();

            const response = await rpcHelper.send(
                `${botId}:DATAFEED:ALL`,
                "CMD_GET_SYMBOLS",
                {},
                (requestId) => {
                    // The Transport Callback
                    console.log(`[RPC-TRACE] 📤 Executing Transport Callback (ReqID: ${requestId})...`);
                    this.sendCommandToBot(`${botId}:DATAFEED:ALL`, "CMD_GET_SYMBOLS", {}, requestId);
                },
                10000
            );

            console.log(`[RPC-TRACE] 📥 RPC Response Received from ${botId}! Duration: ${Date.now() - startTime}ms`);
            console.log(`[RPC-TRACE] 📦 Payload Type: ${typeof response} IsArray: ${Array.isArray(response)}`);

            if (response && response.symbols) {
                console.log(`[RPC-TRACE] 📦 Found 'symbols' wrapper. Count: ${response.symbols.length}`);
            } else if (Array.isArray(response)) {
                console.log(`[RPC-TRACE] 📦 Direct Array. Count: ${response.length}`);
            }

            // Handle Result Directly
            this.handleSymbolsList(botId, response);

        } catch (e) {
            console.error(`[RPC-TRACE] ❌ Symbol RPC Failed for ${botId}: ${e.message}`);
        }
    }

    /**
     * Resend subscriptions for a specific Bot (Reconnect Logic)
     */
    resendSubscriptions(targetBotId) {
        console.log(`[Sync] ♻️ Resending Active Subscriptions for Reconnected Bot: ${targetBotId}`);
        // Delay slightly to allow socket handshake to finalize?
        // NO delay for Push Protocol!
        // But maybe Socket hasn't registered yet?
        // handleBotRegister calls this immediately.

        // Let's add a small yield (100ms) just to be safe, or 0.
        setTimeout(() => {
            this.syncSubscriptions(targetBotId, 'RECONNECT');
        }, 100);
    }

    handleBotDisconnect(botId) {
        if (!botId) return;
        console.log(`[Sync] ❌ Bot Disconnect Detected: ${botId}`);
        // Remove from tracking
        if (this.datafeedBots) this.datafeedBots.delete(botId);
        if (this.tradingBots) this.tradingBots.delete(botId);
        // Remove from availability map? Maybe keep it cached but mark offline?
        // For now, let's keep it in map but remove from active set.
    }

    /**
     * Sends a command to a specific Bot (Strict Routing aware).
     * @param {string} routingKey - Fully Qualified Routing Key (BotID:Function:Symbol)
     * @param {string} type - Command Name
     * @param {Object} content - Payload
     * @param {string} optsRequestId - Optional: Explicit Request ID (for RPC)
     */
    sendCommandToBot(routingKey, type, content, optsRequestId = null) {
        if (!routingKey || typeof routingKey !== 'string') {
            console.warn(`[SystemOrchestrator] ⚠️ Invalid RoutingKey for ${type}: ${routingKey}`);
            return;
        }

        // Extract Metadata for Logging/Audit
        const parts = routingKey.split(':');
        const botId = parts[0];
        const func = parts.length > 1 ? parts[1] : 'UNKNOWN';
        const symbol = parts.length > 2 ? parts[2] : 'UNKNOWN';

        const timestamp = Math.floor(Date.now() / 1000);
        // Use provided ID or generate new one
        const requestId = optsRequestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // STANDARD ENVELOPE (Protocol Spec 1.0)
        const envelope = {
            header: {
                command: type,
                request_id: requestId,
                timestamp: timestamp,
                source: "SystemOrchestrator"
            },
            payload: content || {}
        };

        // REGISTRY: Track Request Context (Identity Recovery)
        // User Requirement: "Store routingKey for request_id"
        // This allows UnifiedBotProtocol to recover 'botId' from the Response if socket mapping fails.
        try {
            const rpcHelper = require('../framework/protocol/RpcCommandHelper');
            rpcHelper.registerContext(requestId, routingKey);
        } catch (e) {
            // Should not fail, but safety first
        }

        // Internal Command Object (for Logging/Audit)
        const cmdLog = {
            type,
            content,
            botId: botId,
            symbol,
            sender: 'App',
            timestamp: Date.now(),
            customId: requestId
        };

        // 1. Strict WebSocketManager Lookup
        const targetSocket = wsManager.getSocket(routingKey);

        if (targetSocket && targetSocket.readyState === 1) { // OPEN
            const payload = JSON.stringify(envelope);
            targetSocket.send(payload);
            console.log(`[SystemOrchestrator] 📤 SENT ${type} to ${routingKey} (SocketID: ${targetSocket.id})`);
            db.logMessage({ ...cmdLog, isActive: 0 }); // Log Success
            return;
        }

        // 2. Legacy SocketServer (System 2) - Fallback or Parallel?
        // If Strict Socket Failed, maybe legacy server has it?
        // Legacy server uses botId usually.
        // User said "NO FALLBACK to ambiguous ID".
        // But if Legacy Server manages connections by BotId, we might still try?
        // "ES GIBT KEIN sendToBot NUR mit der BotId".
        // Use RoutingKey if possible, or fail.

        if (this.socketServer && this.socketServer.sendToBot) {
            // Try strict send if supported, or warn.
            // Assume legacy support might be needed for non-WS connections (Pipe via SocketServer?)
            // But Pipe is strictly 1:1 usually.

            // For safety, we LOG failure and DO NOT Fallback to broadcasting to all 'botId' sockets if strict key failed.
        }

        console.warn(`[SystemOrchestrator] ⚠️ Routing Failed for ${routingKey}. Socket not found or closed.`);

        // 3. Log Dead Letter
        db.logMessage({
            ...cmdLog,
            isActive: 0
        });
    }

    broadcastSanityUpdate(data) {
        if (!this.socketServer) return;
        // Broadcast to all clients connected to the 'data-history' room or globally
        // For simplicity, we emit to all since this is an admin feature usually.
        // data: { symbol, timeframe, status, message, timestamp }
        this.socketServer.emit('sanity_update', data);
    }

    // --- FOCUS MANAGEMENT ---
    setFocus(symbol, timeframe) {
        this.activeFocus = {
            symbol: symbol,
            timeframe: timeframe,
            timestamp: Date.now()
        };
        // Optional: Notify Worker that it is now "High Priority" if needed
        // For now, we trust the Worker to just process what it gets, but we track focus here
        // so we don't drop "Deep Backfill" logic totally if we ever need it.
    }

    // --- NOTE: Legacy handleSubscribe and handleUnsubscribe REMOVED here. ---
    // The active, restored versions are located at the bottom of the file (lines 3397+).

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
            // FIX: Use ':' because keys are constructed as `${ symbol }:${ timeframe }`
            const [symbol, timeframe] = key.split(':').map(s => s.trim());
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

                        if (true) {
                            // Task 0158 FIX: Use 'symbol' (Internal) not 'symbolToSend' (Broker)
                            // FIX: Determine correct 'func' (TICK_SPY or DATAFEED) to avoid argument shifting crash
                            let func = 'TICK_SPY';
                            for (const [key] of this.workers) {
                                if (key.startsWith(`${botId}: `) && key.endsWith(`:${symbol} `)) {
                                    const parts = key.split(':');
                                    if (parts.length >= 2) { func = parts[1]; break; }
                                }
                            }

                            this.sendToWorker(func, symbol, {
                                type: 'CMD_UNSUBSCRIBE_TICKS', // Standardized Command
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
                            this.syncSubscriptions();
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
    // Task 0233: Worker Signals Snapshot Complete
    handleWorkerSnapshotResult(symbol, timeframe, inserted, updated) {
        console.log(`[Sync] 📥 Worker Snapshot Result: ${symbol} ${timeframe} (Inserted: ${inserted}, Updated: ${updated})`);

        // 1. Update Internal Status
        this.updateSyncStatus(symbol, timeframe, 'READY', 'Worker Done');

        // 2. Notify Frontend
        if (this.socketServer && this.socketServer.io) {
            // Send standard completion signal
            this.socketServer.io.emit('SYNC_COMPLETE', {
                symbol,
                timeframe,
                timestamp: Date.now() // Best guess since worker didn't provide maxTime in this msg
            });

            // Also send stats log
            this.socketServer.io.emit('SYNC_STATS', { symbol, timeframe, inserted, updated });
        }
    }

    handleWorkerSyncComplete(symbol, timeframe, maxTime) {
        // Resolve Internal Symbol just in case
        // But Worker usually passes the symbol it was spawned with, which SHOULD be internal (from config).
        // Let's assume 'symbol' is correct.

        let safeDateStr = "Invalid Date";
        try {
            if (maxTime === 0) {
                safeDateStr = "No Data / Empty";
            } else if (maxTime > -8640000000000000 && maxTime < 8640000000000000) {
                safeDateStr = new Date(maxTime).toISOString();
            } else {
                safeDateStr = `OutOnlyRange(${maxTime})`;
            }
        } catch (e) {
            safeDateStr = `Error(${maxTime})`;
        }

        console.log(`[Sync] 📥 Worker Handover: ${symbol} ${timeframe} is READY(MaxTime: ${safeDateStr})`);

        // 1. Update Internal Status (Respect Offline)
        // 1. Update Internal Status (Respect Offline)
        const botId = this.resolveBotId(symbol);
        const isBotOnline = botId && this.isBotOnline(botId);

        // Task: Clean Chart Status Logic
        // STRICT: If Bot is Online, completion means READY (Hidden). 
        // We do NOT want "Syncing" to linger.
        const nextStatus = isBotOnline ? 'READY' : 'OFFLINE';

        console.log(`[Sync] 📥 Worker Handover: ${symbol} ${timeframe} -> ${nextStatus} (Bot Online: ${isBotOnline})`);

        this.updateSyncStatus(symbol, timeframe, nextStatus);

        // 2. Resolve Pending Requests (Unblock Async Waits)
        const reqKey = `${symbol}_${timeframe} `;
        if (this.pendingRequests && this.pendingRequests.has(reqKey)) {
            // console.log(`[Sync] ✅ Resolving Pending Request for ${ reqKey }`);
            this.pendingRequests.get(reqKey)(true);
            this.pendingRequests.delete(reqKey);
        }

        if (this.inflightPromises && this.inflightPromises.has(reqKey)) {
            this.inflightPromises.delete(reqKey);
        }

        // 3. Notify Frontend (Critical for Unblocking Chart Loading)
        if (this.socketServer) {
            // Signal completeness (Standard Protocol)
            this.socketServer.emit('SYNC_COMPLETE', { symbol, timeframe, timestamp: maxTime });

            // TASK 0163: History Update Notification
            this.broadcastSanityUpdate({ symbol, timeframe, status: 'READY', message: 'History Updated', timestamp: maxTime });

            console.log(`[StatusFlow] 🏁 END: Sync Complete for ${symbol} ${timeframe} `);

            this.socketServer.emit('HISTORY_UPDATE', {
                symbol,
                timeframe,
                status: 'COMPLETE',
                timestamp: maxTime
            });
        }

        // --- VERIFY-FIRST RELEASE ---
        // Now that history is secure, we can open the Live Stream.
        console.log(`[Sync] 🔓 History Complete.Releasing Live Stream for ${symbol} ${timeframe} `);
        this.syncSubscriptions(null, "WorkerComplete", symbol);

        // ORCHESTRATOR: Free symbol & Trigger Next
        if (this.activeHistorySymbols && this.activeHistorySymbols.has(symbol)) {
            this.activeHistorySymbols.delete(symbol);
            setTimeout(() => this.processHistoryQueue(), 0);
        }

        // TRIGGER BACKGROUND FILL
        // If we just finished a Mandatory Sync, we might want Shallow Fill.
        // Check status:
        // FIX: If Internal MaxTime is 0 (Empty), and we just finished a sync, trying again immediately causes an infinite loop.
        // Wait for user interaction or next poll.
        if (maxTime !== 0) {
            const status = this.getStatusSnapshot(symbol)[timeframe];
            if (status && status.status === 'ACTIVE') {
                // If allowed, ensure we don't set status back to SYNCING unless critical
                this.triggerBackgroundFill(symbol, timeframe, maxTime);
            } else {
                this.triggerBackgroundFill(symbol, timeframe, maxTime);
            }
        } else {
            console.log(`[Sync] 🛑 Skipping Background Fill for ${symbol} ${timeframe} (No Data / Empty Result). Avoiding Loop.`);
        }
    }

    syncSubscriptions(targetBotIdRel = null, traceId = null, targetSymbol = null) {
        // DIAGNOSTIC LOG
        console.log(`[SyncManager] syncSubscriptions called.Active Subs: ${this.activeSubscriptions.size}.TargetBot: ${targetBotIdRel || 'ALL'} TargetSym: ${targetSymbol || 'ALL'} `);
        console.log(`[SyncManager] Current Active Subscriptions: ${Array.from(this.activeSubscriptions.keys()).join(', ')} `);

        // 1. Gather Unique Subscriptions
        const botSubsOriginal = new Map();

        for (const [key, subscribers] of this.activeSubscriptions) {
            if (subscribers.size > 0) {
                // FIXED: Use ':' delimiter (matches handleSubscribe)
                // Was incorrectly using '|' which caused timeframe to be undefined.
                const parts = key.split(':');
                const fullSymbol = parts[0];
                const timeframe = parts[1];

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
                // --- DECENTRALIZED ARCHITECTURE: SPAWN WORKER ---
                // STRICT CHECK: Is Bot Online?
                // STRICT CHECK: Is Bot Online?
                // FIX: Prioritize Connection Type (TICK_SPY > DATAFEED > TRADE > HISTORY)
                // History connections should NOT be used for live SymbolWorkers.
                let activeConnectionId = null;
                let usagePriority = 0;

                for (const [connId, status] of Object.entries(this.botStatus)) {
                    if (status.id === botId && status.connected) {
                        let currentPriority = 1;
                        if (status.type === 'TICK_SPY') currentPriority = 4;
                        else if (status.type === 'DATAFEED') currentPriority = 3;
                        else if (status.type === 'TRADE') currentPriority = 2;
                        else if (status.type === 'HISTORY') currentPriority = 0; // Avoid History for Live Subs

                        if (currentPriority > usagePriority) {
                            activeConnectionId = connId;
                            usagePriority = currentPriority;
                        }
                    }
                }

                if (!activeConnectionId) {
                    // BOT OFFLINE
                    console.log(`[Sync] 🛑 Skipping Worker Spawn for ${item.symbol}(Bot ${botId} Offline)`);

                    // Task 0239: Show "Datafeed Offline" on Chart
                    this.updateSyncStatus(item.symbol, item.timeframe, 'OFFLINE', 'Datafeed Offline');
                    // Broadcast immediately to ensure UI updates
                    this.broadcastStatus(item.symbol, 'OFFLINE', item.timeframe);
                    return;
                }

                // BOT ONLINE -> Spawn REMOVED (Registry Driven)
                // this.spawnSymbolWorker(internalSymbol, botId, activeConnectionId);

                setTimeout(() => {
                    // Task 0158 FIX: Use 'internalSymbol' (Internal) not 'symbolToSend' (Broker)
                    // Increased delay to 500ms to ensure Worker Thread is ready (Task-0185 Fix)
                    console.log(`[Sync] ⏳ SStch SUBSCRIBE -> Worker(${internalSymbol})`);
                    const success = this.sendToWorker('TICK_SPY', internalSymbol, {
                        type: 'CMD_SUBSCRIBE_TICKS', // Standardized Command
                        timeframe: item.timeframe
                    });
                    if (!success) console.warn(`[Sync] ⚠️ Dispatch Failed: Worker for ${internalSymbol} not found.`);

                    // Also notify HISTORY worker to prioritize this timeframe
                    this.sendToWorker('HISTORY', internalSymbol, {
                        type: 'CMD_SUBSCRIBE_TICKS',
                        timeframe: item.timeframe
                    });
                }, 500); // Increased from 50ms to 500ms

                // console.log(`[Sync] 🚀 Delegated SUBSCRIBE: ${ item.symbol } ${ item.timeframe } -> Worker(Bot: ${ botId })`);

                // --- DIRECT SESSION ROUTING REMOVED (Migrated to Workers) ---
                // The worker spawn and sendToWorker above handles this.
                // Legacy fast-path removed to prevent crash.

                // --- PROVISIONING FALLBACK (Induce Chart Open) ---
                // If no session, we must tell the Bot to open the chart.

                // FIX: Ensure we send only the Raw Broker Symbol (e.g. "AUDUSD") not "BotID:AUDUSD"
                let rawBrokerSymbol = symbolToSend;
                if (rawBrokerSymbol.includes(':')) {
                    rawBrokerSymbol = rawBrokerSymbol.split(':')[1];
                }

                const cmd = {
                    type: "CMD_SUBSCRIBE_TICKS",
                    content: {
                        symbol: rawBrokerSymbol,
                        timeframe: item.timeframe
                    },
                    botId: botId,
                    symbol: item.symbol,
                    sender: 'App',
                    timestamp: Date.now(),
                    customId: `sub - ${botId} -${item.symbol} -${item.timeframe} -${Date.now()} `,
                    isActive: 1 // ACTIVE: Bot picks this up and provisions charts.
                };
                db.logMessage(cmd);
            });
        }
    }

    /**
     * Handle SYNC_STATUS from TickSpy (Retry Logic)
     */
    handleSyncStatusRetry(payload) {
        // payload: { status: 'RETRY', symbol, timeframe, lastTime }
        const { symbol, timeframe, lastTime } = payload;

        console.log(`[Sync] 🔄 Received Retry Request for ${symbol} ${timeframe}.Scheduling in 2s...`);

        // Legacy Retry Logic Removed.
        // Workers (SymbolWorker) handle gap detection and retries internally.
        console.warn(`[Sync] ⚠️ Retry Request from ${symbol} ignored(Legacy Handler).Worker should auto - recover.`);
    }

    async triggerBulkSync() {
        console.log(`[PROCESS] START Bulk Sync(Configured: ${this.configuredSymbols.length})`);
        const start = Date.now();

        if (this.configuredSymbols.length === 0) {
            console.log(`[PROCESS] END Bulk Sync(Skipped - Empty Config)`);
            return;
        }

        if (this.activeFocus) {
            console.log(`[Sync] ⏸️ Skipping Bulk Sync(Active Focus on ${this.activeFocus.symbol})`);
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

            // No-Op or Handled elsewhere


            const cmdContent = { items: items };

            // FIX: Use Central Sender to ensure PIPE Delivery (Native MQL5 Push)
            // Passing 'null' as symbol because this is a Bot-Level command, not symbol-specific.
            // But sendCommandToBot expects a symbol to resolve botId if botIdParam is null.
            // Here we have botId explicitly.

            // STRICT: Bulk Sync targets HISTORY role (or DATAFEED if separate history not used)
            // We assume HISTORY for now.
            this.sendCommandToBot(`${botId}:HISTORY:ALL`, "CMD_BULK_SYNC", cmdContent);

            // */
        }
        console.log(`[PROCESS] END Bulk Sync(Duration: ${Date.now() - start}ms)`);
    }

    // NEW: Targeted Bulk Sync (Forensic Mode)
    async triggerBulkSyncForBot(botId) {
        console.log(`[Sync:Forensic] 🚀 Triggering BULK SYNC for Bot: '${botId}'`);

        // 1. Gather Symbols for this Bot
        // NOTE: User rejected normalization fix. Using STRICT raw ID comparison.
        // const normalizedBotId = botId.replace('_DATAFEED', '');

        const botSymbols = this.configuredSymbols.filter(c => {
            const sym = c.symbol || c.name;
            const resolvedBot = this.resolveBotId(sym);

            // Forensic Log for EVERY Symbol check
            // if (Math.random() < 0.05) console.log(`[Sync:Forensic] Sampling ${ sym }: Resolved = '${resolvedBot}' vs Target = '${botId}' Match = ${ resolvedBot === botId } `);

            if (!resolvedBot) return false;
            return resolvedBot === botId;
        });

        console.log(`[Sync:Forensic] 🔍 Found ${botSymbols.length} configured symbols for '${botId}'.`);

        if (botSymbols.length === 0) {
            console.log(`[Sync:Forensic] ⚠️ ID MISMATCH DIAGNOSIS: `);
            console.log(`[Sync:Forensic] Target BotID(from Register / Heartbeat): '${botId}'`);

            // Analyze the first configured symbol to see what IT expects
            if (this.configuredSymbols.length > 0) {
                const sample = this.configuredSymbols[0];
                const sampleSym = sample.symbol || sample.name;
                const sampleBot = this.resolveBotId(sampleSym);
                console.log(`[Sync:Forensic] Sample Config Check: Symbol = '${sampleSym}' maps to BotID = '${sampleBot}'`);
                console.log(`[Sync:Forensic]Comparison: '${sampleBot}' === '${botId}' ? ${sampleBot === botId} `);
            } else {
                console.log(`[Sync:Forensic] Configured Symbols List is EMPTY.`);
            }

            console.log(`[Sync:Forensic] ❌ Zero symbols matched.Aborting Sync.`);
            return;
        }

        const items = [];
        const timeframes = config.DEFAULT_TIMEFRAMES;

        botSymbols.forEach(item => {
            const sym = item.symbol || item.name;
            const tfs = {};
            timeframes.forEach(tf => {
                let lastT = db.getLastTimestamp(sym, tf);
                if (!lastT) lastT = 0;
                tfs[tf] = lastT;
            });
            items.push({ s: sym, tfs: tfs });
        });

        const cmdContent = { items: items };

        console.log(`[Sync:Forensic] 📤 Sending CMD_BULK_SYNC to ${botId}. Payload Items: ${items.length} `);
        this.sendCommandToBot('*', "CMD_BULK_SYNC", cmdContent, botId);
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

    setSocketServer(socketServerInstance) {
        this.socketServer = socketServerInstance;
        // Also keep reference to IO for backward compatibility if needed, 
        // but prefer using socketServerInstance.io where explicitly called.
        // Wait, some code uses this.socketServer.emit (assuming it's IO).
        // I should probably fix those calls or make this.socketServer the IO and store wrapper separately?
        // No, better to store wrapper as 'socketService' and IO as 'socketServer'?
        // Too risky to rename 'socketServer' everywhere.

        // COMPROMISE: Store IO in this.socketServer (legacy) AND keep wrapper in this.socketService
        if (socketServerInstance.io) {
            this.socketServer = socketServerInstance.io;
            this.socketService = socketServerInstance;
        } else {
            // Fallback if passed IO directly (Legacy calls)
            this.socketServer = socketServerInstance;
        }
    }

    updateConfig(symbols) {
        console.log(`[SyncManager] Updating config with ${symbols.length} symbols.`);
        const oldSymbols = this.configuredSymbols || [];

        // 1. Persist
        this.configuredSymbols = symbols;
        db.setConfig('selected_symbols', symbols);

        // 2. Sync Asset Mappings (CRITICAL: Worker reads DB, so DB must be updated first)
        assetMappingService.syncWithConfig(symbols);

        // 3. Rebuild Maps (Infrastructure)
        this.rebuildSymbolMaps();

        // 4. Diff Logic: Identify Affected Bots
        const affectedBots = new Set();

        // Check New/Updated
        symbols.forEach(s => {
            // Resolve BotID (Preferred: from Object, Fallback: Map)
            const botId = s.botId || this.resolveBotId(s.symbol);

            if (!botId) return;

            const old = oldSymbols.find(o => o.symbol === s.symbol);
            if (!old) {
                // Added
                affectedBots.add(botId);
            } else {
                // Changed? (e.g. timeframe, settings) - Simple JSON check
                if (JSON.stringify(old) !== JSON.stringify(s)) {
                    affectedBots.add(botId);
                    if (old.botId && old.botId !== botId) affectedBots.add(old.botId); // If moved
                }
            }
        });

        // Check Removed
        oldSymbols.forEach(s => {
            const stillExists = symbols.find(n => n.symbol === s.symbol);
            if (!stillExists) {
                // Removed
                if (s.botId) affectedBots.add(s.botId);
            }
        });

        if (affectedBots.size > 0) {
            console.log(`[Sync] ♻️ Config Change detected for bots: ${Array.from(affectedBots).join(', ')}`);

            affectedBots.forEach(botId => {
                const worker = this.getWorker(botId, 'DATAFEED', 'ALL');
                if (worker) {
                    // Trigger Worker to Re-Read DB and Push Config
                    worker.postMessage({ type: 'CMD_PUSH_CONFIG' });
                } else {
                    // Check if bot is online via Registry to avoid spam
                    if (this.isBotOnline(botId)) {
                        console.warn(`[Sync] ⚠️ Bot ${botId} is Online but no DatafeedWorker found.`);
                    }
                }
            });
        } else {
            console.log(`[Sync] ℹ️ Config updated but no Bot-Level changes detected.`);
        }

        // 5. Trigger Cleanup / Startup sanity check (Registry based)
        // this.triggerStartupSync(); // Optional: Might be redundant if diff covers it. 
        // But useful for "Fresh Start" checks. Let's keep it but it will be fast (O(N_bots)).
        if (affectedBots.size === 0 && symbols.length > 0) {
            // If no diff detected (e.g. startup load), trigger full check
            this.triggerStartupSync();
        }
    }

    startHandshakeToAllBots() {
        // Refactored: Use botStatus or unique IDs derived from it
        const uniqueBotIds = new Set();
        Object.values(this.botStatus).forEach(status => {
            if (status && status.id) uniqueBotIds.add(status.id);
        });

        uniqueBotIds.forEach(botId => {
            if (this.isBotOnline(botId)) {
                this.sendConfigHandshake(botId);
            }
        });
    }

    // Task 0233: Immediate Symbol Addition Pipeline
    async addConfiguredSymbol(symbolObj) {
        if (!symbolObj || !symbolObj.symbol) return;

        console.log(`[Sync] ➕ Adding New Symbol Configuration: ${symbolObj.symbol} `);

        // 1. Update In-Memory Config
        // Check duplicates
        const exists = this.configuredSymbols.find(s => s.symbol === symbolObj.symbol);
        if (!exists) {
            this.configuredSymbols.push(symbolObj);

            // 2. Persist to DB
            db.setConfig('selected_symbols', this.configuredSymbols);

            // 3. Rebuild Maps (Crucial for BotID resolution)
            this.rebuildSymbolMaps();

            // 4. Spawn Worker Immediately
            if (true) {
                // If botId is known, use it. Otherwise PipeServer infers/uses default.
                // this.spawnSymbolWorker(symbolObj.symbol, symbolObj.botId); // REMOVED
            }

            // 5. Trigger MT5 Subscription (Opens Chart)
            // We simulate a "User Subscribe" to force the chain
            // const traceId = `add - ${ Date.now() } `;
            // await this.handleSubscribe('system-add', symbolObj.symbol, 'M1', traceId); 
            // OR explicitly call syncSubscriptions if we want to be cleaner
            this.syncSubscriptions(symbolObj.botId);

            console.log(`[Sync] ✅ Symbol ${symbolObj.symbol} added and pipeline triggered.`);
            return true;
        } else {
            console.log(`[Sync] ℹ️ Symbol ${symbolObj.symbol} already configured.`);
            return false;
        }
    }

    getStatusSnapshot(symbol) {
        if (!this.syncStatus) this.syncStatus = new Map();
        if (!this.syncStatus.has(symbol)) return {};
        // Convert Map to standard object for frontend compatibility
        return Object.fromEntries(this.syncStatus.get(symbol));
    }

    updateSyncStatus(symbol, timeframe, status, message = null) {
        if (!this.syncStatus) this.syncStatus = new Map();
        if (!this.syncStatus.has(symbol)) this.syncStatus.set(symbol, new Map());
        const tfMap = this.syncStatus.get(symbol);
        const prev = tfMap.get(timeframe) || {};

        if (prev.status !== status || prev.message !== message) {
            console.log(`[StatusFlow] 🔄 STATE CHANGE: ${symbol} ${timeframe} | ${prev.status || 'N/A'} -> ${status} | Msg: ${message || ''}`);
            tfMap.set(timeframe, { status, message, timestamp: Date.now() });

            if (this.socketServer && this.socketServer.io) {
                // Emit Status Update (for Dot Indicator)
                this.socketServer.io.to(symbol).emit('sync_status', { symbol, timeframe, status, message });

                // Broadcast to global sanity topic for UI status tiles
                this.socketServer.emit('sanity_update', { symbol, timeframe, status, message, timestamp: Date.now() });

                // Close the gap: "DB Updated" -> "Frontend Redraw"
                if (status === 'READY') {
                    this.socketServer.io.to(symbol).emit('history_update', {
                        symbol,
                        timeframe,
                        source: 'ATRS_READY'
                    });
                }
            }
        }
    }

    triggerStartupSync() {
        // Task 0209: Startup Freshness Check (User Demand: "Must check DBs on startup")
        // Refactored: We delegate the "Check & Sync" logic to the DatafeedWorker via CMD_PUSH_CONFIG.
        // The Worker will read the Asset Mappings and decide what to send to the Bot.

        console.log("[Sync] 🚀 Triggering Startup Configuration Check...");

        if (!this.configuredSymbols || this.configuredSymbols.length === 0) {
            console.log("[Sync] ℹ️ No symbols configured. Skipping startup sync.");
            return;
        }

        const botsToSync = new Set();
        this.configuredSymbols.forEach(item => {
            const sym = item.symbol || item.name || item;
            const botId = this.resolveBotId(sym);
            // Only trigger if bot is online (otherwise it happens on connect)
            if (botId && this.isBotOnline(botId)) {
                botsToSync.add(botId);
            }
        });

        botsToSync.forEach(botId => {
            console.log(`[Sync] 🔄 Startup: Triggering Config Push for ${botId}`);

            // FIND THE WORKER (Delegation)
            // Refactored to Generic Call (User Demand: "Professional/Generic")
            const worker = this.getWorker(botId, 'DATAFEED', 'ALL');

            if (worker) {
                worker.postMessage({ type: 'CMD_PUSH_CONFIG' });
            } else {
                console.log(`[Sync] ⚠️ No DatafeedWorker found for ${botId}. Skipping config push.`);
            }
        });

        console.log(`[Sync] ✅ Startup Triggered for ${botsToSync.size} bots.`);
    }

    /**
     * Generic Worker Lookup
     * Constructs standard Routing Key: BotID:Function:Symbol
     */
    getWorker(botId, func, symbol) {
        if (!botId || !func || !symbol) return null;

        // Standard Routing Key Construction
        const routingKey = `${botId}:${func}:${symbol}`;

        if (this.workers.has(routingKey)) {
            return this.workers.get(routingKey);
        }

        return null;
    }

    /* triggerBackgroundSync REMOVED */

    // --- SUBSCRIPTION & HISTORY LOGIC (RESTORED) ---
    async handleSubscribe(connectionId, symbol, timeframe, traceId) {
        console.log(`[Sync] ➕ User Subscribed to ${symbol} ${timeframe}`);

        const msg = { type: 'CMD_SUBSCRIBE_TICKS', content: { symbol, timeframe } };
        let workerFound = false;

        // Route to Active TICK_SPY Worker for this Symbol
        const sw = this.getWorkerBySymbol('TICK_SPY', symbol);
        if (sw) {
            sw.postMessage(msg);
            workerFound = true;
        } else {
            console.log(`[Sync] ⚠️ Subscribe: TICK_SPY Worker not found for ${symbol}`);
        }

        // Route to Active HISTORY Worker for this Symbol
        const hw = this.getWorkerBySymbol('HISTORY', symbol);
        if (hw) {
            hw.postMessage(msg);
            workerFound = true;
        } else {
            console.log(`[Sync] ⚠️ Subscribe: HISTORY Worker not found for ${symbol}`);
        }

        // Record Subscription State
        if (!this.activeSubscriptions) this.activeSubscriptions = new Map();
        const subKey = `${symbol}:${timeframe}`;
        if (!this.activeSubscriptions.has(subKey)) {
            this.activeSubscriptions.set(subKey, new Set());
        }
        this.activeSubscriptions.get(subKey).add(connectionId);

        // Update Overall UI Sync Status
        if (workerFound) {
            this.updateSyncStatus(symbol, timeframe, 'READY', 'Connected');
        } else {
            this.updateSyncStatus(symbol, timeframe, 'OFFLINE', 'No Active Bot');
        }

        // Return Data Snapshot immediately
        const limit = 1000;
        let history = this.db.getHistory(symbol, timeframe, limit);
        let hot = this.hotCandles ? this.hotCandles.get(`${symbol}_${timeframe}`) : null;
        return { history, hot };
    }

    handleUnsubscribe(connectionId, symbol, timeframe) {
        console.log(`[Sync] ➖ User Unsubscribed from ${symbol} ${timeframe}`);
        let shouldLeaveRoom = false;

        if (this.activeSubscriptions) {
            const subKey = `${symbol}:${timeframe}`;
            const subs = this.activeSubscriptions.get(subKey);
            if (subs) {
                subs.delete(connectionId);
                // If no more users are watching this timeframe for this symbol at all
                if (subs.size === 0) {
                    this.activeSubscriptions.delete(subKey);

                    const msg = { type: 'CMD_UNSUBSCRIBE_TICKS', content: { symbol, timeframe } };

                    // Route to Active TICK_SPY Worker
                    const sw = this.getWorkerBySymbol('TICK_SPY', symbol);
                    if (sw) sw.postMessage(msg);

                    // Route to Active HISTORY Worker
                    const hw = this.getWorkerBySymbol('HISTORY', symbol);
                    if (hw) hw.postMessage(msg);
                }
            }

            // Check if THIS SPECIFIC connectionId is still subscribed to ANY other timeframe for this symbol
            let hasOtherTFs = false;
            for (const [key, users] of this.activeSubscriptions.entries()) {
                if (key.startsWith(`${symbol}:`) && users.has(connectionId)) {
                    hasOtherTFs = true;
                    break;
                }
            }

            // Only tell SocketServer to leave the global symbol room if they have no other TFs active
            shouldLeaveRoom = !hasOtherTFs;
        }

        return shouldLeaveRoom;
    }

    fetchHistoryRange(symbol, timeframe, toTimestamp, limit) {
        return new Promise((resolve, reject) => {
            const botId = this.resolveBotId(symbol);
            if (!botId) return reject(new Error('Bot Offline'));

            const workerKey = `${botId}:TICK_SPY:${symbol}`; // Or HISTORY
            const worker = this.getWorkerBySymbol('HISTORY', symbol) || this.getWorkerBySymbol('DATAFEED', symbol);
            if (!worker) return reject(new Error('Worker not found for history fetch'));

            worker.postMessage({
                type: 'CMD_SYNCHRONIZE_DATA',
                content: {
                    symbol: symbol,
                    timeframe: timeframe,
                    mode: 'GAP_FILL',
                    lastTime: Math.floor(toTimestamp / 1000), // MQL5 expects seconds if GAP
                    count: limit
                }
            });
            resolve();
        });
    }

    ensureFreshHistory(symbol, timeframe, force) {
        return Promise.resolve(); // Delegated to workers
    }

    ensureHistoryDepth(symbol, timeframe, limit) {
        return Promise.resolve(); // Delegated to fetchHistoryRange via SocketServer
    }
    // --- PUSH PROTOCOL HANDSHAKE ---
    sendConfigHandshake(botId) {
        console.log(`[Sync] 🤝 Sending Configuration Handshake to ${botId}...`);

        // Filter symbols for this bot
        const internalSymbols = this.configuredSymbols.filter(c =>
            (!c.botId || c.botId === botId)
        ).map(c => {
            // Broker Symbol: derived from 'datafeedSymbol' (which holds the source from frontend)
            // If missing, fallback to 'symbol'

            let brokerSym = c.datafeedSymbol || c.symbol;

            // Clean Prefix (e.g. "BotID:Symbol" -> "Symbol")
            if (brokerSym && typeof brokerSym === 'string' && brokerSym.includes(':')) {
                const parts = brokerSym.split(':');
                brokerSym = parts[parts.length - 1];
            }

            return {
                broker: brokerSym,
                internal: c.symbol // In config object, 'symbol' IS the Internal Identity (e.g. US100)
            };
        });

        if (internalSymbols.length === 0) {
            console.log(`[Sync] ⚠️ No symbols configured for ${botId}.Skipping Handshake.`);
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
            symbol: '*', // Config is global for the bot
            sender: 'App',
            timestamp: Date.now(),
            customId: `cfg - ${botId} -${Date.now()} `,
            isActive: 1 // Explicitly Active for handshake
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
        this.symbolToConfigMap.clear();
        this.botToSymbolsMap.clear();

        this.enrichConfiguredSymbols(); // Ensure datafeedSymbol is populated from DB

        for (const item of this.configuredSymbols) {
            const symbol = item.symbol || item.originalName || item;
            let botId = item.botId;

            // Sanitizer removed as DB is verified clean.

            if (typeof symbol === 'string') {
                // Map symbol -> config
                if (typeof item === 'object') {
                    this.symbolToConfigMap.set(symbol, item);

                    // Also map originalName if different
                    if (item.originalName && item.originalName !== symbol) {
                        this.symbolToConfigMap.set(item.originalName, item);
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

        console.log(`[Sync] 🗺️ Rebuilt Symbol Maps: ${this.botToSymbolsMap.size} bots, ${this.brokerSymbolToConfigMap.size} reverse mappings.`);
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

    /**
     * GENERIC ROUTING: Forward Message to Worker
     * Validates BotId/Function/Symbol and routes to the correct worker instance.
     */
    routeToWorker(msg) {
        // 1. Extract Routing Info
        const botId = msg.botId || msg.id;
        // Default function if missing (Protocol should provide it)
        const func = msg.func || 'TICK_SPY';
        // FIX: Robust Extraction (Unwrap if needed)
        let symbol = msg.symbol || (msg.payload && msg.payload.symbol);

        // FALLBACK: If symbol is missing but functional role implies global scope (DATAFEED/TRADING/HISTORY)
        if (!symbol && (func === 'DATAFEED' || func === 'TRADING')) {
            symbol = 'ALL';
        }

        if (!botId || !symbol) {
            console.warn(`[SystemOrchestrator] ⚠️ Routing Failed: Missing Identity in Msg (BotId=${botId}, Symbol=${symbol})`, msg);
            return;
        }

        // 2. Resolve Routing Key
        // Try precise key first
        let routingKey = msg.routingKey;
        if (!routingKey) {
            // Helper needed? Or construct manually.
            // Using a simple construction if not provided.
            routingKey = `${botId}:${func}:${symbol}`;
        }

        // 3. Lookup Worker
        let worker = this.workers.get(routingKey);

        // Fallback: Try generic lookup if key might be wrong
        if (!worker) {
            worker = this.getWorkerBySymbol(func, symbol);
        }

        if (worker) {
            // 4. Forward Message (PostMessage)
            // We pass the WHOLE message or just payload?
            // Workers expect { type, content/payload }
            // UnifiedBotProtocol sends msg with { type, payload, ... }
            worker.postMessage(msg);
        } else {
            // 5. Auto-Spawn (Optional? Or just warn)
            // User wants "Generic Factory".
            // If worker missing, maybe we should warn logic.
            // But for HISTORY, we expect worker to exist?
            // Actually, if it's HISTORY_BATCH, likely the worker initiated it.
            // If TICK_DATA, we might need to spawn.
            console.warn(`[SystemOrchestrator] ⚠️ No Worker found for ${symbol} (${func}). Dropping ${msg.type}.`);
        }
    }

    // handleIncomingBarData/MarketData -> Removed (Legacy)


    getTfDurationMs(tf) {
        const map = {
            'M1': 60000,
            'M2': 120000,
            'M3': 180000,
            'M5': 300000,
            'M10': 600000,
            'M15': 900000,
            'M30': 1800000,
            'H1': 3600000,
            'H2': 7200000,
            'H3': 10800000,
            'H4': 14400000,
            'H6': 21600000,
            'H8': 28800000,
            'H12': 43200000,
            'D1': 86400000,
            'W1': 604800000,
            'MN1': 2592000000
        };
        return map[tf] || 60000;
    }
    handleProvisionReport(senderId, content) {
        console.log(`[Sync] 🛡️ PROVISION REPORT from ${senderId}: `, content);
        // content: { success: true/false, symbol: "..." } or array

        // If simple success payload
        if (content && content.success) {
            // Task 0202: Auto-Heal / Ensure Workers are Running
            // If the Bot reports it has provisioned charts, we MUST ensure the corresponding backend worker is alive.
            // If it crashed previously, this will respawn it.

            const items = Array.isArray(content.success) ? content.success : (content.symbol ? [content] : []);

            if (items.length > 0) {
                console.log(`[Sync] 🛡️ Processing PROVISION REPORT: Ensuring ${items.length} workers are running...`);
                items.forEach(item => {
                    const symbol = item.internal || item.symbol || item.name; // Robust access
                    if (symbol) {
                        // Idempotent call: Will only spawn if missing
                        // Use Factory Spawn logic
                        const botId = senderId;
                        const routingKey = wsManager.makeKey(botId, 'TICK_SPY', symbol);
                        if (!this.workers.has(routingKey)) {
                            this.spawnWorker(routingKey, botId, 'TICK_SPY', symbol);
                        }
                    }
                });
                console.log(`[Sync] ✅ Bulk Provisioning Verification Complete for ${senderId}`);
            } else {
                console.log(`[Sync] ℹ️ Bulk Provisioning Empty / Done for ${senderId}`);
            }
        }
    }
    // --- TASK 0244: Prioritization Helper ---
    getPriorityTimeframes(symbol) {
        // Find which Timeframes have active clients
        // activeSubscriptions keys: "SYMBOL:TF"
        const priorityTfs = [];
        const prefix = symbol + ":";

        for (const key of this.activeSubscriptions.keys()) {
            if (key.startsWith(prefix)) {
                const parts = key.split(':');
                if (parts.length === 2) {
                    priorityTfs.push(parts[1]);
                }
            }
        }
        return priorityTfs;
    }

    /**
     * Set the SocketServer instance for Frontend Communication
     * @param {*} socketServer 
     */
    setSocketServer(socketServer) {
        this.socketServer = socketServer;
        console.log("[SystemOrchestrator] ✅ SocketServer Linked Successfully.");
    }

    // --- TASK 0300: System File Monitoring ---
    async getSystemFileStats() {
        let masterDir = config.MT5_MQL5_DIR;

        // TASK: Dynamic Config Override from Cockpit
        try {
            const systemJsonPath = path.join(__dirname, '../../../trading-cockpit/data/system.json');
            if (fs.existsSync(systemJsonPath)) {
                const data = JSON.parse(fs.readFileSync(systemJsonPath, 'utf-8'));
                if (data.MT5_MQL5_DIR && data.MT5_MQL5_DIR.trim() !== '') {
                    // Log removed by patch
                    masterDir = data.MT5_MQL5_DIR;
                }
            } else {
                // Low noise log
                // console.log(`[SystemFileMonitor] No system.json found at ${systemJsonPath}`);
            }
        } catch (e) {
            // Ignore (Fallback to config.js)
        }

        if (!masterDir || masterDir.includes('Placeholder')) {
            return [];
        }

        const filesToMonitor = [
            { id: 'datafeed_expert', path: 'Experts\\DatafeedExpert.ex5', name: 'DatafeedExpert.ex5' },
            { id: 'trading_expert', path: 'Experts\\TradingExpert.ex5', name: 'TradingExpert.ex5' }, // RENAME requested
            { id: 'tick_spy', path: 'Indicators\\TickSpy.ex5', name: 'TickSpy.ex5' },
            { id: 'history_worker', path: 'Indicators\\HistoryWorker.ex5', name: 'HistoryWorker.ex5' },
            { id: 'web_bridge', path: 'Libraries\\MT5WebBridge.dll', name: 'MT5WebBridge.dll' }
        ];

        const stats = [];
        for (const file of filesToMonitor) {
            try {
                const fullPath = path.join(masterDir, file.path);
                if (fs.existsSync(fullPath)) {
                    const fstat = fs.statSync(fullPath);
                    stats.push({
                        ...file,
                        mtime: fstat.mtime.getTime(), // Send Timestamp
                        size: fstat.size,
                        exists: true
                    });
                } else {
                    stats.push({ ...file, exists: false, mtime: null });
                }
            } catch (e) {
                stats.push({ ...file, exists: false, error: e.message });
            }
        }
        return stats;
    }

    broadcastSystemFileStats() {
        if (!this.socketServer) return;

        this.getSystemFileStats().then(stats => {
            // Support both SocketService wrapper and raw IO
            if (this.socketServer.io) {
                this.socketServer.io.emit('system_files_update', stats);
            } else if (this.socketServer.emit) {
                try {
                    this.socketServer.emit('system_files_update', stats);
                } catch (e) { console.error("Broadcast Stats Error:", e); }
            }
        });
    }

    startSystemFileMonitor() {
        console.log("[SystemOrchestrator] 📂 Starting System File Monitor...");
        // Initial Emit
        setTimeout(() => this.broadcastSystemFileStats(), 2000);

        // Poll every 10 seconds (User request: Fast updates)
        setInterval(() => {
            this.broadcastSystemFileStats();
        }, 10000);
    }

    // --- TASK 0301: Remote Restart Logic ---
    async restartAccounts(type, targetId = null, scope = null) {
        console.log(`[System:Restart] Triggered: Type=${type}, Target=${targetId}, Scope=${scope}`);

        let targets = [];
        const accounts = this.db.getAccounts();

        if (type === 'ALL') {
            targets = accounts;
        } else if (type === 'ACTIVE') {
            // Active means status RUNNING or Online in BotStatus
            targets = accounts.filter(a => a.status === 'RUNNING');
        } else if (type === 'SINGLE' && targetId) {
            const acc = accounts.find(a => a.id === targetId);
            if (acc) targets = [acc];
        }

        // Apply Scope Filter
        if (scope === 'TRADING') {
            targets = targets.filter(a => !a.isDatafeed && a.type !== 'DATAFEED');
        } else if (scope === 'DATAFEED') {
            targets = targets.filter(a => a.isDatafeed || a.type === 'DATAFEED');
        }

        console.log(`[System:Restart] Targets found: ${targets.length}`);

        for (const acc of targets) {
            await this.restartAccount(acc);
        }
    }

    async restartAccount(acc) {
        if (acc.platform === 'MT5' || (!acc.platform && acc.id.startsWith('FTMO'))) {
            const scriptPath = path.join(__dirname, '../../scripts/restart_terminal.ps1');
            const exePath = config.MT5_TERMINAL_EXE;
            const pid = acc.pid || 0;
            const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -ProcessName "terminal64" -ExecutablePath "${exePath}" -PidToKill ${pid}`;

            console.log(`[System:Restart] Executing for ${acc.name} (PID: ${pid})...`);

            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    console.error(`[System:Restart] Failed to restart ${acc.name}:`, err);
                } else {
                    console.log(`[System:Restart] Output for ${acc.name}:`, stdout.trim());
                }
            });
        } else if (acc.platform === 'NT8') {
            console.log(`[System:Restart] NT8 Restart not fully implemented yet.`);
        }
    }
}

// ENFORCE SINGLETON (Standard Node.js Caching)
// Removed global check to prevent stale instances during hot-reload
console.log(`[SystemOrchestrator] 🆕 Creating FRESH Instance(v${Date.now()})`);
module.exports = new SystemOrchestrator();
