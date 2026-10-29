from pathlib import Path
import hashlib,json,os
from datetime import datetime,timezone
H=Path(__file__).resolve().parent
R=H.parents[2]
proof=json.loads((H/'review-verification.json').read_text())
cross=json.loads((H/'claude-delta-crosscheck.json').read_text())
assert proof['status']=='passed' and proof['checks']==1203 and cross['questionCount']==133
assert hashlib.sha256((R/'site-assets/material-bank.json').read_bytes()).hexdigest()==proof['afterBankSha256']
assert hashlib.sha256((R/'tools/candidates/answer-forms-20261021/corrections.json').read_bytes()).hexdigest()==cross['claudeCorrectionsSha256']
os.kill(13129,0)
assert 'Social3 rubric guards: 45 integrated checks passed' in Path('/tmp/nobi-claude-answer-forms-after-20261021.log').read_text()
entry='\n\n'+(H/'progress-entry.md').read_text()
tracking=H/'progress-recorded.json'
recorded=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name not in recorded:
  with (R/name).open('a') as f:f.write(entry)
  recorded.append(name);tracking.write_text(json.dumps(recorded,ensure_ascii=False,indent=2)+'\n')
G=R/'tools/candidates/coop-story-rpg-20261021'
files=['invalidation-hub.mjs','invalidation-do.mjs','live-refresh.mjs','verify-invalidation.mjs','通信の境界.md']
(G/'live-preparation.json').write_text(json.dumps({'status':'prepared; not executed or integrated','files':{n:hashlib.sha256((G/n).read_bytes()).hexdigest() for n in files},'fullSuiteObservedLive':{'pid':13129,'log':'/tmp/nobi-claude-answer-forms-after-20261021.log','observedAt':datetime.now(timezone.utc).isoformat()},'next':'After full terminal verify streams/lifecycle in isolation, then integrate guarded routes and UI','realUserData':False,'published':False},ensure_ascii=False,indent=2)+'\n')
p=G/'provenance.json';d=json.loads(p.read_text());d['story']['draftChapters']=list(range(1,8));d['additionalUntestedCommunication']='live-preparation.json';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Recorded verified 133-answer review and unverified communication/story work in five progress files.')
