import fs from 'fs/promises';
import path from 'path';

import { DATA_DIR, getMarketDataCoreRoot } from './paths';

const SYSTEM_FILE = path.join(DATA_DIR, 'system.json');
const CORE_SYSTEM_FILE = path.join(getMarketDataCoreRoot(), 'data', 'system.json');

export interface SystemData {
    lastDeploymentTime: number;
    MT5_MQL5_DIR?: string;
}

export interface CoreSystemData {
    projectRoot?: string;
    systemUsername?: string;
    systemPassword?: string;
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

// Core Config Additions
export async function getCoreSystemData(): Promise<CoreSystemData | null> {
    try {
        const data = await fs.readFile(CORE_SYSTEM_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null; // or default
    }
}

export async function updateCoreSystemData(updates: Partial<CoreSystemData>): Promise<boolean> {
    try {
        let current: any = {};
        try {
            const data = await fs.readFile(CORE_SYSTEM_FILE, 'utf-8');
            current = JSON.parse(data);
        } catch {}
        
        const next = { ...current, ...updates };
        await fs.writeFile(CORE_SYSTEM_FILE, JSON.stringify(next, null, 4));
        return true;
    } catch (e) {
        console.error("Failed writing core system json", e);
        return false;
    }
}
