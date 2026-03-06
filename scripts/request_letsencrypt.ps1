param (
    [Parameter(Mandatory = $true)]
    [string]$Domain,
    [Parameter(Mandatory = $true)]
    [string]$Email
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$OutputLog = Join-Path $ProjectRoot "logs\ssl-progress.json"
$TranscriptLog = Join-Path $ProjectRoot "logs\ssl-transcript.log"

if (-not (Test-Path (Join-Path $ProjectRoot "logs"))) {
    New-Item -ItemType Directory -Path (Join-Path $ProjectRoot "logs") | Out-Null
}

Start-Transcript -Path $TranscriptLog -Force

function Write-Progress {
    param([int]$Step, [string]$Text, [int]$Total = 6)
    $data = @{ step = $Step; text = $Text; total = $Total }
    $json = $data | ConvertTo-Json -Compress
    # Write UTF-8 encoding specifically without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding($False)
    [System.IO.File]::WriteAllText($OutputLog, $json, $utf8NoBom)
}

Write-Progress 1 "Prüfe Voraussetzungen für win-acme..."

$UtilsPath = Join-Path $ProjectRoot "utils"
$WacsDir = Join-Path $UtilsPath "win-acme"
$WacsExe = Join-Path $WacsDir "wacs.exe"
$CertsDir = Join-Path $ProjectRoot "certs"

if (-not (Test-Path -Path $UtilsPath)) {
    New-Item -ItemType Directory -Path $UtilsPath | Out-Null
}

if (-not (Test-Path -Path $WacsExe)) {
    Write-Progress 2 "Lade win-acme herunter..."
    $WacsZip = Join-Path $UtilsPath "win-acme.zip"
    Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/download/v2.2.8.1635/win-acme.v2.2.8.1635.x64.pluggable.zip" -OutFile $WacsZip
    
    Write-Progress 3 "Entpacke win-acme..."
    Expand-Archive -Path $WacsZip -DestinationPath $WacsDir -Force
    Remove-Item $WacsZip
}
else {
    Write-Progress 3 "win-acme ist bereits installiert."
}

Write-Progress 4 "Konfiguriere temporäre Firewall-Freigabe für Port 80..."
$FirewallRuleName = "AwesomeCockpit_LetsEncrypt_Temp"
$RuleExists = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue

if (-not $RuleExists) {
    New-NetFirewallRule -DisplayName $FirewallRuleName -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow | Out-Null
}

Write-Progress 5 "Starte Zertifikatsgenerierung für $Domain ..."

$WacsArgs = @(
    "--source", "manual",
    "--host", $Domain,
    "--validation", "selfhosting",
    "--store", "pemfiles,pfxfile",
    "--pemfilespath", $CertsDir,
    "--pfxfilepath", $CertsDir,
    "--pfxpassword", "cockpit",
    "--installation", "none",
    "--accepttos",
    "--emailaddress", $Email,
    "--force",
    "--nocache"
)

try {
    $process = Start-Process -FilePath $WacsExe -ArgumentList $WacsArgs -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0) {
        throw "win-acme beendet mit Fehlercode $($process.ExitCode)"
    }
}
catch {
    Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    Write-Progress -1 "Zertifikatsgenerierung fehlgeschlagen: $_"
    exit 1
}

Write-Progress 6 "Räume Firewall auf..."
Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue

Write-Progress 5 "Zertifikate erfolgreich generiert. Schließe Setup ab..."

# Rename the generated files to standard server.crt/server.key/server.pfx
$PfxFiles = @(Get-ChildItem -Path $CertsDir -Filter "*$Domain*.pfx" -Exclude "server.pfx")
if ($PfxFiles.Count -gt 0) {
    Copy-Item -Path $PfxFiles[0].FullName -Destination (Join-Path $CertsDir "server.pfx") -Force
    Remove-Item $PfxFiles[0].FullName -Force
}

$CrtFiles = @(Get-ChildItem -Path $CertsDir -Filter "*$Domain*-crt.pem")
if ($CrtFiles.Count -gt 0) {
    Copy-Item -Path $CrtFiles[0].FullName -Destination (Join-Path $CertsDir "server.crt") -Force
    Remove-Item $CrtFiles[0].FullName -Force
}

$KeyFiles = @(Get-ChildItem -Path $CertsDir -Filter "*$Domain*-key.pem")
if ($KeyFiles.Count -gt 0) {
    Copy-Item -Path $KeyFiles[0].FullName -Destination (Join-Path $CertsDir "server.key") -Force
    Remove-Item $KeyFiles[0].FullName -Force
}

$ChainFiles = @(Get-ChildItem -Path $CertsDir -Filter "*$Domain*-chain.pem")
if ($ChainFiles.Count -gt 0) { Remove-Item $ChainFiles[0].FullName -Force }

Stop-Transcript
Write-Progress 7 "Zertifikat aktiv. Starte Systemkomponenten neu..."
Start-Sleep -Seconds 2
pm2 stop all
Start-Sleep -Seconds 2
pm2 start all
