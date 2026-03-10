const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'db/symbols/EURUSD.db');

const db = new Database(dbPath, { readonly: true });

// We want daily candles around 2026-03-05 to 2026-03-11
const startMs = new Date('2026-03-01T00:00:00Z').getTime();
const endMs = new Date('2026-03-12T00:00:00Z').getTime();

try {
    const candles = db.prepare("SELECT * FROM candles_D1 WHERE time >= ? AND time <= ? ORDER BY time ASC").all(startMs, endMs);
    console.log(`Found ${candles.length} candles in D1.`);

    const output = candles.map(c => {
        const d = new Date(c.time);
        return {
            timeStr: d.toISOString(),
            time: c.time,
            close: c.close
        };
    });

    console.table(output);
} catch (e) {
    console.log("Error querying", e);
}

db.close();
