param([ValidateSet('prepare','reverse','export')][string]$Phase='prepare')
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$env:ELECTRON_RUN_AS_NODE=''
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
New-Item -ItemType Directory -Force -Path 'lab6/logs','build/native' | Out-Null
$done=Join-Path $taskRoot ('lab6/logs/native-'+$Phase+'.json')
if(Test-Path -LiteralPath $done){Remove-Item -LiteralPath $done}
$job=@{root=$taskRoot;phase=$Phase;module=(Join-Path $taskRoot 'scripts/native-workflow.cjs');done=$done;error=(Join-Path $taskRoot ('lab6/logs/native-'+$Phase+'-error.txt'));autorun=$true;model=(Join-Path $taskRoot 'lab6/ARIA-Lab6.mdj')}
$jobPath=Join-Path $taskRoot 'build/native/job.json'
$utf8=New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText($jobPath,($job|ConvertTo-Json),$utf8)
$process=Start-Process -FilePath 'C:\Program Files\StarUML\StarUML.exe' -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput ('lab6/logs/native-'+$Phase+'-stdout.txt') -RedirectStandardError ('lab6/logs/native-'+$Phase+'-stderr.txt')
$deadline=[DateTime]::UtcNow.AddSeconds(180)
while(!(Test-Path -LiteralPath $done) -and [DateTime]::UtcNow -lt $deadline){Start-Sleep -Milliseconds 500}
if(!$process.HasExited){$process.WaitForExit(2000)|Out-Null;if(!$process.HasExited){Stop-Process -Id $process.Id}}
if(!(Test-Path -LiteralPath $done)){throw 'Native command did not finish. Inspect the native logs.'}
$job.autorun=$false
[IO.File]::WriteAllText($jobPath,($job|ConvertTo-Json),$utf8)
$result=Get-Content -LiteralPath $done -Raw -Encoding UTF8|ConvertFrom-Json
if($result.status -ne 'passed'){throw $result.error}
$result|ConvertTo-Json
