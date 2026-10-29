#!/usr/bin/env bash
# 2026-10-22 サーバー強化（のびログ・ガード）と画面の守り（2.17.1）を本番へ出す。Worker→画面の順。値の秘密は読まない（名前だけ確かめる）。
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)";BASE="$H/../google-entry-20261021/candidate/cf-worker";NEW="$H/candidate/cf-worker"
W(){ NPM_CONFIG_OFFLINE=true npx --yes wrangler@4 "$@"; }
cd "$H"
node verify-security.mjs
for t in verify-service.mjs verify-account.mjs verify-races.mjs verify-entry.mjs verify-google-regression.mjs verify-cancel.mjs verify-settings.mjs verify-settings-flow.mjs verify-browser.mjs verify-pages-security.mjs; do node "$t"; done
# 公開中の画面が 2.17.0（土台）と同じときだけ進む
python3 - "$H/../google-entry-20261021/candidate/pages/index.html" <<'PYX'
import sys,urllib.request,hashlib
want=hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest()
r=urllib.request.urlopen(urllib.request.Request('https://nobilog.pages.dev/',headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
if hashlib.sha256(r).hexdigest()!=want:raise SystemExit('公開中の画面が土台と違うため止めます。')
print('公開中の画面は土台（2.17.0）と一致')
PYX
# 公開中のWorkerが、2.17.0で出したもの（土台）と同じときだけ進む
TMP="$(mktemp -d)";(cd "$TMP" && W init --from-dash nobilog-board --no-delegate-c3 >/dev/null 2>&1) || { echo '公開中のWorkerを取得できないため止めます。'; exit 1; }
python3 - "$TMP/nobilog-board/src/index.js.map" "$BASE" <<'PYX' || { echo '公開中のWorkerが土台と違うため止めます（上書きしません）。'; rm -rf "$TMP"; exit 1; }
import json,sys,os
m=json.load(open(sys.argv[1]))   # 公開中のWorkerは1つにまとめた形なので、中の元ファイル（ソースマップ）を土台と比べる
assert sorted(m['sources'])==['src/google-account.mjs','src/index.js']
for src,content in zip(m['sources'],m['sourcesContent']):assert content==open(os.path.join(sys.argv[2],src),encoding='utf-8').read(),src
PYX
rm -rf "$TMP";echo '公開中のWorkerは土台（2.17.0）と一致'
cd "$NEW"
W deploy --dry-run >/dev/null
NAMES="$(W secret list)"
for n in PIN_PEPPER LEGACY_NAO_PIN_HASH LEGACY_RIRAN_PIN_HASH LEGACY_SOUTA_PIN_HASH TURNSTILE_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET LINE_CLIENT_ID LINE_CLIENT_SECRET; do
 grep -q "\"name\": \"$n\"" <<<"$NAMES" || { echo "必須secretがありません：$n。公開しません。"; exit 1; }
done
unset NAMES
W deploy
# 公開後の確認（記録を書き換えない呼び出しだけ）。だめなら土台へ戻す
if ! python3 "$H/verify-live.py" worker; then
 echo 'Workerの公開後の確認に失敗。土台（2.17.0のWorker）へ戻します。' >&2
 (cd "$BASE" && W deploy)
 exit 1
fi
W pages deploy "$H/candidate/pages" --project-name nobilog --branch main --commit-dirty=true
if ! python3 "$H/verify-live.py" pages; then
 echo '画面の公開後の確認に失敗。画面とWorkerを土台（2.17.0）へ戻します。' >&2
 W pages deploy "$H/../google-entry-20261021/candidate/pages" --project-name nobilog --branch main --commit-dirty=true
 (cd "$BASE" && W deploy)
 exit 1
fi
echo 'サーバー強化を公開しました。'
