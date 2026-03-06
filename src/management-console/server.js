const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');

// FIX: Hardcode self-signed certificate acceptance for proxying to the data-core backend
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
try {
    const { setGlobalDispatcher, Agent } = require('undici');
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
} catch (e) {
    // Console log suppressed
}

const autoUpdateService = require('./services/AutoUpdateService');

const app = express();
const PORT = process.env.PORT || 3006;

// 1. Resolve Data Path (Relative to execution directory in PM2 or Dev)
const SYSTEM_JSON_PATH = path.resolve(__dirname, '../market-data-core/data/system.json');
const CERTS_DIR = path.resolve(__dirname, '../../certs'); // When deployed to C:\awesome-cockpit

app.use(express.json());
app.use(cors());

// --- Helper Functions ---
function getSystemConfig() {
    try {
        if (fs.existsSync(SYSTEM_JSON_PATH)) {
            return JSON.parse(fs.readFileSync(SYSTEM_JSON_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[Management Console] Failed to read system.json', e);
    }
    return null;
}

// Ensure JWT secret is resilient (matches market-data-core dynamically if possible)
const JWT_SECRET = process.env.JWT_SECRET || 'cockpit_super_secret_jwt_key_2024!';

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden: Invalid Token' });
        }
        req.user = user;
        next();
    });
};

// --- Routes ---

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const config = getSystemConfig();

    if (!config || !config.systemUsername || config.systemPassword === undefined) {
        return res.status(500).json({ error: 'System configuration missing or incomplete' });
    }

    if (username === config.systemUsername && password === config.systemPassword) {
        const token = jwt.sign({ username: config.systemUsername, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/system/status', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Management Console Online', uptime: process.uptime() });
});

// --- Auto-Update Routes ---
app.get('/api/system/update/status', (req, res) => {
    res.json(autoUpdateService.getBasicStatus());
});

app.get('/api/system/update/progress', (req, res) => {
    try {
        const config = getSystemConfig();
        const root = config?.projectRoot || path.resolve(__dirname, '../../');
        const logPath = path.join(root, 'logs', 'update-progress.json');

        if (fs.existsSync(logPath)) {
            let data = fs.readFileSync(logPath, 'utf8');
            if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
            if (data.includes('\u0000')) data = fs.readFileSync(logPath, 'utf16le');

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } else {
            res.json({ step: 0, text: "Initialisiere Update-Monitor..." });
        }
    } catch (e) {
        console.error('[Update API] Progress read error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/system/update/details', authenticateToken, async (req, res) => {
    try {
        const result = await autoUpdateService.fetchUpdateDetails();
        res.json({ success: true, ...result });
    } catch (e) {
        console.error('[Update API] Details error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/system/update/execute', authenticateToken, (req, res) => {
    const { restartInstances } = req.body || {};
    const result = autoUpdateService.executeUpdate(restartInstances);
    res.json(result);
});

// --- SSL Config Routes ---
app.get('/api/system/ssl/progress', (req, res) => {
    try {
        const config = getSystemConfig();
        const root = config?.projectRoot || path.resolve(__dirname, '../../');
        const logPath = path.join(root, 'logs', 'ssl-progress.json');

        if (fs.existsSync(logPath)) {
            let data = fs.readFileSync(logPath, 'utf8');
            if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
            if (data.includes('\u0000')) data = fs.readFileSync(logPath, 'utf16le');

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } else {
            res.json({ step: 0, text: "Initialisiere Let's Encrypt Client..." });
        }
    } catch (e) {
        console.error('[SSL API] Progress read error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/system/ssl/generate', authenticateToken, (req, res) => {
    const { domain, email } = req.body || {};
    if (!domain || !email) {
        return res.status(400).json({ success: false, error: "Domain und Email sind erforderlich." });
    }

    const config = getSystemConfig();
    const root = config?.projectRoot || path.resolve(__dirname, '../../');
    const scriptPath = path.join(root, 'scripts', 'request_letsencrypt.ps1');

    const logPath = path.join(root, 'logs', 'ssl-progress.json');
    try {
        if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    } catch (e) { }

    const { spawn } = require('child_process');
    try {
        const vbsPath = path.join(root, 'scripts', 'temp_ssl_launcher.vbs');
        const psPath = scriptPath.replace(/\\/g, '\\\\');

        // Escape arguments for PowerShell execution via VBS
        const vbsCode = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""${psPath}"" -Domain ""${domain}"" -Email ""${email}""", 0, False
`;
        fs.writeFileSync(vbsPath, vbsCode);

        const child = spawn('cscript.exe', ['//nologo', vbsPath], {
            detached: true,
            stdio: 'ignore',
            cwd: root,
            windowsHide: true
        });

        child.on('error', (err) => {
            fs.appendFileSync(path.join(root, 'logs', 'ssl-launcher-debug.log'), `[${new Date().toISOString()}] Spawn Error: ${err.message}\n`);
        });

        child.unref();

        console.log(`[Management Console] Spawned Let's Encrypt generation script for ${domain}`);
        res.json({ success: true, message: "SSL Prozess gestartet." });
    } catch (error) {
        fs.appendFileSync(path.join(root, 'logs', 'ssl-launcher-debug.log'), `[${new Date().toISOString()}] Catch Error: ${error.message}\n`);
        console.error('[SSL API] Error launching script:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- System Config Routes ---
app.get('/api/system/config', authenticateToken, (req, res) => {
    const config = getSystemConfig();
    if (!config) {
        return res.status(500).json({ error: 'System configuration missing' });
    }
    res.json({
        success: true,
        config: {
            projectRoot: config.projectRoot || '',
            systemUsername: config.systemUsername || '',
            systemPassword: config.systemPassword || '',
            ntUsername: config.ntUsername || '',
            ntPassword: config.ntPassword || ''
        }
    });
});

app.post('/api/system/config', authenticateToken, (req, res) => {
    const { systemUsername, systemPassword, ntUsername, ntPassword } = req.body;
    try {
        let config = getSystemConfig() || {};
        let modified = false;

        if (systemUsername !== undefined && systemUsername !== '') {
            config.systemUsername = systemUsername;
            modified = true;
        }
        if (systemPassword !== undefined && systemPassword !== '') {
            config.systemPassword = systemPassword;
            modified = true;
        }
        if (ntUsername !== undefined) {
            config.ntUsername = ntUsername;
            modified = true;
        }
        if (ntPassword !== undefined) {
            config.ntPassword = ntPassword;
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(SYSTEM_JSON_PATH, JSON.stringify(config, null, 4), 'utf8');
        }
        res.json({ success: true });
    } catch (e) {
        console.error('[Management Console] Failed to write system.json', e);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Serve frontend build (if any)
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// --- Server Startup (Detect SSL) ---
const config = getSystemConfig();
const useSSL = config?.backend?.useSSL === true;

if (useSSL) {
    try {
        const certPath = path.join(CERTS_DIR, 'server.crt');
        const keyPath = path.join(CERTS_DIR, 'server.key');
        const pfxPath = path.join(CERTS_DIR, 'server.pfx');

        let sslOptions = {};

        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            sslOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
            console.log(`[Management Console] Starting with SSL (CRT/KEY)`);
        } else if (fs.existsSync(pfxPath)) {
            sslOptions = {
                pfx: fs.readFileSync(pfxPath),
                passphrase: config.backend.pfxPassword || 'cockpit'
            };
            console.log(`[Management Console] Starting with SSL (PFX)`);
        } else {
            throw new Error('Certificates not found in ' + CERTS_DIR);
        }

        const server = https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Management Console running on https://127.0.0.1:${PORT}`);
            autoUpdateService.start();
        });
        server.on('error', (e) => console.error('[Management Console] HTTPS Server Error:', e.message));

    } catch (e) {
        console.error('[Management Console] Failed to start with SSL, falling back to HTTP:', e.message);
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Management Console running on http://127.0.0.1:${PORT} (SSL Fallback)`);
            autoUpdateService.start();
        });
        server.on('error', (e) => console.error('[Management Console] HTTP Server Error:', e.message));
    }
} else {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Management Console running on http://127.0.0.1:${PORT} (No SSL Configured)`);
        autoUpdateService.start();
    });
    server.on('error', (e) => console.error('[Management Console] HTTP Server Error:', e.message));
}
