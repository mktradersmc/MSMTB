import { Time, PrimitiveHoveredItem } from 'lightweight-charts';
import { InteractiveChartObject, Handle } from './widgets/InteractiveChartObject';
import { Point } from './widgets/types';
import { LongShortCalculator, FixedLeg } from './widgets/LongShortCalculator';
import { AnchorInfo } from './widgets/MagnetService';

import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { TradeLogService } from '../../services/TradeLogService';

export interface LongShortState {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    timeIndex: number;
    riskReward: number;
    fixedLeg: FixedLeg; // Legacy - will be used as a primary fixed leg if needed, but we now support individual fixes
    fixedStates: {
        rr: boolean;
    };
    slAnchor?: AnchorInfo | null;
    tpAnchor?: AnchorInfo | null;
    entryAnchor?: AnchorInfo | null;

    symbol?: string;

    // Parity properties
    lineColor?: string;
    stopColor?: string;
    profitColor?: string;
    fillLabelBackground?: boolean;
    accountSize?: number;
    riskSize?: number;
    riskDisplayMode?: 'money' | 'percent';
    alwaysShowStats?: boolean;
    compact?: boolean;
}

/**
 * Professional Long/Short Position (Risk/Reward)
 */
export class LongShortPosition extends InteractiveChartObject {
    private _data: LongShortState;
    private _width: number = 200;
    private _lastMarketPrice: number | null = null;
    public onExecute?: (trade: any) => void;

    constructor(initialData: LongShortState) {
        super();
        this._data = initialData;
    }

    /**
     * Define the points for TP, SL, and Entry (Move).
     */
    public getHandles(): Handle[] {
        return [
            { id: 'tp', time: this._data.timeIndex, price: this._data.takeProfitPrice, axisLock: 'vertical_only', cursor: 'ns-resize' },
            { id: 'sl', time: this._data.timeIndex, price: this._data.stopLossPrice, axisLock: 'vertical_only', cursor: 'ns-resize' },
            { id: 'entry', time: this._data.timeIndex, price: this._data.entryPrice, axisLock: 'vertical_only', cursor: 'ns-resize' }
        ];
    }

    public getSettingsSchema(): import('./widgets/InteractiveChartObject').SettingField[] {
        return [
            { id: 'riskReward', label: 'Risk Reward', type: 'number', value: this._data.riskReward },
            { id: 'fixedLeg', label: 'Fixed Leg', type: 'select', value: this._data.fixedLeg, options: ['tp', 'sl', 'rr'] },
            { id: 'profitColor', label: 'Profit Color', type: 'color', value: this._data.profitColor || 'rgba(20, 184, 166, 0.25)' },
            { id: 'stopColor', label: 'Stop Color', type: 'color', value: this._data.stopColor || 'rgba(244, 63, 94, 0.25)' },
            { id: 'lineColor', label: 'Line Color', type: 'color', value: this._data.lineColor || '#94a3b8' },
            { id: 'riskSize', label: 'Risk Amount', type: 'number', value: this._data.riskSize || 0 }
        ];
    }


    /**
     * Handles dragging of any part of the tool.
     */
    public onDoubleClick(hitId: string): void {
        console.log(`[LongShortPosition] Double click on: ${hitId}`);

        // --- 1. Identify what is being toggled ---
        const isRRToggle = (hitId === 'rr_panel');

        // Capture current state BEFORE toggle
        const { rr: rrFixed } = this._data.fixedStates;

        // --- 2. Apply Toggle & Enforce Rules ---

        if (isRRToggle) {
            // User wants to toggle RR
            const newRRState = !rrFixed;
            this._data.fixedStates.rr = newRRState;
        }

        // --- 3. Update Legacy & Request Render ---
        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }

    public updateMarketPrice(price: number, time: number): void {
        this._lastMarketPrice = price;
        // Don't auto-update if we are currently dragging this specific tool
        if (this._isDragging) return;
        // Entry no longer moves with the market price.
    }

    public onClick(hitId: string): void {
        // Double click logic used to be here, but click is mostly for selecting.
    }

    private _updateFixedLegLegacy() {
        if (this._data.fixedStates.rr) this._data.fixedLeg = 'rr';
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;

        if (handleId === 'tp') {
            this._data.takeProfitPrice = newPoint.price;
            this._data.tpAnchor = newPoint.anchor || null; // Store anchor if provided, else clear
            this._applyCalculations('tp', isLong);
        } else if (handleId === 'sl') {
            this._data.stopLossPrice = newPoint.price;
            this._data.slAnchor = newPoint.anchor || null; // Store anchor if provided, else clear
            this._applyCalculations('sl', isLong);
        } else if (handleId === 'entry') {
            this._data.entryPrice = newPoint.price;
            this._data.entryAnchor = newPoint.anchor || null;
            this._applyCalculations('entry', isLong);
        } else if (handleId === 'body') {
            const priceDelta = newPoint.price - this._data.entryPrice;
            this._data.entryPrice = newPoint.price;
            this._data.takeProfitPrice += priceDelta;
            this._data.stopLossPrice += priceDelta;

            // Clear anchors on body move
            this._data.slAnchor = null;
            this._data.tpAnchor = null;
            this._data.entryAnchor = null;

            // Safety check for time
            if (newPoint.time && !isNaN(newPoint.time)) {
                this._data.timeIndex = newPoint.time;
            }
        }
    }

    public applySettings(settings: any): void {
        const oldRR = this._data.riskReward;
        this._data = { ...this._data, ...settings };

        // If RR manually changed in settings, trigger recalculation
        if (this._data.riskReward !== oldRR) {
            const isLong = this._data.takeProfitPrice > this._data.entryPrice;
            this._applyCalculations('rr', isLong);
        }

        this._requestUpdate?.();
    }

    private _applyCalculations(changedId: 'tp' | 'sl' | 'entry' | 'rr', isLong: boolean): void {
        const updated = LongShortCalculator.recalculate(
            this._data,
            changedId,
            isLong
        );

        this._data.entryPrice = updated.entryPrice;
        this._data.stopLossPrice = updated.stopLossPrice;
        this._data.takeProfitPrice = updated.takeProfitPrice;
        this._data.riskReward = updated.riskReward;
    }

    private _validateState(): { isValid: boolean; reason?: string } {
        return { isValid: true };
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const timeScale = this._chart.timeScale();
        const series = this._series;

        const x = timeScale.timeToCoordinate(this._data.timeIndex as any as Time);
        const yEntry = series.priceToCoordinate(this._data.entryPrice);
        const yTP = series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = series.priceToCoordinate(this._data.stopLossPrice);

        if (x === null || yEntry === null || yTP === null || ySL === null) return;

        const width = this._width;

        // Colors
        const profitColor = this._data.profitColor || 'rgba(20, 184, 166, 0.25)'; // Higher vibrancy
        const stopColor = this._data.stopColor || 'rgba(244, 63, 94, 0.25)';
        const lineColor = this._data.lineColor || '#94a3b8';

        // 1. Draw Profit Zone
        ctx.fillStyle = profitColor;
        const tpTop = Math.min(yEntry, yTP);
        const tpHeight = Math.abs(yEntry - yTP);
        ctx.fillRect(x, tpTop, width, tpHeight);

        // 2. Draw Loss Zone
        ctx.fillStyle = stopColor;
        const slTop = Math.min(yEntry, ySL);
        const slHeight = Math.abs(yEntry - ySL);
        ctx.fillRect(x, slTop, width, slHeight);

        // --- Draw Levels with visual fix feedback ---
        ctx.save();

        const drawLevel = (y: number, isFixed: boolean, color: string, label: string) => {
            if (y === null || isNaN(y)) return;

            ctx.beginPath();

            if (isFixed) {
                ctx.strokeStyle = '#000000'; // Black for fixed
                ctx.lineWidth = 1;
                ctx.setLineDash([]); // Ensure solid
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
            }

            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
        };

        drawLevel(yTP, false, 'rgba(20, 184, 166, 0.8)', 'TP');
        drawLevel(ySL, false, 'rgba(244, 63, 94, 0.8)', 'SL');
        drawLevel(yEntry, false, '#FFFFFF', 'ENTRY');

        ctx.restore();

        // --- Draw Stats Box (Professional Panel) ---
        const ratio = this._data.riskReward.toFixed(2);

        const boxWidth = 65; // Reduced from 85
        const boxHeight = 18; // Reduced from 26
        const boxX = x + (width - boxWidth) / 2;
        const boxY = yEntry - (boxHeight / 2);

        ctx.save();
        // Box Background
        ctx.fillStyle = lineColor;
        ctx.globalAlpha = 0.95;
        this._roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 4);
        ctx.fill();

        // Shadow/Border (Fixed RR feedback)
        if (this._data.fixedStates.rr) {
            ctx.strokeStyle = '#000000'; // Dark border for fixed RR
            ctx.lineWidth = 1; // Thinner border (User request)
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.stroke();
        }
        ctx.restore();

        // Text
        ctx.font = 'bold 10px Inter, sans-serif'; // Reduced from 12px
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`${ratio} R`, boxX + boxWidth / 2, boxY + 13); // Adjusted y-offset for smaller box

        ctx.textAlign = 'start';
    }

    private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Detect hits on the tool body or buttons.
     */
    public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
        if (!this._chart || !this._series) return null;

        const timeScale = this._chart.timeScale();
        const xPos = timeScale.timeToCoordinate(this._data.timeIndex as any as import('lightweight-charts').Time);
        const yEntry = this._series.priceToCoordinate(this._data.entryPrice);

        if (xPos !== null && yEntry !== null) {
            const boxWidth = 65; // Sync with draw
            const boxHeight = 18; // Sync with draw
            const boxX = xPos + (this._width - boxWidth) / 2;
            const boxY = yEntry - (boxHeight / 2);

            // 1. Hit test for the stats box (RR Fix Toggle)
            // We check this BEFORE handles/body to prioritize the stats panel
            if (x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight) {
                return { externalId: 'rr_panel', zOrder: 'top' };
            }
        }

        // 3. Check handles and body (base class logic)
        return super.hitTest(x, y);
    }

    protected hitTestBody(point: Point): boolean {
        if (!this._chart || !this._series) return false;
        const x = this._chart.timeScale().timeToCoordinate(this._data.timeIndex as any as import('lightweight-charts').Time);
        const yTP = this._series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = this._series.priceToCoordinate(this._data.stopLossPrice);

        if (x === null || yTP === null || ySL === null) return false;

        const yTop = Math.min(yTP, ySL);
        const yBottom = Math.max(yTP, ySL);

        return point.x >= x && point.x <= x + this._width &&
            point.y >= yTop && point.y <= yBottom;
    }

    // Accessor for adapters
    public getData() { return this._data; }
    public getStorageState() { return this._data; }
}
