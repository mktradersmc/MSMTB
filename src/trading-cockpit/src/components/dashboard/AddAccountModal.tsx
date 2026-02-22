
import React, { useState, useEffect } from 'react';
import { X, Server, Key, User, Download } from 'lucide-react';
import { Broker, TradingAccount } from '@/lib/mt-manager/types';
import { fetchDirect, fetchSystem } from '../../lib/client-api';

interface AddAccountModalProps {
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    initialType?: 'TRADING' | 'DATAFEED';
    existingAccounts?: TradingAccount[];
    isTestMode?: boolean;
}

export function AddAccountModal({ onClose, onSuccess, title, initialType = 'TRADING', existingAccounts = [], isTestMode = false }: AddAccountModalProps) {
    const [brokers, setBrokers] = useState<Broker[]>([]);

    // Form
    const [selectedBrokerId, setSelectedBrokerId] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [server, setServer] = useState('');
    const [accountType] = useState<'TRADING' | 'DATAFEED'>(initialType);
    const [platform, setPlatform] = useState<'MT5' | 'NT8'>('MT5'); // Default MT5
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with parent mode if provided
    const [isTest, setIsTest] = useState(isTestMode);

    // Import State
    const [importAccountId, setImportAccountId] = useState('');

    useEffect(() => {
        fetchDirect('/brokers').then(r => r.json()).then(setBrokers);
    }, []);

    const selectedBroker = brokers.find(b => b.id === selectedBrokerId);

    // Filter available accounts for import (Trading only, not Datafeed)
    const importableAccounts = existingAccounts.filter(a => a.accountType !== 'DATAFEED' && !a.isDatafeed);

    const handleImportAccount = (accId: string) => {
        setImportAccountId(accId);
        if (!accId) {
            // Reset form if cleared? maybe not clear, just stop tracking
            return;
        }

        const acc = existingAccounts.find(a => a.id === accId);
        if (acc) {
            setSelectedBrokerId(acc.brokerId);
            setLogin(acc.login);
            setPassword(acc.password);
            setServer(acc.server);
            setIsTest(!!acc.isTest);
        }
    };

    const handleSubmit = async () => {
        if (!selectedBrokerId || !login || !password || !server) {
            setError("All fields are required");
            return;
        }

        setIsDeploying(true);
        setError(null);

        try {
            const res = await fetchSystem('/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brokerId: selectedBrokerId,
                    login,
                    password,
                    server,
                    accountType,
                    isTest, // Pass to API
                    platform
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Deployment failed');
            }

            onSuccess();
            onClose();

        } catch (e: any) {
            setError(e.message);
            setIsDeploying(false);
        }
    };

    // Calculate Header Styles based on Mode
    const headerBgClass = isTestMode ? "bg-amber-600 text-white" : "bg-indigo-600 text-white";
    const headerTitle = title || (initialType === 'DATAFEED'
        ? 'New Datafeed'
        : (isTestMode ? 'New TEST Trading Account' : 'New LIVE Trading Account'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className={`h-14 ${headerBgClass} flex items-center justify-between px-6 shadow-lg`}>
                    <h3 className="font-bold flex items-center gap-2">
                        {headerTitle}
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Import Option (Only for Datafeed) */}
                    {accountType === 'DATAFEED' && importableAccounts.length > 0 && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-2">
                                <Download size={12} /> Import Configuration
                            </label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-slate-300 focus:border-indigo-500 outline-none"
                                value={importAccountId}
                                onChange={(e) => handleImportAccount(e.target.value)}
                            >
                                <option value="">Select Existing Trading Account...</option>
                                <option value="">---</option>
                                {importableAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.login} ({acc.server})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Info Banner for Mode */}
                    {accountType === 'TRADING' && (
                        <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isTestMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                                {isTestMode ? "Test Environment Active" : "Live Environment Active"}
                            </div>
                            <div className="text-sm">
                                You are creating a <strong className="underline">{isTestMode ? "SIMULATION" : "REAL SPEC"}</strong> account.
                            </div>
                        </div>
                    )}

                    {/* Platform Selection */}
                    {accountType === 'TRADING' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Platform</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPlatform('MT5')}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${platform === 'MT5' ? (isTestMode ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-indigo-600 bg-indigo-600/10 text-indigo-600') : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    MetaTrader 5
                                </button>
                                <button
                                    onClick={() => setPlatform('NT8')}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${platform === 'NT8' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    NinjaTrader 8
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Broker Select */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Broker</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                            value={selectedBrokerId}
                            onChange={e => { setSelectedBrokerId(e.target.value); setServer(''); }}
                        >
                            <option value="">Select Broker...</option>
                            {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Server Select (Dependent) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Broker Server</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                            value={server}
                            onChange={e => setServer(e.target.value)}
                            disabled={!selectedBroker}
                        >
                            <option value="">Select Server...</option>
                            {selectedBroker?.servers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Login */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login (Account #)</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 pl-10 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="12345678"
                                value={login}
                                onChange={e => setLogin(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <div className="relative">
                            <Key size={16} className="absolute left-3 top-3.5 text-slate-500" />
                            <input
                                type="password"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 pl-10 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isDeploying}
                        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isDeploying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deploying...
                            </>
                        ) : 'Deploy Instance'}
                    </button>
                </div>
            </div>
        </div>
    );
}
