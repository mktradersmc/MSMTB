import path from 'path';
import fs from 'fs';

/**
 * Resolves the root directory of the trading-cockpit application.
 * Handles cases where the process is started from:
 * 1. The trading-cockpit directory itself (standard 'npm run dev')
 * 2. The monorepo root (if started via a root script)
 */
export function getCockpitRoot(): string {
    const cwd = process.cwd();

    // Case 1: We are inside trading-cockpit (check for next.config.ts or package.json)
    if (fs.existsSync(path.join(cwd, 'next.config.ts')) || fs.existsSync(path.join(cwd, 'package.json'))) {
        return cwd;
    }

    // Case 2: We are at the monorepo root, so we need to point into src/trading-cockpit
    const nestedPath = path.join(cwd, 'src', 'trading-cockpit');
    if (fs.existsSync(nestedPath)) {
        return nestedPath;
    }

    // Fallback: Return CWD to avoid crashing, but log warning
    console.warn('[PathUtils] Could not determine Cockpit Root. Defaulting to CWD:', cwd);
    return cwd;
}

export const DATA_DIR = path.join(getCockpitRoot(), 'data');
export const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// Resolution for Sibling Projects (market-data-core)
// Assumes standard structure: trading-cockpit and market-data-core are siblings in /components or /src
export function getMarketDataCoreRoot(): string {
    // Navigate up from Cockpit Root -> sibling market-data-core
    return path.resolve(getCockpitRoot(), '..', 'market-data-core');
}
