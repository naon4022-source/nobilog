"""Real builder, read-only inputs overridden for one figure move. App writes are intercepted."""
from pathlib import Path
from unittest.mock import patch
import json,hashlib,sys,contextlib,io
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent;OUT=H/'layout-candidate';OUT.mkdir(exist_ok=True)
builder=R/'教材整理/実装/build-textbook-book.py';md=R/'教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-C3-S2/本文.md'
old=md.read_text();line='［図 M1-C3-S2-FIG01：折り紙の過不足を、2本の線分図で表す（6枚ずつ→15枚余り、8枚ずつ→9枚足りない）］';anchor='### 過不足の問題の見方（FIG01）'
assert old.count(line)==old.count(anchor)==1
new=old.replace(line+'\n\n','',1).replace(anchor,line+'\n\n'+anchor,1)
(OUT/'本文.md').write_text(new)
extra=md.with_name('本の追加.json');extra_candidate=(OUT/'本の追加.json').read_text();read_text=Path.read_text;writes={};namespace={'__file__':str(builder),'__name__':'candidate_layout'};messages=io.StringIO()
def read(p,*a,**kw):
 if p.resolve()==md:return new
 if p.resolve()==extra:return extra_candidate
 return read_text(p,*a,**kw)
def write(p,text,*a,**kw):writes[str(p.resolve())]=text;return len(text)
with patch.object(Path,'read_text',read),patch.object(Path,'write_text',write),patch.object(sys,'argv',[str(builder),'--check']),contextlib.redirect_stdout(messages):
 try:exec(compile((OUT/'build-textbook-book.py').read_text(),str(builder),'exec'),namespace)
 except SystemExit as e:assert e.code==0
assert not writes,'--check must not attempt app writes'
book=namespace['book'];current=json.loads((R/'site-assets/textbook-book-math1.json').read_text());changes=[]
assert book.keys()==current.keys() and len(book['pages'])==len(current['pages'])
for a,b in zip(current['pages'],book['pages']):
 if a!=b:
  changes.append(a.get('pid'));assert a.get('pid')==b.get('pid')=='M1-P147'
  assert {k:v for k,v in a.items() if k!='blocks'}=={k:v for k,v in b.items() if k!='blocks'}
  assert sorted(json.dumps({k:v for k,v in x.items() if k not in ['annotationAnchor','annotationQuote']},sort_keys=True) for x in a['blocks'])==sorted(json.dumps({k:v for k,v in x.items() if k not in ['annotationAnchor','annotationQuote']},sort_keys=True) for x in b['blocks'])
assert changes==['M1-P147']
assert {k:v for k,v in book.items() if k!='pages'}=={k:v for k,v in current.items() if k!='pages'}
(OUT/'book.json').write_text(namespace['data'])
(OUT/'builder-message.txt').write_text(messages.getvalue())
(OUT/'manifest.json').write_text(json.dumps({'change':'Move existing FIG01 immediately before its related heading within the same source page; only block order changes','source':str(md.relative_to(R)),'sourceBefore':hashlib.sha256(old.encode()).hexdigest(),'sourceAfter':hashlib.sha256(new.encode()).hexdigest(),'changedPages':changes,'currentBookSha256':hashlib.sha256((R/'site-assets/textbook-book-math1.json').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
print('Candidate only: FIG01 moved within M1-P147; all 441 source pages and every block text/value preserved; no app writes')
