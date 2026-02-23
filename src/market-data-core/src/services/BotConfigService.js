const fs = require('fs');
const path = require('path');
const db = require('./DatabaseService'); // Singleton DB

const CONFIG_FILE = path.join(__dirname, '../../data/bot_configs.json');
const BACKUP_FILE = path.join(__dirname, '../../data/bot_configs.json.bak');

class BotConfigService {
    constructor() {
        this.migrateJsonToDb();
    }

    migrateJsonToDb() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                console.log("[BotConfigService] 🔧 Found legacy bot_configs.json. Migrating to database...");
                const configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

                let migratedCount = 0;
                for (const botId of Object.keys(configs)) {
                    // Only migrate if it's not empty and no config exists in DB yet
                    if (Object.keys(configs[botId]).length > 0) {
                        const existingDbConfig = db.getBotConfig(botId);
                        if (Object.keys(existingDbConfig).length === 0) {
                            db.saveBotConfig(botId, configs[botId]);
                            migratedCount++;
                        }
                    }
                }

                fs.renameSync(CONFIG_FILE, BACKUP_FILE);
                console.log(`[BotConfigService] ✅ Migrated ${migratedCount} bot configs to database. Backup created at: ${BACKUP_FILE}`);
            }
        } catch (e) {
            console.error("[BotConfigService] Migration Error:", e);
        }
    }

    getConfig(botId) {
        return db.getBotConfig(botId);
    }

    setConfig(botId, config) {
        // Merge with existing config
        const existingConfig = db.getBotConfig(botId) || {};
        const newConfig = {
            ...existingConfig,
            ...config,
            lastUpdated: Date.now()
        };
        db.saveBotConfig(botId, newConfig);
        return newConfig;
    }
}

module.exports = new BotConfigService();
