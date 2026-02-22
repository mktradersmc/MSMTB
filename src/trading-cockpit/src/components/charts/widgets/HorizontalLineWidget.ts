import { InteractiveChartObject, Handle } from './InteractiveChartObject';
import { Point } from './types';
import { AnchorInfo } from './MagnetService';
import { Time } from 'lightweight-charts';

export interface HorizontalLineState {
    price: number;
    time: number; // For handle positioning
    color: string;
    width: number;
    lineStyle: number; // 0=Solid, 1=Dotted, 2=Dashed, etc.
    showLabel: boolean;
    fixed: boolean;
    anchor?: AnchorInfo | null;
}

export class HorizontalLineWidget extends InteractiveChartObject {
    private _data: HorizontalLineState;

    constructor(initialData: HorizontalLineState) {
        super();
        this._data = initialData;
        this._timeframe = initialData.anchor?.timeframe || 'D1';
    }

    public getHandles(): Handle[] {
        return [
            {
                id: 'drag',
                time: this._data.time,
                price: this._data.price,
                axisLock: 'free', // Allow unrestricted movement of the handle itself?
                // Actually, if we want the line to only move vertically, we should lock vertical_only?
                // But user might want to slide the handle left/right to move it out of the way.
                // Let's use 'free' so the handle follows mouse, and we update price/time.
                cursor: 'move'
            }
        ];
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        if (handleId === 'body' || handleId === 'drag') {
            this._data.price = newPoint.price;
            this._data.time = newPoint.time; // Update handle position
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const series = this._series;
        const y = series.priceToCoordinate(this._data.price);

        if (y === null) return;

        const width = ctx.canvas.width; // Approx screen width

        ctx.save();
        ctx.beginPath();

        // Set Styles
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;

        // Line Pattern
        // LWC LineStyle: 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed, 4=SparseDotted
        if (this._data.lineStyle === 1) ctx.setLineDash([2, 2]);
        else if (this._data.lineStyle === 2) ctx.setLineDash([6, 6]);
        else ctx.setLineDash([]);

        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Label on Right Axis (Simulated)
        if (this._data.showLabel) {
            const text = series.priceFormatter().format(this._data.price);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = this._data.color;
            ctx.fillText(text, width - 60, y - 4);
        }

        ctx.restore();
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._series) return false;
        const y = this._series.priceToCoordinate(this._data.price);
        if (y === null) return false;

        const tolerance = 6 + (this._data.width / 2);
        return Math.abs(point.y - y) <= tolerance;
    }

    public getSettingsSchema(): import('./InteractiveChartObject').SettingField[] {
        return [
            { id: 'color', label: 'Color', type: 'color', value: this._data.color },
            { id: 'width', label: 'Width', type: 'number', value: this._data.width },
            { id: 'showLabel', label: 'Show Price Label', type: 'boolean', value: this._data.showLabel },
        ];
    }

    public applySettings(settings: any): void {
        this._data = { ...this._data, ...settings };
        this._requestUpdate?.();
    }

    public getData() { return this._data; }

    // Override manual double click to perhaps lock/unlock? 
    // Default behavior is acceptable for now.
}
