param(
    [string]$TargetDir = "C:\awesome-cockpit",
    [switch]$Force = $false
)

# 1. Admin-Rechte prüfen
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Das Skript benoetigt Administratorrechte. Starte neu..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

if (-not $Force) {
    $confirm = Read-Host "ACHTUNG: Dieses Skript loescht Node.js, PM2-Dienste, Zertifikate und den gesamten Ordner $TargetDir! Fortfahren? (J/N)"
    if ($confirm -notmatch "^(?i)j(a)?$") {
        Write-Host "Abbruch durch Benutzer." -ForegroundColor Gray
        exit
    }
}

Write-Host "`n[1/6] Stoppe und entferne PM2-Dienste..." -ForegroundColor Cyan
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "  Führe 'pm2 kill' aus..."
    npm root -g | Out-Null # Ensure node is still somewhat valid
    pm2 stop all 2> $null
    pm2 delete all 2> $null
    pm2 kill 2> $null
    
    Write-Host "  Deinstalliere pm2 und pm2-windows-startup global..."
    npm uninstall -g pm2 pm2-windows-startup pm2-windows-service 2> $null
}

# Falls der Service hartnäckig als Windows-Dienst registriert wurde:
$serviceName = "pm2"
$pm2Svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($pm2Svc) {
    Write-Host "  Entferne Windows-Dienst $serviceName..."
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName | Out-Null
}

Write-Host "`n[2/6] Deinstalliere Node.js..." -ForegroundColor Cyan
# Wir suchen nach Node.js Installationen
$nodeInstalled = winget list --id OpenJS.NodeJS.LTS -e --accept-source-agreements
if ($nodeInstalled -match "Node.js") {
    Write-Host "  Deinstalliere OpenJS.NodeJS.LTS via winget..."
    winget uninstall --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements
} else {
    Write-Host "  Node.js nicht via winget gefunden..." -ForegroundColor Gray
}

# Beende evtl. noch haengende Node-Prozesse
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "`n[3/6] Entferne Firewall-Regeln..." -ForegroundColor Cyan
$RulesToRemove = @("Awesome-Cockpit-Web", "Awesome-Cockpit-API")
foreach ($rule in $RulesToRemove) {
    if (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue) {
        Write-Host "  Entferne Firewall-Regel '$rule'..."
        Remove-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue
    }
}

Write-Host "`n[4/6] Entferne SSL-Zertifikate..." -ForegroundColor Cyan
# Wir suchen das Zertifikat anhand seines FriendlyNames "Cockpit Self-Signed Cert"
$cert = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object { $_.FriendlyName -eq "Cockpit Self-Signed Cert" }
if ($cert) {
    Write-Host "  Entferne Zertifikat aus CurrentUser\My..."
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
}
$rootCert = Get-ChildItem -Path "Cert:\LocalMachine\Root" | Where-Object { $_.FriendlyName -eq "Cockpit Self-Signed Cert" }
if ($rootCert) {
    Write-Host "  Entferne Zertifikat aus LocalMachine\Root..."
    Remove-Item "Cert:\LocalMachine\Root\$($rootCert.Thumbprint)" -Force
}

Write-Host "`n[5/6] Entferne System-Ordner..." -ForegroundColor Cyan
if (Test-Path $TargetDir) {
    Write-Host "  Loesche Verzeichnis: $TargetDir"
    Remove-Item -Path $TargetDir -Recurse -Force -ErrorAction Continue
} else {
    Write-Host "  Verzeichnis $TargetDir nicht gefunden." -ForegroundColor Gray
}

# npm-cache und %APPDATA%\npm löschen
$npmAppData = Join-Path $env:APPDATA "npm"
$npmCache = Join-Path $env:LOCALAPPDATA "npm-cache"
if (Test-Path $npmAppData) { Remove-Item -Path $npmAppData -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $npmCache) { Remove-Item -Path $npmCache -Recurse -Force -ErrorAction SilentlyContinue }


Write-Host "`n[6/6] Cleanup abgeschlossen!" -ForegroundColor Green
Write-Host "Um die PM2 oder Node Deinstallation in der Konsole zu refelktieren, muss dieses PowerShell-Fenster neu gestartet werden ($env:Path hat sich ggf. geaendert)." -ForegroundColor Yellow
