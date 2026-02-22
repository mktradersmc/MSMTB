import { Point } from './types';

/**
 * Static utility class for geometric calculations.
 * Optimized for performance in mouse loops.
 */
export class Geometry {
    /**
     * Calculates the Euclidean distance between two points.
     */
    public static distancePointToPoint(p1: Point, p2: Point): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * Calculates the shortest distance from a point to a line segment.
     * Clamps to endpoints if the projection falls outside the segment.
     */
    public static distancePointToLineSegment(p: Point, start: Point, end: Point): number {
        const l2 = Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2);

        // If the segment is just a point
        if (l2 === 0) return this.distancePointToPoint(p, start);

        // Projection factor t (clamped between 0 and 1)
        let t = ((p.x - start.x) * (end.x - start.x) + (p.y - start.y) * (end.y - start.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        // Closest point on the segment
        const closestPoint: Point = {
            x: start.x + t * (end.x - start.x),
            y: start.y + t * (end.y - start.y)
        };

        return this.distancePointToPoint(p, closestPoint);
    }

    /**
     * Simple bounding box check.
     */
    public static isPointInRect(p: Point, rect: { x: number; y: number; w: number; h: number }): boolean {
        return p.x >= rect.x &&
            p.x <= rect.x + rect.w &&
            p.y >= rect.y &&
            p.y <= rect.y + rect.h;
    }
}
