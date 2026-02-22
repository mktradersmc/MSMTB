const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * BotRegistry
 * Central Hub for managing active Bot Sessions.
 * Emits events: 'bot.connected', 'bot.disconnected'
 */
class BotRegistry extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map(); // Map<botId, BotSession>
        this.socketMap = new Map(); // Map<socketId, botId>
    }

    /**
     * Registers a new Bot connection.
     * @param {string} botId - Unique Identity (e.g. RoboForex_123)
     * @param {object} properties - Metadata (Role, Symbol, etc.)
     * @param {object} transport - The WebSocket/Transport wrapper
     */
    register(botId, properties, transport) {
        // 1. Check for existing session (and kill it if needed)
        if (this.sessions.has(botId)) {
            console.log(`[Registry] ⚠️ Duplicate BotID ${botId}. Terminating old session.`);
            const oldSession = this.sessions.get(botId);
            oldSession.disconnect("Replaced by new connection");
        }

        // 2. Create Session
        const session = new BotSession(botId, properties, transport);

        // 3. Store
        this.sessions.set(botId, session);
        this.socketMap.set(transport.id, botId);

        console.log(`[Registry] ✅ Registered Bot: ${botId} (Role: ${properties.ROLE || 'Unknown'})`);

        // 4. Emit Hook
        this.emit('bot.connected', session);

        return session;
    }

    /**
     * Called when a transport disconnects
     */
    unregister(transportId) {
        const botId = this.socketMap.get(transportId);
        if (botId) {
            const session = this.sessions.get(botId);
            if (session) {
                console.log(`[Registry] ❌ Bot Disconnected: ${botId}`);
                this.emit('bot.disconnected', session);
                this.sessions.delete(botId);
            }
            this.socketMap.delete(transportId);
        }
    }

    get(botId) {
        return this.sessions.get(botId);
    }
}

/**
 * BotSession
 * Represents a live connection to a Bot.
 */
class BotSession {
    constructor(id, properties, transport) {
        this.id = id;
        this.properties = properties;
        this.transport = transport; // Wrapper with .send(), .close()
        this.connectedAt = Date.now();
    }

    /**
     * Send a Fire-and-Forget Notification
     */
    notify(method, payload) {
        this.transport.send({
            type: 'EVENT',
            method: method,
            payload: payload
        });
    }

    /**
     * Call a method on the Bot and wait for Result (RPC)
     */
    async call(method, payload, timeout = 5000) {
        return this.transport.request(method, payload, timeout);
    }

    disconnect(reason) {
        this.transport.close(reason);
    }
}

module.exports = new BotRegistry(); // Singleton
