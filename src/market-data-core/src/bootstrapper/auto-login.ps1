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
$maxRetries = 150 # Increased max retries due to shorter sleep
$windowElement = $null

for ($i = 0; $i -lt $maxRetries; $i++) {
    $proc = Get-Process NinjaTrader -ErrorAction SilentlyContinue
    if ($proc) {
        
        # Instead of waiting for the slow $proc.MainWindowHandle to populate (which takes 10+ seconds for WPF),
        # we actively scan the desktop for windows belonging to this Process ID.
        $root = [System.Windows.Automation.AutomationElement]::RootElement
        $condWindow = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
        $condPid = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
        $condAnd = New-Object System.Windows.Automation.AndCondition($condWindow, $condPid)
        
        $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condAnd)
        
        foreach ($w in $windows) {
            try {
                $windowName = $w.Current.Name
                if ($windowName -match "Log In" -or $windowName -match "Anmelden" -or $windowName -match "Welcome" -or $windowName -match "Willkommen" -or $windowName -match "NinjaTrader") {
                    $windowElement = $w
                    Log "UIA Login Window Found immediately by ID matching: '$windowName'"
                    
                    # Bring it to front forcefully
                    $hwnd = $w.Current.NativeWindowHandle
                    if ($hwnd -ne 0) {
                        [Win32]::keybd_event([Win32]::VK_MENU, 0, 0, 0)
                        [Win32]::keybd_event([Win32]::VK_MENU, 0, [Win32]::KEYEVENTF_KEYUP, 0)
                        [Win32]::ShowWindow([IntPtr]$hwnd, [Win32]::SW_RESTORE)
                        [Win32]::SetForegroundWindow([IntPtr]$hwnd)
                    }
                    break
                }
            }
            catch {}
        }
    }
    
    if ($windowElement) { break }
    
    Start-Sleep -Milliseconds 200 # Faster polling for initial login window
}

if (-not $windowElement -or [string]::IsNullOrEmpty($windowElement.Current.Name)) {
    Log "Could not attach UIA to Login Window."
    # Don't exit yet, maybe previously logged in?
    Log "Continuing to Watchdog..."
}
else {

    # Close Menu if Alt opened it
    $wshell = New-Object -ComObject WScript.Shell
    $wshell.SendKeys("{ESC}")
    Start-Sleep -Milliseconds 200

    $windowName = $windowElement.Current.Name
    Log "Main Window Title Attached: '$windowName'"

    # STRICT CHECK: Only inject if this is the main NinjaTrader authentication window
    # NinjaTrader 8 Login window is historically called "Log In", "Anmelden", "Welcome", or "Willkommen!"
    if ($windowName -match "Log In" -or $windowName -match "Anmelden" -or $windowName -match "Welcome" -or $windowName -match "Willkommen" -or $windowName -match "NinjaTrader") {
        # 2. explicitly WAIT for input fields via UIA Search
        Log "Waiting for input fields to render..."
        $editsList = @()
        for ($retry = 0; $retry -lt 50; $retry++) {
            $condEdit = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
            $editsCollection = $windowElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condEdit)
            
            $editsList = @()
            foreach ($e in $editsCollection) { $editsList += $e }
            
            if ($editsList.Count -ge 2) {
                break
            }
            Start-Sleep -Milliseconds 100
        }

        Log "Found $($editsList.Count) Edit controls."

        # Start Sorting Logic
        if ($editsList.Count -ge 2) {
            # Bring it to front forcefully one more time before interacting
            $hwnd = $windowElement.Current.NativeWindowHandle
            if ($hwnd -ne 0) {
                [Win32]::SetForegroundWindow([IntPtr]$hwnd)
                Start-Sleep -Milliseconds 50
            }

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
            Log "Error: Timed out waiting for UI Input fields to render. Login failed."
        }
    }
    else {
        Log "Title '$windowName' is not the main login screen. Skipping credential injection to prevent accidental lockouts."
    }
}

# --- STAGE 2: POST-LOGIN WATCHDOG ---

Log "ENTERING WATCHDOG MODE (60s)..."
Log "Waiting for Control Center and closing 'Ausgabe' / 'Skip' dialogs..."

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$wshell = New-Object -ComObject WScript.Shell

while ($stopwatch.Elapsed.TotalSeconds -lt 60) {
    
    $proc = Get-Process NinjaTrader -ErrorAction SilentlyContinue
    if ($proc) {
        $root = [System.Windows.Automation.AutomationElement]::RootElement
        $condWindow = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
        $condPid = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
        $condAnd = New-Object System.Windows.Automation.AndCondition($condWindow, $condPid)
        
        $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condAnd)
        
        $controlCenterFound = $false
        
        foreach ($w in $windows) {
            try {
                $title = $w.Current.Name
                if ([string]::IsNullOrEmpty($title)) { continue }
                
                if ($title -match "Control Center") {
                    Log "Main Control Center found! Startup complete."
                    $controlCenterFound = $true
                    # Don't break immediately, let it close 'Ausgabe' if both are present at the same time
                }
                elseif ($title -match "Log In" -or $title -match "Anmelden" -or $title -match "Welcome" -or $title -match "Willkommen") {
                    # Still logging in, wait...
                    continue
                }
                elseif ($title -match "Ausgabe" -or $title -match "Output" -or $title -match "Warning" -or $title -match "Hinweis" -or $title -match "Continue" -or $title -match "Simulation" -or $title -match "Workspace" -or $title -match "Question" -or $title -match "Frage" -or $title -match "NinjaTrader" -or $title -match "Connection" -or $title -match "Verbindung") {
                    Log "Found unexpected dialog/window: '$title'. Handling..."
                    
                    # 1. Try to find and click action buttons FIRST! 
                    # This gracefully handles the "Close Multiple Tabs?" (Yes/Ja),
                    # the "New Connection" prompt (OK), and the "Simulation/Skip" warning (Enable/Aktivieren).
                    
                    $condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
                    $condTxt = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text)
                    $condLnk = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Hyperlink)
                    
                    $conditions = New-Object "System.Windows.Automation.Condition[]" 3
                    $conditions[0] = $condBtn
                    $conditions[1] = $condTxt
                    $conditions[2] = $condLnk
                    $condOr = New-Object System.Windows.Automation.OrCondition($conditions)
                    
                    $dialogElements = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condOr)
                     
                    $handled = $false
                    foreach ($de in $dialogElements) {
                        $elName = $de.Current.Name
                        if ($elName -match "^Yes$" -or $elName -match "^Ja$" -or $elName -match "^OK$" -or $elName -match "Enable" -or $elName -match "Aktivieren") {
                            Log "Clicking action element inside '$title': $elName"
                            if (Click-Element $de "Action Element ($elName)") {
                                $handled = $true
                                break
                            }
                        }
                    }
                    
                    # 2. If NO actionable button was found, force-close specific known nuisance windows like Ausgabe
                    if (-not $handled -and ($title -match "Ausgabe" -or $title -match "Output" -or $title -match "Warning" -or $title -match "Hinweis")) {
                        Log "No action button found. Sending ALT+F4 to force-close '$title'..."
                        try {
                            $hwnd = $w.Current.NativeWindowHandle
                            if ($hwnd -ne 0) {
                                [Win32]::SetForegroundWindow([IntPtr]$hwnd)
                                Start-Sleep -Milliseconds 100
                                $wshell.SendKeys("%{F4}") # Alt+F4
                                Log "Sent ALT+F4 to '$title'."
                            }
                        } catch { 
                            Log "Failed to send ALT+F4 to '$title': $_"
                        }
                    }
                }
                # Other windows (like charts or workspaces) are ignored (we don't want to accidentally close them via generic match)
            }
            catch {
                # Window closed or access denied
            }
        }
        
        if ($controlCenterFound) {
            Log "Watchdog Task Complete."
            exit 0
        }
    }
    
    Start-Sleep -Milliseconds 500 # Faster watchdog polling
}

Log "Watchdog timeout. Exiting."
exit 0
