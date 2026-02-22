const db = require('./DatabaseService');
const assetMapping = require('./AssetMappingService');
const timezoneService = require('./TimezoneNormalizationService');
const { DateTime } = require("luxon");
const config = require('../config');
const systemOrchestrator = require('./SystemOrchestrator');

class SanityCheckService {
    constructor() {
        this.activeBots = new Set(); // Track active botIds
        this.lastReport = [];
        // Key: "BotID" -> Timestamp (Last Sanity Check)
        this.lastChecks = new Map();
    }

    /**
     * Run Sanity Check for a specific Bot's symbols.
     * @param {string} botId 
     * @param {object} options { startTime: number (UTC Sec), symbols: [], timeframes: [] }
     */
    async runSanityCheck(botId, options = {}) {
        if (!systemOrchestrator) {
            console.warn("[Sanity] SyncManager not set. Skipping.");
            return;
        }
        if (systemOrchestrator && systemOrchestrator.activeFocus) {
            console.log(`[Sanity] 🛑 Skipping Startup/Registration Check for ${botId}: Focus Active (${systemOrchestrator.activeFocus.symbol}).`);
            return;
        }

        if (this.activeBots.has(botId)) {
            console.log(`[Sanity] ⚠️ Check already in progress for ${botId}. Ignoring.`);
            return;
        }

        // Lock this bot
        this.activeBots.add(botId);

        // If this is the FIRST active bot, clear the report (New Session)
        // This is a heuristic. If multiple start exactly same time, might be racey, but acceptable for single user.
        if (this.activeBots.size === 1) {
            this.lastReport = [];
        }

        console.log(`[Sanity] 🛡️ Starting Sanity Check for ${botId}... Options:`, JSON.stringify(options));

        try {
            // Broadcast Immediate "Starting" for requested scope
            if (options.symbols && options.symbols.length > 0) {
                options.symbols.forEach(s => {
                    systemOrchestrator.broadcastSanityUpdate({
                        symbol: s,
                        status: 'CHECKING',
                        message: `Initializing check on ${botId}...`
                    });
                });
            }

            // 1. Get Configured Symbols for this Bot
            const botSymbols = assetMapping.getBrokerSymbols(botId);

            // Filter relevant symbols
            let relevantSymbols = systemOrchestrator.configuredSymbols.filter(s => {
                const sBotId = s.botId || systemOrchestrator.resolveBotId(s.symbol || s.name);
                return sBotId === botId;
            });

            // Filter by specific symbols if requested
            if (options.symbols && options.symbols.length > 0) {
                relevantSymbols = relevantSymbols.filter(s => options.symbols.includes(s.symbol || s.name));
            }

            if (relevantSymbols.length === 0) {
                console.log(`[Sanity] No configured (or matching) symbols for ${botId}. Aborting.`);
                return;
            }

            // 2. Determine Time Check Range
            let startCheckTime = 0;
            if (options.startTime) {
                startCheckTime = options.startTime;
            } else {
                // Default logic: resume from last known or 24h
                const configKey = `sanity_last_run_${botId}`;
                const lastRunStored = db.getConfig(configKey);
                if (lastRunStored) {
                    startCheckTime = Number(lastRunStored);
                } else {
                    startCheckTime = Math.floor(Date.now() / 1000) - (24 * 3600);
                }
            }

            const nowUtc = Math.floor(Date.now() / 1000);
            // Stick to "Yesterday Rule" for stability/completeness
            const currentBrokerTime = timezoneService.convertUtcToBroker(botId, nowUtc);
            const brokerDate = DateTime.fromSeconds(currentBrokerTime, { zone: 'UTC' });
            const startOfTodayBroker = brokerDate.startOf('day').toSeconds();
            const endOfYesterdayUtc = timezoneService.convertBrokerToUtc(botId, startOfTodayBroker);

            const endCheckTime = endOfYesterdayUtc;

            // If manual start time is vastly recent (e.g. today), we might want to check up to NOW?
            // "Ich habe auf einen einzelnen Tag geklickt" implies checking history.
            // Let's stick to endCheckTime being end of yesterday unless override?
            // Actually, if user requests a check from 7 days ago... we check 7 days ago -> yesterday.
            // If user requests check from TODAY? 
            // Currently UI sets start date. End date is always fixed to "End of Yesterday" in logic.
            // This might be why "Idle" if Start >= End.

            if (startCheckTime >= endCheckTime) {
                console.log(`[Sanity] ⏳ Up to date for ${botId}. Start: ${startCheckTime} >= End: ${endCheckTime}. Skipping.`);

                // If specific symbols requested, we should tell user "Up to Date"
                if (options.symbols && options.symbols.length > 0) {
                    options.symbols.forEach(s => {
                        systemOrchestrator.broadcastSanityUpdate({
                            symbol: s,
                            status: 'OK',
                            message: `Up to date (Yesterday).`
                        });
                    });
                }
                return;
            }

            console.log(`[Sanity] 🔎 Range: ${new Date(startCheckTime * 1000).toISOString()} -> ${new Date(endCheckTime * 1000).toISOString()}`);

            let success = true;
            let gapsFound = false;

            // Iterate SEQUENTIALLY
            for (const symConfig of relevantSymbols) {
                const symbol = symConfig.symbol || symConfig.name;
                try {
                    // --- PRIORITY MODE: YIELD TO LIVE CHART ---
                    if (systemOrchestrator && systemOrchestrator.activeFocus) {
                        console.log(`[Sanity] 🛑 Aborting check for ${botId}: Live Focus Active (${systemOrchestrator.activeFocus.symbol})`);
                        systemOrchestrator.broadcastSanityUpdate({
                            symbol: symbol,
                            status: 'PAUSED',
                            message: 'Yielding to Live Chart...'
                        });
                        break;
                    }

                    // Check Symbol (and its Timeframes) sequentially
                    const hasGap = await this.checkSymbol(botId, symbol, startCheckTime, endCheckTime, botSymbols, options.timeframes);

                    if (hasGap) {
                        gapsFound = true;
                    } else {
                        // All Good
                    }
                } catch (e) {
                    console.error(`[Sanity] ❌ Error checking ${symbol}:`, e);
                    success = false;
                    systemOrchestrator.broadcastSanityUpdate({
                        symbol,
                        status: 'ERROR',
                        message: e.message
                    });
                }
            }

            // Update Last Run ONLY if Global Check
            const isPartial = (options.symbols && options.symbols.length > 0) || (options.timeframes && options.timeframes.length > 0);
            const isManual = !!options.startTime || isPartial;

            if (!isManual && success && !gapsFound) {
                const configKey = `sanity_last_run_${botId}`;
                db.setConfig(configKey, endCheckTime);
                console.log(`[Sanity] ✅ Check Complete for ${botId}. State updated.`);
            }
        } finally {
            this.activeBots.delete(botId);
        }
    }

    getLatestReport() {
        // Build a text report from the last run
        if (!this.lastReport || this.lastReport.length === 0) return "No report available.";

        let lines = [];
        lines.push(`Sanity Check Report (Generated: ${new Date().toLocaleString()})`);
        lines.push("==================================================================");

        for (const item of this.lastReport) {
            lines.push(`[${item.status}] ${item.symbol} (${item.timeframe})`);
            if (item.gaps && item.gaps.length > 0) {
                lines.push(`    Missing Ranges:`);
                for (const gap of item.gaps) {
                    if (gap.start === gap.end) {
                        lines.push(`    - ${new Date(gap.start * 1000).toISOString()}`);
                    } else {
                        lines.push(`    - ${new Date(gap.start * 1000).toISOString()} -> ${new Date(gap.end * 1000).toISOString()} (Count: ${gap.count})`);
                    }
                }
            } else if (item.status === 'OK') {
                lines.push(`    OK.`);
            }
            lines.push("");
        }

        return lines.join("\n");
    }

    /**
     * Checks a single symbol for gaps. Returns TRUE if gap found.
     * Executes TF checks sequentially and WAITS for repairs.
     */
    async checkSymbol(botId, symbol, startUtc, endUtc, brokerSymbols, specificTimeframes = null) {
        const brokerSymbolName = systemOrchestrator.resolveBrokerSymbol(symbol);
        const symbolObj = brokerSymbols.find(s => s.name === brokerSymbolName || s === brokerSymbolName);

        let sessionData = null;
        if (typeof symbolObj === 'object' && symbolObj.sessions) {
            sessionData = symbolObj.sessions;
        } else {
            console.warn(`[Sanity] ⚠️ No session data for ${symbol}. Skipping.`);
            return false;
        }

        const timeframes = specificTimeframes && specificTimeframes.length > 0 ? specificTimeframes : config.DEFAULT_TIMEFRAMES;
        let gapDetectedInSymbol = false;

        for (const tf of timeframes) {
            // --- PRIORITY MODE: YIELD TO LIVE CHART ---
            if (systemOrchestrator && systemOrchestrator.activeFocus) {
                console.log(`[Sanity] 🛑 Aborting symbol check for ${symbol} ${tf}: Live Focus Active.`);
                return false;
            }

            const tfSeconds = systemOrchestrator.getSeconds(tf);
            let safeEnd = endUtc - (endUtc % tfSeconds);
            const expectedSafe = this.calculateExpectedCandles(botId, sessionData, startUtc, safeEnd, tfSeconds);

            if (expectedSafe === 0) continue;

            // Notify TF Check
            systemOrchestrator.broadcastSanityUpdate({
                symbol,
                timeframe: tf,
                status: 'CHECKING',
                message: 'Verifying count...'
            });

            // 1. Initial Check
            let actual = db.getCandleCountInRange(symbol, tf, startUtc * 1000, safeEnd * 1000);

            if (actual < expectedSafe) {
                console.warn(`[Sanity] 🚨 GAP DETECTED: ${symbol} ${tf}. Expected ${expectedSafe}, Found ${actual}. Analyzing missing ranges...`);

                // --- SMART REPAIR ---
                let attempts = 0;
                const MAX_ATTEMPTS = 50; // Increased to allow deep backfill of large gaps (e.g. 1 week M1)

                while (attempts < MAX_ATTEMPTS) {
                    attempts++;

                    // 1. Identify Precise Gaps
                    const gaps = await this.findMissingRanges(botId, symbol, tf, startUtc, safeEnd, sessionData);

                    if (gaps.length === 0) {
                        console.log(`[Sanity] ✅ Gaps resolved for ${symbol} ${tf}.`);
                        break;
                    }

                    // 2. Dispatch Repairs for Signficant Gaps
                    const repairPromises = [];
                    let totalMissing = 0;

                    for (const gap of gaps) {
                        // limit batch size (if gap is HUGE, split it? No, syncManager handles count)
                        // Gap: { start, end, count }
                        // We use DEEP fetch from Gap End (Backward fill)

                        totalMissing += gap.count;

                        // Skip tiny gaps if we want? No, user wants perfection.

                        // Execute via Queue (Strict Serialization)
                        // Priority 8 (Lower than FAST=2, Higher than DEEP=10? Wait... DEEP is 10)
                        // Sanity Repairs are important but should queue. Let's use priority 8.
                        await systemOrchestrator.enqueueRequest(
                            symbol,
                            tf,
                            'DEEP',
                            gap.end * 1000,
                            8,
                            gap.count + 5
                        );
                    }

                    if (totalMissing === 0) break; // Should not happen if gaps > 0

                    console.log(`[Sanity] Repair Pass ${attempts} complete. Re-evaluating...`);
                }

                // Final Verification
                const finalGaps = await this.findMissingRanges(botId, symbol, tf, startUtc, safeEnd, sessionData);

                if (finalGaps.length === 0) {
                    systemOrchestrator.broadcastSanityUpdate({
                        symbol,
                        timeframe: tf,
                        status: 'OK',
                        message: `Repaired (${attempts} passes).`
                    });
                    this.logReportItem(symbol, tf, 'OK');
                } else {
                    const missingCount = finalGaps.reduce((acc, g) => acc + g.count, 0);
                    systemOrchestrator.broadcastSanityUpdate({
                        symbol,
                        timeframe: tf,
                        status: 'INCOMPLETE',
                        message: `Missing ${missingCount} candles. See Report.`
                    });
                    this.logReportItem(symbol, tf, 'INCOMPLETE', finalGaps);
                    gapDetectedInSymbol = true;
                }

            } else {
                // All Good
                // console.log(`[Sanity] ✅ MATCH ${symbol} ${tf}`);
                systemOrchestrator.broadcastSanityUpdate({
                    symbol,
                    timeframe: tf,
                    status: 'OK',
                    message: 'Complete.'
                });
                this.logReportItem(symbol, tf, 'OK');
            }

            // Small delay to allow UI to render updates smoothly
            await new Promise(r => setTimeout(r, 20));
        }
        return gapDetectedInSymbol;
    }

    logReportItem(symbol, timeframe, status, gaps = []) {
        if (!this.lastReport) this.lastReport = [];
        this.lastReport.push({ symbol, timeframe, status, gaps });
    }

    async findMissingRanges(botId, symbol, tf, startUtc, endUtc, sessions) {
        const tfSeconds = systemOrchestrator.getSeconds(tf);
        // DB uses Milliseconds. Convert inputs to MS, then map results back to Seconds for logic.
        const dbTimestamps = db.getTimestamps(symbol, tf, startUtc * 1000, endUtc * 1000);
        const existingTimestamps = new Set(dbTimestamps.map(t => Math.floor(t / 1000)));
        const missingRanges = [];

        // Iterate expected intervals
        // Similar logic to calculateExpectedCandles but we enumerate

        let cursor = startUtc;

        // Optimize: Pre-calculate valid session intervals in UTC for the whole range if possible
        // But iterating day-by-day is robust.

        let currentGapStart = null;
        let gapCount = 0;

        const closeGap = (lastMissingTime) => {
            if (currentGapStart !== null) {
                missingRanges.push({
                    start: currentGapStart,
                    end: lastMissingTime,
                    count: gapCount
                });
                currentGapStart = null;
                gapCount = 0;
            }
        };

        while (cursor < endUtc) {
            const brokerTime = timezoneService.convertUtcToBroker(botId, cursor);
            const brokerDate = DateTime.fromSeconds(brokerTime, { zone: 'UTC' });
            const dayOfWeek = brokerDate.weekday % 7;

            const daySessionsObj = sessions.find(s => s.day === dayOfWeek);
            const intervals = daySessionsObj ? daySessionsObj.intervals : [];
            const brokerDayStart = brokerDate.startOf('day').toSeconds();

            for (const session of intervals) {
                const sessStartBroker = brokerDayStart + session.start;
                const sessEndBroker = brokerDayStart + session.end;
                const sessStartUtc = timezoneService.convertBrokerToUtc(botId, sessStartBroker);
                const sessEndUtc = timezoneService.convertBrokerToUtc(botId, sessEndBroker);

                // Range for this session relevant to our check
                let t = Math.max(sessStartUtc, startUtc);

                // Align t to absolute grid (Unix Timestamp % TF == 0)
                if (t % tfSeconds !== 0) {
                    // Move to next boundary
                    t = t - (t % tfSeconds) + tfSeconds;
                }

                // Ensure we haven't jumped past startUtc (we started at max(sess, start), so we are >= start)
                // If the alignment pushed us forward, that's correct for the first valid candle timestamp.

                const limit = Math.min(sessEndUtc, endUtc);

                while (t < limit) {
                    if (!existingTimestamps.has(t)) {
                        if (currentGapStart === null) currentGapStart = t;
                        gapCount++;
                    } else {
                        // Found a candle, close gap if open
                        if (currentGapStart !== null) {
                            closeGap(t - tfSeconds); // Gap ends at the previous candle. t is the first EXISTING one.
                        }
                    }
                    t += tfSeconds;
                }

                // End of session, but gaps might continue to next session IF consecutive?
                // Actually no, sessions are disjoint usually. So close gap at end of session.
                if (currentGapStart !== null) {
                    closeGap(limit - tfSeconds);
                }
            }
            cursor += 86400; // Next Day
        }

        return missingRanges;
    }

    /**
     * Calculates expected candles for a timeframe in a UTC range based on Broker Sessions.
     */
    calculateExpectedCandles(botId, sessions, startUtc, endUtc, tfSeconds) {
        let totalSeconds = 0;
        let cursor = startUtc;

        while (cursor < endUtc) {
            const brokerTime = timezoneService.convertUtcToBroker(botId, cursor);
            const brokerDate = DateTime.fromSeconds(brokerTime, { zone: 'UTC' });
            const dayOfWeek = brokerDate.weekday % 7;
            const daySessionsObj = sessions.find(s => s.day === dayOfWeek);
            const intervals = daySessionsObj ? daySessionsObj.intervals : [];
            const brokerDayStart = brokerDate.startOf('day').toSeconds();
            const brokerDayEnd = brokerDayStart + 86400;

            for (const session of intervals) {
                const sessStartBroker = brokerDayStart + session.start;
                const sessEndBroker = brokerDayStart + session.end;
                const sessStartUtc = timezoneService.convertBrokerToUtc(botId, sessStartBroker);
                const sessEndUtc = timezoneService.convertBrokerToUtc(botId, sessEndBroker);

                const intersectStart = Math.max(sessStartUtc, startUtc);
                const intersectEnd = Math.min(sessEndUtc, endUtc);

                if (intersectEnd > intersectStart) {
                    totalSeconds += (intersectEnd - intersectStart);
                }
            }
            cursor += 86400;
        }

        return Math.floor(totalSeconds / tfSeconds);
    }
    get isChecking() {
        return this.activeBots.size > 0;
    }
}

module.exports = new SanityCheckService();
