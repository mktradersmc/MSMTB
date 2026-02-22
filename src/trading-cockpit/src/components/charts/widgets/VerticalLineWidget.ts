import { InteractiveChartObject, Handle } from './InteractiveChartObject';
import { Point } from './types';
import { AnchorInfo } from './MagnetService';
import { Time } from 'lightweight-charts';

export interface VerticalLineState {
    time: number;
    price: number; // For handle positioning along the line
    color: string;
    width: number;
    lineStyle: number; // 0=Solid, 1=Dotted, 2=Dashed, etc.
    showLabel: boolean;
    fixed: boolean;
    anchor?: AnchorInfo | null;
}

export class VerticalLineWidget extends InteractiveChartObject {
    private _data: VerticalLineState;

    constructor(initialData: VerticalLineState) {
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
                // axisLock: 'horizontal_only', // Ideally we want to lock Y (Price) so handle stays put? 
                // But dragging free allows user to position handle where they want on the line.
                axisLock: 'free',
                cursor: 'ew-resize' // East-West resize
            }
        ];
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        if (handleId === 'body' || handleId === 'drag') {
            this._data.time = newPoint.time;
            this._data.price = newPoint.price; // Update handle vertical position too
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const x = timeScale.timeToCoordinate(this._data.time as Time);

        if (x === null) return;

        const height = ctx.canvas.height; // Screen height

        ctx.save();
        ctx.beginPath();

        // Set Styles
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;

        // Line Pattern
        if (this._data.lineStyle === 1) ctx.setLineDash([2, 2]);
        else if (this._data.lineStyle === 2) ctx.setLineDash([6, 6]);
        else ctx.setLineDash([]);

        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Label at bottom or top? Horizontal line has it on right axis.
        // Vertical line logic often has date at bottom.
        // But lightweight-charts handles date axis.
        // Maybe we just draw a small text near the top?
        if (this._data.showLabel) {
            const dateStr = new Date(this._data.time * 1000).toLocaleDateString();
            ctx.font = '11px sans-serif';
            ctx.fillStyle = this._data.color;
            ctx.fillText(dateStr, x + 5, 20); // 20px from top
        }

        ctx.restore();
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._chart) return false;

        const timeScale = this._chart.timeScale();
        const x = timeScale.timeToCoordinate(this._data.time as Time);

        if (x === null) return false;

        const tolerance = 6 + (this._data.width / 2);
        return Math.abs(point.x - x) <= tolerance;
    }

    public getSettingsSchema(): import('./InteractiveChartObject').SettingField[] {
        return [
            { id: 'color', label: 'Color', type: 'color', value: this._data.color },
            { id: 'width', label: 'Width', type: 'number', value: this._data.width },
            { id: 'showLabel', label: 'Show Date Label', type: 'boolean', value: this._data.showLabel },
        ];
    }

    public applySettings(settings: any): void {
        this._data = { ...this._data, ...settings };
        this._requestUpdate?.();
    }

    public getData() { return this._data; }
}
