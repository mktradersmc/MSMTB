export type FixedLeg = 'tp' | 'sl' | 'rr';

export interface LongShortParams {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    riskReward: number;
    fixedStates: {
        tp: boolean;
        sl: boolean;
        entry: boolean;
        rr: boolean;
    };
}

export class LongShortCalculator {
    /**
     * Calculates the missing value based on which leg is fixed.
     */
    public static recalculate(
        params: LongShortParams,
        changedId: 'tp' | 'sl' | 'entry' | 'rr',
        isLong: boolean
    ): LongShortParams {
        const result = { ...params };
        const { tp: tpFixed, sl: slFixed, rr: rrFixed } = params.fixedStates;

        if (changedId === 'entry') {
            if (rrFixed) {
                // If SL is fixed, update TP. If TP is fixed, update SL. 
                // If neither/both, prioritize updating TP from fixed SL distance.
                if (slFixed && tpFixed) {
                    // Special Case: All fixed. Move Entry implies re-calculating RR if we keep SL/TP fixed?
                    // No, if Entry moves and SL/TP are fixed, RR changes.
                    result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
                }
                else if (slFixed) result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
                else if (tpFixed) result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
                else result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                // RR is not fixed. Just update the ratio.
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'tp') {
            // EXCEPTION: If SL and TP and RR are ALL fixed, and we are moving TP,
            // we must NOT move SL (violation of fixed SL). We must update RR (violation of fixed RR).
            // User rule: "fixed level must not change" -> implied priority over RR.
            if (rrFixed && slFixed && tpFixed) {
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            } else if (rrFixed) {
                // RR is fixed, SL must move to maintain R
                result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
            } else {
                // SL or Entry is fixed (implied by dragging only TP), update RR
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'sl') {
            // EXCEPTION: Same as above.
            if (rrFixed && slFixed && tpFixed) {
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            } else if (rrFixed) {
                // RR is fixed, TP must move to maintain R
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                // TP or Entry is fixed, update RR
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'rr') {
            // Manual RR change (from settings or else)
            // If SL is fixed, move TP. If TP is fixed, move SL.
            if (slFixed || !tpFixed) {
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
            }
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
