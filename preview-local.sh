#!/bin/bash
# 本編と接続しないローカル確認版。認証済みの実データは使わない。
set -euo pipefail
cd "$(dirname "$0")"
preview_dir="/tmp/nobilog-local-preview-current"
mkdir -p "$preview_dir"
cp index.html terms.html privacy.html "$preview_dir/"
cp site-assets/* "$preview_dir/"
python3 - "$preview_dir/index.html" <<'PY'
from pathlib import Path
import sys

page = Path(sys.argv[1])
text = page.read_text(encoding='utf-8')
live = "const SYNC_URL = 'https://nobilog-board.naon4022.workers.dev';"
if text.count(live) != 1:
    raise SystemExit('同期先の置換位置を確認できません。プレビューは起動しません。')
text = text.replace(live, "const SYNC_URL = ''; // ローカル確認版は本番サーバーと接続しない", 1)
text = text.replace('pwaRegisterSW();    //', '/* ローカル確認版ではService Workerを登録しない */    //', 1)
page.write_text(text, encoding='utf-8')
PY
printf 'ローカル確認版（体験表示）: http://127.0.0.1:8796/?demo=1\n'
printf '保存場所: %s\n' "$preview_dir"
if curl --silent --fail --max-time 2 http://127.0.0.1:8796/ >/dev/null; then
  printf '表示中のローカル確認版を更新しました。\n'
  exit 0
fi
exec python3 -m http.server 8796 --bind 127.0.0.1 --directory "$preview_dir"
