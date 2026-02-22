import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, XCircle, Shield, Briefcase, Play, Pause, X, AlertTriangle } from 'lucide-react';
import { useTradeMonitor, AggregatedTrade } from '../../hooks/useTradeMonitor';

export const TradesPanel: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const { aggregatedTrades, modifyTrade } = useTradeMonitor();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    // const displayTrades = showHistory ? historyTrades : aggregatedTrades;
    // const displayTrades = showHistory ? historyTrades : aggregatedTrades;
    // Sort Descending (Newest First) per User Request
    const displayTrades = [...aggregatedTrades].sort((a, b) => b.openTime - a.openTime);

    // Group trades by Date
    const groupedTrades = useMemo(() => {
        const groups: { date: string, trades: AggregatedTrade[] }[] = [];
        const dateMap = new Map<string, AggregatedTrade[]>();

        displayTrades.forEach(t => {
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
    }, [displayTrades]);

    const [panelHeight, setPanelHeight] = useState(300);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        const startY = e.clientY;
        const startHeight = panelHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = startY - moveEvent.clientY; // Dragging up increases height
            setPanelHeight(Math.max(150, Math.min(window.innerHeight - 100, startHeight + delta)));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Removed helper to use inline logic
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
                <div className="mx-auto w-12 h-1 bg-slate-600/50 group-hover:bg-blue-400 rounded-full mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Header */}
            <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center justify-between px-2 shrink-0 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Active Trades
                    </span>
                    <span className="text-[10px] text-slate-500">
                        {aggregatedTrades.length} Active
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {aggregatedTrades.length === 0 && <span className="text-[10px] text-slate-500 italic">No active trades</span>}
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white dark:bg-slate-900 text-[10px] text-slate-500 font-mono sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-1 w-6"></th>
                            <th className="p-1">Time</th>
                            <th className="p-1">Trade</th>
                            {/* <th className="p-1 text-right">Vol</th> */}
                            <th className="p-1 text-right">Price</th>
                            <th className="p-1 text-right">SL</th>
                            <th className="p-1 text-right">TP</th>
                            <th className="p-1 text-right">Comm</th>
                            <th className="p-1 text-right">Realized</th>
                            <th className="p-1 text-right">Unrealized</th>
                            <th className="p-1 text-right">Plan R</th>
                            <th className="p-1 text-right">Run R</th>
                            <th className="p-1 text-right">Risk %</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        {groupedTrades.map(group => (
                            <React.Fragment key={group.date}>
                                {/* Date Header */}
                                <tr>
                                    <td colSpan={12} className="bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                                        {group.date}
                                    </td>
                                </tr>

                                {group.trades.map(trade => (
                                    <React.Fragment key={trade.tradeId}>
                                        {/* Parent Row */}
                                        <tr className={`border-b ${trade.status === 'OFFLINE' ? 'border-slate-200 dark:border-slate-800/20 bg-slate-100/50 dark:bg-slate-900/50 opacity-60' : (trade.status === 'ERROR' || trade.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30')} transition-colors`}>
                                            <td className="p-1 text-center cursor-pointer" onClick={() => toggleExpand(trade.tradeId)}>
                                                {expandedIds.has(trade.tradeId) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            </td>
                                            <td className="p-1 text-slate-500 dark:text-slate-400">
                                                {/* Master Trade: Created Locally (Correct) */}
                                                {new Date(trade.openTime).toLocaleTimeString()}
                                            </td>
                                            <td className="p-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-slate-900 dark:text-slate-200">{trade.symbol}</span>
                                                    {/* Direction Badge */}
                                                    <span className={`text-[9px] font-bold px-1 rounded ${trade.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {trade.direction}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* <td className="p-1 text-right">{trade.totalVol.toFixed(2)}</td> */}
                                            {/* MASTER ROW: TYPE (No Price) */}
                                            {/* MASTER ROW: TYPE (No Price) */}
                                            <td className="p-1 text-right font-bold text-slate-900 dark:text-white">
                                                {/* Display Order Type (MARKET/LIMIT) instead of Price */}
                                                {(trade as any).type || 'MARKET'}
                                            </td>
                                            <td className="p-1 text-right text-slate-900 dark:text-white">
                                                {trade.slLabel ? <span className="text-purple-600 dark:text-purple-400 text-[10px]">{trade.slLabel}</span> : (trade.avgSl > 0 ? trade.avgSl.toFixed(5) : '-')}
                                            </td>
                                            <td className="p-1 text-right text-slate-900 dark:text-white">
                                                {trade.tpLabel ? <span className="text-blue-600 dark:text-blue-400 text-[10px]">{trade.tpLabel}</span> : (trade.avgTp > 0 ? trade.avgTp.toFixed(5) : '-')}
                                            </td>

                                            <td className={`p-1 text-right font-bold ${Math.abs(trade.totalCommission || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((trade.totalCommission || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                                {/* COMMISSION COLUMN (User Request) */}
                                                {(trade.totalCommission || 0).toFixed(2)}
                                            </td>
                                            <td className={`p-1 text-right font-bold ${Math.abs(trade.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((trade.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                                {(trade.realizedPl || 0).toFixed(2)}
                                            </td>
                                            <td className={`p-1 text-right font-bold ${Math.abs(trade.unrealizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((trade.unrealizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                                {(trade.unrealizedPl || 0).toFixed(2)}
                                            </td>

                                            <td className="p-1 text-right text-slate-500">{trade.currentRr > 0 ? trade.currentRr.toFixed(2) : '-'}</td>
                                            <td className="p-1 text-right font-bold text-slate-700 dark:text-slate-300">
                                                {(trade.runningRr || 0).toFixed(2)}
                                            </td>
                                            <td className="p-1 text-right font-mono text-slate-500">
                                                {trade.riskPercent !== undefined ? `${trade.riskPercent.toFixed(1)}%` : '-'}
                                            </td>
                                        </tr>

                                        {/* Child Rows (Expanded) */}
                                        {expandedIds.has(trade.tradeId) && trade.positions.map((pos, index) => {
                                            // DYNAMIC OFFSET HEURISTIC
                                            // 1. Master Trade Open Time (Local)
                                            // 2. Position Time (Broker)
                                            // 3. Diff (rounded to hours) = Broker Offset
                                            // Warning: This only works if master trade and position are relatively close.
                                            // If master is old and position is new, drift is small.
                                            // BUT: We compare `trade.openTime` (db created_at) with `pos.time` (broker time).
                                            // `pos.time` is usually a few seconds after `trade.openTime`.
                                            // So `pos.time (seconds) * 1000 - trade.openTime` = Offset + Latency.
                                            // Offset = Round((posMs - tradeMs) / 3600000) * 3600000.

                                            let displayTime = "-";
                                            if (pos.time) {
                                                const posMs = pos.time * 1000;
                                                const tradeMs = trade.openTime;
                                                const diff = posMs - tradeMs;

                                                // Round to nearest hour (3600000 ms)
                                                // e.g. Broker UTC+2. Diff approx +7,200,000 ms.
                                                // If diff is large (>30 mins), it's likely an offset.
                                                const offsetHours = Math.round(diff / 3600000);
                                                const offsetMs = offsetHours * 3600000;

                                                // Corrected Time = BrokerTime - Offset
                                                const corrected = posMs - offsetMs;

                                                displayTime = new Date(corrected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                            }

                                            return (
                                                <tr key={`${pos.botId}-${pos.brokerId}-${index}`} className={`bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-500 ${pos.status === 'OFFLINE' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                                    <td className="p-1"></td>
                                                    <td className="p-1 pl-4 text-[10px] font-mono font-bold">
                                                        {(() => {
                                                            // Unified Badge Logic (User Request)
                                                            // RUNNING (Green), SENT (Blue), OFFLINE (Gray), ERROR (Red), REJECTED (Orange)
                                                            let status = pos.status || 'RUNNING';
                                                            let colorClass = '';
                                                            let label = status;

                                                            switch (status) {
                                                                case 'OFFLINE':
                                                                    colorClass = 'text-slate-600 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800';
                                                                    break;
                                                                case 'ERROR':
                                                                    colorClass = 'text-red-600 border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20';
                                                                    break;
                                                                case 'REJECTED':
                                                                    colorClass = 'text-orange-600 border-orange-300 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20';
                                                                    break;
                                                                case 'SENT':
                                                                case 'PENDING':
                                                                    colorClass = 'text-blue-600 border-blue-300 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20';
                                                                    label = status;
                                                                    break;
                                                                case 'CLOSED':
                                                                    colorClass = 'text-slate-600 border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-800/50';
                                                                    label = 'CLOSED';
                                                                    break;
                                                                case 'RUNNING':
                                                                case 'PARTIAL':
                                                                    colorClass = 'text-green-600 border-green-300 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20';
                                                                    label = 'RUNNING'; // Normalize
                                                                    break;
                                                                default:
                                                                    // Fallback: If unknown, show gray
                                                                    colorClass = 'text-slate-500 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30';
                                                                    label = status;
                                                                    break;
                                                            }

                                                            return (
                                                                <span
                                                                    className={`font-bold border px-1 rounded-[2px] cursor-help ${colorClass}`}
                                                                    title={pos.errorMessage || status}
                                                                >
                                                                    {label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-1 font-mono font-bold text-slate-900 dark:text-white">{pos.brokerId}</td>
                                                    {/* <td className="p-1 text-right">{(pos.vol || 0).toFixed(2)}</td> */}
                                                    <td className="p-1 text-right text-slate-900 dark:text-white">
                                                        {(pos.open || 0).toFixed(5)}
                                                    </td>
                                                    <td className="p-1 text-right text-slate-900 dark:text-white">{(pos.sl || 0).toFixed(5)}</td>
                                                    <td className="p-1 text-right text-slate-900 dark:text-white">{(pos.tp || 0).toFixed(5)}</td>

                                                    {/* CHILD COMMISSION */}
                                                    <td className={`p-1 text-right ${Math.abs(pos.commission || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((pos.commission || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>{(pos.commission || 0).toFixed(2)}</td>

                                                    <td className={`p-1 text-right ${Math.abs(pos.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((pos.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>{(pos.realizedPl || 0).toFixed(2)}</td>
                                                    <td className={`p-1 text-right ${Math.abs(pos.profit || 0) < 0.005 ? 'text-slate-900 dark:text-white' : ((pos.profit || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                                        {(pos.profit || 0).toFixed(2)}
                                                    </td>

                                                    {/* CHILD PLAN R */}
                                                    <td className="p-1 text-right text-slate-900 dark:text-white">
                                                        {(() => {
                                                            const distSl = Math.abs((pos.open || 0) - (pos.sl || 0));
                                                            const distTp = Math.abs((pos.tp || 0) - (pos.open || 0));
                                                            if (distSl > 0 && pos.tp > 0) {
                                                                return (distTp / distSl).toFixed(2);
                                                            }
                                                            return '-';
                                                        })()}
                                                    </td>

                                                    {/* CHILD RUN R */}
                                                    <td className="p-1 text-right text-slate-900 dark:text-white">
                                                        {(pos.runningRr !== undefined) ? (pos.runningRr).toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 sticky bottom-0 z-10 shadow-[0_-1px_0_theme(colors.slate.300)] dark:shadow-[0_-1px_0_theme(colors.slate.700)]">
                        {(() => {
                            const totals = displayTrades.reduce((acc, t) => ({
                                comm: acc.comm + (t.totalCommission || 0),
                                realized: acc.realized + (t.realizedPl || 0),
                                unrealized: acc.unrealized + (t.unrealizedPl || 0)
                            }), { comm: 0, realized: 0, unrealized: 0 });

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

                                    {/* Realized */}
                                    <td className={`p-2 text-right ${Math.abs(totals.realized) < 0.005 ? 'text-slate-500' : (totals.realized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                        {totals.realized.toFixed(2)}
                                    </td>

                                    {/* Unrealized */}
                                    <td className={`p-2 text-right ${Math.abs(totals.unrealized) < 0.005 ? 'text-slate-500' : (totals.unrealized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                                        {totals.unrealized.toFixed(2)}
                                    </td>

                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                </tr>
                            );
                        })()}
                    </tfoot>
                </table>
            </div>
        </div >
    );
};
