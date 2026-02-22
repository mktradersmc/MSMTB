import { IChartShape, TimePoint, EntityId } from '../api';
import { TrendLineTool } from '../../TrendLineTool';
import { WidgetState } from '../BaseWidget';
import { v4 as uuidv4 } from 'uuid';

export class TrendLineAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: TrendLineTool;
    private _selectionEnabled: boolean = true;

    constructor(tool: TrendLineTool) {
        this.id = uuidv4();
        this.name = 'trend_line';
        this._tool = tool;
    }

    public getPoints(): TimePoint[] {
        const data = this._tool.getData();
        return [
            { time: data.p1.time, price: data.p1.price },
            { time: data.p2.time, price: data.p2.price }
        ];
    }

    public setPoints(points: TimePoint[]): void {
        if (points.length < 2) return;
        const data = this._tool.getData();

        data.p1.time = points[0].time;
        data.p1.price = points[0].price;
        data.p2.time = points[1].time;
        data.p2.price = points[1].price;

        // Redraw usually triggered by logic or selection
        this._tool.setSelected(this._tool.getState() === WidgetState.Selected);
    }

    public getProperties(): Record<string, any> {
        const data = this._tool.getData();
        return {
            "linetooltrendline.linecolor": data.color || '#2962FF',
            "linetooltrendline.linewidth": data.width || 2
        };
    }

    public setProperties(props: Record<string, any>): void {
        const data = this._tool.getData();
        if (props["linetooltrendline.linecolor"]) data.color = props["linetooltrendline.linecolor"];
        if (props["linetooltrendline.linewidth"]) data.width = props["linetooltrendline.linewidth"];

        this._tool.setSelected(this._tool.getState() === WidgetState.Selected);
    }

    public setSelection(selected: boolean): void {
        this._tool.setSelected(selected);
    }

    public isSelectionEnabled(): boolean {
        return this._selectionEnabled;
    }

    public getPrimitive(): any {
        return this._tool;
    }
}
