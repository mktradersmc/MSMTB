"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, LineSeries, TickMarkType, LogicalRange, CrosshairMode } from 'lightweight-charts';
import { getTimeframeSeconds } from '../../utils/chartUtils';
import { useChartTheme } from '../../context/ChartThemeContext';
import { LongShortPosition, LongShortState } from './LongShortPosition';
import { ChartWidget } from './widgets/ChartWidget';
import { LoadingOverlay } from './LoadingOverlay';
import { SymbolBrowser } from '../live/SymbolBrowser';
import { MagnetControl } from './MagnetControl';
import { MagnetService } from './widgets/MagnetService';
import { ChevronLeft, ChevronRight, Settings, Clock, ChevronsRight, CheckCircle2 } from 'lucide-react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { ContextMenu, ContextMenuItem } from './contextmenu/ContextMenu';
import { SettingsModal } from './settings/SettingsModal';
import { indicatorRegistry } from './indicators/IndicatorRegistry';
import { ICTSessionsPlugin } from './plugins/ICTSessionsPlugin';
import { useBrokerStore } from '../../stores/useBrokerStore';
import { TradeDistributionManager, ExecutionBatch } from '../../managers/TradeDistributionManager';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useTradeMonitor } from '../../hooks/useTradeMonitor';
import { TradeLogService } from '../../services/TradeLogService';



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
    isChartReady?: boolean;
    syncError?: string;
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
    horizonData = [], // Restored (Rollback)
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
    scrollToTimeRequest, // Destructure scrollToTimeRequest
    isChartReady = true, // Default to true for backward compatibility
    syncError
}, ref) => {
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const containerRefA = useRef<HTMLDivElement>(null);
    const containerRefB = useRef<HTMLDivElement>(null);

    const { theme } = useChartTheme();
    const { isTestMode, activeDrawingTool } = useWorkspaceStore();

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
    const seriesHorizonRef = useRef<ISeriesApi<"Line"> | null>(null);
    const chartWidgetRef = useRef<ChartWidget | null>(null);
    const currentMousePosRef = useRef<{ x: number, y: number } | null>(null);

    const indicatorPluginsRef = useRef<Map<string, any>>(new Map());

    // --- PROGRAMMATIC CROSSHAIR PERSISTENCE ---
    // Lightweight Charts natively clears programmatically set crosshairs when series.setData or series.update is called.
    // We store the last synced position to immediately re-apply it after a tick.
    const slaveCrosshairARef = useRef<{ price: number, time: number, active: boolean }>({ price: 0, time: 0, active: false });
    const slaveCrosshairBRef = useRef<{ price: number, time: number, active: boolean }>({ price: 0, time: 0, active: false });

    // --- INCREMENTAL UPDATE STATE ---
    const prevDataLengthRef = useRef(0);
    const prevStartTimeRef = useRef(0);
    const prevLastTimeRef = useRef(0);

    // ROBUSTNESS: Track the last known "History Focus" to survive empty data states (The Tunnel)
    const historyFocusRef = useRef<{ from: number, to: number } | null>(null);

    // LOOP PROTECTION: Flag to suppress event broadcasting during programmatic updates
    const isProgrammaticUpdate = useRef(false);

    // --- TRADE MANAGEMENT ---
    const { aggregatedTrades, modifyTrade } = useTradeMonitor();
    const activePositionIds = useRef<Set<string>>(new Set());

    // State for Widget Removal
    const [executionSourceId, setExecutionSourceId] = useState<string | null>(null);

    useEffect(() => {
        // Sync Active Trades to Chart
        if (!chartWidgetRef.current) return;

        const currentSymbol = symbol; // Use current symbol scope
        const activeForSymbol = aggregatedTrades.filter(t =>
            t.symbol === currentSymbol &&
            (t.status === 'RUNNING' || t.status === 'PENDING' || t.status === 'CREATED')
        );

        const activeIds = new Set<string>();
        const logs = TradeLogService.getLogs();

        activeForSymbol.forEach(trade => {
            activeIds.add(trade.tradeId);

            // 1. Get Concrete Levels from Log (Persistence)
            const logEntry = logs.find(l => l.id === trade.tradeId);

            // 2. Resolve Levels (Current Live > Local Log Fallback)
            const entryPrice = trade.avgEntry || logEntry?.initialEntry || 0;
            const slPrice = trade.avgSl || logEntry?.initialSL || 0;
            const tpPrice = trade.avgTp || logEntry?.initialTP || 0;

            // Extract the original execution entry price from DB matches or local log fallback
            const initialEntryPrice = trade.positions?.[0]?.initialEntry || logEntry?.initialEntry || trade.avgEntry || 0;

            // 3. Create/Update Tool
            // We use createShape with ID override. If it exists, it might duplicate or we rely on ChartWidget to handle?
            // ChartWidget.createShape always creates new. We need check if exists.
            const existing = chartWidgetRef.current?.getShapeById(trade.tradeId);

            if (!existing) {
                // Initial Creation
                chartWidgetRef.current?.createShape(
                    { time: Date.now() / 1000, price: entryPrice },
                    {
                        shape: 'ActivePosition',
                        overrides: {
                            id: trade.tradeId, // Force ID to match Trade ID
                            symbol: trade.symbol,
                            status: trade.status,
                            orderType: (trade as any).type,
                            direction: trade.direction === 'BUY' ? 'LONG' : 'SHORT',
                            entryPrice: entryPrice,
                            stopLossPrice: slPrice,
                            takeProfitPrice: tpPrice,
                            lineColor: '#2563EB', // Blue-600 for Entry (TradingView Style)
                            stopColor: 'rgba(239, 68, 68, 1)',
                            profitColor: 'rgba(16, 185, 129, 1)',
                            currentProfit: trade.unrealizedPl,
                            currency: 'USD', // Hardcoded or derive from symbol/account
                            volume: trade.volume || trade.size || 0, // Pass Volume
                            contractSize: 1, // Default to 1 (CFD/Crypto) or need to fetch from broker info
                            allSlAtBe: trade.allSlAtBe,
                            anySlAtBe: trade.anySlAtBe,
                            initialEntry: initialEntryPrice
                        }
                    }
                );
            } else {
                // Update existing
                const primitive = existing.getPrimitive();
                if (primitive && typeof (primitive as any).updateProfit === 'function') {
                    // Update State for generic properties
                    existing.setProperties({
                        status: trade.status,
                        orderType: (trade as any).type,
                        stopLossPrice: slPrice,
                        takeProfitPrice: tpPrice,
                        allSlAtBe: trade.allSlAtBe,
                        anySlAtBe: trade.anySlAtBe,
                        initialEntry: initialEntryPrice
                        // volume: trade.volume // If volume changes?
                    });

                    // Update Volume if missing in state
                    if ((primitive as any)._data && !(primitive as any)._data.volume) {
                        (primitive as any)._data.volume = trade.volume || trade.size || 0;
                    }

                    // Direct Profit Update
                    (primitive as any).updateProfit(trade.unrealizedPl);

                    // Dynamic UI Flags Update (Forces Re-draw of Handles)
                    if (typeof (primitive as any).updateFlags === 'function') {
                        (primitive as any).updateFlags({
                            allSlAtBe: trade.allSlAtBe,
                            anySlAtBe: trade.anySlAtBe
                        });
                    }
                }
            }
        });

        // 4. Cleanup Closed Trades
        activePositionIds.current.forEach(id => {
            if (!activeIds.has(id)) {
                chartWidgetRef.current?.removeEntity(id);
            }
        });

        activePositionIds.current = activeIds;

    }, [aggregatedTrades, symbol]); // Re-run when trades change or symbol changes

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
                    // LOOP PROTECTION: Lock for 20ms to cover async event dispatch
                    isProgrammaticUpdate.current = true;
                    // TRACE 0162
                    // console.log(`[ChartContainer:${paneId}] setLogicalRange Called. Anchor: ${range.anchorTime}, Offset: ${range.whitespaceOffset}`);

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
                        // REMOVED CLAMP: Allow full future scrolling to prevent sync fighting (Task 0162)
                        // TRACE 0162
                        if (range.whitespaceOffset !== undefined && range.whitespaceOffset > 0) {
                            // console.log(`[ChartContainer:${paneId}] SYNC-IN Apply Offset: ${range.whitespaceOffset}. BaseIdx: ${targetRightIndex} -> Target: ${targetRightIndex + range.whitespaceOffset}`);
                            targetRightIndex += range.whitespaceOffset;
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

                    // Release Lock after short delay
                    setTimeout(() => {
                        isProgrammaticUpdate.current = false;
                    }, 50);

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
    const [executionPlan, setExecutionPlan] = useState<ExecutionBatch[] | null>(null);
    const [isExecutingTrade, setIsExecutingTrade] = useState(false);
    const [executionSummary, setExecutionSummary] = useState<any[] | null>(null);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    // --- BROKER DATA FETCHING ---
    const { fetchBrokers, brokers } = useBrokerStore();

    useEffect(() => {
        fetchBrokers();
    }, []);

    // --- EXECUTION PLAN CALCULATION ---
    useEffect(() => {
        if (!pendingTrade) {
            setExecutionPlan(null);
            return;
        }

        let isMounted = true;
        const fetchPlan = async () => {
            console.log(`[ChartContainer] EFFECT TRIGGERED: fetchPlan initiated for trade ID ${pendingTrade?.id}`);
            try {
                const config = await TradeDistributionManager.getDistributionConfig();
                console.log(`[ChartContainer] Config fetched:`, config ? 'SUCCESS' : 'NULL');
                if (!isMounted) return;

                console.log(`[ChartContainer] Calling distributeTrade...`);
                // Note: The distributeTrade call SHOULD log its own output now.
                const batches = TradeDistributionManager.distributeTrade(
                    pendingTrade,
                    accounts,
                    brokers,
                    config,
                    isTestMode,
                    true // Preview Mode
                );
                console.log(`[ChartContainer] distributeTrade returned ${batches.length} batches.`);
                if (isMounted) setExecutionPlan(batches);
            } catch (e) {
                console.error("[ChartContainer] 🛑 Failed to calculate execution plan! Error:", e);
                if (isMounted) setExecutionPlan([]);
            }
        };

        fetchPlan();
        return () => { isMounted = false; };
    }, [pendingTrade, accounts, brokers, isTestMode]);

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





    useEffect(() => {
        if (timezone) setSelectedTimezone(timezone);
    }, [timezone]);

    // --- DATA TRANSFORMATION PIPELINE ---
    // Apply indicator-based overrides (e.g. Imbalance opacity/coloring)
    // We memoize this to prevent recalculation on every render unless data or indicators change.
    const processedData = React.useMemo(() => {
        let result = [...dataA];

        // ROBUSTNESS: Filter out invalid candles (nulls or missing fields)
        // This prevents "Assertion failed: value of open must be a number" crashes
        result = result.filter(c =>
            c &&
            typeof c.time === 'number' &&
            typeof c.open === 'number' &&
            typeof c.high === 'number' &&
            typeof c.low === 'number' &&
            typeof c.close === 'number'
        );

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
            const isHighTimeframe = typeof timeframe === 'string' && (timeframe.startsWith('D') || timeframe.startsWith('W') || timeframe.startsWith('MN'));

            chart.applyOptions({
                timeScale: {
                    timeVisible: !isHighTimeframe,
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
                                if (isHighTimeframe) return date.toLocaleDateString('en-US', { ...opts, day: 'numeric', month: 'short' });
                                return date.toLocaleTimeString('en-US', { ...opts, hour: '2-digit', minute: '2-digit', hour12: false });
                            case TickMarkType.TimeWithSeconds:
                                if (isHighTimeframe) return date.toLocaleDateString('en-US', { ...opts, day: 'numeric', month: 'short' });
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
                        const isHighTimeframe = typeof timeframe === 'string' && (timeframe.startsWith('D') || timeframe.startsWith('W') || timeframe.startsWith('MN'));

                        if (isHighTimeframe) {
                            return date.toLocaleDateString('en-US', {
                                timeZone: selectedTimezone,
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });
                        }

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
                vertLine: {
                    color: '#000000',
                    labelBackgroundColor: '#000000',
                },
                horzLine: {
                    color: '#000000',
                    labelBackgroundColor: '#000000',
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                ticksVisible: true,
                borderColor: theme.timeScale.borderColor,
                rightOffset: 20, // Phantom Bars handle the rest
                barSpacing: 10,
                minBarSpacing: 4,
                shiftVisibleRangeOnNewBar: false,
                fixLeftEdge: false,
                fixRightEdge: false, // Allow scrolling into future
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

        // REACTIVE PRECISION UPDATE
        // When 'precision' prop changes, we must force the series to update.
        // We can't rely on recreating the chart, so we use applyOptions.
        // Ideally we would do this in a separate useEffect, but 'seriesA' is local here.
        // Since we are recreating the chart every time 'height' or 'theme' changes, this might be enough if 'precision' triggers remount.
        // CHECK: dependency array of this useEffect? -> currently only on mount + height + theme. layout has no 'precision' dep.
        // FIX: We need a SEPARATE useEffect to handle precision updates reactively without recreating the chart.


        // --- HORIZON SERIES (Phantom Future) ---
        // ROLLBACK: Restored for stability. Used for visual "Future" without breaking auto-scale.
        const seriesHorizon = chartA.addSeries(LineSeries, {
            color: 'transparent', // Invisible
            lineWidth: 1,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false
        });
        seriesHorizonRef.current = seriesHorizon;

        // Dynamic Scroll Removed in favor of Phantom Bars logic


        // Subscribe to Click for Activation and Drawing
        chartA.subscribeClick((param) => {
            if (onChartClick) onChartClick();

            // Handle drawing mode placement
            const store = useWorkspaceStore.getState();
            if (store.activeDrawingTool && chartWidgetRef.current) {
                chartWidgetRef.current.handleChartClick(
                    param,
                    store.activeDrawingTool,
                    () => store.setActiveDrawingTool(null)
                );
            }
        });

        // Track if we have manually overridden the crosshair
        let isCrosshairOverridden = false;

        chartA.subscribeCrosshairMove((param) => {
            // Ignore synthetic crosshair movements triggered by programmatic snapping
            if (!param.sourceEvent) return;

            if (chartWidgetRef.current) {
                chartWidgetRef.current.handleCrosshairMove(param);
            }

            // Manual Crosshair Snapping for Custom Drawing Tools
            const store = useWorkspaceStore.getState();
            const magnetMode = MagnetService.getMode();

            if (store.activeDrawingTool && magnetMode !== 'OFF' && param.point && param.time) {
                const snapped = MagnetService.snap(
                    param.point.x,
                    param.point.y,
                    seriesARef.current!,
                    dataARef.current,
                    chartARef.current!.timeScale(),
                    timeframe
                );

                if (snapped.snapped && snapped.anchor) {
                    chartA.setCrosshairPosition(snapped.anchor.price, snapped.anchor.time as Time, seriesARef.current!);
                    isCrosshairOverridden = true;
                } else if (isCrosshairOverridden) {
                    chartA.clearCrosshairPosition();
                    isCrosshairOverridden = false;
                }
            } else if (isCrosshairOverridden) {
                // Only clear if we were previously overriding it due to snapping.
                // However, clearCrosshairPosition() completely removes the crosshair until the next mouse move.
                // If it's a real mouse move, the chart normally redraws it automatically.
                // BUT if this executes during a synthetic or slightly delayed frame, it might hide it.
                // Let's rely on native Lightweight Charts behavior for standard cursor mode by NOT manually clearing
                // unless we explicitly need to dismiss a programmatic lock.
                chartA.clearCrosshairPosition();
                isCrosshairOverridden = false;
            }
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
            if (params.id) {
                setExecutionSourceId(params.id);
            }
        });

        // Subscribe to active trade interactions (SL_BE, CLOSE_PARTIAL)
        widget.subscribe('trade_action' as any, async (params: any) => {
            console.log("[ChartContainer] Active Trade Action:", params);
            if (params.tradeId && params.action) {
                // Visual UX Feedback for Trade Actions (to prevent double-clicks)
                let msg = `${params.action} submitted`;
                if (params.action === 'CLOSE') msg = `100% Close submitted`;
                else if (params.action === 'CLOSE_PARTIAL') msg = `${params.payload || 0}% Close submitted`;
                else if (params.action === 'SL_BE') msg = `SL to Break-Even submitted`;

                setActionFeedback(msg);
                setTimeout(() => setActionFeedback(null), 3000);

                await modifyTrade({
                    action: params.action,
                    tradeId: params.tradeId,
                    percent: params.payload
                });
            }
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

            // Crosshair Sync - STRICT MASTER/SLAVE PATTERN
            let activeChartId: 'A' | 'B' | null = null;

            const syncCrosshair = (
                sourceChart: IChartApi,
                targetChart: IChartApi,
                targetSeries: ISeriesApi<"Candlestick"> | null,
                sourceSeries: ISeriesApi<"Candlestick"> | null,
                sourceId: 'A' | 'B'
            ) => {
                sourceChart.subscribeCrosshairMove((param) => {
                    // Update active chart based on raw mouse input.
                    // If sourceEvent is present, the mouse is actively on THIS chart.
                    if (param.sourceEvent) {
                        activeChartId = sourceId;
                        // Determine which crosshair is native vs programmatic
                        if (sourceId === 'A') slaveCrosshairARef.current.active = false;
                        else slaveCrosshairBRef.current.active = false;
                    }

                    // Strict Rule: If this chart is NOT the active leading chart,
                    // it is strictly forbidden from broadcasting crosshair events.
                    if (activeChartId !== sourceId) {
                        return;
                    }

                    if (!targetSeries || !sourceSeries) return;

                    try {
                        if (param.time && param.point) {
                            // Proportional Height Mapping
                            // If Chart A and Chart B have different physical pixel heights, sending the raw Y-coordinate
                            // from Chart A to Chart B will result in an out-of-bounds coordinate, causing the line to vanish.
                            const domA = containerRefA.current;
                            const domB = containerRefB.current;

                            if (domA && domB) {
                                const sourceHeight = sourceId === 'A' ? domA.clientHeight : domB.clientHeight;
                                const targetHeight = sourceId === 'A' ? domB.clientHeight : domA.clientHeight;

                                // Data-Driven Snapping vs Proportional Mapping
                                const targetData = param.seriesData.get(targetSeries) as any;
                                let finalPrice: number | null = null;

                                // 1. Real Data (Candles/Indicators) -> Snap to exact data value to prevent LWC native crash
                                if (targetData) {
                                    if (targetData.value !== undefined) {
                                        finalPrice = targetData.value;
                                    } else if (targetData.close !== undefined) {
                                        finalPrice = targetData.close;
                                    }
                                }

                                // 2. Ghost Area -> Fallback to proportional pixel mapping
                                if (finalPrice === null) {
                                    const yRatio = sourceHeight > 0 ? param.point.y / sourceHeight : 0;
                                    const mappedY = yRatio * targetHeight;
                                    finalPrice = targetSeries.coordinateToPrice(mappedY);
                                }

                                if (finalPrice !== null) {
                                    targetChart.setCrosshairPosition(finalPrice, param.time, targetSeries);

                                    // Save state for persistence across ticks
                                    const targetRef = sourceId === 'A' ? slaveCrosshairBRef : slaveCrosshairARef;
                                    targetRef.current = { price: finalPrice, time: param.time as number, active: true };
                                }
                            }
                        } else {
                            // Only clear explicitly if we leave the chart canvas completely
                            targetChart.clearCrosshairPosition();
                            const targetRef = sourceId === 'A' ? slaveCrosshairBRef : slaveCrosshairARef;
                            targetRef.current.active = false;
                        }
                    } catch (e) { /* Silent */ }
                });
            };

            syncCrosshair(chartA, chartB, seriesB, seriesA, 'A');
            syncCrosshair(chartB, chartA, seriesA, seriesB, 'B'); // Chart A always has series
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
                // console.log(`[ChartContainer:${paneId}] Skipping emit (programmatic lock active)`);
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

                        // TRACE 0162
                        if (Math.abs(whitespaceOffset) > 1 || (range.to as number) > data.length) {
                            console.log(`[ChartContainer:${paneId}] Emit LogicalRange. To: ${(range.to as number).toFixed(2)}, Offset: ${whitespaceOffset.toFixed(2)}, Anchor: ${anchorTime}`);
                        }

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
    const handleScrollToRealTime = () => {
        if (!chartARef.current || dataARef.current.length === 0) return;

        const dataA = dataARef.current;

        // STRICT REALTIME CLAMP: Ignore future bars in calculation
        const nowSec = Math.floor(Date.now() / 1000) + getTimeframeSeconds(timeframe); // Tolerance 1 bar
        let lastRealIndex = dataA.length - 1;

        // Scan backward to find last REAL candle
        for (let i = dataA.length - 1; i >= 0; i--) {
            if (dataA[i].time <= nowSec) {
                lastRealIndex = i;
                break;
            }
        }

        // We use the calculated index. Future logic is explicitly disabled.
        // User Requirement: "ensure automatic repositioning never jumps beyond current candle"
        const additionalBars = 0;

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

    // --- HORIZON DATA SYNC ---
    // ROLLBACK: Feed the phantom bars to the invisible series
    useEffect(() => {
        if (seriesHorizonRef.current && horizonData.length > 0) {
            seriesHorizonRef.current.setData(horizonData);
        }
    }, [horizonData]);

    // Dynamic Scroll Logic Removed (Was causing jumps)




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

                            // THRESHOLD: If we are within 5 bars of the "Latest Data" OR in the future (negative), consider it Realtime Mode.
                            // Infinite Scroll Support: Allow arbitrary negative offset (Future).
                            const isAtRealtimeEdge = distFromEdge < 5;

                            if (isAtRealtimeEdge) {
                                viewStateRef.current = {
                                    type: 'LIVE_EDGE',
                                    savedBarCount: barCount,
                                    savedRightOffset: distFromEdge,
                                    savedRightTime: null,
                                    savedRange: null
                                };
                                // console.log(`[ChartContainer] Capturing LIVE_EDGE Viewport. Offset: ${distFromEdge.toFixed(2)}`);
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
                    const newLastTime = processedData[processedData.length - 1].time as number;

                    // Allow strictly 0 (update last) or 1 (new tick)
                    // GUARD: Ensure we never try to update with PAST data (Time Reversion) which crashes LWC
                    const isTickUpdate = lenDiff === 0 && newLastTime === prevLastTimeRef.current;
                    const isNewBar = lenDiff > 0 && lenDiff <= 2 && newLastTime > prevLastTimeRef.current;

                    if (isTickUpdate || isNewBar) {
                        try {
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

                            // Restore Programmatic Crosshair if active on Chart A
                            if (slaveCrosshairARef.current.active && chartARef.current) {
                                chartARef.current.setCrosshairPosition(
                                    slaveCrosshairARef.current.price,
                                    slaveCrosshairARef.current.time as any,
                                    seriesARef.current
                                );
                            }

                            appliedIncremental = true;
                            // console.log(`[ChartContainer:Diagnose] Incremental Tick Applied. Last: ${lastCandle.time}`);
                        } catch (e) {
                            console.warn("[ChartContainer] Incremental update failed, falling back to setData", e);
                            appliedIncremental = false;
                        }
                    } else {
                        // console.log(`[ChartContainer:Diagnose] Incremental skipped. LenDiff: ${lenDiff}, NewLast: ${newLastTime}, PrevLast: ${prevLastTimeRef.current}`);
                    }
                }
            }

            if (!appliedIncremental) {
                // console.log(`[ChartContainer:Diagnose] FALLBACK TO SETDATA. Len: ${processedData.length}`);
                seriesARef.current.setData(processedData);

                // Restore Programmatic Crosshair if active on Chart A
                if (slaveCrosshairARef.current.active && chartARef.current) {
                    chartARef.current.setCrosshairPosition(
                        slaveCrosshairARef.current.price,
                        slaveCrosshairARef.current.time as any,
                        seriesARef.current
                    );
                }
            }

            if (processedData.length > 0) {
                prevDataLengthRef.current = processedData.length;
                prevStartTimeRef.current = processedData[0].time as number;
                prevLastTimeRef.current = processedData[processedData.length - 1].time as number;
                // Critical: Update dataARef for other effects (Dynamic Scroll)
                dataARef.current = processedData;
            } else {
                prevDataLengthRef.current = 0;
                prevStartTimeRef.current = 0;
                prevLastTimeRef.current = 0;
                dataARef.current = [];
            }

            // Sync with ChartWidget for Magnet/Drawing
            if (chartWidgetRef.current) {
                chartWidgetRef.current.setSeriesData(processedData);
            }

            // 4. Restore State
            if (processedData.length > 0 && !appliedIncremental) { // Update logic preserves state, so only restore on setData
                // console.log(`[ChartContainer:Diagnose] Restore State Triggered. Type: ${viewStateRef.current.type}`);
                if (!hasFittedARef.current) {
                    // Start with explicit "Last 150 Bars" view instead of fitContent (which zooms out too much/erratically with large offsets)
                    if (chartARef.current && processedData.length > 0) {
                        const lastIdx = processedData.length - 1;
                        const visibleCount = 150; // Standard startup zoom

                        // Set range to: [End - 150, End + 10]
                        // We add +10 margin. The 1000 bar rightOffset is handled by LWC as margin BEYOND this logical range? 
                        // Actually, rightOffset shifts the coordinate system.
                        // Let's just set the logical range indices.
                        chartARef.current.timeScale().setVisibleLogicalRange({
                            from: lastIdx - visibleCount,
                            to: lastIdx + 5 // Small buffer past data end
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
    }, [processedData, timeframe]);

    useEffect(() => {
        if (seriesBRef.current && dataB.length > 0 && !isSingleMode) {
            seriesBRef.current.setData(dataB);

            // Restore Programmatic Crosshair if active on Chart B
            if (slaveCrosshairBRef.current.active && chartBRef.current) {
                chartBRef.current.setCrosshairPosition(
                    slaveCrosshairBRef.current.price,
                    slaveCrosshairBRef.current.time as any,
                    seriesBRef.current
                );
            }

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
            if (pluginAsAny && pluginAsAny.updateCurrentTime && dataARef.current.length > 0) {
                const latestTime = dataARef.current[dataARef.current.length - 1].time;
                pluginAsAny.updateCurrentTime(latestTime);
            }
            // NEW: Push Full Data to Plugin (for Client-Side Calculation)
            if (pluginAsAny && pluginAsAny.updateData) {
                pluginAsAny.updateData(dataARef.current);
            }
            // NEW: Push Live Candle Update explicitly
            if (pluginAsAny && pluginAsAny.updateLiveCandle && dataARef.current.length > 0) {
                const latestCandle = dataARef.current[dataARef.current.length - 1];
                pluginAsAny.updateLiveCandle(latestCandle);
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
                    const currentDataA = dataARef.current;
                    const fromTime = currentDataA.length > 0 ? currentDataA[0].time : Math.floor(Date.now() / 1000) - 86400 * 30;
                    const toTime = currentDataA.length > 0 ? currentDataA[currentDataA.length - 1].time : Math.floor(Date.now() / 1000);

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

    }, [activeIndicators, symbol, timeframe, chartReady]);

    // --- PUSH DATA TO PLUGINS ON TICK ---
    useEffect(() => {
        if (!chartReady || dataA.length === 0) return;
        const plugins = indicatorPluginsRef.current;
        const latestCandle = dataA[dataA.length - 1];
        const latestTime = latestCandle.time;

        plugins.forEach((plugin) => {
            const pluginAsAny = plugin as any;
            if (pluginAsAny.updateCurrentTime) {
                pluginAsAny.updateCurrentTime(latestTime);
            }
            if (pluginAsAny.updateData) {
                pluginAsAny.updateData(dataA);
            }
            if (pluginAsAny.updateLiveCandle) {
                pluginAsAny.updateLiveCandle(latestCandle);
            }
        });
    }, [dataA, chartReady]);

    // Cleanup Plugins on Unmount
    useEffect(() => {
        return () => {
            const plugins = indicatorPluginsRef.current;
            for (const [id, plugin] of plugins.entries()) {
                if (seriesARef.current) {
                    try {
                        seriesARef.current.detachPrimitive(plugin);
                    } catch (e) { /* ignore */ }
                }
            }
            plugins.clear();
        };
    }, []);



    // Cleanup Charts on Unmount
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
                    vertLine: {
                        color: '#000000',
                        labelBackgroundColor: '#000000',
                    },
                    horzLine: {
                        color: '#000000',
                        labelBackgroundColor: '#000000',
                    },
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
                    // priceFormat: handled in separate effect
                });
            }
        };

        applyThemeToChart(chartARef.current, seriesARef.current);
        applyThemeToChart(chartBRef.current, seriesBRef.current);

    }, [theme]);

    // --- SEPARATE EFFECT: PRECISION ---
    useEffect(() => {
        if (!seriesARef.current || !chartARef.current) return;

        // Use safe math
        const power = Math.pow(10, precision);
        const minMove = 1 / power;
        console.log(`[ChartContainer] Applying Precision: ${precision} (minMove: ${minMove}) for symbol: ${symbol}`);

        // Update Series Options
        seriesARef.current.applyOptions({
            priceFormat: { type: 'price', precision: precision, minMove: minMove },
        });

        if (seriesBRef.current) {
            seriesBRef.current.applyOptions({
                priceFormat: { type: 'price', precision: precision, minMove: minMove },
            });
        }

        // Force Right Price Scale to visually redraw by toggling autoScale temporarily if needed, 
        // or just applyOptions on the price scale.
        // LightweightCharts often needs scale options reapplied to force a re-render of the tick math.
        const currentOptions = chartARef.current.priceScale('right').options();
        chartARef.current.priceScale('right').applyOptions({
            autoScale: currentOptions.autoScale // Re-applying the same value often triggers the internal format recalculation
        });

    }, [precision, symbol, chartReady]); // ADDED SYMBOL DEPENDENCY

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
                rr: true
            }
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



    // ... (rest of the file until handleConfirmExecution)

    const handleConfirmExecution = async () => {
        if (!pendingTrade) return;

        // 1. IMMEDIATE FEEDBACK: Start Loading & Close Dialog
        setIsExecutingTrade(true);
        const tradeToExecute = pendingTrade;
        setPendingTrade(null);
        setExecutionPlan(null); // Clear preview state

        // Remove the Widget immediately (User Request)
        if (executionSourceId && chartWidgetRef.current) {
            try {
                chartWidgetRef.current.removeEntity(executionSourceId);
                setExecutionSourceId(null);
            } catch (e) {
                console.warn("Failed to remove execution widget", e);
            }
        }

        try {
            console.log("[Chart] Preparing Final Execution for:", tradeToExecute);

            // 2. Get Distribution Config again (to be safe)
            const config = await TradeDistributionManager.getDistributionConfig();

            // 3. Calculate Batches (Not Preview Mode -> Commits Rotation Counter)
            const batches = TradeDistributionManager.distributeTrade(
                tradeToExecute,
                accounts,
                brokers,
                config,
                isTestMode,
                false // Commit Mode
            );

            console.log("--- DEBUG: FINAL DISTRIBUTION PLAN ---");
            console.log(batches);

            if (batches.length === 0) {
                alert("No target accounts found for distribution!");
                return;
            }

            // 4. EXECUTE TRADES (Send to Backend)
            await Promise.all(batches.map(async (batch) => {
                try {
                    const res = await fetch('/api/distribution/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(batch)
                    });

                    if (res.ok) {
                        const result = await res.json();
                        console.log(`[ChartContainer] Batch for ${batch.brokerId} executed:`, result);
                        return { status: 'success', brokerId: batch.brokerId, accounts: batch.accounts, details: result };
                    } else {
                        console.error(`[ChartContainer] Batch execution failed for ${batch.brokerId}: ${res.statusText}`);
                        return { status: 'error', brokerId: batch.brokerId, accounts: batch.accounts, error: res.statusText };
                    }
                } catch (e: any) {
                    console.error(`[ChartContainer] Batch Network Error`, e);
                    return { status: 'error', brokerId: batch.brokerId, accounts: batch.accounts, error: e.message };
                }
            }));

            // SKIP SUMMARY DIALOG (User Request)
            // setExecutionSummary(results);

        } catch (e) {
            console.error("[ChartContainer] Execution Error", e);
            alert("Failed to prepare or execute trades.");
        } finally {
            setIsExecutingTrade(false);
        }
    };

    return (
        <div ref={mainContainerRef} className="flex flex-col bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 overflow-hidden w-full relative" style={{ height: typeof height === 'number' ? height : '100%' }}>
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
                                className="bg-white dark:bg-[#2a2e39] hover:bg-slate-100 dark:hover:bg-[#363a45] text-slate-600 dark:text-[#b2b5be] hover:text-slate-900 dark:hover:text-white rounded w-[26px] h-[26px] flex items-center justify-center shadow-md transition-all border border-slate-300 dark:border-[#2a2e39]"
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
                    className={`w-full relative min-h-0 bg-slate-50 dark:bg-slate-900/10 ${isSingleMode ? 'flex-1' : 'flex-1'}`}
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
                                ? 'bg-slate-950 dark:bg-slate-950 text-white border-slate-950 dark:border-slate-950 hover:bg-slate-800' // Active: Black button
                                : 'bg-white text-black border-slate-300 hover:bg-slate-100'     // Inactive: White button
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
                        <div className="h-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 mx-4" />
                        {/* Chart B Header */}
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-t border-slate-200 dark:border-slate-800 flex justify-between items-center h-[40px] shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="font-bold text-indigo-300 tracking-tight">{symbolB}</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest">Correlation</span>
                        </div>
                        {/* Chart B Wrapper */}
                        <div className="w-full relative flex-1 min-h-0 bg-slate-50 dark:bg-slate-900/10">
                            <div ref={containerRefB} className="absolute inset-0" />
                        </div>
                    </>
                )}

                {/* No Data Overlay */}
                {!isLoading && dataA.length === 0 && (
                    <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none select-none">
                        <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                            <span className="text-slate-300 dark:text-slate-700 font-bold text-2xl tracking-widest uppercase">
                                No Data Available
                            </span>
                            <span className="text-slate-400 dark:text-slate-600 text-xs font-mono opacity-50">
                                {symbol} • {timeframe}
                            </span>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {/* Loading Overlay (Strict Consistency Lock) */}
                {/* Loading Overlay (Modified: Only block if < 100 candles) */}
                <LoadingOverlay isVisible={isLoading} error={syncError} />
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
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className={pendingTrade.direction === 'LONG' ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}>
                                    {pendingTrade.direction === 'LONG' ? "Long" : "Short"} {pendingTrade.orderType}
                                </span>
                                <span className="text-slate-500 font-normal text-sm">Execution Plan</span>
                            </h3>
                            <button onClick={() => setPendingTrade(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <ChevronRight className="rotate-90" size={20} />
                            </button>
                        </div>

                        <div className="p-0 overflow-hidden">
                            {/* Execution Plan Table */}
                            <div className="w-full text-sm text-left border-b border-slate-200 dark:border-slate-800">
                                <div className="grid grid-cols-[100px_1fr_1fr_80px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                    <div className="px-6 py-2">Status</div>
                                    <div className="px-4 py-2">Broker</div>
                                    <div className="px-4 py-2">Account</div>
                                    <div className="px-6 py-2 text-right">Risk %</div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {!executionPlan ? (
                                        <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                                            Calculating execution plan...
                                        </div>
                                    ) : executionPlan.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-rose-500 dark:text-rose-400 text-sm font-bold">
                                            No target accounts available. Check your distribution settings.
                                        </div>
                                    ) : (
                                        executionPlan.flatMap((batch, batchIndex) =>
                                            batch.accounts.map((acc, accIndex) => {
                                                const isOnline = acc.status === 'RUNNING' || acc.isConnected;
                                                const riskPercent = acc.config?.risk?.percent || acc.riskPercent; // depending on structure

                                                return (
                                                    <div key={`${batch.brokerId}-${acc.id}`} className="grid grid-cols-[100px_1fr_1fr_80px] border-b border-slate-100 dark:border-slate-800/50 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors last:border-0">
                                                        <div className="px-6 py-3 shrink-0 flex items-center">
                                                            {isOnline ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></span>
                                                                    ONLINE
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                                    OFFLINE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                            {brokers.find(b => b.id === batch.brokerId)?.name || batch.brokerId}
                                                        </div>
                                                        <div className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 truncate">
                                                            {acc.login || acc.name || acc.id}
                                                        </div>
                                                        <div className="px-6 py-3 text-right">
                                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                                                {riskPercent !== undefined ? `${riskPercent.toFixed(1)}%` : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Expandable Advanced Details */}
                            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <details className="group">
                                    <summary className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer list-none flex items-center gap-2">
                                        <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                                        Advanced Details
                                    </summary>
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 shadow-inner">
                                        <div className="grid grid-cols-[100px_1fr_80px] text-xs items-center">
                                            <div className="font-bold text-rose-600 dark:text-rose-500">Stop Loss</div>
                                            <div className="font-mono text-slate-700 dark:text-slate-300">
                                                {pendingTrade.sl.anchor ? `${pendingTrade.sl.anchor.type.toUpperCase()}` : <span className="italic opacity-50">Price-based</span>}
                                            </div>
                                            <div className="text-right">{pendingTrade.sl.fixed ? <span className="text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span> : <span className="text-[10px] text-slate-500">Dyn</span>}</div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr_80px] text-xs items-center">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">Entry</div>
                                            <div className="font-mono text-slate-700 dark:text-slate-300">{pendingTrade.entry.type}</div>
                                            <div className="text-right">{pendingTrade.entry.fixed ? <span className="text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span> : <span className="text-[10px] text-slate-500">Dyn</span>}</div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr_80px] text-xs items-center">
                                            <div className="font-bold text-emerald-600 dark:text-emerald-500">Take Profit</div>
                                            <div className="font-mono text-slate-700 dark:text-slate-300">
                                                {pendingTrade.tp.anchor ? `${pendingTrade.tp.anchor.type.toUpperCase()}` : <span className="italic opacity-50">Price-based</span>}
                                            </div>
                                            <div className="text-right">{pendingTrade.tp.fixed ? <span className="text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded">FIX</span> : <span className="text-[10px] text-slate-500">Dyn</span>}</div>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr_80px] text-xs items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">Risk Reward</div>
                                            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pendingTrade.riskReward.value.toFixed(2)} R</div>
                                            <div className="text-right">{pendingTrade.riskReward.fixed ? <span className="text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-emerald-500 px-1.5 py-0.5 rounded">FIX</span> : <span className="text-[10px] text-slate-500">Dyn</span>}</div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setPendingTrade(null)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmExecution}
                                disabled={!executionPlan || executionPlan.length === 0}
                                className="flex-[2] px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                Execute Setups
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Action Feedback Toast --- */}
            {actionFeedback && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                    <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-10 h-10 mb-1" strokeWidth={2.5} />
                        <span className="text-white font-bold text-lg tracking-wide">{actionFeedback}</span>
                    </div>
                </div>
            )}

            {/* --- Trade Execution Loading Overlay --- */}
            {isExecutingTrade && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900/90 p-8 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-widest text-shadow-glow">EXECUTING TRADES</span>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Please wait...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Execution Summary Dialog --- */}
            {executionSummary && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className={executionSummary.some(r => r.status === 'error') ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500"}>
                                    Execution Report
                                </span>
                            </h3>
                            <button onClick={() => setExecutionSummary(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <ChevronRight className="rotate-90" size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            <div className="grid grid-cols-[120px_1fr_100px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                <div className="px-4 py-2">Account</div>
                                <div className="px-4 py-2">Details</div>
                                <div className="px-4 py-2 text-right">Status</div>
                            </div>

                            {executionSummary.flatMap((batch, batchIdx) =>
                                batch.accounts.map((acc: any, accIdx: number) => (
                                    <div key={`${batchIdx}-${accIdx}`} className="grid grid-cols-[120px_1fr_100px] border-b border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors py-2 text-sm">
                                        <div className="px-4 font-mono text-slate-700 dark:text-slate-300 font-bold truncate" title={acc.login || acc.id}>
                                            {acc.login || acc.id}
                                        </div>
                                        <div className="px-4 text-xs text-slate-500 dark:text-slate-400">
                                            {batch.brokerId}
                                            {batch.details && (
                                                <div className="text-[10px] text-slate-600 mt-1 truncate">
                                                    {JSON.stringify(batch.details.message || batch.details)}
                                                </div>
                                            )}
                                            {batch.error && (
                                                <div className="text-[10px] text-rose-500 mt-1 truncate font-bold">
                                                    {batch.error}
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 text-right">
                                            {batch.status === 'success' ? (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">SENT</span>
                                            ) : (
                                                <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">FAILED</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setExecutionSummary(null)}
                                className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
});
