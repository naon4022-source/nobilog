"""点検済みSVG8枚と、未制作1枠の単一画像を反映。本文・他ページ・本棚を変更しない。"""
from pathlib import Path
import json,shutil,hashlib,sys,copy
from PIL import Image
r=Path(__file__).resolve().parents[3];t=Path(__file__).resolve().parent;w=r/'教材整理/Claude_Codex共有/数学全体制作';m=w/'メディア';load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();prev=t/'previous'
manifest=load(t/'svg-manifest.json');assert load(t/'svg-geometry-review.json')['result']=='passed'
for x in manifest:assert sha(Path(x['file']))==x['before'] and sha(Path(x['copy']))==x['before'] and sha(t/'svg'/(x['id']+'.svg'))==x['after']
ledger=w/'制作台帳.json';bookpath=r/'site-assets/textbook-book-math1.json';shelf=r/'site-assets/textbook-books.json';book_before=load(bookpath);shelf_sha=sha(shelf);assert not (prev/'制作台帳_場面反映前.json').exists()
for p,n in [(ledger,'制作台帳_場面反映前.json'),(bookpath,'textbook-book-math1_場面反映前.json'),(m/'制作ソース/依頼台帳_1件ずつ.json','依頼台帳_図8枚と場面反映前.json')]:shutil.copy2(p,prev/n)
meta=load(t/'tile-scene-generation.json');production=load(ledger);slot=next(x for x in production['imageSlots'] if x['id']==meta['slot']);assert slot['selected'] is None;candidate=next(x for x in slot['candidates'] if x['id']==meta['candidate']);assert candidate['file'] is None
slot['selected']=meta['candidate'];candidate.update(file=meta['file'],sha256=meta['sha256'],status='ユーザー指定の1枚方式で生成・Codexが条件目視確認して採用')
for c in slot['candidates']:
 if c['id']!=candidate['id']:c['status']='追加生成しない：ユーザー指定の各枠1枚方式'
ledger.write_text(json.dumps(production,ensure_ascii=False,indent=2)+'\n')
# Execute the unchanged real builder only through its generated data in --check mode.
# This avoids copying/re-encoding every unrelated asset or rewriting the shelf/request list.
builder=r/'教材整理/実装/build-textbook-book.py';code=builder.read_text();marker="\nif '--check' in sys.argv:\n    # 検証用：";assert code.count(marker)==1;env={'__file__':str(builder),'__name__':'__scoped_generation__'};saved=sys.argv[:];sys.argv=[str(builder),'--check']
try:exec(compile(code[:code.index(marker)],str(builder),'exec'),env)
finally:sys.argv=saved
expected=copy.deepcopy(book_before);pages=[p for p in expected['pages'] if p.get('pid')=='M1-P111'];assert len(pages)==1;figs=[b for b in pages[0]['blocks'] if b.get('t')=='fig' and b.get('src') is None];assert len(figs)==1;newsrc='/textbook-book-math1-m1-c2-s2-apply.jpg';figs[0]['src']=newsrc;assert env['book']==expected,'only existing P111 scene src changes; all body/problems/answers/other pages identical'
source=w/meta['file'];assert sha(source)==meta['sha256'];dest=r/('site-assets'+newsrc);assert not dest.exists(),'preserve any existing orphan asset rather than overwrite'
im=Image.open(source).convert('RGB');native=im.size;im.thumbnail((1400,1400));im.save(dest,quality=82,optimize=True);bookpath.write_text(env['data'])
for x in manifest:shutil.copy2(t/'svg'/(x['id']+'.svg'),x['file']);shutil.copy2(t/'svg'/(x['id']+'.svg'),x['copy'])
for name in ['文字を使った式の比較図を作る.py','文字式計算の比較図を作る.py','文字式利用の比較図を作る.py']:shutil.copy2(t/'svg-production/制作ソース'/name,m/'制作ソース'/name)
requests=load(m/'制作ソース/依頼台帳_1件ずつ.json');states=[]
for row in requests:
 if row['id'].startswith('M1-C2-') and row['kind']=='図解':
  p=m/(row['id']+'.svg');copyfile=r/('site-assets/textbook-book-math1-'+row['id'].lower()+'.svg');assert p.read_bytes()==copyfile.read_bytes();row.update(file=str(p.relative_to(r)),sha256=sha(p),state='2026-10-18 既存図内容/数式/隠す答え・実描画確認済み／囲み不具合8枚修正・文字数値不変／変更後4幅本内表示と全体検証待ち');states.append(row['id'])
 if row['id']==meta['slot']:row.update(file=str(source.relative_to(r)),sha256=sha(source),state='2026-10-18 未制作1枠に1枚だけ生成・条件目視採用・原稿P111の既存枠へ反映／本内4幅と全体検証待ち');row['spec']=row['spec'].replace('画像候補/M1-C2-S2-APPLY-A.jpg 〜 -D.jpg（4案。Claudeが選ぶ）','図候補/M1-C2-S2-APPLY/M1-C2-S2-APPLY-A.png（ユーザー指定の1枚方式・採用済み）')
(m/'制作ソース/依頼台帳_1件ずつ.json').write_text(json.dumps(requests,ensure_ascii=False,indent=2)+'\n');assert len(states)==25 and sha(shelf)==shelf_sha
meta.update(state='single candidate adopted and existing book frame integrated; 4-width/global checks pending',nativeSize=list(native),bookSize=list(im.size),bookFile=str(dest.relative_to(r)),bookSha256=sha(dest),page='M1-P111',conversion='unchanged builder JPEG settings, no crop or stretch');(t/'tile-scene-generation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
(t/'image-integration.json').write_text(json.dumps({'changedSvgIds':[x['id'] for x in manifest],'diagramLedgerEntriesReconciled':25,'newScene':meta,'changedSourcePages':['M1-P111'],'sourcePages':len(env['book']['pages']),'bodyProblemsAnswersUnchanged':True,'shelfUnchanged':True,'newGenerationCount':1,'published':False},ensure_ascii=False,indent=2)+'\n');print('8 exact-text SVGs + 1 new scene integrated; 25 stale diagram records reconciled; only P111 image source changed, shelf and all text untouched')
