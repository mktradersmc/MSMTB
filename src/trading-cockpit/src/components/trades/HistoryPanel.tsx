
import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, XCircle, Shield, Briefcase, Play, Pause, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { AggregatedTrade } from '../../hooks/useTradeMonitor'; // Reuse Type
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export const HistoryPanel: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const isTestMode = useWorkspaceStore(state => state.isTestMode);
    const [trades, setTrades] = useState<AggregatedTrade[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const envParam = isTestMode ? 'test' : 'live';
            const res = await fetch(`http://localhost:3005/api/trade-history?limit=50&env=${envParam}`);
            const body = await res.json();
            if (body.success) {
                const mapped: AggregatedTrade[] = body.history.map((h: any) => ({
                    tradeId: h.id,
                    symbol: h.symbol,
                    direction: h.direction === 1 ? 'BUY' : 'SELL', // DB stores int
                    active: false,
                    status: 'CLOSED',
                    openTime: h.open_time,
                    closeTime: h.close_time,
                    entryPrice: h.entry_price,
                    exitPrice: h.exit_price,
                    activePrice: h.exit_price,
                    volume: h.volume,
                    realizedPl: h.profit,
                    commission: h.commission,
                    swap: h.swap,
                    positions: (h.positions || []).map((p: any) => ({
                        id: p.id,
                        brokerId: p.broker_id,
                        botId: p.bot_id,
                        status: p.status,
                        realizedPl: p.realized_pl,
                        commission: p.commission,
                        swap: p.swap,
                        entryPrice: p.entry_price || h.entry_price, // Fallback
                        currentPrice: p.exit_price || h.exit_price,
                        volume: p.volume
                    })),
                    botId: 'HISTORY',
                    brokerId: 'HISTORY',
                    unrealizedPl: 0,
                    runningRr: 0,
                    currentRr: 0,
                    sl: 0, tp: 0, avgPrice: h.exit_price || 0,
                    strategy: h.strategy,
                    entryLabel: 'Market',
                }));
                setTrades(mapped);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload when Environment Toggles or Mounts
    useEffect(() => {
        loadHistory();
    }, [isTestMode]);

    const [panelHeight, setPanelHeight] = useState(300);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = panelHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = startY - moveEvent.clientY;
            setPanelHeight(Math.max(150, Math.min(window.innerHeight - 100, startHeight + delta)));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Group trades by Date
    const groupedTrades = useMemo(() => {
        const groups: { date: string, trades: AggregatedTrade[] }[] = [];
        const dateMap = new Map<string, AggregatedTrade[]>();

        trades.forEach(t => {
            const date = t.openTime ? new Date(t.openTime).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Unknown Date';

            if (!dateMap.has(date)) {
                dateMap.set(date, []);
                groups.push({ date, trades: dateMap.get(date)! });
            }
            dateMap.get(date)!.push(t);
        });
        return groups;
    }, [trades]);

    return (
        <div
            style={{ height: panelHeight }}
            className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl relative z-[200]"
        >
            {/* Resizer Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/50 transition-colors z-50 group"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-slate-600 group-hover:bg-blue-400 rounded-b opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Header */}
            <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center justify-between px-2 shrink-0 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Trade History ({isTestMode ? 'TEST' : 'LIVE'})
                    </span>
                    <span className="text-[10px] text-slate-500">
                        {trades.length} Closed
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {trades.length === 0 && <span className="text-[10px] text-slate-500 italic">No closed trades</span>}
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="bg-white dark:bg-slate-900 sticky top-0 z-20 text-[10px] text-slate-500 font-mono uppercase tracking-wider shadow-sm">
                        <tr>
                            <th className="p-1 w-6"></th>
                            <th className="p-1 text-left">Time</th>
                            <th className="p-1 text-left">Symbol</th>
                            <th className="p-1 text-right">Type</th>
                            <th className="p-1 text-right">Entry</th>
                            <th className="p-1 text-right">Exit</th>
                            <th className="p-1 text-right">Comm</th>
                            <th className="p-1 text-right">Swap</th>
                            <th className="p-1 text-right">Realized</th>
                            <th className="p-1 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        {groupedTrades.map(group => (
                            <React.Fragment key={group.date}>
                                {/* Date Header */}
                                <tr>
                                    <td colSpan={10} className="bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                                        {group.date}
                                    </td>
                                </tr>

                                {group.trades.map(trade => (
                                    <React.Fragment key={trade.tradeId}>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-1 text-center cursor-pointer" onClick={() => toggleExpand(trade.tradeId)}>
                                                {expandedIds.has(trade.tradeId) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            </td>
                                            <td className="p-1 text-slate-500 dark:text-slate-400">
                                                {/* Only Time displayed */}
                                                <span className="text-slate-900 dark:text-white font-bold">{trade.openTime ? new Date(trade.openTime).toLocaleTimeString() : '-'}</span>
                                            </td>
                                            <td className="p-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-slate-900 dark:text-slate-200">{trade.symbol}</span>
                                                    <span className={`text-[9px] font-bold px-1 rounded ${trade.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {trade.direction}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-1 text-right font-bold text-slate-900 dark:text-white">Market</td>
                                            <td className="p-1 text-right text-slate-900 dark:text-white">{(trade as any).entryPrice || 0}</td>
                                            <td className="p-1 text-right text-slate-900 dark:text-white">{(trade as any).exitPrice || 0}</td>
                                            <td className={`p-1 text-right font-bold ${(trade.commission || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {(trade.commission || 0).toFixed(2)}
                                            </td>
                                            <td className={`p-1 text-right font-bold ${(trade.swap || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {(trade.swap || 0).toFixed(2)}
                                            </td>
                                            <td className={`p-1 text-right font-bold ${Math.abs(trade.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((trade.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                                {(trade.realizedPl || 0).toFixed(2)}
                                            </td>
                                            <td className="p-1 text-center">
                                                <span className="text-[10px] text-slate-600">CLOSED</span>
                                            </td>
                                        </tr>
                                        {/* Child Rows */}
                                        {expandedIds.has(trade.tradeId) && trade.positions.map(child => (
                                            <tr key={child.id} className={`bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/30 text-[10px] text-slate-500 ${child.status === 'OFFLINE' ? 'opacity-40 grayscale' : ''}`}>
                                                <td className="p-1"></td>
                                                <td className="p-1 pl-4 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                                    {child.botId}
                                                </td>
                                                <td className="p-1 text-left">{child.brokerId}</td>
                                                <td className="p-1 text-right">{trade.direction}</td>
                                                <td className="p-1 text-right">{child.entryPrice?.toFixed(5)}</td>
                                                <td className="p-1 text-right">{child.currentPrice?.toFixed(5)}</td>
                                                <td className="p-1 text-right">{(child.commission || 0).toFixed(2)}</td>
                                                <td className="p-1 text-right">{(child.swap || 0).toFixed(2)}</td>
                                                <td className="p-1 text-right font-mono text-slate-400">{(child.realizedPl || 0).toFixed(2)}</td>
                                                <td className="p-1 text-center text-[9px]">
                                                    {child.status === 'OFFLINE' ? (
                                                        <span className="text-slate-500 border border-slate-300 dark:border-slate-700 px-1 rounded-[2px]">OFFLINE</span>
                                                    ) : (
                                                        child.status
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                        {trades.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                                    No closed trades found for {isTestMode ? 'TEST' : 'LIVE'} environment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 sticky bottom-0 z-10 shadow-[0_-1px_0_theme(colors.slate.300)] dark:shadow-[0_-1px_0_theme(colors.slate.700)]">
                        {(() => {
                            const totals = trades.reduce((acc, t) => ({
                                comm: acc.comm + (t.commission || 0),
                                swap: acc.swap + (t.swap || 0),
                                realized: acc.realized + (t.realizedPl || 0)
                            }), { comm: 0, swap: 0, realized: 0 });

                            return (
                                <tr>
                                    <td className="p-2"></td>
                                    <td className="p-2 text-slate-500 uppercase tracking-wider text-[10px]">Total</td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>

                                    {/* Comm */}
                                    <td className={`p-2 text-right ${Math.abs(totals.comm) < 0.005 ? 'text-slate-500' : (totals.comm > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                        {totals.comm.toFixed(2)}
                                    </td>

                                    {/* Swap */}
                                    <td className={`p-2 text-right ${Math.abs(totals.swap) < 0.005 ? 'text-slate-500' : (totals.swap > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                        {totals.swap.toFixed(2)}
                                    </td>

                                    {/* Realized */}
                                    <td className={`p-2 text-right ${Math.abs(totals.realized) < 0.005 ? 'text-slate-500' : (totals.realized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                        {totals.realized.toFixed(2)}
                                    </td>

                                    <td className="p-2"></td>
                                </tr>
                            );
                        })()}
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
