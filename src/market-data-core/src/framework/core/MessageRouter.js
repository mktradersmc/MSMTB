/**
 * MessageRouter
 * Typed routing system for WebSocket messages.
 * Maps methods (e.g., "Identity.Register") to Handlers.
 */
class MessageRouter {
    constructor() {
        this.handlers = new Map();
    }

    /**
     * Register a Handler for a specific method.
     * @param {string} method - e.g., "Identity.Register"
     * @param {Function} handler - async (session, payload) => result
     * @param {Object|null} schema - specific schema validator (optional)
     */
    register(method, handler, schema = null) {
        this.handlers.set(method, { handler, schema });
        console.log(`[Router] Registered Method: ${method}`);
    }

    /**
     * Dispatch an incoming message to the correct handler.
     * @param {object} session - The BotSession initiating the request
     * @param {object} envelope - The full message { id, method, payload }
     */
    async dispatch(session, envelope) {
        const route = this.handlers.get(envelope.method);

        if (!route) {
            throw new Error(`Method '${envelope.method}' not found.`);
        }

        // Schema Validation (Concept)
        if (route.schema) {
            // validate(envelope.payload, route.schema); 
        }

        try {
            // Execute Handler
            return await route.handler(session, envelope.payload);
        } catch (e) {
            console.error(`[Router] Error executing ${envelope.method}:`, e);
            throw e; // Bubble up for error response
        }
    }
}

module.exports = new MessageRouter();
