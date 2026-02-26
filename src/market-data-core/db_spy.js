const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'market_data.db');
const db = new Database(dbPath, { readonly: true });

console.log('--- TRADE STATUS SPY ---');
console.log('Listening for changes in broker_executions... Press Ctrl+C to stop.\n');

let lastSeenState = new Map();

setInterval(() => {
    try {
        const rows = db.prepare('SELECT bot_id, master_trade_id, status, error_message, updated_at FROM broker_executions ORDER BY updated_at ASC').all();
        
        for (const row of rows) {
            const key = `${row.bot_id}:${row.master_trade_id}`;
            const currentStateStr = `${row.status}|${row.error_message}`;
            
            if (!lastSeenState.has(key)) {
                console.log(`[NEW] ${key} -> ${row.status} (msg: ${row.error_message})`);
                lastSeenState.set(key, currentStateStr);
            } else if (lastSeenState.get(key) !== currentStateStr) {
                console.log(`[STATE CHANGE] ${key} -> ${row.status} (msg: ${row.error_message}) | PREV: ${lastSeenState.get(key)}`);
                lastSeenState.set(key, currentStateStr);
            }
        }
    } catch (err) {
        console.error("DB Query Error:", err.message);
    }
}, 500);
