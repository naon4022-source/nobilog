# 本人のパスワード変更（準備コード・使えない状態・未反映）

- ユーザー指示：「アドミンができてからその機能追加するからコードだけ作っといて」「設定の画面から変えられるように」。
- `password-change.mjs`：本人（u1・u2・u4）が、今のパスワードを確かめてから新しいパスワードに変える処理。
  - **使えない状態**：`PASSWORD_CHANGE_ENABLED="1"` と `PASSWORD_CHANGE_ADMIN_READY="1"` と `PIN_PEPPER` の3つがそろうまで、何も読まず書かずに 503。今の Worker にはこの2つのフラグはないので、組み込んでも動かない。
  - PIN原文は保存も返しもしない。`PIN_PEPPER` で署名した検証値（`uid:新しいPIN` を署名）だけを `pin-override:<uid>` に保存。
  - 今の Secrets の検証値（`LEGACY_*_PIN_HASH`）は**書きかえない**（Secrets契約はそのまま）。変更後は override を先に見る。
  - 5回まちがえると15分止める。版番号 rev と CAS で同時変更・古い画面を防ぐ。体験版 u3・新規 x_ アカウントは 403。
  - 新しいパスワード：4〜8けたの数字。同じ数字だけ（0000）や並んだ数字（1234・9876）は使えない。
- 取り込み（Codex・admin完成後）：
  1. `cf-worker/src/index.js` の認証つき経路に `POST /auth/password-change` を足し、本体の `keyedDigest`・`constantEqual`・セッションの本人UID・AUTH_DB（auth_kv）の get/put/CAS を渡す。
  2. `legacyStart` のパスワード照合で、`pin-override:<uid>` があればそれを先に見る（`verify` 関数をそのまま使える）。ないときは今までどおり Secrets の値。
  3. 設定画面に「パスワードを変える」欄を置き、503 のあいだは「管理画面ができてから使えます」と表示してボタンを押せなくする。
  4. Turnstile の確認を足すかどうかは admin 側の設計と合わせて決める（未決）。
- 確認：`node verify-password-change.mjs`（にせの値だけ・28件）。本体・実Secrets・実アカウントでは試していない。
