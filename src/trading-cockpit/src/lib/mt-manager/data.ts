// --- DATA LAYER (API CLIENT) ---
// Migrated from FS to SQLite Backend (Port 3005)

import { Broker, TradingAccount } from './types';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

// Dynamically determine SSL config from system.json (Node.js Server Side Execution)
let useSSL = false;
try {
    const configPath = path.resolve(process.cwd(), '../market-data-core/data/system.json');
    if (fs.existsSync(configPath)) {
        const sysConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        useSSL = sysConfig?.backend?.useSSL !== false;
    }
} catch (e) {
    console.warn('[Data Client] Failed to read system.json for SSL flag, defaulting to false', e.message);
}

// USE IPv4 EXPLICITLY to avoid Windows localhost/IPv6 lag
const API_HOST = '127.0.0.1';
const API_PORT = 3005;
const API_BASE = useSSL ? `https://${API_HOST}:${API_PORT}/api` : `http://${API_HOST}:${API_PORT}/api`;

// ✅ PERFORMANCE FIX: Connection Pooling with Keep-Alive
// Reuses TCP connections instead of creating new ones for each request
// Reduces latency by 50-80% (eliminates TCP handshake overhead)
const AgentModule = useSSL ? https : http;
const agentOptions: any = {
    keepAlive: true,           // Reuse connections
    keepAliveMsecs: 30000,     // Keep connections alive for 30s
    maxSockets: 10,            // Max 10 concurrent connections
    maxFreeSockets: 5,         // Keep 5 idle connections ready
    timeout: 2000              // Socket timeout 2s (reduced from 5s)
};

// If SSL, ignore self-signed certificate issues for the internal loopback proxy
if (useSSL) {
    agentOptions.rejectUnauthorized = false;
}

const reqAgent = new AgentModule.Agent(agentOptions);

// Helper: Robust HTTP Request (Bypassing Next.js fetch)
function httpRequest<T>(reqPath: string, method: string = 'GET', body?: any): Promise<T> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions | https.RequestOptions = {
            hostname: API_HOST,
            port: API_PORT,
            path: `/api${reqPath}${reqPath.includes('?') ? '&' : '?'}_t=${Date.now()}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            agent: reqAgent,   // ✅ Use dynamic pooled agent
            timeout: 2000      // ✅ Reduced timeout
        };

        const req = AgentModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data as any);
                    }
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`[HTTP Client] Error ${method} ${reqPath}:`, e.message);
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}


// --- BROKERS ---

export async function getBrokers(): Promise<Broker[]> {
    try {
        const res = await httpRequest<Broker[]>('/brokers', 'GET');
        return res;
    } catch (e: any) {
        // console.error("API Error getBrokers:", e);
        throw e;
    }
}

export async function saveBroker(broker: Broker): Promise<void> {
    await httpRequest('/brokers', 'POST', broker);
}

export async function deleteBroker(id: string): Promise<void> {
    await httpRequest(`/brokers/${id}`, 'DELETE');
}

// --- ACCOUNTS ---

export async function getAccounts(): Promise<TradingAccount[]> {
    try {
        const res: any = await httpRequest<any>('/accounts', 'GET');
        // Handle API V2 Wrapper ({ accounts: [...] })
        let list = [];
        if (res && !Array.isArray(res) && Array.isArray(res.accounts)) {
            list = res.accounts;
        } else {
            list = Array.isArray(res) ? res : [];
        }
        console.log(`[DataLayer] Fetched ${list.length} accounts`);
        return list;
    } catch (e: any) {
        // IMPORTANT: Log error but THROW IT so the UI (AccountsView) knows the fetch failed.
        // Returning [] causes the UI to wipe out all accounts during a transient network error.
        console.error("API Error getAccounts:", e);
        throw e;
    }
}

export async function saveAccount(account: TradingAccount): Promise<void> {
    // Preserve Single Master Logic if needed (Backend should handle strict enforcement, but we can send intent)
    await httpRequest('/accounts', 'POST', account);
}

export async function updateAccountStatus(id: string, status: TradingAccount['status'], pid?: number): Promise<void> {
    // We need to fetch the account, update, and save.
    // Or we assume the backend handles partial updates? 
    // The previous implementation did a full load-mod-save.
    // Let's replicate safely.

    // Actually, updateAccountStatus usually called by local process manager logic.
    // It implies we know the full object or can fetch it.
    const accounts = await getAccounts();
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.status = status;
        if (pid !== undefined) acc.pid = pid;
        await saveAccount(acc);
    }
}

export async function deleteAccount(id: string): Promise<void> {
    await httpRequest(`/accounts/${id}`, 'DELETE');
}
