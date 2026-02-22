
// 0. Init Forensic Logger (Must be first)
require('./src/utils/Logger');

const config = require('./src/config');
// REPLACED: SyncManager/PipeServer with SystemOrchestrator
const systemOrchestrator = require('./src/services/SystemOrchestrator');
const socketServer = require('./src/services/SocketServer');
const webSocketGateway = require('./src/framework/transport/WebSocketGateway');

console.log("Starting market-data-core...");

// 1. Start Services
// SystemOrchestrator manages workers and state

// SocketServer (Frontend)
socketServer.start();

// WebSocketGateway (Bots - Port 3000)
webSocketGateway.start();

// 2. Link Services
// Ensure SystemOrchestrator can talk to Frontend and handling routing
const initRoutes = require('./src/framework/init_routes');
initRoutes(socketServer, systemOrchestrator);

// Late Binding to avoid circular dependency if needed, or just set it
// Late Binding to avoid circular dependency if needed, or just set it
console.log(`[Index] Linking SocketServer to SystemOrchestrator... Has Method: ${typeof systemOrchestrator.setSocketServer}`);
console.log(`[Index] SystemOrchestrator Instance ID: ${systemOrchestrator._instanceId}`);
if (systemOrchestrator.setSocketServer) {
    try {
        systemOrchestrator.setSocketServer(socketServer);
        console.log("[Index] Link Call Complete.");
    } catch (e) {
        console.error("[Index] Link Call Failed:", e);
    }
} else {
    console.error("[Index] CRITICAL: setSocketServer method MISSING on SystemOrchestrator instance!");
}

// Global reference for debugging
SystemOrchestrator = systemOrchestrator;

console.log("MarketDataCore Services initialized.");
