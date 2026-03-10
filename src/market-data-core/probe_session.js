const dbPath = 'c:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\market-data-core\\market_data.db';
const Database = require('better-sqlite3');
const db = new Database(dbPath);

console.log("Checking tables in market_data.db:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

if (tables.some(t => t.name === 'backtest_trades')) {
    console.log("\\nSchema for backtest_trades:");
    const schema = db.prepare("PRAGMA table_info(backtest_trades)").all();
    console.log(schema);
} else {
    console.log("\\nbacktest_trades table DOES NOT EXIST!");
}
