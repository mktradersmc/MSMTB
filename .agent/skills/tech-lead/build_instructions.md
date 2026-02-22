# Build Protokoll für MQL5

Um den Code zu validieren, nutze bitte folgende Prozedur:
Je nach Projekt!
Für TradingExpert: Führe den Compiler im Headless-Mode aus:
   ```cmd
   C:\Trading\MasterMT5\metaeditor64.exe /compile:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\TradingExpert.mq5" /log:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\build.log" /inc:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5"
   ```


Für DatafeedExpert: Führe den Compiler im Headless-Mode aus:
   ```cmd
   C:\Trading\MasterMT5\metaeditor64.exe /compile:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\DatafeedExpert.mq5" /log:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Experts\build.log" /inc:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5"
Für TickSpy: Führe den Compiler im Headless-Mode aus:
   ```cmd
   C:\Trading\MasterMT5\metaeditor64.exe /compile:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Indicators\TickSpy.mq5" /log:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Indicators\build.log" /inc:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5"
Für HistoryWorker: Führe den Compiler im Headless-Mode aus:
   ```cmd
   C:\Trading\MasterMT5\metaeditor64.exe /compile:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Indicators\HistoryWorker.mq5" /log:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5\Indicators\build.log" /inc:"C:\Users\Michael\IdeaProjects\MSMTB\src\mt5\MQL5"
Prüfe build.log auf Syntaxfehler.

Falls Fehler: Analysiere die betroffene Zeile im Code und korrigiere sie.

Wenn der Build Vorgang eines Expert Advisors erfolgreich abgeschlossen ist, kopiere die Datei mit der Endung .ex5 in den Ordner C:\Trading\MasterMT5\MQL5\Experts\

Wenn der Build Vorgang eines Indikators erfolgreich abgeschlossen ist, kopiere die Datei mit der Endung .ex5 in den Ordner C:\Trading\MasterMT5\MQL5\Indicators\
