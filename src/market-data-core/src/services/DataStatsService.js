const db = require('./DatabaseService');
const config = require('../config');

class DataStatsService {
    constructor() {
        this.cache = new Map(); // Key: "Symbol_TF" -> { min, max, count, lastUpdated }
        this.CACHE_TTL = 60000; // 1 Minute Cache
    }

    /**
     * Get statistics for a specific symbol and timeframe.
     * Uses cache if valid.
     */
    getStats(symbol, timeframe) {
        const key = `${symbol}_${timeframe}`;
        const now = Date.now();

        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            if (now - entry.lastUpdated < this.CACHE_TTL) {
                return entry.data;
            }
        }

        // Cache Miss or Expired: Query DB
        const stats = this.queryStats(symbol, timeframe);
        this.cache.set(key, { data: stats, lastUpdated: now });
        return stats;
    }

    /**
     * Query DB for Min/Max/Count.
     */
    queryStats(symbol, timeframe) {
        try {
            // Using direct DB access via DatabaseService getter if available, or direct query.
            // We need to extend DatabaseService to support this efficiently or use direct access here if safe.
            // Ideally, DatabaseService should expose a `getStats` method.
            // But let's use prepared statement directly here for now as extension.

            // We access the underlying DB object if possible, or replicate the query logic.
            // DatabaseService exposes 'marketDb'.

            const row = db.marketDb.prepare(`
                SELECT MIN(time) as minTime, MAX(time) as maxTime, COUNT(*) as count 
                FROM candles 
                WHERE symbol = ? AND timeframe = ?
            `).get(symbol, timeframe);

            return {
                min: row.minTime || 0,
                max: row.maxTime || 0,
                count: row.count || 0
            };
        } catch (e) {
            console.error(`[DataStats] Error querying ${symbol} ${timeframe}:`, e);
            return { min: 0, max: 0, count: 0 };
        }
    }

    /**
     * Get stats for ALL configured symbols/timeframes.
     * Returns a nested object structure.
     */
    getAllStats(configuredSymbols) {
        const result = {};

        configuredSymbols.forEach(item => {
            const sym = item.symbol || item.name || item;
            result[sym] = {};

            config.DEFAULT_TIMEFRAMES.forEach(tf => {
                const stats = this.getStats(sym, tf);
                // stats: { min, max, count }
                // We might want to format dates here or let frontend do it.
                // Sending raw timestamps is better.
                result[sym][tf] = stats;
            });
        });

        return result;
    }

    /**
     * Get stats formatted for the Data History Tree Table.
     * Returns an array of symbol objects, each containing timeframe children.
     */
    getTreeStats(configuredSymbols) {
        const tree = [];

        configuredSymbols.forEach(item => {
            const sym = item.symbol || item.name || item;
            const symbolNode = {
                key: sym,
                data: {
                    name: sym,
                    type: 'symbol'
                },
                children: []
            };

            config.DEFAULT_TIMEFRAMES.forEach(tf => {
                const stats = this.getStats(sym, tf);
                symbolNode.children.push({
                    key: `${sym}-${tf}`,
                    data: {
                        name: tf,
                        type: 'timeframe',
                        min: stats.min,
                        max: stats.max,
                        count: stats.count
                    }
                });
            });
            tree.push(symbolNode);
        });

        return tree;
    }

    invalidate(symbol, timeframe) {
        const key = `${symbol}_${timeframe}`;
        this.cache.delete(key);
    }
}

module.exports = new DataStatsService();
