param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$RestartInstances = "False"
)

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte (fuer Windows Dienste und Backups). Fordere UAC an..." -ForegroundColor Yellow
    # CRITICAL FIX: Convert parameter to simple string wrapper to prevent System.Boolean parser crashes. Removed -NoExit to prevent hanging.
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -RestartInstances `"$RestartInstances`"" -Verb RunAs
    exit
}

# Logger setup
$LogDir = Join-Path $TargetDir "logs"
$LogFile = Join-Path $LogDir "update.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [UPDATE] $Message"
    Add-Content -Path $LogFile -Value $LogMsg
    Write-Host $Message -ForegroundColor $Color
}

function Set-Progress {
    param([int]$Step, [string]$Message)
    $obj = @{ step = $Step; text = $Message }
    $json = $obj | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText((Join-Path $LogDir "update-progress.json"), $json, [System.Text.Encoding]::UTF8)
}

Set-Progress 1 "Initialisiere Update-Prozess..."

Write-Log "=========================================" "Cyan"
Write-Log "   STARTE AUTO-UPDATE PROZESS            " "Cyan"
Write-Log "=========================================" "Cyan"

if (-not (Test-Path $TargetDir)) {
    Write-Log "Fehler: Installationsverzeichnis $TargetDir nicht gefunden." "Red"; exit 1
}

# --- 1.5 CREDENTIALS LADEN ---
$DestComponents = Join-Path $TargetDir "components"
$BackendLive = Join-Path $DestComponents "market-data-core"
$SystemConfigPath = Join-Path $BackendLive "data\system.json"

$GithubPat = ""
if (Test-Path $SystemConfigPath) {
    try {
        $sysJson = Get-Content $SystemConfigPath | ConvertFrom-Json
        if ($sysJson.tempGithubPat) { $GithubPat = $sysJson.tempGithubPat }
    }
    catch {}
}

$GitTarget = Join-Path $TargetDir ".github_main"
if (-not (Test-Path $GitTarget)) {
    Write-Log "Temporäres Repository Verzeichnis nicht gefunden. Klone initial..." "Yellow"
    
    $AuthRepoUrl = "https://github.com/mktradersmc/MSMTB.git"
    if (-not [string]::IsNullOrWhiteSpace($GithubPat)) {
        $AuthRepoUrl = "https://$GithubPat@github.com/mktradersmc/MSMTB.git"
    }
    else {
        Write-Log "HINWEIS: Kein Github PAT in system.json gefunden. Versuche anonymen Klon..." "Yellow"
    }

    git clone -b main $AuthRepoUrl $GitTarget 2>&1 | Out-File -Append -FilePath $LogFile

    if (-not (Test-Path $GitTarget)) {
        Write-Log "FEHLER: Konnte Repository nicht klonen. Update abgebrochen." "Red"
        Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}


# --- 2. BACKUP & SELF-HEALING VORBEREITUNG ---
Write-Log "`n[1/6] Erstelle Sicherheitskopien (Self-Healing)..." "Cyan"
Set-Progress 2 "Erstelle Sicherheitskopien für automatisierten Rollback..."
$FrontendLive = Join-Path $DestComponents "trading-cockpit"
$MCLive = Join-Path $DestComponents "management-console"
$BackupDir = Join-Path $TargetDir ".backup"
if (Test-Path $BackupDir) { Remove-Item -Path $BackupDir -Recurse -Force }
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

if (Test-Path $BackendLive) { Copy-Item -Path $BackendLive -Destination $BackupDir -Recurse -Force }
if (Test-Path $FrontendLive) { Copy-Item -Path $FrontendLive -Destination $BackupDir -Recurse -Force }
if (Test-Path $MCLive) { Copy-Item -Path $MCLive -Destination $BackupDir -Recurse -Force }
Write-Log "  -> Core-Komponenten erfolgreich nach .backup gesichert." "Green"


# --- 3. GIT PULL ---
Write-Log "`n[2/6] Lade Updates aus GitHub herunter..." "Cyan"
Set-Progress 3 "Lade aktuelle Updates von GitHub herunter..."
Set-Location $GitTarget
if (-not [string]::IsNullOrWhiteSpace($GithubPat)) {
    $RepoUrl = "https://$GithubPat@github.com/mktradersmc/MSMTB.git"
    git remote set-url origin $RepoUrl
}

git fetch origin main 2>&1 | Out-File -Append -FilePath $LogFile
git reset --hard origin/main 2>&1 | Out-File -Append -FilePath $LogFile
if ($LASTEXITCODE -ne 0) {
    Write-Log "FEHLER beim Git Pull. Breche Update ab." "Red"
    Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# --- 4. DATEI PROPAGATION ---
Write-Log "`n[3/6] Kopiere neue Dateiversionen..." "Cyan"
Set-Progress 4 "Dienste werden gestoppt, um Dateien zu übertragen..."
Write-Log "  -> Beende PM2 Dienste zur Freigabe exklusiver Dateisperren (Datenbanken)..." "Gray"
pm2 stop all 2>&1 | Out-File -Append -FilePath $LogFile

# STARTE UPDATE REPORTER (Übernimmt temporär Port 3005 für das UI Frontend)
Write-Log "  -> Starte temporären Update-Reporter auf Port 3005..." "Gray"
$ReporterScript = Join-Path $TargetDir "scripts\update-reporter.js"
Start-Process node -ArgumentList "`"$ReporterScript`"" -WindowStyle Hidden

Set-Progress 5 "Kopiere aktualisierte Backend- und Frontend-Dateien..."

$RootSrcBackend = Join-Path $GitTarget "src\market-data-core"
$RootSrcFrontend = Join-Path $GitTarget "src\trading-cockpit"
$RootSrcMC = Join-Path $GitTarget "src\management-console"
$RootScripts = Join-Path $GitTarget "scripts"
$RootMetaTraderMaster = Join-Path $GitTarget "ressources\metatrader\master"
$RootNinjaTraderMaster = Join-Path $GitTarget "ressources\ninjatrader\master"

# Nutze Robocopy für intelligentes Kopieren ohne User-Daten zu zerstören
$BackendDest = Join-Path $DestComponents "market-data-core"
$FrontendDest = Join-Path $DestComponents "trading-cockpit"
$MCDest = Join-Path $DestComponents "management-console"

if (Test-Path $RootSrcBackend) {
    Write-Log "  -> Integriere Backend Updates (sichere data/, logs/, certs/ und .env)..." "Yellow"
    robocopy $RootSrcBackend $BackendDest /E /Z /R:3 /W:1 /XD "data" "logs" "node_modules" "certs" /XF ".env" "*.db*" "*.db-shm" "*.db-wal" > $null
    if ($LASTEXITCODE -ge 8) { Write-Log "     WARNUNG: Robocopy Fehler bei Backend Propagation (Exit-Code: $LASTEXITCODE)." "Yellow" }
}

if (Test-Path $RootSrcFrontend) {
    Write-Log "  -> Integriere Frontend Updates (sichere logs/ und .env)..." "Yellow"
    robocopy $RootSrcFrontend $FrontendDest /E /Z /R:3 /W:1 /XD "logs" "node_modules" /XF ".env" > $null
    if ($LASTEXITCODE -ge 8) { Write-Log "     WARNUNG: Robocopy Fehler bei Frontend Propagation (Exit-Code: $LASTEXITCODE)." "Yellow" }
}

if (Test-Path $RootSrcMC) {
    Write-Log "  -> Integriere Management Console Updates (sichere logs/)..." "Yellow"
    robocopy $RootSrcMC $MCDest /E /Z /R:3 /W:1 /XD "node_modules" "logs" /XF ".env" > $null
    if ($LASTEXITCODE -ge 8) { Write-Log "     WARNUNG: Robocopy Fehler bei Management Console Propagation (Exit-Code: $LASTEXITCODE)." "Yellow" }
}
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }


# --- 5. METATRADER UPDATE LOGIC ---
Write-Log "`n[4/6] Verarbeite MetaTrader Updates..." "Cyan"
Set-Progress 6 "Verarbeite MetaTrader und NinjaTrader Templates..."
if (Test-Path $RootMetaTraderMaster) {
    # Update Master Template
    $MetaDist = Join-Path $DestComponents "metatrader"
    if (-not (Test-Path $MetaDist)) { New-Item -ItemType Directory -Path $MetaDist -Force | Out-Null }
    
    Write-Log "  -> Aktualisiere MetaTrader Master-Verzeichnis..." "Yellow"
    Copy-Item -Path $RootMetaTraderMaster -Destination $MetaDist -Recurse -Force 

    # Propagate to all active instances
    $InstancesDir = Join-Path $MetaDist "instances"
    if (Test-Path $InstancesDir) {
        $Instances = Get-ChildItem -Path $InstancesDir -Directory
        foreach ($Instance in $Instances) {
            Write-Log "  -> Injiziere Updates in MetaTrader Instanz: $($Instance.Name)" "Yellow"
            
            if ($RestartInstances -eq "True") {
                Write-Log "     -> Beende terminal64.exe (PID/Pfad bezogen) für den Neustart..." "Gray"
                # Stop specific process mapped to this instance path
                $terminals = Get-WmiObject Win32_Process -Filter "name='terminal64.exe'"
                foreach ($t in $terminals) {
                    if ($t.CommandLine -match $Instance.FullName) {
                        Stop-Process -Id $t.ProcessId -Force -ErrorAction SilentlyContinue
                    }
                }
            }

            # Copy MQL5 templates over the instance safely
            $Mql5Source = Join-Path $RootMetaTraderMaster "MQL5"
            $InstanceRoot = $Instance.FullName
            if (Test-Path $Mql5Source) {
                # Copy MQL5 contents to the instance
                Copy-Item -Path $Mql5Source -Destination $InstanceRoot -Recurse -Force
            }
        }
    }
}


# --- 6. NINJATRADER UPDATE LOGIC ---
Write-Log "`n[5/6] Verarbeite NinjaTrader Updates..." "Cyan"
if (Test-Path $RootNinjaTraderMaster) {
    $Nt8DocsDir = Join-Path $env:USERPROFILE "Documents\NinjaTrader 8"
    if (Test-Path $Nt8DocsDir) {
        Write-Log "  -> Aktualisiere NinjaTrader Dokumenten-Verzeichnis..." "Yellow"
        
        if ($RestartInstances -eq "True") {
            Write-Log "     -> Beende NinjaTrader.exe..." "Gray"
            Stop-Process -Name "NinjaTrader" -Force -ErrorAction SilentlyContinue
        }

        $NinjaBin = Join-Path $RootNinjaTraderMaster "bin"
        $NinjaWorkspaces = Join-Path $RootNinjaTraderMaster "workspaces"
        if (Test-Path $NinjaBin) { Copy-Item -Path $NinjaBin -Destination $Nt8DocsDir -Recurse -Force }
        if (Test-Path $NinjaWorkspaces) { Copy-Item -Path $NinjaWorkspaces -Destination $Nt8DocsDir -Recurse -Force }
    }
}


# --- 7. NPM BUILD & ROLLBACK LOGIC ---
Write-Log "`n[6/6] Kompiliere Web-Applikation und starte Dienste neu..." "Cyan"
Set-Progress 7 "Kompiliere das Cockpit-Frontend (Dies dauert in der Regel 1 bis 3 Minuten)..."
try {
    Write-Log "  -> Prüfe Systemkonfiguration (SSL & .env)..." "Cyan"
    $PfxFile = Join-Path $TargetDir "certs\server.pfx"
    if (-not (Test-Path $PfxFile)) {
        Write-Log "     WARNUNG: SSL-Zertifikat fehlt. Generiere neues Zertifikat..." "Yellow"
        $SslScriptPath = Join-Path $TargetDir "scripts\generate-ssl.ps1"
        if (Test-Path $SslScriptPath) {
            & $SslScriptPath -DomainName "localhost", "127.0.0.1" -Password "cockpit" *>> $LogFile
        }
    }

    $FrontendEnvPath = Join-Path $FrontendLive ".env.production"
    if (-not (Test-Path $FrontendEnvPath)) {
        Write-Log "     WARNUNG: Frontend .env fehlt. Lese compileMode aus system.json..." "Yellow"
        
        $CompileMode = "legacy" # Safe default for CPU compatibility
        $SystemJsonPath = Join-Path $TargetDir "components\market-data-core\data\system.json"
        if (Test-Path $SystemJsonPath) {
            $sysJson = Get-Content $SystemJsonPath | ConvertFrom-Json
            if ($sysJson.compileMode) { $CompileMode = $sysJson.compileMode }
        }

        Set-Content -Path $FrontendEnvPath -Value "NEXT_COMPILER_MODE=$CompileMode" -Force
        
        if ($CompileMode -eq "legacy") {
            Write-Log "     -> Generiere fehlende .babelrc für Legacy Compiler..." "Gray"
            $BabelRcPath = Join-Path $FrontendLive ".babelrc"
            $BabelRcContent = @'
{
  "presets": ["next/babel"]
}
'@
            Set-Content -Path $BabelRcPath -Value $BabelRcContent -Force
        }
    }
    Write-Log "  -> Rebuild Backend..." "Gray"
    Push-Location $BackendLive
    npm install --silent 2>&1 | Out-File -Append -FilePath $LogFile
    Pop-Location

    Write-Log "  -> Rebuild Frontend..." "Gray"
    Push-Location $FrontendLive
    npm install --silent 2>&1 | Out-File -Append -FilePath $LogFile
    
    # We capture build errors correctly to trigger self-healing
    $buildEnv = Get-ChildItem Env: | Out-String
    $buildStatus = npm run build 2>&1
    $buildStatus | Out-File -Append -FilePath $LogFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend NPM Build fehlgeschlagen. Rollback erforderlich!"
    }
    Pop-Location

    Write-Log "  -> Rebuild Management Console..." "Gray"
    if (Test-Path $MCLive) {
        Push-Location $MCLive
        if (Test-Path "package.json") { npm install --silent 2>&1 | Out-File -Append -FilePath $LogFile }
        
        $MCFrontend = Join-Path $MCLive "frontend"
        if (Test-Path $MCFrontend) {
            Push-Location $MCFrontend
            if (Test-Path "package.json") { 
                npm install --silent 2>&1 | Out-File -Append -FilePath $LogFile 
                $mcBuildStatus = npm run build 2>&1
                $mcBuildStatus | Out-File -Append -FilePath $LogFile
                if ($LASTEXITCODE -ne 0) { throw "Management Console NPM Build fehlgeschlagen. Rollback erforderlich!" }
            }
            Pop-Location
        }
        Pop-Location
    }

    Set-Progress 8 "Starte neue System-Version live..."
    Write-Log "  -> Starte PM2 Prozesse neu..." "Green"
    
    # Beende temporären Reporter vor dem Port-Bezug durch Backend
    $reporters = Get-WmiObject Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match "update-reporter.js" }
    foreach ($r in $reporters) { Stop-Process -Id $r.ProcessId -Force -ErrorAction SilentlyContinue }

    pm2 start all 2>&1 | Out-File -Append -FilePath $LogFile
    
    Set-Progress 9 "Fertig"

    Write-Log "`n[OK] UPDATE ERFOLGREICH ABGESCHLOSSEN!" "Green"
}
catch {
    # SELF-HEALING ROLLBACK TRIPPED
    Write-Log "`n[X] KRITISCHER FEHLER BEIM BUILD: $($_.Exception.Message)" "Red"
    Write-Log "  -> LÖSE SELF-HEALING ROLLBACK AUS..." "Yellow"
    Pop-Location # Ensure we are out

    # Restore from .backup without destroying data
    $BackupBackend = Join-Path $BackupDir "market-data-core"
    $BackupFrontend = Join-Path $BackupDir "trading-cockpit"
    $BackupMC = Join-Path $BackupDir "management-console"

    if (Test-Path $BackupBackend) {
        robocopy $BackupBackend $BackendLive /E /Z /R:3 /W:1 /XD "data" "logs" "node_modules" "certs" /XF ".env" "*.db*" "*.db-shm" "*.db-wal" > $null
    }
    if (Test-Path $BackupFrontend) {
        robocopy $BackupFrontend $FrontendLive /E /Z /R:3 /W:1 /XD "logs" "node_modules" /XF ".env" > $null
    }
    if (Test-Path $BackupMC) {
        robocopy $BackupMC $MCLive /E /Z /R:3 /W:1 /XD "logs" "node_modules" /XF ".env" > $null
    }

    Write-Log "  -> Ursprüngliche Version aus Backup wiederhergestellt." "Cyan"
    Write-Log "  -> Starte PM2 Prozesse mit funktionsfähiger Version..." "Cyan"
    
    Set-Progress -1 "FEHLER: Build abgebrochen. System-Rollback durchgeführt."

    $reporters = Get-WmiObject Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match "update-reporter.js" }
    foreach ($r in $reporters) { Stop-Process -Id $r.ProcessId -Force -ErrorAction SilentlyContinue }

    pm2 start all 2>&1 | Out-File -Append -FilePath $LogFile

    Write-Log "`n[!] Update wurde abgebrochen, aber das System läuft sicher weiter." "Yellow"
}

# Die Backup-Ordner werden ab sofort NICHT mehr gelöscht, um dem Benutzer
# jederzeit einen manuellen Rollback (via rollback.ps1) zu ermöglichen.
Write-Log "  -> Ein lauffähiges Backup der vorherigen Version wurde sicher in $BackupDir aufbewahrt." "Gray"

Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
