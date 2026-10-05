@echo off
title SHREE TEACH — Install 24x7 Windows Auto-Startup
cd /d "%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%~dp0start-hidden.vbs"
echo ========================================================
echo   SHREE TEACH — 24x7 Windows Auto-Startup Setup
echo ========================================================
echo Target Startup Folder: %STARTUP_FOLDER%
echo Linking script: %VBS_FILE%
echo.
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\ShreeTeachServer.lnk'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_FILE%\"'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Save()"
echo.
echo [SUCCESS] SHREE TEACH 24x7 Server has been registered to run automatically
echo           in the background every time Windows starts up!
echo.
echo To run it immediately without restarting Windows, execute: start-server.bat
echo ========================================================
pause
