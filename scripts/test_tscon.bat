@echo off
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 1; $session = (Get-Process -Id $PID).SessionId; Write-Host $session"
