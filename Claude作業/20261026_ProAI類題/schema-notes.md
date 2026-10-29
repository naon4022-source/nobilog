# 取り込みの注意（Codexへ）

- 形式はCodex候補 `practice-five-subjects-candidate.json` と同じ。`patterns[]` と `questions[]` をそのまま足せる（IDの重複なしを確認済み）。
- `displayPolicy` はCodex候補の値をそのまま写した。全問解答前に答えを送らない・解説ははじめ閉じる・既存の学習記録に数えない・追加のAI回数を使わない。
- 採点は既存の `material-engine` の `exact` だけを使う（`accepted:["ア"]` など）。新しい採点方式は不要。
- `numericCheck.expression` はすべて四則演算だけの式（JavaScriptでもPythonでもそのまま計算できる）。
- 本体（問題バンク・画面・サーバー）には何も書いていない。取り込みはCodexの担当。
