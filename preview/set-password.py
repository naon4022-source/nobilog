"""Receive the requested preview password without writing it to a file or log."""
import base64, getpass, hashlib, hmac, json, secrets, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
password = getpass.getpass('確認版専用パスワード（画面には表示しません）: ')
if len(password) != 4 or not password.isascii() or not password.isdigit():
    raise SystemExit('4桁の数字を入力してください。設定は変更していません。')
pepper = secrets.token_hex(32)
digest = base64.urlsafe_b64encode(hmac.new(pepper.encode(), password.encode(), hashlib.sha256).digest()).decode().rstrip('=')
payload = json.dumps({'PREVIEW_PIN_PEPPER': pepper, 'PREVIEW_PIN_HASH': digest})
password = None
result = subprocess.run(['npx', '--yes', 'wrangler@latest', 'secret', 'bulk', '--config', 'wrangler.jsonc'], cwd=ROOT, input=payload, text=True, capture_output=True)
payload = pepper = digest = None
if result.returncode:
    raise SystemExit('確認版の秘密値を設定できませんでした。Cloudflareの接続を確認してください。')
print('確認版専用の検証値を設定しました。原文は保存していません。')
