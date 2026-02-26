const db = require('better-sqlite3')('market_data.db');
const accounts = db.prepare('SELECT id, platform, timezone FROM accounts WHERE platform=\'NT8\'').all();
console.table(accounts);
