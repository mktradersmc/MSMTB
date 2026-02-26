const Database = require('better-sqlite3');
const config = require('./src/config.js');
const db = new Database(config.DB_MARKET_PATH);

db.prepare(`UPDATE brokers SET shorthand = substr(name, 1, 2) WHERE shorthand IS NULL`).run();
db.prepare(`UPDATE brokers SET servers = '[]' WHERE servers IS NULL`).run();
db.prepare(`UPDATE brokers SET symbol_mappings = '{}' WHERE symbol_mappings IS NULL`).run();
db.prepare(`UPDATE brokers SET default_symbol = '' WHERE default_symbol IS NULL`).run();

console.log("Database patched successfully.");
