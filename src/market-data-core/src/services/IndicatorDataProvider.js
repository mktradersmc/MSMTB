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
        return db.getHistory(symbol, timeframe, limit, maxTime);
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
