const db = require('./src/market-data-core/src/services/DatabaseService');
const engineNoPreCalc = require('./src/market-data-core/src/services/DivergenceEngine_NoPreCalc');

async function test() {
    const eurusd = db.getHistory('EURUSD', 'H1', 500);
    const settings = { other_symbols: ['GBPUSD'], timeframes: ['H1', 'H4'] };
    const divs = await engineNoPreCalc.calculateDivergences('EURUSD', 'H1', eurusd, settings);

    const bearish = divs.filter(d => d.type === 'BEARISH').length;
    const bullish = divs.filter(d => d.type === 'BULLISH').length;
    console.log(`NO PRE CALC Total: ${divs.length} | Bearish: ${bearish} | Bullish: ${bullish}`);
}

test();
