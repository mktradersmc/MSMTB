export interface TradeContent {
    direction: "BUY" | "SELL";
    orderType: string;
    risk_percent: number;
    strategy: string;
    magic: number;
    levels: {
        entry: number;
        sl: number;
        tp: number;
    };
}

export interface SignalContent {
    // Basic Signal
    symbol?: string;
    time?: number; // timestamp
    type?: string;

    // Divergence Specific
    asset_time?: number;
    asset_price?: number;
    corr_time?: number;
    corr_price?: number;

    // Generic
    [key: string]: any;
}

export interface Message {
    id: string; // "T123" or "M456"
    type: "ReplicateTrade" | "NewTradeSignal" | "TradingSetup" | string;
    sender: string;
    timestamp: number;
    symbol: string;
    isActive: boolean;
    botId: string;
    environment?: "LIVE" | "BACKTEST" | string; // New field
    content: TradeContent | SignalContent | any;
}

export interface BotInstance {
    id: string;
    name: string;
    lastSeen: number;
    status: 'ACTIVE' | 'OFFLINE';
}
