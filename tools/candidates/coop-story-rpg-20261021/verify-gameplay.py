"""Serial local-only checks, with before/after source fingerprints."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, subprocess, sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]

def idle():
    return subprocess.run(['pgrep', '-f', r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'], capture_output=True).returncode == 1

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

assert idle(), 'Wait for the existing whole-app suite'
paths = list(HERE.glob('*.mjs')) + list(HERE.glob('*.css')) + [Path(__file__), HERE/'app-entry.js', HERE/'story-catalog.json', ROOT/'cf-worker/src/material-engine.cjs', ROOT/'cf-worker/src/material-bank.mjs', ROOT/'site-assets/vertical-fractions.js', ROOT/'.claude/verify/d1-sqlite.js']
paths += [ROOT/name for name in ['index.html','cf-worker/src/index.js','cf-worker/src/coop-story.mjs','cf-worker/src/v3-worker.mjs','cf-worker/wrangler.toml','site-assets/eiken-vocab-bank.json','site-assets/coop-story-client.mjs','site-assets/coop-story-entry.js','site-assets/coop-story.css']]
paths += list((ROOT/'cf-worker/src/coop-story').glob('*.mjs'))
inputs = {str(path.relative_to(ROOT)): sha(path) for path in paths}
stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
out = HERE/'gameplay-checks'/stamp
out.mkdir(parents=True, exist_ok=False)
proof = {'at': stamp, 'status': 'running', 'inputsBeforeSha256': inputs, 'checks': [], 'mainIntegrated': False, 'deployed': False, 'realUserData': False}
names=['verify-equipment.mjs','verify-equipment-store.mjs','verify-invitation-store.mjs','verify-presence-store.mjs','verify-pool.mjs','verify-word-challenges.mjs','verify-battle.mjs','verify-battle-store.mjs','verify-quiz-service.mjs','verify-battle-service.mjs','verify-owned-word-reader.mjs','verify-resume-store.mjs', 'verify-progress-store.mjs', 'verify-room-management.mjs', 'verify-worker-adapter.mjs', 'verify-route.mjs', 'verify-client-actions.mjs', 'verify-campaign.mjs', 'verify-view.mjs', 'verify-three-browser.mjs','verify-main-route.mjs','verify-main-browser.mjs']
if sys.argv[1:]:
    assert len(sys.argv)==3 and sys.argv[1]=='--resume'
    prior_path=Path(sys.argv[2]).resolve()
    assert prior_path.is_relative_to(HERE/'gameplay-checks')
    prior=json.loads(prior_path.read_text())
    failed=prior['checks'][-1]
    assert failed['exitCode']!=0 and failed['file'] in names
    allowed={str((HERE/name).relative_to(ROOT)) for name in [failed['file'],'verify-gameplay.py']}
    assert inputs.keys()==prior['inputsBeforeSha256'].keys()
    assert all(inputs[name]==digest for name,digest in prior['inputsBeforeSha256'].items() if name not in allowed), 'Unrelated input drift: do a fresh run'
    for check in prior['checks']:
        if check['exitCode']!=0:break
        assert sha(ROOT/check['log'])==check['logSha256']
        proof['checks'].append({**check,'reusedFrom':str(prior_path.relative_to(ROOT))})
    assert [x['file'] for x in proof['checks']]==names[:len(proof['checks'])]
    print('Reused '+str(len(proof['checks']))+' passed checks: dependencies/logs unchanged; only failed harness and runner may differ.',flush=True)
for name in names:
    if any(check['file']==name for check in proof['checks']):continue
    assert idle(), 'A whole-app suite started; stop before another check'
    result = subprocess.run(['node', str(HERE/name)], cwd=ROOT, capture_output=True, text=True)
    log = out/(name+'.log')
    log.write_text(result.stdout+result.stderr)
    proof['checks'].append({'file': name, 'exitCode': result.returncode, 'log': str(log.relative_to(ROOT)), 'logSha256': sha(log)})
    print(result.stdout, end='', flush=True)
    if result.returncode:
        proof['status'] = 'failed; inspect the retained log'
        (out/'verification.json').write_text(json.dumps(proof, indent=2)+'\n')
        print('Failure log:', log, flush=True)
        raise SystemExit(result.returncode)
proof['inputsUnchanged'] = all(sha(ROOT/name) == digest for name, digest in inputs.items())
assert proof['inputsUnchanged'], 'Source drift: cannot certify current code'
proof['status'] = 'local synthetic backend, campaign, three-browser and actual main integration checks passed; whole-app final verification remains'
data = json.dumps(proof, indent=2)+'\n'
(out/'verification.json').write_text(data)
(HERE/'gameplay-verification.json').write_text(data)
