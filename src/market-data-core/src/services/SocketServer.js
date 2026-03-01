
const { Server } = require("socket.io");
const http = require('http');
const express = require('express');
const cors = require('cors');
const config = require('../config');
const systemOrchestrator = require('./SystemOrchestrator');
const db = require('./DatabaseService');

const assetMappingService = require('./AssetMappingService');
const tradeDistributionService = require('./TradeDistributionService');
const sessionEngine = require('./SessionEngine');
const AuthService = require('./AuthService');

const { WebSocketServer } = require('ws');
const botConfigService = require('./BotConfigService'); // Import Service
const systemConfigService = require('./SystemConfigService');
// ... imports
const fs = require('fs');
const path = require('path');
const https = require('https');
const autoUpdateService = require('./AutoUpdateService');

class SocketServer {
    constructor() {
        this.app = express();
        
        const sysConfig = systemConfigService.getConfig();
        const useSSL = sysConfig?.backend?.useSSL === true;

        if (useSSL) {
            try {
                const projectRoot = sysConfig.projectRoot || path.join(__dirname, '../../../../');
                const certPath = path.join(projectRoot, 'certs', 'server.crt');
                const keyPath = path.join(projectRoot, 'certs', 'server.key');
                // Support PFX alternative
                const pfxPath = path.join(projectRoot, 'certs', 'server.pfx');
                
                let sslOptions = {};
                
                if (fs.existsSync(pfxPath)) {
                    console.log(`[SocketServer] Starting with SSL (PFX) from: ${pfxPath}`);
                    sslOptions = {
                        pfx: fs.readFileSync(pfxPath),
                        passphrase: sysConfig.backend.pfxPassword || 'cockpit'
                    };
                } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
                    console.log(`[SocketServer] Starting with SSL (CRT/KEY) from: ${certPath}`);
                    sslOptions = {
                        key: fs.readFileSync(keyPath),
                        cert: fs.readFileSync(certPath)
                    };
                } else {
                    console.warn(`[SocketServer] SSL enabled but no certificates found in ${path.join(projectRoot, 'certs')}. Initializing without SSL.`);
                    throw new Error("Missing certificates");
                }
                
                this.server = https.createServer(sslOptions, this.app);
            } catch (err) {
                console.error(`[SocketServer] SSL Initialization failed: ${err.message}. Falling back to HTTP.`);
                this.server = http.createServer(this.app);
            }
        } else {
            console.log(`[SocketServer] Starting with standard HTTP (No SSL configuration found).`);
            this.server = http.createServer(this.app);
        }

        // Raw Websocket Server for MQL5 Bots (who can't speak Socket.IO)
        this.wss = new WebSocketServer({ noServer: true });
        this.botWsMap = new Map(); // BotID -> WS

        this.server.on('upgrade', (request, socket, head) => {
            const pathname = request.url;
            console.log(`[SocketServer] Upgrade Request: ${pathname} from ${request.socket.remoteAddress}`);
            if (pathname === '/mql5' || pathname === '/') {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit('connection', ws, request);
                });
            }
            // Else let Socket.IO handle it
        });

        this.io = new Server(this.server, {
            cors: {
                origin: (origin, callback) => {
                    callback(null, true);
                },
                methods: ["GET", "POST", "OPTIONS"],
                credentials: true
            },
            allowEIO3: true,
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            maxHttpBufferSize: 1e8 // 100 MB Limit
        });

        // FIX: Prevent ECONNRESET race conditions with Next.js/Node 18+ fetch
        // Node default is 5s. Next.js/Browsers often keep alive longer.
        this.server.keepAliveTimeout = 65000; // 65 seconds
        this.server.headersTimeout = 66000;   // 66 seconds (Must be > keepAliveTimeout)

        this.setupExpress();
        this.setupSocket();
        this.setupBotSocket(); // MQL5 Handling

        // Inject into SyncManager so it can emit events
        systemOrchestrator.socketServer = this; // Pass THIS instance so SyncManager can accept sendToBot calls. 

        this.initializeDefaultUser();
    }

    initializeDefaultUser() {
        try {
            const sysConfig = systemConfigService.getConfig();
            const adminUser = db.getUserByUsername(sysConfig.systemUsername);
            if (!adminUser) {
                console.log(`[Auth] No user found for ${sysConfig.systemUsername}, creating default admin user from config...`);
                db.createUser(sysConfig.systemUsername, AuthService.hashPassword(sysConfig.systemPassword));
            }
            // For existing users, the Auth logic will check SystemConfigService first if it's the admin.
        } catch (e) {
            console.error("[Auth] Failed to initialize default user:", e);
        }
    }

    setupExpress() {
        this.app.use(express.static('public'));
        this.app.use(express.json({ limit: '50mb' })); // Support large JSON payloads
        this.app.use(cors());

        // --- SYSTEM CONFIG API ---
        this.app.get('/api/system/config', (req, res) => {
            const sysConfig = systemConfigService.getConfig();
            // Don't send password to frontend
            res.json({ success: true, config: { projectRoot: sysConfig.projectRoot, systemUsername: sysConfig.systemUsername } });
        });

        this.app.post('/api/system/config', (req, res) => {
            const { projectRoot, systemUsername, systemPassword } = req.body;
            const newConfig = { projectRoot, systemUsername };
            if (systemPassword) newConfig.systemPassword = systemPassword; // Only update if provided
            const success = systemConfigService.saveConfig(newConfig);
            res.json({ success });
        });

        // --- SYSTEM UPDATE API ---
        this.app.get('/api/system/update/status', (req, res) => {
            const status = autoUpdateService.getStatus();
            res.json({ success: true, status });
        });

        this.app.post('/api/system/update/execute', (req, res) => {
            const restartInstances = req.body?.restartInstances === true;
            const result = autoUpdateService.executeUpdate(restartInstances);
            if (result.success) {
                res.json({ success: true, message: result.message });
            } else {
                res.status(500).json({ success: false, error: result.message });
            }
        });

        // --- AUTH API ---
        this.app.post('/api/auth/login', (req, res) => {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ success: false, error: 'Missing credentials' });

            // Force load config from disk to catch manual edits without PM2 restart
            systemConfigService.loadConfig();
            const sysConfig = systemConfigService.getConfig();
            
            let isAuthenticated = false;
            let userId = 'admin';

            if (username === sysConfig.systemUsername && password === sysConfig.systemPassword) {
                isAuthenticated = true;
            } else {
                const user = db.getUserByUsername(username);
                if (user && AuthService.verifyPassword(password, user.password_hash)) {
                    isAuthenticated = true;
                    userId = user.id;
                }
            }

            if (!isAuthenticated) return res.status(401).json({ success: false, error: 'Invalid credentials' });

            const token = AuthService.generateToken({ id: userId, username: username });
            res.json({ success: true, token, user: { id: userId, username: username } });
        });

        // Apply JWT protection for API routes EXCEPT login and public endpoints
        this.app.use('/api', (req, res, next) => {
            // Exclude public endpoints if any are strictly public
            if (req.path === '/auth/login' || req.path === '/status/heartbeat') {
                return next();
            }

            // Allow internal loopback requests (from Next.js Server-Side API routes)
            const clientIp = req.ip || req.connection?.remoteAddress;
            if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
                return next();
            }

            AuthService.authenticateJWT(req, res, next);
        });

        // Legacy / Heartbeat Endpoints

        // Legacy / Heartbeat Endpoints
        this.app.get(['/status/heartbeat', '/api/status/heartbeat'], (req, res) => {
            // Return collected statuses from SyncManager
            const botStatuses = { ...systemOrchestrator.botStatus };

            // Inject Timezone Info
            const tzService = require('./TimezoneNormalizationService');
            Object.keys(botStatuses).forEach(botId => {
                botStatuses[botId] = {
                    ...botStatuses[botId],
                    timezone: tzService.getBotZone(botId) || 'Unknown'
                };
            });

            res.json({
                success: true,
                serverTime: Date.now(),
                services: {
                    marketData: { alive: true },
                    ...botStatuses
                }
            });
        });

        // Command Endpoint (Optional, if HTTP used)
        this.app.post('/sendCommand', (req, res) => {
            const cmd = req.body;
            cmd.timestamp = Date.now();
            cmd.customId = `cmd-${Date.now()}`;
            db.logMessage({
                ...cmd,
                sender: 'App',
                botId: cmd.targetBotId || '**'
            });
            res.json({ success: true, commandId: cmd.customId });
        });

        // --- NinjaTrader Lifecycle Control ---
        this.app.post('/api/admin/ninjatrader/start', (req, res) => {
            console.log("[API] Received Request to START NinjaTrader...");
            const { username, password } = req.body;

            try {
                // Lazy Load Bootstrapper to avoid path issues if not deployed
                // Note: Path depends on deployment structure. Assuming standard source layout.
                const path = require('path');
                // Correct path from src/market-data-core/src/services
                const managerPath = path.resolve(__dirname, '../bootstrapper/nt8-process-manager.js');

                console.log(`[API] Resolving Bootstrapper at: ${managerPath}`);

                if (require('fs').existsSync(managerPath)) {
                    const nt8Manager = require(managerPath);
                    // Credentials passed directly
                    nt8Manager.startNinjaTrader(username, password);
                    res.json({ success: true, message: "NinjaTrader Start Triggered" });
                } else {
                    console.error(`[API] Bootstrapper not found at ${managerPath}`);
                    res.status(404).json({ success: false, error: "Bootstrapper module not found on server." });
                }
            } catch (e) {
                console.error("[API] Failed to start NT8:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // Symbols Endpoint (For SymbolBrowser)
        this.app.get('/api/symbols', (req, res) => {
            // Return configured symbols enriched with metadata (digits, path, desc) from availableSymbols
            const configured = systemOrchestrator.configuredSymbols || [];
            const available = systemOrchestrator.availableSymbols || [];

            const enriched = configured.map(conf => {
                // RESOLVE MAPPING via AssetMappingService (Single Source of Truth)
                const internalName = conf.originalName || conf.symbol;
                const mapping = assetMappingService.cache.get(internalName);
                const mappedName = mapping ? mapping.datafeed_symbol : (conf.datafeedSymbol || internalName);

                // Find matching available symbol using the MAPPED name (Broker Name)
                // Logic matches resolveBotId: Check name and botId
                let brokerSymbolOnly = mappedName;
                if (mappedName.includes(':')) {
                    brokerSymbolOnly = mappedName.split(':')[1];
                }

                let match = available.find(s => {
                    // 0. Check BotID first
                    if (conf.botId && s.botId !== conf.botId) return false;

                    const name = s.name;
                    // 1. Exact Match
                    if (name === mappedName || name === internalName || name === brokerSymbolOnly) return true;
                    // 2. Suffix Match (e.g. "NDX100.pro" starts with "NDX100")
                    if (name.startsWith(brokerSymbolOnly) && name.length > brokerSymbolOnly.length) return true;
                    return false;
                });

                // Task 0142: Prepare Fallback Candidate
                const matchBySymbolOnly = available.find(s => {
                    const name = s.name;
                    if (name === mappedName || name === internalName || name === brokerSymbolOnly) return true;
                    if (name.startsWith(brokerSymbolOnly) && name.length > brokerSymbolOnly.length) return true;
                    return false;
                });

                // DEBUG MATCHING
                // Task 0142: Metadata Fallback (Fix for 'Match Result: NONE')
                // If strict match fails (Bot is offline), try to find ANY bot with this symbol just for digits/desc.
                if (!match && matchBySymbolOnly) {
                    // console.log(`[API] ⚠️ Strict Match failed for ${conf.symbol}. Using Metadata Fallback from ${matchBySymbolOnly.botId}`);
                    match = matchBySymbolOnly;
                }

                if (conf.symbol.includes('DE40') || conf.symbol.includes('GER40') || conf.symbol.includes('EURUSD') || conf.symbol.includes('US500') || conf.symbol.includes('US100')) {
                    console.log(`[DEBUG] Matching ${conf.symbol} (Internal: ${internalName}) -> Mapped: ${mappedName}`);
                    console.log(`[DEBUG] Match Result:`, match ? `${match.name} (Digits: ${match.digits})` : 'NONE');
                }

                if (match) {
                    console.log(`[API] Enriched ${conf.symbol} with Digits: ${match.digits}`);
                    return {
                        ...conf,
                        name: internalName, // Force display name
                        digits: match.digits,
                        path: match.path,
                        desc: match.desc,
                        // Ensure critical fields aren't overwritten if conf has them
                    };
                }
                // console.warn(`[API] No enrichment match for ${conf.symbol}`);
                return {
                    ...conf,
                    name: conf.originalName || conf.symbol
                };
            });

            // console.log(`[API] Serving /symbols. Count: ${enriched.length}`);
            res.json({ symbols: enriched });
        });

        this.app.get('/api/available-symbols', (req, res) => {
            res.json({ symbols: systemOrchestrator.availableSymbols || [] });
        });

        // NEW: ICT Sessions Endpoint
        this.app.get('/api/indicators/ict-sessions', async (req, res) => {
            if (systemOrchestrator.getFeatures().ENABLE_INDICATOR_LOGGING) {
                console.log(`[API] ict-sessions REQ received: ${JSON.stringify(req.query)}`);
            }
            try {
                let { symbol, timeframe, limit, settings, to } = req.query;
                limit = parseInt(limit) || 1000;

                let parsedSettings = {};
                try {
                    parsedSettings = settings ? JSON.parse(settings) : {};
                } catch (e) {
                    console.error("[API] Failed to parse settings JSON", e);
                }

                // Default Sessions if none provided
                if (!parsedSettings.sessions) {
                    parsedSettings.sessions = [
                        { type: 'ASIA', range: '2000-0000', enabled: true },
                        { type: 'LONDON', range: '0300-1100', enabled: true },
                        { type: 'NY', range: '0800-1700', enabled: true }
                    ];
                }

                // Fetch History
                // Note: Sessions need deeper history than visible? Maybe.
                // For now, use the same limit.
                const toLog = to ? new Date(parseInt(to)).toISOString() : "LATEST";
                if (systemOrchestrator.getFeatures().ENABLE_INDICATOR_LOGGING) {
                    console.log(`[API] Fetching history for ${symbol}... To=${toLog}`);
                }
                let candles = db.getHistory(symbol, timeframe, limit, to);
                if (systemOrchestrator.getFeatures().ENABLE_INDICATOR_LOGGING) {
                    console.log(`[API] History fetched. Count: ${candles.length}`);
                }

                if (candles.length === 0) {
                    // Try fetching if empty?
                    // await systemOrchestrator.ensureFreshHistory(symbol, timeframe);
                    // candles = db.getHistory(symbol, timeframe, limit);
                }

                const sessions = await sessionEngine.calculateSessions(symbol, candles, parsedSettings);
                res.json({ success: true, sessions });

            } catch (e) {
                console.error("[API] ICT Sessions Error", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // History Endpoint (For Charts)
        // ✅ PERFORMANCE FIX: Non-blocking with immediate response
        this.app.get('/api/history', async (req, res) => {
            try {
                let { symbol, timeframe, limit, to } = req.query;
                limit = parseInt(limit) || 10000;
                to = to ? parseInt(to) : null;

                const toLog = to ? new Date(to).toISOString() : "LATEST";

                // ENSURE FRESHNESS (Only `to` is not set, meaning we want LATEST)
                // ENSURE FRESHNESS: DISABLED (Legacy)
                // New Architecture (SymbolWorker) ensures freshness via background events.
                // We do NOT block or trigger sync here anymore. The Worker handles it.
                // if (!to) { ... } // REMOVED

                // Get from DB (what we have NOW)
                let candles = db.getHistory(symbol, timeframe, limit, to);

                // ✅ BACKFILL LOGIC: NON-BLOCKING - Respond immediately with partial data
                if (candles.length < limit && to) {
                    console.log(`[SocketServer] History Gap for ${symbol} ${timeframe}. Req: ${limit}, Found: ${candles.length}. Triggering BACKGROUND fetch from ${to}.`);

                    // ✅ NON-BLOCKING: Trigger fetch in background
                    // ✅ NON-BLOCKING: Trigger fetch in background via SymbolWorker
                    // Legacy: systemOrchestrator.fetchHistoryRange(...) -> Removed.
                    // New: Command SymbolWorker to fill the gap

                    // STRICT CHECK: Is Bot Online?
                    const targetBotId = systemOrchestrator.resolveBotId(symbol);
                    if (targetBotId && systemOrchestrator.isBotOnline(targetBotId)) {
                        if (systemOrchestrator.pipeServer) {
                            systemOrchestrator.sendCommand({
                                targetBotId: targetBotId,
                                type: 'CMD_SYNCHRONIZE_DATA',
                                content: {
                                    symbol: symbol,
                                    timeframe: timeframe,
                                    mode: 'GAP' // Treat as Gap Fill
                                }
                            });
                            console.log(`[SocketServer] 🔄 Triggered Background GAP Sync for ${symbol} ${timeframe}`);
                        }
                    } else {
                        console.log(`[SocketServer] 🛑 Skipping Background Fetch (Bot ${targetBotId} Offline)`);
                    }
                }

                // Append Hot Candle from In-Memory Cache if available AND we are fetching latest (no 'to')
                if (!to) {
                    const hot = systemOrchestrator.getHotCandle(symbol, timeframe);
                    if (hot) {
                        if (candles.length > 0) {
                            const last = candles[candles.length - 1];
                            if (last.time === hot.time) {
                                candles[candles.length - 1] = hot;
                            } else if (hot.time > last.time) {
                                candles.push(hot);
                            }
                        } else {
                            candles.push(hot);
                        }
                    }
                }

                // ✅ IMMEDIATE RESPONSE with partial flag
                res.json({
                    success: true,
                    candles,
                    partial: (candles.length < limit && to) // Flag if data is incomplete
                });
            } catch (e) {
                console.error("[SocketServer] History Error", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // Purge History Endpoint
        this.app.delete('/api/history', (req, res) => {
            try {
                const { symbol, pass } = req.body; // simple protection? nah dev env.
                const changes = db.purgeHistory(symbol);
                // Also trigger sync reset in SyncManager?
                systemOrchestrator.resetHotCandles(symbol);

                res.json({ success: true, purged: changes });
            } catch (e) {
                console.error("[SocketServer] Purge Error", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // Messages Endpoint (Legacy Poll)
        this.app.get('/api/getMessages', (req, res) => {
            const lastTimestamp = parseInt(req.query.lastTimestamp) || 0;
            const messages = db.getMessages(lastTimestamp);
            res.json({ success: true, messages });
        });

        // Sync Status Endpoint
        this.app.get('/api/sync-status', (req, res) => {
            const { symbol } = req.query;
            if (!symbol) return res.json({});
            const status = systemOrchestrator.getStatusSnapshot(symbol);
            res.json({ success: true, status });
        });

        // --- NEW: Polling Endpoint for Datafeed Status (500ms) ---
        this.app.get('/api/status/datafeed', (req, res) => {
            const { symbol } = req.query;
            if (!symbol) return res.json({ online: false, reason: 'No Symbol' });

            const botId = systemOrchestrator.resolveBotId(symbol);
            if (!botId) {
                return res.json({ online: false, reason: 'No Bot Resolved' });
            }

            // Strict Check: Is the DATAFEED function connected?
            // Key: <BotId>:DATAFEED:ALL
            const key = `${botId}:DATAFEED:ALL`;
            const isOnline = systemOrchestrator.isBotOnline(key);

            res.json({
                online: isOnline,
                botId: botId,
                key: key
            });
        });

        // --- Account Management (Restored for UI Visibility) ---

        // DEBUG: Latency Isolation Endpoint
        this.app.get('/api/ping', (req, res) => {
            res.set('Connection', 'close'); // Disable Keep-Alive for latency test
            res.send(`pong:${Date.now()}`);
        });

        this.app.get('/api/brokers', (req, res) => {
            try {
                const brokers = db.getBrokers();
                res.json(brokers);
            } catch (e) {
                console.error("[API] /api/brokers error:", e);
                res.status(500).json([]);
            }
        });

        // --- Economic Calendar ---
        this.app.get('/api/economic-calendar', (req, res) => {
            try {
                const { from, to } = req.query;
                const fromTs = from ? parseInt(from) : 0;
                const toTs = to ? parseInt(to) : 9999999999;
                const events = db.getCalendarEvents(fromTs, toTs);

                const ecs = require('./EconomicCalendarService');
                res.json({
                    success: true,
                    events,
                    missingNextMonth: ecs.missingFutureMonth
                });
            } catch (e) {
                console.error("[API] Error fetching calendar events:", e);
                res.status(500).json({ error: "Failed to fetch calendar events" });
            }
        });

        this.app.get('/api/accounts', (req, res) => {
            // NOTE: We do NOT force 'Connection: close' here anymore.
            // Browsers (Dashboard) benefit from Keep-Alive.
            // Internal Node Client (data.ts) sends 'Connection: close' in Request Header, which Express respects.
            const traceTime = Date.now();


            try {
                const accounts = db.getAccounts();
                const brokers = db.getBrokers();

                // Merge with Live Status from SyncManager
                const merged = accounts.map(acc => {
                    // MERGE REAL-TIME RUNTIME STATE
                    const status = systemOrchestrator.botStatus[acc.botId];
                    const isConnected = !!(status?.account?.connected || status?.connected);

                    // Dynamically reconstruct instancePath
                    const sysConfig = systemConfigService.getConfig();
                    let instanceFolder = null;
                    let constructedInstancePath = null;
                    
                    if (acc.platform === 'NT8') {
                        instanceFolder = 'NinjaTrader';
                    } else if (acc.platform === 'MT5') {
                        const broker = brokers.find(b => b.id === acc.brokerId);
                        // Attempt to resolve instanceFolder from active processes if available
                        let activeProcess = null;
                        if (systemOrchestrator.activeProcessesByBotId && typeof systemOrchestrator.activeProcessesByBotId.get === 'function') {
                            activeProcess = systemOrchestrator.activeProcessesByBotId.get(acc.botId);
                        }
                        
                        if (activeProcess && activeProcess.cmd && activeProcess.cmd.toLowerCase().includes('terminal64') && activeProcess.cmd.includes('/config:')) {
                            const configMatch = activeProcess.cmd.match(/\/config:.*\\([^\\]+)\\config\\/i);
                            if (configMatch && configMatch[1]) {
                                instanceFolder = configMatch[1]; // Use the folder name from the command line
                                // Expected running instance path with root-level metatrader layout
                                constructedInstancePath = path.join(sysConfig.projectRoot, 'components', 'metatrader', 'instances', instanceFolder);
                            }
                        }

                        // Fallback to old logic if not resolved from active process or if process not found
                        if (!constructedInstancePath && broker) {
                            instanceFolder = `MT_${broker.shorthand.replace(/\s+/g, '')}_${acc.login}`;
                            if (acc.accountType === 'DATAFEED' || acc.isDatafeed) {
                                instanceFolder += '_DATAFEED';
                            }
                            const path = require('path');
                            constructedInstancePath = path.join(sysConfig.projectRoot, 'components', 'metatrader', 'instances', instanceFolder);
                        }
                    }

                    // LAYER A: Truth from OS Process Loop (WMI Scanner in SystemOrchestrator)
                    const activePid = (instanceFolder && systemOrchestrator.activeProcesses)
                        ? systemOrchestrator.activeProcesses.get(instanceFolder)
                        : null;

                    const isRunningInOs = activePid !== null && activePid !== undefined;

                    return {
                        ...acc,
                        status: isRunningInOs ? 'RUNNING' : 'STOPPED', // Reconstructed ephemeral status
                        pid: activePid || 0,                           // Real-time OS PID
                        brokerConnectionStatus: isConnected ? 'CONNECTED' : 'DISCONNECTED',
                        balance: status?.account?.balance !== undefined ? status.account.balance : acc.balance,
                        equity: status?.account?.equity,
                        timezone: status?.timezone || acc.timezone,
                        platform: acc.platform || status?.platform || 'MT5',
                        instancePath: constructedInstancePath // Injected for frontend compatibility
                    };
                });

                const resolveBrokerId = (botId) => {
                    const shorthand = botId.split('_')[0];
                    const broker = brokers.find(b => b.shorthand === shorthand);
                    return broker ? broker.id : shorthand;
                };

                // Add "Detected" bots that are NOT in DB
                // Refactor: Iterate Global Status Map (removed tradingBots/datafeedBots arrays)
                Object.values(systemOrchestrator.botStatus).forEach(status => {
                    const botId = status.id || status.botId;
                    if (!botId) return;

                    // Skip if already merged from DB
                    if (merged.find(a => a.botId === botId)) return;

                    const login = String(status?.account?.login || botId.split('_')[1] || '0000');
                    // FILTER: Ignore '0000' or undefined logins
                    if (login === '0000' || login === 'undefined') return;

                    const role = status.function === 'DATAFEED' ? 'DATAFEED' : 'TRADING';

                    merged.push({
                        id: botId,
                        botId: botId,
                        brokerId: resolveBrokerId(botId),
                        login: login,
                        status: 'RUNNING',
                        accountType: role,
                        brokerConnectionStatus: status?.account?.connected ? 'CONNECTED' : 'DISCONNECTED',
                        isTest: status?.account?.isTest === true || false,
                        // Logic for Platform:
                        platform: status.platform || (botId.startsWith('NT8') ? 'NT8' : 'MT5'),
                        server: 'Detected'
                    });
                });



                // Deduplicate merged list by ID
                const uniqueAccounts = [];
                const seenIds = new Set();

                merged.forEach(acc => {
                    if (acc.id && !seenIds.has(acc.id)) {
                        seenIds.add(acc.id);
                        uniqueAccounts.push(acc);
                    } else if (!acc.id) {
                        // Fallback for missing IDs (Use Deterministic ID so Deletion works)
                        if (acc.login && acc.brokerId) {
                            // Simple deterministic ID: "fix_" + base64(brokerId_login)
                            // Using Buffer for Node environment
                            const raw = `${acc.brokerId}_${acc.login}`;
                            const hash = Buffer.from(raw).toString('base64').replace(/=/g, '');
                            acc.id = `fix_${hash}`;
                            console.log(`[API] Assigned Deterministic ID to missing-id account: ${acc.login} -> ${acc.id}`);
                        } else {
                            // Fallback to random if no login/broker
                            acc.id = `gen_${Math.random().toString(36).substring(7)}`;
                        }
                        uniqueAccounts.push(acc);
                    }
                });

                // console.timeEnd("API_ACCOUNTS_GEN");
                // console.log(`[PERF ${Date.now()}] [API] /api/accounts DONE. Sending JSON. Count: ${uniqueAccounts.length}`);
                res.json({ accounts: uniqueAccounts });
            } catch (e) {
                console.error("[API] /api/accounts error:", e);
                res.status(500).json([]);
            }
        });



        // CRUD Endpoints for Accounts (Backend)
        this.app.post('/api/accounts', (req, res) => {
            console.log(`[API] POST /accounts received. ID=${req.body.id} Status=${req.body.status} PID=${req.body.pid}`);
            db.saveAccount(req.body);
            res.json({ success: true });
        });

        this.app.post('/api/accounts/:id/size', (req, res) => {
            const { id } = req.params;
            const { size } = req.body;
            console.log(`[API] POST /accounts/${id}/size received. Size=${size}`);
            const success = db.saveAccountSize(id, parseFloat(size));
            res.json({ success });
        });

        this.app.delete('/api/accounts/:id', (req, res) => {
            db.deleteAccount(req.params.id);
            res.json({ success: true });
        });

        this.app.get('/api/brokers', (req, res) => {
            const brokers = db.getBrokers();
            try {
                res.json(db.getBrokers());
            } catch (e) {
                console.error("[API] Critical Error in /api/brokers:", e);
                res.status(503).json({ error: "Service Unavailable" });
            }
        });

        this.app.post('/api/brokers', (req, res) => {
            try {
                db.saveBroker(req.body);
                res.json({ success: true });
            } catch (e) {
                console.error("[API] Error saving broker:", e);
                res.status(500).json({ error: "Failed to save broker" });
            }
        });

        this.app.delete('/api/brokers/:id', (req, res) => {
            try {
                db.deleteBroker(req.params.id);
                res.json({ success: true });
            } catch (e) {
                console.error("[API] Error deleting broker:", e);
                res.status(500).json({ error: "Failed to delete broker" });
            }
        });

        // --- Bot Configuration API ---

        this.app.get('/api/bot-config/:botId', (req, res) => {
            const { botId } = req.params;
            res.json({ success: true, config: botConfigService.getConfig(botId) });
        });

        this.app.post('/api/bot-config/:botId', (req, res) => {
            const { botId } = req.params;
            const config = req.body;
            console.log(`[API] Updating Config for ${botId}:`, config);

            const newConfig = botConfigService.setConfig(botId, config);

            // Immediate Push to Bot if Online
            if (systemOrchestrator.isBotOnline(botId)) { // Works for simple BotID
                systemOrchestrator.sendToBot(botId, "CMD_UPDATE_CONFIG", newConfig);
            } else {
                // Try looking up routing key?
                // sendToBot handles implicit resolution.
                const resolved = systemOrchestrator.sendToBot(botId, "CMD_UPDATE_CONFIG", newConfig);
                if (!resolved) console.log(`[API] Config saved, but Bot ${botId} offline (Not pushed).`);
            }

            res.json({ success: true, config: newConfig });
        });

        // --- NEW: Direct Bot Command Endpoint ---
        this.app.post('/api/bot-command/:botId', (req, res) => {
            const { botId } = req.params;
            const { type, content } = req.body;

            console.log(`[API] Forwarding Command ${type} to Bot ${botId}`);

            const isOnline = systemOrchestrator.isBotOnline(botId);
            if (!isOnline) {
                console.warn(`[API] Cannot send command ${type} to Bot ${botId} (Offline/Not Found)`);
                return res.status(404).json({ success: false, error: 'Bot is offline or not found' });
            }

            const success = systemOrchestrator.sendToBot(botId, type, content || {});

            if (success) {
                res.json({ success: true, message: `Command ${type} queued for ${botId}` });
            } else {
                res.status(500).json({ success: false, error: `Failed to send command ${type} to ${botId}` });
            }
        });

        // --- Asset Mapping Endpoints ---

        this.app.get('/api/mappings', (req, res) => {
            try {
                res.json(assetMappingService.getAllMappings());
            } catch (e) {
                console.error("[API] Mappings Error:", e);
                res.status(500).json({ error: e.message });
            }
        });

        this.app.post('/api/mappings', (req, res) => {
            const { originalSymbol, datafeedSymbol, brokerMappings } = req.body;
            if (!originalSymbol || !datafeedSymbol) return res.status(400).json({ error: 'Missing fields' });

            // STRICT VALIDATION
            if (brokerMappings) {
                console.log(`[API] Saving Mapping for ${originalSymbol}. Config:`, JSON.stringify(brokerMappings));

                for (const [botId, mappedSymbol] of Object.entries(brokerMappings)) {
                    // Bypass validation for IGNORE sentinel or empty string
                    // Hardcode '__IGNORE__' to ensure no reference issues
                    if (mappedSymbol === '__IGNORE__' || mappedSymbol === assetMappingService.IGNORE_SENTINEL || mappedSymbol === '') {
                        console.log(`[API] Skipping validation for sentinel/empty value: '${mappedSymbol}'`);
                        continue;
                    }

                    // Check if we have a symbol list for this broker
                    const validSymbols = assetMappingService.getBrokerSymbols(botId);

                    if (validSymbols && validSymbols.length > 0) {
                        // We have a list, so we MUST enforce it.
                        // The list might be objects {name, path...} or strings.
                        // AssetMappingService.getBrokerSymbols returns what's stored in DB (JSON).
                        // Typically it's a list of objects from SYMBOLS_LIST.

                        const exists = validSymbols.some(s => (typeof s === 'string' ? s : s.name) === mappedSymbol);
                        if (!exists) {
                            return res.status(400).json({
                                error: `Invalid symbol '${mappedSymbol}' for Broker '${botId}'. Symbol not found in broker's active list.`
                            });
                        }
                    } else {
                        // Warning: No list available for this broker.
                        // We fail safe => Allow it (fallback), but log warning.
                        console.warn(`[AssetMapping] Warning: Saving mapping for ${botId} without validation (Offline/No List).`);
                    }
                }
            }

            const success = assetMappingService.saveMapping(originalSymbol, datafeedSymbol, brokerMappings);
            res.json({ success });
        });

        this.app.get('/api/broker-symbols/:botId', (req, res) => {
            const { botId } = req.params;
            res.json(assetMappingService.getBrokerSymbols(botId));
        });

        // --- Trade Execution ---
        this.app.post('/api/trade/execute', (req, res) => {
            const { trade, accounts } = req.body;
            console.log(`[API] Trade Execution Request: ${accounts?.length} accounts`);
            if (accounts && accounts.length > 0) {
                console.log(`[API] Account Sample: ID=${accounts[0].id}, BotID=${accounts[0].botId}, Login=${accounts[0].login}`);
            } else {
                console.warn(`[API] Trade Execution: No accounts provided!`);
            }
            const result = tradeDistributionService.executeTrade(trade, accounts);
            res.json(result);
        });

        this.app.post('/api/trade/modify', (req, res) => {
            const { modification, accounts } = req.body;
            console.log(`[API] Trade Modification Request: ${modification?.action} on ${modification?.tradeId} for ${accounts?.length} accounts`);
            const result = tradeDistributionService.modifyTrade(modification, accounts);
            res.json(result);
        });

        // --- ICT Sessions Indicator ---
        this.app.get('/api/indicators/ict-sessions', async (req, res) => {
            try {
                const { symbol, from, to, settings } = req.query;

                if (!symbol || !settings) {
                    return res.status(400).json({ error: "Missing symbol or settings" });
                }

                const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
                const configHash = sessionEngine.getConfigHash(parsedSettings);

                // 1. Try Cache (DB)
                let sessions = db.getSessions(symbol, parseInt(from), parseInt(to), configHash);

                // 2. If empty or force refresh (logic could be smarter), Calculate
                if (!sessions || sessions.length === 0) {
                    // Fetch required history
                    // We need enough context? 
                    // Let's grab what we have in the requested range + buffer?
                    // For now, simple fetch of the range.

                    const candles = db.getHistory(symbol, 'M1', 10000, null); // Simplified: Load latest 10k M1 bars
                    // NOTE: Real implementation might need to be smarter about Timeframe source (e.g. M5 for sessions?)
                    // The Indicator usually runs on the chart TF. But session logic (High/Low) usually needs lower TF precision?
                    // "ICT Killzones" usually work on the displayed chart data in Pine.
                    // Let's use M5 or M1 if available, or just use what's requested? 
                    // The user prompt didn't specify source data TF. Pine script runs on Chart TF.

                    // Optimization: Use `from` and `to` to fetch candles
                    // db.getHistory uses `limit` and `to` (end time).
                    // We might need a range fetcher in DB service for precise windows.

                    // For this MVP, let's use the DB's `getHistory` with a reasonable limit.

                    // Calc
                    sessions = await sessionEngine.calculateSessions(symbol, candles, parsedSettings);
                }

                res.json({ success: true, sessions });
            } catch (e) {
                console.error("[API] ICT Sessions Error:", e);
                res.status(500).json({ error: e.message });
            }
        });

        this.app.get('/api/distribution/config', (req, res) => {
            res.json(tradeDistributionService.getConfig());
        });

        this.app.post('/api/distribution/config', (req, res) => {
            const success = tradeDistributionService.saveConfig(req.body);
            res.json({ success });
        });

        // --- STANDARD TRADE API ---

        this.app.post('/api/trade/execute', (req, res) => {
            try {
                const { trade, accounts } = req.body;

                // USER REQUEST: IMMEDIATE & DETAILED LOG
                console.log(`\n[API] >>> TRADE EXECUTION RECEIVED <<<`);
                console.log(`[API] MasterID: ${trade?.id}`);
                console.log(`[API] Symbol: ${trade?.symbol}`);
                console.log(`[API] Direction: ${trade?.direction}`);
                console.log(`[API] Volume: ${trade?.totalVol}`);
                console.log(`[API] Accounts: ${accounts?.length} (${JSON.stringify(accounts)})`);
                console.log(`[API] >>> PROCEEDING <<<\n`);

                const result = tradeDistributionService.executeBatch(trade, accounts);
                res.json(result);
            } catch (e) {
                console.error("[API] Trade Execute Error:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        this.app.post('/api/trade/modify', (req, res) => {
            try {
                const { modification, accounts } = req.body; // modification: { action, tradeId, percent }

                // USER REQUEST: IMMEDIATE & DETAILED LOG
                console.log(`\n[API] >>> TRADE MODIFICATION RECEIVED <<<`);
                console.log(`[API] Action: ${modification?.action}`);
                console.log(`[API] Target TradeID: ${modification?.tradeId}`);
                console.log(`[API] Percent: ${modification?.percent}`);
                console.log(`[API] Accounts: ${accounts?.length} (${JSON.stringify(accounts)})`);
                console.log(`[API] >>> PROCEEDING <<<\n`);

                const result = tradeDistributionService.modifyTrade(modification, accounts);
                res.json(result);
            } catch (e) {
                console.error("[API] Trade Modify Error:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // Lightweight Positions Endpoint for High-Freq Polling (200ms)
        this.app.get('/api/positions', (req, res) => {
            try {
                const positions = [];
                Object.entries(systemOrchestrator.botStatus || {}).forEach(([botId, status]) => {
                    if (status && status.openTrades && Array.isArray(status.openTrades)) {
                        status.openTrades.forEach(t => {
                            positions.push({
                                ...t,
                                botId,
                                brokerId: botId.split('_')[0]
                            });
                        });
                    }
                });
                res.json({ success: true, positions });
            } catch (e) {
                res.status(500).json({ success: false, error: e.message });
            }
        });

        this.app.post('/api/distribution/execute', (req, res) => {
            try {
                const fs = require('fs');
                fs.appendFileSync('debug_probe.log', `[${new Date().toISOString()}] PROBE: /api/distribution/execute HIT. Body: ${JSON.stringify(req.body)}\n`);

                const batch = req.body;
                console.log(`[API] Executing Batch for Broker ${batch.brokerId}`);
                const result = tradeDistributionService.executeBatch(batch.trade, batch.accounts);
                res.json(result);
            } catch (e) {
                console.error("[API] Distribution Execute Error:", e);
                res.status(500).json({ success: false, error: e.message, stack: e.stack });
            }
        });

        // --- Active Trades & History (Source of Truth for Frontend) ---
        this.app.get('/api/active-trades', (req, res) => {
            try {
                const env = req.query.env || 'test';
                const trades = db.getActiveTrades(env);
                const brokers = db.getBrokers();
                const accounts = db.getAccounts();

                // SKELTAL HYDRATION (Task: Immediate Visibility)
                // Populate 'positions' from 'executions' so UI renders them immediately
                // before the Live Bot Report (50ms) arrives.
                trades.forEach(t => {
                    // Enrich Executions with Resolved Broker Name
                    if (t.executions && Array.isArray(t.executions)) {
                        // DEBUG: Log Executions for Diagnosis
                        // console.log(`[API] Trade ${t.id} has ${t.executions.length} executions:`, t.executions.map(e => ({ bot: e.bot_id, magic: e.magic_number })));

                        t.executions.forEach(exec => {
                            let brokerName = exec.broker_id || 'Unknown';
                            // 1. Try Brokers List (GUID Match)
                            const b = brokers.find(x => x.id === exec.broker_id);
                            if (b && b.name) {
                                brokerName = b.name; // Use Full Name (User Request)
                            } else if (exec.bot_id && exec.bot_id.includes('_')) {
                                // 2. Fallback: Parse from BotID (Format: Name_Number)
                                // User Correction: Broker Name is FIRST Part.
                                brokerName = exec.bot_id.split('_')[0];
                            }
                            
                            // Append Account Username inside parentheses (User Request)
                            const acc = accounts.find(a => a.botId === exec.bot_id);
                            const accountNameStr = acc ? (acc.login || exec.account_id || acc.id) : (exec.account_id || exec.bot_id);
                            if (accountNameStr && accountNameStr !== 'Unknown') {
                                brokerName = `${brokerName} (${accountNameStr})`;
                            }

                            exec.brokerName = brokerName; // INJECT for Frontend
                        });
                    }

                    // SKELTAL HYDRATION
                    if (!t.positions || t.positions.length === 0) {
                        t.positions = t.executions.map(exec => {
                            return {
                                ticket: exec.id,
                                botId: exec.bot_id,
                                brokerId: exec.brokerName, // Use Injected Name
                                symbol: t.symbol,
                                volume: 0,
                                openPrice: 0,
                                current: 0,
                                profit: 0,
                                status: exec.status,
                                isSkeletal: true
                            };
                        });
                    }
                });

                res.json({ success: true, trades });
            } catch (e) {
                console.error("[API] Get Active Trades Error:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        this.app.get('/api/trade-history', (req, res) => {
            try {
                const limit = req.query.limit ? parseInt(req.query.limit) : 100;
                const env = req.query.env || 'test';
                const history = db.getTradeHistory(limit, env);
                res.json({ success: true, history });
            } catch (e) {
                console.error("[API] Get Trade History Error:", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        // --- Data History & Sanity Check ---
        this.app.get('/api/data-history/stats', (req, res) => {
            try {
                const dataStatsService = require('./DataStatsService');
                const stats = dataStatsService.getTreeStats(systemOrchestrator.configuredSymbols);

                // Inject Offline Status
                stats.forEach(node => {
                    const symbol = node.key;
                    const botId = systemOrchestrator.resolveBotId(symbol);
                    const isOnline = systemOrchestrator.isBotOnline(botId);

                    if (!isOnline) {
                        node.data.status = 'OFFLINE';
                        node.data.message = `Bot ${botId || '?'} Disconnected`;
                    }
                });

                res.json({ success: true, stats });
            } catch (e) {
                console.error("[API] Data History Stats Error", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        this.app.post('/api/sanity-check/run', (req, res) => {
            try {
                // --- JOB MANAGER INTEGRATION ---
                const jobManager = require('./SanityJobManager');
                jobManager.setDependencies(systemOrchestrator, this.io);

                const { botId, symbol, timeframe, startTime, type, endTime } = req.body; // type=MANUAL/CRON

                // Construct Scope
                const scope = {
                    botId: (!botId && symbol) ? systemOrchestrator.resolveBotId(symbol) : botId,
                    symbol,
                    timeframe,
                    startTime: startTime ? startTime : null,
                    endTime: endTime ? endTime : null,
                    type: type || 'MANUAL'
                };

                const job = jobManager.createJob(scope);
                res.json({ success: true, jobId: job.id, message: `Job ${job.id} started.` });
            } catch (e) {
                console.error("[API] Sanity Run Error", e);
                res.status(500).json({ success: false, error: e.message });
            }
        });

        this.app.get('/api/sanity/job/current', (req, res) => {
            const jobManager = require('./SanityJobManager');
            res.json({ success: true, job: jobManager.currentJob });
        });

        // Toggle Scheduler
        this.app.post('/api/sanity/scheduler', (req, res) => {
            // Future: Enable/Disable Cron
            res.json({ success: true });
        });

        // Legacy Status Endpoint (Keep for now or deprecated?)
        this.app.get('/api/sanity-check/status', (req, res) => {
            const jobManager = require('./SanityJobManager');
            res.json({ success: true, isChecking: !!jobManager.currentJob });
        });

        this.app.get('/api/sanity-check/report', (req, res) => {
            try {
                const jobManager = require('./SanityJobManager');
                const report = jobManager.getLatestReport();

                // Set headers for file download
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Disposition', `attachment; filename=sanity_report_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);

                res.send(report);
            } catch (e) {
                console.error("[API] Sanity Report Error", e);
                res.status(500).send("Failed to generate report: " + e.message);
            }
        });


        // --- Features API ---
        this.app.get('/api/features', (req, res) => {
            res.json({ success: true, features: systemOrchestrator.getFeatures() });
        });

        this.app.post('/api/features', (req, res) => {
            const newFeatures = req.body;
            const updated = systemOrchestrator.updateFeatures(newFeatures);
            res.json({ success: true, features: updated });
        });

    }

    setupSocket() {
        // --- AUTH MIDDLEWARE FOR SOCKET.IO ---
        this.io.use((socket, next) => {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;

            // Bypass auth for now if explicit dev flag is used, otherwise enforce
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            const user = AuthService.verifyToken(token);
            if (!user) {
                return next(new Error('Authentication error: Invalid Token'));
            }

            socket.user = user;
            next();
        });

        this.io.on('connection', (socket) => {
            console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user?.username})`);

            // 1. Datafeed Configuration
            socket.on('config_update', (symbols) => {
                // symbols: [{ symbol: "EURUSD", botId: "...", enabled: true, originalName: "..." }]
                const validSymbols = [];
                const activeOriginalNames = [];

                console.log(`[SocketServer] config_update received with ${symbols.length} symbols. Enabled Count: ${symbols.filter(s => s.enabled).length}`);

                symbols.forEach(s => {
                    if (s.enabled) {
                        // FIX TASK 0158: Configuration Identity Swapping
                        // User Input: originalName = "US100" (Internal Identity)
                        // Broker Source: symbol = "NDX100" (Data Source)

                        // We must save the Internal Identity as the PRIMARY 'symbol' key.

                        const internalIdentity = s.originalName || s.symbol;
                        const dataSource = s.symbol; // The broker's symbol

                        validSymbols.push({
                            symbol: internalIdentity, // "US100"
                            botId: s.botId,
                            datafeedSymbol: dataSource, // "NDX100"
                            originalName: internalIdentity
                        });

                        // Update Asset Mapping (Always persist to ensure count/status is correct)
                        const datafeedStr = `${s.botId}:${s.symbol}`;
                        console.log(`[SocketServer] Updating Asset Mapping for ${internalIdentity} -> ${datafeedStr}`);
                        try {
                            // Force Save
                            assetMappingService.updateDatafeedMapping(internalIdentity, datafeedStr);
                            activeOriginalNames.push(internalIdentity);
                        } catch (e) {
                            console.error(`[SocketServer] Failed to update mapping for ${internalIdentity}:`, e);
                        }
                    }
                });

                console.log(`[SocketServer] Pruning mappings. Active: ${activeOriginalNames.join(', ')}`);
                // Prune orphaned mappings (symbols that were deselected or had names removed)
                assetMappingService.pruneMappings(activeOriginalNames);

                systemOrchestrator.updateConfig(validSymbols);
                socket.emit('config_ack', { count: validSymbols.length });
            });

            // Task 0233: Dynamic Symbol Configuration (Single)
            socket.on('configure_symbol', async (symbolObj, ack) => {
                try {
                    console.log(`[Socket] configure_symbol received:`, symbolObj);
                    const success = await systemOrchestrator.addConfiguredSymbol(symbolObj);
                    if (ack) ack({ success });
                } catch (e) {
                    console.error("[Socket] configure_symbol failed:", e);
                    if (ack) ack({ success: false, error: e.message });
                }
            });

            // 2. Available Symbols Discovery
            socket.on('get_all_symbols', () => {
                socket.emit('all_symbols_list', systemOrchestrator.availableSymbols);

                // If empty, trigger fetch automatically
                if (systemOrchestrator.availableSymbols.length === 0) {
                    systemOrchestrator.requestAvailableSymbols();
                }
            });

            socket.on('refresh_symbols', (payload) => {
                const targetId = (typeof payload === 'string') ? payload : payload?.botId;
                systemOrchestrator.requestAvailableSymbols(targetId);
            });

            // Task: Manual Account Configuration (Live/Test Toggle)
            socket.on('update_account_info', (accountData, ack) => {
                try {
                    console.log(`[Socket] update_account_info received for ${accountData.id} (${accountData.name})`);
                    // Ensure robust types
                    if (accountData.isTest !== undefined) accountData.isTest = !!accountData.isTest;

                    db.saveAccount(accountData);

                    // Broadcast to force immediate UI update across clients
                    this.io.emit('accounts_updated_event', { id: accountData.id });

                    if (ack) ack({ success: true });
                } catch (e) {
                    console.error("[Socket] update_account_info failed:", e);
                    if (ack) ack({ success: false, error: e.message });
                }
            });

            // 2.2 Trade Execution (Socket)
            socket.on('execute_trade', (payload, ack) => {
                console.log(`[Socket] execute_trade received from ${socket.id}`);
                try {
                    const result = tradeDistributionService.executeTrade(payload.trade, payload.accounts);
                    if (ack) ack(result);
                } catch (e) {
                    console.error("[Socket] execute_trade error", e);
                    if (ack) ack({ success: false, error: e.message });
                }
            });

            // 2.5 History Request (Pagination)
            // ✅ PERFORMANCE FIX: Non-blocking with immediate callback
            socket.on('get_history', async (req, callback) => {
                // req: { symbol, timeframe, to, limit }
                try {
                    const { symbol, timeframe, to } = req;
                    const limit = parseInt(req.limit) || 1000;
                    const toTimestamp = to ? parseInt(to) : null;

                    // Check triggers for Initial Load (No 'to' timestamp)
                    if (!toTimestamp) {
                        systemOrchestrator.ensureFreshHistory(symbol, timeframe, true).catch(e => {
                            console.error(`[Socket] Freshness Check failed for ${symbol}:`, e.message);
                        });
                        systemOrchestrator.ensureHistoryDepth(symbol, timeframe, 10000).catch(e => {
                            console.error(`[Socket] Depth Check failed for ${symbol}:`, e.message);
                        });
                    }

                    // Fetch from DB (what we have NOW)
                    let candles = db.getHistory(symbol, timeframe, limit, toTimestamp);

                    // Append Hot Candle from In-Memory Cache if available AND we are fetching latest (no 'to')
                    if (!toTimestamp) {
                        const hot = systemOrchestrator.getHotCandle(symbol, timeframe);
                        if (hot) {
                            if (candles.length > 0) {
                                const last = candles[candles.length - 1];
                                if (last.time === hot.time) {
                                    candles[candles.length - 1] = hot;
                                } else if (hot.time > last.time) {
                                    candles.push(hot);
                                }
                            } else {
                                candles.push(hot);
                            }
                        }
                    }

                    // ✅ NON-BLOCKING: Trigger backfill in background if needed
                    if (candles.length < limit && toTimestamp) {
                        console.log(`[Socket] Backfill Wait: ${symbol} ${timeframe} (Found ${candles.length} < ${limit}) from ${toTimestamp}. Triggering BACKGROUND fetch.`);

                        systemOrchestrator.fetchHistoryRange(symbol, timeframe, toTimestamp, limit)
                            .then(() => {
                                // ✅ Send update via WebSocket when ready
                                const updatedCandles = db.getHistory(symbol, timeframe, limit, toTimestamp);
                                console.log(`[Socket] Backfill Complete: ${updatedCandles.length} candles. Sending update.`);

                                socket.emit('history_update', {
                                    symbol,
                                    timeframe,
                                    candles: updatedCandles,
                                    complete: true
                                });
                            })
                            .catch(e => {
                                console.error(`[Socket] Background Backfill failed for ${symbol}:`, e.message);
                            });
                    }

                    // ✅ IMMEDIATE CALLBACK with partial flag
                    if (callback) {
                        callback({
                            success: true,
                            candles,
                            partial: (candles.length < limit && toTimestamp)
                        });
                    } else {
                        socket.emit('get_history_response', {
                            symbol,
                            timeframe,
                            candles,
                            partial: (candles.length < limit && toTimestamp)
                        });
                    }
                } catch (e) {
                    console.error("[Socket] get_history error", e);
                    if (callback) callback({ success: false, error: e.message });
                }
            });

            // 3. Live Stream Subscription
            socket.on('subscribe', async (arg1, arg2, arg3) => {
                let symbol, timeframe, traceId;

                if (typeof arg1 === 'object' && arg1 !== null) {
                    // Frontend sent: socket.emit('subscribe', { symbol, timeframe }, traceId?)
                    symbol = arg1.symbol;
                    timeframe = arg1.timeframe;
                    traceId = arg2; // TraceID might be 2nd arg here if sent as object
                    // console.log(`[Socket] 📥 SUBSCRIBE RAW (Obj):`, arg1);
                } else {
                    // Legacy: socket.emit('subscribe', "BTCUSD", "M1", "TRC-...")
                    symbol = arg1;
                    timeframe = arg2;
                    traceId = arg3;
                    // console.log(`[Socket] 📥 SUBSCRIBE RAW (Args):`, arg1, arg2);
                }

                if (traceId) {
                    console.log(`[Forensic] ${traceId} | 2. Socket RX | ${symbol} ${timeframe}`);
                }

                // DIAGNOSTIC LOG (Task: Fix Over-Subscription)
                console.log(`[SocketServer] 📥 SUBSCRIBE Request from ${socket.id}: Symbol=${symbol}, TF=${timeframe}, Trace=${traceId || 'N/A'}`);

                if (!symbol) return;
                symbol = symbol.trim();
                const tf = (timeframe || 'M1').trim();

                socket.join(symbol); // Room per symbol (all TFs share room)
                // console.log(`[Socket] ${socket.id} subscribed to ${symbol} ${tf}`);

                const data = await systemOrchestrator.handleSubscribe(socket.id, symbol, tf, traceId);

                // Set initial heartbeat - REMOVED
                // const key = `${socket.id}:${symbol}:${tf}`;
                // this.streamHeartbeats.set(key, Date.now());

                // Send Snapshot
                socket.emit('initial_data', {
                    symbol,
                    timeframe: tf,
                    history: data.history, // Latest candles from DB
                    hot: data.hot // Current forming candle
                });

                // OPTIMIZATION: Instant Tick Update
                if (data.hot) {
                    socket.emit('bar_update', data.hot);
                }

                // FORCE INSTANT SYNC COMPLETE (Task 0132) - REMOVED
                // REPLACED by Actual Status Check (Task 0244)

                const statusSnapshot = systemOrchestrator.getStatusSnapshot(symbol);
                const currentStatus = (statusSnapshot && statusSnapshot[tf]) ? statusSnapshot[tf].status : 'UNKNOWN';

                console.log(`[StatusFlow] 📥 RX: Client Subscribe ${symbol} ${tf} (Status: ${currentStatus})`);

                if (currentStatus === 'READY') {
                    socket.emit('sync_status', {
                        symbol: symbol,
                        timeframe: tf,
                        status: 'SYNC_COMPLETE',
                        type: 'INSTANT' // Keep 'INSTANT' if it means "Cached/Ready"
                    });
                } else {
                    // Offline or Unknown
                    socket.emit('sanity_update', {
                        symbol: symbol,
                        timeframe: tf,
                        status: 'OFFLINE',
                        message: 'Checking Status...'
                    });
                }
            });

            socket.on('subscribe_ticks', (data) => {
                console.log(`[${new Date().toISOString()}] [SocketServer] 📥 RX SUBSCRIBE_TICKS from UI. Content:`, JSON.stringify(data));
                const { symbol, timeframe } = data;

                if (!symbol || !timeframe) return;

                // Join Socket Room
                // SyncManager emits to room 'symbol' usually.
                // Actually, SyncManager.js line 1593: socketServer.to(symbol).emit...
                // So we join 'symbol'.
                socket.join(symbol);

                // Forward to SyncManager
                systemOrchestrator.handleSubscribe(symbol, timeframe, socket.id);
            });

            socket.on('unsubscribe', (arg1) => {
                let symbol, timeframe;
                if (typeof arg1 === 'object' && arg1 !== null) {
                    symbol = arg1.symbol;
                    timeframe = arg1.timeframe;
                } else {
                    symbol = arg1;
                }

                if (!symbol) return;
                symbol = symbol.trim();
                if (timeframe) timeframe = timeframe.trim();

                const shouldLeave = systemOrchestrator.handleUnsubscribe(socket.id, symbol, timeframe);
                if (shouldLeave) {
                    socket.leave(symbol);
                    console.log(`[Socket] ${socket.id} LEFT room ${symbol} (No more timeframes active)`);
                } else {
                    console.log(`[Socket] ${socket.id} STAYED in room ${symbol} (Other timeframes active)`);
                }

                // Clear heartbeats for this socket + symbol - REMOVED
            });

            // 4. Keep-Alive / Watchdog - REMOVED (Relies on explicit Unsubscribe)

            // 5. Bot Events (History Batch & Market Data)
            socket.on('HISTORY_BATCH', (payload) => {
                // payload: { symbol, timeframe, data: [...] }
                // MQL5 sends this via WS
                try {
                    // Enrich with BotID if possible (socket.id? or from payload?)
                    // DatafeedExpert sends { id: botId, function: ... } on Register.
                    // We might need to map socket.id -> botId if not in payload.
                    // But typically payload doesn't have botId.
                    // We can use socket.id to find bot?
                    // SyncManager.botSessions has map ID -> Socket.
                    // Reverse lookup? Or just pass payload.

                    const botId = systemOrchestrator.resolveBotIdBySocket(socket.id);
                    systemOrchestrator.processHistoryBatch(payload.symbol, payload.data, botId, payload.timeframe);
                } catch (e) {
                    console.error("[Socket] HISTORY_BATCH Error", e);
                }
            });

            // 6. Live Market Data (from TickSpy)
            socket.on('MARKET_DATA', (payload) => {
                // payload: JSON string or object? 
                // MQL5 `g_WS.Send` sends STRING. Socket.io might parse if it looks like JSON? 
                // CWebSocketClient usually sends raw string.
                // If the payload inside MQL5 was `StringFormat("...", ...)`, it is a JSON string.
                // However, `socket.emit('event', data)` on client side usually sends data.
                // The `CWebSocketClient` implementation uses `emit`.
                // If it sends a string, we might need to parse.
                // But usually if it's a JSON string, Socket.io receives it as a string.

                try {
                    let data = payload;
                    if (typeof payload === 'string') {
                        try { data = JSON.parse(payload); } catch (e) { }
                    }

                    // Route to SyncManager
                    systemOrchestrator.handleIncomingMarketData(data);
                } catch (e) {
                    console.error("[Socket] MARKET_DATA Error", e);
                }
            });

            socket.on('disconnect', () => {
                // Cleanup all heartbeats for this socket - REMOVED
                // SyncManager might handle unsubscribe if it tracks sockets, 
                // but let's be safe and rely on its own disconnect handling            socket.on('disconnect', () => {
                systemOrchestrator.handleDisconnect(socket.id);
            });

            // DEBUG: Latency Isolation
            socket.on('ping_test', (clientTime, callback) => {
                // Return server time + echo back
                if (typeof callback === 'function') {
                    callback({ serverTime: Date.now(), clientTime });
                }
            });
        });
    }



    setupBotSocket() {
        this.wss.on('connection', (ws) => {
            console.log('[SocketServer] MQL5 Bot Connected via Raw WS');

            ws.on('message', (message, isBinary) => {
                try {
                    // HYBRID PROTOCOL: Check for Binary vs Text
                    if (isBinary) {
                        // message is a Buffer
                        // Future: Parse MQL5 Structs (Tick/History) here.
                        // For now, minimal handling or specific binary logic.
                        console.log(`[SocketServer] 📦 RX BINARY Frame (${message.length} bytes) from ${ws.botId || 'Unknown'}`);
                        return;
                    }

                    const str = message.toString();
                    let data;
                    try {
                        data = JSON.parse(str);
                    } catch (e) {
                        return; // Ignore garbage
                    }

                    const msgType = data.type || data.method;

                    // DEBUG: Log EVERYTHING except Heartbeat/MarketData to see what's hitting the server
                    if (msgType !== 'HEARTBEAT' && msgType !== 'MARKET_DATA') {
                        console.log(`[SocketServer] 📨 RX MESSAGE: Type=${msgType}, Keys=${Object.keys(data).join(',')}`);
                        if (msgType === 'CMD_EXECUTION_RESULT') {
                            console.log(`[SocketServer] 🔍 DEBUG EXECUTION_RESULT Payload:`, JSON.stringify(data, null, 2));
                        }
                    }

                    // GLOBAL FIX: Auto-Parse Nested JSON Payloads from MQL5/DLL (Task: Debug Live Data Flow)
                    // MQL5 often sends payload as a serialized string inside the JSON wrapper.
                    // We must unwrap it here for ALL message types.
                    if (data.payload && typeof data.payload === 'string') {
                        try {
                            data.payload = JSON.parse(data.payload);
                            // console.log(`[SocketServer] 📦 Parsed nested payload for ${msgType}`);
                        } catch (e) {
                            console.error(`[SocketServer] ❌ Failed to parse nested payload for ${msgType}:`, e);
                        }
                    }

                    // FLATTENING FIX: Detect & Lift CCommandManager Envelope (header + payload)
                    // MQL5 sends: { method: "...", payload: { header: {...}, payload: {...} } }
                    // We need: { header: {...}, payload: {...} } for UnifiedProtocol/RpcHelper
                    if (data.payload && data.payload.header && data.payload.payload !== undefined) {
                        try {
                            // console.log(`[SocketServer] 🗜️ Flattining Nested Envelope for ${msgType}`);
                            data.header = data.payload.header;
                            // Use inner command type if available
                            if (data.header.command) data.type = data.header.command;

                            // Replace payload with inner payload
                            data.payload = data.payload.payload;
                        } catch (e) {
                            console.error(`[SocketServer] Flattening Error:`, e);
                        }
                    }
                    if (data.content && typeof data.content === 'string') {
                        try {
                            data.content = JSON.parse(data.content);
                        } catch (e) {
                            // console.warn(`[SocketServer] Failed to parse content string (might be plain text):`, e);
                        }
                    }

                    if (msgType === 'REGISTER') {
                        // DEBUG: Log Raw RAW Data
                        console.error(`[SocketServer] 📥 RAW REGISTER DATA:`, JSON.stringify(data));

                        let payload = data.payload || data;
                        let header = data.header || {};
                        // Parsing already handled above.

                        // V3 Protocol: Identity is in Header. Fallback to Payload for legacy.
                        const botId = header.botId || payload.id || payload.botId;

                        if (botId) {
                            // FIX: Use Composite Key to prevent Session Collision (Same as WebSocketManager)
                            const func = header.func || payload.function || 'UNKNOWN';
                            const sym = header.symbol || payload.symbol || 'ALL';
                            const compositeKey = `${botId}:${func}:${sym}`;

                            // MULTIPLEXING PATCH: Support multiple Bots per Socket
                            if (!ws.botIds) ws.botIds = new Set();
                            ws.botIds.add(compositeKey);

                            // Legacy fallback (optional, but good for single-bot logic checks elsewhere)
                            ws.botId = compositeKey;

                            this.botWsMap.set(compositeKey, ws);
                            console.log(`[SocketServer] Registered Bot WS: ${compositeKey} (Multiplexed count: ${ws.botIds.size})`);

                            // Forward to SyncManager for Logic Init
                            // Inject composite key into payload for consistency
                            payload._sessionKey = compositeKey;
                            systemOrchestrator.handleBotRegister(compositeKey, payload);
                        }

                    } else if (msgType === 'MARKET_DATA') {
                        // MQL5: { symbol, bid, ask... }
                        // Payload is now guaranteed to be object via Global Fix
                        const payload = data.payload || data;
                        const botId = payload.botId || ws.botId;
                        systemOrchestrator.handleIncomingMarketData(payload, botId);

                    } else if (msgType === 'HISTORY_BATCH') {
                        // MQL5: { type: 'HISTORY_BATCH', payload: { symbol, tf, data: [] } }
                        const payload = data.payload || data;
                        // Resolve BotID from socket if not in payload
                        const botId = payload.botId || ws.botId;

                        systemOrchestrator.processHistoryBatch(
                            payload.symbol,
                            payload.data,
                            botId,
                            payload.tf || payload.timeframe
                        );
                    } else if (msgType === 'HEARTBEAT') {
                        // Forward to Orchestrator (Strict RoutingKey)
                        const payload = data.payload || data;
                        systemOrchestrator.handleHeartbeat(ws.botId, payload);
                    } else if (msgType === 'BAR_DATA') {
                        // "Pure WS" Bar Data (Closed Candles) from TickSpy
                        // Payload: { symbol, timeframe, time, open, high, low, close, volume, botId }
                        const payload = data.payload || data;
                        console.log(`[SocketServer] 📥 RX BAR_DATA: ${payload.symbol} ${payload.timeframe} T=${payload.time}`);
                        systemOrchestrator.handleIncomingBarData(payload, payload.botId || ws.botId);
                    } else if (msgType === 'SYNC_COMPLETE_HANDOVER') {
                        // MQL5: { type: 'SYNC_COMPLETE_HANDOVER', symbol, timeframe }
                        // Generated when Gap Fill is empty (No Data)
                        const payload = data.payload || data;
                        const botId = payload.botId || ws.botId;
                        systemOrchestrator.handleSyncCompleteHandover(botId, payload);

                    } else if (msgType === 'HISTORY_SNAPSHOT') {
                        // Reactive Snapshot from TickSpy (100 Candles)
                        // data.payload is already parsed by global fix above
                        const payload = data.payload || data;

                        let sample = "Empty";
                        if (payload.data && Array.isArray(payload.data) && payload.data.length > 0) {
                            sample = JSON.stringify(payload.data[0]);
                        }
                        console.log(`[SocketServer] 📥 RX HISTORY_SNAPSHOT: ${payload.symbol} ${payload.timeframe} Count=${payload.data ? payload.data.length : 0}. Sample: ${sample}`);

                        systemOrchestrator.handleIncomingHistorySnapshot(payload, payload.botId || ws.botId);
                    } else if (msgType === 'SYMBOLS_LIST') {
                        // Payload: { content: [ ... ] } OR Wrapped { symbols: [], botId: "" }
                        const rawPayload = data.payload || data.content || data;
                        let content = [];
                        let targetBotId = ws.botId || data.botId;

                        // Unwrap Logic
                        if (rawPayload.symbols && Array.isArray(rawPayload.symbols)) {
                            content = rawPayload.symbols;
                            if (rawPayload.botId) targetBotId = rawPayload.botId;
                        } else if (Array.isArray(rawPayload)) {
                            content = rawPayload;
                        } else if (data.content && Array.isArray(data.content)) {
                            content = data.content;
                        }

                        if (targetBotId && Array.isArray(content) && content.length > 0) {
                            // DELEGATE TO ORCHESTRATOR
                            systemOrchestrator.handleSymbolsList(targetBotId, content);
                        } else {
                            console.warn(`[SocketServer] ⚠️ SYMBOLS_LIST Dropped. Invalid Content or BotID.`);
                        }
                    } else {
                        // ---------------------------------------------------------
                        // DELEGATE TO UNIFIED PROTOCOL (RPC Responses / New Commands)
                        // ---------------------------------------------------------
                        const protocol = require('../framework/protocol/UnifiedBotProtocol');

                        const transport = {
                            id: ws.id,
                            botId: ws.botId,
                            get readyState() { return 1; }, // Mock Open
                            send: (msg) => {
                                if (ws.readyState === 1) {
                                    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
                                    ws.send(payload);
                                }
                            }
                        };

                        // Pass flattened 'data' (header+payload) or raw 'data'
                        // Protocol expects { type, header, payload } or similar.
                        // Our 'data' object already has 'type', 'header', 'botId' etc attached by previous logic.
                        protocol.handle(transport, data).catch(err => {
                            console.error(`[SocketServer] Protocol Delegation Error:`, err);
                        });
                    }
                } catch (e) {
                    console.error('[SocketServer] WS Msg Error', e);
                }
            });

            ws.on('close', () => {
                // 1. WebSocketManager Cleanup (Triggers SystemOrchestrator via event)
                const wsManager = require('../framework/transport/WebSocketManager');
                wsManager.unregister(ws.id);

                if (ws.botIds) {
                    ws.botIds.forEach(bId => {
                        const status = systemOrchestrator.botStatus[bId] || {};
                        const type = status.type || 'Unknown';
                        console.log(`[SocketServer] Bot ${bId} Type: ${type} DISCONNECTED (Multiplexed)`);
                        this.botWsMap.delete(bId);
                        // Trigger Orchestrator Handling?
                        // systemOrchestrator.handleDisconnect(bId); // If needed
                    });
                } else if (ws.botId) {
                    const status = systemOrchestrator.botStatus[ws.botId] || {};
                    const type = status.type || 'Unknown';
                    const symbol = status.symbol || '';

                    // TRANSPARENT LOGGING (User Request)
                    console.log(`[SocketServer] Bot ${ws.botId} Type: ${type} ${symbol} DISCONNECTED`);
                    this.botWsMap.delete(ws.botId);
                }
            });

            ws.on('error', (e) => console.error('[SocketServer] WS Error', e));
        });
    }

    sendToBot(botId, message) {
        const ws = this.botWsMap.get(botId);
        if (ws && ws.readyState === 1) { // OPEN
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // Facade Helpers for SyncManager
    emit(event, data) {
        if (this.io) this.io.emit(event, data);
    }

    emitToRoom(room, event, data) {
        if (this.io) this.io.to(room).emit(event, data);
    }

    // Compatibility for SyncManager chains: socketServer.to(..).emit(..)
    to(room) {
        if (this.io) return this.io.to(room);
        return { emit: () => { } };
    }

    // Alias to support legacy code accessing .to().emit() via chain if necessary?
    // SyncManager calls: this.socketServer.io.to().emit() -> Works (io property exists)
    // SyncManager calls: this.socketServer.emit() -> Works (helper added)
    // SyncManager calls: this.socketServer.emitToRoom() -> Works (helper added)

    start() {
        this.server.listen(config.HTTP_PORT, '0.0.0.0', () => {
            console.log(`[SocketServer] Listening on 0.0.0.0:${config.HTTP_PORT} (IPv4 Explicit)`);
        });
    }
}

module.exports = new SocketServer();
