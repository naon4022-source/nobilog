"""Apply the seven reviewed layouts with precondition checks and source backups."""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WORK = ROOT / '教材整理/Claude_Codex共有/数学全体制作'
SOURCE = WORK / 'メディア/制作ソース/縦分数_20261023'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
rows = load(SOURCE / 'manifest.json')['items']
review = load(HERE / 'fraction-visual-review.json')
assert review['reviewedAllSevenFinalScreens'] is True
assert {x['id']: x['svgSha256'] for x in review['items']} == {ident: row['afterSha256'] for ident, row in rows.items()}
book = ROOT / 'site-assets/textbook-book-math1.json'
book_before = sha(book)
requests_path = WORK / 'メディア/制作ソース/依頼台帳_1件ずつ.json'
ledger_path = WORK / '制作台帳.json'
requests, ledger = load(requests_path), load(ledger_path)
changes = []
for ident, row in rows.items():
    assert sha(SOURCE / row['file']) == row['afterSha256']
    for relative in [row['target'], row['copy']]:
        path = ROOT / relative
        assert sha(path) == row['beforeSha256'], relative
        changes.append((path, (SOURCE / row['file']).read_bytes()))
    if ident == 'M1-C1-S2-FIG07':
        slot = next(x for x in ledger['imageSlots'] if x['id'] == ident)
        assert slot['selected'] == 'M1-C1-S2-FIG07-A'
        candidate = next(x for x in slot['candidates'] if x['id'] == slot['selected'])
        assert candidate['sha256'] == row['beforeSha256']
        candidate['sha256'] = row['afterSha256']
        candidate['layoutRevision'] = '2026-10-23: stacked fractions; same values and regions'
        evidence = slot['selectionEvidence']
        assert evidence['candidateSha256'] == row['beforeSha256']
        evidence['previousCandidateSha256'] = evidence['candidateSha256']
        evidence['candidateSha256'] = row['afterSha256']
    else:
        request = next((x for x in requests if x['id'] == ident), None)
        if request is None:
            assert ident == 'M1-C1-S1-D07', 'unexpected missing request identity'
            request = {'order': max(x['order'] for x in requests) + 1, 'id': ident, 'kind': '図解',
                       'location': '既存原稿M1-P005（本内位置は再計算）',
                       'spec': '既存の数のなかま分けの表。数値・集合・説明を維持し、分数表記と補足文字の読みやすさだけを修正。新しい設問や答えは追加しない。',
                       'state': '既存本反映済み・縦分数への表示修正後点検待ち',
                       'file': row['target'], 'sha256': row['beforeSha256'], 'scope': 'main'}
            requests.append(request)
        assert request['sha256'] == row['beforeSha256']
        request['sha256'] = row['afterSha256']
        request['layoutRevision'] = '2026-10-23: stacked fractions; same values and figure geometry'
changes.extend([(requests_path, (json.dumps(requests, ensure_ascii=False, indent=2) + '\n').encode()),
                (ledger_path, (json.dumps(ledger, ensure_ascii=False, indent=2) + '\n').encode())])
# Every asset and ledger precondition is checked before the first replacement.
backup = HERE / 'before-fraction-integration'
for path, _ in changes:
    saved = backup / path.relative_to(ROOT)
    assert not saved.exists(), 'refuse to overwrite a historical backup'
    saved.parent.mkdir(parents=True, exist_ok=True)
    saved.write_bytes(path.read_bytes())
for path, value in changes:
    path.write_bytes(value)
assert sha(book) == book_before, 'logical content, answer placement and markers must stay unchanged'
for ident, row in rows.items():
    assert sha(ROOT / row['target']) == sha(ROOT / row['copy']) == row['afterSha256']
result = {'status': 'integrated; actual-book checks pending', 'files': [str(p.relative_to(ROOT)) for p, _ in changes],
          'bookBeforeSha256': book_before, 'bookAfterSha256': sha(book),
          'selectedCandidateUnchanged': 'M1-C1-S2-FIG07-A', 'diagrams': 7,
          'sourceRegistry': str(SOURCE.relative_to(ROOT) / 'manifest.json'),
          'scope': 'SVG layout and current ledger hashes only; original logical text, numbers, answer disclosures and markers unchanged'}
(HERE / 'fraction-integration.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Integrated 7 reviewed diagrams into sources and textbook copies; request/selection hashes updated; logical book SHA unchanged; backups retained.')
