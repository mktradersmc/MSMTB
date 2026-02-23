const AbstractWorker = require('./AbstractWorker');
const path = require('path');
const db = require('../services/DatabaseService'); // Singleton
const BotConfigService = require('../services/BotConfigService');

class TradeWorker extends AbstractWorker {
    constructor() {
        super();
        this.db = db; // Use centralized DB service
    }

    // --- OVERRIDES ---

    /**
     * Called when Bot connection is established/restored.
     * Trigger Sync or Queue processing here.
     */
    async onBotConnected(info) {
        // TradeWorker autonomously fetches and pushes configuration
        this.log("🔄 Bot Connected. Pushing Trade Configuration... (Delayed 1s)");
        setTimeout(() => this.pushConfiguration(), 1000);

        // SYMBOL CHECK (New Logic)
        const brokerId = this.db.getBrokerIdForBotId(this.botId) || this.botId;
        const knownSymbols = this.db.getBrokerSymbols(brokerId); // Assuming access to AssetMappingService via DB or separate?
        // DatabaseService doesn't have getBrokerSymbols directly exposed properly yet? 
        // AssetMappingService has it. TradeWorker doesn't import AssetMappingService directly.
        // But we can check DB directly via this.db.marketDb

        try {
            const row = this.db.marketDb.prepare("SELECT symbols FROM broker_symbols WHERE broker_id = ?").get(brokerId);
            if (!row || !row.symbols) {
                this.log(`[TradeWorker] 🆕 New/Empty Broker '${brokerId}'. Requesting Symbols via RPC...`);
                // Async Request - don't await blocking the whole connection flow?
                this.sendRpc('CMD_GET_SYMBOLS', {}, 15000).then(resp => {
                    if (resp && resp.status === 'OK') {
                        const payload = resp.content || resp.data || resp;
                        const symbols = Array.isArray(payload) ? payload : (payload.symbols || []);
                        this.handleAvailableSymbols(symbols, brokerId);
                    }
                }).catch(e => this.error(`[TradeWorker] Symbol Fetch Failed: ${e.message}`));
            } else {
                this.log(`[TradeWorker] ✅ Found Local Symbols for '${brokerId}'. Skipping RPC.`);
            }
        } catch (e) { this.error(`[TradeWorker] Symbol Check Error: ${e.message}`); }

        // Request open positions sync
        this.sendCommand('CMD_SYNC_POSITIONS', {});
    }

    pushConfiguration() {
        try {
            // Force Reload from Disk to get latest updates from API/UI
            BotConfigService.loadConfigs();

            const config = BotConfigService.getConfig(this.botId);

            if (config && Object.keys(config).length > 0) {
                this.config = config; // CACHE CONFIG
                this.log(`[ConfigPush] ⚙️ Syncing Config to Bot: ${JSON.stringify(config)}`);
                this.sendCommand('CMD_UPDATE_CONFIG', config);
            } else {
                this.log(`[ConfigPush] ℹ️ No explicit config found in DB for BotID '${this.botId}'. Using defaults.`);
            }
        } catch (e) {
            this.error(`[ConfigPush] Failed: ${e.message}`);
        }
    }

    onCommand(msg) {
        // RPC Support
        if (msg.type && msg.type.endsWith('_RESPONSE')) {
            const rpcHelper = require('../framework/protocol/RpcCommandHelper');
            if (rpcHelper.resolve(msg)) return;
        }

        switch (msg.type) {
            // case 'CMD_AVAILABLE_SYMBOLS':
            //    // Legacy / Push REMOVED for Strict RPC
            //    break;
            case 'EV_TRADE_UPDATE': // WAS: MSG_POSITIONS_UPDATE
            case 'MSG_POSITIONS_UPDATE': // Legacy Support (Temporary)
                this.handlePositionsUpdate(msg.content, msg.botId || msg.sender);
                break;
            case 'EV_TRADE_CLOSED':
                this.handleTradeClosed(msg.content, msg.botId || msg.sender);
                break;
            case 'CMD_EXECUTION_RESULT':
                this.handleExecutionResult(msg.content, msg.botId || msg.sender);
                break;
            case 'EV_ACCOUNT_STATUS_UPDATE': // WAS: CMD_REPORT_ACCOUNTS / STATUS_UPDATE
            case 'CMD_REPORT_ACCOUNTS': // Legacy Support
            case 'STATUS_UPDATE':
                this.handleAccountsReport(msg.content, msg.botId || msg.sender);
                break;
            case 'CMD_LOCAL_EXECUTE_TRADE':
                this.handleLocalExecuteTrade(msg.content, msg.botId || msg.sender);
                break;
            case 'CMD_LOCAL_MODIFY_TRADE':
                this.handleLocalModifyTrade(msg.content, msg.botId || msg.sender);
                break;
            case 'EXECUTE_TRADE':
            case 'CMD_MODIFY_TRADE':
            case 'CMD_ACK_TRADE':
                this.handleTradeCommand(msg);
                break;
        }
    }

    handleAvailableSymbols(content, brokerId) {
        let symbols = Array.isArray(content) ? content : (content.symbols || content);
        if (!Array.isArray(symbols)) {
            this.error(`[TradeWorker] ❌ Invalid symbols format received: ${typeof content}`);
            return;
        }

        if (!brokerId) {
            brokerId = this.db.getBrokerIdForBotId(this.botId);
        }

        if (!brokerId) {
            this.log(`[TradeWorker] ⚠️ Could not resolve BrokerID for Bot '${this.botId}'. using BotID as fallback.`);
            brokerId = this.botId;
        }

        this.log(`[TradeWorker] 💾 Saving ${symbols.length} symbols for Broker ${brokerId} (Bot: ${this.botId})`);

        // Use Centralized DatabaseService
        try {
            this.db.saveBrokerSymbols(brokerId, symbols);
        } catch (e) {
            this.error(`[TradeWorker] ❌ Failed to save symbols: ${e.message}`);
        }
    }

    onStreamData(data) {
        // Typically TradeWorker doesn't handle ticks
    }

    // --- LOGIC ---

    /**
     * Handle Positions Update (Sync Snapshot)
     * Delegates to DatabaseService's efficient diffing logic.
     */
    handlePositionsUpdate(content, botId) {
        if (!content) return;
        // Unwrap logic usually handled before here, but check structure
        // content is usually { positions: [...] } or just [...]
        const positions = Array.isArray(content) ? content : content.positions;

        if (positions) {
            this.log(`[TradeWorker] 🔄 EV_TRADE_UPDATE Received from ${botId}: ${Array.isArray(positions) ? positions.length : 'Unknown'} positions. Payload: ${JSON.stringify(positions)}`);
            this.db.syncBrokerPositions(botId, positions);
            // Logging handles in DB Service or here if needed
        }
    }

    /**
     * Handle Closed Trades (Explicit End-of-Life Update)
     */
    handleTradeClosed(content, botId) {
        if (!content) return;
        const positions = Array.isArray(content) ? content : content.positions;

        if (positions && positions.length > 0) {
            this.log(`[TradeWorker] 🏁 EV_TRADE_CLOSED Received from ${botId} for ${positions.length} trades.`);
            this.log(`[TradeWorker] 🏁 EV_TRADE_CLOSED Payload Details: ${JSON.stringify(positions)}`);
            this.db.processClosedTrades(botId, positions);
        } else {
            this.log(`[TradeWorker] ⚠️ EV_TRADE_CLOSED Received from ${botId} but no positions array found in payload: ${JSON.stringify(content)}`);
        }
    }

    /**
     * Handle Manual/Auto Execution Result
     */
    handleExecutionResult(content, botId) {
        // content: { masterId, status, message, ... }
        if (!content) return;

        console.log(`[TradeWorker] 📥 Execution Result:`, content);

        const { masterId, status, message } = content;

        if (masterId && status) {
            // FIX: Map MQL5 "OK" native success response to our internal "RUNNING"
            const finalStatus = status === 'OK' ? 'RUNNING' : status;
            this.db.updateBrokerExecutionStatus(botId, masterId, finalStatus, message);
        }
    }

    /**
     * Handle Account Discovery Report
     */
    handleAccountsReport(content, botId) {
        // content: { source, accounts: [] } or just accounts array
        // payload extraction handled by Protocol

        const accounts = Array.isArray(content) ? content : (content.accounts || []);
        console.log(`[TradeWorker] 📥 Accounts Report from ${botId}: ${accounts.length} found.`);

        if (accounts.length > 0) {
            let updated = 0;
            accounts.forEach(acc => {
                // Normalize & Save
                const accountData = {
                    id: acc.name, // Strict: ID = Name for mapping
                    name: acc.name,
                    brokerId: acc.provider || 'NinjaTrader',
                    platform: 'NT8', // or infer from Bot?
                    type: acc.isTest ? 'SIMULATION' : 'LIVE',
                    login: acc.name,
                    isTest: !!acc.isTest,
                    isConnected: true,
                    status: 'RUNNING',
                    pid: 0
                };
                this.db.saveAccount(accountData);
                updated++;
            });

            // Confirm to Bot (if it waits for it, NT8 adapter might)
            this.sendCommand('CMD_DB_SYNC_CONFIRMED', { count: updated });
            this.log(`✅ Synced ${updated} accounts.`);
        }
    }

    handleTradeCommand(msg) {
        // Orchestrator expects: { type: 'COMMAND', content: { ... } }
        // AbstractWorker.sendCommand(type, payload) -> payload becomes content.
        // If msg.content is { type: 'EXECUTE_TRADE', ... }
        this.sendCommand(msg.content.type, msg.content);
    }

    // --- TUNNELED RPC EXECUTION (USER ARCHITECTURE) ---

    async handleLocalExecuteTrade(content, botId) {
        if (!content || !content.trade) return;
        const { masterId, brokerId, accountId, magic, trade } = content;

        this.log(`[TradeWorker] 🚀 Preparing Local Execute Trade ${masterId} for ${botId}`);

        const payload = { ...trade, dryRun: false, slAnchor: trade.slAnchor, tpAnchor: trade.tpAnchor };

        // Normalize Anchors to Broker Timezone locally
        try {
            const tzService = require('../services/TimezoneNormalizationService');
            if (payload.sl && payload.sl.anchor && payload.sl.anchor.time) {
                payload.sl.anchor.time = tzService.convertUtcToBroker(botId, payload.sl.anchor.time);
            }
            if (payload.tp && payload.tp.anchor && payload.tp.anchor.time) {
                payload.tp.anchor.time = tzService.convertUtcToBroker(botId, payload.tp.anchor.time);
            }
            if (payload.entry && payload.entry.anchor && payload.entry.anchor.time) {
                payload.entry.anchor.time = tzService.convertUtcToBroker(botId, payload.entry.anchor.time);
            }
        } catch (e) {
            this.warn(`[TradeWorker] Anchor timezone normalization failed: ${e.message}`);
        }

        try {
            // AWAIT RPC
            this.log(`[TradeWorker] ⏳ Sending CMD_EXECUTE_TRADE RPC and awaiting response...`);
            const response = await this.sendRpc('CMD_EXECUTE_TRADE', payload, 30000);

            // Success (OK) -> Explicitly store EXACT status from MQL5 (OK -> RUNNING, REJECTED, ERROR)
            const status = response.status === 'OK' ? 'RUNNING' : (response.status || 'ERROR');
            this.log(`[TradeWorker] ✅ Trade Execution RPC Resolved: ${status} | Msg: ${response.message || 'None'}`);

            // ONLY INSERT EXECUTION HERE
            this.db.createBrokerExecution({
                id: `${masterId}_${botId}`,
                masterId: masterId,
                botId: botId,
                brokerId: brokerId,
                accountId: accountId,
                status: status,
                error_message: response.message || null,
                magic: magic,
                initial_entry: response.entry_price !== undefined ? response.entry_price : (payload.entry && payload.entry.price !== undefined ? payload.entry.price : undefined),
                initial_sl: response.sl !== undefined ? response.sl : (payload.sl && payload.sl.price !== undefined ? payload.sl.price : undefined),
                initial_tp: response.tp !== undefined ? response.tp : (payload.tp && payload.tp.price !== undefined ? payload.tp.price : undefined)
            });
            // Update Aggregation
            this.db.checkAggregateTradeStatus(masterId);

        } catch (e) {
            this.error(`[TradeWorker] ❌ Trade Execution RPC Failed/Timeout: ${e.message}`);
            // Force ERROR state
            this.db.createBrokerExecution({
                id: `${masterId}_${botId}`,
                masterId: masterId,
                botId: botId,
                brokerId: brokerId,
                accountId: accountId,
                status: 'ERROR',
                error_message: e.message || 'RPC Timeout / Offline',
                magic: magic
            });
            this.db.checkAggregateTradeStatus(masterId);
        }
    }

    async handleLocalModifyTrade(content, botId) {
        if (!content || !content.command) return;
        const { command, dbExecId, masterId } = content;

        this.log(`[TradeWorker] 🚀 Preparing Local Modify Trade ${command.type} for ${botId}`);

        if (command.content) {
            try {
                const tzService = require('../services/TimezoneNormalizationService');
                if (command.content.sl && command.content.sl.anchor && command.content.sl.anchor.time) {
                    command.content.sl.anchor.time = tzService.convertUtcToBroker(botId, command.content.sl.anchor.time);
                }
                if (command.content.tp && command.content.tp.anchor && command.content.tp.anchor.time) {
                    command.content.tp.anchor.time = tzService.convertUtcToBroker(botId, command.content.tp.anchor.time);
                }
            } catch (e) {
                this.warn(`[TradeWorker] Anchor timezone normalization failed in modify: ${e.message}`);
            }
        }

        try {
            this.log(`[TradeWorker] ⏳ Sending ${command.type} RPC and awaiting response...`);
            const response = await this.sendRpc(command.type, command.content, 30000);

            // Log precise result
            this.log(`[TradeWorker] ✅ Trade Modification RPC Resolved: ${response.status} | Msg: ${response.message || 'None'}`);

            // Propagate explicit Error to UI if failed (via updating execution status)
            if (response.status === 'ERROR' || response.status === 'REJECTED') {
                this.db.updateBrokerExecutionStatus(botId, masterId, response.status, response.message);
            } else if (command.content && command.content.action === 'CANCEL' && response.status === 'OK') {
                // Map successful cancellation to CANCELED status
                response.status = 'CANCELED';
                this.db.updateBrokerExecutionStatus(botId, masterId, 'CANCELED', 'Order Canceled');
                this.db.checkAggregateTradeStatus(masterId); // Ensure master trade gets updated
            }

            // EXPLICIT SL_BE FLAG (User Request)
            if (response.sl_at_be_success === true) {
                this.db.setSLAtBE(botId, masterId, 1);
            }

            // Sync with UI
            const orchestration = require('../services/SystemOrchestrator');
            orchestration.handleExecutionResult(botId, response);

        } catch (e) {
            this.error(`[TradeWorker] ❌ Trade Modification RPC Failed/Timeout: ${e.message}`);
            // Optionally update DB
            this.db.updateBrokerExecutionStatus(botId, masterId, 'ERROR', e.message || 'RPC Timeout / Offline');
        }
    }
}


// Instantiate Worker (Entry Point)
new TradeWorker();
module.exports = TradeWorker;


