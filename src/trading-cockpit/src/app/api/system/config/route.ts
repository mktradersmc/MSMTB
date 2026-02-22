import { NextResponse } from 'next/server';
import { getSystemConfig, setSystemConfig } from '@/lib/mt-manager/system-data';
import { config } from '../../../../lib/config-local'; // Fallback

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET() {
    try {
        const storedConfig = await getSystemConfig();
        console.log('[API:SystemConfig] GET Stored:', storedConfig);
        return NextResponse.json({
            success: true,
            config: {
                MT5_MQL5_DIR: storedConfig.MT5_MQL5_DIR || config.MT5_MQL5_DIR || ''
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
        console.log('[API:SystemConfig] POST Body:', body);
        await setSystemConfig(body);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API:SystemConfig] POST Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
