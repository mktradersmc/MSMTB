
export interface IndicatorDefinition {
    id: string;
    name: string;
    description?: string;
    defaultSettings: any;
    // We store the Plugin Class constructor or factory
    pluginFactory: (settings: any) => any;
    settingsSchema?: any; // To be defined for generic settings
    dataFetcher?: (params: { symbol: string, timeframe: string, from: number, to: number, settings: any }) => Promise<any>;
    /**
     * Optional function to transform chart data (e.g. for repainting candles).
     * Returns a new array of data items with style overrides.
     */
    dataTransformer?: (data: any[], settings: any) => any[];
}

class IndicatorRegistry {
    private definitions: Map<string, IndicatorDefinition> = new Map();

    register(def: IndicatorDefinition) {
        if (this.definitions.has(def.id)) {
            console.warn(`[IndicatorRegistry] Overwriting indicator: ${def.id}`);
        }
        this.definitions.set(def.id, def);
    }

    get(id: string): IndicatorDefinition | undefined {
        return this.definitions.get(id);
    }

    getAll(): IndicatorDefinition[] {
        return Array.from(this.definitions.values());
    }

    createInstance(id: string, settings: any) {
        const def = this.get(id);
        if (!def) return null;
        // Merge defaults
        const finalSettings = { ...def.defaultSettings, ...settings };
        return def.pluginFactory(finalSettings);
    }
}

export const indicatorRegistry = new IndicatorRegistry();
