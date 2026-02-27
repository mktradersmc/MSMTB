import React, { useEffect, useState, useMemo } from 'react';
import { Database, RefreshCw, Save, CheckCircle2, AlertCircle, Trash2, AlertTriangle, Play, Square, RotateCw, Download, Plus, Clock, Edit2, Link, Link2, Search, Power, ArrowLeftRight, Settings } from 'lucide-react';
import { socketService } from '../../services/socket';
import { AddAccountModal } from './AddAccountModal';
import { DatafeedSelectionModal } from './DatafeedSelectionModal';
import { NinjaTraderCredentialsModal } from './NinjaTraderCredentialsModal';
import { fetchDirect, fetchSystem, API_URLS } from '../../lib/client-api';

import { TradingAccount, StatusData } from '@/lib/mt-manager/types';

interface SymbolItem {
    name: string;
    path: string;
    desc: string;
    botId?: string;
}

interface BrokerInfo {
    id: string;
    name: string;
    shorthand: string;
}

interface RowItem {
    id: string;
    originalName: string;
    source: {
        botId: string;
        symbol: string;
    } | null;
}

export function DatafeedView() {
    const [availableSymbols, setAvailableSymbols] = useState<SymbolItem[]>([]);
    const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
    const [rows, setRows] = useState<RowItem[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [mappingCache, setMappingCache] = useState<Map<string, string>>(new Map());
    const [mappingsLoaded, setMappingsLoaded] = useState(false);

    // Modal State
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [ntCredentialsAccount, setNtCredentialsAccount] = useState<TradingAccount | null>(null);

    const [hasChanges, setHasChanges] = useState(false);

    // Account Management
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [statuses, setStatuses] = useState<Record<string, StatusData>>({});
    const [serverTime, setServerTime] = useState<number>(Date.now());
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState<{ hasUpdate: boolean, lastDeployed: number, available: number, updatedFiles: string[] } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        fetchDirect('/brokers')
            .then(res => res.json())
            .then(data => setBrokers(data))
            .catch(e => console.error("Failed to load brokers", e));

        fetchDirect('/mappings')
            .then(res => res.json())
            .then(data => {
                const cache = new Map<string, string>();
                if (Array.isArray(data)) {
                    data.forEach((m: any) => cache.set(m.datafeedSymbol, m.originalSymbol));
                }
                setMappingCache(cache);
            })
            .catch(e => console.error("Failed to load mappings", e))
            .finally(() => setMappingsLoaded(true));
    }, []);

    useEffect(() => {
        const socket = socketService.getSocket();
        const onSymbols = (list: any[]) => {
            const normalized: SymbolItem[] = list.map(item => {
                if (typeof item === 'string') return { name: item, path: 'Legacy', desc: '', botId: 'Default' };
                return item;
            }).filter(s => {
                const id = s.botId || 'Default';
                return id === 'Default' || id.endsWith('_DATAFEED');
            });

            setAvailableSymbols(normalized);
            setLoading(false);
        };

        const onConfigAck = (data: any) => {
            setSaving(false);
            setHasChanges(false);
            setStatusMsg({ type: 'success', text: `Configuration saved! Synced ${data.count} symbols.` });
            setTimeout(() => setStatusMsg(null), 3000);
        };

        socket.on('all_symbols_list', onSymbols);
        socket.on('config_ack', onConfigAck);
        setLoading(true);
        socket.emit('get_all_symbols'); // Cache First (Instant)

        loadData();
        checkUpdates();
        fetchStatus();

        const statusInterval = setInterval(() => {
            fetchStatus();
            loadData();
        }, 500);
        const updateInterval = setInterval(checkUpdates, 30000);

        return () => {
            socket.off('all_symbols_list', onSymbols);
            socket.off('config_ack', onConfigAck);
            clearInterval(statusInterval);
            clearInterval(updateInterval);
        };
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetchDirect('/symbols');
                const data = await res.json();
                if (data.symbols && Array.isArray(data.symbols)) {
                    const newRows: RowItem[] = [];
                    data.symbols.forEach((s: any) => {
                        // FIX: Use datafeedSymbol (Broker) if available, otherwise fallback to symbol (Internal)
                        let symbol = (typeof s !== 'string' && s.datafeedSymbol) ? s.datafeedSymbol : (typeof s === 'string' ? s : s.symbol);

                        // FIX: Strip BotID prefix (BotID:Symbol) to ensure we display/save only the clean Broker Symbol
                        if (symbol && typeof symbol === 'string' && symbol.includes(':')) {
                            symbol = symbol.split(':').pop() || symbol;
                        }
                        const botId = (typeof s !== 'string' && s.botId) ? s.botId : 'Default';

                        // Original Name is always the Internal Symbol
                        const internalName = (typeof s !== 'string' && s.originalName) ? s.originalName : (typeof s === 'string' ? s : s.symbol);
                        const key = `${botId}:${symbol}`;

                        // Fallback to cache or internal name
                        const original = mappingCache.get(key) || internalName;

                        newRows.push({
                            id: crypto.randomUUID(),
                            originalName: original,
                            source: { botId, symbol }
                        });
                    });

                    if (newRows.length > 0) {
                        setRows(newRows.sort((a, b) => a.originalName.localeCompare(b.originalName)));
                    }
                }
            } catch (e) {
                console.error("Init Selection Error", e);
            }
        };

        // Only run init once mappings are loaded (or failed) and we haven't loaded rows yet
        if (mappingsLoaded && rows.length === 0) {
            init();
        }
    }, [mappingsLoaded, rows.length, mappingCache]);

    const fetchStatus = async () => {
        try {
            const res = await fetchDirect('/status/heartbeat');
            const data = await res.json();
            if (data.success) {
                setStatuses(data.services);
                if (data.serverTime) setServerTime(data.serverTime);
            }
        } catch (e) { }
    };

    const loadData = async () => {
        try {
            const accRes = await fetchDirect('/accounts');
            const accData = await accRes.json();
            // Support both Array and Object wrapper (API V2)
            const list = Array.isArray(accData) ? accData : (accData.accounts || []);
            setAccounts(list);
        } catch (e) {
            console.error("Failed to load accounts", e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const checkUpdates = async () => {
        try {
            const res = await fetchSystem('/system/check-updates');
            const data = await res.json();
            setUpdateAvailable(data);
        } catch (e) { }
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
            if (res.ok) await loadData();
            else {
                const data = await res.json();
                setStatusMsg({ type: 'error', text: `Action Failed: ${data.error || 'Unknown Error'}` });
                setTimeout(() => setStatusMsg(null), 5000);
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: "Network Error" });
            setTimeout(() => setStatusMsg(null), 5000);
        } finally {
            setLoadingAction(null);
        }
    };

    // Redeploy Removed per User Request

    const handleSave = () => {
        const invalid = rows.find(r => !r.originalName.trim());
        if (invalid) {
            setStatusMsg({ type: 'error', text: "All rows must have an Original Symbol name." });
            return;
        }

        setSaving(true);
        // Filter out rows with no source
        const validRows = rows.filter(r => r.source !== null);

        const list = validRows.map(item => ({
            symbol: item.source!.symbol,
            botId: item.source!.botId,
            enabled: true,
            originalName: item.originalName.trim()
        }));

        socketService.getSocket().emit('config_update', list);
    };

    const getBrokerName = (botId: string) => {
        const broker = brokers.find(b => botId.startsWith(b.shorthand));
        return broker ? broker.name : botId.replace('_DATAFEED', '');
    };

    const getBotId = (acc: TradingAccount) => {
        const broker = brokers.find(b => b.id === acc.brokerId);
        const short = (broker?.shorthand || 'UNK').replace(/\s+/g, '');
        let id = `${short}_${acc.login}`;
        if (acc.accountType === 'DATAFEED' || acc.isDatafeed) id += '_DATAFEED';
        return id;
    };

    // Row Operations
    const addRow = () => {
        const newRow: RowItem = {
            id: crypto.randomUUID(),
            originalName: '',
            source: null
        };
        setRows([newRow, ...rows]);
        setHasChanges(true);
    };

    const updateRowName = (id: string, name: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, originalName: name } : r));
        setHasChanges(true);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
        setHasChanges(true);
    };

    const openSelection = (rowId: string) => {
        // Force Refresh from Backend (DB + Active) before showing dialog
        socketService.getSocket().emit('refresh_symbols');
        setActiveRowId(rowId);
        setIsSelectionOpen(true);
    };

    const handleSelection = (symbol: SymbolItem) => {
        if (activeRowId) {
            setRows(rows.map(r => r.id === activeRowId ? {
                ...r,
                source: {
                    botId: symbol.botId || 'Default',
                    symbol: symbol.name
                },
                // If original name is empty, auto-fill it with the symbol name
                originalName: r.originalName.trim() ? r.originalName : symbol.name
            } : r));
            setHasChanges(true);
        }
        setIsSelectionOpen(false);
        setActiveRowId(null);
    };

    const filteredRows = useMemo(() => {
        if (!filter) return rows;
        const lower = filter.toLowerCase();
        return rows.filter(r =>
            r.originalName.toLowerCase().includes(lower) ||
            (r.source && r.source.symbol.toLowerCase().includes(lower))
        );
    }, [rows, filter]);

    const handleRefreshAll = async () => {
        await loadData();
        // Refresh brokers to ensure any newly initialized broker connections are reflected
        try {
            const res = await fetchDirect('/brokers');
            if (res.ok) setBrokers(await res.json());
        } catch (e) { console.error("Failed to refresh brokers", e); }

        // Trigger symbol refresh from backend
        setLoading(true);
        socketService.getSocket().emit('refresh_symbols');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Database size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Datafeeds & Symbols
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Manage trading symbols and datafeed sources</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* RESTART (Replaces Redeploy) */}
                    <RestartControl scope="DATAFEED" accounts={accounts} onAction={handleAction} />

                    <button onClick={() => socketService.getSocket().emit('refresh_symbols')} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Refresh from Broker">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 transition-all active:scale-95 text-sm">
                        <Plus size={16} /> Add New Datafeed
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-2 font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${hasChanges ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}`}
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        {hasChanges ? 'Save Changes' : 'Saved'}
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="animate-in fade-in zoom-in-95 duration-300">

                    {/* Active Sources */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Power size={14} className="text-emerald-500" /> Active Datafeed Sources
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {accounts.filter(a => a.accountType === 'DATAFEED' || a.isDatafeed).map(acc => (
                                <CompactAccountCard
                                    key={acc.id}
                                    acc={acc}
                                    status={statuses[getBotId(acc)]}
                                    serverTime={serverTime}
                                    loading={loadingAction === acc.id || isUpdating}
                                    onAction={handleAction}
                                    onConfig={(account) => setNtCredentialsAccount(account)}
                                    brokerName={brokers.find(b => b.id === acc.brokerId)?.name || 'Unknown'}
                                    brokers={brokers}
                                />
                            ))}
                            {accounts.filter(a => a.accountType === 'DATAFEED' || a.isDatafeed).length === 0 && (
                                <div className="text-sm text-slate-500 italic py-2">No datafeed sources connected.</div>
                            )}
                        </div>
                    </div>

                    {statusMsg && (
                        <div className={cn(
                            "mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium",
                            statusMsg.type === 'success'
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        )}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {statusMsg.text}
                        </div>
                    )}

                    {/* Filter Bar & Table Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter symbols..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{rows.length} SYMBOLS</span>
                                <button onClick={addRow} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm transition-all text-xs active:scale-95">
                                    <Plus size={14} /> Add Pattern
                                </button>
                            </div>
                        </div>

                        {/* Table Area - No longer internal flex-1, allows page scroll */}
                        {loading ? (
                            <div className="p-12 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <RefreshCw className="animate-spin text-emerald-500" size={32} />
                                    <p className="text-slate-500 text-sm font-medium">Loading Symbol Configuration...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[240px]">Symbol Pattern / Name</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Source Mechanism</th>
                                            <th className="px-6 py-3 w-[60px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {filteredRows.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-12 text-center text-slate-500 italic">
                                                    No symbols found. Click "Add Pattern" to define a new symbol mapping.
                                                </td>
                                            </tr>
                                        )}
                                        {filteredRows.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={row.originalName}
                                                        onChange={e => updateRowName(row.id, e.target.value)}
                                                        placeholder="e.g. BTCUSD"
                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    {row.source ? (
                                                        <div
                                                            onClick={() => openSelection(row.id)}
                                                            className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer group/source transition-all shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-md font-mono">{getBrokerName(row.source.botId)}</span>
                                                                <span className="text-slate-300">/</span>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">{row.source.symbol}</span>
                                                            </div>
                                                            <Edit2 size={14} className="text-slate-400 opacity-0 group-hover/source:opacity-100 transition-opacity" />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => openSelection(row.id)}
                                                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-medium"
                                                        >
                                                            <Link2 size={14} /> Assign Data Source
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => removeRow(row.id)}
                                                        className="p-2 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                                        title="Remove Symbol"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isAddOpen && (
                <AddAccountModal
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={handleRefreshAll}
                    title="New Datafeed"
                    initialType="DATAFEED"
                    existingAccounts={accounts}
                />
            )}

            {ntCredentialsAccount && (
                <NinjaTraderCredentialsModal
                    account={ntCredentialsAccount}
                    onClose={() => setNtCredentialsAccount(null)}
                    onSuccess={handleRefreshAll}
                />
            )}

            <DatafeedSelectionModal
                isOpen={isSelectionOpen}
                onClose={() => { setIsSelectionOpen(false); setActiveRowId(null); }}
                onSelect={handleSelection}
                availableSymbols={availableSymbols}
                brokers={brokers}
            />
        </div>
    );
}

// --- HELPER FUNCTIONS ---
function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}

const getBrokerShorthand = (id: string, brokers: BrokerInfo[]) => brokers.find(b => b.id === id)?.shorthand || 'UNK';

// Re-implement getBotId to be consistent with AccountsView but looking at BrokerInfo[]
const getBotIdCommon = (acc: TradingAccount, brokers: BrokerInfo[]) => {
    const short = getBrokerShorthand(acc.brokerId, brokers).replace(/\s+/g, '');
    let id = `${short}_${acc.login}`;
    if (acc.accountType === 'DATAFEED' || acc.isDatafeed) {
        id += '_DATAFEED';
    }
    return id;
};

const getStatusBorder = (isRunning: boolean, isConnected: boolean) => {
    if (!isRunning) return 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'; // Offline
    if (isRunning && !isConnected) return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 shadow-[0_0_10px_rgba(249,115,22,0.1)]'; // Warning
    return 'border-emerald-500 bg-slate-50 dark:bg-slate-800/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'; // Online (Matches Hover)
};

const RestartControl = ({ scope, accounts, onAction }: { scope: 'TRADING' | 'DATAFEED', accounts: TradingAccount[], onAction: (id: string, action: 'START' | 'STOP' | 'RESTART' | 'DELETE') => Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = async (type: 'ALL' | 'ACTIVE') => {
        if (!confirm(`Restart ${type === 'ALL' ? 'ALL' : 'ACTIVE'} ${scope} instances sequentially?`)) return;

        setIsRestarting(true);
        try {
            // Find targets based on scope and type
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
                // Ignore deterministic 'Detected' IDs when bulk restarting actions.
                if (acc.server === 'Detected' || acc.id.startsWith('fix_') || acc.id.startsWith('gen_')) continue;
                console.log(`[RestartControl] Restarting ${acc.login} (${acc.id})...`);
                await onAction(acc.id, 'RESTART');
                // Small delay between instances
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
        <div className={`flex items-stretch text-slate-700 dark:text-white rounded-lg shadow-sm dark:shadow-lg overflow-hidden border border-slate-300 dark:border-slate-700 ${isRestarting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Label - Darker, Non-clickable */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-200 border-r border-slate-200 dark:border-slate-900">
                <RotateCw size={14} className={isRestarting ? 'animate-spin text-amber-500' : 'text-slate-400'} />
                <span className="tracking-wide">Restart</span>
            </div>

            {/* Button 1: Active */}
            <button
                onClick={() => handleRestart('ACTIVE')}
                disabled={isRestarting}
                className="px-3 py-2 bg-white dark:bg-slate-700 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-600 dark:hover:text-white font-bold text-sm transition-colors border-r border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
                {isRestarting ? '...' : 'Active'}
            </button>

            {/* Button 2: All */}
            <button
                onClick={() => handleRestart('ALL')}
                disabled={isRestarting}
                className="px-3 py-2 bg-white dark:bg-slate-700 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-600 dark:hover:text-white font-bold text-sm transition-colors flex items-center gap-1"
                title="Restart ALL"
            >
                All
            </button>
        </div>
    );
};

function CompactAccountCard({ acc, status, serverTime, loading, onAction, onConfig, brokerName, brokers }: {
    acc: TradingAccount;
    status: StatusData;
    serverTime: number;
    loading: boolean;
    onAction: (id: string, action: 'START' | 'STOP' | 'RESTART' | 'DELETE') => void;
    onConfig: (account: TradingAccount) => void;
    brokerName: string;
    brokers: BrokerInfo[];
}) {
    // Status Logic matches AccountCard
    const lastSeen = status?.lastSeen || 0;
    const timeRef = serverTime || Date.now();
    const isAlive = (timeRef - lastSeen) < 30000 && (status?.connected !== false);

    // For Datafeed, we care if the process is running and if the EA is reporting (Alive)
    // "Connected" means Broker Connection is OK
    // UI correctly shows RUNNING if the actual backend worker is sending heartbeats, overriding a stale DB STOPPED state.
    const isRunning = acc.status === 'RUNNING' || isAlive;
    const accOk = status ? !!status.account?.connected : (acc.brokerConnectionStatus === 'CONNECTED');
    // Extract Timezone short code (e.g. "New_York")
    const rawTz = acc.timezone;
    const tz = rawTz ? (rawTz.split('/')[1] || rawTz) : '---';

    // 3-State Logic for Border
    const isBotConnected = acc.platform === 'NT8'
        ? (isRunning && (status?.account?.connected || acc.brokerConnectionStatus === 'CONNECTED'))
        : (isRunning && isAlive && accOk);

    const statusClass = getStatusBorder(isRunning, isBotConnected);

    const isNt8 = acc.platform === 'NT8';
    const ntMissingCreds = isNt8 && (!acc.login || !acc.password);

    return (
        <div className={`bg-white dark:bg-slate-900 border-l-4 rounded-r-lg p-3 relative overflow-hidden group transition-colors min-h-[88px] flex items-center justify-between ${statusClass} shadow-sm min-w-[280px]`}>

            {/* Left: Logo + Info */}
            <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="opacity-90 shrink-0 relative">
                    {acc.platform === 'NT8' ?
                        <img src={`/images/nt8_logo.png`} alt="NinjaTrader" className="w-8 h-8 object-contain" /> :
                        <img src={`/images/mt5_logo.png`} alt="MetaTrader 5" className="w-8 h-8 object-contain" />
                    }
                    {ntMissingCreds && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-slate-900" title="Missing Credentials"></div>
                    )}
                </div>
                {/* Info Text */}
                <div className="flex flex-col justify-center">
                    {/* Top: Broker Name (Replaces Login) */}
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-tight whitespace-normal break-words" title={brokerName}>
                        {brokerName}
                    </div>
                    {/* Bottom: Timezone + Status (Replaces Broker Name) */}
                    <div className="text-[11px] text-slate-400 font-medium leading-tight mt-1 flex items-center gap-1 font-mono">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? (isBotConnected ? 'bg-emerald-500' : 'bg-orange-500') : 'bg-slate-300'}`} title="Status"></div>
                        <span>{tz}</span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity pl-2">
                {isNt8 && (
                    <button onClick={() => onConfig(acc)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded transition-colors" title="Settings">
                        <Settings size={16} />
                    </button>
                )}
                {!isRunning ? (
                    <button
                        onClick={() => onAction(acc.id, 'START')}
                        disabled={ntMissingCreds}
                        className={`p-1.5 rounded transition-colors ${ntMissingCreds ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-emerald-500/20 text-emerald-500'}`}
                        title={ntMissingCreds ? "Missing Credentials" : "Start"}
                    >
                        <Play size={16} />
                    </button>
                ) : (
                    <button onClick={() => onAction(acc.id, 'STOP')} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded transition-colors" title="Stop">
                        <Square size={16} />
                    </button>
                )}
                <button onClick={() => onAction(acc.id, 'RESTART')} className="p-1.5 hover:bg-amber-500/20 text-amber-500 rounded transition-colors" title="Restart">
                    <RotateCw size={16} />
                </button>
                <button onClick={() => onAction(acc.id, 'DELETE')} className="p-1.5 hover:bg-red-900/40 text-slate-300 hover:text-red-500 rounded-sm transition-colors" title="Delete">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* LOADING OVERLAY */}
            {loading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <RefreshCw className="animate-spin text-indigo-600 dark:text-white" size={20} />
                </div>
            )}
        </div>
    );
}
