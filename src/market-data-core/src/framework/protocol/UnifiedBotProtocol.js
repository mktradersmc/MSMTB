// const systemOrchestrator = require('../../services/SystemOrchestrator'); // REMOVED: Circular Dependency (Use Lazy Loading)
const manager = require('../transport/WebSocketManager'); // NEW
const router = require('../core/MessageRouter');
const rpcHelper = require('./RpcCommandHelper'); // Import RPC Helper

/**
 * UnifiedBotProtocol
 * 
 * Central "Brain" for all WebSocket traffic from Port 3000 (Bots).
 * Decides whether to use the Fast Lane (SyncManager) or Slow Lane (Router).
 */
class UnifiedBotProtocol {

    /**
     * Handle an incoming message from a Bot.
     * @param {Object} transport - The transport adapter (id, send, close)
     * @param {Object} rawMessage - The raw JSON object from the socket (or parsed envelope)
     */
    setFeatures(features) {
        this.features = features || {};
    }

    /**
     * Handle an incoming message from a Bot.
     * @param {Object} transport - The transport adapter (id, send, close)
     * @param {Object} rawMessage - The raw JSON object from the socket (or parsed envelope)
     */
    async handle(transport, rawMessage) {
        try {
            // 1. Normalize
            let msg = this.normalize(rawMessage);

            // 1.4 GLOBAL PAYLOAD PARSING
            // Ensure payload/content is an object, not a JSON string.
            if (msg.payload && typeof msg.payload === 'string') {
                try { msg.payload = JSON.parse(msg.payload); } catch (e) { }
            }
            if (msg.content && typeof msg.content === 'string') {
                try { msg.content = JSON.parse(msg.content); } catch (e) { }
            }
            // MQL5 Discrepancy: Sometimes 'content', sometimes 'payload'. unify?
            // Let's ensure 'content' is populated if missing, for workers that rely on it.
            if (!msg.content && msg.payload) msg.content = msg.payload;

            // 1.1 V3 HEADER HOISTING
            // MQL5 V3 sends metadata in 'header'. We hoist it to root for compatibility.
            if (msg.header) {
                if (!msg.botId && msg.header.botId) msg.botId = msg.header.botId;
                if (!msg.func && msg.header.func) msg.func = msg.header.func;
                if (!msg.symbol && msg.header.symbol) msg.symbol = msg.header.symbol;
                // Also ensure 'command' is treated as type if type is missing
                if (!msg.type && msg.header.command) msg.type = msg.header.command;
            }

            const type = msg.type || msg.method || msg.header?.command || 'UNKNOWN'; // Default to UNKNOWN to prevent undefined crash

            // 1.5 IDENTITY ENRICHMENT (Strict Registry Lookup)
            // Use Transport ID to find Registered Bot Metadata
            if (transport.id) {
                let routingKey = manager.transportMap.get(transport.id);
                let targetKey = null;

                if (routingKey instanceof Set) {
                    if (msg.botId) {
                        for (const key of routingKey) {
                            if (key.startsWith(msg.botId)) { targetKey = key; break; }
                        }
                    }
                    if (!targetKey && msg.payload?.botId) {
                        for (const key of routingKey) {
                            if (key.startsWith(msg.payload.botId)) { targetKey = key; break; }
                        }
                    }
                    if (!targetKey && routingKey.size > 0) {
                        targetKey = routingKey.values().next().value;
                    }
                } else {
                    targetKey = routingKey;
                }

                if (targetKey) {
                    const meta = manager.metadata.get(targetKey);
                    if (meta) {
                        if (!msg.botId) msg.botId = meta.id;
                        if (!msg.func) msg.func = meta.func;
                        if (!msg.symbol && meta.symbol !== 'ALL') msg.symbol = meta.symbol;
                        if (msg.payload && typeof msg.payload === 'object') {
                            if (!msg.payload.botId) msg.payload.botId = meta.id;
                            if (!msg.payload.symbol && meta.symbol !== 'ALL') msg.payload.symbol = meta.symbol;
                        }
                    }
                }
            }

            // 1.6 REGISTRY RECOVERY
            if (!msg.botId && msg.header?.request_id) {
                const recoveredKey = rpcHelper.getContext(msg.header.request_id);
                if (recoveredKey) {
                    const parts = recoveredKey.split(':');
                    msg.botId = parts[0];
                    if (parts.length > 1) msg.func = parts[1];
                    if (parts.length > 2) msg.symbol = parts[2];
                    if (msg.payload && typeof msg.payload === 'object') {
                        if (!msg.payload.botId) msg.payload.botId = msg.botId;
                    }
                }
            }

            // 2. LOGIC SWITCH (The Single Source of Truth)
            // UPDATED: Generic Routing to Workers via SystemOrchestrator
            if (this.features && this.features.ENABLE_DETAILED_PROTOCOL_LOGGING && type !== 'HEARTBEAT') {
                console.log("[UnifiedProtocol] Handle Raw Message " + rawMessage);
                console.log("[UnifiedProtocol] from " + (msg.header?.botId || msg.botId || 'UNKNOWN') + ":" + (msg.header?.func || msg.func || 'UNKNOWN') + ":" + (msg.header?.symbol || msg.symbol || 'UNKNOWN'));
            }

            switch (type) {
                // --- FAST LANE (High Frequency Data) ---
                case 'EV_BAR_UPDATE': // Alias for MQL5 Protocol (Forming Bar)
                    // STRICT V3: Do not rename. Forward as EV_BAR_UPDATE.
                    if (this.features && this.features.ENABLE_DETAILED_PROTOCOL_LOGGING) {
                        console.log(`[UnifiedProtocol:TRACE] ⏩ Routing EV_BAR_UPDATE to Worker: ${msg.symbol}`);
                    }
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                case 'EV_BAR_CLOSED': // Alias for MQL5 Protocol
                    // STRICT V3: Do not rename. Forward as EV_BAR_CLOSED.
                    if (this.features && this.features.ENABLE_DETAILED_PROTOCOL_LOGGING) {
                        console.log(`[UnifiedProtocol:TRACE] ⏩ Routing EV_BAR_CLOSED to Worker: ${msg.symbol}`);
                    }
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                    break;
                case 'HISTORY_BATCH':
                case 'HISTORY_SNAPSHOT':
                case 'CMD_EXECUTION_RESULT':
                case 'CMD_REPORT_ACCOUNTS':
                case 'EV_TRADE_CLOSED': // NEW: Closed Trades Support
                    // Generic Routing
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                    // Hot-Cache Cleanup for /api/positions endpoint (REST GUI)
                    require('../../services/SystemOrchestrator').handleTradesClosed(msg.botId, msg.content || msg.payload || msg);
                    break;
                case 'MSG_POSITIONS_UPDATE':
                case 'EV_TRADE_UPDATE': // NEW: Standard Trade Update Event
                    // 1. Generic Routing to Worker (DB Persistence)
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                    // 2. Direct Hot-Cache Update for /api/positions endpoint (REST GUI)
                    require('../../services/SystemOrchestrator').handlePositionsUpdate(msg.botId, msg.content || msg.payload || msg);
                    break;

                // --- DATA DISCOVERY (Worker Routing) ---
                case 'CMD_GET_SYMBOLS_RESPONSE':
                    // Route to Worker (Domain Logic)
                    // Orchestrator no longer handles this directly.
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                    break;

                // --- CONTROL PLANE (Session Logic) ---
                case 'REGISTER':
                    return await this.handleRegister(transport, msg);

                case 'HEARTBEAT':
                    if (msg.botId) {
                        require('../../services/SystemOrchestrator').handleHeartbeat(msg.botId, msg.payload || msg);
                    }
                    break;

                case 'EV_ACCOUNT_STATUS_UPDATE':
                    // Route to Worker for Account Discovery/Sync
                    require('../../services/SystemOrchestrator').routeToWorker(msg);
                    // Broadcast to Frontend and Persist to DB
                    require('../../services/SystemOrchestrator').handleStatusUpdate(msg.botId, msg.content || msg.payload || msg);
                    break;

                case 'CMD_Error':
                    console.error(`[Protocol] Bot Reported Error: ${JSON.stringify(msg.payload)}`);
                    break;

                default:
                    // 1. Check RPC Resolution (Synchronous Response)
                    if (type && type.endsWith('_RESPONSE')) {
                        // Attempt to resolve pending promise in THIS process (Main Thread)
                        if (rpcHelper.resolve(msg)) {
                            break; // Handled by RPC (Main Thread)
                        }
                        // If not resolved here (e.g. belongs to a Worker), ROUTE TO WORKER!
                        // SystemOrchestrator knows how to find the worker for this BotID.
                        try {
                            const systemOrchestrator = require('../../services/SystemOrchestrator');
                            systemOrchestrator.routeToWorker(msg);
                        } catch (err) {
                            console.error(`[UnifiedProtocol] Failed to route RPC Response to Worker:`, err);
                        }
                        return; // Done
                    }

                    // Unknown or Command -> Router
                    console.log("[UnifiedProtocol] 🔍 Dispatching Unknown/Request to Router:", JSON.stringify(msg, null, 2));
                    await this.dispatchToRouter(transport, msg);
                    break;
            }
        } catch (e) {
            console.error(`[UnifiedProtocol] Error: ${e.message}`, e);
        }
    }

    normalize(raw) {
        // If string, parse. If object, return.
        if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch (e) { return {}; }
        }
        return raw;
    }

    async handleRegister(transport, msg) {
        // Extract Payload
        let payload = msg.payload || msg.content || msg; // MQL5 sometimes sends content, or flat

        // JSON Parse if string (MQL5 DLL often sends serialized JSON string in content)
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                console.error(`[UnifiedBotProtocol] ❌ Failed to parse payload string: ${payload}`);
            }
        }

        console.log(`[UnifiedBotProtocol] 📝 REGISTER REQUEST: Payload=${JSON.stringify(payload)}`);

        // 1. Validate
        // V3 Support: ID might be in msg.botId (Hoisted from Header)
        const id = payload.id || msg.botId;

        if (!id) {
            console.error(`[UnifiedProtocol] ❌ Registration REJECTED: Missing 'id'. Payload:`, payload);
            throw new Error("Registration requires 'id'");
        }

        // const id = payload.id; // Redundant
        const func = payload.func || payload.function || msg.func || 'UNKNOWN'; // Support Hoisted Func
        const symbol = payload.symbol || msg.symbol || 'ALL'; // Support Hoisted Symbol

        console.log(`[UnifiedBotProtocol] ✅ REGISTERING: ${id} | ${func} | ${symbol}`);

        // 2. Register STRICTLY with Manager
        manager.register(id, func, symbol, transport, payload);

        // 3. Send ACK directly (Wrapped)
        const ackPayload = {
            header: {
                command: 'CMD_REGISTER_RESPONSE', // SPECIFIC RESPONSE COMMAND
                request_id: msg.id || 'REGISTER_ACK',
                timestamp: Math.floor(Date.now() / 1000)
            },
            payload: {
                type: 'RESPONSE',
                result: { status: 'REGISTERED', key: manager.makeKey(id, func, symbol) },
                error: null
            }
        };
        transport.send(ackPayload);

        // 4. (Optional) Legacy Router Notification? 
        // SyncManager listens to WebSocketManager 'connected' event, so we don't need to manually call SyncManager here.
        // BUT does SyncManager listen? Not yet. I need to wire that in SyncManager.js.
    }

    async dispatchToRouter(transport, msg) {
        // For non-registration messages, we might strictly not need Router if we handle everything here.
        // But for generic requests (requests from Bot to Server), Router is fine.
        // Session Lookup? Manager only has Composite Key.
        // If router expects "BotSession", we might need to fetch it.
        // But for now, just pass transport.

        // Normalize for Router (it expects 'method')
        if (!msg.method) msg.method = msg.type;

        // Context is transport for now. 
        // If Router needs Session, it needs to be updated.
        // But since we routed Register away from Router, it's mostly stateless requests.
        const context = transport;

        const result = await router.dispatch(context, msg);

        // Send ACK if needed
        if (msg.id) {
            const responsePayload = {
                header: {
                    command: 'RESPONSE',
                    request_id: msg.id,
                    timestamp: Math.floor(Date.now() / 1000)
                },
                payload: {
                    type: 'RESPONSE',
                    result: result,
                    error: null
                }
            };
            transport.send(responsePayload);
        }
    }
}

module.exports = new UnifiedBotProtocol();