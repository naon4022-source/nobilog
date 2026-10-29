"""Loopback-only OpenAI key registration. No key files, logs or API calls."""
import html
import json
import re
import secrets
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CMD = ['npx', '--yes', 'wrangler@4.45.0', 'secret']


class RegistrationError(Exception):
    pass


class Registration:
    def __init__(self, root=ROOT, run=subprocess.run):
        self.root, self.run = root, run
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.done = False

    def guard(self):
        try:
            c = json.loads((self.root / 'wrangler.jsonc').read_text())
            if c.get('name') != 'nobilog-preview' or c.get('vars', {}).get('APP_ORIGIN') != 'https://nobilog-preview.naon4022.workers.dev':
                raise ValueError()
            if c.get('vars', {}).get('GEMINI_ENABLED') != '0' or c.get('vars', {}).get('OPENAI_ENABLED', '0') != '0':
                raise ValueError()
        except Exception:
            raise RegistrationError('確認版の停止設定を確認できません。入力前に停止しました。') from None
        try:
            r = self.run(CMD + ['list', '--config', 'wrangler.jsonc'], cwd=self.root, capture_output=True, text=True, timeout=60)
            rows = json.loads(r.stdout) if r.returncode == 0 else None
            if not isinstance(rows, list) or any(not isinstance(x, dict) or not isinstance(x.get('name'), str) for x in rows):
                raise ValueError()
            if any(x['name'] == 'OPENAI_API_KEY' for x in rows):
                raise RegistrationError('OpenAIのキーは登録済みです。値を読み戻さず、上書きせずに終了します。')
        except RegistrationError:
            raise
        except Exception:
            raise RegistrationError('Cloudflareへの接続を確認できません。キーの入力前に停止しました。') from None

    def register(self, body):
        if not isinstance(body, dict) or set(body) != {'csrf', 'key'} or not isinstance(body['csrf'], str) or not secrets.compare_digest(body['csrf'], self.token):
            return 403, '登録画面を開き直してください。'
        key = body['key']
        if not isinstance(key, str) or not re.fullmatch(r'sk-[A-Za-z0-9_-]{17,509}', key):
            return 400, 'APIキーのCopyボタンからコピーして貼り付けてください。空白・改行は入れないでください。'
        if not self.lock.acquire(blocking=False):
            return 409, '登録中です。もう一度送らず、そのまま待ってください。'
        try:
            if self.done:
                return 409, '登録済みです。キーを読み戻したり、上書きしたりしません。'
            self.guard()
            result = self.run(CMD + ['put', 'OPENAI_API_KEY', '--config', 'wrangler.jsonc'], cwd=self.root, input=key+'\n', capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                return 503, '登録を確認できませんでした。接続を確認してください。詳細出力やキーは表示しません。'
            self.done = True
            return 200, '確認版サーバーにキーを登録しました。まだAI接続・有料通信はしていません。10月15日の支払い確認まで停止したままです。'
        except RegistrationError as error:
            return 503, str(error)
        except Exception:
            return 503, '登録結果を確認できませんでした。もう一度送る前に確認します。キーや詳細出力は表示しません。'
        finally:
            key = None
            body['key'] = ''
            self.lock.release()


def page(token):
    return '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>のびログ・OpenAI登録</title>
<style>body{font-family:system-ui,sans-serif;background:#f1f6f3;color:#18382a;margin:0;padding:28px}main{max-width:580px;margin:8vh auto;background:white;padding:28px;border-radius:24px;box-shadow:0 8px 30px #1232}h1{font-size:25px}p{line-height:1.8}label{display:block;margin:20px 0 8px}input,button{box-sizing:border-box;width:100%;font:inherit;border-radius:12px;padding:14px}input{border:1px solid #92ac9d}button{background:#247347;color:white;border:0;margin-top:18px;cursor:pointer}button:disabled{opacity:.5}#status{white-space:pre-wrap}</style>
<main><h1>OpenAIのキーを登録</h1><p>このMacだけの登録画面です。確認版専用のCloudflare Secretsへ保存します。キーはチャット・コード・ログへ残しません。</p><p><strong>登録だけではAIは動きません。</strong>支払いと接続の確認が終わるまで、有料通信は停止したままです。</p>
<form id="form"><label for="key">APIキーをここに貼り付け</label><input id="key" type="password" autocomplete="off" spellcheck="false" autocapitalize="none" maxlength="512" placeholder="Copyでコピーしたキーを貼り付け" required><button id="send">確認版に登録する</button></form><p id="status" role="status" aria-live="polite"></p></main>
<script nonce="TOKEN">const form=document.getElementById('form'),key=document.getElementById('key'),send=document.getElementById('send'),status=document.getElementById('status');form.addEventListener('submit',async e=>{e.preventDefault();if(send.disabled)return;send.disabled=true;let value=key.value;key.value='';status.textContent='登録中です。画面を閉じずに待ってください。';try{const r=await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:'TOKEN',key:value})});value='';const d=await r.json();status.textContent=d.message;if(r.ok){key.disabled=true;send.textContent='登録済み';}else send.disabled=false;}catch(_){value='';status.textContent='接続が切れました。登録結果を確認するまで再送しないでください。';}finally{value='';}});</script></html>'''.replace('TOKEN', html.escape(token, quote=True))


def serve(registration, port=0):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Never log requests, headers, bodies, or query strings.

        def response(self, status, body, mime='application/json; charset=utf-8'):
            data = body.encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'nonce-"+registration.token+"'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(data)

        def host_ok(self):
            return self.headers.get('Host') == '127.0.0.1:'+str(self.server.server_port)

        def do_GET(self):
            if not self.host_ok() or self.path != '/':
                self.response(403, '{"message":"このMacの登録画面だけを使ってください。"}')
                return
            self.response(200, page(registration.token), 'text/html; charset=utf-8')

        def do_POST(self):
            origin = 'http://127.0.0.1:'+str(self.server.server_port)
            if not self.host_ok() or self.path != '/register' or self.headers.get('Origin') != origin:
                self.response(403, '{"message":"登録画面から送信してください。"}')
                return
            if self.headers.get('Content-Type') != 'application/json' or self.headers.get('Transfer-Encoding'):
                self.response(415, '{"message":"入力形式を確認してください。"}')
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length < 1 or length > 2048:
                    raise ValueError()
                self.connection.settimeout(5)
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ValueError()
                body = json.loads(raw.decode('utf-8'))
                status, message = registration.register(body)
                raw = body = None
            except Exception:
                status, message = 400, '入力を確認してください。キーは表示していません。'
            self.response(status, json.dumps({'message': message}, ensure_ascii=False))

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = False  # server_close waits for the final reply to finish.
    return server


def main():
    if len(sys.argv) != 1:
        raise SystemExit('キーを引数に書かないでください。登録画面から入力します。')
    registration = Registration()
    try:
        registration.guard()
    except RegistrationError as error:
        raise SystemExit(str(error)) from None
    server = serve(registration, port=8769)
    print('OpenAI登録画面: http://127.0.0.1:'+str(server.server_port)+'/', flush=True)
    server.timeout = 1
    until = time.monotonic()+1200
    try:
        while time.monotonic() < until and not registration.done:
            server.handle_request()
        if registration.done:
            print('OpenAIキー登録完了。実AI通信は停止のままです。', flush=True)
            # Leave the successful response visible; server is no longer needed.
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
