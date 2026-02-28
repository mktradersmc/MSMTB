
import fs from 'fs/promises';
import path from 'path';
import { TradingAccount } from './types';
import { getBrokers, getAccounts, saveAccount } from './data';
import { getSystemConfig } from './deployer';
import { v4 as uuidv4 } from 'uuid';

export async function recoverAccountsFromDisk() {
    const sysConfig = await getSystemConfig();
    const INSTANCES_ROOT = path.join(sysConfig.projectRoot, 'metatrader', 'instances');

    const instances = await fs.readdir(INSTANCES_ROOT, { withFileTypes: true });
    const brokers = await getBrokers();
    const existingAccounts = await getAccounts();
    const recovered: TradingAccount[] = [];

    console.log(`[Recovery] Scanning ${instances.length} items in ${INSTANCES_ROOT}`);

    for (const dirent of instances) {
        if (!dirent.isDirectory()) continue;
        if (!dirent.name.startsWith('MT_')) continue;

        const instancePath = path.join(INSTANCES_ROOT, dirent.name);
        const startupIniPath = path.join(instancePath, 'startup.ini');

        try {
            // 1. Check if startup.ini exists
            await fs.access(startupIniPath);
            const iniContent = await fs.readFile(startupIniPath, 'utf-8');

            // 2. Parse INI
            const login = parseIniValue(iniContent, 'Login');
            const password = parseIniValue(iniContent, 'Password');
            const server = parseIniValue(iniContent, 'Server');
            const expert = parseIniValue(iniContent, 'Expert');

            if (!login || !password || !server) {
                console.warn(`[Recovery] Skipping ${dirent.name}: Missing essential config in startup.ini`);
                continue;
            }

            // 3. Match Broker
            // Folder Format: MT_BrokerShorthand_Login
            // Ex: MT_FTMO_12345
            // Shorthand is between MT_ and _Login
            const parts = dirent.name.split('_');
            if (parts.length < 3) continue;

            const loginFromFolder = parts[parts.length - 1]; // Last part is login
            // Shorthand is everything in between (join back if spaces were removed but we replaced spaces with empty string)
            // But wait, deployer uses: `MT_${broker.shorthand.replace(/\s+/g, '')}_${account.login}`
            // So we can try to match shorthand from brokers list

            const folderShorthand = dirent.name.replace('MT_', '').replace(`_${loginFromFolder}`, '');
            const broker = brokers.find(b => b.shorthand.replace(/\s+/g, '') === folderShorthand);

            if (!broker) {
                console.warn(`[Recovery] Skipping ${dirent.name}: Could not match broker shorthand '${folderShorthand}'`);
                continue;
            }

            // 4. Check matching existing account
            const exists = existingAccounts.find(a => a.login === login && a.brokerId === broker.id);
            if (exists) {
                // Update instance path if missing
                if (!exists.instancePath) {
                    exists.instancePath = instancePath;
                    await saveAccount(exists);
                    console.log(`[Recovery] Linked existing account ${login} to path.`);
                }
                continue;
            }

            // 5. Create Object
            const newAccount: TradingAccount = {
                id: uuidv4(), // Generate new ID
                brokerId: broker.id,
                login: login,
                password: password,
                server: server,
                accountType: expert === 'DatafeedExpert' ? 'DATAFEED' : 'TRADING',
                status: 'STOPPED', // Assume stopped, status check will update later
                pid: 0,
                instancePath: instancePath
            };

            recovered.push(newAccount);
            console.log(`[Recovery] Found candidate: ${login} (${broker.name})`);

        } catch (e) {
            console.error(`[Recovery] Error processing ${dirent.name}:`, e);
        }
    }

    // Save all recovered
    for (const acc of recovered) {
        await saveAccount(acc);
    }

    return recovered;
}

function parseIniValue(content: string, key: string): string | null {
    // Simple regex
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}
