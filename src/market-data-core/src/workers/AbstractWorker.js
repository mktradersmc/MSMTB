const { parentPort, workerData } = require('worker_threads');
const LogService = require('../services/LogService');
const tzService = require('../services/TimezoneNormalizationService');

/**
 * Base class for all Market Data Workers.
 * Implements the "Stateless Routing" protocol and Handshake.
 */
class AbstractWorker {
    constructor() {
        if (!parentPort) {
            throw new Error("Worker must be spawned via worker_threads");
        }

        // MANDATORY ATTRIBUTES ENFORCEMENT
        this.symbol = workerData.symbol;
        if (!this.symbol) throw new Error("[AbstractWorker] MANDATORY Attribute 'symbol' missing!");

        this.botId = workerData.botId;
        this.botFunc = workerData.func; // New strict prop
        this.features = workerData.features || {}; // Ingest Features (Task: Global Debug)
        this.payload = workerData.payload || {}; // Initial Payload

        if (!this.botId || !this.botFunc || this.botId === 'unknown') {
            throw new Error(`[AbstractWorker] Missing Critical Identity Params: ${this.botId}:${this.botFunc}`);
        }

        // Initialize Timezone for this specific thread
        if (workerData.timezone) {
            tzService.registerBotTimezone(this.botId, workerData.timezone);
        }

        // State
        this.isConnected = true; // Spawned = Connected

        // Bind IPC
        parentPort.on('message', (msg) => this._handleMessage(msg));

        // Immediate Start
        this._log(`[Init] 🚀 Worker Spawned for ${this.botId}:${this.botFunc}:${this.symbol}`);

        // Trigger Subclass Init immediately (Microtask to ensure constructor finishes)
        setImmediate(() => {
            this.onBotConnected({
                botId: this.botId,
                func: this.botFunc,
                symbol: this.symbol
            });
        });
    }

    _handleMessage(msg) {
        // console.log(`[AbstractWorker] 📨 IPC Message: ${msg.type}`);
        try {
            switch (msg.type) {
                // System Lifecycle
                case 'CMD_BOT_CONNECTED':
                    this._log(`[State] 🟢 CMD_BOT_CONNECTED Received! Calling onBotConnected...`);
                    this.isConnected = true;
                    if (msg.botId) this.botId = msg.botId;

                    // Update Timezone if provided
                    if (msg.timezone) {
                        tzService.registerBotTimezone(this.botId, msg.timezone);
                    }

                    this._log(`[State] 🟢 Bot Connected (Re-attach): ${this.botId}`);
                    this.onBotConnected(msg); // Triggers Gap Check in Subclasses
                    break;

                case 'CMD_BOT_DISCONNECTED':
                    this.isConnected = false;
                    this._log(`[State] ❌ Bot Disconnected: ${msg.botId}`);
                    this.onBotDisconnected();
                    break;

                case 'CMD_SHUTDOWN':
                    this.onShutdown();
                    process.exit(0);
                    break;

                // Data Flow
                case 'TICK_DATA':
                    this.onStreamData(msg.content);
                    break;

                case 'COMMAND': // Generic Command Wrapper
                case 'INIT':    // Config
                default:
                    // 1. Try to Resolve Pending RPC (Worker-Initiated)
                    const rpcHelper = require('../framework/protocol/RpcCommandHelper');
                    if (rpcHelper.resolve(msg)) {
                        return; // Handled by Promise
                    }

                    // 2. Delegate to Subclass
                    this.onCommand(msg);
                    break;
            }
        } catch (e) {
            this._error(`Message Handling Error: ${e.message}`);
        }
    }

    // --- PROTECTED: API FOR SUBCLASSES ---

    /**
     * Send a command to the Bot (routed by Orchestrator).
     * @param {string} type - Command Type (e.g., 'CMD_FETCH_HISTORY')
     * @param {object} payload - Command Content
     */
    /**
     * Send a command to the Bot (routed by Orchestrator).
     * @param {string} type - Command Type (e.g., 'CMD_FETCH_HISTORY')
     * @param {object} payload - Command Content
     * @param {string|null} requestId - Optional RPC Request ID
     */
    sendCommand(type, payload, requestId = null) {
        // Wrap in 'COMMAND' envelope for Orchestrator
        // STRICT: Full Identity in Content for Routing!
        parentPort.postMessage({
            type: 'COMMAND',
            command: type, // The Command Name (e.g. CMD_FETCH_HISTORY)
            content: payload, // The Raw Payload
            requestId: requestId, // RPC Propagation
            botId: this.botId, // STRICT: Worker Identity for Routing
            func: this.botFunc, // STRICT: Function Context
            symbol: this.symbol // STRICT: Symbol Context
        });
    }

    /**
     * Sends a Synchronous RPC Command to the Bot.
     * Automatically handles Request ID generation and Identity Injection.
     * @param {string} command - Command Name
     * @param {object} payload - Payload
     * @param {number} timeoutMs - Timeout (Default 30s)
     * @returns {Promise<object>} Response Payload
     */
    async sendRpc(command, payload, timeoutMs = 30000) {
        const rpcHelper = require('../framework/protocol/RpcCommandHelper');
        const routingKey = `${this.botId}:${this.botFunc}:${this.symbol}`;

        return rpcHelper.send(
            routingKey,
            command,
            payload,
            (reqId) => {
                this.sendCommand(command, payload, reqId);
            },
            timeoutMs
        );
    }

    /**
     * Send a direct message to Orchestrator (not Bot).
     * @param {string} type 
     * @param {object} payload 
     */
    sendToHub(type, data) {
        parentPort.postMessage({
            type: type,
            payload: data // WRAPS (Strict Spec Compliance)
        });
    }

    log(msg) {
        this._log(msg);
    }

    error(msg) {
        this._error(msg);
    }

    isOnline() {
        return this.isConnected;
    }

    // --- INTERNAL LOGGING (Standardized) ---
    _log(msg) {
        // Task: Send structured log for Orchestrator to format
        parentPort.postMessage({
            type: 'LOG',
            content: msg,
            timestamp: LogService.getTimestamp()
        });
    }

    _error(msg) {
        parentPort.postMessage({
            type: 'ERROR',
            content: msg,
            timestamp: LogService.getTimestamp()
        });
    }


    // --- ABSTRACT METHODS (To be overridden) ---

    /**
     * Called when Bot connection is established/restored.
     * Trigger Sync or Queue processing here.
     */
    onBotConnected(info) { }

    /**
     * Called when Bot connection is lost.
     * Pause processing/queues here.
     */
    onBotDisconnected() { }

    /**
     * Handle non-stream commands (Config, Init, Custom).
     */
    onCommand(msg) { }

    /**
     * Handle High-Frequency Stream Data (Ticks).
     */
    onStreamData(data) { }

    onShutdown() { }
}

module.exports = AbstractWorker;
