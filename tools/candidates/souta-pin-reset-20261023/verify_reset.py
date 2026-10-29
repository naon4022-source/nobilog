"""Synthetic hidden-input/CLI tests. Never contacts Cloudflare."""
import contextlib
import importlib.util
import io
import json
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('reset', Path(__file__).with_name('reset.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
pin = ''.join(str(n) for n in [9, 8, 7, 6])
fullwidth = ''.join(chr(ord(c) + 0xFEE0) for c in pin)
pepper = 'synthetic_reset_fixture_pepper'
checks = 0


def run(inputs, *, tty=True, version_changed=False, race=False, put_failure=False):
    calls = []
    versions = 0
    output = io.StringIO()
    with tempfile.TemporaryDirectory(prefix='nobi-reset-fixture-') as temp:
        def fake_cli(args, payload=None):
            nonlocal versions
            calls.append((args, payload))
            if args[:2] == ['secret', 'list']:
                data = [{'name': n} for n in module.REQUIRED]
            elif args[:2] == ['deployments', 'list']:
                versions += 1
                version = 'changed' if version_changed or (race and versions > 1) else module.EXPECTED_VERSION
                data = [{'created_on': 'synthetic', 'versions': [{'version_id': version, 'percentage': 100}]}]
            elif args == ['secret', 'put', 'LEGACY_SOUTA_PIN_HASH']:
                return SimpleNamespace(returncode=1 if put_failure else 0, stdout='', stderr='')
            else:
                raise AssertionError('Unexpected command')
            return SimpleNamespace(returncode=0, stdout=json.dumps(data), stderr='')

        with patch.object(module, 'HERE', Path(temp)), patch.object(module, 'cli', side_effect=fake_cli), patch.object(module.sys, 'stdin', SimpleNamespace(isatty=lambda: tty)), patch.object(module.getpass, 'getpass', side_effect=inputs), contextlib.redirect_stdout(output):
            error = None
            try:
                module.main()
            except RuntimeError as exc:
                error = str(exc)
        receipt = Path(temp) / 'human-result.json'
        saved = receipt.read_text() if receipt.exists() else ''
        assert pin not in output.getvalue() and pepper not in output.getvalue()
        assert pin not in saved and pepper not in saved
        assert all(pin not in json.dumps(args) and pepper not in json.dumps(args) for args, _ in calls)
        puts = [payload for args, payload in calls if args[:2] == ['secret', 'put']]
        assert all(pin not in value and pepper not in value for value in puts)
        return error, puts, saved


error, puts, saved = run([pepper, pepper, fullwidth, pin])
assert error is None and len(puts) == 1
assert json.loads(saved)['loginVerified'] is False
assert len(puts[0].strip()) == 43
checks += 1
for inputs, options in [
    ([pepper, 'mismatch'], {}),
    ([pepper, pepper, pin, 'wrong'], {}),
    ([], {'tty': False}),
    ([], {'version_changed': True}),
    ([pepper, pepper, pin, pin], {'race': True}),
]:
    error, puts, saved = run(inputs, **options)
    assert error and not puts and not saved
    checks += 1
error, puts, saved = run([pepper, pepper, pin, pin], put_failure=True)
assert error and len(puts) == 1 and not saved
checks += 1
print(f'Reset wizard: {checks} synthetic scenarios passed; hidden input, fullwidth normalization, mismatch, no-TTY, version guard/race, one-secret-only write and unknown-result handling; no network or real credentials.')
with patch.object(module, 'cli', return_value=SimpleNamespace(returncode=0, stdout='CLI banner\n[{"name":"fixture"}]\n', stderr='')):
    assert module.metadata(['secret','list']) == [{'name':'fixture'}]
with patch.object(module, 'cli', return_value=SimpleNamespace(returncode=0, stdout='unexpected output', stderr='')):
    try:
        module.metadata(['secret','list'])
        raise AssertionError('Malformed metadata must not pass')
    except RuntimeError:
        pass
print('Metadata parser: version-banner and malformed-output guards passed; raw CLI output never echoed.')
with patch.object(module.subprocess, 'run', return_value=SimpleNamespace(returncode=0,stdout='',stderr='')) as command:
    module.cli(['secret','list'])
    assert command.call_args.kwargs['env']['WRANGLER_LOG'] == 'log'
    module.cli(['secret','put','LEGACY_SOUTA_PIN_HASH'], 'synthetic_verifier\n')
    assert command.call_args.kwargs['env']['WRANGLER_LOG'] == 'none'
    assert command.call_args.kwargs['env']['WRANGLER_LOG_PATH'] == '/dev/null'
print('CLI logging: metadata is captured for parsing; secret update suppresses stdout/log files.')
