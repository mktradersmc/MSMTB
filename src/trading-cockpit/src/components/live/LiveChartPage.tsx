import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '../workspaces/WorkspaceShell';

type ViewType = 'LIVE_COCKPIT' | 'LIVE_CHART' | 'ACCOUNTS' | 'SETTINGS' | 'STRATEGY_LAB';

interface LiveChartPageProps {
    onNavigate?: (view: ViewType) => void;
}

import { Activity } from 'lucide-react';
import { fetchDirect } from "../../lib/client-api";

export default function LiveChartPage({ onNavigate }: LiveChartPageProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [datafeedBotId, setDatafeedBotId] = useState<string>('');
    const [datafeedConfigError, setDatafeedConfigError] = useState<boolean>(false);
    const [isDatafeedOnline, setIsDatafeedOnline] = useState(true);

    // Fetch Configured Datafeed Bot & Accounts (Kept from original)
    useEffect(() => {
        const resolveDatafeedBot = async () => {
            try {
                const [accountsRes, brokersRes] = await Promise.all([
                    fetchDirect('/api/accounts'),
                    fetchDirect('/api/brokers')
                ]);

                if (accountsRes.ok && brokersRes.ok) {
                    const accData = await accountsRes.json();
                    const accountsList = Array.isArray(accData) ? accData : (accData.accounts || []);
                    const brokers = await brokersRes.json();
                    setAccounts(accountsList);

                    const feedAccount = accountsList.find((a: any) => a.accountType === 'DATAFEED' || a.isDatafeed);

                    if (feedAccount) {
                        const broker = brokers.find((b: any) => b.id === feedAccount.brokerId);
                        if (broker) {
                            const shorthand = broker.shorthand.replace(/\s+/g, '');
                            let botId = `${shorthand}_${feedAccount.login}`;
                            if (feedAccount.accountType === 'DATAFEED' || feedAccount.isDatafeed) {
                                botId += '_DATAFEED';
                            }
                            setDatafeedBotId(botId);
                            setDatafeedConfigError(false);
                            return;
                        }
                    }
                }
                setDatafeedConfigError(true);
                setDatafeedBotId('');
            } catch (e) {
                console.error("Bot Resolution Error", e);
                setDatafeedConfigError(true);
            }
        };

        const checkStatus = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:3005/status/heartbeat`);
                const data = await res.json();
                if (data.success) {
                    if (datafeedBotId) {
                        const status = data.services[datafeedBotId];
                        const alive = status?.alive === true;
                        setIsDatafeedOnline(alive);
                    } else {
                        setIsDatafeedOnline(true);
                    }
                }
            } catch (e) {
                setIsDatafeedOnline(false);
            }
        };

        resolveDatafeedBot();
        checkStatus();

        const timer = setInterval(() => {
            resolveDatafeedBot();
            checkStatus();
        }, 5000);
        return () => clearInterval(timer);
    }, [datafeedBotId]);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Live Trading
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Real-time market analysis and execution</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <WorkspaceShell
                    onNavigate={onNavigate}
                    accounts={accounts}
                    datafeedBotId={datafeedBotId}
                    isDatafeedOnline={isDatafeedOnline}
                    datafeedConfigError={datafeedConfigError}
                />
            </div>
        </div>
    );
}
