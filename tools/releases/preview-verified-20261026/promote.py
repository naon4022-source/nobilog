"""Promote reviewed work after the full run ends; publishing still requires a fresh full success."""
from pathlib import Path
import hashlib
import json

root = Path.cwd()
here = root / 'tools/releases/preview-verified-20261026'
lock = root / 'tools/candidates/plan-lock-pricing-20261026'
full = json.loads((root / 'tools/candidates/textbook-ai-20261026/review/post-math-full-attempt2.json').read_text())
assert full['inputDrift'] == [] and full['observedExitCode'] in [0, 1], 'existing full must finish without source drift'
if full['observedExitCode'] == 1:
    # Continue the same active repair cycle, preserving the failed whole result.
    assert full['observedFailureBlocks'] == 1 and full['onlyFailureSuite'] == '.claude/verify/verify-kentei-browser.mjs'
    fix = json.loads((here / 'kentei-verifier-fix.json').read_text())
    assert fix['status'] == 'passed; original exam assertions retained' and fix['observedExitCode'] == 0
    assert hashlib.sha256((root / fix['file']).read_bytes()).hexdigest() == fix['afterSha256']
assert '134 checks passed' in (lock / 'candidate-attempt2.log').read_text()
assert json.loads((here / 'stage-package-result.json').read_text())['status'] == 'passed'
assert not (here / 'promotion.json').exists(), 'do not reapply a previous promotion'
manifest = json.loads((lock / 'manifest.json').read_text())
edits = []
for row, candidate in zip(manifest['files'], ['plan-study.js', 'verify-plan-study.after.mjs']):
    file = root / row['file']
    before = file.read_bytes()
    after = (lock / candidate).read_bytes()
    assert hashlib.sha256(before).hexdigest() == row['beforeSha256']
    assert hashlib.sha256(after).hexdigest() == row['candidateSha256']
    edits.append((file, before, after))
file = root / 'preview/deploy.sh'
before = file.read_bytes()
text = before.decode()
needle = 'git diff --check\n'
assert text.count(needle) == 1
text = text.replace(needle, needle + 'python3 tools/releases/preview-verified-20261026/prepare-release.py\nnode tools/releases/preview-verified-20261026/verify-package.mjs\npython3 tools/releases/preview-verified-20261026/scan-package.py\n')
edits.append((file, before, text.encode()))
file = root / 'preview/math-video-release.json'
before = file.read_bytes()
value = json.loads(before)
assert value['chapters'] == [1, 2]
value.update(version='2.51.0', chapters=[1, 2, 3, 4, 5])
edits.append((file, before, (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()))
# Validate every predecessor before changing any of the four targets.
rows = []
for file, before, after in edits:
    relative = file.relative_to(root)
    saved = here / 'before' / relative
    saved.parent.mkdir(parents=True, exist_ok=True)
    saved.write_bytes(before)
    rows.append({'file': str(relative), 'beforeFile': str(saved.relative_to(root)),
                 'beforeSha256': hashlib.sha256(before).hexdigest(), 'afterSha256': hashlib.sha256(after).hexdigest()})
for file, before, after in edits:
    assert file.read_bytes() == before
    file.write_bytes(after)
(here / 'promotion.json').write_text(json.dumps({'status': 'main applied; targeted checks and preview deployment pending', 'files': rows,
    'scope': 'One-line lock pricing change, matching134-check expectations, preview-only packaging gate and verified math chapters. No production/admin/auth/secret/learner-record changes.'}, ensure_ascii=False, indent=2) + '\n')
print('Reviewed lock and dedicated preview release preparation applied; no deployment performed.')
