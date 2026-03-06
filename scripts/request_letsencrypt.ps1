param (
    [Parameter(Mandatory = $true)]
    [string]$Domain,
    [Parameter(Mandatory = $true)]
    [string]$Email
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$OutputLog = Join-Path $ProjectRoot "logs\ssl-progress.json"
$TranscriptLog = Join-Path $ProjectRoot "logs\ssl-transcript.log"

if (-not (Test-Path (Join-Path $ProjectRoot "logs"))) {
    New-Item -ItemType Directory -Path (Join-Path $ProjectRoot "logs") | Out-Null
}

Start-Transcript -Path $TranscriptLog -Force

function Write-Progress {
    param([int]$Step, [string]$Text, [int]$Total = 6)
    $data = @{ step = $Step; text = $Text; total = $Total }
    $json = $data | ConvertTo-Json -Compress
    # Write UTF-8 encoding specifically without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding($False)
    [System.IO.File]::WriteAllText($OutputLog, $json, $utf8NoBom)
}

Write-Progress 1 "Prüfe Voraussetzungen für win-acme..."

$UtilsPath = Join-Path $ProjectRoot "utils"
$WacsDir = Join-Path $UtilsPath "win-acme"
$WacsExe = Join-Path $WacsDir "wacs.exe"
$CertsDir = Join-Path $ProjectRoot "certs"

if (-not (Test-Path -Path $UtilsPath)) {
    New-Item -ItemType Directory -Path $UtilsPath | Out-Null
}

if (-not (Test-Path -Path $WacsExe)) {
    Write-Progress 2 "Lade win-acme herunter..."
    $WacsZip = Join-Path $UtilsPath "win-acme.zip"
    Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/download/v2.2.8.1635/win-acme.v2.2.8.1635.x64.pluggable.zip" -OutFile $WacsZip
    
    Write-Progress 3 "Entpacke win-acme..."
    Expand-Archive -Path $WacsZip -DestinationPath $WacsDir -Force
    Remove-Item $WacsZip
}
else {
    Write-Progress 3 "win-acme ist bereits installiert."
}

Write-Progress 4 "Konfiguriere temporäre Firewall-Freigabe für Port 80..."
$FirewallRuleName = "AwesomeCockpit_LetsEncrypt_Temp"
$RuleExists = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue

if (-not $RuleExists) {
    New-NetFirewallRule -DisplayName $FirewallRuleName -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow | Out-Null
}

Write-Progress 5 "Starte Zertifikatsgenerierung für $Domain ..."

$WacsArgs = @(
    "--source", "manual",
    "--host", $Domain,
    "--validation", "selfhosting",
    "--store", "pemfiles,pfxfile",
    "--pemfilespath", $CertsDir,
    "--pfxfilepath", $CertsDir,
    "--pfxpassword", "cockpit",
    "--installation", "none",
    "--accepttos",
    "--emailaddress", $Email,
    "--force",
    "--nocache"
)

try {
    $process = Start-Process -FilePath $WacsExe -ArgumentList $WacsArgs -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -ne 0) {
        throw "win-acme beendet mit Fehlercode $($process.ExitCode)"
    }
}
catch {
    Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    Write-Progress -1 "Zertifikatsgenerierung fehlgeschlagen: $_"
    exit 1
}

Write-Progress 6 "Räume Firewall auf..."
Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue

Write-Progress 5 "Zertifikate erfolgreich generiert. Schließe Setup ab..."

# 1. Locate the fresh PEM files exported by WACS
$CrtFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-crt.pem")
$KeyFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-key.pem")

if ($CrtFiles.Count -gt 0 -and $KeyFiles.Count -gt 0) {
    $NewestCrt = $CrtFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $NewestKey = $KeyFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1

    Copy-Item -Path $NewestCrt.FullName -Destination (Join-Path $CertsDir "server.crt") -Force
    Copy-Item -Path $NewestKey.FullName -Destination (Join-Path $CertsDir "server.key") -Force

    # 2. Convert PEM to PFX via OpenSSL natively to bypass PBES2 OpenSSL 3.0 incompatibility
    # Since OpenSSL might not be in PATH on Windows, we utilize the Windows Crypto API equivalent
    # to import the PEM pair and export a legacy compatible PFX.
    Write-Progress 6 "Konvertiere Zertifikat in kompatibles Node.js PFX Format..."

    # Create an intermediate PFX using certutil
    $IntermediatePfx = Join-Path $CertsDir "temp_intermediate.pfx"
    $ServerPfx = Join-Path $CertsDir "server.pfx"

    # WACS already exported a PFX, but it's PBES2. We grab it, install it, and re-export it as legacy.
    $WacsPfxFiles = @(Get-ChildItem -Path $CertsDir -Filter "*.pfx" | Where-Object { $_.Name -ne "server.pfx" })
    if ($WacsPfxFiles.Count -gt 0) {
        $NewestWacsPfx = $WacsPfxFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        # Import to My store silently
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        $cert.Import($NewestWacsPfx.FullName, "cockpit", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
        
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "My", "CurrentUser"
        $store.Open("ReadWrite")
        $store.Add($cert)

        # Re-export it using the exact same robust function from generate_ssl.ps1
        $SecurePassword = ConvertTo-SecureString -String "cockpit" -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath $ServerPfx -Password $SecurePassword -Force | Out-Null
        
        # Cleanup from store
        $store.Remove($cert)
        $store.Close()
        
        # Delete original WACS files
        $WacsPfxFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
    }

    # Cleanup remaining WACS files
    $CrtFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
    $KeyFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
}

$ChainFiles = @(Get-ChildItem -Path $CertsDir -Filter "*-chain.pem")
if ($ChainFiles.Count -gt 0) { 
    $ChainFiles | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue } 
}

Stop-Transcript
Write-Progress 7 "Zertifikat aktiv. Starte Systemkomponenten neu..."
Start-Sleep -Seconds 2
pm2 stop all
Start-Sleep -Seconds 2
pm2 start all
