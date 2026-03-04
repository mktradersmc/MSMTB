// 20260304120000_init_trade_sequence.js
const path = require('path');
const fs = require('fs');

let Database;
try {
    Database = require(path.resolve(__dirname, '../../components/market-data-core/node_modules/better-sqlite3'));
} catch (e) {
    try {
        Database = require(path.resolve(__dirname, '../../src/market-data-core/node_modules/better-sqlite3'));
    } catch (e2) {
        console.error("[HOOK ERROR] better-sqlite3 module not found.");
        process.exit(1);
    }
}

console.log("[HOOK] Running init_trade_sequence hook...");

function getDbPath(basePath) {
    const systemJsonPath = path.join(basePath, 'data', 'system.json');
    let dbFilePath = null;
    if (fs.existsSync(systemJsonPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(systemJsonPath, 'utf8'));
            if (config.marketDbPath) {
                dbFilePath = path.resolve(basePath, config.marketDbPath);
            }
        } catch (e) {
            console.warn(`[HOOK] Could not read ${systemJsonPath}:`, e.message);
        }
    }
    if (!dbFilePath) {
        dbFilePath = path.join(basePath, 'market_data.db');
    }
    return dbFilePath;
}

const prodBasePath = path.resolve(__dirname, '../../components/market-data-core');
const devBasePath = path.resolve(__dirname, '../../src/market-data-core');
const basePath = fs.existsSync(prodBasePath) ? prodBasePath : devBasePath;

const dbPath = getDbPath(basePath);

if (!fs.existsSync(dbPath)) {
    console.error(`[HOOK ERROR] Database not found at ${dbPath}`);
    process.exit(0); // Safely exit if DB isn't provisioned yet
}

const db = new Database(dbPath);

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS global_settings (
            key_name TEXT PRIMARY KEY,
            key_value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO global_settings (key_name, key_value, updated_at) 
        VALUES ('TRADE_SEQUENCE', '100000', CURRENT_TIMESTAMP)
    `);

    const info = stmt.run();
    if (info.changes > 0) {
        console.log(`[HOOK] SUCCESS: TRADE_SEQUENCE initialized to 100000.`);
    } else {
        console.log(`[HOOK] SKIPPED: TRADE_SEQUENCE already exists. Keeping current values.`);
    }
} catch (err) {
    console.error('[HOOK ERROR] Error setting initial sequence:', err.message);
    process.exit(1);
} finally {
    db.close();
}
