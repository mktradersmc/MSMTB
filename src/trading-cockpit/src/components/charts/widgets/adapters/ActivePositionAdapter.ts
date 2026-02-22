import { IChartShape, TimePoint, EntityId } from '../api';
import { ActivePositionTool } from '../../ActivePositionTool';
import { v4 as uuidv4 } from 'uuid';

export class ActivePositionAdapter implements IChartShape {
    public id: EntityId;
    public name: string = 'ActivePosition';

    private _tool: ActivePositionTool;
    private _selectionEnabled: boolean = false; // No selection for now

    public onAction?: (action: string, payload?: any) => void;

    constructor(tool: ActivePositionTool) {
        this.id = String(tool.getData().id || uuidv4()); // Ensure string for Redux
        this._tool = tool;

        // Delegate Action from Tool 
        this._tool.onAction = (action, payload) => {
            this.onAction?.(action, payload);
        };
    }

    public getPoints(): TimePoint[] {
        // Not really point-based in the traditional sense
        const d = this._tool.getData();
        return [{ time: 0, price: d.entryPrice }];
    }

    public setPoints(points: TimePoint[]): void {
        // No-op
    }

    public getProperties(): Record<string, any> {
        return this._tool.getData();
    }

    public setProperties(props: Record<string, any>): void {
        // Update logic if needed
        const d = this._tool.getData();
        if (props.entryPrice !== undefined) d.entryPrice = props.entryPrice;
        if (props.initialEntry !== undefined) d.initialEntryPrice = props.initialEntry; // Map from React space
        if (props.stopLossPrice !== undefined) d.stopLossPrice = props.stopLossPrice;
        if (props.takeProfitPrice !== undefined) d.takeProfitPrice = props.takeProfitPrice;
        if (props.direction !== undefined) d.direction = props.direction;
        if (props.currentProfit !== undefined) d.currentProfit = props.currentProfit;
    }

    public isSelectionEnabled(): boolean {
        return false;
    }

    public setSelection(selected: boolean): void {
        // No-op
    }

    public getTool(): ActivePositionTool {
        return this._tool;
    }

    public getPrimitive(): any {
        return this._tool;
    }
}
