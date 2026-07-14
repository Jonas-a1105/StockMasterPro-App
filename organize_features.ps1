# Organize all features - move components with .module.css to their own folders

$features = Get-ChildItem "C:\Users\Usuario\Downloads\StockMaster - PRO\frontend\src\features" -Directory | Where-Object { $_.Name -ne 'shared-ui' } | Select-Object -ExpandProperty Name

foreach ($feature in $features) {
    $compDir = "C:\Users\Usuario\Downloads\StockMaster - PRO\frontend\src\features\$feature\components"
    if (-not (Test-Path $compDir)) { continue }
    
    # Find .tsx files that have corresponding .module.css
    $tsxFiles = Get-ChildItem $compDir -Filter "*.tsx" | Where-Object { -not $_.Name.StartsWith("index") }
    
    foreach ($tsx in $tsxFiles) {
        $component = $tsx.BaseName
        $cssPath = "$compDir\$component.module.css"
        
        if (Test-Path $cssPath) {
            $destDir = "$compDir\$component"
            if (-not (Test-Path $destDir)) {
                Write-Host "Moving $feature/$component to folder..."
                New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                
                Move-Item "$compDir\$component.tsx" "$destDir\$component.tsx" -Force
                Move-Item "$compDir\$component.module.css" "$destDir\$component.module.css" -Force
                
                Set-Content "$destDir\index.ts" "export { $component } from './$component';"
                Write-Host "  Created $destDir"
            }
        }
    }
}

Write-Host "Component folder creation complete."