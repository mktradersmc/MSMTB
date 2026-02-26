import { TradeDistributionManager } from './src/managers/TradeDistributionManager.js';
import * as fs from 'fs';

const targetTrade = {
    symbol: "NQ",
    orderType: "MARKET",
    direction: "LONG"
};

const accounts = [
    { login: "Sim101", id: "Sim101", brokerId: "Apex", accountType: "Trading", status: "RUNNING" },
    { login: "FTMO_Test", id: "FTMO_Test", brokerId: "FTMO", accountType: "Trading", status: "RUNNING" }
];

const brokers = [
    { id: "Apex", name: "Apex", symbolMappings: { NQ: "NQ" }, config: { executeInTestMode: true, preventLiveDatafeedRouting: true } },
    { id: "FTMO", name: "FTMO", symbolMappings: {}, config: { executeInTestMode: true, preventLiveDatafeedRouting: true } }
];

const config = { mode: "FALLBACK", groups: [], fallbackStrategy: "ALL_ACTIVE" };

// Local copy of the logic
let targetAccountIds = [];
const isTestMode = true;

// 1. Resolve Target Accounts from Config
if (config.mode === 'FALLBACK') {
    if (config.fallbackStrategy === 'ALL_ACTIVE') {
        targetAccountIds = accounts
            .filter(a => a.status === 'RUNNING' || a.isConnected)
            .map(a => a.id);
    }
}
console.log("targetAccountIds:", targetAccountIds);

// 2. Validate Target Accounts
let validAccounts = accounts.filter(a => targetAccountIds.includes(a.id));
console.log("validAccounts:", validAccounts.map(a => a.id));

// 3. Test Mode Safety Check
validAccounts = validAccounts.filter(acc => {
    // STRICT CHECK: Only allow TRADING accounts. Explicitly block DATAFEED.
    const typeUpper = (acc.accountType || '').toUpperCase();
    if (typeUpper !== 'TRADING' || acc.isDatafeed) {
        console.log("Filtered out by Type:", acc.id);
        return false;
    }

    if (isTestMode) {
        // In Test Mode, ONLY allow accounts defined as Test in the database
        // or explicitly mocked for test.
        // Wait, where is the definition of "Test"?
        // acc.isTest, acc.isDemo, etc.
        const isDemo = acc.isDemo || acc.isTest || acc.environment === 'TEST' ||
            (acc.login && acc.login.toLowerCase().includes('test')) ||
            (acc.login && acc.login.toLowerCase().includes('sim'));

        if (!isDemo) {
            console.log("Filtered out by isDemo (Live account in Test Mode):", acc.id);
            return false; // Prevent Live execution in Test mode
        }
        return true;
    } else {
        // In Live Mode, explicitly block Demo
        const isDemo = acc.isDemo || acc.isTest || acc.environment === 'TEST' ||
            (acc.login && acc.login.toLowerCase().includes('test')) ||
            (acc.login && acc.login.toLowerCase().includes('sim'));

        if (isDemo) return false;
        return true;
    }
});

console.log("After test mode check:", validAccounts.map(a => a.id));

