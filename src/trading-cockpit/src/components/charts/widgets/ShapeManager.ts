import { EntityId, IChartShape } from './api';

export class ShapeManager {
    private _shapes: Map<EntityId, IChartShape> = new Map();
    private _listeners: Map<string, Set<(params: any) => void>> = new Map();

    public register(shape: IChartShape) {
        this._shapes.set(shape.id, shape);
        this.emit('drawing', { type: 'create', id: shape.id, shape });
    }

    public unregister(id: EntityId) {
        const shape = this._shapes.get(id);
        if (shape) {
            this._shapes.delete(id);
            this.emit('drawing', { type: 'remove', id });
        }
    }

    public get(id: EntityId): IChartShape | null {
        return this._shapes.get(id) || null;
    }

    public getAll(): IChartShape[] {
        return Array.from(this._shapes.values());
    }

    // --- Events ---
    public subscribe(event: string, callback: (params: any) => void) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event)?.add(callback);
    }

    public unsubscribe(event: string, callback: (params: any) => void) {
        this._listeners.get(event)?.delete(callback);
    }

    public emit(event: string, params: any) {
        this._listeners.get(event)?.forEach(cb => cb(params));
    }
}
