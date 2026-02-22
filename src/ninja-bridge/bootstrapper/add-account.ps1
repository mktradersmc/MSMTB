# NinjaTrader 8 Account Provisioning Script (Discovery Mode v2)
# Goal: Automate "Connections" -> "Configure" -> Add Account.
# Includes Robust Clicking Fallback.

param(
    [string]$ConnectionName = "TestConnection",
    [string]$Username = "User",
    [string]$Password = "Pass",
    [string]$Provider = "NinjaTrader"
)

$ErrorActionPreference = "Stop"

# --- UIA BOILERPLATE ---
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Log($msg) { Write-Host "[AddAccount] $msg" }

# --- P/Invoke Definitions (for Click-Element) ---
$code = @"
    using System;
    using System.Runtime.InteropServices;
    
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
        
        public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        public const uint MOUSEEVENTF_LEFTUP = 0x0004;
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
                [Win32]::mouse_event([Win32]::MOUSEEVENTF_LEFTUp, 0, 0, 0, 0)
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

function Interact-Element($element, $desc) {
    Log "Interacting with $desc..."
    
    # 1. Try ExpandCollapse
    try {
        $pt = $element.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern)
        $pt.Expand()
        Log " -> Used ExpandCollapsePattern."
        return
    }
    catch {}

    # 2. Try Invoke
    try {
        $pt = $element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $pt.Invoke()
        Log " -> Used InvokePattern."
        return
    }
    catch {}

    # 3. Fallback Click
    Log " -> Patterns failed. Using Mouse Click."
    Click-Element $element $desc
}

# 1. Find Main Window
Log "Attaching to NinjaTrader..."
$proc = Get-Process NinjaTrader -ErrorAction SilentlyContinue
if (-not $proc) { Log "NinjaTrader not running!"; exit 1 }

$root = [System.Windows.Automation.AutomationElement]::RootElement
$condWindow = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$mainWindow = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condWindow)

if (-not $mainWindow) { Log "Main Window not found via UIA."; exit 1 }
Log "Main Window Found: $($mainWindow.Current.Name)"

# 2. Open "Connections" Menu
Log "Searching for 'Connections' menu item..."

$condMenu = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::MenuItem)
$menus = $mainWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condMenu)

$connMenu = $null
foreach ($m in $menus) {
    if ($m.Current.Name -eq "Connections" -or $m.Current.Name -eq "Verbindungen") {
        $connMenu = $m
        break
    }
}

if (-not $connMenu) { 
    Log "Could not find 'Connections' menu." 
    exit 1 
}

Interact-Element $connMenu "Connections Menu"
Start-Sleep -Milliseconds 1000

# 3. Find "Configure" aka "Konfigurieren"
Log "Searching for 'configure'..."

# Using Global Search (Depth Limited by assumption)
$condNameConf = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "configure")
$condNameKonf = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "konfigurieren")

$confItem = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condNameConf)
if (-not $confItem) {
    $confItem = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condNameKonf)
}

if ($confItem) {
    Interact-Element $confItem "Configure Item"
}
else {
    Log "❌ Could not find 'configure' menu item via global search."
}

Start-Sleep -Seconds 2

# 4. Find "Connections" Window (The Dialog)
Log "Waiting for 'Connections' Dialog..."
$condDialog = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Connections")
$condDialogDe = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Verbindungen")

$dialog = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condDialog)
if (-not $dialog) { $dialog = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condDialogDe) }

if ($dialog) {
    Log "✅ Found Connections Dialog!"
    
    # Discovery Mode: Dump Children to understand structure
    Log "--- Dialog Structure ---"
    $children = $dialog.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($c in $children) {
        $name = $c.Current.Name
        if ([string]::IsNullOrEmpty($name)) { $name = "(NoName)" }
        Log "Type: $($c.Current.ControlType.ProgrammaticName) | Name: '$name' | ID: '$($c.Current.AutomationId)'"
    }
}
else {
    Log "❌ Dialog not found."
}

Log "Done."
