const EventEmitter = require('events');

/**
 * WebSocketManager
 * 
 * Strict Registry for WebSocket Connections.
 * PRIMARY KEY: routingKey = BotId:Function:Symbol
 * 
 * "ALLE weitere namen für diese keys und lookup versuche wie specificId, compositeKey, connectionId müssen entfernt werden."
 */
class WebSocketManager extends EventEmitter {
    constructor() {
        super();
        this.instanceId = Math.random().toString(36).substring(7);
        console.log(`[WebSocketManager] 🆕 Instance Created: ${this.instanceId}`);

        // Primary Storage: routingKey -> Socket
        this.sockets = new Map();

        // Metadata: routingKey -> { id, func, symbol, registeredAt, ... }
        this.metadata = new Map();

        // Reverse Lookup: TransportID (Socket.id) -> routingKey
        // Needed for clean disconnection
        this.transportMap = new Map();
    }

    /**
     * Registers a socket with strictly defined identity.
     * @param {string} id - Bot ID
     * @param {string} func - Function (TRADING, HISTORY, TICK_SPY, DATAFEED)
     * @param {string} symbol - Symbol (or "ALL")
     * @param {Object} socket - The WebSocket connection
     * @returns {string} The routingKey
     */
    register(id, func, symbol, socket, payload = {}) {
        if (!id || !func || !symbol) {
            throw new Error(`[WebSocketManager] Registration requires ID, Func, and Symbol. Got: ${id}, ${func}, ${symbol}`);
        }

        const routingKey = this.makeKey(id, func, symbol);
        const transportId = socket.id || 'unknown';

        // 1. Cleanup Old (Collision) - If this specific KEY is already registered
        if (this.sockets.has(routingKey)) {
            const oldSocket = this.sockets.get(routingKey);
            if (oldSocket !== socket) {
                console.log(`[WebSocketManager] ⚠️ Replacing existing socket for ${routingKey}`);
                // Optional: Close old?
            }
        }

        // 2. Store
        this.sockets.set(routingKey, socket);
        // Include payload in metadata for later retrieval
        this.metadata.set(routingKey, { id, func, symbol, routingKey, registeredAt: Date.now(), payload });

        // MULTIPLEXING PATCH: Support multiple keys per transport
        if (!this.transportMap.has(transportId)) {
            this.transportMap.set(transportId, new Set());
        }
        this.transportMap.get(transportId).add(routingKey);

        console.log(`[WebSocketManager] 🔑 REGISTERED: ${routingKey} (Transport: ${transportId})`);

        // 3. Emit Event - Include Payload
        this.emit('connected', { routingKey, id, func, symbol, socket, payload });

        return routingKey;
    }

    /**
     * Unregisters a socket by Transport ID (called on close)
     */
    unregister(transportId) {
        const routingKeys = this.transportMap.get(transportId);

        if (routingKeys && routingKeys.size > 0) {
            console.log(`[WebSocketManager] ❌ Unregistering Transport ${transportId} (${routingKeys.size} keys)`);

            // Iterate all associated keys
            for (const routingKey of routingKeys) {
                console.log(`[WebSocketManager]    - Removing: ${routingKey}`);
                this.sockets.delete(routingKey);
                this.metadata.delete(routingKey);

                // Notify for each
                this.emit('disconnected', { routingKey });
            }

            // Cleanup map
            this.transportMap.delete(transportId);
        }
    }

    /**
     * Updates activity timestamp for a connection (Liveness).
     */
    touch(transportId) {
        const routingKeys = this.transportMap.get(transportId);
        if (routingKeys) {
            for (const routingKey of routingKeys) {
                const meta = this.metadata.get(routingKey);
                if (meta) {
                    this.emit('activity', { routingKey, ...meta, timestamp: Date.now() });
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Retrieval by Routing Key (Strict)
     */
    getSocket(routingKey) {
        const socket = this.sockets.get(routingKey);
        if (!socket) {
            // console.warn(`[WebSocketManager] ⚠️ Socket NOT FOUND for: ${routingKey}`);
        }
        return socket;
    }

    /**
     * Helper: Generate Strict Key
     * Format: BotId:Function:Symbol
     */
    makeKey(id, func, symbol) {
        return `${id}:${func}:${symbol}`;
    }

    /**
     * Broadcast
     */
    broadcast(payload) {
        const msg = JSON.stringify(payload);
        for (const socket of this.sockets.values()) {
            if (socket.readyState === 1) socket.send(msg);
        }
    }

    /**
     * Helper: Get Transport ID from Routing Key 
     * (Used by SystemOrchestrator for Heartbeat Checks)
     */
    getTransportIdByKey(routingKey) {
        const socket = this.sockets.get(routingKey);
        return socket ? socket.id : null;
    }

    /**
     * Force Close a Transport
     */
    close(transportId) {
        console.log(`[WebSocketManager] 🔌 Force Closing Transport ${transportId}`);
        const routingKeys = this.transportMap.get(transportId);
        if (routingKeys && routingKeys.size > 0) {
            const firstKey = routingKeys.values().next().value;
            const socket = this.sockets.get(firstKey);
            if (socket) {
                try { socket.terminate(); } catch (e) { }
            }
        }
    }
}

module.exports = new WebSocketManager();

