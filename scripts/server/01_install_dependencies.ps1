# ==============================================================================
# 01_install_dependencies.ps1
# MUST BE RUN AS ADMINISTRATOR
# Installs core utilities: Chocolatey, Node.js, Git, Nginx, Python
# ==============================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   MSMTB Server - Dependency Installer   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script MUST be run as Administrator!"
    Exit
}

# 2. Install Chocolatey (if not present)
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "[1/4] Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "[1/4] Chocolatey is already installed." -ForegroundColor Green
}

# 3. Install Git, Python, Nginx via Chocolatey
Write-Host "[2/4] Installing Git, Python, and Nginx..." -ForegroundColor Yellow
choco install git python nginx -y

# 4. Install Node.js (LTS version)
Write-Host "[3/4] Installing Node.js (LTS)..." -ForegroundColor Yellow
choco install nodejs-lts -y

# Update Environment Variables so we can use node/npm immediately
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 5. Verify Installations
Write-Host "[4/4] Verifying installations..." -ForegroundColor Yellow
try {
    $nodeVer = node -v
    $npmVer = npm -v
    $gitVer = git --version
    Write-Host "  -> Node.js Version: $nodeVer" -ForegroundColor Green
    Write-Host "  -> NPM Version: $npmVer" -ForegroundColor Green
    Write-Host "  -> Git: $gitVer" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation of dependencies COMPLETE! Please close this PowerShell window and open a new one to run 02_setup_pm2.ps1." -ForegroundColor Cyan
} catch {
    Write-Warning "Could not verify all versions. A system reboot might be required for PATH variables to take effect."
}
