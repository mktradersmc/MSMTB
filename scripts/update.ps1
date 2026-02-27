param(
    [string]$TargetDir = "C:\awesome-cockpit"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte (fuer PM2 Dienste). Fordere UAC an..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

if (-not (Test-Path $TargetDir)) {
    Write-Host "Fehler: Installationsverzeichnis $TargetDir nicht gefunden." -ForegroundColor Red
    Pause; exit 1
}

$GitTarget = Join-Path $TargetDir "_github"
if (-not (Test-Path $GitTarget)) {
    Write-Host "Fehler: Repository Verzeichnis $GitTarget nicht gefunden. Wurde install.ps1 sauber gefahren?" -ForegroundColor Red
    Pause; exit 1
}

Write-Host "`n[1/4] Aktualisiere Quellcode via Git Pull..." -ForegroundColor Cyan
Set-Location $GitTarget
git fetch origin master
git reset --hard origin/master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Git Pull im _github Verzeichnis. Abbruch." -ForegroundColor Red
    Pause; exit 1
}

Write-Host "`n[2/4] Kopiere Updates in die Ausfuehrungsordner..." -ForegroundColor Cyan
$RootSrc = Join-Path $GitTarget "src"
$RootScripts = Join-Path $GitTarget "scripts"
$RootMetaTrader = Join-Path $GitTarget "metatrader"

if (Test-Path $RootSrc) { Copy-Item -Path $RootSrc -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }
if (Test-Path $RootMetaTrader) { Copy-Item -Path $RootMetaTrader -Destination $TargetDir -Recurse -Force }


Write-Host "`n[3/4] Installiere Module und baue Frontend neu..." -ForegroundColor Cyan

$BackendDir = Join-Path $TargetDir "src\market-data-core"
$FrontendDir = Join-Path $TargetDir "src\trading-cockpit"

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
