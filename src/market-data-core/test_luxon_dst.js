const { DateTime } = require('luxon');

console.log("Testing Luxon DST Extraction for Krypto-Precision...");

function generateAnchors(zoneString) {
    const anchors = [];
    for (let year = 2023; year <= 2026; year++) {
        // Find Spring Forward
        for (let month = 2; month <= 4; month++) {
            for (let day = 1; day <= 31; day++) {
                try {
                    const dt = DateTime.local(year, month, day, 12, 0, 0, { zone: zoneString });
                    if (!dt.isValid) continue;

                    const dtPrev = dt.minus({ days: 1 });
                    if (dt.offset !== dtPrev.offset) {
                        // Offset changed overnight! Let's find the exact hour.
                        let hourDt = dtPrev;
                        while (hourDt.offset === dtPrev.offset) {
                            let nextHour = hourDt.plus({ hours: 1 });
                            if (nextHour.offset !== dtPrev.offset) {
                                // BINGO! The jump happens between hourDt and nextHour
                                anchors.push({
                                    type: 'SPRING_FORWARD',
                                    year,
                                    dateStr: hourDt.toFormat('yyyy-MM-dd'),
                                    jumpFromBrokerTime: hourDt.toFormat('HH:mm'),
                                    jumpToBrokerTime: nextHour.toFormat('HH:mm'),
                                    oldOffset: dtPrev.offset / 60,
                                    newOffset: nextHour.offset / 60,
                                    unixUtcMillis: nextHour.toMillis() // Exact Anchor
                                });
                                break;
                            }
                            hourDt = nextHour;
                        }
                    }
                } catch (e) { }
            }
        }

        // Find Fall Backward
        for (let month = 9; month <= 11; month++) {
            for (let day = 1; day <= 31; day++) {
                try {
                    const dt = DateTime.local(year, month, day, 12, 0, 0, { zone: zoneString });
                    if (!dt.isValid) continue;

                    const dtPrev = dt.minus({ days: 1 });
                    if (dt.offset !== dtPrev.offset) {
                        // Offset changed overnight! Let's find the exact hour.
                        let hourDt = dtPrev;
                        while (hourDt.offset === dtPrev.offset) {
                            let nextHour = hourDt.plus({ hours: 1 });
                            if (nextHour.offset !== dtPrev.offset) {
                                anchors.push({
                                    type: 'FALL_BACKWARD',
                                    year,
                                    dateStr: hourDt.toFormat('yyyy-MM-dd'),
                                    jumpFromBrokerTime: hourDt.toFormat('HH:mm'),
                                    jumpToBrokerTime: nextHour.toFormat('HH:mm'),
                                    oldOffset: dtPrev.offset / 60,
                                    newOffset: nextHour.offset / 60,
                                    unixUtcMillis: nextHour.toMillis() // Exact Anchor
                                });
                                break;
                            }
                            hourDt = nextHour;
                        }
                    }
                } catch (e) { }
            }
        }
    }
    return anchors;
}

console.log("\n=== US DST (DEFAULT_NY7 via America/New_York) ===");
console.table(generateAnchors('America/New_York'));

console.log("\n=== EU DST (DEFAULT_EET via Europe/Athens) ===");
console.table(generateAnchors('Europe/Athens'));
