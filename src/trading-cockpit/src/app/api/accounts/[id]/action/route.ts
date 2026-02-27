
import { NextResponse } from 'next/server';
import { getAccounts, saveAccount, deleteAccount, updateAccountStatus, getBrokers } from '@/lib/mt-manager/data';
import { getInstancesRoot } from '@/lib/mt-manager/deployer';
import { startTerminal, killTerminal, shutdownTerminal, checkProcessRunning, killTerminalByPath, getAllRunningTerminals } from '@/lib/mt-manager/process';
import path from 'path';

import fs from 'fs/promises';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = params.id;
        console.log(`[ActionAPI] Request Action for ID: ${id}`);

        const body = await req.json();
        const action = body.action; // START, STOP, RESTART, DELETE

        const accounts = await getAccounts();
        console.log(`[ActionAPI] Loaded ${accounts.length} accounts. IDs: ${accounts.map(a => a.id).join(', ')}`);

        const account = accounts.find(a => a.id === id);

        if (!account) {
            console.error(`[ActionAPI] Not Found: ${id} in [${accounts.map(a => a.id).join(', ')}]`);
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Use stored path or reconstruct as fallback
        let instancePath = account.instancePath;
        if (!instancePath) {
            const brokers = await getBrokers();
            const broker = brokers.find(b => b.id === account.brokerId);
            if (broker) {
                const root = await getInstancesRoot();
                let instanceName = `MT_${broker.shorthand.replace(/\s+/g, '')}_${account.login}`;
                if (account.accountType === 'DATAFEED' || (account as any).isDatafeed) {
                    instanceName += '_DATAFEED';
                }
                instancePath = path.join(root, instanceName);
            }
        }

        // Removed the global blocker for NT8. We will handle NT8 actions specifically below.

        if (action === 'STOP') {
            const activeMap = await getAllRunningTerminals();
            let currentPid = 0;
            if (instancePath) {
                const folderName = path.basename(instancePath);
                currentPid = activeMap.get(folderName) || 0;
            }

            if (currentPid) {
                const brokers = await getBrokers();
                const broker = brokers.find(b => b.id === account.brokerId);
                let botId = broker ? `${broker.shorthand.replace(/\s+/g, '')}_${account.login}` : account.botId;
                if (botId && (account.accountType === 'DATAFEED' || account.isDatafeed)) {
                    botId += '_DATAFEED';
                }

                if (botId) {
                    try {
                        console.log(`[ActionAPI] Sending Graceful CMD_SHUTDOWN to ${botId}...`);
                        const response = await fetch(`http://127.0.0.1:3005/api/bot-command/${botId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'CMD_SHUTDOWN' })
                        });
                        if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            console.warn(`[ActionAPI] CMD_SHUTDOWN failed with ${response.status} for ${botId}:`, errData);
                        } else {
                            console.log(`[ActionAPI] CMD_SHUTDOWN sent successfully to ${botId}.`);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    } catch (e) {
                        console.error(`[ActionAPI] Graceful shutdown request failed for ${botId}`, e);
                    }
                }

                if (await checkProcessRunning(currentPid)) {
                    console.log(`[ActionAPI] Process ${currentPid} still running. Force killing...`);
                    await shutdownTerminal(currentPid);
                } else {
                    console.log(`[ActionAPI] Process ${currentPid} exited gracefully.`);
                }
            } else {
                console.log(`[ActionAPI] No active PID found in OS for ${id}.`);
            }

            if (instancePath) {
                await killTerminalByPath(instancePath, true);
            }

            await updateAccountStatus(id, 'STOPPED', undefined);
            return NextResponse.json({ success: true, status: 'STOPPED' });
        } else if (action === 'START') {
            if (account.platform === 'NT8') {
                const username = account.login;
                const password = account.password;

                if (!username || !password) {
                    return NextResponse.json({ error: "NinjaTrader credentials (username/password) are missing on this account." }, { status: 400 });
                }

                try {
                    console.log(`[ActionAPI] Forwarding NT8 Start request to backend...`);
                    const response = await fetch('http://127.0.0.1:3005/api/admin/ninjatrader/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json().catch(() => ({}));

                    if (response.ok && data.success) {
                        await updateAccountStatus(id, 'RUNNING', undefined);
                        return NextResponse.json({ success: true, status: 'RUNNING', message: "NinjaTrader Start Triggered" });
                    } else {
                        throw new Error(data.error || "Failed to start NinjaTrader on backend");
                    }
                } catch (e: any) {
                    console.error("[ActionAPI] Failed to start NT8:", e);
                    return NextResponse.json({ error: e.message }, { status: 500 });
                }
            } else {
                const activeMap = await getAllRunningTerminals();
                let isAlreadyRunning = false;

                if (instancePath) {
                    const folderName = path.basename(instancePath);
                    if (activeMap.has(folderName)) isAlreadyRunning = true;
                }

                if (isAlreadyRunning) {
                    console.log(`[ActionAPI] Terminal already running for ${instancePath}. Modifying config strictly...`);
                }

                if (!instancePath) throw new Error("Instance path not found");
                // Start anyway (MT5 portable guards against multi-instance on same folder, but wait 3s if just stopped)
                // Use login.ini for restarts to avoid opening duplicate charts
                const pid = await startTerminal(instancePath, 'login.ini');
                await updateAccountStatus(id, 'RUNNING', pid);
                return NextResponse.json({ success: true, status: 'RUNNING', pid });
            }
        }

        if (action === 'RESTART') {
            if (account.platform === 'NT8') {
                return NextResponse.json({ error: "NinjaTrader cannot currently be soft-restarted via this API. Please use STOP and then START." }, { status: 400 });
            }

            console.log(`[ActionAPI] RESTART Initiated for ${id}`);

            const activeMap = await getAllRunningTerminals();
            let currentPid = 0;
            if (instancePath) {
                const folderName = path.basename(instancePath);
                currentPid = activeMap.get(folderName) || 0;
            }

            if (currentPid) {
                const brokers = await getBrokers();
                const broker = brokers.find(b => b.id === account.brokerId);
                let botId = broker ? `${broker.shorthand.replace(/\s+/g, '')}_${account.login}` : account.botId;
                if (botId && (account.accountType === 'DATAFEED' || account.isDatafeed)) {
                    botId += '_DATAFEED';
                }

                if (botId) {
                    try {
                        console.log(`[ActionAPI] Sending Graceful CMD_SHUTDOWN to ${botId}...`);
                        const response = await fetch(`http://127.0.0.1:3005/api/bot-command/${botId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'CMD_SHUTDOWN' })
                        });
                        if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            console.warn(`[ActionAPI] CMD_SHUTDOWN failed with ${response.status} for ${botId}:`, errData);
                        } else {
                            console.log(`[ActionAPI] CMD_SHUTDOWN sent successfully to ${botId}.`);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    } catch (e) {
                        console.error(`[ActionAPI] Graceful shutdown request failed for ${botId}`, e);
                    }
                }

                if (await checkProcessRunning(currentPid)) {
                    console.log(`[ActionAPI] Process ${currentPid} still running. Shutting down...`);
                    await shutdownTerminal(currentPid);
                    console.log(`[ActionAPI] Shutdown complete.`);
                } else {
                    console.log(`[ActionAPI] Process ${currentPid} exited gracefully.`);
                }
            } else {
                console.log(`[ActionAPI] No active PID found in OS for ${id} before restart.`);
            }

            if (instancePath) {
                await killTerminalByPath(instancePath, true);
            }
            // Small delay to ensure file locks are released even after process exit
            await new Promise(r => setTimeout(r, 1000));

            if (!instancePath) throw new Error("Instance path not found");
            // Use login.ini to verify restart without new charts
            console.log(`[ActionAPI] Starting Terminal at ${instancePath}...`);
            const pid = await startTerminal(instancePath, 'login.ini');
            console.log(`[ActionAPI] Terminal Started. New PID: ${pid}`);

            await updateAccountStatus(id, 'RUNNING', pid);
            console.log(`[ActionAPI] Status Updated. Restart Complete.`);

            return NextResponse.json({ success: true, status: 'RUNNING', pid });
        }

        if (action === 'DELETE') {
            const errors: string[] = [];

            const activeMap = await getAllRunningTerminals();
            let currentPid = 0;
            if (instancePath) {
                const folderName = path.basename(instancePath);
                currentPid = activeMap.get(folderName) || 0;
            }

            // 1. Force Kill
            if (currentPid) {
                try {
                    await killTerminal(currentPid, true);
                    // Wait for process to fully exit
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e: any) {
                    console.error("Kill failed", e);
                    errors.push(`Kill failed: ${e.message}`);
                }
            }

            if (instancePath) {
                await killTerminalByPath(instancePath, true);
            }
            // 2. Delete Folder (if exists) with Retry
            if (instancePath) {
                let deleted = false;
                for (let i = 0; i < 5; i++) {
                    try {
                        await fs.rm(instancePath, { recursive: true, force: true });
                        deleted = true;
                        break;
                    } catch (e: any) {
                        console.log(`Folder delete attempt ${i + 1} failed: ${e.message}. Retrying...`);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (!deleted) {
                    // Final attempt check or just reporting failure
                    try {
                        await fs.access(instancePath);
                        // If we can still access it, it failed.
                        errors.push(`Folder delete failed after 5 retries. Check if terminal64.exe is still running in ${instancePath}.`);
                    } catch {
                        // If access fails, it likely doesn't exist, so success!
                    }
                }
            }

            // If there were critical errors, STOP and report them. Do NOT delete from DB.
            if (errors.length > 0) {
                return NextResponse.json({
                    error: `Deletion incomplete: ${errors.join(", ")}. Please resolve manually.`
                }, { status: 500 });
            }

            // 3. Remove from DB only if clean
            await deleteAccount(id);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error("Action Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
