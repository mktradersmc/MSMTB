import { BaseWidget, WidgetState } from '../widgets/BaseWidget';
import { Time } from 'lightweight-charts';
import { Point } from '../widgets/types';

export interface NewsEvent {
    id: string;
    timestamp: number;
    currency: string;
    impact: string; // 'High', 'Medium', 'Low'
    title: string;
    actual: string;
    forecast: string;
    previous: string;
}

export interface NewsMarkerState {
    events: NewsEvent[];
    settings?: any;
}

export class NewsMarkerPrimitive extends BaseWidget<NewsMarkerState> {
    private _images: Map<string, HTMLImageElement> = new Map();
    private _loaded: boolean = false;
    private _hoveredTimestamp: number | null = null;
    private _geometries: { events: NewsEvent[], x: number, y: number, r: number, highestImpact: string, mainCurrency: string }[] = [];
    private _lastTimeScale: any = null;
    private _lastSeries: any = null;
    private _candleTimes: number[] = [];
    private _onNewsClick?: (events: NewsEvent[], x: number, y: number) => void;

    constructor(data: NewsMarkerState) {
        super(data);
        this._preloadImages();
    }

    public updateEvents(events: NewsEvent[], candleData?: any[]) {
        this._data.events = events;
        if (candleData && candleData.length > 0) {
            this._candleTimes = candleData.map((d: any) => d.time as number);
        }
        this._preloadImages(); 
        if (this._lastTimeScale && this._lastSeries) {
            this._recalculateGeometries();
        }
        this.requestUpdate();
    }

    public updateData(candleData: any[]) {
        if (candleData && candleData.length > 0) {
            this._candleTimes = candleData.map((d: any) => d.time as number);
            if (this._lastTimeScale && this._lastSeries) {
                this._recalculateGeometries();
            }
            this.requestUpdate();
        }
    }

    public setOnNewsClick(cb: (events: NewsEvent[], x: number, y: number) => void) {
        this._onNewsClick = cb;
    }

    public updateSettings(settings: any) {
        this._data.settings = settings;
        this.requestUpdate();
    }

    private _preloadImages() {
        let allLoaded = true;
        this._data.events.forEach(e => {
            if (!e.currency) return;
            const cur = e.currency.toUpperCase();
            if (!this._images.has(cur)) {
                allLoaded = false;
                const img = new Image();
                img.src = `/flags/${cur}.svg`;
                img.onload = () => {
                    this.requestUpdate();
                };
                this._images.set(cur, img);
            }
        });
        this._loaded = allLoaded;
    }

    public updateGeometry(timeScale: any, series: any): void {
        this._lastTimeScale = timeScale;
        this._lastSeries = series;
        
        if (this._candleTimes && this._candleTimes.length > 0 && this._data.events && this._data.events.length > 0) {
            this._recalculateGeometries();
        }
    }

    private _recalculateGeometries() {
        this._geometries = [];
        console.log(`[NewsMarkerPrimitive] _recalculateGeometries EVALUATION -> chart:${!!this._chart}, series:${!!this._lastSeries}, ts:${!!this._lastTimeScale}, candles:${this._candleTimes.length}, events:${this._data.events.length}`);
        
        if (!this._chart || !this._lastSeries || !this._lastTimeScale || this._candleTimes.length === 0) {
            console.log(`[NewsMarkerPrimitive] _recalculateGeometries HALTED. Missing prerequisites.`);
            return;
        }

        // dynamically extract candle times so we don't drop events if the News API returns before the candlestick API
        // Data is now securely piped straight from ChartContainer so LWC API limitations on .data() do not crash the draw loop


        // Anchor near the bottom of the pane (above timescale)
        const chartEl = this._chart.chartElement();
        const paneHeight = chartEl.clientHeight; 
        const yPos = paneHeight - 45; // 45px above the bottom to prevent clipping
        const radius = 8; // scaled down based on user request

        console.log(`[NewsMarkerPrimitive] _recalculateGeometries starting. Total events: ${this._data.events.length}`);

        const grouped = new Map<number, NewsEvent[]>();
        this._data.events.forEach(ev => {
            if (!grouped.has(ev.timestamp)) grouped.set(ev.timestamp, []);
            grouped.get(ev.timestamp)!.push(ev);
        });

        grouped.forEach((eventsArr, ts) => {
            let x = this._lastTimeScale.timeToCoordinate(ts as Time);
            
            // If the exact timestamp doesn't match a candle (due to timezone offsets or gaps),
            // find the closest preceding candle that exists on the chart
            if (x === null && this._candleTimes.length > 0) {
                let closest = this._candleTimes[0];
                for (let i = 0; i < this._candleTimes.length; i++) {
                    if (this._candleTimes[i] <= ts) {
                        closest = this._candleTimes[i];
                    } else {
                        break;
                    }
                }
                x = this._lastTimeScale.timeToCoordinate(closest as Time);
            }

            if (x !== null) {
                let highest = 'Low';
                const hasHigh = eventsArr.some(e => e.impact?.includes('High'));
                const hasMedium = eventsArr.some(e => e.impact?.includes('Medium'));
                if (hasHigh) highest = 'High';
                else if (hasMedium) highest = 'Medium';
                
                this._geometries.push({ 
                    events: eventsArr, 
                    x, y: yPos, r: radius,
                    highestImpact: highest,
                    mainCurrency: eventsArr[0].currency 
                });
            }
        });

        console.log(`[NewsMarkerPrimitive] _recalculateGeometries finished. Generated ${this._geometries.length} coordinates from ${grouped.size} unique timestamps.`);
    }

    protected hitTestBody(point: Point): boolean {
        // Find if we hover over any geometry
        for (const geo of this._geometries) {
            const dist = Math.sqrt(Math.pow(point.x - geo.x, 2) + Math.pow(point.y - geo.y, 2));
            if (dist <= geo.r + 4) { // small tolerance
                this._hoveredTimestamp = geo.events[0].timestamp;
                return true;
            }
        }
        this._hoveredTimestamp = null;
        return false;
    }

    protected applyDrag(target: string, newPoint: Point): void {}

    protected onMouseDown = (e: MouseEvent) => {
        if (!this._chart) return;
        
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        
        const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        console.log(`[NewsMarkerPrimitive] onMouseDown: Event(${e.clientX}, ${e.clientY}) -> LocalPoint(${point.x}, ${point.y})`);
        
        for (const geo of this._geometries) {
            const dist = Math.sqrt(Math.pow(point.x - geo.x, 2) + Math.pow(point.y - geo.y, 2));
            if (dist <= geo.r + 4) {
                console.log(`[NewsMarkerPrimitive] HIT TEST SUCCESS! Dist: ${dist.toFixed(2)} <= Target R: ${geo.r + 4}. Triggering direct React callback for ${geo.events.length} events.`);
                // Dispatch directly to React layer via injected callback. Bypasses Canvas stopPropagation
                (window as any)._lastNewsMarkerClickTime = Date.now();
                if (this._onNewsClick) {
                    this._onNewsClick(geo.events, e.clientX, e.clientY);
                } else {
                    console.log("[NewsMarkerPrimitive] onNewsClick callback is missing!");
                }
                return;
            } else if (dist < geo.r + 20) {
                console.log(`[NewsMarkerPrimitive] HIT TEST MISS: Near miss. Dist: ${dist.toFixed(2)} vs target: ${geo.r + 4}. Marker at (${geo.x}, ${geo.y})`);
            }
        }
    }

    protected onMouseMove = (e: MouseEvent) => {
        if (!this._chart) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const rawPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        const wasHovered = !!this._hoveredTimestamp;
        const hit = this.hitTestBody(rawPoint);

        if (hit) {
            document.body.style.cursor = 'pointer';
            if (this._state === WidgetState.Idle || !wasHovered) {
                this._state = WidgetState.Hover;
                this.requestUpdate();
            }
        } else {
            document.body.style.cursor = 'default';
            if (this._state === WidgetState.Hover || wasHovered) {
                this._state = WidgetState.Idle;
                this.requestUpdate();
            }
        }
    }


    drawBody(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        this._geometries.forEach(geo => {
            const { events, x, y, r, highestImpact, mainCurrency } = geo;
            const cur = mainCurrency.toUpperCase();
            const img = this._images.get(cur);

            const isHovered = this._state === WidgetState.Hover && this._hoveredTimestamp === events[0].timestamp;
            
            let impactColorStr = '#94a3b8'; // slate-400
            if (highestImpact.includes('High')) {
                impactColorStr = '#f43f5e'; // rose-500
            } else if (highestImpact.includes('Medium')) {
                impactColorStr = '#f59e0b'; // amber-500
            } else if (highestImpact.includes('Low')) {
                impactColorStr = '#10b981'; // emerald-500
            }

            const showLine = this._data.settings?.showVerticalLine ?? true;

            // Draw Vertical Line spanning the chart
            if (showLine) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, ctx.canvas.height);
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = impactColorStr;
                ctx.stroke();
                ctx.restore();
            }

            // Draw Flag / Inner Circle (with opacity)
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.clip(); 
            
            // Apply requested opacity for the circle fill/image (50% default, 75% hover)
            ctx.globalAlpha = isHovered ? 0.75 : 0.50;

            if (img && img.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            } else {
                ctx.fillStyle = '#475569'; // Slate-600 baseline
                ctx.fill();
            }
            ctx.restore();

            // Inner rim to separate from the icon
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.stroke();

            // Draw Stroke (Impact Color) at r + 2 to create a 1px gap
            const strokeRadius = r + 2;
            ctx.beginPath();
            ctx.arc(x, y, strokeRadius, 0, 2 * Math.PI);
            
            // Outer ring: always solid black, thinned to 1px per request
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            
            // Outer ring
            ctx.stroke();
        });
    }
}
