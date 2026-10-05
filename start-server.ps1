# SHREE TEACH 24x7 Examination Server Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SHREE TEACH — 24x7 Examination Platform Server" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Access URL : http://localhost:8000" -ForegroundColor Green
Write-Host "Health API : http://localhost:8000/api/health" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
python server.py --port 8000
