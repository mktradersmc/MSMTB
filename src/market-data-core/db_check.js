const Database = require('better-sqlite3');
const path = require('path');
const dbDir = path.join(__dirname, 'db/symbols');
const fs = require('fs');

const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.db'));
if (files.length === 0) {
    console.log("No DB files found.");
    process.exit(0);
}

const db = new Database(path.join(dbDir, files[0]));
console.log(`Checking ${files[0]}...`);

try {
    const tableInfo = db.prepare("PRAGMA table_info(candles_M1)").all();
    console.log("Schema candles_M1:", JSON.stringify(tableInfo, null, 2));

    const allRows = db.prepare("SELECT count(*) as cnt FROM candles_M1").get();
    const nullRows = db.prepare("SELECT count(*) as cnt FROM candles_M1 WHERE binary_payload IS NULL").get();
    const notNullRows = db.prepare("SELECT count(*) as cnt FROM candles_M1 WHERE binary_payload IS NOT NULL").get();

    console.log(`Total rows: ${allRows.cnt}`);
    console.log(`Rows with NULL binary_payload: ${nullRows.cnt}`);
    console.log(`Rows with BINARY_PAYLOAD PRESENT: ${notNullRows.cnt}`);

    if (notNullRows.cnt > 0) {
        const sample = db.prepare("SELECT time, open, hex(binary_payload) as hex_payload FROM candles_M1 WHERE binary_payload IS NOT NULL ORDER BY time DESC LIMIT 1").get();
        console.log("Sample binary payload (HEX):", sample);
    }
} catch(e) {
    console.error(e);
}
