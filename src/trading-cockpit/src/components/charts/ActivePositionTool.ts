import { Time, PrimitiveHoveredItem } from 'lightweight-charts';
import { InteractiveChartObject, Handle } from './widgets/InteractiveChartObject';
import { Point } from './widgets/types';

export interface ActivePositionState {
    id: string; // Trade ID
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    initialEntryPrice?: number; // DB Fixed Original Values
    stopLossPrice?: number;
    takeProfitPrice?: number;
    timeIndex?: number;
    allSlAtBe?: boolean;
    anySlAtBe?: boolean;
    status?: string;
    orderType?: string;

    // PnL calc
    volume?: number;     // e.g. 1.0
    contractSize?: number; // e.g. 100000 or 1
    tickValue?: number;  // Optional override

    // Data
    currentProfit?: number; // For Entry Label
    currency?: string;      // e.g. "USD" | "EUR"

    // Visuals
    lineColor?: string;
    stopColor?: string;
    profitColor?: string;
}

export class ActivePositionTool extends InteractiveChartObject {
    private _data: ActivePositionState;
    private _width: number = 0; // Infinite width logic handled in adapter usually, or we use explicit width

    // Geometry
    private _handleWidth = 100;
    private _handleHeight = 18;
    private _marginRight = 5;
    private _closeBtnWidth = 24;

    // Interaction State
    private _showCloseMenu: boolean = false;
    private _hideMenuTimeout?: NodeJS.Timeout;
    private _currentHoverId: string | null = null;

    public onAction?: (action: 'SL_BE' | 'CLOSE_PARTIAL' | 'CANCEL', payload?: any) => void;

    constructor(data: ActivePositionState) {
        super();
        this._data = data;
    }

    public updateFlags(flags: { allSlAtBe?: boolean, anySlAtBe?: boolean }) {
        if (flags.allSlAtBe !== undefined) this._data.allSlAtBe = flags.allSlAtBe;
        if (flags.anySlAtBe !== undefined) this._data.anySlAtBe = flags.anySlAtBe;
        this._requestUpdate?.();
    }

    public setProperties(props: Partial<ActivePositionState>) {
        Object.assign(this._data, props);
        this._requestUpdate?.();
    }

    public updatePrice(type: 'entry' | 'sl' | 'tp', price: number) {
        if (type === 'entry') this._data.entryPrice = price;
        if (type === 'sl') this._data.stopLossPrice = price;
        if (type === 'tp') this._data.takeProfitPrice = price;
        this._requestUpdate?.();
    }

    public updateProfit(profit: number) {
        this._data.currentProfit = profit;
        this._requestUpdate?.();
    }

    /**
     * Called by ChartWidget when a new tick arrives.
     * Calculates PnL locally for instant feedback.
     */
    public updateMarketPrice(price: number, time: number) {
        // Simple PnL Calculation
        // If we have volume, we can try to estimate.
        // For now, if we don't have volume/contract details, we might just trust the external updateProfit?
        // BUT the user complains about sync.
        // If we assume standard Forex/CFD: (Current - Entry) * Volume * ContractSize

        // Disabled: Relying entirely on Redux/Hook state via updateProfit() 
        // to prevent flickering and maintain data truth from MQL5/Backend.
        /*
        if (this._data.entryPrice && this._data.volume) {
            const diff = price - this._data.entryPrice;
            const dirMult = this._data.direction === 'LONG' ? 1 : -1;
            const multiplier = this._data.contractSize || 1;
            const rawPnL = diff * dirMult * this._data.volume * multiplier;

            this._data.currentProfit = rawPnL;
            this._requestUpdate?.();
        }
        */
    }

    public getHandles(): Handle[] {
        // We only want handles on the right edge, but for now we can just return standard handles
        // IF we want them draggable later. For now, visual only as per requirements
        // "später aber erst! den level verschieben kann" -> "Only later draggable"
        // So no handles for now? Or just visual handles?
        // User said: "am rechten rand dann eine grifffläche... (später aber erst! den level verschieben kann)"
        // So we draw the grip, but maybe don't enable dragging yet?
        // Or we implement handles but return empty here to disable interaction?
        return [];
    }

    public drawShape(ctx: CanvasRenderingContext2D): void {
        if (!this._chart || !this._series) return;

        const series = this._series;
        const width = this._chart.timeScale().width();
        const range = this._chart.timeScale().getVisibleRange();

        // We draw full width, so we need coordinates from 0 to width?
        // Or we use the visible logical range.
        // Canvas is sized to the chart pane. 0 is left, width is right.

        const drawDashedLine = (price: number | undefined, color: string, id: string) => {
            if (price === undefined || price === 0) return;
            const y = series.priceToCoordinate(price);
            if (y === null) return;

            // Wait... user: "der stoploss soll dann auf der entsprechenden höhe der entrylinie dargestellt werden links neben dem entry"
            // If SL == Entry, we don't draw a line for SL, just the handle.
            if (id === 'sl' && this._data.entryPrice && Math.abs(price - this._data.entryPrice) < 0.00001) {
                return; // Hide the line, it overlaps entry
            }

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2; // Match TradeBuilder
            ctx.setLineDash(id === 'entry' ? [] : [4, 4]); // Solid if entry, else dashed
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        };

        const drawHandle = (price: number | undefined, color: string, label: string, type: 'entry' | 'tp' | 'sl') => {
            if (price === undefined || price === 0) return;
            let y = series.priceToCoordinate(price);
            if (y === null) return;

            const referenceEntryPrice = this._data.initialEntryPrice !== undefined ? this._data.initialEntryPrice : this._data.entryPrice;

            // Explicit DB flag overrules local Math calc
            let isSlAtBe = false;
            if (type === 'sl') {
                if (this._data.allSlAtBe || this._data.anySlAtBe) {
                    isSlAtBe = true;
                } else if (referenceEntryPrice && Math.abs(price - referenceEntryPrice) < 0.00001) {
                    isSlAtBe = true;
                }

            }

            // Positioning Logic
            const hWidth = this._handleWidth;
            const hHeight = this._handleHeight;
            let hX = width - this._marginRight - hWidth;

            if (isSlAtBe) {
                // Render SL left of Entry Handle cleanly, with an 8px visual gap
                hX = width - this._marginRight - (hWidth * 2) - 8;
            }

            const hY = y - (hHeight / 2);

            // 1. Clear Line behind Handle (White Background) for TP/SL
            ctx.fillStyle = type === 'entry' ? color : '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(hX, hY, hWidth, hHeight, 4);
            ctx.fill();

            // 2. Border
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            const isPending = this._data.status === 'CREATED' || this._data.status === 'PENDING';
            // Entry 'X' only visible when Pending. SL/TP boxes always visible (but text hidden when pending).
            const showRightActionBlock = (type === 'entry' && isPending) || type === 'tp' || (type === 'sl' && !isSlAtBe);

            // Subtract drag button from available content area
            const contentWidth = showRightActionBlock ? hWidth - this._closeBtnWidth : hWidth;
            const xAreaX = hX + contentWidth;

            if (showRightActionBlock) {
                // Fill right toggle area
                ctx.fillStyle = color;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(hX, hY, hWidth, hHeight, 4);
                ctx.clip();
                ctx.fillRect(xAreaX, hY, this._closeBtnWidth, hHeight);

                // Hover Highlight Overlay
                const isHovered = (type === 'tp' && this._currentHoverId === 'tp_action') ||
                    (type === 'sl' && this._currentHoverId === 'sl_action') ||
                    (type === 'entry' && this._currentHoverId === 'entry_action');

                if (isHovered) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 20% white overlay for highlight
                    ctx.fillRect(xAreaX, hY, this._closeBtnWidth, hHeight);
                }

                ctx.restore();

                // Divider
                ctx.beginPath();
                ctx.strokeStyle = type === 'entry' ? '#FFFFFF' : color;
                ctx.lineWidth = 1;
                ctx.moveTo(xAreaX, hY);
                ctx.lineTo(xAreaX, hY + hHeight);
                ctx.stroke();
            }

            // 4. Label Text
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = hX + (contentWidth / 2);
            ctx.fillStyle = type === 'entry' ? '#FFFFFF' : color;

            let labelText = label;
            if (type === 'entry' && isPending) {
                const ot = this._data.orderType ? this._data.orderType.toUpperCase() : '';
                if (ot === 'LIMIT') {
                    labelText = this._data.direction === 'LONG' ? 'BUY LIMIT' : 'SELL LIMIT';
                } else if (ot === 'STOP') {
                    labelText = this._data.direction === 'LONG' ? 'BUY STOP' : 'SELL STOP';
                } else {
                    labelText = 'PENDING';
                }
            }

            ctx.fillText(labelText, textX, hY + (hHeight / 2) + 1);

            // 5. Right Area Text / Icon (Hide text/icon but keep box if pending SL/TP, per user request)
            if (showRightActionBlock) {
                const showTextAndIcon = type === 'entry' || !isPending;
                if (showTextAndIcon) {
                    const closeX = hX + contentWidth + (this._closeBtnWidth / 2);
                    const closeY = hY + (hHeight / 2);
                    ctx.fillStyle = '#FFFFFF';
                    if (type === 'tp' || type === 'entry') {
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText('×', closeX, closeY + 1);
                    } else if (type === 'sl') {
                        ctx.font = 'bold 10px sans-serif';
                        ctx.fillText('BE', closeX, closeY + 1);
                    }
                }
            }
        };

        const entryColor = this._data.lineColor || '#2962FF'; // Default to TV Blue
        const slColor = this._data.stopColor || 'rgba(239, 68, 68, 1)';
        const tpColor = this._data.profitColor || 'rgba(16, 185, 129, 1)';

        // 1. Draw Lines First (Background)
        drawDashedLine(this._data.takeProfitPrice, tpColor, 'tp');
        drawDashedLine(this._data.stopLossPrice, slColor, 'sl');
        drawDashedLine(this._data.entryPrice, entryColor, 'entry');

        // 2. Draw Handles (Foreground)
        if (this._data.takeProfitPrice) drawHandle(this._data.takeProfitPrice, tpColor, "Take Profit", 'tp');
        if (this._data.stopLossPrice) drawHandle(this._data.stopLossPrice, slColor, "Stop Loss", 'sl');

        // Entry Label: Profit or Pending Type
        const isPending = this._data.status === 'CREATED' || this._data.status === 'PENDING';

        let entryLabelText = '';
        if (isPending) {
            const ot = this._data.orderType ? this._data.orderType.toUpperCase() : '';
            if (ot === 'LIMIT') {
                entryLabelText = this._data.direction === 'LONG' ? 'BUY LIMIT' : 'SELL LIMIT';
            } else if (ot === 'STOP') {
                entryLabelText = this._data.direction === 'LONG' ? 'BUY STOP' : 'SELL STOP';
            } else {
                entryLabelText = 'PENDING';
            }
        } else {
            const profitVal = this._data.currentProfit || 0;
            const cur = this._data.currency || 'USD';
            entryLabelText = `${profitVal > 0 ? '+' : ''}${profitVal.toFixed(2)} ${cur}`;
        }

        drawHandle(this._data.entryPrice, entryColor, entryLabelText, 'entry');

        // 3. Draw Close Popup Menu if active
        if (this._showCloseMenu && this._data.takeProfitPrice) {
            const hWidth = this._handleWidth;
            let y = series.priceToCoordinate(this._data.takeProfitPrice);
            if (y !== null) {
                const menuW = 40;
                const menuH = 80;
                const gap = 2; // Tightly connect, but leave 2px gap
                // Position right below the X button
                const hX = width - this._marginRight;
                const menuX = hX - menuW;
                const menuY = y - (this._handleHeight / 2) + this._handleHeight + gap;

                ctx.save();
                ctx.fillStyle = '#1e293b'; // Slate-800
                ctx.beginPath();
                ctx.roundRect(menuX, menuY, menuW, menuH, 4);
                ctx.fill();

                ctx.strokeStyle = tpColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const itemH = 20;
                const options = ['25%', '50%', '75%', '100%'];
                options.forEach((opt, idx) => {
                    const itemY = menuY + (idx * itemH);

                    // Hover Highlight for Menu Items
                    if (this._currentHoverId === `popup_menu_${parseInt(opt)}`) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.fillRect(menuX, itemY, menuW, itemH);
                        ctx.fillStyle = '#FFFFFF'; // Reset for text
                    }

                    ctx.fillText(opt, menuX + (menuW / 2), itemY + (itemH / 2));
                    if (idx < options.length - 1) {
                        ctx.beginPath();
                        ctx.strokeStyle = '#334155'; // Slate-700
                        ctx.moveTo(menuX, itemY + itemH);
                        ctx.lineTo(menuX + menuW, itemY + itemH);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }
        }
    }

    public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
        if (!this._chart || !this._series) return null;

        const series = this._series;
        const width = this._chart.timeScale().width();

        const yTP = this._data.takeProfitPrice ? series.priceToCoordinate(this._data.takeProfitPrice) : null;
        const ySL = this._data.stopLossPrice ? series.priceToCoordinate(this._data.stopLossPrice) : null;
        const yEntry = this._data.entryPrice ? series.priceToCoordinate(this._data.entryPrice) : null;

        const hWidth = this._handleWidth;
        const hHeight = this._handleHeight;
        const rightEdge = width - this._marginRight;

        const isPending = this._data.status === 'CREATED' || this._data.status === 'PENDING';

        // 1. Check Menu Close Actions
        let hit: PrimitiveHoveredItem | null = null;

        if (this._showCloseMenu && yTP !== null && !isPending) {
            const menuW = 40;
            const menuH = 80;
            const gap = 2;
            const menuX = rightEdge - menuW;
            const menuY = yTP - (hHeight / 2) + hHeight + gap;

            if (x >= menuX && x <= menuX + menuW && y >= menuY && y <= menuY + menuH) {
                // Hovering inside menu
                const options = [25, 50, 75, 100];
                const itemH = 20;
                const idx = Math.floor((y - menuY) / itemH);
                if (idx >= 0 && idx < options.length) {
                    hit = { externalId: `popup_menu_${options[idx]}`, zOrder: 'top' as const };
                } else {
                    hit = { externalId: 'popup_menu_bg', zOrder: 'top' as const };
                }
            }
        }

        const referenceEntryPrice = this._data.initialEntryPrice !== undefined ? this._data.initialEntryPrice : this._data.entryPrice;
        const slPrice = this._data.stopLossPrice;
        const isSlAtBeGlobal = slPrice && referenceEntryPrice && Math.abs(slPrice - referenceEntryPrice) < 0.00001;

        // 2. Check Handle Toggles
        const checkHandleToggle = (handleY: number | null, prefix: string, isSlAtBe: boolean = false): PrimitiveHoveredItem | null => {
            if (handleY === null || isSlAtBe) return null; // No toggle if already at BE

            // No interactions on Entry handle if the trade is running (box is hidden).
            if (prefix === 'entry' && !isPending) return null;
            // No interactions on TP/SL handles if the trade is pending (boxes are empty).
            if ((prefix === 'tp' || prefix === 'sl') && isPending) return null;

            let hX = rightEdge - hWidth;
            if (x >= hX && x <= hX + hWidth && y >= handleY - (hHeight / 2) && y <= handleY + (hHeight / 2)) {
                const contentWidth = hWidth - this._closeBtnWidth;
                if (x >= hX + contentWidth) {
                    return { externalId: prefix + '_action', zOrder: 'top' as const };
                }
            }
            return null;
        };

        const tpToggleHit = checkHandleToggle(yTP, 'tp');
        if (!hit && tpToggleHit) hit = tpToggleHit;

        const slToggleHit = checkHandleToggle(ySL, 'sl', !!isSlAtBeGlobal);
        if (!hit && slToggleHit) hit = slToggleHit;

        const entryToggleHit = checkHandleToggle(yEntry, 'entry');
        if (!hit && entryToggleHit) hit = entryToggleHit;

        // --- HOVER STATE MANAGEMENT ---
        const newHoverId = hit ? hit.externalId : null;
        if (this._currentHoverId !== newHoverId) {
            this._currentHoverId = newHoverId;
            this._requestUpdate?.(); // Redraw highlights
        }

        // --- POPUP MENU HOVER INTENT LOGIC ---
        const isMenuHovered = newHoverId?.startsWith('popup_menu_') || newHoverId === 'tp_action';

        if (isMenuHovered) {
            // Hovered: Show menu instantly and clear hiding timeout
            this._showCloseMenu = true;
            if (this._hideMenuTimeout) {
                clearTimeout(this._hideMenuTimeout);
                this._hideMenuTimeout = undefined;
            }
        } else {
            // Unhovered: Schedule hiding if it's currently shown
            if (this._showCloseMenu && !this._hideMenuTimeout) {
                this._hideMenuTimeout = setTimeout(() => {
                    this._showCloseMenu = false;
                    this._hideMenuTimeout = undefined;
                    this._requestUpdate?.();
                }, 1000); // 1000ms delay
            }
        }

        return hit;
    }

    public onClick(externalId: string): void {
        if (externalId.startsWith('popup_menu_')) {
            const parts = externalId.split('_');
            if (parts.length === 3) {
                const percent = parseInt(parts[2]);
                if (!isNaN(percent)) {
                    this.onAction?.('CLOSE_PARTIAL', percent);
                    this._showCloseMenu = false;
                    this._requestUpdate?.();
                }
            }
            return;
        }

        if (externalId === 'sl_action') {
            this.onAction?.('SL_BE');
            return;
        }

        if (externalId === 'entry_action') {
            if (window.confirm('Trade canceln?')) {
                this.onAction?.('CANCEL');
            }
            return;
        }

        // If clicking anywhere else on the tool, optionally close the menu
        if (this._showCloseMenu) {
            this._showCloseMenu = false;
            this._requestUpdate?.();
        }
    }

    public updatePoint(handleId: string, newPoint: { time: number, price: number, anchor?: any }): void {
        // Active visual handles are not draggable
    }

    public getData() { return this._data; }
}
