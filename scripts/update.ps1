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
    exit 1
}

Write-Host "`n[1/3] Aktualisiere Quellcode via Git Pull..." -ForegroundColor Cyan
Set-Location $TargetDir
git fetch origin master
git reset --hard origin/master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fehler beim Git Pull. Abbruch." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Installiere Module und baue Frontend neu..." -ForegroundColor Cyan

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

Write-Host "`n[3/3] Starte PM2 Prozesse neu..." -ForegroundColor Cyan
pm2 reload all

Write-Host "`n[✓] Update erfolgreich abgeschlossen!" -ForegroundColor Green
