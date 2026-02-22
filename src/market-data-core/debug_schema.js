const Database = require('better-sqlite3');
const path = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\market-data-core\\market_data.db'; // Adjust path if needed
const db = new Database(path, { readonly: true });

console.log("--- Schema for broker_symbols ---");
try {
    const info = db.pragma("table_info(broker_symbols)");
    console.table(info);
} catch (e) {
    console.error(e);
}

console.log("\n--- SQL for broker_symbols ---");
try {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'broker_symbols'").get();
    console.log(row ? row.sql : "Table not found");
} catch (e) {
    console.error(e);
}
db.close();
