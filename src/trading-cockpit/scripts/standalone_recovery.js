
const fs = require('fs');
const path = require('path');
// const { v4: uuidv4 } = require('uuid'); // Removed due to ESM issues

// Polyfill UUID if missing
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const INSTANCES_ROOT = 'C:\\Trading\\Instances';
const BROKERS_FILE = path.join(__dirname, '../data/brokers.json');
const ACCOUNTS_FILE = path.join(__dirname, '../data/accounts.json');

async function run() {
    console.log(`[Recovery] Starting Standalone Recovery...`);
    console.log(`[Recovery] Instances: ${INSTANCES_ROOT}`);
    console.log(`[Recovery] Brokers: ${BROKERS_FILE}`);

    if (!fs.existsSync(BROKERS_FILE)) {
        console.error("Brokers file not found!");
        return;
    }

    const brokers = JSON.parse(fs.readFileSync(BROKERS_FILE, 'utf-8'));
    const instances = fs.readdirSync(INSTANCES_ROOT, { withFileTypes: true });

    // Load existing to preserve IDs if possible (though we'll likely overwrite if missing)
    let existingAccounts = [];
    if (fs.existsSync(ACCOUNTS_FILE)) {
        existingAccounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
    }

    const recovered = [];

    for (const dirent of instances) {
        if (!dirent.isDirectory()) continue;
        if (!dirent.name.startsWith('MT_')) continue;

        const instancePath = path.join(INSTANCES_ROOT, dirent.name);
        const startupIniPath = path.join(instancePath, 'startup.ini');

        try {
            if (!fs.existsSync(startupIniPath)) {
                console.warn(`[Skip] No startup.ini in ${dirent.name}`);
                continue;
            }

            const iniContent = fs.readFileSync(startupIniPath, 'utf-8');
            const login = parseIniValue(iniContent, 'Login');
            const password = parseIniValue(iniContent, 'Password');
            const server = parseIniValue(iniContent, 'Server');
            const expert = parseIniValue(iniContent, 'Expert');

            if (!login) {
                console.warn(`[Skip] No Login in ${dirent.name}`);
                continue;
            }

            // Logic to find Broker Shorthand
            // Format: MT_Shorthand_Login
            // But login might be part of the last segment.

            // Heuristic: Iterate all brokers and check if dirent.name contains their shorthand
            // Sort brokers by shorthand length desc to match longest first (e.g. "FTMO Demo" vs "FTMO")
            // Actually shorthand is usually simple.

            // Let's try to parse strict format first: MT_{Shorthand}_{Login}
            // But underscores in shorthand?

            // Robust method: match Broker Shorthand in folder name
            let matchedBroker = null;

            // Normalize shorthand for comparison (remove spaces)
            const candidates = brokers.filter(b => {
                const simple = (b.shorthand || b.name).replace(/\s+/g, '');
                return dirent.name.includes(`_${simple}_`) || dirent.name.includes(`MT_${simple}`);
            });

            // If multiple, pick the one that matches best?
            if (candidates.length > 0) {
                // If only 1, great.
                matchedBroker = candidates[0];
                // If multiple, maybe check exact match?
                // Example: MT_FTMO_123456 -> FTMO matches.
            }

            if (!matchedBroker) {
                console.warn(`[Skip] Unknown Broker Shorthand for ${dirent.name}`);
                continue;
            }

            // Check if already exists in recovered (or existing)
            let acc = existingAccounts.find(a => a.login === login && a.brokerId === matchedBroker.id);
            if (!acc) {
                acc = {
                    id: generateUUID(),
                    botId: `${matchedBroker.shorthand.replace(/\s+/g, '')}_${login}${expert === 'DatafeedExpert' ? '_DATAFEED' : ''}`,
                    brokerId: matchedBroker.id,
                    login: login,
                    password: password || '',
                    server: server || matchedBroker.servers[0] || 'Unknown',
                    accountType: expert === 'DatafeedExpert' ? 'DATAFEED' : 'TRADING',
                    isTest: false, // Default to false unless we know?
                    status: 'STOPPED',
                    pid: 0,
                    instancePath: instancePath,
                    isDatafeed: expert === 'DatafeedExpert'
                };
                console.log(`[Recovered] New: ${acc.botId} (${matchedBroker.name})`);
            } else {
                console.log(`[Exists] ${acc.botId}`);
                // Update path
                acc.instancePath = instancePath;
                acc.password = password || acc.password; // Sync password
            }

            // Add to recovered list (deduplicated)
            if (!recovered.find(r => r.id === acc.id)) {
                recovered.push(acc);
            }
        } catch (e) {
            console.error(`Error processing ${dirent.name}:`, e.message);
        }
    }

    console.log(`[Result] Writing ${recovered.length} accounts to ${ACCOUNTS_FILE}`);
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(recovered, null, 2));
}

function parseIniValue(content, key) {
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}

run();
