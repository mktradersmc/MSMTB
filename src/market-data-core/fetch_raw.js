const http = require('http');

console.log('Fetching raw MT5 data directly...');
http.get('http://localhost:3005/api/history?symbol=EURUSD&timeframe=H1&limit=200&routingKey=RoboForex_67177422_DATAFEED:EURUSD', (res) => {
    let buf = '';
    res.on('data', chunk => buf += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(buf);
            const data = parsed.data || parsed.content || parsed;

            if (!Array.isArray(data)) {
                console.log("No array returned:", buf.substring(0, 200));
                return;
            }

            console.log(`Received ${data.length} raw candles.`);

            // Find candles around March 6 - 9
            const target = data.filter(c => {
                const t = c.t || c.time;
                // Rough filter for Mar 2026 (Unix ~ 1772...)
                return t >= 1772700000 && t <= 1773200000;
            });

            if (target.length === 0) {
                console.log("No candles found in target range (March 6-9). Here are the latest 5:");
                data.slice(-5).forEach(c => console.log(c.t || c.time));
                return;
            }

            console.log("Found Raw Broker Candles (Mar 6 - Mar 9):");
            let lastT = 0;
            target.forEach(c => {
                const t = c.t || c.time;
                // A gap of > 24 hours marks the weekend
                if (lastT > 0 && t - lastT > 86400) {
                    console.log("--- WEEKEND GAP ---");
                }
                const d = new Date(t * 1000);
                console.log(`Unix: ${t} -> ${d.toISOString().replace('Z', ' Broker Time')}`);
                lastT = t;
            });
        } catch (e) {
            console.error("Parse error:", e);
            console.log(buf.substring(0, 500));
        }
    });

}).on('error', e => console.error(e));
