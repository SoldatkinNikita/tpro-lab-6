"""Render a real StarUML HTML export in an isolated headless browser profile."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
model=json.loads((ROOT/'lab6/ARIA-Lab6.mdj').read_text(encoding='utf-8'))


def find(x):
    if isinstance(x,dict):
        if x.get('_type')=='UMLClass' and x.get('name')=='AudioSearchService':
            return x
        for value in x.values():
            result=find(value)
            if result:return result
    if isinstance(x,list):
        for value in x:
            result=find(value)
            if result:return result


item=find(model)
page=ROOT/'lab6/docs/html/contents'/(hashlib.md5(item['_id'].encode()).hexdigest()+'.html')
assert page.exists()
chrome=Path(r'C:\Program Files\Google\Chrome\Application\chrome.exe')
if not chrome.exists():chrome=Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
target=ROOT/'lab6/docs/documentation-example.png'
args=[str(chrome),'--headless=new','--disable-gpu','--disable-extensions','--disable-background-networking',
      '--no-first-run','--no-default-browser-check','--hide-scrollbars','--window-size=1400,1200',
      '--virtual-time-budget=3000','--user-data-dir='+str(ROOT/'build/docs-profile'),
      '--screenshot='+str(target),page.as_uri()]
with (ROOT/'build/documentation-render.log').open('wb') as output:
    subprocess.run(args,stdout=output,stderr=subprocess.STDOUT,check=True,timeout=45)
assert target.exists()
print(target)
