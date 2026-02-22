# NinjaTrader 8 Auto-Login Script
# HYBRID STRATEGY: 
# 1. Login: Geometric Sorting (Top = User, Bottom = Pass).
# 2. Post-Login: Watchdog for "Third Party DLL" and "Continue" dialogs.

$ErrorActionPreference = "Stop"

function Log($msg) {
    Write-Host "[AutoLogin] $msg"
}

# --- Load UIA ---
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

# --- P/Invoke Definitions ---
$code = @"
    using System;
    using System.Runtime.InteropServices;
    
    public class Win32 {
        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
        
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

        public const int SW_RESTORE = 9;
        public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        public const uint MOUSEEVENTF_LEFTUP = 0x0004;
        public const int KEYEVENTF_KEYUP = 0x0002;
        public const byte VK_MENU = 0x12; // ALT key
        public const byte VK_ESCAPE = 0x1B; // ESC key
    }
"@
Add-Type -TypeDefinition $code -Language CSharp

function Click-Element($element, $desc) {
    if ($element) {
        try {
            $rect = $element.Current.BoundingRectangle
            if ($rect -and $rect.Width -gt 0) {
                $centerX = [int]($rect.Left + ($rect.Width / 2))
                $centerY = [int]($rect.Top + ($rect.Height / 2))
                
                Log "Clicking $desc at ($centerX, $centerY)..."
                [Win32]::SetCursorPos($centerX, $centerY)
                Start-Sleep -Milliseconds 100
                [Win32]::mouse_event([Win32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                Start-Sleep -Milliseconds 50
                [Win32]::mouse_event([Win32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                Start-Sleep -Milliseconds 500
                return $true
            }
        }
        catch {
            Log "Error calculating rect for ${desc}: $_"
        }
    }
    return $false
}

function Escape-SendKeys($inputString) {
    if ([string]::IsNullOrEmpty($inputString)) { return "" }
    $chars = "+^%~(){}[]"
    $output = ""
    $charsArray = $inputString.ToCharArray()
    foreach ($c in $charsArray) {
        if ($chars.Contains($c)) {
            $output += "{$c}"
        }
        else {
            $output += $c
        }
    }
    return $output
}

# --- STAGE 1: LOGIN ---

# 1. Finds Window via Process -> UIA
Log "Waiting for window..."
$maxRetries = 60
$windowElement = $null

for ($i = 0; $i -lt $maxRetries; $i++) {
    $proc = Get-Process NinjaTrader -ErrorAction SilentlyContinue
    if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
        
        # Alt-Wakeup first to ensure it's "there" for UIA
        [Win32]::keybd_event([Win32]::VK_MENU, 0, 0, 0)
        [Win32]::keybd_event([Win32]::VK_MENU, 0, [Win32]::KEYEVENTF_KEYUP, 0)
        [Win32]::ShowWindow($proc.MainWindowHandle, [Win32]::SW_RESTORE)
        [Win32]::SetForegroundWindow($proc.MainWindowHandle)
        
        # Try to get UIA Element from Handle
        try {
            $windowElement = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
            if ($windowElement) {
                Log "UIA Element Found: $($windowElement.Current.Name)"
                break
            }
        }
        catch {
            # Ignore
        }
    }
    Start-Sleep -Seconds 1
}

if (-not $windowElement) {
    Log "Could not attach UIA to Window."
    # Don't exit yet, maybe previously logged in?
    Log "Continuing to Watchdog..."
}
else {

    # Close Menu if Alt opened it
    $wshell = New-Object -ComObject WScript.Shell
    $wshell.SendKeys("{ESC}")
    Start-Sleep -Milliseconds 200

    # 2. Find Fields via UIA Search
    Log "Searching for input fields..."

    # FIX: Use correct syntax for ControlTypeProperty
    $condEdit = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
    $editsCollection = $windowElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condEdit)
    $editsList = @()
    foreach ($e in $editsCollection) { $editsList += $e }

    Log "Found $($editsList.Count) Edit controls."

    # Start Sorting Logic
    if ($editsList.Count -ge 2) {
        # Sort by Top (Y coordinate)
        $sortedEdits = $editsList | Sort-Object { $_.Current.BoundingRectangle.Top }
        
        # Assume Top is User, Second is Pass
        $userEdit = $sortedEdits[0]
        $passEdit = $sortedEdits[1]
        
        Log "Identified Top Field as Username."
        Log "Identified 2nd Field as Password."
        
        # 3. Perform Actions
        $username = Escape-SendKeys $env:NT8_USER
        $password = Escape-SendKeys $env:NT8_PASS

        if ($userEdit) {
            Click-Element $userEdit "Username Field"
            
            Log "Clearing & Typing Username..."
            for ($k = 0; $k -lt 30; $k++) { $wshell.SendKeys("{BACKSPACE}") }
            $wshell.SendKeys($username)
        }

        if ($passEdit) {
            Click-Element $passEdit "Password Field"
            
            Log "Clearing & Typing Password..."
            for ($k = 0; $k -lt 30; $k++) { $wshell.SendKeys("{BACKSPACE}") }
            $wshell.SendKeys($password)
        }

        # Login Button?
        Log "Searching for Login Button..."
        # FIX: Use correct syntax for ControlTypeProperty
        $condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
        $btns = $windowElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condBtn)

        $clickedLogin = $false
        foreach ($b in $btns) {
            $name = $b.Current.Name
            if ($name -match "Log In" -or $name -match "Anmelden" -or $name -match "Connect") {
                Click-Element $b "Login Button ($name)"
                $clickedLogin = $true
                break
            }
        }

        # Fallback Enter
        if (-not $clickedLogin) {
            Log "Sending ENTER..."
            $wshell.SendKeys("{ENTER}")
        }
    }
    else {
        Log "Less than 2 edits found. Already logged in or different screen? Skipping Credential Injection."
    }
}

# --- STAGE 2: POST-LOGIN WATCHDOG ---

Log "ENTERING WATCHDOG MODE (30s)..."
Log "Looking for 'Third Party DLL' or 'Continue' dialogs..."

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

while ($stopwatch.Elapsed.TotalSeconds -lt 30) {
    
    # Refresh Root Element to find new windows
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $condWindow = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
    $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condWindow)
    
    foreach ($w in $windows) {
        try {
            $title = $w.Current.Name
            
            if (![string]::IsNullOrEmpty($title)) {
                # 1. Third Party DLL / Trust Dialog
                if ($title -match "Third Party" -or $title -match "Assembly" -or $title -match "DLL" -or $title -match "Warning") {
                    Log "Found Potential Trust Dialog: '$title'"
                    
                    $condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
                    $dialogBtns = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condBtn)
                     
                    foreach ($db in $dialogBtns) {
                        $btnName = $db.Current.Name
                        if ($btnName -match "Yes" -or $btnName -match "Ja" -or $btnName -match "Trust") {
                            Click-Element $db "Trust Button ($btnName)"
                            Start-Sleep -Seconds 1 
                        }
                    }
                }
                
                # 2. "How would you like to continue" Dialog
                if ($title -match "Continue" -or $title -match "Simulation" -or $title -match "Workspace") {
                    Log "Found Context Choice Dialog: '$title'"
                     
                    $condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
                    $dialogBtns = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condBtn)
                     
                    foreach ($db in $dialogBtns) {
                        $btnName = $db.Current.Name
                        if ($btnName -match "Skip" -or $btnName -match "Continue" -or $btnName -match "Simulation") {
                            Click-Element $db "Continue Button ($btnName)"
                            Log "Watchdog Task Complete (Dialog Handled)."
                            exit 0
                        }
                    }
                }
            }
        }
        catch {
            # Window closed or access denied
        }
    }
    
    Start-Sleep -Seconds 1
}

Log "Watchdog timeout. Assuming success or manual intervention needed."
