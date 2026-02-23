import { communicationHub } from "./CommunicationHub";
import { sendCommand, fetchMessages } from "./api";
import { dataSubscriptionOrchestrator } from "./DataSubscriptionOrchestrator";

// Basic interface for TradingView Datafeed (subset)
export interface IDatafeed {
    onReady: (callback: (config: any) => void) => void;
    searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: (result: any[]) => void) => void;
    resolveSymbol: (symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (reason: string) => void) => void;
    getBars: (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: (bars: any[], meta: any) => void, onErrorCallback: (error: string) => void) => void;
    subscribeBars: (symbolInfo: any, resolution: string, onRealtimeCallback: (bar: any) => void, subscribeUID: string, onResetCacheNeededCallback: () => void) => void;
    unsubscribeBars: (subscriberUID: string) => void;
}

export class MT5Datafeed implements IDatafeed {
    private subscriptions: Map<string, any> = new Map();
    private availableSymbols: string[] = [];

    private initializationPromise: Promise<void>;
    private initializationResolver: () => void = () => { };

    constructor() {
        // Initialize the promise immediately
        this.initializationPromise = new Promise((resolve) => {
            this.initializationResolver = resolve;
        });

        // Ensure hub is connected
        communicationHub.connect();
        this.loadSymbols();
    }

    private async loadSymbols() {
        try {
            const res = await fetch('http://localhost:3005/api/mappings');
            if (res.ok) {
                const mappings = await res.json();
                // We only care about the "Frontend Name" (Original Symbol or Fallback)
                // We do NOT care about BotIDs or Datafeed Symbols here.
                this.availableSymbols = mappings.map((m: any) => m.originalSymbol || m.datafeedSymbol).filter(Boolean);

                // Deduplicate
                this.availableSymbols = [...new Set(this.availableSymbols)];

                console.log(`[MT5Datafeed] Loaded ${this.availableSymbols.length} symbols.`);
            }
        } catch (e) {
            console.error("[MT5Datafeed] Failed to load symbols", e);
        } finally {
            // ALWAYS resolve, even on error, so we don't block forever
            this.initializationResolver();
        }
    }

    onReady(callback: (config: any) => void): void {
        console.log("%c [MT5Datafeed] VERSION 4.2: ORCHESTRATED (ASYNC INIT)", "color: magenta; font-weight: bold; font-size: 14px;");
        setTimeout(() => callback({
            supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
        }), 0);
    }

    async searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: (result: any[]) => void): Promise<void> {
        await this.initializationPromise;

        const query = userInput.toLowerCase();
        const matches = this.availableSymbols.filter(s => s.toLowerCase().includes(query));

        if (matches.length > 0) {
            onResult(matches.map(s => ({
                symbol: s,
                full_name: s,
                description: s,
                exchange: "Broker",
                type: "currency"
            })));
        } else {
            // Fallback: Allow user to type anything (maybe they added a sym but didn't refresh)
            onResult([
                { symbol: userInput, full_name: userInput, description: userInput, exchange: "Forex", type: "currency" }
            ]);
        }
    }

    async resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: any) => void, onResolveErrorCallback: (reason: string) => void): Promise<void> {
        await this.initializationPromise;

        console.log(`[MT5Datafeed] 🔍 Resolving Symbol: ${symbolName}`);
        const info = {
            name: symbolName,
            full_name: symbolName,
            description: symbolName,
            type: 'forex',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: 'Forex',
            minmov: 1,
            pricescale: 100000,
            has_intraday: true,
            has_no_volume: false,
            has_weekly_and_monthly: true,
            supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
            volume_precision: 2,
            data_status: 'streaming',
        };
        setTimeout(() => onSymbolResolvedCallback(info), 0);
    }

    private lastBarTimes: Map<string, number> = new Map();
    private lastBars: Map<string, any> = new Map(); // Cache for Open Price Locking

    async getBars(symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: (bars: any[], meta: any) => void, onErrorCallback: (error: string) => void): Promise<void> {
        // Wait for initialization before asking for history
        await this.initializationPromise;

        const { from, to, countBack, firstDataRequest } = periodParams;
        const tf = this.resolutionToTimeframe(resolution);
        const symbol = symbolInfo.name;

        if (!firstDataRequest) {
            console.log(`%c [MT5Datafeed] (a) SCROLL DETECTED | (b) NEED HISTORY | To: ${to} (${new Date(to * 1000).toISOString()})`, "color: cyan; font-weight: bold; background: #333; padding: 4px;");
        } else {
            console.log(`%c >>> GETBARS START: ${symbol} ${resolution} <<<`, "background: red; color: white;");
        }

        try {
            // Safety check
            if (this.availableSymbols.length === 0) {
                console.warn("[MT5Datafeed] availableSymbols is empty after init. Possible startup issue.");
            }

            // USER OVERRIDE: 20k is too heavy for First Load (>10MB JSON). 
            // Start light (1k) to get Chart visible instantly. Pagination fills the rest.
            const reqLimit = firstDataRequest ? 1000 : 20000;

            let url = `http://127.0.0.1:3005/api/history?symbol=${symbol}&timeframe=${tf}&limit=${reqLimit}`;
            if (!firstDataRequest && to) {
                // Pagination: Load OLDER than 'to'
                url += `&to=${Math.floor(to * 1000)}`;
            }
            // Cache Buster
            url += `&_=${Date.now()}`;

            console.log(`[MT5Datafeed] (c) LOADING HISTORY: ${url}`);

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(url, { headers });

            if (!res.ok) {
                console.error("[MT5Datafeed] API Status Error:", res.status);
                onHistoryCallback([], { noData: true });
                return;
            }

            const data = await res.json();
            const count = data.candles?.length || 0;
            console.log(`%c [MT5Datafeed] (d) HISTORY RESULT: Received ${count} candles.`, count === 0 ? "color: red; font-weight: bold;" : "color: lime;");

            if (data.success && data.candles && count > 0) {
                // ... Mapping Logik ...
                const bars = data.candles.map((c: any) => {
                    // Universal Timestamp Fix: Support both Sec and MS
                    let t = Number(c.time);
                    if (t > 100000000000) {
                        t = t / 1000; // Convert MS to Sec
                    }
                    return {
                        time: t,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: c.volume || 0
                    };
                });

                // Sorting is crucial
                bars.sort((a: any, b: any) => a.time - b.time);

                // MERGE LIVE CACHE (Fix for Flicker on Reset)
                const cacheKey = `${symbol}_${tf}`;
                const cachedBar = this.lastBars.get(cacheKey);
                if (cachedBar) {
                    const lastFetched = bars[bars.length - 1];
                    // If cached bar is newer or same time (Live is authoritative)
                    if (!lastFetched || cachedBar.time > lastFetched.time) {
                        bars.push(cachedBar);
                        // console.log(`[MT5Datafeed] 🔗 Appended Live Bar to History: ${cachedBar.time}`);
                    } else if (cachedBar.time === lastFetched.time) {
                        bars[bars.length - 1] = cachedBar;
                        // console.log(`[MT5Datafeed] 🔗 Overwrote Stale History with Live Bar: ${cachedBar.time}`);
                    }
                }

                const lastBar = bars[bars.length - 1];
                if (lastBar) {
                    const currentLast = this.lastBarTimes.get(cacheKey) || 0;
                    if (lastBar.time > currentLast) {
                        this.lastBarTimes.set(cacheKey, lastBar.time);
                    }
                }

                onHistoryCallback(bars, { noData: false });
            } else {
                if (!firstDataRequest) {
                    // PENDING STATE: API gave 0 candles during pagination.
                    // The backend might be busy fetching from broker.
                    // We send 'noData: false' with empty array to tell TV to retry.
                    // Refined Logic per User: "noData: true ONLY IF ... Backend confirms end".
                    // For now, if we don't have explicit end flag, we assume PENDING.
                    console.log("[MT5Datafeed] Pagination empty (Pending?). Sending noData: false to trigger retry.");
                    onHistoryCallback([], { noData: false });
                } else {
                    console.log("[MT5Datafeed] First Load empty. Sending noData: true.");
                    onHistoryCallback([], { noData: true });
                }
            }
        } catch (e) {
            console.error("[MT5Datafeed] FATAL ERROR in getBars:", e);
            onErrorCallback("Crash");
        }
    }

    subscribeBars(symbolInfo: any, resolution: string, onRealtimeCallback: (bar: any) => void, subscribeUID: string, onResetCacheNeededCallback: () => void): void {
        const symbol = symbolInfo.name.trim(); // PURE SYMBOL
        const expectedTf = this.resolutionToTimeframe(resolution).trim();

        console.log(`[MT5Datafeed] Subscribe Realtime: ${symbol} [${subscribeUID} / TF: ${expectedTf}]`);

        const periodMs = this.resolutionToMs(resolution);
        const periodSec = periodMs / 1000;

        // Callback wrapped to process raw data from Orchestrator
        const orchestratedListener = (candle: any) => {
            // Check match - redundant if orchestrator does its job, but safe.
            console.log(`[MT5Datafeed] TRACE D: orchestratedListener for ${symbol} ${expectedTf} received data for ${candle.symbol} ${candle.timeframe}`);
            let rawTime = candle.time;
            if (rawTime > 100000000000) rawTime = rawTime / 1000;

            const alignedTimeSec = Math.floor(rawTime / periodSec) * periodSec;
            const timeSec = alignedTimeSec;

            // GAP & ORDER DETECTION
            const key = `${symbol}_${expectedTf}`;
            const lastTime = this.lastBarTimes.get(key);
            let cachedBar = this.lastBars.get(key);

            if (lastTime) {
                if (timeSec < lastTime) {
                    console.warn(`[MT5Datafeed] 📉 Stale Update (History?) Ignored. Bar: ${timeSec}, Last: ${lastTime}`);
                    return;
                }
                if (timeSec > (lastTime + periodSec + 1)) {
                    console.warn(`[MT5Datafeed] ⚠️ Gap Detected! Last: ${lastTime}, New: ${timeSec}. Resetting.`);
                    onResetCacheNeededCallback();
                    this.lastBarTimes.set(key, timeSec);
                    this.lastBars.delete(key);
                    return;
                }
            }
            this.lastBarTimes.set(key, timeSec);

            // STABILITY FIX: Lock Open Price for the same bar
            let openPrice = candle.open;
            if (cachedBar && cachedBar.time === timeSec) {
                // If we already have a bar for this time, keep the INITIAL Open.
                // This prevents "Jumping Open" if the backend sends glitches or undefined.
                if (cachedBar.open) {
                    if (Math.abs(cachedBar.open - candle.open) > 0.0000001) {
                        console.warn(`[MT5Datafeed] 🔒 Locking Open: ${cachedBar.open} (Ignoring New: ${candle.open})`);
                    }
                    openPrice = cachedBar.open;
                }
            } else {
                console.log(`[MT5Datafeed] 🆕 New Bar or Reset. Open: ${openPrice} Time: ${timeSec} (Last: ${this.lastBarTimes.get(key)})`);
            }

            const barToEmit = {
                symbol: symbol,
                timeframe: expectedTf,
                time: timeSec,
                open: openPrice,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            };

            // Update Cache
            this.lastBars.set(key, barToEmit);

            // DEBUG: Trace Fidelity
            // console.log(`[MT5Datafeed] 📊 Live Update ${symbol} [${new Date(timeSec * 1000).toISOString().split('T')[1]}] | O:${barToEmit.open} H:${barToEmit.high} L:${barToEmit.low} C:${barToEmit.close}`);

            onRealtimeCallback(barToEmit);
        };

        // Use Orchestrator to manage subscription lifecycle AND distribution
        // subscribeUID serves as the paneId. Pass the listener to be registered.
        dataSubscriptionOrchestrator.subscribe(symbol, expectedTf, subscribeUID, orchestratedListener);

        const historyListener = (data: any) => {
            if (data.symbol === symbol && data.timeframe === expectedTf) {
                console.log(`[MT5Datafeed] History Update detected for ${symbol}. Resetting Cache.`);
                onResetCacheNeededCallback();
            }
        };

        // History updates: We still listen directly for now unless moved to Orchestrator later
        communicationHub.on('history_update', historyListener);

        this.subscriptions.set(subscribeUID, {
            symbol: symbol,
            orchestratedListener: orchestratedListener,
            historyListener: historyListener,
            timeframe: expectedTf
        });
    }

    unsubscribeBars(subscriberUID: string): void {
        const sub = this.subscriptions.get(subscriberUID);
        if (sub) {
            console.log(`[MT5Datafeed] Unsubscribe: ${sub.symbol} [${subscriberUID}]`);

            // Remove local listeners
            // communicationHub.off('bar_update', sub.listener); // Removed, handled by orchestrator
            if (sub.historyListener) {
                communicationHub.off('history_update', sub.historyListener);
            }

            // Tell Orchestrator to release this subscription
            dataSubscriptionOrchestrator.unsubscribe(sub.symbol, sub.timeframe, subscriberUID);

            this.subscriptions.delete(subscriberUID);
        }
    }

    private resolutionToTimeframe(resolution: string): string {
        const tfMap: Record<string, string> = {
            '1': 'M1', '2': 'M2', '3': 'M3', '4': 'M4', '5': 'M5', '6': 'M6', '10': 'M10', '12': 'M12', '15': 'M15', '20': 'M20', '30': 'M30',
            '60': 'H1', '120': 'H2', '180': 'H3', '240': 'H4', '360': 'H6', '480': 'H8', '720': 'H12',
            'D': 'D1', '1D': 'D1', 'W': 'W1', '1W': 'W1', 'M': 'MN1', '1M': 'MN1',
            // Passthrough
            'M1': 'M1', 'M2': 'M2', 'M3': 'M3', 'M4': 'M4', 'M5': 'M5', 'M6': 'M6', 'M10': 'M10', 'M12': 'M12', 'M15': 'M15', 'M20': 'M20', 'M30': 'M30',
            'H1': 'H1', 'H2': 'H2', 'H3': 'H3', 'H4': 'H4', 'H6': 'H6', 'H8': 'H8', 'H12': 'H12',
            'D1': 'D1', 'W1': 'W1', 'MN1': 'MN1'
        };
        return tfMap[resolution] || 'H1';
    }

    private resolutionToMs(res: string): number {
        if (res.startsWith('M')) {
            if (res === 'MN1') return 30 * 24 * 60 * 60 * 1000;
            const min = parseInt(res.substring(1));
            return (isNaN(min) ? 1 : min) * 60 * 1000;
        }
        if (res.startsWith('H')) {
            const hour = parseInt(res.substring(1));
            return (isNaN(hour) ? 1 : hour) * 60 * 60 * 1000;
        }
        if (res.startsWith('D')) return 24 * 60 * 60 * 1000;
        if (res.startsWith('W') || res === 'W1') return 7 * 24 * 60 * 60 * 1000;
        if (res === 'MN1' || res === 'M' || res === '1M') return 30 * 24 * 60 * 60 * 1000;

        const val = parseInt(res);
        if (isNaN(val)) return 60000;
        return val * 60 * 1000;
    }
}
