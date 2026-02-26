const AbstractWorker = require('./AbstractWorker');
const { parentPort } = require('worker_threads');
const db = require('../services/DatabaseService');

class DatafeedWorker extends AbstractWorker {
    constructor() {
        super();
        this.db = db; // Use centralized DB service
    }

    async onBotConnected(info) {
        // 1. Resolve Broker ID (New Schema)
        let brokerId = this.botId;
        try {
            const accountRow = this.db.marketDb.prepare("SELECT broker_id FROM accounts WHERE bot_id = ? LIMIT 1").get(this.botId);
            if (accountRow && accountRow.broker_id) brokerId = accountRow.broker_id;
        } catch (e) {
            this.error(`[DatafeedWorker] Failed to resolve BrokerID for ${this.botId}: ${e.message}`);
        }

        // 2. Check Broker Symbols (using BrokerID)
        let symbols = [];
        let row = null;
        try {
            row = this.db.marketDb.prepare("SELECT symbols FROM broker_symbols WHERE broker_id = ?").get(brokerId);
            if (row && row.symbols) {
                symbols = JSON.parse(row.symbols);
            }
        } catch (e) { }

        if (!row || symbols.length === 0) {
            this.log(`[DatafeedWorker] 🆕 New/Empty Broker '${brokerId}' (Bot: ${this.botId}). Requesting Symbols via RPC...`);

            // 3. Request Symbols from Bot
            try {
                const response = await this.sendRpc('CMD_GET_SYMBOLS', {}, 15000);

                // Parse Response
                const payload = response.content || response;
                // Handle different response structures (e.g. { status: 'OK', data: [...] } vs direct array)
                const newSymbols = Array.isArray(payload) ? payload : (payload.data || payload.symbols || []);

                if (newSymbols.length > 0) {
                    this.log(`[DatafeedWorker] ✅ Received ${newSymbols.length} symbols via RPC.`);
                    this.handleAvailableSymbols(newSymbols, brokerId);
                } else {
                    this.log(`[DatafeedWorker] ⚠️ RPC returned 0 symbols.`);
                }
            } catch (e) {
                this.error(`[DatafeedWorker] ❌ Symbol RPC Failed: ${e.message}`);
            }
        } else {
            this.log(`[DatafeedWorker] ✅ Found ${symbols.length} existing symbols for Broker '${brokerId}'.`);
            this.pushConfiguration();
        }

        // 4. Trigger Automatic Subscriptions based on Config
        this.triggerAutoSubscriptions();
    }

    onCommand(msg) {
        // STANDARD PROTOCOL: Command is in header.command
        const cmd = msg.header ? msg.header.command : (msg.command || msg.type);

        if (!cmd) {
            this._error(`[DatafeedWorker] ⚠️ onCommand: Missing command in header`, msg);
            return;
        }

        // RPC RESPONSE HANDLING (Generic)
        if (cmd.endsWith('_RESPONSE')) {
            const rpcHelper = require('../framework/protocol/RpcCommandHelper');
            if (rpcHelper.resolve(msg)) return;
        }

        // Handle specific commands if needed
        if (cmd === 'CMD_PUSH_CONFIG') {
            this.pushConfiguration();
        }
        // else if (cmd === 'CMD_AVAILABLE_SYMBOLS') {
        // Legacy / Fallback REMOVED
        //    this.handleAvailableSymbols(msg.content); 
        // }
    }

    handleAvailableSymbols(content, brokerId) {
        // Content: { symbols: ["EURUSD", "GBPUSD", ...] } or just Array
        let symbols = Array.isArray(content) ? content : (content.symbols || content);

        if (!Array.isArray(symbols)) {
            this._error(`[DatafeedWorker] ❌ Invalid Symbols List: ${typeof symbols}`);
            return;
        }

        // Resolve BrokerID if not passed (e.g. from Legacy Command)
        if (!brokerId) {
            try {
                const accountRow = this.db.marketDb.prepare("SELECT broker_id FROM accounts WHERE bot_id = ? LIMIT 1").get(this.botId);
                brokerId = accountRow ? accountRow.broker_id : this.botId;
            } catch (e) { brokerId = this.botId; }
        }

        this._log(`[DatafeedWorker] 📥 Ingesting ${symbols.length} Symbols for Broker: ${brokerId} (Bot: ${this.botId})`);

        if (!this.db) {
            this._error(`[DatafeedWorker] ❌ DB Not initialized. Cannot save symbols.`);
            return;
        }

        try {
            this.db.saveBrokerSymbols(brokerId, symbols);
            this._log(`[DatafeedWorker] 💾 Saved ${symbols.length} symbols.`);

            // Now triggering Config Push since we have symbols!
            this.pushConfiguration();

        } catch (e) {
            this._error(`[DatafeedWorker] ❌ Failed to save broker symbols: ${e.message}`);
        }
    }

    onStreamData(data) {
        // DatafeedWorker usually doesn't handle streams
        // It's mostly for Metadata.
    }

    async pushConfiguration() {
        if (!this.db) return;
        const rpcHelper = require('../framework/protocol/RpcCommandHelper');

        try {
            if (!this.botId) return;
            const botId = this.botId;

            // Fetch configured symbols from `config` table
            const row = this.db.marketDb.prepare("SELECT value FROM config WHERE key = 'selected_symbols'").get();
            let allConfigured = [];
            if (row && row.value) {
                try { allConfigured = JSON.parse(row.value); } catch (e) { }
            }

            // Map and filter for THIS Bot
            const mySymbols = allConfigured.filter(c =>
                (!c.botId || c.botId === botId)
            ).map(c => {
                let brokerSym = c.datafeedSymbol || c.symbol;

                // Clean Prefix (e.g. "BotID:Symbol" -> "Symbol")
                if (brokerSym && typeof brokerSym === 'string' && brokerSym.includes(':')) {
                    const parts = brokerSym.split(':');
                    brokerSym = parts[parts.length - 1];
                }

                return {
                    internal: c.symbol,
                    broker: brokerSym,
                    period: 1440 // Default from Session logic
                };
            });

            if (mySymbols.length > 0) {
                this.log(`ℹ️ Sending CMD_CONFIG_SYMBOLS for ${mySymbols.length} configured symbols (RPC)...`);

                // RPC CALL
                const startTime = Date.now();
                const response = await this.sendRpc(
                    'CMD_CONFIG_SYMBOLS',
                    { symbols: mySymbols },
                    60000
                );

                this.log(`✅ Config RPC Confirmed by Bot (${Date.now() - startTime}ms). Status: ${response.status || 'OK'}`);

            } else {
                this.log("ℹ️ No configured symbols for this bot in config table. (Pure Discovery Mode)");
            }

        } catch (e) {
            this.error(`Config Push Failed: ${e.message}`);
        }
    }

    triggerAutoSubscriptions() {
        this.log("[DatafeedWorker] 🔄 Triggering Auto-Subscriptions (Stub)...");
        // Stub to prevent crash. Logic can be added here later.
    }

}

new DatafeedWorker();

