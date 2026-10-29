"""Synthetic-only registration/transport tests; no Cloudflare connection."""
import contextlib
import hashlib
import hmac
import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import threading
import urllib.request
import urllib.error
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('souta_registration', Path(__file__).with_name('register-local.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
checks = 0
pin = ''.join(map(str, [9, 8, 0, 7]))
wide = ''.join(chr(ord(c) + 0xFEE0) for c in pin)


def check(value):
    global checks
    assert value
    checks += 1


def run(body_change=None, failure=False, version_change=False, existing=False, concurrent=False):
    with tempfile.TemporaryDirectory(prefix='nobi-souta-registration-test-') as directory:
        root = Path(directory)
        (root / 'setup-authorization.json').write_text(json.dumps({'status': 'candidate verified; dedicated secrets pending', 'workerVersionId': 'fixture-before', 'workerETag': 'fixture-code-etag'}))
        registration = m.Registration()
        calls, values = [], []

        def cli(args, payload=None):
            calls.append(args)
            if args == ['secret', 'list']:
                names = m.REQUIRED | (m.NAMES if existing or values else set())
                return SimpleNamespace(returncode=0, stdout='banner\n' + json.dumps([{'name': name} for name in names]))
            if args == ['deployments', 'list', '--json']:
                version = 'fixture-after' if values else 'fixture-changed' if version_change else 'fixture-before'
                return SimpleNamespace(returncode=0, stdout=json.dumps([{'created_on': 'fixture', 'versions': [{'version_id': version, 'percentage': 100}]}]))
            if args == ['versions', 'view', 'fixture-after', '--json']:
                return SimpleNamespace(returncode=0, stdout=json.dumps({'resources': {'script': {'etag': 'fixture-code-etag'}}}))
            assert args == ['secret', 'bulk']
            values.append(json.loads(payload))
            return SimpleNamespace(returncode=1 if failure else 0, stdout='', stderr='')

        body = {'csrf': registration.token, 'pin': wide, 'confirm': pin}
        if body_change:
            body.update(body_change)
        if concurrent:
            registration.lock.acquire()
        with patch.object(m, 'HERE', root), patch.object(m, 'cli', side_effect=cli), contextlib.redirect_stdout(io.StringIO()) as output:
            status, message = registration.register(body)
            repeated = registration.register({'csrf': registration.token, 'pin': pin, 'confirm': pin}) if values else None
        if concurrent:
            registration.lock.release()
        receipt = (root / 'registration-result.json').read_text() if (root / 'registration-result.json').exists() else ''
        check(pin not in message + output.getvalue() + receipt)
        check(body.get('pin') == body.get('confirm') == '')
        check(all(pin not in json.dumps(args) for args in calls))
        for value in values:
            check(set(value) == m.NAMES)
            key = value['PIN_PEPPER_SOUTA']
            check(len(key) == 64 and all(c in '0123456789abcdef' for c in key))
            check(hmac.new(key.encode(), pin.encode(), hashlib.sha256).digest() != b'')
            import base64
            expected = base64.urlsafe_b64encode(hmac.new(key.encode(), pin.encode(), hashlib.sha256).digest()).decode().rstrip('=')
            check(value['LEGACY_SOUTA_PIN_HASH'] == expected)
            check(key not in receipt and expected not in receipt)
        return status, values, receipt, repeated


status, values, receipt, repeated = run()
check(status == 200 and len(values) == 1)
check(json.loads(receipt)['loginVerified'] is False)
check(repeated[0] == 409)
for options in [
    {'body_change': {'csrf': 'wrong'}},
    {'body_change': {'confirm': 'wrong'}},
    {'body_change': {'pin': 'not-a-pin'}},
    {'body_change': {'uid': 'u1'}},
    {'version_change': True}, {'existing': True}, {'concurrent': True},
]:
    status, values, receipt, _ = run(**options)
    check(status != 200 and not values and not receipt)
status, values, receipt, repeated = run(failure=True)
check(status == 503 and len(values) == 1 and not receipt and repeated[0] == 409)

# Real HTTP server with a synthetic callback: strict loopback Host/Origin and
# content type/body limits stay provided by the existing tested transport.
class Fake:
    token = 'fixture-csrf'
    def register(self, body):
        return (200, 'fixture-ok') if body == {'csrf': self.token, 'pin': 'fixture', 'confirm': 'fixture'} else (403, 'fixture-denied')

server = m.serve(Fake())
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = 'http://127.0.0.1:' + str(server.server_port)


def request(path='/', body=None, headers=None):
    req = urllib.request.Request(base + path, data=body, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, response.headers, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.headers, error.read().decode()


try:
    code, headers, content = request()
    check(code == 200 and headers['Cache-Control'] == 'no-store')
    check("frame-ancestors 'none'" in headers['Content-Security-Policy'])
    check(content.count('type="password"') == 2 and 'PIN_PEPPER' not in content)
    check("pin.value=confirm.value=''" in content)
    check('localStorage' not in content and 'sessionStorage' not in content)
    check(request(headers={'Host': 'evil.invalid'})[0] == 403)
    payload = json.dumps({'csrf': Fake.token, 'pin': 'fixture', 'confirm': 'fixture'}).encode()
    check(request('/register', payload, {'Content-Type': 'application/json', 'Origin': 'https://evil.invalid'})[0] == 403)
    check(request('/register', payload, {'Content-Type': 'text/plain', 'Origin': base})[0] == 415)
    check(request('/register', b' ' * 2049, {'Content-Type': 'application/json', 'Origin': base})[0] == 400)
    check(request('/register', payload, {'Content-Type': 'application/json', 'Origin': base})[0] == 200)
finally:
    server.shutdown()
    server.server_close()
    thread.join()

# Confirm that every real CLI call uses a log sink, never a secret file/argument.
with patch.object(m.subprocess, 'run', return_value=SimpleNamespace(returncode=0)) as command:
    m.cli(['secret', 'bulk'], 'fixture-payload')
    args, kwargs = command.call_args
    check('fixture-payload' not in repr(args))
    check(kwargs['input'] == 'fixture-payload')
    check(kwargs['env']['WRANGLER_LOG'] == 'none')
    check(kwargs['env']['WRANGLER_LOG_PATH'].endswith('/discard.log'))
    check(kwargs['env']['CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV'] == 'false')

(Path(__file__).with_name('registration-test-result.json')).write_text(json.dumps({'status': 'passed', 'checks': checks, 'registrationSHA256': hashlib.sha256(Path(__file__).with_name('register-local.py').read_bytes()).hexdigest(), 'scope': 'synthetic inputs, fake CLI, loopback HTTP only; no real secrets or Cloudflare'}, indent=2) + '\n')
print(f'Souta registration: {checks} checks passed; hidden inputs, fullwidth normalization, generated key, two-secret bulk only, CSRF/loopback/size guards, race/replay/unknown-result stop, no plaintext files or logs.')
