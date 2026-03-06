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
$PfxFiles = @(Get-ChildItem -Path $CertsDir -Filter "*.pfx" | Where-Object { $_.Name -ne "server.pfx" })
if ($PfxFiles.Count -gt 0) {
    $NewestPfx = $PfxFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Copy-Item -Path $NewestPfx.FullName -Destination (Join-Path $CertsDir "server.pfx") -Force
    $PfxFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
}

$CrtFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-crt.pem")
if ($CrtFiles.Count -gt 0) {
    $NewestCrt = $CrtFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Copy-Item -Path $NewestCrt.FullName -Destination (Join-Path $CertsDir "server.crt") -Force
    $CrtFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
}

$KeyFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-key.pem")
if ($KeyFiles.Count -gt 0) {
    $NewestKey = $KeyFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Copy-Item -Path $NewestKey.FullName -Destination (Join-Path $CertsDir "server.key") -Force
    $KeyFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
}

$ChainFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-chain.pem")
if ($ChainFiles.Count -gt 0) { 
    $ChainFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue } 
}

# Auto-Enable SSL in configuration
if (Test-Path $SystemConfigPath) {
    try {
        $ConfigData = Get-Content -Path $SystemConfigPath -Raw | ConvertFrom-Json
        if ($null -eq $ConfigData.backend) {
            $ConfigData | Add-Member -MemberType NoteProperty -Name "backend" -Value @{}
        }
        $ConfigData.backend.useSSL = $true
        $ConfigData | ConvertTo-Json -Depth 10 | Set-Content -Path $SystemConfigPath -Encoding UTF8
        Write-Progress 6 "Systemkonfiguration auf SSL umgeschaltet."
    }
    catch {
        Write-Warning "Konnte system.json nicht automatisch auf SSL umstellen."
    }
}

Stop-Transcript
Write-Progress 7 "Zertifikat aktiv. Starte Systemkomponenten neu..."
Start-Sleep -Seconds 2
pm2 stop all
Start-Sleep -Seconds 2
pm2 start all
