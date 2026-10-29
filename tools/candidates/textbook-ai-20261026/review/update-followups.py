# -*- coding: utf-8 -*-
from pathlib import Path
import json

r=Path('tools/candidates/textbook-ai-20261026/review')
note='''

### 2026-10-26 続き：全体87031の照合3失敗と、独立した数学候補

全体87031は同じハンドルで生存を再確認。実行中の固定入力変更0、二重起動なし。現時点で数学4/5章の過去証拠を結ぶ3検査が失敗。確認済みの基本教科書AIによるtextbook-annotations.jsの後続変更を、古いhandwriting照合がまだたどれない。全体成功とは扱わない。旧期待SHA・照合条件を維持し、基本AI画面の差分/84・31証拠/6目視画像と今回の41・79証拠を検査して元の前段ファイルへ戻す修正候補を `review/legacy-evidence-fix/` に保存。候補の連鎖16項目成功。実行中の本体検証ファイルは未変更。全体終了後に適用し失敗箇所を個別再確認する。

既存数学4単元の解説132件とガイド1件に「累乗→かっこの中」の誤った説明が残ると確認。正しい説明と、かっこを底にもつ累乗で途中式が止まらない生成処理の候補を `review/math-order-followup/` に作成。実生成元から325問を隔離再生成し、問題文・答え・数値・near・出典・順序・その他メタデータを保持。132解説と指定ガイド以外の変更0。別のAST/Fraction計算による132等式列/100生成例等1585項目、生成元/既存JSON/表示・サーバー用パッケージとの照合618項目が成功。初回のengine不足、文章/説明付き設問の検査抽出失敗はfixture側を直して再成功し記録を保持。本体反映/画面/全体合格とは分ける。

原因理解用の数学1章6問（負の数の減法3・かっこ/乗除同順位/累乗の底3）を候補制作。移動の理由・変形の意味・誤った途中式を選ぶ問題。□を使い、方程式の先取りを必須にしない。実在の元設問ID/技能別対応、既存採点の一意性、独立分数計算、短いコメントを64項目確認。`review/practice-math-candidate.json`、`practice-math-source-refs.json`、`practice-math-candidate-result.json`。本体の類題バンク/本人用経路/画面は未接続。他4教科24問や広い対象を完成扱いしない。Claude新納品/稼働は未確認。依頼プロンプトへ数学6問を重複制作しない追記を保存し、送信はしない。

最初に `review/resume.json` の87031をポーリングし、終了とログ終端を確認するまで全体を新規起動しない。画面画像の読取りは本文のみ。105本の他教科動画/画像/非admin残件も継続。公開・コミット・削除・実AI/キュー資源・admin・新エージェント・自動作業再開・秘密値/実データ操作なし。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md','2026年10月大型アップデート.md','tools/candidates/textbook-final-20261023/進捗.md','tools/candidates/textbook-ai-20261025/進捗.md']:
    with Path(name).open('a',encoding='utf-8') as f:f.write(note)
p=Path('AI連絡/現在の状況.md');s=p.read_text();a=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->');b=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_END -->',a)
section=s[a:b].replace('変更後の単独全体を開始する。画面画像/原因別類題は未完成のまま記録。','変更後の単独全体87031を実行中。古い数学証拠の照合3件が失敗し、条件を維持した修正候補16項目を確認。本体検証ファイルは実行中に変えない。画面画像/原因別類題は未完成。')
section+='\n数学の追加候補：説明132件/ガイド1件、325問の問題/答え等保持、独立計算1585/照合618成功。原因理解用類題6問も候補64項目。ともに未反映。他4教科24問と本人用経路は未完成。\n\n'
p.write_text(s[:a]+section+s[b:])
p=Path('AI連絡/Claudeへ_ProAI解説と類題の並行制作_20261026.md')
with p.open('a') as f:f.write('''

### 10/26 Codex追記：重複制作を避ける現在地

生成/履歴/本人通知/新ノビー枠は手元本体に接続し、受付41・実HTTP/SQLite/IndexedDB/合成AIブラウザ79・限定差分61が成功。実AI/キュー資源/公開は未有効。全体87031を実行中で古い照合3失敗はCodexが修正候補16を確認。全体の二重起動や検証コードの同時編集をしない。

Codexが数学1章の負の数の減法/計算順序2パターン6問を `tools/candidates/textbook-ai-20261026/review/practice-math-candidate.json` に候補制作（64項目）。同じ6問を再制作せず、まず候補を読み、他4教科8パターン24問を優先する。この候補は本体未接続。既存数学解説132件/ガイドの生成元修正候補もCodex担当なので編集しない。
''')
p=r/'resume.json';v=json.loads(p.read_text());v.update(status='active; full87031 confirmed live, no source drift; three old evidence-chain failures so far; independent candidate progress',next='First poll existing87031 and final log. Do not restart while live. At terminal record observed exit/input hashes. Apply narrowly reviewed legacy-evidence-fix to old reviewed_changes.py without changing old expected hashes/assertions; rerun failed chapter4/5 checks. Math-order-followup:4 generators/325 questions,132 explanations+1 guide,1585+618 passed,not main. First math cause practice6 candidate64 passed,not main/endpoint/UI. Continue cause practice/vision after mandatory gates; no live provider/resources/publication.',lastGoalTurnClassification='progress: added three independently verified candidates; authoritative full87031 remained live; main source frozen');v['candidateProofs']={'legacyEvidenceChain':16,'mathOrderIndependentArithmetic':1585,'mathOrderRegenerationPreservation':618,'mathCausePractice':64};p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=r/'post-client-full-attempt1.json';v=json.loads(p.read_text());v.update(status='running; three old historical evidence chain failures observed; no final exit',observedFailures=['math-ch4 verify-current-evidence','math-ch5 verify-answer-data','math-ch5 verify-current-evidence']);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
(r/'math-order-followup/README.md').write_text('''# 数学の計算順序・解説の追加修正候補

本体未反映。全体87031中に現在の生成元/教材を変えず作成。

- 4単元325問の全設問/解答/near/数値/出典/順序/メタデータを維持し、説明132件とガイド1件を修正する候補。
- かっこの式を底にする累乗で、旧stepsが12回進まず最終値へ飛ぶ場合も候補で改善。
- `candidate-result.json`：独立したAST/Fraction検算1585成功。`regeneration-result.json`：実生成元からの再生成と元教材保持618成功。
- candidate内の写真フォルダは既存教材への読み取り用symlink。原本写真の再制作/改変はなく、書込みもしない。
- 組込み前に全体87031の終了と現SHAを確認。厳密な差分/ビルド一致/実画面確認を追加してから本体へ反映する。
- パッケージは手編集せず、確認済み正本/生成元を整合させて通常のビルダーで生成。問題/答え/その他教材の変更は許可しない。
- 元の全体入力は不変。候補の成功を本体や全体の成功としない。
''')
print('Eight progress records, dashboard, Claude prompt and resume updated; no runtime changes.')
