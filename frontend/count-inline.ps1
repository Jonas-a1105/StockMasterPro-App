$files = @(
"src/features/inventory/components/ProductsTab.tsx",
"src/features/reports/pages/ReportsPage.tsx",
"src/features/fiscal/pages/FiscalPage.tsx",
"src/features/agenda/pages/AgendaDigitalPage.tsx",
"src/features/best-sellers/pages/BestSellersPage.tsx"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  $matches = [System.Text.RegularExpressions.Regex]::Matches($content, 'style=\{([^}]+)\}')
  $count = $matches.Count
  Write-Host "${f}: ${count}"
}