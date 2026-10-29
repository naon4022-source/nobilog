# 教科書画像AIの手元本体反映

本体への反映は済んでいます。公開、コミット、実AIの有効化はしていません。
最終全体検証は `full5-result.json` の終了状態を確認してください。ログの途中経過だけで合格としません。

## 根拠

- `prepared.json`：既存8ファイルの限定差分、新規27ファイルとSHA。最初の6ファイル版は `before-runner-compat/` に保全。
- `integration.json`：反映を許す差分と、変更前全体検証・本体操作検証を結ぶ契約。
- `approved-panel-result.json`：反映済み本体の6冊・3画面幅、103項目の固定根拠。
- `source-current-result.json`：ソース一致、無関係変更の拒否、旧検証との接続44項目。
- `visual-review.json`：18画面。既存と同一11画面の目視を再利用し、差分7画面を直接確認。
- `dry-run-result.json`：Workerのローカルdry-run。公開成功の根拠ではありません。
- `runner-registration-compat.json`：既存検証2本のrunner読取だけを承認差分経由へ変更。元のassertは保持。

`prepare-main.mjs` は初回の出力作成用です。反映済み本体で再実行しないでください。

## 再確認

登録済み全体検証は、リポジトリルートで単独の `bash .claude/verify/run.sh` を使います。
個別の再確認が必要な場合は、全体検証が動いていないことを確認してから
`node tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs` または
`node tools/candidates/textbook-vision-20261027/main/verify-main-book.mjs` を実行します。
本体操作検証の再実行結果は `current-panel-result.json` に出力し、固定済みの `approved-panel-result.json` を上書きしません。

旧検証のソース照合は、現在の8ファイルが承認した差分と完全一致するときだけ変更前のバイト列を参照します。
元の検証ファイルや履歴のSHAは書き換えません。画像等の大きな公開素材のSHAは主検証で照合し、旧検証からの重複照合のみ省きます。

## 未完了・制限

実モデルの回答内容・応答時間、物理端末での確認、全504画像の内容目視はこの証拠の対象外です。
サイズ上限を超える写真は明示的に拒否します。秘密値・認証ストア・実学習データを使った確認はしていません。
全体検証の成功後も、これをプロジェクト全体の完成とは扱いません。
