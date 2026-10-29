"""Check published version/binding metadata; never retrieve a secret value or database row."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import subprocess

ROOT = Path.cwd()
HERE = ROOT / 'tools/releases/preview-verified-20261026'
PREVIEW = ROOT / 'preview'


def cli(*args):
    result = subprocess.run(['npx', '--yes', 'wrangler@4.152.0', *args, '--config', 'wrangler.jsonc', '--json'],
                            cwd=PREVIEW, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Read-only deployment metadata request failed; CLI details withheld')
    return json.loads(result.stdout)


def main():
    report = json.loads((HERE / 'deployment.json').read_text())
    assert report['observedExitCode'] == 0, 'actual deploy command must succeed first'
    amendment = json.loads((HERE / 'admin-release-amendment/amendment.json').read_text())
    allowed_changes = {row['file']: row for row in amendment['files']}
    assert hashlib.sha256((ROOT / amendment['stageProof']).read_bytes()).hexdigest() == amendment['stageProofSha256']
    changes = []
    for file, before in report['firstObservedInputSha256'].items():
        after = hashlib.sha256((ROOT / file).read_bytes()).hexdigest()
        if after != before:
            allowed = allowed_changes.get(file)
            assert allowed and allowed['beforeSha256'] == before and allowed['afterSha256'] == after, 'unreviewed source change: ' + file
            changes.append({'file': file, 'before': before, 'after': after})
    for file, allowed in allowed_changes.items():
        assert hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == allowed['afterSha256']
        assert hashlib.sha256((ROOT / allowed['beforeFile']).read_bytes()).hexdigest() == allowed['beforeSha256']
    previous_config = json.loads((ROOT / allowed_changes['preview/wrangler.jsonc']['beforeFile']).read_text())
    previous_config['main'] = 'build/verified-preview-entry.mjs'
    assert previous_config == json.loads((PREVIEW / 'wrangler.jsonc').read_text()), 'only reviewed preview main entry can change'
    package = json.loads((HERE / 'package-result.json').read_text())
    assert package['status'] == 'passed' and package['checks'] == 96
    log = (HERE / 'deploy-attempt1.log').read_text()
    versions = re.findall(r'Current Version ID:\s*([a-f0-9-]{36})', log)
    assert versions, 'actual Worker version must be present in deployment output'
    version = versions[-1]
    assert version != 'b93d1733-0636-4677-ad14-87bb8f888ad2', 'old preview version is not a new publication'
    config = json.loads((PREVIEW / 'wrangler.jsonc').read_text())
    assert config['name'] == 'nobilog-preview'
    deployments = cli('deployments', 'list')
    latest = max(deployments, key=lambda row: row['created_on'])
    live = latest.get('versions', [])
    assert len(live) == 1 and live[0]['version_id'] == version and live[0]['percentage'] == 100
    details = cli('versions', 'view', version)
    bindings = {row['name']: row for row in details['resources']['bindings']}
    allowed = ['APP_ORIGIN', 'PREVIEW_RELEASE_VERSION', 'SUBSCRIPTION_PREVIEW', 'PREVIEW_PLAN_ACCOUNTS',
               'PLAN_CREDITS_V2', 'GEMINI_ENABLED', 'OPENAI_ENABLED', 'OPENAI_BILLING_READY', 'OPENAI_TRIAL_ONLY',
               'OPENAI_SAFETY_READY', 'OPENAI_TERMS_READY', 'OPENAI_MONTHLY_LIMIT_YEN']
    switches = {}
    for name in allowed:
        value = bindings[name]
        assert value['type'] == 'plain_text' and value['text'] == config['vars'][name], 'public switch mismatch: ' + name
        switches[name] = value['text']
    assert switches['GEMINI_ENABLED'] == '0'
    db = bindings['AUTH_DB']
    kv = bindings['BOARD']
    assert db['type'] == 'd1' and db.get('id', db.get('database_id')) == config['d1_databases'][0]['database_id']
    assert kv['type'] == 'kv_namespace' and kv.get('namespace_id', kv.get('id')) == config['kv_namespaces'][0]['id']
    names = sorted(name for name, row in bindings.items() if row['type'] == 'secret_text')
    assert {'PREVIEW_PIN_PEPPER', 'PREVIEW_PIN_HASH', 'PREVIEW_ACCESS_CODES', 'NOTICE_VAPID_JWK', 'OPENAI_API_KEY'} <= set(names)
    assert not {'PIN_PEPPER', 'PIN_PEPPER_SOUTA', 'LEGACY_NAO_PIN_HASH', 'LEGACY_RIRAN_PIN_HASH', 'LEGACY_SOUTA_PIN_HASH',
                'TURNSTILE_SECRET', 'GOOGLE_CLIENT_SECRET', 'LINE_CLIENT_SECRET'} & set(names)
    result = {'status': 'passed', 'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'worker': config['name'], 'origin': switches['APP_ORIGIN'], 'versionId': version,
              'deploymentId': latest['id'], 'release': switches['PREVIEW_RELEASE_VERSION'],
              'publicSwitches': switches, 'secretNamesOnly': names, 'dedicatedDatabaseAndKV': True,
              'productionSecretNamesAbsent': True, 'privateDataOrSecretValuesRead': False}
    result['reviewedPackagingInputChanges'] = changes
    result['unreviewedSourceChanges'] = []
    (HERE / 'published-version.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('Published preview version and dedicated bindings verified; only secret names inspected.')


if __name__ == '__main__':
    main()
