"""Plan by default; --apply requires completed baseline verification and repaired failures from the terminal post run and exact inputs."""
from pathlib import Path
import hashlib
import json
import sys

H = Path(__file__).resolve().parent
R = H.parents[2]
S = R / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
D = S / '縦分数_3章_20261023'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
review = load(H / 'chapter3-fraction-ready.json')
manifest = load(H / 'chapter3-fraction-candidate/manifest.json')
assert len(review['items']) == len(manifest['items']) == 6
approved = {r['id']: r for r in review['items']}
request_path = S / '依頼台帳_1件ずつ.json'
requests = load(request_path)
book_path = R / 'site-assets/textbook-book-math1.json'
book_sha = sha(book_path)
book = load(book_path)
assert book_sha == load(H / 'chapter3-fraction-content-review.json')['bookSha256']
helper = S / '図/fraction_layout.py'
changes, registry = [], {}
for row in manifest['items']:
    ident = row['id']
    assert row['beforeSha256'] == approved[ident]['beforeSha256']
    assert row['afterSha256'] == approved[ident]['afterSha256']
    source, copy = R / approved[ident]['source'], R / 'site-assets' / row['file']
    candidate = H / 'chapter3-fraction-candidate' / row['file']
    assert sha(source) == sha(copy) == row['beforeSha256']
    assert sha(candidate) == row['afterSha256']
    assert any(ident.lower() in json.dumps(p, ensure_ascii=False).lower() for p in book['pages'])
    for path in [source, copy]:
        changes.append((path, candidate.read_bytes()))
    registry[ident] = {**row, 'file': ident + '.svg', 'target': str(source.relative_to(R)), 'copy': str(copy.relative_to(R))}
    request = next((x for x in requests if x['id'] == ident), None)
    if request is None:
        assert ident == 'M1-C3-S1-D06', 'unexpected missing request'
        request = {'order': max(x['order'] for x in requests) + 1, 'id': ident, 'kind': '図解',
                   'location': '既存原稿M1-P136（物理ページは再計算）',
                   'spec': '既存図「分母をはらう」。x/2+x/3=5の両辺の全項に6をかけ、3x+2x=30へ変形する。式・数値・図条件を保持し縦分数だけに組み直す。',
                   'scope': 'main', 'state': '既存図の依頼記録漏れを補完・縦分数反映後の本内確認待ち'}
        requests.append(request)
    else:
        assert request.get('sha256', request.get('latestLocalRecheck', {}).get('sourceSha256')) == row['beforeSha256']
    request.update(file=str(source.relative_to(R)), sha256=row['afterSha256'],
                   layoutRevision='2026-10-23: stacked fractions and enclosing parentheses; original formulas/shapes retained; current-book checks pending')
changes.append((request_path, (json.dumps(requests, ensure_ascii=False, indent=2) + '\n').encode()))
changes.append((helper, (H / 'chapter3-helper.py').read_bytes()))
plan = {'status': 'plan only', 'bookSha256Unchanged': book_sha,
        'changes': [{'path': str(p.relative_to(R)), 'beforeSha256': sha(p), 'afterSha256': hashlib.sha256(b).hexdigest()} for p, b in changes],
        'registry': str((D / 'manifest.json').relative_to(R)), 'diagrams': 6}
if sys.argv[1:] != ['--apply']:
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    sys.exit(0)
saved_plan = load(H / 'chapter3-integration-plan.json')
expected_helper = next(x for x in saved_plan['changes'] if x['path'] == str(helper.relative_to(R)))
assert sha(helper) == expected_helper['beforeSha256'], 'shared helper changed since reviewed plan; reconcile before replacing'
assert hashlib.sha256((H / 'chapter3-helper.py').read_bytes()).hexdigest() == expected_helper['afterSha256']
proof = load(H / 'post-full-verification.json')
baseline = load(H / 'pre-full-verification.json')
assert baseline['status'] == 'passed' and baseline['observedExitCode'] == 0
assert sha(Path(baseline['log'])) == baseline['logSha256']
assert proof['observedExit'] in [0, 1] and proof['status'] in ['passed', 'failed']
assert not load(H / 'resume.json')['activeSessions'], 'whole suite must have terminated'
if proof['status'] == 'failed':
    repair = load(H / 'verification-chain-repair.json')
    assert repair['previousWholeSession'] == proof['session'] and repair['targetedPassed'] is True
    assert repair['unreviewedRuntimeEditRejected'] is True
    assert sha(Path(repair['log'])) == repair['logSha256']
    for item in repair['files']:
        assert sha(R / item['file']) == item['afterSha256']
assert proof['runtimeSha256']['site-assets/textbook-book.js'] == sha(R/'site-assets/textbook-book.js')
assert proof['bookSha256'] == book_sha
assert sha(Path(proof['log'])) == proof['logSha256']
backup = H / 'before-chapter3-fraction-integration'
assert not backup.exists() and not D.exists(), 'refuse to overwrite sources/backups'
# Check every old byte before the first mutation, including helper and request file.
for (path, _), expected in zip(changes, plan['changes']):
    assert sha(path) == expected['beforeSha256']
for path, _ in changes:
    saved = backup / path.relative_to(R)
    saved.parent.mkdir(parents=True, exist_ok=True)
    saved.write_bytes(path.read_bytes())
D.mkdir()
for ident, row in registry.items():
    (D / row['file']).write_bytes((H / 'chapter3-fraction-candidate' / next(x['file'] for x in manifest['items'] if x['id'] == ident)).read_bytes())
(D / 'manifest.json').write_text(json.dumps({'items': registry}, ensure_ascii=False, indent=2) + '\n')
for path, value in changes:
    path.write_bytes(value)
assert sha(book_path) == book_sha
plan['status'] = 'integrated locally; generator/current-book checks pending'
(H / 'chapter3-fraction-integration.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
print('Integrated six reviewed diagrams; logical book unchanged; current-book checks pending.')
