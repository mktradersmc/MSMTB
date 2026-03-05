const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function getSystemConfig() {
    try {
        const p = path.resolve(__dirname, '../../market-data-core/data/system.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { }
    return {};
}

class AutoUpdateService {
    constructor() {
        this.updateStatus = {
            updateAvailable: false,
            lastChecked: null,
            commits: [],
            components: {
                frontend: false,
                backend: false,
                metatrader: false,
                ninjatrader: false
            }
        };

        this.pollingInterval = null;
        this.projectRoot = getSystemConfig().projectRoot || "C:\\awesome-cockpit";
    }

    start() {
        if (this.pollingInterval) return;
        console.log('[AutoUpdateService] Starting background polling for updates...');

        // Initial check
        this.checkForUpdates();

        // Poll every 10 seconds to not overwhelm the system/GitHub, but stay responsive
        this.pollingInterval = setInterval(() => {
            this.checkForUpdates();
        }, 10000);
    }

    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[AutoUpdateService] Polling stopped.');
        }
    }

    async checkForUpdates() {
        try {
            const gitRepoPath = path.join(this.projectRoot, '.github_main');

            // 1. Lightweight Check: Ping GitHub for the latest hash without downloading objects
            const remoteHashOutput = await this.execCommand('git ls-remote origin refs/heads/main', gitRepoPath);
            const remoteHash = remoteHashOutput.split('\t')[0].trim();

            const localHashOutput = await this.execCommand('git rev-parse HEAD', gitRepoPath);
            const localHash = localHashOutput.trim();

            this.updateStatus.updateAvailable = (remoteHash !== localHash);
            this.updateStatus.lastChecked = new Date().toISOString();

            if (this.updateStatus.updateAvailable) {
                console.log(`[AutoUpdateService] Update detected! Local: ${localHash.substring(0, 7)}, Remote: ${remoteHash.substring(0, 7)}`);
            }

        } catch (error) {
            this.updateStatus.updateAvailable = false;
            console.error('[AutoUpdateService] Error checking for updates (ls-remote or path missing). Ignoring.', error.message);
        }
    }

    async fetchUpdateDetails() {
        try {
            const gitRepoPath = path.join(this.projectRoot, '.github_main');

            console.log('[AutoUpdateService] On-Demand fetch triggered by UI. Fetching objects from GitHub...');
            // 2. Heavy Check: Fetch objects since structural changes exist
            await this.execCommand('git fetch origin', gitRepoPath);

            // Get log of commits that are on origin/main but not on local main
            const logOutput = await this.execCommand('git log HEAD..origin/main --pretty=format:"%h|%s" --name-only', gitRepoPath);

            return this.parseGitLog(logOutput);

        } catch (error) {
            console.error('[AutoUpdateService] Error fetching update details:', error.message);
            return { commits: [], components: {} };
        }
    }

    parseGitLog(logOutput) {
        const result = {
            commits: [],
            components: {
                frontend: false,
                backend: false,
                metatrader: false,
                ninjatrader: false
            }
        };

        if (!logOutput || logOutput.trim() === '') {
            return result;
        }

        const lines = logOutput.trim().split('\n');
        let currentCommit = null;

        for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes('|')) {
                // It's a commit title block: hash|message
                const parts = line.split('|');
                currentCommit = {
                    hash: parts[0],
                    message: parts.slice(1).join('|').trim()
                };
                result.commits.push(currentCommit);
            } else {
                // It's a file path
                const filePath = line.trim().replace(/\\/g, '/');

                if (filePath.startsWith('src/trading-cockpit')) result.components.frontend = true;
                if (filePath.startsWith('src/market-data-core')) result.components.backend = true;
                if (filePath.startsWith('ressources/metatrader')) result.components.metatrader = true;
                if (filePath.startsWith('ressources/ninjatrader')) result.components.ninjatrader = true;
            }
        }

        return result;
    }

    resetStatus() {
        this.updateStatus.updateAvailable = false;
    }

    getBasicStatus() {
        return {
            updateAvailable: this.updateStatus.updateAvailable,
            lastChecked: this.updateStatus.lastChecked
        };
    }

    executeUpdate(restartInstances = false) {
        console.log(`[AutoUpdateService] Triggering update.ps1 (Restart Instances: ${restartInstances})...`);
        const updateScript = path.join(this.projectRoot, 'scripts', 'update.ps1');

        // Delete previous update status to prevent the UI from instantly closing the dialog
        const logPath = path.join(this.projectRoot, 'logs', 'update-progress.json');
        try {
            if (fs.existsSync(logPath)) {
                fs.unlinkSync(logPath);
            }
        } catch (e) {
            console.error('[AutoUpdateService] Could not delete old progress log', e);
        }

        // Pass a flag to the powershell script if instances should be restarted
        // Convert boolean to PowerShell string argument "True" / "False"
        const psRestartFlag = restartInstances ? 'True' : 'False';

        // Detached execution of powershell script
        const { spawn } = require('child_process');

        try {
            // Because PM2 is extremely aggressive on Windows at terminating child process trees,
            // standard `spawn` or `cmd.exe /c start` will sometimes still be killed when update.ps1 calls "pm2 stop all".
            // To guarantee survival, we write a temporary VBScript that uses WshShell.Run to break out of the tree structure.

            const vbsPath = path.join(this.projectRoot, 'scripts', 'temp_launcher.vbs');
            const psPath = updateScript.replace(/\\/g, '\\\\'); // Escape backslashes for VBS string

            const vbsCode = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""${psPath}"" -RestartInstances ${psRestartFlag}", 0, False
`;

            fs.writeFileSync(vbsPath, vbsCode);

            // Execute the VBS file
            const child = spawn('cscript.exe', [
                '//nologo', vbsPath
            ], {
                detached: true,
                stdio: 'ignore',
                cwd: this.projectRoot,
                windowsHide: true
            });

            child.unref();

            console.log(`[AutoUpdateService] Detached update process successfully spawned via VBScript Launcher.`);
            console.log(`[AutoUpdateService] update.ps1 will now execute 'pm2 stop all' and take over.`);

            return { success: true, message: "Update initiated. Background process launched." };
        } catch (error) {
            console.error('[AutoUpdateService] Failed to execute update script:', error);
            return { success: false, message: "Failed to start update process: " + error.message };
        }
    }

    execCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd, windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

module.exports = new AutoUpdateService();
