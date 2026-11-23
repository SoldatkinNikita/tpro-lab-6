Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
$pages = @(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'build/review') -Filter 'page-*.png' | Sort-Object Name)
for ($start = 0; $start -lt $pages.Count; $start += 12) {
  $canvas = New-Object System.Drawing.Bitmap 1600,1740
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.Clear([System.Drawing.Color]::LightGray)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $font = New-Object System.Drawing.Font 'Arial',14
  for ($i = 0; $i -lt 12 -and $start + $i -lt $pages.Count; $i++) {
    $page = $pages[$start+$i]
    $bitmap = [System.Drawing.Image]::FromFile($page.FullName)
    $x = ($i % 4)*400
    $y = [Math]::Floor($i/4)*580
    $g.DrawString($page.BaseName,$font,[System.Drawing.Brushes]::Black,$x+10,$y+3)
    $g.DrawImage($bitmap,[int]($x+10),[int]($y+30),380,538)
    $bitmap.Dispose()
  }
  $g.Dispose()
  $font.Dispose()
  $target = Join-Path $taskRoot ('build/review/contact-'+([int]($start/12)+1)+'.png')
  $canvas.Save($target,[System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
}
