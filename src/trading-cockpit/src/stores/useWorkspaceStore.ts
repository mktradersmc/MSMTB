import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type LayoutType = 'single' | 'split-vertical' | 'split-horizontal' | 'grid-2x2' | 'grid-1-2';


export interface SavedIndicator {
    instanceId: string;
    defId: string;
    settings: any;
    visible: boolean;
}

export interface PaneConfig {
    id: string;
    symbol: string;
    timeframe: string;
    isActive: boolean;
    indicators?: SavedIndicator[];
    drawings?: string; // Serialized JSON of chart shapes
    scrollToTimeRequest?: { id: string, time: number };
}

export interface Workspace {
    id: string;
    name: string;
    layoutType: LayoutType;
    layoutSizes: number[];
    panes: PaneConfig[];
    maximizedPaneId?: string; // ID of the maximized pane, if any
    isBacktest?: boolean; // True if isolated context
}

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string;

    // Actions
    addWorkspace: (name?: string) => void;
    removeWorkspace: (id: string) => void;
    setActiveWorkspace: (id: string) => void;
    updateWorkspaceLayout: (workspaceId: string, layout: LayoutType) => void;
    updateLayoutSizes: (workspaceId: string, sizes: number[]) => void;
    toggleMaximizePane: (workspaceId: string, paneId: string) => void;
    loadBacktestWorkspace: (sessionId: string, workspaceState?: any, mainSymbol?: string) => void;

    // Drawing
    activeDrawingTool: string | null;
    setActiveDrawingTool: (tool: string | null) => void;

    // Test Mode
    isTestMode: boolean;
    toggleTestMode: () => void;
    setIsTestMode: (mode: boolean) => void;

    // Pane Management
    updatePane: (workspaceId: string, paneId: string, updates: Partial<PaneConfig>) => void;
    setActivePane: (workspaceId: string, paneId: string) => void;
    requestScrollToTime: (paneId: string, time: number) => void;
}

// ... existing code ...

const createDefaultPaneConfig = (): Omit<PaneConfig, 'id' | 'isActive'> => ({
    symbol: '',
    timeframe: 'D1',
    indicators: [] // New array reference every time
});

const createDefaultWorkspace = (name: string): Workspace => {
    const paneId = uuidv4();
    return {
        id: uuidv4(),
        name,
        layoutType: 'single',
        layoutSizes: [],
        panes: [{ ...createDefaultPaneConfig(), id: paneId, isActive: true }]
    };
};

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            workspaces: [createDefaultWorkspace('Main Workspace')],
            activeWorkspaceId: '', // Set in initial hydration if empty? Actually we'll ensure at least one exists.

            activeDrawingTool: null,
            setActiveDrawingTool: (tool) => set({ activeDrawingTool: tool }),

            isTestMode: true, // Default to Safe Mode

            toggleTestMode: () => set((state) => ({ isTestMode: !state.isTestMode })),
            setIsTestMode: (mode) => set({ isTestMode: mode }),

            addWorkspace: (name = 'New Workspace') => {
                const newWorkspace = createDefaultWorkspace(name);
                set((state) => ({
                    workspaces: [...state.workspaces, newWorkspace],
                    activeWorkspaceId: newWorkspace.id
                }));
            },

            loadBacktestWorkspace: (sessionId: string, workspaceState?: any, mainSymbol?: string) => {
                set((state) => {
                    // Check if we already have it
                    const existingIdx = state.workspaces.findIndex(w => w.id === sessionId);

                    let newWorkspace: Workspace;
                    if (workspaceState && workspaceState.id === sessionId) {
                        // Trust provided state
                        newWorkspace = workspaceState;
                    } else if (existingIdx !== -1) {
                        // Already exists, just activate
                        return { activeWorkspaceId: sessionId };
                    } else {
                        // Create fresh backtest workspace
                        const defaultWorkspace = createDefaultWorkspace(`Backtest ${sessionId}`);
                        if (mainSymbol && defaultWorkspace.panes.length > 0) {
                            defaultWorkspace.panes[0].symbol = mainSymbol;
                        }

                        newWorkspace = {
                            ...defaultWorkspace,
                            id: sessionId,
                            isBacktest: true
                        };
                    }

                    // Enforce flag
                    newWorkspace.isBacktest = true;

                    // Remove any existing backtest workspaces to prevent memory leak
                    const filtered = state.workspaces.filter(w => !w.isBacktest || w.id === sessionId);

                    // Add/Update
                    const existingInFiltered = filtered.findIndex(w => w.id === sessionId);
                    if (existingInFiltered !== -1) {
                        filtered[existingInFiltered] = newWorkspace;
                    } else {
                        filtered.push(newWorkspace);
                    }

                    return {
                        workspaces: filtered,
                        activeWorkspaceId: sessionId
                    };
                });
            },

            removeWorkspace: (id) => {
                set((state) => {
                    const filtered = state.workspaces.filter(w => w.id !== id);
                    // If we removed the active one, switch to the first available
                    let newActiveId = state.activeWorkspaceId;
                    if (id === state.activeWorkspaceId) {
                        newActiveId = filtered.length > 0 ? filtered[0].id : '';
                    }

                    // Prevent empty workspaces list?
                    if (filtered.length === 0) {
                        const fallback = createDefaultWorkspace('Default');
                        return { workspaces: [fallback], activeWorkspaceId: fallback.id };
                    }

                    return { workspaces: filtered, activeWorkspaceId: newActiveId };
                });
            },

            setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

            updateWorkspaceLayout: (workspaceId, layout) => {
                set((state) => {
                    return {
                        workspaces: state.workspaces.map(w => {
                            if (w.id !== workspaceId) return w;

                            // Adjust panes based on layout
                            let newPanes = [...w.panes];
                            // Determine target pane count
                            let targetCount = 1;
                            let defaultSizes: number[] = [];

                            switch (layout) {
                                case 'single':
                                    targetCount = 1;
                                    defaultSizes = [100];
                                    break;
                                case 'split-vertical':
                                case 'split-horizontal':
                                    targetCount = 2;
                                    defaultSizes = [50, 50];
                                    break;
                                case 'grid-1-2':
                                    targetCount = 3;
                                    // Main Split (66/33), Right Split (50/50)
                                    // [MainL, MainR, RightTop, RightBot]
                                    defaultSizes = [66, 34, 50, 50];
                                    break;
                                case 'grid-2x2':
                                    targetCount = 4;
                                    // Main Split (50/50), Left Split (50/50), Right Split (50/50)
                                    // [MainL, MainR, LeftTop, LeftBot, RightTop, RightBot]
                                    defaultSizes = [50, 50, 50, 50, 50, 50];
                                    break;
                            }

                            if (newPanes.length < targetCount) {
                                // Add panes
                                const needed = targetCount - newPanes.length;
                                for (let i = 0; i < needed; i++) {
                                    newPanes.push({
                                        ...createDefaultPaneConfig(),
                                        id: uuidv4(),
                                        isActive: false,
                                        // Copy symbol from active pane if possible?
                                        symbol: w.panes.find(p => p.isActive)?.symbol || createDefaultPaneConfig().symbol
                                    });
                                }
                            } else if (newPanes.length > targetCount) {
                                // Remove panes (keep active one if possible, or first ones)
                                // Better strategy: Keep the first N panes
                                newPanes = newPanes.slice(0, targetCount);
                                // Ensure one is active
                                if (!newPanes.find(p => p.isActive)) {
                                    newPanes[0].isActive = true;
                                }
                            }

                            return { ...w, layoutType: layout, panes: newPanes, layoutSizes: defaultSizes };
                        })
                    };
                });
            },

            updateLayoutSizes: (workspaceId, sizes) => {
                set((state) => ({
                    workspaces: state.workspaces.map(w => {
                        if (w.id !== workspaceId) return w;
                        return { ...w, layoutSizes: sizes };
                    })
                }));
            },

            toggleMaximizePane: (workspaceId, paneId) => {
                set((state) => ({
                    workspaces: state.workspaces.map(w => {
                        if (w.id !== workspaceId) return w;
                        const isCurrentlyMaximized = w.maximizedPaneId === paneId;
                        return {
                            ...w,
                            maximizedPaneId: isCurrentlyMaximized ? undefined : paneId
                        };
                    })
                }));
            },

            updatePane: (workspaceId, paneId, updates) => {
                set((state) => ({
                    workspaces: state.workspaces.map(w => {
                        if (w.id !== workspaceId) return w;
                        return {
                            ...w,
                            panes: w.panes.map(p => p.id === paneId ? { ...p, ...updates } : p)
                        };
                    })
                }));
            },

            setActivePane: (workspaceId, paneId) => {
                set((state) => ({
                    workspaces: state.workspaces.map(w => {
                        if (w.id !== workspaceId) return w;
                        return {
                            ...w,
                            panes: w.panes.map(p => ({ ...p, isActive: p.id === paneId }))
                        };
                    })
                }));
            },

            requestScrollToTime: (paneId, time) => {
                set((state) => ({
                    workspaces: state.workspaces.map(w => {
                        // Find workspace containing this pane
                        const hasPane = w.panes.some(p => p.id === paneId);
                        if (!hasPane) return w;

                        return {
                            ...w,
                            panes: w.panes.map(p => {
                                if (p.id !== paneId) return p;
                                return {
                                    ...p,
                                    scrollToTimeRequest: {
                                        id: uuidv4(), // Unique ID to force effect trigger even if time is same
                                        time
                                    }
                                };
                            })
                        };
                    })
                }));
            }
        }),
        {
            name: 'workspace-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => {
                const persistentWorkspaces = state.workspaces.filter(w => !w.isBacktest);
                let fallbackActiveId = state.activeWorkspaceId;

                // If the active workspace was a backtest, revert to the first persistent one on reload
                if (!persistentWorkspaces.find(w => w.id === fallbackActiveId)) {
                    fallbackActiveId = persistentWorkspaces.length > 0 ? persistentWorkspaces[0].id : '';
                }

                return {
                    ...state,
                    workspaces: persistentWorkspaces,
                    activeWorkspaceId: fallbackActiveId
                };
            },
            onRehydrateStorage: () => (state) => {
                // Ensure activeWorkspaceId is valid on load
                if (state && state.workspaces.length > 0 && !state.activeWorkspaceId) {
                    state.activeWorkspaceId = state.workspaces[0].id;
                }
            }
        }
    )
);
