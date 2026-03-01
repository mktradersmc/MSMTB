const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Lade Konfiguration für SSL Zertifikate
const configPath = path.resolve(__dirname, '../components/market-data-core/data/system.json');

let sysConfig = {};
try {
    if (fs.existsSync(configPath)) {
        sysConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load system.json:', e);
}

const useSSL = sysConfig?.backend?.useSSL !== false;
const port = 3005; // Selber Port wie das gestoppte Backend, damit das UI ohne CORS hinkommt
const logPath = path.join(__dirname, '../logs/update-progress.json');

// 2. Request Handler (Liefert den Update-Status als JSON aus)
const requestHandler = (req, res) => {
    // CORS Headers für direkte Browser-Anfragen (falls nicht via Proxy)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/system/update/progress') {
        try {
            if (fs.existsSync(logPath)) {
                // Return progress JSON written by update.ps1
                // We use fs.readFileSync and strip BOM just in case PowerShell wrote one
                let data = fs.readFileSync(logPath, 'utf8');
                if (data.charCodeAt(0) === 0xFEFF) {
                    data = data.slice(1);
                }
                // Convert UTF-16LE (often output by PS5 Set-Content) if null bytes exist
                if (data.includes('\u0000')) {
                    data = fs.readFileSync(logPath, 'utf16le');
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ step: 1, text: "Initialisiere Update-Prozess..." }));
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500);
            res.end();
        }
    } else {
        res.writeHead(404);
        res.end();
    }
};

// 3. Server starten (Mit denselben SSL-Einstellungen wie das Hauptsystem)
let server;
if (useSSL) {
    try {
        const root = sysConfig.projectRoot || path.resolve(__dirname, '../');
        const pfxPath = path.join(root, 'certs', 'server.pfx');
        const certPath = path.join(root, 'certs', 'server.crt');
        const keyPath = path.join(root, 'certs', 'server.key');

        let httpsOptions = {};
        if (fs.existsSync(pfxPath)) {
            httpsOptions = {
                pfx: fs.readFileSync(pfxPath),
                passphrase: sysConfig?.backend?.pfxPassword || 'cockpit'
            };
        } else {
            httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
        }
        server = https.createServer(httpsOptions, requestHandler);
    } catch (e) {
        console.error("SSL fallback failed", e);
        server = http.createServer(requestHandler);
    }
} else {
    server = http.createServer(requestHandler);
}

server.listen(port, () => {
    console.log(`[Update Reporter] Gefaked Backend Listening on Port ${port} for Progress UI`);
});

// Failsafe: Dieser temporäre Prozess darf maximal 15 Minuten leben
setTimeout(() => {
    console.log('[Update Reporter] Maximale Lebensdauer erreicht. Beende...');
    process.exit(0);
}, 15 * 60 * 1000);
