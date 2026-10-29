"""Read-only preview publication probes; no login, cookie or learner record access."""
from pathlib import Path
import datetime
import hashlib
import json
import urllib.error
import urllib.request

ROOT = Path.cwd()
HERE = ROOT / 'tools/releases/preview-verified-20261026'
ORIGIN = 'https://nobilog-preview.naon4022.workers.dev'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, new_url):
        return None


def main():
    deployment = json.loads((HERE / 'deployment.json').read_text())
    assert deployment['observedExitCode'] == 0, 'actual preview deploy script must finish successfully first'
    opener = urllib.request.build_opener(NoRedirect)
    rows = []
    cases = [('/', 200), ('/preview-login', 200), ('/index.html', 401), ('/plans.html', 401),
             ('/material-bank.json', 401), ('/textbook-book-math1.json', 401),
             ('/api/auth/me', 401), ('/api/plan', 401), ('/api/coop-story/meta', 401),
             ('/admin-nao', 404), ('/preview-account-setup', 404), ('/preview-plan-setup', 404)]
    for path, expected in cases:
        response = None
        try:
            request = urllib.request.Request(ORIGIN + path, headers={'User-Agent': 'Nobilog-Preview-Readonly-Check'})
            try:
                response = opener.open(request, timeout=30)
            except urllib.error.HTTPError as error:
                response = error
            status = response.code
            headers = response.headers
            # Protected routes are never read, including an unexpected successful reply.
            body = response.read(16385) if expected == 200 and status == 200 else None
            valid = status == expected and 'no-store' in headers.get('Cache-Control', '')
            if body is not None:
                valid = valid and len(body) <= 16384 and b'/preview-login' in body and b'type="password"' in body
            rows.append({'path': path, 'status': status, 'expected': expected, 'passed': bool(valid),
                         'privateBodyRead': False, **({'loginPageSha256': hashlib.sha256(body).hexdigest()} if body is not None else {})})
        finally:
            if response is not None:
                response.close()
    # A rejected foreign-origin request exits before auth/plan/record processing.
    response = None
    try:
        request = urllib.request.Request(ORIGIN + '/api/plan', method='POST', data=b'{}',
                                        headers={'Origin': 'https://rejected.invalid', 'Content-Type': 'application/json'})
        try:
            response = opener.open(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        rows.append({'path': '/api/plan', 'method': 'POST', 'foreignOrigin': True, 'status': response.code,
                     'expected': 403, 'passed': response.code == 403, 'privateBodyRead': False})
    finally:
        if response is not None:
            response.close()
    result = {'status': 'passed' if all(row['passed'] for row in rows) else 'failed', 'origin': ORIGIN,
              'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'checks': len(rows), 'results': rows,
              'limits': ['No real account login or per-account private data read. Actual plan boundary proof is the isolated five-account package check.',
                         'Production site was not fetched or deployed. No passwords, cookies or secret values used.']}
    (HERE / 'public-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('Public preview read-only verification:', result['status'], len(rows), 'checks; no login/private records.')
    raise SystemExit(0 if result['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
