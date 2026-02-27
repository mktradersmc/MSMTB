import { NextResponse } from 'next/server';
import { getSystemConfig, setSystemConfig, getCoreSystemData, updateCoreSystemData } from '@/lib/mt-manager/system-data';
import { config } from '../../../../lib/config-local'; // Fallback
import path from 'path';

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET() {
    try {
        const storedConfig = await getSystemConfig();
        const coreConfig = await getCoreSystemData();
        return NextResponse.json({
            success: true,
            config: {
                MT5_MQL5_DIR: storedConfig.MT5_MQL5_DIR || config.MT5_MQL5_DIR || '',
                projectRoot: coreConfig?.projectRoot || '',
                systemUsername: coreConfig?.systemUsername || '',
                systemPassword: coreConfig?.systemPassword || ''
            }
        });
    } catch (e: any) {
        console.error('[API:SystemConfig] GET Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Split updates
        const coreUpdates: any = {};
        if (body.projectRoot !== undefined) coreUpdates.projectRoot = body.projectRoot;
        if (body.systemUsername !== undefined) coreUpdates.systemUsername = body.systemUsername;
        if (body.systemPassword !== undefined) coreUpdates.systemPassword = body.systemPassword;
        
        if (Object.keys(coreUpdates).length > 0) {
            await updateCoreSystemData(coreUpdates);
        }
        
        if (body.MT5_MQL5_DIR !== undefined) {
             await setSystemConfig({ MT5_MQL5_DIR: body.MT5_MQL5_DIR });
        }
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API:SystemConfig] POST Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
