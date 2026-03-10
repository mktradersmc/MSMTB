const db = require('./src/market-data-core/src/services/DatabaseService');
const engine = require('./src/market-data-core/src/services/DivergenceEngine');

async function test() {
    const eurusd = db.getHistory('EURUSD', 'H1', 500);
    const settings = {
        other_symbols: ['GBPUSD'],
        timeframes: ['H4']
    };
    const divs = await engine.calculateDivergences('EURUSD', 'H1', eurusd, settings);

    // Group by ID to see duplicates
    const counts = {};
    for (const d of divs) {
        counts[d.id] = (counts[d.id] || 0) + 1;
    }

    let totalDups = 0;
    for (const [id, count] of Object.entries(counts)) {
        if (count > 1) {
            console.log(`DUPLICATE FOUND: ${id} x${count}`);
            totalDups++;
        }
    }
    console.log(`Total diverges returned: ${divs.length}. Total unique IDs with duplicates: ${totalDups}`);
    if (divs.length > 0) console.log("Last div:\n", divs[divs.length - 1]);
}

test();
