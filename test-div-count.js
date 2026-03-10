const db = require('./src/market-data-core/src/services/DatabaseService');
const engine = require('./src/market-data-core/src/services/DivergenceEngine');

async function test() {
    const eurusd = db.getHistory('EURUSD', 'H1', 500);
    const settings = { other_symbols: ['GBPUSD'], timeframes: ['H4'] };
    const divs = await engine.calculateDivergences('EURUSD', 'H1', eurusd, settings);

    const bearish = divs.filter(d => d.type === 'BEARISH').length;
    const bullish = divs.filter(d => d.type === 'BULLISH').length;
    console.log(`Total: ${divs.length} | Bearish: ${bearish} | Bullish: ${bullish}`);
}

test();
