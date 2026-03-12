import { BaseWidget } from '../widgets/BaseWidget';
import { IChartApi, ISeriesApi, Time, Coordinate } from 'lightweight-charts';
import { Point } from '../widgets/types';

export interface DivergenceSettings {
    bullish_color: string;
    bearish_color: string;
    linewidth: number;
    show_MN1: boolean;
    show_W1: boolean;
    show_D1: boolean;
    show_H8: boolean;
    show_H4: boolean;
    show_H1: boolean;
}

export interface DivergenceItem {
    id: string;
    symbol: string;
    target_symbol: string;
    htf: string;
    type: 'BULLISH' | 'BEARISH';
    start_time: number; // in MS
    level_time: number; // in MS
    level_reached: number;
    end_time: number; // in MS
    end_price: number;
    mitigated_at: number | null; // in MS
}

export interface DivergenceState {
    settings: DivergenceSettings;
    divergences: DivergenceItem[];
    timeframe?: string;
    lastCandleTime?: number;
}

export class DivergencePlugin extends BaseWidget<DivergenceState> {

    constructor(settings: DivergenceSettings) {
        super({ settings, divergences: [], timeframe: undefined });
    }

    public updateSettings(settings: DivergenceSettings) {
        this._data.settings = settings;
        this.requestUpdate();
    }

    public updateTimeframe(timeframe: string) {
        if (this._data.timeframe !== timeframe) {
            this._data.timeframe = timeframe;
            this.requestUpdate();
        }
    }

    public updateCurrentTime(time: number) {
        this._data.lastCandleTime = time;
        this.requestUpdate();
    }

    public updateDivergences(data: any) {
        if (data && data.divergences) {
            this._data.divergences = data.divergences;
            this.requestUpdate();
        }
    }

    // --- Drawing ---

    drawBody(ctx: CanvasRenderingContext2D): void {
        const { divergences, settings, lastCandleTime } = this._data;
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        if (!visibleRange) return;

        const rightEdgeTime = lastCandleTime || (Date.now() / 1000);

        ctx.save();

        divergences.forEach(div => {
            // Do not draw if mitigated (User request: verschwinden)
            if (div.mitigated_at) return;

            // Start time is MS, Lightweight Charts uses Seconds
            const startSec = Math.floor((div.level_time || div.start_time) / 1000);

            let x1 = timeScale.timeToCoordinate(startSec as Time);
            let drawX1 = x1;

            if (drawX1 === null) {
                if (startSec < (visibleRange.from as number)) {
                    drawX1 = -10 as Coordinate;
                } else {
                    return; // Future or unrenderable
                }
            }

            const y1 = this._series!.priceToCoordinate(div.level_reached);
            const y2 = this._series!.priceToCoordinate(div.end_price);
            if (y1 === null || y2 === null) return;

            // Determine End Point X
            const endSec = Math.floor(div.end_time / 1000);
            let x2 = timeScale.timeToCoordinate(endSec as Time);
            let drawX2 = x2;

            if (drawX2 === null) {
                if (endSec > (visibleRange.to as number)) drawX2 = (this._chart!.timeScale().width() + 10) as Coordinate;
                else if (endSec < (visibleRange.from as number)) return; // Entirely off-screen to the left!
                else return; // unrenderable
            }

            // If the entire divergence finishes before the left edge of the screen, don't draw it at all
            if ((drawX2 as number) < 0) {
                return;
            }

            // Draw slanted line from origin peak to sweep peak
            ctx.beginPath();
            ctx.strokeStyle = div.type === 'BULLISH' ? settings.bullish_color : settings.bearish_color;
            ctx.lineWidth = settings.linewidth || 2;

            ctx.moveTo(drawX1 as number, y1);
            ctx.lineTo(drawX2 as number, y2);
            ctx.stroke();

            // Only draw label if the start point is somewhat within the visible screen
            // to prevent long text strings from piling up on the left edge.
            if ((drawX1 as number) >= -5) {
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = '10px Roboto';
                ctx.globalAlpha = 0.8;
                ctx.fillText(`SMT ${div.htf} vs ${div.target_symbol}`, (drawX1 as number) + 5, y1 - 6);
                ctx.globalAlpha = 1.0;
            }
        });

        ctx.restore();
    }

    // --- Hit Test ---
    protected hitTestBody(point: any): boolean { return false; }
    protected applyDrag(target: string, newPoint: Point): void { }
    public updateGeometry(timeScale: any, series: any): void { }
}

// --- Schema ---
export const DivergenceSchema = [
    { group: 'Visuals', id: 'bullish_color', type: 'color', title: 'Bullish Line Color', def: '#10b981' },
    { group: 'Visuals', id: 'bearish_color', type: 'color', title: 'Bearish Line Color', def: '#ef4444' },
    { group: 'Visuals', id: 'linewidth', type: 'number', title: 'Line Width', def: 2 },

    { group: 'Timeframes', id: 'show_MN1', type: 'bool', title: 'Monthly (MN1)', def: true },
    { group: 'Timeframes', id: 'show_W1', type: 'bool', title: 'Weekly (W1)', def: true },
    { group: 'Timeframes', id: 'show_D1', type: 'bool', title: 'Daily (D1)', def: true },
    { group: 'Timeframes', id: 'show_H8', type: 'bool', title: '8 Hour (H8)', def: true },
    { group: 'Timeframes', id: 'show_H4', type: 'bool', title: '4 Hour (H4)', def: true },
    { group: 'Timeframes', id: 'show_H1', type: 'bool', title: '1 Hour (H1)', def: true },
];
