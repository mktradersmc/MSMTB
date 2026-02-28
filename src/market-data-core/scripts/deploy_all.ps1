# Deploy ALL MQL5 Artifacts to All Instances
# Scope: TradingExpert, DatafeedExpert, TickSpy, HistoryWorker, TradeInfo
# ACTION: COPY FILES ONLY. NO RESTART.

param (
    [string]$ProjectRoot = "C:\awesome-cockpit\metatrader\master\MQL5",
    [string]$InstancesRoot = "C:\awesome-cockpit\metatrader\instances"
)

$ErrorActionPreference = "Continue" # Continue on error to attempt all instances

# 1. Define Artifacts
$Experts = @("TradingExpert.ex5", "DatafeedExpert.ex5")
$Indicators = @("TickSpy.ex5", "HistoryWorker.ex5")
$Libraries = @("MT5WebBridge.dll")

# 2. Check Source Existence
Write-Host "Verifying Source Files in $ProjectRoot..." -ForegroundColor Cyan
foreach ($e in $Experts) {
    if (-not (Test-Path "$ProjectRoot\Experts\$e")) { Write-Error "Missing Source: Experts\$e"; exit 1 }
}
foreach ($i in $Indicators) {
    if (-not (Test-Path "$ProjectRoot\Indicators\$i")) { Write-Error "Missing Source: Indicators\$i"; exit 1 }
}
foreach ($l in $Libraries) {
    if (-not (Test-Path "$ProjectRoot\Libraries\$l")) { Write-Error "Missing Source: Libraries\$l"; exit 1 }
}

if (-not (Test-Path $InstancesRoot)) {
    Write-Error "Instances root not found: $InstancesRoot"
    exit 1
}

Write-Host "Deploying ALL Artifacts to Instances in $InstancesRoot"
Write-Host "Action: COPY FILES ONLY"
Write-Host "---------------------------------------------------"

$instances = Get-ChildItem -Path $InstancesRoot -Directory
$count = 0

foreach ($instance in $instances) {
    Write-Host "Processing $($instance.Name)..." -NoNewline
    
    $expertDir = Join-Path $instance.FullName "MQL5\Experts"
    $indicatorDir = Join-Path $instance.FullName "MQL5\Indicators"

    # Ensure Dirs Exist
    if (-not (Test-Path $expertDir)) { New-Item -ItemType Directory -Path $expertDir -Force | Out-Null }
    if (-not (Test-Path $indicatorDir)) { New-Item -ItemType Directory -Path $indicatorDir -Force | Out-Null }

    # Copy Experts
    foreach ($e in $Experts) {
        Copy-Item -Path "$ProjectRoot\Experts\$e" -Destination "$expertDir\$e" -Force
    }

    # Copy Indicators
    foreach ($i in $Indicators) {
        Copy-Item -Path "$ProjectRoot\Indicators\$i" -Destination "$indicatorDir\$i" -Force
    }

    # Copy Libraries
    $libraryDir = Join-Path $instance.FullName "MQL5\Libraries"
    if (-not (Test-Path $libraryDir)) { New-Item -ItemType Directory -Path $libraryDir -Force | Out-Null }
    foreach ($l in $Libraries) {
        Copy-Item -Path "$ProjectRoot\Libraries\$l" -Destination "$libraryDir\$l" -Force
    }

    Write-Host " [OK]" -ForegroundColor Green
    $count++
}

Write-Host "---------------------------------------------------"
Write-Host "Deployment Complete. Updated $count instances."
