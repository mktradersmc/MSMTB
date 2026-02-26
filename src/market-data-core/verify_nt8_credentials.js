const dbFilePath = 'c:/Users/Michael/IdeaProjects/MSMTB/src/market-data-core/market_data.db';
const Database = require('better-sqlite3');
const db = new Database(dbFilePath);

const apex = db.prepare("SELECT id, bot_id, login, password FROM accounts WHERE platform = 'NT8'").all();
console.log(JSON.stringify(apex, null, 2));
