"""Stage relevant existing height diagram + one already-generated scene; never generates art."""
from pathlib import Path
import json,copy,hashlib,sys,shutil
from PIL import Image
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';U=W/'Claude原稿/M1-C5-S2'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n')
receipt=load(H/'post-full-verification.json');assert receipt['status']=='passed'
assert sha(R/'site-assets/textbook-book-math1.json')==receipt['bookSha256'],'capture current baseline after successful full run'
top='--scene-top' in sys.argv;variant='top' if top else 'after-text';base=H/'layout-candidate';out=base/variant;out.mkdir(parents=True,exist_ok=True)
back=H/'layout-previous';back.mkdir(exist_ok=True)
for p in [U/'本文.md',U/'本の追加.json',W/'制作台帳.json',R/'site-assets/textbook-book-math1.json',R/'site-assets/textbook-books.json',W/'原稿を読む.html',W/'原稿表示台帳.json']:
 q=back/p.name
 if q.exists():assert q.read_bytes()==p.read_bytes(),'layout baseline drift'
 else:shutil.copy2(p,q)
art=load(H/'new-apply-image/generation-receipt.json');image=R/art['workspaceFile'];assert sha(image)==art['sha256'] and art['generationCount']==1
assert not (W/'メディア/M1-C5-S2-APPLY.png').exists(),'already adopted image; do not overwrite'
body=(U/'本文.md').read_text();anchor='3. 答え **20cm²**。';assert body.count(anchor)==1
# Keep the authored text byte-identical. The existing top placement presents
# the number-free height diagram immediately before the matching example.
extras=load(U/'本の追加.json');height=next(x for x in extras['media'] if x['id']=='M1-C5-S2-DP3');assert height['pid']=='M1-P226-練習';height['pid']='M1-P225';height['at']='top'
assert not any(x['id']=='M1-C5-S2-APPLY' for x in extras['media'])
scene={'id':'M1-C5-S2-APPLY','pid':'M1-P227','kind':'scene','title':'模様を動かして比べる','content':'既存本文M1-P227の市松模様と三角形のくり返しを、紙の形を動かして比べる中学生の場面。新しい設問・数値条件は追加しない。','hide':'文字・数字・式・問題の答えを画像に入れない。','purpose':'図形の移動を身近な模様へ結び付ける'}
if top:scene['at']='top'
extras['media'].append(scene)
rules=load(base/'annotation-compatibility.json');applicable=[x for x in rules if (x['pid'] in ['M1-P225','M1-P226-練習'] or top)]
extras.setdefault('annotationCompatibility',[]).extend(applicable)
ledger=load(W/'制作台帳.json');slot=next(x for x in ledger['imageSlots'] if x['id']=='M1-C5-S2-APPLY');assert slot['selected'] is None
chosen=next(c for c in slot['candidates'] if c['id']==art['candidateId']);assert chosen['file'] is None
chosen.update(file='メディア/M1-C5-S2-APPLY.png',sha256=art['sha256'],status='1枠1枚の指示で生成した1枚・目視済み・候補配置の確認中',generationMode='built-in image_gen',promptFile=str((H/'apply-image-prompt.txt').relative_to(R)))
slot['selected']=chosen['id'];slot['localSelectionScope']='本文M1-P227に基づく場面絵1枚。教材写真全文の照合済みという意味ではない。'
write(out/'本の追加.json',extras);write(out/'制作台帳.json',ledger);(out/'本文.md').write_text(body)
source=R/'教材整理/実装/build-textbook-book.py';code=source.read_text();needle="OUT = ROOT / 'site-assets'";assert code.count(needle)==1;code=code.replace(needle,'OUT = Path('+repr(str(out))+')')
# Practice pages are assembled separately from apply_extras. Apply the same
# exact-content compatibility guard there, without inserting other extras.
start=code.index('    for rule in ex.get(\'annotationCompatibility\', []):')
end=code.index('\ndef read_practice(unit):',start)
guard=code[start:end]
code=code[:start]+'    apply_annotation_compatibility(ex, page)\n\ndef apply_annotation_compatibility(ex, page):\n    pid = page.get(\'pid\')\n'+guard+code[end:]
needle="'blocks': top + practice[p['pid']] + pmedia + summary})"
assert code.count(needle)==2
code=code.replace(needle,needle+"\n                apply_annotation_compatibility(extras.get(u, {}), pages[-1])",1)
# A staged scene is outside adopted MEDIA_DIR until after verification. Its
# eventual filename is fixed; every other frame uses the actual builder.
needle='def media_block(m):\n';assert code.count(needle)==1
code=code.replace(needle,needle+"    if m['id'] == 'M1-C5-S2-APPLY':\n        return {'t':'media','kind':m['kind'],'id':m['id'],'title':m['title'],'src':'/textbook-book-math1-m1-c5-s2-apply.jpg'}\n",1)
gate="if '--check' in sys.argv:\n    # 検証用：";assert code.count(gate)==1;code=code.replace(gate,'if False:\n    # 検証用：',1)
for name in ['kokugo1','english1','science1','geography','history','health']:
 p=R/('site-assets/textbook-book-'+name+'.json')
 if p.exists():shutil.copy2(p,out/p.name)
read=Path.read_text
def overlay(path,*a,**kw):
 if path==U/'本文.md':return body
 if path==U/'本の追加.json':return (out/'本の追加.json').read_bytes().decode()
 if path==W/'制作台帳.json':return (out/'制作台帳.json').read_bytes().decode()
 return read(path,*a,**kw)
oldargv=sys.argv
try:
 Path.read_text=overlay;sys.argv=[str(source),'--check'];exec(compile(code,str(source),'exec'),{'__file__':str(source),'__name__':'__candidate__'})
finally:Path.read_text=read;sys.argv=oldargv
# Use the existing book builder's PNG→JPEG delivery conversion unchanged.
# This is a derived delivery copy; keep the single original generated PNG.
im=Image.open(image).convert('RGB');im.thumbnail((1400,1400));im.save(out/'textbook-book-math1-m1-c5-s2-apply.jpg',quality=82,optimize=True)
old=load(back/'textbook-book-math1.json');new=load(out/'textbook-book-math1.json');assert len(old['pages'])==len(new['pages'])==441
changed=[a.get('pid') for a,b in zip(old['pages'],new['pages']) if a!=b];assert changed==['M1-P225','M1-P226-練習','M1-P227'],changed
expected=copy.deepcopy(old);p=next(p for p in expected['pages'] if p.get('pid')=='M1-P226-練習');diagram=next(x for x in p['blocks'] if x.get('id')=='M1-C5-S2-DP3');p['blocks'].remove(diagram)
p=next(p for p in expected['pages'] if p.get('pid')=='M1-P225');p['blocks'].insert(0,diagram)
p=next(p for p in expected['pages'] if p.get('pid')=='M1-P227');frame={'t':'media','kind':'scene','id':scene['id'],'title':scene['title'],'src':'/textbook-book-math1-m1-c5-s2-apply.jpg'}
if top:p['blocks'].insert(next((i for i,b in enumerate(p['blocks']) if b['t'] not in ['goal','hook']),len(p['blocks'])),frame)
else:p['blocks'].append(frame)
for rule in applicable:
 p=next(p for p in expected['pages'] if p.get('pid')==rule['pid']);matches=[b for b in p['blocks'] if b==rule['block']];assert len(matches)==1
 matches[0].update(annotationAnchor=rule['anchor'],annotationQuote=rule['quote'])
assert new==expected,'only reviewed diagram move, one scene and exact marker compatibility may change'
assert load(out/'textbook-books.json')==load(back/'textbook-books.json');shutil.copy2(back/'textbook-books.json',out/'textbook-books.json')
write(out/'candidate-result.json',{'status':'source generated; browser layout unconfirmed','variant':variant,'changedSourcePages':changed,'sourcePages':441,'bookBeforeSha256':sha(back/'textbook-book-math1.json'),'bookAfterSha256':sha(out/'textbook-book-math1.json'),'existingVideosChanged':False,'newScene':art['candidateId'],'newImageGenerations':0,'wordsQuestionsAnswersNumbersUnchanged':True,'markerCompatibilityRules':len(applicable),'integration':False})
print('Isolated layout data staged:',variant,'; existing height diagram moved and one already-generated scene; browser inspection still required')
