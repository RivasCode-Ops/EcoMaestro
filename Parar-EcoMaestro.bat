@echo off
chcp 65001 >nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8770" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo EcoMaestro (porta 8770) encerrado.
timeout /t 2 >nul
