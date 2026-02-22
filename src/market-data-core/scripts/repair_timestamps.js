const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SYMBOLS_DB_DIR = path.join(__dirname, '../db/symbols');

console.log(`[Repair] Starting Timestamp Repair in: ${SYMBOLS_DB_DIR}`);

if (!fs.existsSync(SYMBOLS_DB_DIR)) {
    console.error(`[Repair] Directory not found!`);
    process.exit(1);
}

const files = fs.readdirSync(SYMBOLS_DB_DIR).filter(f => f.endsWith('.db'));
console.log(`[Repair] Found ${files.length} symbol databases.`);

files.forEach(file => {
    const dbPath = path.join(SYMBOLS_DB_DIR, file);
    const symbol = file.replace('.db', '');
    try {
        const db = new Database(dbPath);

        // 1. Get Candle Tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candles_%'").all();

        db.transaction(() => {
            tables.forEach(table => {
                let totalFixed = 0;
                let totalDeleted = 0;

                // Get all bad rows first
                const badRows = db.prepare(`SELECT time FROM ${table.name} WHERE time < 10000000000`).all();

                badRows.forEach(row => {
                    const oldTime = row.time;
                    const newTime = oldTime * 1000;

                    // Check if target exists
                    const exists = db.prepare(`SELECT 1 FROM ${table.name} WHERE time = ?`).get(newTime);

                    if (exists) {
                        // Collision: Valid data exists. Delete the bad "Seconds" row.
                        db.prepare(`DELETE FROM ${table.name} WHERE time = ?`).run(oldTime);
                        totalDeleted++;
                    } else {
                        // Safe to Update
                        db.prepare(`UPDATE ${table.name} SET time = ? WHERE time = ?`).run(newTime, oldTime);
                        totalFixed++;
                    }
                });

                if (badRows.length > 0) {
                    console.log(`[Repair] ${symbol} ${table.name}: Converted ${totalFixed}, Deleted ${totalDeleted} duplicates.`);
                }
            });

            // 2. Fix Session Records if exists
            const hasSessions = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session_records'").get();
            if (hasSessions) {
                try {
                    const infoStart = db.prepare(`UPDATE session_records SET start_time = start_time * 1000 WHERE start_time < 10000000000`).run();
                    const infoEnd = db.prepare(`UPDATE session_records SET end_time = end_time * 1000 WHERE end_time < 10000000000`).run();
                    if (infoStart.changes > 0 || infoEnd.changes > 0) {
                        console.log(`[Repair] ${symbol} session_records: Fixed ${infoStart.changes} starts, ${infoEnd.changes} ends.`);
                    }
                } catch (e) { console.error(`[Repair] ${symbol} session fix warning: ${e.message}`); }
            }
        })();

        db.close();
    } catch (e) {
        console.error(`[Repair] Failed to process ${file}: ${e.message}`);
    }
});

console.log("[Repair] Complete.");
