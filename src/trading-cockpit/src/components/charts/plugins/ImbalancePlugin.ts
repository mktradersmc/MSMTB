import { BaseWidget } from '../widgets/BaseWidget';

interface ImbalanceSettings {
    bullishColor: string;
    bearishColor: string;
    showBullish: boolean;
    showBearish: boolean;
}

/**
 * Data Transformer for Imbalance Indicator.
 * Instead of drawing on canvas (which overlays), we modify the candle data colors directly
 * to achieve true transparency effects on the candle body.
 */
export const applyImbalanceTransformation = (data: any[], settings: ImbalanceSettings): any[] => {
    // Clone data to avoid mutating source
    // We create a shallow copy of the array, but we must also handle item cloning if modify
    const result = [...data];
    if (result.length < 3) return result;

    const { bullishColor, bearishColor, showBullish, showBearish } = settings;

    // Iterate through data (excluding first and last to check neighbors)
    // We check pattern: Prev -> Curr -> Next
    // Imbalance is identified on the 'Curr' (middle) candle.
    for (let i = 1; i < result.length - 1; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        const next = result[i + 1];

        let isBullishImbalance = false;
        let isBearishImbalance = false;

        // Bullish Imbalance: Middle is Bullish (Close > Open)
        // AND High of Prev < Low of Next
        if (showBullish && curr.close > curr.open) {
            if (prev.high < next.low) {
                isBullishImbalance = true;
            }
        }

        // Bearish Imbalance: Middle is Bearish (Close < Open)
        // AND Low of Prev > High of Next
        if (showBearish && curr.close < curr.open) {
            if (prev.low > next.high) {
                isBearishImbalance = true;
            }
        }

        if (isBullishImbalance || isBearishImbalance) {
            const color = isBullishImbalance ? bullishColor : bearishColor;

            // Apply color overrides to the Middle Candle
            // We create a new object for the modified candle to preserve immutability of the original data source
            result[i] = {
                ...curr,
                color: color,          // Only override Body color
                // wickColor: undefined, // Inherit from series
                // borderColor: undefined // Inherit from series
            };
        }
    }

    return result;
};

// We keep the Plugin class for consistency with Registry and potential future use,
// but it strictly does NO rendering now.
export class ImbalancePlugin extends BaseWidget<any> {
    constructor(settings: any) {
        super({ settings });
    }

    // No-op drawing
    drawBody(ctx: CanvasRenderingContext2D): void { }

    // Implement required methods
    public updateGeometry(timeScale: any, series: any): void { }
    public updateData(data: any[]): void { }
    public updateCandle(candle: any): void { }
    public updateSettings(settings: any): void { }

    // Interaction methods
    public hitTestBody(point: any): boolean { return false; }
    public applyDrag(target: string, newPoint: any): void { }
}
