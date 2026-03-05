const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Disable strict SSL for local proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("[AutoStart] Initiating post-update terminal startup sequence...");

// We query the backend on port 3005 directly. Note that we assume it uses HTTP locally if not configured otherwise.
// The Next.js proxy on port 3001/443 also goes there.
const BACKEND_PORT = 3005;

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: BACKEND_PORT,
            path: path,
            method: method,
            headers: {}
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            const bodyStr = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data || '{}'));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBackend() {
    process.stdout.write("[AutoStart] Waiting for backend to become available");
    for (let i = 0; i < 30; i++) {
        try {
            await makeRequest('/api/status/heartbeat');
            console.log("\n[AutoStart] ✅ Backend is fully available.");
            return true;
        } catch (e) {
            process.stdout.write(".");
            await sleep(2000);
        }
    }
    console.log("\n[AutoStart] ❌ Backend did not become available.");
    return false;
}

async function startNinjaTrader() {
    console.log("[AutoStart] 🚀 Step 1: Triggering NinjaTrader UI Automation Startup...");
    try {
        await makeRequest('/api/admin/ninjatrader/start', 'POST', {});
        console.log("[AutoStart] ✅ NinjaTrader Start Command Sent.");
        console.log("[AutoStart] ⏳ Waiting 20 seconds for NinjaTrader to fully boot up and login before starting MT5 instances...");
        await sleep(20000); // Give NT8 plenty of time to launch and log in
    } catch (e) {
        console.error("[AutoStart] ❌ Error starting NinjaTrader:", e.message);
        console.log("[AutoStart] ⏩ Proceeding anyway (Maybe NinjaTrader isn't configured or is already running).");
    }
}

async function startMetaTraderAccounts() {
    console.log("[AutoStart] 🚀 Step 2: Starting MetaTrader 5 Accounts...");
    try {
        const res = await makeRequest('/api/accounts');
        const accounts = res.accounts || [];

        const mt5Accounts = accounts.filter(a => a.platform === 'MT5');
        console.log(`[AutoStart] Found ${mt5Accounts.length} MT5 accounts to start.`);

        for (const account of mt5Accounts) {
            // Don't restart instances that couldn't be correctly assigned to a local folder (generic detected offline ones)
            if (account.id && !account.id.startsWith("gen_") && !account.id.startsWith("fix_") && account.server !== 'Detected') {
                console.log(`[AutoStart] 🔄 Starting MT5 Account: ${account.login} (${account.id})`);
                try {
                    await makeRequest(`/api/accounts/${account.id}/action`, 'POST', { action: 'START' });
                    console.log(`[AutoStart] ✅ ${account.login} Started successfully.`);
                } catch (e) {
                    console.error(`[AutoStart] ❌ Failed to start ${account.login}:`, e.message);
                }

                // Wait briefly between terminal spawns to avoid IO thrashing
                await sleep(2000);
            }
        }
    } catch (e) {
        console.error("[AutoStart] ❌ Error fetching MT5 accounts:", e.message);
    }
}

async function run() {
    const isReady = await waitForBackend();
    if (!isReady) {
        process.exit(1);
    }

    await startNinjaTrader();
    await startMetaTraderAccounts();

    console.log("[AutoStart] 🎉 Automated terminal startup complete.");
}

run();
