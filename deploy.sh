#!/bin/bash
# のびログを Cloudflare Pages（https://nobilog.pages.dev）へ公開する。
# index.html を編集したあと、これを実行すると本番が自動で最新版に書きかわる。
#   使い方:  bash deploy.sh
set -e
cd "$(dirname "$0")"
if [ "${1:-}" = "--preview-password-entry-only" ]; then
  bash .claude/verify/run.sh
  git diff --check
  python3 preview/prepare-password-entry.py
  npx --yes wrangler@latest pages deploy preview/build/password-entry --project-name nobilog --branch main --commit-dirty=true
  echo "✅ 本番にはパスワードログインから確認版へ入る入口変更だけを反映しました"
  exit 0
fi
if [ "${1:-}" = "--preview-entry-only" ]; then
  bash .claude/verify/run.sh
  git diff --check
  python3 preview/prepare-entry.py
  rm -f preview/build/main-entry/baseline.sha256
  npx --yes wrangler@latest pages deploy preview/build/main-entry --project-name nobilog --branch main --commit-dirty=true
  echo "✅ 本番には確認版への入口と更新通知だけを反映しました"
  exit 0
fi
if [ "$#" -gt 0 ]; then
  echo "未対応の公開モードです。配信しません。" >&2
  exit 2
fi
mkdir -p site
for entry in site/*; do                # 静的ファイルだけを置きかえ、同梱ライブラリのフォルダを維持
  if [ -f "$entry" ]; then rm -f "$entry"; fi
done
cp index.html site/index.html          # ひみつを含めないよう index.html だけを公開フォルダへ
cp terms.html privacy.html site/       # 利用規約・プライバシーポリシー
cp -R site-assets/* site/              # 📲 アプリ版の部品と版固定の描画ライブラリ
npx --yes wrangler@latest pages deploy site --project-name nobilog --branch main --commit-dirty=true
echo "✅ https://nobilog.pages.dev が最新版になりました"
