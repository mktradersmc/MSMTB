
import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

export type BrokerConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'INVALID' | 'UNKNOWN';

export async function checkBrokerConnection(instancePath: string): Promise<BrokerConnectionStatus> {
    try {
        const logsDir = path.join(instancePath, 'logs');
        // Ensure dir exists
        try { await fsPromises.access(logsDir); } catch { return 'UNKNOWN'; }

        // Find latest log file
        const files = await fsPromises.readdir(logsDir);
        const logFiles = files.filter(f => f.match(/^\d{8}\.log$/)).sort();

        if (logFiles.length === 0) return 'UNKNOWN';
        const latestLog = logFiles[logFiles.length - 1];

        // console.log(`[LogCheck] Reading ${latestLog} in ${logsDir}`);

        // MT5 Logs are typically UTF-16LE. Using 'utf-8' will fail to match strings.
        const content = await fsPromises.readFile(path.join(logsDir, latestLog), 'utf16le');
        const lines = content.split('\n');

        // Scan for status from bottom up (latest event)
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];

            // Success
            if (line.includes('authorized on')) {
                // console.log(`[LogCheck] Found SUCCESS: ${line.trim()}`);
                return 'CONNECTED';
            }

            // Failure / Invalid
            if ((line.includes('authorization on') && line.includes('failed')) || line.includes('Invalid account')) {
                // console.log(`[LogCheck] Found INVALID: ${line.trim()}`);
                return 'INVALID';
            }

            // Disconnected / Lost
            if (line.includes('disconnected') ||
                line.includes('connection lost') ||
                line.includes('no connection') ||
                line.includes('connect failed') ||
                line.includes('ping failed')) {
                // console.log(`[LogCheck] Found DISCONNECTED: ${line.trim()}`);
                return 'DISCONNECTED';
            }

            // Intermediate (Connecting)
            if (line.includes('connecting to')) {
                // console.log(`[LogCheck] Found CONNECTING: ${line.trim()}`);
                return 'DISCONNECTED';
            }

            // Removed 'scanning network' as it often appears after authorization in logs order or concurrently.
        }

        return 'UNKNOWN';
    } catch (e) {
        console.error("Error parsing broker log:", e);
        return 'UNKNOWN';
    }
}

export async function startTerminal(instancePath: string, configName: string = 'startup.ini'): Promise<number | undefined> {
    const terminal64 = 'terminal64.exe';
    const terminalPath = path.join(instancePath, terminal64);

    // Validate executable exists
    if (!fs.existsSync(terminalPath)) {
        throw new Error(`Terminal executable not found at ${terminalPath}`);
    }

    // Enforce WebRequest Configuration (MT5 wipes it on shutdown often)
    await updateCommonConfig(instancePath);

    // Spawn detached process
    // Arguments: /portable (required for directory isolation) /config:filename (for startup)
    const child = spawn(terminalPath, ['/portable', `/config:${configName}`], {
        cwd: instancePath, // Crucial: sets the working directory to the instance folder
        detached: true,
        stdio: 'ignore' // Don't block parent
    });

    child.unref(); // Allow parent to exit independently

    return child.pid;
}

// Ensure WebRequest is enabled before every start
async function updateCommonConfig(instancePath: string) {
    const commonPath = path.join(instancePath, 'config', 'common.ini');
    try {
        // Ensure config dir exists (it should)
        await fsPromises.mkdir(path.join(instancePath, 'config'), { recursive: true });

        // Check if file exists
        let content = '';
        try {
            // MT5 INIs are typically UTF-16LE.
            content = await fsPromises.readFile(commonPath, 'utf16le');
        } catch {
            // If missing, create new
            content = '';
        }

        // Ensure [Experts] section exists
        if (!content.includes('[Experts]')) {
            content += '\r\n[Experts]\r\n'; // Use CRLF for Windows goodness
        }

        // Enable WebRequest
        if (content.match(/WebRequest=\d+/)) {
            content = content.replace(/WebRequest=\d+/, 'WebRequest=1');
        } else {
            // Insert under [Experts]
            content = content.replace(/\[Experts\]/, '[Experts]\r\nWebRequest=1');
        }

        // Set URLs (comma separated)
        const urls = 'http://127.0.0.1,http://localhost,http://127.0.0.1:80,http://localhost:80';
        if (content.match(/WebRequestUrl=.*/)) {
            content = content.replace(/WebRequestUrl=.*/, `WebRequestUrl=${urls}`);
        } else {
            content = content.replace(/\[Experts\]/, `[Experts]\r\nWebRequestUrl=${urls}`);
        }

        // Also ensure Enabled=1 and AllowDllImport=1 in global config just in case
        if (content.match(/Enabled=\d+/)) content = content.replace(/Enabled=\d+/, 'Enabled=1');
        else content = content.replace(/\[Experts\]/, '[Experts]\r\nEnabled=1');

        if (content.match(/AllowDllImport=\d+/)) content = content.replace(/AllowDllImport=\d+/, 'AllowDllImport=1');
        else content = content.replace(/\[Experts\]/, '[Experts]\r\nAllowDllImport=1');

        await fsPromises.writeFile(commonPath, content, 'utf16le');
    } catch (e) {
        console.warn(`Failed to update common.ini at ${commonPath}:`, e);
    }
}

export async function killTerminal(pid: number, force: boolean = true): Promise<void> {
    console.log(`[Process] Killing PID ${pid} (Force=${force})...`);
    return new Promise((resolve, reject) => {
        // Windows-specific kill command
        const cmd = force ? `taskkill /PID ${pid} /F` : `taskkill /PID ${pid}`;

        // TIMEOUT: 3 Seconds max (Faster feedback for restarts)
        const options = { timeout: 3000 };

        exec(cmd, options, (error, stdout, stderr) => {
            if (error) {
                // Ignore "process not found" error
                if (stderr && (stderr.includes("not found") || stderr.includes("nicht gefunden"))) {
                    console.log(`[Process] PID ${pid} already verified gone (stderr).`);
                    resolve();
                    return;
                }
                // Timeout Error
                if (error.killed) {
                    console.error(`[Process] 🚨 TIMEOUT: Failed to kill PID ${pid} within 10s.`);
                    reject(new Error(`Timeout killing PID ${pid}`));
                    return;
                }

                // For non-force, rejection might just mean it refused to close, which is fine, we'll force later.
                if (!force) {
                    console.log(`[Process] Graceful close for ${pid} failed/ignored: ${stderr || error.message}`);
                    resolve(); // Don't reject, just continue flow
                    return;
                }
                console.error(`[Process] Failed to kill PID ${pid}:`, stderr || error.message);
                reject(new Error(stderr || error.message));
            } else {
                console.log(`[Process] Successfully sent kill signal to PID ${pid}`);
                resolve();
            }
        });
    });
}

export async function checkProcessRunning(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
        // Simple check using tasklist
        // TIMEOUT: 5 Seconds max
        const options = { timeout: 5000 };

        exec(`tasklist /FI "PID eq ${pid}"`, options, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    console.error(`[Process] 🚨 TIMEOUT: tasklist check for PID ${pid} timed out.`);
                } else {
                    console.warn(`[Process] tasklist error for PID ${pid}:`, error.message);
                }
                // Assiming running if check fails? Or not? 
                // Safest to assume NOT running if we can't verify, implies zombie or system load.
                // But specifically for SHUTDOWN check, we want to know if it IS running.
                // Let's resolve false to avoid infinite loops in shutdownTerminal.
                resolve(false);
                return;
            }
            if (stdout.includes(pid.toString())) {
                // console.log(`[Process] PID ${pid} is RUNNING.`);
                resolve(true);
            } else {
                // console.log(`[Process] PID ${pid} is NOT running.`);
                resolve(false);
            }
        });
    });
}

export async function shutdownTerminal(pid: number): Promise<void> {
    // 1. Try Graceful
    try {
        // Reduced timeout for graceful attempt to 3s to be snappier
        // But killTerminal hardcodes 10s. We should rely on check loop.
        // Actually, let's just ignore the error.
        await killTerminal(pid, false);
    } catch (e) {
        console.warn(`[Process] Graceful kill failed or timed out: ${e}. Proceeding to force check...`);
    }

    // 2. Wait up to 5 seconds
    for (let i = 0; i < 10; i++) {
        const running = await checkProcessRunning(pid);
        if (!running) return;
        await new Promise(r => setTimeout(r, 500));
    }

    // 3. Force Kill if still running
    console.log(`[Process] Process ${pid} didn't close gracefully. Forcing...`);
    // Pass 'true' for force
    await killTerminal(pid, true);
}

export async function killTerminalByPath(instancePath: string, force: boolean = true): Promise<void> {
    return new Promise((resolve) => {
        const folderName = path.basename(instancePath);
        // Use powershell to safely find terminal64 processes with this folder path in their CommandLine
        const psCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='terminal64.exe'\\" | Where-Object {$_.CommandLine -match '${folderName}'} | Select-Object -ExpandProperty ProcessId"`;

        exec(psCmd, { timeout: 5000 }, (error, stdout) => {
            if (error) {
                // Ignore if not found or command fails
                resolve();
                return;
            }

            const pids = stdout.trim().split('\\n').map(s => s.trim()).filter(s => s.length > 0);
            if (pids.length === 0) {
                resolve();
                return;
            }

            console.log(`[Process] Found untracked/stale PIDs [${pids.join(', ')}] for instance ${folderName}. Killing...`);

            // Kill all found instances
            const killPromises = pids.map(pidStr => {
                const pid = parseInt(pidStr, 10);
                if (!isNaN(pid) && pid > 0) {
                    return killTerminal(pid, force).catch(() => { });
                }
                return Promise.resolve();
            });

            Promise.all(killPromises).then(() => resolve());
        });
    });
}
