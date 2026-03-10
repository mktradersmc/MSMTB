const DatabaseService = require('./src/services/DatabaseService');

console.log("Testing Auto-Bootstrap...");
const dbService = new DatabaseService();

// Delete everything to force bootstrap
console.log("Dropping existing anchors...");
dbService.marketDb.prepare("DELETE FROM broker_time_anchors").run();

console.log("Triggering init manually again to simulate restart...");
dbService._initDefaultEETAnchors();

const count = dbService.marketDb.prepare("SELECT count(*) as c FROM broker_time_anchors").get().c;
console.log("Total anchors after bootstrap:", count);
