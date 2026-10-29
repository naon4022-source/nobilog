"""Stage the existing 75-degree image/table row inside its own answer, preserving all words."""
from pathlib import Path
import json,hashlib,shutil,sys,copy
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';U=W/'Claude原稿/M1-C5-S2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text())
back=H/'answer-previous';back.mkdir(exist_ok=True);out=H/'answer-candidate';out.mkdir(exist_ok=True)
for p in [U/'本文.md',U/'本の追加.json',R/'site-assets/textbook-book-math1.json',R/'site-assets/textbook-books.json']:
 q=back/p.name
 if q.exists():assert q.read_bytes()==p.read_bytes(),'baseline changed'
 else:shutil.copy2(p,q)
row='| 75° を「90°−15°」と考えて、15° を目分量でとる | 15° も 30° の二等分線で作図できる。目分量は使わない |'
body=(U/'本文.md').read_text();assert body.count(row)==1;body=body.replace(row+'\n','',1)
answer='例：60°＋15°＝75°。正三角形で 60° をつくり、そのとなりに、30° を二等分した 15° をつける。45°＋30°＝75° でもよい。'
before='<details><summary>答えと解説</summary>'+answer+'</details>';assert body.count(before)==1
after='<details><summary>答えと解説</summary>\n\n'+answer+'\n\n| まちがい | 正しい考え方 |\n|---|---|\n'+row+'\n\n［図 M1-C5-S2-D03（作図できる角の木）をここに表示］\n\n</details>'
body=body.replace(before,after,1);(out/'本文.md').write_text(body)
extras=load(U/'本の追加.json');entry=next(x for x in extras['media'] if x['id']=='M1-C5-S2-D03');assert entry['pid']=='M1-P225';entry['pid']='M1-P226'
entry['hide']='確認4-1の答えを先に見せない。既存画像を閉じた「答えと解説」に配置。'
(out/'本の追加.json').write_text(json.dumps(extras,ensure_ascii=False,indent=1)+'\n')
source=R/'教材整理/実装/build-textbook-book.py';code=source.read_text();needle="OUT = ROOT / 'site-assets'";assert code.count(needle)==1
code=code.replace(needle,'OUT = Path('+repr(str(out))+')')
# Keep --check's no-media-copy/no-request-write behavior, but let this isolated
# build serialize its candidate JSON instead of exiting at the comparison gate.
gate="if '--check' in sys.argv:\n    # 検証用："
assert code.count(gate)==1
code=code.replace(gate,"if False:\n    # 検証用：",1)
for name in ['kokugo1','english1','science1','geography','history','health']:
 p=R/('site-assets/textbook-book-'+name+'.json')
 if p.exists():shutil.copy2(p,out/p.name)
read=Path.read_text
def overlay(path,*args,**kwargs):
 if path==U/'本文.md':return body
 if path==U/'本の追加.json':return (out/'本の追加.json').read_bytes().decode()
 return read(path,*args,**kwargs)
try:
 Path.read_text=overlay;sys.argv=[str(source),'--check']
 exec(compile(code,str(source),'exec'),{'__file__':str(source),'__name__':'__main__'})
finally:Path.read_text=read
old=load(back/'textbook-book-math1.json');new=load(out/'textbook-book-math1.json')
assert len(old['pages'])==len(new['pages']) and old['toc']==new['toc']
changed=[a.get('pid') for a,b in zip(old['pages'],new['pages']) if a!=b];assert changed==['M1-P225','M1-P226'],changed
expected=copy.deepcopy(old)
a=next(p for p in expected['pages'] if p.get('pid')=='M1-P225');media=next(x for x in a['blocks'] if x.get('id')=='M1-C5-S2-D03');a['blocks'].remove(media)
p=next(p for p in expected['pages'] if p.get('pid')=='M1-P226');table=next(x for x in p['blocks'] if x['t']=='table');related=row.strip('|').split('|');related=[x.strip() for x in related];assert table['rows'].count(related)==1;table['rows'].remove(related)
q=next(i for i,x in enumerate(p['blocks']) if x.get('x','').startswith('**確認4-1**'));detail=p['blocks'][q+2];assert detail['t']=='details' and detail['summary']=='答えと解説'
detail['body'] += [{'t':'table','rows':[['まちがい','正しい考え方'],related]},media]
assert new==expected,'only exact image and exact comparison row may move'
assert load(out/'textbook-books.json')==load(back/'textbook-books.json')
# Existing shelf has a trailing newline; preserve its exact bytes and do not
# introduce an unrelated serialization-only change during adoption.
shutil.copy2(back/'textbook-books.json',out/'textbook-books.json')
(H/'answer-candidate-result.json').write_text(json.dumps({'status':'passed','changedSourcePages':changed,'sourcePageCount':len(new['pages']),'wordsNumbersQuestionsAnswersUnchanged':True,'moves':['existing D03 media P225 to P226 confirmation4-1 closed answer','existing 75-degree comparison row to same answer'],'bookBeforeSha256':sha(back/'textbook-book-math1.json'),'bookAfterSha256':sha(out/'textbook-book-math1.json'),'sourceBefore':{p.name:sha(p) for p in [U/'本文.md',U/'本の追加.json']},'sourceAfter':{p.name:sha(p) for p in [out/'本文.md',out/'本の追加.json']},'adopted':False},ensure_ascii=False,indent=2)+'\n')
print('Candidate: exact existing image and row moved into confirmation4-1 answer; 2 pages only; all other book data unchanged')
