param (
    [string]$CrtPath = "server.crt",
    [string]$KeyPath = "server.key",
    [string]$ChainPath = "server-chain.pem",
    [string]$OutPath = "server.pfx",
    [string]$Password = "cockpit"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CrtPath) -or -not (Test-Path $KeyPath)) {
    Write-Host "Fehler: $CrtPath oder $KeyPath wurde nicht gefunden." -ForegroundColor Red
    Write-Host "Bitte lege die Sicherungsdateien in diesen Ordner und starte das Skript erneut." -ForegroundColor Yellow
    exit 1
}

# Ensure openssl is available. Git for Windows includes it out of the box.
$OpenSslPath = "C:\Program Files\Git\usr\bin\openssl.exe"
if (-not (Test-Path $OpenSslPath)) {
    # Try looking in PATH as a fallback
    $OpenSslExe = Get-Command "openssl" -ErrorAction SilentlyContinue
    if ($null -eq $OpenSslExe) {
        Write-Host "Fehler: openssl.exe konnte nicht gefunden werden (Git for Windows ist scheinbar nicht installiert)." -ForegroundColor Red
        exit 1
    }
    $OpenSslPath = $OpenSslExe.Source
}

Write-Host "Nutze OpenSSL via: $OpenSslPath" -ForegroundColor Cyan
Write-Host "Baue neues Legacy-PFX aus rohen PEM Dateien..." -ForegroundColor Yellow

try {
    # Construct the argument list
    # The magical `-legacy` flag forces OpenSSL 3.0+ to output older RC2/3DES encryption
    # which Node.js 18+ can read flawlessly.
    $ArgsList = @(
        "pkcs12",
        "-export",
        "-out", $OutPath,
        "-inkey", $KeyPath,
        "-in", $CrtPath,
        "-passout", "pass:$Password",
        "-legacy"
    )

    if (Test-Path $ChainPath) {
        Write-Host " -> Integriere Zertifikatskette aus: $ChainPath" -ForegroundColor Cyan
        $ArgsList += "-certfile"
        $ArgsList += $ChainPath
    }
    else {
        Write-Host " -> WARNUNG: Keine Kette ($ChainPath) gefunden. PFX wird ohne Trust-Chain erstellt." -ForegroundColor DarkYellow
    }

    $process = Start-Process -FilePath $OpenSslPath -ArgumentList $ArgsList -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "ERFOLG! Eine lupenreine, Node.js kompatible Datei '$OutPath' wurde erstellt!" -ForegroundColor Green
        Write-Host "Du kannst diese Datei nun nach C:\awesome-cockpit\certs kopieren und PM2 neustarten." -ForegroundColor Green
    }
    else {
        Write-Host "OpenSSL ist mit Fehlercode $($process.ExitCode) fehlgeschlagen." -ForegroundColor Red
    }
}
catch {
    Write-Host "Unerwarteter Fehler: $_" -ForegroundColor Red
}

Write-Host "`nDrücke eine beliebige Taste zum Beenden..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
