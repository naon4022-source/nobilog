"""Replay chapter2 generators in memory and check exact source/copy/ledger content."""
from pathlib import Path
from unittest.mock import patch
import hashlib,importlib,json,runpy,sys
import xml.etree.ElementTree as E
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent
S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
sys.path[:0]=[str(S),str(S/'図')]
helper=importlib.import_module('図.fraction_layout')
D=S/'縦分数_2章_20261023';rows=json.loads((D/'manifest.json').read_text())['items']
sha=lambda text:hashlib.sha256(text.encode()).hexdigest()
def capture(identity):
 outputs={}
 def write(path,text,*a,**k):outputs[path.stem]=text;return len(text)
 with patch.object(Path,'write_text',write):
  if identity:
   with patch.object(helper,'final_svg',lambda i,s:s):
    for n in ['文字を使った式の比較図を作る.py','計算のまとめ図を作る.py']:runpy.run_path(str(S/n))
  else:
   for n in ['文字を使った式の比較図を作る.py','計算のまとめ図を作る.py']:runpy.run_path(str(S/n))
 return outputs

def semantic(root):
 texts=[];shapes=[]
 def walk(n):
  if 'data-stacked-fraction' in n.attrib:texts.append(n.attrib['data-stacked-fraction']);return
  tag=n.tag.rsplit('}',1)[-1]
  if tag=='text':texts.append(''.join(n.itertext()));return
  if tag in {'path','line','rect','circle','ellipse','polygon','polyline'}:shapes.append((tag,sorted(n.attrib.items())))
  for c in n:walk(c)
 walk(root);return texts,shapes
before=capture(True)
# Old M04 generator predates a previous 25px upward text shift. Record its exact
# bytes only after proving the exact two y deltas and the prior ellipse radii.
ident='M1-C2-S2-M04';row=rows[ident]
original=E.parse(H/'before-chapter2-fraction-integration'/row['target']).getroot();baseline=E.fromstring(before[ident])
# Normalize only the known legacy ellipse dimensions for the comparison.
legacy_ellipse=baseline.find('.//{http://www.w3.org/2000/svg}ellipse')
assert legacy_ellipse.attrib['rx']=='315' and legacy_ellipse.attrib['ry']=='125'
legacy_ellipse.set('rx','295');legacy_ellipse.set('ry','113')
assert semantic(original)==semantic(baseline)
ns='{http://www.w3.org/2000/svg}';deltas=[]
for a,b in zip(original.iter(ns+'text'),baseline.iter(ns+'text')):
 aa,bb=dict(a.attrib),dict(b.attrib)
 if aa!=bb:
  expected={'(3x−1)/4×8 を':('375','400'),'3x−1×2 とする':('450','475')}[''.join(a.itertext())]
  assert (aa.pop('y'),bb.pop('y'))==expected
  assert aa==bb;deltas.append(''.join(a.itertext()))
assert deltas==['(3x−1)/4×8 を','3x−1×2 とする']
assert row['generatorBeforeSha256']==sha(before[ident])
after=capture(False);assert before.keys()==after.keys()
for ident,text in before.items():
 if ident in rows:
  row=rows[ident];assert sha(text) in {row['beforeSha256'],row.get('generatorBeforeSha256')};assert sha(after[ident])==row['afterSha256']
 else:assert text==after[ident],ident
requests=json.loads((S/'依頼台帳_1件ずつ.json').read_text())
for ident,row in rows.items():
 final=(D/row['file']).read_text();assert sha(final)==row['afterSha256']
 assert sha((R/row['target']).read_text())==sha((R/row['copy']).read_text())==row['afterSha256']
 assert next(x for x in requests if x['id']==ident)['sha256']==row['afterSha256']
 assert semantic(E.parse(H/'before-chapter2-fraction-integration'/row['target']).getroot())==semantic(E.fromstring(final))
 try:helper.final_svg(ident,final+'<!-- unreviewed source change -->')
 except ValueError:pass
 else:raise AssertionError('must reject any unreviewed source change')

receipt=json.loads((H/'chapter2-fraction-integration.json').read_text());assert hashlib.sha256(runpy.run_path(str(H/'reviewed_changes.py'))['logical_book_predecessor'](R/'site-assets/textbook-book-math1.json').read_bytes()).hexdigest()==receipt['bookSha256Unchanged']
print(f'Chapter2: 3 reviewed generator outputs reproduced; {len(before)-3} other outputs byte-identical; semantic strings/shapes, sources/copies/ledger hashes and approved one-sentence logical-book chain passed. No files generated.')
