const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run() {
    let dataPath = '';
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--data-path' && args[i + 1]) {
            dataPath = args[i + 1];
            break;
        }
    }

    if (!dataPath) {
        console.error('[HOOK-RUNNER] ERROR: --data-path argument missing. Hooks cannot track state.');
        process.exit(1);
    }

    const stateFile = path.join(dataPath, 'executed-hooks.json');
    const hooksDir = path.join(__dirname, 'update-hooks');

    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }

    let state = { executed: [] };
    if (fs.existsSync(stateFile)) {
        try {
            state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        } catch (e) {
            console.error('[HOOK-RUNNER] ERROR reading state file:', e.message);
            process.exit(1);
        }
    }

    if (!fs.existsSync(hooksDir)) {
        console.log('[HOOK-RUNNER] No update-hooks directory found, skipping.');
        return;
    }

    const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js') || f.endsWith('.ps1')).sort();

    let executedCount = 0;

    // Pass args down to the child scripts
    const childArgs = args.join(' ');

    for (const file of files) {
        // Skip previously executed
        if (!state.executed.includes(file)) {
            console.log(`\n[HOOK-RUNNER] >>> Executing new hook: ${file}`);
            const filePath = path.join(hooksDir, file);
            try {
                if (file.endsWith('.js')) {
                    execSync(`node "${filePath}" ${childArgs}`, { stdio: 'inherit' });
                } else if (file.endsWith('.ps1')) {
                    execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${filePath}" ${childArgs}`, { stdio: 'inherit' });
                }

                // Ensure strictly tracked state AFTER it ran.
                state.executed.push(file);
                fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
                console.log(`[HOOK-RUNNER] <<< Successfully executed and recorded: ${file}`);
                executedCount++;
            } catch (err) {
                console.error(`\n[HOOK-RUNNER ERROR] Failed to execute hook ${file}`);
                console.error(err.message);
                process.exit(1); // Will trigger PM2 rollback dynamically
            }
        }
    }

    if (executedCount === 0) {
        console.log('[HOOK-RUNNER] All update hooks are up-to-date.');
    }
}

run();
