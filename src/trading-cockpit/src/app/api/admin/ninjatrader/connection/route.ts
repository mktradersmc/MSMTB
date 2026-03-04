import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Forward to the backend SocketServer
        const res = await fetch(`${API_BASE}/admin/ninjatrader/connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.error || 'Backend request failed' }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying connection creation request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
