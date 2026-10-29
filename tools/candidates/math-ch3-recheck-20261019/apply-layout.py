"""Apply one reviewed figure move with exact marker compatibility; retain previous sources and book."""
from pathlib import Path
import hashlib,json,shutil
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent;C=H/'layout-candidate';W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=load(C/'manifest.json');anchors=load(C/'annotation-result.json');book=R/'site-assets/textbook-book-math1.json';md=R/manifest['source'];extras=md.with_name('本の追加.json');builder=R/'教材整理/実装/build-textbook-book.py'
assert sha(md)==manifest['sourceBefore'] and sha(book)==manifest['currentBookSha256']==anchors['beforeBookSha256']
assert anchors['status']=='passed' and anchors['anchors']==2724 and sha(C/'book.json')==anchors['candidateBookSha256']
before=md.read_text();after=(C/'本文.md').read_text();assert sha(C/'本文.md')==manifest['sourceAfter']
assert sorted(before.splitlines())==sorted(after.splitlines()),'no line text or value changes, only figure line moves'
oldextra=load(extras);newextra=load(C/'本の追加.json');assert 'annotationCompatibility' not in oldextra
assert oldextra=={k:v for k,v in newextra.items() if k!='annotationCompatibility'} and len(newextra['annotationCompatibility'])==8
oldbuilder=builder.read_text();newbuilder=(C/'build-textbook-book.py').read_text();start=newbuilder.index('    # Moving an unchanged source block');end=newbuilder.index('\ndef read_practice(unit):',start)
assert [l for l in oldbuilder.splitlines() if l.strip()]==[l for l in (newbuilder[:start]+newbuilder[end:]).splitlines() if l.strip()],'only explicit unchanged-block compatibility added (apart from blank lines)'
backup=H/'layout-previous';assert not backup.exists(),'one apply only';backup.mkdir()
targets=[md,extras,builder,book,W/'制作台帳.json',S/'依頼台帳_1件ずつ.json',S/'69本_制作進捗.json',W/'メディアの置き場所.json']
for p in targets:
 dest=backup/p.relative_to(R);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
for source,dest in [(C/'本文.md',md),(C/'本の追加.json',extras),(C/'build-textbook-book.py',builder),(C/'book.json',book)]:shutil.copy2(source,dest)
result={'date':'2026-10-19','source':'M1-P147','media':'M1-C3-S2-FIG01','change':'existing figure moved before related explanation in same source page','sourceBefore':manifest['sourceBefore'],'sourceAfter':sha(md),'bookBefore':manifest['currentBookSha256'],'bookAfter':sha(book),'anchorsPreserved':2724,'explicitCompatibilityBlocks':8,'sourcePages':441,'expectedPhysicalPages':652,'newImagesGenerated':0,'videoBytesChanged':False,'fullSuite':'pending after layout move','backup':str(backup.relative_to(R))}
(H/'layout-integration.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('One existing figure moved locally, 2724 note identities preserved; text/values/media bytes unchanged; post-layout checks pending')
