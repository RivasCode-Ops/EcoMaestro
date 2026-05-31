@echo off
REM EcoMaestro autonomo: so abre o HTML no navegador (sem porta 8770, sem PowerShell servidor)
cd /d "%~dp0"
if not exist "%~dp0index.html" (
  echo index.html nao encontrado em %~dp0
  pause
  exit /b 1
)
if exist "%~dp0EcoMaestro-Autonomo.vbs" (
  wscript //nologo "%~dp0EcoMaestro-Autonomo.vbs"
) else (
  start "" "%~dp0index.html"
)
exit /b 0
