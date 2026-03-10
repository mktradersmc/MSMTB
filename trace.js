const db = require('./src/market-data-core/src/services/DatabaseService');
const engine = require('./src/market-data-core/src/services/DivergenceEngine');

async function trace() {
    const p = db.getHistory('EURUSD', 'H1', 2000);
    const t = db.getHistory('GBPUSD', 'H1', 2000);

    // Patch engine temporarily to trace the exact target
    engine.traceOverride = true;

    // We want to test H1 because that's where the user saw the false duplicated signals
    const settings = { other_symbols: ['GBPUSD'], timeframes: ['H1'] };
    // Call calculateDivergences directly
    const res = await engine.calculateDivergences('EURUSD', 'H1', p, settings);

    console.log(`\nFinal output for H1 ALL:`);
    res.forEach(d => console.log(new Date(d.level_time).toISOString().substring(11, 16) + ' -> ' + new Date(d.end_time).toISOString().substring(11, 16) + ' | ' + d.type + ' | origin: ' + new Date(d.level_time).toISOString().substring(0, 10)));
}

trace();
