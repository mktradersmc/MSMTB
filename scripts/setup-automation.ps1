[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', '')]
param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [string]$WindowsPassword = ""
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte. Fordere UAC an..." -ForegroundColor Yellow
    
    # We pass the password safely if possible, but UAC breaks variables easily. So if it's restarted, it will ask again.
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -TargetDir `"$TargetDir`"" -Verb RunAs
    exit
}

$LogDir = Join-Path $TargetDir "logs"
$LogFile = Join-Path $LogDir "setup-automation.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMsg = "[$Timestamp] [AUTOMATION] $Message"
    Add-Content -Path $LogFile -Value $LogMsg -Encoding utf8
    Write-Host $Message -ForegroundColor $Color
}

Write-Log "=========================================" "Cyan"
Write-Log "   Headless UI Automation Setup          " "Cyan"
Write-Log "=========================================" "Cyan"

if ([string]::IsNullOrWhiteSpace($WindowsPassword)) {
    Write-Log "Fordere Windows-Kennwort fuer Autologon an..." "Yellow"
    $secpasswd = Read-Host "Bitte gib das Windows-Kennwort fuer '$env:USERNAME' ein" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secpasswd)
    $WindowsPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

if ([string]::IsNullOrWhiteSpace($WindowsPassword)) {
    Write-Log "Kein Kennwort eingegeben. AutoLogon kann nicht konfiguriert werden. Abbruch." "Red"
    Start-Sleep -Seconds 3
    exit 1
}

# 1. AutoLogon
Write-Log "`n[1/4] Konfiguriere Sysinternals AutoLogon..." "Cyan"
$AutoLogonUrl = "https://live.sysinternals.com/Autologon64.exe"
$AutoLogonPath = Join-Path $env:TEMP "Autologon64.exe"

try {
    Invoke-WebRequest -Uri $AutoLogonUrl -OutFile $AutoLogonPath -UseBasicParsing
    
    Write-Log "  Führe Autologon durch (Verschluesselung in LSA)..." "Gray"
    $Domain = if ([string]::IsNullOrWhiteSpace($env:USERDOMAIN)) { "." } else { $env:USERDOMAIN }
    $proc = Start-Process -FilePath $AutoLogonPath -ArgumentList "`"$env:USERNAME`" `"$Domain`" `"$WindowsPassword`" /accepteula" -Wait -PassThru -WindowStyle Hidden
    
    if ($proc.ExitCode -eq 0 -or $proc.ExitCode -eq 1) {
        Write-Log "  AutoLogon erfolgreich eingerichtet." "Green"
    }
    else {
        Write-Log "  Sysinternals Autologon meldet ExitCode: $($proc.ExitCode)." "Yellow"
    }
}
catch {
    Write-Log "  FEHLER bei AutoLogon Konfiguration: $($_.Exception.Message)" "Red"
}


# 2. IddaCX (Idempotent)
Write-Log "`n[2/4] Installiere Virtual Display Driver (IddaCX)..." "Cyan"
$DriverDir = Join-Path $TargetDir "components\virtual-display"

# IDEMPOTENCY CHECK
$driverList = pnputil /enum-devices /class Display
if ($driverList -match "IddSampleDriver") {
    Write-Log "  Virtual Display Driver (IddSampleDriver) ist bereits installiert! Ueberspringe Neu-Installation." "Green"
}
else {
    if (-not (Test-Path $DriverDir)) { New-Item -ItemType Directory -Path $DriverDir -Force | Out-Null }
    
    Write-Log "  Lade aktuelles IddSampleDriver Release von GitHub herunter..." "Gray"
    $ZipPath = Join-Path $env:TEMP "IddSampleDriver.zip"
    Invoke-WebRequest -Uri "https://github.com/ge9/IddSampleDriver/releases/latest/download/IddSampleDriver.zip" -OutFile $ZipPath -UseBasicParsing
    
    Write-Log "  Entpacke Treiber..." "Gray"
    Expand-Archive -Path $ZipPath -DestinationPath $DriverDir -Force
    
    $CertPath = Join-Path $DriverDir "IddSampleDriver.cer"
    if (Test-Path $CertPath) {
        Write-Log "  Installiere Trust-Zertifikat im Publisher Store..." "Yellow"
        Import-Certificate -FilePath $CertPath -CertStoreLocation Cert:\LocalMachine\TrustedPublisher | Out-Null
    }

    Write-Log "  Erstelle 1920x1080 Monitor Hardware-Profil (option.txt)..." "Gray"
    $OptionTxt = Join-Path $DriverDir "option.txt"
    Set-Content -Path $OptionTxt -Value "1`n1920, 1080, 60" -Encoding ascii
    
    Write-Log "  Installiere Grafiktreiber im System (devcon)..." "Yellow"
    Push-Location $DriverDir
    $InstallProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c install.bat" -Wait -PassThru -WindowStyle Hidden
    Pop-Location
    
    if ($InstallProc.ExitCode -eq 0) {
        Write-Log "  Virtueller Monitor erfolgreich eingebunden." "Green"
    }
    else {
        Write-Log "  WARNUNG: devcon (install.bat) ExitCode: $($InstallProc.ExitCode)." "Yellow"
    }
}

# 3. RDP Anti-Lock
Write-Log "`n[3/4] Konfiguriere GUI-Rendering und RDP-Disconnect Button..." "Cyan"

$RegPath = "HKLM:\Software\Microsoft\Terminal Server Client"
if (-not (Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }
Set-ItemProperty -Path $RegPath -Name "RemoteDesktop_SuppressWhenMinimized" -Value 2 -Type DWord

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$DisconnectBat = Join-Path $DesktopPath "🚀 RDP Sicher Verlassen.bat"

$BatContent = @"
@echo off
color 0b
echo ========================================================
echo SERVER-SICHERE TRENNUNG WIRD AUSGEFUEHRT...
echo ========================================================
echo.
echo Ihre RDP-Sitzung wird auf die unsichtbare Hardware-Konsole verschoben.
echo GUI-Automatisierungen (.z.B. MetaTrader) rendern danach fehlerfrei weiter.
echo Dieses Fenster schliesst sich nun.
echo.
timeout /t 3 /nobreak >nul
for /f "tokens=3" %%s in ('query user %USERNAME% ^| findstr /i "Active"') do set SESSIONID=%%s
tscon %SESSIONID% /dest:console
"@
Set-Content -Path $DisconnectBat -Value $BatContent -Encoding ascii
Write-Log "  Desktop-Verknuepfung ($DisconnectBat) erstellt." "Green"


# 4. Power & LockScreen
Write-Log "`n[4/4] Optimiere Windows-Energie- und Sperreinstellungen..." "Cyan"
powercfg -change -monitor-timeout-ac 0
powercfg -change -standby-timeout-ac 0
powercfg -setactive SCHEME_MIN

$PolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization"
if (-not (Test-Path $PolicyPath)) { New-Item -Path $PolicyPath -Force | Out-Null }
Set-ItemProperty -Path $PolicyPath -Name "NoLockScreen" -Value 1 -Type DWord

Write-Log "`n=========================================" "Green"
Write-Log "   SETUP ERFOLGREICH BEENDET  " "Green"
Write-Log "=========================================" "Green"
Write-Log "Nutze kuenftig nur noch das rote Icon auf dem Desktop fuer RDP-Disconnects!" "Yellow"

Start-Sleep -Seconds 2
