"""Operator helper candidate: preview-only approval, no secret or record readback.

Import from a trusted operator tool; never accept these flags from learner HTTP.
This file has no CLI or HTTP entry point and makes no call on import.
"""
import json
import subprocess
from pathlib import Path


DATABASE_ID = '487d1286-3830-4e1a-ace8-b065cdf4f59b'


class ApprovalError(Exception):
    pass


class ApprovalWriter:
    def __init__(self, root=None, run=subprocess.run):
        self.root = root or Path(__file__).resolve().parents[3] / 'preview'
        self.run = run

    def guard(self, *, confirmed_profile=False):
        try:
            config = json.loads((self.root / 'wrangler.jsonc').read_text())
            variables = config['vars']
            databases = config['d1_databases']
            if config['name'] != 'nobilog-preview' or variables['APP_ORIGIN'] != 'https://nobilog-preview.naon4022.workers.dev':
                raise ValueError()
            if any(variables.get(k) != v for k, v in {
                'SUBSCRIPTION_PREVIEW': '1', 'PREVIEW_PLAN_ACCOUNTS': '1',
                'GEMINI_ENABLED': '0',
            }.items()):
                raise ValueError()
            if variables.get('OPENAI_ENABLED') != '0':
                if confirmed_profile is not True or variables.get('OPENAI_ENABLED') != '1' or any(variables.get(k) != '1' for k in ['OPENAI_TRIAL_ONLY', 'OPENAI_BILLING_READY', 'OPENAI_SAFETY_READY', 'OPENAI_TERMS_READY']):
                    raise ValueError()
                cap = variables.get('OPENAI_MONTHLY_LIMIT_YEN', '')
                if not isinstance(cap, str) or not 1 <= len(cap) <= 3 or not cap.isascii() or not cap.isdigit() or not 1 <= int(cap) <= 800:
                    raise ValueError()
            rows = [d for d in databases if d.get('binding') == 'AUTH_DB']
            if len(rows) != 1 or rows[0].get('database_name') != 'nobilog-preview-store' or rows[0].get('database_id') != DATABASE_ID:
                raise ValueError()
        except Exception:
            raise ApprovalError('preview_guard_failed') from None

    def execute(self, sql):
        result = self.run([
            'npx', '--yes', 'wrangler@4.45.0', 'd1', 'execute',
            'nobilog-preview-store', '--remote', '--config', 'wrangler.jsonc',
            '--json', '--command', sql,
        ], cwd=self.root, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise ApprovalError('approval_save_unconfirmed')
        rows = json.loads(result.stdout)
        if not isinstance(rows, list) or len(rows) != 1 or rows[0].get('success') is not True or not isinstance(rows[0].get('results'), list):
            raise ApprovalError('approval_save_unconfirmed')
        return rows[0]['results']

    def register(self, uid, *, age_band, guardian_consent, minimum_age_confirmed, operator_confirmed=False, profile_association_confirmed=False):
        # Family identities only. Preview demo identities require a separate
        # verified association; a shared PIN is not an age/consent assertion.
        profile = uid in ('p_mini', 'p_standard', 'p_pro', 'p_unlimit') and profile_association_confirmed is True
        if operator_confirmed is not True or (uid not in ('u1', 'u2') and not profile):
            return {'error': 'approval_not_authorized'}
        if minimum_age_confirmed is not True or age_band not in ('13-17', 'adult') or type(guardian_consent) is not bool or age_band == '13-17' and not guardian_consent:
            return {'error': 'consent_required'}
        value = json.dumps({'version': '2026-10-14', 'approved': True, 'ageBand': age_band, 'guardianConsent': guardian_consent}, separators=(',', ':'))
        # All SQL components are fixed enums/JSON booleans, never free text,
        # credentials, names, birth dates, arbitrary IDs or arbitrary queries.
        key = 'openai-access:' + uid
        try:
            self.guard(confirmed_profile=profile)
            rows = self.execute(f"INSERT INTO auth_kv(k,v,expires_at) VALUES('{key}','{value}',0) ON CONFLICT(k) DO NOTHING RETURNING 1 AS saved")
            if rows == [{'saved': 1}]:
                return {'ok': True, 'created': True}
            if rows:
                raise ValueError()
            rows = self.execute(f"SELECT 1 AS same FROM auth_kv WHERE k='{key}' AND v='{value}'")
            if rows == [{'same': 1}]:
                return {'ok': True, 'created': False}
            if rows:
                raise ValueError()
            return {'error': 'approval_conflict'}
        except Exception:
            return {'error': 'approval_save_unconfirmed'}
