const tzService = require('./services/TimezoneNormalizationService');
tzService.registerBotTimezone('Sim101', 'UTC');
const brokerSec = tzService.convertUtcToBroker('Sim101_DATAFEED', 1772057876);
console.log(`Original: 1772057876`);
console.log(`Converted: ${brokerSec}`);
