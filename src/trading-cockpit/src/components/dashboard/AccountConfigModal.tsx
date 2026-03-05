import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldCheck, Target, TrendingDown } from 'lucide-react';
import { fetchDirect } from '../../lib/client-api';

interface AccountConfigModalProps {
    botId: string;
    accountId?: string;
    accountSize?: number;
    isTest?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AccountConfigModal({ botId, accountId, accountSize, isTest = false, onClose, onSuccess }: AccountConfigModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({});
    const [localAccountSize, setLocalAccountSize] = useState<number | ''>(accountSize || '');

    const DEFAULT_CONFIG = {
        risk: {
            percent: 0.25,
            slippage: 3,
            commissions: false,
            lotSplitSize: 20
        },
        account: {
            lossProtection: false,
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

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className={`h-14 ${isTest ? "bg-amber-600 text-white" : "bg-indigo-600 text-white"} flex items-center justify-between px-6 shadow-lg z-10 shrink-0`}>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold flex items-center">
                            Configuration
                        </h2>
                        <span className="text-[11px] opacity-80 font-mono bg-black/20 px-2 py-0.5 rounded leading-none flex items-center h-5 mt-px">{botId}</span>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-6">

                    {/* RISK MANAGEMENT */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accountId !== undefined ? (
                                <div className={`bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border flex flex-col justify-center ${isTest ? 'border-amber-200 dark:border-amber-900/50' : 'border-indigo-200 dark:border-indigo-900/50'}`}>
                                    <label className={`block text-xs font-bold uppercase mb-1 ${isTest ? 'text-amber-700 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-400'}`}>Account Size ($)</label>
                                    <input
                                        type="number"
                                        value={localAccountSize}
                                        onChange={(e) => setLocalAccountSize(e.target.value === '' ? '' : Number(e.target.value))}
                                        className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isTest ? 'border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 focus:ring-amber-500' : 'border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 focus:ring-indigo-500'}`}
                                        placeholder="e.g. 100000"
                                    />
                                    <p className={`text-[10px] mt-1.5 font-medium leading-tight ${isTest ? 'text-amber-600 dark:text-amber-500' : 'text-indigo-600 dark:text-indigo-500'}`}>Core parameters like risk multipliers are derived from this value.</p>
                                </div>
                            ) : <div />}

                            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Risk Per Trade (%)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.1" max="5.0" step="0.05"
                                        value={config.risk?.percent || 0.25}
                                        onChange={(e) => updateField('risk', 'percent', parseFloat(e.target.value))}
                                        className={`flex-1 ${isTest ? 'accent-amber-600' : 'accent-indigo-600'}`}
                                    />
                                    <span className={`font-mono text-sm font-bold w-12 text-right ${isTest ? 'text-amber-600' : 'text-indigo-600'}`}>{config.risk?.percent || 0.25}%</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">% of account balance risked per trade.</p>
                            </div>
                        </div>

                        <div className={`flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors ${isTest ? 'hover:border-amber-500/30' : 'hover:border-indigo-500/30'}`}>
                            <input
                                type="checkbox"
                                checked={config.risk?.commissions || false}
                                onChange={(e) => updateField('risk', 'commissions', e.target.checked)}
                                className={`w-4 h-4 rounded border-slate-300 ${isTest ? 'text-amber-600 focus:ring-amber-500' : 'text-indigo-600 focus:ring-indigo-500'}`}
                            />
                            <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Include Commissions in Risk</span>
                                <span className="block text-[10px] text-slate-500">Deduct estimated commissions from position size.</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* DAILY LIMITS */}
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg border transition-colors ${config.account?.lossProtection ? 'bg-red-50 dark:bg-red-950/10 border-red-300 dark:border-red-800/60' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateField('account', 'lossProtection', !config.account?.lossProtection)}>
                                    <input
                                        type="checkbox"
                                        checked={config.account?.lossProtection || false}
                                        readOnly
                                        className={`w-4 h-4 rounded pointer-events-none ${config.account?.lossProtection ? 'border-red-300 text-red-600 focus:ring-red-500' : 'border-slate-300 text-slate-500'}`}
                                    />
                                    <span className={`font-bold text-sm ${config.account?.lossProtection ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>Enable Daily Max Loss</span>
                                </div>
                                {config.account?.lossProtection && (
                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-bold rounded uppercase">Active</span>
                                )}
                            </div>

                            {config.account?.lossProtection && (
                                <div className="animate-in fade-in slide-in-from-top-2 mt-3">
                                    <label className="block text-[10px] font-bold text-red-800 dark:text-red-300 mb-1 uppercase">Max Loss %</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0.5" max="10.0" step="0.25"
                                            value={config.account?.lossProtectionPercent || 2.0}
                                            onChange={(e) => updateField('account', 'lossProtectionPercent', parseFloat(e.target.value))}
                                            className="flex-1 accent-red-600"
                                        />
                                        <span className="font-mono text-sm font-bold text-red-600 w-12 text-right">{config.account?.lossProtectionPercent || 2.0}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>

                    {/* PROFIT TARGETS */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Target Percentage Box */}
                            <div className={`p-3 rounded-lg border transition-colors ${config.account?.takeProfitOption === 1 ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-800/60' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateField('account', 'takeProfitOption', config.account?.takeProfitOption === 1 ? 0 : 1)}>
                                        <input
                                            type="checkbox"
                                            checked={config.account?.takeProfitOption === 1}
                                            readOnly
                                            className={`w-4 h-4 rounded focus:ring-emerald-500 pointer-events-none ${config.account?.takeProfitOption === 1 ? 'border-emerald-300 text-emerald-600' : 'border-slate-300 text-slate-500'}`}
                                        />
                                        <span className={`font-bold text-sm ${config.account?.takeProfitOption === 1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>Daily Profit (%)</span>
                                    </div>
                                    {config.account?.takeProfitOption === 1 && (
                                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">Active</span>
                                    )}
                                </div>
                                {config.account?.takeProfitOption === 1 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 mt-3 flex items-center gap-2">
                                        <input
                                            type="number" step="0.1"
                                            value={config.account?.takeProfitPercent || 1.0}
                                            onChange={(e) => updateField('account', 'takeProfitPercent', parseFloat(e.target.value))}
                                            className="w-24 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-2 py-1.5 text-sm font-mono text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="font-bold text-emerald-600 text-sm">%</span>
                                    </div>
                                )}
                            </div>

                            {/* Target Value Box */}
                            <div className={`p-3 rounded-lg border transition-colors ${config.account?.takeProfitOption === 2 ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-800/60' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateField('account', 'takeProfitOption', config.account?.takeProfitOption === 2 ? 0 : 2)}>
                                        <input
                                            type="checkbox"
                                            checked={config.account?.takeProfitOption === 2}
                                            readOnly
                                            className={`w-4 h-4 rounded focus:ring-emerald-500 pointer-events-none ${config.account?.takeProfitOption === 2 ? 'border-emerald-300 text-emerald-600' : 'border-slate-300 text-slate-500'}`}
                                        />
                                        <span className={`font-bold text-sm ${config.account?.takeProfitOption === 2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>Daily Profit ($)</span>
                                    </div>
                                    {config.account?.takeProfitOption === 2 && (
                                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">Active</span>
                                    )}
                                </div>
                                {config.account?.takeProfitOption === 2 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 mt-3 flex items-center gap-2">
                                        <span className="font-bold text-emerald-600 text-sm">$</span>
                                        <input
                                            type="number" step="100"
                                            value={config.account?.takeProfitValue || 1000}
                                            onChange={(e) => updateField('account', 'takeProfitValue', parseFloat(e.target.value))}
                                            className="w-28 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-2 py-1.5 text-sm font-mono text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50 sticky bottom-0 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 ${isTest ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'} text-white text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2`}
                    >
                        {saving ? 'Saving...' : <><Save size={16} /> Save Configuration</>}
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
