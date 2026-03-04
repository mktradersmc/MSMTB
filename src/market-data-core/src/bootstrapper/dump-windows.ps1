Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond2 = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)

$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $cond2)
foreach ($w in $windows) {
    if ($w.Current.Name -match "Kontrollzentrum" -or $w.Current.Name -match "Control Center") {
        Write-Output "FOUND NINJATRADER: '$($w.Current.Name)'"
    } else {
        # Write-Output "Skipping: $($w.Current.Name)"
    }
}
