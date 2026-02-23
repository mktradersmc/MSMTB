import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Layers } from 'lucide-react';
import { SymbolBrowser, SymbolBrowserHandle } from '../live/SymbolBrowser';
import { indicatorRegistry } from '../charts/indicators/IndicatorRegistry';
import { ChartStatusIndicator, SyncStatus } from '../charts/ChartStatusIndicator';
import { useChartTheme } from '../../context/ChartThemeContext';

import { useDatafeedStatus } from '../../hooks/useDatafeedStatus';

export interface ChartOverlayHandle {
    closePopups: () => void;
}

export interface ChartOverlayProps {
    symbol: string;
    timeframe: string;
    timezone: string;

    onSymbolChange: (s: string) => void;
    onTimeframeChange: (tf: string) => void;
    onTimezoneChange: (tz: string) => void;
    onAddIndicator?: (id: string) => void;
    botId?: string;
    ohlc?: { open: number, high: number, low: number, close: number } | null;
    precision?: number;
    status: SyncStatus; // New Prop
    isDatafeedOnline?: boolean;
    onPlaceOrder?: () => void;
    livePrice?: number | null;
}
export const ChartOverlay = React.forwardRef<ChartOverlayHandle, ChartOverlayProps>(({
    symbol,
    timeframe,
    timezone,
    onSymbolChange,
    onTimeframeChange,
    onTimezoneChange,
    onAddIndicator,
    botId,
    ohlc,
    precision = 5,
    status = 'OFFLINE',
    onPlaceOrder,
    livePrice,
}, ref) => {
    // Polling Hook for Stable Status AND Execution Monitoring
    const { isOnline, executionState, executionMessage } = useDatafeedStatus(symbol);

    // Override status if global datafeed is offline
    // Priority: Execution Error > Offline > Syncing > Online
    let effectiveStatus: SyncStatus = isOnline ? status : 'OFFLINE';
    let statusMessage: string | undefined = undefined;

    if (executionState === 'ERROR') {
        effectiveStatus = 'ERROR';
        statusMessage = executionMessage || undefined;
    } else if (executionState === 'PARTIAL') {
        effectiveStatus = 'PARTIAL';
        statusMessage = executionMessage || undefined;
    } else if (executionState === 'REJECTED') {
        effectiveStatus = 'REJECTED';
        statusMessage = executionMessage || undefined;
    }

    const { mode } = useChartTheme();
    const isDark = mode === 'dark';

    const symbolBrowserRef = useRef<SymbolBrowserHandle>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Indicator Menu State
    const [showIndMenu, setShowIndMenu] = useState(false);

    React.useImperativeHandle(ref, () => ({
        closePopups: () => {
            setIsHovered(false);
            setShowIndMenu(false);
            if (symbolBrowserRef.current) {
                symbolBrowserRef.current.close();
            }
        }
    }));

    // Timeframe Scroll Logic
    const tfScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkTfScroll = () => {
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4);
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };

    useEffect(() => {
        if (isHovered && tfScrollRef.current) {
            setTimeout(checkTfScroll, 50);
            const el = tfScrollRef.current;
            el.addEventListener('scroll', checkTfScroll);
            const observer = new ResizeObserver(() => checkTfScroll());
            observer.observe(el);
            return () => {
                el.removeEventListener('scroll', checkTfScroll);
                observer.disconnect();
            };
        }
    }, [isHovered]);

    // Global Mouse Tracking to fix sticky hover
    useEffect(() => {
        if (!isHovered) return;

        const handleGlobalMove = (e: MouseEvent) => {
            const target = e.target as Element;
            // Check if mouse is inside toolbar OR inside a symbol browser dropdown (portal)
            if (
                toolbarRef.current &&
                !toolbarRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target) &&
                !target.closest('.symbol-browser-dropdown')
            ) {
                setIsHovered(false);
            }
        };

        const handleWindowLeave = () => setIsHovered(false);

        window.addEventListener('mousemove', handleGlobalMove);
        document.addEventListener('mouseleave', handleWindowLeave);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            document.removeEventListener('mouseleave', handleWindowLeave);
        };
    }, [isHovered]);

    // Explicit Theme Colors based on Chart Mode (for Overlay Text ONLY)
    // User: "schriftfarben und status styling AUF dem chart ist allerdings weiterhin NUR abhängig vom tradingview style"
    const textColor = isDark ? 'text-white' : 'text-slate-900';

    const scrollTf = (direction: 'left' | 'right') => {
        if (tfScrollRef.current) {
            const amount = direction === 'left' ? -150 : 150;
            tfScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* 1. TRIGGER ZONE (Top Edge 14px centered) */}
            <div
                ref={triggerRef}
                className="absolute top-0 left-0 right-0 h-[14px] z-[60] cursor-pointer transition-colors duration-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                onMouseEnter={() => setIsHovered(true)}
            />

            {/* 2. SIMPLE TEXT DISPLAY (Hidden when Hovered) */}
            {!isHovered && (
                <div className="absolute top-4 left-4 z-[40] pointer-events-none select-none">
                    <div className="flex items-center gap-2 text-sm">
                        {(() => {
                            return (
                                <>
                                    {/* Symbol and Timeframe (Normal Weight, Static Color) */}
                                    <div className={`flex items-center gap-2 ${textColor} tracking-tight`}>
                                        {/* Status Dot */}
                                        <div className="flex items-center justify-center mr-1" title={`Status: ${effectiveStatus}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${effectiveStatus === 'READY' || effectiveStatus === 'ONLINE'
                                                ? 'bg-green-700 animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_3px_rgba(21,128,61,0.5)]'
                                                : effectiveStatus === 'OFFLINE'
                                                    ? 'bg-slate-400'
                                                    : effectiveStatus === 'PARTIAL' ? 'bg-orange-500' : 'bg-red-500'
                                                }`} />
                                        </div>

                                        <span>{symbol}</span>
                                        <span className="text-[4px] align-middle opacity-60">●</span>
                                        <span>{timeframe}</span>
                                    </div>

                                    {/* OHLC Display (Static Color) */}
                                    {ohlc && (
                                        <div className={`flex items-center gap-2 text-xs font-mono ${textColor} ml-1`}>
                                            <span className="text-[4px] align-middle opacity-60">●</span>
                                            <span className="flex gap-1"><span className="opacity-70">O</span>{ohlc.open.toFixed(precision)}</span>
                                            <span className="flex gap-1"><span className="opacity-70">H</span>{ohlc.high.toFixed(precision)}</span>
                                            <span className="flex gap-1"><span className="opacity-70">L</span>{ohlc.low.toFixed(precision)}</span>
                                            <span className="flex gap-1"><span className="opacity-70">C</span>{ohlc.close.toFixed(precision)}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* 3. FULL TOOLBAR (Visible when Hovered) */}
            {/* User: "Toolbar ist abhängig vom plattform style" -> Usage of 'dark:' classes */}
            <div
                ref={toolbarRef}
                className={`
                    absolute inset-x-0 top-0 h-[40px] z-[70]
                    flex items-center justify-between px-2 gap-2
                    bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl 
                    transition-all duration-200 ease-out
                    ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                `}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Left Group: Symbol */}
                <div className="flex items-center gap-2 shrink-0">


                    <SymbolBrowser
                        ref={symbolBrowserRef}
                        variant="button"
                        currentSymbol={symbol}
                        onSelectSymbol={(s) => {
                            onSymbolChange(s);
                            setIsHovered(false);
                        }}
                        botId={botId}
                        className="text-xs"
                    />
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                </div>

                {/* Middle Group: Timeframe (Restored Full List) */}
                <div className="relative flex-1 min-w-0 flex items-center group/tf overflow-hidden h-full">
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-900 to-transparent w-6" />
                            <button onClick={(e) => { e.stopPropagation(); scrollTf('left'); }} className="relative z-20 p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronLeft size={14} /></button>
                        </div>
                    )}

                    <div
                        ref={tfScrollRef}
                        className="flex items-center gap-0.5 overflow-x-auto no-scrollbar scroll-smooth px-1 w-full h-full"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                         `}</style>
                        {['M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1'].map((tf) => (
                            <button
                                key={tf}
                                onClick={(e) => { e.stopPropagation(); onTimeframeChange(tf); }}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${timeframe === tf ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end">
                            <div className="absolute inset-0 bg-gradient-to-l from-white dark:from-slate-900 to-transparent w-6" />
                            <button onClick={(e) => { e.stopPropagation(); scrollTf('right'); }} className="relative z-20 p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronRight size={14} /></button>
                        </div>
                    )}
                </div>

                {/* Right Group: Timezone (Fixed Width/Spacing) */}
                <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2">
                    {/* Indicators Menu */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowIndMenu(!showIndMenu); }}
                            className={`p-1 transition-colors rounded ${showIndMenu ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            title="Indicators"
                        >
                            <Layers size={14} />
                        </button>

                        {showIndMenu && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-50 flex flex-col py-1 overflow-hidden">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 mb-1">
                                    Add Indicator
                                </div>
                                {indicatorRegistry.getAll().map(def => (
                                    <button
                                        key={def.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddIndicator?.(def.id);
                                            setShowIndMenu(false);
                                        }}
                                        className="text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <span>{def.name}</span>
                                    </button>
                                ))}
                                {indicatorRegistry.getAll().length === 0 && (
                                    <div className="px-3 py-2 text-xs text-slate-500 italic">No indicators found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 group/tz relative hover:border-slate-300 dark:hover:border-slate-600 transition-colors h-6">
                        <Clock size={10} className="text-slate-400 dark:text-slate-500 group-hover/tz:text-indigo-500 dark:group-hover/tz:text-indigo-400 transition-colors" />
                        <select
                            value={timezone}
                            onChange={(e) => onTimezoneChange(e.target.value)}
                            className="bg-transparent text-slate-600 dark:text-slate-300 font-mono outline-none appearance-none cursor-pointer pr-3 hover:text-slate-900 dark:hover:text-white transition-colors pt-0.5 min-w-[40px]"
                        >
                            {
                                [
                                    { id: 'UTC', label: 'UTC', short: 'UTC' },
                                    { id: 'America/New_York', label: 'New York', short: 'NYC' },
                                    { id: 'Europe/London', label: 'London', short: 'LON' },
                                    { id: 'Europe/Berlin', label: 'Berlin', short: 'BER' },
                                    { id: 'Europe/Athens', label: 'Athen', short: 'ATH' },
                                    { id: 'Asia/Tokyo', label: 'Tokyo', short: 'TOK' },
                                    { id: 'Asia/Singapore', label: 'Singapore', short: 'SIN' },
                                    { id: 'Australia/Sydney', label: 'Sydney', short: 'SYD' },
                                ].map(tz => {
                                    // Dynamic Offset Calculation
                                    let offset = '';
                                    try {
                                        const now = new Date();
                                        const tf = new Intl.DateTimeFormat('en-US', { timeZone: tz.id, timeZoneName: 'shortOffset' });
                                        const parts = tf.formatToParts(now);
                                        const offsetPart = parts.find(p => p.type === 'timeZoneName');
                                        offset = offsetPart ? offsetPart.value : '';
                                        offset = offset.replace('GMT', 'UTC');
                                    } catch (e) { }

                                    return (
                                        <option key={tz.id} value={tz.id} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-300 px-2 py-1">
                                            &nbsp;{tz.label} ({offset})&nbsp;
                                        </option>
                                    );
                                })
                            }
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. TOP RIGHT OVERLAYS (Status Badge & Place Order Shield) */}
            <div className="absolute top-4 right-20 z-[30] flex items-start gap-4 pointer-events-none">
                <ChartStatusIndicator status={effectiveStatus} message={statusMessage} className="shadow-sm backdrop-blur-sm shadow-slate-900/10 mt-1" />

                <button
                    onClick={(e) => { e.stopPropagation(); onPlaceOrder?.(); }}
                    className="pointer-events-auto group/orderbtn relative flex items-center justify-center rounded-md border border-blue-600 bg-white/50 p-[2px] shadow-sm transition-all hover:shadow-md"
                >
                    <div className="flex flex-col items-center justify-center rounded-sm px-2 py-0.5 bg-transparent group-hover/orderbtn:bg-blue-600/50 text-slate-900 group-hover/orderbtn:text-white transition-colors w-full h-full min-w-[70px]">
                        <span className="text-[9px] uppercase font-bold tracking-wider leading-tight">
                            {livePrice ? livePrice.toFixed(precision) : '---'}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider leading-tight opacity-80 group-hover/orderbtn:opacity-100">
                            PLACE ORDER
                        </span>
                    </div>
                </button>
            </div>
        </>
    );
});

ChartOverlay.displayName = 'ChartOverlay';
