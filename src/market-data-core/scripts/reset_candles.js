const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('c:/Users/Michael/IdeaProjects/MSMTB/market-data-core/market_data.db');
const db = new Database(dbPath);

console.log(`[Reset] Connected to ${dbPath}`);

try {
    console.log("[Reset] Dropping 'candles' table...");
    db.exec("DROP TABLE IF EXISTS candles");
    console.log("[Reset] Table dropped. Data cleared.");
} catch (e) {
    console.error("[Reset] Error:", e);
}
