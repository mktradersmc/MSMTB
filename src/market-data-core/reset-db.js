const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const OLD_DB = path.join(__dirname, 'market-data.db');
const NEW_DIR = path.join(__dirname, 'db');
const NEW_DB = path.join(NEW_DIR, 'core.db');

async function run() {
    console.log('[DB-Migrator] Starting...');

    // 1. Ensure Directory Exists
    if (!fs.existsSync(NEW_DIR)) {
        fs.mkdirSync(NEW_DIR, { recursive: true });
        console.log(`[DB-Migrator] Created directory: ${NEW_DIR}`);
    }

    // 2. Copy Database explicitly if it doesn't exist at the new location
    if (fs.existsSync(OLD_DB)) {
        fs.copyFileSync(OLD_DB, NEW_DB);
        console.log(`[DB-Migrator] Copied ${OLD_DB} -> ${NEW_DB}`);
    } else {
        console.log(`[DB-Migrator] NOT FOUND: ${OLD_DB}. Cannot copy.`);
        if (!fs.existsSync(NEW_DB)) {
            console.log(`[DB-Migrator] Creating empty database at ${NEW_DB}...`);
        }
    }

    // 3. Connect to the NEW location
    const db = new Database(NEW_DB);
    db.pragma('journal_mode = WAL');

    // 4. Tables to empty (Everything EXCEPT 'brokers')
    const tablesToEmpty = [
        'config', 'asset_mappings', 'broker_symbols', 'session_records', 
        'sanity_checks', 'active_trades', 'trade_history', 'broker_executions', 
        'accounts', 'distribution_configs', 'distribution_state', 'users', 
        'economic_calendar', 'bot_configs', 'messages'
    ];

    db.transaction(() => {
        tablesToEmpty.forEach(table => {
            try {
                const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
                if (check) {
                    db.prepare(`DELETE FROM ${table}`).run();
                    console.log(`[DB-Migrator] ✔️ Emptied table: ${table}`);
                }
            } catch (err) {
                console.error(`[DB-Migrator] Error emptying ${table}: ${err.message}`);
            }
        });

        // 5. Delete "Apex" from brokers table
        try {
            const checkBrokers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brokers'").get();
            if (checkBrokers) {
                const info = db.prepare("DELETE FROM brokers WHERE name = 'Apex' OR shorthand = 'Apex' OR id LIKE '%Apex%'").run();
                console.log(`[DB-Migrator] ✔️ Deleted 'Apex' from brokers. Rows affected: ${info.changes}`);
            }
        } catch (err) {
            console.error(`[DB-Migrator] Error deleting Apex broker: ${err.message}`);
        }
    })();

    db.close();
    console.log('[DB-Migrator] Done!');
}

run();
