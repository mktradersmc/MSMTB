const path = require('path');
const dbFile = path.resolve(__dirname, 'market_data.db');
console.log("Using DB:", dbFile);
const db = require('better-sqlite3')(dbFile);
const rows = db.prepare("SELECT * FROM accounts WHERE account_type = 'DATAFEED'").all();
console.table(rows.map(r => ({ id: r.bot_id, instance: r.instance_path })));
