@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
set "TARGET=%ROOT%Abrir-EcoMaestro.bat"
set "DESKTOP=%USERPROFILE%\Desktop\EcoMaestro.lnk"
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\EcoMaestro.lnk"

powershell -NoProfile -Command ^
  "$w = New-Object -ComObject WScript.Shell;" ^
  "foreach ($p in @('%DESKTOP%','%STARTMENU%')) {" ^
  "  $s = $w.CreateShortcut($p);" ^
  "  $s.TargetPath = '%TARGET%';" ^
  "  $s.WorkingDirectory = '%ROOT%';" ^
  "  $s.Description = 'EcoMaestro — plano do dia (nao altera codigo do app)';" ^
  "  $s.Save() }"

echo.
echo Atalhos criados:
echo   %DESKTOP%
echo   %STARTMENU%
echo.
echo FIXAR NA BARRA DE TAREFAS:
echo   1. Win ou Desktop - abra "EcoMaestro"
echo   2. Botao direito no atalho - "Fixar na barra de tarefas"
echo.
echo Fluxo recomendado: Eco PRIMEIRO ^(Trabalhar^) - depois Cursor na pasta.
echo O Eco NAO modifica arquivos do XAXA/FREEDOM — so plano e registro.
pause
