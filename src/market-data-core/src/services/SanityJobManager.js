const { v4: uuidv4 } = require('uuid');
const db = require('./DatabaseService');
const config = require('../config');
const { DateTime } = require("luxon");

class SanityJobManager {
    constructor() {
        this.currentJob = null;
        this.queue = [];
        this.socketServer = null;
        this.syncManager = null;
        this.isProcessing = false;

        // Cron state
        this.cronInterval = null;
    }

    setDependencies(systemOrchestrator, socketServer) {
        this.systemOrchestrator = systemOrchestrator;
        this.socketServer = socketServer;
    }

    /**
     * Creates a new job and adds it to queue.
     * @param {Object} scope { botId, symbol, timeframe, startTime, type: 'MANUAL'|'CRON' }
     */
    createJob(scope) {
        const jobId = uuidv4();
        const tasks = this.generateTasks(scope);

        const job = {
            id: jobId,
            type: scope.type || 'MANUAL',
            status: 'PENDING',
            startTime: Date.now(),
            totalTasks: tasks.length,
            completedTasks: 0,
            tasks: tasks,
            scope: scope,
            report: [] // Store report lines
        };

        console.log(`[JobManager] Job Created: ${jobId} (${job.type}) with ${tasks.length} tasks.`);
        this.queue.push(job);

        this.processQueue();

        return job;
    }

    addToReport(job, symbol, timeframe, status, details = "") {
        const line = `[${new Date().toISOString()}] ${symbol} ${timeframe}: ${status} ${details}`;
        if (job) job.report.push(line);
        // Also keep a "Global Last Report" for the API legacy support
        this.lastGlobalReport = this.lastGlobalReport || [];
        if (this.lastGlobalReport.length > 5000) this.lastGlobalReport.shift();
        this.lastGlobalReport.push(line);
    }

    getLatestReport() {
        if (!this.lastGlobalReport) return "No report available.";
        return this.lastGlobalReport.join("\n");
    }

    generateTasks(scope) {
        const tasks = [];
        const { botId, symbol, timeframe, startTime } = scope;

        // Helper to resolve symbols
        let targetSymbols = [];
        const allConfigs = this.systemOrchestrator.configuredSymbols;

        if (symbol) {
            // Specific Symbol
            targetSymbols = allConfigs.filter(S => (S.symbol === symbol)); // Filter purely by 'symbol' (BTCUSD)
        } else if (botId) {
            // Specific Bot
            targetSymbols = allConfigs.filter(S => S.botId === botId);
        } else {
            // Global
            targetSymbols = allConfigs;
        }

        // Timeframes
        const tfs = timeframe ? [timeframe] : config.DEFAULT_TIMEFRAMES;

        // Calculate Check Range (Yesterday Rule)
        // If scope.startTime is given, use it. Else default to Yesterday.
        const nowUtc = Math.floor(Date.now() / 1000);
        let startCheck = 0;
        let endCheck = Math.floor(Date.now() / 1000);

        if (startTime) {
            startCheck = Math.floor(new Date(startTime).getTime() / 1000);
        } else {
            // Default 3 days lookback for health check
            startCheck = endCheck - (3 * 86400);
        }

        // Validation
        if (startCheck >= endCheck) {
            console.warn(`[JobManager] Invalid Range: Start ${startCheck} >= End ${endCheck}. Adjusting End to Now + 1m.`);
            endCheck = startCheck + 60;
        }

        targetSymbols.forEach(conf => {
            const sym = conf.symbol;
            const bid = conf.botId || this.systemOrchestrator.resolveBotId(sym);

            if (!bid) {
                console.warn(`[JobManager] Skipping ${sym}: No BotID resolved.`);
                return;
            }

            tfs.forEach(tf => {
                tasks.push({
                    id: uuidv4(),
                    symbol: sym,
                    botId: bid,
                    timeframe: tf,
                    startUtc: startCheck,
                    endUtc: endCheck,
                    status: 'PENDING',
                    message: 'Waiting...',
                    attempts: 0
                });
            });
        });

        return tasks;
    }

    async processQueue() {
        if (this.currentJob) {
            // Busy.
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        const job = this.queue.shift();
        this.currentJob = job;
        job.status = 'RUNNING';

        this.broadcastJobUpdate(job);

        console.log(`[JobManager] Starting Job ${job.id}`);

        // Reset Global Report for new job context?
        this.lastGlobalReport = [`Job ${job.id} Started at ${new Date().toISOString()}`];

        // Sequential Execution
        for (const task of job.tasks) {
            // If job aborted? (Can add cancel logic later)

            try {
                await this.executeTask(task, job);
            } catch (e) {
                console.error(`[JobManager] Task Failed: ${task.symbol}`, e);
                task.status = 'FAIL';
                task.message = `Error: ${e.message}`;
                this.addToReport(job, task.symbol, task.timeframe, 'FAIL', e.message);
            }

            job.completedTasks++;
            this.broadcastTaskUpdate(task);
            this.broadcastJobUpdate(job); // Update progress bar

            // Analyze: If many failures, pause? Nah.
        }

        console.log(`[JobManager] Job ${job.id} COMPLETED.`);
        job.status = 'COMPLETED';
        job.endTime = Date.now();
        this.broadcastJobUpdate(job);
        this.addToReport(job, "JOB", "ALL", "COMPLETED", `Duration: ${(Date.now() - job.startTime) / 1000}s`);

        this.currentJob = null;

        // Next
        setTimeout(() => this.processQueue(), 1000);
    }

    async executeTask(task, job) {
        task.status = 'CHECKING';
        task.message = 'Verifying Data...';
        this.broadcastTaskUpdate(task);

        const { symbol, timeframe, botId, startUtc, endUtc } = task;
        const tfSeconds = this.systemOrchestrator.getSeconds(timeframe);

        // precise end alignment
        const safeEnd = endUtc - (endUtc % tfSeconds);
        const safeStart = startUtc - (startUtc % tfSeconds);

        console.log(`[JobManager] Task ${symbol} ${timeframe}: Checking ${new Date(safeStart * 1000).toISOString()} -> ${new Date(safeEnd * 1000).toISOString()}`);

        // 1. Expected Count
        // Use simpler logic for now: (End - Start) / TF.
        // Session awareness is good but complex.
        // For Crypto (24/7) -> simple math.
        // For Forex -> Sessions.
        // Let's assume 24/7 for simplicity or reuse `calculateExpectedCandles` from old service if needed.
        // Or better: Use `db.getCandleCountInRange` vs Logic.
        // Let's reuse the Logic from SanityCheckService (will be migrated here or imported).

        const SanityLegacy = require('./SanityCheckService');
        // We will adapt logic here to avoid circular dep, or extract helper.
        // For now, let's just use raw count from DB vs "Ideal".
        // Ideal = (safeEnd - safeStart) / tfSeconds.
        // This assumes 24/7.
        // If we want perfection, we need SessionEngine.

        // Reuse Session Logic via internal method (copied from SanityService)
        const sessionData = await this.getSessionData(botId, symbol);
        const expected = this.calculateExpected(botId, sessionData, safeStart, safeEnd, tfSeconds);

        console.log(`[JobManager] ${symbol} ${timeframe} EXPECTED: ${expected}`);

        if (expected === 0) {
            task.status = 'OK';
            task.message = 'No session data / Closed.';
            this.addToReport(job, symbol, timeframe, 'OK', 'Expected was 0 (Market Closed/No Data)');
            return;
        }

        // 2. DB Check
        let actual = db.getCandleCountInRange(symbol, timeframe, safeStart * 1000, safeEnd * 1000); // Check MS
        console.log(`[JobManager] ${symbol} ${timeframe} ACTUAL: ${actual} / ${expected}`);



        if (actual > expected) {
            const excess = actual - expected;
            console.warn(`[JobManager] ⚠️ ${symbol} ${timeframe} has ${excess} extra candles! (Duplicates?)`);
            this.addToReport(job, symbol, timeframe, 'WARNING', `Excess Data detected (+${excess}). Possible duplicates.`);
            // Future: Trigger De-Duplication
        }

        // REMOVED EARLY EXIT: We must check for Gaps even if count is high.
        // A high count could still have gaps if data is bunched or duplicated.


        // 3. Gap Found
        task.status = 'REPAIRING';
        task.message = `Found ${actual}/${expected}. Repairing...`;
        this.broadcastTaskUpdate(task);
        this.addToReport(job, symbol, timeframe, 'REPAIRING', `Found ${actual}/${expected}`);

        const missing = expected - actual;
        console.log(`[JobManager] Task ${symbol} ${timeframe}: Missing ${missing}.`);

        // 4. FIND GAPS
        const gaps = await this.findGaps(botId, symbol, timeframe, safeStart, safeEnd, sessionData);
        console.log(`[JobManager] ${symbol} ${timeframe} GAPS: ${gaps.length}`);

        for (const gap of gaps) {
            // Repair Loop
            await this.repairGap(task, gap, job);
        }

        // 5. Final Check
        // Wait a bit for DB ingestion (SyncManager is async but executeSyncTask await should handle it?)
        // Actually, SyncManager.executeSyncTask awaits the Bot Response + Ingestion.

        const finalActual = db.getCandleCountInRange(symbol, timeframe, safeStart * 1000, safeEnd * 1000);
        const finalGap = expected - finalActual;

        if (finalActual >= expected) { // Or close enough
            task.status = 'OK';
            task.message = `Repaired (${finalActual}/${expected})`;
            this.addToReport(job, symbol, timeframe, 'REPAIRED', `Count: ${finalActual}/${expected}`);
        } else {
            // If we improved significantly?
            if (finalGap < missing) {
                // Partial Success
                task.status = 'OK'; // Or WARNING?
                task.message = `Improved (${finalActual}/${expected})`;
                this.addToReport(job, symbol, timeframe, 'PARTIAL', `Still missing ${finalGap}`);
            } else {
                task.status = 'FAIL';
                task.message = `Gap Persists (${finalGap} missing)`;
                this.addToReport(job, symbol, timeframe, 'FAIL', `No improvement. Missing ${finalGap}`);
            }
        }
    }

    async repairGap(task, gap, job) {
        // gap: { start, end, count }
        // STRICT FETCH: From Gap Start to Gap End.
        const gapStartStr = new Date(gap.start * 1000).toISOString();
        const gapEndStr = new Date(gap.end * 1000).toISOString();

        const taskCmd = {
            symbol: task.symbol,
            timeframe: task.timeframe,
            type: 'RANGE',
            fromTime: gap.start * 1000,   // Broker needs MS? SyncManager converts.
            toTime: gap.end * 1000,
            count: gap.count + 5 // buffer
        };

        console.log(`[JobManager] Repairing ${task.symbol} Gap: ${gapStartStr} - ${gapEndStr} (Count: ${gap.count})`);
        task.message = `Fetching ${new Date(gap.start * 1000).toLocaleTimeString()}...`;
        this.broadcastTaskUpdate(task);
        this.addToReport(job, task.symbol, task.timeframe, 'FETCH', `Gap: ${gapStartStr} - ${gapEndStr}`);

        // Execute via SyncManager
        await this.systemOrchestrator.executeSyncTask(taskCmd);
        // executeSyncTask needs update to handle 'RANGE'.
    }

    // --- Helpers (Ported from SanityCheckService) ---
    async getSessionData(botId, symbol) {
        const assetMapping = require('./AssetMappingService');
        const brokerSymbols = assetMapping.getBrokerSymbols(botId);
        const brokerSymbolName = this.systemOrchestrator.resolveBrokerSymbol(symbol);
        const symbolObj = brokerSymbols.find(s => s.name === brokerSymbolName || s === brokerSymbolName);
        if (typeof symbolObj === 'object' && symbolObj.sessions) {
            return symbolObj.sessions;
        }
        // Fallback: Default 24/7
        return [{ day: 0, intervals: [{ start: 0, end: 86400 }] }, { day: 1, intervals: [{ start: 0, end: 86400 }] }, { day: 2, intervals: [{ start: 0, end: 86400 }] }, { day: 3, intervals: [{ start: 0, end: 86400 }] }, { day: 4, intervals: [{ start: 0, end: 86400 }] }, { day: 5, intervals: [{ start: 0, end: 86400 }] }, { day: 6, intervals: [{ start: 0, end: 86400 }] }];
    }

    calculateExpected(botId, sessions, startUtc, endUtc, tfSeconds) {
        // ... (Same logic as SanityCheckService) ...
        const timezoneService = require('./TimezoneNormalizationService');
        let totalSeconds = 0;
        let cursor = startUtc;

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

    async findGaps(botId, symbol, timeframe, startUtc, endUtc, sessions) {
        // (Simpler gap finder: Check DB timestamps set vs Expected set)
        // ... (Logic from SanityCheckService findMissingRanges) ...
        const SanityLegacy = require('./SanityCheckService');
        // Temporary reuse until fully ported
        return SanityLegacy.findMissingRanges(botId, symbol, timeframe, startUtc, endUtc, sessions);
    }

    // --- Socket ---
    broadcastJobUpdate(job) {
        if (!this.socketServer) return;
        this.socketServer.emit('job_update', {
            id: job.id,
            status: job.status,
            progress: job.completedTasks / job.totalTasks,
            total: job.totalTasks,
            completed: job.completedTasks
        });
    }

    broadcastTaskUpdate(task) {
        if (!this.socketServer) return;
        this.socketServer.emit('task_update', {
            jobId: this.currentJob ? this.currentJob.id : null,
            symbol: task.symbol,
            timeframe: task.timeframe,
            status: task.status, // PENDING, CHECKING, REPAIRING, OK, FAIL
            message: task.message
        });
    }

    startScheduler() {
        console.log("[JobManager] Scheduler Started (Interval 5m)");
        // if (this.cronInterval) clearInterval(this.cronInterval);
        // this.cronInterval = setInterval(() => {
        //     // Auto-Check?
        //     // Keeping it manual for now as per user request ("...run also scheduled").
        //     // Implement later.
        // }, 300000);
    }
}

module.exports = new SanityJobManager();
