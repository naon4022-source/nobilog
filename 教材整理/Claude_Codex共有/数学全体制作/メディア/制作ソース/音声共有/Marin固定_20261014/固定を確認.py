"""外部通信なし。採用音声と設定を変えていないことだけ確認する。"""
from pathlib import Path
import hashlib
import json

folder = Path(__file__).resolve().parent
expected = json.loads((folder / '固定ファイル照合.json').read_text())['files']
names = {'固定設定.json', '採用見本.mp3', '差し替え分担台帳.json'}
if set(expected) != names:
    raise SystemExit('固定の照合台帳が不正です。生成を開始しないでください。')
for name in sorted(names):
    if hashlib.sha256((folder / name).read_bytes()).hexdigest() != expected[name]:
        raise SystemExit('固定ファイルが変更されています：' + name + '。生成を停止してください。')
print('採用見本・話し方の全文設定・分担台帳：3ファイルの一致を確認。音声生成・通信なし。')
