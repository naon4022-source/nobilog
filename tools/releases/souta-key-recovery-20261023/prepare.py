"""Prepare only the production baseline plus the reviewed Souta auth patch."""
from pathlib import Path
import hashlib
import json
import shutil

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / 'security-hardening-20261022/candidate'
PROPOSAL = HERE.parents[1] / 'candidates/souta-pin-reset-20261023/dedicated-pepper-proposal.patch'
EXPECTED_WORKER = '157b6212d5a6ea440647c3f2e546745067659cb8020a1830f1cb2aed784d3ed6'
EXPECTED_PAGE = 'a4ebb2e7945e8e66e3f59b074e6200762930441b95de0e2687a1fb5e77e4684a'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    assert sha(BASE / 'cf-worker/src/index.js') == EXPECTED_WORKER
    assert sha(BASE / 'pages/index.html') == EXPECTED_PAGE
    target = HERE / 'candidate'
    if target.exists():
        raise SystemExit('Candidate already exists; do not overwrite reviewed files.')
    shutil.copytree(BASE / 'pages', target / 'pages')
    for relative in ['wrangler.jsonc', 'src/index.js', 'src/guard.mjs', 'src/google-account.mjs']:
        destination = target / 'cf-worker' / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(BASE / 'cf-worker' / relative, destination)
    # Apply exactly one unified-diff hunk, with exact context verification.
    lines = PROPOSAL.read_text().splitlines(keepends=True)
    hunk = next(i for i, line in enumerate(lines) if line.startswith('@@'))
    old = ''.join(line[1:] for line in lines[hunk + 1:] if line.startswith((' ', '-')))
    new = ''.join(line[1:] for line in lines[hunk + 1:] if line.startswith((' ', '+')))
    worker = target / 'cf-worker/src/index.js'
    text = worker.read_text()
    assert text.count(old) == 1
    worker.write_text(text.replace(old, new))
    secure = target / 'cf-worker/deploy-secure.sh'
    secure.write_text('#!/usr/bin/env bash\nset -euo pipefail\ncd "$(dirname "$0")"\nif [[ "${1-}" == rollback ]]; then\n  exec python3 ../../release.py rollback-worker\nfi\nexec python3 ../../release.py worker-step\n')
    secure.chmod(0o700)
    for relative in ['pages/index.html', 'pages/sw.js']:
        path = target / relative
        text = path.read_text()
        old = '<meta name="application-version" content="2.17.1">' if relative.endswith('.html') else 'nobilog-app-v2.17.1'
        assert text.count(old) == 1
        path.write_text(text.replace(old, old.replace('2.17.1', '2.17.2')))
    files = {str(p.relative_to(target)): sha(p) for p in target.rglob('*') if p.is_file()}
    before = {name: sha(BASE / name) for name in files}
    changed = sorted(name for name in files if files[name] != before[name])
    assert changed == ['cf-worker/deploy-secure.sh', 'cf-worker/src/index.js', 'pages/index.html', 'pages/sw.js']
    (HERE / 'manifest.json').write_text(json.dumps({
        'baselineVersion': '2.17.1', 'version': '2.17.2',
        'baseline': before, 'candidate': files, 'changedFiles': changed,
        'deploymentControlFiles': ['cf-worker/deploy-secure.sh'],
        'preWorkerVersion': 'a3e262f3-f817-451f-bcab-8d0c5e7fd5f1',
        'preWorkerETag': '037033e745e7a213e91ba0dd3852a7f9ac0f8a34d41089e670f636407b12cfd4',
        'v3Included': False, 'secretValuesRead': False,
    }, indent=2) + '\n')
    print('Prepared public 2.17.2 candidate: Souta verification and version/cache only.')


if __name__ == '__main__':
    main()
