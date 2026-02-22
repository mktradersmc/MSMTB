"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, LineSeries, TickMarkType, LogicalRange } from 'lightweight-charts';
import { getTimeframeSeconds } from '../../utils/chartUtils';
import { useChartTheme } from '../../context/ChartThemeContext';
import { LongShortPosition, LongShortState } from './LongShortPosition';
import { ChartWidget } from './widgets/ChartWidget';
import { SymbolBrowser } from '../live/SymbolBrowser';
import { MagnetControl } from './MagnetControl';
import { MagnetService } from './widgets/MagnetService';
import { ChevronLeft, ChevronRight, Settings, Clock, ChevronsRight } from 'lucide-react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu, ContextMenuItem } from './contextmenu/ContextMenu';
import { SettingsModal } from './settings/SettingsModal';
import { indicatorRegistry } from './indicators/IndicatorRegistry';
import { ICTSessionsPlugin } from './plugins/ICTSessionsPlugin';
import { useBrokerStore } from '../../stores/useBrokerStore';
import { TradeDistributionManager, ExecutionBatch } from '../../managers/TradeDistributionManager';

const LongIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="18" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="3" y="4" width="18" height="8" rx="1" strokeDasharray="3 2" />
        <path d="M3 12h18" strokeWidth="2" />
    </svg>
);

const ShortIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="3" y="12" width="18" height="8" rx="1" strokeDasharray="3 2" />
        <path d="M3 12h18" strokeWidth="2" />
    </svg>
);

interface ChartContainerProps {
    symbol: string; // Renamed from symbolA
    symbolB?: string; // Kept for optional secondary series/overlay
    dataA: any[];
    dataB: any[];
    timeframe: string;
    isActive?: boolean; // New Prop per v8.5 Spec
    onTimeframeChange?: (tf: string) => void;
    divergences?: any[];
    height?: number | string; // Support flexible height
    onCrosshairMove?: (time: Time | null, priceA: number | undefined, priceB: number | undefined) => void;
    isLoading?: boolean;
    onSettingsClick?: () => void;
    accounts?: any[];
    precision?: number;
    horizonData?: any[]; // New Prop for Future Phantom Bars
    timezone?: string; // External Control
    onTimezoneChange?: (tz: string) => void;

    // New Props for internal header
    onSymbolChange?: (symbol: string) => void;
    botId?: string;
    onOHLCChange?: (ohlc: { open: number, high: number, low: number, close: number } | null) => void;
    onVisibleRangeChange?: (range: { from: number, to: number }) => void;
    onVisibleLogicalRangeChange?: (range: LogicalRange & { anchorTime?: number, whitespaceOffset?: number }) => void;
    activeIndicators?: any[];
    paneId?: string; // New Prop for Identity Verification
    onChartClick?: () => void; // New Prop for Explicit Activation
    scrollToTimeRequest?: { id: string, time: number }; // Scroll Request from Store
}

export interface ChartContainerHandle {
    updateCandle: (candle: any) => void;
    getLatestCandle: () => any;
    getWidget: () => ChartWidget | null;
    setVisibleRange: (range: { from: number; to: number }) => void;
    setLogicalRange: (range: { from: number; to: number; anchorTime?: number; whitespaceOffset?: number }) => void;
    setCrosshair: (time: number, price?: number) => void;
    closePopups: () => void;
    deselectAll: () => void;
}

export const ChartContainer = React.forwardRef<ChartContainerHandle, ChartContainerProps>(({
    symbol,
    symbolB = "", // Default to empty if not provided
    dataA,
    dataB,
    timeframe,
    isActive = false,
    onTimeframeChange,
    divergences,
    height = 500,
    isLoading = false,
    onSettingsClick,

    accounts = [],
    precision = 5,
    horizonData = [],
    timezone,
    onTimezoneChange,
    onSymbolChange,
    botId,
    onOHLCChange,
    onCrosshairMove, // Destructure new prop
    onVisibleRangeChange, // Destructure new prop
    onVisibleLogicalRangeChange,
    activeIndicators = [],
    paneId, // Destructure paneId
    onChartClick, // Destructure onChartClick
    scrollToTimeRequest // Destructure scrollToTimeRequest
}, ref) => {
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const containerRefA = useRef<HTMLDivElement>(null);
    const containerRefB = useRef<HTMLDivElement>(null);

    const { theme } = useChartTheme();

    const chartARef = useRef<IChartApi | null>(null);
    const chartBRef = useRef<IChartApi | null>(null);
    const seriesARef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const seriesBRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const hasFittedARef = useRef(false);
    const hasFittedBRef = useRef(false);

    // DATA REFS for Sync Closure Access
    const dataARef = useRef<any[]>([]);
    const dataBRef = useRef<any[]>([]);

    // --- SCROLL TO TIME EFFECT ---
    useEffect(() => {
        if (scrollToTimeRequest && chartARef.current && dataARef.current.length > 0) {
            const chart = chartARef.current;
            const data = dataARef.current;
            const targetTime = scrollToTimeRequest.time;

            // Find index of target time
            // Binary search or find? findIndex is O(N) but safer for now.
            // Using findIndex with assumption of sorted data.

            // Optimization: If data is sorted, we can binary search.
            // For now, let's use a simple heuristic:
            // Find the closest bar.

            let closestIndex = -1;
            let minDiff = Infinity;

            // Simple iteration for robustness (performance impact negligible for <50k bars once)
            for (let i = 0; i < data.length; i++) {
                const diff = Math.abs((data[i].time as number) - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            }

            if (closestIndex !== -1) {
                // Calculate visible range width (zoom level)
                const visibleRun = chart.timeScale().getVisibleLogicalRange();
                let width = 100; // Default width
                if (visibleRun) {
                    width = visibleRun.to - visibleRun.from;
                }

                // Center the view on closestIndex
                const from = closestIndex - (width / 2);
                const to = closestIndex + (width / 2);

                chart.timeScale().setVisibleLogicalRange({ from, to });



                // Disable Realtime Lock
                setIsAtRealtime(false);

                // Seed History Focus Ref
                const fromTime = data[Math.max(0, Math.floor(from))]?.time;
                const toTime = data[Math.min(data.length - 1, Math.ceil(to))]?.time;
                if (fromTime && toTime) {
                    historyFocusRef.current = { from: fromTime as number, to: toTime as number };
                }
            } else {
                // If time is outside data range (e.g. far future or past not loaded), 
                // we might simply scroll to specific time if it's a timestamp.
                // LWC supports scrollToPosition but that requires index.
                // If we have no data there, we can't easily scroll.
                // Fallback: Notify? Console log?
                console.warn("[ChartContainer] Target time not found in loaded data", targetTime);
            }
        }
    }, [scrollToTimeRequest]);



    // Use a ref to store the previous timeframe to detect changes
    const prevTimeframeRef = useRef(timeframe);
    const seriesHorizonRef = useRef<ISeriesApi<"Line"> | null>(null); // Phantom Series Ref
    const chartWidgetRef = useRef<ChartWidget | null>(null);
    const currentMousePosRef = useRef<{ x: number, y: number } | null>(null);

    const indicatorPluginsRef = useRef<Map<string, any>>(new Map());

    // --- INCREMENTAL UPDATE STATE ---
    const prevDataLengthRef = useRef(0);
    const prevStartTimeRef = useRef(0);

    // ROBUSTNESS: Track the last known "History Focus" to survive empty data states (The Tunnel)
    const historyFocusRef = useRef<{ from: number, to: number } | null>(null);

    // LOOP PROTECTION: Flag to suppress event broadcasting during programmatic updates
    const isProgrammaticUpdate = useRef(false);

    // --- CONTEXT MENU HOOK ---
    const {
        menuState,
        settingsState,
        closeMenu,
        openSettings,
        handleDelete,
        handleRemoveAll,
        closeSettings,
        saveSettings
    } = useContextMenu(mainContainerRef, chartWidgetRef);

    // --- IMPERATIVE HANDLE FOR FAST UPDATES ---
    React.useImperativeHandle(ref, () => ({
        updateCandle: (candle: any) => {
            if (seriesARef.current) {
                seriesARef.current.update(candle);
                // Also update Widget internal state if needed
                if (chartWidgetRef.current && candle.close !== undefined) {
                    chartWidgetRef.current.updateLastPrice(candle.close, candle.time as number);
                }

                // --- UPDATE PLUGINS WITH LATEST TIME ---
                indicatorPluginsRef.current.forEach((plugin) => {
                    const p = plugin as any;
                    if (p.updateCurrentTime) {
                        p.updateCurrentTime(candle.time);
                    }
                    if (p.updateCandle) {
                        p.updateCandle(candle);
                    }
                });
            }
        },
        getLatestCandle: () => {
            return null;
        },
        getWidget: () => chartWidgetRef.current,
        setVisibleRange: (range: { from: number; to: number }) => {
            if (chartARef.current) {
                try {
                    isProgrammaticUpdate.current = true;
                    chartARef.current.timeScale().setVisibleRange(range as any);
                    // Reset flag immediately (synchronous) or very short timeout?
                    // LWC triggers subs synchronously usually.
                    isProgrammaticUpdate.current = false;
                } catch (e) {
                    isProgrammaticUpdate.current = false;
                    console.warn("[ChartContainer] setVisibleRange failed (chart likely disposing)", e);
                }
            }
        },
        setLogicalRange: (range: { from: number; to: number, anchorTime?: number, whitespaceOffset?: number }) => {
            if (chartARef.current) {
                // Precise sync: use setVisibleLogicalRange
                try {
                    isProgrammaticUpdate.current = true;

                    let targetRange = range;
                    const data = dataARef.current;

                    // TIME-ANCHORED SYNC: Adjust indices based on Anchor Time
                    if (range.anchorTime !== undefined && data.length > 0) {
                        let targetRightIndex = -1;

                        // Optimization: Check last bar first (Common case: Realtime Sync)
                        if (data[data.length - 1].time <= range.anchorTime) {
                            targetRightIndex = data.length - 1;
                        } else {
                            // Binary Search
                            let low = 0, high = data.length - 1;
                            while (low <= high) {
                                const mid = (low + high) >>> 1;
                                if (data[mid].time < range.anchorTime) low = mid + 1;
                                else high = mid - 1;
                            }
                            targetRightIndex = low > 0 && low >= data.length ? data.length - 1 : low;
                        }

                        // Sanity Check
                        if (targetRightIndex >= data.length) targetRightIndex = data.length - 1;

                        // APPLY WHITESPACE OFFSET (Future Scroll Fix)
                        // FIX: Clamp to reasonable limit (e.g. 50 bars) to prevent massive jumps into empty future
                        if (range.whitespaceOffset !== undefined && range.whitespaceOffset > 0) {
                            const clampedOffset = Math.min(range.whitespaceOffset, 50);
                            targetRightIndex += clampedOffset;

                            // DEBUG LOG
                            // console.log(`[Sync Recv] Applied Offset: ${clampedOffset}/${range.whitespaceOffset}, NewTo: ${targetRightIndex}`);
                        }

                        // Apply Width
                        const width = range.to - range.from;
                        const newTo = targetRightIndex;
                        // Maintain Whitespace Offset if source was projected
                        // We can't easily know source whitespace without source length.
                        // But range.to might be > length?
                        // If range.to > range.from, we apply that width.

                        targetRange = { from: newTo - width, to: newTo } as any;
                    }

                    chartARef.current.timeScale().setVisibleLogicalRange(targetRange as any);
                    isProgrammaticUpdate.current = false;
                } catch (e) {
                    isProgrammaticUpdate.current = false;
                    console.warn("[ChartContainer] setLogicalRange failed", e);
                }
            }
        },
        setCrosshair: (time: number, price?: number) => {
            if (chartARef.current && seriesARef.current) {
                // Defensive: Ensure price and time are strictly not null/undefined
                if (price !== undefined && price !== null && time !== null && time !== undefined) {
                    try {
                        chartARef.current.setCrosshairPosition(price, time as Time, seriesARef.current);
                    } catch (e) {
                        // Silent catch to prevent app crash if LWC internal state disagrees
                    }
                } else {
                    chartARef.current.clearCrosshairPosition();
                }
            }
        },
        closePopups: () => {
            closeMenu();
            closeSettings();
        },
        deselectAll: () => {
            if (chartWidgetRef.current) {
                chartWidgetRef.current.deselectAllShapes();
            }
        }
    }));

    // --- TIMEFRAME SCROLLER STATE ---
    const tfScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isAutoScale, setIsAutoScale] = useState(true);
    const [pendingTrade, setPendingTrade] = useState<any | null>(null);

    // --- SCROLL TO REALTIME BUTTON STATE ---
    const [isAtRealtime, setIsAtRealtime] = useState(true);
    const [isHoveringScrollTrigger, setIsHoveringScrollTrigger] = useState(false);
    const dataLengthRef = useRef(0);

    const checkTfScroll = () => {
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4); // Added 2px margin for reliability
            // Use Math.ceil for scrollWidth to handle sub-pixel issues in various browsers
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };

    // Hover state for right scale (managed via mouse move to avoid blocking)
    const [isRightHovered, setIsRightHovered] = useState(false);

    // TIMEZONE STATE
    // If props.timezone is provided, use it. Otherwise default to Browser/UTC.
    // Actually, we should pull from props directly if controlled.
    // But to minimize refactor, let's sync state.
    const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
        if (timezone) return timezone;
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; }
    });

    // --- BROKER DATA FETCHING ---
    const { fetchBrokers, brokers } = useBrokerStore();

    useEffect(() => {
        fetchBrokers();
    }, []);





    useEffect(() => {
        if (timezone) setSelectedTimezone(timezone);
    }, [timezone]);

    // --- DATA TRANSFORMATION PIPELINE ---
    // Apply indicator-based overrides (e.g. Imbalance opacity/coloring)
    // We memoize this to prevent recalculation on every render unless data or indicators change.
    const processedData = React.useMemo(() => {
        let result = [...dataA];
        // Apply transformations from active indicators
        activeIndicators.forEach(ind => {
            const def = indicatorRegistry.get(ind.defId);
            if (def && def.dataTransformer) {
                try {
                    result = def.dataTransformer(result, ind.settings);
                } catch (e) {
                    console.error(`[ChartContainer] Transformer error for ${ind.defId}:`, e);
                }
            }
        });
        return result;
    }, [dataA, activeIndicators]);

    const [chartReady, setChartReady] = useState(false);

    // Keep Data Refs Sync'd (Moved here to avoid TDZ)
    useEffect(() => { dataARef.current = processedData; }, [processedData]);
    useEffect(() => { dataBRef.current = dataB; }, [dataB]);

    // APPLY TIMEZONE FORMATTER
    useEffect(() => {
        const applyTimezone = (chart: IChartApi | null) => {
            if (!chart) return;
            chart.applyOptions({
                timeScale: {
                    tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
                        const date = new Date((time as number) * 1000);
                        const opts: Intl.DateTimeFormatOptions = { timeZone: selectedTimezone };

                        switch (tickMarkType) {
                            case TickMarkType.Year:
                                return date.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
                            case TickMarkType.Month:
                                return date.toLocaleDateString('en-US', { ...opts, month: 'short', year: 'numeric' });
                            case TickMarkType.DayOfMonth:
                                return date.toLocaleDateString('en-US', { ...opts, day: 'numeric', month: 'short' });
                            case TickMarkType.Time:
                                return date.toLocaleTimeString('en-US', { ...opts, hour: '2-digit', minute: '2-digit', hour12: false });
                            case TickMarkType.TimeWithSeconds:
                                return date.toLocaleTimeString('en-US', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                            default:
                                return "";
                        }
                    }
                },
                localization: {
                    dateFormat: 'yyyy-MM-dd',
                    timeFormatter: (time: Time) => {
                        const date = new Date((time as number) * 1000);
                        return date.toLocaleString('en-US', {
                            timeZone: selectedTimezone,
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            day: 'numeric',
                            month: 'short'
                        });
                    }
                }
            });
        };
        if (chartReady) {
            console.log(`[ChartContainer] Applying Timezone: ${selectedTimezone}`);
            applyTimezone(chartARef.current);
            applyTimezone(chartBRef.current);
        }
    }, [selectedTimezone, chartReady]);

    // Sync AutoScale state from chart
    useEffect(() => {
        const checkAutoScale = () => {
            if (chartARef.current) {
                const opts = chartARef.current.priceScale('right').options();
                if (opts.autoScale !== undefined && opts.autoScale !== isAutoScale) {
                    setIsAutoScale(opts.autoScale);
                }
            }
        };

        const interval = setInterval(checkAutoScale, 250); // Poll every 250ms
        return () => clearInterval(interval);
    }, [isAutoScale]);

    useEffect(() => {
        const el = tfScrollRef.current;
        if (el) {

            checkTfScroll();

            // Listen for scroll events
            el.addEventListener('scroll', checkTfScroll);

            // Use ResizeObserver for more robust detection of size changes
            const observer = new ResizeObserver(() => checkTfScroll());
            observer.observe(el);
            // Also observe children if they might change size later
            if (el.firstChild) observer.observe(el.firstChild as Element);

            window.addEventListener('resize', checkTfScroll);

            return () => {
                el.removeEventListener('scroll', checkTfScroll);
                observer.disconnect();
                window.removeEventListener('resize', checkTfScroll);
            };
        }
    }, []);

    const scrollTf = (direction: 'left' | 'right') => {
        if (tfScrollRef.current) {
            const amount = direction === 'left' ? -150 : 150;
            tfScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    // Initialize Charts (Run once on mount or when height changes)
    useEffect(() => {
        // Chart A is mandatory
        if (!containerRefA.current) return;

        // Default dimensions
        const initialWidth = containerRefA.current.clientWidth;
        const initialHeight = (typeof height === 'number') ? height / 2 : 300;

        // Helper to normalize background
        const bg = typeof theme.layout.background === 'string'
            ? { type: ColorType.Solid, color: theme.layout.background }
            : { type: ColorType.Solid, color: theme.layout.background.color };

        const chartOptions = {
            layout: {
                background: bg,
                textColor: theme.layout.textColor,
                fontSize: 11,
            },
            grid: {
                vertLines: {
                    color: theme.grid.vertLines.color,
                    visible: theme.grid.vertLines.visible,
                    style: theme.grid.vertLines.style
                },
                horzLines: {
                    color: theme.grid.horzLines.color,
                    visible: theme.grid.horzLines.visible,
                    style: theme.grid.horzLines.style
                },
            },
            crosshair: {
                mode: 0, // Normal (follows mouse precision)
                vertLine: { labelBackgroundColor: theme.crosshair.color },
                horzLine: { labelBackgroundColor: theme.crosshair.color },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                ticksVisible: true,
                borderColor: theme.timeScale.borderColor,
                rightOffset: 50,
                barSpacing: 10,
                minBarSpacing: 4,
                shiftVisibleRangeOnNewBar: true,
            },
            rightPriceScale: {
                borderColor: theme.priceScale.borderColor,
                autoScale: true,
                minimumWidth: 60, // Fixed width to match overlay
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            handleScale: {
                mouseWheel: false,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
        };

        // --- CHART A (Main) ---
        const chartA = createChart(containerRefA.current, { ...chartOptions, width: initialWidth, height: initialHeight });
        const seriesA = chartA.addSeries(CandlestickSeries, {
            upColor: theme.candles.upColor,
            downColor: theme.candles.downColor,
            borderVisible: true,
            wickVisible: true,
            borderUpColor: theme.candles.borderUpColor,
            borderDownColor: theme.candles.borderDownColor,
            wickUpColor: theme.candles.wickUpColor,
            wickDownColor: theme.candles.wickDownColor,

            priceFormat: { type: 'price', precision: precision, minMove: 1 / Math.pow(10, precision) },
        });

        // Initialize Horizon Series (Transparent)
        const seriesHorizon = chartA.addSeries(LineSeries, {
            color: 'transparent',
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lineVisible: false, // Totally invisible
        });
        seriesHorizonRef.current = seriesHorizon;

        // Subscribe to Click for Activation
        chartA.subscribeClick(() => {
            if (onChartClick) onChartClick();
        });

        chartARef.current = chartA;
        seriesARef.current = seriesA;
        // Pass Pane ID for Verification
        const widget = new ChartWidget(paneId || "unknown", chartA, seriesA);
        widget.setSymbol(symbol);
        chartWidgetRef.current = widget;

        // Subscribe to trade execution events
        widget.subscribe('execute' as any, (params: any) => {
            console.log("[ChartContainer] Execution event received:", params.trade);
            setPendingTrade(params.trade);
        });

        // --- CHART B (Optional) ---
        let chartB: IChartApi | null = null;
        let seriesB: ISeriesApi<"Candlestick"> | null = null;

        if (containerRefB.current) {
            chartB = createChart(containerRefB.current, { ...chartOptions, width: initialWidth, height: initialHeight });
            seriesB = chartB.addSeries(CandlestickSeries, {
                upColor: theme.candles.upColor,
                downColor: theme.candles.downColor,
                borderVisible: false,
                wickUpColor: theme.candles.wickUpColor,
                wickDownColor: theme.candles.wickDownColor,

                priceFormat: { type: 'price', precision: precision, minMove: 1 / Math.pow(10, precision) },
            });
            chartBRef.current = chartB;
            seriesBRef.current = seriesB;
        }

        // --- SYNCHRONIZATION (Only if B exists) ---
        if (chartB) {
            let isSyncing = false;

            // Helper for safe sync
            const syncRange = (sourceChart: IChartApi, targetChart: IChartApi) => {
                sourceChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
                    // Internal Loop Protection
                    if (isProgrammaticUpdate.current) return;

                    if (!range || isSyncing) return;
                    if (range.from === null || range.to === null || range.from === undefined || range.to === undefined) return;

                    isSyncing = true;
                    try {
                        const ts = targetChart.timeScale && targetChart.timeScale();
                        if (ts) {
                            isProgrammaticUpdate.current = true;

                            // TIME-ANCHORED FIXED-WIDTH SYNC
                            // 1. Get Width and Right Time
                            const width = (range.to as number) - (range.from as number);

                            // Use Refs to get latest data without closure staleness
                            const sourceData = sourceChart === chartA ? dataARef.current : dataBRef.current;
                            const targetData = targetChart === chartA ? dataARef.current : dataBRef.current;

                            if (sourceData && sourceData.length > 0 && targetData && targetData.length > 0) {

                                const clampedSourceIdx = Math.max(0, Math.min(Math.floor(range.to as number), sourceData.length - 1));
                                const rightTime = sourceData[clampedSourceIdx]?.time;

                                if (rightTime) {
                                    // Find Time in Target
                                    let targetRightIndex = -1;

                                    // Optimization: Check last bar first (Common case: Realtime Sync)
                                    if (targetData[targetData.length - 1].time <= rightTime) {
                                        targetRightIndex = targetData.length - 1;
                                    } else {
                                        // Binary Search for precise history sync
                                        let low = 0, high = targetData.length - 1;
                                        while (low <= high) {
                                            const mid = (low + high) >>> 1;
                                            if (targetData[mid].time < rightTime) low = mid + 1;
                                            else high = mid - 1;
                                        }
                                        // 'low' is insertion point (first element >= value)
                                        targetRightIndex = low > 0 && low >= targetData.length ? targetData.length - 1 : low;
                                    }

                                    // Handle Exact Match Logic vs "Closest"
                                    if (targetRightIndex >= targetData.length) targetRightIndex = targetData.length - 1;

                                    // Correct for whitespace offset if source was in whitespace
                                    const whitespaceOffset = (range.to as number) - clampedSourceIdx;
                                    if (whitespaceOffset > 0) {
                                        targetRightIndex += whitespaceOffset;
                                    }

                                    const newTo = targetRightIndex;
                                    const newFrom = newTo - width;

                                    ts.setVisibleLogicalRange({ from: newFrom, to: newTo } as any);
                                }
                            } else {
                                // Fallback if no data or init
                                ts.setVisibleLogicalRange(range as any);
                            }

                            isProgrammaticUpdate.current = false;
                        }
                    } catch (e) {
                        isProgrammaticUpdate.current = false;
                    }
                    isSyncing = false;
                });
            };

            syncRange(chartA, chartB);
            syncRange(chartB, chartA);

            // Crosshair Sync
            const syncCrosshair = (
                sourceChart: IChartApi,
                targetChart: IChartApi,
                targetSeries: ISeriesApi<"Candlestick"> | null
            ) => {
                sourceChart.subscribeCrosshairMove((param) => {
                    if (isSyncing || !targetSeries) return;
                    isSyncing = true;
                    try {
                        if (param.time) targetChart.setCrosshairPosition(param.point?.y || 0, param.time, targetSeries);
                        else targetChart.clearCrosshairPosition();
                    } catch (e) { /* Silent */ }
                    isSyncing = false;
                });
            };

            syncCrosshair(chartA, chartB, seriesB);
            syncCrosshair(chartB, chartA, seriesA); // Chart A always has series
        }

        // --- Crosshair Move Handler for OHLC Overlay ---
        // --- Crosshair Move Handler for OHLC Overlay & Sync ---
        chartA.subscribeCrosshairMove((param) => {
            // Guard against disposed state
            if (!chartARef.current || !seriesARef.current) return;

            try {
                // 1. OHLC Overlay
                if (param.time) {
                    const data = param.seriesData.get(seriesA);
                    if (data && typeof data === 'object' && 'open' in data) {
                        onOHLCChange?.(data as { open: number, high: number, low: number, close: number });
                    } else {
                        const candle = dataA.find(d => d.time === param.time);
                        if (candle) {
                            onOHLCChange?.(candle);
                        }
                    }
                } else {
                    onOHLCChange?.(null);
                }

                // 2. Sync / External Reporting
                if (param.time) {
                    const price = param.seriesData.get(seriesA);
                    // We need the raw price from the coordinate if possible, OR just use the Close of the candle
                    // Param.point.y is the coordinate.
                    let priceVal: number | undefined;

                    try {
                        priceVal = (price as any)?.close ?? seriesA.coordinateToPrice(param.point?.y || 0);
                    } catch (innerE) {
                        // If coordinateToPrice fails, fallback or ignore
                    }

                    if (priceVal !== undefined) {
                        onCrosshairMove?.(param.time, priceVal as number, undefined);
                    }
                } else {
                    onCrosshairMove?.(null, undefined, undefined);
                }
            } catch (e) {
                // Silent catch for crosshair errors during disposal
            }
        });

        // Subscribe to Visible Range Changes for Sync
        chartA.timeScale().subscribeVisibleTimeRangeChange((range) => {
            // LOOP PROTECTION
            if (isProgrammaticUpdate.current) return;

            try {
                if (range && range.from && range.to) {
                    onVisibleRangeChange?.({ from: range.from as number, to: range.to as number });
                }

                // HYBRID SYNC: Also emit Logical Range on Time Scroll 
                // This ensures we catch scroll events that might bypass the logical observer in some LWC versions
                const logical = chartA.timeScale().getVisibleLogicalRange();
                if (logical) {
                    onVisibleLogicalRangeChange?.(logical);
                }
            } catch (e) {
                // Silent catch for disposal race conditions
            }
        });

        // Subscribe to Logical Range Changes for Sync (Precise index-based)
        chartA.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            // LOOP PROTECTION
            if (isProgrammaticUpdate.current) {
                // console.log("[ChartContainer] skipping emit (programmatic)");
                return;
            }

            try {
                let anchorTime: number | undefined;

                if (range) {
                    const data = dataARef.current;
                    let whitespaceOffset = 0;

                    if (data && data.length > 0) {
                        // Calculate Anchor Time (Right Edge Time)
                        // Use clamped index to stay within valid data bounds
                        const idx = Math.max(0, Math.min(Math.floor(range.to as number), data.length - 1));
                        anchorTime = data[idx]?.time;

                        // Calculate Whitespace Offset (Fix for "Sticky Right Edge")
                        whitespaceOffset = (range.to as number) - (data.length - 1);

                        // DEBUG LOGGING
                        // if (whitespaceOffset > 0) {
                        //     console.log(`[Sync Emit] Offset: ${whitespaceOffset.toFixed(2)}, To: ${range.to.toFixed(2)}, LastIdx: ${data.length - 1}`);
                        // }

                        // Check if at Realtime Edge
                        const dist = (data.length - 1) - (range.to as number);
                        const isAtEdge = dist < 2;
                        setIsAtRealtime(isAtEdge);

                        // ROBUSTNESS: While in history, strictly track where we are
                        if (!isAtEdge && data) {
                            const fIdx = Math.max(0, Math.floor(range.from as number));
                            const tIdx = Math.min(data.length - 1, Math.ceil(range.to as number));
                            const fTime = data[fIdx]?.time;
                            const tTime = data[tIdx]?.time;
                            if (fTime && tTime) {
                                historyFocusRef.current = { from: fTime as number, to: tTime as number };
                            }
                        }
                    }

                    onVisibleLogicalRangeChange?.({ ...range, anchorTime, whitespaceOffset } as any);
                }
            } catch (e) {
                // Silent catch
            }
        });

        setChartReady(true);

        return () => {
            // 1. Lock the door: Prevent external access immediately
            chartARef.current = null;
            chartBRef.current = null;
            seriesARef.current = null;
            seriesBRef.current = null;

            // 2. Dispose Widget
            if (chartWidgetRef.current) {
                try {
                    chartWidgetRef.current.dispose();
                } catch (e) {
                    console.warn("[ChartContainer] Widget dispose failed:", e);
                }
                chartWidgetRef.current = null;
            }

            // 3. Destroy Chart
            try {
                chartA.remove();
                if (chartB) chartB.remove();
            } catch (e) {
                console.warn("[ChartContainer] Chart remove error:", e);
            }
        };
    }, []); // Only run once on mount

    // Resize Logic
    const isSingleMode = !symbolB;

    useEffect(() => {
        if (!mainContainerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries.length === 0) return;
            const { width, height: containerHeight } = entries[0].contentRect;

            // Calculate available height for charts
            // overhead: Header(40) + Footer(42) = 82 if single
            // overhead: HeaderA(40) + Footer(42) + HeaderB(41) = 123 if dual
            const overhead = isSingleMode ? 0 : 41;
            const availableHeight = containerHeight - overhead;

            if (availableHeight > 0) {
                const heightPerChart = isSingleMode ? availableHeight : (availableHeight / 2);

                chartARef.current?.applyOptions({ width, height: heightPerChart });
                if (!isSingleMode) {
                    chartBRef.current?.applyOptions({ width, height: heightPerChart });
                }
            }
        });

        resizeObserver.observe(mainContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [symbolB]); // Re-run when mode changes



    // Handler for Scroll To RealTime
    // Handler for Scroll To RealTime
    const handleScrollToRealTime = () => {
        if (!chartARef.current || dataARef.current.length === 0) return;

        const dataA = dataARef.current;
        const lastTimeA = dataA[dataA.length - 1].time as number;
        let targetTime = lastTimeA;

        // Check Chart B for newer data (e.g. Crypto vs Stocks on Weekend)
        if (dataBRef.current && dataBRef.current.length > 0) {
            const lastTimeB = dataBRef.current[dataBRef.current.length - 1].time as number;
            if (lastTimeB > targetTime) {
                targetTime = lastTimeB;
            }
        }

        const lastRealIndex = dataA.length - 1;
        let additionalBars = 0;

        // If target time is in the future relative to Chart A (e.g. Logic Gap)
        if (targetTime > lastTimeA) {
            const secondsPerBar = getTimeframeSeconds(timeframe);
            if (secondsPerBar > 0) {
                // Determine how many bars worth of empty space we need
                additionalBars = Math.ceil((targetTime - lastTimeA) / secondsPerBar);
            }
        }

        // Get current width to maintain zoom
        const currentRange = chartARef.current.timeScale().getVisibleLogicalRange();
        const width = currentRange ? (currentRange.to - currentRange.from) : 100;

        // We typically want a bit of right offset (e.g. 5 bars)
        const rightOffset = 5;

        // Target: End of Real Data + Future Gap + Offset
        const newTo = lastRealIndex + additionalBars + rightOffset;
        const newFrom = newTo - width;

        chartARef.current.timeScale().setVisibleLogicalRange({ from: newFrom, to: newTo });
        setIsAtRealtime(true);
    };

    // Reset fit flags when symbol changes
    useEffect(() => {
        hasFittedARef.current = false;
        if (chartWidgetRef.current) {
            chartWidgetRef.current.setSymbol(symbol);
        }
    }, [symbol]);

    useEffect(() => {
        hasFittedBRef.current = false;
    }, [symbolB]);



    // State to persist "Intent" across renders until data is ready
    const viewStateRef = useRef<{
        type: 'LIVE_EDGE' | 'HISTORY' | 'TIME' | 'NONE';
        savedBarCount: number | null;
        savedRightTime: number | null;
        savedRightOffset: number | null;
        savedRange: any;
    }>({ type: 'NONE', savedBarCount: null, savedRightTime: null, savedRightOffset: null, savedRange: null });

    // Ref to track stabilization status during switches to prevent premature sync broadcasts
    const isStabilizingRef = useRef(false);

    // Data Update Effect with One-Time Fit AND Scroll Preservation
    useEffect(() => {
        if (seriesARef.current) {
            // Check if this update coincides with a timeframe switch request
            const isTimeframeSwitchReq = prevTimeframeRef.current !== timeframe;

            if (isTimeframeSwitchReq) {
                isStabilizingRef.current = true;
            }

            // 1. Snapshot State BEFORE touching data (if switching)
            // Use processedData length for consistent state management
            dataLengthRef.current = processedData.length;

            if (isTimeframeSwitchReq && viewStateRef.current.type === 'NONE') {
                if (hasFittedARef.current && chartARef.current) {
                    try {
                        const logicRange = chartARef.current.timeScale().getVisibleLogicalRange();

                        if (logicRange && logicRange.from !== null && logicRange.to !== null) {
                            const barCount = (logicRange.to as number) - (logicRange.from as number);
                            const lastBarIndex = processedData.length - 1;
                            const distFromEdge = lastBarIndex - (logicRange.to as number); // Positive if looking at history

                            // THRESHOLD: If we are within 5 bars of the "Latest Data", consider it Realtime Mode.
                            // FIX: Ensure we don't treat "Deep Future" (negative offset) as Realtime.
                            // If distFromEdge is < -5 (more than 5 bars into future), treat as HISTORY/TIME or just invalid.
                            const isAtRealtimeEdge = distFromEdge < 5 && distFromEdge > -5;

                            if (isAtRealtimeEdge) {
                                viewStateRef.current = {
                                    type: 'LIVE_EDGE',
                                    savedBarCount: barCount,
                                    savedRightOffset: distFromEdge,
                                    savedRightTime: null,
                                    savedRange: null
                                };
                                console.log(`[ChartContainer] Capturing LIVE_EDGE Viewport. Offset: ${distFromEdge.toFixed(2)}`);
                            } else {
                                // HISTORY MODE: Capture the TIME of the rightmost visible bar
                                // This ensures that when we switch TF, we find the index corresponding to this TIME.
                                const clampedRightIdx = Math.max(0, Math.min(Math.floor(logicRange.to as number), processedData.length - 1));
                                const rightTime = processedData[clampedRightIdx]?.time;

                                if (rightTime) {
                                    viewStateRef.current = {
                                        type: 'HISTORY',
                                        savedBarCount: barCount,
                                        savedRightTime: rightTime as number,
                                        savedRightOffset: null,
                                        savedRange: null
                                    };
                                    console.log(`[ChartContainer] Capturing HISTORY Viewport. RightTime: ${rightTime}`);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("[ChartContainer] Failed to capture state for TF switch", e);
                    }
                }
            } else if (!isTimeframeSwitchReq && viewStateRef.current.type === 'NONE' && hasFittedARef.current && chartARef.current) {
                // Regular streaming/backfill update - Snapshot TIME range
                try {
                    const r = chartARef.current.timeScale().getVisibleRange();
                    if (r) {
                        viewStateRef.current = {
                            type: 'TIME',
                            savedRange: r,
                            savedBarCount: null,
                            savedRightTime: null,
                            savedRightOffset: null
                        };
                    } else if (!isAtRealtime && historyFocusRef.current) {
                        // FALLBACK: If chart returned null range (e.g. was empty/loading), but we know we are in history
                        console.log("[ChartContainer] Snapshot failed, using History Fallback");
                        viewStateRef.current = {
                            type: 'TIME',
                            savedRange: { from: historyFocusRef.current.from, to: historyFocusRef.current.to } as any,
                            savedBarCount: null,
                            savedRightTime: null,
                            savedRightOffset: null
                        };
                    }
                } catch (e) { /* Silent */ }
            }

            // 2. Analyze Incoming Data for Freshness
            let isDataReady = false;

            if (processedData.length > 1) {
                const interval = Math.abs(processedData[processedData.length - 1].time - processedData[processedData.length - 2].time);
                const targetInterval = getTimeframeSeconds(timeframe);

                if (interval >= targetInterval * 0.8 && interval <= targetInterval * 5) {
                    isDataReady = true;
                } else if (processedData.length < 5) {
                    isDataReady = true;
                }
            } else if (processedData.length > 0) {
                isDataReady = true;
            } else {
                isDataReady = true;
            }

            // If we are strictly switching, enforce data readiness before applying logic or updating ref
            if (isTimeframeSwitchReq && !isDataReady) {
                return;
            }

            // 3. Apply Data (INCREMENTAL vs FULL)
            // Smart update to prevent Crosshair Reset on Ticks
            const prevLen = dataLengthRef.current; // Captured before snapshot logic for accurate comparison? No, that was processedData.length.
            // Better to use a separate Persistent Ref for comparison, as dataLengthRef meant for "Before this render logic"

            // Logic:
            // If NOT switching timeframe AND data is effectively the same (start time match) AND length is same or +1
            // Then UPDATE instead of SET.

            let appliedIncremental = false;

            if (!isTimeframeSwitchReq && processedData.length > 0 && prevDataLengthRef.current > 0) {
                // Check consistency (Start Time match) - crude check for massive history shift
                const prevStart = prevStartTimeRef.current;
                const newStart = processedData[0].time as number;

                // Allow tiny tolerance or exact match
                if (prevStart === newStart) {
                    const lenDiff = processedData.length - prevDataLengthRef.current;
                    // Allow strictly 0 (update last) or 1 (new tick)
                    // Also safeguard against negative (data reduction)
                    if (lenDiff >= 0 && lenDiff <= 2) {
                        // Apply Updates
                        const lastCandle = processedData[processedData.length - 1];
                        seriesARef.current.update(lastCandle);

                        // If we added 2 candles (rare), update the one before too?
                        // update() only affects the specific time.
                        if (lenDiff === 2) {
                            const secondLast = processedData[processedData.length - 2];
                            seriesARef.current.update(secondLast); // Update previous just in case
                            seriesARef.current.update(lastCandle); // Then last
                        }

                        appliedIncremental = true;
                        // console.log(`[ChartContainer] Incremental Update Applied. Diff: ${lenDiff}, Last: ${lastCandle.close}`);
                    }
                }
            }

            if (!appliedIncremental) {
                seriesARef.current.setData(processedData);
            }

            // Update Tracking Refs for Next Render
            if (processedData.length > 0) {
                prevDataLengthRef.current = processedData.length;
                prevStartTimeRef.current = processedData[0].time as number;
            } else {
                prevDataLengthRef.current = 0;
                prevStartTimeRef.current = 0;
            }

            // 4. Restore State
            if (processedData.length > 0 && !appliedIncremental) { // Update logic preserves state, so only restore on setData
                if (!hasFittedARef.current) {
                    // Fix for Infinite Scroll: Don't use fitContent() if we have phantom bars, 
                    // as it zooms out to 2026.
                    const hasPhantom = horizonData.length > 0;

                    if (hasPhantom && chartARef.current) {
                        const lastRealIndex = processedData.length - 1;
                        // Default startup zoom: 100 bars?
                        const defaultBarCount = 100;
                        const rightOffset = 5;

                        chartARef.current.timeScale().setVisibleLogicalRange({
                            from: lastRealIndex - defaultBarCount + rightOffset,
                            to: lastRealIndex + rightOffset
                        });
                    } else {
                        chartARef.current?.timeScale().fitContent();
                    }
                    hasFittedARef.current = true;
                } else if (chartARef.current) {
                    // Apply captured view state
                    try {
                        const state = viewStateRef.current;

                        if (state.type === 'TIME' && state.savedRange && state.savedRange.from && state.savedRange.to) {
                            chartARef.current.timeScale().setVisibleRange(state.savedRange);
                        }
                        else if (state.type === 'LIVE_EDGE' && state.savedBarCount != null && state.savedRightOffset != null) {
                            const lastIdx = processedData.length - 1;
                            const newTo = lastIdx - state.savedRightOffset;
                            const newFrom = newTo - state.savedBarCount;

                            chartARef.current.timeScale().setVisibleLogicalRange({
                                from: newFrom,
                                to: newTo
                            } as any);
                            console.log(`[ChartContainer] Restored LIVE_EDGE. Offset: ${state.savedRightOffset.toFixed(2)} -> To: ${newTo.toFixed(2)}`);
                        }
                        else if (state.type === 'HISTORY' && state.savedBarCount != null && state.savedRightTime != null) {
                            // Find index close to RightTime
                            let low = 0, high = processedData.length - 1;
                            let idx = -1;

                            while (low <= high) {
                                const mid = (low + high) >>> 1;
                                const midTime = processedData[mid].time;
                                if (midTime < state.savedRightTime) {
                                    low = mid + 1;
                                } else {
                                    high = mid - 1;
                                }
                            }
                            idx = low;
                            // idx is now the insertion point (closest bar >= RightTime) OR the exact bar.
                            if (idx < 0) idx = 0;
                            if (idx >= processedData.length) idx = processedData.length - 1;

                            const newTo = idx;
                            const newFrom = idx - state.savedBarCount;

                            chartARef.current.timeScale().setVisibleLogicalRange({
                                from: newFrom,
                                to: newTo
                            } as any);
                            console.log(`[ChartContainer] Restored HISTORY. RightTime: ${state.savedRightTime} -> Idx: ${idx}`);
                        }
                    } catch (e) {
                        console.error("[ChartContainer] Error restoring view state:", e);
                    }
                }
            }
            // 5. Cleanup / Finish Transition
            const isClearing = processedData.length === 0;

            if (!isClearing && (isDataReady || !isTimeframeSwitchReq)) {
                prevTimeframeRef.current = timeframe;
                // Reset Intent
                viewStateRef.current = { type: 'NONE', savedBarCount: null, savedRightTime: null, savedRightOffset: null, savedRange: null };
                // Mark stabilization complete
                isStabilizingRef.current = false;
            }
        }
    }, [processedData, timeframe, horizonData]);

    // Update Horizon Data
    useEffect(() => {
        if (seriesHorizonRef.current) {
            if (horizonData.length > 0) {
                seriesHorizonRef.current.setData(horizonData);
            } else {
                seriesHorizonRef.current.setData([]); // Explicitly clear
            }
        }
    }, [horizonData]);

    useEffect(() => {
        if (seriesBRef.current && dataB.length > 0 && !isSingleMode) {
            seriesBRef.current.setData(dataB);
            if (!hasFittedBRef.current) {
                chartBRef.current?.timeScale().fitContent();
                hasFittedBRef.current = true;
            }
        }
    }, [dataB, isSingleMode]);

    // --- INDICATOR PLUGIN MANAGEMENT ---
    useEffect(() => {
        if (!chartReady || !seriesARef.current || !chartARef.current) return;

        const plugins = indicatorPluginsRef.current;
        const currentIds = new Set(activeIndicators.map(i => i.instanceId));

        // 1. Remove Detached Indicators
        for (const [id, plugin] of plugins.entries()) {
            if (!currentIds.has(id)) {
                try {
                    seriesARef.current.detachPrimitive(plugin);
                } catch (e) { /* ignore */ }
                plugins.delete(id);
                console.log(`[ChartContainer] Detached plugin: ${id}`);
            }
        }

        // 2. Add/Update Indicators
        activeIndicators.forEach(ind => {
            let plugin = plugins.get(ind.instanceId);

            // A. Create if missing
            if (!plugin) {
                const def = indicatorRegistry.get(ind.defId);
                if (def && def.pluginFactory) {
                    plugin = def.pluginFactory(ind.settings);
                    if (plugin) {
                        seriesARef.current?.attachPrimitive(plugin);
                        plugins.set(ind.instanceId, plugin);
                        // console.log(`[ChartContainer] Attached plugin: ${ind.defId} (${ind.instanceId})`);
                    }
                }
            } else {
                // B. Update Settings
                if (plugin.updateSettings) {
                    plugin.updateSettings(ind.settings);
                }
            }

            // NEW: Push Common State to Plugin
            const pluginAsAny = plugin as any;

            // 1. Timeframe
            if (pluginAsAny && pluginAsAny.updateTimeframe) {
                pluginAsAny.updateTimeframe(timeframe);
            }

            // 2. Latest Time (for precise clamping)
            if (pluginAsAny && pluginAsAny.updateCurrentTime && dataA.length > 0) {
                const latestTime = dataA[dataA.length - 1].time;
                pluginAsAny.updateCurrentTime(latestTime);
            }
            // NEW: Push Full Data to Plugin (for Client-Side Calculation)
            if (pluginAsAny && pluginAsAny.updateData) {
                pluginAsAny.updateData(dataA);
            }

            // NEW: Push Visibility
            if (pluginAsAny && typeof pluginAsAny.setVisible === 'function') {
                pluginAsAny.setVisible(ind.visible ?? true);
            }

            // C. Fetch Data Check
            if (plugin && ind.visible) {
                const def = indicatorRegistry.get(ind.defId);
                if (def && def.dataFetcher) {
                    // Fetch Data logic
                    const fromTime = dataA.length > 0 ? dataA[0].time : Math.floor(Date.now() / 1000) - 86400 * 30;
                    const toTime = dataA.length > 0 ? dataA[dataA.length - 1].time : Math.floor(Date.now() / 1000);

                    def.dataFetcher({
                        symbol: symbol,
                        timeframe: timeframe,
                        from: (fromTime as number) * 1000,
                        to: (toTime as number) * 1000,
                        settings: ind.settings
                    }).then(data => {
                        if (plugin.updateSessions) {
                            plugin.updateSessions(data);
                        }
                    }).catch(e => console.error("Indicator Data Fetch Failed", e));
                }
            }
        });

    }, [activeIndicators, symbol, timeframe, dataA, chartReady]);

    // Cleanup Plugins on Unmount
    useEffect(() => {
        return () => {
            const plugins = indicatorPluginsRef.current;
            if (seriesARef.current && plugins.size > 0) {
                plugins.forEach((plugin) => {
                    try {
                        seriesARef.current?.detachPrimitive(plugin);
                    } catch (e) { /* Ignore if already disposed */ }
                });
                plugins.clear();
            }
        };
    }, []);

    // Apply Theme Changes Dynamically
    useEffect(() => {
        const applyThemeToChart = (chart: IChartApi | null, series: ISeriesApi<"Candlestick"> | null) => {
            if (!chart) return;

            chart.applyOptions({
                layout: {
                    background: { type: ColorType.Solid, color: typeof theme.layout.background === 'string' ? theme.layout.background : theme.layout.background.color },
                    textColor: theme.layout.textColor,
                },
                grid: {
                    vertLines: {
                        color: theme.grid.vertLines.color,
                        visible: theme.grid.vertLines.visible,
                        style: theme.grid.vertLines.style
                    },
                    horzLines: {
                        color: theme.grid.horzLines.color,
                        visible: theme.grid.horzLines.visible,
                        style: theme.grid.horzLines.style
                    },
                },
                timeScale: {
                    borderColor: theme.timeScale.borderColor,
                    timeVisible: true,
                    secondsVisible: false,
                    ticksVisible: true,
                },
                rightPriceScale: {
                    borderColor: theme.priceScale.borderColor,
                },
                crosshair: {
                    vertLine: { labelBackgroundColor: theme.crosshair.color },
                    horzLine: { labelBackgroundColor: theme.crosshair.color },

                },
                localization: {
                    priceFormatter: (p: number) => p.toFixed(precision),
                },
                handleScale: {
                    mouseWheel: false,
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true,
                },
            });

            if (series) {
                series.applyOptions({
                    upColor: theme.candles.upColor,
                    downColor: theme.candles.downColor,
                    wickVisible: true,
                    borderVisible: true,
                    wickUpColor: theme.candles.wickUpColor,
                    wickDownColor: theme.candles.wickDownColor,
                    borderUpColor: theme.candles.borderUpColor,
                    borderDownColor: theme.candles.borderDownColor,
                    priceFormat: { type: 'price', precision: precision, minMove: 1 / Math.pow(10, precision) },
                });
            }
        };

        applyThemeToChart(chartARef.current, seriesARef.current);
        applyThemeToChart(chartBRef.current, seriesBRef.current);

    }, [theme, precision]);

    // Tool Toggle Logic
    // --- UPDATE MAGNET DATA ---
    useEffect(() => {
        if (chartWidgetRef.current && dataA.length > 0) {
            chartWidgetRef.current.setSeriesData(dataA);
            // Also update timeframe
            if (timeframe) {
                chartWidgetRef.current.setTimeframe(timeframe);
            }
            // Fix: Ensure widgets (like position tools) get the latest price immediately on data refresh
            const last = dataA[dataA.length - 1];
            if (last) {
                chartWidgetRef.current.updateLastPrice(last.close, last.time as number);
            }
        }
    }, [dataA, timeframe]);

    const toggleLongShortTool = (direction: 'long' | 'short') => {
        console.log(`[ChartContainer] toggleLongShortTool called: ${direction}`);
        if (!seriesARef.current || !chartARef.current) {
            console.error("[ChartContainer] Chart or Series not initialized", {
                chart: !!chartARef.current,
                series: !!seriesARef.current
            });
            return;
        }

        if (dataA.length === 0) {
            console.warn("[ChartContainer] Cannot create tool: dataA is empty");
            return;
        }

        const lastCandle = dataA[dataA.length - 1];
        const currentPrice = lastCandle.close || lastCandle.value;
        console.log(`[ChartContainer] Creating ${direction} tool at ${currentPrice}`);

        // Calculate tighter defaults (0.05% risk/reward base)
        const spread = currentPrice * 0.0005;

        let slPrice, tpPrice;

        if (direction === 'long') {
            slPrice = currentPrice - spread;
            tpPrice = currentPrice + (spread * 2); // 1:2 RR default
        } else {
            slPrice = currentPrice + spread;
            tpPrice = currentPrice - (spread * 2); // 1:2 RR default
        }

        // Create initial state
        const initialState: LongShortState = {
            entryPrice: currentPrice,
            stopLossPrice: slPrice,
            takeProfitPrice: tpPrice,
            timeIndex: lastCandle.time as number,
            riskReward: 2.0,
            fixedLeg: 'rr',
            fixedStates: {
                tp: false,
                sl: false,
                entry: false,
                rr: true
            },
            orderType: 'MARKET'
        };

        try {
            if (chartWidgetRef.current) {
                chartWidgetRef.current.createShape(
                    { time: lastCandle.time as number, price: currentPrice },
                    {
                        shape: direction === 'long' ? 'Riskrewardlong' : 'Riskrewardshort',
                        overrides: {
                            [`linetoolriskreward${direction}.stopLevel`]: slPrice,
                            [`linetoolriskreward${direction}.profitLevel`]: tpPrice,
                            [`linetoolriskreward${direction}.entryPrice`]: currentPrice,
                            [`linetoolriskreward${direction}.riskReward`]: 2.0,
                            [`linetoolriskreward${direction}.fixedLeg`]: 'rr',
                            [`linetoolriskreward${direction}.symbol`]: symbol  // Pass usage symbol
                        }
                    }
                );
            }
            console.log("Tool created successfully via ChartWidget");
        } catch (e) {
            console.error("Error attaching tool:", e);
        }
    };

    const toggleAutoScale = () => {
        const newState = !isAutoScale;
        setIsAutoScale(newState);
        chartARef.current?.priceScale('right').applyOptions({ autoScale: newState });
        if (!isSingleMode) {
            chartBRef.current?.priceScale('right').applyOptions({ autoScale: newState });
        }
    };

    const handleConfirmExecution = async () => {
        if (!pendingTrade) return;

        console.log("[Chart] Preparing Execution for:", pendingTrade);

        // 1. Get Distribution Config
        const config = await TradeDistributionManager.getDistributionConfig();

        // 2. Calculate Batches
        // We filter 'accounts' to ensure we only consider what's passed in (props.accounts usually contains all accounts)
        const batches = TradeDistributionManager.distributeTrade(
            pendingTrade,
            accounts,
            brokers,
            config
        );

        console.log("--- DEBUG: DISTRIBUTION PLAN ---");
        console.log(batches);

        if (batches.length === 0) {
            alert("No target accounts found for distribution!");
            return;
        }

        // 3. DEBUG OUTPUT (User Request)
        const debugMsg = batches.map(b => {
            const brokerName = brokers.find(br => br.id === b.brokerId)?.name || b.brokerId;
            const accountLogins = b.accounts.map((acc: any) => {
                return acc.login || acc.id;
            });
            return `Broker: ${brokerName}\nSymbol: ${b.trade.symbol}\nAccounts: ${accountLogins.length} (${accountLogins.join(', ')})`;
        }).join('\n\n');

        alert(`[DEBUG MODE] Distribution Plan:\n\n${debugMsg}\n\n(No trade sent to backend yet)`);
        setPendingTrade(null);

        // 4. EXECUTE TRADES (Send to Backend)
        try {
            await Promise.all(batches.map(async (batch) => {
                const res = await fetch('/api/distribution/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batch)
                });

                if (res.ok) {
                    const result = await res.json();
                    console.log(`[ChartContainer] Batch for ${batch.brokerId} executed:`, result);
                } else {
                    console.error(`[ChartContainer] Batch execution failed for ${batch.brokerId}: ${res.statusText}`);
                }
            }));

            // alert("Trade Execution Sent to Backend!"); // Optional feedback
        } catch (e) {
            console.error("[ChartContainer] Execution Error", e);
            alert("Failed to send execution command to backend.");
        }
    };

    return (
        <div ref={mainContainerRef} className="flex flex-col bg-slate-950 border border-slate-800 overflow-hidden w-full relative" style={{ height: typeof height === 'number' ? height : '100%' }}>
            {/* ... Header and Content ... */}
            {/* Need to ensure we don't overwrite the whole file. Ideally just targeting the button area would be safer but since I need to insert the function... */}
            {/* Actually, I can insert the function before 'return' and then replace the button separately? */}
            {/* But I can do one block if I match context. */}

            {/* Global Key Listener for Drawing Tools */}
            {React.createElement(
                React.Fragment,
                null,
                (() => {
                    useEffect(() => {
                        const handleKeyDown = (e: KeyboardEvent) => {
                            // Alt + H = Horizontal Line
                            // Alt + J = Horizontal Ray
                            if (!isActive || !e.altKey) return;

                            const isLine = e.code === 'KeyH';
                            const isRay = e.code === 'KeyJ';
                            const isVert = e.code === 'KeyV';

                            if ((isLine || isRay || isVert) && currentMousePosRef.current && chartARef.current && seriesARef.current && chartWidgetRef.current) {
                                e.preventDefault();

                                const { x, y } = currentMousePosRef.current;
                                const timeScale = chartARef.current.timeScale();
                                const series = seriesARef.current;

                                // Magnet Snap Logic
                                const snapped = MagnetService.snap(
                                    x, y,
                                    series,
                                    dataA, // Using dataA as main source
                                    timeScale,
                                    timeframe
                                );

                                const finalTime = timeScale.coordinateToTime(snapped.x) as number;
                                const finalPrice = series.coordinateToPrice(snapped.y);

                                if (finalPrice !== null) {
                                    chartWidgetRef.current.createShape(
                                        { time: finalTime || 0, price: finalPrice },
                                        {
                                            shape: isVert ? 'VerticalLine' : (isLine ? 'HorizontalLine' : 'HorizontalRay'),
                                            overrides: {
                                                anchor: snapped.anchor // Passing anchor info for snapping context
                                            }
                                        }
                                    );
                                }
                            }
                        };

                        window.addEventListener('keydown', handleKeyDown);
                        return () => window.removeEventListener('keydown', handleKeyDown);
                    }, [dataA, timeframe, isActive]);
                    return null;
                })()
            )}

            {/* Chart A Header */}


            {/* Chart A Header Removed */}

            {/* Charts Section */}
            {/* Charts Section */}
            <div className="flex-1 min-h-0 flex flex-col relative">
                {!isAtRealtime && (
                    <div
                        // Large Trigger Zone for easy access
                        className="absolute bottom-[30px] right-[60px] w-40 h-32 flex items-end justify-end z-[50] pb-[15px] pr-[15px]"
                        style={{ pointerEvents: 'auto' }}
                        onMouseEnter={() => setIsHoveringScrollTrigger(true)}
                        onMouseLeave={() => setIsHoveringScrollTrigger(false)}
                    >
                        {isHoveringScrollTrigger && (
                            <button
                                onClick={handleScrollToRealTime}
                                // TradingView-like: Small (26px), dark grey bg. Hover: Text becomes white for contrast.
                                className="bg-[#2a2e39] hover:bg-[#363a45] text-[#b2b5be] hover:text-white rounded w-[26px] h-[26px] flex items-center justify-center shadow-md transition-all border border-[#2a2e39]"
                                title="Scroll to Realtime"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    {/* Right Arrow (Larger) - Centered at 12 (bbox 6.25-17.75) */}
                                    <path d="M10.75 5l7 7-7 7" strokeWidth="2.5" />
                                    {/* Left Arrow (Smaller & Nested) */}
                                    <path d="M6.25 9l3 3-3 3" strokeWidth="2.5" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
                {/* Chart A Wrapper */}
                <div
                    className={`w-full relative min-h-0 bg-slate-900/10 ${isSingleMode ? 'flex-1' : 'flex-1'}`}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        currentMousePosRef.current = {
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                        };

                        const isRight = (e.clientX - rect.left) > (rect.width - 60);
                        if (isRight !== isRightHovered) {
                            setIsRightHovered(isRight);
                        }
                    }}
                    onMouseLeave={() => setIsRightHovered(false)}
                >
                    <div ref={containerRefA} className="absolute inset-0" />





                    {/* Auto Scale Toggle Button (Shows on Hover - Non-blocking) */}
                    <div
                        className={`absolute bottom-[34px] right-2 z-30 transition-all duration-200 pointer-events-auto ${isRightHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                            }`}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleAutoScale();
                            }}
                            className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors ${isAutoScale
                                ? 'bg-slate-950 text-white border-slate-950 hover:bg-slate-800' // Active: Black button, White Text
                                : 'bg-white text-black border-slate-300 hover:bg-slate-100'     // Inactive: White button, Black Text
                                }`}
                            title="Toggle Auto Scale"
                        >
                            A
                        </button>
                    </div>

                    {/* --- CORNER GEAR (Permanent) --- */}
                    <div className="absolute bottom-0 right-0 w-[60px] h-[30px] z-20 flex items-center justify-center bg-transparent pointer-events-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSettingsClick?.();
                            }}
                            className="text-slate-500 hover:text-slate-400 transition-colors p-1"
                            title="Chart Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                </div>

                {/* Chart B Section (Conditional) */}
                {!isSingleMode && (
                    <>
                        <div className="h-[1px] bg-slate-800 shrink-0 mx-4" />
                        {/* Chart B Header */}
                        <div className="px-4 py-2 bg-slate-900 border-b border-t border-slate-800 flex justify-between items-center h-[40px] shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="font-bold text-indigo-300 tracking-tight">{symbolB}</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest">Correlation</span>
                        </div>
                        {/* Chart B Wrapper */}
                        <div className="w-full relative flex-1 min-h-0 bg-slate-900/10">
                            <div ref={containerRefB} className="absolute inset-0" />
                        </div>
                    </>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-mono text-emerald-500 animate-pulse">LOADING DATA...</span>
                        </div>
                    </div>
                )}
            </div>



            {/* Footer Removed */}

            {/* --- Context Menu & Settings --- */}
            {menuState.visible && (
                <ContextMenu
                    x={menuState.x}
                    y={menuState.y}
                    items={menuState.type === 'widget' ? [
                        { label: 'Settings...', action: openSettings },
                        { label: 'Bring to Front', action: () => { console.log('Bring to front not implemented yet'); } },
                        { label: 'Delete', action: handleDelete, danger: true }
                    ] : [
                        { label: 'Remove All Drawings', action: handleRemoveAll, danger: true }
                    ]}
                    onClose={closeMenu}
                />
            )}

            <SettingsModal
                isOpen={settingsState.isOpen}
                onClose={closeSettings}
                onSave={saveSettings}
                schema={settingsState.schema}
                title="Widget Settings"
            />

            {/* --- Trade Confirmation Dialog --- */}
            {pendingTrade && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className={pendingTrade.direction === 'LONG' ? "text-emerald-500" : "text-rose-500"}>
                                    {pendingTrade.direction === 'LONG' ? "Long" : "Short"} Setup
                                </span>
                            </h3>
                            <button onClick={() => setPendingTrade(null)} className="text-slate-400 hover:text-white transition-colors">
                                <ChevronRight className="rotate-90" size={20} />
                            </button>
                        </div>

                        <div className="p-0 overflow-hidden">
                            {/* Table Panel for Execution Config */}
                            <div className="w-full text-sm text-left">
                                <div className="grid grid-cols-[100px_1fr_80px] border-b border-slate-800 bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                    <div className="px-4 py-2">Level</div>
                                    <div className="px-4 py-2">Configuration</div>
                                    <div className="px-4 py-2 text-right">Status</div>
                                </div>

                                {/* Stop Loss */}
                                <div className="grid grid-cols-[100px_1fr_80px] border-b border-slate-800 items-center hover:bg-slate-900/30 transition-colors">
                                    <div className="px-4 py-3 font-bold text-rose-500">Stop Loss</div>
                                    <div className="px-4 py-3 font-mono text-slate-300">
                                        {pendingTrade.sl.anchor ? (
                                            <span className="flex items-center gap-2">
                                                <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 border border-slate-700">{pendingTrade.sl.anchor.timeframe}</span>
                                                <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 border border-slate-700 font-bold text-white">{pendingTrade.sl.anchor.type.toUpperCase()}</span>
                                                <span>{new Date(pendingTrade.sl.anchor.time * 1000).toISOString().substr(11, 5)}</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 italic">No Anchor (Price-based)</span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 text-right">
                                        {pendingTrade.sl.fixed ? (
                                            <span className="text-[10px] font-bold text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">Dynamic</span>
                                        )}
                                    </div>
                                </div>

                                {/* Entry */}
                                <div className="grid grid-cols-[100px_1fr_80px] border-b border-slate-800 items-center hover:bg-slate-900/30 transition-colors">
                                    <div className="px-4 py-3 font-bold text-slate-100">Entry</div>
                                    <div className="px-4 py-3 font-mono text-slate-300">
                                        {pendingTrade.entry.type === 'MARKET' ? (
                                            <span className="text-amber-500 font-bold">MARKET</span>
                                        ) : (
                                            <span>LIMIT</span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 text-right">
                                        {pendingTrade.entry.fixed ? (
                                            <span className="text-[10px] font-bold text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">Dynamic</span>
                                        )}
                                    </div>
                                </div>

                                {/* Risk Reward */}
                                <div className="grid grid-cols-[100px_1fr_80px] border-b border-slate-800 items-center hover:bg-slate-900/30 transition-colors">
                                    <div className="px-4 py-3 font-bold text-slate-100">Risk Reward</div>
                                    <div className="px-4 py-3 font-mono text-emerald-400 font-bold">
                                        {pendingTrade.riskReward.value.toFixed(2)} R
                                    </div>
                                    <div className="px-4 py-3 text-right">
                                        {pendingTrade.riskReward.fixed ? (
                                            <span className="text-[10px] font-bold text-slate-950 bg-emerald-500 px-1.5 py-0.5 rounded">FIX</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">Dynamic</span>
                                        )}
                                    </div>
                                </div>

                                {/* Take Profit */}
                                <div className="grid grid-cols-[100px_1fr_80px] items-center hover:bg-slate-900/30 transition-colors">
                                    <div className="px-4 py-3 font-bold text-emerald-500">Take Profit</div>
                                    <div className="px-4 py-3 font-mono text-slate-300">
                                        {pendingTrade.tp.anchor ? (
                                            <span className="flex items-center gap-2">
                                                <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 border border-slate-700">{pendingTrade.tp.anchor.timeframe}</span>
                                                <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 border border-slate-700 font-bold text-white">{pendingTrade.tp.anchor.type.toUpperCase()}</span>
                                                <span>{new Date(pendingTrade.tp.anchor.time * 1000).toISOString().substr(11, 5)}</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 italic opacity-50">&lt; leer &gt;</span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 text-right">
                                        {pendingTrade.tp.fixed ? (
                                            <span className="text-[10px] font-bold text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">Dynamic</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950/50 border-t border-slate-800 font-mono text-[10px] text-slate-600 whitespace-pre overflow-auto max-h-[200px]">
                                {JSON.stringify(pendingTrade, null, 2)}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex gap-3">
                            <button
                                onClick={() => setPendingTrade(null)}
                                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors border border-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmExecution}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Confirm Execution
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
});
