(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/services/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchBotHistory",
    ()=>fetchBotHistory,
    "fetchMessages",
    ()=>fetchMessages,
    "fetchSymbols",
    ()=>fetchSymbols,
    "fetchTicks",
    ()=>fetchTicks,
    "sendCommand",
    ()=>sendCommand,
    "sendKeepAlive",
    ()=>sendKeepAlive,
    "startStream",
    ()=>startStream
]);
const COMMUNICATION_HUB_URL = "http://127.0.0.1:3005";
const fetchMessages = async (sinceTimestamp = 0)=>{
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/getMessages?lastTimestamp=${sinceTimestamp}`);
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            return data.messages;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [];
    }
};
const fetchBotHistory = async (botId, limit = 100)=>{
    // For now, we reuse getMessages but in real implementation efficient history fetch might happen 
    // via a dedicated endpoint if DB grows large.
    return fetchMessages(0);
};
const sendCommand = async (command)=>{
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/sendCommand`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(command)
        });
        const data = await res.json();
        return data.success;
    } catch (error) {
        console.error("Failed to send command:", error);
        return false;
    }
};
const fetchSymbols = async (botId)=>{
    try {
        const url = botId ? `${COMMUNICATION_HUB_URL}/symbols?botId=${botId}` : `${COMMUNICATION_HUB_URL}/symbols`;
        const res = await fetch(url);
        if (res.status === 503) {
            throw new Error("No Master Account Configured");
        }
        const data = await res.json();
        // Fallback: If configured list is empty, try getting ALL available symbols?
        // This helps if the User hasn't configured anything yet.
        if (!data.symbols || data.symbols.length === 0) {
            try {
                // Try alternate endpoint if it exists
                const res2 = await fetch(`${COMMUNICATION_HUB_URL}/available-symbols`);
                const data2 = await res2.json();
                if (data2.symbols && data2.symbols.length > 0) return data2.symbols;
            } catch (e2) {}
        }
        return data.symbols || [];
    } catch (error) {
        console.error("Failed to fetch symbols:", error);
        throw error; // Re-throw to let UI handle it
    }
};
const startStream = async (clientId, symbol)=>{
    try {
        await fetch(`${COMMUNICATION_HUB_URL}/stream/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                clientId,
                symbol
            })
        });
        return true;
    } catch (error) {
        console.error("Failed to start stream:", error);
        return false;
    }
};
const sendKeepAlive = async (clientId)=>{
    try {
        await fetch(`${COMMUNICATION_HUB_URL}/stream/keepalive`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                clientId
            })
        });
        return true;
    } catch (error) {
        return false; // Silent fail
    }
};
const fetchTicks = async (clientId)=>{
    try {
        const res = await fetch(`${COMMUNICATION_HUB_URL}/stream/ticks?clientId=${clientId}`);
        const data = await res.json();
        return data.ticks || [];
    } catch (error) {
        return [];
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/TradeLogService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TradeLogService",
    ()=>TradeLogService
]);
const STORAGE_KEY_COUNTER = 'trade_counter_seq';
const STORAGE_KEY_LOG = 'trade_log_db';
class TradeLogService {
    /**
     * generating a sequential ID (e.g. "1005")
     */ static getNextId() {
        try {
            const current = localStorage.getItem(STORAGE_KEY_COUNTER);
            let next = current ? parseInt(current, 10) + 1 : 1000; // Start at 1000 if empty
            if (isNaN(next)) next = 1000;
            localStorage.setItem(STORAGE_KEY_COUNTER, next.toString());
            return next.toString();
        } catch (e) {
            console.error("TradeLogService: Failed to access localStorage", e);
            return "ERR-" + Date.now();
        }
    }
    /**
     * Log the trade to persistent storage
     */ static logTrade(trade) {
        try {
            const entry = {
                id: trade.id || 'UNKNOWN',
                timestamp: Date.now(),
                symbol: trade.symbol,
                direction: trade.direction,
                entryPrice: trade.entry?.price || 0,
                stopLoss: trade.sl?.price || 0,
                takeProfit: trade.tp?.price || 0,
                riskReward: trade.riskReward?.value || 0,
                orderType: trade.orderType,
                // Capture Concrete Initial Levels
                initialEntry: trade.meta?.initialEntry || trade.entry?.price || 0,
                initialSL: trade.meta?.initialSL || trade.sl?.price || 0,
                initialTP: trade.meta?.initialTP || trade.tp?.price || 0,
                rawTrade: trade
            };
            const existingLogsJson = localStorage.getItem(STORAGE_KEY_LOG);
            const logs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
            // Prepend new trade
            logs.unshift(entry);
            // Limit log size (optional, e.g. 500)
            if (logs.length > 500) logs.pop();
            localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(logs));
            console.log("[TradeLogService] Logged Trade:", entry);
        } catch (e) {
            console.error("TradeLogService: Failed to log trade", e);
        }
    }
    static getLogs() {
        try {
            const existingLogsJson = localStorage.getItem(STORAGE_KEY_LOG);
            return existingLogsJson ? JSON.parse(existingLogsJson) : [];
        } catch (e) {
            return [];
        }
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/socket.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "socketService",
    ()=>socketService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
const URL = 'http://127.0.0.1:3005';
class SocketService {
    socket;
    constructor(){
        this.socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(URL, {
            autoConnect: true,
            reconnection: true,
            transports: [
                'websocket'
            ],
            withCredentials: true
        });
        this.socket.on('connect', ()=>{
            console.log('[Socket] Connected to market-data-core');
        });
        this.socket.on('disconnect', ()=>{
            console.log('[Socket] Disconnected');
        });
    }
    getSocket() {
        return this.socket;
    }
}
const socketService = new SocketService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/CommunicationHub.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "communicationHub",
    ()=>communicationHub
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/socket.ts [app-client] (ecmascript)");
;
const HUB_URL = "http://127.0.0.1:3005";
class CommunicationHub {
    socket;
    static instance;
    subscribers = new Set();
    reconnectTimer = null;
    constructor(){
        // Use the shared socket instance
        this.socket = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["socketService"].getSocket();
        this.setupListeners();
    }
    static getInstance() {
        if (!CommunicationHub.instance) {
            CommunicationHub.instance = new CommunicationHub();
        }
        return CommunicationHub.instance;
    }
    // Initialize listeners on the shared socket
    setupListeners() {
        console.log("[CommunicationHub] Hooking into Shared Socket...");
        if (this.socket.connected) {
            this.onConnect();
        }
        this.socket.on("connect", ()=>this.onConnect());
        this.socket.on("disconnect", (reason)=>{
            console.warn("[CommunicationHub] Disconnected:", reason);
        });
        this.socket.on("connect_error", (err)=>{
            console.error("[CommunicationHub] Connection Error:", err.message);
        });
    }
    onConnect() {
        console.log("[CommunicationHub] Connected via Shared Socket:", this.socket.id);
        // Re-subscribe to all active symbols
        this.subscribers.forEach((key)=>{
            const parts = key.split('|');
            const symbol = parts[0];
            const tf = parts.length > 1 ? parts[1] : "M1";
            this.socket.emit("subscribe", symbol, tf);
        });
    }
    // Deprecated but kept for compatibility
    connect() {
    // No-op: Socket is managed by socketService
    }
    getSocket() {
        return this.socket;
    }
    subscribe(symbol, timeframe = "M1") {
        symbol = symbol.trim();
        timeframe = timeframe.trim();
        // if (!this.socket) this.connect(); // Removed: Shared Socket is always present
        // Store unique key for re-subscription
        const key = `${symbol}|${timeframe}`;
        this.subscribers.add(key);
        if (this.socket?.connected) {
            if (this.socket?.connected) {
                // Send as separate arguments matching SocketServer handler
                const traceId = `TRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                console.log(`%c [Forensic] ${traceId} | 1. Frontend Emit | ${symbol} ${timeframe} | ${new Date().toISOString()}`, "color: yellow; background: red; font-weight: bold;");
                // Pass TraceID as 3rd arg (Backend must update signature)
                this.socket.emit("subscribe", symbol, timeframe, traceId);
            }
        }
    }
    unsubscribe(symbol, timeframe) {
        const key = `${symbol}|${timeframe}`;
        this.subscribers.delete(key);
        if (this.socket?.connected) {
            // Send as object to support granular unsubscribe in Backend
            this.socket.emit("unsubscribe", {
                symbol,
                timeframe
            });
        }
    }
    on(event, callback) {
        // Trace logging for specific events
        if (event === 'bar_update') {
            this.socket.on(event, (...args)=>{
                // TRACE POINT A
                const payload = args[0];
                if (payload && payload.symbol) {
                // console.log(`[CommunicationHub] TRACE A: Hub received Tick for ${payload.symbol} ${payload.timeframe}`);
                }
                callback(...args);
            });
        } else {
            this.socket.on(event, callback);
        }
    }
    off(event, callback) {
        this.socket.off(event, callback);
    }
    disconnect() {
        // Do NOT disconnect shared socket.
        // Only remove listeners if needed?
        console.warn("[CommunicationHub] Disconnect called but ignored (Shared Socket)");
    }
}
const communicationHub = CommunicationHub.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/DataSubscriptionOrchestrator.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dataSubscriptionOrchestrator",
    ()=>dataSubscriptionOrchestrator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/CommunicationHub.ts [app-client] (ecmascript)");
;
class DataSubscriptionOrchestrator {
    static instance;
    // Map of active subscriptions: Key -> Map of PaneIDs to their Callbacks
    subscriptions = new Map();
    // Map of pending termination timeouts: Key -> Timeout ID
    pendingTerminations = new Map();
    GRACE_PERIOD_MS = 10000;
    isVisible = true;
    visibilityDebounceTimer = null;
    VISIBILITY_DEBOUNCE_MS = 2000;
    constructor(){
        if (typeof document !== 'undefined') {
            this.isVisible = document.visibilityState === 'visible';
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        }
        // Trace Point B (Setup): Listening to Hub
        // 4. Tick Relay: Listen to ALL bar updates globally
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].on('bar_update', this.onDataReceived.bind(this));
    }
    static getInstance() {
        if (!DataSubscriptionOrchestrator.instance) {
            DataSubscriptionOrchestrator.instance = new DataSubscriptionOrchestrator();
        }
        return DataSubscriptionOrchestrator.instance;
    }
    /**
     * Ticks from Backend -> Orchestrator -> Many Subscribers
     */ onDataReceived(payload) {
        // Trace Point B (Execution): Orchestrator received tick
        // payload should have { symbol, timeframe, ...barData }
        if (!payload || !payload.symbol || !payload.timeframe) return;
        console.log(`[Orchestrator] Data received for ${payload.symbol} ${payload.timeframe}`);
        const key = this.getKey(payload.symbol, payload.timeframe);
        const subscribers = this.subscriptions.get(key);
        if (subscribers && subscribers.size > 0) {
            console.log(`[Orchestrator] TRACE B: Relaying tick for ${key} to ${subscribers.size} subscribers`);
            subscribers.forEach((callback)=>{
                callback(payload);
            });
        } else {
            console.warn(`[Orchestrator] TRACE C: Received tick for ${key} but NO subscribers found in Map! Keys:`, [
                ...this.subscriptions.keys()
            ]);
        }
    }
    subscribe(symbol, timeframe, paneId, callback) {
        const key = this.getKey(symbol, timeframe);
        // DIAGNOSTIC LOG (Task: Fix Over-Subscription)
        console.log(`[Orchestrator] 📥 SUBSCRIBE Request: ${key} [Pane: ${paneId}] (Visible: ${this.isVisible})`);
        // 1. Cancel any pending termination for this key
        if (this.pendingTerminations.has(key)) {
            console.log(`[Orchestrator] ♻️ Cancelled termination for ${key}`);
            clearTimeout(this.pendingTerminations.get(key));
            this.pendingTerminations.delete(key);
        }
        // 2. Add subscriber & callback
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Map());
            // New stream needed
            this.initiateStream(symbol, timeframe);
        }
        /* TRACE POINT C (Storage) */ this.subscriptions.get(key).set(paneId, callback);
        console.log(`[Orchestrator] TRACE C: Stored callback for ${key} [Pane: ${paneId}]. Total subs: ${this.subscriptions.get(key).size}`);
        // 3. Visibility Check logic
        if (!this.isVisible) {
            this.pauseStream(symbol, timeframe);
        }
    }
    unsubscribe(symbol, timeframe, paneId) {
        const key = this.getKey(symbol, timeframe);
        const subscribers = this.subscriptions.get(key);
        if (!subscribers) return;
        console.log(`[Orchestrator] Unsubscribe Request: ${key} [Pane: ${paneId}]`);
        subscribers.delete(paneId);
        if (subscribers.size === 0) {
            // No more subscribers - Start Grace Period
            console.log(`[Orchestrator] ⏳ Starting Grace Period for ${key} (${this.GRACE_PERIOD_MS}ms)`);
            const timeout = setTimeout(()=>{
                this.terminateStream(symbol, timeframe);
            }, this.GRACE_PERIOD_MS);
            this.pendingTerminations.set(key, timeout);
        }
    }
    initiateStream(symbol, timeframe) {
        console.log(`[Orchestrator] 🚀 Initiating Stream: ${symbol} ${timeframe}`);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].subscribe(symbol, timeframe);
    }
    terminateStream(symbol, timeframe) {
        const key = this.getKey(symbol, timeframe);
        // Double check no one re-subscribed in the meantime
        if (this.subscriptions.has(key) && this.subscriptions.get(key).size > 0) {
            console.warn(`[Orchestrator] ⚠️ Termination aborted, active subscribers found for ${key}`);
            return;
        }
        console.log(`[Orchestrator] 🛑 Terminating Stream: ${symbol} ${timeframe}`);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].unsubscribe(symbol, timeframe);
        this.subscriptions.delete(key);
        this.pendingTerminations.delete(key);
    }
    pauseStream(symbol, timeframe) {
        const socket = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].getSocket();
        if (socket?.connected) {
            console.log(`[Orchestrator] ⏸️ Pausing Stream: ${symbol} ${timeframe}`);
            socket.emit('pause_stream', {
                symbol,
                timeframe
            });
        }
    }
    resumeStream(symbol, timeframe) {
        const socket = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].getSocket();
        if (socket?.connected) {
            console.log(`[Orchestrator] ▶️ Resuming Stream: ${symbol} ${timeframe}`);
            socket.emit('resume_stream', {
                symbol,
                timeframe
            });
        }
    }
    handleVisibilityChange() {
        const currentlyVisible = document.visibilityState === 'visible';
        console.log(`[Orchestrator] Visibility Event: ${currentlyVisible ? 'VISIBLE' : 'HIDDEN'}`);
        if (this.visibilityDebounceTimer) {
            clearTimeout(this.visibilityDebounceTimer);
            this.visibilityDebounceTimer = null;
        }
        if (currentlyVisible) {
            if (!this.isVisible) {
                this.isVisible = true;
                this.subscriptions.forEach((_, key)=>{
                    const [symbol, timeframe] = this.decodeKey(key);
                    this.resumeStream(symbol, timeframe);
                });
            } else {
                console.log(`[Orchestrator] 🙈 Quick toggle detected, staying VISIBLE.`);
            }
        } else {
            this.visibilityDebounceTimer = setTimeout(()=>{
                this.isVisible = false;
                console.log(`[Orchestrator] 🌑 Debounce elapsed. Throttling streams.`);
                this.subscriptions.forEach((_, key)=>{
                    const [symbol, timeframe] = this.decodeKey(key);
                    this.pauseStream(symbol, timeframe);
                });
            }, this.VISIBILITY_DEBOUNCE_MS);
        }
    }
    getKey(symbol, timeframe) {
        return `${symbol.trim()}|${timeframe.trim()}`;
    }
    decodeKey(key) {
        const parts = key.split('|');
        return [
            parts[0],
            parts[1]
        ];
    }
}
const dataSubscriptionOrchestrator = DataSubscriptionOrchestrator.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/MT5Datafeed.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MT5Datafeed",
    ()=>MT5Datafeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/CommunicationHub.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$DataSubscriptionOrchestrator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/DataSubscriptionOrchestrator.ts [app-client] (ecmascript)");
;
;
class MT5Datafeed {
    subscriptions = new Map();
    availableSymbols = [];
    initializationPromise;
    initializationResolver = ()=>{};
    constructor(){
        // Initialize the promise immediately
        this.initializationPromise = new Promise((resolve)=>{
            this.initializationResolver = resolve;
        });
        // Ensure hub is connected
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].connect();
        this.loadSymbols();
    }
    async loadSymbols() {
        try {
            const res = await fetch('http://localhost:3005/api/mappings');
            if (res.ok) {
                const mappings = await res.json();
                // We only care about the "Frontend Name" (Original Symbol or Fallback)
                // We do NOT care about BotIDs or Datafeed Symbols here.
                this.availableSymbols = mappings.map((m)=>m.originalSymbol || m.datafeedSymbol).filter(Boolean);
                // Deduplicate
                this.availableSymbols = [
                    ...new Set(this.availableSymbols)
                ];
                console.log(`[MT5Datafeed] Loaded ${this.availableSymbols.length} symbols.`);
            }
        } catch (e) {
            console.error("[MT5Datafeed] Failed to load symbols", e);
        } finally{
            // ALWAYS resolve, even on error, so we don't block forever
            this.initializationResolver();
        }
    }
    onReady(callback) {
        console.log("%c [MT5Datafeed] VERSION 4.2: ORCHESTRATED (ASYNC INIT)", "color: magenta; font-weight: bold; font-size: 14px;");
        setTimeout(()=>callback({
                supported_resolutions: [
                    '1',
                    '5',
                    '15',
                    '30',
                    '60',
                    '240',
                    'D',
                    'W',
                    'M'
                ],
                supports_marks: false,
                supports_timescale_marks: false,
                supports_time: true
            }), 0);
    }
    async searchSymbols(userInput, exchange, symbolType, onResult) {
        await this.initializationPromise;
        const query = userInput.toLowerCase();
        const matches = this.availableSymbols.filter((s)=>s.toLowerCase().includes(query));
        if (matches.length > 0) {
            onResult(matches.map((s)=>({
                    symbol: s,
                    full_name: s,
                    description: s,
                    exchange: "Broker",
                    type: "currency"
                })));
        } else {
            // Fallback: Allow user to type anything (maybe they added a sym but didn't refresh)
            onResult([
                {
                    symbol: userInput,
                    full_name: userInput,
                    description: userInput,
                    exchange: "Forex",
                    type: "currency"
                }
            ]);
        }
    }
    async resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
        await this.initializationPromise;
        console.log(`[MT5Datafeed] 🔍 Resolving Symbol: ${symbolName}`);
        const info = {
            name: symbolName,
            full_name: symbolName,
            description: symbolName,
            type: 'forex',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: 'Forex',
            minmov: 1,
            pricescale: 100000,
            has_intraday: true,
            has_no_volume: false,
            has_weekly_and_monthly: true,
            supported_resolutions: [
                '1',
                '5',
                '15',
                '30',
                '60',
                '240',
                'D',
                'W',
                'M'
            ],
            volume_precision: 2,
            data_status: 'streaming'
        };
        setTimeout(()=>onSymbolResolvedCallback(info), 0);
    }
    lastBarTimes = new Map();
    lastBars = new Map();
    async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        // Wait for initialization before asking for history
        await this.initializationPromise;
        const { from, to, countBack, firstDataRequest } = periodParams;
        const tf = this.resolutionToTimeframe(resolution);
        const symbol = symbolInfo.name;
        if (!firstDataRequest) {
            console.log(`%c [MT5Datafeed] (a) SCROLL DETECTED | (b) NEED HISTORY | To: ${to} (${new Date(to * 1000).toISOString()})`, "color: cyan; font-weight: bold; background: #333; padding: 4px;");
        } else {
            console.log(`%c >>> GETBARS START: ${symbol} ${resolution} <<<`, "background: red; color: white;");
        }
        try {
            // Safety check
            if (this.availableSymbols.length === 0) {
                console.warn("[MT5Datafeed] availableSymbols is empty after init. Possible startup issue.");
            }
            // USER OVERRIDE: 20k is too heavy for First Load (>10MB JSON). 
            // Start light (1k) to get Chart visible instantly. Pagination fills the rest.
            const reqLimit = firstDataRequest ? 1000 : 20000;
            let url = `http://127.0.0.1:3005/history?symbol=${symbol}&timeframe=${tf}&limit=${reqLimit}`;
            if (!firstDataRequest && to) {
                // Pagination: Load OLDER than 'to'
                url += `&to=${Math.floor(to * 1000)}`;
            }
            // Cache Buster
            url += `&_=${Date.now()}`;
            console.log(`[MT5Datafeed] (c) LOADING HISTORY: ${url}`);
            const res = await fetch(url);
            if (!res.ok) {
                console.error("[MT5Datafeed] API Status Error:", res.status);
                onHistoryCallback([], {
                    noData: true
                });
                return;
            }
            const data = await res.json();
            const count = data.candles?.length || 0;
            console.log(`%c [MT5Datafeed] (d) HISTORY RESULT: Received ${count} candles.`, count === 0 ? "color: red; font-weight: bold;" : "color: lime;");
            if (data.success && data.candles && count > 0) {
                // ... Mapping Logik ...
                const bars = data.candles.map((c)=>{
                    // Universal Timestamp Fix: Support both Sec and MS
                    let t = Number(c.time);
                    if (t > 100000000000) {
                        t = t / 1000; // Convert MS to Sec
                    }
                    return {
                        time: t,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: c.volume || 0
                    };
                });
                // Sorting is crucial
                bars.sort((a, b)=>a.time - b.time);
                // MERGE LIVE CACHE (Fix for Flicker on Reset)
                const cacheKey = `${symbol}_${tf}`;
                const cachedBar = this.lastBars.get(cacheKey);
                if (cachedBar) {
                    const lastFetched = bars[bars.length - 1];
                    // If cached bar is newer or same time (Live is authoritative)
                    if (!lastFetched || cachedBar.time > lastFetched.time) {
                        bars.push(cachedBar);
                    // console.log(`[MT5Datafeed] 🔗 Appended Live Bar to History: ${cachedBar.time}`);
                    } else if (cachedBar.time === lastFetched.time) {
                        bars[bars.length - 1] = cachedBar;
                    // console.log(`[MT5Datafeed] 🔗 Overwrote Stale History with Live Bar: ${cachedBar.time}`);
                    }
                }
                const lastBar = bars[bars.length - 1];
                if (lastBar) {
                    const currentLast = this.lastBarTimes.get(cacheKey) || 0;
                    if (lastBar.time > currentLast) {
                        this.lastBarTimes.set(cacheKey, lastBar.time);
                    }
                }
                onHistoryCallback(bars, {
                    noData: false
                });
            } else {
                if (!firstDataRequest) {
                    // PENDING STATE: API gave 0 candles during pagination.
                    // The backend might be busy fetching from broker.
                    // We send 'noData: false' with empty array to tell TV to retry.
                    // Refined Logic per User: "noData: true ONLY IF ... Backend confirms end".
                    // For now, if we don't have explicit end flag, we assume PENDING.
                    console.log("[MT5Datafeed] Pagination empty (Pending?). Sending noData: false to trigger retry.");
                    onHistoryCallback([], {
                        noData: false
                    });
                } else {
                    console.log("[MT5Datafeed] First Load empty. Sending noData: true.");
                    onHistoryCallback([], {
                        noData: true
                    });
                }
            }
        } catch (e) {
            console.error("[MT5Datafeed] FATAL ERROR in getBars:", e);
            onErrorCallback("Crash");
        }
    }
    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) {
        const symbol = symbolInfo.name.trim(); // PURE SYMBOL
        const expectedTf = this.resolutionToTimeframe(resolution).trim();
        console.log(`[MT5Datafeed] Subscribe Realtime: ${symbol} [${subscribeUID} / TF: ${expectedTf}]`);
        const periodMs = this.resolutionToMs(resolution);
        const periodSec = periodMs / 1000;
        // Callback wrapped to process raw data from Orchestrator
        const orchestratedListener = (candle)=>{
            // Check match - redundant if orchestrator does its job, but safe.
            console.log(`[MT5Datafeed] TRACE D: orchestratedListener for ${symbol} ${expectedTf} received data for ${candle.symbol} ${candle.timeframe}`);
            let rawTime = candle.time;
            if (rawTime > 100000000000) rawTime = rawTime / 1000;
            const alignedTimeSec = Math.floor(rawTime / periodSec) * periodSec;
            const timeSec = alignedTimeSec;
            // GAP & ORDER DETECTION
            const key = `${symbol}_${expectedTf}`;
            const lastTime = this.lastBarTimes.get(key);
            let cachedBar = this.lastBars.get(key);
            if (lastTime) {
                if (timeSec < lastTime) {
                    console.warn(`[MT5Datafeed] 📉 Stale Update (History?) Ignored. Bar: ${timeSec}, Last: ${lastTime}`);
                    return;
                }
                if (timeSec > lastTime + periodSec + 1) {
                    console.warn(`[MT5Datafeed] ⚠️ Gap Detected! Last: ${lastTime}, New: ${timeSec}. Resetting.`);
                    onResetCacheNeededCallback();
                    this.lastBarTimes.set(key, timeSec);
                    this.lastBars.delete(key);
                    return;
                }
            }
            this.lastBarTimes.set(key, timeSec);
            // STABILITY FIX: Lock Open Price for the same bar
            let openPrice = candle.open;
            if (cachedBar && cachedBar.time === timeSec) {
                // If we already have a bar for this time, keep the INITIAL Open.
                // This prevents "Jumping Open" if the backend sends glitches or undefined.
                if (cachedBar.open) {
                    if (Math.abs(cachedBar.open - candle.open) > 0.0000001) {
                        console.warn(`[MT5Datafeed] 🔒 Locking Open: ${cachedBar.open} (Ignoring New: ${candle.open})`);
                    }
                    openPrice = cachedBar.open;
                }
            } else {
                console.log(`[MT5Datafeed] 🆕 New Bar or Reset. Open: ${openPrice} Time: ${timeSec} (Last: ${this.lastBarTimes.get(key)})`);
            }
            const barToEmit = {
                symbol: symbol,
                timeframe: expectedTf,
                time: timeSec,
                open: openPrice,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            };
            // Update Cache
            this.lastBars.set(key, barToEmit);
            // DEBUG: Trace Fidelity
            // console.log(`[MT5Datafeed] 📊 Live Update ${symbol} [${new Date(timeSec * 1000).toISOString().split('T')[1]}] | O:${barToEmit.open} H:${barToEmit.high} L:${barToEmit.low} C:${barToEmit.close}`);
            onRealtimeCallback(barToEmit);
        };
        // Use Orchestrator to manage subscription lifecycle AND distribution
        // subscribeUID serves as the paneId. Pass the listener to be registered.
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$DataSubscriptionOrchestrator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataSubscriptionOrchestrator"].subscribe(symbol, expectedTf, subscribeUID, orchestratedListener);
        const historyListener = (data)=>{
            if (data.symbol === symbol && data.timeframe === expectedTf) {
                console.log(`[MT5Datafeed] History Update detected for ${symbol}. Resetting Cache.`);
                onResetCacheNeededCallback();
            }
        };
        // History updates: We still listen directly for now unless moved to Orchestrator later
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].on('history_update', historyListener);
        this.subscriptions.set(subscribeUID, {
            symbol: symbol,
            orchestratedListener: orchestratedListener,
            historyListener: historyListener,
            timeframe: expectedTf
        });
    }
    unsubscribeBars(subscriberUID) {
        const sub = this.subscriptions.get(subscriberUID);
        if (sub) {
            console.log(`[MT5Datafeed] Unsubscribe: ${sub.symbol} [${subscriberUID}]`);
            // Remove local listeners
            // communicationHub.off('bar_update', sub.listener); // Removed, handled by orchestrator
            if (sub.historyListener) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$CommunicationHub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["communicationHub"].off('history_update', sub.historyListener);
            }
            // Tell Orchestrator to release this subscription
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$DataSubscriptionOrchestrator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dataSubscriptionOrchestrator"].unsubscribe(sub.symbol, sub.timeframe, subscriberUID);
            this.subscriptions.delete(subscriberUID);
        }
    }
    resolutionToTimeframe(resolution) {
        const tfMap = {
            '1': 'M1',
            '2': 'M2',
            '3': 'M3',
            '4': 'M4',
            '5': 'M5',
            '6': 'M6',
            '10': 'M10',
            '12': 'M12',
            '15': 'M15',
            '20': 'M20',
            '30': 'M30',
            '60': 'H1',
            '120': 'H2',
            '180': 'H3',
            '240': 'H4',
            '360': 'H6',
            '480': 'H8',
            '720': 'H12',
            'D': 'D1',
            '1D': 'D1',
            'W': 'W1',
            '1W': 'W1',
            'M': 'MN1',
            '1M': 'MN1',
            // Passthrough
            'M1': 'M1',
            'M2': 'M2',
            'M3': 'M3',
            'M4': 'M4',
            'M5': 'M5',
            'M6': 'M6',
            'M10': 'M10',
            'M12': 'M12',
            'M15': 'M15',
            'M20': 'M20',
            'M30': 'M30',
            'H1': 'H1',
            'H2': 'H2',
            'H3': 'H3',
            'H4': 'H4',
            'H6': 'H6',
            'H8': 'H8',
            'H12': 'H12',
            'D1': 'D1',
            'W1': 'W1',
            'MN1': 'MN1'
        };
        return tfMap[resolution] || 'H1';
    }
    resolutionToMs(res) {
        if (res.startsWith('M')) {
            if (res === 'MN1') return 30 * 24 * 60 * 60 * 1000;
            const min = parseInt(res.substring(1));
            return (isNaN(min) ? 1 : min) * 60 * 1000;
        }
        if (res.startsWith('H')) {
            const hour = parseInt(res.substring(1));
            return (isNaN(hour) ? 1 : hour) * 60 * 60 * 1000;
        }
        if (res.startsWith('D')) return 24 * 60 * 60 * 1000;
        if (res.startsWith('W') || res === 'W1') return 7 * 24 * 60 * 60 * 1000;
        if (res === 'MN1' || res === 'M' || res === '1M') return 30 * 24 * 60 * 60 * 1000;
        const val = parseInt(res);
        if (isNaN(val)) return 60000;
        return val * 60 * 1000;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/chartUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generatePhantomBars",
    ()=>generatePhantomBars,
    "getTimeframeSeconds",
    ()=>getTimeframeSeconds
]);
const getTimeframeSeconds = (tf)=>{
    switch(tf){
        case 'M1':
            return 60;
        case 'M2':
            return 120;
        case 'M3':
            return 180;
        case 'M5':
            return 300;
        case 'M10':
            return 600;
        case 'M15':
            return 900;
        case 'M30':
            return 1800;
        case 'H1':
            return 3600;
        case 'H2':
            return 7200;
        case 'H3':
            return 10800;
        case 'H4':
            return 14400;
        case 'H6':
            return 21600;
        case 'H8':
            return 28800;
        case 'H12':
            return 43200;
        case 'D1':
            return 86400;
        case 'W1':
            return 604800;
        case 'MN1':
            return 2592000;
        default:
            return 60;
    }
};
const generatePhantomBars = (lastRealTime, basePrice, timeframe, minCount = 200)=>{
    const interval = getTimeframeSeconds(timeframe);
    const phantoms = [];
    // ROLLBACK & OPTIMIZE:
    // User requested rollback to Phantom Bars for stability.
    // Optimization: Use fixed limit (200) instead of infinite (10000) to prevent "Zoom to 2026" issue.
    const limit = minCount;
    let currentTime = lastRealTime;
    for(let i = 0; i < limit; i++){
        currentTime += interval;
        phantoms.push({
            time: currentTime,
            value: basePrice
        });
    }
    return phantoms;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartThemeProvider",
    ()=>ChartThemeProvider,
    "DEFAULT_LIGHT_THEME",
    ()=>DEFAULT_LIGHT_THEME,
    "DEFAULT_THEME",
    ()=>DEFAULT_THEME,
    "useChartTheme",
    ()=>useChartTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const DEFAULT_THEME = {
    layout: {
        background: {
            type: 'solid',
            color: '#131722'
        },
        textColor: '#d1d4dc'
    },
    grid: {
        vertLines: {
            color: '#1e222d',
            visible: true,
            style: 0
        },
        horzLines: {
            color: '#1e222d',
            visible: true,
            style: 0
        }
    },
    candles: {
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645'
    },
    crosshair: {
        color: '#758696'
    },
    timeScale: {
        borderColor: '#2B2B43'
    },
    priceScale: {
        borderColor: '#2B2B43'
    }
};
const DEFAULT_LIGHT_THEME = {
    layout: {
        background: {
            type: 'solid',
            color: '#ffffff'
        },
        textColor: '#1e293b'
    },
    grid: {
        vertLines: {
            color: '#e2e8f0',
            visible: true,
            style: 0
        },
        horzLines: {
            color: '#e2e8f0',
            visible: true,
            style: 0
        }
    },
    candles: {
        upColor: '#089981',
        downColor: '#ef4444',
        borderUpColor: '#089981',
        borderDownColor: '#ef4444',
        wickUpColor: '#089981',
        wickDownColor: '#ef4444'
    },
    crosshair: {
        color: '#94a3b8'
    },
    timeScale: {
        borderColor: '#e2e8f0'
    },
    priceScale: {
        borderColor: '#e2e8f0'
    }
};
// --- UTILS ---
/**
 * Deep merges source object into target object.
 * Returns a new object.
 */ function deepMerge(target, source) {
    if (typeof target !== 'object' || target === null) {
        return source;
    }
    const output = {
        ...target
    };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key)=>{
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, {
                        [key]: source[key]
                    });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, {
                    [key]: source[key]
                });
            }
        });
    }
    return output;
}
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
/**
 * Migrates legacy theme structures to the current schema.
 */ function migrateTheme(savedCallback) {
    let migrated = {
        ...DEFAULT_THEME
    };
    // 1. Deep merge saved data onto default to fill missing top-level keys
    // This handles the case where 'crosshair' was missing in saved data
    migrated = deepMerge(migrated, savedCallback);
    // 2. Handle specific migrations (String Grid -> Object Grid)
    if (migrated.grid) {
        // Fix VertLines
        if (typeof migrated.grid.vertLines === 'string') {
            migrated.grid.vertLines = {
                color: migrated.grid.vertLines,
                visible: true,
                style: 0
            };
        }
        // Fix HorzLines
        if (typeof migrated.grid.horzLines === 'string') {
            migrated.grid.horzLines = {
                color: migrated.grid.horzLines,
                visible: true,
                style: 0
            };
        }
    }
    // 3. Fix Layout Background (String -> Object)
    if (migrated.layout && typeof migrated.layout.background === 'string') {
        migrated.layout.background = {
            type: 'solid',
            color: migrated.layout.background
        };
    }
    return migrated;
}
const ChartThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ChartThemeProvider = ({ children })=>{
    _s();
    // We NO LONGER sync with global theme automatically unless requested.
    // Default to LIGHT as per user request.
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('light');
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_LIGHT_THEME);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Persist Mode
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartThemeProvider.useEffect": ()=>{
            if (!mounted) return;
            localStorage.setItem("chart_theme_mode", mode);
            // Apply base theme for the mode
            if (mode === 'light') {
                setTheme(DEFAULT_LIGHT_THEME);
            } else {
                setTheme(DEFAULT_THEME);
            }
        }
    }["ChartThemeProvider.useEffect"], [
        mode,
        mounted
    ]);
    // Load from LocalStorage on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartThemeProvider.useEffect": ()=>{
            setMounted(true);
            // Load Mode
            const savedMode = localStorage.getItem("chart_theme_mode");
            if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
                setMode(savedMode);
            } else {
                setMode('light'); // Default to light
            }
            // Load Custom Overrides (optional, if we still want to support custom theme tweaks on top of base)
            const savedTheme = localStorage.getItem("chart_theme");
            if (savedTheme) {
                try {
                    const parsed = JSON.parse(savedTheme);
                    const validTheme = migrateTheme(parsed);
                // We should probably merge this ON TOP of the base theme for the current mode
                // But for now, let's just respect the mode switch primarily.
                // If specific overrides exist, they might be mode-specific... simplified for now:
                // If user toggles mode, we reset customizations? Or do we keep them?
                // User asked for "Light or Dark", simple. Let's prioritize the Mode.
                } catch (e) {
                    console.error("Failed to load theme", e);
                }
            }
        }
    }["ChartThemeProvider.useEffect"], []);
    const updateTheme = (newTheme)=>{
        setTheme((prev)=>{
            const updated = deepMerge(prev, newTheme);
            localStorage.setItem("chart_theme", JSON.stringify(updated));
            return updated;
        });
    };
    const resetTheme = ()=>{
        setMode('light');
        setTheme(DEFAULT_LIGHT_THEME);
        localStorage.removeItem("chart_theme");
        localStorage.removeItem("chart_theme_mode");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChartThemeContext.Provider, {
        value: {
            theme,
            mode,
            setMode,
            updateTheme,
            resetTheme
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/ChartThemeContext.tsx",
        lineNumber: 242,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ChartThemeProvider, "RRk5XzOVqRBFOYmmtEaYDN0nY8Q=");
_c = ChartThemeProvider;
const useChartTheme = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ChartThemeContext);
    if (!context) throw new Error("useChartTheme must be used within a ChartThemeProvider");
    return context;
};
_s1(useChartTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ChartThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useContextMenu.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useContextMenu",
    ()=>useContextMenu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const useContextMenu = (containerRef, chartWidgetRef)=>{
    _s();
    const [menuState, setMenuState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        visible: false,
        x: 0,
        y: 0,
        type: 'global'
    });
    const [settingsState, setSettingsState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isOpen: false,
        schema: [],
        targetShape: null
    });
    const handleContextMenu = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useContextMenu.useCallback[handleContextMenu]": (e)=>{
            e.preventDefault();
            if (!containerRef.current || !chartWidgetRef.current) return;
            // 1. Coordinate Translation
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // 2. Hit Test
            // Note: chartWidgetRef.current.hitTest must iterate in reverse order
            const hitShape = chartWidgetRef.current.hitTest(x, y);
            if (hitShape) {
                // Scenario A: Widget Clicked
                setMenuState({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'widget',
                    targetId: hitShape.id
                });
            } else {
                // Scenario B: Empty Space Clicked
                setMenuState({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'global'
                });
            }
        }
    }["useContextMenu.useCallback[handleContextMenu]"], [
        containerRef,
        chartWidgetRef
    ]);
    // Attach listener
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useContextMenu.useEffect": ()=>{
            const container = containerRef.current;
            if (!container) return;
            container.addEventListener('contextmenu', handleContextMenu);
            return ({
                "useContextMenu.useEffect": ()=>container.removeEventListener('contextmenu', handleContextMenu)
            })["useContextMenu.useEffect"];
        }
    }["useContextMenu.useEffect"], [
        handleContextMenu,
        containerRef
    ]);
    const closeMenu = ()=>setMenuState((prev)=>({
                ...prev,
                visible: false
            }));
    const openSettings = ()=>{
        if (menuState.type === 'widget' && menuState.targetId && chartWidgetRef.current) {
            const shape = chartWidgetRef.current.getShapeById(menuState.targetId);
            if (shape) {
                const primitive = shape.getPrimitive();
                // Check if primitive supports getSettingsSchema
                if (primitive && typeof primitive.getSettingsSchema === 'function') {
                    const schema = primitive.getSettingsSchema();
                    setSettingsState({
                        isOpen: true,
                        schema,
                        targetShape: shape
                    });
                }
            }
        }
        closeMenu();
    };
    const handleDelete = ()=>{
        if (menuState.type === 'widget' && menuState.targetId && chartWidgetRef.current) {
            chartWidgetRef.current.removeEntity(menuState.targetId);
        }
        closeMenu();
    };
    const handleRemoveAll = ()=>{
        if (chartWidgetRef.current) {
            chartWidgetRef.current.removeAllShapes();
        }
        closeMenu();
    };
    const closeSettings = ()=>setSettingsState((prev)=>({
                ...prev,
                isOpen: false
            }));
    const saveSettings = (newSettings)=>{
        if (settingsState.targetShape) {
            const primitive = settingsState.targetShape.getPrimitive();
            if (primitive && typeof primitive.applySettings === 'function') {
                primitive.applySettings(newSettings);
            }
        }
    };
    return {
        menuState,
        settingsState,
        closeMenu,
        openSettings,
        handleDelete,
        handleRemoveAll,
        closeSettings,
        saveSettings
    };
};
_s(useContextMenu, "NP53Au96PPfnUxtLAfy/ENeg5qo=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useTradeMonitor.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useTradeMonitor",
    ()=>useTradeMonitor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/client-api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/socket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)"); // Import Store
var _s = __turbopack_context__.k.signature();
;
;
;
;
const useTradeMonitor = ()=>{
    _s();
    const isTestMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])({
        "useTradeMonitor.useWorkspaceStore[isTestMode]": (state)=>state.isTestMode
    }["useTradeMonitor.useWorkspaceStore[isTestMode]"]); // React to Global Switch
    const [positions, setPositions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [aggregatedTradesState, setAggregatedTradesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // State Refs for merging (to avoid dependency loops)
    const masterTradesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const livePositionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    // 1. Slow Poll: Master Trades (Source of Truth for Metadata) - 1s
    const fetchMasterTrades = async ()=>{
        try {
            const envParam = isTestMode ? 'test' : 'live';
            const tradesRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchDirect"])(`/api/active-trades?env=${envParam}`);
            const tradesData = await tradesRes.json();
            const masterTrades = tradesData.success ? tradesData.trades : [];
            masterTradesRef.current = masterTrades;
        } catch (e) {
            console.error("Master Trade Poll Error", e);
        }
    };
    // 2. Fast Poll: Live Positions (Profit/Loss updates) - 50ms
    const fetchLivePositions = async ()=>{
        try {
            const posRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchDirect"])('/api/positions');
            const posData = await posRes.json();
            const livePositions = posData.success ? posData.positions : [];
            livePositionsRef.current = livePositions;
            setPositions(livePositions);
            // 3. Merge Logic (Master + Live) -> Aggregated
            // PERFORMED IN-PLACE to ensure 50ms reactivity
            const combined = [];
            const claimedTickets = new Set();
            const masterTrades = masterTradesRef.current; // Use latest Ref
            // Process Master Trades first
            masterTrades.forEach((mt)=>{
                const tId = mt.id.toString();
                // Magic might be in params (if ID is string) or implicit (if ID is numeric)
                const tMagic = mt.params && mt.params.magic ? mt.params.magic.toString() : null;
                // Find matching positions (by Magic Number OR Comment)
                const matches = livePositions.filter((p)=>{
                    // STRICT ID MATCH ONLY (User Mandate)
                    // MQL5 sends position.id which corresponds to the Trade ID
                    return p.id && p.id.toString() === tId;
                });
                matches.forEach((m)=>claimedTickets.add(`${m.botId}-${m.ticket}`));
                // 4. DB-First Merging Logic (Task-0189 Refactor)
                if (mt.executions && Array.isArray(mt.executions)) {
                    const dbExecutions = mt.executions;
                    const mergedPositions = [];
                    const usedLiveIds = new Set();
                    dbExecutions.forEach((exec)=>{
                        // ROBUSTNESS: Handle both DB (snake_case) and API (camelCase) keys
                        const execBotId = (exec.bot_id || exec.botId || "").trim();
                        // FIX: Search GLOBAL livePositions, not the pre-filtered 'matches'.
                        // 'matches' only contains positions where pos.id == master.id.
                        // But here we want to link via BotID + Ticket/Magic even if ID mismatch.
                        // FIX: Use robust execBotId key
                        // CRITICAL: User Mandate "IMMER DIE TRADE ID nehmen"
                        // Live Position 'id' corresponds to the Master Trade ID (stored as magic_number in DB)
                        const liveMatch = livePositions.find((m)=>m.botId === execBotId && exec.magic_number && m.id == exec.magic_number);
                        if (liveMatch) {
                            usedLiveIds.add(liveMatch.botId);
                            // Parse Broker Name from BotID (e.g. "FTMO_12345" -> "FTMO")
                            const parsedBroker = execBotId.includes('_') ? execBotId.split('_')[0] : execBotId;
                            // FIX: Sum History + Current for LIVE matches too
                            const liveComm = (liveMatch.commission || 0) + (liveMatch.metrics?.historyCommission || 0);
                            const liveSwap = (liveMatch.swap || 0) + (liveMatch.metrics?.historySwap || 0);
                            // FIX: Data Persistence - If Live is 0/Missing (e.g. Closed), prefer DB Snapshots
                            // Strictly use Broker Execution Data (Source of Truth). Do NOT fallback to Master (Aggregate).
                            const openPrice = liveMatch.open || exec.entry_price || 0;
                            const slPrice = liveMatch.sl || exec.sl || 0;
                            const tpPrice = liveMatch.tp || exec.tp || 0;
                            // Fix Open Time Overwrite (MQL5 sends CloseTime in 'time' field when closed)
                            // Usage: TradesPanel expects SECONDS for child rows. DB stores MILLISECONDS.
                            const openTimeSeconds = exec.open_time && exec.open_time > 0 ? exec.open_time / 1000 : liveMatch.time;
                            mergedPositions.push({
                                ...liveMatch,
                                commission: liveComm,
                                swap: liveSwap,
                                open: openPrice,
                                sl: slPrice,
                                tp: tpPrice,
                                time: openTimeSeconds,
                                // PREFER: Server Injected Name > Parsed Name > Live > GUID
                                brokerId: exec.brokerName || parsedBroker || liveMatch.brokerId || exec.broker_id,
                                status: 'RUNNING',
                                realizedPl: liveMatch.metrics?.realizedPl || exec.realized_pl || 0,
                                comment: liveMatch.comment || `[${exec.status}]`,
                                runningRr: (()=>{
                                    // Calculate Run R for Live Match
                                    const open = liveMatch.open || exec.entry_price || 0;
                                    const sl = liveMatch.sl || exec.sl || 0;
                                    // Live Match has 'current' price from broker
                                    const current = liveMatch.current || open;
                                    const distSl = Math.abs(open - sl);
                                    if (distSl === 0) return 0;
                                    const type = liveMatch.type; // 0=Buy, 1=Sell
                                    // Ensure type check handles string/number mismatch
                                    const isBuy = type === 0 || type === '0' || type === 'BUY';
                                    const distRun = isBuy ? current - open : open - current;
                                    return distRun / distSl;
                                })()
                            });
                        } else {
                            // Fallback numeric ID for UI keys if ticket missing
                            const fallbackTicket = -1 * (parseInt((exec.id || '0').replace(/\D/g, '')) || Math.floor(Math.random() * 100000));
                            // Parse Broker Name
                            const parsedBroker = execBotId.includes('_') ? execBotId.split('_')[0] : execBotId;
                            mergedPositions.push({
                                botId: execBotId,
                                symbol: mt.symbol,
                                type: mt.direction,
                                vol: exec.volume || 0,
                                realizedPl: exec.realized_pl || 0,
                                // profit: exec.realized_pl || 0, // REMOVED: Duplicate key. Profit usually means Floating.
                                // FIX: Sum History + Current because MQL5 sends them separate
                                commission: (exec.commission || 0) + (exec.metrics?.historyCommission || 0),
                                swap: (exec.swap || 0) + (exec.metrics?.historySwap || 0),
                                current: exec.exit_price || 0,
                                open: exec.entry_price || 0,
                                sl: exec.sl || 0,
                                tp: exec.tp || 0,
                                profit: exec.unrealized_pl || 0,
                                ticket: exec.ticket || fallbackTicket,
                                // Fix: Use Server Injected Name > Parsed Name > GUID
                                brokerId: exec.brokerName || parsedBroker || exec.broker_id || 'PENDING',
                                comment: `[${exec.status}]`,
                                status: exec.status,
                                // FIX: Convert MS to Seconds for UI consistency
                                time: exec.open_time && exec.open_time > 0 ? exec.open_time / 1000 : 0,
                                runningRr: (()=>{
                                    // Calculate Run R for DB Fallback
                                    const open = exec.entry_price || 0;
                                    const sl = exec.sl || 0;
                                    // Use exit_price for closed, or fall back to open if 0
                                    const current = exec.exit_price || open;
                                    const distSl = Math.abs(open - sl);
                                    if (distSl === 0) return 0;
                                    const type = mt.direction; // 1=Buy(Need Check), 0=Sell? MT5 is 0=Buy, 1=Sell. 
                                    // Wait, mt.direction is 1 or 0? 
                                    // DB: direction INTEGER. Usually 0=Buy, 1=Sell in our schema? 
                                    // Let's check mt.direction usage above: "mt.direction === 1 ? 'BUY' : 'SELL'" (Line 318)
                                    // So 1 is BUY. 
                                    const distRun = mt.direction === 1 ? current - open : open - current;
                                    return distRun / distSl;
                                })()
                            });
                        }
                    });
                    // Add Live Orphans (Safety)
                    matches.forEach((m)=>{
                        if (!usedLiveIds.has(m.botId)) mergedPositions.push(m);
                    });
                    matches.length = 0;
                    matches.push(...mergedPositions);
                }
                // Calculate Aggregates
                let totalVol = 0;
                let unrealizedPl = 0; // From Live Positions
                let totalComm = 0;
                let totalSwap = 0;
                let avgEntry = 0; // Simple Weighted
                let avgPrice = 0; // Current Market Price
                let aggregatedRealized = 0; // Sum of Broker Realized PnL
                if (matches.length > 0) {
                    matches.forEach((p)=>{
                        totalVol += Number(p.vol || 0);
                        // Robustness: If match reports CLOSED, its open profit is 0 by definition.
                        const matchProfit = p.customStatus === 'CLOSED' ? 0 : Number(p.profit || 0);
                        unrealizedPl += matchProfit;
                        // AGGREGATE REALIZED PNL from Matches (Broker Executions)
                        // Priority: Metrics (Live) > Direct Property (DB Fallback)
                        if (p.metrics && p.metrics.realizedPl !== undefined) {
                            aggregatedRealized += Number(p.metrics.realizedPl || 0);
                        } else if (p.realizedPl !== undefined) {
                            aggregatedRealized += Number(p.realizedPl || 0);
                        }
                        totalComm += Number(p.commission || 0);
                        totalSwap += Number(p.swap || 0);
                        avgEntry += Number(p.open || 0) * Number(p.vol || 0);
                        avgPrice += Number(p.current || 0) * Number(p.vol || 0);
                    });
                    avgEntry = totalVol > 0 ? avgEntry / totalVol : 0;
                    avgPrice = totalVol > 0 ? avgPrice / totalVol : 0;
                } else {
                    // Use Master values if no execution yet
                    totalVol = mt.volume || 0;
                    avgEntry = mt.entry_price || 0;
                    avgPrice = mt.entry_price || 0; // Fallback to entry
                }
                // ... RR Calculations ...
                const masterEntry = mt.entry_price || 0;
                const masterSl = mt.sl || 0;
                const masterTp = mt.tp || 0;
                const distSl = Math.abs(masterEntry - masterSl);
                const distTp = Math.abs(masterTp - masterEntry);
                // Plan R: Based on Initial Master Trade paramters (Fixed)
                let plannedRr = 0;
                if (distSl > 0) plannedRr = distTp / distSl;
                // Run R: Based on Average Entry vs Current Price (Dynamic)
                let runningRr = 0;
                // Use AvgEntry (Weighted) for Running R to reflect actual position
                if (distSl > 0 && avgPrice > 0) {
                    const distRun = mt.direction === 1 ? avgPrice - avgEntry : avgEntry - avgPrice;
                    runningRr = distRun / distSl;
                }
                // DB Realized PnL (mt.realized_pl) vs Aggregated
                // FIX: Check 'mt.realizedPl' (CamelCase from Backend) AND 'mt.realized_pl' (SnakeCase Legacy)
                const masterRealized = mt.realizedPl !== undefined ? mt.realizedPl : mt.realized_pl || 0;
                const realizedPl = matches.length > 0 ? aggregatedRealized : masterRealized;
                // FORCE CLOSED STATE LOGIC
                // If DB says CLOSED, we must zero out Unrealized, even if we had ghost matches
                // (Though strict matching should prevent ghost matches on closed trades)
                const isClosed = mt.status === 'CLOSED';
                if (isClosed) {
                    unrealizedPl = 0;
                }
                // Params Extraction (Anchors/Labels)
                let params = mt.params;
                if (typeof params === 'string') {
                    try {
                        params = JSON.parse(params);
                    } catch  {
                        params = {};
                    }
                }
                if (!params || typeof params !== 'object') params = {};
                const formatAnchor = (a)=>{
                    if (!a) return undefined;
                    let timeStr = '';
                    if (a.time) {
                        // Heuristic: seconds vs ms
                        const ms = typeof a.time === 'number' && a.time < 10000000000 ? a.time * 1000 : a.time;
                        timeStr = new Date(ms).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                    const tf = a.timeframe || a.tf;
                    return tf ? `[${tf}] ${timeStr}` : timeStr || a.name || 'Anchor';
                };
                let entryLabel = formatAnchor(params.entry?.anchor);
                if (!entryLabel && mt.entry_price === 0) {
                    entryLabel = 'Market';
                }
                let slLabel = formatAnchor(params.sl?.anchor);
                if (!slLabel && mt.sl === 0) {
                    slLabel = 'Auto';
                }
                let tpLabel = formatAnchor(params.tp?.anchor);
                // Auto TP logic: explicit 0 or params flag
                if (!tpLabel) {
                    if (mt.tp === 0 || params.tp && (params.tp.method === 'RR' || params.tp.auto)) {
                        tpLabel = 'Auto';
                    }
                }
                combined.push({
                    tradeId: tId,
                    symbol: mt.symbol,
                    strategy: mt.strategy || 'Manual',
                    direction: mt.direction === 1 ? 'BUY' : 'SELL',
                    totalVol: totalVol,
                    volume: totalVol,
                    realizedPl: realizedPl,
                    unrealizedPl: unrealizedPl,
                    totalProfit: realizedPl + unrealizedPl,
                    totalCommission: totalComm,
                    totalSwap: totalSwap,
                    status: isClosed ? 'CLOSED' : matches.length > 0 ? 'RUNNING' : mt.status || 'PENDING',
                    positions: matches,
                    avgEntry: avgEntry,
                    avgSl: masterSl,
                    avgTp: masterTp,
                    currentRr: plannedRr,
                    runningRr: runningRr,
                    avgPrice: avgPrice,
                    openTime: mt.created_at || Date.now(),
                    entryLabel: entryLabel,
                    slLabel: slLabel,
                    tpLabel: tpLabel
                });
            });
            // Process Orphans
            const orphanGroups = {};
            livePositions.forEach((pos)=>{
                const key = `${pos.botId}-${pos.ticket}`;
                if (claimedTickets.has(key)) return;
                // FIX: Strict Protocol Compliance. ID comes from 'id' field (mapped from Magic in Adapter).
                // "Magic Number" is internal to MT5. External consumers use 'id'.
                // Comment is NOT a source of ID.
                let oId = pos.id ? pos.id.toString() : null;
                if (!oId || oId === '0') {
                    // Fallback ONLY to ticket if no ID provided (Unmanaged/Legacy)
                    oId = `ticket-${pos.ticket}`;
                }
                // Final Safety Cast (TS Lint Fix)
                const finalId = oId || `ticket-${pos.ticket}`;
                if (!orphanGroups[finalId]) {
                    orphanGroups[finalId] = {
                        tradeId: finalId,
                        symbol: pos.symbol,
                        strategy: pos.comment?.split('|')[0] || 'Manual',
                        direction: pos.type === 0 ? 'BUY' : 'SELL',
                        totalVol: 0,
                        volume: 0,
                        realizedPl: 0,
                        unrealizedPl: 0,
                        totalProfit: 0,
                        totalCommission: 0,
                        totalSwap: 0,
                        status: 'RUNNING',
                        positions: [],
                        avgEntry: 0,
                        avgSl: 0,
                        avgTp: 0,
                        avgPrice: 0,
                        currentRr: 0,
                        runningRr: 0,
                        openTime: Date.now()
                    };
                    combined.push(orphanGroups[oId]);
                }
                const g = orphanGroups[oId];
                g.positions.push(pos);
                g.totalVol += pos.vol;
                g.unrealizedPl += pos.profit;
                g.totalProfit += pos.profit;
                g.totalCommission += pos.commission;
                g.totalSwap += pos.swap;
                g.avgEntry += pos.open * pos.vol; // Sum for weighting
                g.avgPrice += pos.current * pos.vol;
                g.avgSl += pos.sl * pos.vol;
                g.avgTp += pos.tp * pos.vol;
            });
            Object.values(orphanGroups).forEach((g)=>{
                if (g.totalVol > 0) {
                    g.avgEntry /= g.totalVol;
                    g.avgPrice /= g.totalVol;
                    g.avgSl /= g.totalVol;
                    g.avgTp /= g.totalVol;
                    // Calc RR for Orphans
                    const distSl = Math.abs(g.avgEntry - g.avgSl);
                    if (distSl > 0) {
                        g.currentRr = Math.abs(g.avgTp - g.avgEntry) / distSl;
                        const distRun = g.direction === 'BUY' ? g.avgPrice - g.avgEntry : g.avgEntry - g.avgPrice;
                        g.runningRr = distRun / distSl;
                    }
                }
            });
            setAggregatedTradesState(combined);
        } catch (e) {
            console.error("Monitor Poll Error", e);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useTradeMonitor.useEffect": ()=>{
            // Reset State on Env Change
            setPositions([]);
            setAggregatedTradesState([]);
            masterTradesRef.current = [];
            livePositionsRef.current = [];
            // Initial Loads
            fetchMasterTrades().then({
                "useTradeMonitor.useEffect": ()=>fetchLivePositions()
            }["useTradeMonitor.useEffect"]);
            // ULTRA-LOW LATENCY: 50ms Fallback + Socket Push
            const intervalFast = setInterval(fetchLivePositions, 50);
            const intervalSlow = setInterval(fetchMasterTrades, 1000);
            // Push Protocol Listener
            const socket = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["socketService"].getSocket();
            const onSignal = {
                "useTradeMonitor.useEffect.onSignal": ()=>{
                    // Instant Trigger for BOTH Live and Master Data
                    fetchLivePositions();
                    fetchMasterTrades();
                }
            }["useTradeMonitor.useEffect.onSignal"];
            socket.on('trades_update_signal', onSignal);
            return ({
                "useTradeMonitor.useEffect": ()=>{
                    clearInterval(intervalFast);
                    clearInterval(intervalSlow);
                    socket.off('trades_update_signal', onSignal);
                }
            })["useTradeMonitor.useEffect"];
        }
    }["useTradeMonitor.useEffect"], [
        isTestMode
    ]); // Re-run when Environment Switches
    const modifyTrade = async (modification)=>{
        // Find relevant accounts for this tradeID
        const targetTrade = aggregatedTradesState.find((t)=>t.tradeId === modification.tradeId);
        if (!targetTrade) {
            console.error("Trade not found for modification:", modification.tradeId);
            return false;
        }
        // De-duplicate BotIDs
        const accounts = targetTrade.positions.map((p)=>({
                botId: p.botId
            }));
        // USER QUERY 7200: "HÖR MIT DIESER MAGIC NUMBER AUF! WIR BENUTZEEN DIE TRADE ID"
        // Implicitly, the `modification.tradeId` (MasterID) IS the Trade ID.
        // We do NOT attempt to find a mismatched "MQL ID" or "Magic". We send the Master ID.
        // If MQL5 uses a different ID, that logic must be fixed in MQL5 or Mapping, not here.
        console.log(`[modifyTrade] Action: ${modification.action} TradeID: ${modification.tradeId}`);
        console.log(`[modifyTrade] 🚀 Sending POST to /api/trade/modify...`);
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchDirect"])('/api/trade/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modification,
                    accounts
                })
            });
            console.log(`[modifyTrade] Response Status: ${res.status}`);
            const body = await res.json();
            console.log(`[modifyTrade] Response Body: `, body);
            return body.success === true;
        } catch (e) {
            console.error("[modifyTrade] ❌ Modification Network Error:", e);
            return false;
        }
    };
    return {
        params: {},
        aggregatedTrades: aggregatedTradesState,
        positions,
        modifyTrade
    };
};
_s(useTradeMonitor, "0fMC54FaLrLQWrrh4KL+vuewU3Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useChartData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChartData",
    ()=>useChartData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$MT5Datafeed$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/MT5Datafeed.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/chartUtils.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
function useChartData({ symbol, timeframe, botId, isActivePane, onTick }) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [horizonData, setHorizonData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isSyncing, setIsSyncing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false); // For backlog filling
    const [isChartReady, setIsChartReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [syncError, setSyncError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const [syncStatus, setSyncStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('SYNCING');
    // Refs
    const lastCandleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const datafeedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const symbolRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(symbol);
    const tfRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(timeframe);
    const isLoadingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Sync Refs & Clear Data for Instant Feedback
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChartData.useEffect": ()=>{
            symbolRef.current = symbol;
            tfRef.current = timeframe;
            // INSTANT CLEAR: Immediately clear data so the UI reflects the switch
            setData([]);
            setHorizonData([]); // Clear phantom bars
            // RESET LOADING: Allow new fetch to proceed even if previous one was running
            setIsLoading(false);
            isLoadingRef.current = false;
            // RESET LAST CANDLE: Prevent ghost candles from previous timeframe/symbol
            lastCandleRef.current = null;
            // RESET LOCK STATE
            setIsChartReady(false);
            setSyncError(undefined);
        }
    }["useChartData.useEffect"], [
        symbol,
        timeframe
    ]);
    // Initialize Datafeed Adapter
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChartData.useEffect": ()=>{
            if (!datafeedRef.current) {
                datafeedRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$MT5Datafeed$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MT5Datafeed"]();
            }
        }
    }["useChartData.useEffect"], []);
    // Helper: Fetch History (Progressive / Chunked)
    const fetchHistory = async (isMerge = false)=>{
        if (!symbol || !botId) return;
        // Prevent concurrent fetches or double-execution
        if (isLoadingRef.current) return;
        try {
            if (!isMerge) {
                setIsLoading(true);
                isLoadingRef.current = true;
            }
            const targetTotal = 10000; // Goal: 10k bars
            const chunkSize = 500; // Packet size: 500 (safe balance)
            // 1. Initial Fetch (Latest)
            console.log(`[useChartData] 🚀 Starting Progressive Fetch for ${symbol} ${timeframe}`);
            let url = `http://127.0.0.1:3005/history?symbol=${symbol}&timeframe=${timeframe}&limit=${chunkSize}&_=${Date.now()}`;
            let res = await fetch(url);
            let response = await res.json();
            if (!response.success || !response.candles) {
                console.warn("[useChartData] Initial fetch failed or empty.");
                setIsLoading(false);
                isLoadingRef.current = false;
                return;
            }
            let gatheredBars = response.candles.map((c)=>{
                let t = Number(c.time);
                if (t > 100000000000) t = t / 1000;
                return {
                    time: t,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume || 0
                };
            }).sort((a, b)=>a.time - b.time);
            // Set Initial Data or Merge
            if (gatheredBars.length > 0) {
                // STALENESS CHECK
                if (symbolRef.current !== symbol || tfRef.current !== timeframe) {
                    console.log(`[useChartData] ⚠️ Initial fetch discarded for ${symbol} ${timeframe}`);
                    return;
                }
                // MERGE LIVE CANDLE (Fix for Initial Fetch Flicker)
                const liveCandle = lastCandleRef.current;
                if (liveCandle) {
                    const lastFetched = gatheredBars[gatheredBars.length - 1];
                    if (!lastFetched || lastFetched.time < liveCandle.time) {
                        gatheredBars.push(liveCandle);
                    } else if (lastFetched.time === liveCandle.time) {
                        gatheredBars[gatheredBars.length - 1] = liveCandle;
                    }
                }
                if (isMerge) {
                    // SMART MERGE: Integrate new chunk into existing data
                    // Filter out bars that are already in 'data' (deduplication)
                    // But beware: 'data' state might be stale in closure?
                    // We can use functional update or assume 'data' is reasonably fresh if no rapid updates.
                    // Better: We just update 'data' by slicing.
                    console.log(`[useChartData] 🧬 Smart Merge: Integrating ${gatheredBars.length} bars...`);
                    setData((prevData)=>{
                        // Create a map of existing bars for overlap check? No, just time-based merge.
                        // Simple: Filter prevData to keep only bars OLDER than the new chunk's first bar.
                        // Then append new chunk.
                        if (prevData.length === 0) return [
                            ...gatheredBars
                        ];
                        const firstNewTime = gatheredBars[0].time;
                        const nonOverlappingOld = prevData.filter((d)=>d.time < firstNewTime);
                        return [
                            ...nonOverlappingOld,
                            ...gatheredBars
                        ];
                    });
                    // Update Horizon
                    const latest = gatheredBars[gatheredBars.length - 1];
                    lastCandleRef.current = {
                        ...latest
                    };
                    setHorizonData((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePhantomBars"])(latest.time, latest.close, timeframe));
                    // Stop loop if merging
                    setIsLoading(false);
                    isLoadingRef.current = false;
                    return;
                } else {
                    // FRESH LOAD
                    setData([
                        ...gatheredBars
                    ]);
                    lastCandleRef.current = {
                        ...gatheredBars[gatheredBars.length - 1]
                    };
                    if (gatheredBars.length > 0) {
                        setHorizonData((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePhantomBars"])(gatheredBars[gatheredBars.length - 1].time, gatheredBars[gatheredBars.length - 1].close, timeframe));
                        // FIX: PROGRESSIVE LOADING
                        // Show chart immediately after first chunk, while backfilling continues in background
                        setIsLoading(false);
                    }
                }
            }
            // 2. Background Loop (Load older data)
            while(gatheredBars.length < targetTotal){
                if (gatheredBars.length === 0) break;
                const oldestTime = gatheredBars[0].time; // First element is oldest
                // Fetch older than current oldest
                // Fix: Convert 'oldestTime' (seconds) back to MS for the backend if needed.
                // Since we detected MS in the response earlier, we know backend sends MS.
                // But let's be robust: If the ORIGINAL response was MS, we should query in MS.
                // Simplest: Assume backend stores MS (standard).
                const toMs = Math.floor(oldestTime * 1000);
                url = `http://127.0.0.1:3005/history?symbol=${symbol}&timeframe=${timeframe}&limit=${chunkSize}&to=${toMs}&_=${Date.now()}`;
                // console.log(`[useChartData] 📡 Fetching chunk older than ${new Date(toMs).toISOString()} (to=${toMs})`);
                res = await fetch(url);
                response = await res.json();
                if (!response.success || !response.candles || response.candles.length === 0) {
                    console.log("[useChartData] ✅ End of history reached.");
                    break;
                }
                const newChunk = response.candles.map((c)=>{
                    let t = Number(c.time);
                    if (t > 100000000000) t = t / 1000;
                    return {
                        time: t,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: c.volume || 0
                    };
                }).sort((a, b)=>a.time - b.time);
                // Dedup
                const uniqueNew = newChunk.filter((nc)=>nc.time < oldestTime);
                if (uniqueNew.length === 0) {
                    console.log("[useChartData] No unique older bars found. Stopping.");
                    break;
                }
                gatheredBars = [
                    ...uniqueNew,
                    ...gatheredBars
                ];
                // STALENESS CHECK: Ensure we are still on the same symbol/tf
                if (symbolRef.current !== symbol || tfRef.current !== timeframe) {
                    console.log(`[useChartData] ⚠️ Fetch aborted for ${symbol} ${timeframe} (switched to ${symbolRef.current} ${tfRef.current})`);
                    return; // Stop this loop and function
                }
                // Update UI incrementally
                // Update UI incrementally but PRESERVE Live Candle State
                const liveCandle = lastCandleRef.current;
                let finalData = [
                    ...gatheredBars
                ];
                if (liveCandle) {
                    const lastFetched = finalData[finalData.length - 1];
                    if (!lastFetched || lastFetched.time < liveCandle.time) {
                        // Append Live Candle if missing from fetch
                        finalData.push(liveCandle);
                    } else if (lastFetched.time === liveCandle.time) {
                        // CRITICAL FIX: Overwrite stale DB candle with LIVE candle
                        // The Live Stream is always more up-to-date than the DB during active trading.
                        finalData[finalData.length - 1] = liveCandle;
                    }
                }
                setData(finalData);
                // Small delay to prevent network congestion
                await new Promise((r)=>setTimeout(r, 100));
            }
            setIsLoading(false);
            isLoadingRef.current = false;
        } catch (e) {
            console.error(`[useChartData] Error fetching history for ${symbol}:`, e);
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    };
    // Main Streaming Effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useChartData.useEffect": ()=>{
            if (!symbol || !botId) {
                return;
            }
            const onSyncComplete = {
                "useChartData.useEffect.onSyncComplete": (payload)=>{
                    if (payload.symbol === symbol && payload.timeframe === timeframe) {
                        console.log(`[useChartData] 🔓 SYNC COMPLETE for ${symbol} ${timeframe}. Unlocking UI.`);
                        setIsChartReady(true);
                        // Trigger History Fetch ONLY if we don't have data yet
                        if (!lastCandleRef.current) {
                            fetchHistory(false);
                        } else {
                            console.log(`[useChartData] ⏩ SYNC COMPLETE. Triggering Smart Merge to fill gaps.`);
                            fetchHistory(true); // isMerge = true
                        }
                    }
                }
            }["useChartData.useEffect.onSyncComplete"];
            const onSyncError = {
                "useChartData.useEffect.onSyncError": (payload)=>{
                    if (payload.symbol === symbol && payload.timeframe === timeframe) {
                        console.error(`[useChartData] ❌ SYNC ERROR for ${symbol} ${timeframe}: ${payload.error}`);
                        setSyncError(payload.error || "Sync Failed");
                    }
                }
            }["useChartData.useEffect.onSyncError"];
            // 0. Listen for SYNC Events
            const { communicationHub } = __turbopack_context__.r("[project]/src/services/CommunicationHub.ts [app-client] (ecmascript)");
            communicationHub.on('SYNC_COMPLETE', onSyncComplete);
            communicationHub.on('SYNC_ERROR', onSyncError);
            // 3. LISTEN FOR RECONNECT (Gap Fill Fix)
            // If socket reconnects, we might have missed SYNC_COMPLETE.
            // Force a SMART MERGE to ensure we are up to date.
            const onReconnect = {
                "useChartData.useEffect.onReconnect": ()=>{
                    console.log(`[useChartData] 🔌 Socket Reconnected. Triggering Smart Merge check for ${symbol} ${timeframe}`);
                    // Check if we are ready (Status) or just blindly merge
                    if (lastCandleRef.current) {
                        fetchHistory(true); // Merge
                    }
                }
            }["useChartData.useEffect.onReconnect"];
            communicationHub.on('connect', onReconnect);
            // 4. LISTEN FOR STATUS UPDATES (Sanity)
            const onSanityUpdate = {
                "useChartData.useEffect.onSanityUpdate": (payload)=>{
                    if (payload.symbol === symbol && payload.timeframe === timeframe) {
                        console.log(`[useChartData] 🚦 Status Update: ${payload.status}`);
                        setSyncStatus(payload.status);
                    }
                }
            }["useChartData.useEffect.onSanityUpdate"];
            communicationHub.on('sanity_update', onSanityUpdate);
            // 1. Check Initial Sync Status (Fix for Race Condition)
            const checkSyncStatus = {
                "useChartData.useEffect.checkSyncStatus": async ()=>{
                    try {
                        const res = await fetch(`http://127.0.0.1:3005/sync-status?symbol=${symbol}`);
                        const json = await res.json();
                        if (json.success && json.status) {
                            // Check if specific TF is ready
                            // Status structure: { "M1": { status: "READY", ... } }
                            console.log(`[useChartData:Debug] /sync-status response for ${symbol}:`, JSON.stringify(json));
                            const tfStatus = json.status[timeframe];
                            if (tfStatus) {
                                setSyncStatus(tfStatus.status); // <--- CRITICAL: Set initial status
                            }
                            if (tfStatus && (tfStatus.status === 'READY' || tfStatus.status === 'OFFLINE')) {
                                console.log(`[useChartData] ✅ Initial Status Check: ${symbol} ${timeframe} is ALREADY READY.`);
                                setIsChartReady(true);
                            } else {
                                console.log(`[useChartData] ⏳ Initial Status Check: ${symbol} ${timeframe} is ${tfStatus?.status || 'UNKNOWN'}. Showing available data while syncing...`);
                            // Even if syncing, we show what we have!
                            }
                            // FIX: Always fetch available history immediately. Don't wait for Sync.
                            fetchHistory();
                        }
                    } catch (e) {
                        console.warn("[useChartData] Failed to check sync status", e);
                    }
                }
            }["useChartData.useEffect.checkSyncStatus"];
            checkSyncStatus();
            // 2. Subscribe
            const subId = `sub_${symbol}_${timeframe}_${Date.now()}`;
            const adapter = datafeedRef.current;
            if (adapter) {
                adapter.subscribeBars({
                    name: symbol
                }, timeframe, {
                    "useChartData.useEffect": (bar)=>{
                        // Realtime Logic (copied from LiveChartPage and simplified)
                        if (bar.symbol !== symbol || bar.timeframe !== timeframe) return;
                        const tfSeconds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTimeframeSeconds"])(timeframe);
                        let tickTime = Number(bar.time);
                        if (tickTime > 100000000000) tickTime = tickTime / 1000;
                        const candleTime = Math.floor(tickTime / tfSeconds) * tfSeconds;
                        let candleToRender;
                        if (!lastCandleRef.current) {
                            // Fresh candle
                            if (bar.open !== undefined) {
                                // TRUSTED SOURCE (Full Candle)
                                candleToRender = {
                                    time: candleTime,
                                    open: bar.open,
                                    high: bar.high,
                                    low: bar.low,
                                    close: bar.close,
                                    volume: bar.volume || 1
                                };
                            } else {
                                // Raw Tick Construction
                                candleToRender = {
                                    time: candleTime,
                                    open: bar.close,
                                    high: bar.close,
                                    low: bar.close,
                                    close: bar.close,
                                    volume: 1
                                };
                            }
                            lastCandleRef.current = candleToRender;
                        } else {
                            if (candleTime > lastCandleRef.current.time) {
                                // New Bar
                                if (bar.open !== undefined) {
                                    candleToRender = {
                                        time: candleTime,
                                        open: bar.open,
                                        high: bar.high,
                                        low: bar.low,
                                        close: bar.close,
                                        volume: bar.volume || 1
                                    };
                                } else {
                                    candleToRender = {
                                        time: candleTime,
                                        open: bar.close,
                                        high: bar.close,
                                        low: bar.close,
                                        close: bar.close,
                                        volume: 1
                                    };
                                }
                                lastCandleRef.current = candleToRender;
                                setHorizonData((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePhantomBars"])(candleTime, candleToRender.close, timeframe));
                                lastCandleRef.current = candleToRender;
                                setHorizonData((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generatePhantomBars"])(candleTime, candleToRender.close, timeframe));
                            } else if (candleTime === lastCandleRef.current.time) {
                                // Update Existing (Strict Equality Check)
                                if (bar.open !== undefined) {
                                    // TRUSTED UPDATE (Overwrite with Backend Truth)
                                    candleToRender = {
                                        time: candleTime,
                                        open: bar.open,
                                        high: bar.high,
                                        low: bar.low,
                                        close: bar.close,
                                        volume: bar.volume || 1
                                    };
                                } else {
                                    // TICK UPDATE (Accumulate)
                                    const current = lastCandleRef.current;
                                    candleToRender = {
                                        ...current,
                                        close: bar.close,
                                        high: Math.max(current.high, bar.close),
                                        low: Math.min(current.low, bar.close),
                                        volume: current.volume + 1
                                    };
                                }
                                lastCandleRef.current = candleToRender;
                            } else {
                                // OLD DATA -> IGNORE
                                // This prevents "Cannot update oldest data" error in LWC
                                // console.warn(`[useChartData] Generated time ${candleTime} is older than last ${lastCandleRef.current.time}. Ignoring.`);
                                return;
                            }
                        }
                        // Trigger callback for UI update
                        if (onTick) {
                            onTick(candleToRender);
                        }
                    }
                }["useChartData.useEffect"], subId, {
                    "useChartData.useEffect": ()=>{
                        // On History Signal (Gap Fill or Re-Sync)
                        // SAFE NOW: Merge Logic prevents Flicker.
                        console.log("[useChartData] 🔄 History Signal received. Merging update...");
                        fetchHistory();
                    }
                }["useChartData.useEffect"]);
            }
            return ({
                "useChartData.useEffect": ()=>{
                    if (adapter) adapter.unsubscribeBars(subId);
                    communicationHub.off('SYNC_COMPLETE', onSyncComplete);
                    communicationHub.off('SYNC_ERROR', onSyncError);
                    communicationHub.off('connect', onReconnect);
                    communicationHub.off('sanity_update', onSanityUpdate);
                }
            })["useChartData.useEffect"];
        }
    }["useChartData.useEffect"], [
        symbol,
        timeframe,
        botId
    ]);
    // We return refs or a way to get the latest candle to avoid re-renders
    return {
        data,
        horizonData,
        isLoading,
        isChartReady,
        syncError,
        syncStatus,
        getLastCandle: ()=>lastCandleRef.current
    };
}
_s(useChartData, "1/4XCevsyyuuUmZ0LKrkIiXe8nU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/ui/usePopoverPosition.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePopoverPosition",
    ()=>usePopoverPosition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const usePopoverPosition = ({ triggerRef, contentHeight: defaultContentHeight = 300, isOpen, gap = 5 })=>{
    _s();
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        top: 0,
        left: 0,
        placement: 'bottom'
    });
    const [contentElement, setContentElement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Callback ref for the content element
    const contentRef = (node)=>{
        setContentElement(node);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePopoverPosition.useEffect": ()=>{
            if (!isOpen || !triggerRef.current) return;
            const updatePosition = {
                "usePopoverPosition.useEffect.updatePosition": ()=>{
                    if (!triggerRef.current) return;
                    const rect = triggerRef.current.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    // Use actual measured height if available, otherwise fallback
                    const height = contentElement ? contentElement.offsetHeight : defaultContentHeight;
                    const spaceBelow = viewportHeight - rect.bottom;
                    let placement = 'bottom';
                    let top = rect.bottom + gap;
                    // Flip to top if insufficient space below
                    if (spaceBelow < height && rect.top > 50) {
                        placement = 'top';
                        // Position above: trigger top - content height - gap
                        top = rect.top - height - gap;
                    }
                    setPosition({
                        top,
                        left: rect.left,
                        placement
                    });
                }
            }["usePopoverPosition.useEffect.updatePosition"];
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
            let observer = null;
            if (contentElement) {
                observer = new ResizeObserver({
                    "usePopoverPosition.useEffect": ()=>updatePosition()
                }["usePopoverPosition.useEffect"]);
                observer.observe(contentElement);
            }
            return ({
                "usePopoverPosition.useEffect": ()=>{
                    window.removeEventListener('resize', updatePosition);
                    window.removeEventListener('scroll', updatePosition, true);
                    if (observer) observer.disconnect();
                }
            })["usePopoverPosition.useEffect"];
        }
    }["usePopoverPosition.useEffect"], [
        isOpen,
        defaultContentHeight,
        gap,
        contentElement
    ]);
    return {
        ...position,
        contentRef
    };
};
_s(usePopoverPosition, "8cPHZ++h8V9MmXooCjl0fHmkFgE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/useBrokerStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useBrokerStore",
    ()=>useBrokerStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
;
const useBrokerStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        brokers: [],
        isLoading: false,
        error: null,
        fetchBrokers: async ()=>{
            set({
                isLoading: true,
                error: null
            });
            try {
                const res = await fetch('/api/brokers');
                if (!res.ok) throw new Error('Failed to fetch brokers');
                const data = await res.json();
                set({
                    brokers: data,
                    isLoading: false
                });
            } catch (e) {
                set({
                    error: e.message,
                    isLoading: false
                });
            }
        },
        getBroker: (id)=>{
            return get().brokers.find((b)=>b.id === id);
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useWorkspaceStore",
    ()=>useWorkspaceStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
;
;
// ... existing code ...
const createDefaultPaneConfig = ()=>({
        symbol: 'BTCUSD',
        timeframe: 'D1',
        indicators: [] // New array reference every time
    });
const createDefaultWorkspace = (name)=>{
    const paneId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        name,
        layoutType: 'single',
        layoutSizes: [],
        panes: [
            {
                ...createDefaultPaneConfig(),
                id: paneId,
                isActive: true
            }
        ]
    };
};
const useWorkspaceStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        workspaces: [
            createDefaultWorkspace('Main Workspace')
        ],
        activeWorkspaceId: '',
        isTestMode: true,
        toggleTestMode: ()=>set((state)=>({
                    isTestMode: !state.isTestMode
                })),
        setIsTestMode: (mode)=>set({
                isTestMode: mode
            }),
        addWorkspace: (name = 'New Workspace')=>{
            const newWorkspace = createDefaultWorkspace(name);
            set((state)=>({
                    workspaces: [
                        ...state.workspaces,
                        newWorkspace
                    ],
                    activeWorkspaceId: newWorkspace.id
                }));
        },
        removeWorkspace: (id)=>{
            set((state)=>{
                const filtered = state.workspaces.filter((w)=>w.id !== id);
                // If we removed the active one, switch to the first available
                let newActiveId = state.activeWorkspaceId;
                if (id === state.activeWorkspaceId) {
                    newActiveId = filtered.length > 0 ? filtered[0].id : '';
                }
                // Prevent empty workspaces list?
                if (filtered.length === 0) {
                    const fallback = createDefaultWorkspace('Default');
                    return {
                        workspaces: [
                            fallback
                        ],
                        activeWorkspaceId: fallback.id
                    };
                }
                return {
                    workspaces: filtered,
                    activeWorkspaceId: newActiveId
                };
            });
        },
        setActiveWorkspace: (id)=>set({
                activeWorkspaceId: id
            }),
        updateWorkspaceLayout: (workspaceId, layout)=>{
            set((state)=>{
                return {
                    workspaces: state.workspaces.map((w)=>{
                        if (w.id !== workspaceId) return w;
                        // Adjust panes based on layout
                        let newPanes = [
                            ...w.panes
                        ];
                        // Determine target pane count
                        let targetCount = 1;
                        let defaultSizes = [];
                        switch(layout){
                            case 'single':
                                targetCount = 1;
                                defaultSizes = [
                                    100
                                ];
                                break;
                            case 'split-vertical':
                            case 'split-horizontal':
                                targetCount = 2;
                                defaultSizes = [
                                    50,
                                    50
                                ];
                                break;
                            case 'grid-1-2':
                                targetCount = 3;
                                // Main Split (66/33), Right Split (50/50)
                                // [MainL, MainR, RightTop, RightBot]
                                defaultSizes = [
                                    66,
                                    34,
                                    50,
                                    50
                                ];
                                break;
                            case 'grid-2x2':
                                targetCount = 4;
                                // Main Split (50/50), Left Split (50/50), Right Split (50/50)
                                // [MainL, MainR, LeftTop, LeftBot, RightTop, RightBot]
                                defaultSizes = [
                                    50,
                                    50,
                                    50,
                                    50,
                                    50,
                                    50
                                ];
                                break;
                        }
                        if (newPanes.length < targetCount) {
                            // Add panes
                            const needed = targetCount - newPanes.length;
                            for(let i = 0; i < needed; i++){
                                newPanes.push({
                                    ...createDefaultPaneConfig(),
                                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                                    isActive: false,
                                    // Copy symbol from active pane if possible?
                                    symbol: w.panes.find((p)=>p.isActive)?.symbol || createDefaultPaneConfig().symbol
                                });
                            }
                        } else if (newPanes.length > targetCount) {
                            // Remove panes (keep active one if possible, or first ones)
                            // Better strategy: Keep the first N panes
                            newPanes = newPanes.slice(0, targetCount);
                            // Ensure one is active
                            if (!newPanes.find((p)=>p.isActive)) {
                                newPanes[0].isActive = true;
                            }
                        }
                        return {
                            ...w,
                            layoutType: layout,
                            panes: newPanes,
                            layoutSizes: defaultSizes
                        };
                    })
                };
            });
        },
        updateLayoutSizes: (workspaceId, sizes)=>{
            set((state)=>({
                    workspaces: state.workspaces.map((w)=>{
                        if (w.id !== workspaceId) return w;
                        return {
                            ...w,
                            layoutSizes: sizes
                        };
                    })
                }));
        },
        toggleMaximizePane: (workspaceId, paneId)=>{
            set((state)=>({
                    workspaces: state.workspaces.map((w)=>{
                        if (w.id !== workspaceId) return w;
                        const isCurrentlyMaximized = w.maximizedPaneId === paneId;
                        return {
                            ...w,
                            maximizedPaneId: isCurrentlyMaximized ? undefined : paneId
                        };
                    })
                }));
        },
        updatePane: (workspaceId, paneId, updates)=>{
            set((state)=>({
                    workspaces: state.workspaces.map((w)=>{
                        if (w.id !== workspaceId) return w;
                        return {
                            ...w,
                            panes: w.panes.map((p)=>p.id === paneId ? {
                                    ...p,
                                    ...updates
                                } : p)
                        };
                    })
                }));
        },
        setActivePane: (workspaceId, paneId)=>{
            set((state)=>({
                    workspaces: state.workspaces.map((w)=>{
                        if (w.id !== workspaceId) return w;
                        return {
                            ...w,
                            panes: w.panes.map((p)=>({
                                    ...p,
                                    isActive: p.id === paneId
                                }))
                        };
                    })
                }));
        },
        requestScrollToTime: (paneId, time)=>{
            set((state)=>({
                    workspaces: state.workspaces.map((w)=>{
                        // Find workspace containing this pane
                        const hasPane = w.panes.some((p)=>p.id === paneId);
                        if (!hasPane) return w;
                        return {
                            ...w,
                            panes: w.panes.map((p)=>{
                                if (p.id !== paneId) return p;
                                return {
                                    ...p,
                                    scrollToTimeRequest: {
                                        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                                        time
                                    }
                                };
                            })
                        };
                    })
                }));
        }
    }), {
    name: 'workspace-storage',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    onRehydrateStorage: ()=>(state)=>{
            // Ensure activeWorkspaceId is valid on load
            if (state && state.workspaces.length > 0 && !state.activeWorkspaceId) {
                state.activeWorkspaceId = state.workspaces[0].id;
            }
        }
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/useChartRegistryStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChartRegistryStore",
    ()=>useChartRegistryStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
;
const useChartRegistryStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        charts: {},
        registerChart: (paneId, handle)=>{
            set((state)=>({
                    charts: {
                        ...state.charts,
                        [paneId]: handle
                    }
                }));
        },
        unregisterChart: (paneId)=>{
            set((state)=>{
                const { [paneId]: removed, ...rest } = state.charts;
                return {
                    charts: rest
                };
            });
        },
        getChart: (paneId)=>{
            return get().charts[paneId] || null;
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/useSymbolStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSymbolStore",
    ()=>useSymbolStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api.ts [app-client] (ecmascript)");
;
;
// Initial fetch prevention
let isFetching = false;
const useSymbolStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        symbols: [],
        symbolMap: new Map(),
        isLoading: false,
        error: null,
        fetchSymbols: async (botId)=>{
            // Simple cache check: if we have symbols and not explicitly refreshing (TODO: add force refresh param if needed)
            // For now, allow refetch if botId changes or empty
            const currentCount = get().symbols.length;
            if (currentCount > 0 && !botId) return;
            if (isFetching) return;
            isFetching = true;
            set({
                isLoading: true,
                error: null
            });
            try {
                // fetchSymbols now returns enriched objects from the API (SocketServer)
                // api.ts fetchSymbols returns string[] OR object? 
                // We need to check api.ts. If it returns strings, we are stuck.
                // Let's assume we update api.ts or it already returns what SocketServer /symbols endpoint sends (which is objects now)
                // Checking api.ts logic in mind: 
                // It calls /symbols. SocketServer /symbols returns an array of objects enriched with digits.
                // But api.ts logic might flatten it? 
                // Let's rely on the raw response structure we saw in SocketServer code.
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchSymbols"])(botId);
                const map = new Map();
                const list = [];
                // Helper to parse result
                // The API might return strings or objects depending on the fallback.
                // We should handle both.
                // Note: fetchSymbols in api.ts is typed to return Promise<string[]> but implementation returns data.symbols which is object array.
                // We'll cast it here.
                const rawItems = result;
                rawItems.forEach((item)=>{
                    if (typeof item === 'string') {
                        // Fallback
                        list.push(item);
                        map.set(item, {
                            symbol: item,
                            digits: 5
                        }); // Default 5
                    } else {
                        const sym = item.name || item.symbol;
                        if (sym) {
                            list.push(sym);
                            map.set(sym, {
                                symbol: sym,
                                description: item.description || item.desc || '',
                                digits: item.digits !== undefined ? item.digits : 5,
                                path: item.path,
                                exchange: item.exchange,
                                type: item.type
                            });
                        }
                    }
                });
                list.sort();
                set({
                    symbols: list,
                    symbolMap: map,
                    isLoading: false
                });
            } catch (e) {
                set({
                    error: e.message,
                    isLoading: false
                });
            } finally{
                isFetching = false;
            }
        },
        getSymbolInfo: (symbol)=>{
            return get().symbolMap.get(symbol);
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * LayoutStateManager.ts
 * 
 * Logic Implementation for the Multi-Chart Sync Engine.
 * 
 * RESPONSIBILITIES:
 * 1. Maintain synchronization state (Timeframe enabled? Position enabled?)
 * 2. Registry of active ChartPanes (via ChartHandle interface).
 * 3. Broadcast events from Source -> Targets (excluding Source).
 */ __turbopack_context__.s([
    "LayoutStateManager",
    ()=>LayoutStateManager
]);
class LayoutStateManager {
    // Singleton Instance
    static instance;
    // Internal State
    charts = new Map();
    options = {
        isTimeframeSync: false,
        isPositionSync: false
    };
    lastActiveChartId = null;
    constructor(){
        console.log("[LayoutStateManager] Initialized");
    }
    static getInstance() {
        if (!LayoutStateManager.instance) {
            LayoutStateManager.instance = new LayoutStateManager();
        }
        return LayoutStateManager.instance;
    }
    /**
     * Updates the synchronization configuration.
     * @param options Partial options to update
     */ setOptions(options) {
        const prevTimeframeSync = this.options.isTimeframeSync;
        this.options = {
            ...this.options,
            ...options
        };
        console.log("[LayoutStateManager] Options updated:", this.options);
        // Logic 1: Initial Sync Logic (Timeframe)
        if (!prevTimeframeSync && this.options.isTimeframeSync) {
            this.applyMasterTimeToAll();
        }
    }
    /**
     * Sets the "Active" chart (Master for next sync operation)
     */ setLastActive(id) {
        this.lastActiveChartId = id;
    }
    /**
     * Hydrates all charts with the timeframe of the master chart
     */ applyMasterTimeToAll() {
        // Determine Master: Last Active or First registered
        let masterId = this.lastActiveChartId;
        if (!masterId || !this.charts.has(masterId)) {
            const first = this.charts.keys().next().value;
            if (first) masterId = first;
        }
        if (!masterId) return; // No charts registered
        const masterHandle = this.charts.get(masterId);
        if (masterHandle) {
            const masterTf = masterHandle.getTimeframe();
            console.log(`[LayoutStateManager] Initial Sync from Master (${masterId}): ${masterTf}`);
            this.syncTimeframe(masterId, masterTf);
        }
    }
    getOptions() {
        return {
            ...this.options
        };
    }
    /**
     * Registers a chart instance for synchronization.
     * @param handle The interface to control the chart
     */ register(handle) {
        if (!this.charts.has(handle.id)) {
            console.log(`[LayoutStateManager] Registering chart: ${handle.id}`);
            this.charts.set(handle.id, handle);
        }
    }
    /**
     * Removes a chart from the registry.
     * @param id The ID of the chart to remove
     */ unregister(id) {
        if (this.charts.has(id)) {
            this.charts.delete(id);
            if (this.lastActiveChartId === id) {
                this.lastActiveChartId = null;
            }
        }
    }
    /**
     * Broadcasts a timeframe change to all other charts (if Sync active).
     * @param sourceId The ID of the chart initiating the change
     * @param timeframe The new timeframe (e.g. "M5")
     */ syncTimeframe(sourceId, timeframe) {
        if (!this.options.isTimeframeSync) return;
        this.charts.forEach((handle, id)=>{
            if (id !== sourceId) {
                handle.setTimeframe(timeframe);
            }
        });
    }
    /**
     * Broadcasts a visible range scroll update (if Sync active).
     * @param sourceId The ID of the chart initiating the scroll
     * @param range The new visible time range
     * @param logicalRange Optional logical range for precise sync
     */ syncScroll(sourceId, range, logicalRange) {
        if (!this.options.isPositionSync) return;
        this.charts.forEach((handle, id)=>{
            if (id !== sourceId) {
                if (logicalRange) {
                    handle.setLogicalRange(logicalRange);
                } else {
                    handle.setVisibleRange(range);
                }
            }
        });
    }
    /**
     * Broadcasts a crosshair move (if Sync active).
     * WARNING: Hot path! Must use requestAnimationFrame or direct calls to avoid GC/Lag.
     * @param sourceId The ID of the chart where the mouse is
     * @param time The time index under the mouse
     * @param price The price level (optional)
     */ syncCrosshair(sourceId, time, price) {
        if (!this.options.isPositionSync) return;
        // Direct iteration for max performance
        // Bypass React state updates, call the handle directly
        for (const [id, handle] of this.charts){
            if (id !== sourceId) {
                handle.setCrosshair(time, price);
            }
        }
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/managers/TradeDistributionManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TradeDistributionManager",
    ()=>TradeDistributionManager
]);
class TradeDistributionManager {
    // --- Configuration Loading ---
    static async getDistributionConfig() {
        try {
            const res = await fetch('/api/distribution/config', {
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[TradeDistribution] Loaded Config:", data);
                return data;
            } else {
                console.error(`[TradeDistribution] Config fetch failed: ${res.status} ${res.statusText}`);
            }
        } catch (e) {
            console.error("[TradeDistribution] Failed to load config", e);
        }
        return null;
    }
    // --- Core Logic ---
    static distributeTrade(baseTrade, accounts, brokers, config, isTestMode = false) {
        const batches = [];
        console.log(`[TradeDistribution] Distributing Trade. TestMode: ${isTestMode}`);
        // 1. Group Accounts by Broker (FILTERED by Mode)
        const accountsByBroker = {};
        accounts.forEach((acc)=>{
            // STRICT CHECK: Only allow TRADING accounts. Explicitly block DATAFEED.
            if (acc.accountType !== 'TRADING' || acc.isDatafeed) {
                // console.log(`[TradeDistribution] Excluding Datafeed: ${acc.login}`);
                return;
            }
            // MODE CHECK:
            if (isTestMode) {
                // In Test Mode, ONLY accept Test Accounts
                if (!acc.isTest) return;
            } else {
                // In Live Mode, ONLY accept Live Accounts (isTest false/undefined)
                if (acc.isTest) return;
            }
            if (!accountsByBroker[acc.brokerId]) accountsByBroker[acc.brokerId] = [];
            accountsByBroker[acc.brokerId].push(acc);
        });
        // 2. Iterate Brokers
        Object.keys(accountsByBroker).forEach((brokerId)=>{
            const brokerAccounts = accountsByBroker[brokerId];
            const brokerNode = brokers.find((b)=>b.id === brokerId);
            if (!brokerNode) {
                console.warn(`[TradeDistribution] Unknown broker ID: ${brokerId}`);
                return;
            }
            // --- Symbol Mapping ---
            // Clone the trade to avoid mutating the original
            const mappedTrade = {
                ...baseTrade
            };
            // Apply Mapping if exists
            if (brokerNode.symbolMappings && brokerNode.symbolMappings[baseTrade.symbol]) {
                mappedTrade.symbol = brokerNode.symbolMappings[baseTrade.symbol];
                console.log(`[TradeDistribution] Mapped ${baseTrade.symbol} -> ${mappedTrade.symbol} for ${brokerNode.name}`);
            }
            // --- Distribution Matrix Logic ---
            let targetAccountIds = [];
            // Select Correct Config Section based on Mode
            const brokerConfigMap = isTestMode ? config?.test_brokers : config?.brokers;
            const prefix = isTestMode ? 'TEST_' : '';
            // Fuzzy Lookup: Try ID -> Name -> Shorthand
            let brokerConfig = brokerConfigMap?.[brokerId];
            if (!brokerConfig && brokerConfigMap && brokerNode) {
                // Determine potential keys provided in config
                brokerConfig = brokerConfigMap[brokerNode.name] || brokerConfigMap[brokerNode.shorthand];
                if (brokerConfig) {
                    console.log(`[TradeDistribution] Found config using name/shorthand fallback for '${brokerNode.name}'`);
                } else {
                    console.log(`[TradeDistribution] DEBUG: Broker Lookup Failed. ID: '${brokerId}', Name: '${brokerNode.name}'`);
                }
            }
            if (brokerConfig) {
                // 1. Load Counter (Separate Counter for Test Mode?)
                // YES, use separate counter keys to avoid messing up live rotation
                const counterKey = `distribution_counter_${prefix}${brokerId}`;
                let currentStep = parseInt(localStorage.getItem(counterKey) || '1');
                // Safety check loop size
                const loopSize = brokerConfig.loop_size || 1;
                if (currentStep > loopSize) currentStep = 1;
                console.log(`[TradeDistribution] Broker ${brokerNode.name} (${isTestMode ? 'TEST' : 'LIVE'}) - Step ${currentStep} of ${loopSize}`);
                // 2. Get Accounts for current step directly from Matrix
                const stepAccounts = brokerConfig.matrix[String(currentStep)];
                if (stepAccounts && stepAccounts.length > 0) {
                    targetAccountIds = stepAccounts;
                } else {
                    console.warn(`[TradeDistribution] No accounts configured for Step ${currentStep} in ${brokerNode.name}`);
                }
                // 3. Increment Counter for NEXT time
                let nextStep = currentStep + 1;
                if (nextStep > loopSize) nextStep = 1;
                localStorage.setItem(counterKey, String(nextStep));
            } else {
                // FALLBACK LOGIC
                if (isTestMode) {
                    // Test Mode: Default to ALL available accounts if no config exists
                    // This ensures "Test Environment" switch works out-of-the-box for mapped accounts
                    console.log(`[TradeDistribution] No explicit Test Config for ${brokerNode.name}. Defaulting to ALL available test accounts.`);
                    targetAccountIds = brokerAccounts.map((a)=>a.id);
                } else {
                    // Live Mode: STRICT. If no config exists, we do NOT distribute.
                    console.warn(`[TradeDistribution] No configuration found for broker ${brokerNode.name} (Live Mode). STRICT: Skipping.`);
                    targetAccountIds = [];
                }
            }
            // Filter out Accounts that might be in config but not in the passed accounts list
            const validAccounts = brokerAccounts.filter((a)=>targetAccountIds.includes(a.id));
            if (validAccounts.length > 0) {
                batches.push({
                    brokerId: brokerId,
                    trade: mappedTrade,
                    accounts: validAccounts // Send full objects for backend routing
                });
            }
        });
        return batches;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/client-api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URLS",
    ()=>API_URLS,
    "fetchDirect",
    ()=>fetchDirect,
    "fetchSystem",
    ()=>fetchSystem
]);
const BACKEND_URL = 'http://127.0.0.1:3005/api';
const NEXT_API_URL = '/api';
async function fetchDirect(endpoint, options) {
    // Ensure endpoint starts with / and remove it if double
    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Fix Double API Issue: If Backend URL ends with /api and Path starts with /api, strip one.
    if (BACKEND_URL.endsWith('/api') && cleanPath.startsWith('/api/')) {
        cleanPath = cleanPath.substring(4);
    }
    const url = `${BACKEND_URL}${cleanPath}`;
    // Performance Trace
    const start = performance.now();
    console.log(`[PERF ${Date.now()}] [ClientAPI] 🟡 FETCH START: ${cleanPath}`);
    try {
        const res = await fetch(url, options);
        console.log(`[PERF ${Date.now()}] [ClientAPI] 🟢 FETCH END: ${cleanPath} (Status: ${res.status}, Duration: ${(performance.now() - start).toFixed(2)}ms)`);
        return res;
    } catch (e) {
        console.log(`[PERF ${Date.now()}] [ClientAPI] 🔴 FETCH ERROR: ${cleanPath} (Duration: ${(performance.now() - start).toFixed(2)}ms)`);
        throw e;
    }
}
async function fetchSystem(endpoint, options) {
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${NEXT_API_URL}${cleanPath}`;
    return fetch(url, options);
}
const API_URLS = {
    DIRECT_BASE: 'http://127.0.0.1:3005',
    BACKEND_API: BACKEND_URL
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_fbdf2212._.js.map