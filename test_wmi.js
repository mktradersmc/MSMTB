const { exec } = require('child_process');

const psCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='terminal64.exe'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress"`;

exec(psCmd, { timeout: 3000 }, (error, stdout) => {
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("RAW STDOUT", stdout.trim());
    try {
        const raw = JSON.parse(stdout.trim());
        const processes = Array.isArray(raw) ? raw : [raw];
        const activeMap = new Map();

        for (const p of processes) {
            if (!p.ProcessId || !p.CommandLine) continue;
            console.log("CMD:", p.CommandLine);
            const cmdLine = p.CommandLine.toString();

            // Regex from process.ts
            const match = cmdLine.match(/([^\\]+)\\terminal64\.exe/i);
            if (match && match[1]) {
                activeMap.set(match[1], parseInt(p.ProcessId, 10));
                console.log("MATCH:", match[1], "->", p.ProcessId);
            } else {
                console.log("NO MATCH");
            }
        }

        // Output for SocketServer check too
        const instanceFolder = "MT_ICMarkets_82392_DATAFEED";
        console.log("Can get instanceFolder?", activeMap.get(instanceFolder));

    } catch (e) { console.error(e); }
});
