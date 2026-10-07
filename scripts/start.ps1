$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $taskRoot 'dist\apps\server\src\main.js'))) { throw 'Najpierw uruchom scripts\setup.ps1.' }
$taskDataRoot = if ($env:JOBHUNTER_DATA_DIR) { $env:JOBHUNTER_DATA_DIR } else { Join-Path $env:LOCALAPPDATA 'JobHunter' }
$taskDemo = Join-Path $taskDataRoot 'demo'
New-Item -ItemType Directory -Force -Path $taskDemo | Out-Null
$taskLaunch = Join-Path $taskDemo 'launch.json'
if (Test-Path -LiteralPath $taskLaunch) {
  $taskAlreadyRunning = $false
  try {
    $taskInfo = Get-Content -LiteralPath $taskLaunch -Raw | ConvertFrom-Json
    $taskHealth = Invoke-RestMethod -Uri ('http://127.0.0.1:' + $taskInfo.port + '/api/health') -TimeoutSec 2
    $taskAlreadyRunning = ($taskHealth.instance -eq 'JobHunter')
  } catch { $taskAlreadyRunning = $false }
  if ($taskAlreadyRunning) {
    Push-Location -LiteralPath $taskRoot
    try { & node scripts/open.mjs } finally { Pop-Location }
    return
  }
  Remove-Item -LiteralPath $taskLaunch
}
$taskNode = (Get-Command node -ErrorAction Stop).Source
$taskEntry = Join-Path $taskRoot 'dist\apps\server\src\main.js'
$taskProcess = Start-Process -FilePath $taskNode -ArgumentList ('"' + $taskEntry + '"') -WorkingDirectory $taskRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDemo 'stdout.log') -RedirectStandardError (Join-Path $taskDemo 'stderr.log')
for ($taskAttempt = 0; $taskAttempt -lt 60; $taskAttempt++) {
  if ($taskProcess.HasExited) { throw 'Backend zakonczyl prace. Sprawdz stderr.log w katalogu danych DEMO.' }
  if (Test-Path -LiteralPath $taskLaunch) {
    Push-Location -LiteralPath $taskRoot
    try { & node scripts/open.mjs } finally { Pop-Location }
    return
  }
  Start-Sleep -Milliseconds 250
}
throw 'Backend nie uruchomil panelu w 15 sekund. Sprawdz log lokalny; nie zamykano cudzych procesow.'
