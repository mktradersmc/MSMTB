const fs = require('fs');

(async () => {
    console.log('Fetching jan.2020...');
    const response = await fetch(`https://www.forexfactory.com/calendar?month=jan.2020`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Cookie': 'timezoneoffset=0; timeformat=0'
        }
    });
    const html = await response.text();
    fs.writeFileSync('C:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/src/debug.html', html);
    console.log('Wrote HTML. Locating script...');

    // We want to see all window variables that could relate to time
    const matches = html.match(/window\.[a-zA-Z0-9_]+\s*=\s*\{.*?\}/g);
    if (matches) {
        matches.forEach(m => console.log('Found global object:', m.substring(0, 100)));
    }

    // Check if there is a variable for timezone
    const tzMatch = html.match(/timeZoneOffset/i);
    console.log("Regex match for timeZoneOffset:", tzMatch ? "YES" : "NO");

    const offsetMatch = html.match(/"offset"\s*:\s*(-?\d+)/) || html.match(/offset\s*=\s*(-?\d+)/);
    console.log("Regex match for raw offset:", offsetMatch ? offsetMatch[0] : "NO");

    process.exit(0);
})();
