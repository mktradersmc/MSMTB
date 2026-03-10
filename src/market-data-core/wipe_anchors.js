const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'market_data.db');
const db = new Database(dbPath);
db.prepare('DELETE FROM broker_time_anchors').run();
console.log('Successfully wiped broker_time_anchors from ' + dbPath);
