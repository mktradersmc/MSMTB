# Deploy TradingExpert.ex5 to All Instances
param (
    [string]$SourcePath = "C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\TradingExpert.ex5",
    [string]$InstancesRoot = "C:\Trading\Instances"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourcePath)) {
    Write-Error "Source file not found: $SourcePath"
    exit 1
}

if (-not (Test-Path $InstancesRoot)) {
    Write-Error "Instances root not found: $InstancesRoot"
    exit 1
}

Write-Host "Deploying TradingExpert.ex5 from $SourcePath"
Write-Host "Target Root: $InstancesRoot"
Write-Host "---------------------------------------------------"

$instances = Get-ChildItem -Path $InstancesRoot -Directory

foreach ($instance in $instances) {
    $targetDir = Join-Path $instance.FullName "MQL5\Experts"
    $targetFile = Join-Path $targetDir "TradingExpert.ex5"

    if (Test-Path $targetDir) {
        Copy-Item -Path $SourcePath -Destination $targetFile -Force
        Write-Host " [OK] Deployed to $($instance.Name)" -ForegroundColor Green
    } else {
        Write-Warning " [SKIP] $($instance.Name) - MQL5\Experts not found."
    }
}

Write-Host "---------------------------------------------------"
Write-Host "Deployment Complete."
