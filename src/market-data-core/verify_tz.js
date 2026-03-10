const db = require('./src/services/DatabaseService');
const tzService = require('./src/services/TimezoneNormalizationService');

async function testTz() {
    console.log("=== Testing Dynamic UTC Anchor Service ===");

    const botId = 'MetaQuotes_Live';

    // Test 1: Fallback Calculation (NY Close + 7)
    // 1710000000 = Sun Mar 09 2024 (Before Spring DST)
    const brokerTime1 = 1710000000;
    let offset = tzService._getOffsetForBrokerTime(botId, brokerTime1);
    console.log(`Fallback Offset for ${brokerTime1}: ${offset / 3600} hours`);

    // Test 2: Dynamic Registration
    console.log(`Registering Dynamic Offset of +3 hours for timestamp 1710500000`);
    tzService.registerDynamicOffset(botId, 1710500000, 3 * 3600);

    // Check if new offset is picked up
    let newOffset = tzService._getOffsetForBrokerTime(botId, 1710600000);
    console.log(`New Offset for 1710600000: ${newOffset / 3600} hours (Expected: 3)`);

    // Conversion Test
    let utc = tzService.convertBrokerToUtc(botId, 1710600000);
    let backToBroker = tzService.convertUtcToBroker(botId, utc);

    console.log(`Broker: 1710600000 -> UTC: ${utc} -> Broker: ${backToBroker}`);
    if (backToBroker !== 1710600000) {
        console.error("❌ Conversion mismatch!");
    } else {
        console.log("✅ Conversion bidirectional success!");
    }

    console.log("Saving dynamic offsets to DB. They are already synced synchronously!");

    setTimeout(() => {
        console.log("Finished db operations.");
        process.exit(0);
    }, 1000);
}

testTz();
