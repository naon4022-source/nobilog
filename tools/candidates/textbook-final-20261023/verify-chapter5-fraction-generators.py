"""In-memory chapter5 replay: three exact typesettings, all other outputs identical."""
from pathlib import Path
from unittest.mock import patch
import hashlib,importlib,json,runpy,sys
import xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=S/'縦分数_5章_20261024'
load=lambda p:json.loads(p.read_text());sha=lambda v:hashlib.sha256(v).hexdigest()
rows=load(D/'manifest.json')['items'];assert len(rows)==3
sys.path[:0]=[str(S),str(S/'図')];helpers=[importlib.import_module('fraction_layout'),importlib.import_module('図.fraction_layout')]
def replay(raw):
 captured={}
 def capture(path,value,*a,**kw):
  assert path.stem not in captured;captured[path.stem]=value;return len(value)
 with patch.object(Path,'write_text',capture):
  if raw:
   with patch.object(helpers[0],'final_svg',lambda i,v:v),patch.object(helpers[1],'final_svg',lambda i,v:v):runpy.run_path(str(S/'図/c5.py'))
  else:runpy.run_path(str(S/'図/c5.py'))
 return captured
before,after=replay(True),replay(False);assert before.keys()==after.keys();requests=load(S/'依頼台帳_1件ずつ.json');semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic']
for ident,value in before.items():
 if ident not in rows:assert value==after[ident],ident+' unrelated output changed';continue
 row=rows[ident];assert sha(value.encode())==row['beforeSha256'];final=D/row['file'];assert sha(final.read_bytes())==sha(after[ident].encode())==sha((R/row['target']).read_bytes())==sha((R/row['copy']).read_bytes())==row['afterSha256']
 assert semantic(E.fromstring(value))==semantic(E.parse(final).getroot())
 assert next(x for x in requests if x['id']==ident)['sha256']==row['afterSha256']
 for helper in helpers:
  try:helper.final_svg(ident,value+'<!-- unreviewed -->')
  except ValueError:pass
  else:raise AssertionError(ident+' unreviewed change accepted')
report={'status':'passed','reviewedOutputs':3,'unrelatedByteIdentical':len(before)-3,'sourceSha256':{i:sha(before[i].encode()) for i in rows},'teachingAssetsWritten':False}
(H/'chapter5-generator-result.json').write_text(json.dumps(report,indent=2)+'\n');print('Chapter5:3 reviewed outputs reproduced;',len(before)-3,'unrelated outputs byte-identical; source/copy/ledger, semantic preservation and rejection checks passed')
