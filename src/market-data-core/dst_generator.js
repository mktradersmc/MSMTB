const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'market_data.db');
const db = new Database(dbPath, { readonly: false });

console.log("Building single unified European DST (EET) anchor system...");

function getEuDstTransitions(year) {
    // Spring jump happens at 01:00 UTC (last Sunday in March)
    let springMonth = 2; // March (0-indexed)
    let springDate = 31;
    while (springDate > 0) {
        let d = new Date(Date.UTC(year, springMonth, springDate));
        if (d.getUTCDay() === 0) break;
        springDate--;
    }
    let springUtcMs = Date.UTC(year, springMonth, springDate, 1, 0, 0);

    // Fall jump happens at 01:00 UTC (last Sunday in October)
    let fallMonth = 9; // October (0-indexed)
    let fallDate = 31;
    while (fallDate > 0) {
        let d = new Date(Date.UTC(year, fallMonth, fallDate));
        if (d.getUTCDay() === 0) break;
        fallDate--;
    }
    let fallUtcMs = Date.UTC(year, fallMonth, fallDate, 1, 0, 0);

    return [
        { utcTimestampMs: springUtcMs, offsetSec: 10800, type: 'SPRING' }, // UTC+3
        { utcTimestampMs: fallUtcMs, offsetSec: 7200, type: 'FALL' }       // UTC+2
    ];
}

const allTransitions = [];
for (let y = 1999; y <= 2035; y++) {
    allTransitions.push(...getEuDstTransitions(y));
}

db.transaction(() => {
    // Delete old anchors
    db.prepare("DELETE FROM broker_time_anchors").run();

    const insert = db.prepare("INSERT INTO broker_time_anchors (broker_id, anchor_time, offset_sec) VALUES (@broker_id, @anchor_time, @offset_sec)");

    const brokerId = 'DEFAULT_EET';
    insert.run({ broker_id: brokerId, anchor_time: 0, offset_sec: 7200 }); // Base UTC+2

    for (const t of allTransitions) {
        const brokerAnchorTimeSec = Math.floor(t.utcTimestampMs / 1000) + t.offsetSec;
        insert.run({ broker_id: brokerId, anchor_time: brokerAnchorTimeSec, offset_sec: t.offsetSec });
    }
})();

const res = db.prepare("SELECT count(*) as c FROM broker_time_anchors").get();
console.log(`Generated unified EU anchors under 'DEFAULT_EET'. Total entries: ${res.c}`);

db.close();
