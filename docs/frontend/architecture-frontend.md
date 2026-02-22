# Architecture Frontend - Layout Synchronization

## Overview
The frontend uses a sync engine to coordinate multiple chart instances within a workspace. This ensures coherent analysis across different timeframes or symbols.

## LayoutStateManager (Singleton / Store)
The `LayoutStateManager` acts as the **Subject** in the Observer Pattern, while individual `ChartPane` instances act as **Observers**. It serves as the "Single Source of Truth" for synchronization state.

### Observer Pattern Implementation
1.  **Subject (`LayoutStateManager`)**:
    - Maintains a registry of `ChartHandle` references (Observers).
    - Exposes methods to `subscribe` (register) and `unsubscribe` (unregister).
    - Broadcasts state changes (Timeframe, Position) to all registered Observers *except the originator*.

2.  **Observer (`ChartPane` / `ChartHandler`)**:
    - Implements the `ChartHandle` interface.
    - Registers itself with the Manager on mount.
    - Reacts to `setTimeframe`, `setVisibleRange`, and `setCrosshair` calls from the Manager.

### Loop Prevention Strategy (The "Originator" Pattern)
To avoid infinite feedback loops (A updates Manager -> Manager updates B -> B updates Manager -> Manager updates A...), we use an **Originator ID**.

1.  **Event Origin**: When Chart A triggers an update (e.g., user scrolls), it calls the Manager with its own ID: `manager.syncScroll(sourceId: 'Chart_A', position)`.
2.  **Broadcast Filter**: The Manager iterates through all registered handles.
3.  **Check**: If `handle.id === sourceId`, the update is **SKIPPED**.
4.  **Result**: Only Chart B, C, etc., receive the update. Chart A is assumed to be already in the correct state (since it initiated the event).

### API Specification (Skeleton)

```typescript
export interface ChartHandle {
    id: string;
    /** Apply a new timeframe to this chart */
    setTimeframe(tf: string): void;
    /** Scroll the chart to a specific time range */
    setVisibleRange(range: { from: number; to: number }): void;
    /** Move the crosshair to a specific time/price point */
    setCrosshair(time: number, price?: number): void;
}

export abstract class BaseLayoutStateManager {
    /**
     * Registers a chart instance for synchronization.
     * @param id Unique identifier for the chart pane
     * @param handle Interface to control the chart
     */
    abstract register(id: string, handle: ChartHandle): void;

    /**
     * Unregisters a chart instance.
     * @param id Unique identifier to remove
     */
    abstract unregister(id: string): void;

    /**
     * Broadcasts a timeframe change to all other charts.
     * @param sourceId ID of the chart initiating the change
     * @param timeframe New timeframe string (e.g., "H1")
     */
    abstract syncTimeframe(sourceId: string, timeframe: string): void;

    /**
     * Broadcasts a scroll event (visible range) to all other charts.
     * @param sourceId ID of the chart initiating the scroll
     * @param range The new visible time range
     */
    abstract syncScroll(sourceId: string, range: { from: number; to: number }): void;

    /**
     * Broadcasts a crosshair movement.
     * PERFORMANCE: This must be highly optimized (use requestAnimationFrame).
     * @param sourceId ID of the chart where the mouse is
     * @param time Unix timestamp of the crosshair position
     * @param price Price level (optional)
     */
    abstract syncCrosshair(sourceId: string, time: number, price: number): void;
}
```

- **Debouncing**: `syncTimeframe` should be immediate, but `syncScroll` might benefit from slight throttling if needed, though direct manipulation is preferred for smoothness.

## UI Refactoring: Layout & Sync Controls

### 1. Layout Switcher (Dropdown)
*   **Active State**: Sourced from `useWorkspaceStore` -> `activeWorkspace.layoutType`.
*   **Visual**: Displays the icon of the current active layout (e.g., Grid, Single).
*   **Interaction**: Click opens a dropdown to select Layout Mode.
*   **Logic**: Updates `updateWorkspaceLayout` in the store.

### 2. Sync Center (Dropdown)
*   **Primary Action**: Toggle Global Sync (Enabled/Disabled) - *Optional future feature*.
*   **Dropdown Content**: two toggle switches.
    *   **Timeframe**: Toggles `LayoutStateManager.isTimeframeSync`.
    *   **Crosshair**: Toggles `LayoutStateManager.isPositionSync`.
*   **Architecture**:
    *   Component: `SyncCenter` (replaces `SyncControl`).
    *   State: Local reactivity to `LayoutStateManager` options.
    *   Interfaces: Uses `DropdownMenuItem` for structured menu generation.

## Troubleshooting / Active Incidents (2026-01-20)

### 1. Data Pipeline Interruption (Tick Relay Failure)
**Status**: Critical
**Symptoms**: Charts initialized but received no tick updates.
**Root Cause**: Method Signature Mismatch in `DataSubscriptionOrchestrator`.
-   `MT5Datafeed.ts` correctly passes 4 arguments: `subscribe(symbol, tf, paneId, callback)`.
-   `DataSubscriptionOrchestrator.ts` only accepts 3 arguments: `subscribe(symbol, tf, paneId)`.
-   **Result**: The `callback` (TradingView's data ingress) is silently discarded. The Orchestrator receives ticks from the Hub but has no mechanism to relay them to specific panes.

### 2. History Pagination Failure
**Status**: Major
**Symptoms**: Infinite scroll loops; unable to load history beyond the initial 1000 bars.
**Root Cause**: Ignored Pagination Parameters in `MT5Datafeed.getBars`.
-   The implementation extracts `countBack` but **ignores** the `to` (timestamp) parameter provided by TradingView.
    ```typescript
    // CURRENT BROKEN IMPLEMENTATION
    const { from, to, countBack } = periodParams;
    const url = `.../history?symbol=${symbol}&limit=${countBack || 1000}`;
    ```
-   **Result**: Every history request fetches the *latest* N bars, regardless of the requested time range.

### Required Fixes
1.  **Refactor Orchestrator**: Update `subscribe` to accept and store callbacks. Implement `onDataReceived` to distribute ticks.
### 3. Missing Priority History Loading
**Status**: Critical Gap
**Symptoms**: Slow chart opening; no "fast initial load" (100 bars) behavior observed.
**Root Cause**: Feature Not Implemented.
-   **Analysis**: Usage of `MT5Datafeed.getBars` is purely reactive to TradingView's internal logic. There is **no mechanism** in `MT5Datafeed` or `DataSubscriptionOrchestrator` to interrupt or prioritize history requests.
-   **Missing Logic**:
    1.  No identification of "Active Pane" vs "Background Pane" for history fetching priority.
    2.  No "Chunk Strategy" (e.g., "Load last 100 first, then deep history").
    3.  `getBars` simply proxies the request to the backend with whatever `countBack` limits TradingView requests.

### 4. Deep History Backfill Interruption
**Status**: Potential Defect
**Symptoms**: Backfill stops unexpectedly during deep scrolls.
**Root Cause**: Premature `noData: true` Signal.
-   **Logic**: `MT5Datafeed.ts` returns `{ noData: true }` immediately if the backend returns an empty array.
    ```typescript
    if (data.candles.length > 0) { ... } else { onHistoryCallback([], { noData: true }); }
    ```
-   **Conflict**: If the Backend's Deep History Sync is slower than the user's scroll, the Backend returns `[]` (not yet ready). The Frontend immediately tells TradingView "End of Data", permanently stopping the scroll for that session.
-   **Fix Required**: The Frontend must differentiate between "Data Pending" and "End of Data", possibly by retrying or effectively "stalling" the callback until data is available (or having the Backend block).
