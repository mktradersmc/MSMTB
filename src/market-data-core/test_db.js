const Database = require('better-sqlite3');
const db = new Database('C:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/market_data.db');

console.log('--- ACCOUNTS ---');
const accounts = db.prepare("SELECT * FROM accounts WHERE bot_id LIKE '%_DATAFEED%'").all();
console.table(accounts);

console.log('--- BROKERS ---');
const brokers = db.prepare("SELECT id, name, type, timezone FROM brokers WHERE id LIKE '%_DATAFEED%' OR name LIKE '%_DATAFEED%'").all();
console.table(brokers);
