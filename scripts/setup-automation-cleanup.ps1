param(
    [string]$TargetDir = "C:\awesome-cockpit"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte. Fordere UAC an..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -TargetDir `"$TargetDir`"" -Verb RunAs
    exit
}

$LogDir = Join-Path $TargetDir "logs"
$LogFile = Join-Path $LogDir "setup-automation-cleanup.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [CLEANUP] $Message"
    Add-Content -Path $LogFile -Value $LogMsg -Encoding utf8
    Write-Host $Message -ForegroundColor $Color
}

Write-Log "=========================================" "Yellow"
Write-Log "   Headless UI Automation CLEANUP        " "Yellow"
Write-Log "=========================================" "Yellow"

# 1. Autologon entfernen
Write-Log "`n[1/3] Entferne Autologon Konfiguration..." "Cyan"
$RegAutologon = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
try {
    if ((Get-ItemProperty -Path $RegAutologon -Name "AutoAdminLogon" -ErrorAction SilentlyContinue)) {
        Set-ItemProperty -Path $RegAutologon -Name "AutoAdminLogon" -Value "0"
        Remove-ItemProperty -Path $RegAutologon -Name "DefaultUserName" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $RegAutologon -Name "DefaultDomainName" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $RegAutologon -Name "DefaultPassword" -ErrorAction SilentlyContinue
        Write-Log "  Autologon aus Registry entfernt." "Green"
    }
    else {
        Write-Log "  Kein Autologon aktiv." "Gray"
    }
}
catch {
    Write-Log "  Fehler beim Entfernen des Autologons: $($_.Exception.Message)" "Red"
}


# 2. Virtual Display Treiber entfernen
Write-Log "`n[2/3] Deinstalliere Virtual Display Driver (IddaCX)..." "Cyan"

$DriverDir = Join-Path $TargetDir "components\virtual-display"
if (Test-Path (Join-Path $DriverDir "uninstall.bat")) {
    Push-Location $DriverDir
    Write-Log "  Fuehre uninstall.bat aus dem Treiber-Verzeichnis aus..." "Gray"
    $UninstallProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c uninstall.bat" -Wait -PassThru -WindowStyle Hidden
    Pop-Location
}

Write-Log "  Bereinige geraetespezifische Treiber im DriverStore (PnP-Fallback)..." "Gray"
try {
    $oemDrivers = pnputil /enum-drivers
    $currentOem = ""
    $foundOems = @()
    $oemDrivers -split "`n" | ForEach-Object {
        if ($_ -match "Veröffentlichter Name:\s+(oem\d+\.inf)") {
            $currentOem = $matches[1]
        }
        if ($_ -match "Published Name:\s+(oem\d+\.inf)") {
            $currentOem = $matches[1]
        }
        if ($_ -match "Originalname:\s+iddsampledriver\.inf" -or $_ -match "Original Name:\s+iddsampledriver\.inf") {
            if ($currentOem) { $foundOems += $currentOem }
        }
    }

    foreach ($oem in $foundOems) {
        Write-Log "  Loesche inf-Datei: $oem..." "Yellow"
        pnputil /delete-driver $oem /uninstall /force | Out-Null
    }
    Write-Log "  Treiber im System ueberprueft/bereinigt." "Green"
}
catch {
    Write-Log "  Fehler beim PnP Cleanup: $($_.Exception.Message)" "Yellow"
}

if (Test-Path $DriverDir) {
    Remove-Item -Path $DriverDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "  Treiber-Verzeichnis $DriverDir geloescht." "Green"
}


# 3. Disconnect-Button entfernen
Write-Log "`n[3/3] Entferne Disconnect-Button vom Desktop..." "Cyan"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$DisconnectBat = Join-Path $DesktopPath "🚀 RDP Sicher Verlassen.bat"

if (Test-Path $DisconnectBat) {
    Remove-Item -Path $DisconnectBat -Force
    Write-Log "  Desktop-Icon entfernt." "Green"
}
else {
    Write-Log "  Kein Desktop-Icon gefunden." "Gray"
}

Write-Log "`n=========================================" "Green"
Write-Log "   CLEANUP ERFOLGREICH BEENDET  " "Green"
Write-Log "=========================================" "Green"
Write-Log "Der Server befindet sich wieder im Standard-Zustand." "Yellow"

Start-Sleep -Seconds 3
