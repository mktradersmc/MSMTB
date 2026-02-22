export type EntityId = string; // UUID

export type TimePoint = {
    time: number; // UNIX Timestamp
    price: number;
};

// Interface Name: RiskrewardlongLineToolOverrides
export interface LongPositionProperties {
    // Farben & Styles
    "linetoolriskrewardlong.lineColor"?: string;       // Default: "#1E88E5"
    "linetoolriskrewardlong.stopColor"?: string;       // Farbe der Stop-Loss-Zone
    "linetoolriskrewardlong.profitColor"?: string;     // Farbe der Profit-Zone
    "linetoolriskrewardlong.fillLabelBackground"?: boolean; // Hintergründe der Labels

    // Trading-Logik (Die wichtigen Werte!)
    "linetoolriskrewardlong.entryPrice"?: number;
    "linetoolriskrewardlong.profitLevel"?: number;     // Absoluter Preis (nicht Distanz!)
    "linetoolriskrewardlong.stopLevel"?: number;       // Absoluter Preis
}

export interface ShortPositionProperties {
    "linetoolriskrewardshort.entryPrice"?: number;
    "linetoolriskrewardshort.profitLevel"?: number;
    "linetoolriskrewardshort.stopLevel"?: number;
}

export interface CreateShapeOptions {
    shape: 'trend_line' | 'Riskrewardlong' | 'Riskrewardshort' | 'horizontal_line' | 'HorizontalLine' | 'HorizontalRay' | 'VerticalLine' | 'ActivePosition' | 'TradeBuilder';
    text?: string;
    lock?: boolean;
    disableSelection?: boolean;
    overrides?: Record<string, any> | LongPositionProperties | ShortPositionProperties;
    zOrder?: 'top' | 'bottom';
}

export interface IChartShape {
    id: EntityId;
    name: string; // e.g. 'long_position'

    // Core Methods
    getPoints(): TimePoint[];
    setPoints(points: TimePoint[]): void;

    getProperties(): Record<string, any>;
    setProperties(props: Record<string, any>): void; // Updates visuals (color, inputs)

    // Interaction
    isSelectionEnabled(): boolean;
    setSelection(selected: boolean): void; // Triggers the visual "Handles"

    // Low-Level Access
    getPrimitive(): any; // Returns the ISeriesPrimitive
}

export interface IChartWidgetApi {
    // Factory Method
    createShape(point: TimePoint, options: CreateShapeOptions): Promise<EntityId>;

    // Multipoint (for Lines/Trendlines)
    createMultipointShape(points: TimePoint[], options: CreateShapeOptions): Promise<EntityId>;

    // Management
    getAllShapes(): IChartShape[];
    getShapeById(id: EntityId): IChartShape | null;
    removeEntity(id: EntityId): void;

    // Event Subscription
    subscribe(event: 'drawing', callback: (params: any) => void): void;
    unsubscribe(event: 'drawing', callback: (params: any) => void): void;
}
