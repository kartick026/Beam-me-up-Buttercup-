# Read the files
$shooterContent = Get-Content "src\components\ShooterGameFull.jsx" -Raw -Encoding UTF8
$homeContent = Get-Content "src\components\ThreeDHomeScreen.jsx" -Raw -Encoding UTF8

# Replace in ShooterGameFull.jsx - all instances of monospace with Public Pixel for titles
$shooterContent = $shooterContent -replace "fontFamily: 'monospace'", "fontFamily: `"'Public Pixel', cursive`""

# Replace in ThreeDHomeScreen.jsx
$homeContent = $homeContent -replace "fontFamily: 'monospace'", "fontFamily: `"'Public Pixel', cursive`""

# Save the files
[System.IO.File]::WriteAllText((Resolve-Path "src\components\ShooterGameFull.jsx").Path, $shooterContent)
[System.IO.File]::WriteAllText((Resolve-Path "src\components\ThreeDHomeScreen.jsx").Path, $homeContent)

Write-Host "Font family updated to Public Pixel in both files"
