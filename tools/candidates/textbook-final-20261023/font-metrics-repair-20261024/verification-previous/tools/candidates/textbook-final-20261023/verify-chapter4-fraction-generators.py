"""Replay chapter4 generators in memory; never write generated teaching assets."""
from pathlib import Path
from unittest.mock import patch
import hashlib
import importlib
import json
import runpy
import sys

H = Path(__file__).resolve().parent
R = H.parents[2]
S = R / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
load = lambda p: json.loads(p.read_text())
sha = lambda value: hashlib.sha256(value).hexdigest()
mode = sys.argv[1:]
assert mode in [[], ['--integrated']]
integrated = bool(mode)
manifest = load(H / 'chapter4-fraction-candidate/manifest.json')
rows = {x['id']: x for x in manifest['items']}
assert len(rows) == 8
sys.path[:0] = [str(S), str(S / '図')]
helpers = [importlib.import_module('fraction_layout'), importlib.import_module('図.fraction_layout')]
original_helpers = [x.final_svg for x in helpers]
semantic = runpy.run_path(str(H / 'reviewed_changes.py'))['semantic']
import xml.etree.ElementTree as E


def candidate(ident, value):
    if ident not in rows:
        return original_helpers[0](ident, value)
    row = rows[ident]
    assert sha(value.encode()) == row['beforeSha256'], ident + ': generator baseline needs exact review'
    path = H / 'chapter4-fraction-candidate' / row['file']
    final = path.read_bytes()
    assert sha(final) == row['afterSha256']
    return final.decode()


def replay(identity):
    captured = {}

    def capture(path, value, *a, **k):
        assert path.stem not in captured, 'unexpected duplicate generated ID'
        captured[path.stem] = value
        return len(value)

    handler = (lambda ident, value: value) if identity else candidate
    with patch.object(Path, 'write_text', capture):
        if integrated and not identity:
            runpy.run_path(str(S / '図/c4.py'))
        else:
            with patch.object(helpers[0], 'final_svg', handler), patch.object(helpers[1], 'final_svg', handler):
                runpy.run_path(str(S / '図/c4.py'))
    return captured


before, after = replay(True), replay(False)
assert before.keys() == after.keys() and set(rows) <= set(before)
plan = load(H / 'chapter4-fraction-plan.json')
for ident, value in before.items():
    if ident in rows:
        row = rows[ident]
        assert sha(value.encode()) == row['beforeSha256'], ident + ': original generator digest'
        assert sha(after[ident].encode()) == row['afterSha256']
    else:
        assert value == after[ident], ident + ': unrelated output changed'
registry = load(S / '縦分数_4章_20261024/manifest.json')['items'] if integrated else {}
requests = load(S / '依頼台帳_1件ずつ.json') if integrated else []
for ident, row in rows.items():
    target = next(x for x in plan['items'] if x['id'] == ident)
    if integrated:
        registered = registry[ident]
        assert registered['beforeSha256'] == row['beforeSha256']
        assert registered['afterSha256'] == row['afterSha256']
        assert sha((S / '縦分数_4章_20261024' / registered['file']).read_bytes()) == row['afterSha256']
        assert registered['target'] == target['selectedSource']
        assert registered['copy'] == 'site-assets/' + target['src'][1:]
        assert next(x for x in requests if x['id'] == ident)['sha256'] == row['afterSha256']
    old = R / target['selectedSource']
    if integrated:
        old = H / 'before-chapter4-fraction-integration' / target['selectedSource']
    assert sha(old.read_bytes()) == row['beforeSha256']
    final = H / 'chapter4-fraction-candidate' / row['file']
    assert semantic(E.parse(old).getroot()) == semantic(E.parse(final).getroot())
    if integrated:
        for path in [R / target['selectedSource'], R / 'site-assets' / target['src'][1:]]:
            assert sha(path.read_bytes()) == row['afterSha256']
        for helper in helpers:
            try:
                helper.final_svg(ident, after[ident] + '<!-- unexpected -->')
            except ValueError:
                pass
            else:
                raise AssertionError(ident + ': unreviewed source not rejected')
book_sha = sha((R / 'site-assets/textbook-book-math1.json').read_bytes())
expected_book = load(H / ('chapter4-fraction-integration.json' if integrated else 'chapter4-integration-draft.json'))
assert book_sha == expected_book['bookSha256MustRemain']
result = {'status': 'passed', 'mode': 'integrated' if integrated else 'candidate only',
          'reviewedOutputs': 8, 'unrelatedByteIdentical': len(before) - 8,
          'generator': str((S / '図/c4.py').relative_to(R)),
          'generatorSha256': sha((S / '図/c4.py').read_bytes()),
          'sourceSha256': {ident: sha(before[ident].encode()) for ident in rows},
          'bookSha256Unchanged': book_sha, 'teachingAssetsWritten': False}
(H / ('chapter4-generator-result.json' if integrated else 'chapter4-generator-candidate-result.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'Chapter4 {result["mode"]}: 8 reviewed outputs reproduced; {len(before)-8} unrelated outputs byte-identical; exact source strings/shapes retained. No generated asset files written.')
