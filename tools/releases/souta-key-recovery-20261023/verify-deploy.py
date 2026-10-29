"""Fake CLI/HTTP only: publication order, failure and conditional rollback."""
from pathlib import Path
import contextlib
import importlib.util
import io
import hashlib
import json
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('souta_release', Path(__file__).with_name('release.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
checks = 0


def check(value):
    global checks
    assert value
    checks += 1


def scenario(*, worker_fail=False, pages_fail=False, response_lost=False, foreign_page=False, foreign_worker=False):
    events = []
    with tempfile.TemporaryDirectory(prefix='nobi-souta-release-test-') as directory:
        root = Path(directory)
        (root / 'manifest.json').write_text(json.dumps({'baseline': {'pages/index.html': 'before'}, 'candidate': {'pages/index.html': 'after'}}))
        current_page = 'before'
        def subprocess(args, **kwargs):
            if args == ['bash', './deploy-secure.sh']:
                events.append('worker')
                check(kwargs['cwd'] == root / 'candidate/cf-worker')
                (root / 'worker-publication.json').write_text(json.dumps({'status': 'worker verified; pages pending', 'workerVersionId': 'owned'}))
                return SimpleNamespace(returncode=1 if worker_fail else 0)
            check(args == ['bash', './deploy-secure.sh', 'rollback'])
            events.append('rollback')
            return SimpleNamespace(returncode=0)
        def cli(args, **kwargs):
            nonlocal current_page
            check(args[:2] == ['pages', 'deploy'] and kwargs == {'worker': False})
            events.append('pages')
            current_page = 'foreign' if foreign_page else 'before' if pages_fail else 'after'
            return SimpleNamespace(returncode=1 if pages_fail or response_lost else 0)
        error = None
        with patch.object(m, 'HERE', root), patch.object(m, 'guard_pre_deploy', side_effect=lambda: events.append('guard')), patch.object(m.subprocess, 'run', side_effect=subprocess), patch.object(m.registration, 'cli', side_effect=cli), patch.object(m, 'get_page', side_effect=lambda: current_page), patch.object(m, 'active_version', return_value='foreign' if foreign_worker else 'owned'), patch.object(m.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
            try:
                m.deploy()
            except RuntimeError as exc:
                error = str(exc)
        receipt = json.loads((root / 'publication.json').read_text()) if (root / 'publication.json').exists() else None
        return events, error, receipt


events, error, receipt = scenario()
check(error is None and events == ['guard', 'worker', 'pages'])
check(receipt['loginVerified'] is False and receipt['v3Included'] is False)
events, error, receipt = scenario(response_lost=True)
check(error is None and receipt['pagesCLIExitCode'] == 1)
events, error, receipt = scenario(worker_fail=True)
check(error and events == ['guard', 'worker', 'rollback'] and receipt is None)
events, error, receipt = scenario(pages_fail=True)
check(error and events == ['guard', 'worker', 'pages', 'rollback'] and receipt is None)
events, error, receipt = scenario(foreign_page=True)
check(error and 'rollback' not in events and receipt is None)
events, error, receipt = scenario(foreign_worker=True)
check(error and 'rollback' not in events and receipt is None)

with tempfile.TemporaryDirectory(prefix='nobi-souta-proof-test-') as directory:
    proof = Path(directory) / 'proof.log'
    for text in ['', 'EXIT=1\n', 'EXIT=0\nstill running\n']:
        proof.write_text(text)
        try:
            m.require_full(proof)
            raise AssertionError('Incomplete/failed proof must stop publication')
        except RuntimeError:
            checks += 1
    proof.write_text('fixture complete\nEXIT=0\n')
    m.require_full(proof)
    checks += 1

Path(__file__).with_name('deployment-test-result.json').write_text(json.dumps({'status': 'passed', 'checks': checks, 'releaseSHA256': hashlib.sha256(Path(__file__).with_name('release.py').read_bytes()).hexdigest(), 'scope': 'fake CLI/HTTP only; Worker then Pages, response loss, known-baseline rollback, unknown-state stop; no deploy'}, indent=2) + '\n')
print(f'Souta deployment: {checks} checks passed; ordering, response loss, conditional rollback and proof guards; fake CLI/HTTP only.')
