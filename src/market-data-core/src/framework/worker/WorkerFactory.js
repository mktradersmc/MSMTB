const { Worker } = require('worker_threads');
const path = require('path');

/**
 * WorkerFactory
 * 
 * Centralized factory for creating Worker threads.
 * Encapsulates:
 * - Script Path Resolution
 * - WorkerData Standardization (Strict Identity)
 * - Error Handling Configuration (Optional)
 */
class WorkerFactory {
    constructor(baseDir) {
        this.baseDir = baseDir || path.resolve(__dirname, '../../../'); // Default to src/market-data-core/src/
    }

    /**
     * Creates a new Worker based on strict identity parameters.
     * @param {string} botId - The Logical Bot ID (e.g. "RoboForex_123")
     * @param {string} func - Function Type (TICK_SPY, DATAFEED, TRADING, HISTORY)
     * @param {string} symbol - Symbol (e.g. "EURUSD" or "ALL")
     * @param {string} routingKey - The Routing Key (BotId:Func:Symbol)
     * @returns {Worker} The instantiated Worker thread
     */
    createWorker(botId, func, symbol, routingKey, features = {}) {
        if (!botId || !func || !symbol || !routingKey) {
            throw new Error(`[WorkerFactory] ❌ Missing required parameters: botId=${botId}, func=${func}, symbol=${symbol}, routingKey=${routingKey}`);
        }

        const scriptPath = this.resolveScriptPath(func);
        const workerData = this.buildWorkerData(botId, func, symbol, routingKey, features);

        console.log(`[WorkerFactory] 🏭 Creating ${func} for ${routingKey} (Script: ${path.basename(scriptPath)})`);

        return new Worker(scriptPath, {
            workerData: workerData
        });
    }

    resolveScriptPath(func) {
        // Relative to baseDir (src/market-data-core/src/)
        // Scripts are in workers/
        let scriptName = '';

        switch (func) {
            case 'TICK_SPY':
                scriptName = 'workers/SymbolWorker.js';
                break;
            case 'DATAFEED':
                scriptName = 'workers/DatafeedWorker.js';
                break;
            case 'TRADING':
                scriptName = 'workers/TradeWorker.js';
                break;
            case 'HISTORY':
                scriptName = 'workers/HistoryWorker.js';
                break;
            case 'DISCOVERY':
                scriptName = 'workers/NT8DiscoveryWorker.js';
                break;
            default:
                throw new Error(`[WorkerFactory] ❌ Unknown Worker Function: ${func}`);
        }

        return path.join(this.baseDir, scriptName);
    }

    buildWorkerData(botId, func, symbol, routingKey, features = {}) {
        return {
            botId: botId,          // Strict: Logical ID
            func: func,            // Strict: Function Type
            symbol: symbol,        // Strict: Symbol or "ALL" (passed explicitly)
            routingKey: routingKey,// Strict: Routing Key for IPC
            connectionId: routingKey,// Compatibility: Legacy scripts might still use 'connectionId'
            features: features     // Ingest Features (Task: Global Debug)
        };
    }
}

module.exports = new WorkerFactory(path.resolve(__dirname, '../../')); // Export singleton with correct root
