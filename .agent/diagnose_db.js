
const Database = require('better-sqlite3');
const path = require('path');

// Hardcoded path based on project structure
const dbPath = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\db\\market_data.db'; // Guessing standard path? 
// Config usually says config.DB_MARKET_PATH. 
// In Service it was `require('../config')`.
// Let's assume `db/market.db` relative to project root.

// Try to find the DB file first
const fs = require('fs');
let targetPath = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\data\\market.db'; // Common default
if (!fs.existsSync(targetPath)) {
    targetPath = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\market.db';
}
// Actually, let's look at DatabaseService.js to see where it points?
// It uses `config.DB_MARKET_PATH`.
// I'll try to require config.
try {
    const config = require('C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\market-data-core\\src\\config.js');
    targetPath = config.DB_MARKET_PATH;
} catch (e) {
    console.log("Could not load config. Using default guess.");
    targetPath = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\data\\market.db'; // Adjust if needed
}

console.log(`Open DB: ${targetPath}`);

try {
    const db = new Database(targetPath);

    console.log("Checking for duplicates...");
    const dupes = db.prepare(`
        SELECT symbol, timeframe, time, COUNT(*) as c 
        FROM candles 
        GROUP BY symbol, timeframe, time 
        HAVING c > 1 
        LIMIT 20
    `).all();

    if (dupes.length > 0) {
        console.log(`❌ FOUND DUPLICATES! (Showing first ${dupes.length})`);
        dupes.forEach(d => {
            console.log(`${d.symbol} ${d.timeframe} ${new Date(d.time).toISOString()} -> Count: ${d.c}`);
        });

        // Count total Duplicates
        const totalDupes = db.prepare(`
            SELECT COUNT(*) as count FROM (
                SELECT symbol, timeframe, time
                FROM candles 
                GROUP BY symbol, timeframe, time 
                HAVING COUNT(*) > 1 
            )
        `).get();
        console.log(`Total Unique Candles with Duplicates: ${totalDupes.count}`);

    } else {
        console.log("✅ No duplicates found. The Unique Constraint seems to hold (or data is clean).");
    }

    // Check Schema
    const schema = db.pragma('table_info(candles)');
    console.log("Schema:", schema);

    // Check Indexes
    const indexes = db.prepare("PRAGMA index_list('candles')").all();
    console.log("Indexes:", indexes);

    indexes.forEach(idx => {
        const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
        console.log(`Index ${idx.name}:`, info);
    });

} catch (err) {
    console.error("DB Error:", err);
}
