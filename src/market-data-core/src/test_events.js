const db = require('./services/DatabaseService');

const events = db.marketDb.prepare("SELECT * FROM economic_calendar WHERE time_label != 'All Day' AND time_label != '' AND time_label != 'Day 1' LIMIT 5").all();
console.log(events.map(e => ({
    name: e.name,
    dateline: e.timestamp,
    computed_utc: new Date(e.timestamp * 1000).toISOString(),
    time_label: e.time_label
})));

process.exit(0);
