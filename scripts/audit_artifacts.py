"""Audit persisted model references, source preservation and engineering artifacts."""
from __future__ import annotations

import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'lab6'


def objects(value):
    if isinstance(value, dict):
        if '_id' in value:
            yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


def refs(value):
    if isinstance(value, dict):
        if '$ref' in value:
            yield value['$ref']
        for child in value.values():
            yield from refs(child)
    elif isinstance(value, list):
        for child in value:
            yield from refs(child)


def count(items):
    c = collections.Counter(x['_type'] for x in items)
    relation_types = {'UMLAssociation','UMLDependency','UMLGeneralization','UMLInterfaceRealization',
                      'UMLAbstraction','UMLInclude','UMLExtend','UMLControlFlow','UMLObjectFlow',
                      'UMLMessage','UMLLink','ERDRelationship'}
    return {'packages': c['UMLPackage'], 'subsystems': c['UMLSubsystem'],
            'diagrams': sum(v for k,v in c.items() if k.endswith('Diagram')),
            'umlClasses': c['UMLClass'], 'relationships': sum(c[t] for t in relation_types),
            'logicalEntities': sum(x['_type']=='UMLClass' and x.get('stereotype')=='entity' for x in items),
            'tables': c['ERDEntity']}


def main():
    external = ROOT.parent.parent / 'ARIA-StarUML2.mdj'
    source = LAB / 'source/ARIA-StarUML2.mdj'
    assert source.read_bytes() == external.read_bytes(), 'Source copy changed'
    before = json.loads(source.read_text(encoding='utf-8-sig'))
    after = json.loads((LAB / 'ARIA-Lab6.mdj').read_text(encoding='utf-8'))
    old, new = list(objects(before)), list(objects(after))
    index = {x['_id']:x for x in new}
    assert len(new) == len(index), 'Duplicate IDs'
    assert {x['_id'] for x in old} <= index.keys(), 'Source model object removed'
    missing = sorted(set(refs(after))-index.keys())
    assert not missing, f'Unresolved references: {missing}'
    # Existing model properties are preserved; native serialization can add defaults.
    changes=[]
    for x in old:
        y=index[x['_id']]
        for k,v in x.items():
            if k not in ('ownedElements','ownedViews','subViews','attributes','operations','parameters') and y.get(k)!=v:
                changes.append({'id':x['_id'],'type':x['_type'],'name':x.get('name',''),'field':k,'before':v,'after':y.get(k)})
    original_diagrams=[x for x in old if x['_type'].endswith('Diagram')]
    for d in original_diagrams:
        assert {x['_id'] for x in d.get('ownedViews',[])} == {x['_id'] for x in index[d['_id']].get('ownedViews',[])}, d['name']
    lab=next(x for x in new if x.get('name')=='06. Проектирование и инженерия')
    added=list(objects(lab))
    diagrams=sorted([x for x in added if x['_type'].endswith('Diagram')],key=lambda x:x['name'])
    trace_views=[]
    for diagram in diagrams:
        if re.match(r'^(22|23|24|32|33)(?:\.| )',diagram['name']):
            views=[x for x in objects(diagram) if x['_type']=='UMLClassView']
            assert views, f'No classes in trace diagram: {diagram["name"]}'
            for view in views:
                # StarUML omits false-valued defaults when serializing views.
                assert not view.get('suppressAttributes',False), f'Hidden attributes: {diagram["name"]}'
                assert not view.get('suppressOperations',False), f'Hidden operations: {diagram["name"]}'
            trace_views.extend(views)
    for d in diagrams:
        for suffix in ['png','svg','pdf']:
            code=re.match(r'^\d+(?:\.\d+)?',d['name'])[0]
            assert (LAB / 'diagrams' / (code+'.'+suffix)).stat().st_size > 1000
    validation=json.loads((LAB/'validation/staruml-validation.json').read_text())
    assert not validation['errors']
    native_reverse=json.loads((LAB/'validation/native-reverse.json').read_text(encoding='utf-8'))
    assert native_reverse['changesVerified'] and native_reverse['command']=='python:reverse'
    generation=json.loads((LAB/'validation/native-generation.json').read_text(encoding='utf-8'))
    assert generation['classes']==22 and 'python:generate' in generation['commands']
    assert json.loads((LAB/'validation/postgresql.json').read_text())['status']=='passed'
    assert (LAB/'docs/html/index.html').exists()
    # Remove orphaned pages from earlier exports, retaining all current object pages.
    valid_pages={hashlib.md5(x['_id'].encode()).hexdigest() for x in new}
    valid_diagrams={hashlib.md5(x['_id'].encode()).hexdigest() for x in new if x['_type'].endswith('Diagram')}
    for directory,valid in [('contents',valid_pages),('diagrams',valid_diagrams)]:
        for page in (LAB/'docs/html'/directory).iterdir():
            if page.is_file() and re.fullmatch('[0-9a-f]{32}',page.stem) and page.stem not in valid:
                page.unlink()
    for page in (LAB/'docs/html').rglob('*'):
        if not page.is_file() or page.suffix not in {'.html','.css','.js'}:
            continue
        content=page.read_text(encoding='utf-8')
        normalized='\n'.join(line.rstrip() for line in content.splitlines())+'\n'
        if content!=normalized:
            page.write_text(normalized,encoding='utf-8')
    native=json.loads((LAB/'statistics.json').read_text(encoding='utf-8'))
    stats={'counting':'Exact persisted _type values; views excluded. Packages and subsystems counted separately. Source copies of classes in distinct packages counted separately.',
           'source':count(old),'total':count(new),'lab6':count(added),
           'canonicalAnalysis':native['canonicalAnalysis'],
           'diagrams':[{'id':d['_id'],'name':d['name']} for d in diagrams]}
    (LAB/'statistics.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (LAB/'finish-status.txt').write_text(f"StarUML native Python and DDL generation completed. {stats['lab6']['diagrams']} design diagrams, {stats['lab6']['tables']} tables, {native_reverse['classes']} reverse-engineered classes. Validation and PostgreSQL verification passed.\n",encoding='utf-8')
    result={'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'sourceIdentical':True,'originalObjectsPreserved':len(old),
            'originalDiagramsPreserved':len(original_diagrams),'unresolvedReferences':missing,
            'existingPropertyChanges':changes,'newDiagramExportsChecked':len(diagrams),
            'traceClassViewsWithVisibleAttributes':len(trace_views),
            'status':'passed'}
    (LAB/'validation/artifact-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'statistics':stats,'propertyChanges':len(changes)},ensure_ascii=False,indent=2))
    tex='\n'.join(r'\newcommand{\stat'+scope.title().replace('6','Six')+key[0].upper()+key[1:]+r'}{'+str(value)+'}'
                  for scope in ('source','total','lab6') for key,value in stats[scope].items())+'\n'
    (LAB/'statistics.tex').write_text(tex,encoding='utf-8')


if __name__=='__main__':
    main()
