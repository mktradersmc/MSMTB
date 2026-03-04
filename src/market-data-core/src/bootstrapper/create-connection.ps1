# NinjaTrader 8 Create Connection Script
$ErrorActionPreference = "Stop"

function Log($msg) {
    Write-Host "[CreateConn] $msg"
}

# --- Load UIA ---
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

# --- P/Invoke Definitions ---
$code = @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    
    public class Win32 {
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowTextLength(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint outProcessId);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

        public const int SW_RESTORE = 9;
        public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        public const uint MOUSEEVENTF_LEFTUP = 0x0004;
        
        public static void ForceForeground(IntPtr hWnd) {
            IntPtr foregroundHWnd = GetForegroundWindow();
            uint dummy;
            uint foregroundThreadId = GetWindowThreadProcessId(foregroundHWnd, out dummy);
            uint currentThreadId = GetWindowThreadProcessId(hWnd, out dummy);
            
            if (foregroundThreadId != currentThreadId) {
                AttachThreadInput(foregroundThreadId, currentThreadId, true);
                BringWindowToTop(hWnd);
                ShowWindow(hWnd, SW_RESTORE);
                SetForegroundWindow(hWnd);
                AttachThreadInput(foregroundThreadId, currentThreadId, false);
            } else {
                BringWindowToTop(hWnd);
                ShowWindow(hWnd, SW_RESTORE);
                SetForegroundWindow(hWnd);
            }
        }
    }
"@
Add-Type -TypeDefinition $code -Language CSharp

function Click-Element($element, $desc) {
    if ($element) {
        try {
            $rect = $element.Current.BoundingRectangle
            if ($rect -and $rect.Width -gt 0) {
                # Click slightly right of center for labels in case it's a property grid
                $centerX = [int]($rect.Left + ($rect.Width / 2))
                $centerY = [int]($rect.Top + ($rect.Height / 2))
                
                Log "Clicking $desc at ($centerX, $centerY)..."
                [Win32]::SetCursorPos($centerX, $centerY)
                Start-Sleep -Milliseconds 100
                [Win32]::mouse_event([Win32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                Start-Sleep -Milliseconds 50
                [Win32]::mouse_event([Win32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                Start-Sleep -Milliseconds 400
                return $true
            }
        }
        catch { Log "Error clicking ${desc}: $_" }
    }
    return $false
}

function Escape-SendKeys($inputString) {
    if ([string]::IsNullOrEmpty($inputString)) { return "" }
    $chars = "+^%~(){}[]"
    $output = ""
    $charsArray = $inputString.ToCharArray()
    foreach ($c in $charsArray) {
        if ($chars.Contains($c)) { $output += "{$c}" } else { $output += $c }
    }
    return $output
}

$wshell = New-Object -ComObject WScript.Shell
$root = [System.Windows.Automation.AutomationElement]::RootElement

Log "Starting Connection Creation..."

# 1. Find Control Center Window (using reliable Win32 EnumWindows)
$proc = Get-Process NinjaTrader -ErrorAction SilentlyContinue
if (-not $proc) {
    Log "NinjaTrader is not running!"
    exit 1
}

$condWindow = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
$condPid = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$condAnd = New-Object System.Windows.Automation.AndCondition($condWindow, $condPid)

$controlCenterHwnd = [IntPtr]::Zero

$enumWindowsProc = {
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    
    if ([Win32]::IsWindowVisible($hWnd)) {
        $processId = 0
        [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId) | Out-Null
        
        if ($processId -eq $proc.Id) {
            $length = [Win32]::GetWindowTextLength($hWnd)
            if ($length -gt 0) {
                $sb = New-Object System.Text.StringBuilder ($length + 1)
                [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
                $title = $sb.ToString()
                if ($title -match "Control Center" -or $title -match "Kontrollzentrum") {
                    $global:controlCenterHwnd = $hWnd
                    return $false # Stop enumerating
                }
            }
        }
    }
    return $true # Continue
}

$delegate = [Win32+EnumWindowsProc]$enumWindowsProc
[Win32]::EnumWindows($delegate, [IntPtr]::Zero) | Out-Null

if ($global:controlCenterHwnd -eq [IntPtr]::Zero) {
    Log "Could not find Control Center window via Win32 API!"
    exit 1
}

Log "Found Control Center. Bringing to front..."
[Win32]::ForceForeground($global:controlCenterHwnd)
Start-Sleep -Milliseconds 500

Log "Re-attaching to UIA Element using HWND..."
$controlCenter = [System.Windows.Automation.AutomationElement]::FromHandle($global:controlCenterHwnd)
if (-not $controlCenter) {
    Log "Failed to attach UIA tree to Control Center HWND."
}


# 2. Click "Connections" / "Verbindungen" Menu
Log "Finding Connections Menu..."
$condMenu = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::MenuItem)
$menuItems = $controlCenter.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condMenu)

$clickedConnections = $false
foreach ($m in $menuItems) {
    try {
        $name = $m.Current.Name
        if ($name -match "Connections" -or $name -match "Verbindungen") {
            Click-Element $m "Connections Menu"
            $clickedConnections = $true
            break
        }
    } catch {}
}

if (-not $clickedConnections) {
    Log "Could not find Connections menu."
    exit 1
}

Start-Sleep -Milliseconds 500

# 3. Click "Configure" / "konfigurieren"
# 3. Click "Configure" / "konfigurieren"
Log "Finding Configure Text/Button..."

Start-Sleep -Milliseconds 500

$condConfigName1 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Configure")
$condConfigName2 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "konfigurieren")
$condConfigName = New-Object System.Windows.Automation.OrCondition($condConfigName1, $condConfigName2)

$condProcessOnly = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$condSearch = New-Object System.Windows.Automation.AndCondition($condProcessOnly, $condConfigName)

$configElements = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condSearch)

$clickedConfigure = $false
foreach ($el in $configElements) {
    try {
        Click-Element $el "Configure Button/Text"
        $clickedConfigure = $true
        break
    } catch {}
}

if (-not $clickedConfigure) {
    Log "Fallback: Could not find Configure button via UIA! Trying keystrokes..."
    $wshell.SendKeys("{UP}")
    Start-Sleep -Milliseconds 100
    $wshell.SendKeys("{ENTER}")
}

Start-Sleep -Milliseconds 1500

# 4. Wait for Connections Dialog Window
Log "Waiting for Connections Dialog..."
$connWindowHwnd = [IntPtr]::Zero

$enumConnProc = {
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    if ([Win32]::IsWindowVisible($hWnd)) {
        $processId = 0
        [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId) | Out-Null
        if ($processId -eq $proc.Id) {
            $length = [Win32]::GetWindowTextLength($hWnd)
            if ($length -gt 0) {
                $sb = New-Object System.Text.StringBuilder ($length + 1)
                [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
                $title = $sb.ToString()
                if ($title -match "Connections" -or $title -match "Verbindungen") {
                    $global:connWindowHwnd = $hWnd
                    return $false
                }
            }
        }
    }
    return $true
}
$connDelegate = [Win32+EnumWindowsProc]$enumConnProc

for ($i = 0; $i -lt 20; $i++) {
    [Win32]::EnumWindows($connDelegate, [IntPtr]::Zero) | Out-Null
    if ($global:connWindowHwnd -ne [IntPtr]::Zero) { break }
    Start-Sleep -Milliseconds 500
}

if ($global:connWindowHwnd -eq [IntPtr]::Zero) {
    Log "Connections dialog did not appear!"
    exit 1
}

$connWindow = [System.Windows.Automation.AutomationElement]::FromHandle($global:connWindowHwnd)
[Win32]::ForceForeground($global:connWindowHwnd)
Start-Sleep -Milliseconds 500

# Function to safely dump Tree to file for debugging
function Dump-Tree($element, $level, $file) {
    try {
        $indent = "".PadRight($level * 2, " ")
        $info = "$indent$($element.Current.ControlType.ProgrammaticName) | Name: '$($element.Current.Name)' | ID: '$($element.Current.AutomationId)'"
        Add-Content -Path $file -Value $info
        
        $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
        $child = $walker.GetFirstChild($element)
        while ($child -ne $null) {
            Dump-Tree $child ($level + 1) $file
            $child = $walker.GetNextSibling($child)
        }
    } catch {}
}
$logPath = "$env:TEMP\nt8-conn-tree.txt"
Log "Dumping UIA tree to $logPath for debugging..."
Clear-Content -Path $logPath -ErrorAction SilentlyContinue
Dump-Tree $connWindow 0 $logPath

# 5. Add "NinjaTrader" Connection
# 5. Add "NinjaTrader" Connection
Log "Looking for 'NinjaTrader' in Available list..."
$condText = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text)
$condListItem = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::ListItem)

# Click the very first ListItem to set keyboard focus on the "Available" listbox
$allListItems = $connWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condListItem)
if ($allListItems.Count -gt 0) {
    Log "Setting focus on the Available list by clicking first item..."
    Click-Element $allListItems[0] "First List Item"
    Start-Sleep -Milliseconds 200
} else {
    Log "Warning: No list items found!"
}

$ntItem = $null

for ($page = 0; $page -lt 20; $page++) {
    $currentListItems = $connWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condListItem)
    
    foreach ($item in $currentListItems) {
        try {
            $childTexts = $item.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condText)
            foreach ($t in $childTexts) {
                if ($t.Current.Name -eq "NinjaTrader") {
                    # Make sure the element is actually on screen (not virtualized away)
                    if ($item.Current.BoundingRectangle.Width -gt 0 -and (-not $item.Current.IsOffscreen)) {
                        $ntItem = $item
                        break
                    }
                }
            }
            if ($ntItem) { break }
        } catch {}
    }

    if ($ntItem) { break }
    
    Log "NinjaTrader not found or off-screen. Sending PageDown..."
    $wshell.SendKeys("{PGDN}")
    Start-Sleep -Milliseconds 400
}

if ($ntItem) {
    # Double click it to add!
    Log "Found NinjaTrader in list on screen! Double clicking to add..."
    Click-Element $ntItem "NinjaTrader List Item"
    Click-Element $ntItem "NinjaTrader List Item"
} else {
    Log "Could not find NinjaTrader in the list even after scrolling! Check the tree logs."
}

Start-Sleep -Milliseconds 1000

# Find and click "add" / "hinzufügen" button just in case double click was flaky
$condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
$btns = $connWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condBtn)
$clickedAdd = $false
foreach ($btn in $btns) {
    try {
        # Log shows: ControlType.Button | Name: 'hinzufgen'
        if ($btn.Current.Name -match "add" -or $btn.Current.Name -match "hinzuf.gen") {
            Click-Element $btn "Add Button"
            $clickedAdd = $true
            break
        }
    } catch {}
}

Start-Sleep -Milliseconds 1000

# 6. Fill Out Properties
Log "Filling out connection properties..."

# Properties appear on the right pane after connection is added. 
# Give it a moment to render the property grid.
Start-Sleep -Milliseconds 500

$condEdit = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
$condCheckBox = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::CheckBox)

$edits = $connWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condEdit)
$checks = $connWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condCheckBox)

$userStr = Escape-SendKeys $env:NT8_USER
$passStr = Escape-SendKeys $env:NT8_PASS

foreach ($e in $edits) {
    try {
        $id = $e.Current.AutomationId
        
        if ($id -match "EditorName$") {
            Log "Configuring Connection Name: Apex..."
            Click-Element $e "Connection Name Field"
            $wshell.SendKeys("{END}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys("+{HOME}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys("Apex")
            Start-Sleep -Milliseconds 200
        }
        elseif ($id -match "User") {
            Log "Configuring Username..."
            Click-Element $e "Username Field"
            $wshell.SendKeys("{END}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys("+{HOME}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys($userStr)
            Start-Sleep -Milliseconds 200
        }
        elseif ($id -match "Password") {
            Log "Configuring Password..."
            Click-Element $e "Password Field"
            $wshell.SendKeys("{END}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys("+{HOME}")
            Start-Sleep -Milliseconds 50
            $wshell.SendKeys($passStr)
            Start-Sleep -Milliseconds 200
        }
    } catch {}
}

foreach ($c in $checks) {
    try {
        $id = $c.Current.AutomationId
        if ($id -match "ConnectOnStartup$") {
            Log "Configuring Connect on Startup..."
            try {
                $togglePattern = $c.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
                if ($togglePattern.Current.ToggleState -eq [System.Windows.Automation.ToggleState]::Off) {
                    $togglePattern.Toggle()
                    Log "Toggled Checkbox ON via Pattern."
                }
            } catch {
                Log "TogglePattern failed, attempting physical click..."
                if ($c.Current.BoundingRectangle.Width -gt 0) {
                    Click-Element $c "Connect on Startup Checkbox"
                    $wshell.SendKeys(" ")
                }
            }
        }
    } catch {}
}

Start-Sleep -Milliseconds 500

# 7. Click OK
Log "Finding OK button..."
$clickedOk = $false
foreach ($btn in $btns) {
    try {
        if ($btn.Current.Name -match "^OK$") {
            Click-Element $btn "OK Button"
            $clickedOk = $true
            break
        }
    } catch {}
}

if (-not $clickedOk) {
    Log "Fallback: Sending ENTER to confirm dialog"
    $wshell.SendKeys("{ENTER}")
}

Log "Connection Creation Script Completed."
exit 0
