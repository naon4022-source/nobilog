"""Local macOS dialog; never sends a key in arguments, files or logs."""
import importlib.util
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent

def dialog(message):
    script = '''on run argv
activate
display dialog (item 1 of argv) with title "のびログ・Gemini登録" buttons {"OK"} default button "OK"
end run'''
    subprocess.run(['/usr/bin/osascript', '-e', script, message], capture_output=True, text=True)

def ask_key(_prompt):
    script = '''activate
display dialog "Google AI StudioでNobilogのAPIキーをコピーし、ここに貼り付けてください。入力は●で隠れます。確認版だけに登録します。" with title "のびログ・Gemini登録" default answer "" with hidden answer buttons {"キャンセル", "登録"} default button "登録" cancel button "キャンセル"
text returned of result'''
    result = subprocess.run(['/usr/bin/osascript', '-e', script], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit('キャンセルしました。登録していません。')
    key = result.stdout.strip()
    result.stdout = ''
    return key

def main():
    os.environ['PATH'] = os.environ.get('PATH', '') + ':/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'
    spec = importlib.util.spec_from_file_location('gemini_registration', ROOT / 'set-gemini-key.py')
    registration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(registration)
    try:
        registration.main(key_prompt=ask_key)
    except SystemExit as error:
        dialog(str(error))
    except Exception:
        dialog('登録を確認できませんでした。Cloudflareへの接続とNode.jsのインストールを確認してください。キーは表示していません。')
    else:
        dialog('確認版サーバーに登録しました。Geminiとの接続実装・検証は次に行います。')

if __name__ == '__main__':
    main()
