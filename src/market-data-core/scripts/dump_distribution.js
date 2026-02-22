const db = require('../src/services/DatabaseService');

console.log("--- DISTRIBUTION CONFIGS DUMP ---");
const configs = db.marketDb.prepare("SELECT * FROM distribution_configs").all();

configs.forEach(c => {
    console.log(`Broker: ${c.broker_id} [${c.environment}]`);
    console.log(`Loop Size: ${c.loop_size}`);
    console.log(`Matrix (Raw): ${c.matrix}`);
    try {
        const parsed = JSON.parse(c.matrix);
        console.log(`Matrix (Parsed):`, JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log("Matrix Parsing Failed!");
    }
    console.log("-----------------------------------");
});
