const path = require('path');
const db = require('./src/market-data-core/src/services/DatabaseService');
const divergenceEngine = require('./src/market-data-core/src/services/DivergenceEngine');

async function test() {
    console.log("Fetching history for primary symbol EURUSD...");
    const primaryCandles = db.getHistory('EURUSD', 'H1', 500);

    if (!primaryCandles || primaryCandles.length === 0) {
        console.log("No data found for EURUSD.");
        // Mock data fallback if database is empty for testing
        return;
    }

    const settings = {
        other_symbols: ['GBPUSD'],
        timeframes: ['D1', 'H4'] // HTF levels to check
    };

    console.log(`Calculating divergences for EURUSD vs GBPUSD...`);
    const divergences = await divergenceEngine.calculateDivergences('EURUSD', 'H1', primaryCandles, settings);

    console.log(`\nFound ${divergences.length} divergences.`);
    if (divergences.length > 0) {
        console.log("Sample Active Divergence:", JSON.stringify(divergences.find(d => !d.mitigated_at), null, 2));
        console.log("Sample Mitigated Divergence:", JSON.stringify(divergences.find(d => d.mitigated_at), null, 2));
    }
}

test().catch(console.error);
