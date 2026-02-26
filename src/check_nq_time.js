const db = require('better-sqlite3')('market-data-core/db/symbols/NQ.db');
const m5 = db.prepare('SELECT time, datetime(time/1000, "unixepoch", "localtime") as local_time, open, high, low, close, is_complete FROM candles_M5 ORDER BY time DESC LIMIT 10').all();
const h4 = db.prepare('SELECT time, datetime(time/1000, "unixepoch", "localtime") as local_time, open, high, low, close, is_complete FROM candles_H4 ORDER BY time DESC LIMIT 10').all();

console.log("--- M5 Last 10 Candles ---");
console.table(m5);
console.log("\n--- H4 Last 10 Candles ---");
console.table(h4);
