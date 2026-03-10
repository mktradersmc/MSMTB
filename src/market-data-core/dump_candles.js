const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'db/symbols/EURUSD.db');
const fs = require('fs');

if (!fs.existsSync(dbPath)) {
    console.log("DB not found: " + dbPath);
    process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

// We want candles around 2026-03-06 (Friday) to 2026-03-09 (Monday)
const startMs = new Date('2026-03-06T15:00:00Z').getTime();
const endMs = new Date('2026-03-09T05:00:00Z').getTime();

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables:", tables.map(t => t.name));

    // Fallback to checking how it's named. Usually candles_H1
    const candles = db.prepare("SELECT * FROM candles_H1 WHERE time >= ? AND time <= ? ORDER BY time ASC").all(startMs, endMs);

    console.log(`Found ${candles.length} candles in H1.`);

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
