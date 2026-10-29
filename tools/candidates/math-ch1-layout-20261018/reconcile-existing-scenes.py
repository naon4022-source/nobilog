"""既存選定3枠の実物・変換コピーを照合し、旧未制作の依頼台帳だけを修正する。素材は変更しない。"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import shutil
from PIL import Image
root=Path(__file__).resolve().parents[3]
here=Path(__file__).resolve().parent
work=root/'教材整理/Claude_Codex共有/数学全体制作'
ids={'M1-C1-S1-APPLY','M1-C1-S3-INTRO','M1-C1-S3-APPLY'}
load=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
slots={x['id']:x for x in load(work/'制作台帳.json')['imageSlots'] if x['id'] in ids}
book=load(root/'site-assets/textbook-book-math1.json')
ledger=work/'メディア/制作ソース/依頼台帳_1件ずつ.json'
rows=load(ledger)
results=[]
for ident in sorted(ids):
 slot=slots[ident];candidate=next(x for x in slot['candidates'] if x['id']==slot['selected'])
 source=work/candidate['file'];source_bytes=source.read_bytes();assert sha(source_bytes)==candidate['sha256'],ident+' candidate SHA'
 expected='/textbook-book-math1-'+ident.lower()+'.jpg'
 found=[(p,b) for p in book['pages'] for b in p.get('blocks',[]) if b.get('t')=='fig' and b.get('src')==expected]
 assert len(found)==1,ident+' one figure in actual book'
 p,b=found[0];copy=root/('site-assets'+expected);copy_bytes=copy.read_bytes()
 im=Image.open(source).convert('RGB');im.thumbnail((1400,1400));stream=BytesIO();im.save(stream,format='JPEG',quality=82,optimize=True)
 assert stream.getvalue()==copy_bytes,ident+' book JPG is exact existing selected image conversion'
 row=next(x for x in rows if x['id']==ident);before=dict(row)
 row.update(file=str(source.relative_to(root)),sha256=candidate['sha256'],location='原稿 '+p['pid'],state='2026-10-18 既存候補'+candidate['id']+'採用・本内参照/変換コピー一致・場面条件目視済み／重複生成なし／公開なし')
 results.append({'id':ident,'selected':candidate['id'],'source':str(source.relative_to(root)),'sourceSha256':sha(source_bytes),'bookCopy':str(copy.relative_to(root)),'bookSha256':sha(copy_bytes),'sourcePage':p['pid'],'conversion':'existing builder exact JPEG bytes','visualReview':'既存3画像を目視。温度計は両方基準以下かつ右が低い、5人の通学は時計の時刻なし、5山の積み木に手と点線。数値の答えなし。','before':before})
backup=here/'previous/依頼台帳_既存場面3枠照合前.json'
assert not backup.exists(),'do not repeat reconciliation'
shutil.copy2(ledger,backup)
ledger.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
(here/'existing-scenes.json').write_text(json.dumps({'date':'2026-10-18','count':3,'generated':0,'assetsChanged':False,'items':results},ensure_ascii=False,indent=2)+'\n')
p=here/'integrated-sha.json';hashes=load(p);hashes[str(ledger.relative_to(root))]=sha(ledger.read_bytes());p.write_text(json.dumps(hashes,ensure_ascii=False,indent=2)+'\n')
print('3 existing selected scenes: source SHA, exact converted book copy and unique references confirmed; old request states corrected; zero generation')
