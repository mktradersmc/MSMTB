import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '../workspaces/WorkspaceShell';
import { FlaskConical } from 'lucide-react';
import { fetchDirect, getBaseUrl } from "../../lib/client-api";
import { ReplayToolbar } from './ReplayToolbar';
import { useBacktest } from '../../contexts/BacktestContext';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

type ViewType = 'LIVE_COCKPIT' | 'LIVE_CHART' | 'ACCOUNTS' | 'SETTINGS' | 'STRATEGY_LAB' | 'BACKTEST';

interface BacktestChartPageProps {
    onNavigate?: (view: ViewType) => void;
}

export default function BacktestChartPage({ onNavigate }: BacktestChartPageProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [datafeedBotId, setDatafeedBotId] = useState<string>('');
    const [datafeedConfigError, setDatafeedConfigError] = useState<boolean>(false);
    const [isDatafeedOnline, setIsDatafeedOnline] = useState(true);

    const { activeSession } = useBacktest();
    const loadBacktestWorkspace = useWorkspaceStore(s => s.loadBacktestWorkspace);
    const activeWorkspace = useWorkspaceStore(s => s.workspaces.find(w => w.id === activeSession?.id));

    // 1. Load Virtual Workspace on Mount
    useEffect(() => {
        if (activeSession) {
            loadBacktestWorkspace(activeSession.id, activeSession.workspace_state);
        }
    }, [activeSession?.id, loadBacktestWorkspace]);

    // 2. Debounced Auto-Sync configuration changes
    useEffect(() => {
        if (!activeSession || !activeWorkspace) return;

        const timer = setTimeout(async () => {
            try {
                await fetchDirect(`/api/backtest/workspace/${activeSession.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activeWorkspace)
                });
                // console.log('[Backtest] Workspace state synced');
            } catch (e) {
                console.error('[Backtest] Failed to sync workspace state', e);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [activeWorkspace, activeSession?.id]);

    // Fetch Configured Datafeed Bot & Accounts
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
                const res = await fetch(`${getBaseUrl()}/status/heartbeat`);
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

    if (!activeSession) return null;

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FlaskConical size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Backtest Replay Engine
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                            {activeSession.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* The Toolbar is now a floating Draggable component */}
            <ReplayToolbar />

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <WorkspaceShell
                    onNavigate={onNavigate}
                    accounts={accounts}
                    datafeedBotId={datafeedBotId}
                    isDatafeedOnline={isDatafeedOnline}
                    datafeedConfigError={datafeedConfigError}
                    isBacktestContext={true}
                />
            </div>
        </div>
    );
}
