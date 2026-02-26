const db = require('better-sqlite3')('c:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/market_data.db');

console.log("=== RECENT ACTIVE TRADES ===");
const active = db.prepare("SELECT id, status, entry_price FROM active_trades ORDER BY updated_at DESC LIMIT 5").all();
console.table(active);

console.log("=== RECENT BROKER EXECUTIONS ===");
const execs = db.prepare("SELECT id, master_trade_id, bot_id, status, magic_number, realized_pl, unrealized_pl FROM broker_executions ORDER BY updated_at DESC LIMIT 5").all();
console.table(execs);
