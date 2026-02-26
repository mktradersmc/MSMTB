import { TradeDistributionManager } from './src/managers/TradeDistributionManager.js';
import * as fs from 'fs';

// Mock data
const targetTrade = {
    symbol: "NQ",
    orderType: "MARKET",
    direction: "LONG",
    entry: { type: "MARKET", price: 0 },
    sl: { type: "PROTECTION", price: 20000 },
    tp: { type: "TARGET", price: 20500 },
    riskReward: { value: 2, fixed: true },
    meta: { initialEntry: 20100 }
};

const accounts = [
    {
        login: "Sim101",
        id: "Sim101",
        brokerId: "Apex",
        accountType: "Trading",
        status: "RUNNING"
    },
    {
        login: "FTMO_Test",
        id: "FTMO_Test",
        brokerId: "FTMO",
        accountType: "Trading",
        status: "RUNNING"
    }
];

const brokers = [
    {
        id: "Apex",
        name: "Apex",
        symbolMappings: { NQ: "NQ" },
        config: { executeInTestMode: true, preventLiveDatafeedRouting: true }
    },
    {
        id: "FTMO",
        name: "FTMO",
        symbolMappings: {},
        config: { executeInTestMode: true, preventLiveDatafeedRouting: true }
    }
];

const config = {
    mode: "FALLBACK",
    groups: [],
    fallbackStrategy: "ALL_ACTIVE"
};

try {
    const batches = TradeDistributionManager.distributeTrade(
        targetTrade, accounts, brokers, config, true, true
    );
    console.log("Batches:", JSON.stringify(batches, null, 2));
} catch (e) {
    console.error("Error:", e);
}
