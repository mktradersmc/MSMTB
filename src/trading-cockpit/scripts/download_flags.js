const https = require('https');
const fs = require('fs');
const path = require('path');

const flags = {
    'AUD': 'au',
    'CAD': 'ca',
    'CHF': 'ch',
    'CNY': 'cn',
    'EUR': 'eu',
    'GBP': 'gb',
    'JPY': 'jp',
    'NZD': 'nz',
    'USD': 'us'
};

const baseUrl = 'https://raw.githubusercontent.com/HatScripts/circle-flags/gh-pages/flags/';
const outDir = path.join(__dirname, '../public/flags');

Object.entries(flags).forEach(([currency, countryCode]) => {
    const url = `${baseUrl}${countryCode}.svg`;
    const dest = path.join(outDir, `${currency}.svg`);
    
    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            console.error(`Failed to download ${currency}: ${res.statusCode}`);
            return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${currency}.svg`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${currency}:`, err.message);
    });
});
