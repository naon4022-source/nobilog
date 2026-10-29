"""Guarded5 SVG appendix typesetting after the verified C6 successor batch."""
from pathlib import Path
import hashlib,json,runpy,sys,xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=S/'縦分数_巻末_20261025';B=H/'before-appendix-fraction-integration'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();digest=lambda b:hashlib.sha256(b).hexdigest();enc=lambda v:(json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode();rel=lambda p:str(p.relative_to(R))
assert not B.exists() and not D.exists(),'already applied; do not overwrite backups'
gate=load(H/'post-font-full-verification.json');assert gate['status']=='passed' and gate['observedExitCode']==0 and sha(Path(gate['log']))==gate['logSha256'];assert not load(H/'resume.json')['activeSessions']
c6=load(H/'chapter6-fraction-integration.json');checked=load(H/'chapter6-fraction-result.json');assert checked['status'].startswith('local integration and targeted checks passed') and checked['observedExitCode']==0 and checked['bookDisplays']==12
assert sha(R/checked['bookDisplayReport'])==checked['bookDisplaySha256'] and sha(R/checked['glyphAudit'])==checked['glyphAuditSha256']
prior={x['path']:x for x in c6['changes']}
for path,row in prior.items():
 expected=checked['ledgerAfterSha256'] if path.endswith('/依頼台帳_1件ずつ.json') else row['afterSha256'];assert sha(R/path)==expected,path+' C6 successor drift'
for path,expected in gate['inputSha256'].items():
 if path in prior:assert sha(R/path)==prior[path]['afterSha256']
 elif path.endswith('/audit-fraction-glyphs.mjs'):
  assert sha(R/c6['auditToolRevision']['beforeFile'])==expected and sha(R/path)==c6['auditToolRevision']['afterSha256']
 else:assert sha(R/path)==expected,path+' whole baseline drift'
replay=load(H/'appendix-generator-candidate-result.json');assert replay['status']=='passed' and replay['reviewedOutputs']==5 and replay['unrelatedByteIdentical']==47 and not replay['teachingAssetsWritten']
for path,expected in replay['generators'].items():assert sha(R/path)==expected
m=load(H/'appendix-fraction-candidate/manifest.json');v=load(H/'appendix-fraction-visual-review.json');assert len(m['items'])==len(v['items'])==5 and sum(len(x['changes']) for x in m['items'])==10;assert sha(R/v['glyphAudit'])==v['glyphAuditSha256'] and load(R/v['glyphAudit'])['imagesWithIssues']==0;assert v['bookSha256']==sha(R/'site-assets/textbook-book-math1.json')
semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];changes={};registry={};ledger=S/'依頼台帳_1件ずつ.json';requests=load(ledger)
def add(p,value):assert p not in changes;changes[p]=value
known={'M1-APP2-FIG04','M1-APP2-C4-CH','M1-APP2-FIG05','M1-APP2-FIG06','M1-APP2-DMAP'}
for row in m['items']:
 ident=row['id'];assert ident in known;candidate=H/'appendix-fraction-candidate'/row['file'];review=next(x for x in v['items'] if x['id']==ident);assert sha(candidate)==row['afterSha256']==review['svgSha256'];assert sha(R/review['screenshot'])==review['screenshotSha256']
 target=S.parent/(ident+'.svg');copy=R/'site-assets'/row['file'];assert sha(target)==sha(copy)==row['beforeSha256']==replay['sourceSha256'][ident];assert semantic(E.parse(target).getroot())==semantic(E.parse(candidate).getroot()),ident+' original text/shapes changed'
 for p in [target,copy,D/(ident+'.svg')]:add(p,candidate.read_bytes())
 registry[ident]={**row,'file':ident+'.svg','target':rel(target),'copy':rel(copy),'status':'reviewed canonical template; receipt/request ledger track verification'}
 request=next(x for x in requests if x['id']==ident)
 if 'sha256' in request:assert request['sha256']==row['beforeSha256']
 request.update(file=rel(target),sha256=row['afterSha256'],state='巻末縦分数を本体反映・本内4幅点検待ち',layoutRevision='2026-10-25: exact original mathematical strings/signs/non-text geometry; title rows40px/y79; unknown coordinates retained; book checks pending')
assert set(registry)==known
add(D/'manifest.json',enc({'items':registry}));add(ledger,enc(requests))
p=S/'図/fraction_layout.py';text=p.read_text();a="'縦分数_6章_20261025']";assert text.count(a)==1;add(p,text.replace(a,"'縦分数_6章_20261025', '縦分数_巻末_20261025']").encode())
p=H/'reviewed_changes.py';text=p.read_text();a="        ('縦分数_6章_20261025','before-chapter6-fraction-integration','chapter6-fraction-visual-review.json'),";assert text.count(a)==1;add(p,text.replace(a,a+"\n        ('縦分数_巻末_20261025','before-appendix-fraction-integration','appendix-fraction-visual-review.json'),").encode())
p=R/'.claude/verify/run.sh';text=p.read_text();a='python3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-chapter6-fraction-generators.py" || fail=1';assert text.count(a)==1;add(p,text.replace(a,a+'\npython3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-appendix-fraction-generators.py" || fail=1').encode())
for row in load(H/'appendix-verification-candidate/manifest.json')['files']:
 p=R/row['path'];candidate=R/row['candidate'];assert sha(p)==row['beforeSha256'] and sha(candidate)==row['afterSha256'];add(p,candidate.read_bytes())
plan={'status':'plan only','images':5,'rows':10,'bookSha256Unchanged':sha(R/'site-assets/textbook-book-math1.json'),'gateSha256':sha(H/'post-font-full-verification.json'),'priorC6ReceiptSha256':sha(H/'chapter6-fraction-integration.json'),'priorC6EvidenceSha256':sha(H/'chapter6-fraction-result.json'),'candidateManifestSha256':sha(H/'appendix-fraction-candidate/manifest.json'),'visualReviewSha256':sha(H/'appendix-fraction-visual-review.json'),'changes':[{'path':rel(p),'beforeSha256':sha(p) if p.exists() else None,'afterSha256':digest(value)} for p,value in changes.items()]}
if sys.argv[1:]!=['--apply']:
 assert not sys.argv[1:];(H/'appendix-integration-plan.json').write_bytes(enc(plan));print('Prepared appendix5 image/10 row exact plan;',len(changes),'files; priorC6 source/evidence chain validated');sys.exit()
assert load(H/'appendix-integration-plan.json')==plan,'plan drift'
for p,value in changes.items():
 row=next(x for x in plan['changes'] if x['path']==rel(p));assert (sha(p) if p.exists() else None)==row['beforeSha256'] and digest(value)==row['afterSha256']
for p in changes:
 if p.exists():backup=B/p.relative_to(R);backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(p.read_bytes())
for p,value in changes.items():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)
assert sha(R/'site-assets/textbook-book-math1.json')==plan['bookSha256Unchanged'];plan['status']='integrated locally; targeted/current-book/final whole pending';(H/'appendix-fraction-integration.json').write_bytes(enc(plan));print('Integrated appendix5 SVGs; exact originals/copies/canonical/ledger connected, no movie/book JSON changes')
