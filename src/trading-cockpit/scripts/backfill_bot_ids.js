
const fs = require('fs');
const path = require('path');

// Determine path relative to script location
const ACCOUNTS_FILE = path.join(__dirname, '../data/accounts.json');
const BROKERS_FILE = path.join(__dirname, '../data/brokers.json');

console.log(`[Backfill] Reading accounts from: ${ACCOUNTS_FILE}`);

if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error("Accounts file not found!");
    process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
let brokers = [];
if (fs.existsSync(BROKERS_FILE)) {
    brokers = JSON.parse(fs.readFileSync(BROKERS_FILE, 'utf8'));
}

let modified = false;

accounts.forEach(acc => {
    if (!acc.botId) {
        // Find Broker to get shorthand
        const broker = brokers.find(b => b.id === acc.brokerId);
        let shorthand = "Unknown";

        if (broker && broker.shorthand) {
            shorthand = broker.shorthand.replace(/\s+/g, '');
        } else {
            // Fallback: try to guess from config or just use brokerId if short
            shorthand = acc.brokerId.substring(0, 10).replace(/\s+/g, '');
        }

        let newBotId = `${shorthand}_${acc.login}`;
        if (acc.accountType === 'DATAFEED') newBotId += '_DATAFEED';

        console.log(`[Backfill] Generating botId for ${acc.login}: ${newBotId}`);
        acc.botId = newBotId;
        modified = true;
    }
});

if (modified) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    console.log("[Backfill] Accounts file updated successfully.");
} else {
    console.log("[Backfill] No changes needed.");
}
