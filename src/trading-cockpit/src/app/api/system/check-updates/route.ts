
import { NextResponse } from 'next/server';
import { getSystemData } from '@/lib/mt-manager/system-data';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const EXPERTS_PATH = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\mt5\\MQL5\\Experts';
const INDICATORS_PATH = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\mt5\\MQL5\\Indicators';

const WATCH_LIST = [
    { name: 'TradingExpert.ex5', path: EXPERTS_PATH },
    { name: 'DatafeedExpert.ex5', path: EXPERTS_PATH },
    { name: 'TickSpy.ex5', path: INDICATORS_PATH },
    { name: 'HistoryWorker.ex5', path: INDICATORS_PATH },
    { name: 'TradeInfo.ex5', path: INDICATORS_PATH },
];

export async function GET() {
    try {
        const systemData = await getSystemData();
        const lastDeployed = systemData.lastDeploymentTime || 0;
        let newestMtime = 0;

        const updatedFiles: string[] = [];

        for (const item of WATCH_LIST) {
            try {
                const filePath = path.join(item.path, item.name);
                const stats = await fs.stat(filePath);
                if (stats.mtimeMs > newestMtime) {
                    newestMtime = stats.mtimeMs;
                }

                if (stats.mtimeMs > (lastDeployed + 2000)) {
                    updatedFiles.push(item.name);
                }
            } catch (e) {
                // Ignore missing files
            }
        }

        const hasUpdate = updatedFiles.length > 0;

        return NextResponse.json({
            hasUpdate,
            lastDeployed,
            available: newestMtime,
            updatedFiles
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
