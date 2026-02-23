const systemOrchestrator = require('./SystemOrchestrator');
const db = require('./DatabaseService');

class TradeDistributionService {
    constructor() {
        this.config = {};
        this.state = {}; // { "BROKER_ID": { sequence: 1 } }
        this.lastBotTimestamp = {}; // { "BOT_ID": timestamp } (Monotonicity Guard)
        this.loadConfig();
        this.loadState();
    }

    loadConfig() {
        try {
            this.config = db.getDistributionConfig();
            console.log(`[TradeDist] Loaded Config from DB: ${Object.keys(this.config.brokers || {}).length} brokers configured.`);
        } catch (e) {
            console.error("[TradeDist] Config Load Error:", e);
            this.config = {};
        }
    }

    loadState() {
        try {
            this.state = db.getDistributionState();
        } catch (e) {
            console.error("[TradeDist] State Load Error:", e);
        }
    }

    saveState() {
        try {
            // Persist state for each broker
            Object.entries(this.state).forEach(([brokerId, state]) => {
                db.saveDistributionState(brokerId, state.sequence);
            });
        } catch (e) {
            console.error("[TradeDist] State Save Error:", e);
        }
    }

    getConfig() {
        return this.config;
    }

    saveConfig(newConfig) {
        try {
            this.config = newConfig;
            const success = db.saveDistributionConfig(newConfig);
            if (success) console.log("[TradeDist] Config saved successfully to DB.");
            return success;
        } catch (e) {
            console.error("[TradeDist] Config Save Error:", e);
            return false;
        }
    }

    /**
     * Main Entry Point
     * @param {Object} trade - The trade definition (entry, sl, tp, anchors...)
     * @param {Array} accounts - List of { botId, brokerId, accountId ... }
     */
    executeTrade(trade, accounts) {
        if (!accounts || accounts.length === 0) {
            console.warn("[TradeDist] No accounts provided for execution.");
            return { success: false, message: "No active accounts." };
        }

        // 1. Group by Broker
        const brokerGroups = {};
        let allOffline = true; // Track aggregate status

        accounts.forEach(acc => {
            if (!acc.brokerId || !acc.botId) return; // Skip invalid
            if (!brokerGroups[acc.brokerId]) brokerGroups[acc.brokerId] = [];
            brokerGroups[acc.brokerId].push(acc);
        });

        const results = [];

        // 2. Process each Broker
        for (const [brokerId, brokerAccounts] of Object.entries(brokerGroups)) {
            const brokersConfig = (this.config.brokers || {})[brokerId] || {};

            // Get Matrix or Default Logic
            // Default: Round Robin if multiple accounts, Copy All if configured so?
            // "Round Robin" is implied by the Matrix 1, 2, 3...

            // A. Get/Init Sequence
            if (!this.state[brokerId]) this.state[brokerId] = { sequence: 0 };

            // Detect Loop Size (Default to number of accounts if not config)
            const loopSize = brokersConfig.loop_size || brokerAccounts.length || 1;

            // Increment Sequence
            // Seq goes 1..LoopSize
            let currentSeq = (this.state[brokerId].sequence % loopSize) + 1;
            this.state[brokerId].sequence = currentSeq;

            console.log(`[TradeDist] Broker ${brokerId}: Sequence ${currentSeq} / ${loopSize}`);

            // B. Determine Target Accounts
            let targets = [];

            if (brokersConfig.matrix) {
                // Matrix Mode: Explicit List of Account IDs
                // If a step is unconfigured or empty, no trades are sent for safety.
                const targetIds = brokersConfig.matrix[currentSeq] || [];
                targets = brokerAccounts.filter(a => targetIds.includes(a.id) || targetIds.includes(a.botId));
            } else {
                // Default Mode: Round Robin based on Index
                // Only used if NO matrix is defined at all for this broker.
                const index = (currentSeq - 1) % brokerAccounts.length;

                // Stable sort by ID for consistent round-robin
                brokerAccounts.sort((a, b) => a.id.localeCompare(b.id));

                if (brokersConfig.mode === 'COPY_ALL') {
                    targets = brokerAccounts;
                } else {
                    targets = [brokerAccounts[index]];
                }
            }

            // C. Send Commands
            targets.forEach(acc => {
                // Determine Environment
                const env = acc.environment || trade.environment || 'test';

                // Check Bot Status (Offline Handling)
                let initialStatus = 'OFFLINE';
                const botState = systemOrchestrator.botStatus[acc.botId];
                if (botState && botState.connected) {
                    initialStatus = 'SENT';
                }

                // Prepare Execution Record
                const execution = {
                    id: `${trade.id}_${acc.botId}`,
                    masterTradeId: trade.id, // Ensure naming matches
                    masterId: trade.id,      // Alias for robustness
                    botId: acc.botId,
                    brokerId: brokerId,
                    accountId: acc.accountId,
                    status: initialStatus,
                    magic: this.state[brokerId].sequence,
                    environment: env
                };

                // DATA-FIRST Persistence
                try {
                    const db = require('./DatabaseService'); // Singleton
                    // Use correct method 'createBrokerExecution'
                    db.createBrokerExecution(execution);
                } catch (e) { console.error("[TradeDist] Persistence Error:", e); }

                // Only send to Pipe if CONNECTED
                if (initialStatus !== 'OFFLINE') {
                    const payload = {
                        action: 'EXECUTE',
                        id: trade.id, // Master ID
                        symbol: trade.symbol,
                        cmd: trade.direction === 'BUY' ? 0 : 1, // 0=Buy, 1=Sell
                        vol: trade.volume || 0.01,
                        sl: trade.sl || 0,
                        tp: trade.tp || 0,
                        magic: execution.magic,
                        comment: "Auto-Trade"
                    };
                    systemOrchestrator.sendCommand(acc.botId, payload);
                    allOffline = false; // At least one was sent
                } else {
                    console.log(`[TradeDist] Bot ${acc.botId} OFFLINE. Trade ${trade.id} queued as OFFLINE.`);
                }
            }); // End targets.forEach
        } // End brokerGroups loop

        // Update Master Trade Status based on Aggregate
        try {
            const db = require('./DatabaseService');
            // User Req: If all executions are OFFLINE or CLOSED, parent MUST be CLOSED.
            // We check if at least one execution is 'SENT' or 'RUNNING' (or just !OFFLINE/CLOSED).
            // allOffline flag only tracks SENT vs OFFLINE.
            // But we might have other statuses in future.

            // Re-calculate effective status from results? 
            // Currently results only has { botId, status }.
            // If any result is SENT -> RUNNING.
            // If ALL results are OFFLINE/BLOCKED -> CLOSED.

            const hasRunning = results.some(r => r.status === 'SENT' || r.status === 'RUNNING');
            const finalStatus = hasRunning ? 'RUNNING' : 'CLOSED';

            db.updateMasterTradeStatus(trade.id, finalStatus);
            console.log(`[TradeDist] Master Trade ${trade.id} status updated to ${finalStatus} (HasRunning=${hasRunning})`);
        } catch (e) { console.error("[TradeDist] Failed to update Master Status", e); }

        this.saveState();
        return { success: true, results };
    }

    /**
     * Direct Batch Execution (Frontend Logic Relay)
     * @param {Object} trade 
     * @param {Array} accounts - Array of full account objects { botId, ... }
     */
    executeBatch(trade, accounts) {
        if (!accounts || accounts.length === 0) return { success: false, message: "No accounts in batch" };

        console.log(`[TradeDist] executeBatch received ${accounts.length} accounts.Sample: `, JSON.stringify(accounts[0] || {}));

        // PERSISTENCE (Step 1 of User Request)
        const db = require('./DatabaseService');
        // REF-0189: Use Numeric ID for Magic Number compatibility
        let tradeId = trade.id || `${Date.now()}`;

        // GENERIC MAGIC NUMBER GENERATION - STRICT ALIGNMENT WITH USER REQUEST
        // User: "TradeID = MagicNumber". TradeID IS the source of truth.
        // We assume trade.id is numeric strings (e.g. "1738291...") from Frontend.
        let magic = 0;
        if (trade.id && !isNaN(trade.id)) {
            magic = Number(trade.id);
            tradeId = trade.id.toString(); // Ensure string
            console.log(`[TradeDist] ✅ ID PRESERVED: ${tradeId} (Magic=${magic})`);
        } else {
            // Fallback only if absolutely necessary
            magic = Date.now();
            tradeId = magic.toString();
            console.log(`[TradeDist] 🔄 STRICT ID REASSIGNMENT: Original=${trade.id} -> New=${tradeId} (Magic=${magic})`);
        }

        // Ensure ID and Magic are on the trade object
        trade.id = tradeId;
        trade.magic = magic; // Will be stored in 'params' JSON by DatabaseService

        const dbResult = db.createTrade({
            ...trade,
            id: tradeId,
            status: 'PENDING'
        });

        if (!dbResult) {
            console.error(`[TradeDist] FAILED to persist trade ${tradeId} to DB.Aborting distribution.`);
            return { success: false, message: "Database Persistence Failed" };
        }
        console.log(`[TradeDist] Persisted Trade ${tradeId} to DB(Pending).Distributing...`);

        const results = [];

        // MIXED MODE SAFETY CHECK: Prevent executing batches containing both Live and Test accounts
        const hasLive = accounts.some(a => !a.isTest);
        const hasTest = accounts.some(a => a.isTest);
        if (hasLive && hasTest) {
            console.error(`[TradeDist] FATAL: Mixed Live and Test accounts in the same execution batch. Aborting.`);
            return { success: false, message: "Security Block: Mixed Live and Test accounts detected" };
        }

        accounts.forEach(acc => {
            // SECONDARY SAFETY CHECK: Prevent sending trades to DATAFEED accounts
            if (acc.accountType === 'DATAFEED' || acc.isDatafeed || (acc.botId && acc.botId.includes('DATAFEED'))) {
                console.error(`[TradeDist] BLOCKED execution for DATAFEED account: ${acc.login} (${acc.botId})`);
                results.push({ botId: acc.botId, status: 'BLOCKED_DATAFEED' });
                return;
            }

            if (acc.botId) {
                // Check Offline Status (Use Centralized Logic)
                // STRICT: Trade Execution always requires TRADING:ALL capability
                const routingKey = `${acc.botId.trim()}:TRADING:ALL`;
                // PROBE LOG
                console.log(`[TradeDist] 🔍 Checking isBotOnline('${routingKey}')...`);
                const isOnline = systemOrchestrator.isBotOnline(routingKey);
                console.log(`[TradeDist] 🔍 Result for '${routingKey}': ${isOnline}`);
                let executionStatus = 'OFFLINE';

                // Tunnel via Worker if Online
                if (isOnline) {
                    executionStatus = 'DISPATCHED'; // Dispatched to Worker

                    db.createBrokerExecution({
                        id: `${tradeId}_${acc.botId.trim()}`,
                        masterId: tradeId,
                        botId: acc.botId.trim(),
                        brokerId: acc.brokerId,
                        accountId: acc.accountId || acc.id,
                        status: 'DISPATCHED',
                        magic: magic
                    });

                    const workerPayload = {
                        masterId: tradeId,
                        brokerId: acc.brokerId,
                        accountId: acc.id,
                        magic: magic,
                        trade: trade
                    };

                    systemOrchestrator.sendToWorkerByKey(routingKey, {
                        type: 'CMD_LOCAL_EXECUTE_TRADE',
                        botId: acc.botId.trim(),
                        content: workerPayload
                    });
                } else {
                    console.log(`[TradeDist] Bot ${acc.botId} OFFLINE (Key=${routingKey}). Trade ${tradeId} execution canceled.`);
                    db.createBrokerExecution({
                        id: `${tradeId}_${acc.botId.trim()}`,
                        masterId: tradeId,
                        botId: acc.botId.trim(),
                        brokerId: acc.brokerId,
                        accountId: acc.accountId || acc.id,
                        status: 'OFFLINE',
                        magic: magic,
                        error_message: 'Bot Offline or Disconnected'
                    });
                }

                results.push({ botId: acc.botId, status: executionStatus });
            } else {
                console.warn("[TradeDist] Account missing botId. ID:", acc.id, "Login:", acc.login);
            }
        });

        // SIGNAL FRONTEND IMMEDIATE UPDATE (Task: Instant "SENT" Visibility)
        const socketServer = require('./SocketServer');
        if (socketServer && socketServer.io) {
            socketServer.io.emit('trades_update_signal', { count: 1 });
        }

        return { success: true, results, tradeId: tradeId };
    }

    sendCommandToBot(botId, trade) {
        const tzService = require('./TimezoneNormalizationService');

        // CLONE and NORMALIZE TIMESTAMPS
        const content = JSON.parse(JSON.stringify(trade));

        // List of fields that are Timestamps (Seconds)
        const timeFields = ['expiration'];

        const mappingService = require('./AssetMappingService');

        // Handle Anchors specifically
        if (content.sl && content.sl.anchor && content.sl.anchor.time) {
            content.sl.anchor.time = tzService.convertUtcToBroker(botId, content.sl.anchor.time);
        }
        if (content.tp && content.tp.anchor && content.tp.anchor.time) {
            content.tp.anchor.time = tzService.convertUtcToBroker(botId, content.tp.anchor.time);
        }
        if (content.entry && content.entry.anchor && content.entry.anchor.time) {
            content.entry.anchor.time = tzService.convertUtcToBroker(botId, content.entry.anchor.time);
        }

        // --- SYMBOL MAPPING CORRECTION ---
        if (content.symbol) {
            const mappedSymbol = mappingService.getBrokerSymbol(botId, content.symbol);
            if (mappedSymbol) {
                console.log(`[TradeDist] Mapping Symbol: ${content.symbol} -> ${mappedSymbol} for Bot ${botId}`);
                content.symbol = mappedSymbol;
            } else {
                console.warn(`[TradeDist] No symbol mapping found for ${content.symbol} on Bot ${botId}. Using raw symbol.`);
            }
        }

        // --- PROTOCOL MAPPING (JSON SPEC) ---
        // Map 'direction' to 'operation'
        if (content.direction && !content.operation) {
            content.operation = content.direction; // BUY/SELL
        }
        // Map 'size' to 'volume' if needed
        if (content.size && !content.volume) {
            content.volume = content.size;
        }

        // Construct Payload
        const command = {
            type: 'CMD_EXECUTE_TRADE',
            sender: 'App',
            botId: botId,
            routingKey: `${botId}:TRADING:ALL`, // STRICT ROUTING
            targetBotId: botId,
            content: {
                ...content,
                dryRun: false,
                slAnchor: content.slAnchor,
                tpAnchor: content.tpAnchor,
            },
            timestamp: this.getMonotonicTimestamp(botId),
            customId: `exec-${botId}-${content.id}`,
            isActive: 0
        };

        return command; // return payload for Worker to send
    }

    modifyTrade(modification, accounts) {
        if (!accounts || accounts.length === 0) return { success: false, message: "No active accounts." };

        const results = [];
        const targetedBots = new Set();

        const db = require('./DatabaseService');
        const dbExecutions = db.marketDb.prepare("SELECT bot_id, status FROM broker_executions WHERE master_trade_id = ?").all(modification.tradeId);

        const terminalStates = new Set(['CLOSED', 'ERROR', 'REJECTED', 'OFFLINE']);

        console.log(`[TradeDist] modifyTrade called for ${accounts.length} accounts. Modification:`, modification);

        accounts.forEach(acc => {
            if (acc.botId && !targetedBots.has(acc.botId)) {
                targetedBots.add(acc.botId);

                // Check if the execution is already in a terminal state
                const exec = dbExecutions.find(e => (e.bot_id || "").trim() === acc.botId.trim());
                if (exec && terminalStates.has(exec.status)) {
                    console.log(`[TradeDist] Skipping modification for Bot ${acc.botId}. Execution is already ${exec.status}.`);
                    results.push({ botId: acc.botId, status: 'SKIPPED_TERMINAL' });
                    return;
                }

                // Send Command
                console.log(`[TradeDist] Targeting Bot: ${acc.botId} for Modification.`);
                this.sendTradeToBot(acc.botId, modification);
                results.push({ botId: acc.botId, status: 'SENT' });
            } else {
                console.log(`[TradeDist] Skipping Account ${acc.accountId} (BotId: ${acc.botId} duplicate/missing).`);
            }
        });

        return { success: true, results };
    }

    sendTradeToBot(botId, contentData) {
        // Clone and Normalize to match Spec
        const content = { ...contentData };
        if (content.tradeId && !content.id) {
            content.id = content.tradeId;
        }

        // DETERMINE COMMAND TYPE BASED ON ACTION
        let cmdType = 'CMD_MODIFY_POSITION';

        if (content.action === 'CLOSE' || content.action === 'CLOSE_PARTIAL' || content.action === 'CANCEL') {
            cmdType = 'CMD_CLOSE_POSITION';
        }

        // Construct Payload
        const command = {
            type: cmdType,
            sender: 'App',
            botId: botId,
            routingKey: `${botId}:TRADING:ALL`, // STRICT ROUTING
            targetBotId: botId,
            content: content,
            timestamp: this.getMonotonicTimestamp(botId),
            customId: `mod-${botId}-${Date.now()}`,
            isActive: 0
        };

        // Tunnel to Worker
        systemOrchestrator.sendToWorkerByKey(`${botId}:TRADING:ALL`, {
            type: 'CMD_LOCAL_MODIFY_TRADE',
            botId: botId,
            content: { command, dbExecId: `${content.id}_${botId}`, masterId: content.id }
        });

    }

    getMonotonicTimestamp(botId) {
        let now = Date.now();
        if (this.lastBotTimestamp[botId] && now <= this.lastBotTimestamp[botId]) {
            now = this.lastBotTimestamp[botId] + 1;
        }
        this.lastBotTimestamp[botId] = now;
        return now;
    }
}

module.exports = new TradeDistributionService();
