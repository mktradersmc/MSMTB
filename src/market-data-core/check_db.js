const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../market_data.db');
console.log(`Open DB: ${dbPath}`);
const db = new Database(dbPath, { readonly: false });

const anchors = db.prepare("SELECT * FROM broker_time_anchors ORDER BY anchor_time DESC").all();
console.log(`Total anchors: ${anchors.length}`);
console.log("Top 10 most recent:");
console.table(anchors.slice(0, 10));

console.log("Oldest 10:");
console.table(anchors.slice(-10));

console.log("Clearing all anchors to recover...");
const res = db.prepare("DELETE FROM broker_time_anchors").run();
console.log(`Deleted ${res.changes} anchors.`);

db.close();
