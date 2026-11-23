@echo off
title Aegis 3D Safe Browser - Official Windows Installer
color 0b
echo ========================================================
echo    AEGIS 3D SAFE BROWSER - ZERO-TRUST CHROMIUM INSTALLER
echo ========================================================
echo.
echo Initializing download for Aegis 3D Safe Browser (x64 Windows)...
echo Source: https://github.com/narendraborhade-creator/Ageis-scanner
echo.

set "DOWNLOAD_URL=https://github.com/narendraborhade-creator/Ageis-scanner/releases/download/v1.0.0/Aegis-3D-Safe-Browser-Setup-1.0.0.exe"
set "DEST_FILE=%TEMP%\Aegis-3D-Safe-Browser-Setup.exe"

echo [1/3] Downloading installer package...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%DEST_FILE%')"

if exist "%DEST_FILE%" (
    echo [2/3] Download complete! Launching setup...
    start "" "%DEST_FILE%"
    echo [3/3] Setup launched successfully.
    echo.
    echo Aegis 3D Safe Browser is now installing on your system.
    timeout /t 5 >nul
    exit /b 0
) else (
    echo [!] Download failed or network error. Opening release page directly in your browser...
    start https://github.com/narendraborhade-creator/Ageis-scanner/releases
    pause
    exit /b 1
)
