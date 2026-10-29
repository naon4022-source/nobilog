import importlib.util
import json
import tempfile
from pathlib import Path
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('approval_register', Path(__file__).with_name('register.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
n = 0


def eq(a, b):
    global n
    assert a == b, (a, b)
    n += 1


config = {'name': 'nobilog-preview', 'vars': {
    'APP_ORIGIN': 'https://nobilog-preview.naon4022.workers.dev',
    'SUBSCRIPTION_PREVIEW': '1', 'PREVIEW_PLAN_ACCOUNTS': '1',
    'OPENAI_ENABLED': '0', 'GEMINI_ENABLED': '0',
}, 'd1_databases': [{'binding': 'AUTH_DB', 'database_name': 'nobilog-preview-store', 'database_id': module.DATABASE_ID}]}
yes = {'age_band': '13-17', 'guardian_consent': True, 'minimum_age_confirmed': True, 'operator_confirmed': True}
with tempfile.TemporaryDirectory() as temp:
    root = Path(temp)
    (root / 'wrangler.jsonc').write_text(json.dumps(config))
    calls = []
    replies = [[{'saved': 1}]]

    def run(cmd, **kwargs):
        calls.append(cmd)
        assert cmd[:6] == ['npx', '--yes', 'wrangler@4.45.0', 'd1', 'execute', 'nobilog-preview-store']
        assert '--remote' in cmd and '--config' in cmd and '--json' in cmd
        assert kwargs['cwd'] == root and kwargs['capture_output'] is True
        sql = cmd[-1]
        assert 'SELECT v' not in sql and 'DELETE' not in sql and 'DO UPDATE' not in sql
        return SimpleNamespace(returncode=0, stdout=json.dumps([{'success': True, 'results': replies.pop(0)}]), stderr='')

    writer = module.ApprovalWriter(root, run)
    eq(writer.register('u1', **yes), {'ok': True, 'created': True})
    replies[:] = [[], [{'same': 1}]]
    eq(writer.register('u1', **yes), {'ok': True, 'created': False})
    replies[:] = [[], []]
    eq(writer.register('u2', **yes), {'error': 'approval_conflict'})
    before = len(calls)
    for patch in [{'age_band': 'under13'}, {'guardian_consent': False}, {'minimum_age_confirmed': False}]:
        eq(writer.register('u2', **{**yes, **patch}), {'error': 'consent_required'})
    for uid in ['p_pro', 'wrong-user', "u1';DROP TABLE auth_kv;--"]:
        eq(writer.register(uid, **yes), {'error': 'approval_not_authorized'})
    eq(writer.register('u1', **{**yes, 'operator_confirmed': False}), {'error': 'approval_not_authorized'})
    eq(len(calls), before)
    for field, value in [('OPENAI_ENABLED', '1'), ('GEMINI_ENABLED', '1'), ('APP_ORIGIN', 'https://nobilog.pages.dev')]:
        broken = json.loads(json.dumps(config))
        broken['vars'][field] = value
        (root / 'wrangler.jsonc').write_text(json.dumps(broken))
        eq(writer.register('u1', **yes), {'error': 'approval_save_unconfirmed'})
        eq(len(calls), before)
    broken = json.loads(json.dumps(config))
    broken['d1_databases'][0]['database_id'] = 'different-target'
    (root / 'wrangler.jsonc').write_text(json.dumps(broken))
    eq(writer.register('u1', **yes), {'error': 'approval_save_unconfirmed'})
    eq(len(calls), before)
    (root / 'wrangler.jsonc').write_text(json.dumps(config))
    writer.run = lambda *a, **k: SimpleNamespace(returncode=1, stdout='secret_provider_detail', stderr='secret_provider_detail')
    eq(writer.register('u1', **yes), {'error': 'approval_save_unconfirmed'})
    writer.run = lambda *a, **k: SimpleNamespace(returncode=0, stdout='malformed', stderr='')
    eq(writer.register('u1', **yes), {'error': 'approval_save_unconfirmed'})
    writer.run = run
    live = json.loads(json.dumps(config))
    live['vars'].update({key: '1' for key in ['OPENAI_ENABLED', 'OPENAI_TRIAL_ONLY', 'OPENAI_BILLING_READY', 'OPENAI_SAFETY_READY', 'OPENAI_TERMS_READY']})
    live['vars']['OPENAI_MONTHLY_LIMIT_YEN'] = '800'
    (root / 'wrangler.jsonc').write_text(json.dumps(live))
    before = len(calls)
    eq(writer.register('p_unlimit', **yes), {'error': 'approval_not_authorized'})
    eq(writer.register('p_unlimit', **yes, profile_association_confirmed='true'), {'error': 'approval_not_authorized'})
    eq(writer.register('p_free', **yes, profile_association_confirmed=True), {'error': 'approval_not_authorized'})
    eq(len(calls), before)
    replies[:] = [[{'saved': 1}]]
    eq(writer.register('p_unlimit', **yes, profile_association_confirmed=True), {'ok': True, 'created': True})
    for key, value in [('GEMINI_ENABLED', '1'), ('OPENAI_TRIAL_ONLY', '0'), ('OPENAI_SAFETY_READY', '0'), ('OPENAI_TERMS_READY', '0'), ('OPENAI_BILLING_READY', '0'), ('OPENAI_MONTHLY_LIMIT_YEN', '1000'), ('OPENAI_MONTHLY_LIMIT_YEN', '000800')]:
        broken = json.loads(json.dumps(live));broken['vars'][key] = value
        (root / 'wrangler.jsonc').write_text(json.dumps(broken))
        before = len(calls)
        eq(writer.register('p_pro', **yes, profile_association_confirmed=True), {'error': 'approval_save_unconfirmed'})
        eq(len(calls), before)
print(f'AI approval writer candidate: {n} synthetic checks passed; fixed SQL, explicit profile association, preview safety gates, no readback or real command')
