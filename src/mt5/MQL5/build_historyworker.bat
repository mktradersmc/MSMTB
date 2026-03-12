REM MQL5 Headless Build Script
REM Copyright 2026

@echo off

echo [Build] Compiling HistoryWorker.mq5...
"C:\Users\Michael\IdeaProjects\MSMTB\components\metatrader\master\metaeditor64.exe" /compile:"%~dp0Indicators\HistoryWorker.mq5" /inc:"%~dp0\" /log:"%~dp0Indicators\compile_historyworker.log"

echo [Build] HistoryWorker.mq5 compiled. Check compile_historyworker.log for "0 errors".
exit /b 0
