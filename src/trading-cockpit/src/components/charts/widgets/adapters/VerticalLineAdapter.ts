import { IChartShape, TimePoint, EntityId } from '../api';
import { VerticalLineWidget } from '../VerticalLineWidget';
import { v4 as uuidv4 } from 'uuid';

export class VerticalLineAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: VerticalLineWidget;
    private _selectionEnabled: boolean = true;

    constructor(tool: VerticalLineWidget) {
        this.id = uuidv4();
        this.name = 'vertical_line';
        this._tool = tool;
    }

    public getPoints(): TimePoint[] {
        const data = this._tool.getData();
        return [
            { time: data.time, price: data.price }
        ];
    }

    public setPoints(points: TimePoint[]): void {
        if (points.length < 1) return;
        this._tool.updatePoint('body', { time: points[0].time as number, price: points[0].price });
        this._tool.setSelected(this._tool.getState() === 'selected');
    }

    public getProperties(): Record<string, any> {
        const data = this._tool.getData();
        return {
            "linetoolverticalline.linecolor": data.color,
            "linetoolverticalline.linewidth": data.width,
            "linetoolverticalline.linestyle": data.lineStyle,
            "linetoolverticalline.showLabel": data.showLabel
        };
    }

    public setProperties(props: Record<string, any>): void {
        const data = this._tool.getData();
        if (props["linetoolverticalline.linecolor"]) data.color = props["linetoolverticalline.linecolor"];
        if (props["linetoolverticalline.linewidth"]) data.width = props["linetoolverticalline.linewidth"];
        if (typeof props["linetoolverticalline.linestyle"] !== 'undefined') data.lineStyle = props["linetoolverticalline.linestyle"];
        if (typeof props["linetoolverticalline.showLabel"] !== 'undefined') data.showLabel = props["linetoolverticalline.showLabel"];

        this._tool.setSelected(this._tool.getState() === 'selected');
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
