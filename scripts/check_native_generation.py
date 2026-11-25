"""Verify unmodified standard generator implementations and their actual outputs."""
import ast
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
installed=Path(r'C:\Users\nikit\AppData\Roaming\StarUML\extensions\user')
sources=[('python','code-generator.js'),('python','code-analyzer.js'),('ddl','ddl-generator.js')]
checks=[]
for language,name in sources:
    local=ROOT/'build/vendor'/(language+'-extension')/('staruml-'+language+'-master')/name
    extension=installed/('niklauslee.staruml-'+language)/name
    assert local.read_bytes()==extension.read_bytes(), name+' differs from standard distribution'
    checks.append({'extension':language,'module':name,'sha256':hashlib.sha256(extension.read_bytes()).hexdigest(),'unmodified':True})
files=sorted((ROOT/'lab6/generated/python').rglob('*.py'))
classes=[]
for file in files:
    text=file.read_text(encoding='utf-8')
    compile(text,str(file),'exec')
    classes.extend(n.name for n in ast.parse(text).body if isinstance(n,ast.ClassDef))
assert len(classes)==22 and len(set(classes))==22
reverse=json.loads((ROOT/'lab6/validation/native-reverse.json').read_text(encoding='utf-8'))
assert reverse['command']=='python:reverse' and reverse['classes']==22 and reverse['changesVerified']
result={'status':'passed','standardModules':checks,'generatedClasses':classes,
        'pythonCommand':'python:generate','reverseCommand':'python:reverse','ddlCommand':'ddl:generate'}
(ROOT/'lab6/validation/native-generation-provenance.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print('Standard generators are unmodified; 22 generated and 22 reverse-engineered classes verified.')
