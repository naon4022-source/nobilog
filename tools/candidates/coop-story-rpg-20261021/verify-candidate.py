#!/usr/bin/env python3
"""Run isolated checks serially, only after the existing full suite exits."""
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
active = subprocess.run(['pgrep', '-f', r'[b]ash .*\.claude/verify/[r]un.sh'], capture_output=True, text=True)
if active.returncode == 0:
    raise SystemExit('Full suite still running; candidate checks not started.')
if active.returncode != 1:
    raise SystemExit('Cannot determine whether full suite is running.')
checks = []
for file in ['verify-party.mjs', 'verify-pool.mjs', 'verify-store.mjs', 'verify-equipment.mjs']:
    result = subprocess.run(['node', str(HERE / file)], cwd=ROOT, capture_output=True, text=True)
    checks.append({'file': file, 'exitCode': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    print(result.stdout, end='')
    if result.returncode:
        (HERE / 'candidate-failure.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n')
        print(result.stderr)
        raise SystemExit(result.returncode)
receipt = {
    'at': datetime.now(timezone.utc).isoformat(),
    'status': 'isolated source checks passed; not integrated or published',
    'checks': checks,
    'sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in HERE.iterdir() if p.suffix in ['.mjs', '.py', '.md']},
    'realUserData': False,
    'network': False,
    'fullSuiteForRpg': False,
    'remaining': ['live routes and transport', 'presence leases', 'equipment persistence and balance tuning', 'guarded eligibility reads and save ACK wiring', 'remaining story chapters and content review', 'game UI/menu', 'integration and full suite']
}
(HERE / 'candidate-verification.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
provenance_path=HERE/'provenance.json'
provenance=json.loads(provenance_path.read_text())
provenance.update(status='isolated checks passed; not integrated or published',actualTestsRun=True,verification='candidate-verification.json',files=receipt['sha256'])
provenance['story']['draftChapters']=[int(x) for x in re.findall(r'^## 第(\d+)章', (HERE/'物語構成.md').read_text(), re.M)]
provenance_path.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
