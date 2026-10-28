$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$uvPath = Join-Path $projectRoot '.tools\uv\uv.exe'
$downloadDir = Join-Path $projectRoot '.tools\downloads'
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
if (-not (Test-Path -LiteralPath $uvPath)) {
  $uvArchive = Join-Path $downloadDir 'uv.zip'
  Invoke-WebRequest -Uri 'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip' -OutFile $uvArchive
  Expand-Archive -LiteralPath $uvArchive -DestinationPath (Join-Path $projectRoot '.tools\uv') -Force
}
$pythonDir = Join-Path $projectRoot '.tools\python-managed'
& $uvPath python install 3.13 --install-dir $pythonDir --no-bin --no-registry --cache-dir (Join-Path $projectRoot '.tools\uv-cache')
if ($LASTEXITCODE -ne 0) { throw 'Python download failed' }
$pythonExe = Get-ChildItem -LiteralPath $pythonDir -Filter python.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName
if (-not $pythonExe) { throw 'Python executable not found' }
$venvDir = Join-Path $projectRoot '.venv'
if (-not (Test-Path -LiteralPath (Join-Path $venvDir 'Scripts\python.exe'))) {
  & $pythonExe -m venv $venvDir
  if ($LASTEXITCODE -ne 0) { throw 'Virtual environment creation failed' }
}
& (Join-Path $venvDir 'Scripts\python.exe') --version
& (Join-Path $venvDir 'Scripts\python.exe') -m pip --version
