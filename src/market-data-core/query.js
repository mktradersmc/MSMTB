const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'market_data.db');
const db = new Database(dbPath);

console.log("DB PATH:", dbPath);

try {
    const accounts = db.prepare("SELECT bot_id, broker_id, login, is_test FROM accounts").all();
    console.log("ACCOUNTS:", JSON.stringify(accounts, null, 2));

    const mappings = db.prepare("SELECT * FROM asset_mappings").all();
    console.log("MAPPINGS:", JSON.stringify(mappings, null, 2));

    const brokers = db.prepare("SELECT id, shorthand, symbol_mappings FROM brokers").all();
    console.log("BROKERS:", JSON.stringify(brokers, null, 2));
} catch (e) {
    console.error("Query Error", e);
}
