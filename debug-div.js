const db = require('./src/market-data-core/src/services/DatabaseService');
const divergenceEngine = require('./src/market-data-core/src/services/DivergenceEngine');

async function debug() {
    console.log("Fetching H4 history for EURUSD and GBPUSD...");
    const eurusd = db.getHistory('EURUSD', 'H4', 50);
    const gbpusd = db.getHistory('GBPUSD', 'H4', 50);

    if (!eurusd.length || !gbpusd.length) {
        return console.log("Missing data.");
    }

    const settings = {
        other_symbols: ['GBPUSD'],
        timeframes: ['H4']
    };

    // Let's modify the engine calculate function locally to console.log states
    console.log("Analyzing last 10 candles...");

    // We will call the engine directly but let's add some manual console.logs inside a copy of the logic
    const engine = require('./src/market-data-core/src/services/DivergenceEngine');
    const divs = await engine.calculateDivergences('EURUSD', 'H4', eurusd, settings);

    console.log(`Divs found: ${divs.length}`);
}

debug();
