const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/bot_configs.json');

class BotConfigService {
    constructor() {
        this.configs = {};
        this.loadConfigs();
    }

    loadConfigs() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                this.configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            } else {
                // Initialize directory if needed
                const dir = path.dirname(CONFIG_FILE);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                this.configs = {};
            }
        } catch (e) {
            console.error("[BotConfigService] Load Error:", e);
            this.configs = {};
        }
    }

    saveConfigs() {
        try {
            const dir = path.dirname(CONFIG_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.configs, null, 4));
        } catch (e) {
            console.error("[BotConfigService] Save Error:", e);
        }
    }

    getConfig(botId) {
        return this.configs[botId] || {};
    }

    setConfig(botId, config) {
        // Merge with existing config
        this.configs[botId] = {
            ...(this.configs[botId] || {}),
            ...config,
            lastUpdated: Date.now()
        };
        this.saveConfigs();
        return this.configs[botId];
    }

    getAllConfigs() {
        return this.configs;
    }
}

module.exports = new BotConfigService();
