$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
New-Item -ItemType Directory -Force -Path 'build','build/review','dist' | Out-Null
python scripts/render_diagram_vectors.py
if ($LASTEXITCODE -ne 0) { throw 'SVG typesetting failed' }
docker run --rm --network none -e HOME=/tmp --mount "type=bind,source=$taskRoot,target=/workspace" -w /workspace texlive/texlive:latest python3 scripts/render_diagram_pngs.py
if ($LASTEXITCODE -ne 0) { throw 'Diagram PNG rendering failed' }
python scripts/audit_artifacts.py
if ($LASTEXITCODE -ne 0) { throw 'Artifact audit failed' }
docker run --rm --network none -e HOME=/tmp --mount "type=bind,source=$taskRoot,target=/workspace" -w /workspace texlive/texlive:latest latexmk -lualatex -interaction=nonstopmode -halt-on-error -outdir=build main.tex
if ($LASTEXITCODE -ne 0) { throw 'LaTeX compilation failed' }
$reviewRoot = (Resolve-Path -LiteralPath 'build/review').Path
Get-ChildItem -LiteralPath $reviewRoot -Filter 'page-*.png' -File | ForEach-Object {
  if ($_.DirectoryName -ne $reviewRoot) { throw 'Unexpected review output path' }
  Remove-Item -LiteralPath $_.FullName
}
docker run --rm --network none -e HOME=/tmp --mount "type=bind,source=$taskRoot,target=/workspace" -w /workspace texlive/texlive:latest gs -q -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r65 '-sOutputFile=build/review/page-%02d.png' build/main.pdf
if ($LASTEXITCODE -ne 0) { throw 'PDF rendering failed' }
python -c "from pathlib import Path; import shutil; name=''.join(chr(c) for c in [1051,1072,1073,1086,1088,1072,1090,1086,1088,1085,1072,1103])+ ' '+ ''.join(chr(c) for c in [1088,1072,1073,1086,1090,1072])+' '+chr(8470)+'6 '+''.join(chr(c) for c in [1057,1086,1083,1076,1072,1090,1082,1080,1085])+' '+chr(1053)+'.'+chr(1057)+'. '+chr(1048)+chr(1059)+'5-11'+chr(1052)+'.pdf'; shutil.copy2('build/main.pdf',Path('dist')/name)"
