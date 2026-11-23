"""Typeset native StarUML SVG exports as cropped vector PDFs; no diagram drawing."""
from concurrent.futures import ThreadPoolExecutor
import re
import shutil
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CHROME=Path(r'C:\Program Files\Google\Chrome\Application\chrome.exe')
if not CHROME.exists():CHROME=Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
OUT=ROOT/'build/staruml'
OUT.mkdir(parents=True,exist_ok=True)


def render(source):
    pdf=OUT/(source.stem+'.pdf')
    if pdf.exists() and pdf.stat().st_mtime >= max(source.stat().st_mtime,Path(__file__).stat().st_mtime):
        shutil.copy2(pdf,ROOT/'lab6/diagrams'/pdf.name)
        return source.stem
    svg=source.read_text(encoding='utf-8')
    tag=re.search(r'<svg\b[^>]*>',svg)[0]
    width=float(re.search(r'\bwidth="([\d.]+)"',tag)[1])
    height=float(re.search(r'\bheight="([\d.]+)"',tag)[1])
    html=OUT/(source.stem+'.html')
    crop_script='''<script>
const svg=document.querySelector('svg');
const box=svg.getBBox(), w=Math.ceil(box.width+20), h=Math.ceil(box.height+20);
svg.setAttribute('viewBox',`${box.x-10} ${box.y-10} ${w} ${h}`);
svg.setAttribute('width',w);svg.setAttribute('height',h);
document.head.insertAdjacentHTML('beforeend',`<style>@page{size:${w}px ${h}px;margin:0}html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden}</style>`);
</script>'''
    html.write_text(f'<!doctype html><meta charset="utf-8"><style>@page{{size:{width}px {height}px;margin:0}}html,body{{margin:0;padding:0;width:{width}px;height:{height}px}}svg{{display:block}}</style>'+svg+crop_script,encoding='utf-8')
    with (OUT/(source.stem+'.txt')).open('wb') as log:
        subprocess.run([str(CHROME),'--headless=new','--disable-gpu','--disable-extensions',
                        '--disable-background-networking','--no-first-run','--no-default-browser-check',
                        '--no-pdf-header-footer','--user-data-dir='+str(OUT/('profile-'+source.stem)),
                        '--print-to-pdf='+str(pdf),html.as_uri()],
                       stdout=log,stderr=subprocess.STDOUT,check=True,timeout=45)
    assert pdf.stat().st_size>1000
    shutil.copy2(pdf,ROOT/'lab6/diagrams'/pdf.name)
    return source.stem


with ThreadPoolExecutor(max_workers=2) as pool:
    print('Rendered native SVG diagrams: '+', '.join(pool.map(render,sorted((ROOT/'lab6/diagrams').glob('*.svg')))))
