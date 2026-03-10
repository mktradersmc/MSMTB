const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'data', 'symbols', 'EURUSD.db');
const db = new Database(dbPath, { readonly: true });

console.log("Detecting DST Profile from local DB History (Year 2026)...");

// Since the user just downloaded 2026 data, let's look at 2026.
// 2026:
// Winter: Jan/Feb. Let's pick Friday Feb 13, 2026.
// Mid-March (Between US and EU DST):
// US DST starts March 8, 2026.
// EU DST starts March 29, 2026.
// Pick Friday, March 13, 2026 or March 20, 2026. Let's use March 20, 2026.
// Summer: April. Pick Friday, April 10, 2026.

const queries = [
    { name: "Winter", tMax: Math.floor(Date.UTC(2026, 1, 14, 6, 0, 0) / 1000), trueUtcClose: Math.floor(Date.UTC(2026, 1, 13, 21, 0, 0) / 1000) }, // Feb 13 -> 22:00 UTC Close (17:00 EST) -> Last candle opens 21:00 UTC
    { name: "Mid-March", tMax: Math.floor(Date.UTC(2026, 2, 21, 6, 0, 0) / 1000), trueUtcClose: Math.floor(Date.UTC(2026, 2, 20, 20, 0, 0) / 1000) }, // Mar 20 -> 21:00 UTC Close (17:00 EDT) -> Last candle opens 20:00 UTC
    { name: "Summer", tMax: Math.floor(Date.UTC(2026, 3, 11, 6, 0, 0) / 1000), trueUtcClose: Math.floor(Date.UTC(2026, 3, 10, 20, 0, 0) / 1000) }, // Apr 10 -> 21:00 UTC Close (17:00 EDT) -> Last candle opens 20:00 UTC
];

let offsets = [];
for (let q of queries) {
    const row = db.prepare("SELECT time FROM candles_H1 WHERE time <= ? ORDER BY time DESC LIMIT 1").get(q.tMax);
    if (row) {
        let brokerSec = row.time;
        // Since the DB currently stores true UTC because the HistoryWorker already converted them?
        // Wait, NO! The user was running with the BROKEN HistoryWorker, or rather, the one that skipped conversion?
        // Let's print out what is actually in the DB.
        console.log(`[${q.name}] Raw Timestamp in DB: ${brokerSec} -> ${new Date(brokerSec * 1000).toISOString()}`);
    } else {
        console.log(`[${q.name}] No data found in DB for this date.`);
        offsets.push(null);
    }
}
