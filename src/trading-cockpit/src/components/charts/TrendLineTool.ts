import {
    Coordinate,
    SeriesType,
    ISeriesApi,
    Time
} from 'lightweight-charts';
import { BaseWidget, WidgetState } from './widgets/BaseWidget';
import { AnchorInfo } from './widgets/MagnetService';
import { Point, Anchor } from './widgets/types';

export interface TrendLineState {
    p1: { time: number; price: number };
    p2: { time: number; price: number };
    color?: string;
    width?: number;
}

export class TrendLineTool extends BaseWidget<TrendLineState> {
    private _p1Coords: Point | null = null;
    private _p2Coords: Point | null = null;

    constructor(initialState: TrendLineState) {
        super(initialState);
    }

    public getData(): TrendLineState {
        return this._data;
    }

    public updateGeometry(timeScale: any, series: ISeriesApi<SeriesType>): void {
        const { p1, p2 } = this._data;

        const x1 = timeScale.timeToCoordinate(p1.time as Time);
        const y1 = series.priceToCoordinate(p1.price);
        const x2 = timeScale.timeToCoordinate(p2.time as Time);
        const y2 = series.priceToCoordinate(p2.price);

        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            this._p1Coords = { x: x1, y: y1 };
            this._p2Coords = { x: x2, y: y2 };

            this.setAnchors([
                { id: 'p1', x: x1, y: y1, color: this._data.color || '#2962FF', cursor: 'move', axisLock: 'free' },
                { id: 'p2', x: x2, y: y2, color: this._data.color || '#2962FF', cursor: 'move', axisLock: 'free' }
            ]);
        } else {
            this._p1Coords = null;
            this._p2Coords = null;
            this.setAnchors([]);
        }
    }

    public drawBody(ctx: CanvasRenderingContext2D): void {
        if (!this._p1Coords || !this._p2Coords) return;

        ctx.beginPath();
        ctx.moveTo(this._p1Coords.x, this._p1Coords.y);
        ctx.lineTo(this._p2Coords.x, this._p2Coords.y);

        ctx.strokeStyle = this._data.color || '#2962FF';
        ctx.lineWidth = this._data.width || 2;

        if (this._state === WidgetState.Hover || this._state === WidgetState.Selected) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = ctx.strokeStyle;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._p1Coords || !this._p2Coords) return false;

        // Distance from point to line segment
        const dist = this._distToSegment(point, this._p1Coords, this._p2Coords);
        return dist < 6; // 6px tolerance
    }

    protected applyDrag(target: string, newPoint: Point): void {
        const series = this.getSeries();
        const timeScale = this.getChart()?.timeScale();
        if (!series || !timeScale) return;

        const newPrice = series.coordinateToPrice(newPoint.y);
        const newTime = timeScale.coordinateToTime(newPoint.x);

        if (newPrice === null || newTime === null) return;

        if (target === 'p1') {
            this._data.p1.price = newPrice;
            this._data.p1.time = newTime as number;
        } else if (target === 'p2') {
            this._data.p2.price = newPrice;
            this._data.p2.time = newTime as number;
        } else if (target === 'body') {
            // Move both points by delta
            if (!this._p1Coords || !this._p2Coords) return;

            // We need the drag start delta in world coordinates or logic here
            // But applyDrag receives the current mouse point.
            // Simplified: calculate delta from previous p1/p2 (which is what BaseWidget does via this._dragStartPoint)
            // Wait, BaseWidget's onMouseMove calculates the newPoint.
            // Let's use the delta from the start of the drag.

            // I'll need to store the initial state at drag start if I want perfect delta movement.
            // BaseWidget doesn't pass Delta.
            // I'll calculate it against the current data.
            // NOTE: This might accumulate error if done per frame with logical time.
            // Standard approach: calculate delta in pixels, then back to price/time.

            // Since this is called every frame, moving by "delta from entryPrice" (newPrice - oldEntry) is correct.
            const deltaPrice = newPrice - (target === 'body' ? series.coordinateToPrice(this._dragStartPoint!.y)! : 0); // Simplified for now
            // Actually, let's just use the current point difference.

            // To do this correctly, I need the "last" point.
            // I'll just shift p1 and p2 by the same logical delta.
            const priceP1 = series.coordinateToPrice(newPoint.y);
            const timeP1 = timeScale.coordinateToTime(newPoint.x);

            // BETTER: BaseWidget should probably support "dragBody" better.
            // For now, I'll calculate the delta between newPoint and the point that was clicked (body hit).
            // But wait, applyDrag is generic.

            // Let's use a simpler approach: 
            // If dragging body, calculate how much price/time changed since start of drag.
            const startPrice = series.coordinateToPrice(this._dragStartPoint!.y);
            const startTime = timeScale.coordinateToTime(this._dragStartPoint!.x);

            if (startPrice !== null && startTime !== null) {
                const dPrice = newPrice - startPrice;
                const dTime = (newTime as number) - (startTime as number);

                // We use a backup of the points at drag start to avoid accumulation
                // For now, I'll just apply it once? No, this is called every frame.
                // I'll add a temporary "dragStartData" if I can, or just accept the logic.

                // Let's assume the user wants simple "move all" logic.
                // For TrendLine, "move all" means shifting both points.
                // I'll store the 'originalP1' and 'originalP2' in a temporary field if possible.
                // Or I use the delta since last call.

                // Direct implementation:
                this._data.p1.price += dPrice;
                this._data.p1.time += dTime;
                this._data.p2.price += dPrice;
                this._data.p2.time += dTime;

                // IMPORTANT: Reset dragStartPoint to current so next frame delta is relative to this one.
                // This prevents exponential growth if we don't have "original" backup.
                this._dragStartPoint = { ...newPoint };
            }
        }
    }

    private _distToSegment(p: Point, v: Point, w: Point): number {
        const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
        if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
    }
}
