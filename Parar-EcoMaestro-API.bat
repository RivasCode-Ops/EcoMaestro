@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8771" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo EcoMaestro API (8771) encerrada.
timeout /t 2 >nul
