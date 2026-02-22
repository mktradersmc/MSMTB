const { DateTime } = require('luxon');
const db = require('./DatabaseService');
const crypto = require('crypto');
const config = require('../config');

class SessionEngine {
    constructor() {
        this.ZONE = 'America/New_York';
    }

    /**
     * Generate a unique hash for the settings to enable cache-busting/segregation.
     */
    getConfigHash(settings) {
        return crypto.createHash('md5').update(JSON.stringify(settings)).digest('hex');
    }

    /**
     * Parse "HHmm-HHmm" string into start/end components.
     * @param {string} sessionStr e.g. "0930-1600"
     */
    parseSessionString(sessionStr) {
        const [start, end] = sessionStr.split('-');
        return {
            startH: parseInt(start.substring(0, 2)),
            startM: parseInt(start.substring(2, 4)),
            endH: parseInt(end.substring(0, 2)),
            endM: parseInt(end.substring(2, 4))
        };
    }

    /**
     * Main entry point: Process candles and generate/update sessions.
     * @param {string} symbol
     * @param {Array} candles - OHLC array (asc or desc? assumed desc from DB, reversed to asc for processing)
     * @param {Object} settings - Full settings object
     */
    async calculateSessions(symbol, candles, settings) {
        if (!candles || candles.length === 0) return [];

        // Ensure Ascending order for time processing
        const sortedCandles = [...candles].sort((a, b) => a.time - b.time);

        const configHash = this.getConfigHash(settings);
        const sessions = [];

        // Active sessions being tracked [Type] -> { ...tempData }
        let openSessions = {};

        // Helper to get time in Target Zone
        const getZoned = (ts) => DateTime.fromSeconds(ts).setZone(this.ZONE);

        // Define Session Configs from Settings
        // Format: { type: 'ASIA', range: '2000-0000', color: ... }
        const sessionConfigs = settings.sessions || []; // e.g. defined in frontend

        // 1. SESSION IDENTIFICATION LOOP
        const shouldLog = config.DEFAULT_FEATURES.ENABLE_INDICATOR_LOGGING;
        if (shouldLog) console.log(`[SessionEngine] Identifying Sessions from ${sortedCandles.length} candles...`);
        for (const candle of sortedCandles) {
            // Auto-detect MS vs Seconds
            let ts = candle.time;
            if (ts > 10000000000) ts = Math.floor(ts / 1000); // Convert MS to Sec if needed

            const dt = getZoned(ts);
            const timeVal = dt.hour * 100 + dt.minute;

            // DEBUG LOGGING (First 5 candles only)
            // DEBUG LOGGING (First 5 candles only)
            // if (sortedCandles.indexOf(candle) < 5) {
            //     console.log(`[SessionEngine] Debug: Time=${candle.time} (Adj=${ts}) -> NY=${dt.toFormat('HH:mm')} (${timeVal})`);
            // }

            // Check for New Session Starts or Active Updates
            for (const cfg of sessionConfigs) {
                if (!cfg.enabled) continue;

                const { startH, startM, endH, endM } = this.parseSessionString(cfg.range);
                const startTimeVal = startH * 100 + startM;
                const endTimeVal = endH * 100 + endM;

                const isCrossDay = endTimeVal < startTimeVal;

                // Check if inside window
                let isInside = false;
                if (isCrossDay) {
                    // Example: 2000-0200. Inside if >= 2000 OR < 0200
                    isInside = timeVal >= startTimeVal || timeVal < endTimeVal;
                } else {
                    // Example: 0930-1100. Inside if >= 0930 AND < 1100
                    isInside = timeVal >= startTimeVal && timeVal < endTimeVal;
                }

                // Session Logic
                if (isInside) {
                    // Initialize if not open
                    if (!openSessions[cfg.type]) {
                        openSessions[cfg.type] = {
                            symbol,
                            session_type: cfg.type,
                            start_time: ts * 1000, // Store as MS for DB consistency
                            end_time: null,
                            high: candle.high,
                            low: candle.low,
                            open: candle.open, // First candle open
                            mitigated_at_high: null,
                            mitigated_at_low: null,
                            range_pips: 0,
                            config_hash: configHash,
                            _active: true
                        };
                    } else {
                        // Update existing
                        const s = openSessions[cfg.type];
                        s.high = Math.max(s.high, candle.high);
                        s.low = Math.min(s.low, candle.low);
                        s.range_pips = (s.high - s.low);
                    }
                } else {
                    // Close session if it was open
                    if (openSessions[cfg.type]) {
                        const s = openSessions[cfg.type];
                        s.end_time = ts * 1000;
                        s._active = false;
                        sessions.push(s);
                        delete openSessions[cfg.type];
                    }
                }
            }
        } // End Candle Loop

        // Finalize any open sessions (optional: close them at last candle time)
        Object.values(openSessions).forEach(s => sessions.push(s));
        if (shouldLog) console.log(`[SessionEngine] Identification Done. Found ${sessions.length} sessions. Starting Mitigation...`);

        // 2. MITIGATION LOGIC LOOP (Single Pass check)
        let mitChecks = 0;
        for (const session of sessions) {
            // Optimization: Only check candles that happened AFTER the session started
            const sessionStartSec = session.start_time / 1000;

            // Flags to early exit if both done
            session.mitigated_at_high = null;
            session.mitigated_at_low = null;

            for (const c of sortedCandles) {
                let cTs = c.time;
                if (cTs > 10000000000) cTs = Math.floor(cTs / 1000);

                if (cTs <= sessionStartSec) continue;

                const cTimeMs = cTs * 1000;

                // Check High Break
                if (!session.mitigated_at_high && c.high > session.high) {
                    session.mitigated_at_high = cTimeMs;
                }
                // Check Low Break
                if (!session.mitigated_at_low && c.low < session.low) {
                    session.mitigated_at_low = cTimeMs;
                }

                // Break inner loop if BOTH are mitigated
                if (session.mitigated_at_high && session.mitigated_at_low) break;
            }
            mitChecks++;
        }
        if (shouldLog) console.log(`[SessionEngine] Mitigation Done. Checks: ${mitChecks}`);

        // 3. PERSISTENCE
        // We use INSERT OR REPLACE.
        db.insertSessions(sessions);
        if (shouldLog) console.log(`[SessionEngine] Persisted to DB.`);
        return sessions;
    }

    /**
     * Get statistics for the dashboard or table.
     */
    getStatistics(symbol, sessionType, count = 5) {
        // Query DB for last N closed sessions of type
        // Calculate Avg Range
        // Return { avg, count }
        // Placeholder
        return { avg: 0, count: 0 };
    }
}

module.exports = new SessionEngine();
