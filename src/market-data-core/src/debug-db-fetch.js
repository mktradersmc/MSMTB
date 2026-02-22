const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'market_data.db');
const db = new Database(dbPath);
const symbol = 'EURUSD';
const tf = 'M5';

function getHistory(limit, to = null) {
    let sql = `SELECT * FROM candles WHERE symbol = ? AND timeframe = ?`;
    const params = [symbol, tf];

    if (to) {
        sql += ` AND time < ?`;
        params.push(to);
    }

    sql += ` ORDER BY time DESC LIMIT ?`;
    params.push(limit);

    // Mimic Service: Return ascending
    return db.prepare(sql).all(...params).reverse();
}

console.log("=== Page 1: Latest 1000 ===");
const page1 = getHistory(1000, null);
console.log(`Page 1 Count: ${page1.length}`);
if (page1.length > 0) {
    console.log(`Range: ${new Date(page1[0].time).toISOString()} -> ${new Date(page1[page1.length - 1].time).toISOString()}`);

    const oldestTime = page1[0].time;
    console.log("\n=== Page 2: Older than " + oldestTime + " (" + new Date(oldestTime).toISOString() + ") ===");

    // Simulate scrolling back
    const page2 = getHistory(1000, oldestTime);
    console.log(`Page 2 Count: ${page2.length}`);
    if (page2.length > 0) {
        console.log(`Range: ${new Date(page2[0].time).toISOString()} -> ${new Date(page2[page2.length - 1].time).toISOString()}`);
    } else {
        console.log("Page 2 EMPTY!");
    }
} else {
    console.log("Page 1 EMPTY!");
}
