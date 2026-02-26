import React, { useState, useEffect } from 'react';
import { X, Save, Key, User, Target } from 'lucide-react';
import { fetchDirect } from '../../lib/client-api';
import { TradingAccount } from '../../lib/mt-manager/types';

interface NinjaTraderCredentialsModalProps {
    account: TradingAccount;
    onClose: () => void;
    onSuccess: () => void;
}

export function NinjaTraderCredentialsModal({ account, onClose, onSuccess }: NinjaTraderCredentialsModalProps) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (account) {
            setLogin(account.login || '');
            setPassword(account.password || '');
        }
    }, [account]);

    const handleSave = async () => {
        if (!login || !password) {
            setError("Both username and password are required.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Update the existing account with new login and password
            const updatedAccount = {
                ...account,
                login,
                password
            };

            const res = await fetchDirect('/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAccount)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save credentials.');
            }

            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col">

                {/* Header */}
                <div className="h-14 bg-indigo-600 dark:bg-indigo-700 flex items-center justify-between px-6 shadow-lg shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Key size={18} />
                        NinjaTrader Credentials
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                            Enter the NinjaTrader 8 credentials required to auto-login and establish the datafeed connection.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    placeholder="NinjaTrader Username"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 pl-10 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 pl-10 text-slate-900 dark:text-slate-200 focus:border-indigo-500 outline-none transition-colors font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                        {isSaving ? 'Saving...' : <><Save size={16} /> Save Credentials</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
