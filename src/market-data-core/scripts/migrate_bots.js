const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Paths
const COCKPIT_DATA_DIR = path.resolve(__dirname, '../../trading-cockpit/data');
const BACKEND_DB_PATH = path.resolve(__dirname, '../data/market.db');

console.log(`[Migration] Starting Bot ID Migration...`);
console.log(`[Migration] Cockpit Data: ${COCKPIT_DATA_DIR}`);
console.log(`[Migration] Backend DB:   ${BACKEND_DB_PATH}`);

// 1. Read Accounts from Cockpit
const accountsFile = path.join(COCKPIT_DATA_DIR, 'accounts.json');

if (!fs.existsSync(accountsFile)) {
    console.error(`[Migration] Error: accounts.json not found at ${accountsFile}`);
    process.exit(1);
}

let accounts = [];
try {
    const raw = fs.readFileSync(accountsFile, 'utf-8');
    accounts = JSON.parse(raw);
    console.log(`[Migration] Found ${accounts.length} accounts in Cockpit.`);
} catch (e) {
    console.error(`[Migration] Error reading accounts.json`, e);
    process.exit(1);
}

// Filter Valid Trading Accounts (exclude Datafeed if they are stored there, although App says separate)
// The user said: "And we must store the Bot IDs of the trading accounts... Datafeed bots we recognize by suffix"
// So we just take ALL accounts that are NOT datafeed?
// Or just ALL accounts, and let SyncManager classify them?
// SyncManager splits them into `datafeed_bots` and `trading_bots`.
// Let's iterate and split them here too.

const tradingBots = new Set();
const datafeedBots = new Set();

accounts.forEach(acc => {
    // Check ID or AccountType
    // types.ts says: accountType: 'TRADING' | 'DATAFEED'
    const isDatafeed = (acc.accountType === 'DATAFEED') || (acc.id && acc.id.includes('_DATAFEED'));

    if (acc.id) {
        if (isDatafeed) {
            datafeedBots.add(acc.id);
        } else {
            tradingBots.add(acc.id);
        }
    }
});

console.log(`[Migration] Extracted: ${tradingBots.size} Trading Bots, ${datafeedBots.size} Datafeed Bots.`);

// 2. Update Backend DB
const dbDir = path.dirname(BACKEND_DB_PATH);
if (!fs.existsSync(dbDir)) {
    console.log(`[Migration] Creating DB Directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(BACKEND_DB_PATH);

// Initialize DB if fresh
db.exec(`
   CREATE TABLE IF NOT EXISTS config (
       key TEXT PRIMARY KEY,
       value TEXT
   );
`);

// Helper to get/set config
function getConfig(key) {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : [];
}

function setConfig(key, value) {
    db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

// 2a. Update Trading Bots
const existingTrading = new Set(getConfig('trading_bots'));
let addedTrading = 0;
tradingBots.forEach(id => {
    if (!existingTrading.has(id)) {
        existingTrading.add(id);
        addedTrading++;
    }
});
setConfig('trading_bots', Array.from(existingTrading));
console.log(`[Migration] Updated 'trading_bots': ${existingTrading.size} total (Added ${addedTrading})`);

// 2b. Update Datafeed Bots (Just in case)
const existingDatafeed = new Set(getConfig('datafeed_bots'));
let addedDatafeed = 0;
datafeedBots.forEach(id => {
    if (!existingDatafeed.has(id)) {
        existingDatafeed.add(id);
        addedDatafeed++;
    }
});
setConfig('datafeed_bots', Array.from(existingDatafeed));
console.log(`[Migration] Updated 'datafeed_bots': ${existingDatafeed.size} total (Added ${addedDatafeed})`);

console.log(`[Migration] Success.`);
