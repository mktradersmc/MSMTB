import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

import { getMarketDataCoreRoot } from './paths';

const HUB_DIR = getMarketDataCoreRoot();
const CONFIG_FILE = path.join(HUB_DIR, 'config.properties');
const RESTART_SCRIPT = path.join(HUB_DIR, 'restart_hub.bat');

export async function updateHubConfig(instancePath: string): Promise<void> {
    const mqlFilesPath = path.join(instancePath, 'MQL5', 'Files');
    const content = `exchangePath=${mqlFilesPath}\r\n`; // Ensure Windows line endings

    try {
        await fs.writeFile(CONFIG_FILE, content, 'utf-8');
        console.log(`Updated Hub Config to: ${mqlFilesPath}`);
    } catch (error) {
        console.error('Failed to update Hub config:', error);
        throw error;
    }
}

export async function restartHub(): Promise<void> {
    console.log('Restarting Communication Hub...');

    // Execute the batch script detatched so it doesn't block
    const child = exec(`"${RESTART_SCRIPT}"`, {
        cwd: HUB_DIR,
        windowsHide: false // We might want to see the window
    });

    child.unref(); // Allow Node process to exit independently if needed
}
