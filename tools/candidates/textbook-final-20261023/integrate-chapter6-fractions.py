"""Exact3 SVG integration, gated by terminal whole success and reviewed candidates."""
from pathlib import Path
import hashlib,json,runpy,sys,xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=S/'縦分数_6章_20261025';B=H/'before-chapter6-fraction-integration'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();digest=lambda b:hashlib.sha256(b).hexdigest();enc=lambda x:(json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode();rel=lambda p:str(p.relative_to(R))
assert not B.exists() and not D.exists(),'already applied; preserve backups'
gate=load(H/'post-font-full-verification.json');assert gate['status']=='passed' and gate['observedExitCode']==0;assert sha(Path(gate['log']))==gate['logSha256'];assert not load(H/'resume.json')['activeSessions']
for file,expected in gate['inputSha256'].items():
 if file.endswith('/audit-fraction-glyphs.mjs'):
  assert sha(H/'chapter6-fraction-verification-previous/audit-fraction-glyphs.mjs')==expected
 else:assert sha(R/file)==expected,file+' changed since whole gate'
replay=load(H/'chapter6-generator-candidate-result.json');assert replay['status']=='passed' and replay['reviewedOutputs']==3 and replay['unrelatedByteIdentical']==30 and not replay['teachingAssetsWritten'];assert sha(R/replay['generator'])==replay['generatorSha256']
m=load(H/'chapter6-fraction-candidate/manifest.json');v=load(H/'chapter6-fraction-visual-review.json');assert len(m['items'])==len(v['items'])==3;assert sum(len(x['changes']) for x in m['items'])==6
assert sha(R/v['glyphAudit'])==v['glyphAuditSha256'];assert load(R/v['glyphAudit'])['imagesWithIssues']==0
semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];changes={};registry={};ledger=S/'依頼台帳_1件ずつ.json';requests=load(ledger)
def add(p,value):assert p not in changes;changes[p]=value
for row in m['items']:
 ident=row['id'];assert ident in {'M1-C6-S2-D01','M1-C6-S2-DMAP','M1-C6-REVIEW-E01'};candidate=H/'chapter6-fraction-candidate'/row['file'];review=next(x for x in v['items'] if x['id']==ident);assert sha(candidate)==row['afterSha256']==review['svgSha256'];assert sha(R/review['screenshot'])==review['screenshotSha256']
 target=S.parent/(ident+'.svg');copy=R/'site-assets'/row['file'];assert sha(target)==sha(copy)==row['beforeSha256']==replay['sourceSha256'][ident]
 assert semantic(E.parse(target).getroot())==semantic(E.parse(candidate).getroot()),ident+' changed mathematical text or non-text geometry'
 for p in [target,copy,D/(ident+'.svg')]:add(p,candidate.read_bytes())
 registry[ident]={**row,'file':ident+'.svg','target':rel(target),'copy':rel(copy),'status':'reviewed canonical template; integration receipt/request ledger track current verification'}
 request=next(x for x in requests if x['id']==ident)
 if 'sha256' in request:assert request['sha256']==row['beforeSha256']
 request.update(file=rel(target),sha256=row['afterSha256'],state='縦分数を本体反映・本内4幅点検待ち',layoutRevision='2026-10-25: exact original strings/signs/non-text geometry; D01 header40px/y79 only; current-book check pending')
add(D/'manifest.json',enc({'items':registry}));add(ledger,enc(requests))
p=S/'図/fraction_layout.py';text=p.read_text();a="'縦分数_5章_20261024']";assert text.count(a)==1;add(p,text.replace(a,"'縦分数_5章_20261024', '縦分数_6章_20261025']").encode())
p=H/'reviewed_changes.py';text=p.read_text();a="        ('縦分数_5章_20261024','font-metrics-repair-20261024/previous','chapter5-fraction-visual-review.json'),";assert text.count(a)==1;add(p,text.replace(a,a+"\n        ('縦分数_6章_20261025','before-chapter6-fraction-integration','chapter6-fraction-visual-review.json'),").encode())
p=R/'.claude/verify/run.sh';text=p.read_text();a='python3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-chapter5-fraction-generators.py" || fail=1';assert text.count(a)==1;add(p,text.replace(a,a+'\npython3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-chapter6-fraction-generators.py" || fail=1').encode())
plan={'status':'plan only','images':3,'rows':6,'bookSha256Unchanged':sha(R/'site-assets/textbook-book-math1.json'),'gateSha256':sha(H/'post-font-full-verification.json'),'candidateManifestSha256':sha(H/'chapter6-fraction-candidate/manifest.json'),'visualReviewSha256':sha(H/'chapter6-fraction-visual-review.json'),'auditToolRevision':{'beforeFile':rel(H/'chapter6-fraction-verification-previous/audit-fraction-glyphs.mjs'),'beforeSha256':sha(H/'chapter6-fraction-verification-previous/audit-fraction-glyphs.mjs'),'afterSha256':sha(H/'audit-fraction-glyphs.mjs')},'changes':[{'path':rel(p),'beforeSha256':sha(p) if p.exists() else None,'afterSha256':digest(value)} for p,value in changes.items()]}
if sys.argv[1:]!=['--apply']:
 assert not sys.argv[1:];(H/'chapter6-integration-plan.json').write_bytes(enc(plan));print('Prepared C6 exact3 image/6 row plan;',len(changes),'files; original book JSON and existing movies unchanged');sys.exit()
assert load(H/'chapter6-integration-plan.json')==plan,'plan drift'
for p,value in changes.items():
 expected=next(x for x in plan['changes'] if x['path']==rel(p));assert (sha(p) if p.exists() else None)==expected['beforeSha256'];assert digest(value)==expected['afterSha256']
for p in changes:
 if p.exists():backup=B/p.relative_to(R);backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(p.read_bytes())
for p,value in changes.items():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)
assert sha(R/'site-assets/textbook-book-math1.json')==plan['bookSha256Unchanged'];plan['status']='locally integrated; current-book/generator/changed whole checks pending';(H/'chapter6-fraction-integration.json').write_bytes(enc(plan));print('Integrated C6 exactly3 SVGs; source/copy/canonical/ledger connected; no movie or logical-book edits')
