"""Guarded production-only recovery: no V3, secret values, auth stores or saves."""
from pathlib import Path
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PRE = Path('/private/tmp/nobi-souta-secret-post-20261023.log')
POST = Path('/private/tmp/nobi-souta-recovery-post-20261023.log')
spec = importlib.util.spec_from_file_location('souta_recovery_registration', HERE / 'register-local.py')
registration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(registration)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def require_full(path):
    require(path.exists() and path.read_text().rstrip().endswith('EXIT=0'), '全体検証の成功をまだ確認できません。公開しません。')


def verify_candidate():
    result = subprocess.run([sys.executable, str(HERE / 'verify-preservation.py')], capture_output=True, text=True)
    require(result.returncode == 0, '候補のSHAが点検時と違います。公開しません。')
    for name in ['auth-result.json', 'registration-test-result.json', 'deployment-test-result.json']:
        data = json.loads((HERE / name).read_text())
        require(data.get('status') == 'passed', '必要な隔離検証が未完了です。')
        source, field = {'auth-result.json': ('candidate/cf-worker/src/index.js', 'workerSHA256'), 'registration-test-result.json': ('register-local.py', 'registrationSHA256'), 'deployment-test-result.json': ('release.py', 'releaseSHA256')}[name]
        require(hashlib.sha256((HERE / source).read_bytes()).hexdigest() == data.get(field), '隔離検証後にコードが変わりました。')
    require(subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True).returncode == 0, '差分検査が失敗しています。')


def get_page():
    with urllib.request.urlopen(urllib.request.Request('https://nobilog.pages.dev/', headers={'User-Agent': 'Mozilla/5.0 nobilog-recovery-check', 'Cache-Control': 'no-cache'}), timeout=30) as response:
        return hashlib.sha256(response.read()).hexdigest()


def active_version():
    current = registration.latest_deployment().get('versions', [])
    require(len(current) == 1 and current[0].get('percentage') == 100, '公開中の版を一意に確認できません。')
    return current[0]['version_id']


def etag(version):
    data = registration.metadata(['versions', 'view', version, '--json'], dict)
    value = data.get('resources', {}).get('script', {}).get('etag')
    require(isinstance(value, str) and value, 'Workerのコード識別値を確認できません。')
    return value


def names():
    return {row.get('name') for row in registration.metadata(['secret', 'list'])}


def guard_original(manifest):
    require(get_page() == manifest['baseline']['pages/index.html'], '公開中の画面が土台から変わりました。上書きしません。')
    version = active_version()
    require(version == manifest['preWorkerVersion'] and etag(version) == manifest['preWorkerETag'], '公開中Workerが土台から変わりました。上書きしません。')


def authorize():
    require_full(PRE)
    verify_candidate()
    manifest = json.loads((HERE / 'manifest.json').read_text())
    guard_original(manifest)
    require(registration.REQUIRED <= names() and 'PIN_PEPPER_SOUTA' not in names(), 'secret名が想定と違います。入力画面は開きません。')
    with tempfile.TemporaryDirectory(prefix='nobi-souta-dryrun-') as directory:
        result = registration.cli(['deploy', '--dry-run', '--outdir', directory])
        require(result.returncode == 0, 'dry-runが失敗しました。公開しません。')
    (HERE / 'setup-authorization.json').write_text(json.dumps({
        'status': 'candidate verified; dedicated secrets pending',
        'workerVersionId': manifest['preWorkerVersion'], 'workerETag': manifest['preWorkerETag'],
        'preFullLog': str(PRE), 'dryRun': 'passed', 'secretValuesRead': False,
    }, indent=2) + '\n')
    print('候補の隔離検証・土台SHA・全体検証・dry-run・secret名を確認。番号の非表示入力を準備できます。')


def guard_pre_deploy():
    require_full(PRE)
    require_full(POST)
    verify_candidate()
    manifest = json.loads((HERE / 'manifest.json').read_text())
    receipt = json.loads((HERE / 'registration-result.json').read_text())
    require(receipt.get('status') == 'dedicated secrets updated; candidate publication and login pending', 'そうた専用の設定が未完了です。')
    require(get_page() == manifest['baseline']['pages/index.html'], '公開画面が土台から変わりました。上書きしません。')
    require(active_version() == receipt['workerVersionId'] and etag(receipt['workerVersionId']) == manifest['preWorkerETag'], '公開Workerが設定後から変わりました。上書きしません。')
    require(registration.REQUIRED | registration.NAMES <= names(), '必須secret名が足りません。公開しません。')


def live_worker():
    for origin, expected in [('https://nobilog.pages.dev', 401), ('https://evil.invalid', 403)]:
        request = urllib.request.Request('https://nobilog-board.naon4022.workers.dev/auth/me', headers={'Origin': origin, 'User-Agent': 'nobilog-recovery-check'})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                status = response.status
        except urllib.error.HTTPError as error:
            status = error.code
        require(status == expected, 'Worker公開後の認証拒否確認が失敗しました。')


def worker_step():
    guard_pre_deploy()
    with tempfile.TemporaryDirectory(prefix='nobi-souta-publish-dryrun-') as directory:
        require(registration.cli(['deploy', '--dry-run', '--outdir', directory]).returncode == 0, '公開直前dry-run失敗。')
    require(registration.cli(['deploy', '--keep-vars']).returncode == 0, 'Worker公開結果が未確認です。再送せず状態を確認してください。')
    version = active_version()
    receipt = {'status': 'worker published; live checks pending', 'workerVersionId': version, 'workerETag': etag(version)}
    (HERE / 'worker-publication.json').write_text(json.dumps(receipt, indent=2) + '\n')
    live_worker()
    receipt['status'] = 'worker verified; pages pending'
    (HERE / 'worker-publication.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Workerの公開と未認証・別Originの拒否を確認。')


def deploy():
    guard_pre_deploy()
    if subprocess.run(['bash', './deploy-secure.sh'], cwd=HERE / 'candidate/cf-worker').returncode:
        restore_if_owned()
        raise RuntimeError('Worker段階を完了できません。Pagesは公開していません。')
    result = registration.cli(['pages', 'deploy', str(HERE / 'candidate/pages'), '--project-name', 'nobilog', '--branch', 'main', '--commit-dirty=true'], worker=False)
    target = json.loads((HERE / 'manifest.json').read_text())['candidate']['pages/index.html']
    for attempt in range(6):
        if get_page() == target:
            break
        if attempt != 5:
            time.sleep(5)
    else:
        restore_if_owned()
        raise RuntimeError('Pages公開状態が候補と一致しません。完了扱いにせず、再公開前に状態を確認します。')
    # If Pages CLI lost its response, exact production SHA is the completion proof.
    receipt = json.loads((HERE / 'worker-publication.json').read_text())
    require(active_version() == receipt['workerVersionId'], '公開途中でWorkerが変更されました。')
    receipt.update(status='worker and pages verified; real login pending', version='2.17.2', pagesSHA256=target, pagesCLIExitCode=result.returncode, loginVerified=False, v3Included=False)
    (HERE / 'publication.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('公開版2.17.2のWorker→Pages公開とSHA一致を確認。実際のそうたログインはまだ未確認です。')


def restore_if_owned():
    receipt = HERE / 'worker-publication.json'
    if not receipt.exists():
        return
    current = json.loads(receipt.read_text())
    manifest = json.loads((HERE / 'manifest.json').read_text())
    if active_version() == current['workerVersionId'] and get_page() == manifest['baseline']['pages/index.html']:
        require(subprocess.run(['bash', './deploy-secure.sh', 'rollback'], cwd=HERE / 'candidate/cf-worker').returncode == 0, 'Workerの復旧結果が未確認です。再送せず状態を確認してください。')


def rollback_worker():
    receipt = json.loads((HERE / 'worker-publication.json').read_text())
    manifest = json.loads((HERE / 'manifest.json').read_text())
    require(active_version() == receipt['workerVersionId'] and get_page() == manifest['baseline']['pages/index.html'], '状態が変わったため自動復旧しません。')
    baseline = HERE.parent / 'security-hardening-20261022/candidate/cf-worker'
    for relative in ['src/index.js', 'src/guard.mjs', 'src/google-account.mjs', 'wrangler.jsonc']:
        require(hashlib.sha256((baseline / relative).read_bytes()).hexdigest() == manifest['baseline']['cf-worker/' + relative], '復旧元のSHAが変わっています。')
    require(registration.cli(['deploy', '--config', str(baseline / 'wrangler.jsonc'), '--keep-vars'], worker=False).returncode == 0, 'Workerの復旧結果が未確認です。')
    live_worker()
    receipt.update(status='baseline Worker restored; Souta recovery incomplete', restoredVersionId=active_version(), loginVerified=False)
    (HERE / 'worker-publication.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('画面が元のままであることを確認し、Workerを元の公開コードへ復旧しました。')


if __name__ == '__main__':
    try:
        {'authorize': authorize, 'worker-step': worker_step, 'deploy': deploy, 'rollback-worker': rollback_worker}[sys.argv[1]]()
    except Exception as error:
        # Never print raw CLI output, exception traces or request bodies.
        raise SystemExit(str(error) if isinstance(error, RuntimeError) else '公開確認で停止しました。詳細出力は表示しません。') from None
