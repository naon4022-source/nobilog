#!/usr/bin/env python3
"""Human-only hidden entry; write one HMAC secret, never read secret values."""
from pathlib import Path
import base64
import getpass
import hashlib
import hmac
import json
import os
import re
import subprocess
import sys
import unicodedata
import warnings

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CONFIG = ROOT / 'tools/releases/security-hardening-20261022/candidate/cf-worker/wrangler.jsonc'
EXPECTED_VERSION = 'bea2213e-d54d-4a1a-80f8-d4c1ee304b7f'
REQUIRED = {'PIN_PEPPER', 'LEGACY_NAO_PIN_HASH', 'LEGACY_RIRAN_PIN_HASH',
            'LEGACY_SOUTA_PIN_HASH', 'TURNSTILE_SECRET', 'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET', 'LINE_CLIENT_ID', 'LINE_CLIENT_SECRET'}


def cli(args, payload=None):
    env = {**os.environ, 'NPM_CONFIG_OFFLINE': 'true',
           'WRANGLER_LOG': 'none' if payload is not None else 'log',
           'WRANGLER_LOG_PATH': '/dev/null',
           'WRANGLER_SEND_METRICS': 'false',
           'CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV': 'false', 'CI': 'true'}
    return subprocess.run(['npx', '--offline', '--yes', 'wrangler@4', *args,
                           '--config', str(CONFIG), '--name', 'nobilog-board'],
                          cwd='/private/tmp', input=payload, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)


def metadata(args):
    result = cli(args)
    if result.returncode:
        raise RuntimeError('設定情報を確認できません。秘密値を保護するため詳細出力は省略しました。')
    # Wrangler may print a version banner before its JSON. Parse only a list
    # of metadata objects; never echo unparsed CLI output.
    for index, char in enumerate(result.stdout):
        if char != '[':
            continue
        try:
            value, _ = json.JSONDecoder().raw_decode(result.stdout[index:])
        except ValueError:
            continue
        if isinstance(value, list) and all(isinstance(row, dict) for row in value):
            return value
    raise RuntimeError('設定情報の形式を確認できません。更新していません。')


def preflight():
    names = metadata(['secret', 'list'])
    if not isinstance(names, list) or not REQUIRED <= {x.get('name') for x in names}:
        raise RuntimeError('必要な設定名が足りません。更新していません。')
    deployments = metadata(['deployments', 'list', '--json'])
    latest = max(deployments, key=lambda x: x.get('created_on', ''))
    if latest.get('versions') != [{'version_id': EXPECTED_VERSION, 'percentage': 100}]:
        raise RuntimeError('公開版が確認時点から変わりました。上書きを防ぐため停止しました。')


def hidden_pin(prompt):
    return unicodedata.normalize('NFKC', getpass.getpass(prompt)).strip()


def main():
    if not sys.stdin.isatty():
        raise RuntimeError('手元の対話ターミナルで実行してください。チャットへ入力しないでください。')
    warnings.simplefilter('error', getpass.GetPassWarning)
    preflight()
    print('そうたの認証設定だけを更新します。秘密値は画面・ファイル・ログへ出しません。')
    pepper = getpass.getpass('既存のPIN_PEPPER（非表示）: ')
    if not pepper or pepper != getpass.getpass('PIN_PEPPERをもう一度（非表示）: '):
        raise RuntimeError('入力が一致しません。更新していません。')
    pin = hidden_pin('そうたに設定する4桁（非表示）: ')
    if not re.fullmatch(r'[0-9]{4}', pin) or pin != hidden_pin('4桁をもう一度（非表示）: '):
        raise RuntimeError('4桁が一致しません。更新していません。')
    # Recheck the deployed version after human input. Never deploy local V3 code.
    preflight()
    verifier = base64.urlsafe_b64encode(hmac.new(pepper.encode(), pin.encode(), hashlib.sha256).digest()).decode().rstrip('=')
    pepper = pin = None
    result = cli(['secret', 'put', 'LEGACY_SOUTA_PIN_HASH'], verifier + '\n')
    verifier = None
    if result.returncode:
        raise RuntimeError('設定コマンドが失敗しました。結果不明の可能性があるため再送せずCodexへ伝えてください。')
    (HERE / 'human-result.json').write_text(json.dumps({
        'status': 'secret update command succeeded; human login check pending',
        'exitCode': 0, 'secretName': 'LEGACY_SOUTA_PIN_HASH',
        'plaintextSaved': False, 'secretValuesRead': False,
        'v3CodePublished': False, 'loginVerified': False,
    }, indent=2) + '\n')
    print('設定コマンドが成功しました。本編でそうたのログインを確認してください。')
    print('チャットには番号やpepperを書かず、「設定完了」とだけ伝えてください。')


if __name__ == '__main__':
    try:
        main()
    except (EOFError, KeyboardInterrupt, getpass.GetPassWarning):
        raise SystemExit('非表示入力を中止しました。')
    except RuntimeError as error:
        raise SystemExit(str(error))
