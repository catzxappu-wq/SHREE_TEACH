@echo off
title SHREE TEACH — 24x7 Examination Server
echo ========================================================
echo   SHREE TEACH 24x7 JEE Preparation Platform Server
echo ========================================================
cd /d "%~dp0"
python server.py --port 8000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server stopped with error code %ERRORLEVEL%.
    pause
)
