import React, { useState, useEffect } from 'react';
import { Activity, Shield, RefreshCw, Monitor, Moon, Sun, Download, DownloadCloud, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeProvider';
import { useChartTheme } from '../../context/ChartThemeContext';
import { fetchDirect } from '../../lib/client-api';
import { socketService } from '../../services/socket';

export function SystemView() {
    const { theme, setTheme } = useTheme();
    const { mode: chartMode, setMode: setChartMode } = useChartTheme();
    const [isMasterFileOpen, setIsMasterFileOpen] = useState(true);

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
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md pl-3 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="dark">Dark Mode</option>
                                        <option value="light">Light Mode</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Chart Theme</label>
                                <div className="relative">
                                    <select
                                        value={chartMode}
                                        onChange={(e) => setChartMode(e.target.value as 'light' | 'dark')}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md pl-3 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* System Settings */}
                    <SystemSettingsSection />

                    {/* Auto Update UI moved to Management Console */}

                    {/* Master File Monitor */}
                    <SystemFileMonitor
                        isOpen={isMasterFileOpen}
                        onToggle={() => setIsMasterFileOpen(!isMasterFileOpen)}
                    />


                </div>
            </div>
        </div>
    );
}

function SystemSettingsSection() {
    const [path, setPath] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [origUsername, setOrigUsername] = useState('');
    const [origPassword, setOrigPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Use native fetch to hit Next.js API
        fetch('/api/system/config')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.config) {
                    setPath(data.config.projectRoot || 'Path not found');
                    setUsername(data.config.systemUsername || '');
                    setPassword(data.config.systemPassword || '');
                    setOrigUsername(data.config.systemUsername || '');
                    setOrigPassword(data.config.systemPassword || '');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const isModified = username !== origUsername || password !== origPassword;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemUsername: username, systemPassword: password })
            });
            const data = await res.json();

            if (data.success) {
                setOrigUsername(username);
                setOrigPassword(password);
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
        <section className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                System Settings
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Root</label>
                    <input
                        type="text"
                        value={path}
                        readOnly
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-500 dark:text-slate-400 focus:outline-none cursor-default"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSave}
                        disabled={!isModified || saving}
                        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow-sm transition-all text-xs h-[34px] ${isModified ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                    >
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Config'}
                    </button>
                </div>
            </div>
        </section>
    );
}

function SystemFileMonitor({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
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
            <div
                className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Master File Monitor</span>
                    {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                </div>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    {lastUpdate > 0 ? `Updated: ${new Date(lastUpdate).toLocaleTimeString()}` : 'Waiting...'}
                </span>
            </div>

            {isOpen && (
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
            )}
        </section>
    );
}


