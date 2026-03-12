import { useState, useEffect, useRef, useCallback } from 'react';
import { MT5Datafeed } from '../services/MT5Datafeed';
import { generatePhantomBars, getTimeframeSeconds } from '../utils/chartUtils';
import { fetchMessages } from '../services/api';
import { getBaseUrl } from '../lib/client-api';

export interface ChartDataHookOptions {
    symbol: string;
    timeframe: string;
    botId: string;
    isActivePane: boolean; // For smart streaming
    backtestId?: string;
    onTick?: (candle: any) => void;
}

export function useChartData({ symbol, timeframe, botId, isActivePane, backtestId, onTick }: ChartDataHookOptions) {
    const [data, setData] = useState<any[]>([]);
    const [horizonData, setHorizonData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false); // For backlog filling

    const [isChartReady, setIsChartReady] = useState(false);
    const [syncError, setSyncError] = useState<string | undefined>(undefined);
    const [syncStatus, setSyncStatus] = useState<string>('READY');
    const [dataVersion, setDataVersion] = useState(0);

    // Refs
    const lastCandleRef = useRef<any>(null);
    const datafeedRef = useRef<MT5Datafeed | null>(null);
    const symbolRef = useRef(symbol);
    const tfRef = useRef(timeframe);
    const isLoadingRef = useRef(false);
    const historyLoadedRef = useRef(false);

    // Sync Refs & Clear Data for Instant Feedback
    useEffect(() => {
        symbolRef.current = symbol;
        tfRef.current = timeframe;
        // INSTANT CLEAR: Immediately clear data so the UI reflects the switch
        setData([]);
        setHorizonData([]); // Clear phantom bars
        // RESET LOADING: Allow new fetch to proceed even if previous one was running
        setIsLoading(false);
        isLoadingRef.current = false;
        historyLoadedRef.current = false;

        // RESET LAST CANDLE: Prevent ghost candles from previous timeframe/symbol
        lastCandleRef.current = null;

        // RESET LOCK STATE
        setIsChartReady(false);
        setSyncError(undefined);
    }, [symbol, timeframe]);

    // Initialize Datafeed Adapter
    useEffect(() => {
        console.log(`[!!! ALARM-FLOW-FRONTEND 5.1 - useChartData] Init Datafeed with botId = ${botId}, backtestId = ${backtestId}`);
        if (!datafeedRef.current) {
            datafeedRef.current = new MT5Datafeed(botId, backtestId);
        } else {
            datafeedRef.current.setBotId(botId, backtestId);
        }
    }, [botId, backtestId]);

    // Helper: Fetch History (Progressive / Chunked)
    const fetchHistory = async (isMerge: boolean = false) => {
        if (!symbol || !botId) return;

        // Removed concurrent fetch blocker to support multi-chart sync

        try {
            if (!isMerge) {
                setIsLoading(true);
                isLoadingRef.current = true;
            }

            const targetTotal = 10000; // Goal: 10k bars

            // 1. Initial Fetch (Latest from local DB)
            const effectiveBotId = backtestId ? 'PAPER_BOT' : botId;
            const routingKey = effectiveBotId ? `${effectiveBotId}:HISTORY:${symbol}` : symbol;

            console.log(`[!!! ALARM-FLOW-FRONTEND 5.2 - fetchHistory] botId = ${effectiveBotId}, RoutingKey = ${routingKey}, limit = ${targetTotal}`);
            let url = `${getBaseUrl()}/api/history?routingKey=${routingKey}&timeframe=${timeframe}&limit=${targetTotal}&format=binary&_=${Date.now()}`;
            if (backtestId) url += `&backtestId=${backtestId}`;

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

            let res = await fetch(url, { headers });
            
            let gatheredBars: any[] = [];
            const contentType = res.headers.get('content-type') || '';
            const isPartial = res.headers.get('X-Sync-Partial') === 'true';
            
            if (contentType.includes('application/octet-stream')) {
                const buffer = await res.arrayBuffer();
                const view = new DataView(buffer);
                const bytes = buffer.byteLength;
                const candleCount = Math.floor(bytes / 48);
                
                // console.log(`[useChartData] ⚡ Binary Decode: ${bytes} bytes -> ${candleCount} bars.`);
                
                for (let i = 0; i < candleCount; i++) {
                    const offset = i * 48;
                    // MQL5 / Node SQLite chunks are written in Little-Endian
                    let t = Number(view.getBigInt64(offset, true));
                    if (t > 100000000000) t = t / 1000;
                    
                    gatheredBars.push({
                        time: t,
                        open: view.getFloat64(offset + 8, true),
                        high: view.getFloat64(offset + 16, true),
                        low: view.getFloat64(offset + 24, true),
                        close: view.getFloat64(offset + 32, true),
                        volume: Number(view.getBigInt64(offset + 40, true)) || 0
                    });
                }
                
                // Candles arrive in time DESC order from backend DB query. Sort ASC for chart.
                gatheredBars.sort((a, b) => a.time - b.time);
                
            } else {
                let response = await res.json();

                if (!response.success || !response.candles) {
                    console.warn("[useChartData] Initial fetch failed or empty.");
                    setIsLoading(false);
                    isLoadingRef.current = false;
                    return;
                }

                gatheredBars = response.candles.map((c: any) => {
                    let t = Number(c.time);
                    if (t > 100000000000) t = t / 1000;
                    return {
                        time: t,
                        open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0
                    };
                }).sort((a: any, b: any) => a.time - b.time);
            }

            // Set Initial Data or Merge
            if (gatheredBars.length > 0) {
                // STALENESS CHECK
                if (symbolRef.current !== symbol || tfRef.current !== timeframe) {
                    console.log(`[useChartData] ⚠️ Initial fetch discarded for ${symbol} ${timeframe}`);
                    return;
                }

                setData(prevData => {
                    let newData = [...gatheredBars];

                    // MERGE LIVE CANDLE (Fix for Initial Fetch Flicker)
                    // In LIVE mode, the websocket is the authority. 
                    // In BACKTEST mode, the history fetch IS the authority (progresses on step). We must not overwrite it.
                    if (!backtestId) {
                        const liveCandle = lastCandleRef.current;
                        if (liveCandle) {
                            const lastFetched = newData[newData.length - 1];
                            if (!lastFetched || lastFetched.time < liveCandle.time) {
                                newData.push({ ...liveCandle });
                            } else if (lastFetched.time === liveCandle.time) {
                                newData[newData.length - 1] = { ...liveCandle };
                            }
                        }
                    }

                    if (isMerge && prevData.length > 0) {
                        // SMART MERGE: Integrate new chunk into existing data functionally
                        console.log(`[useChartData] 🧬 Smart Merge: Integrating ${newData.length} bars...`);
                        
                        const firstNewTime = newData[0].time;
                        const lastNewTime = newData[newData.length - 1].time;

                        const nonOverlappingOld = prevData.filter(d => d.time < firstNewTime);
                        const nonOverlappingNew = prevData.filter(d => d.time > lastNewTime);

                        newData = [...nonOverlappingOld, ...newData, ...nonOverlappingNew];
                    }

                    // Update Horizon and Last Candle Source of Truth based on the FINAL merged array
                    if (newData.length > 0) {
                        const latest = newData[newData.length - 1];
                        lastCandleRef.current = { ...latest };
                        // Note: setState callbacks should ideally be side-effect free, 
                        // but setHorizonData within setData is safe enough in React 18+ batching.
                        setHorizonData(generatePhantomBars(latest.time, latest.close, timeframe));
                    }

                    return newData;
                });

                setIsLoading(false);
                isLoadingRef.current = false;
                historyLoadedRef.current = true;
            }

            setIsLoading(false);
            isLoadingRef.current = false;
            historyLoadedRef.current = true;
        } catch (e) {
            console.error(`[useChartData] Error fetching history for ${symbol}:`, e);
            setIsLoading(false);
            isLoadingRef.current = false;
            historyLoadedRef.current = true; // Unblock ticks if fetch fails completely
        }
    };

    // Main Streaming Effect
    useEffect(() => {
        if (!symbol || !botId) {
            return;
        }

        const onSyncComplete = (payload: any) => {
            if (payload.symbol === symbol && payload.timeframe === timeframe) {
                console.log(`[useChartData] 🔓 SYNC COMPLETE for ${symbol} ${timeframe}. Unlocking UI.`);
                setIsChartReady(true);
                // Trigger History Fetch ONLY if we don't have data yet
                if (!lastCandleRef.current) {
                    fetchHistory(false);
                } else {
                    console.log(`[useChartData] ⏩ SYNC COMPLETE. Triggering Smart Merge to fill gaps.`);
                    fetchHistory(true); // isMerge = true
                }
            }
        };

        const onSyncError = (payload: any) => {
            if (payload.symbol === symbol && payload.timeframe === timeframe) {
                console.error(`[useChartData] ❌ SYNC ERROR for ${symbol} ${timeframe}: ${payload.error}`);
                setSyncError(payload.error || "Sync Failed");
            }
        };

        // 0. Listen for SYNC Events
        const { communicationHub } = require('../services/CommunicationHub');
        communicationHub.on('SYNC_COMPLETE', onSyncComplete);
        communicationHub.on('SYNC_ERROR', onSyncError);

        // 3. LISTEN FOR RECONNECT (Gap Fill Fix)
        // If socket reconnects, we might have missed SYNC_COMPLETE.
        // Force a SMART MERGE to ensure we are up to date.
        const onReconnect = () => {
            console.log(`[useChartData] 🔌 Socket Reconnected. Triggering Smart Merge check for ${symbol} ${timeframe}`);
            // Check if we are ready (Status) or just blindly merge
            if (lastCandleRef.current) {
                fetchHistory(true); // Merge
            }
        };
        communicationHub.on('connect', onReconnect);


        // 4. LISTEN FOR STATUS UPDATES (Sanity)
        const onSanityUpdate = (payload: any) => {
            if (payload.symbol === symbol) {
                // Update status for ALL timeframes if not specified? 
                // Backend broadcasts with 'symbol' and 'status'.
                console.log(`[useChartData] 🚦 Status Update for ${symbol}: ${payload.status}`);
                setSyncStatus(payload.status);

                // If OFFLINE, we might want to flag it visually (ChartStatusIndicator handles this via 'syncStatus' prop)
            }
        };
        communicationHub.on('sanity_update', onSanityUpdate);

        // 1. Check Initial Sync Status (Fix for Race Condition)
        const checkSyncStatus = async () => {
            if (backtestId) {
                console.log(`[useChartData] ✅ Initial Status Check: Bypassing for Backtest mode. Fetching immediately.`);
                setIsChartReady(true);
                fetchHistory();
                return;
            }

            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`${getBaseUrl()}/api/sync-status?symbol=${symbol}`, { headers });
                const json = await res.json();
                if (json.success && json.status) {
                    // Check if specific TF is ready
                    // Status structure: { "M1": { status: "READY", ... } }
                    console.log(`[useChartData:Debug] /sync-status response for ${symbol}:`, JSON.stringify(json));
                    const tfStatus = json.status[timeframe];

                    if (tfStatus) {
                        setSyncStatus(tfStatus.status); // <--- CRITICAL: Set initial status
                    }

                    if (tfStatus && (tfStatus.status === 'READY' || tfStatus.status === 'OFFLINE')) {
                        console.log(`[useChartData] ✅ Initial Status Check: ${symbol} ${timeframe} is ALREADY READY.`);
                        setIsChartReady(true);
                    } else {
                        console.log(`[useChartData] ⏳ Initial Status Check: ${symbol} ${timeframe} is ${tfStatus?.status || 'UNKNOWN'}. Showing available data while syncing...`);
                        // Even if syncing, we show what we have!
                    }
                    // FIX: Always fetch available history immediately. Don't wait for Sync.
                    fetchHistory();
                }
            } catch (e) {
                console.warn("[useChartData] Failed to check sync status", e);
            }
        };
        checkSyncStatus();

        // 2. Subscribe
        const subId = `sub_${symbol}_${timeframe}_${Date.now()}`;
        const adapter = datafeedRef.current;

        if (adapter) {
            adapter.subscribeBars(
                { name: symbol, backtestId }, // Restore original
                timeframe,
                (bar: any) => {
                    // Realtime Logic (copied from LiveChartPage and simplified)
                    if (bar.symbol !== symbol || bar.timeframe !== timeframe) return;

                    if (!historyLoadedRef.current) {
                        console.log(`[useChartData] Ignoring early tick for ${symbol} ${timeframe} because history is not loaded yet.`);
                        return;
                    }

                    const tfSeconds = getTimeframeSeconds(timeframe);
                    let tickTime = Number(bar.time);
                    if (tickTime > 100000000000) tickTime = tickTime / 1000;
                    const candleTime = Math.floor(tickTime / tfSeconds) * tfSeconds;

                    let candleToRender: any;

                    if (!lastCandleRef.current) {
                        // Fresh candle
                        if (bar.open !== undefined) {
                            // TRUSTED SOURCE (Full Candle)
                            candleToRender = {
                                time: candleTime,
                                open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume || 1
                            };
                        } else {
                            // Raw Tick Construction
                            candleToRender = {
                                time: candleTime,
                                open: bar.close, high: bar.close, low: bar.close, close: bar.close, volume: 1
                            };
                        }
                        lastCandleRef.current = candleToRender;
                    } else {
                        if (candleTime > lastCandleRef.current.time) {
                            // New Bar
                            // Push the newly closed bar into our React state to prevent data loss on merge
                            const closedCandle = lastCandleRef.current;
                            setData(prev => {
                                // Prevent duplicates
                                if (prev.length > 0 && prev[prev.length - 1].time >= closedCandle.time) {
                                    return prev;
                                }
                                return [...prev, closedCandle];
                            });

                            if (bar.open !== undefined) {
                                candleToRender = {
                                    time: candleTime,
                                    open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume || 1
                                };
                            } else {
                                candleToRender = {
                                    time: candleTime,
                                    open: bar.close, high: bar.close, low: bar.close, close: bar.close, volume: 1
                                };
                            }
                            lastCandleRef.current = candleToRender;
                            setHorizonData(generatePhantomBars(candleTime, candleToRender.close, timeframe));
                            lastCandleRef.current = candleToRender;
                            setHorizonData(generatePhantomBars(candleTime, candleToRender.close, timeframe));
                        } else if (candleTime === lastCandleRef.current.time) {
                            // Update Existing (Strict Equality Check)
                            if (bar.open !== undefined) {
                                // TRUSTED UPDATE (Overwrite with Backend Truth)
                                candleToRender = {
                                    time: candleTime,
                                    open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume || 1
                                };
                            } else {
                                // TICK UPDATE (Accumulate)
                                const current = lastCandleRef.current;
                                candleToRender = {
                                    ...current,
                                    close: bar.close,
                                    high: Math.max(current.high, bar.close),
                                    low: Math.min(current.low, bar.close),
                                    volume: current.volume + 1
                                };
                            }
                            lastCandleRef.current = candleToRender;
                        } else {
                            // OLD DATA -> IGNORE
                            // This prevents "Cannot update oldest data" error in LWC
                            // console.warn(`[useChartData] Generated time ${candleTime} is older than last ${lastCandleRef.current.time}. Ignoring.`);
                            return;
                        }
                    }

                    // Trigger callback for UI update
                    if (onTick) {
                        onTick(candleToRender);
                    }
                },
                subId,
                () => {
                    // On History Signal (Gap Fill or Re-Sync)
                    // SAFE NOW: Merge Logic prevents Flicker.
                    console.log("[useChartData] 🔄 History Signal received. Merging update...");
                    fetchHistory();
                }
            );
        }

        // --- BACKTEST STEP HANDLER ---
        const handleBacktestStep = (payload: any) => {
            if (payload.backtestId !== backtestId) return;

            // Bypass loading lock for step updates
            isLoadingRef.current = false;

            if (payload.isJump) {
                console.log(`[useChartData] ⏪ JUMP received for ${symbol} ${timeframe}. Forcing full history reload.`);
                // Reset local state completely before fetching
                setData([]);
                setHorizonData([]);
                lastCandleRef.current = null;
                historyLoadedRef.current = false;
                setDataVersion(v => v + 1);

                // Fetch fresh history (isMerge = false)
                fetchHistory(false);
            } else {
                fetchHistory(true).then(() => {
                    // If there's an onTick defined, we should ideally trigger it so that 
                    // ChartPane knows the price has updated.
                    if (onTick && lastCandleRef.current) {
                        onTick(lastCandleRef.current);
                    }
                });
            }
        };

        if (backtestId) {
            communicationHub.on('BACKTEST_STEP_COMPLETE', handleBacktestStep);
        }

        return () => {
            if (adapter) adapter.unsubscribeBars(subId);
            communicationHub.off('SYNC_COMPLETE', onSyncComplete);
            communicationHub.off('SYNC_ERROR', onSyncError);
            communicationHub.off('connect', onReconnect);
            communicationHub.off('sanity_update', onSanityUpdate);
            if (backtestId) {
                communicationHub.off('BACKTEST_STEP_COMPLETE', handleBacktestStep);
            }
        };

    }, [symbol, timeframe, botId, backtestId]);

    // We return refs or a way to get the latest candle to avoid re-renders
    return {
        data,
        horizonData,
        isLoading,
        isChartReady,
        syncError,
        syncStatus, // <--- Exposed
        dataVersion,
        getLastCandle: () => lastCandleRef.current
    };
}
