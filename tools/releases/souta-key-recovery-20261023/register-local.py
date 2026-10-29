"""Human PIN entry on loopback; generated per-account pepper, no secret files."""
import base64
import hashlib
import hmac
import html
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
import threading
import time
import unicodedata

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CONFIG = HERE / 'candidate/cf-worker/wrangler.jsonc'
REQUIRED = {'PIN_PEPPER', 'LEGACY_NAO_PIN_HASH', 'LEGACY_RIRAN_PIN_HASH',
            'LEGACY_SOUTA_PIN_HASH', 'TURNSTILE_SECRET', 'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET', 'LINE_CLIENT_ID', 'LINE_CLIENT_SECRET'}
NAMES = {'PIN_PEPPER_SOUTA', 'LEGACY_SOUTA_PIN_HASH'}


def cli(args, payload=None, *, worker=True):
    env = {**os.environ, 'NPM_CONFIG_OFFLINE': 'true',
           'WRANGLER_LOG': 'none' if payload is not None else 'log',
           'WRANGLER_SEND_METRICS': 'false',
           'CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV': 'false', 'CI': 'true'}
    # Wrangler treats a non-.log path as a directory. A .log symlink to the
    # null device discards even debug logs without creating a secret log file.
    with tempfile.TemporaryDirectory(prefix='nobi-null-log-') as directory:
        sink = Path(directory) / 'discard.log'
        sink.symlink_to('/dev/null')
        env['WRANGLER_LOG_PATH'] = str(sink)
        scope = ['--config', str(CONFIG), '--name', 'nobilog-board'] if worker else []
        return subprocess.run(['npx', '--offline', '--yes', 'wrangler@4.151.3', *args, *scope],
                              cwd='/private/tmp', input=payload, text=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              timeout=180, env=env)


def metadata(args, kind=list):
    result = cli(args)
    if result.returncode:
        raise RuntimeError('接続を確認できません。設定は再送せずCodexへ伝えてください。')
    for index, char in enumerate(result.stdout):
        if char != ('[' if kind is list else '{'):
            continue
        try:
            value, _ = json.JSONDecoder().raw_decode(result.stdout[index:])
        except ValueError:
            continue
        if isinstance(value, kind) and (kind is dict or all(isinstance(row, dict) for row in value)):
            return value
    raise RuntimeError('公開情報を確認できません。詳細出力は表示しません。')


def latest_deployment():
    rows = metadata(['deployments', 'list', '--json'])
    if not rows:
        raise RuntimeError('公開版を確認できません。')
    return max(rows, key=lambda row: row.get('created_on', ''))


class Registration:
    def __init__(self):
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.done = False
        self.attempted = False

    def guard(self):
        receipt = json.loads((HERE / 'setup-authorization.json').read_text())
        if receipt.get('status') != 'candidate verified; dedicated secrets pending':
            raise RuntimeError('修正候補の確認が済んでいません。まだ入力しないでください。')
        names = {row.get('name') for row in metadata(['secret', 'list'])}
        if not REQUIRED <= names or 'PIN_PEPPER_SOUTA' in names:
            raise RuntimeError('設定名が想定と違います。上書きを避けて停止します。')
        expected = [{'version_id': receipt['workerVersionId'], 'percentage': 100}]
        if latest_deployment().get('versions') != expected:
            raise RuntimeError('公開版が変わりました。上書きを避けて停止します。')

    def register(self, body):
        pin = confirm = pepper = verifier = payload = None
        acquired = False
        try:
            if not isinstance(body, dict) or set(body) != {'csrf', 'pin', 'confirm'}:
                return 403, '登録画面から入力してください。'
            if not isinstance(body['csrf'], str) or not secrets.compare_digest(body['csrf'], self.token):
                return 403, '画面を開き直してください。'
            if not isinstance(body['pin'], str) or not isinstance(body['confirm'], str):
                return 400, '4桁の番号を入力してください。'
            pin = unicodedata.normalize('NFKC', body['pin']).strip()
            confirm = unicodedata.normalize('NFKC', body['confirm']).strip()
            if not re.fullmatch(r'[0-9]{4}', pin) or not secrets.compare_digest(pin, confirm):
                return 400, '同じ4桁の番号を2か所へ入力してください。'
            acquired = self.lock.acquire(blocking=False)
            if not acquired or self.attempted or self.done:
                return 409, '送信済みです。再送せず、結果を確認してください。'
            self.guard()
            pepper = secrets.token_hex(32)
            verifier = base64.urlsafe_b64encode(hmac.new(pepper.encode(), pin.encode(), hashlib.sha256).digest()).decode().rstrip('=')
            payload = json.dumps({'PIN_PEPPER_SOUTA': pepper, 'LEGACY_SOUTA_PIN_HASH': verifier}) + '\n'
            # One bulk update preserves all other secret bindings. Never retry an unknown result.
            self.attempted = True
            result = cli(['secret', 'bulk'], payload)
            pin = confirm = pepper = verifier = payload = None
            body['pin'] = body['confirm'] = ''
            if result.returncode:
                return 503, '設定結果が未確認です。再送せず「設定結果未確認」とCodexへ伝えてください。'
            names = {row.get('name') for row in metadata(['secret', 'list'])}
            deployment = latest_deployment()
            if not REQUIRED | NAMES <= names or len(deployment.get('versions', [])) != 1 or deployment['versions'][0].get('percentage') != 100:
                return 503, '設定後の確認が未完了です。再送せずCodexへ伝えてください。'
            version_id = deployment['versions'][0]['version_id']
            version = metadata(['versions', 'view', version_id, '--json'], dict)
            expected = json.loads((HERE / 'setup-authorization.json').read_text())
            if version.get('resources', {}).get('script', {}).get('etag') != expected['workerETag']:
                return 503, 'サーバーの版が変わりました。再送せずCodexへ伝えてください。'
            (HERE / 'registration-result.json').write_text(json.dumps({
                'status': 'dedicated secrets updated; candidate publication and login pending',
                'workerVersionId': version_id,
                'workerETag': expected['workerETag'],
                'secretNamesChanged': sorted(NAMES),
                'otherSecretsChanged': False, 'secretValuesRead': False,
                'plaintextSaved': False, 'loginVerified': False,
            }, indent=2) + '\n')
            self.done = True
            return 200, 'そうた専用の鍵を準備しました。続いて修正版を公開します。ログイン確認はまだです。「設定完了」とCodexへ伝えてください。'
        except Exception:
            return 503, '設定を確認できません。番号は書かず、表示された状態だけCodexへ伝えてください。再送はしないでください。'
        finally:
            pin = confirm = pepper = verifier = payload = None
            if isinstance(body, dict):
                for field in ['pin', 'confirm']:
                    if field in body:
                        body[field] = ''
            if acquired:
                self.lock.release()


def page(token):
    return '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>そうたのログイン復旧</title>
<style>body{font:17px system-ui,sans-serif;background:#f1f6f3;color:#18382a;margin:0;padding:24px}main{max-width:520px;margin:5vh auto;background:white;padding:28px;border-radius:20px}h1{font-size:25px}p{line-height:1.7}label{display:block;margin:20px 0 8px}input,button{box-sizing:border-box;width:100%;font:inherit;border-radius:10px;padding:14px}input{border:1px solid #92ac9d}button{background:#247347;color:white;border:0;margin-top:20px}button:disabled{opacity:.5}#status{white-space:pre-wrap}</style>
<main><h1>そうたのログイン復旧</h1><p>入力するのは、そうたがアプリで使う<strong>4桁の番号だけ</strong>です。管理用の秘密鍵は自動で作ります。</p><p>このMacだけの入力画面です。番号はファイルやチャットに保存せず、なお・りらんの鍵は変更しません。</p>
<form id="form"><label for="pin">そうたの4桁番号</label><input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required><label for="confirm">同じ4桁番号をもう一度</label><input id="confirm" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required><button id="send">そうたの設定を更新する</button></form><p id="status" role="status" aria-live="polite">まだ送信していません。</p></main>
<script nonce="TOKEN">const form=document.getElementById('form'),pin=document.getElementById('pin'),confirm=document.getElementById('confirm'),send=document.getElementById('send'),status=document.getElementById('status');form.addEventListener('submit',async e=>{e.preventDefault();if(send.disabled)return;send.disabled=true;let a=pin.value,b=confirm.value;pin.value=confirm.value='';status.textContent='設定中です。再送せず待ってください。';try{const r=await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:'TOKEN',pin:a,confirm:b})});a=b='';const d=await r.json();status.textContent=d.message;if(r.ok){pin.disabled=confirm.disabled=true;send.textContent='設定更新済み（ログイン確認待ち）';}else if(r.status===400)send.disabled=false;}catch(_){status.textContent='通信が切れました。再送せずCodexへ伝えてください。';}finally{a=b='';}});</script></html>'''.replace('TOKEN', html.escape(token, quote=True))


def serve(registration, port=0):
    # Reuse the already tested loopback-only transport, strict Host/Origin/CSRF,
    # bounded bodies, no-store/CSP and request-log suppression without editing it.
    spec = importlib.util.spec_from_file_location('souta_loopback_transport', ROOT / 'preview/register-openai-local.py')
    transport = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(transport)
    transport.page = page
    return transport.serve(registration, port=port)


def main():
    if len(sys.argv) != 1:
        raise SystemExit('番号を引数へ書かないでください。画面から本人が入力します。')
    registration = Registration()
    try:
        registration.guard()
    except Exception:
        raise SystemExit('修正版の公開状態を確認できません。入力画面は開いていません。') from None
    server = serve(registration)
    print('そうた専用の入力画面: http://127.0.0.1:' + str(server.server_port) + '/', flush=True)
    server.timeout = 1
    until = time.monotonic() + 1200
    try:
        while time.monotonic() < until and not registration.done:
            server.handle_request()
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
