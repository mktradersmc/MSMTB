const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'market_data.db');
const db = new Database(dbPath, { readonly: false });

console.log("Purging corrupted candle tables...");

try {
    const symbolDbDir = path.resolve(__dirname, '../../symbol_dbs');
    const fs = require('fs');
    if (fs.existsSync(symbolDbDir)) {
        const files = fs.readdirSync(symbolDbDir);
        for (const file of files) {
            if (file.endsWith('.db')) {
                const sdbPath = path.join(symbolDbDir, file);
                const sdb = new Database(sdbPath, { readonly: false });
                const tables = sdb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candles_%'").all();

                let deletedCount = 0;
                sdb.transaction(() => {
                    for (const t of tables) {
                        sdb.prepare(`DROP TABLE IF EXISTS ${t.name}`).run();
                        deletedCount++;
                    }
                })();

                console.log(`Dropped ${deletedCount} candle tables from ${file}`);
                sdb.close();
            }
        }
    }
} catch (e) {
    console.error("Failed to purge symbol DBs", e);
}

// Fallback if they are in the main market_data.db
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candles_%'").all();
    if (tables.length > 0) {
        db.transaction(() => {
            for (const t of tables) {
                db.prepare(`DROP TABLE IF EXISTS ${t.name}`).run();
            }
        })();
        console.log(`Dropped ${tables.length} legacy candle tables from main DB.`);
    }
} catch (e) { }

console.log("Cleanup complete!");
db.close();
