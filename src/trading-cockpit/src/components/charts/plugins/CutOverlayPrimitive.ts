import { BaseWidget } from '../widgets/BaseWidget';
import { Time } from 'lightweight-charts';

export interface CutOverlayState {
    hoverTime: number | null; // Unix Seconds
}

export class CutOverlayPrimitive extends BaseWidget<CutOverlayState> {
    constructor() {
        super({ hoverTime: null });
    }

    public updateHoverTime(time: number | null) {
        if (this._data.hoverTime !== time) {
            this._data.hoverTime = time;
            this.requestUpdate();
        }
    }

    protected hitTestBody(): boolean {
        return false;
    }

    protected applyDrag(): void { }

    public updateGeometry(): void { }

    drawBody(ctx: CanvasRenderingContext2D): void {
        const { hoverTime } = this._data;
        if (!this._chart || !this._series || hoverTime === null) return;

        const timeScale = this._chart.timeScale();
        const x = timeScale.timeToCoordinate(hoverTime as Time);

        if (x === null) return;

        const w = this._chart.timeScale().width();
        // In LWC v4, we can use an arbitrarily large height since it clips to the pane
        const h = 10000;

        // 1. Draw veil (transparent grey) over future
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fillRect(x, 0, w - x, h);

        // 2. Draw vertical blue line
        ctx.beginPath();
        ctx.strokeStyle = '#2962FF'; // TradingView Blue
        ctx.lineWidth = 2;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
}
