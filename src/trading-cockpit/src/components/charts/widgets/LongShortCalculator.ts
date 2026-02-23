export type FixedLeg = 'rr';

export interface LongShortParams {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    riskReward: number;
    fixedStates: {
        rr: boolean;
    };
}

export class LongShortCalculator {
    /**
     * Calculates the missing value based on which leg is moved.
     */
    public static recalculate(
        params: LongShortParams,
        changedId: 'tp' | 'sl' | 'entry' | 'rr',
        isLong: boolean
    ): LongShortParams {
        const result = { ...params };
        const { rr: rrFixed } = params.fixedStates;

        if (changedId === 'entry') {
            if (rrFixed) {
                // If Entry moves and RR is fixed, move TP synchronously to maintain RR.
                // Assuming SL dictates risk in this specific move logic or vice versa.
                // Let's standardise: Entry moves -> SL stays fixed (distance changes), so TP must change.
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'tp') {
            if (rrFixed) {
                // RR is fixed, SL must move to maintain R
                result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
            } else {
                // RR dynamic
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'sl') {
            if (rrFixed) {
                // RR is fixed, TP must move to maintain R
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                // RR dynamic
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'rr') {
            // Manual RR change (from settings or double click on RR box)
            // Arbitrary choice: move TP to match new RR against current SL.
            result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
        }

        return result;
    }

    public static calculateRR(entry: number, sl: number, tp: number, isLong: boolean): number {
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        if (risk === 0) return 0;

        // Directional validation
        const isValid = isLong ? (tp > entry && sl < entry) : (tp < entry && sl > entry);
        if (!isValid) return 0;

        return parseFloat((reward / risk).toFixed(2));
    }

    public static calculateTP(entry: number, sl: number, rr: number, isLong: boolean): number {
        const risk = Math.abs(entry - sl);
        const reward = risk * rr;
        return isLong ? entry + reward : entry - reward;
    }

    public static calculateSL(entry: number, tp: number, rr: number, isLong: boolean): number {
        const reward = Math.abs(entry - tp);
        if (rr === 0) return entry;
        const risk = reward / rr;
        return isLong ? entry - risk : entry + risk;
    }
}
