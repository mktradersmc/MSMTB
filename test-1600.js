const db = require('./src/market-data-core/src/services/DatabaseService');
const engine = require('./src/market-data-core/src/services/DivergenceEngine');

async function test() {
    // Note: Use 2000 candles to simulate what the chart requests
    const eurusd = db.getHistory('EURUSD', 'H1', 2000);
    const settings = {
        other_symbols: ['GBPUSD'],
        timeframes: ['H1', 'H4'] // Check both to see the H1 issue
    };
    const divs = await engine.calculateDivergences('EURUSD', 'H1', eurusd, settings);

    const targetDateStr = '2026-03-06T16:00:00.000Z';
    const at16 = divs.filter(d => new Date(d.start_time).toISOString() === targetDateStr);

    console.log(`\nDivergences at ${targetDateStr}: ${at16.length}`);
    at16.forEach(d => {
        console.log(`[${d.htf}] ${d.type} from Origins: ${new Date(d.level_time).toISOString()}`);
    });
}

test();
