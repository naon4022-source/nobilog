"""Check chapter3 typesetting against original content and replay generators in memory."""
from pathlib import Path
from unittest.mock import patch
import hashlib
import importlib
import json
import runpy
import sys
import xml.etree.ElementTree as E

H=Path(__file__).resolve().parent
R=H.parents[2]
S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
sys.path[:0]=[str(S),str(S/'図')]
helpers=[importlib.import_module('fraction_layout'),importlib.import_module('図.fraction_layout')]
D=S/'縦分数_3章_20261023'
rows=json.loads((D/'manifest.json').read_text())['items']
all_rows={}
for directory in ['縦分数_20261023','縦分数_2章_20261023','縦分数_3章_20261023']:
 all_rows.update(json.loads((S/directory/'manifest.json').read_text())['items'])
sha=lambda value:hashlib.sha256(value.encode()).hexdigest()

def replay(identity):
 captured={}
 def capture(path,text,*a,**k):captured[path.stem]=text;return len(text)
 def run():
  for name in ['図/c3.py','図/extra.py']:runpy.run_path(str(S/name))
 with patch.object(Path,'write_text',capture):
  if identity:
   with patch.object(helpers[0],'final_svg',lambda ident,value:value),patch.object(helpers[1],'final_svg',lambda ident,value:value):run()
  else:run()
 return captured

def semantic(root):
 texts=[];shapes=[]
 def walk(n):
  if 'data-stacked-fraction' in n.attrib:texts.append(n.attrib['data-stacked-fraction']);return
  tag=n.tag.rsplit('}',1)[-1]
  if tag=='text':texts.append(''.join(n.itertext()));return
  if tag in {'path','line','rect','circle','ellipse','polygon','polyline'}:shapes.append((tag,sorted(n.attrib.items())))
  for c in n:walk(c)
 walk(root);return texts,shapes

before,after=replay(True),replay(False)
assert before.keys()==after.keys()
changed=0
for ident,value in before.items():
 if ident in all_rows:
  row=all_rows[ident];assert sha(value) in {row['beforeSha256'],row.get('generatorBeforeSha256')},ident+': review changed generator baseline'
  assert sha(after[ident])==row['afterSha256'];changed+=1
 else:assert value==after[ident],ident+': unrelated generator changed'
requests=json.loads((S/'依頼台帳_1件ずつ.json').read_text())
assert len(rows)==6
for ident,row in rows.items():
 assert ident in after
 final=(D/row['file']).read_text();assert sha(final)==row['afterSha256']
 assert sha((R/row['target']).read_text())==sha((R/row['copy']).read_text())==row['afterSha256']
 assert next(x for x in requests if x['id']==ident)['sha256']==row['afterSha256']
 original=E.parse(H/'before-chapter3-fraction-integration'/row['target']).getroot()
 assert semantic(original)==semantic(E.fromstring(final)),ident+': original exact strings/shapes changed'
 for helper in helpers:
  assert helper.final_svg(ident,final)==final
  try:helper.final_svg(ident,final+'<!-- unreviewed source change -->')
  except ValueError:pass
  else:raise AssertionError(ident+': changed source not rejected')
# The answer cells in D02 are deliberately blank, including the equation whose
# solution coincides with a nearby exercise answer. A layout edit may not fill them.
original=E.parse(H/'before-chapter3-fraction-integration'/rows['M1-C3-S1-D02']['target']).getroot()
final=E.parse(D/rows['M1-C3-S1-D02']['file']).getroot()
for root in [original,final]:
 answer_cells=[n.text for n in root.iter('{http://www.w3.org/2000/svg}text') if n.attrib.get('x') in ['1380.0','1380']]
 assert answer_cells==['答え']+['x＝']*4,answer_cells
receipt=json.loads((H/'chapter3-fraction-integration.json').read_text())
assert hashlib.sha256(runpy.run_path(str(H/'reviewed_changes.py'))['logical_book_predecessor'](R/'site-assets/textbook-book-math1.json').read_bytes()).hexdigest()==receipt['bookSha256Unchanged']
print(f'Chapter3: 6 reviewed outputs reproduced; {changed-6} prior reviewed outputs retained; {len(before)-changed} unrelated outputs byte-identical. Exact semantics/shapes, 6 source/copy/ledger SHA, four blank answer cells and approved one-sentence logical-book chain passed. No output files written.')
