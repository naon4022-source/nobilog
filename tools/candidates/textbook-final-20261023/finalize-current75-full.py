"""Seal the observed successful12432 run; never starts or reruns verification."""
from pathlib import Path
import json,hashlib,datetime
H=Path(__file__).resolve().parent
R=H.parents[2]
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
log=Path('/private/tmp/nobi-textbook-post-current75-full-20261025.log')
text=log.read_text()
assert text.rstrip().endswith('✅ ぜんぶ通過')
assert all(x not in text for x in ['❌ 落ちたスイートがある','Traceback (most recent call last)','AssertionError'])
play=load(H/'current-math-playback-result-verified.json')
assert play['status']=='passed' and play['plays']==300
for f,digest in play['inputs'].items():assert sha(R/'site-assets'/f)==digest,f
body=load(H/'body-fractions-20261025/receipt.json')
gate=next(x for x in body['verificationEdits'] if x['file']=='.claude/verify/run.sh')
assert sha(R/gate['beforeFile'])==gate['beforeSha256']
assert sha(R/gate['file'])==gate['afterSha256']
old=(R/gate['beforeFile']).read_text()
anchor='node "$VERIFY_DIR/verify-vertical-fractions-rules.cjs" || fail=1\n'
addition='node "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-math-fraction-context.cjs" || fail=1\nnode "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-body-fraction-book.mjs" || fail=1\n'
assert old.count(anchor)==1
assert (R/gate['file']).read_text()==old.replace(anchor,anchor+addition,1)
for x in body['files']:assert sha(R/x['file'])==x['afterSha256']
S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
paths=[S/f for f in ['縦分数_6章_20261025/manifest.json','縦分数_巻末_20261025/manifest.json']]
paths.append(R/'教材整理/Claude_Codex共有/理科全体制作/メディア/制作ソース/縦分数_20261025/manifest.json')
figures=[]
for path in paths:
 rows=load(path)['items']
 for x in rows.values() if isinstance(rows,dict) else rows:
  for key in ['target','copy']:assert sha(R/x[key])==x['afterSha256'],x['id']+' '+key
  assert sha(path.parent/x['file'])==x['afterSha256']
  figures.append({k:x[k] for k in ['id','target','copy','afterSha256']})
assert len(figures)==9
saved=H/'post-current75-full-20261025.log'
assert not saved.exists()
saved.write_bytes(log.read_bytes())
proof={'status':'passed','session':12432,'observedExitCode':0,'command':'bash .claude/verify/run.sh',
 'finishedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'terminal':'✅ ぜんぶ通過',
 'log':str(saved.relative_to(R)),'originalLog':str(log),'logSha256':sha(saved),
 'registeredGateSha256':sha(R/gate['file']),'registeredGateProof':'Exact prior gate plus two recorded body-fraction checks, matching verificationEdits.afterSha256 saved before execution',
 'runtimeInputsUnchangedFromPassed300Playback':play['inputs'],'nineLaterFigures':figures,
 'bodyRuntimeReceipt':str((H/'body-fractions-20261025/receipt.json').relative_to(R)),
 'bodyRuntimeReceiptSha256':sha(H/'body-fractions-20261025/receipt.json'),
 'current75Playback':str((H/'current-math-playback-result-verified.json').relative_to(R)),
 'current75PlaybackSha256':sha(H/'current-math-playback-result-verified.json'),
 'scope':['Changed SVG/body batch passed full registered suite; current75 local movie playback300 passed separately',
 '36SVG59 fraction rows and body37 source strings checked; no unchanged video regeneration',
 'No publication, commit, deletion, admin production changes, real AI activation or real user grading'],
 'sealAttempt1':'Failed before any proof/log write because historical wholeGateSha256 was used instead of the already-recorded verificationEdits.afterSha256. Exact two-line registration delta checked; no verification rerun or app change.',
 'notComplete':['textbook drawing','textbook scoped AI/temporary plan release conditions','other-subject content/current AV evidence','P051/P052 wording approval','new listening and real iPhone review where required','remaining broader authorized nonadmin objective']}
(H/'post-current75-full-verification.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('Sealed full12432 exit0; exact registered gate/runtime; later9 SVG source/copy/canonical SHA; durable full log.')
