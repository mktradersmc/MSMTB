const dbFilePath = 'c:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/market_data.db';
const Database = require('better-sqlite3');
const db = new Database(dbFilePath);
const DatabaseService = require('./src/services/DatabaseService');
// Mock the config it uses internally if necessary, or just use the raw saveAccount logic
// Actually, let's just make the HTTP request to the running server:
const http = require('http');

const payload = {
    id: "Apex_DATAFEED",
    botId: "Apex_DATAFEED",
    brokerId: "4c3c103d-cd43-46fe-bd5e-664bae9e3151",
    login: "TestLogin",
    password: "TestPassword",
    platform: "NT8",
    status: "STOPPED",
    accountType: "DATAFEED"
};

const req = http.request({
    hostname: '127.0.0.1',
    port: 3005,
    path: '/api/accounts',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        console.log("Response:", raw);
        // Verify DB
        const apex = db.prepare("SELECT id, bot_id, login, password FROM accounts WHERE id = 'Apex_DATAFEED'").get();
        console.log("DB after POST:", JSON.stringify(apex, null, 2));
    });
});
req.write(JSON.stringify(payload));
req.end();
