import { BaseWidget } from '../widgets/BaseWidget';
import { IChartApi, ISeriesApi, Time, Coordinate } from 'lightweight-charts';
import { Point } from '../widgets/types';
import { getTimeframeSeconds } from '../../../utils/chartUtils';

// --- Interfaces ---

export interface LevelsSettings {
    // Daily / Weekly / Monthly (DWM) - Uses Broker Time
    show_d_open: boolean;
    d_open_label: string;
    d_open_color: string;
    show_d_hl: boolean; // Pivots (Prev High/Low)
    show_d_sep: boolean;
    broker_timezone: string; // e.g. "Europe/Athens" or "UTC"

    show_w_open: boolean;
    w_open_label: string;
    w_open_color: string;
    show_w_hl: boolean;
    show_w_sep: boolean;

    show_m_open: boolean;
    m_open_label: string;
    m_open_color: string;
    show_m_hl: boolean;
    show_m_sep: boolean;

    show_weekday_labels: boolean;

    // Custom Opens (TDO - NY Midnight)
    show_tdo: boolean;
    tdo_color: string;

    // Visuals
    linewidth: number;
    linestyle: 'Solid' | 'Dashed' | 'Dotted';
    show_labels: boolean;
}

interface LevelItem {
    type: string;
    price: number;
    startTime: number;
    endTime: number;
    color: string;
    label: string;
    style: 'Solid' | 'Dashed' | 'Dotted';
}

interface SeparatorItem {
    time: number;
    color: string;
    type: 'D' | 'W' | 'M';
    label?: string; // Weekday label
}

export interface LevelsState {
    settings: LevelsSettings;
    levels: LevelItem[];
    separators: SeparatorItem[];
    data: any[];
    timeframe?: string;
    lastCandleTime?: number;
}

export class LevelsPlugin extends BaseWidget<LevelsState> {

    constructor(settings: LevelsSettings) {
        super({ settings, levels: [], separators: [], data: [], timeframe: undefined });
    }

    public updateSettings(settings: LevelsSettings) {
        this._data.settings = settings;
        this.recalculateLevels();
        this.requestUpdate();
    }

    public updateTimeframe(timeframe: string) {
        if (this._data.timeframe !== timeframe) {
            this._data.timeframe = timeframe;
            // Recalculate if needed (often levels depend on lower timeframe data aggregation)
            this.recalculateLevels();
            this.requestUpdate();
        }
    }

    public updateCurrentTime(time: number) {
        this._data.lastCandleTime = time;
        this.requestUpdate();
    }

    public updateData(data: any[]) {
        this._data.data = data;
        this.recalculateLevels();
        this.requestUpdate();
    }

    // --- Calculation Logic ---

    private recalculateLevels() {
        const { data, settings } = this._data;
        if (!data || data.length === 0) return;

        // Reset
        this._data.levels = [];
        this._data.separators = [];

        this.calculateSegments(data, settings);
    }

    private calculateSegments(data: any[], settings: LevelsSettings) {
        if (!data.length) return;

        const levels: LevelItem[] = [];
        const separators: SeparatorItem[] = [];

        // Active Lists for Auto-Closing
        let activeDaily: LevelItem[] = [];
        let activeWeekly: LevelItem[] = [];
        let activeMonthly: LevelItem[] = [];

        const brokerTz = settings.broker_timezone || 'UTC';
        const tdoTz = 'America/New_York'; // HARDCODED as per requirement

        // Opener State Latch (Index -> Last Day Key)
        const openerState = new Map<number, string>();

        // 1. Broker Format (for D/W/M)
        const brokerFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: brokerTz,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false
        });

        // 2. Reference Format (for Custom Opens)
        // 2. Reference Format (for True Day Open - NY)
        const tdoFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tdoTz,
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        let currentDay: string | null = null;
        let currentWeekday: string | null = null;
        let currentWeek: string | null = null;
        let currentMonth: string | null = null;

        let dayStartIdx = 0;
        let prevDayHigh = NaN, prevDayLow = NaN;
        let prevDayHighTime = NaN, prevDayLowTime = NaN;

        let weekStartIdx = 0;
        let prevWeekHigh = NaN, prevWeekLow = NaN;
        let prevWeekHighTime = NaN, prevWeekLowTime = NaN;

        let monthStartIdx = 0;
        let prevMonthHigh = NaN, prevMonthLow = NaN;
        let prevMonthHighTime = NaN, prevMonthLowTime = NaN;

        // Helpers for Level Creation
        const addLevel = (list: LevelItem[], activeList: LevelItem[], item: LevelItem) => {
            list.push(item);
            activeList.push(item);
        };

        const closeLevels = (activeList: LevelItem[], time: number) => {
            activeList.forEach(l => l.endTime = time);
            activeList.length = 0; // Clear array
        };

        // We iterate through data
        for (let i = 0; i < data.length; i++) {
            const candle = data[i];
            const d = new Date(candle.time * 1000);

            // --- BROKER TIME LOGIC (D/W/M) ---
            const brokerParts = brokerFmt.formatToParts(d);
            const bp: any = {};
            brokerParts.forEach(x => bp[x.type] = x.value);

            const dayKey = `${bp.year}-${bp.month}-${bp.day}`;
            const monthKey = `${bp.year}-${bp.month}`;

            // DAY CHANGE
            if (dayKey !== currentDay) {
                // Check if we are transitioning from Sun -> Mon
                const isSunToMon = currentWeekday === 'Sun' && bp.weekday === 'Mon';

                if (!isSunToMon) {
                    // 1. CLOSE Previous Day Levels
                    if (currentDay !== null) {
                        closeLevels(activeDaily, candle.time);

                        // Determine Prev Pivot Stats: DAILY
                        let dH = -Infinity, dL = Infinity;
                        let dHT = NaN, dLT = NaN;
                        const prevEnd = i - 1;
                        for (let j = dayStartIdx; j <= prevEnd; j++) {
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;

                            if (barHigh > dH) {
                                dH = barHigh;
                                dHT = barTime;
                            }
                            if (barLow < dL) {
                                dL = barLow;
                                dLT = barTime;
                            }
                        }
                        prevDayHigh = dH;
                        prevDayLow = dL;
                        prevDayHighTime = dHT;
                        prevDayLowTime = dLT;
                    }

                } // End if !isSunToMon

                currentDay = dayKey;
                currentWeekday = bp.weekday;

                if (!isSunToMon) {
                    dayStartIdx = i;

                    // Separator
                    if (settings.show_d_sep) {
                        separators.push({
                            time: candle.time,
                            color: settings.d_open_color,
                            type: 'D',
                            label: settings.show_weekday_labels ? bp.weekday : undefined
                        });
                    }

                    // Daily Open
                    if (settings.show_d_open) {
                        addLevel(levels, activeDaily, {
                            type: 'D_OPEN',
                            price: candle.open,
                            startTime: candle.time,
                            endTime: Infinity,
                            color: settings.d_open_color,
                            label: settings.d_open_label,
                            style: settings.linestyle
                        });
                    }

                    // Pivots (D)
                    if (settings.show_d_hl && !isNaN(prevDayHigh)) {
                        addLevel(levels, activeDaily, { type: 'PDH', price: prevDayHigh, startTime: prevDayHighTime, endTime: Infinity, color: settings.d_open_color, label: 'PDH', style: settings.linestyle });
                        addLevel(levels, activeDaily, { type: 'PDL', price: prevDayLow, startTime: prevDayLowTime, endTime: Infinity, color: settings.d_open_color, label: 'PDL', style: settings.linestyle });
                    }
                }

                // WEEK CHANGE (Mon)
                const isMonday = bp.weekday === 'Mon';
                let isNewWeek = false;
                if (currentWeek === null) isNewWeek = true;
                else if (isMonday && dayKey !== currentWeek) isNewWeek = true;

                if (isNewWeek) {
                    // WEEK CLOSED
                    if (currentWeek !== null) {
                        closeLevels(activeWeekly, candle.time);

                        let wH = -Infinity, wL = Infinity;
                        let wHT = NaN, wLT = NaN;
                        const prevEnd = i - 1;
                        for (let j = weekStartIdx; j <= prevEnd; j++) {
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;

                            if (barHigh > wH) {
                                wH = barHigh;
                                wHT = barTime;
                            }
                            if (barLow < wL) {
                                wL = barLow;
                                wLT = barTime;
                            }
                        }
                        prevWeekHigh = wH;
                        prevWeekLow = wL;
                        prevWeekHighTime = wHT;
                        prevWeekLowTime = wLT;
                    }

                    currentWeek = dayKey;
                    weekStartIdx = i;

                    if (settings.show_w_sep) separators.push({ time: candle.time, color: settings.w_open_color, type: 'W' });

                    if (settings.show_w_open) {
                        addLevel(levels, activeWeekly, { type: 'W_OPEN', price: candle.open, startTime: candle.time, endTime: Infinity, color: settings.w_open_color, label: settings.w_open_label, style: settings.linestyle });
                    }

                    // Add WEEKLY PIVOTS
                    if (settings.show_w_hl && !isNaN(prevWeekHigh)) {
                        addLevel(levels, activeWeekly, { type: 'PWH', price: prevWeekHigh, startTime: prevWeekHighTime, endTime: Infinity, color: settings.w_open_color, label: 'PWH', style: settings.linestyle });
                        addLevel(levels, activeWeekly, { type: 'PWL', price: prevWeekLow, startTime: prevWeekLowTime, endTime: Infinity, color: settings.w_open_color, label: 'PWL', style: settings.linestyle });
                    }
                }

                // MONTH CHANGE
                if (monthKey !== currentMonth) {
                    // MONTH CLOSED
                    if (currentMonth !== null) {
                        closeLevels(activeMonthly, candle.time);

                        let mH = -Infinity, mL = Infinity;
                        let mHT = NaN, mLT = NaN;
                        const prevEnd = i - 1;
                        for (let j = monthStartIdx; j <= prevEnd; j++) {
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;

                            if (barHigh > mH) {
                                mH = barHigh;
                                mHT = barTime;
                            }
                            if (barLow < mL) {
                                mL = barLow;
                                mLT = barTime;
                            }
                        }
                        prevMonthHigh = mH;
                        prevMonthLow = mL;
                        prevMonthHighTime = mHT;
                        prevMonthLowTime = mLT;
                    }

                    currentMonth = monthKey;
                    monthStartIdx = i;

                    if (settings.show_m_sep) separators.push({ time: candle.time, color: settings.m_open_color, type: 'M' });

                    if (settings.show_m_open) {
                        addLevel(levels, activeMonthly, { type: 'M_OPEN', price: candle.open, startTime: candle.time, endTime: Infinity, color: settings.m_open_color, label: settings.m_open_label, style: settings.linestyle });
                    }

                    // Add MONTHLY PIVOTS
                    if (settings.show_m_hl && !isNaN(prevMonthHigh)) {
                        addLevel(levels, activeMonthly, { type: 'PMH', price: prevMonthHigh, startTime: prevMonthHighTime, endTime: Infinity, color: settings.m_open_color, label: 'PMH', style: settings.linestyle });
                        addLevel(levels, activeMonthly, { type: 'PML', price: prevMonthLow, startTime: prevMonthLowTime, endTime: Infinity, color: settings.m_open_color, label: 'PML', style: settings.linestyle });
                    }
                }
            }

            // --- TDO LOGIC (New York 00:00) ---
            const tdoParts = tdoFmt.formatToParts(d);
            const tp: any = {};
            tdoParts.forEach(x => tp[x.type] = x.value);
            const tdoTimeStr = `${tp.hour}:${tp.minute}`;
            const tdoDayKey = `${tp.year}-${tp.month}-${tp.day}`;

            const openers = [
                { en: settings.show_tdo, t: '00:00', l: 'True Day Open', c: settings.tdo_color },
            ];

            openers.forEach((opt, idx) => {
                if (!opt.en) return;

                // Exclude Sunday (NY Time) - Market Open (17:00) should not trigger TDO (00:00)
                // This prevents "Ghost TDO" at chart start
                if (tp.weekday === 'Sun') return;

                // Latch Check
                const lastDay = openerState.get(idx);
                if (lastDay === tdoDayKey) return;

                // Time Check (First candle >= target)
                if (tdoTimeStr >= opt.t) {
                    addLevel(levels, activeDaily, {
                        type: 'CUSTOM_OPEN',
                        price: candle.open,
                        startTime: candle.time,
                        endTime: Infinity,
                        color: opt.c,
                        label: opt.l,
                        style: 'Dotted'
                    });
                    openerState.set(idx, tdoDayKey);
                }
            });
        }

        this._data.levels = levels;
        this._data.separators = separators;
    }

    // --- Drawing ---

    drawBody(ctx: CanvasRenderingContext2D): void {
        const { levels, separators, settings, lastCandleTime } = this._data;
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        if (!visibleRange) return;

        const rightEdgeTime = lastCandleTime || (Date.now() / 1000);

        ctx.save();

        // Draw Separators
        separators.forEach(sep => {
            const x = timeScale.timeToCoordinate(sep.time as Time);
            if (x === null) return;

            ctx.beginPath();
            ctx.strokeStyle = sep.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.moveTo(x as number, 0);
            ctx.lineTo(x as number, ctx.canvas.height);
            ctx.stroke();

            // Draw Weekday Label
            if (sep.label) {
                ctx.fillStyle = sep.color; // or generic gray?
                ctx.font = '10px Roboto';
                ctx.textAlign = 'center';
                ctx.globalAlpha = 0.6;
                ctx.fillText(sep.label, x as number, ctx.canvas.height - 10);
                ctx.globalAlpha = 1.0;
                ctx.textAlign = 'left';
            }
        });

        // Draw Levels
        levels.forEach(lvl => {
            const x1 = timeScale.timeToCoordinate(lvl.startTime as Time);
            const end = (lvl.endTime === Infinity) ? rightEdgeTime : lvl.endTime;
            const x2 = timeScale.timeToCoordinate(end as Time);

            const y = this._series!.priceToCoordinate(lvl.price);
            if (y === null) return;

            let drawX1 = x1;
            let drawX2 = x2;

            if (drawX1 === null) {
                if (lvl.startTime < (visibleRange.from as number)) drawX1 = -10 as Coordinate;
                else return;
            }
            if (drawX2 === null) {
                if (end >= (visibleRange.to as number)) drawX2 = this._chart!.timeScale().width() as Coordinate;
                else return;
            }

            ctx.beginPath();
            ctx.strokeStyle = lvl.color;
            ctx.lineWidth = settings.linewidth;
            if (lvl.style === 'Dashed') ctx.setLineDash([5, 5]);
            else if (lvl.style === 'Dotted') ctx.setLineDash([2, 2]);
            else ctx.setLineDash([]);

            ctx.moveTo(drawX1 as number, y);
            ctx.lineTo(drawX2 as number, y);
            ctx.stroke();

            if (settings.show_labels && lvl.label) {
                ctx.fillStyle = lvl.color;
                ctx.font = '10px Roboto';
                ctx.textAlign = 'right';
                // Always draw label at the end of the line (Right Side)
                ctx.fillText(lvl.label, (drawX2 as number), y - 6);
                ctx.textAlign = 'left'; // reset
            }
        });

        ctx.restore();
    }

    // --- Hit Test ---
    protected hitTestBody(point: any): boolean { return false; }
    protected applyDrag(target: string, newPoint: Point): void { }
    public updateGeometry(timeScale: any, series: any): void { }
}

// --- Schema ---
export const LevelsSchema = [
    { group: 'Settings', id: 'broker_timezone', type: 'text', title: 'Broker Timezone', def: 'Europe/Berlin' },

    { group: 'Daily', id: 'show_d_open', type: 'bool', title: 'Show Daily Open', def: true },
    { group: 'Daily', id: 'd_open_color', type: 'color', title: 'Daily Color', def: '#3b82f6' },
    { group: 'Daily', id: 'd_open_label', type: 'text', title: 'Label', def: 'D Open' },
    { group: 'Daily', id: 'show_d_hl', type: 'bool', title: 'Show Prev D High/Low', def: true },
    { group: 'Daily', id: 'show_d_sep', type: 'bool', title: 'Show Separators', def: true },
    { group: 'Daily', id: 'show_weekday_labels', type: 'bool', title: 'Show Weekdays', def: true },

    { group: 'Weekly', id: 'show_w_open', type: 'bool', title: 'Show Weekly Open', def: false },
    { group: 'Weekly', id: 'w_open_color', type: 'color', title: 'Weekly Color', def: '#10b981' },
    { group: 'Weekly', id: 'w_open_label', type: 'text', title: 'Label', def: 'W Open' },
    { group: 'Weekly', id: 'show_w_hl', type: 'bool', title: 'Show Prev W High/Low', def: false },
    { group: 'Weekly', id: 'show_w_sep', type: 'bool', title: 'Show Separators', def: false },

    { group: 'Monthly', id: 'show_m_open', type: 'bool', title: 'Show Monthly Open', def: false },
    { group: 'Monthly', id: 'm_open_color', type: 'color', title: 'Monthly Color', def: '#ef4444' },
    { group: 'Monthly', id: 'm_open_label', type: 'text', title: 'Label', def: 'M Open' },
    { group: 'Monthly', id: 'show_m_hl', type: 'bool', title: 'Show Prev M High/Low', def: false },
    { group: 'Monthly', id: 'show_m_sep', type: 'bool', title: 'Show Separators', def: false },

    // Custom
    { group: 'True Day Open', id: 'show_tdo', type: 'bool', title: 'Show True Day Open', def: true },
    { group: 'True Day Open', id: 'tdo_color', type: 'color', title: 'Color', def: '#808080' },

    { group: 'Visuals', id: 'linewidth', type: 'number', title: 'Line Width', def: 1 },
    { group: 'Visuals', id: 'linestyle', type: 'select', title: 'Style', def: 'Dashed', options: ['Solid', 'Dashed', 'Dotted'] },
    { group: 'Visuals', id: 'show_labels', type: 'bool', title: 'Show Labels', def: true },
];
