const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'market_data.db');
const db = new Database(dbPath, { readonly: true });

function getHistoricalOffsets() {
    return db.prepare("SELECT anchor_time, offset_sec FROM broker_time_anchors WHERE broker_id = 'DEFAULT_NY7' ORDER BY anchor_time ASC").all();
}
const offsets = getHistoricalOffsets();

function getOffsetForBrokerTime(brokerSeconds) {
    for (let i = offsets.length - 1; i >= 0; i--) {
        if (brokerSeconds >= offsets[i].anchor_time) {
            return offsets[i].offset_sec;
        }
    }
    return 7200;
}

function convertBrokerToUtc(brokerSeconds) {
    const offsetSec = getOffsetForBrokerTime(brokerSeconds);
    return brokerSeconds - offsetSec;
}

function toUTCString(utcSeconds) {
    return new Date(utcSeconds * 1000).toISOString();
}

// 2026 DST Spring Forward: Sunday, March 8, 2026, 02:00:00 AM NY time (07:00 UTC)
// Let's test Friday 17:00 NY -> 22:00 UTC -> 00:00 Broker (Saturday)
console.log("=== Friday Close ===");
let friBrokerSec = Math.floor(new Date('2026-03-06T23:00:00Z').getTime() / 1000); // Let's guess 23:00 Broker (Friday 23:00 is 21:00 UTC in standard time)
let friUtcSec = convertBrokerToUtc(friBrokerSec);
console.log(`Broker Time: ${new Date(friBrokerSec * 1000).toISOString()} -> UTC Time: ${toUTCString(friUtcSec)} | Offset: ${getOffsetForBrokerTime(friBrokerSec) / 3600}h`);

console.log("\n=== Sunday Open ===");
let sunBrokerSec = Math.floor(new Date('2026-03-09T00:00:00Z').getTime() / 1000); // 00:00 Broker (Monday)
let sunUtcSec = convertBrokerToUtc(sunBrokerSec);
console.log(`Broker Time: ${new Date(sunBrokerSec * 1000).toISOString()} -> UTC Time: ${toUTCString(sunUtcSec)} | Offset: ${getOffsetForBrokerTime(sunBrokerSec) / 3600}h`);

console.log("\n=== Anchors around this time ===");
const anchorAround = offsets.filter(o => o.anchor_time > friBrokerSec - 86400 * 5 && o.anchor_time < sunBrokerSec + 86400 * 5);
console.table(anchorAround.map(a => ({
    broker_time: new Date(a.anchor_time * 1000).toISOString(),
    offset_h: a.offset_sec / 3600
})));

db.close();
