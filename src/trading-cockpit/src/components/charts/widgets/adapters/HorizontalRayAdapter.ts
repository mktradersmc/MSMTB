import { IChartShape, TimePoint, EntityId } from '../api';
import { HorizontalRayWidget } from '../HorizontalRayWidget';
import { v4 as uuidv4 } from 'uuid';

export class HorizontalRayAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: HorizontalRayWidget;
    private _selectionEnabled: boolean = true;

    constructor(tool: HorizontalRayWidget) {
        this.id = uuidv4();
        this.name = 'horizontal_ray';
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
        this._tool.updatePoint('anchor', { time: points[0].time as number, price: points[0].price });
        this._tool.setSelected(this._tool.getState() === 'selected');
    }

    public getProperties(): Record<string, any> {
        const data = this._tool.getData();
        return {
            "linetoolhorizontalray.linecolor": data.color,
            "linetoolhorizontalray.linewidth": data.width
        };
    }

    public setProperties(props: Record<string, any>): void {
        const data = this._tool.getData();
        if (props["linetoolhorizontalray.linecolor"]) data.color = props["linetoolhorizontalray.linecolor"];
        if (props["linetoolhorizontalray.linewidth"]) data.width = props["linetoolhorizontalray.linewidth"];

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
