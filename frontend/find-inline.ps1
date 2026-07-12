$content = Get-Content "C:\Users\Usuario\Downloads\StockMaster - PRO\frontend\src\features\settings\pages\SettingsPage.tsx" -Raw
$matches = [System.Text.RegularExpressions.Regex]::Matches($content, 'style=\{([^}]+)\}')
$count = 0
foreach ($m in $matches) {
    $count++
    $line = $content.Substring(0, $m.Index).Split("`n").Count
    $val = $m.Groups[1].Value.Trim()
    if ($val.Length -gt 100) { $val = $val.Substring(0, 100) + "..." }
    Write-Host "Line $line: $val"
}
Write-Host "Total: $count"