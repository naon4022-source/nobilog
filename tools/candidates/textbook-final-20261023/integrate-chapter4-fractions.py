"""Prepare an exact integration plan; apply only after terminal full-suite success."""
from pathlib import Path
import hashlib
import json
import sys

H = Path(__file__).resolve().parent
R = H.parents[2]
S = R / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
D = S / '縦分数_4章_20261024'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
byte_sha = lambda b: hashlib.sha256(b).hexdigest()
draft = load(H / 'chapter4-integration-draft.json')
manifest_path = H / 'chapter4-fraction-candidate/manifest.json'
visual_path = H / 'chapter4-fraction-visual-review.json'
assert sha(manifest_path) == draft['candidateManifestSha256']
assert sha(visual_path) == draft['visualReviewSha256']
manifest, visual = load(manifest_path), load(visual_path)
assert len(manifest['items']) == len(visual['reviews']) == 8
assert sum(len(x['changes']) for x in manifest['items']) == 11
sources = {x['id']: x for x in load(H / 'chapter4-fraction-plan.json')['items']}
requests_path = S / '依頼台帳_1件ずつ.json'
requests = load(requests_path)
book = R / 'site-assets/textbook-book-math1.json'
assert sha(book) == draft['bookSha256MustRemain']
changes, registry = [], {}
for row in manifest['items']:
    ident = row['id']
    source = sources[ident]
    review = next(x for x in visual['reviews'] if x['id'] == ident)
    candidate = H / 'chapter4-fraction-candidate' / row['file']
    assert sha(candidate) == row['afterSha256'] == review['candidateSha256']
    assert sha(R / review['screenshot']) == review['screenshotSha256']
    for path in [R / source['selectedSource'], R / 'site-assets' / source['src'][1:]]:
        assert sha(path) == row['beforeSha256'] == source['beforeSha256']
        assert any(x['path'] == str(path.relative_to(R)) and x['beforeSha256'] == sha(path)
                   and x['afterSha256'] == sha(candidate) for x in draft['changes'])
        changes.append((path, candidate.read_bytes()))
    registry[ident] = {**row, 'file': ident + '.svg', 'target': source['selectedSource'],
                       'copy': 'site-assets/' + source['src'][1:]}
    request = next(x for x in requests if x['id'] == ident)
    if 'sha256' in request:
        assert request['sha256'] == row['beforeSha256']
    request.update(file=source['selectedSource'], sha256=row['afterSha256'],
                   state='既存図の縦分数を本体反映・本内検査待ち',
                   layoutRevision='2026-10-24: stacked fractions only; exact original text/signs/graph geometry retained; current-book verification pending')
changes.append((requests_path, (json.dumps(requests, ensure_ascii=False, indent=2) + '\n').encode()))
verification = load(H / 'chapter4-verification-candidate/manifest.json')
for row in verification['files']:
    live, candidate = R / row['path'], R / row['candidate']
    assert sha(live) == row['beforeSha256'] and sha(candidate) == row['afterSha256']
    changes.append((live, candidate.read_bytes()))
assert len({p for p, _ in changes}) == len(changes)
plan = {'status': 'plan only; app files untouched', 'bookSha256MustRemain': sha(book),
        'changes': [{'path': str(p.relative_to(R)), 'beforeSha256': sha(p), 'afterSha256': byte_sha(value)}
                    for p, value in changes], 'diagrams': 8, 'fractionRows': 11,
        'registry': str((D / 'manifest.json').relative_to(R))}
if sys.argv[1:] != ['--apply']:
    assert not sys.argv[1:]
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    sys.exit(0)
# Never reuse a running, failed or input-mismatched whole-suite observation.
gate_path = H / 'pre-chapter4-full-verification.json'
gate = load(gate_path)
assert gate['status'] == 'passed' and gate['observedExitCode'] == 0
assert sha(Path(gate['log'])) == gate['logSha256']
assert gate['bookSha256'] == sha(book)
assert gate['suiteSha256'] == sha(R / '.claude/verify/run.sh')
for path, expected in gate['runtimeSha256'].items():
    assert sha(R / path) == expected
assert not load(H / 'resume.json')['activeSessions'], 'finish the active standalone suite first'
replay_path = H / 'chapter4-generator-candidate-result.json'
replay = load(replay_path)
assert replay['status'] == 'passed' and replay['mode'] == 'candidate only'
assert replay['reviewedOutputs'] == 8 and replay['teachingAssetsWritten'] is False
assert sha(R / replay['generator']) == replay['generatorSha256']
for ident, row in registry.items():
    assert replay['sourceSha256'][ident] == row['beforeSha256']
saved_plan = load(H / 'chapter4-integration-plan.json')
assert saved_plan == plan, 'exact plan changed since saved review'
backup = H / 'before-chapter4-fraction-integration'
assert not backup.exists() and not D.exists(), 'do not overwrite any prior backup or registry'
for path, value in changes:
    expected = next(x for x in plan['changes'] if x['path'] == str(path.relative_to(R)))
    assert sha(path) == expected['beforeSha256'] and byte_sha(value) == expected['afterSha256']
# Back up all old bytes before the first replacement.
for path, _ in changes:
    destination = backup / path.relative_to(R)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(path.read_bytes())
D.mkdir()
for ident, row in registry.items():
    candidate = H / 'chapter4-fraction-candidate' / next(x['file'] for x in manifest['items'] if x['id'] == ident)
    (D / row['file']).write_bytes(candidate.read_bytes())
(D / 'manifest.json').write_text(json.dumps({'items': registry}, ensure_ascii=False, indent=2) + '\n')
for path, value in changes:
    path.write_bytes(value)
assert sha(book) == plan['bookSha256MustRemain']
plan.update(status='integrated locally; current-book/generator/whole checks pending',
            gateFile=str(gate_path.relative_to(R)), gateSha256=sha(gate_path),
            candidateReplaySha256=sha(replay_path))
(H / 'chapter4-fraction-integration.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
print('Integrated eight reviewed fraction diagrams and exact source/evidence chains. Logical book unchanged; final checks pending.')
