$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try { & node scripts/stop.mjs; if ($LASTEXITCODE -ne 0) { throw 'Nie udalo sie zatrzymac JobHunter przez jego uwierzytelniony endpoint.' } } finally { Pop-Location }
