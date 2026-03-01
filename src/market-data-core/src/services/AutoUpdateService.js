const { exec } = require('child_process');
const path = require('path');
const systemConfigService = require('./SystemConfigService');

class AutoUpdateService {
    constructor() {
        this.updateStatus = {
            hasUpdate: false,
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
        this.projectRoot = systemConfigService.getConfig().projectRoot || "C:\\awesome-cockpit";
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
            // First run git fetch to get the latest remote state
            await this.execCommand('git fetch origin main', this.projectRoot);

            // Get log of commits that are on origin/main but not on local main
            const logOutput = await this.execCommand('git log HEAD..origin/main --pretty=format:"%h|%s" --name-only', this.projectRoot);
            
            this.parseGitLog(logOutput);
            this.updateStatus.lastChecked = new Date().toISOString();
            
        } catch (error) {
            console.error('[AutoUpdateService] Error checking for updates:', error.message);
        }
    }

    parseGitLog(logOutput) {
        if (!logOutput || logOutput.trim() === '') {
            this.resetStatus();
            return;
        }

        const lines = logOutput.trim().split('\n');
        const commits = [];
        let currentCommit = null;

        const components = {
            frontend: false,
            backend: false,
            metatrader: false,
            ninjatrader: false
        };

        for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes('|')) {
                // It's a commit title block: hash|message
                const parts = line.split('|');
                currentCommit = {
                    hash: parts[0],
                    message: parts.slice(1).join('|').trim()
                };
                commits.push(currentCommit);
            } else {
                // It's a file path
                const filePath = line.trim();
                
                if (filePath.startsWith('src/trading-cockpit')) components.frontend = true;
                if (filePath.startsWith('src/market-data-core')) components.backend = true;
                if (filePath.startsWith('ressources/metatrader')) components.metatrader = true;
                if (filePath.startsWith('ressources/ninjatrader')) components.ninjatrader = true;
            }
        }

        this.updateStatus = {
            hasUpdate: commits.length > 0,
            commits: commits,
            components: components,
            lastChecked: new Date().toISOString()
        };
    }

    resetStatus() {
        this.updateStatus.hasUpdate = false;
        this.updateStatus.commits = [];
        this.updateStatus.components = {
            frontend: false,
            backend: false,
            metatrader: false,
            ninjatrader: false
        };
    }

    getStatus() {
        return this.updateStatus;
    }

    executeUpdate(restartInstances = false) {
        console.log(`[AutoUpdateService] Triggering update.ps1 (Restart Instances: ${restartInstances})...`);
        const updateScript = path.join(this.projectRoot, 'update.ps1');
        
        // Pass a flag to the powershell script if instances should be restarted
        // Convert boolean to PowerShell format $true / $false
        const psRestartFlag = restartInstances ? '$true' : '$false';

        // Detached execution of powershell script
        const { spawn } = require('child_process');
        
        try {
            const out = fs.openSync(path.join(this.projectRoot, 'logs', 'update-process.log'), 'a');
            const err = fs.openSync(path.join(this.projectRoot, 'logs', 'update-error.log'), 'a');
            
            const child = spawn('powershell.exe', [
                '-NoProfile', 
                '-ExecutionPolicy', 'Bypass', 
                '-File', updateScript,
                '-RestartInstances', psRestartFlag
            ], {
                detached: true,
                stdio: ['ignore', out, err],
                cwd: this.projectRoot,
                windowsHide: true
            });

            child.unref(); // Detach completely

            console.log('[AutoUpdateService] Detached update process successfully spawned. This backend will now exit gracefully.');
            
            // Allow time for the script to start before we kill ourselves
            setTimeout(() => {
                process.exit(0);
            }, 2000);

            return { success: true, message: "Update initiated. Backend shutting down." };
        } catch (error) {
            console.error('[AutoUpdateService] Failed to execute update script:', error);
            return { success: false, message: "Failed to start update process: " + error.message };
        }
    }

    execCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

const fs = require('fs'); // Only for log file creation during execute
module.exports = new AutoUpdateService();
