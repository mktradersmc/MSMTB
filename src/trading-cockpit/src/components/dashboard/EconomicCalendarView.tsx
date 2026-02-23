import React, { useState, useEffect } from 'react';
import { CalendarDays, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter, Globe2 } from 'lucide-react';
import { fetchDirect } from '../../lib/client-api';

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

interface CalendarEvent {
    id: string;
    event_id: number;
    name: string;
    country: string;
    currency: string;
    impact: string;
    timestamp: number;
    actual: string;
    forecast: string;
    previous: string;
    time_label: string;
    date_string: string;
}

export const EconomicCalendarView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [missingNextMonth, setMissingNextMonth] = useState(false);

    // Default to current month (UTC Start)
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        // Since we want default UTC view:
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    });

    const [timezone, setTimezone] = useState<'LOCAL' | 'UTC'>('UTC');
    const [selectedImpacts, setSelectedImpacts] = useState<Set<string>>(new Set(['High', 'Medium', 'Low', 'Non-Eco']));
    const [showImpactDropdown, setShowImpactDropdown] = useState(false);
    const [quickFilter, setQuickFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

    const getFilterBounds = () => {
        if (quickFilter === 'MONTH') return null;

        const now = new Date();

        if (timezone === 'UTC') {
            if (quickFilter === 'TODAY') {
                const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
                const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
                return [Math.floor(start / 1000), Math.floor(end / 1000)];
            }
            if (quickFilter === 'WEEK') {
                const day = now.getUTCDay() || 7;
                const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1, 0, 0, 0, 0);
                const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (7 - day), 23, 59, 59, 999);
                return [Math.floor(start / 1000), Math.floor(end / 1000)];
            }
        } else {
            if (quickFilter === 'TODAY') {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                return [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)];
            }
            if (quickFilter === 'WEEK') {
                const day = now.getDay() || 7;
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day), 23, 59, 59, 999);
                return [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)];
            }
        }
        return null;
    };

    const toggleImpact = (impact: string) => {
        const newSet = new Set(selectedImpacts);
        if (newSet.has(impact)) {
            newSet.delete(impact);
        } else {
            newSet.add(impact);
        }
        setSelectedImpacts(newSet);
    };

    const fetchEvents = async (date: Date) => {
        setLoading(true);
        try {
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();
            const fromTs = Math.floor(Date.UTC(year, month, 1) / 1000);
            const toTs = Math.floor(Date.UTC(year, month + 1, 0, 23, 59, 59) / 1000);

            const res = await fetchDirect(`/api/economic-calendar?from=${fromTs}&to=${toTs}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setEvents(data.events || []);
                    setMissingNextMonth(data.missingNextMonth || false);
                }
            }
        } catch (e) {
            console.error("Failed to fetch calendar data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents(currentMonth);
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setQuickFilter('MONTH');
        const prev = new Date(currentMonth);
        prev.setUTCMonth(prev.getUTCMonth() - 1);
        setCurrentMonth(prev);
    };
    const handleNextMonth = () => {
        setQuickFilter('MONTH');
        const next = new Date(currentMonth);
        next.setUTCMonth(next.getUTCMonth() + 1);
        setCurrentMonth(next);
    };
    const handleThisMonth = () => {
        setQuickFilter('MONTH');
        const d = new Date();
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        setCurrentMonth(d);
    };

    const handleQuickFilter = (filter: 'TODAY' | 'WEEK' | 'MONTH') => {
        setQuickFilter(filter);
        if (filter === 'TODAY' || filter === 'WEEK') {
            const d = new Date();
            d.setUTCDate(1);
            d.setUTCHours(0, 0, 0, 0);
            setCurrentMonth(d);
        }
    };

    // Color helpers
    const getCompactImpact = (impact: string) => {
        const lower = impact?.toLowerCase() || '';
        if (lower.includes('high')) return 'High';
        if (lower.includes('medium')) return 'Medium';
        if (lower.includes('low')) return 'Low';
        return 'Non-Eco';
    };

    const getImpactColor = (compactImpact: string) => {
        if (compactImpact === 'High') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        if (compactImpact === 'Medium') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        if (compactImpact === 'Low') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    const filterBounds = getFilterBounds();
    const finalEvents = events
        .map(e => ({ ...e, compactImpact: getCompactImpact(e.impact) }))
        .filter(e => selectedImpacts.has(e.compactImpact))
        .filter(e => {
            if (!filterBounds) return true;
            return e.timestamp >= filterBounds[0] && e.timestamp <= filterBounds[1];
        });

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300 overflow-hidden text-slate-900 dark:text-slate-200">
            {/* API Warning for Next Month */}
            {missingNextMonth && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 shrink-0 shadow-lg shadow-rose-500/5">
                    <AlertCircle size={20} className="shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">Action Required: Scraper Needs Attention</h4>
                        <p className="text-xs opacity-90">The scheduled backend job failed to load data for the upcoming month. The ForexFactory structure may have changed.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="mb-6 flex justify-between items-end border-b border-slate-300 dark:border-slate-800/50 pb-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="text-indigo-500" /> Economic Calendar
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Macroeconomic events and data releases</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 justify-end">

                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1 shadow-sm relative">
                        {/* Quick Filters */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 mr-2">
                            <button
                                onClick={() => handleQuickFilter('TODAY')}
                                className={cn("px-2 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1", quickFilter === 'TODAY' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                Heute
                            </button>
                            <button
                                onClick={() => handleQuickFilter('WEEK')}
                                className={cn("px-2 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1", quickFilter === 'WEEK' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                Woche
                            </button>
                            <button
                                onClick={() => handleQuickFilter('MONTH')}
                                className={cn("px-2 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1", quickFilter === 'MONTH' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                Monat
                            </button>
                        </div>

                        {/* Timezone Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 mr-2">
                            <button
                                onClick={() => setTimezone('LOCAL')}
                                className={cn("px-2 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1", timezone === 'LOCAL' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                Local
                            </button>
                            <button
                                onClick={() => setTimezone('UTC')}
                                className={cn("px-2 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1", timezone === 'UTC' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                <Globe2 size={12} /> UTC
                            </button>
                        </div>

                        {/* Impact Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setShowImpactDropdown(!showImpactDropdown)}
                                className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2"
                            >
                                <Filter size={14} className={selectedImpacts.size < 4 ? "text-indigo-500" : "text-slate-400"} />
                                Impacts ({selectedImpacts.size})
                            </button>

                            {showImpactDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowImpactDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-2 animate-in fade-in zoom-in-95">
                                        {(['High', 'Medium', 'Low', 'Non-Eco']).map((impact) => (
                                            <label key={impact} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedImpacts.has(impact)}
                                                    onChange={() => toggleImpact(impact)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className={cn("text-sm font-medium text-slate-700 dark:text-slate-300")}>
                                                    {impact}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden md:block" />

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg shadow-sm">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={handleThisMonth}
                            className="px-3 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors w-32 text-center"
                        >
                            {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => fetchEvents(currentMonth)}
                            className="ml-1 p-1.5 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 rounded-md transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content List */}
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden min-w-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0 bg-slate-50 dark:bg-slate-900/50">
                    <div className="col-span-2 pl-2">Datum</div>
                    <div className="col-span-1">Zeit {timezone === 'UTC' && <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 rounded ml-1 font-mono">UTC</span>}</div>
                    <div className="col-span-1">Currency</div>
                    <div className="col-span-1">Impact</div>
                    <div className="col-span-4">Event</div>
                    <div className="col-span-1 text-right">Actual</div>
                    <div className="col-span-1 text-right">Forecast</div>
                    <div className="col-span-1 text-right pr-2">Previous</div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950/30">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-slate-500 font-medium">Loading Calendar Data...</p>
                        </div>
                    ) : finalEvents.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                            <CalendarDays size={48} className="text-slate-300 dark:text-slate-700" />
                            <p className="text-slate-500 font-medium text-lg">No events found</p>
                            <p className="text-slate-400 text-sm">Try selecting a different time range or impacts.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {finalEvents.map((event, index, arr) => {
                                const dt = new Date(event.timestamp * 1000);

                                // Clean up the label from FF layout (e.g., "All Day", "Day 1")
                                const isAllDay = event.time_label && (event.time_label.includes('Day') || event.time_label.includes('Tentative'));

                                // Calculate time based on timezone selection
                                const timeStr = isAllDay ? event.time_label :
                                    (timezone === 'UTC'
                                        ? dt.toISOString().substr(11, 5) + ' Uhr'
                                        : dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                                    );

                                // German localized date format
                                const dayStr = timezone === 'UTC'
                                    ? dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })
                                    : dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

                                // Check if same day as previous event
                                let isSameDay = false;
                                let isSameTimeStr = false;

                                if (index > 0) {
                                    const prevEvent = arr[index - 1];
                                    const prevDt = new Date(prevEvent.timestamp * 1000);
                                    const prevDayStr = timezone === 'UTC'
                                        ? prevDt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })
                                        : prevDt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
                                    isSameDay = dayStr === prevDayStr;

                                    // Compute prev time string to compare (only if same day)
                                    if (isSameDay) {
                                        const prevIsAllDay = prevEvent.time_label && (prevEvent.time_label.includes('Day') || prevEvent.time_label.includes('Tentative'));
                                        const prevTimeStr = prevIsAllDay ? prevEvent.time_label :
                                            (timezone === 'UTC'
                                                ? prevDt.toISOString().substr(11, 5) + ' Uhr'
                                                : prevDt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                                            );
                                        isSameTimeStr = timeStr === prevTimeStr;
                                    }
                                }

                                return (
                                    <div key={event.id} className={cn("grid grid-cols-12 gap-4 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors items-center group text-sm", !isSameDay && index > 0 ? "border-t-[3px] border-slate-200 dark:border-slate-800 pt-3 mt-1" : "")}>
                                        <div className="col-span-2 pl-2 flex items-center justify-start">
                                            {!isSameDay && (
                                                <span className="font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block w-max text-xs">{dayStr}</span>
                                            )}
                                        </div>
                                        <div className="col-span-1 flex items-center justify-start">
                                            {!isSameTimeStr && (
                                                <span className={cn("text-xs font-mono font-medium", isSameDay ? "text-slate-500 dark:text-slate-400" : "text-slate-700 dark:text-slate-300")}>{timeStr}</span>
                                            )}
                                        </div>
                                        <div className="col-span-1 font-semibold text-slate-600 dark:text-slate-400">
                                            {event.currency}
                                        </div>
                                        <div className="col-span-1">
                                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getImpactColor(event.compactImpact))}>
                                                {event.compactImpact}
                                            </span>
                                        </div>
                                        <div className="col-span-4 font-medium text-slate-800 dark:text-slate-200 truncate pr-4" title={event.name}>
                                            {event.name}
                                        </div>
                                        <div className={cn("col-span-1 text-right font-mono font-medium", event.actual ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600")}>
                                            {event.actual || '-'}
                                        </div>
                                        <div className="col-span-1 text-right font-mono text-slate-600 dark:text-slate-400">
                                            {event.forecast || '-'}
                                        </div>
                                        <div className="col-span-1 text-right pr-2 font-mono text-slate-500 dark:text-slate-500">
                                            {event.previous || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
