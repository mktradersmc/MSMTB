/**
 * LayoutStateManager.ts
 * 
 * Logic Implementation for the Multi-Chart Sync Engine.
 * 
 * RESPONSIBILITIES:
 * 1. Maintain synchronization state (Timeframe enabled? Position enabled?)
 * 2. Registry of active ChartPanes (via ChartHandle interface).
 * 3. Broadcast events from Source -> Targets (excluding Source).
 */

export interface SyncOptions {
    isTimeframeSync: boolean;
    isPositionSync: boolean;
}

export interface ChartHandle {
    // Unique identifier of the pane
    id: string;

    // Apply a new timeframe to this chart
    setTimeframe(tf: string): void;

    // Get current timeframe
    getTimeframe(): string;

    // Scroll the chart to a specific time range
    setVisibleRange(range: { from: number; to: number }): void;

    // Set logical range (for more precise sync without autoScale loops)
    setLogicalRange(range: { from: number; to: number, anchorTime?: number, whitespaceOffset?: number }): void;

    // Move the crosshair to a specific time/price point
    setCrosshair(time: number, price?: number): void;
}

export class LayoutStateManager {
    // Singleton Instance
    private static instance: LayoutStateManager;

    // Internal State
    private charts: Map<string, ChartHandle> = new Map();


    private options: SyncOptions = {
        isTimeframeSync: false,
        isPositionSync: false
    };

    private lastActiveChartId: string | null = null;

    private constructor() {
        console.log("[LayoutStateManager] Initialized");
    }

    public static getInstance(): LayoutStateManager {
        if (!LayoutStateManager.instance) {
            LayoutStateManager.instance = new LayoutStateManager();
        }
        return LayoutStateManager.instance;
    }

    /**
     * Updates the synchronization configuration.
     * @param options Partial options to update
     */
    public setOptions(options: Partial<SyncOptions>): void {
        const prevTimeframeSync = this.options.isTimeframeSync;

        this.options = { ...this.options, ...options };
        console.log("[LayoutStateManager] Options updated:", this.options);

        // Logic 1: Initial Sync Logic (Timeframe)
        if (!prevTimeframeSync && this.options.isTimeframeSync) {
            this.applyMasterTimeToAll();
        }
    }

    /**
     * Sets the "Active" chart (Master for next sync operation)
     */
    public setLastActive(id: string): void {
        this.lastActiveChartId = id;
    }

    /**
     * Hydrates all charts with the timeframe of the master chart
     */
    private applyMasterTimeToAll(): void {
        // Determine Master: Last Active or First registered
        let masterId = this.lastActiveChartId;
        if (!masterId || !this.charts.has(masterId)) {
            const first = this.charts.keys().next().value;
            if (first) masterId = first;
        }

        if (!masterId) return; // No charts registered

        const masterHandle = this.charts.get(masterId);
        if (masterHandle) {
            const masterTf = masterHandle.getTimeframe();
            console.log(`[LayoutStateManager] Initial Sync from Master (${masterId}): ${masterTf}`);
            this.syncTimeframe(masterId, masterTf);
        }
    }

    public getOptions(): SyncOptions {
        return { ...this.options };
    }

    /**
     * Registers a chart instance for synchronization.
     * @param handle The interface to control the chart
     */
    public register(handle: ChartHandle): void {
        if (!this.charts.has(handle.id)) {
            console.log(`[LayoutStateManager] Registering chart: ${handle.id}`);
            this.charts.set(handle.id, handle);
        }
    }

    /**
     * Removes a chart from the registry.
     * @param id The ID of the chart to remove
     */
    public unregister(id: string): void {
        if (this.charts.has(id)) {
            this.charts.delete(id);
            if (this.lastActiveChartId === id) {
                this.lastActiveChartId = null;
            }
        }
    }

    /**
     * Broadcasts a timeframe change to all other charts (if Sync active).
     * @param sourceId The ID of the chart initiating the change
     * @param timeframe The new timeframe (e.g. "M5")
     */
    public syncTimeframe(sourceId: string, timeframe: string): void {
        if (!this.options.isTimeframeSync) return;

        this.charts.forEach((handle, id) => {
            if (id !== sourceId) {
                handle.setTimeframe(timeframe);
            }
        });
    }

    /**
     * Broadcasts a visible range scroll update (if Sync active).
     * @param sourceId The ID of the chart initiating the scroll
     * @param range The new visible time range
     * @param logicalRange Optional logical range for precise sync
     */
    public syncScroll(sourceId: string, range: { from: number; to: number }, logicalRange?: { from: number; to: number, anchorTime?: number, whitespaceOffset?: number }): void {
        if (!this.options.isPositionSync) return;

        this.charts.forEach((handle, id) => {
            if (id !== sourceId) {
                if (logicalRange) {
                    handle.setLogicalRange(logicalRange);
                } else {
                    handle.setVisibleRange(range);
                }
            }
        });
    }

    /**
     * Broadcasts a crosshair move (if Sync active).
     * WARNING: Hot path! Must use requestAnimationFrame or direct calls to avoid GC/Lag.
     * @param sourceId The ID of the chart where the mouse is
     * @param time The time index under the mouse
     * @param price The price level (optional)
     */
    public syncCrosshair(sourceId: string, time: number, price: number): void {
        if (!this.options.isPositionSync) return;

        // Direct iteration for max performance
        // Bypass React state updates, call the handle directly
        for (const [id, handle] of this.charts) {
            if (id !== sourceId) {
                handle.setCrosshair(time, price);
            }
        }
    }

    // --- Persistence Methods ---

}
