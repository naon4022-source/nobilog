#!/bin/bash
# のびログを Cloudflare Pages（https://nobilog.pages.dev）へ公開する。
# index.html を編集したあと、これを実行すると本番が自動で最新版に書きかわる。
#   使い方:  bash deploy.sh
set -e
cd "$(dirname "$0")"
mkdir -p site
cp index.html site/index.html          # ひみつを含めないよう index.html だけを公開フォルダへ
npx --yes wrangler@latest pages deploy site --project-name nobilog --branch main --commit-dirty=true
echo "✅ https://nobilog.pages.dev が最新版になりました"
