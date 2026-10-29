"""User-run, non-echoing Gemini key registration for the isolated preview only."""
import getpass
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def main(key_prompt=None):
    if len(sys.argv) != 1 or (key_prompt is None and not sys.stdin.isatty()):
        raise SystemExit('Cursorのターミナルで引数なしで実行してください。キーをコマンドやファイルへ書かないでください。')
    config = json.loads((ROOT / 'wrangler.jsonc').read_text())
    if config.get('name') != 'nobilog-preview' or config.get('vars', {}).get('APP_ORIGIN') != 'https://nobilog-preview.naon4022.workers.dev':
        raise SystemExit('確認版の構成を確認できません。何も変更していません。')
    listed = subprocess.run(['npx', '--yes', 'wrangler@4.45.0', 'secret', 'list', '--config', 'wrangler.jsonc'], cwd=ROOT, capture_output=True, text=True, timeout=60)
    try:
        names = json.loads(listed.stdout) if listed.returncode == 0 else None
        if not isinstance(names, list) or any(not isinstance(row, dict) or not isinstance(row.get('name'), str) for row in names):
            raise ValueError('invalid names')
    except (ValueError, TypeError):
        raise SystemExit('Cloudflareへの接続を確認できません。キーの入力前に停止しました。')
    if any(row['name'] == 'GEMINI_API_KEY' for row in names):
        raise SystemExit('Geminiの秘密設定は登録済みです。値を読み戻さず、上書きせずに終了しました。')
    key = (key_prompt or getpass.getpass)('Google AI StudioのAPIキー（貼り付けても画面には表示しません）: ')
    problem = None
    if not key:
        problem = '入力が空です。APIキー画面のコピーボタンを押し、この入力欄へ⌘Vで貼り付けてください。'
    elif len(key) < 20:
        problem = '入力が短すぎます。キーの名前やプロジェクト名ではなく、APIキーのコピーボタンを使ってください。'
    elif len(key) > 512:
        problem = '入力が長すぎます。ページ全体ではなく、APIキーだけをコピーしてください。'
    # 2026年以降のAI Studioのキーは「AQ.」で始まり「.」を含む。
    elif not key.isascii() or any(not (c.isalnum() or c in '_-.') for c in key):
        problem = '空白・改行・日本語・対象外の記号が含まれています。APIキー画面のコピーボタンからコピーし直してください。'
    if problem:
        key = None
        raise SystemExit('キー形式の確認で停止しました。登録していません。\n' + problem)
    try:
        result = subprocess.run(['npx', '--yes', 'wrangler@4.45.0', 'secret', 'put', 'GEMINI_API_KEY', '--config', 'wrangler.jsonc'], cwd=ROOT, input=key + '\n', capture_output=True, text=True, timeout=60)
    finally:
        key = None
    if result.returncode:
        raise SystemExit('登録を確認できませんでした。Cloudflareの接続を確認してください。出力やキーは表示していません。')
    print('確認版にGeminiの秘密設定を登録しました。キーをファイルやログには保存していません。Geminiとの接続検証は別途行います。')

if __name__ == '__main__':
    main()
