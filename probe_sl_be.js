const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'market_data.db');
const db = new Database(dbPath, { readonly: true });

try {
    const rows = db.prepare("SELECT id, master_trade_id, status, sl_at_be FROM broker_executions LIMIT 10").all();
    console.log("DB Executions:", rows);
} catch (e) {
    console.error("Error:", e);
}
db.close();
