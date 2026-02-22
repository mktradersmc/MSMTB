const Database = require('better-sqlite3');
const path = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\market-data-core\\market_data.db';
const db = new Database(path, { readonly: true });

console.log("--- Triggers ---");
try {
    const rows = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger'").all();
    if (rows.length === 0) console.log("No triggers found.");
    rows.forEach(r => {
        console.log(`Trigger: ${r.name} on ${r.tbl_name}`);
        console.log(r.sql);
        console.log("---------------------------------------------------");
    });
} catch (e) {
    console.error(e);
}
db.close();
