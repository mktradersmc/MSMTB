const Database = require('better-sqlite3');
const path = require('path');

// Relative path from src/market-data-core
const dbPath = './data/market_data.db';
console.log("Opening DB:", path.resolve(dbPath));

const db = new Database(dbPath);

try {
    console.log("Clearing active_trades...");
    db.prepare("DELETE FROM active_trades").run();

    console.log("Clearing broker_executions...");
    db.prepare("DELETE FROM broker_executions").run();

    console.log("Vacuuming...");
    db.exec("VACUUM");

    console.log("✅ Database Cleanup Complete.");
} catch (e) {
    console.error("❌ Error clearing DB:", e);
} finally {
    db.close();
}
