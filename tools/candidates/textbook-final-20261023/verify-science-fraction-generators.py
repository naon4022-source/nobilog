"""SCI exact text and geometry, regenerated output, and unchanged other-book hints."""
from pathlib import Path
from unittest.mock import patch
import hashlib,importlib,json,runpy,sys,xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];G=R/'教材整理/Claude_Codex共有/教科図解';D=R/'教材整理/Claude_Codex共有/理科全体制作/メディア/制作ソース/縦分数_20261025'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();row=load(D/'manifest.json')['items']['S1-MATTER-S1-DQ'];sys.path.insert(0,str(G));hints=importlib.import_module('hints');common=importlib.import_module('common');helper=importlib.import_module('reviewed_fractions');semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];checked=0;target=None
for book in ['kokugo1','english1','science1','geography','history']:
 for code,unit,lesson in hints.lessons(book):
  for kind,fn in [('DQ',hints.dq),('DP',hints.dp)]:
   ident=code+'-'+kind;source=G.parent/common.SUBJECTS[book]['dir']/'メディア'/(ident+'.svg')
   if not source.exists():continue
   with patch.object(hints,'final_svg',lambda i,v:v):raw=fn(code,lesson)
   final=fn(code,lesson)
   if ident!='S1-MATTER-S1-DQ':assert raw==final,ident+' unrelated producer output changed';checked+=1;continue
   target=raw;assert sha(raw.encode())==row['beforeSha256'];assert sha(final.encode())==sha((D/row['file']).read_bytes())==sha((R/row['target']).read_bytes())==sha((R/row['copy']).read_bytes())==row['afterSha256']
   old_text,old_shapes=semantic(E.fromstring(raw));new_text,new_shapes=semantic(E.fromstring(final));assert old_shapes==new_shapes
   assert len(row['lineWrapChanges'])==2
   assert ''.join(x['before'] for x in row['lineWrapChanges'])==''.join(x['after'] for x in row['lineWrapChanges'])
   restored=list(new_text)
   for change in row['lineWrapChanges']:
    assert restored.count(change['after'])==1;restored[restored.index(change['after'])]=change['before']
   assert restored==old_text,'only the reviewed value-preserving two-line wrap is allowed'
assert target is not None
for changed in [target+'<!-- unreviewed -->',target.replace('1/10まで読む。','1/5まで読む。')]:
 try:helper.final_svg('S1-MATTER-S1-DQ',changed)
 except ValueError:pass
 else:raise AssertionError('unreviewed science source accepted')
original_read=Path.read_bytes
def corrupted(p):return original_read(p)+b'<!-- unreviewed -->' if p.resolve()==(D/row['file']).resolve() else original_read(p)
try:
 with patch.object(Path,'read_bytes',corrupted):helper.final_svg('S1-MATTER-S1-DQ',target)
except ValueError:pass
else:raise AssertionError('corrupt canonical source accepted')
ledger=load(D.parent/'依頼台帳_縦分数_20261025.json');assert len(ledger['items'])==1 and ledger['items'][0]['sha256']==row['afterSha256']
report={'status':'passed','target':'S1-MATTER-S1-DQ','sourceSha256':row['beforeSha256'],'finalSha256':row['afterSha256'],'otherExistingHintOutputsUnchanged':checked,'lineWrapChanges':2,'originalConcatenatedMathematicalTextPreserved':True,'originalNonTextGeometryPreserved':True,'rejectionCases':3,'teachingAssetsWritten':False}
(H/'science-generator-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('Science: exact reviewed fraction/2-row unit wrap reproduced;',checked,'other existing hint outputs unchanged; original text/geometry and source-change rejection passed')
