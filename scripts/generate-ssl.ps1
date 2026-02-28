param(
    [string[]]$DomainName = @("localhost", "127.0.0.1"),
    [string]$Password = "cockpit"
)

# Pfad relativ zum Skript ermitteln (Projekt Root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item $ScriptDir).Parent.FullName
$CertDir = Join-Path $ProjectRoot "certs"

if (-not (Test-Path -Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
    Write-Host "[+] Verzeichnis erstellt: $CertDir" -ForegroundColor Green
}

$PfxPath = Join-Path $CertDir "server.pfx"

# 1. Altes Zertifikat aus dem lokalen Speicher entfernen, falls vorhanden (Optional, für sauberen Neu-Lauf)
# Wir generieren einfach ein neues.

# 2. Zertifikat im Windows Zertifikatsspeicher (CurrentUser\My) erstellen
Write-Host "[*] Generiere selbstsigniertes Zertifikat für: $($DomainName -join ', ')..." -ForegroundColor Cyan

# Subject Alternative Names (SAN) aufbauen
$DnsNames = @()
foreach ($domain in $DomainName) {
    $DnsNames += $domain
}

$cert = New-SelfSignedCertificate -DnsName $DnsNames `
                                  -CertStoreLocation "cert:\CurrentUser\My" `
                                  -FriendlyName "Cockpit Self-Signed Cert" `
                                  -NotAfter (Get-Date).AddYears(10) `
                                  -KeyAlgorithm RSA `
                                  -KeyLength 2048

# 3. Exportieren als PFX Datei
Write-Host "[*] Exportiere PFX nach: $PfxPath..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $PfxPath -Password $SecurePassword | Out-Null

# 4. (Optional) Zertifikat in den Trusted Root Store importieren, um Browser-Warnungen auf DIESEM PC zu vermeiden
# ACHTUNG: Benötigt Admin-Rechte!
try {
    Write-Host "[*] Versuche das Zertifikat den Vertrauenswürdigen Stammzertifizierungsstellen hinzuzufügen (erfordert Administratorrechte)..." -ForegroundColor Yellow
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root","LocalMachine"
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "[+] Zertifikat erfolgreich vertraut!" -ForegroundColor Green
} catch {
    Write-Host "[-] Zertifikat konnte nicht zu den vertrauenswürdigen Wurzeln hinzugefügt werden (Keine Admin-Rechte?). Das ist nicht schlimm, Sie müssen im Browser beim ersten Aufruf lediglich die 'Sicherheitswarnung' akzeptieren." -ForegroundColor Gray
}

# 5. `system.json` aktualisieren
# Probe beide Pfade: Einmal das neue Layout (components) und einmal das Development Layout (src)
$SystemJsonPath = Join-Path $ProjectRoot "components\market-data-core\data\system.json"
if (-not (Test-Path $SystemJsonPath)) {
    $SystemJsonPath = Join-Path $ProjectRoot "src\market-data-core\data\system.json"
}

if (Test-Path $SystemJsonPath) {
    Write-Host "[*] Aktualisiere system.json in $SystemJsonPath..." -ForegroundColor Cyan
    $json = Get-Content $SystemJsonPath | ConvertFrom-Json
    
    # Sicherstellen, dass die Objekte existieren
    if ($null -eq $json.backend) {
        $json | Add-Member -Type NoteProperty -Name "backend" -Value (New-Object PSObject)
    }
    if ($null -eq $json.frontend) {
        $json | Add-Member -Type NoteProperty -Name "frontend" -Value (New-Object PSObject)
    }

    # SSL Flags setzen
    $json.backend | Add-Member -Type NoteProperty -Name "useSSL" -Value $true -Force
    $json.backend | Add-Member -Type NoteProperty -Name "port" -Value 3005 -Force

    # Frontend URL anpassen (nimmt die erste Domain aus der Liste)
    $PrimaryHost = $DomainName[0]
    $json.frontend | Add-Member -Type NoteProperty -Name "apiUrl" -Value "https://$PrimaryHost:3005" -Force
    $json.frontend | Add-Member -Type NoteProperty -Name "port" -Value 443 -Force
    
    # Wir protokollieren das PFX Passwort
    $json.backend | Add-Member -Type NoteProperty -Name "pfxPassword" -Value $Password -Force

    $json | ConvertTo-Json -Depth 5 | Set-Content -Path $SystemJsonPath
    Write-Host "[+] system.json erfolgreich um SSL und Network konfiguriert!" -ForegroundColor Green
} else {
    Write-Host "[-] Konnte system.json unter $SystemJsonPath nicht finden." -ForegroundColor Red
}

Write-Host "`n[OK] Fertig! Zertifikat bereit unter: $PfxPath" -ForegroundColor Green
Write-Host "Das PFX-Passwort lautet: $Password" -ForegroundColor Yellow
