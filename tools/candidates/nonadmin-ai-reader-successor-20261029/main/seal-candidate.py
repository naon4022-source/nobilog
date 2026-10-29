"""Seal staged sources and current/historical verifier code; still NO application writes."""
from pathlib import Path
import json,hashlib,copy
ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT)
V=Path('tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main');A=Path('tools/candidates/review-practice-choice-order-20261029')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert not (HERE/'prepared.json').exists(),'Never reseal a prepared successor'
spec=json.loads((HERE/'prepared-source.json').read_text());assert len(spec['files'])==70 and spec['legacyNormalizedCount']==29
spec['status']='reviewed70 exact successor; final whole verification separate'
(HERE/'prepared.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n');digest=sha(HERE/'prepared.json')
guard=(HERE/'guard.template.cjs').read_text();assert guard.count('__SPEC_SHA__')==1;(HERE/'checked-successor.cjs').write_text(guard.replace('__SPEC_SHA__',digest))
meta=copy.deepcopy(json.loads((A/'clarity/preparation.json').read_text()))
for r in meta['inputs']:
 if Path(r['file']).is_absolute():r['file']=str(Path(r['file']).relative_to(ROOT))
 if r['file']=='cf-worker/src/ai-review-practice-data.mjs':r['file']=str(BASE/'before/cf-worker/src/ai-review-practice-data.mjs')
(HERE/'preparation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
current=(A/'verify-clarity.mjs').read_text()
replacements=[("from './clarity/ai-review-practice-data.mjs'","from '../../../../cf-worker/src/ai-review-practice-data.mjs'"),("from './clarity/relocated-library.mjs'","from '../../../../cf-worker/src/ai-review-practice-library.mjs'"),("root=new URL('../../../',import.meta.url)","root=new URL('../../../../',import.meta.url)"),("here=new URL('./clarity/',import.meta.url)","here=new URL('./',import.meta.url)"),("new URL('cf-worker/src/ai-review-practice-data.mjs',root)","new URL('before/cf-worker/src/ai-review-practice-data.mjs',here)"),("new URL('result.json',here)","new URL('library-result.json',here)")]
for a,b in replacements:assert current.count(a)==1,(a,current.count(a));current=current.replace(a,b)
old="new URL('ai-review-practice-data.mjs',here)";assert current.count(old)==1
current=current.replace(old,"new URL('cf-worker/src/ai-review-practice-data.mjs',root)")
current=current.replace('Actual pure server library relocated only for isolated candidate data/engine imports; all references checked against real public bank. No routes, AI, user records, or main integration; full content/visual approval remains separate.','Actual main96 data and unchanged server library; all references checked against real public bank and old48 preserved. Synthetic pure-library verification; owned HTTP and full-suite results recorded separately.')
(HERE/'verify-main-library.mjs').write_text(current)
(HERE/'verify-main-route.mjs').write_bytes((A/'main/verify-main-route.mjs').read_bytes())
previous=(A/'main/predecessor-view.mjs').read_text()
for a,b in [("spec.previousFull.file","spec.historicalCurrentSnapshot.file"),("new Map(spec.files.map(r=>[r.file,r]))","new Map(spec.currentBeforeFiles.map(r=>[r.file,r]))"),("const teaching=path.dirname(spec.historicalGuard)","const teaching=spec.historicalTeachingDirectory")]:
 assert previous.count(a)==1,(a,previous.count(a));previous=previous.replace(a,b)
(HERE/'predecessor-view.mjs').write_text(previous)
# Retain every actual two-book/context assertion from the previous validator.
s=(V/'verify-main-integration.mjs').read_text();s=s[:s.index('const fixture=await legacyView')]
s=s.replace("import {legacyView} from './legacy-view.mjs';","import {predecessorView} from './predecessor-view.mjs';")
s=s.replace('../../../../../../','../../../../').replace("new URL('compat-spec.json',here)","new URL('prepared.json',here)").replace('equal(checkMainSource().size,27,','equal(checkMainSource().size,29,')
s=s.replace('all67 current successors validated before27 historical normalizations','all70 current successors validated before29 historical normalizations')
s += (HERE/'integration-tail.template.mjs').read_text();(HERE/'verify-main-integration.mjs').write_text(s)
names=['checked-successor.cjs','verify-main-integration.mjs','predecessor-view.mjs','verify-main-library.mjs','verify-main-route.mjs','preparation.json']
receipt={'status':'reviewed70 exact successor; final whole verification separate','specSha256':digest,'guards':[{'file':str(BASE/f),'sha256':sha(HERE/f)} for f in names]}
(HERE/'integration.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Sealed70 source contract,29 declared normalizations, original two-book assertions, actual96 library/new48 HTTP and old2609/37/49 assertions. Isolated runtime preflight and promotion remain pending; main unchanged.')
