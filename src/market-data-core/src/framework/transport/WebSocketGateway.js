const WebSocket = require('ws');
const registry = require('../registry/BotRegistry');
const protocol = require('../protocol/UnifiedBotProtocol');
const { v4: uuidv4 } = require('uuid');

class WebSocketGateway {
    constructor(port = 3000) {
        this.port = port;
        this.wss = null;
        this.interval = null;
    }

    start() {
        this.wss = new WebSocket.Server({ port: this.port });
        console.log(`[Gateway] WebSocket Server started on port ${this.port}`);

        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });

        // TRANSPORT LIVENESS: Global Ping Loop (Every 30s)
        // Detects broken pipes/cables that didn't trigger TCP FIN
        this.interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    // Dead Peer Detected
                    console.log(`[Gateway] 💀 Dead Peer Detected. Terminating ${ws.id || 'Unknown'}`);
                    return ws.terminate();
                }

                ws.isAlive = false; // Mark dead, expect Pong to revive
                ws.ping(); // Send Ping
            });
        }, 30000); // 30s
    }

    handleConnection(ws) {
        const transportId = uuidv4();
        ws.id = transportId;
        ws.isAlive = true; // Connection started alive

        console.log(`[Gateway] New Connection: ${transportId}`);

        // Handle Pong (Liveness)
        ws.on('pong', () => {
            ws.isAlive = true; // Revived
            // Notify Manager of Activity
            const manager = require('./WebSocketManager');
            manager.touch(transportId);
        });

        // wrapper for Registry/Protocol
        const transport = {
            id: transportId,
            // Expose readyState for PipeServer/Manager checks
            get readyState() { return ws.readyState; },
            send: (msg) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
                    ws.send(payload);
                }
            },
            close: (reason) => ws.close(1000, reason)
        };

        ws.on('message', async (message) => {
            // Activity on Message
            const manager = require('./WebSocketManager');
            manager.touch(transportId);

            try {
                let jsonStr = "";
                let binaryBlob = null;

                // MQL5 V3 Binary Protocol Check
                if (Buffer.isBuffer(message)) {
                    // Packet struct: [4 byte JSON Length (Little Endian)][JSON Bytes][Binary Bytes]
                    if (message.length >= 4) {
                        const jsonLen = message.readUInt32LE(0);
                        
                        // Sanity check: ensure buffer actually contains the full JSON string
                        if (message.length >= 4 + jsonLen) {
                            jsonStr = message.toString('utf8', 4, 4 + jsonLen);
                            
                            // Extract remaining bytes as Binary Blob
                            if (message.length > 4 + jsonLen) {
                                binaryBlob = message.slice(4 + jsonLen);
                            }
                        } else {
                            throw new Error(`Invalid Binary Frame: Buffer length ${message.length} too small for JSON length ${jsonLen}`);
                        }
                    } else {
                        // Very small buffer? Fallback to string
                        jsonStr = message.toString();
                    }
                } else {
                    // Plain Text Frame (e.g. from tests or old bots)
                    jsonStr = message.toString();
                }

                // DELEGATE TO UNIFIED PROTOCOL (The Brain)
                // Passing the extracted binaryBlob as a 3rd parameter
                await protocol.handle(transport, jsonStr, binaryBlob);

            } catch (e) {
                console.error(`[Gateway] Error processing message:`, e.message);
            }
        });

        ws.on('close', () => {
            // Unregister from Strict Registry (WebSocketManager)
            const manager = require('./WebSocketManager');
            manager.unregister(transportId);

            // Unregister from Legacy Registry (for backward compat if needed)
            registry.unregister(transportId);
        });

        ws.on('error', (e) => {
            console.error(`[Gateway] Socket Error: ${e.message}`);
        });
    }
}

module.exports = new WebSocketGateway();

