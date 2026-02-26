const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'market_data.db');
const db = new Database(dbPath);

console.log("DB PATH:", dbPath);

try {
    const accounts = db.prepare("SELECT bot_id, broker_id, login, is_test, account_type, is_datafeed, platform FROM accounts WHERE login = 'Sim101' OR login LIKE 'FTMO%'").all();
    console.log("ACCOUNTS:", JSON.stringify(accounts, null, 2));
} catch (e) {
    console.error("Query Error", e);
}
