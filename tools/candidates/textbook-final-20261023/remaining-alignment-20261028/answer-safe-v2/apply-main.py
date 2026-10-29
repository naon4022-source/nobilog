"""Apply only the reviewed 64 local textbook files, preserving their prior bytes."""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
MAIN = HERE / 'main'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


assert sys.argv[1:] == ['--apply']
assert not MAIN.exists(), 'Do not repeat an applied or partial integration'
running = subprocess.run(['pgrep', '-f', r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'], capture_output=True, text=True)
assert running.returncode == 1, 'Do not change frozen inputs during whole verification'
baseline = ROOT / 'tools/candidates/textbook-final-20261023/kokugo-reading-20261027/main/full7-result.json'
prior = json.loads(baseline.read_text())
assert prior['status'] == 'passed' and prior['exitCode'] == 0 and not prior['frozenDrift']
assert sha(ROOT / prior['log']) == prior['logSha256']
assert all(sha(ROOT / row['file']) == row['sha256'] for row in prior['inputs']), 'Whole7 baseline drift'
approval = json.loads((HERE / 'visual-approval.json').read_text())
assert approval['movieBookViews'] == 40 and len(approval['proofs']) == 8
for row in approval['proofs']:
    assert sha(ROOT / row['file']) == row['sha256']
for name, count in [('playback-result.json', 40), ('figure-zoom-result.json', 16)]:
    result = json.loads((HERE / name).read_text())
    assert result['status'].startswith('passed') and len(result['results']) == count
assert json.loads((HERE / 'answer-preservation-result.json').read_text())['status'] == 'passed'
plan = json.loads((HERE / 'promotion-plan.json').read_text())
assert len(plan['files']) == 64 and len({row['file'] for row in plan['files']}) == 64
for row in plan['files']:
    assert sha(ROOT / row['file']) == row['beforeSha256'], row['file']
    assert sha(ROOT / row['candidate']) == row['afterSha256'], row['candidate']
MAIN.mkdir()
for row in plan['files']:
    backup, prepared = (MAIN / folder / row['file'] for folder in ['before', 'staged'])
    backup.parent.mkdir(parents=True, exist_ok=True)
    prepared.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / row['file'], backup)
    shutil.copy2(ROOT / row['candidate'], prepared)
    assert sha(backup) == row['beforeSha256'] and sha(prepared) == row['afterSha256']
(MAIN / 'prepared.json').write_text(json.dumps(dict(planSha256=sha(HERE / 'promotion-plan.json'), visualApprovalSha256=sha(HERE / 'visual-approval.json'), beforeWholeProofSha256=sha(baseline), files=plan['files']), ensure_ascii=False, indent=2) + '\n')
for row in plan['files']:
    target = ROOT / row['file']
    assert sha(target) == row['beforeSha256'], 'Concurrent main edit: preserve and stop'
    os.replace(MAIN / 'staged' / row['file'], target)
    assert sha(target) == row['afterSha256']
    print('Applied', row['kind'], row['file'], flush=True)
(MAIN / 'applied.json').write_text(json.dumps(dict(status='64 local files integrated; final whole verification pending; unpublished', files=plan['files'], beforeWholeInputs=len(prior['inputs']), beforeWholeDrift=[], mainPromoted=True, published=False), ensure_ascii=False, indent=2) + '\n')
