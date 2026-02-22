# Server Deployment & Installation Concept

Dieses Dokument beschreibt die Architektur und die schrittweise Installation des MSMTB-Systems auf einem Windows Server (z. B. Windows Server 2022).

## Architektur-Überblick
Das System besteht aus drei Hauptkomponenten:
1. **Node.js Backend (`market-data-core`)**: Verwaltet Verbindungen zu MT5, persistiert Trades in SQLite/PostgreSQL und bietet WebSockets für das Frontend.
2. **Web Frontend (`trading-cockpit`)**: Die React/Vite-Anwendung für den Endnutzer.
3. **MetaTrader 5 (MT5)**: Der Trading-Client mit den kompilierten MQL5-Experten (`TradingExpert.ex5`, `TickSpy.ex5`).

### Prozess-Management
*   **PM2** steuert Node.js (Backend) und serviert das gebaute Frontend (oder via Nginx). PM2 wird als Windows-Service installiert und startet nach einem Server-Neustart automatisch.
*   **MT5** benötigt einen echten Windows-Desktop. Der Server wird für **AutoAdminLogon** konfiguriert, sodass nach einem Reboot automatisch ein Windows-Benutzer eingeloggt wird. 
*   Ein **Windows Task (Aufgabenplanung)** startet MT5 bei Benutzeranmeldung (On Logon) im Hintergrund inkl. einer `.ini` Konfigurationsdatei.

---

## 🚀 Schritt-für-Schritt Installation

### 1. Vorbereitungen auf dem Windows Server
Nutze Remote Desktop (RDP) um dich auf deinem Server einzuloggen.

Führe das Skript `scripts/server/01_install_dependencies.ps1` in einer **PowerShell als Administrator** aus. 
Dieses Skript installiert:
*   Chocolatey (Paketmanager)
*   Node.js (LTS)
*   Git
*   Nginx (optional für lokales Routing/SSL)
*   Python (falls Build-Tools für Node nötig sind)

### 2. Projekt klonen
Öffne eine normale PowerShell:
```powershell
cd C:\
mkdir MSMTB_Env
cd MSMTB_Env
git clone https://<DEIN_GIT_TOKEN>@github.com/dein-account/MSMTB.git .
```

### 3. PM2 & Backend/Frontend Setup
Führe das Skript `scripts/server/02_setup_pm2.ps1` als Administrator aus.
Das Skript erledigt Folgendes:
1.  Installiert `pm2` und `pm2-windows-startup` global.
2.  Führt `npm install` im `/src/market-data-core` und `/src/trading-cockpit` aus.
3.  Baut das Frontend (`npm run build`).
4.  Startet das Backend und das Frontend mit PM2.
5.  Speichert die PM2-Konfiguration (`pm2 save`), damit sie beim Windows-Start automatisch geladen wird.

### 4. MetaTrader 5 Setup
1.  Lade MetaTrader 5 von deinem Broker herunter und installiere es (z.B. nach `C:\Program Files\MetaTrader 5`).
2.  Öffne MT5 einmalig, logge dich in deinen Broker-Account ein und schließe MT5 wieder.
3.  Passe in `scripts/server/mt5_startup.ini` die Pfade und den Broker-Login an deine Daten an.
4.  Lege in MT5 dein gewünschtes Template an (z.B. `trading_bot.tpl`), auf dem der `TradingExpert` geladen ist, und speichere es. Hinterlege den Namen des Templates in der `.ini`.

### 5. AutoAdminLogon & MT5 Autostart einrichten
Damit MT5 nach einem Neustart des virtuellen Servers direkt lädt:
1.  Drücke `Win + R`, tippe `netplwiz` und deaktiviere den Zwang zur Passworteingabe beim Start (AutoAdminLogon).
2.  Öffne die **Windows Aufgabenplanung (Task Scheduler)**.
3.  Erstelle eine neue Aufgabe:
    *   **Trigger:** "Bei Anmeldung" (At log on) deines speziellen Users.
    *   **Aktion:** Programm starten -> `"C:\Program Files\MetaTrader 5\terminal64.exe"`
    *   **Argumente:** `/config:"C:\MSMTB_Env\scripts\server\mt5_startup.ini"`
    *   **Bedingungen:** Deaktiviere "Nur starten, wenn auf Netzbetrieb" etc.

### 6. System updaten (`03_deploy_update.ps1`)
Für künftige Updates führst du einfach nur das Deployment-Skript aus:
```powershell
C:\MSMTB_Env\scripts\server\03_deploy_update.ps1
```
Dieses Skript:
1.  Zieht neuen Code via `git pull`.
2.  Installiert neue npm-Pakete und baut ggf. das Frontend neu.
3.  Lädt das PM2-Backend und -Frontend ohne Downtime neu (`pm2 reload all`).
4.  Kompiliert alle aktualisierten MQL5-Experten (TradingExpert, TickSpy) via `metaeditor64.exe /compile` im Hintergrund.
5.  Kopiert die fertigen `.ex5` Dateien in den MT5-Ordner.
6.  Startet den MetaTrader 5 sanft neu, damit er die neuen Experten lädt.
