@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
set "LAUNCHER=%ROOT%Iniciar-EcoMaestro-API.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "LINK=%DESKTOP%\EcoMaestro.lnk"

if not exist "%LAUNCHER%" (
  echo Launcher nao encontrado: %LAUNCHER%
  pause
  exit /b 1
)

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath = '%LAUNCHER%';" ^
  "$s.WorkingDirectory = '%ROOT%';" ^
  "$s.Description = 'EcoMaestro — orquestrador ECO (API + UI)';" ^
  "$s.Save()"

if exist "%LINK%" (
  echo Atalho criado: %LINK%
  echo Abre http://127.0.0.1:8771/ com API e persistencia.
  echo Sem Node: use EcoMaestro-Autonomo.vbs ^(so analise offline^).
) else (
  echo Nao foi possivel criar o atalho.
)
pause
