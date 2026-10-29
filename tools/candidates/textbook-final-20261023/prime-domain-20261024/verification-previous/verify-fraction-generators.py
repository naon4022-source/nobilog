"""Replay generators in memory: three changed outputs, all other outputs identical."""
from pathlib import Path
from unittest.mock import patch
import hashlib
import importlib
import json
import runpy
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
sys.path[:0] = [str(SOURCE), str(SOURCE / '図')]
helpers = [importlib.import_module('fraction_layout'), importlib.import_module('図.fraction_layout')]
rows = json.loads((SOURCE / '縦分数_20261023/manifest.json').read_text())['items']
sha = lambda value: hashlib.sha256(value.encode()).hexdigest()
changed = {'M1-C1-S1-D07', 'M1-C1-S2-M06', 'M1-C1-S2-M08'}


def replay(identity):
    captured = {}

    def capture(path, value, *args, **kwargs):
        captured[path.stem] = value
        return len(value)

    with patch.object(Path, 'write_text', capture):
        if identity:
            with patch.object(helpers[0], 'final_svg', lambda ident, value: value), patch.object(helpers[1], 'final_svg', lambda ident, value: value):
                for name in ['図/extra.py', '計算のまちがい図を作る.py']:
                    runpy.run_path(str(SOURCE / name))
        else:
            for name in ['図/extra.py', '計算のまちがい図を作る.py']:
                runpy.run_path(str(SOURCE / name))
    return captured


before, after = replay(True), replay(False)
assert before.keys() == after.keys()
for ident in before:
    if ident in changed:
        assert sha(before[ident]) == rows[ident]['beforeSha256']
        assert sha(after[ident]) == rows[ident]['afterSha256']
    else:
        assert before[ident] == after[ident], ident
for helper in helpers:
    try:
        helper.final_svg('M1-C1-S2-M06', '<svg>unreviewed change</svg>')
    except ValueError:
        pass
    else:
        raise AssertionError('changed mathematical source must require a fresh review')
for ident, row in rows.items():
    source = (SOURCE / '縦分数_20261023' / row['file']).read_text()
    assert sha(source) == row['afterSha256']
    assert helpers[0].final_svg(ident, source) == source
    assert sha((ROOT / row['target']).read_text()) == sha((ROOT / row['copy']).read_text()) == row['afterSha256']
    original = ET.parse(Path(__file__).parent / 'before-fraction-integration' / row['target']).getroot()
    final = ET.fromstring(source)

    def rows_and_geometry(node):
        texts, geometry = [], []

        def walk(el):
            if 'data-stacked-fraction' in el.attrib:
                texts.append(el.attrib['data-stacked-fraction'])
                return
            tag = el.tag.rsplit('}', 1)[-1]
            if tag == 'text':
                texts.append(''.join(el.itertext()))
                return
            if tag in {'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'}:
                geometry.append((tag, sorted(el.attrib.items())))
            for child in el:
                walk(child)

        walk(node)
        return texts, geometry

    assert rows_and_geometry(original) == rows_and_geometry(final), ident + ': exact semantic strings and original shapes'
integration = json.loads((Path(__file__).parent / 'fraction-integration.json').read_text())
assert hashlib.sha256((ROOT / 'site-assets/textbook-book-math1.json').read_bytes()).hexdigest() == integration['bookBeforeSha256']
requests = json.loads((SOURCE / '依頼台帳_1件ずつ.json').read_text())
for ident, row in rows.items():
    if ident != 'M1-C1-S2-FIG07':
        assert next(x for x in requests if x['id'] == ident)['sha256'] == row['afterSha256']
ledger = json.loads((SOURCE.parents[1] / '制作台帳.json').read_text())
slot = next(x for x in ledger['imageSlots'] if x['id'] == 'M1-C1-S2-FIG07')
assert slot['selected'] == 'M1-C1-S2-FIG07-A'
assert next(x for x in slot['candidates'] if x['id'] == slot['selected'])['sha256'] == rows['M1-C1-S2-FIG07']['afterSha256']
print(f'Fraction generators: {len(changed)} reviewed outputs reproduced; {len(before)-len(changed)} unrelated outputs byte-identical; altered-content rejection, 7 source/copy/ledger hashes, exact semantic text/geometry and unchanged logical book passed. No output files written.')
