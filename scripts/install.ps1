param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$RepoUrl = "https://github.com/DEIN_BENUTZERNAME/DEIN_REPO.git",  # MUSS VOM NUTZER ANGEPASST WERDEN
    [string]$Branch = "master"
)

# 1. Admin-Rechte prüfen und ggf. anfordern
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte. Fordere UAC an..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   MSMTB Trading Plattform Installer     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 2. Interaktive Abfragen (PAT & Cockpit Credentials)
Write-Host "`n[1/8] Konfiguration abfragen..." -ForegroundColor Cyan

$GithubPAT = Read-Host "Bitte gib deinen GitHub Personal Access Token (PAT) ein (fuer private Repos)"
if ([string]::IsNullOrWhiteSpace($GithubPAT)) {
    Write-Host "Kein PAT eingegeben. Abbruch." -ForegroundColor Red
    exit
}

$CockpitUser = Read-Host "Bitte gib einen Benutzernamen fuer das Trading Cockpit Backend ein"
if ([string]::IsNullOrWhiteSpace($CockpitUser)) { $CockpitUser = "admin" }

$CockpitPass = Read-Host "Bitte gib ein Passwort fuer das Trading Cockpit Backend ein"
if ([string]::IsNullOrWhiteSpace($CockpitPass)) {
    Write-Host "Passwort darf nicht leer sein. Abbruch." -ForegroundColor Red
    exit
}


# 3. System-Abhängigkeiten installieren (Node.js & Git)
Write-Host "`n[2/8] System-Abhaengigkeiten pruefen (Git, Node.js)..." -ForegroundColor Cyan

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  Git nicht gefunden. Installiere via winget..." -ForegroundColor Yellow
    winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements
    $env:Path += ";C:\Program Files\Git\cmd" # Temporal add to path for current session
} else {
    Write-Host "  Git ist bereits installiert." -ForegroundColor Green
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  Node.js nicht gefunden. Installiere via winget (LTS)..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    $env:Path += ";C:\Program Files\nodejs" # Temporal add to path for current session
} else {
    Write-Host "  Node.js ist bereits installiert ($(node -v))." -ForegroundColor Green
}


# 4. Klonen des Repositories
Write-Host "`n[3/8] Quellcode herunterladen..." -ForegroundColor Cyan

# URL um PAT erweitern: https://<PAT>@github.com/...
$AuthRepoUrl = $RepoUrl -replace "https://", "https://$GithubPAT@"

if (Test-Path $TargetDir) {
    Write-Host "  Zielverzeichnis $TargetDir existiert bereits. Bitte vorher aufräumen (cleanup.ps1)!" -ForegroundColor Red
    exit
}

Write-Host "  Klone Repository in $TargetDir..."
git clone -b $Branch $AuthRepoUrl $TargetDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Fehler beim Klonen des Repositories! PAT pruefen." -ForegroundColor Red
    exit
}


# 5. SSL Zertifikat generieren
Write-Host "`n[4/8] SSL Zertifikat generieren..." -ForegroundColor Cyan
$SslScriptPath = Join-Path $TargetDir "scripts\generate-ssl.ps1"
if (Test-Path $SslScriptPath) {
    # Wir übergeben das Backend-Passwort auch als PFX-Passwort (oder ein dediziertes)
    & $SslScriptPath -DomainName "localhost", "127.0.0.1" -Password $CockpitPass
} else {
    Write-Host "  WARNUNG: Skript 'generate-ssl.ps1' nicht unter scripts\ gefunden." -ForegroundColor Yellow
}


# 6. .env für Backend erstellen und system.json vorbereiten
Write-Host "`n[5/8] Backend Konfiguration (.env und system.json) erstellen..." -ForegroundColor Cyan
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
Write-Host "  .env erfolgreich geschrieben." -ForegroundColor Green

$SystemJsonPath = Join-Path $BackendDir "data\system.json"
if (-not (Test-Path (Split-Path $SystemJsonPath))) { New-Item -ItemType Directory -Path (Split-Path $SystemJsonPath) | Out-Null }
if (Test-Path $SystemJsonPath) {
    $sysJson = Get-Content $SystemJsonPath | ConvertFrom-Json
} else {
    $sysJson = @{}
}
$sysJson | Add-Member -Type NoteProperty -Name "marketDbPath" -Value "db/core.db" -Force
$sysJson | ConvertTo-Json -Depth 5 | Set-Content -Path $SystemJsonPath
Write-Host "  system.json für den Live-Betrieb (core.db) eingerichtet." -ForegroundColor Green


# 7. NPM Dependencies & Build
Write-Host "`n[6/8] NPM Pakete installieren und Frontend bauen (Das kann dauern)..." -ForegroundColor Cyan

Write-Host "  -> Installiere Backend Dependencies..."
Push-Location $BackendDir
npm install
Pop-Location

Write-Host "  -> Installiere Frontend Dependencies..."
Push-Location $FrontendDir
npm install

Write-Host "  -> Kompiliere Next.js Frontend..."
# In Produktion wollen wir eine reine Build-Ausgabe
npm run build
Pop-Location


# 8. Firewall Regeln einrichten
Write-Host "`n[7/8] Firewall-Regeln (Ports 80, 443, 3005) einrichten..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "Awesome-Cockpit-Web" -Direction Inbound -LocalPort 80,443 -Protocol TCP -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Awesome-Cockpit-API" -Direction Inbound -LocalPort 3005 -Protocol TCP -Action Allow | Out-Null
Write-Host "  Firewall-Regeln erfolgreich hinzugefügt." -ForegroundColor Green


# 9. PM2 Setup und Autostart
Write-Host "`n[8/8] Richte PM2 & Windows-Dienst ein..." -ForegroundColor Cyan

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "  Installiere PM2 global..."
    npm install -g pm2
    $env:Path += ";$env:APPDATA\npm" # Add to path
}

# Backend starten
Write-Host "  Starte Backend in PM2..."
Push-Location $BackendDir
pm2 start index.js --name "msmtb-backend"
Pop-Location

# Frontend starten
Write-Host "  Starte Frontend in PM2 (Next.js start)..."
Push-Location $FrontendDir
pm2 start npm --name "msmtb-frontend" -- start
Pop-Location

# PM2 Status speichern
pm2 save

# PM2 als Windows Dienst einrichten (Autostart)
Write-Host "  Richte PM2-Windows-Dienst ein..."
# pm2-installer ist erfahrungsgemäß der stabilste weg unter Windows 10
npm install -g pm2-installer
& pm2-installer install


Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "   INSTALLATION ERFOLGREICH ABGESCHLOSSEN" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Cockpit User: $CockpitUser" -ForegroundColor Yellow
Write-Host "Cockpit Pass: $CockpitPass" -ForegroundColor Yellow
Write-Host "Bitte logge dich am Server ab und wieder an, oder starte PowerShell neu, damit alle Pfade ($env:Path) konsistent benutzbar sind." -ForegroundColor Yellow
