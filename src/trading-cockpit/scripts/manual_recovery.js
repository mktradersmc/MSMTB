
const { recoverAccountsFromDisk } = require('../src/lib/mt-manager/recovery');

async function run() {
    console.log("Starting Recovery...");
    try {
        const results = await recoverAccountsFromDisk();
        console.log(`Recovered ${results.length} accounts.`);
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Recovery Failed:", e);
    }
}

run();
