import { InteractiveChartObject, Handle } from './InteractiveChartObject';
import { Point } from './types';
import { AnchorInfo } from './MagnetService';
import { Time } from 'lightweight-charts';

export interface HorizontalRayState {
    time: number;
    price: number;
    color: string;
    width: number;
    anchor?: AnchorInfo | null;
}

export class HorizontalRayWidget extends InteractiveChartObject {
    private _data: HorizontalRayState;

    constructor(initialData: HorizontalRayState) {
        super();
        this._data = initialData;
        this._timeframe = initialData.anchor?.timeframe || 'D1';
    }

    public getHandles(): Handle[] {
        return [
            {
                id: 'anchor',
                time: this._data.time,
                price: this._data.price,
                axisLock: 'free',
                cursor: 'move'
            }
        ];
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        if (handleId === 'anchor' || handleId === 'body') {
            this._data.time = newPoint.time;
            this._data.price = newPoint.price;
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const series = this._series;

        const x = this.getSafeTimeCoordinate(this._data.time);
        const y = series.priceToCoordinate(this._data.price);

        if (x === null || y === null) return;

        const width = ctx.canvas.width; // Draw to end of canvas

        ctx.save();
        ctx.beginPath();

        // Style
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;

        ctx.moveTo(x, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.restore();
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._series || !this._chart) return false;

        const timeScale = this._chart.timeScale();
        const x = this.getSafeTimeCoordinate(this._data.time);
        const y = this._series.priceToCoordinate(this._data.price);

        if (x === null || y === null) return false;

        const tolerance = 6 + (this._data.width / 2);

        // Ray logic: y must match AND x must be >= startX
        return Math.abs(point.y - y) <= tolerance && point.x >= x;
    }

    public getSettingsSchema(): import('./InteractiveChartObject').SettingField[] {
        return [
            { id: 'color', label: 'Color', type: 'color', value: this._data.color },
            { id: 'width', label: 'Width', type: 'number', value: this._data.width },
        ];
    }

    public applySettings(settings: any): void {
        this._data = { ...this._data, ...settings };
        this._requestUpdate?.();
    }

    public getData() { return this._data; }
}
