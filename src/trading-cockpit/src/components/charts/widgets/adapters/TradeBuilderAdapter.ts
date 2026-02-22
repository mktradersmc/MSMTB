import { IChartShape, TimePoint, EntityId } from '../api';
import { TradeBuilderPosition } from '../../TradeBuilderPosition';
import { v4 as uuidv4 } from 'uuid';

export class TradeBuilderAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: TradeBuilderPosition;
    private _selectionEnabled: boolean = true;
    public onExecute?: (trade: any) => void;

    constructor(tool: TradeBuilderPosition) {
        this.id = uuidv4();
        this.name = 'TradeBuilder';
        this._tool = tool;

        this._tool.onExecute = (trade) => {
            this.onExecute?.(trade);
        };
    }

    public getPoints(): TimePoint[] {
        const state = this._tool.getData();
        return [{
            time: state.timeIndex, // UNIX TS 
            price: state.entryPrice
        }];
    }

    public setPoints(points: TimePoint[]): void {
        if (points.length === 0) return;
        const p = points[0];

        this._tool.updatePoint('entry', { time: p.time as number, price: p.price });
        this._tool.setSelected(this._tool.isSelected());
    }

    public getProperties(): Record<string, any> {
        const state = this._tool.getData();
        const prefix = 'linetooltradebuilder';

        return {
            [`${prefix}.stopLevel`]: state.stopLossPrice,
            [`${prefix}.profitLevel`]: state.takeProfitPrice,
            [`${prefix}.entryPrice`]: state.entryPrice,
            [`${prefix}.riskReward`]: state.riskReward,
            [`${prefix}.fixedLeg`]: state.fixedLeg,
            [`${prefix}.fixedStates`]: state.fixedStates,
            [`${prefix}.orderType`]: state.orderType,
            [`${prefix}.lineColor`]: state.lineColor,
            [`${prefix}.stopColor`]: state.stopColor,
            [`${prefix}.profitColor`]: state.profitColor,
            [`${prefix}.entryAnchor`]: state.entryAnchor,
            [`${prefix}.slAnchor`]: state.slAnchor,
            [`${prefix}.tpAnchor`]: state.tpAnchor,
        };
    }

    public setProperties(props: Record<string, any>): void {
        const state = this._tool.getData();
        const prefix = 'linetooltradebuilder';

        if (typeof props[`${prefix}.stopLevel`] === 'number') state.stopLossPrice = props[`${prefix}.stopLevel`];
        if (typeof props[`${prefix}.profitLevel`] === 'number') state.takeProfitPrice = props[`${prefix}.profitLevel`];
        if (typeof props[`${prefix}.entryPrice`] === 'number') state.entryPrice = props[`${prefix}.entryPrice`];
        if (typeof props[`${prefix}.riskReward`] === 'number') state.riskReward = props[`${prefix}.riskReward`];
        if (typeof props[`${prefix}.fixedLeg`] === 'string') state.fixedLeg = props[`${prefix}.fixedLeg`] as any;
        if (props[`${prefix}.fixedStates`]) state.fixedStates = props[`${prefix}.fixedStates`];
        if (typeof props[`${prefix}.orderType`] === 'string') state.orderType = props[`${prefix}.orderType`] as any;
        if (typeof props[`${prefix}.lineColor`] === 'string') state.lineColor = props[`${prefix}.lineColor`];
        if (typeof props[`${prefix}.stopColor`] === 'string') state.stopColor = props[`${prefix}.stopColor`];
        if (typeof props[`${prefix}.profitColor`] === 'string') state.profitColor = props[`${prefix}.profitColor`];
        if (props[`${prefix}.entryAnchor`] !== undefined) state.entryAnchor = props[`${prefix}.entryAnchor`];
        if (props[`${prefix}.slAnchor`] !== undefined) state.slAnchor = props[`${prefix}.slAnchor`];
        if (props[`${prefix}.tpAnchor`] !== undefined) state.tpAnchor = props[`${prefix}.tpAnchor`];

        this._tool.setSelected(this._tool.isSelected());
    }

    public isSelectionEnabled(): boolean {
        return this._selectionEnabled;
    }

    public setSelection(selected: boolean): void {
        this._tool.setSelected(selected);
    }

    // Helper to get the raw tool
    public getTool(): TradeBuilderPosition {
        return this._tool;
    }

    public getPrimitive(): any {
        return this._tool;
    }
}
