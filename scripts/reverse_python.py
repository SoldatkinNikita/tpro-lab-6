"""Prepare an isolated round-trip example and parse its actual Python AST."""
from __future__ import annotations

import ast
import difflib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'lab6'


def contract(text: str) -> list[dict]:
    result = []
    for cls in ast.parse(text).body:
        if not isinstance(cls, ast.ClassDef):
            continue
        item = {'name': cls.name, 'attributes': [], 'operations': []}
        for node in cls.body:
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                item['attributes'].append({'name': node.target.id.lstrip('_'),
                                           'type': ast.unparse(node.annotation),
                                           'visibility': 'private' if node.target.id.startswith('_') else 'public'})
            if isinstance(node, ast.FunctionDef):
                item['operations'].append({'name': node.name,
                    'parameters': [{'name': a.arg, 'type': ast.unparse(a.annotation) if a.annotation else 'object'}
                                   for a in node.args.args if a.arg != 'self'],
                    'returns': ast.unparse(node.returns) if node.returns else 'None'})
        result.append(item)
    return result


def main() -> None:
    source = LAB / 'generated/aria_design.py'
    original = source.read_text(encoding='utf-8')
    tree = ast.parse(original)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'AudioSearchService')
    cls.body.insert(1, ast.AnnAssign(target=ast.Name(id='_limit', ctx=ast.Store()),
                                    annotation=ast.Name(id='int'), value=None, simple=1))
    cls.body = [n for n in cls.body if not (isinstance(n, ast.FunctionDef) and n.name == 'build_conditions')]
    search = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == 'search')
    search.args.args.append(ast.arg(arg='limit', annotation=ast.Name(id='int')))
    cls.body.append(ast.parse('def set_limit(self, limit: int) -> None:\n    raise NotImplementedError').body[0])
    modified = '# Isolated copy for reverse engineering. See roundtrip.diff.\n' + ast.unparse(ast.fix_missing_locations(tree)) + '\n'
    dest = LAB / 'reverse-input'
    dest.mkdir(exist_ok=True)
    (dest / 'aria_design.py').write_text(modified, encoding='utf-8')
    (LAB / 'roundtrip.diff').write_text(''.join(difflib.unified_diff(
        original.splitlines(keepends=True), modified.splitlines(keepends=True),
        fromfile='generated/aria_design.py', tofile='reverse-input/aria_design.py')), encoding='utf-8')
    before, after = contract(original), contract(modified)
    (LAB / 'reverse-contract.json').write_text(json.dumps(after, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (LAB / 'roundtrip-changes.json').write_text(json.dumps({
        'method': 'Python ast -> JSON -> native StarUML UMLClass objects; separate imported package',
        'class': 'AudioSearchService',
        'changes': ['add private limit: int', 'add public set_limit(limit: int) -> None',
                    'search gains limit: int', 'remove build_conditions() -> dict[str, str]'],
        'before': next(c for c in before if c['name']=='AudioSearchService'),
        'after': next(c for c in after if c['name']=='AudioSearchService')}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    compile(original, str(source), 'exec')
    compile(modified, str(dest / 'aria_design.py'), 'exec')
    print(f'Parsed {len(after)} classes; baseline and modified skeletons compile.')


if __name__ == '__main__':
    main()
