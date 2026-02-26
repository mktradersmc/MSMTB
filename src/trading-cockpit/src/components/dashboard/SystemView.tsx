

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Shield, Database, Clock, RefreshCw, FileText, Monitor, Moon, Sun, Terminal, Download, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';
import { useChartTheme } from '../../context/ChartThemeContext';
import { fetchDirect } from '../../lib/client-api';
import { socketService } from '../../services/socket';

interface Features {
    ENABLE_STARTUP_RESTORATION: boolean;
    ENABLE_STARTUP_SANITY_CHECK: boolean;
    ENABLE_PERIODIC_SANITY_CHECK: boolean;
    ENABLE_REGISTRATION_SANITY_CHECK: boolean;
    ENABLE_CONSISTENCY_SCHEDULER: boolean;
    ENABLE_DEEP_HISTORY_SYNC: boolean;
    ENABLE_TICK_LOGGING: boolean;
    ENABLE_INDICATOR_LOGGING: boolean;
    ENABLE_DETAILED_PROTOCOL_LOGGING: boolean;
}

export function SystemView() {
    const { theme, setTheme } = useTheme();
    const { mode: chartMode, setMode: setChartMode } = useChartTheme();
    const [features, setFeatures] = useState<Features | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        try {
            const res = await fetchDirect('/features');
            const data = await res.json();
            if (data.success) {
                setFeatures(data.features);
            }
        } catch (e) {
            console.error("Failed to load features", e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = async (key: keyof Features) => {
        if (!features) return;

        const newValue = !features[key];
        const newFeatures = { ...features, [key]: newValue };
        setFeatures(newFeatures); // Optimistic update

        try {
            setIsSaving(true);
            await fetchDirect('/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newValue })
            });
        } catch (e) {
            console.error("Failed to save feature", e);
            // Revert on error
            setFeatures(features);
        } finally {
            setIsSaving(false);
        }
    };

    const FeatureRow = ({ id, label, desc, icon: Icon, colorClass }: { id: keyof Features, label: string, desc: string, icon: any, colorClass: string }) => (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
            <div className="flex items-center gap-4 flex-1">
                <div className={`w-8 h-8 rounded-md ${colorClass} bg-opacity-10 flex items-center justify-center shrink-0 border border-white/5`}>
                    <Icon className={colorClass} size={16} />
                </div>
                <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-200 text-sm">{label}</h3>
                    <p className="text-slate-500 text-xs hidden group-hover:block transition-all">{desc}</p>
                </div>
            </div>

            <button
                onClick={() => toggleFeature(id)}
                className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${features?.[id] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${features?.[id] ? 'left-5.5' : 'left-0.5'}`} />
            </button>
        </div>
    );

    if (isLoading) return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading Configuration...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">System Performance</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Manage core process isolation and background services</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl space-y-6">

                    {/* Visual Settings - Compact */}
                    <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Appearance
                        </div>
                        <div className="p-4 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Platform Theme</label>
                                <div className="relative">
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="dark">Dark Mode</option>
                                        <option value="light">Light Mode</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Chart Theme</label>
                                <div className="relative">
                                    <select
                                        value={chartMode}
                                        onChange={(e) => setChartMode(e.target.value as 'light' | 'dark')}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Startup & Integrity */}
                    <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Integrity & Startup
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            <FeatureRow
                                id="ENABLE_STARTUP_RESTORATION"
                                label="Startup Cache Restoration"
                                desc="Restores known symbols from cache on startup (500ms)."
                                icon={Database}
                                colorClass="text-blue-500"
                            />
                            <FeatureRow
                                id="ENABLE_STARTUP_SANITY_CHECK"
                                label="Startup Sanity Sweep"
                                desc="Triggers data integrity check 10s after boot."
                                icon={Shield}
                                colorClass="text-emerald-500"
                            />
                            <FeatureRow
                                id="ENABLE_REGISTRATION_SANITY_CHECK"
                                label="Registration Integrity Check"
                                desc="Runs check when new bots register."
                                icon={RefreshCw}
                                colorClass="text-teal-500"
                            />
                        </div>
                    </section>

                    {/* Runtime & Logging */}
                    <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Runtime & Diagnostics
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            <FeatureRow
                                id="ENABLE_CONSISTENCY_SCHEDULER"
                                label="Consistency Scheduler"
                                desc="Enables background scheduler for gap checks."
                                icon={Clock}
                                colorClass="text-amber-500"
                            />
                            <FeatureRow
                                id="ENABLE_PERIODIC_SANITY_CHECK"
                                label="Periodic Heartbeat Audit"
                                desc="Runs check every 5 mins on heartbeat."
                                icon={Activity}
                                colorClass="text-purple-500"
                            />
                            <FeatureRow
                                id="ENABLE_DEEP_HISTORY_SYNC"
                                label="Deep History Sync"
                                desc="Allows fetching deep history (years)."
                                icon={Zap}
                                colorClass="text-orange-500"
                            />
                            <FeatureRow
                                id="ENABLE_TICK_LOGGING"
                                label="Verbose Tick Logging"
                                desc="Logs every tick to console (High Noise)."
                                icon={FileText}
                                colorClass="text-pink-500"
                            />
                            <FeatureRow
                                id="ENABLE_INDICATOR_LOGGING"
                                label="Indicator Logging"
                                desc="Detailed logs for indicator calculations."
                                icon={Activity}
                                colorClass="text-cyan-500"
                            />
                            <FeatureRow
                                id="ENABLE_DETAILED_PROTOCOL_LOGGING"
                                label="Detailed Protocol Logging"
                                desc="Logs EV_BAR_UPDATE and EV_BAR_CLOSED traces (High Noise)."
                                icon={Terminal}
                                colorClass="text-indigo-500"
                            />
                        </div>
                    </section>


                    {/* MT5 Configuration */}
                    <SystemConfigSection />

                    {/* File Monitor & Deployment */}
                    <SystemFileMonitor />

                </div>
            </div>
        </div>
    );
}

function SystemConfigSection() {
    const [path, setPath] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Use native fetch to hit Next.js API, not Backend (3005)
        fetch('/api/system/config')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.config) {
                    setPath(data.config.MT5_MQL5_DIR || '');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Use native fetch to hit Next.js API
            const res = await fetch('/api/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MT5_MQL5_DIR: path })
            });
            const data = await res.json();

            if (data.success) {
                alert("Configuration Saved!");
            } else {
                alert("Failed to save: " + data.error);
            }
        } catch (e: any) {
            alert("Network Error: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                MT5 Master Configuration
            </div>
            <div className="p-4 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Master MQL5 Directory</label>
                    <input
                        type="text"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm transition-all text-xs h-[34px]"
                >
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Path'}
                </button>
            </div>
        </section>
    );
}

function SystemFileMonitor() {
    const [files, setFiles] = useState<any[]>([]);
    const [lastUpdate, setLastUpdate] = useState<number>(0);
    const [isDeploying, setIsDeploying] = useState(false);
    const { socket } = socketService;

    useEffect(() => {
        const onUpdate = (data: any[]) => {
            setFiles(data);
            setLastUpdate(Date.now());
        };

        socket.on('system_files_update', onUpdate);

        // Initial Request
        socket.emit('request_system_files');

        return () => {
            socket.off('system_files_update', onUpdate);
        };
    }, []);

    const handleRedeploy = async () => {
        if (!confirm("⚠️ DEPLOY ALL ARTIFACTS\n\nThis will:\n1. COPY all Experts/Indicators from Master to ALL Instances.\n2. NO PROCESSES will be stopped or restarted.\n\nContinue?")) return;

        setIsDeploying(true);
        try {
            // FIX: Use relative fetch (Next.js API) instead of fetchDirect (Backend 3005)
            const res = await fetch('/api/system/update-bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scope: 'ALL' })
            });
            const data = await res.json();

            if (data.success) {
                alert(`Redeploy Complete!\n${data.message}\nOutput:\n${data.output}`);
            } else {
                alert(`Redeploy Failed: ${data.error}\nDetails: ${data.details}`);
            }
        } catch (e: any) {
            alert("Redeploy Network Error: " + e.message);
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Master File Monitor</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    {lastUpdate > 0 ? `Updated: ${new Date(lastUpdate).toLocaleTimeString()}` : 'Waiting...'}
                </span>
            </div>

            <div className="p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/30 text-[10px] text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-2 font-medium">File</th>
                            <th className="px-4 py-2 font-medium">Path</th>
                            <th className="px-4 py-2 font-medium text-right">Modified</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                        {files.map(f => (
                            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-2 font-mono font-medium">{f.name}</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-[10px]">{f.path}</td>
                                <td className="px-4 py-2 text-right font-mono">
                                    {f.exists ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            {new Date(f.mtime).toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-bold">MISSING</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-slate-500 italic">
                                    Connecting to file monitor...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={handleRedeploy}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                        {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                        Redeploy All
                    </button>
                </div>
            </div>
        </section>
    );
}




