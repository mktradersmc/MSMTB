const Database = require('better-sqlite3');
const db = new Database('./db/market_data_v3.db');
db.prepare('DELETE FROM broker_time_anchors').run();
console.log('Successfully wiped broker_time_anchors for a clean restart!');
