"""Update records after the already-observed whole12432 success; no app edits."""
from pathlib import Path
import json
H=Path(__file__).resolve().parent
R=H.parents[2]
load=lambda p:json.loads(p.read_text())
assert load(H/'post-current75-full-verification.json')['status']=='passed'
marker=H/'full12432-records-updated.json'
assert not marker.exists(),'records already updated; do not duplicate append'
p=H/'resume.json'
r=load(p)
(H/'resume-before-whole12432-seal.json').write_bytes(p.read_bytes())
r['activeSessions']=[]
r['historicalChapterPlaybackBeforeBody']=r['chapterPlayback']
r['chapterPlayback']={str(n):f'current renderer2026-10-25: {count} movies x4 widths passed, current75 report13851 exit0' for n,count in [(1,21),(2,13),(3,11),(4,12),(5,12)]}
r['wholePostVerification']='12432 observed exit0; changed SVG/body batch all registered suites passed; durable post-current75-full-verification.json. Overall objective not complete.'
r['wholePostEvidence']=str((H/'post-current75-full-verification.json').relative_to(R))
r['next']='Textbook drawing: implement actual canvas plus private save/reload, offline drafts, account/plan/conflict guards and book integration; scoped textbookAI/temporary plan and content review next. Do not rerun whole while runtime unchanged; next required whole after substantive next batch.'
r['knownRemaining'][0]='Current75 playback300 and changed full12432 passed. Textbook drawing/scopedAI/plans/other-subject content/AV review and P051/P052 wording remain.'
r['ledgerFinalStatusReceipt']=str((H/'ledger-final-status-receipt.json').relative_to(R))
p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
p=H/'production-math-playback-progress.json'
d=load(p)
d['wholePostVerification']={'status':'passed','session':12432,'observedExitCode':0,'proof':r['wholePostEvidence']}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
note='\n\n'+(H/'full12432-record-note.md').read_text()
files=['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md',str((H/'進捗.md').relative_to(R))]
for name in files:
 with (R/name).open('a') as f:f.write(note)
p=R/'AI連絡/現在の状況.md'
s=p.read_text()
begin='<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->'
end='<!-- CODEX_CURRENT_TEXTBOOK_STATUS_END -->'
a=s.index(begin)
b=s.index(end)+len(end)
(H/'status-dashboard-before-whole12432.md').write_text(s[a:b]+'\n')
p.write_text(s[:a]+(H/'current-dashboard-whole12432.md').read_text().rstrip()+s[b:])
marker.write_text(json.dumps({'status':'updated','wholeProof':r['wholePostEvidence'],'files':files,'outsideCurrentDashboardHistoryPreserved':True,'note':'Appended own safe note only to HANDOFF; private existing contents were not copied.'},ensure_ascii=False,indent=2)+'\n')
print('All required records/current dashboard updated; whole12432 passed, broader goal active.')
