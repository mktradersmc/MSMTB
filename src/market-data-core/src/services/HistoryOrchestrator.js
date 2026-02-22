const logService = require('./LogService');

/**
 * HistoryOrchestrator (V7.0 Adapter)
 * Delegates all logic to SymbolWorker via PipeServer.
 * Maintains method signatures for SyncManager compatibility.
 */
class HistoryOrchestrator {
    constructor(systemOrchestrator) {
        this.systemOrchestrator = systemOrchestrator;
    }

    /**
     * V7.0: Worker Auto-Starts ATRS. No-op.
     */
    initializeATRS(symbol) {
        // SymbolWorker starts ATRS loop automatically on connection.
        // console.log(`[HistoryOrchestrator] ATRS Init delegated to Worker for ${symbol}`);
    }

    /**
     * Boost Priority in Worker Queue
     */
    prioritize(symbol, tf) {
        if (this.syncManager.pipeServer) {
            // FIX: Use correct Routing Key (HistoryWorker usually on TICK_SPY or HISTORY function?)
            // Actually, HistoryWorker is internal.
            // But we need to know the specific worker instance.
            // If HistoryWorker is separate, it might be spawned with a specific key.
            // Assuming TICK_SPY for now as per current architecture where TickSpy handles history via Pipe?
            // Wait, HistoryWorker.js (viewed previously) is a Worker Thread.
            // SystemOrchestrator doesn't seem to spawn HistoryWorker directly via BotId?
            // Let's use resolveBotId to find the active bot, then construct key.

            const botId = this.systemOrchestrator.resolveBotId(symbol);
            if (botId) {
                // Which function? TICK_SPY? 
                const routingKey = `BotID:TICK_SPY:${symbol}`; // Placeholder? 
                // Better: Ask SystemOrchestrator?
                // Actually, let's use the new `getWorkerKey` if it exists, or manually construct.
                // For now, let's assume TICK_SPY as that's what TickSpy.mq5 registers as.
                const key = this.systemOrchestrator.getRoutingKey(botId, 'TICK_SPY', symbol);

                if (key) {
                    this.systemOrchestrator.sendToWorker(key, 'CMD_PRIORITY_BOOST', { timeframe: tf });
                    console.log(`[HistoryOrchestrator] Sending CMD_PRIORITY_BOOST for ${symbol} ${tf} to ${key}`);
                }
            }
        }
    }

    addTask(symbol, tf, task) {
        // Task 0215: History in Separate Thread
        // Route to HistoryWorker via PipeServer
        if (this.syncManager.pipeServer) {

            // Logic: Distinguish between DEEP backfill (Infinite/Calc) and Standard RANGE (100 candles)
            // Use task.type or infer from params.
            // My recent fix sends type='FETCH' via scheduleHistoryRequest.

            if (task.type === 'FETCH' || task.type === 'RANGE' || task.type === 'FAST' || task.type === 'GAP_FILL') {
                const botId = task.botId || this.systemOrchestrator.resolveBotId(symbol);
                if (!botId) {
                    console.warn(`[HistoryOrchestrator] ⚠️ No BotID for ${symbol}. Cannot fetch history.`);
                    return;
                }

                console.log(`[HistoryOrchestrator] Sending CMD_HISTORY_RANGE for ${symbol} ${tf} to Bot ${botId}`);

                // Route via DatafeedWorker (Expert)
                // Route via DatafeedWorker (Expert)
                /* DISABLE LEGACY INTERFERENCE (Task 3585)
                this.systemOrchestrator.sendCommand({
                    type: 'CMD_FETCH_HISTORY', // Match MQL5 Handler Name (DatafeedServices)
                    symbol: symbol,
                    timeframe: tf,
                    from: task.from || 0,
                    to: task.to || 0,
                    count: task.count || 100,
                    botId: botId
                });
                */
                console.log(`[HistoryOrchestrator] 🛑 Legacy CMD_FETCH_HISTORY Disabled. Relying on SymbolWorker <-> TickSpy UBC Protocol for ${symbol} ${tf}`);
            } else {
                // Default to Deep Backfill
                // Also route to Expert? Or is Backfill special?
                // MQL5 supports CMD_FETCH_HISTORY with specific params.
                // deep backfill usually just means "Fetch a lot".
                const botId = task.botId || this.systemOrchestrator.resolveBotId(symbol);
                console.log(`[HistoryOrchestrator] Sending CMD_DEEP_BACKFILL for ${symbol} ${tf} to Bot ${botId}`);

                /* DISABLE LEGACY INTERFERENCE (Task 3585 - Part 2)
                this.systemOrchestrator.sendCommand({
                    type: 'CMD_FETCH_HISTORY', // Reuse same command, different params?
                    symbol: symbol,
                    timeframe: tf,
                    from: 0,
                    to: 0,
                    count: 5000, // Deep limit
                    action: 'DEEP',
                    botId: botId
                });
                */
                console.log(`[HistoryOrchestrator] 🛑 Legacy CMD_DEEP_BACKFILL Disabled. Relying on SymbolWorker <-> TickSpy UBC Protocol for ${symbol} ${tf}`);
            }
        }
    }

    // --- Legacy / Unused in V7.0 (Worker handles DB & State) ---
    onBatchProcessed(symbol, timeframe, count, maxTimestamp) { }
    onEndOfData(symbol, timeframe) { }
}

module.exports = HistoryOrchestrator;
