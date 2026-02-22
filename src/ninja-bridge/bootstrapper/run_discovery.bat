@echo off
pushd "%~dp0"
echo [Discovery] Running add-account.ps1 (Discovery Mode) with Bypass Policy...
powershell -ExecutionPolicy Bypass -File "add-account.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Script failed.
    pause
    exit /b 1
)
echo [DONE] Script finished.
pause
