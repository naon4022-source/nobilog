# 記述問題の「否定」の直し（2026-10-22 Claude）

- 正しい答えに自然に入る「〜しない」「少なく」などで、記述問題が×になっていた29問の answer だけを直した。問題文・数値・解説・出典は変えていない。
- `allowNegation:true` にしたうえで、意味が逆になる言い方（「片づけない」「消えない」など）を `reject` に入れ、×のままにした。
- `workbook-english-1-l4a-60`（Mr. Kato doesn't drive a car.）は、正しい「運転しない」が×、逆の「運転します」が○になっていたので、否定の訳（ない／ません）を `required` にした。
- 採点器（material-engine.js）は「少ない」「つないで」「間もなく」「だけでなく」を否定と見なさないようにした（本当の否定「しない」「少なくない」は今までどおり）。
- 変更前後：`corrections.json`。`apply.py` は最初の28問の一括処理で、その後に足した reject と1問は corrections.json に記録した。
- 検証：`.claude/verify/verify-rubric-negation.cjs`
