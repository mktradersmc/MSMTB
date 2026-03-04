const path = require('path');
const fs = require('fs');

let Database;
try {
    Database = require(path.resolve(__dirname, '../components/market-data-core/node_modules/better-sqlite3'));
} catch (e) {
    try {
        Database = require(path.resolve(__dirname, '../src/market-data-core/node_modules/better-sqlite3'));
    } catch (e2) {
        console.error("[set-sequence] Error: better-sqlite3 module not found.");
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Usage: node set-sequence.js <START_VALUE>');
    console.error('Example: node set-sequence.js 100000');
    process.exit(1);
}

const startValue = parseInt(args[0], 10);
if (isNaN(startValue)) {
    console.error('Error: START_VALUE must be a valid number.');
    process.exit(1);
}

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
            console.warn(`[set-sequence] Could not read ${systemJsonPath}:`, e.message);
        }
    }
    if (!dbFilePath) {
        dbFilePath = path.join(basePath, 'market_data.db');
    }
    return dbFilePath;
}

const prodBasePath = path.resolve(__dirname, '../components/market-data-core');
const devBasePath = path.resolve(__dirname, '../src/market-data-core');

const basePathsToProcess = [];
if (fs.existsSync(prodBasePath)) basePathsToProcess.push(prodBasePath);
if (fs.existsSync(devBasePath)) basePathsToProcess.push(devBasePath);

if (basePathsToProcess.length === 0) {
    console.error("[set-sequence] Error: Could not find market-data-core in src/ or components/.");
    process.exit(1);
}

for (const basePath of basePathsToProcess) {
    const dbPath = getDbPath(basePath);

    if (!fs.existsSync(dbPath)) {
        console.warn(`[set-sequence] Database not found at ${dbPath}. Creating new file.`);
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`[set-sequence] Using database: ${dbPath}`);
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
            INSERT OR REPLACE INTO global_settings (key_name, key_value, updated_at) 
            VALUES ('TRADE_SEQUENCE', ?, CURRENT_TIMESTAMP)
        `);

        stmt.run(startValue.toString());
        console.log(`[set-sequence] SUCCESS: TRADE_SEQUENCE explicitly set to ${startValue} in ${basePath}`);
    } catch (err) {
        console.error(`[set-sequence] Error updating ${dbPath}:`, err.message);
    } finally {
        db.close();
    }
}
