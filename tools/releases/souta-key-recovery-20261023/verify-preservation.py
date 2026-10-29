from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / 'security-hardening-20261022/candidate'
CANDIDATE = HERE / 'candidate'
manifest = json.loads((HERE / 'manifest.json').read_text())
checks = 0
for scope, folder in [('baseline', BASE), ('candidate', CANDIDATE)]:
    for name, expected in manifest[scope].items():
        assert hashlib.sha256((folder / name).read_bytes()).hexdigest() == expected, name
        checks += 1
assert sorted(str(p.relative_to(CANDIDATE)) for p in CANDIDATE.rglob('*') if p.is_file()) == sorted(manifest['candidate'])
for name in ['pages/index.html', 'pages/sw.js']:
    old = '<meta name="application-version" content="2.17.1">' if name.endswith('.html') else 'nobilog-app-v2.17.1'
    assert (CANDIDATE / name).read_text() == (BASE / name).read_text().replace(old, old.replace('2.17.1', '2.17.2'))
    checks += 1
for name in manifest['candidate']:
    if name not in manifest['changedFiles']:
        assert (CANDIDATE / name).read_bytes() == (BASE / name).read_bytes(), name
        checks += 1
assert manifest['changedFiles'] == ['cf-worker/deploy-secure.sh', 'cf-worker/src/index.js', 'pages/index.html', 'pages/sw.js']
assert manifest['v3Included'] is False
(HERE / 'preservation-result.json').write_text(json.dumps({'status': 'passed', 'checks': checks, 'v3Included': False, 'changedFiles': manifest['changedFiles']}, indent=2) + '\n')
print(f'Souta public preservation: {checks} checks passed; production baseline plus auth/version only.')
