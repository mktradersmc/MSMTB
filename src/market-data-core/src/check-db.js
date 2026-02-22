const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'market_data.db');
console.log(`Checking DB at: ${dbPath}`);

const db = new Database(dbPath);

const symbol = 'EURUSD';
const tf = 'M5';

try {
    const row = db.prepare('SELECT count(*) as count, min(time) as minTime, max(time) as maxTime FROM candles WHERE symbol = ? AND timeframe = ?').get(symbol, tf);
    console.log(`[${symbol} ${tf}] Count: ${row.count}`);
    console.log(`Min Time: ${row.minTime} (${new Date(row.minTime).toISOString()})`);
    console.log(`Max Time: ${row.maxTime} (${new Date(row.maxTime).toISOString()})`);
} catch (e) {
    console.error("Error querying DB:", e);
}
