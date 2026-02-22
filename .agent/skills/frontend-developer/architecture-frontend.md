# Antigravity Frontend Architecture Specification v8.5
# SCOPE: React, Lightweight Charts v4, Multi-Pane System

================================================================================
1. DATAFEED API (JS-API Implementation)
================================================================================
Reference: MT5Datafeed.ts structure.

INTERFACE: IDatafeedService
--------------------------------------------------------------------------------
interface IDatafeedService {
  // 1. Configuration
  // Must return: supports_time: true, supports_marks: false, resolutions: ['1', '5', '15', ...]
  onReady(callback: (config: DatafeedConfiguration) => void): void;

  // 2. Symbol Resolution
  // Defaults: timezone: 'Etc/UTC', session: '24x7', type: 'forex'
  resolveSymbol(
    symbolName: string, 
    onResolve: (symbolInfo: LibrarySymbolInfo) => void, 
    onError: (reason: string) => void
  ): void;

  // 3. History Fetching (Pagination Critical)
  // Logic: Call REST API with ?from=${periodParams.from}&limit=1000
  // Fix: Detect if timestamp is MS (>100B) and convert to Seconds.
  // Return: { noData: true } if API returns 0 rows and !firstDataRequest.
  getBars(
    symbolInfo: LibrarySymbolInfo, 
    resolution: string, 
    periodParams: { from: number; to: number; firstDataRequest: boolean }, 
    onResult: (bars: Bar[], meta: { noData: boolean }) => void, 
    onError: (reason: string) => void
  ): void;

  // 4. Realtime Subscription
  // Gap Detection: Check if incoming bar time > lastBarTime + period. 
  // If Gap > Threshold -> Call onResetCacheNeededCallback.
  subscribeBars(
    symbolInfo: LibrarySymbolInfo, 
    resolution: string, 
    onRealtimeCallback: (bar: Bar) => void, 
    listenerGuid: string, 
    onResetCacheNeededCallback: () => void
  ): void;
}

================================================================================
2. CONTROLLER LAYER (The Hard API)
================================================================================
The `ChartWidget` is a non-React orchestration class that manages the LWC instance and its tools.
It prevents the usage of generic "God Object" patterns by enforcing a strict API.

CLASS: ChartWidget
--------------------------------------------------------------------------------
class ChartWidget implements IChartWidgetApi {
    private _chart: IChartApi;
    private _series: ISeriesApi<SeriesType>;
    private _shapeManager: ShapeManager;
    private _data: any[] = [];
    private _currentTimeframe: string;

    /**
     * @param chart - The Lightweight Chart API Instance
     * @param series - The Main Series (Candlestick) to attach tools to
     */
    constructor(chart: IChartApi, series: ISeriesApi<SeriesType>);

    // --- State Management ---
    /**
     * Updates the internal timeframe state.
     * Propagates change to all registered tools (e.g. for magnet acceleration).
     */
    public setTimeframe(tf: string): void;

    /**
     * Pushes new generic data (candles) to the widget generic store.
     * Propagates to all tools that need data context (e.g. Magnets).
     */
    public setSeriesData(data: any[]): void;

    /**
     * Efficiently updates the last price on all tools (e.g. valid/invalid coloring).
     */
    public updateLastPrice(price: number, time: number): void;

    // --- Factory ---
    /**
     * The ONLY way to create tools.
     * Switches on `options.shape` to instantiate specific Logic/Adapters.
     */
    public async createShape(point: TimePoint, options: CreateShapeOptions): Promise<EntityId>;

    // --- Interaction ---
    /**
     * Reverse Z-Index hit testing.
     * iterates _shapeManager.getAll() from end to start.
     */
    public hitTest(x: number, y: number): IChartShape | null;
    
    // --- Persistence ---
    public serializeDrawings(): string;
    public hydrateDrawings(json: string): void;
}

CLASS: ShapeManager
--------------------------------------------------------------------------------
Responsible for storing, hitting, and rendering active tools.

class ShapeManager {
  private _shapes: IShape[] = [];
  register(shape: IShape): void;
  unregister(id: string): void;
  hitTest(x: number, y: number): IShape | null;
  requestUpdate(): void; 
}

================================================================================
3. LWC PRIMITIVES ARCHITECTURE (The Triad)
================================================================================
CRITICAL: All Drawing Tools must use LWC Custom Primitives (Canvas), NOT React DOM.

Pattern: The "Primitive Triad"
For every tool (e.g., TrendLine), you must generate 3 classes:

1. The Data Model (TrendLine.ts): Implements `ISeriesPrimitive<TimePoint>`
2. The View (TrendLinePaneView.ts): Implements `ISeriesPrimitivePaneView`
3. The Renderer (TrendLineRenderer.ts): Implements `ISeriesPrimitivePaneRenderer` (Canvas Logic)

================================================================================
4. GHOST BARS (The Snowplow Architecture)
================================================================================
Objective: Infinite future scrolling.
Logic: `generatePhantomBars(startTime, count)` creates transparent bars. `onRealtimeCallback` detects end-of-horizon and appends more phantom bars to push the x-axis forward.

================================================================================
5. DRAWING STATE MACHINE
================================================================================
States: IDLE -> AWAITING_POINT_A -> AWAITING_POINT_B -> IDLE (or SELECTED).
Workflow: Toolbar Click -> Chart Click 1 (Anchor A) -> Mouse Move (Rubber Band) -> Chart Click 2 (Anchor B) -> IDLE.

================================================================================
6. COMPONENT ARCHITECTURE (React Integration)
================================================================================
Decoupling of Layout, Pane, and Chart.

## 6.1 LayoutGrid (The Grid Controller)
- **Responsibility**: pure layout rendering using `react-resizable-panels`.
- **Props**: `{ activeWorkspace: Workspace, botId: string, accounts: any[] }`
- **Logic**:
  - Uses `PanelGroup` and `Panel` to create resizable layouts.
  - Supports `single`, `split-vertical`, `split-horizontal`, `grid-2x2`, and `grid-1-2` via nested PanelGroups.
  - Implements `DraggableGutter` for visual resize handles.
  - **State**: Binds `onLayout` callbacks to `updateLayoutSizes` in the store to persist panel percentages.
  - **Key Prop**: Uses `panes[index]` to map store panes to layout slots.

## 6.2 ChartPane (The Injector)
- **Responsibility**: Connects the generic `ChartContainer` to the specific `PaneConfig`.
- **Props**: `{ pane: PaneConfig, workspaceId: string, ... }`
- **Logic**:
  - Extracts `symbol` and `timeframe` from `pane`.
  - Handles `onClick` to call `setActivePane`.
  - Passes specific callbacks that update the *specific* pane in the store.
  - Wraps the chart in a generic border/container (Active State Styling).

## 6.3 ChartContainer (The Canvas Wrapper)
- **Responsibility**: React wrapper for the `createChart` / `ChartWidget`.
- **LifeCycle**:
  - `useEffect` (Mount): Instantiates `ChartWidget`.
  - `useEffect` (Data): Calls `widget.setSeriesData(data)`.
  - `useImperativeHandle`: Exposes `updateCandle` for high-frequency updates.
  - **Visual Directive**: The OHLC label container must be positioned `top: 40px` (approx) to clear the `ChartOverlay`.

## 6.4 ChartOverlay (The Heads-Up Display)
- **Responsibility**: Render "Display-Only" state (Symbol/TF text) and "Interactive" state (Drop-downs) on hover.
- **Location**: Rendered inside `ChartPane`, absolutely positioned over `ChartContainer`.
- **Props Interface**:
  ```typescript
  interface ChartOverlayProps {
      symbol: string;
      timeframe: string;
      timezone: string; // "America/New_York"
      
      onSymbolChange: (s: string) => void;
      onTimeframeChange: (tf: string) => void;
      onTimezoneChange: (tz: string) => void;
  }
  ```
- **State**: Manages internal `isHovered` bool.
- **Interaction**:
  - `MouseEnter` -> Expand to full controls.
  - `MouseLeave` -> Collapse to simple text.

================================================================================
7. TROUBLESHOOTING & DEVELOPMENT RITUALS
================================================================================
"The Registration Ritual": When adding a new Tool:
1. Define State Interface.
2. Create Tool Class, PaneView, Renderer.
3. Register in `ChartWidget.createShape` switch-case.

================================================================================
8. WORKSPACE & DATA MODEL (Source of Truth)
================================================================================

## 8.1 Store Structure (useWorkspaceStore)
interface WorkspaceStore {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    
    // Actions
    addWorkspace(name: string): void;
    removeWorkspace(id: string): void;
    setActiveWorkspace(id: string): void;
    
    // Layout Actions
    // Converting layoutType automatically adjusts the `panes` array (add/slice).
    updateWorkspaceLayout(workspaceId: string, layout: LayoutType): void;
    updateLayoutSizes(workspaceId: string, sizes: number[]): void;
    
    // Pane Actions (The only way to modify a specific chart)
    updatePane(workspaceId: string, paneId: string, updates: Partial<PaneConfig>): void;
    setActivePane(workspaceId: string, paneId: string): void;
}

interface Workspace {
    id: string;          // UUID
    name: string;        // "Scalping" | "Swing"
    layoutType: LayoutType;
    layoutSizes: number[]; // Array of percentages (e.g. [50, 50])
    panes: PaneConfig[]; // Dynamic array based on layout
}

type LayoutType = 'single' | 'split-vertical' | 'split-horizontal' | 'grid-2x2' | 'grid-1-2';

interface PaneConfig {
    id: string;          // UUID (Must persist across layout changes if possible)
    symbol: string;      // "EURUSD"
    timeframe: string;   // "M5"
    isActive: boolean;   // Focus state (for keyboard inputs)
}

================================================================================
9. UI TRANSFORMATION RULES
================================================================================

## 9.1 Header Migration (Global -> Local)
- **New World (Multi-Pane)**: 
  - **Heads-Up Display (HUD)**: Controls are overlaid on the canvas (see `ChartOverlay`).
  - **The Header is Abolished**: To save vertical pixels, the traditional top bar is removed.
  - **Rule**: Controls that affect `PaneConfig` (Symbol/TF) MUST live inside `ChartOverlay`. 
  - **Exception**: "Timezone" is now also part of the Overlay for quick access.

## 9.2 Focus Management
- A Pane becomes `active` via `setActivePane`.
- **Visual Feedback**: Blue Border / Glow.
- **Keyboard Shortcuts**: Global listeners must check `activePaneId` before executing actions (e.g. creating drawing tools) on the corresponding `ChartWidget`.

================================================================================
10. DATA FLOW (The Cycle)
================================================================================
1. **User Action**: clicks "Split Vertical".
2. **Store**: `updateWorkspaceLayout` -> updates `panes` array.
3. **React**: `LayoutGrid` renders 2 `ChartPane` instances.
4. **Mount**: New `ChartPane` initializes `useChartData` hook with its specific `pane.symbol`.
5. **Fetch**: Hook calls Backend (History).
6. **Render**: `ChartPane` renders `ChartContainer`.
7. **Init**: `ChartContainer` creates `ChartWidget`.
8. **Update**: `ChartWidget` receives data via `setSeriesData`.
9. **Streaming**: `useChartData` subscribes to Socket -> updates `handleTick` -> `ChartContainer` -> `ChartWidget`.
