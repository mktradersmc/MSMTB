import React, { useState } from 'react';
import { useTradeStats } from '../../hooks/useTradeStats';
import { Activity, DollarSign, Percent, TrendingUp, TrendingDown, Hash, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export const ProfitDashboard: React.FC = () => {
    const [calendarDate, setCalendarDate] = useState(new Date());
    const { overallStats, thisWeekStats, lastWeekStats, calendarDays, isLoading } = useTradeStats(calendarDate);

    const handlePrevMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const now = new Date();
    const isCurrentMonth = calendarDate.getMonth() === now.getMonth() && calendarDate.getFullYear() === now.getFullYear();

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(1)}%`;
    };

    const StatCard = ({ title, stats, isOverall = false }: { title: string, stats: any, isOverall?: boolean }) => (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-sm p-4 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" />
                    {title}
                </h3>
            </div>

            <div className={`grid gap-2 flex-1 ${isOverall ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {/* Trades */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-sm border border-slate-200 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Hash size={12} /> Trades</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.totalTrades}</span>
                </div>

                {/* Winrate */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-sm border border-slate-200 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Percent size={12} /> Winrate</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatPercent(stats.winrate)}</span>
                </div>

                {/* Monetary PnL */}
                {!isOverall && (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-sm border border-slate-200 dark:border-slate-700/50 col-span-2 mt-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><DollarSign size={12} /> Net PnL</span>
                        <span className={`text-base font-bold ${stats.monetaryPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {stats.monetaryPnL > 0 ? '+' : ''}{formatMoney(stats.monetaryPnL)}
                        </span>
                    </div>
                )}

                {/* Avg Win / Loss */}
                {!isOverall && (
                    <div className="grid gap-2 grid-cols-2 col-span-2">
                        <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-sm border border-emerald-200 dark:border-emerald-800/30">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-bold flex items-center gap-1"><TrendingUp size={12} /> Avg Win</span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(stats.avgWin)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 p-2 rounded-sm border border-rose-200 dark:border-rose-800/30">
                            <span className="text-[10px] text-rose-600 dark:text-rose-500 uppercase font-bold flex items-center gap-1"><TrendingDown size={12} /> Avg Loss</span>
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">-{formatMoney(stats.avgLoss)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 w-full relative">

            {/* Header matches AccountsView */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 bg-slate-50 dark:bg-slate-950 z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Statistics Dashboard
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Real-time statistics from database history</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full p-8">
                <div className="max-w-7xl mx-auto w-full h-full">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-medium">Loading Live Trades from Database...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* Left Sidebar: Statistics Grid */}
                            <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-4">
                                <StatCard title="This Week" stats={thisWeekStats} />
                                <StatCard title="Last Week" stats={lastWeekStats} />
                                <StatCard title="Overall Runtime" stats={overallStats} isOverall={true} />
                            </div>

                            {/* Right Content: Monthly Calendar View */}
                            <div className="w-full flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-sm p-5 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-indigo-500" size={18} />
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                                            History
                                        </h2>
                                    </div>

                                    {/* Centered Month Navigation Control */}
                                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 rounded-sm p-1 border border-slate-200 dark:border-slate-700/50 min-w-[200px]">
                                        <button
                                            onClick={handlePrevMonth}
                                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-sm transition-colors text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center"
                                            title="Previous Month"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide min-w-[120px] text-center select-none">
                                            {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </span>

                                        <button
                                            onClick={handleNextMonth}
                                            disabled={isCurrentMonth}
                                            className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${isCurrentMonth ? 'opacity-30 cursor-not-allowed text-slate-400' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                            title="Next Month"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-8 gap-2">
                                    {/* Header Row */}
                                    {weekDays.map(day => (
                                        <div key={day} className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider py-1 border-b border-slate-200 dark:border-slate-800">
                                            {day}
                                        </div>
                                    ))}
                                    <div className="text-center font-bold text-[10px] text-indigo-500 uppercase tracking-wider py-1 border-b border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/10 rounded-t-sm">
                                        Week Net
                                    </div>

                                    {/* Calendar Grid */}
                                    {calendarDays.map((week, wIdx) => {
                                        const weekPnl = week.filter(d => d.isCurrentMonth).reduce((acc, curr) => acc + curr.monetaryPnL, 0);

                                        return (
                                            <React.Fragment key={wIdx}>
                                                {week.map((day, dIdx) => {
                                                    const isToday = new Date().toDateString() === day.date.toDateString();
                                                    const opacity = day.isCurrentMonth ? 'opacity-100' : 'opacity-40 pointer-events-none bg-slate-50 dark:bg-slate-800/20';

                                                    let bgClass = "bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50";
                                                    let textClass = "text-slate-700 dark:text-slate-300";

                                                    if (day.isCurrentMonth && day.monetaryPnL !== 0) {
                                                        if (day.monetaryPnL > 0) {
                                                            bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40";
                                                            textClass = "text-emerald-700 dark:text-emerald-400 text-shadow-sm";
                                                        } else {
                                                            bgClass = "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40";
                                                            textClass = "text-rose-700 dark:text-rose-400";
                                                        }
                                                    }

                                                    return (
                                                        <div key={dIdx} className={`min-h-[80px] p-2 rounded-sm flex flex-col justify-between transition-colors ${opacity} ${bgClass} ${isToday && day.isCurrentMonth ? 'ring-1 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 shadow-sm' : ''}`}>
                                                            <div className="text-xs font-bold text-slate-400">{day.date.getDate()}</div>

                                                            {day.isCurrentMonth && (day.wins > 0 || day.losses > 0) && (
                                                                <div className="mt-1 flex flex-col items-end">
                                                                    <div className={`text-sm font-bold ${textClass}`}>
                                                                        {day.monetaryPnL > 0 ? '+' : ''}{formatMoney(day.monetaryPnL)}
                                                                    </div>
                                                                    <div className="flex gap-1.5 text-[9px] mt-0.5 font-bold uppercase tracking-wider">
                                                                        {day.wins > 0 && <span className="text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1 rounded">{day.wins}W</span>}
                                                                        {day.losses > 0 && <span className="text-rose-600 dark:text-rose-500 bg-rose-500/10 px-1 rounded">{day.losses}L</span>}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Weekly Summary Tile */}
                                                <div className="min-h-[80px] p-2 rounded-sm bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 flex flex-col justify-center items-center">
                                                    <div className={`text-sm font-bold ${weekPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {weekPnl > 0 ? '+' : ''}{formatMoney(weekPnl)}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
