const db = require('better-sqlite3')('src/market-data-core/database.sqlite');
const rows = db.prepare("SELECT bot_id, instance_path, account_type FROM accounts WHERE account_type = 'DATAFEED'").all();
console.table(rows);
