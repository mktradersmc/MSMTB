# ==============================================================================
# 03_deploy_update.ps1
# Script to pull latest changes from Git, rebuild frontend, and recompile MT5 Experts
# ==============================================================================

$ProjectRoot = (Get-Item -Path ".\").FullName
$BackendDir = Join-Path $ProjectRoot "src\market-data-core"
$FrontendDir = Join-Path $ProjectRoot "src\trading-cockpit"
$Mql5SrcDir = Join-Path $ProjectRoot "src\mt5\MQL5"
$MT5DataFolder = "$env:APPDATA\MetaQuotes\Terminal" # Note: Needs specific instance ID in reality
$MetaEditorExe = "C:\Program Files\MetaTrader 5\metaeditor64.exe"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    MSMTB Server - FULL UPDATE SCRIPT    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Fetch latest Code
Write-Host "[1/5] Pulling latest code from Git..." -ForegroundColor Yellow
Set-Location -Path $ProjectRoot
git branch --set-upstream-to=origin/main main
git pull origin main

# 2. Update Backend
Write-Host "[2/5] Updating Backend..." -ForegroundColor Yellow
Set-Location -Path $BackendDir
npm install
pm2 reload msmtb-backend

# 3. Update Frontend
Write-Host "[3/5] Updating Frontend..." -ForegroundColor Yellow
Set-Location -Path $FrontendDir
npm install
npm run build
pm2 reload msmtb-frontend

# 4. Compile MQL5 Experts (Headless)
Write-Host "[4/5] Recompiling MQL5 Experts (TradingExpert, TickSpy)..." -ForegroundColor Yellow

$ExpertPath = Join-Path $ProjectRoot "src\mt5\MQL5\Experts\TradingExpert.mq5"
$IndicatorPath = Join-Path $ProjectRoot "src\mt5\MQL5\Indicators\TickSpy.mq5"

# Compile Expert
Start-Process -FilePath $MetaEditorExe -ArgumentList "/compile `"$ExpertPath`" /log" -Wait -NoNewWindow
# Compile Indicator
Start-Process -FilePath $MetaEditorExe -ArgumentList "/compile `"$IndicatorPath`" /log" -Wait -NoNewWindow

Write-Host "Compilation finished. Check '$ProjectRoot\build.log' if errors occurred." -ForegroundColor Gray

# 5. Restart MT5
Write-Host "[5/5] Restarting MetaTrader 5..." -ForegroundColor Yellow
$mt5_process = Get-Process terminal64 -ErrorAction SilentlyContinue
if ($mt5_process) {
    Stop-Process -Name terminal64 -Force
    Start-Sleep -Seconds 5
}

# Define your config file for the restart.
$ConfigPath = Join-Path $ProjectRoot "scripts\server\mt5_startup.ini"
Start-Process -FilePath "C:\Program Files\MetaTrader 5\terminal64.exe" -ArgumentList "/config:`"$ConfigPath`""

Write-Host ""
Write-Host "============================" -ForegroundColor Green
Write-Host "   UPDATE COMPLETE" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "The application is updated, PM2 reloaded, and MT5 restarted with new experts." -ForegroundColor Green
