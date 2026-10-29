#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash .claude/verify/run.sh
git diff --check
python3 - <<'PY'
from pathlib import Path
import json, re
config=json.loads(Path('preview/wrangler.jsonc').read_text())
if config['name'] != 'nobilog-preview': raise SystemExit('確認版以外には配信しません。')
db=config['d1_databases'][0];kv=config['kv_namespaces'][0]
if db['database_name'] != 'nobilog-preview-store' or not re.fullmatch(r'[a-f0-9-]{36}',db['database_id']): raise SystemExit('確認版専用のD1を先に作成してください。')
if not re.fullmatch(r'[a-f0-9]{32}',kv['id']): raise SystemExit('確認版専用のKVを先に作成してください。')
prod=Path('cf-worker/wrangler.toml').read_text()
if db['database_id'] in prod or kv['id'] in prod: raise SystemExit('本番の保存先には接続しません。')
PY
cd preview
names="$(npx --yes wrangler@latest secret list --config wrangler.jsonc)"
for name in PREVIEW_PIN_PEPPER PREVIEW_PIN_HASH NOTICE_VAPID_JWK; do
  if ! grep -q "\"name\": \"$name\"" <<<"$names"; then
    echo "確認版の設定が不足しています: $name" >&2
    exit 1
  fi
done
unset names
npx --yes wrangler@latest deploy --dry-run --config wrangler.jsonc
npx --yes wrangler@latest deploy --config wrangler.jsonc
