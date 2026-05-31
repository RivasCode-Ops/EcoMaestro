' EcoMaestro — abre no navegador sem terminal, servidor ou instalacao
Option Explicit
Dim sh, fso, dir, html
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
html = dir & "\index.html"
If fso.FileExists(html) Then
  sh.Run """" & html & """", 1, False
Else
  MsgBox "Arquivo index.html nao encontrado em:" & vbCrLf & dir, vbCritical, "EcoMaestro"
End If
