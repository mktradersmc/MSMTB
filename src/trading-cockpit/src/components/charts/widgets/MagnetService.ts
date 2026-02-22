import { ISeriesApi, ITimeScaleApi, SeriesType, Time } from 'lightweight-charts';
import { Point } from './types';

export type MagnetMode = 'OFF' | 'WEAK' | 'STRONG';

export interface AnchorInfo {
    time: number;
    price: number;
    type: 'open' | 'high' | 'low' | 'close';
    timeframe: string;
    timeString?: string;
    label?: string; // H, L, BH, BL
}

export interface SnapResult extends Point {
    snapped: boolean;
    anchor?: AnchorInfo;
}

/**
 * MagnetService handles snapping logic to OHLC values.
 */
export class MagnetService {
    private static mode: MagnetMode = 'WEAK';
    private static snapRadius: number = 20; // pixels
    private static listeners: ((mode: MagnetMode) => void)[] = [];

    /**
     * Set the magnet mode.
     */
    public static setMode(mode: MagnetMode): void {
        this.mode = mode;
        this.listeners.forEach(l => l(mode));
    }

    public static getMode(): MagnetMode {
        return this.mode;
    }

    public static subscribe(listener: (mode: MagnetMode) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Set the snapping radius in pixels.
     */
    public static setSnapRadius(radius: number): void {
        this.snapRadius = radius;
    }

    /**
     * Snap a pixel coordinate to the nearest OHLC value of the candle under the mouse.
     */
    public static snap(
        mouseX: number,
        mouseY: number,
        series: ISeriesApi<SeriesType>,
        data: any[], // CandlestickData[]
        timeScale: ITimeScaleApi<Time>,
        timeframe: string
    ): SnapResult {
        if (this.mode === 'OFF' || !data || data.length === 0) {
            return { x: mouseX, y: mouseY, snapped: false };
        }

        // 1. Coordinate Conversion: Find candle index
        const logical = timeScale.coordinateToLogical(mouseX as any);
        if (logical === null) return { x: mouseX, y: mouseY, snapped: false };

        const index = Math.round(logical);
        const candle = data[index]; // Note: data index might not match logical if there are holes, 
        // but for most implementations it's safe or needs offset adjustment.
        // In Lightweight Charts, logical index usually maps to data index for the main series.

        if (!candle) return { x: mouseX, y: mouseY, snapped: false };

        // 2. Data Retrieval: O,H,L,C
        const prices = [candle.open, candle.high, candle.low, candle.close];

        let bestY = mouseY;
        let minDistance = Infinity;
        let foundSnap = false;
        let bestType: 'open' | 'high' | 'low' | 'close' = 'close';

        // 3. Screen Mapping: Convert prices to Y-coordinates
        // We iterate specifically to track the type
        const priceMap: { type: 'open' | 'high' | 'low' | 'close', val: number }[] = [
            { type: 'open', val: candle.open },
            { type: 'high', val: candle.high },
            { type: 'low', val: candle.low },
            { type: 'close', val: candle.close }
        ];

        for (const p of priceMap) {
            const py = series.priceToCoordinate(p.val);
            if (py === null) continue;

            const dist = Math.abs(mouseY - py);
            if (dist < minDistance) {
                minDistance = dist;
                bestY = py;
                foundSnap = true;
                bestType = p.type;
            }
        }

        // 4. Mode Logic
        if (this.mode === 'WEAK' && minDistance > this.snapRadius) {
            return { x: mouseX, y: mouseY, snapped: false };
        }

        // Snap X to the center of the candle
        const snappedX = timeScale.logicalToCoordinate(index as any) ?? mouseX;

        // Determine Label (H, L, BH, BL)
        let label = '';
        if (bestType === 'high') label = 'H';
        else if (bestType === 'low') label = 'L';
        else {
            // Body Logic - Independent of Color
            // Body High = Max(Open, Close)
            // Body Low = Min(Open, Close)

            const snappedPrice = series.coordinateToPrice(bestY) ?? candle.close;
            const bodyTop = Math.max(candle.open, candle.close);
            const bodyBottom = Math.min(candle.open, candle.close);

            // Allow small epsilon for floating point comparison if needed, 
            // but strict comparison usually works with snap
            const distTop = Math.abs(snappedPrice - bodyTop);
            const distBottom = Math.abs(snappedPrice - bodyBottom);

            if (distTop < distBottom) {
                label = 'BH';
            } else {
                label = 'BL';
            }
        }

        return {
            x: snappedX,
            y: bestY,
            snapped: foundSnap,
            anchor: foundSnap ? {
                time: candle.time as number,
                price: series.coordinateToPrice(bestY) ?? candle.close,
                type: bestType,
                timeframe: timeframe,
                label: label, // NEW: Pre-calculated label
                timeString: new Date((candle.time as number) * 1000).toISOString().substr(11, 8) // HH:mm:ss for testing
            } : undefined
        };
    }
}
