import { IChartWidgetApi, CreateShapeOptions, TimePoint, EntityId, IChartShape } from './api';
import { ShapeManager } from './ShapeManager';
import { LongShortPositionAdapter } from './adapters/LongShortPositionAdapter';
import { TrendLineAdapter } from './adapters/TrendLineAdapter';
import { HorizontalLineAdapter } from './adapters/HorizontalLineAdapter';
import { HorizontalRayAdapter } from './adapters/HorizontalRayAdapter';
import { LongShortPosition, LongShortState } from '../LongShortPosition';
import { TrendLineTool, TrendLineState } from '../TrendLineTool';
import { HorizontalLineWidget, HorizontalLineState } from './HorizontalLineWidget';
import { HorizontalRayWidget, HorizontalRayState } from './HorizontalRayWidget';
import { VerticalLineAdapter } from './adapters/VerticalLineAdapter';
import { VerticalLineWidget, VerticalLineState } from './VerticalLineWidget';
import { ActivePositionTool, ActivePositionState } from '../ActivePositionTool';
import { ActivePositionAdapter } from './adapters/ActivePositionAdapter';
import { TradeBuilderPosition, TradeBuilderState } from '../TradeBuilderPosition';
import { TradeBuilderAdapter } from './adapters/TradeBuilderAdapter';
import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';

export class ChartWidget implements IChartWidgetApi {
    private _chart: IChartApi;
    private _series: ISeriesApi<SeriesType>;
    private _shapeManager: ShapeManager;
    private _symbol: string = 'UNKNOWN';

    private _data: any[] = [];
    public readonly id: string; // Public for verification

    constructor(id: string, chart: IChartApi, series: ISeriesApi<SeriesType>) {
        this.id = id;
        this._chart = chart;
        this._series = series;
        this._shapeManager = new ShapeManager();
    }

    public setSymbol(symbol: string) {
        this._symbol = symbol;
    }

    private _currentTimeframe: string = 'D1';

    // --- Factory Method ---
    public async createShape(point: TimePoint, options: CreateShapeOptions & { restoreState?: any }): Promise<EntityId> {
        let shape: IChartShape | null = null;
        let primitive: any = null;

        if (options.shape === 'Riskrewardlong' || options.shape === 'Riskrewardshort') {
            const isLong = options.shape === 'Riskrewardlong';

            let initialState: LongShortState;

            if (options.restoreState) {
                initialState = options.restoreState;
                if (!initialState.symbol) initialState.symbol = this._symbol;
            } else {
                const price = point.price;
                const spread = price * 0.0005;
                initialState = {
                    entryPrice: price,
                    stopLossPrice: isLong ? price - spread : price + spread,
                    takeProfitPrice: isLong ? price + (spread * 2) : price - (spread * 2),
                    timeIndex: point.time as number,
                    riskReward: 2.0,
                    fixedLeg: 'rr',
                    fixedStates: { tp: false, sl: false, entry: false, rr: true },
                    orderType: 'MARKET',
                    symbol: this._symbol
                };
            }

            // Apply overrides if any (and not restoring or force override)
            if (options.overrides && !options.restoreState) {
                const overrides = options.overrides as Record<string, any>;
                const prefix = isLong ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';

                if (typeof overrides[`${prefix}.stopLevel`] === 'number') initialState.stopLossPrice = overrides[`${prefix}.stopLevel`];
                if (typeof overrides[`${prefix}.profitLevel`] === 'number') initialState.takeProfitPrice = overrides[`${prefix}.profitLevel`];
                if (typeof overrides[`${prefix}.entryPrice`] === 'number') initialState.entryPrice = overrides[`${prefix}.entryPrice`];
                if (typeof overrides[`${prefix}.riskReward`] === 'number') initialState.riskReward = overrides[`${prefix}.riskReward`];
                if (typeof overrides[`${prefix}.fixedLeg`] === 'string') initialState.fixedLeg = overrides[`${prefix}.fixedLeg`] as any;

                if (typeof overrides[`${prefix}.lineColor`] === 'string') initialState.lineColor = overrides[`${prefix}.lineColor`];
                if (typeof overrides[`${prefix}.stopColor`] === 'string') initialState.stopColor = overrides[`${prefix}.stopColor`];
                if (typeof overrides[`${prefix}.profitColor`] === 'string') initialState.profitColor = overrides[`${prefix}.profitColor`];
                if (typeof overrides[`${prefix}.accountSize`] === 'number') initialState.accountSize = overrides[`${prefix}.accountSize`];
                if (typeof overrides[`${prefix}.riskSize`] === 'number') initialState.riskSize = overrides[`${prefix}.riskSize`];
                if (typeof overrides[`${prefix}.riskDisplayMode`] === 'string') initialState.riskDisplayMode = overrides[`${prefix}.riskDisplayMode`] as any;
                if (typeof overrides[`${prefix}.compact`] === 'boolean') initialState.compact = overrides[`${prefix}.compact`];
                if (typeof overrides[`${prefix}.symbol`] === 'string') initialState.symbol = overrides[`${prefix}.symbol`];
            }

            // Create Tool
            const tool = new LongShortPosition(initialState);

            // Set Selection if requested
            if (options.disableSelection) {
                // We might need a way to disable selection on the tool
                // tool.setSelectionEnabled(false); // TODO: Add to PositionTool
            }

            // Create Adapter
            shape = new LongShortPositionAdapter(tool, options.shape);
            primitive = tool;
            tool.setTimeframe(this._currentTimeframe);

        } else if (options.shape === 'trend_line') {
            // Note: The 'points' array is not directly available in createShape.
            // Assuming 'point' is the first point, and a second point might be added later
            // or this block is intended for createMultipointShape.
            // For now, we'll use 'point' for p1 and a default for p2.
            const p1 = point;
            const p2 = { time: p1.time, price: p1.price }; // Default second point same as first

            const initialState: TrendLineState = {
                p1: { ...p1, time: p1.time as number },
                p2: { ...p2, time: p2.time as number },
                color: (options.overrides as any)?.["linetooltrendline.linecolor"],
                width: (options.overrides as any)?.["linetooltrendline.linewidth"]
            };

            const tool = new TrendLineTool(initialState);
            shape = new TrendLineAdapter(tool);
            primitive = tool;
        } else if (options.shape === 'HorizontalLine') {
            const initialState: HorizontalLineState = {
                price: point.price,
                time: point.time as number,
                color: (options.overrides as any)?.["linetoolhorizontalline.linecolor"] || '#2962FF',
                width: (options.overrides as any)?.["linetoolhorizontalline.linewidth"] || 2, // Doubled default width
                lineStyle: 0,
                showLabel: true,
                fixed: false,
                anchor: (options.overrides as any)?.anchor
            };
            const tool = new HorizontalLineWidget(initialState);
            shape = new HorizontalLineAdapter(tool);
            primitive = tool;
        } else if (options.shape === 'HorizontalRay') {
            const initialState: HorizontalRayState = {
                time: point.time as number,
                price: point.price,
                color: (options.overrides as any)?.["linetoolhorizontalray.linecolor"] || '#2962FF',
                width: (options.overrides as any)?.["linetoolhorizontalray.linewidth"] || 2, // Doubled default width
                anchor: (options.overrides as any)?.anchor
            };
            const tool = new HorizontalRayWidget(initialState);
            shape = new HorizontalRayAdapter(tool);
            primitive = tool;
        } else if (options.shape === 'VerticalLine') {
            const initialState: VerticalLineState = {
                time: point.time as number,
                price: point.price,
                color: (options.overrides as any)?.["linetoolverticalline.linecolor"] || '#2962FF',
                width: (options.overrides as any)?.["linetoolverticalline.linewidth"] || 2,
                lineStyle: 0,
                showLabel: false, // Default to false for vertical line as date is on axis usually
                fixed: false,
                anchor: (options.overrides as any)?.anchor
            };
            const tool = new VerticalLineWidget(initialState);
            shape = new VerticalLineAdapter(tool);
            primitive = tool;
        } else if (options.shape === 'TradeBuilder') {
            let initialState: TradeBuilderState;

            if (options.restoreState) {
                initialState = options.restoreState;
                if (!initialState.symbol) initialState.symbol = this._symbol;
            } else {
                const price = point.price;
                const spread = price * 0.0005;
                initialState = {
                    entryPrice: price,
                    stopLossPrice: price - spread,
                    takeProfitPrice: price + (spread * 2),
                    timeIndex: point.time as number,
                    riskReward: 2.0,
                    fixedLeg: 'rr',
                    fixedStates: { tp: false, sl: false, entry: false, rr: true },
                    orderType: 'MARKET',
                    symbol: this._symbol
                };
            }

            if (options.overrides && !options.restoreState) {
                const overrides = options.overrides as Record<string, any>;
                const prefix = 'linetooltradebuilder';

                if (typeof overrides[`${prefix}.stopLevel`] === 'number') initialState.stopLossPrice = overrides[`${prefix}.stopLevel`];
                if (typeof overrides[`${prefix}.profitLevel`] === 'number') initialState.takeProfitPrice = overrides[`${prefix}.profitLevel`];
                if (typeof overrides[`${prefix}.entryPrice`] === 'number') initialState.entryPrice = overrides[`${prefix}.entryPrice`];
                if (typeof overrides[`${prefix}.riskReward`] === 'number') initialState.riskReward = overrides[`${prefix}.riskReward`];
                if (typeof overrides[`${prefix}.fixedLeg`] === 'string') initialState.fixedLeg = overrides[`${prefix}.fixedLeg`] as any;

                if (typeof overrides[`${prefix}.lineColor`] === 'string') initialState.lineColor = overrides[`${prefix}.lineColor`];
                if (typeof overrides[`${prefix}.stopColor`] === 'string') initialState.stopColor = overrides[`${prefix}.stopColor`];
                if (typeof overrides[`${prefix}.profitColor`] === 'string') initialState.profitColor = overrides[`${prefix}.profitColor`];
            }

            const tool = new TradeBuilderPosition(initialState);
            shape = new TradeBuilderAdapter(tool);
            primitive = tool;
            tool.setTimeframe(this._currentTimeframe);
        } else if (options.shape === 'ActivePosition') {
            // New Active Position Tool logic
            // Expect overrides to contain the full state
            const overrides = options.overrides as any;
            const initialState: ActivePositionState = {
                id: overrides.id || 'UNKNOWN',
                symbol: overrides.symbol || this._symbol,
                direction: overrides.direction || 'LONG',
                entryPrice: overrides.entryPrice || point.price,
                stopLossPrice: overrides.stopLossPrice,
                takeProfitPrice: overrides.takeProfitPrice,
                // visuals
                lineColor: overrides.lineColor || '#000000',
                stopColor: overrides.stopColor || 'rgba(239, 68, 68, 1)',
                profitColor: overrides.profitColor || 'rgba(16, 185, 129, 1)'
            };

            const tool = new ActivePositionTool(initialState);
            shape = new ActivePositionAdapter(tool);
            primitive = tool;
        }

        if (shape && primitive) {
            // Apply Data 
            if (this._data.length > 0 && typeof (primitive as any).setSeriesData === 'function') {
                (primitive as any).setSeriesData(this._data);
            }

            // Register
            this._shapeManager.register(shape);

            // Attach to Chart
            this._series.attachPrimitive(primitive);

            // Register execution listener for the UI to pick up
            if (shape instanceof LongShortPositionAdapter || shape instanceof TradeBuilderAdapter) {
                shape.onExecute = (trade) => {
                    this._shapeManager.emit('execute', { trade, id: shape?.id });
                };
            }

            // Register active trade action listener
            if (shape instanceof ActivePositionAdapter) {
                shape.onAction = (action, payload) => {
                    this._shapeManager.emit('trade_action', { tradeId: shape.id, action, payload });
                };
            }

            // Default Selection for new tools (UX Requirement: Visible handles on creation)
            if (shape && typeof shape.setSelection === 'function') {
                if (!options.restoreState) {
                    shape.setSelection(true);
                }
            }

            // Wire up deletion sync
            if (primitive && (primitive as any).onRemove === undefined) {
                // If not already defined (though we just defined it on the class)
                // We assign it here to control the flow
                (primitive as any).onRemove = () => {
                    if (shape) this.removeEntity(shape.id);
                };
            } else if (primitive) {
                // Force override to ensure it calls OUR removeEntity
                (primitive as any).onRemove = () => {
                    if (shape) this.removeEntity(shape.id);
                };
            }

            return shape.id;
        }

        throw new Error(`Unsupported shape type: ${options.shape}`);
    }

    public setTimeframe(tf: string) {
        this._currentTimeframe = tf;
        // Propagate to existing tools
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(s => {
            const p = s.getPrimitive();
            if (p && typeof (p as any).setTimeframe === 'function') {
                (p as any).setTimeframe(tf);
            }
        });
    }

    // --- Multipoint ---
    public async createMultipointShape(points: TimePoint[], options: CreateShapeOptions): Promise<EntityId> {
        let shape: IChartShape | null = null;
        let primitive: any = null;

        if (options.shape === 'trend_line') {
            const p1 = points[0] || { time: 0, price: 0 };
            const p2 = points[1] || { time: p1.time, price: p1.price };

            const initialState: TrendLineState = {
                p1: { ...p1, time: p1.time as number },
                p2: { ...p2, time: p2.time as number },
                color: (options.overrides as any)?.["linetooltrendline.linecolor"],
                width: (options.overrides as any)?.["linetooltrendline.linewidth"]
            };

            const tool = new TrendLineTool(initialState);
            shape = new TrendLineAdapter(tool);
            primitive = tool;
        }

        if (shape && primitive) {
            // Apply Data 
            if (this._data.length > 0 && typeof (primitive as any).setSeriesData === 'function') {
                (primitive as any).setSeriesData(this._data);
            }

            this._shapeManager.register(shape);
            this._series.attachPrimitive(primitive);
            return shape.id;
        }

        throw new Error(`Shape type ${options.shape} not supported in createMultipointShape`);
    }

    // --- Management ---
    public getAllShapes(): IChartShape[] {
        return this._shapeManager.getAll();
    }

    public getShapeById(id: EntityId): IChartShape | null {
        return this._shapeManager.get(id);
    }

    /**
     * Hit test for chart widgets.
     * Iterates in reverse order (top-most first) to find the clicked widget.
     */
    public hitTest(x: number, y: number): IChartShape | null {
        const shapes = this._shapeManager.getAll();
        // Iterate in reverse order (last added = drawn on top)
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            const primitive = shape.getPrimitive();

            // Check if the primitive has a hitTest method (it should if it inherits from InteractiveChartObject)
            if (primitive && typeof (primitive as any).hitTest === 'function') {
                const hit = (primitive as any).hitTest(x, y);
                if (hit) {
                    return shape;
                }
            }
        }
        return null;
    }

    public removeEntity(id: EntityId): void {
        const shape = this._shapeManager.get(id);
        if (shape) {
            // Generic Detach
            const primitive = shape.getPrimitive();
            if (primitive && this._series) {
                try {
                    this._series.detachPrimitive(primitive);
                } catch (e) {
                    console.warn(`[ChartWidget:${this.id}] Failed to detach primitive (Series likely disposed):`, e);
                }
            }

            this._shapeManager.unregister(id);
        }
    }

    public removeAllShapes(): void {
        this.detachAllPrimitives(); // Visual cleanup

        // Data cleanup
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(shape => {
            this._shapeManager.unregister(shape.id);
        });
    }

    /**
     * Detaches all primitives from the series (visual cleanup) but KEEPS them in the registry.
     * This allows saving their state even after the visuals are destroyed.
     */
    public detachAllPrimitives(): void {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(shape => {
            const primitive = shape.getPrimitive();
            if (primitive && this._series) {
                try {
                    this._series.detachPrimitive(primitive);
                } catch (e) {
                    console.warn(`[ChartWidget:${this.id}] Failed to detach primitive (Series likely disposed):`, e);
                }
            }
        });
    }

    public deselectAllShapes(): void {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(shape => {
            const primitive = shape.getPrimitive();
            if (primitive && typeof (primitive as any).setSelection === 'function') {
                (primitive as any).setSelection(false);
            }
            // Also handle base widget's setSelected if different
            if (primitive && typeof (primitive as any).setSelected === 'function') {
                (primitive as any).setSelected(false);
            }
        });
    }

    public setSeriesData(data: any[]): void {
        this._data = data;
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(shape => {
            const primitive = shape.getPrimitive();
            if (primitive && typeof (primitive as any).setSeriesData === 'function') {
                (primitive as any).setSeriesData(data);
            }
        });
    }

    public updateLastPrice(price: number, time: number): void {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach(shape => {
            const primitive = shape.getPrimitive();
            if (primitive && typeof (primitive as any).updateMarketPrice === 'function') {
                (primitive as any).updateMarketPrice(price, time);
            }
        });
    }

    // --- Events ---
    public subscribe(event: 'drawing', callback: (params: any) => void): void {
        this._shapeManager.subscribe(event, callback);
    }

    public unsubscribe(event: 'drawing', callback: (params: any) => void): void {
        this._shapeManager.unsubscribe(event, callback);
    }

    // --- Persistence ---
    public serializeDrawings(): string {
        const shapes = this._shapeManager.getAll();
        const serialized = shapes.map(shape => {
            const primitive = shape.getPrimitive();
            // Use getStorageState if available, fallback to empty or properties
            const state = (primitive as any).getStorageState ? (primitive as any).getStorageState() : {};
            return {
                id: shape.id,
                type: shape.name || (shape as any).type || 'unknown',
                state
            };
        });
        return JSON.stringify(serialized);
    }

    public hydrateDrawings(json: string): void {
        try {
            const shapes = JSON.parse(json);
            if (Array.isArray(shapes) && shapes.length > 0) {
                // We don't necessarily clear here because this might be additive hydration
                // or the caller manages cleanup.

                shapes.forEach((s: any) => {
                    // Detect if LongShort
                    if (s.type === 'Riskrewardlong' || s.type === 'Riskrewardshort') {
                        if (s.state) {
                            const point: TimePoint = {
                                time: s.state.timeIndex || 0,
                                price: s.state.entryPrice || 0
                            };
                            this.createShape(point, {
                                shape: s.type,
                                restoreState: s.state,
                                disableSelection: true // restore selection state? maybe
                            });
                        }
                    } else {
                        console.log(`[ChartWidget] Hydration for type ${s.type} not fully implemented yet.`);
                    }
                });
            }
        } catch (e) {
            console.error("Failed to hydrate drawings:", e);
        }
    }
    public dispose(): void {
        this.detachAllPrimitives(); // Only clear visuals, keep data for saving!
        // Nullify references to prevent further usage
        (this._chart as any) = null;
        (this._series as any) = null;
    }
}
