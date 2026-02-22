
export interface Broker {
    id: string;
    name: string;
    shorthand: string; // Used for folder naming e.g. "FTMO"
    servers: string[]; // List of Available Servers e.g. ["FTMO-Demo", "FTMO-Live"]
    symbolMappings?: Record<string, string>; // e.g. { "EURUSD": "EURUSD.pro", "DAX": "GER40" }
    defaultSymbol?: string; // e.g. "EURUSD" (Internal Name)
}

export interface TradingAccount {
    id: string; // Internal ID
    botId?: string; // The ID used by the specialized bot instances (e.g. "FTMO_1")
    brokerId: string;
    isMaster?: boolean;
    login: string;
    password: string; // Stored in plaintext as per MT requirement
    server: string;
    accountType: 'TRADING' | 'DATAFEED';
    isDatafeed?: boolean; // Deprecated/Derived: true if accountType === 'DATAFEED'
    isTest?: boolean; // True if this is a Test Account (Routed via Test Matrix)
    instancePath?: string; // Absolute path to the instance folder
    platform?: 'MT5' | 'NT8'; // Trading Platform (Default: MT5)
    timezone?: string; // Persisted Timezone (e.g. "EET", "UTC", "Europe/New_York")

    // Deployment Status
    status: 'DEPLOYING' | 'RUNNING' | 'STOPPED' | 'ERROR';
    pid?: number; // OS Process ID
    lastHeartbeat?: number; // Timestamp

    // Live Data (from Hub)
    balance?: number;
    equity?: number;
    openPositions?: number;

    // Log Status
    brokerConnectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'INVALID' | 'UNKNOWN';
}

export type AccountAction = 'START' | 'STOP' | 'RESTART' | 'DELETE';

export interface StatusData {
    alive: boolean;
    lastSeen: number;
    timezone?: string; // e.g. "Europe/Athens" or "EET"
    account?: {
        connected: boolean;
        balance: number;
        equity: number;
        login: number;
        trade_allowed: boolean;
    };
    expert?: {
        active: boolean;
        allowed: boolean;
    };
    mt5_alive?: boolean;
}
