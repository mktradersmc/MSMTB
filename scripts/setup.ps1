param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$SourceDir = "$env:TEMP\_github_msmtb",
    [string]$Password = "",
    [string]$GithubPat = ""
)

if ([string]::IsNullOrWhiteSpace($Password)) {
    $Password = Read-Host "Bitte gib ein Passwort fuer das Trading Cockpit Backend ein"
    if ([string]::IsNullOrWhiteSpace($Password)) {
        Write-Host "Fehler: Passwort darf nicht leer sein. Abbruch." -ForegroundColor Red
        Pause; exit 1
    }
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host " Hardware Profil auswaehlen (Compiler-Setup)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "[1] Modern Hardware (Schnellerer SWC Compiler)"
Write-Host "[2] Legacy / Virtuell (Babel Compiler, z.B. fuer Ceph/KVM ohne POPCNT)"
$HardwareChoice = ""
while ($HardwareChoice -notmatch "^[12]$") {
    $HardwareChoice = Read-Host "Bitte 1 oder 2 eingeben"
}
$IsLegacyHardware = ($HardwareChoice -eq '2')

# 0. Logging Initialisieren (Append-Mode, führt das install.log fort)
$LogDir = Join-Path $TargetDir "logs"
$LogFile = Join-Path $LogDir "install.log"
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [SETUP] $Message"
    Add-Content -Path $LogFile -Value $LogMsg
    Write-Host $Message -ForegroundColor $Color
}

Write-Log "=========================================" "Cyan"
Write-Log "   Starte Applikations-Setup...          " "Cyan"
Write-Log "=========================================" "Cyan"

# 1. System-Abhängigkeiten installieren (Node.js)
Write-Log "`n[1/6] System-Abhaengigkeiten pruefen (Node.js)..." "Cyan"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Log "  Node.js nicht gefunden. Installiere via winget (LTS)..." "Yellow"
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements | Out-File -Append -FilePath $LogFile
    $env:Path += ";C:\Program Files\nodejs"
} else {
    Write-Log "  Node.js ist bereits installiert ($(node -v))." "Green"
}


# 2. Kopieren der Komponenten ins Root-Verzeichnis
Write-Log "`n[2/6] Kopiere Komponenten ins Root-Verzeichnis..." "Cyan"

$RootMarketData = Join-Path $SourceDir "src\market-data-core"
$RootTradingCockpit = Join-Path $SourceDir "src\trading-cockpit"
$RootScripts = Join-Path $SourceDir "scripts"
$RootMetaTraderMaster = Join-Path $SourceDir "ressources\metatrader\master"

$ComponentsDir = Join-Path $TargetDir "components"
if (-not (Test-Path $ComponentsDir)) { New-Item -ItemType Directory -Path $ComponentsDir -Force | Out-Null }

if (Test-Path $RootMarketData) { Copy-Item -Path $RootMarketData -Destination $ComponentsDir -Recurse -Force }
if (Test-Path $RootTradingCockpit) { Copy-Item -Path $RootTradingCockpit -Destination $ComponentsDir -Recurse -Force }
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootMetaTraderMaster) { 
    $MetaDist = Join-Path $ComponentsDir "metatrader"
    if (-not (Test-Path $MetaDist)) { New-Item -ItemType Directory -Path $MetaDist -Force | Out-Null }
    Copy-Item -Path $RootMetaTraderMaster -Destination $MetaDist -Recurse -Force 

    $MasterDist = Join-Path $MetaDist "master"
    $ZipPath = Join-Path $MasterDist "terminal64.zip"
    if (Test-Path $ZipPath) {
        Write-Log "  Entpacke terminal64.zip in master..." "Cyan"
        Expand-Archive -Path $ZipPath -DestinationPath $MasterDist -Force
    }
}


# 3. .env für Backend erstellen und system.json vorbereiten
Write-Log "`n[3/6] Backend Konfiguration (.env und system.json) erstellen..." "Cyan"
$BackendDir = Join-Path $ComponentsDir "market-data-core"
$FrontendDir = Join-Path $ComponentsDir "trading-cockpit"

$EnvContent = @"
# Generiert durch install.ps1 / setup.ps1
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$Password
PORT=3005
NODE_ENV=production
"@
Set-Content -Path (Join-Path $BackendDir ".env") -Value $EnvContent
Write-Log "  .env erfolgreich geschrieben (Admin-User: admin)." "Green"

$SystemJsonPath = Join-Path $BackendDir "data\system.json"
if (-not (Test-Path (Split-Path $SystemJsonPath))) { New-Item -ItemType Directory -Path (Split-Path $SystemJsonPath) | Out-Null }
if (Test-Path $SystemJsonPath) {
    $sysJson = Get-Content $SystemJsonPath | ConvertFrom-Json
} else {
    $sysJson = @{}
}
$sysJson | Add-Member -Type NoteProperty -Name "projectRoot" -Value $TargetDir -Force
$sysJson | Add-Member -Type NoteProperty -Name "systemUsername" -Value "admin" -Force
$sysJson | Add-Member -Type NoteProperty -Name "systemPassword" -Value $Password -Force
$sysJson | Add-Member -Type NoteProperty -Name "marketDbPath" -Value "db/core.db" -Force
$sysJson | Add-Member -Type NoteProperty -Name "tempGithubPat" -Value $GithubPat -Force
$sysJson | Add-Member -Type NoteProperty -Name "compileMode" -Value $HardwareChoice -Force
$sysJson | ConvertTo-Json -Depth 5 | Set-Content -Path $SystemJsonPath
Write-Log "  system.json für den Live-Betrieb (core.db) eingerichtet." "Green"

# 4. SSL Zertifikat generieren
Write-Log "`n[4/6] SSL Zertifikat generieren..." "Cyan"
$SslScriptPath = Join-Path $TargetDir "scripts\generate-ssl.ps1"
if (Test-Path $SslScriptPath) {
    & $SslScriptPath -DomainName "localhost", "127.0.0.1" -Password $Password *>> $LogFile
    Write-Log "  Zertifikatsgenerierung abgeschlossen (Siehe Log)." "Green"
} else {
    Write-Log "  WARNUNG: Skript 'generate-ssl.ps1' nicht gefunden ($SslScriptPath)." "Yellow"
}

# 4.5 Datenbank Provisionieren
Write-Log "`n[4.5/6] Initiale Datenbank bereitstellen..." "Cyan"
$InitDbPath = Join-Path $BackendDir "init\core.db"
$LiveDbDir = Join-Path $BackendDir "db"
$LiveDbPath = Join-Path $LiveDbDir "core.db"

if (Test-Path $InitDbPath) {
    if (-not (Test-Path $LiveDbDir)) { New-Item -ItemType Directory -Path $LiveDbDir -Force | Out-Null }
    if (-not (Test-Path $LiveDbPath)) {
        Copy-Item -Path $InitDbPath -Destination $LiveDbPath -Force
        Write-Log "  Datenbank 'init/core.db' erfolgreich nach 'db/core.db' kopiert." "Green"
    } else {
        Write-Log "  Datenbank 'db/core.db' existiert bereits. Überspringe Kopiervorgang." "Gray"
    }
} else {
    Write-Log "  WARNUNG: 'init/core.db' wurde nicht gefunden!" "Yellow"
}


# 5. NPM Dependencies & Build
Write-Log "`n[5/6] NPM Pakete installieren und Frontend bauen (Das kann dauern)..." "Cyan"

$FrontendEnvPath = Join-Path $FrontendDir ".env.production"
$BabelRcPath = Join-Path $FrontendDir ".babelrc"

if ($IsLegacyHardware) {
    Write-Log "  -> Konfiguriere Legacy/Babel Compiler (Kompatibilitaetsmodus)..." "Yellow"
    Set-Content -Path $FrontendEnvPath -Value "NEXT_COMPILER_MODE=legacy" -Force
    $BabelRcContent = @'
{
  "presets": ["next/babel"]
}
'@
    Set-Content -Path $BabelRcPath -Value $BabelRcContent -Force
} else {
    Write-Log "  -> Konfiguriere Modern/SWC Compiler (Performance-Modus)..." "Green"
    Set-Content -Path $FrontendEnvPath -Value "NEXT_COMPILER_MODE=modern" -Force
    if (Test-Path $BabelRcPath) { Remove-Item -Path $BabelRcPath -Force }
}

Write-Log "  -> Installiere Backend Dependencies..." "Cyan"
Push-Location $BackendDir
npm install 2>&1 | Out-File -Append -FilePath $LogFile
npm rebuild 2>&1 | Out-File -Append -FilePath $LogFile
Pop-Location

Write-Log "  -> Installiere Frontend Dependencies..." "Cyan"
Push-Location $FrontendDir
npm install 2>&1 | Out-File -Append -FilePath $LogFile
npm rebuild 2>&1 | Out-File -Append -FilePath $LogFile

Write-Log "  -> Kompiliere Next.js Frontend..." "Cyan"
npm run build 2>&1 | Out-File -Append -FilePath $LogFile
Pop-Location


# 6. Firewall & PM2
Write-Log "`n[6/6] Firewall-Regeln & PM2 Windows-Dienst..." "Cyan"
New-NetFirewallRule -DisplayName "Awesome-Cockpit-Web" -Direction Inbound -LocalPort 80,443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "Awesome-Cockpit-API" -Direction Inbound -LocalPort 3005 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Log "  Firewall-Regeln erfolgreich hinzugefügt." "Green"

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Log "  Installiere PM2 global..." "Yellow"
    npm install -g pm2 2>&1 | Out-File -Append -FilePath $LogFile
    $env:Path += ";$env:APPDATA\npm"
}

# Log-Verzeichnis erstellen
$AppLogDir = Join-Path $TargetDir "logs"
if (-not (Test-Path $AppLogDir)) { New-Item -ItemType Directory -Path $AppLogDir | Out-Null }

Write-Log "  Bereite isolierte PM2-Umgebung vor (Bypass Windows EPERM)..." "Yellow"
$CustomPm2Home = Join-Path $TargetDir ".pm2-home"
[Environment]::SetEnvironmentVariable("PM2_HOME", $CustomPm2Home, "Machine")
$env:PM2_HOME = $CustomPm2Home

Write-Log "  Starte Backend in PM2..." "Cyan"
Push-Location $BackendDir
$BackendLog = Join-Path $AppLogDir "awesome-backend.log"
pm2 start index.js --name "awesome-backend" --log $BackendLog --time *>> $LogFile
Pop-Location

Write-Log "  Starte Frontend in PM2 (node server.js)..." "Cyan"
Push-Location $FrontendDir
$FrontendLog = Join-Path $AppLogDir "awesome-frontend.log"
pm2 start server.js --name "awesome-frontend" --log $FrontendLog --time *>> $LogFile
Pop-Location

pm2 save *>> $LogFile

Write-Log "  Richte PM2-Autostart für den aktuellen Benutzer ein..." "Cyan"
npm install -g pm2-windows-startup 2>&1 | Out-File -Append -FilePath $LogFile
pm2-startup install *>> $LogFile
pm2 save *>> $LogFile
Write-Log "`n=========================================" "Green"
Write-Log "   SETUP ERFOLGREICH ABGESCHLOSSEN       " "Green"
Write-Log "=========================================" "Green"
Write-Log "Cockpit User: admin" "Yellow"
Write-Log "Das Setup-Log liegt unter: $LogFile" "Gray"
Write-Log "Bitte logge dich am Server ab und wieder an, oder starte PowerShell neu." "Yellow"

Write-Host "`nDruecke eine beliebige Taste, um dieses Fenster zu schliessen..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
