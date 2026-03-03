const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Lade Konfiguration für SSL Zertifikate
const configPath = path.resolve(__dirname, '../market-data-core/data/system.json');

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
let options = null;
if (useSSL) {
    try {
        const root = sysConfig.projectRoot || path.resolve(__dirname, '../');
        const pfxPath = path.join(root, 'certs', 'server.pfx');
        const certPath = path.join(root, 'certs', 'server.crt');
        const keyPath = path.join(root, 'certs', 'server.key');

        if (fs.existsSync(pfxPath)) {
            options = {
                pfx: fs.readFileSync(pfxPath),
                passphrase: sysConfig?.backend?.pfxPassword || 'cockpit'
            };
        } else {
            options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
        }
    } catch (e) {
        console.error("SSL fallback failed", e);
    }
}

function createAndStartServer(portToBind, retryCount = 0) {
    const srv = (useSSL && options) ? https.createServer(options, requestHandler) : http.createServer(requestHandler);
    srv.listen(portToBind, () => {
        console.log(`[Update Reporter] Gefaked Backend Listening on Port ${portToBind} for Progress UI`);
    }).on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            if (retryCount < 15) {
                console.log(`Port ${portToBind} belegt, warte auf Shutdown des echten Backends (Versuch ${retryCount + 1} / 15)...`);
                setTimeout(() => {
                    srv.close();
                    createAndStartServer(portToBind, retryCount + 1);
                }, 1000);
            } else {
                console.error(`Max retries reached. Port ${portToBind} bleibt belegt.`);
            }
        }
    });
}

// Starte Reporter für Trading Cockpit (3005) und Management Console (3006)
createAndStartServer(3005);
createAndStartServer(3006);

// Failsafe: Dieser temporäre Prozess darf maximal 15 Minuten leben
setTimeout(() => {
    console.log('[Update Reporter] Maximale Lebensdauer erreicht. Beende...');
    process.exit(0);
}, 15 * 60 * 1000);
