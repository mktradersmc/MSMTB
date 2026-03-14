import { indicatorRegistry } from './IndicatorRegistry';
import { ICTSessionsPlugin, ICTSessionsSchema } from '../plugins/ICTSessionsPlugin';
import { ImbalancePlugin, applyImbalanceTransformation } from '../plugins/ImbalancePlugin';
import { LevelsPlugin, LevelsSchema } from '../plugins/LevelsPlugin';
import { DivergencePlugin, DivergenceSchema } from '../plugins/DivergencePlugin';
import { fetchDirect } from '../../../lib/client-api';
import { NewsMarkerPrimitive } from '../plugins/NewsMarkerPrimitive';


// Register Default Indicators
export const registerIndicators = () => {
    indicatorRegistry.register({
        id: 'ict_sessions',
        name: 'Sessions & Pivots',
        description: 'Visualizes Asia, London, and NY sessions with dynamic pivot mitigation.',
        defaultSettings: ICTSessionsSchema.reduce((acc: any, item: any) => {
            acc[item.id] = item.def;
            return acc;
        }, {}),
        pluginFactory: (settings) => new ICTSessionsPlugin(settings),
        settingsSchema: ICTSessionsSchema,
        dataFetcher: async ({ symbol, timeframe, from, to, settings, liveCandle, signal }) => {
            // Transform Flat Settings to Engine Config
            const engineSettings = {
                mitigation_enabled: settings.mitigation_enabled,
                sessions: [
                    { type: 'ASIA', enabled: settings.show_asia, range: settings.asia_range, color: settings.asia_color },
                    { type: 'LONDON', enabled: settings.show_london, range: settings.london_range, color: settings.london_color },
                    { type: 'NYAM', enabled: settings.show_nyam, range: settings.nyam_range, color: settings.nyam_color },
                    { type: 'NYPM', enabled: settings.show_nypm, range: settings.nypm_range, color: settings.nypm_color }
                ]
            };

            const params = new URLSearchParams({
                symbol,
                timeframe,
                from: from.toString(),
                to: to.toString(),
                settings: JSON.stringify(engineSettings),
                t: Date.now().toString() // Browser Cache Buster
            });

            const res = await fetchDirect(`/indicators/ict-sessions?${params.toString()}`, { signal });
            const data = await res.json();
            return data.sessions || [];
        }
    });

    // Register Imbalance Indicator (Client-Side)
    indicatorRegistry.register({
        id: 'imbalance',
        name: 'Imbalances',
        description: 'Highlights bullish and bearish Fair Value Gaps (Imbalance) by coloring the middle candle body.',
        defaultSettings: {
            bullishColor: '#00BFFF', // Deep Sky Blue
            bearishColor: '#FF8C00', // Dark Orange
            showBullish: true,
            showBearish: true
        },
        pluginFactory: (settings) => new ImbalancePlugin(settings),
        settingsSchema: [
            { group: 'Bullish Imbalance', id: 'showBullish', type: 'bool', title: 'Show Bullish', def: true },
            { group: 'Bullish Imbalance', id: 'bullishColor', type: 'color', title: 'Color', def: '#00BFFF' },
            { group: 'Bearish Imbalance', id: 'showBearish', type: 'bool', title: 'Show Bearish', def: true },
            { group: 'Bearish Imbalance', id: 'bearishColor', type: 'color', title: 'Color', def: '#FF8C00' }
        ],
        dataTransformer: (data, settings) => new ImbalancePlugin(settings).constructor['prototype'] ?
            (require('../plugins/ImbalancePlugin').applyImbalanceTransformation(data, settings)) : data
        // Note: Direct import is cleaner. 'pluginFactory' uses class, 'dataTransformer' uses function.
        // We need to import 'applyImbalanceTransformation' at top level.
    });

    // Register Levels Indicator (Ported logic)
    indicatorRegistry.register({
        id: 'levels',
        name: 'Levels',
        description: 'Displays Daily, Weekly, Monthly logic and Custom Opening Prices.',
        defaultSettings: LevelsSchema.reduce((acc: any, item: any) => {
            acc[item.id] = item.def;
            return acc;
        }, {}),
        pluginFactory: (settings) => new LevelsPlugin(settings),
        settingsSchema: LevelsSchema,
        // No data fetcher needed, uses client data via updateData
    });

    // Register SMT Divergence Indicator
    indicatorRegistry.register({
        id: 'divergence',
        name: 'SMT Divergences',
        description: 'Detects and visualizes structural divergences (SMT) across correlated assets.',
        defaultSettings: DivergenceSchema.reduce((acc: any, item: any) => {
            acc[item.id] = item.def;
            return acc;
        }, {}),
        pluginFactory: (settings) => new DivergencePlugin(settings),
        settingsSchema: DivergenceSchema,
        dataFetcher: async ({ symbol, timeframe, from, to, settings, backtestId, liveCandle, signal }) => {
            // Forward calculation to Market Data Core
            const params = new URLSearchParams({
                symbol,
                timeframe,
                from: from.toString(),
                to: to.toString(),
                settings: JSON.stringify(settings),
                t: Date.now().toString() // Browser Cache Buster
            });

            if (settings.other_symbols && settings.other_symbols.length > 0) {
                params.append('targets', settings.other_symbols.join(','));
            }

            if (backtestId) {
                params.append('backtestId', backtestId);
            }

            try {
                const res = await fetchDirect(`/indicators/divergence?${params.toString()}`, { signal });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                return data; // Returns { divergences: [...] }
            } catch (error: any) {
                // Ignore AbortError for clean cancellations
                if (error.name !== 'AbortError') {
                    console.error("[DivergencePlugin] Fetch error", error);
                }
                return { divergences: [] };
            }
        }
    });

    // Register High-Impact News Indicator
    indicatorRegistry.register({
        id: 'news',
        name: 'High-Impact News',
        description: 'Displays high-impact news events as flags on the timescale based on configured currencies.',
        defaultSettings: { showHigh: true, showMedium: false, showLow: false, showNonEconomic: false, showVerticalLine: true },
        pluginFactory: (settings) => {
            console.log("[NewsIndicator] FACTORY CALLED. Settings:", settings);
            return new NewsMarkerPrimitive({ events: [], settings });
        },
        settingsSchema: [
            { id: 'showHigh', title: 'High Impact', type: 'bool' },
            { id: 'showMedium', title: 'Medium Impact', type: 'bool' },
            { id: 'showLow', title: 'Low Impact', type: 'bool' },
            { id: 'showNonEconomic', title: 'Non-Economic', type: 'bool' },
            { id: 'showVerticalLine', title: 'Show Vertical Line', type: 'bool' },
        ],
        dataFetcher: async ({ symbol, timeframe, from, to, settings, backtestId, liveCandle, signal }) => {
            console.log(`[NewsIndicator] DATA FETCHER ENTRY -> Symbol: ${symbol}, From: ${from}, To: ${to}`);
            // First we need to know the currencies relevant to the current symbol
            let currenciesQuery = '';
            try {
                // Fetch the mapping for the symbol to get its newsCurrency
                const mappingRes = await fetchDirect('/mappings', { signal });
                const mappings = await mappingRes.json();
                const symbolMapping = mappings.find((m: any) => m.datafeedSymbol.includes(symbol) || m.originalSymbol === symbol);
                
                let targetCurrencies: string[] = [];
                if (symbolMapping && symbolMapping.newsCurrency && symbolMapping.newsCurrency !== 'AUTO') {
                    targetCurrencies = [symbolMapping.newsCurrency];
                } else {
                    // AUTO mode: extract 3-letter codes
                    // EURUSD -> EUR, USD
                    // GBPAUD.pro -> GBP, AUD
                    const cleaned = symbol.replace(/[^A-Za-z]/g, '');
                    if (cleaned.length >= 6) {
                        targetCurrencies = [cleaned.substring(0, 3), cleaned.substring(3, 6)];
                    } else if (cleaned.length >= 3) {
                        targetCurrencies = [cleaned.substring(0, 3)];
                    }
                }
                
                if (targetCurrencies.length > 0) {
                    currenciesQuery = `&currencies=${encodeURIComponent(targetCurrencies.map(c => c.toUpperCase()).join(','))}`;
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    throw e; // Bubble abort up to main promise rejection
                }
                console.warn("[NewsIndicator] Failed to fetch symbol currency tracking mapping:", e);
            }

            try {
                // Fetch calendar events
                // The calendar endpoint requires from and to in seconds (unix).
                // ChartContainer dataFetcher passes from/to in milliseconds, so we divide by 1000.
                const url = `/api/calendar?from=${Math.floor(from / 1000)}&to=${Math.floor(to / 1000)}${currenciesQuery}`;
                const res = await fetchDirect(url, { signal });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                
                // Filter events based on user settings
                const events = data.events || [];
                const filteredEvents = events.filter((e: any) => {
                    if (!e.impact) return false;
                    const i = e.impact;
                    if (i.includes('High') && settings?.showHigh) return true;
                    if (i.includes('Medium') && settings?.showMedium) return true;
                    if (i.includes('Low') && settings?.showLow) return true;
                    if (i.includes('Non-Economic') && settings?.showNonEconomic) return true;
                    return false;
                }).map((e: any) => ({
                    ...e,
                    timestamp: Number(e.timestamp) 
                }));
                
                // Logging for user verification
                console.log(`[NewsIndicator] Fetched ${filteredEvents.length} events between ${new Date(from).toLocaleDateString()} and ${new Date(to).toLocaleDateString()}:`, 
                    filteredEvents.map((e: any) => ({
                        time: new Date(e.timestamp * 1000).toLocaleString(),
                        unix_s: e.timestamp,
                        currency: e.currency,
                        impact: e.impact,
                        title: e.name || e.title
                    }))
                );

                return filteredEvents;
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("[NewsIndicator] Fetch error", error);
                }
                return [];
            }
        }
    });

    console.log("[IndicatorRegistry] Registered default indicators.");
};
