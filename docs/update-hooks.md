# Update Hooks System

Das Update Hooks System ermöglicht die automatische, sequenzielle Ausführung von Skripten (Datenbankmigrationen, Konfigurationsanpassungen, Bereinigung) während des automatischen Update-Prozesses (`update.ps1`), **bevor** die PM2-Dienste neu gestartet werden.

## 1. Funktionalität & Speicherort

Alle Update-Hooks (Skripte) müssen in folgendem Verzeichnis abgelegt werden:
`scripts/update-hooks/`

Der sogenannte "Hook Runner" (`scripts/run-update-hooks.js`) wird während des Updates automatisch aufgerufen und arbeitet alle Skripte in diesem Ordner nacheinander ab.

## 2. Namenskonvention (WICHTIG!)

Die Skripte **müssen** nach einem strikten Zeitstempel-Präfix (`YYYYMMDDHHMMSS_...`) benannt werden, da der Hook Runner die Dateien alphabetisch sortiert. Nur so ist eine fehlerfreie, chronologische Ausführung über mehrere Commits hinweg garantiert.

**Zulässige Dateiformate:**  
- `.js` (Wird mit Node.js ausgeführt)  
- `.ps1` (Wird als PowerShell-Skript ausgeführt)  

**Beispiele für korrekte Dateinamen:**
- `20260304101500_migrate_accounts_table.js`
- `20260305090000_cleanup_old_logs.ps1`

## 3. Zustandsverfolgung (State)

Damit ein Skript nicht mehrfach bei jedem Update ausgeführt wird, merkt sich das System die erfolgreich gelaufenen Skripte in einer persistierten JSON-Datei.
Dieser Status wird hier gesichert:
`components/management-console/data/executed-hooks.json`

Diese Datei wird **nicht** im Repository gespeichert (da sie in `data/` liegt) und wächst mit jedem Update kontinuierlich an.

## 4. Sicherheit & "Self-Healing Rollback"

Das System ist ausfallsicher konzipiert. Der Hook Runner ist in die Backup-Mechanik von `update.ps1` integriert:

1. Tritt in einem Skript ein Fehler auf (z. B. Syntaxfehler im JavaScript oder Fehlercode > 0), meldet der Hook Runner dies sofort zurück.
2. Der fehlgeschlagene Hook wird **nicht** in die `executed-hooks.json` eingetragen.
3. Die `update.ps1` bricht das Update ab und löst sofort den **Self-Healing Rollback** aus. Das System kehrt zur vorherigen, funktionierenden Version aus dem `.backup/` Ordner zurück.

Dies garantiert, dass das Live-System niemals durch ein fehlerhaftes Migrationsskript in einem defekten Zwischenzustand verbleibt.

## 5. Beispiele für Skripte

### JavaScript Hook (Beispiel: Datenmanipulation, API Calls)
```javascript
// 20260304120000_update_user_flags.js
const fs = require('fs');

// Der Hook Runner übergibt automatisch alle Argumente, z.B. --data-path
const args = process.argv.slice(2);
console.log("Starte benutzerdefinierten Update-Task mit Argumenten:", args.join(' '));

// ... Eigener Code für diesen spezifischen Update-Schritt
console.log("Update-Task abgeschlossen!");
// Skript beendet sich ohne Fehler (Exit-Code 0) -> wird vom Runner als erfolgreich markiert.
```

### PowerShell Hook (z.B. Windows Registry, PM2, File System)
```powershell
# 20260305143000_clear_temp_files.ps1
param (
    [string]$DataPath # Wird vom Hook Runner als --data-path übergeben
)

Write-Host "Lösche temporäre Caches in $DataPath..."
Remove-Item -Path "C:\awesome-cockpit\logs\*.tmp" -Force -ErrorAction SilentlyContinue
Write-Host "Caches erfolgreich gelöscht."
```
