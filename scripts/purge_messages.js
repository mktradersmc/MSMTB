const dbService = require('../src/market-data-core/src/services/DatabaseService');

console.log("Purging Pending Commands...");
try {
    const info = dbService.tradesDb.prepare("UPDATE messages SET isActive = 0, isProcessed = 1 WHERE isProcessed = 0").run();
    console.log(`Updated ${info.changes} pending messages to Processed/Inactive.`);
} catch (e) {
    console.error("Error:", e);
}
console.log("Done.");
