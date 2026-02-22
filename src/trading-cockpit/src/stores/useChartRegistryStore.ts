import { create } from 'zustand';
import { ChartContainerHandle } from '../components/charts/ChartContainer';

interface ChartRegistryState {
    charts: Record<string, ChartContainerHandle>;
    registerChart: (paneId: string, handle: ChartContainerHandle) => void;
    unregisterChart: (paneId: string) => void;
    getChart: (paneId: string) => ChartContainerHandle | null;
}

export const useChartRegistryStore = create<ChartRegistryState>((set, get) => ({
    charts: {},
    registerChart: (paneId, handle) => {
        set((state) => ({
            charts: { ...state.charts, [paneId]: handle }
        }));
    },
    unregisterChart: (paneId) => {
        set((state) => {
            const { [paneId]: removed, ...rest } = state.charts;
            return { charts: rest };
        });
    },
    getChart: (paneId) => {
        return get().charts[paneId] || null;
    }
}));
