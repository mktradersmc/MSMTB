param(
    [switch]$Build = $true,
    [switch]$Install = $true
)

$ErrorActionPreference = "Stop"

$nt8Dir = "$env:USERPROFILE\Documents\NinjaTrader 8\bin\Custom"
$srcDir = "C:\Users\Michael\IdeaProjects\MSMTB\src\ninja-bridge"

Write-Host "C# Bridge Deployment Script" -ForegroundColor Cyan

if ($Install) {
    Write-Host "Copying C# files to NinjaTrader Custom directory..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$nt8Dir\AddOns\AwesomeCockpit")) {
        New-Item -ItemType Directory -Force -Path "$nt8Dir\AddOns\AwesomeCockpit" | Out-Null
    }

    Copy-Item "$srcDir\BridgeWebSocket.cs" "$nt8Dir\AddOns\AwesomeCockpit\BridgeWebSocket.cs" -Force
    Copy-Item "$srcDir\DiscoveryService.cs" "$nt8Dir\AddOns\AwesomeCockpit\DiscoveryService.cs" -Force
    Copy-Item "$srcDir\SubscriptionManager.cs" "$nt8Dir\AddOns\AwesomeCockpit\SubscriptionManager.cs" -Force
    Copy-Item "$srcDir\ExecutionManager.cs" "$nt8Dir\AddOns\AwesomeCockpit\ExecutionManager.cs" -Force
    
    # Clean up deprecated strategy file
    if (Test-Path "$nt8Dir\AddOns\AwesomeCockpit\HeadlessBarTrackerStrategy.cs") {
        Remove-Item "$nt8Dir\AddOns\AwesomeCockpit\HeadlessBarTrackerStrategy.cs" -Force
    }
    
    Write-Host "Files copied successfully." -ForegroundColor Green
}

if ($Build) {
    Write-Host "You must compile the AddOn directly from the NinjaTrader 8 UI using the NinjaScript Editor." -ForegroundColor Yellow
    Write-Host "Open NinjaTrader 8 -> New -> NinjaScript Editor -> Right Click -> Compile (F5)" -ForegroundColor Yellow
}

Write-Host "Deployment complete." -ForegroundColor Cyan
