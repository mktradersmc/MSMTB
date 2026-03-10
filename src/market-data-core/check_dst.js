const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const eurusdPath = path.join(dataDir, 'EURUSD.db');
const gbpusdPath = path.join(dataDir, 'GBPUSD.db');

if (!fs.existsSync(eurusdPath)) {
    console.log("No EURUSD db found at", eurusdPath);
    process.exit(1);
}

const dbEUR = new Database(eurusdPath);
const dbGBP = new Database(gbpusdPath);

console.log('--- EURUSD H4 ---');
const eurH4 = dbEUR.prepare("SELECT time, high, low FROM candles_H4 ORDER BY time DESC LIMIT 20").all();
eurH4.forEach(c => {
    const d = new Date(c.time);
    console.log(`[${c.time}] ${d.toUTCString()} - H:${c.high}`);
});

console.log('\n--- GBPUSD H4 ---');
const gbpH4 = dbGBP.prepare("SELECT time, high, low FROM candles_H4 ORDER BY time DESC LIMIT 20").all();
gbpH4.forEach(c => {
    const d = new Date(c.time);
    console.log(`[${c.time}] ${d.toUTCString()} - H:${c.high}`);
});
