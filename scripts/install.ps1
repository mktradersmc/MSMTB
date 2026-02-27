param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$RepoUrl = "https://github.com/mktradersmc/MSMTB.git",  # MUSS VOM NUTZER ANGEPASST WERDEN
    [string]$Branch = "main"
)

# 0. Logging Initialisieren
$LogFile = Join-Path $TargetDir "install.log"
if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir | Out-Null }
else { Clear-Content -Path $LogFile -ErrorAction SilentlyContinue } # Log reset on new bootstrap

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [BOOT] $Message"
    Add-Content -Path $LogFile -Value $LogMsg
    Write-Host $Message -ForegroundColor $Color
}

Write-Log "=========================================" "Cyan"
Write-Log "   Awesome Cockpit Plattform Installer   " "Cyan"
Write-Log "=========================================" "Cyan"
Write-Log "Logdatei: $LogFile" "Gray"

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Log "Das Skript benoetigt Administratorrechte. Fordere UAC an..." "Yellow"
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# 2. Interaktive Abfragen (PAT)
Write-Log "`n[1/3] Konfiguration abfragen..." "Cyan"

$GithubPAT = "DEIN_GITHUB_PAT_HIER_EINTRAGEN" # <--- HIER DEINEN PAT EINTRAGEN

if ($GithubPAT -eq "DEIN_GITHUB_PAT_HIER_EINTRAGEN" -or [string]::IsNullOrWhiteSpace($GithubPAT)) {
    $GithubPAT = Read-Host "Bitte gib deinen GitHub Personal Access Token (PAT) ein (fuer private Repos)"
    if ([string]::IsNullOrWhiteSpace($GithubPAT)) {
        Write-Log "Kein PAT eingegeben. Abbruch." "Red"
        Pause; exit
    }
} else {
    Write-Log "GitHub PAT aus Skript-Konfiguration geladen." "Green"
}

# 3. System-Abhängigkeiten installieren (Git)
Write-Log "`n[2/3] System-Abhaengigkeiten pruefen (Git)..." "Cyan"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Log "  Git nicht gefunden. Installiere via winget..." "Yellow"
    winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements | Out-File -Append -FilePath $LogFile
    $env:Path += ";C:\Program Files\Git\cmd"
} else {
    Write-Log "  Git ist bereits installiert." "Green"
}


# 4. Klonen des Repositories
Write-Log "`n[3/3] Quellcode herunterladen und an setup.ps1 uebergeben..." "Cyan"

$AuthRepoUrl = $RepoUrl -replace "https://", "https://$GithubPAT@"
$GitTarget = Join-Path $TargetDir "_github"

if (Test-Path $GitTarget) {
    Write-Log "  Lösche altes _github Verzeichnis..." "Gray"
    Remove-Item -Path $GitTarget -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Log "  Klone Repository nach $GitTarget..." "Cyan"
git clone -b $Branch $AuthRepoUrl $GitTarget 2>&1 | Out-File -Append -FilePath $LogFile
if ($LASTEXITCODE -ne 0) {
    Write-Log "  Fehler beim Klonen des Repositories! PAT oder Internetverbindung pruefen. (Siehe $LogFile)" "Red"
    Pause; exit
}

# 5. Applikations-Setup delegieren
$SetupScript = Join-Path $GitTarget "scripts\setup.ps1"
if (-not (Test-Path $SetupScript)) {
    Write-Log "  Fehler: setup.ps1 im Repository nicht gefunden! Ist der Branch aktuell?" "Red"
    Pause; exit
}

Write-Log "  Starte dynamisches Applikations-Setup ($SetupScript)..." "Yellow"

# Aufruf von Setup.ps1
& $SetupScript -TargetDir $TargetDir

# Da setup.ps1 bereits ein Wait hat, lassen wir das hier enden,
# oder falls wir hierhin zurückkehren, warten wir nur im Fehlerfall nochmal.
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBootstrapper endete mit Return-Code: $LASTEXITCODE" -ForegroundColor Red
    Pause
}
