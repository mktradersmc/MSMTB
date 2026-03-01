const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
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
app.get('/api/system/update/status', authenticateToken, (req, res) => {
    res.json(autoUpdateService.getBasicStatus());
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

        if (fs.existsSync(pfxPath)) {
            sslOptions = {
                pfx: fs.readFileSync(pfxPath),
                passphrase: config.backend.pfxPassword || 'cockpit'
            };
            console.log(`[Management Console] Starting with SSL (PFX)`);
        } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            sslOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
            console.log(`[Management Console] Starting with SSL (CRT/KEY)`);
        } else {
            throw new Error('Certificates not found in ' + CERTS_DIR);
        }

        https.createServer(sslOptions, app).listen(PORT, () => {
            console.log(`🚀 Management Console running on https://127.0.0.1:${PORT}`);
            autoUpdateService.start();
        });

    } catch (e) {
        console.error('[Management Console] Failed to start with SSL, falling back to HTTP:', e.message);
        app.listen(PORT, () => {
            console.log(`🚀 Management Console running on http://127.0.0.1:${PORT} (SSL Fallback)`);
            autoUpdateService.start();
        });
    }
} else {
    app.listen(PORT, () => {
        console.log(`🚀 Management Console running on http://127.0.0.1:${PORT} (No SSL Configured)`);
        autoUpdateService.start();
    });
}
