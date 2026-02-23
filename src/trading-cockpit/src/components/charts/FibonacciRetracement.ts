import { Time, PrimitiveHoveredItem, Coordinate } from 'lightweight-charts';
import { InteractiveChartObject, Handle, SettingField } from './widgets/InteractiveChartObject';
import { Point } from './widgets/types';
import { AnchorInfo } from './widgets/MagnetService';

export interface FibLevel {
    level: number;
    color: string;
    visible: boolean;
}

export interface FibonacciState {
    p1: { time: number; price: number; anchor?: AnchorInfo | null };
    p2: { time: number; price: number; anchor?: AnchorInfo | null };
    levels: FibLevel[];
    extendLeft: boolean;
    extendRight: boolean;
    reverse: boolean;
    backgroundOpacity: number;
    showLabels: boolean;
    trendLine: { color: string; visible: boolean; width: number };
}

export const DEFAULT_FIB_LEVELS: FibLevel[] = [
    { level: 0, color: '#787B86', visible: true },
    { level: 0.236, color: '#F44336', visible: true },
    { level: 0.382, color: '#81C784', visible: true },
    { level: 0.5, color: '#4CAF50', visible: true },
    { level: 0.618, color: '#009688', visible: true },
    { level: 0.786, color: '#64B5F6', visible: true },
    { level: 1, color: '#787B86', visible: true },
    { level: 1.618, color: '#2962FF', visible: true },
    { level: 2.618, color: '#F44336', visible: true },
    { level: 3.618, color: '#9C27B0', visible: true },
    { level: 4.236, color: '#E91E63', visible: true }
];

export class FibonacciRetracement extends InteractiveChartObject {
    private _data: FibonacciState;

    constructor(initialData: FibonacciState) {
        super();
        this._data = initialData;

        // Ensure default levels if missing
        if (!this._data.levels || this._data.levels.length === 0) {
            this._data.levels = [...DEFAULT_FIB_LEVELS];
        }
    }

    public getHandles(): Handle[] {
        return [
            { id: 'p1', time: this._data.p1.time, price: this._data.p1.price, axisLock: 'free', cursor: 'move' },
            { id: 'p2', time: this._data.p2.time, price: this._data.p2.price, axisLock: 'free', cursor: 'move' }
        ];
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        if (handleId === 'p1') {
            this._data.p1.time = newPoint.time;
            this._data.p1.price = newPoint.price;
            this._data.p1.anchor = newPoint.anchor || null;
        } else if (handleId === 'p2') {
            this._data.p2.time = newPoint.time;
            this._data.p2.price = newPoint.price;
            this._data.p2.anchor = newPoint.anchor || null;
        } else if (handleId === 'body') {
            if (this._dragStartPoint && this._chart && this._series) {
                const timeScale = this._chart.timeScale();
                const startPrice = this._series.coordinateToPrice(this._dragStartPoint.y);
                const startTime = timeScale.coordinateToTime(this._dragStartPoint.x as Coordinate);

                if (startPrice !== null && startTime !== null) {
                    const priceDelta = newPoint.price - startPrice;
                    const timeDelta = newPoint.time - (startTime as number);

                    this._data.p1.price += priceDelta;
                    this._data.p1.time += timeDelta;
                    this._data.p2.price += priceDelta;
                    this._data.p2.time += timeDelta;

                    this._data.p1.anchor = null;
                    this._data.p2.anchor = null;

                    this._dragStartPoint = { x: this._chart.timeScale().timeToCoordinate(newPoint.time as Time) || 0, y: this._series.priceToCoordinate(newPoint.price) || 0 };
                }
            }
        }
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const series = this._series;

        const x1 = this.getSafeTimeCoordinate(this._data.p1.time);
        const y1 = series.priceToCoordinate(this._data.p1.price);
        const x2 = this.getSafeTimeCoordinate(this._data.p2.time);
        const y2 = series.priceToCoordinate(this._data.p2.price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return;

        ctx.save();

        const canvasWidth = ctx.canvas.width;

        // Calculate prices for all active levels
        const activeLevels = this._data.levels.filter(l => l.visible).sort((a, b) => a.level - b.level);

        type LevelRenderInfo = { price: number; y: number; level: number; color: string; labelText: string };
        const renderLevels: LevelRenderInfo[] = [];

        for (const fib of activeLevels) {
            let price = this._data.p2.price + (this._data.p1.price - this._data.p2.price) * fib.level;
            if (this._data.reverse) {
                price = this._data.p1.price + (this._data.p2.price - this._data.p1.price) * fib.level;
            }

            const y = series.priceToCoordinate(price);
            if (y !== null) {
                renderLevels.push({
                    price,
                    y,
                    level: fib.level,
                    color: fib.color,
                    labelText: `${fib.level} (${price.toFixed(this._getPrecision())})`
                });
            }
        }

        // Draw Backgrounds
        if (this._data.backgroundOpacity > 0 && renderLevels.length > 1) {
            for (let i = 0; i < renderLevels.length - 1; i++) {
                const current = renderLevels[i];
                const next = renderLevels[i + 1];

                let startX = this._data.extendLeft ? 0 : Math.min(x1, x2);
                let endX = this._data.extendRight ? canvasWidth : Math.max(x1, x2);

                // If the points are ordered inversely in time, handle gracefully
                if (startX > endX) {
                    const temp = startX;
                    startX = endX;
                    endX = temp;
                }

                ctx.fillStyle = current.color;
                ctx.globalAlpha = this._data.backgroundOpacity;

                const topY = Math.min(current.y, next.y);
                const height = Math.abs(current.y - next.y);

                ctx.fillRect(startX, topY, endX - startX, height);
            }
        }

        ctx.globalAlpha = 1.0;

        // Draw Trend Line
        if (this._data.trendLine.visible) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = this._data.trendLine.color;
            ctx.lineWidth = this._data.trendLine.width;
            ctx.setLineDash([4, 4]); // Dashed trend line
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw Horizontal Levels
        for (const level of renderLevels) {
            let startX = this._data.extendLeft ? 0 : Math.min(x1, x2);
            let endX = this._data.extendRight ? canvasWidth : Math.max(x1, x2);

            ctx.beginPath();
            ctx.moveTo(startX, level.y);
            ctx.lineTo(endX, level.y);
            ctx.strokeStyle = level.color;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw Label
            if (this._data.showLabels) {
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = level.color;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';

                // Position label slightly above the line
                ctx.fillText(level.labelText, startX + 5, level.y - 2);
            }
        }

        // Selection effects (Glow)
        if (this._isSelected || this._isHovered) {
            // Let the base rendering system draw the exact anchors
            // We can optionally draw an outline for the entire widget bounding box
        }

        ctx.restore();
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._chart || !this._series) return false;

        const timeScale = this._chart.timeScale();
        const x1 = this.getSafeTimeCoordinate(this._data.p1.time);
        const y1 = this._series.priceToCoordinate(this._data.p1.price);
        const x2 = this.getSafeTimeCoordinate(this._data.p2.time);
        const y2 = this._series.priceToCoordinate(this._data.p2.price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return false;

        let startX = this._data.extendLeft ? 0 : Math.min(x1, x2);
        let endX = this._data.extendRight ? 10000 : Math.max(x1, x2); // Safe fallback for width

        // Check if point is inside the bounding box of the highest and lowest levels
        const activeLevels = this._data.levels.filter(l => l.visible);
        if (activeLevels.length === 0) return false;

        // Simplify hit test: bounding box of all levels + X range.
        let minPrice = Math.min(this._data.p1.price, this._data.p2.price);
        let maxPrice = Math.max(this._data.p1.price, this._data.p2.price);

        // Calculate the absolute extremes based on the max/min levels
        const maxLevel = Math.max(...activeLevels.map(l => l.level));
        const minLevel = Math.min(...activeLevels.map(l => l.level));

        const priceDiff = Math.abs(this._data.p1.price - this._data.p2.price);
        minPrice = Math.min(this._data.p2.price - priceDiff * maxLevel, minPrice);
        maxPrice = Math.max(this._data.p1.price + priceDiff * maxLevel, maxPrice);

        const boundingTopY = this._series.priceToCoordinate(maxPrice);
        const boundingBottomY = this._series.priceToCoordinate(minPrice);

        if (boundingTopY === null || boundingBottomY === null) return false;

        const boundsY1 = Math.min(boundingTopY, boundingBottomY);
        const boundsY2 = Math.max(boundingTopY, boundingBottomY);

        if (point.x >= startX && point.x <= endX && point.y >= boundsY1 && point.y <= boundsY2) {
            return true;
        }

        return false;
    }

    private _getPrecision(): number {
        return 5; // Use 5 fallback if format isn't extracted
    }

    public getSettingsSchema(): SettingField[] {
        const schema: SettingField[] = [
            { id: 'extendLeft', label: 'Extend Lines Left', type: 'boolean', value: this._data.extendLeft },
            { id: 'extendRight', label: 'Extend Lines Right', type: 'boolean', value: this._data.extendRight },
            { id: 'reverse', label: 'Reverse', type: 'boolean', value: this._data.reverse },
            { id: 'showLabels', label: 'Show Labels', type: 'boolean', value: this._data.showLabels },
            { id: 'backgroundOpacity', label: 'Background Opacity', type: 'number', value: this._data.backgroundOpacity }
        ];

        // For dynamic levels, the SettingField might be limiting. 
        // We inject them statically for the 5-6 most common if standard schema is strictly typed.
        for (let i = 0; i < this._data.levels.length; i++) {
            const level = this._data.levels[i];
            schema.push({
                id: `level_${i}_visible`,
                label: `Level ${level.level}`,
                type: 'boolean',
                value: level.visible
            });
            schema.push({
                id: `level_${i}_color`,
                label: `Color ${level.level}`,
                type: 'color',
                value: level.color
            });
        }
        return schema;
    }

    public applySettings(settings: any): void {
        if (settings.extendLeft !== undefined) this._data.extendLeft = settings.extendLeft;
        if (settings.extendRight !== undefined) this._data.extendRight = settings.extendRight;
        if (settings.reverse !== undefined) this._data.reverse = settings.reverse;
        if (settings.showLabels !== undefined) this._data.showLabels = settings.showLabels;
        if (settings.backgroundOpacity !== undefined) this._data.backgroundOpacity = settings.backgroundOpacity;

        for (let i = 0; i < this._data.levels.length; i++) {
            if (settings[`level_${i}_visible`] !== undefined) {
                this._data.levels[i].visible = settings[`level_${i}_visible`];
            }
            if (settings[`level_${i}_color`] !== undefined) {
                this._data.levels[i].color = settings[`level_${i}_color`];
            }
        }

        this._requestUpdate?.();
    }

    public getData() { return this._data; }
    public getStorageState() { return this._data; }
}
