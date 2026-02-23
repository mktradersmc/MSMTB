import { Time, PrimitiveHoveredItem } from 'lightweight-charts';
import { InteractiveChartObject, Handle } from './widgets/InteractiveChartObject';
import { Point } from './widgets/types';
import { LongShortCalculator, FixedLeg } from './widgets/LongShortCalculator';
import { AnchorInfo } from './widgets/MagnetService';
import { TradeLogService } from '../../services/TradeLogService';

export interface TradeBuilderState {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    timeIndex: number;
    riskReward: number;
    fixedLeg: FixedLeg;
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

    // Visuals
    lineColor?: string;
    stopColor?: string;
    profitColor?: string;
}

export class TradeBuilderPosition extends InteractiveChartObject {
    private _data: TradeBuilderState;
    private _lastMarketPrice: number | null = null;
    public onExecute?: (trade: any) => void;

    private _handleWidth = 100;
    private _handleHeight = 18; // Thinner
    private _marginRight = 5;
    private _closeBtnWidth = 24; // Width of the right toggle area
    private _dragBtnWidth = 16;  // Width of the left drag area

    // Execute Button Layout
    private _executeBtnWidth = 65;
    private _executeBtnGap = 16;

    constructor(initialData: TradeBuilderState) {
        super();
        this._data = initialData;
    }

    public getHandles(): Handle[] {
        // We define all draggable areas. These are used to lock dragging vertically.
        return [
            { id: 'tp', time: this._data.timeIndex, price: this._data.takeProfitPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'tp_fix_toggle', time: this._data.timeIndex, price: this._data.takeProfitPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'sl', time: this._data.timeIndex, price: this._data.stopLossPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'sl_fix_toggle', time: this._data.timeIndex, price: this._data.stopLossPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'entry', time: this._data.timeIndex, price: this._data.entryPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'entry_fix_toggle', time: this._data.timeIndex, price: this._data.entryPrice, axisLock: 'vertical_only', cursor: 'pointer' },
            { id: 'entry_rr_toggle', time: this._data.timeIndex, price: this._data.entryPrice, axisLock: 'vertical_only', cursor: 'pointer' }
        ];
    }

    public onDoubleClick(hitId: string): void {
        console.log(`[TradeBuilder] Double click on: ${hitId}`);

        const { sl: slFixed, tp: tpFixed, rr: rrFixed, entry: entryFixed } = this._data.fixedStates;

        if (hitId === 'sl') {
            const newSLState = !slFixed;
            this._data.fixedStates.sl = newSLState;
            if (newSLState && tpFixed && rrFixed) this._data.fixedStates.rr = false;
        } else if (hitId === 'tp') {
            const newTPState = !tpFixed;
            this._data.fixedStates.tp = newTPState;
            if (newTPState && slFixed && rrFixed) this._data.fixedStates.rr = false;
        } else if (hitId === 'entry' || hitId === 'entry_fix_toggle' || hitId === 'entry_rr_toggle') {
            // "per doppelklick auf den griff kann ich ihn fixieren" - Double click on entry handle fixes entry
            this._toggleEntryFix();
        }

        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }

    public onClick(hitId: string): void {
        console.log(`[TradeBuilder] Single click on: ${hitId}`);

        if (hitId === 'entry_fix_toggle') {
            this._toggleEntryFix();
        } else if (hitId === 'tp_fix_toggle') {
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;
            const newTPState = !tpFixed;
            this._data.fixedStates.tp = newTPState;
            if (newTPState && slFixed && rrFixed) this._data.fixedStates.rr = false;
        } else if (hitId === 'sl_fix_toggle') {
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;
            const newSLState = !slFixed;
            this._data.fixedStates.sl = newSLState;
            if (newSLState && tpFixed && rrFixed) this._data.fixedStates.rr = false;
        } else if (hitId === 'entry_rr_toggle') {
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;
            const newRRState = !rrFixed;
            this._data.fixedStates.rr = newRRState;

            if (newRRState && slFixed && tpFixed) {
                this._data.fixedStates.tp = false;
            }
        } else if (hitId === 'execute_btn') {
            const validation = this._validateState();
            if (!validation.isValid) {
                console.warn(`[TradeBuilder] Cannot execute: ${validation.reason}`);
                return;
            }

            const trade = this.getTradeObject();

            // 1. Generate ID
            const tradeId = TradeLogService.getNextId();

            // 2. Inject ID
            (trade as any).id = tradeId;

            // 3. Log to DB
            TradeLogService.logTrade(trade);

            console.log(`[TradeBuilder] Execute clicked! ID: ${tradeId}`, trade);
            this.onExecute?.(trade);
        }

        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }

    private _toggleEntryFix() {
        const newEntryState = !this._data.fixedStates.entry;
        this._data.fixedStates.entry = newEntryState;

        if (newEntryState) {
            this._data.orderType = 'LIMIT';
        } else {
            this._data.orderType = 'MARKET';
            if (this._lastMarketPrice !== null) {
                this.updateMarketPrice(this._lastMarketPrice, this._data.timeIndex);
            }
        }
    }

    private _updateFixedLegLegacy() {
        if (this._data.fixedStates.rr) this._data.fixedLeg = 'rr';
    }

    public updateMarketPrice(price: number, time: number): void {
        this._lastMarketPrice = price;
        if (this._isDragging) return;

        if (this._data.orderType === 'MARKET') {
            const priceDelta = price - this._data.entryPrice;
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;

            if (tpFixed && slFixed && rrFixed) return;

            this._data.timeIndex = time;

            if (!slFixed && !tpFixed) {
                this._data.entryPrice = price;
                this._data.takeProfitPrice += priceDelta;
                this._data.stopLossPrice += priceDelta;

                this._data.slAnchor = null;
                this._data.tpAnchor = null;
                this._data.entryAnchor = null;
            } else {
                this.updatePoint('entry', { time: time, price: price });
            }

            this._requestUpdate?.();
        }
    }

    public updatePoint(handleId: string, newPoint: { time: number; price: number; anchor?: AnchorInfo }): void {
        const oldSL = this._data.stopLossPrice;
        const oldTP = this._data.takeProfitPrice;
        const oldEntry = this._data.entryPrice;

        const wasLongBySL = oldSL < oldEntry;
        const wasLongByTP = oldTP > oldEntry;

        if (handleId === 'tp' || handleId === 'tp_fix_toggle') {
            this._data.takeProfitPrice = newPoint.price;
            this._data.tpAnchor = newPoint.anchor || null;

            const isNowLong = this._data.takeProfitPrice > this._data.entryPrice;
            if (wasLongByTP !== isNowLong && this._data.fixedStates.rr) {
                const slDist = oldSL - oldEntry;
                this._data.stopLossPrice = oldEntry - slDist;
            }
            this._applyCalculations('tp', isNowLong);
        } else if (handleId === 'sl' || handleId === 'sl_fix_toggle') {
            this._data.stopLossPrice = newPoint.price;
            this._data.slAnchor = newPoint.anchor || null;

            const isNowLong = this._data.stopLossPrice < this._data.entryPrice;
            if (wasLongBySL !== isNowLong && this._data.fixedStates.rr) {
                const tpDist = oldTP - oldEntry;
                this._data.takeProfitPrice = oldEntry - tpDist;
            }
            this._applyCalculations('sl', isNowLong);
        } else if (handleId.startsWith('entry')) {
            this._data.entryPrice = newPoint.price;
            this._data.entryAnchor = newPoint.anchor || null;

            const isNowLong = this._data.stopLossPrice < this._data.entryPrice;
            this._applyCalculations('entry', isNowLong);
        }
    }

    protected onDragEnd(handleId: string): void {
        const { tpAnchor, slAnchor, entryAnchor } = this._data;

        if (handleId === 'tp' || handleId === 'tp_fix_toggle') {
            if (tpAnchor) this._data.fixedStates.tp = true;
        } else if (handleId === 'sl' || handleId === 'sl_fix_toggle') {
            if (slAnchor) this._data.fixedStates.sl = true;
        } else if (handleId.startsWith('entry')) {
            if (entryAnchor) {
                this._data.fixedStates.entry = true;
                this._data.orderType = 'LIMIT';
            }
        }

        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }

    private _applyCalculations(changedId: 'tp' | 'sl' | 'entry' | 'rr', isLong: boolean): void {
        const updated = LongShortCalculator.recalculate(
            this._data as any,
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
            const fixedCount = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (fixedCount !== 2) return { isValid: false, reason: 'Market req 2 fixed legs' };
            if (slFixed && !slAnchor) return { isValid: false, reason: 'SL fixed needs Anchor' };
            if (tpFixed && !tpAnchor) return { isValid: false, reason: 'TP fixed needs Anchor' };
        } else {
            if (!entryFixed) return { isValid: false, reason: 'Limit req Entry fixed' };
            const remainingFixed = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (remainingFixed < 2) return { isValid: false, reason: 'Limit req 2 of SL/TP/RR fixed' };
        }

        return { isValid: true };
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const series = this._series;
        const width = this._chart.timeScale().width();

        const yEntry = series.priceToCoordinate(this._data.entryPrice);
        const yTP = series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = series.priceToCoordinate(this._data.stopLossPrice);

        if (yEntry === null || yTP === null || ySL === null) return;

        // Is it actually Long or Short right now? Determined by SL location relative to Entry.
        // User requested: "wenn der stoploss über dem entry liegt ist es ein short, im anderen fall ein long"
        // In pixel coordinates, smaller y is HIGHER price.
        // If SL > Entry price => SL y < Entry y => Short.
        const isLong = this._data.stopLossPrice < this._data.entryPrice;

        const entryColor = this._data.lineColor || '#2962FF'; // Blue by default
        const slColor = this._data.stopColor || 'rgba(244, 63, 94, 1)';
        const tpColor = this._data.profitColor || 'rgba(20, 184, 166, 1)';

        // 1. Draw connecting shaded regions (optional but nice)
        // ActivePosition doesn't have shaded regions, user just said "die linien und griffe, die momentan für die darstellung laufender trades genutzt werden."
        // We will omit the shaded regions to match ActivePosition strictly.

        // 2. Draw Dashed Lines
        const drawDashedLine = (y: number, color: string, isFixed: boolean) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.setLineDash(isFixed ? [] : [4, 4]); // Solid if fixed, else dashed
            ctx.lineWidth = 2; // 2px border
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        };

        drawDashedLine(yTP, tpColor, this._data.fixedStates.tp);
        drawDashedLine(ySL, slColor, this._data.fixedStates.sl);
        drawDashedLine(yEntry, entryColor, this._data.fixedStates.entry);

        // 3. Helper to draw standard handles
        const drawHandle = (y: number, color: string, label: string, isFixed: boolean, drawRR: boolean = false) => {
            const hWidth = this._handleWidth;
            const hHeight = this._handleHeight;
            const hX = width - this._marginRight - hWidth;
            const hY = y - (hHeight / 2);

            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(hX, hY, hWidth, hHeight, 4);
            ctx.fill();

            // Draw Left Drag Handle (Hatched Pattern)
            ctx.save();
            ctx.beginPath();
            ctx.rect(hX, hY, this._dragBtnWidth, hHeight);
            ctx.clip();

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            const spacing = 4;
            for (let i = -hHeight; i < this._dragBtnWidth + hHeight; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(hX + i, hY);
                ctx.lineTo(hX + i - hHeight, hY + hHeight);
                ctx.stroke();
            }

            // Hover overlay for drag handle
            ctx.restore();

            // Divider for drag handle
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.moveTo(hX + this._dragBtnWidth, hY);
            ctx.lineTo(hX + this._dragBtnWidth, hY + hHeight);
            ctx.stroke();

            // Frame (Border) - "der rahmen sollte die griffarbe mit 2px haben"
            ctx.beginPath();
            ctx.roundRect(hX, hY, hWidth, hHeight, 4);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // The 'X' Area (Right side)
            const labelAreaStart = hX + this._dragBtnWidth;
            const contentWidth = hWidth - this._closeBtnWidth - this._dragBtnWidth;
            const xAreaX = hX + hWidth - this._closeBtnWidth;

            // Fill X Area
            ctx.fillStyle = isFixed ? color : 'rgba(226, 232, 240, 0.4)';

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(hX, hY, hWidth, hHeight, 4);
            ctx.clip();
            ctx.fillRect(xAreaX, hY, this._closeBtnWidth, hHeight);
            ctx.restore();

            // Divider
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.moveTo(xAreaX, hY);
            ctx.lineTo(xAreaX, hY + hHeight);
            ctx.stroke();

            // Label Text Background (for RR)
            if (drawRR && this._data.fixedStates.rr) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect(labelAreaStart + 2, hY + 2, contentWidth - 3, hHeight - 4, 1);
                ctx.fill();
            }

            // Label Text
            ctx.fillStyle = (drawRR && this._data.fixedStates.rr) ? '#FFFFFF' : color;
            ctx.font = drawRR ? 'bold 11px sans-serif' : '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = labelAreaStart + (contentWidth / 2);
            if (drawRR) {
                const ratio = this._data.riskReward.toFixed(2);
                ctx.fillText(`${ratio} R`, textX, hY + (hHeight / 2) + 1);
            } else {
                ctx.fillText(label, textX, hY + (hHeight / 2) + 1);
            }
        };

        // Draw SL + TP + Entry
        drawHandle(yTP, tpColor, 'Take Profit', this._data.fixedStates.tp);
        drawHandle(ySL, slColor, 'Stop Loss', this._data.fixedStates.sl);
        drawHandle(yEntry, entryColor, 'Entry', this._data.fixedStates.entry, true);

        // 5. Draw Execute Label/Button
        // Button directly to the left of entry handle
        const btnHeight = this._handleHeight; // Match entry handle height
        const hX = width - this._marginRight - this._handleWidth;
        const btnX = hX - this._executeBtnWidth - this._executeBtnGap;
        const buttonY = yEntry - (btnHeight / 2);

        const validation = this._validateState();
        const isValid = validation.isValid;

        ctx.save();
        const btnColor = isValid ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
        const shadowColor = 'rgba(0, 0, 0, 0.4)';

        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.roundRect(btnX, buttonY + 2, this._executeBtnWidth, btnHeight, 4);
        ctx.fill();

        ctx.fillStyle = btnColor;
        ctx.beginPath();
        ctx.roundRect(btnX, buttonY, this._executeBtnWidth, btnHeight, 4);
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let label = '';
        if (this._data.orderType === 'MARKET') {
            label = 'MARKET';
        } else {
            label = 'LIMIT';
            if (this._lastMarketPrice !== null) {
                const entry = this._data.entryPrice;
                const market = this._lastMarketPrice;
                if (isLong) {
                    label = entry < market ? 'LIMIT' : 'STOP';
                } else {
                    label = entry > market ? 'LIMIT' : 'STOP';
                }
            }
        }

        ctx.fillText(label, btnX + this._executeBtnWidth / 2, buttonY + (btnHeight / 2) + 1);
        ctx.restore();
    }

    public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
        if (!this._chart || !this._series) return null;

        const series = this._series;
        const width = this._chart.timeScale().width();

        const yEntry = series.priceToCoordinate(this._data.entryPrice);
        const yTP = series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = series.priceToCoordinate(this._data.stopLossPrice);

        if (yEntry === null || yTP === null || ySL === null) return null;

        const hWidth = this._handleWidth;
        const hHeight = this._handleHeight;
        const hX = width - this._marginRight - hWidth;

        // Check Execute Button first
        const btnHeight = hHeight;
        const btnX = hX - this._executeBtnWidth - this._executeBtnGap;
        const buttonY = yEntry - (btnHeight / 2);

        if (x >= btnX && x <= btnX + this._executeBtnWidth && y >= buttonY && y <= buttonY + btnHeight) {
            return { externalId: 'execute_btn', zOrder: 'top' };
        }

        const checkHandle = (handleY: number, prefix: string): PrimitiveHoveredItem | null => {
            if (x >= hX && x <= hX + hWidth && y >= handleY - (hHeight / 2) && y <= handleY + (hHeight / 2)) {
                if (x <= hX + this._dragBtnWidth) {
                    // Safe left-hand drag zone
                    return { externalId: prefix, zOrder: 'top' };
                } else if (x >= hX + hWidth - this._closeBtnWidth) {
                    // Right-hand toggle zone
                    return { externalId: prefix + '_fix_toggle', zOrder: 'top' };
                } else {
                    // Middle label zone
                    return { externalId: prefix + '_label', zOrder: 'top' }; // We assign meaningless label id to prevent dragging from middle?
                    // Actually, if we return 'prefix', it allows dragging from the middle anyway.
                    // To strictly prevent dragging from the middle (prevent RR toggle clash), return something NOT in getHandles():
                }
            }
            return null;
        };

        const tpHit = checkHandle(yTP, 'tp');
        if (tpHit) return tpHit;

        const slHit = checkHandle(ySL, 'sl');
        if (slHit) return slHit;

        if (x >= hX && x <= hX + hWidth && y >= yEntry - (hHeight / 2) && y <= yEntry + (hHeight / 2)) {
            if (x <= hX + this._dragBtnWidth) {
                // Safe left-hand drag zone
                return { externalId: 'entry', zOrder: 'top' };
            } else if (x >= hX + hWidth - this._closeBtnWidth) {
                // Right-hand Entry fix
                return { externalId: 'entry_fix_toggle', zOrder: 'top' };
            } else {
                // Middle Entry label -> click toggles RR!
                // To support RR click logic while NOT making it draggable by default, we just return 'entry_rr_toggle'.
                // 'entry_rr_toggle' matches an entry in getHandles() so it might technically drag if mouse moved, but it prioritizes click events nicely.
                return { externalId: 'entry_rr_toggle', zOrder: 'top' };
            }
        }

        // We don't want lines themselves to be draggable in this tool, only handles
        return super.hitTest(x, y);
    }

    public getTradeObject() {
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;

        const formatAnchor = (anchor: AnchorInfo | undefined | null) => {
            if (!anchor) return null;
            return {
                time: anchor.time,
                price: anchor.price,
                type: anchor.type.toUpperCase(),
                timeframe: anchor.timeframe
            };
        };

        let finalOrderType: 'MARKET' | 'LIMIT' | 'STOP' = this._data.orderType;

        if (this._data.orderType === 'LIMIT' && this._lastMarketPrice !== null) {
            const entry = this._data.entryPrice;
            const market = this._lastMarketPrice;
            if (isLong) {
                finalOrderType = entry < market ? 'LIMIT' : 'STOP';
            } else {
                finalOrderType = entry > market ? 'LIMIT' : 'STOP';
            }
        }

        return {
            symbol: this._data.symbol || (this._series as any)?._symbol || 'UNKNOWN',
            orderType: finalOrderType,
            direction: isLong ? 'LONG' : 'SHORT',

            entry: {
                type: this._data.orderType,
                fixed: this._data.fixedStates.entry,
                price: this._data.fixedStates.entry ? this._data.entryPrice : 0,
                anchor: formatAnchor(this._data.entryAnchor)
            },
            sl: {
                type: 'PROTECTION',
                fixed: this._data.fixedStates.sl,
                price: this._data.fixedStates.sl ? this._data.stopLossPrice : 0,
                anchor: formatAnchor(this._data.slAnchor)
            },
            tp: {
                type: 'TARGET',
                fixed: this._data.fixedStates.tp,
                price: this._data.fixedStates.tp ? this._data.takeProfitPrice : 0,
                anchor: formatAnchor(this._data.tpAnchor)
            },
            riskReward: {
                value: this._data.fixedStates.rr ? this._data.riskReward : 0,
                fixed: this._data.fixedStates.rr
            },
            meta: {
                initialEntry: this._data.entryPrice,
                initialSL: this._data.stopLossPrice,
                initialTP: this._data.takeProfitPrice
            }
        };
    }

    public getData() { return this._data; }
    public getStorageState() { return this._data; }
}
