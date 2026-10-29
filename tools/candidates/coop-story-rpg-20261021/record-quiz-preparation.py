# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent
R=H.parents[2]
names=['quiz-service.mjs','verify-quiz-service.mjs','verify-backend.py']
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'prepared; not executed while external full is live','files':{n:hashlib.sha256((H/n).read_bytes()).hexdigest() for n in names},'rawAnswersFromHistoryRead':False,'ordinaryGradeWrites':False,'savedWordsRuntimeAdapterVerified':False,'newTestsRun':False,'mainIntegrated':False,'published':False}
(H/'quiz-preparation.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
for name,key,value in [('resume.json','newQuizAdapter','quiz-preparation.json'),('provenance.json','newQuizAdapterUntested','quiz-preparation.json')]:
 p=H/name;r=json.loads(p.read_text());r[key]=value
 if name=='resume.json':r['next'][1]='Run verify-backend.py serially after no whole-app full is live; nine checks include actual curriculum banks/graders and battle CAS; preserve failed logs'
 p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
entry='''

### 2026-10-21 Codex：協力RPGの本人用出題アダプター候補

quiz-service.mjs を独立候補へ追加。本人の material-attempt 名前空間から正解済みの単元/問題/モードだけをSQLで投影し、保存された生の回答や他人の履歴は読み込まない。現行バンクを既存の教材検証器で照合し、まだ使える5教科の問題だけを出す。英単語は本人スナップショットを返すサーバーヘルパーを要求し、取得前後のactive-session所有者確認と本人ID照合を実施する候補。英単語が多くても他教科が出なくならないよう、利用可能な教科から選び、その中で本人の正解済み問題を選ぶ。問題表示にはprompt等の必要な欄だけを返し、answer/解説/保存履歴は返さない。採点は既存エンジンと既存英単語判定を使用し、通常の成績・報酬へは書き込まない。

実バンク/既存採点器を使う合成SQLite検証を追加し、verify-backend.py は計9本の準備となった。Claude全体PID27824が実行中のため、今回の検証はまだ実行0。quiz-preparation.json にSHAと未検証の範囲を記録。本番/手元本体へはまだ未接続で、英単語保存先の本体アダプター、戦闘API、UI、実通信、最終全体は残る。公開/コミット/削除/admin/実AI/実ユーザーデータ操作なし。
'''
tracking=H/'quiz-preparation-recorded.json'
done=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name in done:continue
 with (R/name).open('a') as out:out.write(entry)
 done.append(name);tracking.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
print('Recorded read-only own-quiz adapter as untested; no live data accessed.')
