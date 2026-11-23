param(
  [ValidateSet('build','finish','inspect','open')][string]$Action = 'build'
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$env:ELECTRON_RUN_AS_NODE = $null
$starumlExe = 'C:\Program Files\StarUML\StarUML.exe'
New-Item -ItemType Directory -Force -Path 'lab6','lab6/logs' | Out-Null
if ($Action -eq 'build') {
  New-Item -ItemType Directory -Force -Path 'lab6/source' | Out-Null
  $externalModel = Join-Path $taskRoot '../../ARIA-StarUML2.mdj'
  if (Test-Path -LiteralPath $externalModel) {
    Copy-Item -LiteralPath $externalModel -Destination 'lab6/source/ARIA-StarUML2.mdj' -Force
  } elseif (!(Test-Path 'lab6/source/ARIA-StarUML2.mdj')) {
    throw 'No original model or preserved source copy was found.'
  }
  $modelPath = Join-Path $taskRoot 'lab6/source/ARIA-StarUML2.mdj'
  $templatePath = Join-Path $taskRoot 'scripts/lab6.ejs'
} elseif ($Action -eq 'open') {
  $modelPath = Join-Path $taskRoot 'lab6/ARIA-Lab6.mdj'
  Start-Process -FilePath $starumlExe -ArgumentList @('"' + $modelPath + '"') -WindowStyle Hidden
  exit
} else {
  $modelPath = Join-Path $taskRoot 'lab6/ARIA-Lab6.mdj'
  $templatePath = Join-Path $taskRoot ('scripts/' + $Action + '.ejs')
}
$outputPath = Join-Path $taskRoot ('lab6/logs/' + $Action + '.txt')
if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath }
$arguments = 'ejs "' + $modelPath + '" -t "' + $templatePath + '" -o "' + $outputPath + '" --user-data-dir="' + (Join-Path $taskRoot 'build/staruml-profile') + '"'
$process = Start-Process -FilePath $starumlExe -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput ('lab6/logs/' + $Action + '-stdout.txt') -RedirectStandardError ('lab6/logs/' + $Action + '-stderr.txt')
$deadline = [DateTime]::UtcNow.AddSeconds(120)
while (!(Test-Path -LiteralPath $outputPath) -and !$process.HasExited -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 500 }
if (!$process.HasExited) {
  $process.WaitForExit(3000) | Out-Null
  if (!$process.HasExited) { Stop-Process -Id $process.Id }
}
Get-Content -LiteralPath ('lab6/logs/' + $Action + '-stdout.txt') -Encoding UTF8
Get-Content -LiteralPath ('lab6/logs/' + $Action + '-stderr.txt') -Encoding UTF8
if (!(Test-Path -LiteralPath $outputPath)) { throw 'StarUML did not create the completion file; inspect logs.' }
