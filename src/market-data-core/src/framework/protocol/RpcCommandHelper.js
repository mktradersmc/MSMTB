const EventEmitter = require('events');

/**
 * RpcCommandHelper
 * 
 * Implements the Synchronous RPC Pattern for the Bot Protocol.
 * Allows sending a command and awaiting its specific response.
 * TRANSPORT AGNOSTIC: sendFn handles the actual dispatch.
 */
class RpcCommandHelper extends EventEmitter {

    constructor() {
        super();
        // Map<requestId, { resolve, reject, timer, command, timestamp }>
        this.pendingRequests = new Map();
        // Map<requestId, { routingKey, timestamp }>
        this.contextMap = new Map();

        // Cleanup Interval (every 30s)
        setInterval(() => this.pruneContexts(), 30000);
    }

    /**
     * Registers a context for a Fire-and-Forget request.
     * Allows restoring identity from the response.
     */
    registerContext(requestId, routingKey) {
        this.contextMap.set(requestId, {
            routingKey,
            timestamp: Date.now()
        });
    }

    /**
     * Retrieves context (RoutingKey) for a given Request ID.
     */
    getContext(requestId) {
        // Check Pending Requests (RPC)
        if (this.pendingRequests.has(requestId)) {
            return this.pendingRequests.get(requestId).routingKey;
        }
        // Check Context Map (Fire-and-Forget)
        if (this.contextMap.has(requestId)) {
            return this.contextMap.get(requestId).routingKey;
        }
        return null;
    }

    pruneContexts() {
        const now = Date.now();
        const TTL = 60000; // 1 Minute Retention
        for (const [id, ctx] of this.contextMap) {
            if (now - ctx.timestamp > TTL) {
                this.contextMap.delete(id);
            }
        }
    }

    /**
     * Sends a command and waits for the response.
     * @param {string} routingKey - The destination (BotID or BotID:Func:Sym)
     * @param {string} command - The Command Name (e.g. CMD_GET_SYMBOLS)
     * @param {Object} payload - The Payload
     * @param {Function} sendFn - Function(requestId) => void. Call this to ACTUALLY send.
     * @param {number} timeoutMs - Timeout in milliseconds (default 30000)
     * @returns {Promise<Object>} - The Response Payload
     */
    async send(routingKey, command, payload, sendFn, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            // 1. Generate Request ID
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 2. Store Pending Request
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`RPC Timeout: ${command} to ${routingKey} (ID: ${requestId})`));
                }
            }, timeoutMs);

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timer,
                command,
                routingKey,
                timestamp: Date.now()
            });

            // 3. Execute Send Function (Delegated Transport)
            try {
                if (typeof sendFn !== 'function') {
                    throw new Error("RpcCommandHelper.send requires a valid sendFn callback.");
                }
                // Pass the generated RequestID to the transport so it can include it in the envelope
                sendFn(requestId);
            } catch (e) {
                clearTimeout(timer);
                this.pendingRequests.delete(requestId);
                reject(e);
            }
        });
    }

    /**
     * Resolves a pending request with an incoming response.
     * Called by UnifiedBotProtocol.
     * @param {Object} msg - The normalized message (Header + Payload)
     * @returns {boolean} - True if handled by RPC, False if not matched.
     */
    resolve(msg) {
        // msg structure: { header: { request_id, command ... }, payload: { ... }, type: ... }
        // UnifiedProtocol normalizes it. Content is usually in 'payload' or 'content'.

        const header = msg.header;
        if (!header || !header.request_id) {
            // console.warn("[RPC] ⚠️ Response missing header/request_id", msg);
            return false;
        }

        const requestId = header.request_id;
        // console.log(`[RPC] Resolving ID: ${requestId}. Pending: ${this.pendingRequests.has(requestId)}`);

        if (this.pendingRequests.has(requestId)) {
            const req = this.pendingRequests.get(requestId);

            // Clear Timeout
            clearTimeout(req.timer);
            this.pendingRequests.delete(requestId);

            // Check Status
            // MQL5 sends specific ERROR payloads sometimes.
            // Protocol says: status="ERROR" in payload implies rejection.
            const payload = msg.payload || msg.content || {}; // Access payload safely

            if (payload.status === 'ERROR') {
                req.reject(new Error(payload.message || `RPC Error for ${req.command}`));
            } else {
                req.resolve(payload);
            }
            return true; // Handled
        }
        return false; // Not Matched
    }
}

module.exports = new RpcCommandHelper();
