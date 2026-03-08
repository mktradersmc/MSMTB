import { indicatorRegistry } from './IndicatorRegistry';
import { ICTSessionsPlugin, ICTSessionsSchema } from '../plugins/ICTSessionsPlugin';
import { ImbalancePlugin, applyImbalanceTransformation } from '../plugins/ImbalancePlugin';
import { LevelsPlugin, LevelsSchema } from '../plugins/LevelsPlugin';
import { DivergencePlugin, DivergenceSchema } from '../plugins/DivergencePlugin';

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
        dataFetcher: async ({ symbol, timeframe, from, to, settings }) => {
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
                settings: JSON.stringify(engineSettings)
            });
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`http://localhost:3005/api/indicators/ict-sessions?${params.toString()}`, { headers });
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
        dataFetcher: async ({ symbol, timeframe, from, to, settings, backtestId }) => {
            // Forward calculation to Market Data Core
            const params = new URLSearchParams({
                symbol,
                timeframe,
                from: from.toString(),
                to: to.toString(),
                settings: JSON.stringify(settings)
            });

            if (settings.other_symbols && settings.other_symbols.length > 0) {
                params.append('targets', settings.other_symbols.join(','));
            }

            if (backtestId) {
                params.append('backtestId', backtestId);
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                const res = await fetch(`http://localhost:3005/api/indicators/divergence?${params.toString()}`, { headers });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                return data; // Returns { divergences: [...] }
            } catch (error) {
                console.error("[DivergencePlugin] Fetch error", error);
                return { divergences: [] };
            }
        }
    });

    console.log("[IndicatorRegistry] Registered default indicators.");
};
