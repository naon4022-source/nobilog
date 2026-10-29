# -*- coding: utf-8 -*-
from pathlib import Path
import json,re,hashlib

r=Path('tools/candidates/textbook-ai-20261026/review')
coverage=json.loads((r/'test-review-coverage-audit.json').read_text())
coverage['entrypoints'].append({'name':'separate Eiken test flow','connected':False,'evidence':'English mock exams are not material-bank kentei units; current review hooks only exist in material-ui.js. Separate Eiken completed-source integration is not established.'})
(r/'test-review-coverage-audit.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
spec=json.loads((r/'spec-progress.json').read_text())
for row in spec['items']:
    if row['requirement']=='原因別類題を本体から開く':
        row.update(status='candidate',evidence='five-subject30/10 patterns463 + exact-source server library589, math6 preserved; no owned route/UI; current material-test mapping reaches20/30 candidates, not full coverage')
if not any(row['requirement']=='旧・定期・生成・英検テストなどの全問解説への接続' for row in spec['items']):
    spec['items'].append({'requirement':'旧・定期・生成・英検テストなどの全問解説への接続','status':'pending','evidence':'test-review-coverage-audit.json: current implementation covers material test/mock source only. Social has no material test units. Need actual owned immutable completion and UI adapters; no browser grading on real data.'})
spec['totalItems']=len(spec['items']);spec['verifiedItems']=sum(row['status']=='verified' for row in spec['items']);spec['approxItemProgressPercent']=round(100*spec['verifiedItems']/spec['totalItems']);spec['progressLimits']='Unweighted checklist for new AI feature only. Coverage audit added a previously missing test-format requirement; not a whole-app/time percentage.30/10 are candidates, not connected completion.'
(r/'spec-progress.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
note='''

### 2026-10-26 続き：原因理解の類題30問/5教科と、正確な元設問を選ぶライブラリ候補

数学の既存6問を保持し、英語・国語・理科・社会を各6問追加。5教科×2パターン×3問＝30問を `review/practice-five-subjects-candidate.json` へ候補保存。新規の短文/選択理由で、単なる数値差替えではなく、誤った手順・解釈と比較して原因を考える。出典は実在する同教科/学年の設問IDに限定し、元教材は未変更。70字コメント/20字目的、選択肢一意性、既存採点、14式の独立した分数計算と日付境界等463項目成功。

`review/practice-service-candidate/` はサーバー用ライブラリ候補。IDだけでなく元の問題文/正式解答の指紋が一致する場合だけ、技能別の類題ID/ねらいを返す。条件や答えが違う問題には無関係な類題を自動代用しない。問題の表示用データから正答/解説を除き、明示回答後に既存採点器で判定する。元説明だけの承認済み改善は問題同一性を変えない。複製の保護・別問題拒否・出力項目等589項目成功。ただし本人の完成済み解説を確認する経路/試行保存/画面/AI入力への接続は未実装。ライブラリ関数だけを本人確認完成と呼ばない。

到達範囲を監査し `review/test-review-coverage-audit.json` に保存。現在の全問解説は教材画面のテスト/模擬検定に接続した範囲のみ。社会には教材テスト単元がなく、今回30候補のうちその範囲の元設問に対応するのは20問。旧テスト・定期テスト・生成テスト・別の英検テスト等の本人別の不変な全問完了証明/画面は別途必要。30問の候補を全教科/全形式の本体完成としない。不足要件を明示して新機能チェックリストへ追記。先の13項目中10に対し、監査後は14項目中10（時間比率や全体％ではない）。Claude依頼も、同じ30問を再制作せず内容点検/不足パターン補完へ進む指示に更新。送信はしていない。

全体87031は同じプロセスが実行中。本体と固定入力は不変。旧数学証跡の照合3失敗に加え、全体runnerが検証フォルダから呼ぶため新検査11本が相対パスで失敗した。rootからの個別成功と全体成功を混同しない。新検査の呼出しだけをproject-rootの子シェルで実行するrunner修正候補を `review/legacy-evidence-fix/runner.candidate.sh` に保存。全体実行中のrun.shは変更していない。終了後にこの呼出しと前段証拠の修正を適用し、実際の呼出し場所から検証する。現在の全体は未合格で、最終終了もまだ未確認。

再開点は `review/resume.json`。公開・コミット・削除・実AI/キュー資源・admin・新エージェント・定期自動作業・秘密値/実データ操作なし。画面画像、類題の本体接続/表示、数学説明132件/ガイドの本体反映、他教科105動画/画像/その他非adminは残る。記録保存コマンドの初回文字コード失敗も製品の成功に数えず、UTF-8の保存スクリプトで復旧している。
'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md','2026年10月大型アップデート.md','tools/candidates/textbook-final-20261023/進捗.md','tools/candidates/textbook-ai-20261025/進捗.md']:
    with Path(name).open('a') as f:f.write(note)
p=Path('AI連絡/現在の状況.md');s=p.read_text();a=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->');b=s.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_END -->',a);v=s[a:b]
v=v.replace('13項目中10項目確認済み（約77%','14項目中10項目確認済み（約71%')
v+='\n最新の類題候補：5教科30問/10パターン463、元設問指紋で選ぶサーバー用ライブラリ589が成功。本人用経路/画面/AI入力には未接続。現在の教材テスト元設問に対応するのは20/30で、社会・旧/定期/生成/英検など別テスト形式への接続は未完了。全体87031は実行継続、旧照合3件と呼出しフォルダ起因11本が失敗。呼出し修正候補は未適用。\n\n';p.write_text(s[:a]+v+s[b:])
p=Path('AI連絡/Claudeへ_ProAI解説と類題の並行制作_20261026.md');s=p.read_text()
notice='''
**10/26最新・この追記を優先：初期30問はCodexが候補制作済みです。** 保存先 `tools/candidates/textbook-ai-20261026/review/practice-five-subjects-candidate.json`。5教科10パターン30問を再制作せず、まず言語・理数・選択肢の内容点検と不足パターンの補完をしてください。463項目とサーバーライブラリ候補589項目は成功していますが、本体の本人用経路/画面/AI入力はCodexが未接続です。社会・旧/定期/生成/英検の別テスト元の接続もCodex側で残ります。全体87031を二重起動せず、候補納品フォルダだけで作業してください。

'''
first=s.index('\n')+1;s=s[:first]+notice+s[first:]
s=s.replace('最初は数学を中心に、英語・理科・社会・国語の5教科それぞれ2つの典型的な誤り、合計10パターン×3問＝30問を1セットとして仕上げてください。','初期の5教科10パターン×3問＝30問は上の最新追記の候補を先に確認し、再制作せず内容を独立点検してください。不足する別パターンの候補は専用フォルダへ追加してください。')
s=s.replace('他4教科8パターン24問を優先する。','他4教科24問も含む30候補を点検し、不足する別パターンを優先する。')
p.write_text(s)
p=r/'resume.json';v=json.loads(p.read_text());v.update(status='active; full87031 live,3 historical-chain+11 cwd failures observed; 30/10 practice candidate463 and library589 verified',next='Poll existing87031 to terminal and final log; no duplicate full. Record exit/input hashes. Then apply legacy-evidence-fix/reviewed_changes.candidate.py to original module and runner.candidate.sh to run.sh after exact before hashes check; keep old assertions/expected SHAs. Update runner receipt addition/after hash without changing prior commands. Run failed old3 plus11 new from actual runner directory. Initial30/10 cause candidate463/library589 ready but no owned route/AI input/UI; current test eligibility20/30. Coverage audit identifies old/term/generated/Eiken sources pending. Math-order325/132+guide1 candidate1585/618 pending main. No publish/real AI/resources.',lastGoalTurnClassification='progress: completed24 additional original questions, verified30/10 and exact-source library, identified actual test-format coverage gap and full-run cwd failures; main frozen.');v['candidateProofs'].update(fiveSubjectPractice=463,practiceServerLibrary=589);v['coverageAudit']=str(r/'test-review-coverage-audit.json');p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
log=(r/'post-client-full-attempt1.log').read_text();files=sorted(set(re.findall(r'at (?:async )?file://([^:\n]+/verify[^:\n]+\.mjs):',log)))
p=r/'post-client-full-attempt1.json';v=json.loads(p.read_text());v.update(status='running;3 historical chain assertions and11 cwd-based ENOENT failures observed; terminal exit unconfirmed',observedWorkingDirectoryFailures=[Path(f).name for f in files]);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
(r/'practice-candidate-review.md').write_text('''# 初期の原因理解用類題：候補30問

本体未反映。5教科各6問、合計10パターン。元問題は変更せず、同一学年/教科の実在設問IDへ対応付けたオリジナル問題です。誤答の原因を断定せず、誤った理由・途中式・読取りを比較して本人が確かめる入口にします。主教材や入試難問バンク全体の完成を意味しません。

- 数学：負の数を引く移動/変形/逆向きの推論、かっこ・同順位の乗除・累乗の底。
- 英語：be動詞とing形の組、主語との一致、否定/疑問/短い応答。元の語を不要に変えない理由を示す。
- 国語：独自短文。指示語の代入/範囲/後方指示、逆接/補足/対応。単語一致で自由記述の意味を採点する方式は使わない。
- 理科：密度の単位/水位差/均一な材質の比、音の往復/片道。測定条件を明記し、式の意味を比較する。
- 社会：緯度/経度の基準線・方位、標準時の経度差/方向/前日翌日。仮想地点で夏時間なしを明記し、現実の都市の経度や時差制度と混同しない。

全問の選択肢/正式解答/理由を内容点検。正解位置はア/イ/ウ各10。14式は別のAST/Fraction実装、日付はdatetimeでも照合。30/10候補463項目成功、実在元の指紋と技能別選択/答えなし表示/既存採点のサーバーライブラリ候補589項目成功。

未完了：実際の本人の完成済み解説を確認する認可経路・回答の保存/復旧・画面・AIへの候補ID提示・全問/全形式の対象拡張。元設問のIDだけでは許可せず、問題文/正式解答の指紋も照合する。説明だけの承認済み改善は同一問題として保つ。本文や答えが変わった場合は自動で別問へつながない。

現在の教材テストに対応する元設問は30候補中20のみ。社会は教材テストを持たず、旧・定期・生成・別英検も未接続。この候補や関数だけで全教科/全形式の本体完成とは扱わない。
''')
print('Practice coverage, eight records, Claude prompt and resume updated; no runtime edits.')
