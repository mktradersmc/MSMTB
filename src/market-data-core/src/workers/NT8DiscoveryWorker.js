const AbstractWorker = require('./AbstractWorker');
const path = require('path');
const db = require('../services/DatabaseService'); // Singleton

class NT8DiscoveryWorker extends AbstractWorker {
    constructor() {
        super();
        this.db = db; // Use centralized DB service
        this._log(`[NT8DiscoveryWorker] 🔍 Started. Waiting for Bridge...`);
    }

    /**
     * Triggered when the Bridge (NT8:DISCOVERY) connects.
     */
    async onBotConnected(info) {
        this._log(`[NT8DiscoveryWorker] 🟢 Bridge Connected. Sending Handshake (CMD_INIT)...`);

        try {
            // 1. Send Handshake to Bridge via RPC (NT8 Bridge waits 10 seconds artificially)
            const response = await this.sendRpc('CMD_INIT', {
                version: '2.0',
                mode: 'STRICT_SYNC'
            }, 30000);

            this.handleReportAccounts(response);
        } catch (e) {
            this._error(`[NT8DiscoveryWorker] Handshake Failed or Timeout: ${e.message}`);
        }
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
            this._error(`[NT8DiscoveryWorker] ❌ DBService Not initialized. Cannot save accounts.`);
            return;
        }

        let successCount = 0;
        const now = Date.now();

        // Transaction is handled implicitly or row-by-row via DBService
        const existingBrokers = this.db.getBrokers();

        accounts.forEach(acc => {
            try {
                if (acc.provider === 'Unknown') return;

                // Determine if it's a test account based on properties or name
                const isTestAccount = acc.isTest === true || acc.isTest === 'true' || acc.is_test === true || acc.is_test === 'true' || acc.name === 'Sim101';

                // 1. Broker Logic
                let brokerId = 'NinjaTrader-Fallback';
                if (acc.provider && acc.provider !== 'Unknown') {
                    // Try to find an existing broker by name (case-insensitive)
                    const existingBroker = existingBrokers.find(b => b.name.toLowerCase() === acc.provider.toLowerCase());

                    if (existingBroker) {
                        brokerId = existingBroker.id;
                    } else {
                        // Create a new simple fallback using a proper UUID
                        const crypto = require('crypto');
                        brokerId = crypto.randomUUID();

                        const newBroker = {
                            id: brokerId,
                            name: acc.provider,
                            shorthand: 'NT8',
                            defaultSymbol: null,
                            type: 'NT8', // Maps to db 'type' and 'platform'
                            api: 'Bridge',
                            environment: isTestAccount ? 'demo' : 'live',
                            servers: [],
                            symbolMappings: {}
                        };

                        this.db.saveBroker(newBroker);
                        // Update our local cache for the next iteration
                        existingBrokers.push({ ...newBroker, id: brokerId });

                        this._log(`[NT8DiscoveryWorker] Broker ${acc.provider} created via DBService with id ${brokerId}`);
                    }
                }

                // Parse provided balance and equity, calculating account_size dynamically
                const providedBalance = acc.balance !== undefined ? parseFloat(acc.balance) : 0;
                const accountSize = providedBalance > 0 ? (Math.round(providedBalance / 1000) * 1000) : 0;

                // 2. Account Logic
                const newAccount = {
                    id: acc.name,
                    botId: acc.name,
                    brokerId: brokerId,
                    login: acc.name,
                    password: '',
                    server: 'NinjaTrader',
                    accountType: acc.accountType || 'Trading',
                    isTest: isTestAccount,
                    isDatafeed: acc.isDatafeed || false,
                    platform: 'NT8',
                    timezone: 'UTC',
                    balance: providedBalance,
                    accountSize: accountSize,
                    createdAt: now
                };

                this.db.saveAccount(newAccount);

                this._log(`[NT8DiscoveryWorker] Account ${acc.name} updated. Broker: ${brokerId}`);

                successCount++;
            } catch (e) {
                this._error(`Failed to save account ${acc.name}: ${e.message}`);
            }
        });

        this._log(`[NT8DiscoveryWorker] 💾 Persisted ${successCount} accounts.`);

        // 3. Confirm Sync to Bridge
        this.sendCommand('CMD_ACCOUNTS_SYNCED', {
            status: 'OK',
            count: successCount
        });

        // 4. Notify Hub (Optional - for UI Stream)
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
            case 'CMD_REPORT_ACCOUNTS': // Legacy Push (No RPC)
                this.handleReportAccounts(msg.content || msg.payload || msg);
                break;
            default:
                super.onCommand(msg); // Log unknown
                break;
        }
    }
}

new NT8DiscoveryWorker();
