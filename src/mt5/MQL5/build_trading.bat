REM MQL5 Headless Build Script
REM Copyright 2026

@echo off

echo [Build] Compiling TradingExpert.mq5...
"C:\Users\Michael\IdeaProjects\MSMTB\components\metatrader\master\metaeditor64.exe" /compile:"%~dp0Experts\TradingExpert.mq5" /inc:"%~dp0\" /log:"%~dp0Experts\compile_trading.log"

echo [Build] TradingExpert.mq5 compiled. Check compile_trading.log for "0 errors".
exit /b 0
