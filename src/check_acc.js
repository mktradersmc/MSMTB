const db = require('better-sqlite3')('market-data-core/db/market.db');
const accounts = db.prepare('SELECT id, platform, timezone FROM accounts WHERE platform="NT8"').all();
console.table(accounts);
