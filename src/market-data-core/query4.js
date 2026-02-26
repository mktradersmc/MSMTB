const fs = require('fs');

const brokers = [
    {
        "id": "4c3c103d-cd43-46fe-bd5e-664bae9e3151",
        "name": "Apex",
        "shorthand": "AP",
        "symbolMappings": {
            "YM": "YM",
            "GC": "GC",
            "LTCUSD": "__IGNORE__",
            "NQ": "NQ",
            "NZDUSD": "__IGNORE__",
            "SI": "SI",
            "AUDUSD": "__IGNORE__",
            "BTCUSD": "__IGNORE__",
            "ES": "ES",
            "ETHUSD": "__IGNORE__",
            "GBPUSD": "6B",
            "EURUSD": "6E"
        }
    }
];

const accounts = [
    {
        "id": "Sim101",
        "bot_id": "Sim101",
        "brokerId": "4c3c103d-cd43-46fe-bd5e-664bae9e3151",
        "login": "Sim101",
        "accountType": "Trading",
        "isTest": true,
        "isDatafeed": false
    }
];

const baseTrade = { symbol: 'NQ' };
const isTestMode = true;

const accountsByBroker = {};

accounts.forEach(acc => {
    const typeUpper = (acc.accountType || '').toUpperCase();
    if (typeUpper !== 'TRADING' || acc.isDatafeed) {
        console.log(`[TradeDistribution] Excluding Datafeed: ${acc.login}`);
        return;
    }

    if (isTestMode) {
        if (!acc.isTest) return;
    } else {
        if (acc.isTest) return;
    }

    if (!accountsByBroker[acc.brokerId]) accountsByBroker[acc.brokerId] = [];
    accountsByBroker[acc.brokerId].push(acc);
});

console.log("Accounts By Broker:", accountsByBroker);

Object.keys(accountsByBroker).forEach(brokerId => {
    const brokerAccounts = accountsByBroker[brokerId];
    const brokerNode = brokers.find(b => b.id === brokerId);

    if (!brokerNode) {
        console.warn(`[TradeDistribution] Unknown broker ID: ${brokerId}`);
        return;
    }

    const mappedTrade = { ...baseTrade };

    if (brokerNode.symbolMappings && brokerNode.symbolMappings[baseTrade.symbol]) {
        const mappedSym = brokerNode.symbolMappings[baseTrade.symbol];

        if (mappedSym === '__IGNORE__') {
            console.log(`[TradeDistribution] Symbol ${baseTrade.symbol} explicitly ignored for ${brokerNode.name}.`);
            return;
        }

        mappedTrade.symbol = mappedSym;
        console.log(`[TradeDistribution] Mapped ${baseTrade.symbol} -> ${mappedTrade.symbol} for ${brokerNode.name}`);
    } else {
        console.log(`[TradeDistribution] X Broker ${brokerNode.name} has no mapping for ${baseTrade.symbol}. STRICT EXCLUDE.`);
        return;
    }

    let targetAccountIds = [];
    const config = null; // No config

    // FALLBACK LOGIC
    if (isTestMode) {
        console.log(`[TradeDistribution] No explicit Test Config for ${brokerNode.name}. Defaulting to ALL available test accounts.`);
        targetAccountIds = brokerAccounts.map(a => a.id);
    } else {
        console.warn(`[TradeDistribution] No configuration found for broker ${brokerNode.name} (Live Mode). STRICT: Skipping.`);
        targetAccountIds = [];
    }

    const validAccounts = brokerAccounts.filter(a => targetAccountIds.includes(a.id));

    if (validAccounts.length > 0) {
        console.log("FINAL BATCH:", {
            brokerId: brokerId,
            trade: mappedTrade,
            accounts: validAccounts
        });
    } else {
        console.log("NO VALID ACCOUNTS");
    }
});
