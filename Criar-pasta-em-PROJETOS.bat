@echo off
chcp 65001 >nul
set "ROOT=c:\_PROJETOS"
set "SLUG=%~1"
if "%SLUG%"=="" (
  set /p SLUG=Nome da pasta em _PROJETOS: 
)
if "%SLUG%"=="" (
  echo Informe o nome da pasta.
  pause
  exit /b 1
)

set "DEST=%ROOT%\%SLUG%"
if not exist "%DEST%" mkdir "%DEST%"
if not exist "%DEST%\README.md" (
  echo # %SLUG%>> "%DEST%\README.md"
  echo.>> "%DEST%\README.md"
  echo Pasta criada pelo EcoMaestro. Proximo: workbench\Projeto Novo\TUTORIAL.md>> "%DEST%\README.md"
)

echo Pasta: %DEST%
start "" explorer "%DEST%"
pause
