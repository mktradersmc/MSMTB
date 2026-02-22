
import { NextResponse } from 'next/server';
import { getAccounts, saveAccount, deleteAccount, updateAccountStatus, getBrokers } from '@/lib/mt-manager/data';
import { getInstancesRoot } from '@/lib/mt-manager/deployer';
import { startTerminal, killTerminal, shutdownTerminal, checkProcessRunning } from '@/lib/mt-manager/process';
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
                const root = getInstancesRoot();
                const botId = `${broker.shorthand.replace(/\s+/g, '')}_${account.login}`;
                instancePath = path.join(root, `MT_${botId}`);
            }
        }

        if (account.platform === 'NT8') {
            console.log(`[ActionAPI] Handling NT8 Action: ${action} for ${id}`);

            if (action === 'DELETE') {
                // Fallthrough to deletion logic
            } else if (action === 'STOP') {
                await updateAccountStatus(id, 'STOPPED', 0);
                return NextResponse.json({ success: true, status: 'STOPPED', message: "Marked as STOPPED (Bridge Managed)" });
            } else if (action === 'START') {
                await updateAccountStatus(id, 'RUNNING', 0);
                return NextResponse.json({ success: true, status: 'RUNNING', message: "Marked as RUNNING (Waiting for Bridge)" });
            } else if (action === 'RESTART') {
                await updateAccountStatus(id, 'STOPPED', 0);
                await new Promise(r => setTimeout(r, 1000));
                await updateAccountStatus(id, 'RUNNING', 0);
                return NextResponse.json({ success: true, status: 'RUNNING', message: "Cycle Complete (Bridge Managed)" });
            } else {
                return NextResponse.json({ error: "Action not supported for NinjaTrader" }, { status: 400 });
            }
        }

        if (action === 'STOP') {
            if (account.pid) await shutdownTerminal(account.pid);
            await updateAccountStatus(id, 'STOPPED', undefined);
            return NextResponse.json({ success: true, status: 'STOPPED' });
        }

        if (action === 'START') {
            if (account.pid && await checkProcessRunning(account.pid)) {
                return NextResponse.json({ success: true, status: 'RUNNING', message: 'Already running' });
            }
            if (!instancePath) throw new Error("Instance path not found");
            // Use login.ini for restarts to avoid opening duplicate charts
            const pid = await startTerminal(instancePath, 'login.ini');
            await updateAccountStatus(id, 'RUNNING', pid);
            return NextResponse.json({ success: true, status: 'RUNNING', pid });
        }

        if (action === 'RESTART') {
            console.log(`[ActionAPI] RESTART Initiated for ${id} (PID: ${account.pid || 'None'})`);

            if (account.pid) {
                console.log(`[ActionAPI] Shutting down PID ${account.pid}...`);
                await shutdownTerminal(account.pid);
                console.log(`[ActionAPI] Shutdown complete.`);
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

            // 1. Force Kill (No parsing needed for delete)
            if (account.pid) {
                try {
                    await killTerminal(account.pid, true);
                    // Wait for process to fully exit
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e: any) {
                    console.error("Kill failed", e);
                    errors.push(`Kill failed: ${e.message}`);
                }
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
