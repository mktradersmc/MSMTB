param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$RepoUrl = "https://github.com/mktradersmc/MSMTB.git",  # MUSS VOM NUTZER ANGEPASST WERDEN
    [string]$Branch = "main"
)

# 0. Logging Initialisieren
$LogFile = Join-Path $TargetDir "install.log"
if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] $Message"
    Add-Content -Path $LogFile -Value $LogMsg
    Write-Host $Message -ForegroundColor $Color
}

Write-Log "=========================================" "Cyan"
Write-Log "   Awesome Cockpit Plattform Installer   " "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log "Logdatei: $LogFile" "Gray"

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Log "Das Skript benoetigt Administratorrechte. Fordere UAC an..." "Yellow"
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# 2. Interaktive Abfragen (PAT & Cockpit Credentials)
Write-Log "`n[1/8] Konfiguration abfragen..." "Cyan"

$GithubPAT = Read-Host "Bitte gib deinen GitHub Personal Access Token (PAT) ein (fuer private Repos)"
if ([string]::IsNullOrWhiteSpace($GithubPAT)) {
    Write-Log "Kein PAT eingegeben. Abbruch." "Red"
    Pause; exit
}

$CockpitUser = Read-Host "Bitte gib einen Benutzernamen fuer das Trading Cockpit Backend ein"
if ([string]::IsNullOrWhiteSpace($CockpitUser)) { $CockpitUser = "admin" }

$CockpitPass = Read-Host "Bitte gib ein Passwort fuer das Trading Cockpit Backend ein"
if ([string]::IsNullOrWhiteSpace($CockpitPass)) {
    Write-Log "Passwort darf nicht leer sein. Abbruch." "Red"
    Pause; exit
}

# 3. System-Abhängigkeiten installieren (Node.js & Git)
Write-Log "`n[2/8] System-Abhaengigkeiten pruefen (Git, Node.js)..." "Cyan"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Log "  Git nicht gefunden. Installiere via winget..." "Yellow"
    winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements | Out-File -Append -FilePath $LogFile
    $env:Path += ";C:\Program Files\Git\cmd"
} else {
    Write-Log "  Git ist bereits installiert." "Green"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Log "  Node.js nicht gefunden. Installiere via winget (LTS)..." "Yellow"
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements | Out-File -Append -FilePath $LogFile
    $env:Path += ";C:\Program Files\nodejs"
} else {
    Write-Log "  Node.js ist bereits installiert ($(node -v))." "Green"
}


# 4. Klonen des Repositories in temporären / Github Ordner
Write-Log "`n[3/8] Quellcode herunterladen..." "Cyan"

$AuthRepoUrl = $RepoUrl -replace "https://", "https://$GithubPAT@"
$GitTarget = Join-Path $TargetDir "_github"

if (Test-Path $GitTarget) {
    Write-Log "  Lösche altes _github Verzeichnis..." "Gray"
    Remove-Item -Path $GitTarget -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Log "  Klone Repository nach $GitTarget..." "Cyan"
git clone -b $Branch $AuthRepoUrl $GitTarget 2>&1 | Out-File -Append -FilePath $LogFile
if ($LASTEXITCODE -ne 0) {
    Write-Log "  Fehler beim Klonen des Repositories! PAT oder Internetverbindung pruefen. (Siehe $LogFile)" "Red"
    Pause; exit
}

Write-Log "  Kopiere benoetigte Komponenten ins Root-Verzeichnis..." "Cyan"
# Kopiere src und scripts Ordner (die eigentliche Applikation) aus dem Git-Root ins Projekt-Root
$RootSrc = Join-Path $GitTarget "src"
$RootScripts = Join-Path $GitTarget "scripts"
$RootMetaTrader = Join-Path $GitTarget "metatrader"

if (Test-Path $RootSrc) { Copy-Item -Path $RootSrc -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootMetaTrader) { Copy-Item -Path $RootMetaTrader -Destination $TargetDir -Recurse -Force }


# 5. SSL Zertifikat generieren
Write-Log "`n[4/8] SSL Zertifikat generieren..." "Cyan"
$SslScriptPath = Join-Path $TargetDir "scripts\generate-ssl.ps1"
if (Test-Path $SslScriptPath) {
    & $SslScriptPath -DomainName "localhost", "127.0.0.1" -Password $CockpitPass *>> $LogFile
    Write-Log "  Zertifikatsgenerierung abgeschlossen (Siehe Log)." "Green"
} else {
    Write-Log "  WARNUNG: Skript 'generate-ssl.ps1' nicht gefunden ($SslScriptPath)." "Yellow"
}


# 6. .env für Backend erstellen und system.json vorbereiten
Write-Log "`n[5/8] Backend Konfiguration (.env und system.json) erstellen..." "Cyan"
$BackendDir = Join-Path $TargetDir "src\market-data-core"
$FrontendDir = Join-Path $TargetDir "src\trading-cockpit"

$EnvContent = @"
# Generiert durch install.ps1
ADMIN_USERNAME=$CockpitUser
ADMIN_PASSWORD=$CockpitPass
PORT=3005
NODE_ENV=production
"@
Set-Content -Path (Join-Path $BackendDir ".env") -Value $EnvContent
Write-Log "  .env erfolgreich geschrieben." "Green"

$SystemJsonPath = Join-Path $BackendDir "data\system.json"
if (-not (Test-Path (Split-Path $SystemJsonPath))) { New-Item -ItemType Directory -Path (Split-Path $SystemJsonPath) | Out-Null }
if (Test-Path $SystemJsonPath) {
    $sysJson = Get-Content $SystemJsonPath | ConvertFrom-Json
} else {
    $sysJson = @{}
}
$sysJson | Add-Member -Type NoteProperty -Name "marketDbPath" -Value "db/core.db" -Force
$sysJson | ConvertTo-Json -Depth 5 | Set-Content -Path $SystemJsonPath
Write-Log "  system.json für den Live-Betrieb (core.db) eingerichtet." "Green"


# 7. NPM Dependencies & Build
Write-Log "`n[6/8] NPM Pakete installieren und Frontend bauen (Das kann dauern)..." "Cyan"

Write-Log "  -> Installiere Backend Dependencies..." "Cyan"
Push-Location $BackendDir
npm install 2>&1 | Out-File -Append -FilePath $LogFile
Pop-Location

Write-Log "  -> Installiere Frontend Dependencies..." "Cyan"
Push-Location $FrontendDir
npm install 2>&1 | Out-File -Append -FilePath $LogFile

Write-Log "  -> Kompiliere Next.js Frontend..." "Cyan"
npm run build 2>&1 | Out-File -Append -FilePath $LogFile
Pop-Location


# 8. Firewall Regeln einrichten
Write-Log "`n[7/8] Firewall-Regeln (Ports 80, 443, 3005) einrichten..." "Cyan"
New-NetFirewallRule -DisplayName "Awesome-Cockpit-Web" -Direction Inbound -LocalPort 80,443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "Awesome-Cockpit-API" -Direction Inbound -LocalPort 3005 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Log "  Firewall-Regeln erfolgreich hinzugefügt." "Green"


# 9. PM2 Setup und Autostart
Write-Log "`n[8/8] Richte PM2 & Windows-Dienst ein..." "Cyan"

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Log "  Installiere PM2 global..." "Yellow"
    npm install -g pm2 2>&1 | Out-File -Append -FilePath $LogFile
    $env:Path += ";$env:APPDATA\npm"
}

Write-Log "  Starte Backend in PM2..." "Cyan"
Push-Location $BackendDir
pm2 start index.js --name "awesome-backend" *>> $LogFile
Pop-Location

Write-Log "  Starte Frontend in PM2 (Next.js start)..." "Cyan"
Push-Location $FrontendDir
pm2 start npm --name "awesome-frontend" -- start *>> $LogFile
Pop-Location

pm2 save *>> $LogFile

Write-Log "  Richte PM2-Windows-Dienst ein (pm2-installer)..." "Cyan"
npm install -g pm2-installer 2>&1 | Out-File -Append -FilePath $LogFile
& pm2-installer install *>> $LogFile


Write-Log "`n=========================================" "Green"
Write-Log "   INSTALLATION ERFOLGREICH ABGESCHLOSSEN" "Green"
Write-Log "=========================================" "Green"
Write-Log "Cockpit User: $CockpitUser" "Yellow"
Write-Log "Cockpit Pass: $CockpitPass" "Yellow"
Write-Log "Das Setup-Log liegt unter: $LogFile" "Gray"
Write-Log "Bitte logge dich am Server ab und wieder an, oder starte PowerShell neu, damit alle Systempfade konsistent benutzbar sind." "Yellow"

Write-Host "`nDruecke eine beliebige Taste, um dieses Fenster zu schliessen..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
