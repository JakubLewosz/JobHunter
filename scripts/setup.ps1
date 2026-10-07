$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Zainstaluj Node.js 24 LTS z nodejs.org.' }
  $taskNodeMajor = (& node -p "process.versions.node.split('.')[0]")
  if ($taskNodeMajor -ne '24') { throw 'Wymagany Node.js 24 LTS.' }
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw 'Instalacja nieudana. Sprawdz wymagania better-sqlite3 i Node 24.' }
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Build nieudany.' }
  & node scripts/doctor.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Diagnostyka nieudana.' }
} finally { Pop-Location }
