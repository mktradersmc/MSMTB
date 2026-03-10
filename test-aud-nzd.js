const db = require('./src/market-data-core/src/services/DatabaseService');
const engine = require('./src/market-data-core/src/services/DivergenceEngine');

async function test() {
    console.log("Fetching AUDUSD and NZDUSD...");
    const audusd = db.getHistory('AUDUSD', 'H1', 500);
    const nzdusd = db.getHistory('NZDUSD', 'H1', 500);

    // Find the 09.03.2026 12:00 UTC candle
    const targetDate = new Date('2026-03-09T12:00:00Z').getTime();
    console.log(`Target Date: ${new Date(targetDate).toISOString()} (${targetDate})`);

    const audCandle = audusd.find(c => c.time === targetDate);
    const nzdCandle = nzdusd.find(c => c.time === targetDate);

    console.log("AUDUSD 09.03 12:00:", audCandle);
    console.log("NZDUSD 09.03 12:00:", nzdCandle);

    // Run engine
    const settings = {
        other_symbols: ['NZDUSD'],
        timeframes: ['MN1', 'W1', 'D1', 'H8', 'H4', 'H1']
    };

    console.log("\nRunning Divergence Engine...");
    const divs = await engine.calculateDivergences('AUDUSD', 'H1', audusd, settings);

    // Check if any divergence originates from targetDate
    const origDivs = divs.filter(d => d.level_time === targetDate);
    console.log("\nDivergences originating from 09.03 12:00:");
    console.log(origDivs);

    // Check if the engine even registered it as a POI. We'd have to look inside the engine.
    // Let's modify the engine slightly or trace it in the script?
    // Let's just do a manual check if it's a fractal on H1.
    if (audCandle) {
        const idx = audusd.findIndex(c => c.time === targetDate);
        if (idx > 0 && idx < audusd.length - 1) {
            const left = audusd[idx - 1];
            const right = audusd[idx + 1];
            const isLowPOI = audCandle.low <= left.low && audCandle.low < right.low;
            console.log(`\nIs AUDUSD a structural Low POI (Fractal)? ${isLowPOI}`);
            console.log(`Left (${new Date(left.time).toISOString()}): Low=${left.low}`);
            console.log(`Target (${new Date(targetDate).toISOString()}): Low=${audCandle.low}`);
            console.log(`Right (${new Date(right.time).toISOString()}): Low=${right.low}`);
        }
    }
}

test();
