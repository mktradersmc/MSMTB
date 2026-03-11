const db = require('./DatabaseService');
const crypto = require('crypto');
const config = require('../config');

class DivergenceEngine {
    constructor() {
        this.ZONE = 'America/New_York';
        // Max time to keep divergence active without mitigation
        this.MAX_ACTIVE_MS = 24 * 60 * 60 * 1000; // 1 Day (24 hours) as requested
    }

    getConfigHash(settings) {
        return crypto.createHash('md5').update(JSON.stringify(settings)).digest('hex');
    }

    getExactPeakTime(symbolDb, currentTf, htfTimeSec, htfSeconds, targetPrice, isHigh) {
        if (!symbolDb) return htfTimeSec;
        try {
            const startMs = htfTimeSec * 1000;
            const endMs = (htfTimeSec + htfSeconds) * 1000;

            let query;
            if (isHigh) {
                query = `SELECT time FROM candles_${currentTf} WHERE time >= ? AND time < ? AND high = ? ORDER BY time ASC LIMIT 1`;
            } else {
                query = `SELECT time FROM candles_${currentTf} WHERE time >= ? AND time < ? AND low = ? ORDER BY time ASC LIMIT 1`;
            }

            const row = symbolDb.prepare(query).get(startMs, endMs, targetPrice);
            if (row) {
                return Math.floor(row.time / 1000); // Return in seconds
            }
        } catch (e) { /* fallback */ }
        return htfTimeSec;
    }

    /**
     * Calculate divergences for a primary symbol against multiple target symbols.
     * @param {string} symbol - The primary symbol (e.g. EURUSD)
     * @param {string} currentTf - The current viewing timeframe (e.g. H1)
     * @param {Array} primaryCandles - The chronologically sorted candles for the current viewport
     * @param {Object} settings - { other_symbols: ["GBPUSD"], timeframes: ["D1", "H4"] }
     * @param {Object} dataProvider - The IndicatorDataProvider to fetch historical data securely
     */
    async calculateDivergences(symbol, currentTf, primaryCandles, settings, dataProvider) {
        if (!primaryCandles || primaryCandles.length === 0) return [];
        if (!settings.other_symbols || settings.other_symbols.length === 0) return [];

        const sortedCandles = [...primaryCandles].sort((a, b) => a.time - b.time);

        // Auto convert to SECONDS for uniform calculation
        const getSec = (t) => t > 10000000000 ? Math.floor(t / 1000) : t;
        const startTimeSec = getSec(sortedCandles[0].time);
        const endTimeSec = getSec(sortedCandles[sortedCandles.length - 1].time);

        const htfs = settings.timeframes || ['D1', 'H4'];
        const otherSymbols = settings.other_symbols;

        const divergences = [];

        // Highest to lowest sort and filter out lower timeframes
        const htfOrder = ['MN1', 'W1', 'D1', 'H8', 'H4', 'H1'];
        const currentTfIndex = htfOrder.indexOf(currentTf);

        const sortedHtfs = htfs.filter(htf => {
            if (currentTfIndex === -1) return true; // If current TF is sub-H1 (M15 etc.), keep all HTFs
            const htfIndex = htfOrder.indexOf(htf);
            return htfIndex !== -1 && htfIndex <= currentTfIndex;
        }).sort((a, b) => {
            return htfOrder.indexOf(a) - htfOrder.indexOf(b); // Lower index = higher timeframe
        });

        const symbolDb = db.getSymbolDb(symbol);

        for (const targetSymbol of otherSymbols) {
            const targetSymbolDb = db.getSymbolDb(targetSymbol);
            let targetCandles = dataProvider.getHistory(targetSymbol, currentTf, sortedCandles.length + 500, (endTimeSec + 86400) * 1000);
            if (!targetCandles) targetCandles = [];

            const targetPrices = new Map();
            for (const tc of targetCandles) {
                targetPrices.set(getSec(tc.time), tc);
            }

            const highPOIs = [];
            const lowPOIs = [];

            for (const htf of sortedHtfs) {
                const htfSeconds = htf === 'MN1' ? 86400 * 30 : htf === 'W1' ? 86400 * 7 : htf === 'D1' ? 86400 : htf === 'H8' ? 28800 : htf === 'H4' ? 14400 : htf === 'H1' ? 3600 : 0;

                const limit = Math.max(2000, sortedCandles.length);
                const pHTF = dataProvider.getHistory(symbol, htf, limit, (endTimeSec + 86400) * 1000);
                const tHTF = dataProvider.getHistory(targetSymbol, htf, limit, (endTimeSec + 86400) * 1000);

                if (!pHTF || !tHTF) continue;

                const targetHtfMap = new Map();
                for (const tc of tHTF) targetHtfMap.set(getSec(tc.time), tc);

                for (let j = 1; j < pHTF.length - 1; j++) {
                    // Yield Event Loop to prevent WebSocket blocking
                    if (j % 500 === 0) await new Promise(r => setImmediate(r));

                    const pc = pHTF[j];
                    const pSec = getSec(pc.time);
                    const tc = targetHtfMap.get(pSec);

                    if (tc) {
                        // FRACTAL FILTERING (SMC 3-Bar Swing Point)
                        // A candle is a structural High ONLY if it is higher than its left and right neighbors.
                        const isHighPOI = pc.high >= pHTF[j - 1].high && pc.high > pHTF[j + 1].high;
                        const isLowPOI = pc.low <= pHTF[j - 1].low && pc.low < pHTF[j + 1].low;

                        // Also check if Target formed a Swing Point at this exact time (even if Primary didn't)
                        const targetLeft = targetHtfMap.get(getSec(pHTF[j - 1].time));
                        const targetRight = targetHtfMap.get(getSec(pHTF[j + 1].time));

                        let targetIsHighPOI = false;
                        let targetIsLowPOI = false;
                        if (targetLeft && targetRight) {
                            targetIsHighPOI = tc.high >= targetLeft.high && tc.high > targetRight.high;
                            targetIsLowPOI = tc.low <= targetLeft.low && tc.low < targetRight.low;
                        }

                        // If neither asset formed a structural peak/trough at this given time, skip immediately.
                        if (!isHighPOI && !isLowPOI && !targetIsHighPOI && !targetIsLowPOI) continue;

                        // PEAK INVALIDATION (Sweep-Entwertung)
                        // If *either* the primary OR the target asset sweeps its respective historical high
                        // before the active chart window begins, this origin is "spent" and cannot form divergences later.
                        let isInvalidatedHigh = false;
                        let isInvalidatedLow = false;

                        for (let k = j + 1; k < pHTF.length; k++) {
                            const futurePC = pHTF[k];
                            // StartTimeSec limits the precalc to before the viewport
                            if (getSec(futurePC.time) >= startTimeSec) break;

                            if (futurePC.high > pc.high) isInvalidatedHigh = true;
                            if (futurePC.low < pc.low) isInvalidatedLow = true;

                            const futureTC = targetHtfMap.get(getSec(futurePC.time));
                            if (futureTC) {
                                if (futureTC.high > tc.high) isInvalidatedHigh = true;
                                if (futureTC.low < tc.low) isInvalidatedLow = true;
                            }

                            if (isInvalidatedHigh && isInvalidatedLow) break;
                        }

                        // HIGHEST TIMEFRAME PRECEDENCE
                        // If there is ANY POI in the higher timeframes that completely engulfs this exact time
                        // AND has the exact same peak price, we ignore this lower timeframe peak. (e.g. H4 within D1)
                        if ((isHighPOI || targetIsHighPOI) && !isInvalidatedHigh) {
                            const highCovered = highPOIs.some(p => p.htfTime <= pSec && pSec < (p.htfTime + p.htfSeconds) && p.primaryPrice === pc.high);

                            if (!highCovered) {
                                const exactPrimary = dataProvider.getExactPeakTime(symbol, currentTf, pSec, htfSeconds, pc.high, true);
                                const exactTarget = dataProvider.getExactPeakTime(targetSymbol, currentTf, pSec, htfSeconds, tc.high, true);

                                highPOIs.push({
                                    id: `${htf}_HIGH_${pSec}_${symbol}_vs_${targetSymbol}`,
                                    htfTime: pSec, exactPrimaryTime: exactPrimary, exactTargetTime: exactTarget,
                                    htfSeconds, htf, type: 'HIGH',
                                    primaryPrice: pc.high, targetPrice: tc.high,
                                    primarySwept: false, targetSwept: false, // Start un-swept in viewport
                                    divergenceFired: false
                                });
                            }
                        }

                        // LOW POI CHECK
                        if ((isLowPOI || targetIsLowPOI) && !isInvalidatedLow) {
                            const lowCovered = lowPOIs.some(p => p.htfTime <= pSec && pSec < (p.htfTime + p.htfSeconds) && p.primaryPrice === pc.low);
                            if (!lowCovered) {
                                const exactPrimary = dataProvider.getExactPeakTime(symbol, currentTf, pSec, htfSeconds, pc.low, false);
                                const exactTarget = dataProvider.getExactPeakTime(targetSymbol, currentTf, pSec, htfSeconds, tc.low, false);

                                lowPOIs.push({
                                    id: `${htf}_LOW_${pSec}_${symbol}_vs_${targetSymbol}`,
                                    htfTime: pSec, exactPrimaryTime: exactPrimary, exactTargetTime: exactTarget,
                                    htfSeconds, htf, type: 'LOW',
                                    primaryPrice: pc.low, targetPrice: tc.low,
                                    primarySwept: false, targetSwept: false,
                                    divergenceFired: false
                                });
                            }
                        }
                    }
                }
            } // end htf processing

            // Now evaluate sequentially for Divergence tracking
            for (let i = 0; i < sortedCandles.length; i++) {
                // Yield Event Loop to prevent WebSocket blocking
                if (i % 500 === 0) await new Promise(r => setImmediate(r));

                const c = sortedCandles[i];
                const cTimeSec = getSec(c.time);

                let targetCandle = targetPrices.get(cTimeSec);
                if (!targetCandle) {
                    let offset = 1;
                    while (offset < 50 && !targetCandle) {
                        targetCandle = targetPrices.get(cTimeSec - offset);
                        if (!targetCandle) targetCandle = targetPrices.get(cTimeSec + offset);
                        offset++;
                    }
                    if (!targetCandle) continue;
                }

                // Process High POIs
                for (const poi of highPOIs) {
                    if (poi.htfTime >= cTimeSec) continue;
                    if (cTimeSec < poi.htfTime + poi.htfSeconds) continue; // HTF closed

                    const currPrimarySweep = c.high > poi.primaryPrice;
                    const currTargetSweep = targetCandle.high > poi.targetPrice;

                    let newP = false, newT = false;
                    if (!poi.primarySwept && currPrimarySweep) { poi.primarySwept = true; newP = true; }
                    if (!poi.targetSwept && currTargetSweep) { poi.targetSwept = true; newT = true; }

                    if (!poi.divergenceFired && !poi.invalidated) {
                        if (newP && !poi.targetSwept) {
                            poi.divergenceFired = true;
                            divergences.push({
                                id: poi.id, symbol, target_symbol: targetSymbol, htf: poi.htf, type: 'BEARISH',
                                start_time: cTimeSec * 1000, level_time: poi.exactPrimaryTime * 1000, level_reached: poi.primaryPrice,
                                end_time: cTimeSec * 1000, max_time: cTimeSec * 1000,
                                primary_end_price: c.high, target_end_price: targetCandle.high,
                                mitigated_at: null, poi
                            });
                        } else if (newT && !poi.primarySwept) {
                            poi.divergenceFired = true;
                            divergences.push({
                                id: poi.id, symbol, target_symbol: targetSymbol, htf: poi.htf, type: 'BEARISH',
                                start_time: cTimeSec * 1000, level_time: poi.exactPrimaryTime * 1000, level_reached: poi.primaryPrice,
                                end_time: cTimeSec * 1000, max_time: cTimeSec * 1000,
                                primary_end_price: c.high, target_end_price: targetCandle.high,
                                mitigated_at: null, poi
                            });
                        }
                    }

                    // Peak Invalidation during active scrolling
                    // Wait UNTIL AFTER we have checked for and fired the divergence matching this exact sweep event.
                    // If EITHER broke it (even at different times), it is completely invalidated for NEW future divergences.
                    // Once EITHER has swept, the level is "spent". It can still track an *active* divergence,
                    // but it CANNOT spawn a brand new divergence array item 5 hours later.
                    if (poi.primarySwept || poi.targetSwept) {
                        // if (cTimeSec >= 1772812800 && poi.htf === 'H1') console.log(`[Viewport] Invalidated ${poi.id} at cTimeSec ${cTimeSec}. P:${poi.primarySwept} T:${poi.targetSwept}`);
                        poi.invalidated = true;
                    }
                }

                // Process Low POIs
                for (const poi of lowPOIs) {
                    if (poi.htfTime >= cTimeSec) continue;
                    if (cTimeSec < poi.htfTime + poi.htfSeconds) continue;

                    const currPrimarySweep = c.low < poi.primaryPrice;
                    const currTargetSweep = targetCandle.low < poi.targetPrice;

                    let newP = false, newT = false;
                    if (!poi.primarySwept && currPrimarySweep) { poi.primarySwept = true; newP = true; }
                    if (!poi.targetSwept && currTargetSweep) { poi.targetSwept = true; newT = true; }

                    if (!poi.divergenceFired && !poi.invalidated) {
                        if (newP && !poi.targetSwept) {
                            poi.divergenceFired = true;
                            divergences.push({
                                id: poi.id, symbol, target_symbol: targetSymbol, htf: poi.htf, type: 'BULLISH',
                                start_time: cTimeSec * 1000, level_time: poi.exactPrimaryTime * 1000, level_reached: poi.primaryPrice,
                                end_time: cTimeSec * 1000, max_time: cTimeSec * 1000,
                                primary_end_price: c.low, target_end_price: targetCandle.low,
                                mitigated_at: null, poi
                            });
                        } else if (newT && !poi.primarySwept) {
                            poi.divergenceFired = true;
                            divergences.push({
                                id: poi.id, symbol, target_symbol: targetSymbol, htf: poi.htf, type: 'BULLISH',
                                start_time: cTimeSec * 1000, level_time: poi.exactPrimaryTime * 1000, level_reached: poi.primaryPrice,
                                end_time: cTimeSec * 1000, max_time: cTimeSec * 1000,
                                primary_end_price: c.low, target_end_price: targetCandle.low,
                                mitigated_at: null, poi
                            });
                        }
                    }

                    // Peak Invalidation during active scrolling
                    if (poi.primarySwept || poi.targetSwept) {
                        poi.invalidated = true;
                    }
                }

                // --- POST-CANDLE FILTERING (Only 1 Divergence per Candle) ---
                const newlyFired = divergences.filter(d => d.start_time === cTimeSec * 1000 && d.target_symbol === targetSymbol);
                if (newlyFired.length > 1) {
                    const byType = { BEARISH: [], BULLISH: [] };
                    for (const d of newlyFired) byType[d.type].push(d);

                    // For BEARISH: Keep the one with the HIGHEST older candle (level_reached)
                    if (byType.BEARISH.length > 1) {
                        byType.BEARISH.sort((a, b) => b.level_reached - a.level_reached);

                        let keepIndex = 0;
                        for (let i = 0; i < byType.BEARISH.length; i++) {
                            if (i !== keepIndex) byType.BEARISH[i].toBeDeleted = true;
                        }
                    }

                    // For BULLISH: Keep the one with the LOWEST older candle (level_reached)
                    if (byType.BULLISH.length > 1) {
                        byType.BULLISH.sort((a, b) => a.level_reached - b.level_reached);

                        let keepIndex = 0;
                        for (let i = 0; i < byType.BULLISH.length; i++) {
                            if (i !== keepIndex) byType.BULLISH[i].toBeDeleted = true;
                        }
                    }
                }

                // --- CROSS-CANDLE REPLACEMENT (New Divergence Replaces Active Old Ones) ---
                // "eine aktuelle neue divergenz der aktuellen kerze ersetzt die bestehende divergenz, bis die nächste kerze dann ein tieferes high oder höhere low macht."
                const activeBearishOld = divergences.filter(d => d.type === 'BEARISH' && !d.completed && !d.mitigated_at && !d.toBeDeleted && d.start_time < cTimeSec * 1000);
                const newBearish = newlyFired.find(d => d.type === 'BEARISH' && !d.toBeDeleted);
                if (newBearish && activeBearishOld.length > 0) {
                    for (const oldDiv of activeBearishOld) {
                        // Let the new, more extreme source take over. Delete the old one.
                        oldDiv.toBeDeleted = true;
                    }
                }

                const activeBullishOld = divergences.filter(d => d.type === 'BULLISH' && !d.completed && !d.mitigated_at && !d.toBeDeleted && d.start_time < cTimeSec * 1000);
                const newBullish = newlyFired.find(d => d.type === 'BULLISH' && !d.toBeDeleted);
                if (newBullish && activeBullishOld.length > 0) {
                    for (const oldDiv of activeBullishOld) {
                        oldDiv.toBeDeleted = true;
                    }
                }
                // Mitigation and End Coordinate Tracking
                for (const div of divergences) {
                    if (div.toBeDeleted) continue;
                    if (div.mitigated_at) continue;
                    if (div.completed) continue;

                    if ((cTimeSec * 1000) - div.start_time > this.MAX_ACTIVE_MS) {
                        div.mitigated_at = cTimeSec * 1000;
                        continue;
                    }

                    if (div.type === 'BEARISH') {
                        if (c.high >= div.primary_end_price) {
                            div.primary_end_price = c.high;
                            div.end_time = cTimeSec * 1000;

                            // Keep targets synced for mitigation while growing
                            if (targetCandle.high > div.target_end_price) div.target_end_price = targetCandle.high;

                            if (div.poi.primarySwept && div.poi.targetSwept) {
                                div.mitigated_at = cTimeSec * 1000;
                            }
                        } else {
                            // "sobald aber der markt nicht mehr direkt danach wächst, ist die divergenz abgeschlossen"
                            div.completed = true;
                        }
                    } else { // BULLISH
                        if (c.low <= div.primary_end_price) {
                            div.primary_end_price = c.low;
                            div.end_time = cTimeSec * 1000;

                            // Keep targets synced for mitigation while growing
                            if (targetCandle.low < div.target_end_price) div.target_end_price = targetCandle.low;

                            if (div.poi.primarySwept && div.poi.targetSwept) {
                                div.mitigated_at = cTimeSec * 1000;
                            }
                        } else {
                            div.completed = true;
                        }
                    }
                }
            } // end loop
        } // end other symbols

        // Cleanup response with end_time and end_price
        return divergences.filter(d => !d.toBeDeleted).map(d => ({
            id: d.id,
            symbol: d.symbol,
            target_symbol: d.target_symbol,
            htf: d.htf,
            type: d.type,
            start_time: d.start_time,
            level_time: d.level_time,
            level_reached: d.level_reached,
            end_time: d.end_time, // Exact time of the peak during the sweep
            end_price: d.primary_end_price, // Exact price of the peak
            mitigated_at: d.mitigated_at
        }));
    }
}

module.exports = new DivergenceEngine();
