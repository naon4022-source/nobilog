# 類題（原因理解の練習）の拡大候補（Claude 2026-10-28）

Codex の「次に必要な作業」にある「類題の対象パターンの拡大」を、本体を変えずに候補として作った。作業はこのフォルダの中だけ。**本体には未反映。**

## 追加したもの（`追加分.json`）
テストつきの25単元のうち、類題がなかった16単元から6単元を選び、1単元1パターン・3問ずつ。
| パターン | 元のテスト問題 | 類題 |
|---|---|---|
| math-sector-ratio（おうぎ形の割合と公式） | drill-math-1-plane-test-7〜13（7問） | 3 |
| math-cone-lateral（円錐の側面積・展開図の中心角） | drill-math-1-space-test-3・4・15 | 3 |
| math-data-representatives（中央値・度数分布の最頻値） | drill-math-1-data-test-4・6・11・14 | 3 |
| science-microscope-magnification（顕微鏡の倍率と視野） | drill-science-1-living-test-2・3・15 | 3 |
| english-past-did-question（did の疑問文・否定文・答え方） | drill-english-2-question-past-test-1・2・4・9 | 3 |
| english-future-will-going（will・be going to） | drill-english-2-future-compare-test-1・3・7・8・9・10・11・13 | 3 |
- 既存と同じ形（3つの選択肢それぞれに理由がつき、ア・イ・ウの1字で答える）。誤答の選択肢は、よくあるまちがい（割合を逆にする・公式の取りちがえ・並べかえ忘れ・did の後の過去形など）。
- 正答の位置はア6・イ8・ウ4（並びを問題ごとに入れかえ、解説の記号も合わせた）。
- 元の問題との結びつき（references）は、ライブラリと同じ方法（id・問題文・答えの SHA-256）で計算した29件。すべて今のテストで届く問題（reviewEligibleViaCurrentMaterialTest: true）。
- ID はすべて新しい（review-…-c1）。既存の ID と重ならない。

## 検証（終了コード）
- `build.mjs`：終了0（エラー0）。
- `verify.mjs`（`verify.log`・`verify-result.json`）：終了0、159検査・不一致0。候補フォルダに写した本物のライブラリと採点エンジンで、元の21問それぞれに3問ずつ出る／元の問題文を1文字変えると出ない／公開用に答えが入らない／正答だけ○／数の検算（12問）／別のパターンの元問題では開けない。
- `regress.mjs`（`regress.log`）：終了0。既存の元問題58問で、類題の出方が今のデータと1つも変わらない。

## Codex が取り込むときの最小差分
`候補/ai-review-practice-data.mjs` が、今の `cf-worker/src/ai-review-practice-data.mjs` に `追加分.json` の patterns・questions・references を足しただけのもの。ライブラリ・採点エンジン・ルートは変えていない（候補フォルダの2つは検証用の写し）。

## 残り（今回は作っていない）
類題のない単元：drill-math-1-signed、drill-english-2-modal-infinitive・sentence-gerund・passive-exclaim、drill-english-3-perfect-sentence・participle-relative・infinitive-subjunctive、workbook-math-1-signed・addition・subtraction（10単元）。
