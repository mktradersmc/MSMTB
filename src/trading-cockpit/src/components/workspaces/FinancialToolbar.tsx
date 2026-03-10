import React from 'react';
import { Plus, Layers, Zap, Briefcase, Shield, Wallet } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useBacktest } from '../../contexts/BacktestContext';
interface FinancialToolbarProps {
    botId?: string;
    isOnline?: boolean;
    onToggleTrades?: () => void;
    onToggleHistory?: () => void;
    isTradesOpen?: boolean;
    isHistoryOpen?: boolean;
}

export const FinancialToolbar: React.FC<FinancialToolbarProps> = ({
    botId,
    isOnline,
    onToggleTrades,
    onToggleHistory,
    isTradesOpen,
    isHistoryOpen
}) => {
    const { activeWorkspaceId, workspaces } = useWorkspaceStore();
    const { activeSession } = useBacktest();

    return (
        <div className="h-9 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 shrink-0 z-[9999] shadow-sm relative select-none">
            {/* Left Tools */}
            <div className="flex items-stretch h-full">
                {/* Hit-Target Wrapper: Full Height to catch bottom-edge hover */}
                <button
                    onClick={onToggleTrades}
                    className="h-full flex items-center px-1 group outline-none focus:outline-none"
                    title="Active Trades"
                >
                    {/* Visual Pill: Centered & Rounded */}
                    <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md transition-all ${isTradesOpen
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                        : "text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                        }`}>
                        <Briefcase size={14} />
                        <span>Trades</span>
                    </div>
                </button>
                <button
                    onClick={onToggleHistory}
                    className="h-full flex items-center px-1 group outline-none focus:outline-none"
                    title="Trade History"
                >
                    <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md transition-all ${isHistoryOpen
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                        : "text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                        }`}>
                        <Shield size={14} />
                        <span>History</span>
                    </div>
                </button>

            </div>

            {/* Center: Simulation Balance (Only if Backtest) */}
            {activeSession && (
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 font-mono text-xs font-bold shadow-sm">
                    <Wallet size={12} />
                    <span>${(activeSession.current_balance || activeSession.initial_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}

            {/* Right Status */}
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-help" title="System Version">
                    <Layers size={12} />
                    <span>v2.1</span>
                </div>
            </div>
        </div>
    );
};
