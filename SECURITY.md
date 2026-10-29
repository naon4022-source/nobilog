# のびログ 認証・公開セキュリティ契約

## そうたの認証復旧に限る例外（2026-10-23・ユーザー承認済み）

- そうた（u4）のPIN検証だけに、暗号学的乱数32バイトから生成した専用鍵 `PIN_PEPPER_SOUTA` を使用してよい。鍵と `LEGACY_SOUTA_PIN_HASH` は `nobilog-board` のWorker Secretsへ同時設定し、原文・鍵・検証値をコード、ファイル、Git、ログ、チャットへ保存・出力しない。
- 共通の `PIN_PEPPER`、なお・りらんの検証値、既存のGoogle/LINE連携、学習記録は変更・読み出ししない。既存の共通鍵を知らなくても、そうただけ復旧できるようにする。
- 専用鍵が設定されている場合、そうたはその鍵によるHMAC-SHA-256検証値を定数時間比較する。共通鍵での照合へフォールバックしない。設定不備や他アカウントとの番号重複は拒否する。専用鍵が未設定の旧構成では従来の照合を維持する。
- 本人確認、試行回数制限、一回限りの券、セッション、権限分離は維持する。その他の禁止事項と作業前後の検証・公開手順は引き続き適用する。実際のそうたログイン成功を確認するまで完了としない。

このファイルは Codex、Claude Code、人の作業者に共通で適用する。ツール固有の隔離機能に頼らず、Cloudflare とコード側の検査を正本とする。

## 絶対禁止

- 実PIN、PIN検証値、pepper、OAuth client secret、Turnstile secret、セッションをコード、Git、`.claude/`、テスト、チャット、URL、ログ、スクリーンショットに出さない。
- 本番で Turnstile を回避する分岐、共有パスワード、管理者バックドア、query string セッションを作らない。
- 認証または権限分離のテストが1件でも落ちた状態で公開しない。

## 金庫の隔離

- 秘密値は `nobilog-board` Worker 専用の Cloudflare Worker Secrets にだけ保存する。必要名は `PIN_PEPPER`、`LEGACY_NAO_PIN_HASH`、`LEGACY_RIRAN_PIN_HASH`、`TURNSTILE_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`LINE_CLIENT_ID`、`LINE_CLIENT_SECRET`。
- Turnstile 本番widgetは1個だけ。許可hostnameは `nobilog.pages.dev` だけ、actionは `legacy_login` だけ、検証先は `nobilog-board` だけとする。
- ローカル検証は Cloudflare 公式テストキーを使い、本番widgetに `localhost` や `127.0.0.1` を追加しない。
- Worker は Turnstile の `success`、`hostname`、`action`、`challenge_ts`、1回限りトークンをすべて検査する。どれか1つでも不一致なら403で閉じる。
- PIN原文は保存せず、`PIN_PEPPER` による HMAC-SHA-256 検証値だけを定数時間比較する。

## 変更と公開

1. 変更前と変更後に `bash .claude/verify/run.sh` を実行する。
2. `git diff --check` と追加行の目視確認を行う。
3. 秘密値・旧PIN・セッション形式の残存スキャンを行う。
4. `wrangler deploy --dry-run` を行う。
5. Worker Secrets の「名前がそろっていること」だけを確認し、値は読み戻さない。Worker公開は必ず `cd cf-worker && ./deploy-secure.sh` を使い、8個の必須名が欠けていたら停止させる。
6. Worker を先に公開し、その後 Pages を公開する。どちらかだけの片方公開はしない。
7. 本番の主要入口と認証拒否を実測する。実データを書き換えるブラウザ操作はしない。

## バージョン

- ベータ表記は使わず、公開版は正式な3桁の番号にする。
- バグ修正を公開するときは patch を上げる（例: `2.0.0` → `2.0.1`）。
- 互換性のある機能追加は minor、互換性を壊す変更は major を上げる。
- `index.html` の `application-version`、Service Worker の cache 名、検証の期待値を必ず一致させる。

## 漏えいを見つけたら

その値は「漏れたかもしれない」ではなく「漏れた」と扱う。公開を止め、対応する提供元で旧値を無効化し、新値を Worker Secrets に入れ、残存スキャンと全検証をやり直す。

## 専用アカウントのオンライン確認版（2026-09-30の追加依頼）

- ユーザーが指定した確認版専用パスワードは、`nobilog-preview` の `PREVIEW_PIN_PEPPER` と `PREVIEW_PIN_HASH` によるHMAC検証だけに使用し、原文は保存しない。秘密値をコード・Git・ログへ書かない。
- 確認版には本番のD1/KV/認証/保存先/Secretsを接続しない。確認版の固定成績・資格・個別プレゼント・返済指示をビルド時に取り除く。確認版の記録は本番のなお・りらんの記録へ自動移行しない。
- 確認版の認証は専用ドメインだけに限定。HttpOnly/SecureのCookie、同一オリジン検査、試行回数制限、同時使用制限を使う。本番のTurnstile/PIN/OAuthを回避・変更する経路は作らない。
- 確認版の公開はこの専用構成の検証と `preview/deploy.sh` で行う。本番への確認版入口の追加は入口だけの別変更とし、未完成の本体コードを一緒に出さない。大型更新の本番反映は引き続きユーザーの公開指示を待つ。
- 問題PDF共有は任意PDF/HTMLを受け付けず、上限付き白黒画素を検証し固定構造のPDFをサーバー生成する。公開IDは192bit乱数、7日期限と本人による停止をD1で判定し、KVが古くても失効したリンクを開かない。確認版の公開PDFは専用保存先のみを使い、回答・採点を画像へ含めない。

### 確認版の統合入口（2026年9月30日追加指定）
- 本編の「パスワードでログイン」で通常認証が401の場合に限り、確認版専用サーバーの `/preview-password` へ入力を送る。正しい確認版パスワードだけに60秒・一回限りの引継ぎ券を発行する。パスワードやセッションはURL・コード・端末保存へ置かない。
- 例外的に本編の正確なOrigin `https://nobilog.pages.dev` のみ `/preview-password` と `/preview-enter` を使用可能とする。その他の確認版APIは同一オリジンのまま。本編のTurnstile・家族認証・保存先は変更しない。券はフォームPOST本文で送り、原子的一回消費後に確認版だけのHttpOnly Cookieを発行する。
