param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CommandArgs
)

$ErrorActionPreference = "Stop"

function Get-PreferredPython {
  $candidates = @()

  $preferredLocal = Join-Path $env:LocalAppData "Programs\Python\Python313\python.exe"
  if (Test-Path $preferredLocal) {
    $candidates += $preferredLocal
  }

  $programsRoot = Join-Path $env:LocalAppData "Programs\Python"
  if (Test-Path $programsRoot) {
    $candidates += Get-ChildItem $programsRoot -Recurse -Filter python.exe -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending |
      Select-Object -ExpandProperty FullName
  }

  $venvCandidate = Join-Path (Split-Path -Parent $PSScriptRoot) ".venv\Scripts\python.exe"
  if (Test-Path $venvCandidate) {
    $candidates = @($venvCandidate) + $candidates
  }

  $resolved = $candidates |
    Where-Object { $_ -and (Test-Path $_) } |
    Select-Object -Unique |
    Select-Object -First 1

  if (-not $resolved) {
    throw "Python executable was not found. Install Python 3.12+ and retry."
  }

  return $resolved
}

if (-not $CommandArgs -or $CommandArgs.Count -eq 0) {
  throw "Specify Python arguments to run."
}

$pythonExe = Get-PreferredPython
& $pythonExe @CommandArgs
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  exit $exitCode
}
