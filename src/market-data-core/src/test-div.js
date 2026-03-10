const divergenceEngine = require('./services/DivergenceEngine');
const IndicatorDataProvider = require('./services/IndicatorDataProvider');
const db = require('./services/DatabaseService');

async function run() {
    try {
        console.log("Starting test...");
        // Mock data
        const symbol = 'EURUSD';
        const timeframe = 'M15';
        const settings = {
            timeframes: ['H1', 'H4'],
            other_symbols: ['GBPUSD']
        };

        const dataProvider = new IndicatorDataProvider({ mode: 'LIVE' });

        // Let's get 500 candles to feed it
        const candles = db.getHistory(symbol, timeframe, 500, null);
        console.log(`Fetched ${candles.length} candles for primary`);

        const results = await divergenceEngine.calculateDivergences(symbol, timeframe, candles, settings, dataProvider);
        console.log(`Success! Found ${results.length} divergences.`);
    } catch (e) {
        console.error("CRASH DUMP:");
        console.error(e);
    }
}

run();
