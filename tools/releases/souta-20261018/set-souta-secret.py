#!/usr/bin/env python3
"""Human-only, hidden terminal entry. Never reads a secret back from Cloudflare."""
from pathlib import Path
import base64, getpass, hashlib, hmac, os, re, subprocess, sys, warnings

def main():
    if not sys.stdin.isatty():
        raise SystemExit('手元の対話ターミナルで実行してください。チャットに番号を送らないでください。')
    warnings.simplefilter('error', getpass.GetPassWarning)
    pepper = getpass.getpass('既存のPIN_PEPPER（非表示）: ')
    if not pepper or pepper != getpass.getpass('PIN_PEPPERをもう一度（非表示）: '):
        raise SystemExit('入力が一致しません。保存していません。')
    pin = getpass.getpass('そうたの以前の4桁（非表示）: ')
    if not re.fullmatch(r'[0-9]{4}', pin) or pin != getpass.getpass('4桁をもう一度（非表示）: '):
        raise SystemExit('4桁が一致しません。保存していません。')
    digest = base64.urlsafe_b64encode(hmac.new(pepper.encode(), pin.encode(), hashlib.sha256).digest()).decode().rstrip('=')
    pin = pepper = None
    config = Path(__file__).resolve().parent / 'candidate/cf-worker/wrangler.jsonc'
    environment = {**os.environ, 'WRANGLER_LOG':'none', 'WRANGLER_LOG_PATH':'/dev/null', 'WRANGLER_SEND_METRICS':'false'}
    result = subprocess.run(['npx','--yes','wrangler@latest','secret','put','LEGACY_SOUTA_PIN_HASH','--config',str(config)], input=digest+'\n', text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=environment)
    digest = None
    if result.returncode:
        raise SystemExit('設定に失敗しました。秘密を表示しないため詳細ログは出していません。番号・pepperはチャットに送らず、失敗したことだけ伝えてください。')
    print('そうた用のHMAC検証値だけをWorker secretへ設定しました。値は表示・ファイル保存していません。チャットには「設定完了」だけを伝えてください。')

if __name__ == '__main__':
    try:
        main()
    except (EOFError, KeyboardInterrupt, getpass.GetPassWarning):
        raise SystemExit('非表示入力を中止しました。')
