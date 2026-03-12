REM MQL5 Automated Deployment Script
REM Copyright 2026

@echo off
setlocal

REM Define Absolute Paths
set "PROJECT_ROOT=C:\Users\Michael\IdeaProjects\MSMTB"
set "MQL5_SRC=%~dp0"
set "MASTER_DIR=%PROJECT_ROOT%\components\metatrader\master\MQL5"
set "INSTANCES_DIR=%PROJECT_ROOT%\components\metatrader\instances"

echo =======================================================
echo [Deploy] Starting Deployment of MQL5 Compiled Binaries
echo =======================================================

echo.
echo [Deploy] Deploying to MASTER Directory...
if not exist "%MASTER_DIR%\Experts" mkdir "%MASTER_DIR%\Experts" 2>nul
if not exist "%MASTER_DIR%\Indicators" mkdir "%MASTER_DIR%\Indicators" 2>nul
copy /Y "%MQL5_SRC%Experts\DatafeedExpert.ex5" "%MASTER_DIR%\Experts\DatafeedExpert.ex5"
copy /Y "%MQL5_SRC%Experts\TradingExpert.ex5" "%MASTER_DIR%\Experts\TradingExpert.ex5"
copy /Y "%MQL5_SRC%Indicators\TickSpy.ex5" "%MASTER_DIR%\Indicators\TickSpy.ex5"
copy /Y "%MQL5_SRC%Indicators\HistoryWorker.ex5" "%MASTER_DIR%\Indicators\HistoryWorker.ex5"

echo.
echo [Deploy] Deploying to INSTANCE Directories...
FOR /D %%I IN ("%INSTANCES_DIR%\*") DO (
    echo   - Deploying to Instance: %%~nxI
    
    REM Create subdirectories if they somehow don't exist
    if not exist "%%I\MQL5\Experts" mkdir "%%I\MQL5\Experts" 2>nul
    if not exist "%%I\MQL5\Indicators" mkdir "%%I\MQL5\Indicators" 2>nul

    copy /Y "%MQL5_SRC%Experts\DatafeedExpert.ex5" "%%I\MQL5\Experts\DatafeedExpert.ex5" >nul
    copy /Y "%MQL5_SRC%Experts\TradingExpert.ex5" "%%I\MQL5\Experts\TradingExpert.ex5" >nul
    copy /Y "%MQL5_SRC%Indicators\TickSpy.ex5" "%%I\MQL5\Indicators\TickSpy.ex5" >nul
    copy /Y "%MQL5_SRC%Indicators\HistoryWorker.ex5" "%%I\MQL5\Indicators\HistoryWorker.ex5" >nul
)

echo.
echo =======================================================
echo [Deploy] Deployment completed successfully!
echo =======================================================
exit /b 0
