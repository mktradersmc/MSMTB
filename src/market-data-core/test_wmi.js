const { exec } = require('child_process');

const psCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='terminal64.exe' OR Name='NinjaTrader.exe'\\" | Select-Object Name, ProcessId, CommandLine | ConvertTo-Json -Compress"`;

exec(psCmd, { timeout: 1500 }, (err, stdout) => {
    console.log("ERR:", err);
    console.log("STDOUT:", stdout);
});
