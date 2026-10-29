from pathlib import Path
import json,hashlib
R=Path('/Users/shimizunaotomoo/Desktop/my-app');H=R/'tools/candidates/textbook-final-20261023';S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';D=S/'縦分数_2章_20261023'
sha=lambda b:hashlib.sha256(b).hexdigest()
items=json.loads((H/'chapter2-fraction-candidate/manifest.json').read_text())['items'];reqpath=S/'依頼台帳_1件ずつ.json';req=json.loads(reqpath.read_text());changes=[];rows={}
assert not D.exists()
for row in items:
 ident=row['id'];data=(H/'chapter2-fraction-candidate'/row['file']).read_bytes();assert sha(data)==row['afterSha256'];target=S.parents[0]/(ident+'.svg');copy=R/'site-assets'/row['file']
 for path in [target,copy]:
  assert sha(path.read_bytes())==row['beforeSha256'],str(path)
  changes.append((path,data))
 request=next(x for x in req if x['id']==ident);assert request['sha256']==row['beforeSha256'];request.update(sha256=row['afterSha256'],layoutRevision='2026-10-23: stacked fractions, exact original formulas and geometry')
 rows[ident]={**row,'target':str(target.relative_to(R)),'copy':str(copy.relative_to(R)),'file':ident+'.svg','status':'reviewed SVG; integration checks pending'}
changes.append((reqpath,(json.dumps(req,ensure_ascii=False,indent=2)+'\n').encode()))
backup=H/'before-chapter2-fraction-integration';assert not backup.exists();booksha=sha((R/'site-assets/textbook-book-math1.json').read_bytes())
for path,data in changes:
 dest=backup/path.relative_to(R);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(path.read_bytes())
D.mkdir()
for row in items:(D/(row['id']+'.svg')).write_bytes((H/'chapter2-fraction-candidate'/row['file']).read_bytes())
(D/'manifest.json').write_text(json.dumps({'items':rows},ensure_ascii=False,indent=2)+'\n')
for path,data in changes:path.write_bytes(data)
assert sha((R/'site-assets/textbook-book-math1.json').read_bytes())==booksha
(H/'chapter2-fraction-integration.json').write_text(json.dumps({'diagrams':3,'bookSha256Unchanged':booksha,'registry':str((D/'manifest.json').relative_to(R)),'status':'integrated locally; current-book checks pending'},ensure_ascii=False,indent=2)+'\n')
(H/'chapter2-fraction-visual-review.json').write_text(json.dumps({'allThreeFinalScreensViewed':True,'review':'Parenthesized numerator and external multiplication preserved; no row overlap or clipping observed.','items':[{'id':r['id'],'svgSha256':r['afterSha256'],'pngSha256':sha((H/'chapter2-fraction-candidate'/(r['id']+'.png')).read_bytes())} for r in items]},ensure_ascii=False,indent=2)+'\n')
print('Integrated 3 reviewed chapter2 SVG layouts, original sources/copies/request hashes; logical book unchanged; backups retained.')
