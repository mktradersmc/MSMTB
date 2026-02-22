
import { NextResponse } from 'next/server';
import { getBrokers, saveBroker, deleteBroker } from '@/lib/mt-manager/data';
import { Broker } from '@/lib/mt-manager/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    const brokers = await getBrokers();
    return NextResponse.json(brokers);
}

export async function POST(req: Request) {
    const body = await req.json();
    const broker: Broker = {
        id: body.id || uuidv4(),
        name: body.name,
        shorthand: body.shorthand,
        servers: body.servers || [],
        symbolMappings: body.symbolMappings || {},
        defaultSymbol: body.defaultSymbol || "EURUSD"
    };
    await saveBroker(broker);
    return NextResponse.json(broker);
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
        await deleteBroker(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
}
