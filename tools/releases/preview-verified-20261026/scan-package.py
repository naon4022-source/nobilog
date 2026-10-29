"""Scan public/code artifacts only; never load an auth store or secret file."""
from pathlib import Path
import json
import re

root = Path.cwd()
build = root / 'preview/build'
extensions = {'.js', '.mjs', '.cjs', '.json', '.html', '.css', '.xml', '.txt'}
patterns = [
    re.compile(r'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}'),
    re.compile(r'AIza[A-Za-z0-9_-]{20,}'),
    re.compile(r'AQ\.[A-Za-z0-9_.-]{20,}'),
    re.compile(r'''\b(?:PIN_PEPPER(?:_SOUTA)?|LEGACY_(?:NAO|RIRAN|SOUTA)_PIN_HASH|PREVIEW_PIN_(?:HASH|PEPPER)|GOOGLE_CLIENT_SECRET|LINE_CLIENT_SECRET|TURNSTILE_SECRET)\b\s*[:=]\s*['"][^'"]+['"]'''),
]
checked = 0
blocked = []
for file in build.rglob('*'):
    if not file.is_file():
        continue
    if file.name.startswith(('.env', '.dev.vars')):
        blocked.append(str(file.relative_to(build)))
        continue
    if file.suffix not in extensions:
        continue
    text = file.read_text()
    checked += 1
    if any(pattern.search(text) for pattern in patterns):
        blocked.append(str(file.relative_to(build)))
page = (build / 'assets/index.html').read_text()
assert "const SYNC_URL = location.origin + '/api';" in page
assert "const SYNC_URL = 'https://nobilog-board.naon4022.workers.dev';" not in page
result = {'status': 'failed' if blocked else 'passed', 'filesChecked': checked, 'blockedFiles': blocked,
          'scope': 'Built public assets and Worker code only; no secret values, auth-store files or learner records read/output.'}
(root / 'tools/releases/preview-verified-20261026/scan-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Preview artifact scan:', checked, 'text/code files;', len(blocked), 'blocked files (values never printed).')
raise SystemExit(1 if blocked else 0)
