
import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, saveAccount, getBrokers } from '@/lib/mt-manager/data';
import { updateHubConfig, restartHub } from '@/lib/mt-manager/hub-control';
import { getInstancesRoot } from '@/lib/mt-manager/deployer';

// Implement the POST handler
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;
        const accounts = await getAccounts();
        const account = accounts.find(a => a.id === id);

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const body = await request.json();
        const setMaster = body.isMaster !== undefined ? body.isMaster : true;

        account.isMaster = setMaster;
        await saveAccount(account);

        // Update Hub if Running
        if (setMaster && account.status === 'RUNNING') {
            // Prefer stored path
            let fullPath = account.instancePath;

            if (!fullPath) {
                const brokers = await getBrokers();
                const broker = brokers.find(b => b.id === account.brokerId);
                if (broker) {
                    const path = await import('path');
                    const root = getInstancesRoot();
                    const botId = `${broker.shorthand.replace(/\s+/g, '')}_${account.login}`; // Sanitize!
                    fullPath = path.default.join(root, `MT_${botId}`);
                }
            }

            if (fullPath) {
                await updateHubConfig(fullPath);
                await restartHub();
            }
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error toggling master:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
