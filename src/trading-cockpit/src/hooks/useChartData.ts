import { useState, useEffect, useRef } from 'react';
import { MT5Datafeed } from '../services/MT5Datafeed';
import { generatePhantomBars, getTimeframeSeconds } from '../utils/chartUtils';
import { fetchMessages } from '../services/api';

export interface ChartDataHookOptions {
    symbol: string;
    timeframe: string;
    botId: string;
    isActivePane: boolean; // For smart streaming
    onTick?: (candle: any) => void;
}

export function useChartData({ symbol, timeframe, botId, isActivePane, onTick }: ChartDataHookOptions) {
    const [data, setData] = useState<any[]>([]);
    const [horizonData, setHorizonData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false); // For backlog filling

    const [isChartReady, setIsChartReady] = useState(false);
    const [syncError, setSyncError] = useState<string | undefined>(undefined);
    const [syncStatus, setSyncStatus] = useState<string>('READY');

    // Refs
    const lastCandleRef = useRef<any>(null);
    const datafeedRef = useRef<MT5Datafeed | null>(null);
    const symbolRef = useRef(symbol);
    const tfRef = useRef(timeframe);
    const isLoadingRef = useRef(false);

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

        // RESET LAST CANDLE: Prevent ghost candles from previous timeframe/symbol
        lastCandleRef.current = null;

        // RESET LOCK STATE
        setIsChartReady(false);
        setSyncError(undefined);
    }, [symbol, timeframe]);

    // Initialize Datafeed Adapter
    useEffect(() => {
        if (!datafeedRef.current) {
            datafeedRef.current = new MT5Datafeed();
        }
    }, []);

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
            const chunkSize = 500;     // Packet size: 500 (safe balance)

            // 1. Initial Fetch (Latest)
            console.log(`[useChartData] 🚀 Starting Progressive Fetch for ${symbol} ${timeframe}`);
            let url = `http://127.0.0.1:3005/history?symbol=${symbol}&timeframe=${timeframe}&limit=${chunkSize}&_=${Date.now()}`;

            let res = await fetch(url);
            let response = await res.json();

            if (!response.success || !response.candles) {
                console.warn("[useChartData] Initial fetch failed or empty.");
                setIsLoading(false);
                isLoadingRef.current = false;
                return;
            }

            let gatheredBars = response.candles.map((c: any) => {
                let t = Number(c.time);
                if (t > 100000000000) t = t / 1000;
                return {
                    time: t,
                    open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0
                };
            }).sort((a: any, b: any) => a.time - b.time);

            // Set Initial Data or Merge
            if (gatheredBars.length > 0) {
                // STALENESS CHECK
                if (symbolRef.current !== symbol || tfRef.current !== timeframe) {
                    console.log(`[useChartData] ⚠️ Initial fetch discarded for ${symbol} ${timeframe}`);
                    return;
                }

                // MERGE LIVE CANDLE (Fix for Initial Fetch Flicker)
                const liveCandle = lastCandleRef.current;
                if (liveCandle) {
                    const lastFetched = gatheredBars[gatheredBars.length - 1];
                    if (!lastFetched || lastFetched.time < liveCandle.time) {
                        gatheredBars.push(liveCandle);
                    } else if (lastFetched.time === liveCandle.time) {
                        gatheredBars[gatheredBars.length - 1] = liveCandle;
                    }
                }

                if (isMerge) {
                    // SMART MERGE: Integrate new chunk into existing data
                    // Filter out bars that are already in 'data' (deduplication)
                    // But beware: 'data' state might be stale in closure?
                    // We can use functional update or assume 'data' is reasonably fresh if no rapid updates.
                    // Better: We just update 'data' by slicing.

                    console.log(`[useChartData] 🧬 Smart Merge: Integrating ${gatheredBars.length} bars...`);

                    setData(prevData => {
                        // Create a map of existing bars for overlap check? No, just time-based merge.
                        // Simple: Filter prevData to keep only bars OLDER than the new chunk's first bar.
                        // Then append new chunk.
                        if (prevData.length === 0) return [...gatheredBars];

                        const firstNewTime = gatheredBars[0].time;
                        const nonOverlappingOld = prevData.filter(d => d.time < firstNewTime);
                        return [...nonOverlappingOld, ...gatheredBars];
                    });

                    // Update Horizon
                    const latest = gatheredBars[gatheredBars.length - 1];
                    lastCandleRef.current = { ...latest };
                    setHorizonData(generatePhantomBars(latest.time, latest.close, timeframe));

                    // Stop loop if merging
                    setIsLoading(false);
                    isLoadingRef.current = false;
                    return;
                } else {
                    // FRESH LOAD
                    setData([...gatheredBars]);
                    lastCandleRef.current = { ...gatheredBars[gatheredBars.length - 1] };
                    if (gatheredBars.length > 0) {
                        setHorizonData(generatePhantomBars(gatheredBars[gatheredBars.length - 1].time, gatheredBars[gatheredBars.length - 1].close, timeframe));

                        // FIX: PROGRESSIVE LOADING
                        // Show chart immediately after first chunk, while backfilling continues in background
                        setIsLoading(false);
                    }
                }
            }

            // 2. Background Loop (Load older data)
            while (gatheredBars.length < targetTotal) {
                if (gatheredBars.length === 0) break;

                const oldestTime = gatheredBars[0].time; // First element is oldest

                // Fetch older than current oldest
                // Fix: Convert 'oldestTime' (seconds) back to MS for the backend if needed.
                // Since we detected MS in the response earlier, we know backend sends MS.
                // But let's be robust: If the ORIGINAL response was MS, we should query in MS.
                // Simplest: Assume backend stores MS (standard).
                const toMs = Math.floor(oldestTime * 1000);
                url = `http://127.0.0.1:3005/history?symbol=${symbol}&timeframe=${timeframe}&limit=${chunkSize}&to=${toMs}&_=${Date.now()}`;
                // console.log(`[useChartData] 📡 Fetching chunk older than ${new Date(toMs).toISOString()} (to=${toMs})`);

                res = await fetch(url);
                response = await res.json();

                if (!response.success || !response.candles || response.candles.length === 0) {
                    console.log("[useChartData] ✅ End of history reached.");
                    break;
                }

                const newChunk = response.candles.map((c: any) => {
                    let t = Number(c.time);
                    if (t > 100000000000) t = t / 1000;
                    return {
                        time: t,
                        open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0
                    };
                }).sort((a: any, b: any) => a.time - b.time);

                // Dedup
                const uniqueNew = newChunk.filter((nc: any) => nc.time < oldestTime);

                if (uniqueNew.length === 0) {
                    console.log("[useChartData] No unique older bars found. Stopping.");
                    break;
                }

                gatheredBars = [...uniqueNew, ...gatheredBars];

                // STALENESS CHECK: Ensure we are still on the same symbol/tf
                if (symbolRef.current !== symbol || tfRef.current !== timeframe) {
                    console.log(`[useChartData] ⚠️ Fetch aborted for ${symbol} ${timeframe} (switched to ${symbolRef.current} ${tfRef.current})`);
                    return; // Stop this loop and function
                }

                // Update UI incrementally
                // Update UI incrementally but PRESERVE Live Candle State
                const liveCandle = lastCandleRef.current;
                let finalData = [...gatheredBars];

                if (liveCandle) {
                    const lastFetched = finalData[finalData.length - 1];
                    if (!lastFetched || lastFetched.time < liveCandle.time) {
                        // Append Live Candle if missing from fetch
                        finalData.push(liveCandle);
                    } else if (lastFetched.time === liveCandle.time) {
                        // CRITICAL FIX: Overwrite stale DB candle with LIVE candle
                        // The Live Stream is always more up-to-date than the DB during active trading.
                        finalData[finalData.length - 1] = liveCandle;
                    }
                }

                setData(finalData);

                // Small delay to prevent network congestion
                await new Promise(r => setTimeout(r, 100));
            }

            setIsLoading(false);
            isLoadingRef.current = false;
        } catch (e) {
            console.error(`[useChartData] Error fetching history for ${symbol}:`, e);
            setIsLoading(false);
            isLoadingRef.current = false;
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

            try {
                const res = await fetch(`http://127.0.0.1:3005/sync-status?symbol=${symbol}`);
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
                { name: symbol },
                timeframe,
                (bar: any) => {
                    // Realtime Logic (copied from LiveChartPage and simplified)
                    if (bar.symbol !== symbol || bar.timeframe !== timeframe) return;

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

        return () => {
            if (adapter) adapter.unsubscribeBars(subId);
            communicationHub.off('SYNC_COMPLETE', onSyncComplete);
            communicationHub.off('SYNC_ERROR', onSyncError);
            communicationHub.off('connect', onReconnect);
            communicationHub.off('sanity_update', onSanityUpdate);
        };

    }, [symbol, timeframe, botId]);

    // We return refs or a way to get the latest candle to avoid re-renders
    return {
        data,
        horizonData,
        isLoading,
        isChartReady,
        syncError,
        syncStatus, // <--- Exposed
        getLastCandle: () => lastCandleRef.current
    };
}
