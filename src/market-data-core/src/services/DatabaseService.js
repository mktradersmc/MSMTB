const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Path resolution (Trading Cockpit Data)
const JSON_DATA_DIR = path.join(__dirname, '../../../trading-cockpit/data');
const ACCOUNTS_FILE = path.join(JSON_DATA_DIR, 'accounts.json');
const BROKERS_FILE = path.join(JSON_DATA_DIR, 'brokers.json');

class DatabaseService {
    constructor() {
        this.marketDb = new Database(config.DB_MARKET_PATH);
        this.tradesDb = new Database(config.DB_TRADES_PATH);
        this.symbolDbs = new Map();
        this.init();
    }

    // --- INITIALIZATION & SCHEMA ---
    init() {
        this.marketDb.pragma('busy_timeout = 5000');
        this.marketDb.pragma('journal_mode = WAL');

        try { this.marketDb.exec("DROP TABLE IF EXISTS candles"); } catch (e) { }
        this.purgeLegacyTables();

        // Schema Check: broker_symbols must have broker_id
        // Schema Check: broker_symbols must have broker_id
        // FORCE DROP to resolve persistent schema mismatch (bot_idv error)
        try {
            // this.marketDb.exec("DROP TABLE IF EXISTS broker_symbols"); // Force Reset
            const cols = this.marketDb.pragma("table_info(broker_symbols)");
            if (cols.length > 0 && !cols.some(c => c.name === 'broker_id')) {
                console.log("[DB] ⚠️ Detected outdated broker_symbols schema. Recreating...");
                this.marketDb.exec("DROP TABLE broker_symbols");
            }
        } catch (e) { /* ignore */ }

        // Schema Check: distribution_configs must have composite primary key
        try {
            const cols = this.marketDb.pragma("table_info(distribution_configs)");
            const pkCols = cols.filter(c => c.pk > 0);
            if (pkCols.length === 1 && pkCols[0].name === 'broker_id') {
                console.log("[DB] ⚠️ Detected outdated distribution_configs schema. Recreating...");
                this.marketDb.exec("DROP TABLE distribution_configs");
            }
        } catch (e) { /* ignore */ }

        this.marketDb.exec(`
            CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
            CREATE TABLE IF NOT EXISTS asset_mappings (original_symbol TEXT PRIMARY KEY, datafeed_symbol TEXT, mappings TEXT, updated_at INTEGER);
            CREATE TABLE IF NOT EXISTS broker_symbols (broker_id TEXT PRIMARY KEY, symbols TEXT, updated_at INTEGER);
            CREATE TABLE IF NOT EXISTS session_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT, session_type TEXT, start_time INTEGER, end_time INTEGER,
                high REAL, low REAL, open REAL, mitigated_at_high INTEGER, mitigated_at_low INTEGER, range_pips REAL, config_hash TEXT,
                UNIQUE(symbol, session_type, start_time, config_hash)
            );
            CREATE TABLE IF NOT EXISTS sanity_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, bot_id TEXT, timestamp INTEGER, status TEXT, details TEXT);
            CREATE TABLE IF NOT EXISTS active_trades (
                id TEXT PRIMARY KEY, symbol TEXT, direction INTEGER, status TEXT, entry_price REAL, sl REAL, tp REAL, volume REAL,
                strategy TEXT, params TEXT, created_at INTEGER, updated_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS trade_history (
                id TEXT PRIMARY KEY, symbol TEXT, direction INTEGER, status TEXT, entry_price REAL, exit_price REAL, volume REAL,
                profit REAL, commission REAL, swap REAL, strategy TEXT, open_time INTEGER, close_time INTEGER, duration INTEGER
            );
            CREATE TABLE IF NOT EXISTS broker_executions (
                id TEXT PRIMARY KEY, master_trade_id TEXT, bot_id TEXT, broker_id TEXT, account_id TEXT, status TEXT DEFAULT 'SENT',
                realized_pl REAL DEFAULT 0, commission REAL DEFAULT 0, swap REAL DEFAULT 0, volume REAL, entry_price REAL, sl REAL, tp REAL,
                initial_entry REAL, initial_sl REAL, initial_tp REAL,
                open_time INTEGER, close_time INTEGER, unrealized_pl REAL DEFAULT 0, magic_number INTEGER, updated_at INTEGER,
                FOREIGN KEY(master_trade_id) REFERENCES active_trades(id)
            );
        `);

        // Migrations
        try { this.marketDb.exec("ALTER TABLE active_trades ADD COLUMN params TEXT"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN magic_number INTEGER"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN open_time INTEGER DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN close_time INTEGER DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN entry_price REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN sl REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN tp REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN created_at INTEGER DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN updated_at INTEGER DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE accounts ADD COLUMN balance REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN volume REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN unrealized_pl REAL DEFAULT 0"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE active_trades ADD COLUMN environment TEXT DEFAULT 'test'"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN environment TEXT DEFAULT 'test'"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN initial_entry REAL"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN initial_sl REAL"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE broker_executions ADD COLUMN initial_tp REAL"); } catch (e) { }
        try { this.marketDb.exec("ALTER TABLE accounts ADD COLUMN account_size REAL DEFAULT NULL"); } catch (e) { }

        // Trades DB Migrations (Fix for Task-0199 Crash)
        try { this.tradesDb.exec("ALTER TABLE messages ADD COLUMN isActive INTEGER DEFAULT 1"); } catch (e) { }

        // New Migration Tables (Broker/Account/Distribution)
        this.marketDb.exec(`
            CREATE TABLE IF NOT EXISTS brokers (
                id TEXT PRIMARY KEY, name TEXT, shorthand TEXT, servers TEXT, symbol_mappings TEXT,
                default_symbol TEXT, type TEXT, api TEXT, environment TEXT
            );
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY, bot_id TEXT, broker_id TEXT, login TEXT, password TEXT, server TEXT,
                account_type TEXT, is_test INTEGER,
                is_datafeed INTEGER, platform TEXT, timezone TEXT, balance REAL, account_size REAL, created_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS distribution_configs (
                broker_id TEXT, loop_size INTEGER, matrix TEXT, environment TEXT,
                PRIMARY KEY (broker_id, environment)
            );
            CREATE TABLE IF NOT EXISTS distribution_state (
                broker_id TEXT PRIMARY KEY, sequence INTEGER, updated_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, created_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS economic_calendar (
                id TEXT PRIMARY KEY, event_id INTEGER, name TEXT, country TEXT, currency TEXT,
                impact TEXT, timestamp INTEGER, actual TEXT, forecast TEXT, previous TEXT,
                time_label TEXT, date_string TEXT, updated_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS bot_configs (
                bot_id TEXT PRIMARY KEY, config TEXT, updated_at INTEGER
            );
        `);

        // Perform Data Migration from JSON if tables are empty
        this.migrateJsonToDb();

        // Indices
        this.marketDb.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_lookup ON session_records (symbol, start_time, config_hash)").run();
        this.marketDb.prepare("CREATE INDEX IF NOT EXISTS idx_broker_exec_magic ON broker_executions (magic_number, bot_id)").run();

        // Trades DB
        this.tradesDb.pragma('journal_mode = WAL');
        this.tradesDb.exec(`
             CREATE TABLE IF NOT EXISTS messages (
                 id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, botId TEXT, type TEXT, content TEXT, 
                 isProcessed INTEGER DEFAULT 0, timestamp INTEGER, isActive INTEGER DEFAULT 1
             );
        `);
        this.tradesDb.prepare("CREATE INDEX IF NOT EXISTS idx_messages_polling ON messages (isActive, sender, botId)").run();
    }

    purgeLegacyTables() {
        try {
            this.marketDb.exec("DROP TABLE IF EXISTS ticks");
            const tables = this.marketDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'candles_%'").all();
            if (tables.length > 0) {
                const dropMany = this.marketDb.transaction((tbls) => {
                    for (const t of tbls) this.marketDb.prepare(`DROP TABLE IF EXISTS ${t.name}`).run();
                });
                dropMany(tables);
            }
        } catch (e) { console.error("[DB] Legacy Purge Failed:", e); }
    }

    migrateJsonToDb() {
        try {
            // 1. Brokers
            const brokerCount = this.marketDb.prepare("SELECT count(*) as count FROM brokers").get().count;
            if (brokerCount === 0 && fs.existsSync(BROKERS_FILE)) {
                console.log("[DB] Migrating Brokers from JSON...");
                const brokers = this._loadJson(BROKERS_FILE);
                const insert = this.marketDb.prepare(`
                    INSERT INTO brokers (id, name, shorthand, servers, symbol_mappings, default_symbol, type, api, environment)
                    VALUES (@id, @name, @shorthand, @servers, @symbolMappings, @defaultSymbol, @type, @api, @environment)
                `);
                const insertMany = this.marketDb.transaction((list) => {
                    for (const b of list) insert.run({
                        id: b.id, name: b.name, shorthand: b.shorthand,
                        servers: JSON.stringify(b.servers || []),
                        symbolMappings: JSON.stringify(b.symbolMappings || {}),
                        defaultSymbol: b.defaultSymbol,
                        type: b.type, api: b.api, environment: b.environment
                    });
                });
                insertMany(brokers);
                console.log(`[DB] Migrated ${brokers.length} brokers.`);
            }

            // 2. Accounts
            const accountCount = this.marketDb.prepare("SELECT count(*) as count FROM accounts").get().count;
            if (accountCount === 0 && fs.existsSync(ACCOUNTS_FILE)) {
                console.log("[DB] Migrating Accounts from JSON...");
                const accounts = this._loadJson(ACCOUNTS_FILE);
                const insert = this.marketDb.prepare(`
                    INSERT INTO accounts (id, bot_id, broker_id, login, password, server, account_type, is_test, is_datafeed, platform, timezone, balance, account_size, created_at)
                    VALUES (@id, @botId, @brokerId, @login, @password, @server, @accountType, @isTest, @isDatafeed, @platform, @timezone, @balance, @accountSize, @createdAt)
                `);
                const insertMany = this.marketDb.transaction((list) => {
                    for (const a of list) insert.run({
                        id: a.id, botId: a.botId, brokerId: a.brokerId, login: a.login, password: a.password,
                        server: a.server, accountType: a.accountType, isTest: a.isTest ? 1 : 0,
                        isDatafeed: a.isDatafeed ? 1 : 0, platform: a.platform,
                        timezone: a.timezone, balance: a.balance || 0, accountSize: a.accountSize || null,
                        createdAt: a.createdAt || Date.now()
                    });
                });
                insertMany(accounts);
                console.log(`[DB] Migrated ${accounts.length} accounts.`);
            }

            // 3. Distribution Config
            // Path: src/market-data-core/trading-cockpit/data/distribution_config.json
            const distConfigFile = path.join(__dirname, '../../trading-cockpit/data/distribution_config.json');
            const distConfigCount = this.marketDb.prepare("SELECT count(*) as count FROM distribution_configs").get().count;
            if (distConfigCount === 0 && fs.existsSync(distConfigFile)) {
                console.log("[DB] Migrating Distribution Config from JSON...");
                const config = this._loadJson(distConfigFile);
                const insert = this.marketDb.prepare(`
                    INSERT INTO distribution_configs (broker_id, loop_size, matrix, environment)
                    VALUES (@brokerId, @loopSize, @matrix, @environment)
                `);
                const insertMany = this.marketDb.transaction((conf) => {
                    // Live Brokers
                    if (conf.brokers) {
                        Object.entries(conf.brokers).forEach(([bid, c]) => {
                            insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'LIVE' });
                        });
                    }
                    // Test Brokers
                    if (conf.test_brokers) {
                        Object.entries(conf.test_brokers).forEach(([bid, c]) => {
                            insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'TEST' });
                        });
                    }
                });
                insertMany(config);
                console.log("[DB] Migrated Distribution Configs.");
            }

            // 4. Distribution State
            const distStateFile = path.join(__dirname, '../../trading-cockpit/data/distribution_state.json');
            const distStateCount = this.marketDb.prepare("SELECT count(*) as count FROM distribution_state").get().count;
            if (distStateCount === 0 && fs.existsSync(distStateFile)) {
                console.log("[DB] Migrating Distribution State from JSON...");
                const state = this._loadJson(distStateFile);
                const brokers = this.getBrokers(); // Helper to resolve shorthand
                const insert = this.marketDb.prepare(`
                    INSERT INTO distribution_state (broker_id, sequence, updated_at)
                    VALUES (@brokerId, @sequence, @updatedAt)
                `);
                const insertMany = this.marketDb.transaction((st) => {
                    Object.entries(st).forEach(([key, val]) => {
                        // Key might be UUID or Shorthand
                        let brokerId = key;
                        // Try resolve if not UUID
                        if (!key.includes('-')) {
                            const b = brokers.find(x => x.shorthand === key);
                            if (b) brokerId = b.id;
                        }
                        insert.run({ brokerId: brokerId, sequence: val.sequence, updatedAt: Date.now() });
                    });
                });
                insertMany(state);
                console.log("[DB] Migrated Distribution State.");
                console.log("[DB] Migrated Distribution State.");
            }

        } catch (e) {
            console.error("[DB] Migration Failed:", e);
        }
    }

    // --- DISTRIBUTION CONFIG ---
    getDistributionConfig() {
        try {
            const rows = this.marketDb.prepare("SELECT * FROM distribution_configs").all();
            const config = { brokers: {}, test_brokers: {} };

            rows.forEach(r => {
                const entry = {
                    loop_size: r.loop_size,
                    matrix: JSON.parse(r.matrix || '{}')
                };
                if (r.environment === 'LIVE') config.brokers[r.broker_id] = entry;
                else if (r.environment === 'TEST') config.test_brokers[r.broker_id] = entry;
            });
            return config;
        } catch (e) {
            console.error("[DB] getDistributionConfig Error:", e);
            return {};
        }
    }

    saveDistributionConfig(config) {
        try {
            // Transaction: Clear Table -> Insert All
            // This ensures removed brokers are actually removed.
            const insert = this.marketDb.prepare(`
                INSERT INTO distribution_configs (broker_id, loop_size, matrix, environment)
                VALUES (@brokerId, @loopSize, @matrix, @environment)
            `);

            const saveTransaction = this.marketDb.transaction((conf) => {
                this.marketDb.prepare("DELETE FROM distribution_configs").run();

                // Live Brokers
                if (conf.brokers) {
                    Object.entries(conf.brokers).forEach(([bid, c]) => {
                        insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'LIVE' });
                    });
                }
                // Test Brokers
                if (conf.test_brokers) {
                    Object.entries(conf.test_brokers).forEach(([bid, c]) => {
                        insert.run({ brokerId: bid, loopSize: c.loop_size, matrix: JSON.stringify(c.matrix), environment: 'TEST' });
                    });
                }
            });

            saveTransaction(config);
            return true;
        } catch (e) {
            console.error("[DB] saveDistributionConfig Error:", e);
            return false;
        }
    }

    getDistributionState() {
        try {
            const rows = this.marketDb.prepare("SELECT * FROM distribution_state").all();
            const state = {};
            rows.forEach(r => {
                state[r.broker_id] = { sequence: r.sequence };
            });
            return state;
        } catch (e) {
            console.error("[DB] getDistributionState Error:", e);
            return {};
        }
    }

    saveDistributionState(brokerId, sequence) {
        try {
            this.marketDb.prepare(`
                INSERT OR REPLACE INTO distribution_state (broker_id, sequence, updated_at)
                VALUES (?, ?, ?)
            `).run(brokerId, sequence, Date.now());
        } catch (e) {
            console.error("[DB] saveDistributionState Error:", e);
        }
    }

    // --- JSON HELPERS (Deprecated for Primary Storage, kept for fallback/migration) ---
    _loadJson(f) { try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { } return []; }
    _saveJson(f, d) { try { fs.writeFileSync(f, JSON.stringify(d, null, 2)); } catch (e) { console.error("Save JSON failed", e); } }

    // --- CONFIGURATION ---
    getConfig(key) {
        try {
            const row = this.marketDb.prepare('SELECT value FROM config WHERE key = ?').get(key);
            return row ? JSON.parse(row.value) : null;
        } catch (e) {
            console.error(`[DatabaseService] getConfig Error(${key}):`, e.message);
            return null;
        }
    }
    setConfig(key, value) {
        try {
            this.marketDb.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
            return true;
        } catch (e) { return false; }
    }

    // --- ASSET MAPPING ---
    getMappings() {
        try {
            return this.marketDb.prepare("SELECT * FROM asset_mappings").all().map(r => ({
                originalSymbol: r.original_symbol, datafeedSymbol: r.datafeed_symbol, mappings: JSON.parse(r.mappings || '[]'), updatedAt: r.updated_at
            }));
        } catch (e) { return []; }
    }
    saveMapping(m) {
        try {
            this.marketDb.prepare("INSERT OR REPLACE INTO asset_mappings (original_symbol, datafeed_symbol, mappings, updated_at) VALUES (?, ?, ?, ?)").run(m.originalSymbol, m.datafeedSymbol, JSON.stringify(m.mappings), Date.now());
            return true;
        } catch (e) { return false; }
    }

    // --- ACCESSORS (New DB Methods) ---

    // 1. BROKERS
    getBrokers() {
        const rows = this.marketDb.prepare("SELECT * FROM brokers").all();
        const mappingsDb = this.getMappings(); // Inject actual DB state mappings

        return rows.map(r => {
            let symbolMappings = JSON.parse(r.symbol_mappings || '{}');

            // Reconstruct symbol dict from the centralized asset_mappings table
            mappingsDb.forEach(m => {
                if (m.mappings && m.mappings[r.id]) {
                    symbolMappings[m.originalSymbol] = m.mappings[r.id];
                } else if (m.mappings && m.mappings[r.shorthand]) {
                    // Fallback to shorthand if stored that way
                    symbolMappings[m.originalSymbol] = m.mappings[r.shorthand];
                }
            });

            return {
                ...r,
                servers: JSON.parse(r.servers || '[]'),
                symbolMappings: symbolMappings,
                defaultSymbol: r.default_symbol
            };
        });
    }

    saveBroker(b) {
        const stmt = this.marketDb.prepare(`
            INSERT OR REPLACE INTO brokers (id, name, shorthand, servers, symbol_mappings, default_symbol, type, api, environment)
            VALUES (@id, @name, @shorthand, @servers, @symbolMappings, @defaultSymbol, @type, @api, @environment)
        `);
        stmt.run({
            id: b.id, name: b.name, shorthand: b.shorthand,
            servers: JSON.stringify(b.servers || []),
            symbolMappings: JSON.stringify(b.symbolMappings || {}),
            defaultSymbol: b.defaultSymbol,
            type: b.type, api: b.api, environment: b.environment
        });
    }

    deleteBroker(id) {
        this.marketDb.prepare("DELETE FROM brokers WHERE id = ?").run(id);
    }

    // 2. ACCOUNTS
    getAccounts() {
        // Self-heal: Retroactively generate account_size for existing accounts that have a balance
        this.marketDb.prepare("UPDATE accounts SET account_size = round(balance / 1000) * 1000 WHERE balance > 0 AND (account_size IS NULL OR account_size = 0)").run();

        const rows = this.marketDb.prepare("SELECT * FROM accounts").all();
        return rows.map(r => ({
            ...r,
            isTest: !!r.is_test,
            isDatafeed: !!r.is_datafeed,
            botId: r.bot_id,
            brokerId: r.broker_id,
            accountType: r.account_type,
            accountSize: r.account_size,
            platform: r.platform,
            timezone: r.timezone,
            // Fallbacks for transitional runtime where consumers expect these
            status: 'STOPPED',
            pid: 0
        }));
    }

    saveAccount(a) {
        // Ensure ID
        if (!a.id) a.id = `gen_${Date.now()}`;

        try {
            // Guard against zeroing out existing balance if this is just a status update
            let finalBalance = a.balance !== undefined ? a.balance : 0;
            let finalAccountSize = a.accountSize || null;

            if (finalBalance === 0) {
                const existing = this.marketDb.prepare("SELECT balance, account_size FROM accounts WHERE id = ? OR bot_id = ?").get(a.id, a.botId);
                if (existing && existing.balance > 0) {
                    finalBalance = existing.balance;
                    finalAccountSize = existing.account_size;
                }
            } else if (finalBalance > 0 && !finalAccountSize) {
                // Auto-calc account size cleanly if provided
                finalAccountSize = Math.round(finalBalance / 1000) * 1000;
            }

            const stmt = this.marketDb.prepare(`
                INSERT OR REPLACE INTO accounts (id, bot_id, broker_id, login, password, server, account_type, is_test, is_datafeed, platform, timezone, balance, account_size, created_at)
                VALUES (@id, @botId, @brokerId, @login, @password, @server, @accountType, @isTest, @isDatafeed, @platform, @timezone, @balance, @accountSize, @createdAt)
            `);

            stmt.run({
                id: a.id, botId: a.botId || null, brokerId: a.brokerId || null, login: a.login || '', password: a.password || '',
                server: a.server || null, accountType: a.accountType || null, isTest: a.isTest ? 1 : 0,
                isDatafeed: a.isDatafeed ? 1 : 0,
                platform: a.platform || 'MT5', timezone: a.timezone || null, balance: finalBalance, accountSize: finalAccountSize,
                createdAt: a.createdAt || Date.now()
            });
            return true;
        } catch (e) {
            console.error("[DB] saveAccount Error:", e);
            return false;
        }
    }

    saveAccountTimezone(botId, timezone) {
        try {
            this.marketDb.prepare("UPDATE accounts SET timezone = ? WHERE id = ? OR bot_id = ?").run(timezone, botId, botId);
            console.log(`[DB] Persisted Timezone for bot_id ${botId}: ${timezone}`);
        } catch (e) {
            console.error("[DB] saveAccountTimezone Error:", e);
        }
    }

    saveAccountBalance(botId, balance) {
        try {
            this.marketDb.prepare("UPDATE accounts SET balance = ? WHERE id = ? OR bot_id = ?").run(balance, botId, botId);
            console.log(`[DB] Persisted Balance for bot_id ${botId}: ${balance}`);

            if (balance > 0) {
                const acc = this.marketDb.prepare("SELECT account_size FROM accounts WHERE id = ? OR bot_id = ?").get(botId, botId);
                if (acc && (acc.account_size === null || acc.account_size === 0)) {
                    const newSize = Math.round(balance / 1000) * 1000;
                    this.marketDb.prepare("UPDATE accounts SET account_size = ? WHERE id = ? OR bot_id = ?").run(newSize, botId, botId);
                    console.log(`[DB] Auto-Initialized Account Size for bot_id ${botId}: ${newSize}`);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error("[DB] saveAccountBalance Error:", e);
            return false;
        }
    }

    saveAccountSize(id, size) {
        try {
            const res = this.marketDb.prepare("UPDATE accounts SET account_size = ? WHERE id = ? OR bot_id = ?").run(size, id, id);
            return res.changes > 0;
        } catch (e) {
            console.error("[DB] saveAccountSize Error:", e);
            return false;
        }
    }

    // --- BOT CONFIGURATION ---
    getBotConfig(botId) {
        try {
            const row = this.marketDb.prepare("SELECT config FROM bot_configs WHERE bot_id = ?").get(botId);
            return row ? (JSON.parse(row.config) || {}) : {};
        } catch (e) {
            console.error("[DB] getBotConfig Error:", e);
            return {};
        }
    }

    saveBotConfig(botId, config) {
        try {
            const stmt = this.marketDb.prepare(`
                INSERT OR REPLACE INTO bot_configs (bot_id, config, updated_at) 
                VALUES (?, ?, ?)
            `);
            stmt.run(botId, JSON.stringify(config), Date.now());
            return true;
        } catch (e) {
            console.error("[DB] saveBotConfig Error:", e);
            return false;
        }
    }

    // 3. USERS
    getUserByUsername(username) {
        try {
            return this.marketDb.prepare("SELECT * FROM users WHERE username = ?").get(username);
        } catch (e) {
            console.error("[DB] getUserByUsername Error:", e);
            return null;
        }
    }

    createUser(username, passwordHash) {
        const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        try {
            this.marketDb.prepare(`
                INSERT INTO users (id, username, password_hash, created_at)
                VALUES (?, ?, ?, ?)
            `).run(id, username, passwordHash, Date.now());
            return id;
        } catch (e) {
            console.error("[DB] createUser Error:", e);
            return null;
        }
    }

    getUsersCount() {
        try {
            const row = this.marketDb.prepare("SELECT count(*) as count FROM users").get();
            return row ? row.count : 0;
        } catch (e) {
            console.error("[DB] getUsersCount Error:", e);
            return 0;
        }
    }

    deleteAccount(id) {
        try {
            this.marketDb.prepare("DELETE FROM accounts WHERE id = ?").run(id);
        } catch (e) {
            console.error("[DB] deleteAccount Error:", e);
        }
    }

    getBrokerIdForBotId(botId) {
        try {
            const row = this.marketDb.prepare("SELECT broker_id FROM accounts WHERE bot_id = ? LIMIT 1").get(botId);
            return row ? row.broker_id : null;
        } catch (e) {
            console.error("[DB] getBrokerIdForBotId Error:", e);
            return null;
        }
    }

    getBrokerSymbols(brokerId) {
        try {
            const row = this.marketDb.prepare("SELECT symbols FROM broker_symbols WHERE broker_id = ?").get(brokerId);
            return row ? JSON.parse(row.symbols || '[]') : [];
        } catch (e) {
            console.error("[DB] getBrokerSymbols Error:", e);
            return [];
        }
    }

    saveBrokerSymbols(brokerId, symbols) {
        try {
            const stmt = this.marketDb.prepare(`
                INSERT OR REPLACE INTO broker_symbols (broker_id, symbols, updated_at)
                VALUES (?, ?, ?)
            `);
            stmt.run(brokerId, JSON.stringify(symbols), Date.now());
            console.log(`[DB] 💾 Saved ${symbols.length} symbols for Broker ${brokerId}`);
            return true;
        } catch (e) {
            console.error("[DB] saveBrokerSymbols Error:", e);
            return false;
        }
    }

    // --- TRADE MANAGEMENT ---
    getActiveTrades(env = 'test') { // Default to 'test' for safety
        try {
            // OPTIMIZATION: 2-Query Load Strategy (Instead of N+1)
            // 1. Fetch all Master Trades for Environment (Exclude CLOSED and Terminals)
            const trades = this.marketDb.prepare("SELECT * FROM active_trades WHERE environment = ? AND status NOT IN ('CLOSED', 'ERROR', 'REJECTED', 'OFFLINE', 'CANCELED')").all(env);
            if (trades.length === 0) return [];

            // 2. Fetch ALL Broker Executions for these trades (Batch)
            // We use a safe parameterized query or just fetch all active executions if table is small?
            // Safer: Fetch all executions where master_trade_id IN (...) is hard in SQLite prepared.
            // Efficient: Fetch ALL broker executions (assuming table is pruned/small for active).
            // Better: Filter by environment too
            const allExecs = this.marketDb.prepare("SELECT * FROM broker_executions WHERE environment = ?").all(env);

            // 3. In-Memory Grouping & Aggregation
            const execMap = new Map();
            for (const ex of allExecs) {
                if (!execMap.has(ex.master_trade_id)) execMap.set(ex.master_trade_id, []);
                execMap.get(ex.master_trade_id).push(ex);
            }

            trades.forEach(t => {
                t.executions = execMap.get(t.id) || [];

                // DYNAMIC AGGREGATION (Read-Time)
                t.realizedPl = 0;
                t.unrealizedPl = 0;
                t.commission = 0;
                t.swap = 0;
                t.volume = 0;

                for (const ex of t.executions) {
                    t.realizedPl += (ex.realized_pl || 0);
                    t.unrealizedPl += (ex.unrealized_pl || 0);
                    t.commission += (ex.commission || 0);
                    t.swap += (ex.swap || 0);
                    t.volume += (ex.volume || 0);
                }

                if (t.params) try { t.params = JSON.parse(t.params); } catch (e) { }
            });
            return trades;
        } catch (e) { return []; }
    }
    // createTrade moved to standardized section below (see line 474+)
    deleteActiveTrade(id) {
        try {
            this.marketDb.prepare("DELETE FROM broker_executions WHERE master_trade_id = ?").run(id);
            this.marketDb.prepare("DELETE FROM active_trades WHERE id = ?").run(id);
            return true;
        } catch (e) { return false; }
    }
    updateTradeStatus(id, status) {
        try {
            this.marketDb.prepare("UPDATE active_trades SET status = ?, updated_at = ? WHERE id = ?").run(status, Date.now(), id);
            this.marketDb.prepare("UPDATE broker_executions SET status = ?, updated_at = ? WHERE master_trade_id = ?").run(status, Date.now(), id);
        } catch (e) { }
    }

    updateMasterTradeStatus(id, status) {
        try {
            this.marketDb.prepare("UPDATE active_trades SET status = ?, updated_at = ? WHERE id = ?").run(status, Date.now(), id);
        } catch (e) { }
    }
    updateTradePL(tradeId, realizedPl, unrealizedPl) {
        try {
            this.marketDb.prepare("UPDATE broker_executions SET realized_pl = ?, unrealized_pl = ?, updated_at = ? WHERE master_trade_id = ?").run(realizedPl || 0, unrealizedPl || 0, Date.now(), tradeId);
            this.marketDb.prepare("UPDATE active_trades SET updated_at = ? WHERE id = ?").run(Date.now(), tradeId);
            return true;
        } catch (e) { return false; }
    }
    archiveTrade(id) {
        try {
            this.marketDb.transaction(() => {
                this.marketDb.prepare("UPDATE broker_executions SET status = 'CLOSED' WHERE master_trade_id = ?").run(id);
                const metrics = this.marketDb.prepare("SELECT SUM(realized_pl) as totalPl, SUM(commission) as totalComm, SUM(swap) as totalSwap FROM broker_executions WHERE master_trade_id = ?").get(id);
                const trade = this.marketDb.prepare("SELECT * FROM active_trades WHERE id = ?").get(id);
                if (trade) {
                    this.marketDb.prepare("INSERT INTO trade_history (id, symbol, direction, status, open_time, close_time, strategy, entry_price, volume, profit, commission, swap) VALUES (?, ?, ?, 'CLOSED', ?, ?, ?, ?, ?, ?, ?, ?)").run(
                        trade.id, trade.symbol, trade.direction, trade.created_at, Date.now(), trade.strategy, trade.entry_price || 0, trade.volume || 0,
                        metrics ? (metrics.totalPl || 0) : 0, metrics ? (metrics.totalComm || 0) : 0, metrics ? (metrics.totalSwap || 0) : 0
                    );
                }
                this.marketDb.prepare("DELETE FROM active_trades WHERE id = ?").run(id);
            })();
            return true;
        } catch (e) { return false; }
    }

    // --- BROKER EXECUTIONS (Task-0189 / Task-0200) ---
    // createBrokerExecution moved to standardized section below (see line 500+)

    getBrokerExecutions(masterId) {
        return this.marketDb.prepare("SELECT * FROM broker_executions WHERE master_trade_id = ?").all(masterId);
    }

    // 🩹 ROBUST AUTO-HEALING VERSION (Restored Step 4519)
    updateBrokerExecutionMetrics(masterId, botId, metrics) {
        try {
            const updates = [];
            const params = [];
            if (metrics.realizedPl !== undefined) { updates.push("realized_pl = ?"); params.push(metrics.realizedPl); }
            if (metrics.commission !== undefined) { updates.push("commission = ?"); params.push(metrics.commission); }
            if (metrics.swap !== undefined) { updates.push("swap = ?"); params.push(metrics.swap); }
            if (metrics.status !== undefined) { updates.push("status = ?"); params.push(metrics.status); }

            // LATCH LOGIC
            if (metrics.volume !== undefined) { updates.push("volume = CASE WHEN volume IS NULL OR volume = 0 THEN ? ELSE volume END"); params.push(metrics.volume); }
            if (metrics.openTime !== undefined) { updates.push("open_time = CASE WHEN open_time IS NULL OR open_time = 0 THEN ? ELSE open_time END"); params.push(metrics.openTime); }
            if (metrics.closeTime !== undefined) { updates.push("close_time = ?"); params.push(metrics.closeTime); }
            if (metrics.entryPrice !== undefined) { updates.push("entry_price = CASE WHEN entry_price IS NULL OR entry_price = 0 THEN ? ELSE entry_price END"); params.push(metrics.entryPrice); }
            if (metrics.sl !== undefined) { updates.push("sl = CASE WHEN sl IS NULL OR sl = 0 THEN ? ELSE sl END"); params.push(metrics.sl); }
            if (metrics.tp !== undefined) { updates.push("tp = CASE WHEN tp IS NULL OR tp = 0 THEN ? ELSE tp END"); params.push(metrics.tp); }

            if (updates.length === 0) return false;
            updates.push("updated_at = ?");
            params.push(Date.now());

            // 1. Exact Match
            const exactRes = this.marketDb.prepare(`UPDATE broker_executions SET ${updates.join(', ')} WHERE master_trade_id = ? AND bot_id = ?`).run(...params, masterId, botId);
            if (exactRes.changes > 0) return true;

            // 2. Lazy Match
            const lazyRes = this.marketDb.prepare(`UPDATE broker_executions SET ${updates.join(', ')} WHERE master_trade_id = ?`).run(...params, masterId);
            if (lazyRes.changes > 0) return true;

            // 3. AUTO-HEAL
            console.log(`[DB] 🩹 Auto-Healing Missing Execution: ${masterId} @ ${botId}`);
            const parentCheck = this.marketDb.prepare('SELECT id FROM active_trades WHERE id = ?').get(masterId);
            if (!parentCheck) {
                try {
                    this.marketDb.prepare("INSERT INTO active_trades (id, symbol, direction, status, entry_price, sl, tp, volume, strategy, params, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .run(masterId, 'UNKNOWN', 0, 'CLOSED', metrics.entryPrice || 0, metrics.sl || 0, metrics.tp || 0, metrics.volume || 0, 'Legacy Recovery', '{}', Date.now(), Date.now());
                } catch (e) { }
            }
            this.marketDb.prepare(`
                INSERT OR REPLACE INTO broker_executions (master_trade_id, bot_id, realized_pl, commission, swap, status, open_time, close_time, entry_price, sl, tp, volume, unrealized_pl, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(masterId, botId, metrics.realizedPl || 0, metrics.commission || 0, metrics.swap || 0, metrics.status || 'UNKNOWN', metrics.openTime || 0, metrics.closeTime || Date.now(), metrics.entryPrice || 0, metrics.sl || 0, metrics.tp || 0, metrics.volume || 0, metrics.unrealizedPl || 0, Date.now());

            return true;
        } catch (e) {
            console.error("[DB] Update Broker Exec Error:", e);
            return false;
        }
    }

    // --- COMMAND QUEUE ---
    queueCommand(botId, type, payload) {
        try {
            const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
            const info = this.tradesDb.prepare("INSERT INTO messages (sender, botId, type, content, isProcessed, timestamp, isActive) VALUES ('Server', ?, ?, ?, 0, ?, 1)").run(botId, type, payloadStr, Date.now());
            return info.lastInsertRowid;
        } catch (e) { return -1; }
    }
    getPendingCommands(botId) {
        try {
            return this.tradesDb.prepare("SELECT * FROM messages WHERE botId = ? AND isProcessed = 0 AND isActive = 1 AND timestamp > ? ORDER BY timestamp ASC").all(botId, Date.now() - 60000);
        } catch (e) { return []; }
    }
    getMessages(lastTimestamp = 0) {
        try {
            return this.tradesDb.prepare("SELECT * FROM messages WHERE timestamp > ? AND isActive = 1 ORDER BY timestamp ASC").all(lastTimestamp);
        } catch (e) { return []; }
    }
    ackCommand(id) { try { this.tradesDb.prepare("UPDATE messages SET isProcessed = 1, isActive = 0 WHERE id = ?").run(id); } catch (e) { } }
    purgeStaleCommands(maxAgeMs) { try { this.tradesDb.prepare("DELETE FROM messages WHERE timestamp < ? AND isProcessed = 0").run(Date.now() - maxAgeMs); } catch (e) { } }

    // --- SANITY CHECKS ---
    logSanityCheck(botId, status, details) { try { this.marketDb.prepare('INSERT INTO sanity_checks (bot_id, timestamp, status, details) VALUES (?, ?, ?, ?)').run(botId, Date.now(), status, typeof details === 'string' ? details : JSON.stringify(details)); } catch (e) { } }
    getLastSanityCheck(botId) { try { const row = this.marketDb.prepare('SELECT timestamp FROM sanity_checks WHERE bot_id = ? ORDER BY timestamp DESC LIMIT 1').get(botId); return row ? row.timestamp : 0; } catch (e) { return 0; } }
    purgeOldSanityChecks(maxAgeMs) { try { this.marketDb.prepare("DELETE FROM sanity_checks WHERE timestamp < ?").run(Date.now() - maxAgeMs); } catch (e) { } }

    // --- SYMBOL DB ---
    getSymbolDb(symbol) {
        if (!symbol) return null;
        if (this.symbolDbs.has(symbol)) return this.symbolDbs.get(symbol);
        const dbPath = path.join(__dirname, `../../db/symbols/${symbol}.db`);
        if (fs.existsSync(dbPath)) {
            try {
                const db = new Database(dbPath, { readonly: false });
                this.symbolDbs.set(symbol, db);
                return db;
            } catch (e) { console.error(`[DB] Failed to open symbol DB for ${symbol}:`, e.message); }
        }
        return null;
    }
    getCandleCount(symbol, timeframe) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return 0;
            const row = db.prepare(`SELECT count(*) as count FROM candles_${timeframe}`).get();
            return row ? row.count : 0;
        } catch (e) { return 0; }
    }
    getCandles(symbol, timeframe, limit = 1000, to = null) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return [];

            if (to) {
                return db.prepare(`SELECT * FROM candles_${timeframe} WHERE time < ? ORDER BY time DESC LIMIT ?`).all(to, limit).reverse();
            } else {
                return db.prepare(`SELECT * FROM candles_${timeframe} ORDER BY time DESC LIMIT ?`).all(limit).reverse();
            }
        } catch (e) { return []; }
    }
    getLastCandle(symbol, timeframe) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return null;
            return db.prepare(`SELECT * FROM candles_${timeframe} ORDER BY time DESC LIMIT 1`).get();
        } catch (e) { return null; }
    }
    getLatestCandles(symbol) { return {}; }
    getLastTimestamp(symbol, timeframe) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return 0;
            const row = db.prepare(`SELECT time FROM candles_${timeframe} ORDER BY time DESC LIMIT 1`).get();
            return row ? row.time : 0;
        } catch (e) { return 0; }
    }
    getFirstTimestamp(symbol, timeframe) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return 0;
            const row = db.prepare(`SELECT time FROM candles_${timeframe} ORDER BY time ASC LIMIT 1`).get();
            return row ? row.time : 0;
        } catch (e) { return 0; }
    }

    executeTyped(stmt, params = [], type = 'RUN') {
        const start = performance.now();
        try {
            if (type === 'RUN') return stmt.run(...params);
            if (type === 'GET') return stmt.get(...params);
            if (type === 'ALL') return stmt.all(...params);
        } finally {
            if ((performance.now() - start) > 100) console.warn(`[DB] ⚠️ SLOW QUERY (${type}): ${stmt.source}`);
        }
    }

    // --- ECONOMIC CALENDAR ---
    saveCalendarEvents(events) {
        try {
            const insert = this.marketDb.prepare(`
                INSERT OR REPLACE INTO economic_calendar 
                (id, event_id, name, country, currency, impact, timestamp, actual, forecast, previous, time_label, date_string, updated_at)
                VALUES (@id, @event_id, @name, @country, @currency, @impact, @timestamp, @actual, @forecast, @previous, @time_label, @date_string, @updated_at)
            `);
            const insertMany = this.marketDb.transaction((list) => {
                for (const e of list) insert.run(e);
            });
            insertMany(events);
            console.log(`[DB] 💾 Saved ${events.length} calendar events.`);
            return true;
        } catch (e) {
            console.error("[DB] saveCalendarEvents Error:", e);
            return false;
        }
    }

    getCalendarEvents(fromTimestamp, toTimestamp) {
        try {
            return this.marketDb.prepare("SELECT * FROM economic_calendar WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC").all(fromTimestamp, toTimestamp);
        } catch (e) {
            console.error("[DB] getCalendarEvents Error:", e);
            return [];
        }
    }

    // --- RESTORED MISSING METHODS (CRITICAL FOR SYNCMANAGER) ---

    getHistory(symbol, timeframe, limit, to = null) {
        return this.getCandles(symbol, timeframe, limit, to);
    }

    getTradeHistory(limit = 50, env = 'test') {
        try {
            // 2-Query Load Strategy for Hierarchical Data
            // 1. Fetch Closed Master Trades (Limit applies here)
            // Note: We select RAW columns to map in JS, plus aggregated defaults if needed
            const sqlMasters = `
                SELECT 
                    id, symbol, direction, status, entry_price, sl, tp, strategy, environment,
                    created_at as open_time, updated_at as close_time, volume
                FROM active_trades 
                WHERE status IN ('CLOSED', 'ERROR', 'REJECTED', 'OFFLINE', 'CANCELED') AND environment = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            const masters = this.marketDb.prepare(sqlMasters).all(env, limit);
            if (masters.length === 0) return [];

            // 2. Fetch All Related Executions
            // We use the IDs from the masters to filter (optional optimization, or just fetch recent by date?)
            // A simple way is to use "WHERE master_trade_id IN (...)" dynamically, 
            // but for 50 items, iterating is okay or parameter binding.
            const masterIds = masters.map(m => m.id);
            const placeholders = masterIds.map(() => '?').join(',');
            const sqlExecs = `SELECT * FROM broker_executions WHERE master_trade_id IN (${placeholders})`;

            const executions = this.marketDb.prepare(sqlExecs).all(...masterIds);

            // 3. Merge & Aggregate in JS
            return masters.map(m => {
                const childExecs = executions.filter(e => e.master_trade_id === m.id);

                // Aggregate Stats
                const profit = childExecs.reduce((sum, e) => sum + (e.realized_pl || 0), 0);
                const commission = childExecs.reduce((sum, e) => sum + (e.commission || 0), 0);
                const swap = childExecs.reduce((sum, e) => sum + (e.swap || 0), 0);
                const vol = childExecs.reduce((sum, e) => sum + (e.volume || 0), 0) || m.volume;
                // Exit price is tricky for multiple, take avg or last? 
                // Let's take Weighted Average by Volume? Or just simple average.
                const exitPrice = childExecs.length > 0
                    ? childExecs.reduce((sum, e) => sum + (e.exit_price || 0), 0) / childExecs.length
                    : 0;

                return {
                    ...m,
                    profit,
                    commission,
                    swap,
                    volume: vol,
                    exit_price: exitPrice,
                    positions: childExecs // Pass full children
                };
            });

        } catch (e) {
            console.error("[DB] getTradeHistory Error:", e);
            return [];
        }
    }

    getMaxTimestamp(symbol, timeframe) {
        return this.getLastTimestamp(symbol, timeframe);
    }

    logMessage(msg) {
        try {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            this.tradesDb.prepare("INSERT INTO messages (sender, botId, type, content, isProcessed, timestamp, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
                msg.sender || 'Server',
                msg.botId || '**',
                msg.type,
                content,
                msg.isProcessed || 0,
                msg.timestamp || Date.now(),
                msg.isActive !== undefined ? msg.isActive : 1
            );
        } catch (e) {
            console.error("[DB] logMessage Error:", e);
        }
    }

    getIncompletePastCandles(symbol, timeframe, cutoffTime) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return [];
            return db.prepare(`SELECT * FROM candles_${timeframe} WHERE is_complete = 0 AND time < ?`).all(cutoffTime);
        } catch (e) { return []; }
    }

    // Alias requirement for SocketServer
    getOldestCandle(symbol, timeframe) {
        return this.getFirstTimestamp(symbol, timeframe);
    }

    insertCandles(candles) {
        if (!candles || candles.length === 0) return;
        const symbol = candles[0].symbol;
        if (!symbol) return;

        const tf = candles[0].timeframe;
        const db = this.getSymbolDb(symbol);
        if (!db) return;

        const table = `candles_${tf}`;
        const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (time, open, high, low, close, volume, is_complete) VALUES (@time, @open, @high, @low, @close, @volume, @is_complete)`);

        const insertMany = db.transaction((rows) => {
            for (const row of rows) insert.run(row);
        });

        try {
            insertMany(candles);
        } catch (e) {
            console.error(`[DB] insertCandles Failed for ${symbol} ${tf}:`, e.message);
        }
    }

    upsertCandleBatch(symbol, timeframe, candles) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return { maxTime: 0 };

            const table = `candles_${timeframe}`;
            const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (time, open, high, low, close, volume, is_complete) VALUES (@time, @open, @high, @low, @close, @volume, 1)`);

            let maxTime = 0;
            const insertMany = db.transaction((rows) => {
                for (const row of rows) {
                    if (row.time > maxTime) maxTime = row.time;
                    insert.run({
                        time: row.time,
                        open: row.open,
                        high: row.high,
                        low: row.low,
                        close: row.close,
                        volume: row.volume
                    });
                }
            });

            insertMany(candles);
            return { maxTime };
        } catch (e) {
            console.error(`[DB] upsertCandleBatch Failed for ${symbol} ${timeframe}:`, e.message);
            return { maxTime: 0 };
        }
    }

    // --- TRADE PERSISTENCE METHODS (RESTORED) ---
    createTrade(trade) {
        try {
            const stmt = this.marketDb.prepare(`
                INSERT OR IGNORE INTO active_trades (id, symbol, direction, status, entry_price, sl, tp, volume, strategy, params, created_at, updated_at, environment)
                VALUES (@id, @symbol, @direction, @status, @entry, @sl, @tp, @volume, @strategy, @params, @created, @updated, @environment)
            `);

            stmt.run({
                id: trade.id,
                symbol: trade.symbol,
                direction: trade.direction === 'LONG' ? 1 : 0,
                status: trade.status || 'PENDING',
                entry: trade.entry?.price || 0,
                sl: trade.sl?.price || 0,
                tp: trade.tp?.price || 0,
                volume: trade.risk?.fixedVolume || 0,
                strategy: 'Manual',
                params: JSON.stringify(trade),
                created: Date.now(),
                updated: Date.now(),
                environment: trade.environment || 'test'
            });
            return true;
        } catch (e) {
            console.error("[DB] createTrade Error:", e);
            return false;
        }
    }

    // NEW: Update Status & Error Message
    updateTradeStatus(tradeId, status, message = null) {
        try {
            let paramsUpdate = "";
            let args = { id: tradeId, status: status, updated: Date.now() };

            if (message) {
                // Fetch existing params to append error
                const row = this.marketDb.prepare("SELECT params FROM active_trades WHERE id = ?").get(tradeId);
                let params = {};
                if (row && row.params) {
                    try { params = JSON.parse(row.params); } catch (e) { }
                }
                params.error = message;
                args.params = JSON.stringify(params);
                paramsUpdate = ", params = @params";
            }

            const stmt = this.marketDb.prepare(`UPDATE active_trades SET status = CASE WHEN status = 'CLOSED' THEN 'CLOSED' ELSE @status END, updated_at = @updated ${paramsUpdate} WHERE id = @id`);
            stmt.run(args);
            console.log(`[DB] Updated Trade ${tradeId} -> ${status} ${message ? '(With Error)' : ''}`);
            return true;
        } catch (e) {
            console.error(`[DB] updateTradeStatus Failed for ${tradeId}:`, e);
            return false;
        }
    }

    // --- SYNC HELPERS (DIFFING) ---
    // Task: Sync "Snapshot" from Broker with Database State for correct "Closed" detection
    syncBrokerPositions(botId, positions) {
        if (!botId || !Array.isArray(positions)) return;

        try {
            const now = Date.now();

            // 1. Get ALL "OPEN" or "SENT" Executions for this Bot in DB
            // We ignore "CLOSED", "ERROR", "REJECTED", "PENDING", "SENT" because they are settled or not yet acknowledged.
            const dbPositions = this.marketDb.prepare("SELECT * FROM broker_executions WHERE bot_id = ? AND status NOT IN ('CLOSED', 'Calculated', 'ERROR', 'REJECTED', 'PENDING', 'SENT')").all(botId);

            const incomingIds = new Set();
            positions.forEach(p => {
                // Try to resolve "id" (Magic) or "ticket"
                if (p.id) incomingIds.add(p.id.toString());
                // Note: If p.id is "manual_1234", we handle it below
            });

            // --- AGGRESSIVE DIFFING REMOVED ---
            // TRADES ARE NOW ONLY CLOSED VIA EXPLICIT EV_TRADE_CLOSED.
            // Partial Closes and missing sync periods will no longer prematurely close Active Trades.

            // 3. Update Existing (Active) Positions
            const upsert = this.marketDb.prepare(`
                UPDATE broker_executions 
                SET realized_pl = ?, 
                    unrealized_pl = ?, 
                    commission = ?, 
                    swap = ?, 
                    sl = COALESCE(?, sl), 
                    tp = COALESCE(?, tp), 
                    entry_price = COALESCE(?, entry_price), 
                    volume = COALESCE(?, volume), 
                    status = CASE WHEN ? = 'PENDING' AND status IN ('CREATED', 'PENDING') THEN 'PENDING' WHEN status IN ('CREATED', 'PENDING') THEN 'RUNNING' ELSE status END,
                    updated_at = ?
                WHERE bot_id = ? AND magic_number = ?
            `);

            const updateMaster = this.marketDb.prepare(`
                UPDATE active_trades SET updated_at = ? WHERE id = ?
            `);

            positions.forEach(p => {
                // Only update if metrics present.
                if (p.metrics) { // TradeInfo Structure
                    upsert.run(
                        p.metrics.realizedPl || 0,
                        (p.profit !== undefined ? p.profit : (p.metrics.unrealizedPl || 0)), // Ensure active profit is synced
                        (p.commission || 0) + (p.metrics.historyCommission || 0), // FIX: Sum Active + History Commission
                        (p.swap || 0) + (p.metrics.historySwap || 0),     // FIX: Sum Active + History Swap
                        p.sl !== undefined ? p.sl : null,
                        p.tp !== undefined ? p.tp : null,
                        p.open !== undefined ? p.open : null,
                        p.vol !== undefined ? p.vol : null,
                        p.customStatus || null,
                        now,
                        botId,
                        p.magic || parseInt(p.id) // Try to get numeric magic
                    );
                }
            });

        } catch (e) {
            console.error("[DB] syncBrokerPositions Error:", e);
        }
    }

    processClosedTrades(botId, positions) {
        if (!botId || !Array.isArray(positions)) return;

        try {
            const now = Date.now();

            // Select the execution row to get its internal ID and master_trade_id
            const getMasterStmt = this.marketDb.prepare(`SELECT master_trade_id, id FROM broker_executions WHERE bot_id = ? AND magic_number = ? AND status != 'CLOSED'`);

            const closeStmt = this.marketDb.prepare(`
                UPDATE broker_executions 
                SET status = 'CLOSED', 
                    realized_pl = ?, 
                    unrealized_pl = 0, 
                    commission = ?, 
                    swap = ?, 
                    close_time = ?, 
                    updated_at = ?
                WHERE id = ?
            `);

            this.marketDb.transaction(() => {
                positions.forEach(p => {
                    const magic = p.magic || parseInt(p.id) || 0;
                    console.log(`[DB] 🔍 processClosedTrades: Analyzing payload for Bot=${botId}, Magic=${magic}, Payload=`, JSON.stringify(p));

                    if (magic > 0) {
                        const row = getMasterStmt.get(botId, magic);
                        if (row) {
                            const metrics = p.metrics || {};
                            // Time from MT5 is usually in seconds (e.g. 1700000000). Convert to ms.
                            const closeTimeCasted = (p.time && p.time < 20000000000) ? (p.time * 1000) : now;
                            closeStmt.run(
                                metrics.realizedPl || p.profit || 0,
                                metrics.historyCommission || p.commission || 0,
                                metrics.historySwap || p.swap || 0,
                                closeTimeCasted,
                                now,
                                row.id
                            );
                            this.checkAggregateTradeStatus(row.master_trade_id);
                            console.log(`[DB] 📉 Explicitly CLOSED Trade: Master=${row.master_trade_id} Magic=${magic} RealizedPL=${metrics.realizedPl || p.profit}`);
                        } else {
                            console.log(`[DB] ⚠️ processClosedTrades: No active execution found for Bot=${botId}, Magic=${magic} (Status may already be CLOSED or execution never recorded).`);
                        }
                    } else {
                        console.log(`[DB] ⚠️ processClosedTrades: Invalid magic number ${magic} derived from payload ID: ${p.id}`);
                    }
                });
            })();
        } catch (e) {
            console.error("[DB] processClosedTrades Error:", e);
        }
    }

    createBrokerExecution(exec) {
        try {
            // ROBUST: Handle Missing ID and Parameter Aliasing
            const masterId = exec.masterId || exec.masterTradeId;
            const id = exec.id || `${masterId}_${exec.botId}`;
            const magic = exec.magic || (exec.magic_number ? exec.magic_number : 0);

            // 1. Ensure Column Exists (Lazy Migration)
            try {
                this.marketDb.prepare("ALTER TABLE broker_executions ADD COLUMN error_message TEXT").run();
            } catch (e) { /* Column likely exists */ }

            const stmt = this.marketDb.prepare(`
                INSERT INTO broker_executions (id, master_trade_id, bot_id, broker_id, account_id, status, error_message, magic_number, initial_entry, initial_sl, initial_tp, entry_price, sl, tp, volume, created_at, updated_at, environment)
                VALUES (@id, @masterId, @botId, @brokerId, @accountId, @status, @errorMessage, @magic, @initialEntry, @initialSl, @initialTp, @entry, @sl, @tp, @volume, @created, @updated, @environment)
                ON CONFLICT(id) DO UPDATE SET 
                    status=excluded.status, 
                    error_message=excluded.error_message, 
                    updated_at=excluded.updated_at,
                    initial_entry=COALESCE(NULLIF(excluded.initial_entry, 0), broker_executions.initial_entry),
                    initial_sl=COALESCE(NULLIF(excluded.initial_sl, 0), broker_executions.initial_sl),
                    initial_tp=COALESCE(NULLIF(excluded.initial_tp, 0), broker_executions.initial_tp),
                    entry_price=COALESCE(NULLIF(excluded.entry_price, 0), broker_executions.entry_price),
                    sl=COALESCE(NULLIF(excluded.sl, 0), broker_executions.sl),
                    tp=COALESCE(NULLIF(excluded.tp, 0), broker_executions.tp)
            `);

            // When creating, the current price is also the initial price if not defined otherwise
            const entryValue = exec.entry_price !== undefined ? exec.entry_price : (exec.entry !== undefined ? exec.entry : (exec.initial_entry || 0));
            const slValue = exec.sl !== undefined ? exec.sl : (exec.initial_sl || 0);
            const tpValue = exec.tp !== undefined ? exec.tp : (exec.initial_tp || 0);

            stmt.run({
                id: id,
                masterId: masterId,
                botId: exec.botId,
                brokerId: exec.brokerId,
                accountId: exec.accountId,
                status: exec.status || 'PENDING',
                errorMessage: exec.error_message || null,
                magic: magic,
                initialEntry: exec.initial_entry !== undefined ? exec.initial_entry : entryValue,
                initialSl: exec.initial_sl !== undefined ? exec.initial_sl : slValue,
                initialTp: exec.initial_tp !== undefined ? exec.initial_tp : tpValue,
                entry: entryValue,
                sl: slValue,
                tp: tpValue,
                volume: exec.volume || 0,
                created: Date.now(),
                updated: Date.now(),
                environment: exec.environment || 'test'
            });
            return true;
        } catch (e) {
            console.error("[DB] createBrokerExecution Error:", e);
            return false;
        }
    }

    insertBrokerExecution(exec) {
        return this.createBrokerExecution(exec); // Alias
    }

    // NEW: Robust Broker Execution Status Update (User Request: Broker-Specific Errors)
    updateBrokerExecutionStatus(botId, masterId, status, message = null) {
        try {
            // 1. Ensure Column Exists (Lazy Migration)
            try {
                this.marketDb.prepare("ALTER TABLE broker_executions ADD COLUMN error_message TEXT").run();
            } catch (e) { /* Column likely exists */ }

            // 2. Update Execution
            const stmt = this.marketDb.prepare(`
                UPDATE broker_executions
                SET status = CASE WHEN status = 'CLOSED' THEN 'CLOSED' ELSE @status END, error_message = @message, updated_at = @updated
                WHERE bot_id = @botId AND (master_trade_id = @masterId OR magic_number = CAST(@masterId AS INTEGER))
            `);

            const res = stmt.run({
                botId: botId,
                masterId: masterId,
                status: status,
                message: message,
                updated: Date.now()
            });

            if (res.changes > 0) {
                console.log(`[DB] Updated Broker Execution: Bot=${botId} -> ${status} (${message || 'No Msg'})`);

                // 3. Trigger Aggregate Status Check
                this.checkAggregateTradeStatus(masterId);
                return true;
            } else {
                console.warn(`[DB] ⚠️ Broker Execution Update Failed: No Match for Bot=${botId} Master=${masterId}`);
                // Optional: Insert placeholder if missing?
                return false;
            }
        } catch (e) {
            console.error(`[DB] updateBrokerExecutionStatus Error:`, e);
            return false;
        }
    }

    // NEW: Explicit Flag for SL_BE (User Request)
    setSLAtBE(botId, masterId, value) {
        try {
            // 1. Ensure Column Exists (Lazy Migration)
            try {
                this.marketDb.prepare("ALTER TABLE broker_executions ADD COLUMN sl_at_be INTEGER DEFAULT 0").run();
            } catch (e) { /* Column likely exists */ }

            // 2. Update Execution
            const stmt = this.marketDb.prepare(`
                UPDATE broker_executions
                SET sl_at_be = @value, updated_at = @updated
                WHERE bot_id = @botId AND (master_trade_id = @masterId OR magic_number = CAST(@masterId AS INTEGER))
            `);

            const res = stmt.run({
                botId: botId,
                masterId: masterId,
                value: value ? 1 : 0,
                updated: Date.now()
            });

            if (res.changes > 0) {
                console.log(`[DB] Updated SL_at_BE flag: Bot=${botId} Master=${masterId} -> ${value ? 'TRUE' : 'FALSE'}`);

                // NOTIFY FRONTEND INSTANTLY
                try {
                    const orchestrator = require('./SystemOrchestrator');
                    if (orchestrator.socketServer && orchestrator.socketServer.io) {
                        orchestrator.socketServer.io.emit('trades_update_signal', { botId });
                    }
                } catch (e) { /* ignore circular or missing socket issues */ }

                return true;
            } else {
                console.warn(`[DB] ⚠️ SL_at_BE Update Failed: No Match for Bot=${botId} Master=${masterId}`);
                return false;
            }
        } catch (e) {
            console.error(`[DB] setSLAtBE Error:`, e);
            return false;
        }
    }

    // Task: Check if ALL executions are terminal -> Close Master Trade
    checkAggregateTradeStatus(masterId) {
        try {
            const rows = this.marketDb.prepare("SELECT status FROM broker_executions WHERE master_trade_id = ?").all(masterId);
            if (rows.length === 0) return;

            // Definition of Terminal States
            const terminalStates = new Set(['CLOSED', 'OFFLINE', 'ERROR', 'REJECTED', 'CANCELED']);
            const allTerminal = rows.every(r => terminalStates.has(r.status));

            // NEW: If any execution is RUNNING (or actively executing), keep the master trade RUNNING
            const anyRunning = rows.some(r => r.status === 'RUNNING');
            const anyCreated = rows.some(r => r.status === 'CREATED' || r.status === 'PENDING');

            if (anyRunning) {
                this.marketDb.prepare("UPDATE active_trades SET status = 'RUNNING', updated_at = ? WHERE id = ? AND status != 'RUNNING'").run(Date.now(), masterId);
            } else if (anyCreated && !allTerminal) {
                this.marketDb.prepare("UPDATE active_trades SET status = 'CREATED', updated_at = ? WHERE id = ? AND status != 'CREATED'").run(Date.now(), masterId);
            } else if (allTerminal) {
                let finalStatus = 'CLOSED'; // Default (if at least one opened and closed)

                const hasClosed = rows.some(r => r.status === 'CLOSED');
                const hasCanceled = rows.some(r => r.status === 'CANCELED');

                if (!hasClosed) {
                    if (hasCanceled) {
                        finalStatus = 'CANCELED';
                    } else if (rows.every(r => r.status === 'ERROR' || r.status === 'REJECTED')) {
                        finalStatus = 'ERROR';
                    } else if (rows.every(r => r.status === 'OFFLINE' || r.status === 'BLOCKED_DATAFEED')) {
                        finalStatus = 'OFFLINE';
                    } else {
                        // Mix of Offline and Errors
                        finalStatus = 'ERROR';
                    }
                }

                this.marketDb.prepare("UPDATE active_trades SET status = ?, updated_at = ? WHERE id = ? AND status != ?").run(finalStatus, Date.now(), masterId, finalStatus);
                console.log(`[DB] 🏁 Auto-Updated Master Trade ${masterId} to ${finalStatus} (All ${rows.length} executions are terminal)`);
            }
        } catch (e) {
            console.error("[DB] checkAggregateTradeStatus Error:", e);
        }
    }

    updateBrokerExecutionMetrics(tradeId, botId, metrics) {
        try {
            // ROBUST UPDATE: Protects Immutable Fields (OpenTime, Entry, SL, TP)
            // Only updates them if they are currently 0 or NULL in the DB.
            if (tradeId.includes('1255')) {
                console.log(`[DB] DEBUG 1255 Update: ID=${tradeId} Bot=${botId} Magic=${metrics.magic} Status=${metrics.status}`);
            }

            const stmt = this.marketDb.prepare(`
                UPDATE broker_executions 
                SET 
                    realized_pl = @realizedPl,
                    commission = @commission,
                    swap = @swap,
                    status = CASE WHEN status = 'CLOSED' THEN 'CLOSED' ELSE @status END,
                    updated_at = @updated,
                    
                    -- LATCHING LOGIC: Only write if empty
                    entry_price = CASE WHEN entry_price IS NULL OR entry_price = 0 THEN @entryPrice ELSE entry_price END,
                    sl = CASE WHEN sl IS NULL OR sl = 0 THEN @sl ELSE sl END,
                    tp = CASE WHEN tp IS NULL OR tp = 0 THEN @tp ELSE tp END,
                    volume = CASE WHEN volume IS NULL OR volume = 0 THEN @volume ELSE volume END,
                    open_time = CASE WHEN open_time IS NULL OR open_time = 0 THEN @openTime ELSE open_time END,
                    
                    close_time = @closeTime,
                    unrealized_pl = @unrealizedPl
                WHERE id = @id OR (bot_id = @botId AND magic_number = CAST(@id AS INTEGER)) 
            `);

            const res = stmt.run({
                id: tradeId,
                botId: botId.trim(), // Force Trim
                realizedPl: metrics.realizedPl || 0,
                commission: metrics.commission || 0,
                swap: metrics.swap || 0,
                status: metrics.status,
                updated: Date.now(),
                entryPrice: metrics.entryPrice || 0,
                sl: metrics.sl || 0,
                tp: metrics.tp || 0,
                volume: metrics.volume || 0,
                openTime: metrics.openTime || 0,
                closeTime: metrics.closeTime || 0,
                unrealizedPl: metrics.unrealizedPl || 0
            });

            if (res.changes === 0) {
                console.warn(`[DB] ⚠️ NO MATCH for Update: Trade=${tradeId} Bot='${botId}' (Trimmed='${botId.trim()}')`);
                if (tradeId.includes('1255')) {
                    // Deep forensic
                    const existing = this.marketDb.prepare("SELECT * FROM broker_executions WHERE magic_number = 1255").all();
                    console.log("[DB] Forensic 1255 Dump:", JSON.stringify(existing));
                }
            }

            // USER REQUEST: Check if Active Trade should be closed
            if (metrics.status === 'CLOSED' || metrics.status === 'OFFLINE') {
                const openCount = this.marketDb.prepare(`
                    SELECT count(*) as count 
                    FROM broker_executions 
                    WHERE master_trade_id = ? AND status NOT IN ('CLOSED', 'OFFLINE')
                `).get(tradeId).count;

                if (openCount === 0) {
                    this.marketDb.prepare(`
                        UPDATE active_trades 
                        SET status = 'CLOSED', updated_at = ? 
                        WHERE id = ? AND status != 'CLOSED'
                    `).run(Date.now(), tradeId);
                    // console.log(`[DB] Auto-Closed Master Trade ${tradeId} (All executions closed/offline)`);
                }
            }
            return true;
        } catch (e) {
            console.error("[DB] updateBrokerExecutionMetrics Error:", e);
            return false;
        }
    }



    updateTradePL(tradeId, realized, unrealized) {
        try {
            // We mostly update broker_executions for granular tracking, 
            // but active_trades might need an aggregate? 
            // For now, let's assume this updates the master trade status if needed.
            // Placeholder to fail safely if TradeWorker calls it.
            return true;
        } catch (e) { return false; }
    }

    getSessions(symbol, from, to, configHash) {
        try {
            const db = this.getSymbolDb(symbol);
            if (!db) return [];

            // Ensure table exists
            db.exec(`CREATE TABLE IF NOT EXISTS session_defs (
                session_type TEXT,
                start_time INTEGER,
                end_time INTEGER,
                high REAL,
                low REAL,
                open REAL,
                mitigated_at_high INTEGER,
                mitigated_at_low INTEGER,
                range_pips REAL,
                config_hash TEXT,
                PRIMARY KEY (session_type, start_time)
            )`);

            return db.prepare(`SELECT * FROM session_defs WHERE start_time >= ? AND start_time <= ? AND config_hash = ?`).all(from, to, configHash);
        } catch (e) {
            console.error(`[DB] getSessions Error for ${symbol}:`, e.message);
            return [];
        }
    }

    insertSessions(sessions) {
        if (!sessions || sessions.length === 0) return;

        // Group by Symbol (SessionEngine sends array, but typically for 1 symbol)
        const bySymbol = {};
        for (const s of sessions) {
            if (!bySymbol[s.symbol]) bySymbol[s.symbol] = [];
            bySymbol[s.symbol].push(s);
        }

        for (const [symbol, list] of Object.entries(bySymbol)) {
            try {
                const db = this.getSymbolDb(symbol);
                if (!db) continue;

                // Ensure table
                db.exec(`CREATE TABLE IF NOT EXISTS session_defs (
                    session_type TEXT,
                    start_time INTEGER,
                    end_time INTEGER,
                    high REAL,
                    low REAL,
                    open REAL,
                    mitigated_at_high INTEGER,
                    mitigated_at_low INTEGER,
                    range_pips REAL,
                    config_hash TEXT,
                    PRIMARY KEY (session_type, start_time)
                )`);

                const insert = db.prepare(`INSERT OR REPLACE INTO session_defs 
                    (session_type, start_time, end_time, high, low, open, mitigated_at_high, mitigated_at_low, range_pips, config_hash)
                    VALUES (@session_type, @start_time, @end_time, @high, @low, @open, @mitigated_at_high, @mitigated_at_low, @range_pips, @config_hash)`);

                const insertMany = db.transaction((rows) => {
                    for (const row of rows) insert.run(row);
                });

                insertMany(list);
            } catch (e) {
                console.error(`[DB] insertSessions Failed for ${symbol}:`, e.message);
            }
        }
    }
    saveBrokerSymbols(brokerId, symbols) {
        try {
            const stmt = this.marketDb.prepare(`
                INSERT OR REPLACE INTO broker_symbols (broker_id, symbols, updated_at) 
                VALUES (@brokerId, @symbols, @updatedAt)
            `);
            stmt.run({
                brokerId: brokerId,
                symbols: JSON.stringify(symbols),
                updatedAt: Date.now()
            });
            console.log(`[DB] Saved ${symbols.length} symbols for Broker ${brokerId}`);
            return true;
        } catch (e) {
            console.error(`[DB] saveBrokerSymbols Failed for ${brokerId}:`, e.message);
            return false;
        }
    }
    getBrokerSymbols(brokerId) {
        try {
            if (brokerId) {
                const row = this.marketDb.prepare("SELECT symbols FROM broker_symbols WHERE broker_id = ?").get(brokerId);
                return row ? JSON.parse(row.symbols) : [];
            } else {
                const rows = this.marketDb.prepare("SELECT * FROM broker_symbols").all();
                let all = [];
                rows.forEach(r => {
                    const syms = JSON.parse(r.symbols || '[]');
                    // Enrich with BrokerID for UI grouping?
                    // For now, flatten or return map? 
                    // Let's return flat list with source attached
                    syms.forEach(s => { s.brokerId = r.broker_id; all.push(s); });
                });
                return all;
            }
        } catch (e) {
            console.error(`[DB] getBrokerSymbols Failed:`, e.message);
            return [];
        }
    }
}

module.exports = new DatabaseService();
