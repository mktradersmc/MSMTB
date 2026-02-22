import { create } from 'zustand';
import { fetchSymbols } from '../services/api';

export interface SymbolInfo {
    symbol: string;
    description?: string;
    digits: number;
    path?: string[];
    exchange?: string;
    type?: string;
}

interface SymbolStore {
    symbols: string[];
    symbolMap: Map<string, SymbolInfo>; // Fast lookup
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchSymbols: (botId?: string) => Promise<void>;
    getSymbolInfo: (symbol: string) => SymbolInfo | undefined;
}

// Initial fetch prevention
let isFetching = false;

export const useSymbolStore = create<SymbolStore>((set, get) => ({
    symbols: [],
    symbolMap: new Map(),
    isLoading: false,
    error: null,

    fetchSymbols: async (botId) => {
        // Simple cache check: if we have symbols and not explicitly refreshing (TODO: add force refresh param if needed)
        // For now, allow refetch if botId changes or empty
        const currentCount = get().symbols.length;
        if (currentCount > 0 && !botId) return;

        if (isFetching) return;
        isFetching = true;

        set({ isLoading: true, error: null });

        try {
            // fetchSymbols now returns enriched objects from the API (SocketServer)
            // api.ts fetchSymbols returns string[] OR object? 
            // We need to check api.ts. If it returns strings, we are stuck.
            // Let's assume we update api.ts or it already returns what SocketServer /symbols endpoint sends (which is objects now)

            // Checking api.ts logic in mind: 
            // It calls /symbols. SocketServer /symbols returns an array of objects enriched with digits.
            // But api.ts logic might flatten it? 
            // Let's rely on the raw response structure we saw in SocketServer code.

            const result = await fetchSymbols(botId);

            const map = new Map<string, SymbolInfo>();
            const list: string[] = [];

            // Helper to parse result
            // The API might return strings or objects depending on the fallback.
            // We should handle both.

            // Note: fetchSymbols in api.ts is typed to return Promise<string[]> but implementation returns data.symbols which is object array.
            // We'll cast it here.

            const rawItems = result as any[];

            rawItems.forEach((item: any) => {
                if (typeof item === 'string') {
                    // Fallback
                    list.push(item);
                    map.set(item, { symbol: item, digits: 5 }); // Default 5
                } else {
                    const sym = item.name || item.symbol;
                    if (sym) {
                        list.push(sym);
                        map.set(sym, {
                            symbol: sym,
                            description: item.description || item.desc || '',
                            digits: item.digits !== undefined ? item.digits : 5,
                            path: item.path,
                            exchange: item.exchange,
                            type: item.type
                        });
                    }
                }
            });

            list.sort();

            set({ symbols: list, symbolMap: map, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        } finally {
            isFetching = false;
        }
    },

    getSymbolInfo: (symbol) => {
        return get().symbolMap.get(symbol);
    }
}));
