const { DateTime } = require('luxon');

const allTransitions = [];

// Function to generate anchors using a specific IANA zone
function generateAnchorsForZone(brokerId, zoneString) {
    // Base Offset: Winter offset for the year 2000 (roughly)
    const baseDt = DateTime.local(2000, 1, 15, 12, 0, 0, { zone: zoneString });

    let baseOffset = baseDt.offset * 60;
    if (brokerId === 'DEFAULT_NY7') baseOffset += (7 * 3600);

    allTransitions.push({ broker_id: brokerId, anchor_time: 0, offset_sec: baseOffset, type: 'BASE' });

    for (let year = 2026; year <= 2026; year++) {
        // Spring Forward (Month 2 to 4)
        for (let month = 2; month <= 4; month++) {
            for (let day = 1; day <= 31; day++) {
                try {
                    const dt = DateTime.local(year, month, day, 12, 0, 0, { zone: zoneString });
                    if (!dt.isValid) continue;
                    const dtPrev = dt.minus({ days: 1 });
                    if (dt.offset !== dtPrev.offset) {
                        let hourDt = dtPrev;
                        while (hourDt.offset === dtPrev.offset) {
                            let nextHour = hourDt.plus({ hours: 1 });
                            if (nextHour.offset !== dtPrev.offset) {
                                let offsetToSave = nextHour.offset * 60;
                                if (brokerId === 'DEFAULT_NY7') offsetToSave += (7 * 3600);

                                allTransitions.push({
                                    broker_id: brokerId,
                                    anchor_time: Math.floor(nextHour.toMillis() / 1000),
                                    offset_sec: offsetToSave,
                                    utc_time: nextHour.toUTC().toISO(),
                                    type: 'SPRING'
                                });
                                break;
                            }
                            hourDt = nextHour;
                        }
                    }
                } catch (e) { }
            }
        }

        // Fall Backward (Month 9 to 11)
        for (let month = 9; month <= 11; month++) {
            for (let day = 1; day <= 31; day++) {
                try {
                    const dt = DateTime.local(year, month, day, 12, 0, 0, { zone: zoneString });
                    if (!dt.isValid) continue;
                    const dtPrev = dt.minus({ days: 1 });
                    if (dt.offset !== dtPrev.offset) {
                        let hourDt = dtPrev;
                        while (hourDt.offset === dtPrev.offset) {
                            let nextHour = hourDt.plus({ hours: 1 });
                            if (nextHour.offset !== dtPrev.offset) {
                                let offsetToSave = nextHour.offset * 60;
                                if (brokerId === 'DEFAULT_NY7') offsetToSave += (7 * 3600);

                                allTransitions.push({
                                    broker_id: brokerId,
                                    anchor_time: Math.floor(nextHour.toMillis() / 1000),
                                    offset_sec: offsetToSave,
                                    utc_time: nextHour.toUTC().toISO(),
                                    type: 'FALL'
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
}

generateAnchorsForZone('DEFAULT_NY7', 'America/New_York');
generateAnchorsForZone('DEFAULT_EET', 'Europe/Athens');

console.table(allTransitions);
