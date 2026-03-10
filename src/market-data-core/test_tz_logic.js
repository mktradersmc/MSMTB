const tzService = require('./src/services/TimezoneNormalizationService');
// Mocking the database call just for this quick test based on our earlier console.table
tzService.cache.set('test-bot', [
    { anchor_time: 0, offset_sec: 7200 } // +2 hours (EET Winter / NY Close)
]);

// Let's pretend the broker sends Monday 00:00:00 Broker Time (2026-03-09 00:00:00)
// 2026-03-09T00:00:00.000Z is 1772928000
const brokerMondayMidnight = 1772928000;

console.log("Input Broker Time (Unix):", brokerMondayMidnight);
console.log("Input Broker Time (Date):", new Date(brokerMondayMidnight * 1000).toUTCString());

const utcConverted = tzService.convertBrokerToUtc('test-bot', brokerMondayMidnight);

console.log("Calculated UTC Time (Unix):", utcConverted);
console.log("Calculated UTC Time (Date):", new Date(utcConverted * 1000).toUTCString());

// If Broker is UTC+2, and Broker says it's 00:00 (Midnight)
// Then True UTC time should be 2 hours BEFORE that -> Sunday 22:00
// UTC = Broker - Offset -> UTC = 00:00 - 2h = Sunday 22:00
