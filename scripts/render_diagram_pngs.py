"""Render submitted diagram PDFs without the native PNG export's clipped strokes."""
import json
import subprocess
from pathlib import Path

for pdf in sorted(Path('lab6/diagrams').glob('*.pdf')):
    subprocess.run(['gs','-q','-dSAFER','-dBATCH','-dNOPAUSE','-sDEVICE=png16m','-r160',
                    '-sOutputFile='+str(pdf.with_suffix('.png')),str(pdf)],check=True)
Path('lab6/diagrams/rendering.json').write_text(json.dumps({
    'model':'Native StarUML MDJ objects',
    'svg':'StarUML built-in SVG export',
    'pdf':'Chromium typesetting of the unmodified native SVG',
    'png':'Ghostscript rendering of those vector PDFs',
    'reason':'Preserve complete strokes: native PNG exporter omitted portions of borders.'},indent=2)+'\n',encoding='utf-8')
