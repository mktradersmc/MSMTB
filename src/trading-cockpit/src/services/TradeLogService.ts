export interface TradeLogEntry {
    id: string;
    timestamp: number;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    orderType: string;
    // Concrete Initial Levels for Visualization
    initialEntry?: number;
    initialSL?: number;
    initialTP?: number;
    rawTrade: any;
}

const STORAGE_KEY_COUNTER = 'trade_counter_seq';
const STORAGE_KEY_LOG = 'trade_log_db';

export class TradeLogService {

    /**
     * generating a sequential ID (e.g. "1005")
     */
    static getNextId(): string {
        try {
            const current = localStorage.getItem(STORAGE_KEY_COUNTER);
            let next = current ? parseInt(current, 10) + 1 : 1000; // Start at 1000 if empty
            if (isNaN(next)) next = 1000;

            localStorage.setItem(STORAGE_KEY_COUNTER, next.toString());
            return next.toString();
        } catch (e) {
            console.error("TradeLogService: Failed to access localStorage", e);
            return "ERR-" + Date.now();
        }
    }

    /**
     * Log the trade to persistent storage
     */
    static logTrade(trade: any): void {
        try {
            const entry: TradeLogEntry = {
                id: trade.id || 'UNKNOWN',
                timestamp: Date.now(),
                symbol: trade.symbol,
                direction: trade.direction,
                entryPrice: trade.entry?.price || 0,
                stopLoss: trade.sl?.price || 0,
                takeProfit: trade.tp?.price || 0,
                riskReward: trade.riskReward?.value || 0,
                orderType: trade.orderType,
                // Capture Concrete Initial Levels
                initialEntry: trade.meta?.initialEntry || trade.entry?.price || 0,
                initialSL: trade.meta?.initialSL || trade.sl?.price || 0,
                initialTP: trade.meta?.initialTP || trade.tp?.price || 0,
                rawTrade: trade
            };

            const existingLogsJson = localStorage.getItem(STORAGE_KEY_LOG);
            const logs: TradeLogEntry[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];

            // Prepend new trade
            logs.unshift(entry);

            // Limit log size (optional, e.g. 500)
            if (logs.length > 500) logs.pop();

            localStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(logs));
            console.log("[TradeLogService] Logged Trade:", entry);

        } catch (e) {
            console.error("TradeLogService: Failed to log trade", e);
        }
    }

    static getLogs(): TradeLogEntry[] {
        try {
            const existingLogsJson = localStorage.getItem(STORAGE_KEY_LOG);
            return existingLogsJson ? JSON.parse(existingLogsJson) : [];
        } catch (e) {
            return [];
        }
    }
}
