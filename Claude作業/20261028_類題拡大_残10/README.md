# 類題の拡大：残り10単元（Claude 2026-10-28・本体未反映の候補）

## 結果
- 10単元 × 1パターン × 3問 ＝ **10パターン・30問・参照43件**を追加した候補をつくった。
- 土台は前回候補（`../20261028_類題拡大/候補/ai-review-practice-data.mjs`。SHA は `土台_前回候補データ.mjs` と同じ `1b32c372…`）。22パターン66問・87参照、legacyQuestions 30・legacyPatterns 10 はそのまま。
- 候補データの合計：32パターン・96問・130参照・legacy 30/10（`候補/ai-review-practice-data.mjs`）。
- 本体・確認済みバンク・前回フォルダ・共有HANDOFF・共通検証コードは変更していない。全体検証は起動していない。

| 単元 | パターン | 元のテスト問題 |
|---|---|---|
| drill-math-1-signed | math-negative-compare（負の数の大小） | test-5, 7, 14 |
| workbook-math-1-signed | math-abs-integer-range（絶対値の範囲の整数） | test-7, 12 |
| workbook-math-1-addition | math-add-different-signs（異符号の加法） | test-1, 5, 6, 12, 13 |
| workbook-math-1-subtraction | math-subtract-signs（負の数をふくむ減法） | test-1, 6, 7, 10 |
| drill-english-2-modal-infinitive | english-modal-rewrite（had to / be able to / has to） | test-2, 3, 9, 10, 15 |
| drill-english-2-sentence-gerund | english-gerund-infinitive（enjoy -ing / want to） | test-1, 7, 11, 15 |
| drill-english-2-passive-exclaim | english-passive-form（be＋過去分詞） | test-1, 3, 5, 11, 14, 15 |
| drill-english-3-perfect-sentence | english-present-perfect（for/since・疑問・否定） | test-4, 5, 6, 9, 13 |
| drill-english-3-participle-relative | english-participle-modifier（-ing と過去分詞の後置） | test-3, 4, 10, 12, 14 |
| drill-english-3-infinitive-subjunctive | english-it-for-of（It is ~ for/of ~ to） | test-1, 5, 12, 15 |

- 減法のパターンは、既存の `math-negative-subtraction` とは元問題・類題IDとも別（重なりは検査で0）。
- 下書きでは正解をアに書き、作成時に通し番号で ア→イ→ウ の順へ置き直した（各10問）。

## 前回の「21問」と「29件」の数え直し（`前回の数え直し.json`）
前回READMEの「元の21問」は**誤り**。参照レコード29件・元IDの一意数29・パターンごと [7,3,4,3,4,8]・到達を検査した元問題29・3問出たもの29。差に理由はなく、件数の書きまちがい。前回フォルダは変更せず、ここに訂正を残す。

## 検査（すべて候補フォルダの写しのライブラリ・採点エンジンで実行。通信なし）
- `node build.mjs` → exit 0（build.log）。元問題がテストにない・ID重複・下書きの正解位置ちがいは停止。
- `node verify.mjs` → **1,332件・不一致0**、exit 0（verify.log / verify-result.json）
  - サーバーの `cf-worker/src/material-bank.mjs` で単元が ready・同じ問題がテストにある（テスト導線で実際に出る）
  - 43元問題すべてで類題がちょうど3問、別パターンの類題は出ない
  - 元問題の本文・答え・ID をそれぞれ1文字変えると出ない（SHA の照合）
  - 公開用データ・選択肢一覧に答え/解説が入らない
  - 正解の1字だけ ○、ほかの2字・空・空白・「アイウ」・「a」・「1」・正解の2回打ち・「エ」は ○ にならない（空は採点前に拒否）
  - 数の検算（numericCheck）12問、別の元問題では開けない/採点できない、元問題の答えが類題の文に出ない
  - 正解だけが目立って長い選択肢なし、正解の位置 ア10・イ10・ウ10
- `node regress.mjs` → 既存87元問題で**1,005件・変化0**、exit 0（regress.log / regress-result.json）。前回候補と今回候補で、出方（通常・legacy）・公開データ・採点が1文字も同じ。既存部分のデータ・legacy・version も同じ。

## 途中でなおしたこと
- 最初は正解位置をハッシュで決めたら ア18・イ9・ウ3 に偏った → 通し番号で均等に。
- 正解だけが長い選択肢が7問あった → 説明を短く/他を長くしてそろえた。
- 「since」は元問題 test-5 の答えだが、元問題の文に「for か since」とあるので漏れではないと判断（検査は「元問題の文にない答え」だけを見る形にした）。
- 空の答えは採点ライブラリが例外で拒否する（正しい動き）。検査ではそれを「不正解」として数えた。

## 本体へ入れるとき（Codex）
`候補/ai-review-practice-data.mjs` を `cf-worker/src/ai-review-practice-data.mjs` と差しかえる。差分は `最小差分_前回候補から.diff`（追加だけ・削除0行）。前回候補が先に入っていない場合は、前回分と今回分の両方が入る。入れたあとは本体の全体検証で確認すること。

## 未完
- 本体への反映・全体検証（Codex担当）。
- 英語の類題は書きかえ問題を選択式で確かめる形。自由記述の書きかえ練習ではない。
