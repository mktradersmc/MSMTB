# ==============================================================================
# 02_setup_pm2.ps1
# MUST BE RUN AS ADMINISTRATOR from the project root directory (e.g. C:\MSMTB_Env)
# Sets up PM2 as a Windows Service, installs npm packages, and starts everything
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    MSMTB Server - PM2 Service Setup     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = (Get-Item -Path ".\").FullName
$BackendDir = Join-Path $ProjectRoot "src\market-data-core"
$FrontendDir = Join-Path $ProjectRoot "src\trading-cockpit"

Write-Host "Project Root detected as: $ProjectRoot" -ForegroundColor Yellow

# 1. Install PM2 and the Windows Service tool
Write-Host "[1/5] Installing PM2 and PM2-Windows-Startup globally..." -ForegroundColor Yellow
npm install -g pm2 pm2-windows-startup

# Link pm2-startup
Write-Host "[2/5] Registering PM2 as a Windows Service..." -ForegroundColor Yellow
pm2-startup install

# 2. Build Backend
Write-Host "[3/5] Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location -Path $BackendDir
npm install

# 3. Build Frontend
Write-Host "[4/5] Installing Frontend dependencies and building project..." -ForegroundColor Yellow
Set-Location -Path $FrontendDir
npm install
npm run build

# 4. Start Ecosystem
Write-Host "[5/5] Starting PM2 Ecosystem and saving layout..." -ForegroundColor Yellow

# Start the Node Backend
Set-Location -Path $ProjectRoot
# Assuming your backend entry is `src/market-data-core/index.js` or similar. Adjust if needed.
pm2 start "$BackendDir\index.js" --name "msmtb-backend" 

# Start the Frontend (e.g., serving the Vite 'dist' folder on a specific port, or Next.js via 'npm run start')
# Since it's likely a Vite React app, we can serve it using the `pm2 serve` command
pm2 serve "$FrontendDir\dist" 3000 --name "msmtb-frontend" --spa

# Save pm2 state so it restarts on boot
pm2 save

Write-Host ""
Write-Host "============================" -ForegroundColor Green
Write-Host "   SETUP COMPLETE" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "Backend is running on PM2 and will auto-start after server reboot." -ForegroundColor Green
Write-Host "Next Step: Configure MT5 Auto-Start using the Task Scheduler and AutoAdminLogon." -ForegroundColor Cyan
