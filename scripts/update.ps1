param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$RestartInstances = "False"
)

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte (fuer Windows Dienste und Backups). Fordere UAC an..." -ForegroundColor Yellow
    # CRITICAL FIX: Convert parameter to simple string wrapper to prevent System.Boolean parser crashes
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`" -RestartInstances `"$RestartInstances`"" -Verb RunAs
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
    } catch {}
}

$GitTarget = Join-Path $env:TEMP "_github_msmtb"
if (-not (Test-Path $GitTarget)) {
    Write-Log "Temporäres Repository Verzeichnis nicht gefunden. Klone initial..." "Yellow"
    
    $AuthRepoUrl = "https://github.com/mktradersmc/MSMTB.git"
    if (-not [string]::IsNullOrWhiteSpace($GithubPat)) {
        $AuthRepoUrl = "https://$GithubPat@github.com/mktradersmc/MSMTB.git"
    } else {
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
$FrontendLive = Join-Path $DestComponents "trading-cockpit"
$BackupDir = Join-Path $TargetDir ".backup"
if (Test-Path $BackupDir) { Remove-Item -Path $BackupDir -Recurse -Force }
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

if (Test-Path $BackendLive) { Copy-Item -Path $BackendLive -Destination $BackupDir -Recurse -Force }
if (Test-Path $FrontendLive) { Copy-Item -Path $FrontendLive -Destination $BackupDir -Recurse -Force }
Write-Log "  -> Core-Komponenten erfolgreich nach .backup gesichert." "Green"


# --- 3. GIT PULL ---
Write-Log "`n[2/6] Lade Updates aus GitHub herunter..." "Cyan"
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
Write-Log "  -> Beende PM2 Dienste zur Freigabe exklusiver Dateisperren (Datenbanken)..." "Gray"
pm2 stop all 2>&1 | Out-File -Append -FilePath $LogFile

$RootSrcBackend = Join-Path $GitTarget "src\market-data-core"
$RootSrcFrontend = Join-Path $GitTarget "src\trading-cockpit"
$RootScripts = Join-Path $GitTarget "scripts"
$RootMetaTraderMaster = Join-Path $GitTarget "ressources\metatrader\master"
$RootNinjaTraderMaster = Join-Path $GitTarget "ressources\ninjatrader\master"

if (Test-Path $RootSrcBackend) { Copy-Item -Path $RootSrcBackend -Destination $DestComponents -Recurse -Force }
if (Test-Path $RootSrcFrontend) { Copy-Item -Path $RootSrcFrontend -Destination $DestComponents -Recurse -Force }
if (Test-Path $RootScripts) { Copy-Item -Path $RootScripts -Destination $TargetDir -Recurse -Force }


# --- 5. METATRADER UPDATE LOGIC ---
Write-Log "`n[4/6] Verarbeite MetaTrader Updates..." "Cyan"
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
try {
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

    Write-Log "  -> Starte PM2 Prozesse neu..." "Green"
    pm2 start all 2>&1 | Out-File -Append -FilePath $LogFile

    Write-Log "`n[OK] UPDATE ERFOLGREICH ABGESCHLOSSEN!" "Green"
} catch {
    # SELF-HEALING ROLLBACK TRIPPED
    Write-Log "`n[X] KRITISCHER FEHLER BEIM BUILD: $($_.Exception.Message)" "Red"
    Write-Log "  -> LÖSE SELF-HEALING ROLLBACK AUS..." "Yellow"
    Pop-Location # Ensure we are out

    # Restore from .backup
    Remove-Item -Path $BackendLive -Recurse -Force
    Remove-Item -Path $FrontendLive -Recurse -Force

    $BackupBackend = Join-Path $BackupDir "market-data-core"
    $BackupFrontend = Join-Path $BackupDir "trading-cockpit"

    Copy-Item -Path $BackupBackend -Destination $DestComponents -Recurse -Force
    Copy-Item -Path $BackupFrontend -Destination $DestComponents -Recurse -Force

    Write-Log "  -> Ursprüngliche Version aus Backup wiederhergestellt." "Cyan"
    Write-Log "  -> Starte PM2 Prozesse mit funktionsfähiger Version..." "Cyan"
    pm2 start all 2>&1 | Out-File -Append -FilePath $LogFile

    Write-Log "`n[!] Update wurde abgebrochen, aber das System läuft sicher weiter." "Yellow"
}

# Cleanup Backup
if (Test-Path $BackupDir) { Remove-Item -Path $BackupDir -Recurse -Force }

Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
