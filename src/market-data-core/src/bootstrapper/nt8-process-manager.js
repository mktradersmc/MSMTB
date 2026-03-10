const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * NinjaTrader 8 Bootstrapper (Local Operator)
 * 
 * Responsibilities:
 * 1. Ensure NinjaTrader.exe is running.
 * 2. If not, start it.
 * 3. Monitor for "Login Window".
 * 4. Trigger PowerShell injection script.
 * 5. Self-Healing: Restart on crash.
 */

// CONFIGURATION
const NT8_PATH = "C:\\Program Files\\NinjaTrader 8\\bin\\NinjaTrader.exe"; // Adjust if needed
const LOGIN_SCRIPT = path.join(__dirname, 'auto-login.ps1');
const CREATE_CONN_SCRIPT = path.join(__dirname, 'create-connection.ps1');

// No top-level credentials constants - passed dynamically

let ntProcess = null;

function checkProcess() {
    exec('tasklist /FI "IMAGENAME eq NinjaTrader.exe"', { windowsHide: true }, (err, stdout, stderr) => {
        if (stdout.includes("NinjaTrader.exe")) {
            // Already running
            // console.log("[Bootstrapper] ✅ NinjaTrader is running.");
        } else {
            console.log("[Bootstrapper] ⚠️ NinjaTrader NOT running. Passive monitoring only.");
        }
    });
}

function startNinjaTrader(username, password) {
    return new Promise((resolve, reject) => {
        if (!username || !password) {
            console.error("[Bootstrapper] ❌ Cannot start NT8: Missing credentials.");
            return reject(new Error("Missing credentials"));
        }

        // 1. Check if already running
        exec('tasklist /FI "IMAGENAME eq NinjaTrader.exe"', { windowsHide: true }, (err, stdout, stderr) => {
            if (stdout.includes("NinjaTrader.exe")) {
                console.log("[Bootstrapper] ✅ NinjaTrader is already running. Attempting login injection just in case it's at the login screen...");
                return performLogin(username, password)
                    .then(() => resolve())
                    .catch((err) => reject(err));
            }

            // 2. Not running, boot it up
            console.log(`[Bootstrapper] 🚀 Launching: ${NT8_PATH}`);
            try {
                const subprocess = spawn(NT8_PATH, [], {
                    detached: true,
                    stdio: 'ignore'
                });
                subprocess.unref();

                console.log("[Bootstrapper] Waiting for Login Window (15s)...");

                // Schedule Login Injection
                setTimeout(() => {
                    performLogin(username, password)
                        .then(() => resolve())
                        .catch((err) => reject(err));
                }, 15000); // 15s delay for splash screen

            } catch (e) {
                console.error("[Bootstrapper] Failed to start NT8:", e);
                reject(e);
            }
        });
    });
}

function performLogin(username, password) {
    return new Promise((resolve, reject) => {
        console.log("[Bootstrapper] 🔑 Attempting Auto-Login via PowerShell...");

        const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', LOGIN_SCRIPT
        ], {
            env: { ...process.env, NT8_USER: username, NT8_PASS: password }
        });

        ps.stdout.on('data', (data) => console.log(`[PS Login] ${data}`));
        ps.stderr.on('data', (data) => console.error(`[PS Login Error] ${data}`));

        ps.on('close', (code) => {
            console.log(`[Bootstrapper] Login script finished (Code ${code})`);
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Login script failed with code ${code}`));
            }
        });
    });
}

function createConnection(username, password) {
    console.log("[Bootstrapper] 🔌 Attempting to Create Connection via PowerShell...");

    const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', CREATE_CONN_SCRIPT
    ], {
        env: { ...process.env, NT8_USER: username, NT8_PASS: password }
    });

    ps.stdout.on('data', (data) => console.log(`[PS CreateConn] ${data}`));
    ps.stderr.on('data', (data) => console.error(`[PS CreateConn Error] ${data}`));

    ps.on('close', (code) => {
        console.log(`[Bootstrapper] Create Connection script finished (Code ${code})`);
    });
}

// Loop Check
setInterval(checkProcess, 60000); // Check every minute
checkProcess(); // Initial check

module.exports = { startNinjaTrader, performLogin, createConnection };
