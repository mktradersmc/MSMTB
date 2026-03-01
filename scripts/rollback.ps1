param(
    [string]$TargetDir = "C:\awesome-cockpit"
)

$LogDir = Join-Path $TargetDir "logs"
$LogFile = Join-Path $LogDir "rollback.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [ROLLBACK] $Message"
    Add-Content -Path $LogFile -Value $LogMsg
    Write-Host $Message -ForegroundColor $Color
}

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte (fuer Windows Dienste und Backups). Fordere UAC an..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Log "=========================================" "Cyan"
Write-Log "   STARTE MANUELLEN ROLLBACK PROZESS     " "Cyan"
Write-Log "=========================================" "Cyan"

$BackupDir = Join-Path $TargetDir ".backup"
if (-not (Test-Path $BackupDir)) {
    Write-Log "FEHLER: Kein Backup-Verzeichnis gefunden unter $BackupDir." "Red"
    Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$DestComponents = Join-Path $TargetDir "components"
$BackendLive = Join-Path $DestComponents "market-data-core"
$FrontendLive = Join-Path $DestComponents "trading-cockpit"

Write-Log "  -> Beende PM2 Dienste zur Freigabe exklusiver Dateisperren (Datenbanken)..." "Gray"
pm2 stop all 2>&1 | Out-File -Append -FilePath $LogFile

# Restore from .backup without destroying data
$BackupBackend = Join-Path $BackupDir "market-data-core"
$BackupFrontend = Join-Path $BackupDir "trading-cockpit"

Write-Log "  -> Spiele gesichertes Backend ein..." "Yellow"
if (Test-Path $BackupBackend) {
    robocopy $BackupBackend $BackendLive /E /Z /R:3 /W:1 /XD "data" "logs" "node_modules" "certs" /XF ".env" "*.db*" "*.db-shm" "*.db-wal" > $null
    if ($LASTEXITCODE -ge 8) { Write-Log "     WARNUNG: Robocopy Fehler bei Backend Rollback (Exit-Code: $LASTEXITCODE)." "Yellow" }
}

Write-Log "  -> Spiele gesichertes Frontend ein..." "Yellow"
if (Test-Path $BackupFrontend) {
    robocopy $BackupFrontend $FrontendLive /E /Z /R:3 /W:1 /XD "logs" "node_modules" /XF ".env" > $null
    if ($LASTEXITCODE -ge 8) { Write-Log "     WARNUNG: Robocopy Fehler bei Frontend Rollback (Exit-Code: $LASTEXITCODE)." "Yellow" }
}

Write-Log "  -> Ursprüngliche Version aus Backup wiederhergestellt." "Cyan"
Write-Log "  -> Starte PM2 Prozesse mit funktionsfähiger Version..." "Cyan"
pm2 start all 2>&1 | Out-File -Append -FilePath $LogFile

Write-Log "`n[OK] ROLLBACK ERFOLGREICH ABGESCHLOSSEN!" "Green"

Write-Host "Druecke eine beliebige Taste zum Beenden..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
