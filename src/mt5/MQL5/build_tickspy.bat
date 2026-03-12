REM MQL5 Headless Build Script
REM Copyright 2026

@echo off

echo [Build] Compiling TickSpy.mq5...
"C:\Users\Michael\IdeaProjects\MSMTB\components\metatrader\master\metaeditor64.exe" /compile:"%~dp0Indicators\TickSpy.mq5" /inc:"%~dp0\" /log:"%~dp0Indicators\compile_tickspy.log"

echo [Build] TickSpy.mq5 compiled. Check compile_tickspy.log for "0 errors".
exit /b 0
