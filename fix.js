const fs = require('fs');
const p = 'c:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\trading-cockpit\\src\\app\\api\\accounts\\[id]\\action\\route.ts';
let c = fs.readFileSync(p, 'utf8');
const target = "                const botId = `${broker.shorthand.replace(/\\s+/g, '')}_${account.login}`;\n                instancePath = path.join(root, instanceName);";
const replacement = "                let instanceName = `MT_${broker.shorthand.replace(/\\s+/g, '')}_${account.login}`;\n                if (account.accountType === 'DATAFEED' || (account as any).isDatafeed) {\n                    instanceName += '_DATAFEED';\n                }\n                instancePath = path.join(root, instanceName);";

if (c.includes(target)) {
    fs.writeFileSync(p, c.replace(target, replacement));
    console.log("Success Unix");
} else if (c.includes(target.replace(/\n/g, '\r\n'))) {
    fs.writeFileSync(p, c.replace(target.replace(/\n/g, '\r\n'), replacement.replace(/\n/g, '\r\n')));
    console.log("Success Windows");
} else {
    console.log("Failed to find target");
}
