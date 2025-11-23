$files = @(
    "src\components\ShooterGameFull.jsx",
    "src\components\ThreeDHomeScreen.jsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $content = $content.Replace("'Public Pixel'", "'PublicPixel'")
    [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
    Write-Host "Updated $file - replaced 'Public Pixel' with 'PublicPixel'"
}

Write-Host "`nFont name updated to 'PublicPixel' (no spaces) for better browser compatibility"
