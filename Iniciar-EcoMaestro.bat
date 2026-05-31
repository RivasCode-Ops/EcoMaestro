@echo off
chcp 65001 >nul
title EcoMaestro
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8770" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Iniciando EcoMaestro...
start "EcoMaestro Servidor" /MIN powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Servidor-local.ps1"

set /a _t=0
:aguarda
timeout /t 1 /nobreak >nul
set /a _t+=1
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8770/' -TimeoutSec 2).StatusCode" >nul 2>&1
if %errorlevel%==0 goto ok
if !_t! lss 8 goto aguarda
echo Aviso: servidor demorou; abra http://127.0.0.1:8770/
:ok
start "" "http://127.0.0.1:8770/"
