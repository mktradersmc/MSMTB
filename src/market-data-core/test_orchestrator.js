const dbFilePath = 'c:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/market_data.db';
const Database = require('better-sqlite3');
const db = new Database(dbFilePath);
const dbService = require('./src/services/DatabaseService');

// Instantiate Orchester to test handleWorkerMessage logic for DISCOVERY_UPDATE
const orchestrator = require('./src/services/SystemOrchestrator'); // It's an instance!

// Ensure there is an existing account with password
db.prepare("UPDATE accounts SET login='Apex_DATAFEED', password='MyStrongPassword123' WHERE id='Apex_DATAFEED'").run();
console.log("DB Before:", db.prepare("SELECT id, bot_id, login, password FROM accounts WHERE id='Apex_DATAFEED'").get());

// Simulate Worker Message for DISCOVERY_UPDATE
orchestrator.handleWorkerMessage({
    type: 'DISCOVERY_UPDATE',
    symbol: 'ALL',
    content: {
        source: 'NinjaTrader',
        accounts: [
            {
                name: 'Apex_DATAFEED',
                provider: 'Apex',
                isTest: true
            }
        ]
    }
}, 'ALL', null, 'worker_routing_key');

setTimeout(() => {
    console.log("DB After DISCOVERY_UPDATE:", db.prepare("SELECT id, bot_id, login, password FROM accounts WHERE id='Apex_DATAFEED'").get());

    // Test the other connection point (onBotConnected)
    orchestrator.onBotConnected({
        id: 'Apex_DATAFEED',
        func: 'TRADING',
        symbol: 'ALL',
        routingKey: 'bot_routing_key',
        payload: {
            provider: 'Apex',
            accountName: 'Apex_DATAFEED',
            accountType: 'SIMULATION'
        }
    });

    console.log("DB After onBotConnected:", db.prepare("SELECT id, bot_id, login, password FROM accounts WHERE id='Apex_DATAFEED'").get());

    process.exit(0);

}, 1000);
