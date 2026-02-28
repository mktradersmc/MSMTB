param(
    [string]$TargetDir = "C:\awesome-cockpit"
)

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte (fuer PM2 Dienste). Fordere UAC an..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

if (-not (Test-Path $TargetDir)) {
    Write-Host "Fehler: Installationsverzeichnis $TargetDir nicht gefunden." -ForegroundColor Red
    Pause; exit 1
}

$GitTarget = Join-Path $env:TEMP "_github_msmtb"
if (-not (Test-Path $GitTarget)) {
    Write-Host "Fehler: Temporäres Repository Verzeichnis $GitTarget nicht gefunden. Wurde install.ps1 jemals sauber gefahren?" -ForegroundColor Red
    Pause; exit 1
}

Write-Host "`n[1/4] Aktualisiere Quellcode via Git Pull..." -ForegroundColor Cyan

# Lade Github PAT aus system.json fuer Headless-Authentifizierung
$SystemConfigPath = Join-Path $TargetDir "components\market-data-core\data\system.json"
$GithubPat = ""
if (Test-Path $SystemConfigPath) {
    try {
        $sysJson = Get-Content $SystemConfigPath | ConvertFrom-Json
        if ($sysJson.tempGithubPat) { $GithubPat = $sysJson.tempGithubPat }
    } catch {}
}

Set-Location $GitTarget

# Authentication anpassen falls PAT vorhanden
if (-not [string]::IsNullOrWhiteSpace($GithubPat)) {
    $RepoUrl = "https://$GithubPat@github.com/mktradersmc/MSMTB.git"
    git remote set-url origin $RepoUrl
}

git fetch origin main
git reset --hard origin/main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Git Pull im $GitTarget Verzeichnis. Abbruch." -ForegroundColor Red
    Pause; exit 1
}

Write-Host "`n[2/4] Kopiere Updates in die Ausfuehrungsordner..." -ForegroundColor Cyan
$RootSrcBackend = Join-Path $GitTarget "src\market-data-core"
$RootSrcFrontend = Join-Path $GitTarget "src\trading-cockpit"
$RootScripts = Join-Path $GitTarget "scripts"
$RootMetaTrader = Join-Path $GitTarget "metatrader"

$DestComponents = Join-Path $TargetDir "components"
if (-not (Test-Path $DestComponents)) { New-Item -ItemType Directory -Path $DestComponents | Out-Null }

if (Test-Path $RootSrcBackend) { Copy-Item -Path $RootSrcBackend -Destination $DestComponents -Recurse -Force }
if (Test-Path $RootSrcFrontend) { Copy-Item -Path $RootSrcFrontend -Destination $DestComponents -Recurse -Force }
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootMetaTrader) { Copy-Item -Path $RootMetaTrader -Destination $TargetDir -Recurse -Force }


Write-Host "`n[3/4] Installiere Module und baue Frontend neu..." -ForegroundColor Cyan

$BackendDir = Join-Path $DestComponents "market-data-core"
$FrontendDir = Join-Path $DestComponents "trading-cockpit"

Write-Host "  -> Backend..."
Push-Location $BackendDir
npm install --silent
Pop-Location

Write-Host "  -> Frontend..."
Push-Location $FrontendDir
npm install --silent
npm run build
Pop-Location

Write-Host "`n[4/4] Starte PM2 Prozesse neu..." -ForegroundColor Cyan
pm2 reload all

Write-Host "`n[✓] Update erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
