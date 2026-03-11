import { BaseWidget, WidgetState } from '../widgets/BaseWidget';
import { IChartApi, ISeriesApi, Time, Coordinate, MouseEventParams } from 'lightweight-charts';
import { Point } from '../widgets/types';
import { getTimeframeSeconds } from '../../../utils/chartUtils';

// --- Data Interfaces ---
export interface ICTSession {
    id: number;
    symbol: string;
    session_type: string;
    start_time: number; // Unix Seconds or MS? DB has MS usually.
    end_time: number;
    high: number;
    low: number;
    open: number;
    mitigated_at_high: number | null;
    mitigated_at_low: number | null;
    range_pips: number;
}

export interface ICTSessionsSettings {
    // Session Configs
    show_asia: boolean;
    asia_range: string;
    asia_color: string;

    show_london: boolean;
    london_range: string;
    london_color: string;

    show_nyam: boolean;
    nyam_range: string;
    nyam_color: string;

    show_nypm: boolean;
    nypm_range: string;
    nypm_color: string;

    // Visuals
    box_transparency: number; // 0-1
    linewidth: number;
    high_line_style: 'Solid' | 'Dashed' | 'Dotted';
    low_line_style: 'Solid' | 'Dashed' | 'Dotted';
    show_labels: boolean;
    show_midpoints: boolean;

    // Logic
    mitigation_enabled: boolean;
    limit_to_next_session: boolean;
    max_timeframe: string;
    history_count: number;
}

export interface ICTSessionsState {
    settings: ICTSessionsSettings;
    sessions: ICTSession[];
    lastCandleTime?: number; // Added to track server/chart time for clamping
    timeframe?: string;
}

export class ICTSessionsPlugin extends BaseWidget<ICTSessionsState> {

    constructor(settings: ICTSessionsSettings) {
        // BaseWidget expects initialData
        super({ settings, sessions: [], lastCandleTime: undefined, timeframe: undefined });
    }

    public updateSessions(sessions: ICTSession[]) {
        if (sessions.length > 0) {
            console.log(`[ICTPlugin] Updated Sessions: ${sessions.length}`, sessions[0]);
        }
        this._data.sessions = sessions;
        this.requestUpdate();
    }

    /**
     * Updates the plugin with the timestamp (seconds) of the latest known candle.
     * This is crucial to snap active sessions to the data edge, avoiding whitespace extension.
     */
    public updateCurrentTime(time: number) {
        // time is strictly seconds (Unix Timestamp)
        if (this._data.lastCandleTime !== time) {
            this._data.lastCandleTime = time;
            this.requestUpdate();
        }
    }

    public updateSettings(settings: ICTSessionsSettings) {
        this._data.settings = settings;
        this.requestUpdate();
    }

    public updateTimeframe(timeframe: string) {
        if (this._data.timeframe !== timeframe) {
            this._data.timeframe = timeframe;
            this.requestUpdate();
        }
    }

    // --- ISeriesPrimitive Implementation ---

    public updateGeometry(timeScale: any, series: any): void {
        // No complex geometry caching needed for this simple overlay
    }

    protected applyDrag(target: string, newPoint: Point): void {
        // No dragging
    }

    // Override hitTest to disable interaction/dragging for this indicator
    protected hitTestBody(point: any): boolean {
        return false;
    }

    private getLineDash(style: string): number[] {
        switch (style) {
            case 'Solid': return [];
            case 'Dotted': return [2, 2];
            case 'Dashed': return [5, 5];
            default: return [5, 5];
        }
    }

    drawBody(ctx: CanvasRenderingContext2D): void {
        const { sessions, settings, lastCandleTime, timeframe } = this._data;
        if (!this._chart || !this._series || sessions.length === 0) return;

        // Check Max Timeframe
        if (timeframe && settings.max_timeframe) {
            const currentSec = getTimeframeSeconds(timeframe);
            const maxSec = getTimeframeSeconds(settings.max_timeframe);
            if (currentSec > maxSec) return;
        }

        const timeScale = this._chart.timeScale();
        const nowSeconds = Date.now() / 1000;

        // Define comparison time: Use lastCandleTime if available, else Date.now()
        // FIX: Ensure strict clamping to lastCandleTime if available to avoid future overflow.
        // If lastCandleTime is missing/invalid, fallback to nowSeconds but treat it cautiously.
        const comparisonTime = (lastCandleTime && lastCandleTime > 0) ? lastCandleTime : nowSeconds;

        ctx.save();

        // 1. Boxes & Lines
        // Filter sessions by history_count if set
        let sessionsToDraw = sessions;
        if (settings.history_count && settings.history_count > 0) {
            sessionsToDraw = sessions.slice(-settings.history_count);
        }

        for (let i = 0; i < sessionsToDraw.length; i++) {
            const session = sessionsToDraw[i];

            if (!session.start_time) continue;

            // Find NEXT session of same type for limiting
            let nextSessionStart = Infinity;
            if (settings.limit_to_next_session) {
                // BUG FIX: We must search in the FULL sessions array, not relative to the sliced loop index 'i'
                const realIndex = sessions.indexOf(session);
                if (realIndex !== -1) {
                    for (let j = realIndex + 1; j < sessions.length; j++) {
                        if (sessions[j].session_type === session.session_type) {
                            nextSessionStart = sessions[j].start_time / 1000;
                            break;
                        }
                    }
                }
            }

            const timeS = session.start_time / 1000;
            const timeE = session.end_time ? session.end_time / 1000 : null;
            const nominalEnd = timeE ? timeE : nowSeconds;

            // --- CORE LOGIC ---
            // Clamp the drawing end to the 'active' edge of the chart (comparisonTime).
            // If the session is historic (nominalEnd < comparisonTime), we draw to nominalEnd.
            // If the session is active/future (nominalEnd > comparisonTime), we draw ONLY to comparisonTime (Latest Candle).
            let effectiveEnd = Math.min(nominalEnd, comparisonTime);

            // FIX: Ensure effectiveEnd is never BEFORE start time (prevents backward draw)
            effectiveEnd = Math.max(effectiveEnd, timeS);

            // Calculate coordinates
            const x1 = timeScale.timeToCoordinate(timeS as Time);

            // Logic for x2 (End Coordinate)
            // If the session is fully complete (nominalEnd <= comparisonTime), we must treat nominalEnd as EXCLUSIVE.
            // Example: Session ends 03:00. Candle 03:00 exists. We must NOT draw on 03:00. We stop at 02:45.
            let x2 = timeScale.timeToCoordinate(effectiveEnd as Time);

            const isSessionComplete = (comparisonTime >= nominalEnd);

            if (isSessionComplete && x2 !== null) {
                // If we mapped strictly to a coordinate, we might be on the "exclusive" boundary candle.
                // We need to back off 1 logical index.
                const tsApi = timeScale as any; // Cast to access logical methods if not on interface
                if (tsApi.coordinateToLogical && tsApi.logicalToCoordinate) {
                    const logicIdx = tsApi.coordinateToLogical(x2);
                    if (logicIdx !== null) {
                        // Logic: If effectiveEnd is exactly the session end, exclude it using -1 logical
                        // However, lightweight-charts coordinates are centers. 
                        // If we found a valid candle at effectiveEnd, we back off to the previous one.
                        const prevLogicIdx = logicIdx - 1;
                        const prevX = tsApi.logicalToCoordinate(prevLogicIdx);
                        if (prevX !== null) {
                            x2 = prevX;
                        }
                    }
                }
            }

            // Valid X1
            const validX1 = x1 !== null ? x1 : -100;

            // Valid X2
            let validX2: number;
            if (x2 !== null) {
                validX2 = x2;
            } else {
                // If effectiveEnd (LatestBar) has no coordinate in LWC, it usually means 
                // it is offscreen left or we have a gap.

                // Fallback check against Visible Range
                const visibleRange = timeScale.getVisibleRange();
                if (!visibleRange) {
                    validX2 = -100;
                } else {
                    // If effectiveEnd is > VisibleFrom, it SHOULD be on screen or right edge
                    if (effectiveEnd >= (visibleRange.from as number)) {
                        // It's conceptually on screen (just map failure?). Snap to Right Edge.
                        // This handles the "Hot Candle" case where maybe it hasn't indexed yet?
                        // Or simply use timeScale width as a safe Right Anchor if we know we are 'active'
                        const rightEdgeX = timeScale.timeToCoordinate(visibleRange.to as Time);
                        validX2 = rightEdgeX !== null ? rightEdgeX : timeScale.width();
                    } else {
                        // Truly past
                        validX2 = -100;
                    }
                }
            }

            // If both offscreen left, skip
            if (validX1 === -100 && validX2 === -100) continue;

            // Calculate Y coords
            const yHigh = this._series.priceToCoordinate(session.high);
            const yLow = this._series.priceToCoordinate(session.low);

            if (yHigh === null || yLow === null) continue;

            const sessionColor = this.getColorForSession(session.session_type, settings);
            const boxColor = this.hexToRgba(sessionColor, settings.box_transparency || 0.1);

            const width = validX2 - validX1;
            const height = yLow - yHigh; // High price has lower Y value

            // DRAW BOX
            ctx.fillStyle = boxColor;
            ctx.fillRect(validX1, yHigh, width, height);

            // DRAW PIVOTS (Hi/Lo)
            ctx.beginPath();
            ctx.strokeStyle = sessionColor;
            ctx.lineWidth = settings.linewidth || 1;

            // High Pivot
            const highMitigatedWait = settings.mitigation_enabled && session.mitigated_at_high;

            // Base End: If mitigated, stop there. Else, go to 'Now' (comparisonTime).
            let highEndTs = highMitigatedWait ? (session.mitigated_at_high! / 1000) : comparisonTime;

            // Limit Rule: Stop at next session start if configured
            highEndTs = Math.min(highEndTs, nextSessionStart);

            // Global Clamp: Never draw past the 'Latest Candle' (comparisonTime)
            let effectiveHighEnd = Math.min(highEndTs, comparisonTime);

            // FIX: Ensure it doesn't go backwards
            effectiveHighEnd = Math.max(effectiveHighEnd, timeS);

            const xLineEndHigh = timeScale.timeToCoordinate(effectiveHighEnd as Time);
            const safeXLineEndHigh = xLineEndHigh !== null ? xLineEndHigh : validX2; // Fallback to box end if line end is null

            ctx.setLineDash(this.getLineDash(settings.high_line_style || 'Dashed'));
            ctx.moveTo(validX1, yHigh);
            // If safeXLineEndHigh < validX1, we might still draw backwards if coordinate mapping is weird.
            // Force Math.max for coordinates too if needed, but time clamp should suffice.
            const drawnXHigh = Math.max(validX1, safeXLineEndHigh);
            ctx.lineTo(drawnXHigh, yHigh);
            ctx.stroke();

            // Low Pivot
            const lowMitigatedWait = settings.mitigation_enabled && session.mitigated_at_low;

            let lowEndTs = lowMitigatedWait ? (session.mitigated_at_low! / 1000) : comparisonTime;
            lowEndTs = Math.min(lowEndTs, nextSessionStart);

            let effectiveLowEnd = Math.min(lowEndTs, comparisonTime);
            // FIX: Ensure it doesn't go backwards
            effectiveLowEnd = Math.max(effectiveLowEnd, timeS);

            const xLineEndLow = timeScale.timeToCoordinate(effectiveLowEnd as Time);
            const safeXLineEndLow = xLineEndLow !== null ? xLineEndLow : validX2;

            ctx.beginPath(); // New path for low
            ctx.setLineDash(this.getLineDash(settings.low_line_style || 'Dashed'));
            ctx.strokeStyle = sessionColor; // Reset stroke just in case
            ctx.moveTo(validX1, yLow);
            const drawnXLow = Math.max(validX1, safeXLineEndLow);
            ctx.lineTo(drawnXLow, yLow);

            ctx.stroke();

            // DRAW LABELS
            if (settings.show_labels) {
                const text = session.session_type;

                const lines = text.split(' ');

                const margin = 10;
                const safeWidth = Math.abs(width) - margin;
                const safeHeight = Math.abs(height) - margin;

                if (safeWidth > 10 && safeHeight > 5) {
                    ctx.save();

                    // Use paler color for text (35% opacity based on session color)
                    ctx.fillStyle = this.hexToRgba(sessionColor, 0.35);

                    // 1. Measure text at Reference Size
                    const refSize = 20;
                    ctx.font = `bold ${refSize}px Roboto`;

                    // Measure widest line
                    let maxTextW = 0;
                    for (const line of lines) {
                        const m = ctx.measureText(line);
                        if (m.width > maxTextW) maxTextW = m.width;
                    }

                    // Calculate scale to fit width
                    let scale = safeWidth / maxTextW;
                    let fontSize = refSize * scale;

                    // Check height constraint (total height of all lines)
                    // line height approx 1.2 * fontSize
                    const totalLineHeightVal = (fontSize * 1.2) * lines.length;

                    if (totalLineHeightVal > safeHeight) {
                        // fontSize * 1.2 * lines.length = safeHeight
                        // fontSize = safeHeight / (1.2 * lines.length)
                        fontSize = safeHeight / (1.2 * lines.length);
                    }

                    const MIN_FONT = 8;
                    const MAX_FONT = 200;
                    fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, fontSize));

                    ctx.font = `bold ${fontSize}px Roboto`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const centerX = validX1 + width / 2;
                    const centerY = yHigh + height / 2;
                    const lineHeight = fontSize * 1.2;

                    // Vertical centering offset
                    // If we have N lines, total height is N * lineHeight.
                    // Start Y = CenterY - TotalHeight/2 + LineHeight/2 (since baseline is middle)
                    // Actually, if baseline is middle, the 'middle' of the block is at CenterY.
                    // Line i (0-indexed) offset: (i - (N-1)/2) * lineHeight

                    if (fontSize >= MIN_FONT) {
                        for (let i = 0; i < lines.length; i++) {
                            const lineOffset = (i - (lines.length - 1) / 2) * lineHeight;
                            ctx.fillText(lines[i], centerX, centerY + lineOffset);
                        }
                    }

                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }

    private getColorForSession(type: string, settings: ICTSessionsSettings): string {
        switch (type) {
            case 'ASIA': return settings.asia_color;
            case 'LONDON': return settings.london_color;
            case 'NYAM': return settings.nyam_color;
            case 'NYPM': return settings.nypm_color;
            default: return '#cccccc';
        }
    }

    private hexToRgba(hex: string, alpha: number): string {
        // Simple hex to rgba
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        } else if (hex.length === 9) {
            // Hex8 #RRGGBBAA - Ignore alpha from hex, use override
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

// Re-export Schema
export const ICTSessionsSchema = [
    {
        group: 'General', id: 'max_timeframe', type: 'select', title: 'Timeframe Limit', def: 'H1',
        options: ['M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1']
    },
    { group: 'General', id: 'history_count', type: 'number', title: 'History Count (0=All)', def: 10 },
    { group: 'Asia Session', id: 'show_asia', type: 'bool', title: 'Enable Asia', def: true },
    { group: 'Asia Session', id: 'asia_range', type: 'time_range', title: 'Range (EST)', def: '2000-0000' },
    { group: 'Asia Session', id: 'asia_color', type: 'color', title: 'Color', def: '#3b82f6' }, // Blue

    { group: 'London Session', id: 'show_london', type: 'bool', title: 'Enable London', def: true },
    { group: 'London Session', id: 'london_range', type: 'time_range', title: 'Range (EST)', def: '0300-0600' },
    { group: 'London Session', id: 'london_color', type: 'color', title: 'Color', def: '#22c55e' }, // Green

    { group: 'New York AM', id: 'show_nyam', type: 'bool', title: 'Enable NY AM', def: true },
    { group: 'New York AM', id: 'nyam_range', type: 'time_range', title: 'Range (EST)', def: '0930-1100' },
    { group: 'New York AM', id: 'nyam_color', type: 'color', title: 'Color', def: '#ef4444' }, // Red

    { group: 'New York PM', id: 'show_nypm', type: 'bool', title: 'Enable NY PM', def: true },
    { group: 'New York PM', id: 'nypm_range', type: 'time_range', title: 'Range (EST)', def: '1330-1600' },
    { group: 'New York PM', id: 'nypm_color', type: 'color', title: 'Color', def: '#eab308' }, // Yellow

    { group: 'Visuals', id: 'box_transparency', type: 'number', title: 'Transparency (0-1)', def: 0.15 },
    { group: 'Visuals', id: 'linewidth', type: 'number', title: 'Line Width', def: 1 },
    { group: 'Visuals', id: 'high_line_style', type: 'select', title: 'High Line Style', def: 'Dashed', options: ['Solid', 'Dashed', 'Dotted'] },
    { group: 'Visuals', id: 'low_line_style', type: 'select', title: 'Low Line Style', def: 'Dashed', options: ['Solid', 'Dashed', 'Dotted'] },
    { group: 'Visuals', id: 'show_labels', type: 'bool', title: 'Show Labels', def: true },
    { group: 'Logic', id: 'mitigation_enabled', type: 'bool', title: 'Visualize Mitigation', def: true },
    { group: 'Logic', id: 'limit_to_next_session', type: 'bool', title: 'Limit to Next Session', def: true },
];
