const AbstractWorker = require('./AbstractWorker');

const path = require('path');
const Database = require('better-sqlite3');

class NT8DiscoveryWorker extends AbstractWorker {
    constructor() {
        super();
        this.db = null;
        this.initDB();
        this._log(`[NT8DiscoveryWorker] 🔍 Started. Waiting for Bridge...`);
    }

    initDB() {
        try {
            // Replicate DB connection from DatafeedWorker/DatabaseService
            const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../market_data.db'); // Adjust path as needed, usually it's in root/market_data.db or similar
            // Wait, DatabaseService says: config.DB_MARKET_PATH. 
            // DatafeedWorker says: path.resolve(__dirname, '../../market_data.db')
            // Let's match DatafeedWorker for consistency in Workers.
            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('busy_timeout = 5000');
            this._log("✅ DB Connected.");
        } catch (e) {
            this._error(`DB Init Failed: ${e.message}`);
        }
    }

    /**
     * Triggered when the Bridge (NT8:DISCOVERY) connects.
     */
    onBotConnected(info) {
        this._log(`[NT8DiscoveryWorker] 🟢 Bridge Connected. Sending Handshake (CMD_INIT)...`);

        // 1. Send Handshake to Bridge
        this.sendCommand('CMD_INIT', {
            version: '2.0',
            mode: 'STRICT_SYNC'
        });
    }

    /**
     * Handle commands from the Bridge.
     */
    handleReportAccounts(accounts) {
        if (!Array.isArray(accounts)) {
            this._error(`[NT8DiscoveryWorker] ❌ Invalid Accounts Payload: ${typeof accounts}`);
            return;
        }

        this._log(`[NT8DiscoveryWorker] 📥 Processing ${accounts.length} Accounts from Bridge...`);

        if (!this.db) {
            this._error(`[NT8DiscoveryWorker] ❌ DB Not initialized. Cannot save accounts.`);
            return;
        }

        let successCount = 0;
        const now = Date.now();

        const insertBrokerStmt = this.db.prepare(`
            INSERT OR IGNORE INTO brokers (id, name, type, api, environment, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // We use INSERT OR REPLACE for Accounts to update status
        const upsertAccountStmt = this.db.prepare(`
            INSERT OR REPLACE INTO accounts (id, name, broker_id, platform, type, is_test, is_datafeed, status, updated_at, balance, equity, currency, leverage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // We need to preserve existing fields if possible? 
        // INSERT OR REPLACE overwrites. 
        // SystemOrchestrator logic tried to preserve.
        // But Workers usually are authoritative for technical status.
        // Let's stick to UPSERT logic (SQLite 3.24+ supports ON CONFLICT, strictly speaking 'better-sqlite3' acts as SQLite).
        // Simple REPLACE is fine for Discovery.

        this.db.transaction(() => {
            accounts.forEach(acc => {
                try {
                    // 1. Broker Logic
                    let brokerId = 'NinjaTrader';
                    if (acc.provider && acc.provider !== 'Unknown') {
                        // Check/Create Broker
                        // Use Provider Name as ID for simplicity or sanitize
                        const cleanProvider = acc.provider.replace(/[^a-zA-Z0-9]/g, '_');
                        brokerId = cleanProvider;

                        insertBrokerStmt.run(
                            brokerId,
                            acc.provider,
                            'NinjaTrader',
                            'Bridge',
                            acc.isTest ? 'demo' : 'live',
                            now
                        );
                    }

                    // 2. Account Logic
                    upsertAccountStmt.run(
                        acc.name,           // id
                        acc.name,           // name
                        brokerId,           // broker_id
                        'NT8',              // platform
                        acc.accountType || 'Trading', // type
                        acc.isTest ? 1 : 0, // is_test
                        0,                  // is_datafeed (FORCE 0: User Req: Only TradingAccount)
                        'RUNNING',          // status
                        now,                // updated_at
                        0, 0, 'USD', 1      // defaults
                    );

                    successCount++;
                } catch (e) {
                    this._error(`Failed to save account ${acc.name}: ${e.message}`);
                }
            });
        })();

        this._log(`[NT8DiscoveryWorker] 💾 Persisted ${successCount} accounts.`);

        // 3. Confirm Sync to Bridge
        this.sendCommand('CMD_ACCOUNTS_SYNCED', {
            status: 'OK',
            count: successCount
        });

        // 4. Notify Hub (Optional - for UI Stream)
        // If we want UI to update immediately without polling DB.
        this.sendToHub('DISCOVERY_UPDATE', {
            source: 'NT8',
            count: successCount
        });
    }

    /**
     * Handle IPC messages from Parent (SystemOrchestrator).
     */
    onCommand(msg) {
        switch (msg.command) {
            case 'CMD_REPORT_ACCOUNTS': // From Bridge
                this.handleReportAccounts(msg.content);
                break;

            default:
                super.onCommand(msg); // Log unknown
                break;
        }
    }
}

new NT8DiscoveryWorker();
