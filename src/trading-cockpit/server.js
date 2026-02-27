const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Konfiguration laden
const projectRoot = path.resolve(__dirname, '../../'); 
const configPath = path.resolve(projectRoot, 'src/market-data-core/data/system.json');

let sysConfig = {};
try {
    if (fs.existsSync(configPath)) {
        sysConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.error('[Next.js Server] Failed to load system.json:', e.message);
}

// Ports und SSL aus der Konfiguration
const useSSL = sysConfig?.backend?.useSSL === true; // Assuming we use SSL if backend does, or just checking certs
const port = sysConfig?.frontend?.port || 443;
const pfxPassword = sysConfig?.backend?.pfxPassword || 'cockpit';

app.prepare().then(() => {
    let server;

    if (useSSL) {
        try {
            const root = sysConfig.projectRoot || projectRoot;
            const pfxPath = path.join(root, 'certs', 'server.pfx');
            const certPath = path.join(root, 'certs', 'server.crt');
            const keyPath = path.join(root, 'certs', 'server.key');

            let httpsOptions = {};
            if (fs.existsSync(pfxPath)) {
                console.log(`[Next.js] Loading PFX certificate from ${pfxPath}`);
                httpsOptions = {
                    pfx: fs.readFileSync(pfxPath),
                    passphrase: pfxPassword
                };
            } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
                console.log(`[Next.js] Loading CRT/KEY certificates from ${certPath}`);
                httpsOptions = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath)
                };
            } else {
                throw new Error("Missing certificates");
            }

            server = createServer(httpsOptions, (req, res) => {
                const parsedUrl = parse(req.url, true);
                handle(req, res, parsedUrl);
            });
            console.log(`[Next.js] Custom HTTPS Server starting on port ${port}...`);

        } catch (err) {
            console.error('[Next.js] HTTPS setup failed. Falling back to HTTP.', err.message);
            const http = require('http');
            server = http.createServer((req, res) => {
                const parsedUrl = parse(req.url, true);
                handle(req, res, parsedUrl);
            });
        }
    } else {
        console.log(`[Next.js] Custom HTTP Server starting on port ${port}...`);
        const http = require('http');
        server = http.createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        });
    }

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on ${useSSL ? 'https' : 'http'}://localhost:${port}`);
    });
});
