# coding: utf-8
from pathlib import Path
from unittest.mock import patch
import json,hashlib
R=Path.cwd();B=R/'tools/candidates/math-history-toolbar-20261029';target=R/'tools/candidates/textbook-final-20261023/reviewed_changes.py'
checks=0
def check(v):
 global checks
 assert v;checks+=1
def namespace(name):
 d={'__file__':str(target),'__name__':'isolated_toolbar_candidate'};exec(compile((B/name).read_text(),str(target),'exec'),d);return d
old=namespace('reviewed_changes.before.py');candidate=namespace('reviewed_changes.candidate.py');relative='site-assets/textbook-book.js'
try:old['before_zoom_file'](relative)
except AssertionError:checks+=1
else:raise AssertionError('Expected original metadata chain failure was not reproduced')
previous=candidate['before_toolbar_file'](relative,R/relative);check(candidate['sha'](previous)=='074e74171666d5e24eeefd05ea8adcb7c914a9670511d51a3abe6a95390c32d1')
result=candidate['before_zoom_file'](relative);expected=next(row for row in candidate['load'](candidate['H']/'zoom-exact-edits.json')['files']if row['file']==relative);check(candidate['sha'](result)==expected['beforeSha256'])
check(candidate['before_toolbar_file']('index.html',R/'index.html')==R/'index.html')
original=Path.read_bytes
for file in [R/relative,previous,candidate['H']/'remaining-alignment-20261028/answer-safe-v2/main/compat-spec.json']:
 def mutated(self,*a,**k):
  data=original(self,*a,**k)
  return data+b'\nsynthetic unrelated mutation\n' if self==file else data
 with patch.object(Path,'read_bytes',mutated):
  try:candidate['before_toolbar_file'](relative,R/relative)
  except AssertionError:checks+=1
  else:raise AssertionError('Unrelated mutation accepted: '+str(file))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
inputs=[]
for p in [target,B/'reviewed_changes.candidate.py',B/'patch.json',R/relative,previous,candidate['H']/'remaining-alignment-20261028/answer-safe-v2/main/compat-spec.json']:
 inputs.append({'file':str(p.relative_to(R)),'sha256':sha(p)})
(B/'result.json').write_text(json.dumps({'status':'passed isolated readonly toolbar predecessor bridge','checks':checks,'oldFailureReproduced':True,'completeZoomChainPassed':True,'mainChanged':False,'inputs':inputs,'scope':'Original failure reproduced; candidate replays the exact approved toolbar line then all original metadata/handwriting/fraction/zoom checks. Actual bytes, reviewed predecessor and receipt tampering refused in memory. No canonical file or verification output writes.'},indent=2)+'\n')
print(str(checks)+' readonly checks passed; original failure reproduced and complete zoom chain validated.')
