REM MQL5 Headless Build Script
REM Copyright 2026

@echo off

echo [Build] Compiling DatafeedExpert.mq5...
"C:\Users\Michael\IdeaProjects\MSMTB\components\metatrader\master\metaeditor64.exe" /compile:"%~dp0Experts\DatafeedExpert.mq5" /inc:"%~dp0\" /log:"%~dp0Experts\compile.log"

echo [Build] DatafeedExpert.mq5 compiled. Check compile.log for "0 errors".
exit /b 0
