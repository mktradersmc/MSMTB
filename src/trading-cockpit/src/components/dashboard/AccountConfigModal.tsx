import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldCheck, Target, TrendingDown } from 'lucide-react';
import { fetchDirect } from '../../lib/client-api';

interface AccountConfigModalProps {
    botId: string;
    accountId?: string;
    accountSize?: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function AccountConfigModal({ botId, accountId, accountSize, onClose, onSuccess }: AccountConfigModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({});
    const [localAccountSize, setLocalAccountSize] = useState<number | ''>(accountSize || '');

    // Default structure matching CTradingConfig
    const DEFAULT_CONFIG = {
        risk: {
            percent: 0.5,
            slippage: 3,
            commissions: true,
            lotSplitSize: 20
        },
        account: {
            lossProtection: true,
            lossProtectionPercent: 2.0,
            takeProfitOption: 0, // 0=None
            takeProfitPercent: 1.0,
            takeProfitValue: 1000
        },
        limits: {
            minLot: 0.01,
            maxLot: 50.0
        }
    };

    useEffect(() => {
        loadConfig();
    }, [botId]);

    const loadConfig = async () => {
        try {
            const res = await fetchDirect(`/bot-config/${botId}`);
            const data = await res.json();
            if (data.success && data.config && Object.keys(data.config).length > 0) {
                // Merge with defaults to ensure structure
                setConfig(deepMerge(DEFAULT_CONFIG, data.config));
            } else {
                setConfig(DEFAULT_CONFIG);
            }
        } catch (e) {
            console.error("Failed to load config", e);
            setConfig(DEFAULT_CONFIG);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetchDirect(`/bot-config/${botId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (accountId && localAccountSize !== '') {
                await fetchDirect(`/accounts/${accountId}/size`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ size: Number(localAccountSize) })
                });
            }

            onSuccess();
            onClose();
        } catch (e) {
            console.error("Failed to save", e);
            alert("Failed to save config. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (section: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl">Loading Configuration...</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Configuration
                        </h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">{botId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8">

                    {/* RISK MANAGEMENT */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <ShieldCheck size={16} /> Risk Management & Size
                        </h3>

                        {accountId !== undefined && (
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 mb-6">
                                <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2">Account Size ($)</label>
                                <input
                                    type="number"
                                    value={localAccountSize}
                                    onChange={(e) => setLocalAccountSize(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg px-4 py-3 text-lg font-mono font-bold text-indigo-900 dark:text-indigo-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. 100000"
                                />
                                <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-2 font-medium">Core parameters like risk multipliers are derived from this value.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Risk Per Trade (%)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0.1" max="5.0" step="0.1"
                                        value={config.risk?.percent || 0.5}
                                        onChange={(e) => updateField('risk', 'percent', parseFloat(e.target.value))}
                                        className="flex-1 accent-indigo-600"
                                    />
                                    <span className="font-mono text-lg font-bold text-indigo-600 w-16 text-right">{config.risk?.percent || 0.5}%</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Percentage of account balance risked per trade.</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Slippage (Points)</label>
                                <input
                                    type="number"
                                    value={config.risk?.slippage || 3}
                                    onChange={(e) => updateField('risk', 'slippage', parseInt(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-colors">
                            <input
                                type="checkbox"
                                checked={config.risk?.commissions || false}
                                onChange={(e) => updateField('risk', 'commissions', e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-900 dark:text-white">Include Commissions in Risk</span>
                                <span className="block text-xs text-slate-500">Deduct estimated commissions from position size.</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* DAILY LIMITS */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <TrendingDown size={16} /> Daily Loss Protection
                        </h3>

                        <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={config.account?.lossProtection || false}
                                        onChange={(e) => updateField('account', 'lossProtection', e.target.checked)}
                                        className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="font-bold text-red-700 dark:text-red-400">Enable Daily Max Loss</span>
                                </div>
                                {config.account?.lossProtection && (
                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded uppercase">Active</span>
                                )}
                            </div>

                            {config.account?.lossProtection && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-red-800 dark:text-red-300 mb-1 uppercase">Max Loss % of Start Balance</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0.5" max="10.0" step="0.5"
                                            value={config.account?.lossProtectionPercent || 2.0}
                                            onChange={(e) => updateField('account', 'lossProtectionPercent', parseFloat(e.target.value))}
                                            className="flex-1 accent-red-600"
                                        />
                                        <span className="font-mono text-lg font-bold text-red-600 w-16 text-right">{config.account?.lossProtectionPercent || 2.0}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* PROFIT TARGETS */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Target size={16} /> Daily Profit Target
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Mode</label>
                                <select
                                    value={config.account?.takeProfitOption || 0}
                                    onChange={(e) => updateField('account', 'takeProfitOption', parseInt(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value={0}>Disabled</option>
                                    <option value={1}>Percentage (%)</option>
                                    <option value={2}>Absolute Value ($)</option>
                                </select>
                            </div>

                            {config.account?.takeProfitOption === 1 && (
                                <div className="bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 animate-in fade-in">
                                    <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Target Percentage</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number" step="0.1"
                                            value={config.account?.takeProfitPercent || 1.0}
                                            onChange={(e) => updateField('account', 'takeProfitPercent', parseFloat(e.target.value))}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                        <span className="font-bold text-emerald-600">%</span>
                                    </div>
                                </div>
                            )}

                            {config.account?.takeProfitOption === 2 && (
                                <div className="bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 animate-in fade-in">
                                    <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Target Value</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-600">$</span>
                                        <input
                                            type="number" step="100"
                                            value={config.account?.takeProfitValue || 1000}
                                            onChange={(e) => updateField('account', 'takeProfitValue', parseFloat(e.target.value))}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : <><Save size={18} /> Save Configuration</>}
                    </button>
                </div>

            </div>
        </div>
    );
}

// Simple Deep Merge util
function deepMerge(target: any, source: any) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
