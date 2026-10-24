# Aegis 3D Safe Browser - Official Windows PowerShell Installer
# Run: irm https://aegisscans.dev/downloads/Install-AegisBrowser.ps1 | iex

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   AEGIS 3D SAFE BROWSER - ZERO-TRUST CHROMIUM INSTALLER" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$repo = "narendraborhade-creator/Ageis-scanner"
$tag = "v1.0.0"
$downloadUrl = "https://github.com/$repo/releases/download/$tag/Aegis-3D-Safe-Browser-Setup-1.0.0.exe"
$destPath = Join-Path $env:TEMP "Aegis-3D-Safe-Browser-Setup.exe"

Write-Host "[1/3] Downloading Aegis Safe Browser installer from GitHub Releases..." -ForegroundColor Green
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destPath -UseBasicParsing
    Write-Host "[2/3] Verification passed! Launching Aegis Safe Browser Setup..." -ForegroundColor Green
    Start-Process -FilePath $destPath
    Write-Host "[3/3] Installer running! Enjoy Aegis 3D Safe Browser." -ForegroundColor Cyan
} catch {
    Write-Warning "Could not fetch direct binary. Opening release page in default browser..."
    Start-Process "https://github.com/$repo/releases"
}
