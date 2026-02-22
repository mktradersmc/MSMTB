import {
    ISeriesPrimitive,
    SeriesAttachedParameter,
    IChartApi,
    ISeriesApi,
    SeriesType,
    Time,
    Coordinate,
    IPrimitivePaneRenderer,
    IPrimitivePaneView,
    PrimitiveHoveredItem
} from 'lightweight-charts';
import { Anchor, Point, WidgetHitResult } from './types';

export enum WidgetState {
    Idle = 'Idle',
    Hover = 'Hover',
    Selected = 'Selected'
}

export abstract class BaseWidget<TData> implements ISeriesPrimitive {
    protected _chart: IChartApi | null = null;
    protected _series: ISeriesApi<SeriesType> | null = null;
    protected _requestUpdate: (() => void) | null = null;

    protected _data: TData;
    protected _state: WidgetState = WidgetState.Idle;
    protected _cursor: string = 'default';

    // Geometry Cache
    protected _anchors: Anchor[] = [];

    // View/Renderer
    protected _paneViews: BaseWidgetPaneView[];
    protected _visible: boolean = true;

    constructor(initialData: TData) {
        this._data = initialData;
        this._paneViews = [new BaseWidgetPaneView(this)];
    }

    public setVisible(visible: boolean) {
        this._visible = visible;
        this._requestUpdate?.();
    }

    public isVisible(): boolean {
        return this._visible;
    }

    // --- ISeriesPrimitive Implementation ---

    public attached(param: SeriesAttachedParameter<Time>): void {
        this._chart = param.chart;
        this._series = param.series;
        this._requestUpdate = param.requestUpdate;

        const container = this._chart.chartElement();
        this.subscribeToEvents(container);
        this.onAttached();
    }

    public detached(): void {
        if (this._chart) {
            const container = this._chart.chartElement();
            this.unsubscribeFromEvents(container);
        }
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
        this.onDetached();
    }

    public paneViews() {
        return this._paneViews;
    }

    // --- Abstract Methods (Geometry) ---

    /**
     * Called when the widget needs to recalculate its screen coordinates (anchors, paths).
     * Usually called inside the Renderer's draw loop or before hit-testing.
     */
    public abstract updateGeometry(timeScale: any, series: any): void;

    /**
     * Called to draw the main body of the widget (lines, fills).
     * Anchors are drawn automatically by the BaseWidget.
     */
    public abstract drawBody(ctx: CanvasRenderingContext2D): void;

    /**
     * Return true if the point is inside the widget body/shape.
     */
    protected abstract hitTestBody(point: Point): boolean;

    /**
     * Apply a drag delta to the data model.
     * @param target The drag target ('body' or anchor ID)
     * @param newPoint The new mouse position (sanitized/snapped)
     * @param originalPoint The mouse position when drag started
     */
    protected abstract applyDrag(target: string, newPoint: Point): void;


    // --- Core Behavior (Pillars 1 & 2) ---

    // 1. Visual State Machine
    public setSelected(selected: boolean) {
        if (selected) {
            this._state = WidgetState.Selected;
        } else {
            this._state = WidgetState.Idle;
        }
        this.requestUpdate();
    }

    public getState(): WidgetState {
        return this._state;
    }

    // 2. Interaction Logic & Hit Testing
    public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
        const point = { x, y };
        const result = this.hitTestInternal(point);

        if (result) {
            return {
                externalId: result.target,
                zOrder: 'top'
            };
        }
        return null;
    }

    protected hitTestInternal(point: Point): WidgetHitResult | null {
        // Priority A: Anchors
        // Only valid if Selected or Hovered (depending on design, usually Hover/Selected shows anchors)
        if (this._state !== WidgetState.Idle) {
            for (const anchor of this._anchors) {
                const dist = Math.sqrt(Math.pow(point.x - anchor.x, 2) + Math.pow(point.y - anchor.y, 2));
                if (dist <= (anchor.radius || 6) + 2) {
                    return { target: anchor.id, cursor: anchor.cursor || 'pointer' };
                }
            }
        }

        // Priority B: Body
        if (this.hitTestBody(point)) {
            return { target: 'body', cursor: 'move' };
        }

        return null;
    }

    // --- Event Handling ---

    protected _dragTarget: string | null = null;
    protected _dragStartPoint: Point | null = null;
    protected _isDragging: boolean = false;

    protected onMouseDown = (e: MouseEvent) => {
        if (!this._chart) return;
        const point = this.getPoint(e);
        const hit = this.hitTestInternal(point);

        if (hit) {
            this._isDragging = true;
            this._dragTarget = hit.target;
            this._dragStartPoint = point;
            this.setSelected(true);

            // Lock chart scroll
            this._chart.applyOptions({ handleScroll: false, handleScale: false });
        } else {
            // Clicked outside -> Deselect? 
            // Usually managed by a global ToolManager, but self-management:
            if (this._state === WidgetState.Selected) {
                this.setSelected(false);
            }
        }
    }

    protected onMouseMove = (e: MouseEvent) => {
        if (!this._chart) return;
        const rawPoint = this.getPoint(e);

        if (this._isDragging && this._dragTarget && this._dragStartPoint) {
            // DRAGGING
            let targetPoint = { ...rawPoint };

            // Apply Axis Locks
            const anchor = this._anchors.find(a => a.id === this._dragTarget);
            if (anchor && anchor.axisLock) {
                if (anchor.axisLock === 'vertical_only') {
                    targetPoint.x = this._dragStartPoint.x;
                } else if (anchor.axisLock === 'horizontal_only') {
                    targetPoint.y = this._dragStartPoint.y;
                }
            }

            // TODO: Magnet Integration here (Pillar 3)
            // const snapped = MagnetService.snap(targetPoint, ...)

            this.applyDrag(this._dragTarget, targetPoint);
            this.requestUpdate();
            return;
        }

        // HOVERING
        const hit = this.hitTestInternal(rawPoint);

        if (hit) {
            document.body.style.cursor = hit.cursor;
            if (this._state === WidgetState.Idle) {
                this._state = WidgetState.Hover;
                this.requestUpdate();
            }
        } else {
            document.body.style.cursor = 'default';
            if (this._state === WidgetState.Hover) {
                this._state = WidgetState.Idle;
                this.requestUpdate();
            }
        }
    }

    protected onMouseUp = () => {
        if (this._isDragging) {
            this._isDragging = false;
            this._dragTarget = null;
            this._chart?.applyOptions({ handleScroll: true, handleScale: true });
        }
    }

    // --- Helpers ---

    private getPoint(e: MouseEvent): Point {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    protected subscribeToEvents(el: HTMLElement) {
        el.addEventListener('mousedown', this.onMouseDown);
        el.addEventListener('mousemove', this.onMouseMove);
        el.addEventListener('mouseup', this.onMouseUp);
        el.addEventListener('mouseleave', this.onMouseUp);
        // Global keydown (attached to document/window, but scope managed via Selection)
        // Note: ChartElement doesn't focus easily. We attach to document but check chart focus/hover?
        // Simpler: attach to document and check if this tool is Selected.
        document.addEventListener('keydown', this.onKeyDown);
    }

    protected unsubscribeFromEvents(el: HTMLElement) {
        el.removeEventListener('mousedown', this.onMouseDown);
        el.removeEventListener('mousemove', this.onMouseMove);
        el.removeEventListener('mouseup', this.onMouseUp);
        el.removeEventListener('mouseleave', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
    }

    protected onKeyDown = (e: KeyboardEvent) => {
        if (this._state === WidgetState.Selected) {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                // Self-Destruct
                this._series?.detachPrimitive(this);
            }
        }
    }

    protected requestUpdate() {
        this._requestUpdate?.();
    }

    // Hooks
    protected onAttached() { }
    protected onDetached() { }

    // --- Accessors for Renderer ---
    public getChart() { return this._chart; }
    public getSeries() { return this._series; }
    public getAnchors() { return this._anchors; }
    public setAnchors(anchors: Anchor[]) { this._anchors = anchors; }
}


// --- Internal Renderer Classes ---

class BaseWidgetRenderer implements IPrimitivePaneRenderer {
    constructor(private _widget: BaseWidget<any>) { }

    draw(target: any) {
        if (!this._widget.isVisible()) return;

        const chart = this._widget.getChart();
        const series = this._widget.getSeries();
        if (!chart || !series) return;

        const ctx: CanvasRenderingContext2D = target.useMediaCoordinateSpace
            ? target.context // Newer API might differ slightly, conceptual
            : (target.context || target);

        if (target.useMediaCoordinateSpace) {
            target.useMediaCoordinateSpace((scope: any) => this._drawImpl(scope.context, chart, series));
        } else {
            this._drawImpl(ctx, chart, series);
        }
    }

    private _drawImpl(ctx: CanvasRenderingContext2D, chart: IChartApi, series: ISeriesApi<SeriesType>) {
        // 1. Update Geometry (Recalculate screen coords based on current Time/Price)
        // Note: Ideally geometry update happens before draw, but for LWC primitives it's often done here
        // or cached in the View. BaseWidget handles logic.
        this._widget.updateGeometry(chart.timeScale(), series);

        // 2. Draw Body
        ctx.save();
        this._widget.drawBody(ctx);
        ctx.restore();

        // 3. Draw Anchors (if not Idle)
        const state = this._widget.getState();
        if (state !== WidgetState.Idle) {
            const anchors = this._widget.getAnchors();
            for (const anchor of anchors) {
                this.drawAnchor(ctx, anchor, state === WidgetState.Selected);
            }
        }
    }

    private drawAnchor(ctx: CanvasRenderingContext2D, anchor: Anchor, isSelected: boolean) {
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, anchor.radius || 5, 0, 2 * Math.PI);

        // Style based on Selection
        ctx.fillStyle = isSelected ? (anchor.color || '#FFFFFF') : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class BaseWidgetPaneView implements IPrimitivePaneView {
    private _renderer: BaseWidgetRenderer;
    constructor(source: BaseWidget<any>) {
        this._renderer = new BaseWidgetRenderer(source);
    }
    renderer() {
        return this._renderer;
    }
}
