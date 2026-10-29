"""Register preview-only passwords through hidden input; never persist secret values."""
import base64
import getpass
import hashlib
import hmac
import json
import re
import secrets
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROFILES = {'u1': 'Free', 'p_mini': 'Mini', 'p_standard': 'Student',
            'p_pro': 'Pro', 'p_unlimit': 'UNLIMIT'}

def main():
    if not sys.stdin.isatty():
        raise SystemExit('非表示入力が使えるターミナルで実行してください。変更していません。')
    config = json.loads((ROOT / 'wrangler.jsonc').read_text())
    if (config.get('name') != 'nobilog-preview'
            or config.get('vars', {}).get('APP_ORIGIN') != 'https://nobilog-preview.naon4022.workers.dev'
            or [d.get('database_name') for d in config.get('d1_databases', [])] != ['nobilog-preview-store']):
        raise SystemExit('専用確認版の構成を確認できません。変更していません。')
    pepper = secrets.token_hex(32)
    hashes, seen = {}, set()
    for uid, label in PROFILES.items():
        password = getpass.getpass(label + ' 確認版のパスワード（非表示）: ')
        if not re.fullmatch(r'[-_A-Za-z0-9]{2,64}', password) or password in seen:
            raise SystemExit('形式か重複を確認してください。変更していません。')
        seen.add(password)
        message = ('access:v1:' + uid + ':' + password).encode()
        hashes[uid] = base64.urlsafe_b64encode(hmac.new(pepper.encode(), message, hashlib.sha256).digest()).decode().rstrip('=')
    password = message = None
    seen.clear()
    payload = json.dumps({'PREVIEW_ACCESS_CODES': json.dumps({'pepper': pepper, 'hashes': hashes})})
    try:
        result = subprocess.run(['npx', '--yes', 'wrangler@latest', 'secret', 'bulk', '--config', 'wrangler.jsonc'],
                                cwd=ROOT, input=payload, text=True, capture_output=True, timeout=180)
    except (OSError, subprocess.TimeoutExpired):
        raise SystemExit('登録結果を確認できません。再登録前に接続を確認してください。')
    finally:
        payload = pepper = None
        hashes.clear()
    if result.returncode:
        raise SystemExit('Cloudflareへの登録に失敗しました。秘密値は表示していません。')
    print('確認版5プランの検証値を登録しました。原文は保存していません。')

if __name__ == '__main__':
    main()
