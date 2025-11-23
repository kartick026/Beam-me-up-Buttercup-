$files = @(
    "src\components\ShooterGameFull.jsx",
    "src\components\ThreeDHomeScreen.jsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $content = $content.Replace("'Press Start 2P'", "'Public Pixel'")
    [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
    Write-Host "Updated $file"
}
