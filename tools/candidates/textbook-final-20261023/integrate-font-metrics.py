"""Guarded native SVG repair; exact backups and immutable review chain."""
from pathlib import Path
from urllib.parse import urlparse, unquote
from copy import deepcopy
import hashlib,json,runpy,sys
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=H/'font-metrics-repair-20261024';B=D/'previous'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();digest=lambda b:hashlib.sha256(b).hexdigest();encode=lambda o:(json.dumps(o,ensure_ascii=False,indent=2)+'\n').encode();rel=lambda p:str(p.relative_to(R))
assert not B.exists(),'already applied; preserve backups'
m=load(D/'manifest.json');v=load(D/'visual-review.json');assert len(m['items'])==len(v['items'])==19
assert sha(R/v['automaticAudit'])==v['automaticAuditSha256'] and load(R/v['automaticAudit'])['imagesWithIssues']==0
assert load(D/'chapter5-raw-generator.json')['status']=='passed'
gate=load(H/'pre-chapter4-full-verification.json');assert gate['status']=='passed' and gate['observedExitCode']==0 and sha(Path(gate['log']))==gate['logSha256']
assert not load(H/'resume.json')['activeSessions']
semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];import xml.etree.ElementTree as E
book=R/'site-assets/textbook-book-math1.json';assert sha(book)==gate['bookSha256']
requests_path=S/'依頼台帳_1件ずつ.json';requests=load(requests_path);registries={};changes={};revisions=[]
def add(p,value):
 assert p not in changes;changes[p]=value
for row in m['items']:
 ident=row['id'];candidate=H/row['candidate'];review=next(x for x in v['items'] if x['id']==ident)
 assert sha(candidate)==row['afterSha256']==review['svgSha256'];assert sha(R/review['screenshot'])==review['screenshotSha256']
 if row['kind']=='integrated':
  name=row['registry'];mp=S/name/'manifest.json';registries.setdefault(mp,load(mp));registered=registries[mp]['items'][ident]
  assert registered==row['canonicalRow'];target,copy=R/registered['target'],R/registered['copy'];before=row['beforeSha256']
  assert sha(S/name/registered['file'])==before;add(S/name/registered['file'],candidate.read_bytes())
  registered['afterSha256']=row['afterSha256'];registered['fontMetricsRevision']='2026-10-24 actual inherited-font ink and spacing'
 else:
  name='縦分数_5章_20261024';mp=S/name/'manifest.json';assert not mp.exists();registries.setdefault(mp,{'items':{}})
  target=S.parent/(ident+'.svg');copy=R/'site-assets'/('textbook-book-math1-'+ident.lower()+'.svg');before=row['originalRawSha256']
  registered={'file':ident+'.svg','target':rel(target),'copy':rel(copy),'beforeSha256':before,'afterSha256':row['afterSha256'],'changes':next(x['changes'] for x in load(H/'chapter5-fraction-candidate/manifest.json')['items'] if x['id']==ident)}
  registries[mp]['items'][ident]=registered;add(S/name/registered['file'],candidate.read_bytes())
 assert sha(target)==sha(copy)==before
 assert semantic(E.parse(target).getroot())==semantic(E.parse(candidate).getroot()),ident+' original mathematical content/geometry'
 for p in [target,copy]:add(p,candidate.read_bytes())
 request=next(x for x in requests if x['id']==ident)
 if 'sha256' in request:assert request['sha256']==before
 request.update(file=rel(target),sha256=row['afterSha256'],state='縦分数の字幅補正を本体反映・本内再点検待ち',layoutRevision='2026-10-24: actual inherited-font metrics; mathematical glyph strings and non-text geometry preserved; current-book verification pending')
 revisions.append({'id':ident,'kind':row['kind'],'registry':name,'target':rel(target),'copy':rel(copy),'beforeSha256':before,'afterSha256':row['afterSha256'],'beforeFile':rel(B/target.relative_to(R)),'copyBeforeFile':rel(B/copy.relative_to(R)),'candidate':rel(candidate),'screenshot':review['screenshot'],'screenshotSha256':review['screenshotSha256']})
for p,value in registries.items():add(p,encode(value))
add(requests_path,encode(requests))
p=S/'図/fraction_layout.py';text=p.read_text();needle="'縦分数_4章_20261024']";assert text.count(needle)==1;add(p,text.replace(needle,"'縦分数_4章_20261024', '縦分数_5章_20261024']").encode())
plan={'status':'prepared','bookSha256Unchanged':sha(book),'reviewManifestSha256':sha(D/'manifest.json'),'visualReviewSha256':sha(D/'visual-review.json'),'gateSha256':sha(H/'pre-chapter4-full-verification.json'),'items':revisions,'changes':[{'path':rel(p),'beforeSha256':sha(p) if p.exists() else None,'afterSha256':digest(value)} for p,value in changes.items()]}
if sys.argv[1:]!=['--apply']:
 assert not sys.argv[1:];(D/'integration-plan.json').write_bytes(encode(plan));print('Prepared19 exact reviewed SVG integrations;',len(changes),'files, book unchanged');sys.exit()
assert load(D/'integration-plan.json')==plan,'plan drift'
for p,value in changes.items():
 row=next(x for x in plan['changes'] if x['path']==rel(p));assert (sha(p) if p.exists() else None)==row['beforeSha256'];assert digest(value)==row['afterSha256']
for p in changes:
 if p.exists():
  backup=B/p.relative_to(R);backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(p.read_bytes())
for p,value in changes.items():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)
assert sha(book)==plan['bookSha256Unchanged'];plan['status']='integrated locally; targeted/whole verification pending';(D/'integration.json').write_bytes(encode(plan));print('Applied19 SVGs; preserved all before bytes, source/copy/canonical SHA; book JSON untouched')
