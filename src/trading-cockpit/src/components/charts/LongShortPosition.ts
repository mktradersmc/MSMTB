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
        tp: boolean;
        sl: boolean;
        entry: boolean;
        rr: boolean;
    };
    slAnchor?: AnchorInfo | null;
    tpAnchor?: AnchorInfo | null;
    entryAnchor?: AnchorInfo | null;
    orderType: 'MARKET' | 'LIMIT';

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
        const isSLToggle = (hitId === 'sl');
        const isTPToggle = (hitId === 'tp');
        const isEntryToggle = (hitId === 'entry');

        // Capture current state BEFORE toggle
        const { sl: slFixed, tp: tpFixed, rr: rrFixed, entry: entryFixed } = this._data.fixedStates;

        // --- 2. Apply Toggle & Enforce Rules ---

        if (isRRToggle) {
            // User wants to toggle RR
            const newRRState = !rrFixed;
            this._data.fixedStates.rr = newRRState;

            if (newRRState) {
                // If turning RR ON, check conflicts
                // Rule: If SL and TP are both fixed, unfix TP (per user request: "takeprofit must resolve its fixation")
                if (slFixed && tpFixed) {
                    this._data.fixedStates.tp = false;
                }
                // Case: Limit Mode (Entry Fixed) - If Entry, SL, RR fixed -> TP Dynamic (Automatic)
            }
        }
        else if (isSLToggle) {
            // User wants to toggle SL
            const newSLState = !slFixed;
            this._data.fixedStates.sl = newSLState;

            if (newSLState) {
                // If turning SL ON
                // Rule: If TP and RR are fixed, unfix RR (per user request: "rr must be cancelled")
                if (tpFixed && rrFixed) {
                    this._data.fixedStates.rr = false;
                }
                // Limit Mode: Entry, RR, SL fixed -> TP Dynamic (Automatic)
                // Limit Mode: Entry, TP, SL fixed -> RR Dynamic (Automatic)
                // Note: If Entry+RR are fixed, and we fix SL -> We have Entry+RR+SL. TP becomes dynamic.
                // But wait, user said "is entry, tp and rr fixed and we fix sl, then rr is cancelled."
                // My logic above handles "TP and RR fixed", which covers both Market and Limit (since Entry doesn't matter for this collision).
            }
        }
        else if (isTPToggle) {
            // User wants to toggle TP
            const newTPState = !tpFixed;
            this._data.fixedStates.tp = newTPState;

            if (newTPState) {
                // If turning TP ON
                // Rule: If SL and RR are fixed, unfix RR (Symmetric assumption based on other rules)
                // Also covers user rule for Limit: "is entry, sl and rr fixed and we fix tp, then we cancel rr."
                if (slFixed && rrFixed) {
                    this._data.fixedStates.rr = false;
                }
            }
        }
        else if (isEntryToggle) {
            // Entry Fixed State mainly meaningful for Limit Orders or "Anchored Market"
            const newEntryState = !entryFixed;
            this._data.fixedStates.entry = newEntryState;

            // If user fixes the entry, it implies a specific price is desired -> Switch to LIMIT
            if (newEntryState) {
                this._data.orderType = 'LIMIT';
            } else {
                // If user unfixes the entry, revert to MARKET
                this._data.orderType = 'MARKET';
                // Snap to current market price immediately if available
                if (this._lastMarketPrice !== null) {
                    this.updateMarketPrice(this._lastMarketPrice, this._data.timeIndex);
                }
            }
        }

        // --- 3. Update Legacy & Request Render ---
        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }

    public updateMarketPrice(price: number, time: number): void {
        this._lastMarketPrice = price;
        // Don't auto-update if we are currently dragging this specific tool
        if (this._isDragging) return;

        if (this._data.orderType === 'MARKET') {
            const priceDelta = price - this._data.entryPrice;
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;

            // Critical Rule: If Entry, SL, TP, and RR are ALL effectively fixed, we CANNOT move anything.
            // If TP and SL and RR are fixed -> Entry is mathematically locked.
            if (tpFixed && slFixed && rrFixed) {
                return;
            }

            // Update timeIndex to track with the current candle
            this._data.timeIndex = time;

            // Case 1: Nothing fixed (except maybe RR) -> Shift everything (body move)
            // This is "floating" mode where the whole structure follows the price
            if (!slFixed && !tpFixed) {
                this._data.entryPrice = price;
                this._data.takeProfitPrice += priceDelta;
                this._data.stopLossPrice += priceDelta;

                // Clear anchors when floating because we are drifting away from original snap
                this._data.slAnchor = null;
                this._data.tpAnchor = null;
                this._data.entryAnchor = null;

                // Note: We don't need to call ApplyCalculations here because RR remains identical by definition of a linear shift
            }
            // Case 2: Something is fixed -> Use Calculator logic to squeeze/expand
            else {
                this.updatePoint('entry', { time: time, price: price });
            }

            this._requestUpdate?.();
        }
    }


    public onClick(hitId: string): void {
        // Renamed hitId logic but catching old ID just in case or using the new semantic
        if (hitId === 'order_type_toggle' || hitId === 'execute_btn') {
            // This button now acts as the Execute Trigger
            const validation = this._validateState();
            if (!validation.isValid) {
                console.warn(`[LongShortPosition] Cannot execute: ${validation.reason}`);
                // Optional: Provide UI feedback (flash red?) - For now console warn and no-op is safer
                return;
            }

            const trade = this.getTradeObject();

            // --- TRADE TRACKING INTEGRATION ---
            // 1. Generate ID
            const tradeId = TradeLogService.getNextId();

            // 2. Inject ID
            (trade as any).id = tradeId;

            // 3. Log to DB
            TradeLogService.logTrade(trade);
            // ----------------------------------

            console.log(`[LongShortPosition] Execute clicked! ID: ${tradeId}`, trade);
            this.onExecute?.(trade);
        }
    }

    private _updateFixedLegLegacy() {
        if (this._data.fixedStates.rr) this._data.fixedLeg = 'rr';
        else if (this._data.fixedStates.tp) this._data.fixedLeg = 'tp';
        else if (this._data.fixedStates.sl) this._data.fixedLeg = 'sl';
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
        const { sl: slFixed, tp: tpFixed, rr: rrFixed, entry: entryFixed } = this._data.fixedStates;
        const { slAnchor, tpAnchor, orderType } = this._data;

        if (orderType === 'MARKET') {
            // Market Rules:
            // 1. Exactly 2 fixed elements out of SL, TP, RR
            const fixedCount = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (fixedCount !== 2) {
                return { isValid: false, reason: 'Market req 2 fixed legs' };
            }

            // 2. If SL/TP Fixed -> Must have Anchor
            if (slFixed && !slAnchor) return { isValid: false, reason: 'SL fixed needs Anchor' };
            if (tpFixed && !tpAnchor) return { isValid: false, reason: 'TP fixed needs Anchor' };

        } else {
            // Limit/Stop Rules:
            // Must have Entry fixed (defines limit nature)
            if (!entryFixed) {
                return { isValid: false, reason: 'Limit req Entry fixed' };
            }

            // Must have 2 others fixed (SL, TP, RR)
            const remainingFixed = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (remainingFixed < 2) {
                // Technically we need enough info to derive the 3rd.
                // Entry + SL + RR -> TP derived
                // Entry + TP + RR -> SL derived
                // Entry + SL + TP -> RR derived
                return { isValid: false, reason: 'Limit req 2 of SL/TP/RR fixed' };
            }

            // Check Anchors only if the leg is actively fixed
            // REMOVED STRICT CHECK: User expects 'Fixed' (Locked Price) to be valid even without 'Anchor' (Magnet Snap)
            // if (slFixed && !slAnchor) return { isValid: false, reason: 'SL needs Anchor' };
            // if (tpFixed && !tpAnchor) return { isValid: false, reason: 'TP needs Anchor' };

            // Entry anchor check skipped as we don't store it yet, fixed state implies user intent
        }

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

        drawLevel(yTP, this._data.fixedStates.tp, 'rgba(20, 184, 166, 0.8)', 'TP');
        drawLevel(ySL, this._data.fixedStates.sl, 'rgba(244, 63, 94, 0.8)', 'SL');
        drawLevel(yEntry, this._data.fixedStates.entry, '#FFFFFF', 'ENTRY');

        ctx.restore();

        // --- Draw Stats Box (Professional Panel) ---
        const ratio = this._data.riskReward.toFixed(2);
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;

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

        // --- BUTTON LAYOUT LOGIC ---
        // Top Slot: yEntry - (boxHeight/2) - gap - buttonHeight
        // Bottom Slot: yEntry + (boxHeight/2) + gap
        const btnHeight = 16; // Reduced from 20
        const btnWidth = 140; // Increased to 140 for longer labels
        const gap = 8; // Increased from 2 (User request)

        const topY = yEntry - (boxHeight / 2) - btnHeight - gap;
        const bottomY = yEntry + (boxHeight / 2) + gap;
        const btnX = x + (width - btnWidth) / 2;

        // Single Button Position: Keep "Market" position (Top for Short, Bottom for Long)
        const buttonY = isLong ? bottomY : topY;

        // Validation Check for Border Color
        const validation = this._validateState();
        const isValid = validation.isValid;

        // 1. Trade Type & Execution Button
        ctx.save();

        // Background Color based on Validity
        // Valid -> Green, Invalid -> Red
        const btnColor = isValid ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
        const shadowColor = 'rgba(0, 0, 0, 0.4)';

        // "Step" Effect (Shadow)
        // Draw a shadow rect slightly offset (y+2)
        ctx.fillStyle = shadowColor;
        this._roundRect(ctx, btnX, buttonY + 2, btnWidth, btnHeight, 4);
        ctx.fill();

        // Main Button Body
        ctx.fillStyle = btnColor;
        this._roundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 4);
        ctx.fill();

        // Border: Thin Black (User request: "schwarze dünne (1px) umrandung")
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Label
        ctx.font = 'bold 8px Inter, sans-serif'; // Reduced from 9px
        // White text (User preference reverted)
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        let label = '';
        if (this._data.orderType === 'MARKET') {
            label = 'EXECUTE MARKET ORDER';
        } else {
            // Default to LIMIT
            label = 'PLACE LIMIT ORDER';

            if (this._lastMarketPrice !== null) {
                const entry = this._data.entryPrice;
                const market = this._lastMarketPrice;
                if (isLong) {
                    // Buying: Below market = Limit, Above market = Stop
                    label = entry < market ? 'PLACE LIMIT ORDER' : 'PLACE STOP ORDER';
                } else {
                    // Selling: Above market = Limit, Below market = Stop
                    label = entry > market ? 'PLACE LIMIT ORDER' : 'PLACE STOP ORDER';
                }
            }
        }

        ctx.fillText(label, btnX + btnWidth / 2, buttonY + 11); // Adjusted offset for 16px height
        ctx.restore();

        ctx.textAlign = 'start';
    }

    public getTradeObject() {
        // Validation Check before object creation? 
        // The execute click handler checks validation, so here we assume valid or return what we have.
        // We ensure data integrity (0 values).

        const isLong = this._data.takeProfitPrice > this._data.entryPrice;

        // Helper to formatting anchor
        const formatAnchor = (anchor: AnchorInfo | undefined | null) => {
            if (!anchor) return null;
            return {
                time: anchor.time,
                price: anchor.price,
                type: anchor.type.toUpperCase(), // OPEN, HIGH, LOW, CLOSE
                timeframe: anchor.timeframe
            };
        };

        // Logic to determine specific Limit vs Stop
        let finalOrderType: 'MARKET' | 'LIMIT' | 'STOP' = this._data.orderType; // 'MARKET' or 'LIMIT'

        if (this._data.orderType === 'LIMIT' && this._lastMarketPrice !== null) {
            const entry = this._data.entryPrice;
            const market = this._lastMarketPrice;
            if (isLong) {
                // Buying: Below market = LIMIT, Above market = STOP
                finalOrderType = entry < market ? 'LIMIT' : 'STOP';
            } else {
                // Selling: Above market = LIMIT, Below market = STOP
                finalOrderType = entry > market ? 'LIMIT' : 'STOP';
            }
        }

        return {
            symbol: this._data.symbol || (this._series as any)?._symbol || 'UNKNOWN',
            orderType: finalOrderType, // Explicit MARKET, LIMIT, or STOP
            direction: isLong ? 'LONG' : 'SHORT',


            // Entry Configuration
            entry: this._data.orderType === 'MARKET'
                ? { type: 'MARKET', fixed: this._data.fixedStates.entry, price: this._data.fixedStates.entry ? this._data.entryPrice : 0, anchor: formatAnchor(this._data.entryAnchor) }
                : {
                    type: 'LIMIT',
                    fixed: this._data.fixedStates.entry,
                    price: this._data.fixedStates.entry ? this._data.entryPrice : 0,
                    anchor: formatAnchor(this._data.entryAnchor)
                },

            // Stop Loss Configuration
            sl: {
                type: 'PROTECTION',
                fixed: this._data.fixedStates.sl,
                price: this._data.fixedStates.sl ? this._data.stopLossPrice : 0,
                anchor: formatAnchor(this._data.slAnchor)
            },

            // Take Profit Configuration
            tp: {
                type: 'TARGET',
                fixed: this._data.fixedStates.tp,
                price: this._data.fixedStates.tp ? this._data.takeProfitPrice : 0,
                anchor: formatAnchor(this._data.tpAnchor)
            },

            // Risk Reward - "wenn nicht fixiert, dann 0 übergeben"
            riskReward: {
                value: this._data.fixedStates.rr ? this._data.riskReward : 0,
                fixed: this._data.fixedStates.rr
            },

            // Metadata for Visualization (Concrete Calculated Values)
            meta: {
                initialEntry: this._data.entryPrice,
                initialSL: this._data.stopLossPrice,
                initialTP: this._data.takeProfitPrice
            }
        };
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

            // Button Layout Logic
            const isLong = this._data.takeProfitPrice > this._data.entryPrice;
            const btnHeight = 16; // Sync
            const btnWidth = 140; // Sync
            const gap = 8; // Sync

            const topY = yEntry - (18 / 2) - btnHeight - gap; // 18 is boxHeight
            const bottomY = yEntry + (18 / 2) + gap;

            const btnX = xPos + (this._width - btnWidth) / 2;
            const buttonY = isLong ? bottomY : topY;

            // 2. Hit test for Order Type/Execute Button
            if (x >= btnX && x <= btnX + btnWidth && y >= buttonY && y <= buttonY + btnHeight) {
                return { externalId: 'order_type_toggle', zOrder: 'top' };
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
