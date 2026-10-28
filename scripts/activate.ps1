$projectRoot = Split-Path -Parent $PSScriptRoot
$projectPaths = @((Join-Path $projectRoot '.venv\Scripts'), (Join-Path $projectRoot 'node_modules\.bin'), (Join-Path $projectRoot '.tools\uv'))
$env:Path = ($projectPaths -join ';') + ';' + $env:Path
$env:GEMINI_CLI_HOME = Join-Path $projectRoot '.tools\gemini-home'
Write-Output 'Project tools activated for this terminal: python, pip, gemini, uv.'
Write-Output 'Run npm run doctor to verify. No global PATH changes were made.'
