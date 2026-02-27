
import React, { useState, useEffect } from 'react';
import { Plus, Trash, Server, Briefcase, FileJson, X, Save, Pencil, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Broker } from '@/lib/mt-manager/types';
import { fetchDirect } from '../../lib/client-api';

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}

export function SettingsView() {
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerShort, setNewBrokerShort] = useState('');
    const [newBrokerDefaultSymbol, setNewBrokerDefaultSymbol] = useState('EURUSD');
    const [newBrokerServers, setNewBrokerServers] = useState('');
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Mapping State
    const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
    const [mappingList, setMappingList] = useState<{ key: string, value: string }[]>([]);

    // System Config State
    const [sysProjectRoot, setSysProjectRoot] = useState('');
    const [sysUsername, setSysUsername] = useState('');
    const [sysPassword, setSysPassword] = useState('');
    const [isSysLoading, setIsSysLoading] = useState(true);

    const loadSystemConfig = async () => {
        try {
            const res = await fetchDirect('/system/config');
            if (res.ok) {
                const data = await res.json();
                if (data.config) {
                    setSysProjectRoot(data.config.projectRoot || '');
                    setSysUsername(data.config.systemUsername || '');
                }
            }
        } catch (e) {
            console.error("Failed to load system config", e);
        } finally {
            setIsSysLoading(false);
        }
    };

    const handleSaveSystemConfig = async () => {
        try {
            const res = await fetchDirect('/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectRoot: sysProjectRoot,
                    systemUsername: sysUsername,
                    systemPassword: sysPassword ? sysPassword : undefined
                })
            });
            if (res.ok) {
                setStatusMsg({ type: 'success', text: 'System configuration updated successfully!' });
                setSysPassword(''); // Clear password field after saving
            } else {
                setStatusMsg({ type: 'error', text: 'Failed to update system config.' });
            }
        } catch (e) {
            console.error("Failed to save system config", e);
            setStatusMsg({ type: 'error', text: `Failed to save system config: ${(e as Error).message}` });
        }
    };

    useEffect(() => {
        loadBrokers();
        loadSystemConfig();
    }, []);

    const loadBrokers = async () => {
        try {
            const res = await fetchDirect('/brokers');
            const data = await res.json();
            setBrokers(data);
        } catch (e) {
            console.error("Failed to load brokers", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newBrokerName || !newBrokerShort) return;

        // Find existing broker to preserve mappings if editing
        const existingBroker = editingId ? brokers.find(b => b.id === editingId) : null;

        const payload = {
            id: editingId || undefined,
            name: newBrokerName,
            shorthand: newBrokerShort,
            defaultSymbol: newBrokerDefaultSymbol,
            servers: newBrokerServers.split(',').map(s => s.trim()).filter(Boolean),
            symbolMappings: existingBroker?.symbolMappings || {} // Preserve existing mappings
        };

        await fetchDirect('/brokers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        setIsAddOpen(false);
        resetForm();
        loadBrokers();
    };

    const resetForm = () => {
        setEditingId(null);
        setNewBrokerName('');
        setNewBrokerShort('');
        setNewBrokerDefaultSymbol('EURUSD');
        setNewBrokerServers('');
    };

    const handleEdit = (broker: Broker) => {
        setEditingId(broker.id);
        setNewBrokerName(broker.name);
        setNewBrokerShort(broker.shorthand);
        setNewBrokerDefaultSymbol(broker.defaultSymbol || 'EURUSD');
        setNewBrokerServers(broker.servers?.join(', ') || '');
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this broker?')) return;
        await fetchDirect(`/brokers/${id}`, { method: 'DELETE' });
        loadBrokers();
    };

    const handleOpenMappings = (broker: Broker) => {
        setEditingBroker(broker);
        const list = Object.entries(broker.symbolMappings || {}).map(([key, value]) => ({ key, value }));
        if (list.length === 0) list.push({ key: '', value: '' });
        setMappingList(list);
    };

    const handleSaveMappings = async () => {
        if (!editingBroker) return;

        const mappings: Record<string, string> = {};
        mappingList.forEach(m => {
            if (m.key.trim() && m.value.trim()) {
                mappings[m.key.trim()] = m.value.trim();
            }
        });

        const updatedBroker = { ...editingBroker, symbolMappings: mappings };

        await fetchDirect('/brokers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBroker)
        });
        try {
            await fetchDirect('/brokers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBroker)
            });
            setStatusMsg({ type: 'success', text: 'Symbol mappings updated successfully!' });
        } catch (e) {
            console.error("Failed to save mappings", e);
            setStatusMsg({ type: 'error', text: `Failed to save mappings: ${(e as Error).message}` });
        }

        setEditingBroker(null);
        loadBrokers();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">Broker Configuration</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Manage Broker Connections & API Keys</p>
                    </div>
                </div>

                <button
                    onClick={() => { resetForm(); setIsAddOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                    <Plus size={16} /> Add Broker
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {statusMsg && (
                    <div className={cn(
                        "mb-6 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2",
                        statusMsg.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                    )}>
                        {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {statusMsg.text}
                    </div>
                )}

                {/* System Config Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Server size={20} className="text-indigo-500" />
                        System Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Root Directory</label>
                            <input
                                type="text"
                                placeholder="e.g. C:\Trading"
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm w-full"
                                value={sysProjectRoot}
                                onChange={e => setSysProjectRoot(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Username</label>
                            <input
                                type="text"
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm w-full"
                                value={sysUsername}
                                onChange={e => setSysUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New System Password</label>
                            <input
                                type="password"
                                placeholder="Leave blank to keep unchanged"
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm w-full"
                                value={sysPassword}
                                onChange={e => setSysPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={handleSaveSystemConfig}
                            disabled={!sysProjectRoot || !sysUsername}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
                        >
                            <Save size={16} /> Save Configuration
                        </button>
                    </div>
                </div>

                {/* Brokers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
                    {brokers.map(broker => {
                        // Safe check for test environment if property exists, else default to false
                        const isTest = (broker as any).environment === 'TEST';
                        const borderColorClass = isTest
                            ? 'border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                            : 'border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10';

                        return (
                            <div key={broker.id} className={`bg-white dark:bg-slate-900 border-l-4 rounded-r-lg p-4 relative group transition-all duration-300 shadow-sm flex items-center justify-between h-auto ${borderColorClass}`}>

                                {/* Left: Identity */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md shrink-0
                                    ${isTest ? 'bg-amber-500 shadow-amber-500/20' : 'bg-indigo-500 shadow-indigo-500/20'}
                                `}>
                                        {broker.shorthand.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{broker.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {isTest && (
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                                    TEST
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(broker)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Edit Configuration"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(broker.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Delete Broker"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal */}
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                                    onClick={handleSave}
                                    disabled={!newBrokerName || !newBrokerShort}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingId ? 'Update Broker' : 'Save Broker'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mappings Modal */}
                {editingBroker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Symbol Mappings</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Map internal symbols to broker-specific names for <span className="text-indigo-600 dark:text-indigo-400">{editingBroker.name}</span></p>
                                </div>
                                <button onClick={() => setEditingBroker(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                <div className="grid grid-cols-[1fr,1fr,auto] gap-3 text-xs font-bold text-slate-500 uppercase px-1">
                                    <div>Internal (e.g. GER40)</div>
                                    <div>Broker (e.g. DAX30)</div>
                                    <div></div>
                                </div>
                                {mappingList.map((m, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr,1fr,auto] gap-3">
                                        <input
                                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none"
                                            placeholder="Internal"
                                            value={m.key}
                                            onChange={e => {
                                                const newList = [...mappingList];
                                                newList[idx].key = e.target.value;
                                                setMappingList(newList);
                                            }}
                                        />
                                        <input
                                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none"
                                            placeholder="Broker Symbol"
                                            value={m.value}
                                            onChange={e => {
                                                const newList = [...mappingList];
                                                newList[idx].value = e.target.value;
                                                setMappingList(newList);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newList = mappingList.filter((_, i) => i !== idx);
                                                setMappingList(newList);
                                            }}
                                            className="text-slate-600 hover:text-red-400 p-2"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setMappingList([...mappingList, { key: '', value: '' }])}
                                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 px-1"
                                >
                                    <Plus size={16} /> Add Mapping
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button onClick={() => setEditingBroker(null)} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button onClick={handleSaveMappings} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-2">
                                    <Save size={18} /> Save Mappings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
