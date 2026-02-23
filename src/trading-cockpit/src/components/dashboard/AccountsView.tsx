
import React, { useState, useEffect, useRef } from 'react';
import { Users, Activity, Play, Square, RotateCw, Trash2, Power, Database, AlertCircle, Download, ShieldAlert, CheckCircle2, Clock, Settings, ArrowLeftRight, Monitor, RefreshCw, Plus } from 'lucide-react';
import { AddAccountModal } from './AddAccountModal';
import { AccountConfigModal } from './AccountConfigModal';
import { TradingAccount, Broker, StatusData } from '../../lib/mt-manager/types';
import { fetchDirect, fetchSystem, API_URLS } from '../../lib/client-api';
import { socketService } from '../../services/socket';

export function AccountsView() {
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [configAccount, setConfigAccount] = useState<{ botId: string, id: string, size?: number } | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<Record<string, StatusData>>({});
    const [serverTime, setServerTime] = useState<number>(Date.now());
    const fetchIdRef = useRef(0);

    // Updates
    const [updateAvailable, setUpdateAvailable] = useState<{ hasUpdate: boolean, lastDeployed: number, available: number, updatedFiles: string[] } | null>(null);
    const [updateScope, setUpdateScope] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [isTestMode, setIsTestMode] = useState(false);

    useEffect(() => {
        loadData();
        checkUpdates();

        const statusInterval = setInterval(fetchStatus, 2000);
        const updateInterval = setInterval(checkUpdates, 30000);

        const onUpdate = (data: any) => {
            console.log("Accounts Updated via Socket", data);
            loadData();
        };
        socketService.socket.on('accounts_updated_event', onUpdate);

        return () => {
            clearInterval(statusInterval);
            clearInterval(updateInterval);
            socketService.socket.off('accounts_updated_event', onUpdate);
        };
    }, []);

    const checkUpdates = async () => {
        try {
            const res = await fetchSystem('/system/check-updates');
            const data = await res.json();
            setUpdateAvailable(data);
        } catch (e) {
            console.error("Update check failed", e);
        }
    };

    const fetchStatus = async () => {
        const currentId = ++fetchIdRef.current;
        try {
            const res = await fetch(`${API_URLS.DIRECT_BASE}/status/heartbeat`);
            const data = await res.json();
            if (currentId !== fetchIdRef.current) return;
            if (data.success) {
                setStatuses(data.services);
                if (data.serverTime) setServerTime(data.serverTime);
            }
        } catch (e) { }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [accRes, brokerRes] = await Promise.all([
                fetchDirect('/accounts'),
                fetchDirect('/brokers')
            ]);
            const accData = await accRes.json();
            const brokerData = await brokerRes.json();
            setAccounts(Array.isArray(accData) ? accData : (accData.accounts || []));
            setBrokers(brokerData);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'START' | 'STOP' | 'RESTART' | 'DELETE') => {
        if (action === 'DELETE' && !confirm('Are you sure you want to delete this account?')) return;
        setLoadingAction(id);
        try {
            const res = await fetchSystem(`/accounts/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Action Failed: ${data.error || 'Unknown Error'}`);
            } else {
                await loadData();
            }
        } catch (e) {
            alert("Network or Server Error");
        } finally {
            setLoadingAction(null);
        }
    };



    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity size={20} className={isTestMode ? "text-amber-500" : "text-emerald-500"} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Trading Accounts
                            {isTestMode && <span className="text-[10px] ml-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Test Mode</span>}
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Manage your {isTestMode ? 'Test' : 'Live'} Broker Connections</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2">
                        <button onClick={() => setIsTestMode(false)} className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", !isTestMode ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>LIVE</button>
                        <button onClick={() => setIsTestMode(true)} className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", isTestMode ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>TEST</button>
                    </div>

                    <div className="mr-2">
                        <RestartControl scope="TRADING" accounts={accounts.filter(a => a.accountType !== 'DATAFEED' && !a.isDatafeed && (isTestMode ? a.isTest : !a.isTest))} onAction={handleAction} />
                    </div>

                    <button onClick={loadData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors">
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                        <Plus size={16} /> Add Account
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                {notification && (
                    <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500 text-white' : 'bg-red-900/90 border-red-500 text-white'}`}>
                        {notification.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-400" /> : <AlertCircle size={24} className="text-red-400" />}
                        <div>
                            <h4 className="font-bold">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                            <p className="text-sm opacity-90">{notification.message}</p>
                        </div>
                    </div>
                )}



                {/* Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {accounts.filter(a =>
                        a.accountType !== 'DATAFEED' &&
                        !a.isDatafeed &&
                        (isTestMode ? a.isTest : !a.isTest)
                    ).sort((a, b) => {
                        const b1 = getBrokerName(a.brokerId, brokers);
                        const b2 = getBrokerName(b.brokerId, brokers);
                        return b1.localeCompare(b2) || a.login.localeCompare(b.login);
                    }).map(acc => (
                        <AccountCard
                            key={acc.id}
                            acc={acc}
                            statuses={statuses}
                            serverTime={serverTime}
                            loadingAction={loadingAction}
                            onAction={handleAction}
                            brokers={brokers}
                            isDatafeedSection={false}
                            isUpdating={isUpdating}
                            updateScope={updateScope}
                            onConfig={(botId) => setConfigAccount({ botId, id: acc.id, size: acc.accountSize })}
                        />
                    ))}
                </div>

                {accounts.filter(a => a.accountType !== 'DATAFEED' && !a.isDatafeed && (isTestMode ? a.isTest : !a.isTest)).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-sm bg-slate-900/30 mt-8">
                        <Users size={48} className="opacity-20 mb-4" />
                        <p className="font-medium text-lg">No {isTestMode ? 'Test' : 'Live'} Accounts Found</p>
                        <p className="text-sm">Click "Add New Account" to connect.</p>
                    </div>
                )}
            </div>

            {isAddOpen && <AddAccountModal onClose={() => setIsAddOpen(false)} onSuccess={loadData} existingAccounts={accounts} isTestMode={isTestMode} />}
            {configAccount && <AccountConfigModal botId={configAccount.botId} accountId={configAccount.id} accountSize={configAccount.size} onClose={() => { setConfigAccount(null); loadData(); }} onSuccess={loadData} />}
        </div>
    );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}

const getBrokerShorthand = (id: string, brokers: Broker[]) => brokers.find(b => b.id === id)?.shorthand || 'UNK';
const getBrokerName = (id: string, brokers: Broker[]) => brokers.find(b => b.id === id)?.name || 'Unknown Broker';

const getBotId = (acc: TradingAccount, brokers: Broker[]) => {
    const short = getBrokerShorthand(acc.brokerId, brokers).replace(/\s+/g, '');
    let id = `${short}_${acc.login}`;
    if (acc.accountType === 'DATAFEED' || acc.isDatafeed) {
        id += '_DATAFEED';
    }
    return id;
};

const RestartControl = ({ scope, accounts, onAction }: { scope: 'TRADING' | 'DATAFEED', accounts: TradingAccount[], onAction: (id: string, action: 'START' | 'STOP' | 'RESTART' | 'DELETE') => Promise<void> }) => {
    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = async (type: 'ALL' | 'ACTIVE') => {
        if (!confirm(`Restart ${type === 'ALL' ? 'ALL' : 'ACTIVE'} ${scope} instances sequentially?`)) return;

        setIsRestarting(true);
        try {
            let targets = accounts;
            if (scope === 'DATAFEED') {
                targets = accounts.filter(a => a.accountType === 'DATAFEED' || a.isDatafeed);
            } else {
                targets = accounts.filter(a => a.accountType === 'TRADING' || !a.isDatafeed);
            }

            if (type === 'ACTIVE') {
                targets = targets.filter(a => a.status === 'RUNNING' || (a.pid && a.pid > 0));
            }

            for (const acc of targets) {
                if (acc.server === 'Detected' || acc.id.startsWith('fix_') || acc.id.startsWith('gen_')) continue;
                console.log(`[RestartControl] Restarting ${acc.login} (${acc.id})...`);
                await onAction(acc.id, 'RESTART');
                await new Promise(r => setTimeout(r, 1000));
            }
            console.log(`[RestartControl] Bulk restart completed for ${targets.length} accounts.`);
        } catch (e) {
            console.error(`[RestartControl] Bulk restart failed:`, e);
        } finally {
            setIsRestarting(false);
        }
    };

    return (
        <div className={`flex items-stretch text-white rounded-lg shadow-lg overflow-hidden border border-slate-300 dark:border-slate-700 ${isRestarting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Label - Darker, Non-clickable */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 dark:bg-slate-800 font-bold text-sm text-slate-200 border-r border-slate-600 dark:border-slate-900">
                <RotateCw size={14} className={isRestarting ? 'animate-spin text-amber-500' : 'text-slate-400'} />
                <span className="tracking-wide">Restart</span>
            </div>

            {/* Button 1: Active */}
            <button
                onClick={() => handleRestart('ACTIVE')}
                disabled={isRestarting}
                className="px-3 py-2 bg-slate-600 dark:bg-slate-700 hover:bg-amber-600 dark:hover:bg-amber-600 font-bold text-sm transition-colors border-r border-slate-500 dark:border-slate-800 flex items-center gap-2"
            >
                {isRestarting ? '...' : 'Active'}
            </button>

            {/* Button 2: All */}
            <button
                onClick={() => handleRestart('ALL')}
                disabled={isRestarting}
                className="px-3 py-2 bg-slate-600 dark:bg-slate-700 hover:bg-amber-600 dark:hover:bg-amber-600 font-bold text-sm transition-colors flex items-center gap-1"
                title="Restart ALL"
            >
                All
            </button>
        </div>
    );
};

function AccountCard({ acc, statuses, serverTime, loadingAction, onAction, onConfig, brokers, isDatafeedSection, isUpdating, updateScope }: {
    acc: TradingAccount,
    statuses: Record<string, StatusData>,
    serverTime: number,
    loadingAction: string | null,
    onAction: (id: string, action: 'START' | 'STOP' | 'RESTART' | 'DELETE') => void,
    brokers: Broker[],
    isDatafeedSection: boolean,
    isUpdating?: boolean,
    updateScope?: string | null,
    onConfig: (botId: string) => void
}) {
    const isInScope = updateScope === 'ALL' || (updateScope === 'TEST' && acc.isTest) || (updateScope === 'LIVE' && !acc.isTest);
    const botId = getBotId(acc, brokers);
    const status = statuses[botId];
    const lastSeen = status?.lastSeen || 0;
    const timeRef = serverTime || Date.now();
    const isAlive = (timeRef - lastSeen) < 30000;
    const isRunning = acc.status === 'RUNNING';
    const accOk = status ? !!status.account?.connected : (acc.brokerConnectionStatus === 'CONNECTED');
    const isBotConnected = acc.platform === 'NT8' ? (isRunning && (status?.account?.connected || acc.brokerConnectionStatus === 'CONNECTED')) : (isRunning && isAlive && accOk);

    const getStatusBorder = (isRunning: boolean, isConnected: boolean) => {
        if (!isRunning) return 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50';
        if (isRunning && !isConnected) return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
        return 'border-emerald-500 bg-slate-50 dark:bg-slate-800/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
    };

    const statusClass = getStatusBorder(isRunning, isBotConnected);
    const isProcessing = loadingAction === acc.id || (!!isUpdating && isInScope && isRunning);
    const brokerName = getBrokerName(acc.brokerId, brokers);

    const displayBalance = status?.account?.balance !== undefined ? status.account.balance : acc.balance;
    const rawTz = (status?.timezone && status.timezone !== 'Unknown') ? status.timezone : acc.timezone;
    const displayTz = rawTz ? (rawTz.split('/')[1] || rawTz) : '---';

    return (
        <div className={`bg-white dark:bg-slate-900 border-l-4 rounded-r-lg p-3 relative overflow-hidden group transition-colors h-[88px] flex flex-col justify-between ${statusClass} ${isDatafeedSection ? 'border-emerald-500/30' : 'shadow-sm'}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="opacity-90">
                        {acc.platform === 'NT8' ? <img src={`/images/nt8_logo.png?v=${Date.now()}`} alt="NinjaTrader" className="w-5 h-5 object-contain" /> : <img src={`/images/mt5_logo.png?v=${Date.now()}`} alt="MetaTrader 5" className="w-5 h-5 object-contain" />}
                    </div>
                    <div className="flex flex-col">
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none">{acc.login}</div>
                        <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                            {brokerName}{acc.accountSize ? ` (${Math.round(acc.accountSize / 1000)}k)` : ''}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    {acc.isTest ? <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-px rounded uppercase leading-none">TEST</span> : <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-px rounded uppercase leading-none">LIVE</span>}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? (isBotConnected ? 'bg-emerald-500' : 'bg-orange-500') : 'bg-slate-300'}`}></div>
                        {displayTz}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-auto">
                {!isDatafeedSection && <div className={`font-mono font-bold text-[17px] leading-none ${displayBalance ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{displayBalance ? `$${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-'}</div>}
                {isDatafeedSection && <div />}
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onConfig(botId)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 rounded transition-colors" title="Settings"><Settings size={14} /></button>
                    {!isRunning ? <button onClick={() => onAction(acc.id, 'START')} className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded transition-colors" title="Start"><Play size={14} /></button> : <button onClick={() => onAction(acc.id, 'STOP')} className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors" title="Stop"><Square size={14} /></button>}
                    <button onClick={() => onAction(acc.id, 'RESTART')} className="p-1 hover:bg-amber-500/20 text-amber-500 rounded transition-colors" title="Restart"><RotateCw size={14} /></button>
                    <button onClick={() => { const newStatus = !acc.isTest; socketService.socket.emit('update_account_info', { ...acc, isTest: newStatus }); }} className={`p-1 rounded transition-colors ${acc.isTest ? "hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500" : "hover:bg-amber-500/20 text-slate-400 hover:text-amber-500"}`} title={acc.isTest ? "Mark as LIVE" : "Mark as TEST"}><ArrowLeftRight size={14} /></button>
                    <button onClick={() => onAction(acc.id, 'DELETE')} className="p-1.5 hover:bg-red-900/40 text-slate-300 hover:text-red-500 rounded-sm transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
                {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[1px] flex items-center justify-center z-20"><RotateCw className="animate-spin text-indigo-500" size={20} /></div>}
            </div>
        </div>
    );
}
