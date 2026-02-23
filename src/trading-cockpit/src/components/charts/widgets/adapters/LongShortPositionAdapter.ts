import { IChartShape, TimePoint, EntityId } from '../api';
import { LongShortPosition } from '../../LongShortPosition';
import { v4 as uuidv4 } from 'uuid';

export class LongShortPositionAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: LongShortPosition;
    private _selectionEnabled: boolean = true;
    public onExecute?: (trade: any) => void;

    constructor(tool: LongShortPosition, type: 'Riskrewardlong' | 'Riskrewardshort') {
        this.id = uuidv4();
        this.name = type;
        this._tool = tool;
    }

    public getPoints(): TimePoint[] {
        const state = this._tool.getData();
        return [{
            time: state.timeIndex, // Assuming timeIndex is the UNIX TS as number
            price: state.entryPrice
        }];
    }

    public setPoints(points: TimePoint[]): void {
        if (points.length === 0) return;
        const p = points[0];

        // Use custom update logic if needed, or simply update entry
        this._tool.updatePoint('body', { time: p.time as number, price: p.price });

        // Trigger update via tool
        this._tool.setSelected(this._tool.isSelected());
    }

    public getProperties(): Record<string, any> {
        const state = this._tool.getData();
        const prefix = this.name === 'Riskrewardlong' ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';

        return {
            [`${prefix}.stopLevel`]: state.stopLossPrice,
            [`${prefix}.profitLevel`]: state.takeProfitPrice,
            [`${prefix}.entryPrice`]: state.entryPrice,
            [`${prefix}.riskReward`]: state.riskReward,
            [`${prefix}.fixedLeg`]: state.fixedLeg,
            [`${prefix}.fixedStates`]: state.fixedStates,
            [`${prefix}.lineColor`]: state.lineColor,
            [`${prefix}.stopColor`]: state.stopColor,
            [`${prefix}.profitColor`]: state.profitColor,
            [`${prefix}.fillLabelBackground`]: state.fillLabelBackground,
            [`${prefix}.accountSize`]: state.accountSize,
            [`${prefix}.riskSize`]: state.riskSize,
            [`${prefix}.riskDisplayMode`]: state.riskDisplayMode,
            [`${prefix}.alwaysShowStats`]: state.alwaysShowStats,
            [`${prefix}.compact`]: state.compact,
            [`${prefix}.entryAnchor`]: state.entryAnchor,
            [`${prefix}.slAnchor`]: state.slAnchor,
            [`${prefix}.tpAnchor`]: state.tpAnchor,
        };
    }

    public setProperties(props: Record<string, any>): void {
        const state = this._tool.getData();
        const prefix = this.name === 'Riskrewardlong' ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';

        if (typeof props[`${prefix}.stopLevel`] === 'number') state.stopLossPrice = props[`${prefix}.stopLevel`];
        if (typeof props[`${prefix}.profitLevel`] === 'number') state.takeProfitPrice = props[`${prefix}.profitLevel`];
        if (typeof props[`${prefix}.entryPrice`] === 'number') state.entryPrice = props[`${prefix}.entryPrice`];
        if (typeof props[`${prefix}.riskReward`] === 'number') state.riskReward = props[`${prefix}.riskReward`];
        if (typeof props[`${prefix}.fixedLeg`] === 'string') state.fixedLeg = props[`${prefix}.fixedLeg`] as any;
        if (props[`${prefix}.fixedStates`]) state.fixedStates = props[`${prefix}.fixedStates`];
        if (typeof props[`${prefix}.lineColor`] === 'string') state.lineColor = props[`${prefix}.lineColor`];
        if (typeof props[`${prefix}.stopColor`] === 'string') state.stopColor = props[`${prefix}.stopColor`];
        if (typeof props[`${prefix}.profitColor`] === 'string') state.profitColor = props[`${prefix}.profitColor`];
        if (typeof props[`${prefix}.fillLabelBackground`] === 'boolean') state.fillLabelBackground = props[`${prefix}.fillLabelBackground`];
        if (typeof props[`${prefix}.accountSize`] === 'number') state.accountSize = props[`${prefix}.accountSize`];
        if (typeof props[`${prefix}.riskSize`] === 'number') state.riskSize = props[`${prefix}.riskSize`];
        if (typeof props[`${prefix}.riskDisplayMode`] === 'string') state.riskDisplayMode = props[`${prefix}.riskDisplayMode`] as any;
        if (typeof props[`${prefix}.alwaysShowStats`] === 'boolean') state.alwaysShowStats = props[`${prefix}.alwaysShowStats`];
        if (typeof props[`${prefix}.compact`] === 'boolean') state.compact = props[`${prefix}.compact`];
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
    public getTool(): LongShortPosition {
        return this._tool;
    }

    public getPrimitive(): any {
        return this._tool;
    }
}
