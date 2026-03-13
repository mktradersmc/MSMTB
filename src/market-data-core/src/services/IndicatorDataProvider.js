const db = require('./DatabaseService');
const replayEngine = require('./ReplayEngine');

/**
 * IndicatorDataProvider
 *
 * Acts as an abstraction layer between calculation engines (Indicators) and the raw database.
 * This ensures that during a simulation, indicators cannot accidentally query raw future data,
 * as all time-bounds are strictly clamped to the current `simulationTime`.
 */
class IndicatorDataProvider {
    /**
     * @param {Object} options
     * @param {string} options.mode 'LIVE' or 'BACKTEST'
     * @param {string} [options.backtestId] The simulation session ID
     * @param {number} [options.simulationTime] The current simulated timestamp in MS
     */
    constructor(options = { mode: 'LIVE' }) {
        this.mode = options.mode;
        this.backtestId = options.backtestId;
        this.simulationTime = options.simulationTime;
    }

    /**
     * Helper to get the total milliseconds logic for a timeframe string
     * e.g., 'M5' -> 5 * 60 * 1000
     */
    getTfDurationMs(timeframe) {
        if (!timeframe) return 0;
        const value = parseInt(timeframe.substring(1)) || 1;
        const unit = timeframe.charAt(0).toUpperCase();

        switch (unit) {
            case 'M': return value * 60 * 1000;
            case 'H': return value * 3600 * 1000;
            case 'D': return value * 86400 * 1000;
            case 'W': return value * 86400 * 1000 * 7;
            default: return 0;
        }
    }

    /**
     * Gets absolute history bounded by simulation time, ensuring no future peeking.
     */
    getHistory(symbol, timeframe, limit, toTime) {
        let maxTime = toTime;
        if (this.mode === 'BACKTEST' && this.simulationTime) {
            // Strictly clamp any requested 'toTime' to not exceed the simulation reality
            if (!maxTime || maxTime > this.simulationTime) {
                maxTime = this.simulationTime;
            }
        }

        let candles = db.getHistory(symbol, timeframe, limit, maxTime);

        // STRICT FILTERING: Prevent Backtesting "Future Leak"
        if (this.mode === 'BACKTEST' && this.simulationTime) {
            const tfMs = this.getTfDurationMs(timeframe);
            // In a backtest, a DB candle is ONLY valid if it has FULLY formed relative to simulationTime.
            // If the candle time (open time) + duration > simulationTime, it hasn't closed yet in the simulation,
            // but the DB array has the future close price. We MUST strip it. The frontend's liveCandle will replace it.
            candles = candles.filter(c => (c.time + tfMs) <= this.simulationTime);
        }

        return candles;
    }

    getHistoryRange(symbol, timeframe, from, toTime) {
        let maxTime = toTime;
        if (this.mode === 'BACKTEST' && this.simulationTime) {
            if (!maxTime || maxTime > this.simulationTime) {
                maxTime = this.simulationTime;
            }
        }

        let candles = db.getHistoryRange(symbol, timeframe, from, maxTime);

        if (this.mode === 'BACKTEST' && this.simulationTime) {
            const tfMs = this.getTfDurationMs(timeframe);
            candles = candles.filter(c => (c.time + tfMs) <= this.simulationTime);
        }

        return candles;
    }

    /**
     * Matches DivergenceEngine's raw SQL "get exact peak" method, but safely wrapped.
     * All times expected and returned in SECONDS.
     */
    getExactPeakTime(symbol, currentTf, htfTimeSec, htfSeconds, targetPrice, isHigh) {
        const symbolDb = db.getSymbolDb(symbol);
        if (!symbolDb) return htfTimeSec;

        try {
            const startMs = htfTimeSec * 1000;
            // The un-clamped end condition
            let endMs = (htfTimeSec + htfSeconds) * 1000;

            // Strict Backtest Clamping
            if (this.mode === 'BACKTEST' && this.simulationTime) {
                if (startMs > this.simulationTime) {
                    // Attempting to find a peak in a candle that hasn't even started yet
                    return htfTimeSec;
                }
                if (endMs > this.simulationTime) {
                    endMs = this.simulationTime; // Cap the search to what has "happened" so far
                }
            }

            let query;
            if (isHigh) {
                query = `SELECT time FROM candles_${currentTf} WHERE time >= ? AND time <= ? AND high = ? ORDER BY time ASC LIMIT 1`;
            } else {
                query = `SELECT time FROM candles_${currentTf} WHERE time >= ? AND time <= ? AND low = ? ORDER BY time ASC LIMIT 1`;
            }

            const row = symbolDb.prepare(query).get(startMs, endMs, targetPrice);
            if (row) {
                return Math.floor(row.time / 1000); // Return in seconds
            }
        } catch (e) {
            console.error(`[DataProvider] getExactPeakTime Error:`, e.message);
        }
        return htfTimeSec;
    }

    // --- State Storage API (For future optimization) ---
    setState(namespace, key, data) {
        const scope = this.mode === 'BACKTEST' ? this.backtestId : 'LIVE';
        // In-memory or DB storage representation...
        // Currently a placeholder
    }

    getState(namespace, key) {
        // Placeholder
        return null;
    }
}

module.exports = IndicatorDataProvider;
