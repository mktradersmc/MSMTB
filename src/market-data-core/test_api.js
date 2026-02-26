const http = require('http');

http.get('http://127.0.0.1:3005/api/accounts', res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        const data = JSON.parse(raw);
        const apexInfo = data.accounts.find(a => a.id === 'Apex_DATAFEED');
        console.log("Apex_DATAFEED:", JSON.stringify(apexInfo, null, 2));
    });
});
