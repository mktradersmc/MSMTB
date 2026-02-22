
import { NextResponse } from 'next/server';
import { recoverAccountsFromDisk } from '@/lib/mt-manager/recovery';

export async function POST() {
    try {
        const recovered = await recoverAccountsFromDisk();
        return NextResponse.json({ success: true, recoveredCount: recovered.length, recovered });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
