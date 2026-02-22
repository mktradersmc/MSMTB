const db = require('../src/services/DatabaseService');
const fs = require('fs');
const path = require('path');

async function forceMigration() {
    console.log("Checking Distribution Tables...");

    const configCount = db.marketDb.prepare("SELECT count(*) as count FROM distribution_configs").get().count;
    const stateCount = db.marketDb.prepare("SELECT count(*) as count FROM distribution_state").get().count;

    console.log(`Current Counts -> Configs: ${configCount}, State: ${stateCount}`);

    // FORCE MIGRATION LOGIC RE-RUN
    const distConfigFile = path.join(__dirname, '../../trading-cockpit/data/distribution_config.json');
    console.log(`Target Config File: ${distConfigFile}`);

    if (fs.existsSync(distConfigFile)) {
        console.log(`File Exists. Size: ${fs.statSync(distConfigFile).size} bytes`);
        const config = JSON.parse(fs.readFileSync(distConfigFile, 'utf8'));

        console.log("Injecting Configs...");
        try {
            const insert = db.marketDb.prepare(`
                INSERT OR REPLACE INTO distribution_configs (broker_id, loop_size, matrix, environment)
                VALUES (@brokerId, @loopSize, @matrix, @environment)
            `);

            const insertMany = db.marketDb.transaction((conf) => {
                // Live Brokers
                if (conf.brokers) {
                    Object.entries(conf.brokers).forEach(([bid, c]) => {
                        console.log(`-> Migrating LIVE broker: ${bid}`);
                        insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'LIVE' });
                    });
                }
                // Test Brokers
                if (conf.test_brokers) {
                    Object.entries(conf.test_brokers).forEach(([bid, c]) => {
                        console.log(`-> Migrating TEST broker: ${bid}`);
                        insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'TEST' });
                    });
                }
            });
            insertMany(config);
            console.log("Config Migration Done.");
        } catch (e) { console.error("Config Migration Error:", e); }
    } else {
        console.error("Config File NOT FOUND at path!");
    }

    // STATE
    const distStateFile = path.join(__dirname, '../../trading-cockpit/data/distribution_state.json');
    if (fs.existsSync(distStateFile)) {
        const state = JSON.parse(fs.readFileSync(distStateFile, 'utf8'));
        const brokers = db.getBrokers();

        console.log("Injecting State...");
        const insert = db.marketDb.prepare(`
            INSERT OR REPLACE INTO distribution_state (broker_id, sequence, updated_at)
            VALUES (@brokerId, @sequence, @updatedAt)
        `);
        const insertMany = db.marketDb.transaction((st) => {
            Object.entries(st).forEach(([key, val]) => {
                let brokerId = key;
                if (!key.includes('-')) {
                    const b = brokers.find(x => x.shorthand === key);
                    if (b) brokerId = b.id;
                }
                console.log(`-> State for ${brokerId}: ${val.sequence}`);
                insert.run({ brokerId: brokerId, sequence: val.sequence, updatedAt: Date.now() });
            });
        });
        insertMany(state);
        console.log("State Migration Done.");
    }

}

forceMigration();
