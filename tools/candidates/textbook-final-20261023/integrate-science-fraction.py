"""One SCI diagram only: exact source guard, reviewed value-preserving typesetting."""
from pathlib import Path
import hashlib,json,runpy,sys,xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/理科全体制作';S=W/'メディア/制作ソース';G=R/'教材整理/Claude_Codex共有/教科図解';D=S/'縦分数_20261025';B=H/'before-science-fraction-integration'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();digest=lambda b:hashlib.sha256(b).hexdigest();enc=lambda v:(json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode();rel=lambda p:str(p.relative_to(R))
assert not B.exists() and not D.exists() and not (G/'reviewed_fractions.py').exists(),'preserve prior files'
gate=load(H/'post-font-full-verification.json');assert gate['status']=='passed' and gate['observedExitCode']==0 and sha(Path(gate['log']))==gate['logSha256'];assert not load(H/'resume.json')['activeSessions']
prior={}
for receipt in ['chapter6-fraction-integration.json','appendix-fraction-integration.json']:
 prior.update({x['path']:x for x in load(H/receipt)['changes']})
checked=load(H/'appendix-fraction-result.json');assert checked['observedExitCode']==0 and checked['bookDisplays']==20 and checked['status'].startswith('local integration and targeted checks passed')
for path,row in prior.items():
 expected=checked['ledgerAfterSha256'] if path.endswith('/依頼台帳_1件ずつ.json') else row['afterSha256'];assert sha(R/path)==expected,path+' prior successor drift'
for path,expected in gate['inputSha256'].items():
 if path in prior:assert sha(R/path)==prior[path]['afterSha256']
 elif path.endswith('/audit-fraction-glyphs.mjs'):
  audit=load(H/'chapter6-fraction-integration.json')['auditToolRevision'];assert sha(R/audit['beforeFile'])==expected and sha(R/path)==audit['afterSha256']
 else:assert sha(R/path)==expected,path+' whole input drift'
row=load(H/'science-fraction-candidate/manifest.json')['items'][0];assert row['id']=='S1-MATTER-S1-DQ' and len(row['changes'])==1 and len(row['lineWrapChanges'])==2
v=load(H/'science-fraction-visual-review.json');candidate=H/'science-fraction-candidate'/row['file'];assert sha(candidate)==row['afterSha256']==v['svgSha256'];assert sha(R/v['screenshot'])==v['screenshotSha256'];assert sha(R/v['glyphAudit'])==v['glyphAuditSha256'] and load(R/v['glyphAudit'])['imagesWithIssues']==0;assert sha(R/v['neighborFit'])==v['neighborFitSha256'] and load(R/v['neighborFit'])['status']=='passed'
raw=load(H/'science-raw-generator-result.json');assert raw['status']=='passed' and raw['rawGeneratorSha256']==row['beforeSha256'];target=W/'メディア/S1-MATTER-S1-DQ.svg';copy=R/'site-assets'/row['file'];assert sha(target)==sha(copy)==row['beforeSha256']
semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];old_text,old_shapes=semantic(E.parse(target).getroot());texts,shapes=semantic(E.parse(candidate).getroot());assert old_shapes==shapes
assert ''.join(x['before'] for x in row['lineWrapChanges'])==''.join(x['after'] for x in row['lineWrapChanges'])
for c in row['lineWrapChanges']:
 assert texts.count(c['after'])==1;texts[texts.index(c['after'])]=c['before']
assert texts==old_text,'unreviewed text change beyond exact unit line wrap'
changes={}
def add(p,b):assert p not in changes;changes[p]=b
registered={**row,'file':row['id']+'.svg','target':rel(target),'copy':rel(copy),'status':'reviewed canonical template; receipt/diagram ledger track current verification'}
for p in [target,copy,D/registered['file']]:add(p,candidate.read_bytes())
add(D/'manifest.json',enc({'items':{row['id']:registered}}))
ledger=S/'依頼台帳_縦分数_20261025.json';assert not ledger.exists();add(ledger,enc({'scope':'existing S1-MATTER-S1-DQ diagram typesetting only; no new content or image slot','items':[{'id':row['id'],'file':rel(target),'copy':rel(copy),'sha256':row['afterSha256'],'state':'縦分数と単位改行を本体反映・本内4幅検査待ち','layoutRevision':'2026-10-25: original mathematical strings/numbers/masks/non-text shapes preserved;1/10 stacked, row+1.2 and bar gap3.1; cm³ unbroken by two exact concatenation-preserving line wraps'}]}))
helper=H/'science-verification-candidate/reviewed_fractions.py';add(G/'reviewed_fractions.py',helper.read_bytes())
for c in load(H/'science-verification-candidate/manifest.json')['files']:
 p=R/c['path'];code=R/c['candidate'];assert sha(p)==c['beforeSha256'] and sha(code)==c['afterSha256'];add(p,code.read_bytes())
p=R/'.claude/verify/run.sh';text=p.read_text();anchor='python3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-appendix-fraction-generators.py" || fail=1';assert text.count(anchor)==1;add(p,text.replace(anchor,anchor+'\npython3 "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-science-fraction-generators.py" || fail=1\nnode "$PROJECT_DIR/tools/candidates/textbook-final-20261023/verify-science-fraction-fit.mjs" --integrated || fail=1').encode())
plan={'status':'plan only','diagram':'S1-MATTER-S1-DQ','fractionRows':1,'unitWrapTextNodes':2,'scienceBookSha256Unchanged':sha(R/'site-assets/textbook-book-science1.json'),'mathBookSha256Unchanged':sha(R/'site-assets/textbook-book-math1.json'),'priorAppendixEvidenceSha256':sha(H/'appendix-fraction-result.json'),'candidateManifestSha256':sha(H/'science-fraction-candidate/manifest.json'),'visualReviewSha256':sha(H/'science-fraction-visual-review.json'),'changes':[{'path':rel(p),'beforeSha256':sha(p) if p.exists() else None,'afterSha256':digest(b)} for p,b in changes.items()]}
if sys.argv[1:]!=['--apply']:
 assert not sys.argv[1:];(H/'science-integration-plan.json').write_bytes(enc(plan));print('Prepared exact SCI plan:',len(changes),'files; source/copy,1 canonical diagram,1 scoped ledger and guarded producer; books unchanged');sys.exit()
assert load(H/'science-integration-plan.json')==plan,'plan drift'
for p,b in changes.items():
 c=next(x for x in plan['changes'] if x['path']==rel(p));assert (sha(p) if p.exists() else None)==c['beforeSha256'] and digest(b)==c['afterSha256']
for p in changes:
 if p.exists():backup=B/p.relative_to(R);backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(p.read_bytes())
for p,b in changes.items():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
assert sha(R/'site-assets/textbook-book-science1.json')==plan['scienceBookSha256Unchanged'] and sha(R/'site-assets/textbook-book-math1.json')==plan['mathBookSha256Unchanged'];plan['status']='locally integrated; source/glyph/book/final whole verification pending';(H/'science-fraction-integration.json').write_bytes(enc(plan));print('SCI existing diagram integrated; only reviewed fraction/line wrap; both books JSON unchanged')
