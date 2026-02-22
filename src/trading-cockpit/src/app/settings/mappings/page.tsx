"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Save, RefreshCw, AlertTriangle, CheckCircle2, Search, ArrowLeft, BarChart3, Database, Wand2, FileJson, Plus, Pencil, Trash, Settings } from 'lucide-react';

import { SymbolAutocomplete } from '@/components/ui/SymbolAutocomplete';
import { fetchDirect } from '@/lib/client-api';

// --- Types ---

interface MappingItem {
    originalSymbol: string;
    datafeedSymbol: string;
    brokerMappings: Record<string, string>; // botId -> symbol
}

interface BrokerInfo {
    id: string;
    name: string;
    shorthand: string;
    defaultSymbol?: string;
    servers?: string[];
    symbolMappings?: Record<string, string>;
    environment?: string;
}

// --- Components ---

// --- Utilities ---

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}

const IGNORE_SENTINEL = '__IGNORE__';

const BrokerCard = ({ broker, stats, onClick, onEdit, onDelete }: { broker: BrokerInfo, stats: { mapped: number, ignored: number, total: number }, onClick: () => void, onEdit: (e: React.MouseEvent) => void, onDelete: (e: React.MouseEvent) => void }) => {
    const doneCount = stats.mapped + stats.ignored;
    const percent = stats.total > 0 ? Math.round((doneCount / stats.total) * 100) : 0;
    const isComplete = percent === 100;
    const isStarted = percent > 0;

    // Accounts Style Border Logic
    const borderColorClass = isComplete
        ? 'border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10';

    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden bg-white dark:bg-slate-900 border-l-4 rounded-r-lg p-3 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-auto min-h-[130px] ${borderColorClass}`}
        >
            {/* Header / Identity (Accounts Style) */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-colors text-white font-bold text-sm shrink-0
                        ${broker.environment === 'TEST' ? 'bg-amber-500 shadow-amber-500/20' : (isComplete ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-500 shadow-indigo-500/20')}
                    `}>
                        {broker.shorthand.substring(0, 2)}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{broker.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {broker.shorthand}
                            </span>
                            {broker.environment === 'TEST' && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                    TEST
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Edit Broker"><Pencil size={14} /></button>
                        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Delete Broker"><Trash size={14} /></button>
                    </div>
                    {isComplete && <div className="text-emerald-500"><CheckCircle2 size={16} /></div>}
                </div>
            </div>

            {/* Progress Section */}
            <div className="mt-auto space-y-1.5">
                <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mapping Progress</span>
                    <span className={`text-[10px] font-bold font-mono ${isComplete ? "text-emerald-500" : (isStarted ? "text-indigo-500" : "text-slate-500")}`}>
                        {doneCount} <span className="text-slate-400">/</span> {stats.total}
                    </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    {/* Mapped Segment */}
                    <div
                        className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-700 ease-out"
                        style={{ width: `${(stats.mapped / stats.total) * 100}%` }}
                    />
                    {/* Ignored Segment */}
                    <div
                        className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-700 ease-out"
                        style={{ width: `${(stats.ignored / stats.total) * 100}%` }}
                    />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        {stats.mapped} Mapped
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        {stats.ignored} Ignored
                    </div>
                </div>
            </div>

            {/* Hover Action Hint */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
        </div>
    );
};
const DetailView = ({
    broker,
    onBack,
    allMappings,
    onChange,
    onBulkChange, // New Prop
    brokerSymbols
}: {
    broker: BrokerInfo,
    onBack: () => void,
    allMappings: MappingItem[],
    onChange: (rowIndex: number, val: string) => void,
    onBulkChange: (updates: { index: number, value: string }[]) => void, // New Prop Type
    brokerSymbols: string[]
}) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [autoDetecting, setAutoDetecting] = useState(false); // UI Feedback
    const ITEMS_PER_PAGE = 50;

    // ... (Filter Logic)
    const filteredIndices = useMemo(() => {
        return allMappings.map((m, originalIndex) => ({ m, originalIndex }))
            .filter(({ m }) => {
                const term = search.toLowerCase();
                if (!term) return true;
                const matchOriginal = m.originalSymbol.toLowerCase().includes(term);
                const currentVal = m.brokerMappings[broker.id] || '';
                const matchMapped = currentVal === IGNORE_SENTINEL ? 'not mapped' : currentVal.toLowerCase().includes(term);
                return matchOriginal || matchMapped;
            });
    }, [allMappings, search, broker.shorthand]);

    // Auto Detect Logic
    const handleAutoDetect = () => {
        setAutoDetecting(true);
        const updates: { index: number, value: string }[] = [];
        let count = 0;

        allMappings.forEach((m, idx) => {
            const currentVal = m.brokerMappings[broker.id];
            // Only fill if empty!
            if (!currentVal) {
                const searchName = m.originalSymbol.toLowerCase();
                // Substring Search (Case Insensitive)
                const match = brokerSymbols.find(s => s.toLowerCase().includes(searchName));

                if (match) {
                    updates.push({ index: idx, value: match });
                    count++;
                }
            }
        });

        if (count > 0) {
            onBulkChange(updates);
        }
        setAutoDetecting(false);
    };

    // Pagination Logic
    const visibleItems = filteredIndices.slice(0, page * ITEMS_PER_PAGE);
    const hasMore = visibleItems.length < filteredIndices.length;

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="p-1.5 -ml-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Back to Brokers"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {broker.name} <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">Asset Mappings</span>
                    </h2>
                </div>
            </div>

            {/* Simple Table */}
            {/* ... (Rest of table remains same) */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md relative shadow-sm">

                {/* Table Header & Actions Bar */}
                <div className="bg-slate-50 flex items-center justify-between dark:bg-slate-950 px-4 py-3 border-b border-slate-300 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold w-[250px]">Original Symbol</div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Mapped To ({broker.name})</div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAutoDetect}
                            disabled={autoDetecting}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-md text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                            title="Auto-fill empty fields based on name match"
                        >
                            <Wand2 size={14} />
                            Auto Detect
                        </button>

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Filter symbols..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {visibleItems.map(({ m, originalIndex }) => {
                                const currentVal = m.brokerMappings[broker.id] || '';
                                const isIgnored = currentVal === IGNORE_SENTINEL;

                                return (
                                    <tr key={m.originalSymbol} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isIgnored ? 'opacity-60 bg-slate-50 dark:bg-slate-950/30' : ''}`}>
                                        <td className="p-3 pl-4 w-[250px] align-middle">
                                            <div className={`font-mono font-bold ${isIgnored ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400 dark:decoration-slate-600' : 'text-slate-900 dark:text-slate-200'}`}>{m.originalSymbol}</div>
                                            <div className="text-[10px] text-slate-500">{m.datafeedSymbol.split(':')[0]}</div>
                                        </td>
                                        <td className="p-2 align-middle">
                                            <div className="flex items-center gap-2">
                                                {!isIgnored ? (
                                                    <SymbolAutocomplete
                                                        value={currentVal}
                                                        onChange={(v) => onChange(originalIndex, v)}
                                                        brokerId={broker.id}
                                                        items={brokerSymbols}
                                                        placeholder={`Symbol for ${broker.name}...`}
                                                        className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700/50 focus:border-blue-500/50 w-full h-9 text-sm font-mono flex-1 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                    />
                                                ) : (
                                                    <div className="flex-1 h-9 flex items-center px-3 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed">
                                                        Not Mapped (Ignored)
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => onChange(originalIndex, isIgnored ? '' : IGNORE_SENTINEL)}
                                                    className={`p-2 rounded-lg border transition-all ${isIgnored
                                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        : 'bg-transparent border-transparent text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                                                        }`}
                                                    title={isIgnored ? "Enable Mapping" : "Mark as Not Mapped"}
                                                >
                                                    {isIgnored ? <RefreshCw size={14} /> : <AlertTriangle size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {visibleItems.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-slate-500 italic">
                                        No symbols match your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Load More Trigger */}
                    {hasMore && (
                        <div className="p-4 text-center border-t border-slate-800/50">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium px-4 py-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                            >
                                Load 50 More...
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function AssetMappingsPage({ onUpdate }: { onUpdate?: () => void }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [mappings, setMappings] = useState<MappingItem[]>([]);
    const [initialMappings, setInitialMappings] = useState<MappingItem[]>([]); // For dirty checking
    const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
    const [brokerSymbolsCache, setBrokerSymbolsCache] = useState<Record<string, string[]>>({});

    const [selectedBroker, setSelectedBroker] = useState<BrokerInfo | null>(null);

    // Broker form state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerShort, setNewBrokerShort] = useState('');
    const [newBrokerDefaultSymbol, setNewBrokerDefaultSymbol] = useState('EURUSD');
    const [newBrokerServers, setNewBrokerServers] = useState('');
    const [brokerSaving, setBrokerSaving] = useState(false);

    // Data Load
    const loadData = async () => {
        try {
            // 1. Load Brokers
            const brokersRes = await fetchDirect('/brokers');
            const brokersData = await brokersRes.json();
            setBrokers(brokersData);

            // 2. Load Mappings
            const mapRes = await fetch('/api/mappings');
            const mapData = await mapRes.json();

            setMappings(mapData || []);
            setInitialMappings(JSON.parse(JSON.stringify(mapData || []))); // Deep copy for initial state
        } catch (e) {
            console.error("Failed to load data", e);
            setStatusMsg({ type: 'error', text: "Failed to load configuration." });
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    // Broker Form Handlers
    const resetBrokerForm = () => {
        setEditingId(null);
        setNewBrokerName('');
        setNewBrokerShort('');
        setNewBrokerDefaultSymbol('EURUSD');
        setNewBrokerServers('');
    };

    const handleEditBroker = (e: React.MouseEvent, broker: BrokerInfo) => {
        e.stopPropagation();
        setEditingId(broker.id);
        setNewBrokerName(broker.name);
        setNewBrokerShort(broker.shorthand);
        setNewBrokerDefaultSymbol(broker.defaultSymbol || 'EURUSD');
        setNewBrokerServers(broker.servers?.join(', ') || '');
        setIsAddOpen(true);
    };

    const handleDeleteBroker = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this broker?')) return;
        await fetchDirect(`/brokers/${id}`, { method: 'DELETE' });
        loadData();
    };

    const handleSaveBroker = async () => {
        if (!newBrokerName || !newBrokerShort) return;
        setBrokerSaving(true);
        const existingBroker = editingId ? brokers.find(b => b.id === editingId) : null;
        const payload = {
            id: editingId || undefined,
            name: newBrokerName,
            shorthand: newBrokerShort,
            defaultSymbol: newBrokerDefaultSymbol,
            servers: newBrokerServers.split(',').map((s: string) => s.trim()).filter(Boolean),
            symbolMappings: existingBroker?.symbolMappings || {}
        };

        try {
            await fetchDirect('/brokers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setIsAddOpen(false);
            resetBrokerForm();
            loadData();
        } catch (e) {
            setStatusMsg({ type: 'error', text: "Failed to save broker." });
        } finally {
            setBrokerSaving(false);
        }
    };


    // Lazy Load Symbols when entering Detail View
    useEffect(() => {
        if (selectedBroker && !brokerSymbolsCache[selectedBroker.id]) {
            const fetchSymbols = async () => {
                try {
                    const symRes = await fetch(`/api/broker-symbols/${selectedBroker.id}`);
                    const symList = await symRes.json();
                    const cleanList = symList.map((s: string | { name: string }) => typeof s === 'string' ? s : s.name);

                    setBrokerSymbolsCache(prev => ({
                        ...prev,
                        [selectedBroker.id]: cleanList
                    }));
                } catch (e) {
                    console.warn(`Failed to lazy load symbols for ${selectedBroker.id}`, e);
                }
            };
            fetchSymbols();
        }
    }, [selectedBroker]);

    // Dirty Checking
    const hasChanges = useMemo(() => {
        return JSON.stringify(mappings) !== JSON.stringify(initialMappings);
    }, [mappings, initialMappings]);

    // Change Handler
    const handleCellChange = (rowIndex: number, brokerId: string, val: string) => {
        setMappings(prev => {
            const next = [...prev];
            // Shallow Copy Row
            const row = { ...next[rowIndex] };
            // Shallow Copy Internal Map
            row.brokerMappings = { ...row.brokerMappings, [brokerId]: val };
            next[rowIndex] = row;
            return next;
        });
    };

    // Bulk Change Handler
    const handleBulkChange = (updates: { index: number, value: string }[]) => {
        if (!selectedBroker) return;
        setMappings(prev => {
            const next = [...prev];
            updates.forEach(u => {
                const row = { ...next[u.index] };
                row.brokerMappings = { ...row.brokerMappings, [selectedBroker.id]: u.value };
                next[u.index] = row;
            });
            return next;
        });
    };

    // Save Handler
    const handleSave = async () => {
        setSaving(true);
        try {
            // Optimization: Only send modified? API usually expects full item or we send all.
            // Keeping consistent with previous logic: Send all mappings.
            await Promise.all(mappings.map(async m => {
                const res = await fetch('/api/mappings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(m)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(`Save failed for ${m.originalSymbol}: ${err.error || 'Unknown Error'}`);
                }
            }));

            setInitialMappings(JSON.parse(JSON.stringify(mappings))); // Update baseline
            setStatusMsg({ type: 'success', text: "All mappings saved successfully!" });
            onUpdate?.(); // Notify parent to refresh badge
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (e) {
            console.error(e);
            setStatusMsg({ type: 'error', text: "Failed to save mappings." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500 animate-pulse"><RefreshCw className="animate-spin inline mr-2" /> Loading Configuration...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Broker Configuration
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Manage Broker Connections & Asset Mappings</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!selectedBroker && (
                        <button
                            onClick={() => { resetBrokerForm(); setIsAddOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                        >
                            <Plus size={16} /> Add Broker
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 font-bold rounded-lg shadow-lg transition-all text-sm",
                            hasChanges
                                ? "bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20 active:scale-95"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        {saving ? 'Saving...' : (hasChanges ? 'Save Changes *' : 'No Changes')}
                    </button>
                </div>
            </div>

            <div className={cn(
                "flex-1 p-8 animate-in fade-in zoom-in-95 duration-300",
                selectedBroker ? "overflow-hidden flex flex-col" : "overflow-y-auto"
            )}>

                {statusMsg && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-md ${statusMsg.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'}`}>
                        {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-medium">{statusMsg.text}</span>
                    </div>
                )}

                {/* Content Area */}
                {!selectedBroker ? (
                    /* Dashboard Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {brokers.map(broker => {
                            // Calculate stats
                            const total = mappings.length;
                            const mapped = mappings.filter(m => {
                                const val = m.brokerMappings[broker.id];
                                return !!val && val !== IGNORE_SENTINEL;
                            }).length;
                            const ignored = mappings.filter(m => m.brokerMappings[broker.id] === IGNORE_SENTINEL).length;

                            return (
                                <BrokerCard
                                    key={broker.id}
                                    broker={broker}
                                    stats={{ mapped, ignored, total }}
                                    onClick={() => setSelectedBroker(broker)}
                                    onEdit={(e) => handleEditBroker(e, broker)}
                                    onDelete={(e) => handleDeleteBroker(e, broker.id)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    /* Detail View */
                    <DetailView
                        broker={selectedBroker}
                        onBack={() => setSelectedBroker(null)}
                        allMappings={mappings}
                        onChange={(idx, val) => handleCellChange(idx, selectedBroker.id, val)}
                        onBulkChange={handleBulkChange}
                        brokerSymbols={brokerSymbolsCache[selectedBroker.id] || []}
                    />
                )}
            </div>

            {/* Broker Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{editingId ? 'Edit Broker' : 'Add New Broker'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Broker Name</label>
                                <input
                                    type="text"
                                    placeholder="Broker Name (e.g. FTMO)"
                                    className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white text-sm w-full"
                                    value={newBrokerName}
                                    onChange={e => setNewBrokerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shorthand (ID)</label>
                                <input
                                    type="text"
                                    placeholder="Shorthand (e.g. FTMO)"
                                    className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white text-sm w-full"
                                    value={newBrokerShort}
                                    onChange={e => setNewBrokerShort(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Symbol</label>
                                <input
                                    type="text"
                                    placeholder="Default Symbol (e.g. EURUSD)"
                                    className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white text-sm w-full"
                                    value={newBrokerDefaultSymbol}
                                    onChange={e => setNewBrokerDefaultSymbol(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servers (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. FTMO-Demo, FTMO-Live"
                                    className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white text-sm w-full"
                                    value={newBrokerServers}
                                    onChange={e => setNewBrokerServers(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleSaveBroker}
                                disabled={!newBrokerName || !newBrokerShort || brokerSaving}
                                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {brokerSaving && <RefreshCw size={14} className="animate-spin" />}
                                {editingId ? 'Update Broker' : 'Save Broker'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
