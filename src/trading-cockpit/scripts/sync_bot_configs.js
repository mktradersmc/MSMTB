
const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.join(__dirname, '../data/accounts.json');

console.log(`[SyncConfig] Reading accounts from: ${ACCOUNTS_FILE}`);

if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error("Accounts file not found!");
    process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));

accounts.forEach(acc => {
    if (!acc.instancePath || !acc.botId) {
        console.warn(`[Skip] Account ${acc.login} missing instancePath or botId`);
        return;
    }

    const propFile = path.join(acc.instancePath, 'MQL5', 'Files', 'bot_properties.txt');

    // Check if instance exists
    if (!fs.existsSync(acc.instancePath)) {
        console.warn(`[Skip] Instance path not found: ${acc.instancePath}`);
        return;
    }

    // Ensure directory exists (it should)
    const dir = path.dirname(propFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Generate Content (Matching deployer.ts logic)
    let content = `botId=${acc.botId}\n`;
    content += `apiKey=secret123\n`;
    content += `communicationMode=PIPE\n`;
    content += `pollInterval=15\n`; // High Frequency Poll (15ms)

    // Write
    try {
        fs.writeFileSync(propFile, content, 'utf8');
        console.log(`[Update] Updated config for ${acc.login} (${acc.botId})`);
    } catch (e) {
        console.error(`[Error] Failed to write ${propFile}:`, e);
    }
});

console.log("[SyncConfig] Completed.");
