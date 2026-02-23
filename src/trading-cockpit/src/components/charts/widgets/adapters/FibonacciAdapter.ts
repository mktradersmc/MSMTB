import { IChartShape, TimePoint, EntityId } from '../api';
import { FibonacciRetracement } from '../../FibonacciRetracement';
import { v4 as uuidv4 } from 'uuid';

export class FibonacciAdapter implements IChartShape {
    public id: EntityId;
    public name: string;

    private _tool: FibonacciRetracement;
    private _selectionEnabled: boolean = true;

    constructor(tool: FibonacciRetracement) {
        this.id = uuidv4();
        this.name = 'Fibonacci';
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

        // Triggers redraw on next frame
        this._tool.setSelected(this._tool.isSelected());
    }

    public getProperties(): Record<string, any> {
        return this._tool.getData();
    }

    public setProperties(props: Record<string, any>): void {
        this._tool.applySettings(props);
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
