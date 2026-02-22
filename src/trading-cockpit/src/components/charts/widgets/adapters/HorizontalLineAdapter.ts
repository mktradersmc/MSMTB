import { IChartShape, TimePoint, EntityId } from '../api';
import { HorizontalLineWidget } from '../HorizontalLineWidget';
import { v4 as uuidv4 } from 'uuid';

export class HorizontalLineAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: HorizontalLineWidget;
    private _selectionEnabled: boolean = true;

    constructor(tool: HorizontalLineWidget) {
        this.id = uuidv4();
        this.name = 'horizontal_line';
        this._tool = tool;
    }

    public getPoints(): TimePoint[] {
        const data = this._tool.getData();
        // Return a dummy time for point representation, as line is infinite
        return [
            { time: 0, price: data.price }
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
            "linetoolhorizontalline.linecolor": data.color,
            "linetoolhorizontalline.linewidth": data.width,
            "linetoolhorizontalline.linestyle": data.lineStyle,
            "linetoolhorizontalline.showLabel": data.showLabel
        };
    }

    public setProperties(props: Record<string, any>): void {
        const data = this._tool.getData();
        if (props["linetoolhorizontalline.linecolor"]) data.color = props["linetoolhorizontalline.linecolor"];
        if (props["linetoolhorizontalline.linewidth"]) data.width = props["linetoolhorizontalline.linewidth"];
        if (typeof props["linetoolhorizontalline.linestyle"] !== 'undefined') data.lineStyle = props["linetoolhorizontalline.linestyle"];
        if (typeof props["linetoolhorizontalline.showLabel"] !== 'undefined') data.showLabel = props["linetoolhorizontalline.showLabel"];

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
