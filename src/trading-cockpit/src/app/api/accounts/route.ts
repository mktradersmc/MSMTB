
import { NextResponse } from 'next/server';
import { getAccounts, saveAccount, getBrokers } from '@/lib/mt-manager/data'; // Fixed import
import { deployInstance } from '@/lib/mt-manager/deployer';
import { startTerminal, checkProcessRunning, checkBrokerConnection } from '@/lib/mt-manager/process';
import { TradingAccount } from '@/lib/mt-manager/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        // The Data Layer (data.ts) now fetches directly from the Backend API (Port 3005).
        // The Backend API already performs the merging of DB Accounts + Live Status + detected bots.
        const accounts = await getAccounts();

        // Optional: Perform Process Verification for Managed Accounts only?
        // The previous logic did `checkProcessRunning`.
        // If we want to keep that, we can iterate here. 
        // However, the Backend `status` is likely more accurate for "Connected" state.
        // But for "PID Running" state, the Frontend-Server (which has FS access to Instances?) might be needed.
        // Wait, Frontend (Next.js) runs on host? Yes. Backend runs on host? Yes.
        // So both can access PIDs.
        // But `market-data-core` doesn't track PIDs actively in the loop? 
        // It tracks valid connections.

        // Let's trust the Backend's view of "ONLINE/OFFLINE".
        // If the backend sees a connection, it's RUNNING.
        // If the backend sees no connection, but we have a PID, it might be "Zombie" or "Connecting".

        // For now, to fix the "Empty List" bug, let's just return what the backend sees.
        // Simplicity first.

        return NextResponse.json(accounts);
    } catch (e: any) {
        console.error("Accounts GET Error:", e);
        return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { brokerId, login, password, server, accountType } = body;

        // Validation
        if (!brokerId || !login || !password || !server) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const brokers = await getBrokers();
        const broker = brokers.find(b => b.id === brokerId);
        if (!broker) {
            return NextResponse.json({ error: 'Invalid Broker ID' }, { status: 404 });
        }

        let botId = `${broker.shorthand.replace(/\s+/g, '')}_${login}`;
        if (accountType === 'DATAFEED') {
            botId += '_DATAFEED';
        }

        // Construct initial account object
        const account: TradingAccount = {
            id: uuidv4(),
            botId, // Persist the calculated Bot ID
            brokerId,
            login,
            password,
            server,
            accountType: accountType || 'TRADING',
            isTest: body.isTest || false,
            status: 'DEPLOYING',
            pid: 0
        };

        // 1. Deploy Files
        const instancePath = await deployInstance(broker, account, botId);
        account.instancePath = instancePath;

        // 2. Start Process (Default Startup.ini for fresh deploy)
        const pid = await startTerminal(instancePath);
        if (!pid) {
            return NextResponse.json({ error: 'Failed to start terminal process' }, { status: 500 });
        }
        account.pid = pid;
        account.status = 'RUNNING';

        // 3. Save to DB
        await saveAccount(account);

        return NextResponse.json(account);

    } catch (error: any) {
        console.error("Deployment Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
