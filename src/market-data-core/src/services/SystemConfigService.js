const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '../../data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'system.json');

class SystemConfigService {
    constructor() {
        this.cache = null;
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (!fs.existsSync(CONFIG_DIR)) {
                fs.mkdirSync(CONFIG_DIR, { recursive: true });
            }

            if (fs.existsSync(CONFIG_FILE)) {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                this.cache = JSON.parse(data);
            } else {
                // Default fallback configuration
                this.cache = this.getDefaultConfig();
                this.saveConfig(this.cache);
                console.log(`[SystemConfigService] Created default system configuration at ${CONFIG_FILE}`);
            }
        } catch (e) {
            console.error('[SystemConfigService] Failed to load config:', e.message);
            this.cache = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            projectRoot: "C:\\Trading",
            systemUsername: "admin",
            systemPassword: "admin",
            backend: {
                port: 3005,
                useSSL: false
            },
            frontend: {
                port: 3001,
                apiUrl: "http://127.0.0.1:3005"
            }
        };
    }

    getConfig() {
        if (!this.cache) {
            this.loadConfig();
        }
        return this.cache;
    }

    saveConfig(configData) {
        try {
            // Merge with existing
            const current = this.cache || this.getDefaultConfig();
            this.cache = { ...current, ...configData };
            
            if (!fs.existsSync(CONFIG_DIR)) {
                fs.mkdirSync(CONFIG_DIR, { recursive: true });
            }

            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.cache, null, 4), 'utf8');
            return true;
        } catch (e) {
            console.error('[SystemConfigService] Failed to save config:', e.message);
            return false;
        }
    }
}

// Export as a singleton
module.exports = new SystemConfigService();
