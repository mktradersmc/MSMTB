
$metaEditor = "C:\Program Files\MetaTrader 5\metaeditor64.exe"
$expertSource = "C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\TradingExpert.mq5"
$include = "C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5"
$log = "C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\build_te.log"
$targetOutput = "C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\TradingExpert.ex5"

Write-Host "Compiling $expertSource..."
& $metaEditor /compile:$expertSource /inc:$include /log:$log

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation Successful."
    
    # Wait a moment for file system
    Start-Sleep -Seconds 1
} else {
    Write-Host "Compilation Failed. Exit Code: $LASTEXITCODE"
}

Get-Content $log
