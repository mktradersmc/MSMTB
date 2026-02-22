param(
    [string]$ProcessName = "terminal64",
    [string]$ExecutablePath = "",
    [string]$ConfigPath = "",
    [string]$InstancePath = "",
    [int]$PidToKill = 0
)

$ErrorActionPreference = "Stop"

Write-Host "[RESTART] Target: $ProcessName" -ForegroundColor Cyan

# 1. Kill Specific PID if provided
if ($PidToKill -gt 0) {
    Write-Host "  Killing PID: $PidToKill"
    try {
        Stop-Process -Id $PidToKill -Force -ErrorAction SilentlyContinue
        Write-Host "  PID $PidToKill Terminated." -ForegroundColor Green
    } catch {
        Write-Warning "  Could not kill PID $PidToKill (Might be already dead)."
    }
} else {
    $SearchText = if ($ConfigPath) { $ConfigPath } elseif ($InstancePath) { $InstancePath } else { $null }

    if ($SearchText) {
        Write-Host "  Killing instances containing path: $SearchText"
        $procs = Get-CimInstance Win32_Process -Filter "Name = '$ProcessName.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine -like "*$SearchText*" }
        foreach ($p in $procs) {
            Write-Host "  Killing PID $($p.ProcessId) matching path"
            try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
        }
        # Give it a moment to release file handles
        Start-Sleep -Seconds 1
    } else {
        Write-Warning "No PID or Instance/Config path provided. Termination skipped."
    }
}

# 2. Start Process
if ($ExecutablePath -ne "") {
    if (-not (Test-Path $ExecutablePath)) {
        Write-Error "Executable not found: $ExecutablePath"
        exit 1
    }

    $ArgsList = @()
    if ($ConfigPath -ne "") {
        if (Test-Path $ConfigPath) {
            $ArgsList += "/config:`"$ConfigPath`""
        }
    }
    $ArgsList += "/portable" # Generally good for MT5 portable setups, remove if user uses AppData

    Write-Host "  Starting: $ExecutablePath $ArgsList"
    
    $WorkDir = if ($InstancePath -ne "") { $InstancePath } else { Split-Path $ExecutablePath -Parent }
    Write-Host "  Working Directory: $WorkDir"
    
    $proc = Start-Process -FilePath $ExecutablePath -ArgumentList $ArgsList -WorkingDirectory $WorkDir -PassThru
    Write-Host "  Started! New PID: $($proc.Id)" -ForegroundColor Green
} else {
    Write-Warning "No ExecutablePath provided. Only termination performed."
}
