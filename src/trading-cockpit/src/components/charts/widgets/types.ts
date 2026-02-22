import { Time, Coordinate } from 'lightweight-charts';

export interface Point {
    x: number;
    y: number;
}

export interface ChartPoint {
    time: Time;
    price: number;
}

export interface Anchor {
    id: string;
    x: number;
    y: number;
    color?: string;
    radius?: number;
    cursor?: string; // e.g. 'nw-resize', 'move'

    // VISUALS
    visible?: boolean;

    // BEHAVIOR
    axisLock?: 'free' | 'horizontal_only' | 'vertical_only';
}

export enum WidgetState {
    Idle = 'idle',
    Hover = 'hover',
    Selected = 'selected',
    Drag = 'drag'
}

export interface WidgetHitResult {
    target: string; // 'body' or anchor ID
    cursor: string;
}

export interface WidgetConfig {
    magnetEnabled?: boolean;
    lockRatio?: boolean;
}
