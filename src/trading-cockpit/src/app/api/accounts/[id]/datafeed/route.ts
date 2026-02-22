
import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, saveAccount } from '@/lib/mt-manager/data';

// Implement the POST handler for Datafeed Toggle
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;
        const accounts = await getAccounts();

        // Disable Datafeed for ALL other accounts (Single Source of Truth)
        // If we want only one datafeed source at a time.
        // The user implied "a Datafeed account", singular.

        const body = await request.json();
        const setAsDatafeed = body.isDatafeed !== undefined ? body.isDatafeed : true;

        if (setAsDatafeed) {
            accounts.forEach(a => a.isDatafeed = false);
        }

        const account = accounts.find(a => a.id === id);
        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        account.isDatafeed = setAsDatafeed;

        // Save all changes
        for (const acc of accounts) {
            await saveAccount(acc);
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error toggling datafeed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
