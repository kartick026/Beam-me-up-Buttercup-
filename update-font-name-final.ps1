$files = @(
    "src\components\ShooterGameFull.jsx",
    "src\components\ThreeDHomeScreen.jsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $content = $content.Replace("'PublicPixel'", "'GameFont'")
    [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
    Write-Host "Updated $file - replaced 'PublicPixel' with 'GameFont'"
}

Write-Host "`nFont name updated to 'GameFont' to force reload"
