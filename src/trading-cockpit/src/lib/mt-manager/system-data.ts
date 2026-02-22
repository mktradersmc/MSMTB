
import fs from 'fs/promises';
import path from 'path';

import { DATA_DIR } from './paths';

const SYSTEM_FILE = path.join(DATA_DIR, 'system.json');

export interface SystemData {
    lastDeploymentTime: number;
    MT5_MQL5_DIR?: string;
}

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readSystemFile(): Promise<SystemData> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(SYSTEM_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { lastDeploymentTime: 0 };
    }
}

async function writeSystemFile(data: SystemData): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(SYSTEM_FILE, JSON.stringify(data, null, 2));
}

export async function getSystemData(): Promise<SystemData> {
    return readSystemFile();
}

export async function updateLastDeploymentTime(timestamp: number = Date.now()): Promise<void> {
    const data = await readSystemFile();
    data.lastDeploymentTime = timestamp;
    await writeSystemFile(data);
}

// Configuration Accessors
export async function getSystemConfig(): Promise<SystemData> {
    return readSystemFile();
}

export async function setSystemConfig(newConfig: Partial<SystemData>): Promise<void> {
    const data = await readSystemFile();
    const updated = { ...data, ...newConfig };
    await writeSystemFile(updated);
}
