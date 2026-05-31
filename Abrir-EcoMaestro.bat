@echo off
chcp 65001 >nul
REM Um clique: API + navegador. Fixe ESTE arquivo na barra de tarefas.
REM Uso com projeto: Abrir-EcoMaestro.bat XAXA
set "PROJ=%~1"
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node 18+.
  pause
  exit /b 1
)

netstat -ano | findstr ":8771" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
  start "EcoMaestro API" /MIN cmd /c "cd /d %~dp0 && node server.mjs"
  timeout /t 2 /nobreak >nul
)

if not "%PROJ%"=="" (
  start "" "http://127.0.0.1:8771/?project=%PROJ%"
) else (
  start "" "http://127.0.0.1:8771/"
)
