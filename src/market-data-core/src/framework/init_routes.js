const router = require('./core/MessageRouter');
const registry = require('./registry/BotRegistry');
const systemOrchestrator = require('../services/SystemOrchestrator');
const wsManager = require('./transport/WebSocketManager');

module.exports = function initRoutes() {
    console.log("[Framework] One-Time Route Initialization...");

    // NOTE: All Routes are now handled by UnifiedBotProtocol.js ("Fast Lane")
    // MessageRouter ("Slow Lane") is currently empty or reserved for non-critical HTTP-like requests.

    console.log("[Framework] Routes initialized (Empty - Protocol handled by UnifiedBotProtocol)");
};
