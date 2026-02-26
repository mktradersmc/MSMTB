const dbClass = require('./src/services/DatabaseService');
const db = new dbClass();
const brokers = db.getBrokers();
console.log(JSON.stringify(brokers, null, 2));
