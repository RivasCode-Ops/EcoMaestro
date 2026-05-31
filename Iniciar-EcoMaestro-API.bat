@echo off
chcp 65001 >nul
title EcoMaestro API
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node 18+ ou use EcoMaestro-Autonomo.vbs
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8771" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo EcoMaestro API + UI em http://127.0.0.1:8771/
start "EcoMaestro API" /MIN cmd /c "cd /d %~dp0 && node server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8771/"
