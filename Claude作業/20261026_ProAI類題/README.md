# Pro以上のAI解説を支える類題（Claude 2026-10-26・候補）

**候補だけです。本体・問題バンク・画面にはつないでいません。**

## 何をしたか
1. Codexの5教科10パターン30問（`tools/candidates/textbook-ai-20261026/review/practice-five-subjects-candidate.json`）を**再制作せず点検**しました → `review-of-codex-30.md`（誤り0、直すとよい点2つ）。
2. 教材テストがあるのにパターンが無い単元を選び、**6パターン18問を追加**しました → `practice-bank.json`。
   - 数学：文字式の表し方（drill-math-1-moji）／方程式の移項（drill-math-1-equation）／比例と反比例の見分け（drill-math-1-proportion）
   - 理科：光の反射角（drill-science-1-phenomena）／初期微動継続時間と距離（drill-science-1-earth）／ばねののびと全体の長さ（drill-science-1-phenomena）
   - どれも、今の教材テストの設問IDから開ける（`appliesToSourceIds`）。
3. 形式はCodex候補と同じ（`type:"input"`、`answer:{kind:"exact",accepted:["ア"]}`、`explanation`、`whyThisChecksCause`、`numericCheck`、`appliesToSourceIds`）。新しい形式は作っていません。

## ファイル
| ファイル | 中身 |
|---|---|
| `practice-bank.json` | 追加6パターン18問（Codex候補と同じ形式） |
| `mistake-patterns.json` | 6パターン：根拠の設問ID・確かめる原因・ねらい・70字以内のコメント例・類題ID |
| `build_patterns.py` | 上の2つを作るスクリプト（出典IDの実在・コメント字数・数値をこの中で検査） |
| `verify-practice.cjs` | 追加18問＋Codex30問の点検（採点器2つ・出典・字数・解答非表示）703件 |
| `review-of-codex-30.md` | Codex30問の点検結果 |
| `schema-notes.md` / `verification.md` / `manifest.json` / `引き継ぎ追記案.md` | 取り込みの注意・検査結果・SHA・共通記録への追記案 |

## 完了／未完了
- 完了：18問の制作、数値の独立検算、採点器での正誤確認、出典IDの実在、コメント字数。
- 未完了：画面での表示確認（Codexの画面に取り込んでから）。数学の図形・空間・データ、英語2・3年、理科の生物は未作成。
