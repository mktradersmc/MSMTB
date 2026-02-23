const db = require('./DatabaseService');
const { DateTime } = require('luxon');

class EconomicCalendarService {
    constructor() {
        this.db = db;
        this.isFetching = false;
        // Tracking state
        this.missingFutureMonth = false;
        this.currentBackfillDate = null;
        this.months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    }

    start() {
        console.log('[EconomicCalendar] 🗓️ Starting Service...');
        // Kick off sync immediately
        this.sync();

        // Run every 4 hours (to keep current and next month updated)
        setInterval(() => this.sync(), 4 * 60 * 60 * 1000);
    }

    async sync() {
        if (this.isFetching) return;
        this.isFetching = true;

        try {
            // Determine starting point - where did we leave off?
            // Ask DB for the maximum timestamp we have, or default to Jan 2020
            const maxEvent = this.db.marketDb.prepare("SELECT MAX(timestamp) as maxTs FROM economic_calendar").get();
            let startDt = DateTime.utc(2020, 1, 1); // jan.2020

            // If we have data, start from the month of the last known event.
            // Since we fetch by month, it's safe to re-fetch the max month.
            if (maxEvent && maxEvent.maxTs) {
                const dt = DateTime.fromSeconds(maxEvent.maxTs, { zone: 'utc' });
                // We'll roll back to the 1st of that month just to ensure we have the full month
                startDt = dt.startOf('month');
            }

            const now = DateTime.utc();
            const nextMonth = now.plus({ months: 1 }).startOf('month');

            let currentDt = startDt;

            // Backfill loop up to CURRENT month
            while (currentDt <= now) {
                const monthStr = this.months[currentDt.month - 1];
                const yearStr = currentDt.year;
                const query = `${monthStr}.${yearStr}`;

                console.log(`[EconomicCalendar] Fetching history for ${query}...`);
                const success = await this.fetchAndStoreMonth(query);

                if (!success) {
                    console.error(`[EconomicCalendar] ⚠️ Failed fetching ${query}. Aborting sync run.`);
                    break;
                }

                currentDt = currentDt.plus({ months: 1 });
                // Sleep to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            }

            // After backfill, proactively try to fetch NEXT month
            const nextMonthQuery = `${this.months[nextMonth.month - 1]}.${nextMonth.year}`;
            console.log(`[EconomicCalendar] Proactive fetching next month: ${nextMonthQuery}`);
            const fetchedNext = await this.fetchAndStoreMonth(nextMonthQuery);

            if (!fetchedNext) {
                this.missingFutureMonth = true;
                console.log(`[EconomicCalendar] 🔴 Could not load next month (${nextMonthQuery}). Marked as missing.`);
            } else {
                this.missingFutureMonth = false;
                console.log(`[EconomicCalendar] 🟢 Next month loaded successfully.`);
            }

        } catch (e) {
            console.error('[EconomicCalendar] Sync error:', e);
        } finally {
            this.isFetching = false;
        }
    }

    async fetchAndStoreMonth(monthQuery) {
        try {
            const response = await fetch(`https://www.forexfactory.com/calendar?month=${monthQuery}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Cookie': 'timezoneoffset=0; timeformat=0' // Force UTC, 24h
                }
            });

            if (!response.ok) {
                console.error(`HTTP error: ${response.status}`);
                return false;
            }

            const html = await response.text();

            // Extract the big JSON block out of the script tag
            const searchStr = 'window.calendarComponentStates[1] = ';
            const startIndex = html.indexOf(searchStr);

            if (startIndex === -1) {
                console.warn(`[EconomicCalendar] Could not find component state in HTML for ${monthQuery}. Maybe no events yet?`);
                return false; // Not a network error, just no data (or struct changed)
            }

            const afterStart = html.substring(startIndex + searchStr.length);

            // Find the end of this object parsing. It's usually followed by a semicolon or script end.
            // We search for the last 'events' array, and then the end bracket.
            const regex = /("days"\s*:.*?\}\])/s;
            // A bit risky to regex HTML directly if it's huge, let's use the logic from the scraper script

            let jsonData;
            try {
                const vm = require('vm');
                const context = { window: { calendarComponentStates: [] } };
                vm.createContext(context);

                const scriptTagEnd = html.indexOf('</script>', startIndex);
                let block = html.substring(startIndex + searchStr.length, scriptTagEnd);

                // Clean up any trailing text after the assignment semicolon, if present
                vm.runInContext('window.calendarComponentStates[1] = ' + block, context);

                jsonData = context.window.calendarComponentStates[1];
            } catch (e) {
                console.error('[EconomicCalendar] VM Execution failed:', e.message);
                return false;
            }

            if (!jsonData || !jsonData.days) {
                console.error('[EconomicCalendar] Evaluation succeeded but days array is missing.');
                return false;
            }

            let hasEvents = false;
            const records = [];

            jsonData.days.forEach(day => {
                const dateStr = day.date; // e.g. "Thu\nMay 1"
                day.events.forEach(event => {
                    hasEvents = true;
                    // id (string), event_id (integer), name, country, currency, impact, timestamp, actual, forecast, previous, time_label, date_string
                    records.push({
                        id: event.id,
                        event_id: event.ebaseId ? parseInt(event.ebaseId) : 0,
                        name: event.name || '',
                        country: event.country || '',
                        currency: event.currency || '',
                        impact: event.impactTitle || event.impactName || '',
                        timestamp: parseInt(event.dateline) || 0,
                        actual: event.actual || '',
                        forecast: event.forecast || '',
                        previous: event.previous || '',
                        time_label: event.timeLabel || '',
                        date_string: dateStr || '',
                        updated_at: Date.now()
                    });
                });
            });

            if (records.length > 0) {
                this.db.saveCalendarEvents(records);
            }

            return hasEvents; // True if we successfully found events

        } catch (e) {
            console.error(`[EconomicCalendar] fetchAndStoreMonth error for ${monthQuery}:`, e);
            return false;
        }
    }
}

module.exports = new EconomicCalendarService();
