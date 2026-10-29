"""Replay the two appendix image producers without writing teaching assets."""
from pathlib import Path
from unittest.mock import patch
import hashlib,importlib,json,runpy,sys
import xml.etree.ElementTree as E
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=S/'縦分数_巻末_20261025'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();rows=load(D/'manifest.json')['items'];assert len(rows)==5
sys.path[:0]=[str(S),str(S/'図')];helpers=[importlib.import_module('fraction_layout'),importlib.import_module('図.fraction_layout')];original=helpers[0].final_svg

def replay(raw):
 out={}
 def capture(p,value,*a,**k):assert p.stem not in out;out[p.stem]=value;return len(value)
 def handler(ident,value):return value if ident in rows else original(ident,value)
 with patch.object(Path,'write_text',capture):
  if raw:
   with patch.object(helpers[0],'final_svg',handler),patch.object(helpers[1],'final_svg',handler):
    for name in ['図/c4.py','図/app.py']:runpy.run_path(str(S/name))
  else:
   for name in ['図/c4.py','図/app.py']:runpy.run_path(str(S/name))
 return out
before,after=replay(True),replay(False);assert before.keys()==after.keys();semantic=runpy.run_path(str(H/'reviewed_changes.py'))['semantic'];requests=load(S/'依頼台帳_1件ずつ.json')
for ident,value in before.items():
 if ident not in rows:assert value==after[ident],ident+' unrelated current approved output changed';continue
 row=rows[ident];assert sha(value.encode())==row['beforeSha256'];assert sha(after[ident].encode())==sha((D/row['file']).read_bytes())==sha((R/row['target']).read_bytes())==sha((R/row['copy']).read_bytes())==row['afterSha256'];assert semantic(E.fromstring(value))==semantic(E.fromstring(after[ident]));assert next(x for x in requests if x['id']==ident)['sha256']==row['afterSha256']
 for helper in helpers:
  try:helper.final_svg(ident,value+'<!-- unreviewed -->')
  except ValueError:pass
  else:raise AssertionError(ident+' unreviewed source accepted')
report={'status':'passed','reviewedOutputs':5,'unrelatedCurrentOutputsByteIdentical':len(before)-5,'sourceSha256':{i:sha(before[i].encode()) for i in rows},'generators':{name:sha((S/name).read_bytes()) for name in ['図/c4.py','図/app.py']},'teachingAssetsWritten':False}
(H/'appendix-generator-result.json').write_text(json.dumps(report,indent=2)+'\n');print('Appendix:5 reviewed outputs reproduced;',len(before)-5,'current other outputs unchanged; source/copy/ledger, exact text/shapes and source-change rejection passed')
