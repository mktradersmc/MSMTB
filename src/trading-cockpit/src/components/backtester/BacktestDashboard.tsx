import React, { useState, useEffect } from 'react';
import { useBacktest } from '../../contexts/BacktestContext';
import { Play, Plus, Trash2, X, FlaskConical, LayoutDashboard } from 'lucide-react';
import { SymbolBrowser } from '../live/SymbolBrowser';

const formatDate = (date: number | string | Date) => {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
};

export const BacktestDashboard: React.FC = () => {
    const { refreshSessions, startSession, resumeSession, activeSession, deleteSession } = useBacktest();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);

    // New Session Form State
    const [name, setName] = useState('');
    const [balance, setBalance] = useState(100000);
    const [startDate, setStartDate] = useState('');
    const [mainSymbol, setMainSymbol] = useState('EURUSD');

    const loadSessions = async () => {
        setIsLoading(true);
        const list = await refreshSessions();
        setSessions(list);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const startTimestamp = new Date(startDate).getTime();
        await startSession({
            name,
            main_symbol: mainSymbol,
            initial_balance: balance,
            start_time: startTimestamp
        });
        // State updates logic relies on page.tsx detecting activeSession
    };

    const handleResume = async (id: string) => {
        await resumeSession(id);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FlaskConical size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Backtest Replay Engine
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Simulated Trading Environment</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                <div className="w-full max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Simulations</h3>
                        {!showNew && (
                            <button
                                onClick={() => setShowNew(true)}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors shadow-sm"
                            >
                                <Plus size={18} /> New Session
                            </button>
                        )}
                    </div>

                    {showNew ? (
                        <form onSubmit={handleCreate} className="w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-fit">
                            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Create New Backtest</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Session Name</label>
                                    <input
                                        type="text" required value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none transition-all"
                                        placeholder="e.g. My SMC Strategy Test"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Main Symbol</label>
                                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1">
                                            <SymbolBrowser
                                                variant="button"
                                                currentSymbol={mainSymbol}
                                                onSelectSymbol={(sym) => setMainSymbol(sym)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Starting Balance</label>
                                        <input
                                            type="number" required value={balance} onChange={e => setBalance(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                                    <input
                                        type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none transition-all font-mono"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Select the exact time the simulation will begin drawing data from.</p>
                                </div>
                                <div className="pt-4 flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium">Start Simulation</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                                        <th className="px-4 py-2.5">Name</th>
                                        <th className="px-4 py-2.5">Symbol</th>
                                        <th className="px-4 py-2.5 whitespace-nowrap">Timespan</th>
                                        <th className="px-4 py-2.5 text-right">Balance</th>
                                        <th className="px-4 py-2.5 text-right w-24">Profit</th>
                                        <th className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="text-center p-8 text-slate-500">Loading sessions...</td></tr>
                                    ) : sessions.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center p-12">
                                            <FlaskConical size={32} className="mx-auto text-slate-400 mb-3 opacity-50" />
                                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No active simulations</h3>
                                            <p className="text-slate-500 mb-4 text-sm">Create a new session to start testing your strategy with historical data.</p>
                                            <button onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors">Create your first test</button>
                                        </td></tr>
                                    ) : (
                                        sessions.map(s => {
                                            const isActive = activeSession?.id === s.id;
                                            const pnl = s.current_balance - s.initial_balance;
                                            const pnlColor = pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-slate-500';

                                            return (
                                                <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isActive ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                                    <td className="px-4 py-2.5">
                                                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                            {s.name}
                                                            {isActive && <span className="text-[10px] uppercase bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-sm font-bold tracking-wider">Active</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="bg-slate-100 dark:bg-slate-800 font-mono px-2 py-0.5 rounded-sm text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/50 tracking-wider">
                                                            {s.main_symbol || 'EURUSD'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight whitespace-nowrap">
                                                            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Start:</span> {formatDate(s.start_time)}
                                                            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                                                            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Sim:</span> {s.simulation_time ? formatDate(s.simulation_time) : 'Pending'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right w-24">
                                                        <div className="font-mono font-medium text-slate-900 dark:text-white">${s.current_balance.toFixed(2)}</div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right w-24">
                                                        <div className={`text-[12px] font-mono font-medium bg-slate-100/50 dark:bg-slate-900/50 px-2 py-1 inline-block rounded-md ${pnlColor}`}>
                                                            {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm('Delete this simulation session? This cannot be undone.')) {
                                                                        await deleteSession(s.id);
                                                                        await loadSessions();
                                                                    }
                                                                }}
                                                                className="p-2 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Delete Session"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleResume(s.id)}
                                                                disabled={isActive}
                                                                className="w-8 h-8 rounded flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                                                title={isActive ? "Session Active" : "Resume Session"}
                                                            >
                                                                <Play size={16} fill={isActive ? "none" : "currentColor"} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
