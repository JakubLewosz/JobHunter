$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try { & node scripts/doctor.mjs; if ($LASTEXITCODE -ne 0) { throw 'Diagnostyka wykryla problem.' } } finally { Pop-Location }
