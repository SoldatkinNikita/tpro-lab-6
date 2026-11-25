"""Modify an isolated copy of code produced by StarUML's Python extension."""
import ast
import difflib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'lab6'
source=LAB/'generated/python'
target=LAB/'reverse-input/python'
shutil.copytree(source,target,dirs_exist_ok=True)
(target/'__init__.py').write_text('',encoding='utf-8')
search=next(target.rglob('AudioSearchService.py'))
analysis=next(target.rglob('AudioAnalysisService.py'))
for file in (search,analysis):
    original=(source/file.relative_to(target)).read_text(encoding='utf-8')
    tree=ast.parse(original)
    cls=next(n for n in tree.body if isinstance(n,ast.ClassDef))
    init=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='__init__')
    if file==search:
        init.body.append(ast.parse('self.limit: int = 20').body[0])
        cls.body.append(ast.parse('def set_limit(self, limit: int):\n    self.limit = limit').body[0])
    else:
        old=len(init.body)
        init.body=[n for n in init.body if not (isinstance(n,ast.Assign) and any(isinstance(t,ast.Attribute) and t.attr=='model_name' for t in n.targets))]
        assert len(init.body)==old-1
        if not init.body:init.body=[ast.Pass()]
    modified=ast.unparse(ast.fix_missing_locations(tree))+'\n'
    file.write_text(modified,encoding='utf-8')
    diff=''.join(difflib.unified_diff(original.splitlines(keepends=True),modified.splitlines(keepends=True),fromfile=str((source/file.relative_to(target)).relative_to(LAB)),tofile=str(file.relative_to(LAB))))
    (LAB/(file.stem+'.diff')).write_text(diff,encoding='utf-8')
for directory in (source,target):
    for file in directory.rglob('*.py'):compile(file.read_text(encoding='utf-8'),str(file),'exec')
(LAB/'roundtrip-changes.json').write_text(json.dumps({'generator':'StarUML python:generate','reverse':'StarUML python:reverse','changes':[
    {'class':'AudioSearchService','addedAttribute':'limit: int = 20','addedOperation':'set_limit(limit: int)'},
    {'class':'AudioAnalysisService','removedAttribute':'model_name'}]},indent=2)+'\n',encoding='utf-8')
print('Native code copied; two classes changed; all Python files compile.')
