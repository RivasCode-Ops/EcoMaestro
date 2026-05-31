# Servidor HTTP local — EcoMaestro (127.0.0.1:8770)
$Root = (Resolve-Path $PSScriptRoot).Path
$Port = 8770
$Prefix = "http://127.0.0.1:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Prefix)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "ERRO: nao foi possivel iniciar em $Prefix"
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "Tente executar como Administrador."
  Read-Host "Pressione Enter para sair"
  exit 1
}

Write-Host "EcoMaestro rodando em $Prefix"
Write-Host "Pasta: $Root"
Write-Host "Feche esta janela para encerrar."

if (-not $env:ECOMAESTRO_NO_BROWSER) {
  Start-Process "$Prefix"
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
}

function Send-Response($ctx, $status, $body, $contentType) {
  $ctx.Response.StatusCode = $status
  if ($contentType) { $ctx.Response.ContentType = $contentType }
  $bytes = [Text.Encoding]::UTF8.GetBytes($body)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}

function Send-File($ctx, $path) {
  $full = [IO.Path]::GetFullPath($path)
  if (-not $full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) {
    Send-Response $ctx 403 '403' 'text/plain; charset=utf-8'
    return
  }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
    Send-Response $ctx 404 '404' 'text/plain; charset=utf-8'
    return
  }
  $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
  $ctx.Response.ContentType = $mime[$ext]
  if (-not $ctx.Response.ContentType) { $ctx.Response.ContentType = 'application/octet-stream' }
  $bytes = [IO.File]::ReadAllBytes($full)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    if ($ctx.Request.HttpMethod -eq 'HEAD') {
      $ctx.Response.Close()
      continue
    }
    $raw = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($raw)) { $raw = 'index.html' }
    $safe = $raw -replace '\.\.', '' -replace '\\', '/'
    $file = Join-Path $Root ($safe -replace '/', [IO.Path]::DirectorySeparatorChar)
    Send-File $ctx $file
  } catch {
    if ($listener.IsListening) { Write-Host "Erro: $_" }
  }
}
