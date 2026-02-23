import { create } from 'zustand';
import { Broker } from '../lib/mt-manager/types';
import { fetchDirect } from '../lib/client-api';

interface BrokerStore {
    brokers: Broker[];
    isLoading: boolean;
    error: string | null;
    fetchBrokers: () => Promise<void>;
    getBroker: (id: string) => Broker | undefined;
}

export const useBrokerStore = create<BrokerStore>((set, get) => ({
    brokers: [],
    isLoading: false,
    error: null,

    fetchBrokers: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetchDirect('/api/brokers');
            if (!res.ok) throw new Error('Failed to fetch brokers');
            const data = await res.json();
            set({ brokers: data, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    getBroker: (id: string) => {
        return get().brokers.find(b => b.id === id);
    }
}));
