from pathlib import Path
import json, hashlib
from fractions import Fraction as F
root=Path(__file__).resolve().parents[2]
p=root/'教材整理/教材照合台帳.json'
rows=json.loads(p.read_text());s=next(x for x in rows if x['id']=='source-0295')
assert hashlib.sha256((root/s['file']).read_bytes()).hexdigest()==s['sha256']
s.update(verified=True,pages=[8,9],visualTitle='正の数・負の数の加法、減法②',visualReview='full-image-reviewed',reviewNote='2026-10-01 原本p8〜9を目視照合。印刷式を独立計算し手書き答案を採用しない。p9 B1(3)は分子前の符号に手書き線が重なるため採用保留。20問を原典対応として保存。独自類題の出典住所は元の学習事項を示す。')
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
u={'id':'workbook-math-1-subtraction','mode':'workbook','subject':'数学','grade':1,'title':'正の数・負の数の減法','status':'preparing','questions':[],'tests':[],'reviewNote':'原本p8〜9から読める20問を照合。B1(3)は符号に手書きが重なるため除外。100問化・確認テスト・画面接続は未完了。教科書本文は含めない。'}
items=[(8,'A1(1)','-4','-','5'),(8,'A1(2)','5','-','3'),(8,'A1(3)','2','-','7'),(8,'A1(4)','-4','-','9'),(8,'A1(5)','-3','-','5'),(8,'A2(1)','2','-','-6'),(8,'A2(2)','-5','-','-1'),(8,'A2(3)','4','-','-7'),(8,'A2(4)','-6','-','-5'),(8,'A2(5)','0','-','-9'),(9,'A3(1)','2','+','-6'),(9,'A3(2)','-5','+','9'),(9,'A3(3)','-4','+','4'),(9,'A3(4)','3','-','5'),(9,'A3(5)','6','-','-8'),(9,'A3(6)','-7','-','3'),(9,'B1(1)','-1.4','-','0.4'),(9,'B1(2)','4.6','-','-3.5'),(9,'B1(4)','1/3','-','-1/4'),(9,'B+2','-7.6','-','3.7')]
for page,ref,a,op,b in items:
 v=F(a)+F(b) if op=='+' else F(a)-F(b)
 sign='＋' if op=='+' else '−'
 prompt=f'({a}){sign}({b})を計算してください。'
 explanation=(f'引く数{b}の符号を反対にして足します。({a})＋({-F(b)})＝{v}です。' if op=='-' else f'正負の符号と絶対値を確かめて足します。({a})＋({b})＝{v}です。')
 if ref=='B+2':
  prompt='A市の最低気温は−7.6℃です。B市の最低気温がA市より3.7℃低いとき、B市の最低気温を、℃を除いた数で入力してください。'
  explanation='「低い」は引き算です。−7.6−3.7＝−11.3なので、B市は−11.3℃です。気温の差だけを答える問題ではありません。'
 u['questions'].append({'id':u['id']+'-'+str(len(u['questions'])+1),'type':'input','prompt':prompt,'answer':{'kind':'number','value':str(v)},'explanation':explanation,'source':{'id':s['id'],'file':s['file'],'sha256':s['sha256'],'page':page,'number':ref},'origin':'original','reviewed':True,'difficulty':'standard','verificationExpression':[a,op,b]})
for filename,count,is_test in [('数学1年_ワーク減法_類題.tsv',80,False),('数学1年_ワーク減法_確認テスト.tsv',15,True)]:
 lines=(root/'教材整理/確認済み'/filename).read_text().splitlines();assert len(lines)==count
 for i,line in enumerate(lines):
  prompt,kind,value,page,ref,ex=line.split('|');page=int(page)
  assert page in s['pages']
  if kind=='number':answer={'kind':'number','value':str(F(value))}
  elif kind=='exact':answer={'kind':'exact','accepted':value.split('/')}
  else:
   assert kind in ('numbers','ordered')
   answer={'kind':'numbers','values':value.split(','),'ordered':kind=='ordered'}
  target=u['tests'] if is_test else u['questions']
  q={'id':u['id']+('-test-' if is_test else '-')+str(len(target)+1),'type':'input','prompt':prompt,'answer':answer,'explanation':ex,'source':{'id':s['id'],'file':s['file'],'sha256':s['sha256'],'page':page,'number':ref},'origin':'adapted','reviewed':True,'difficulty':('basic' if i<5 else 'standard' if i<10 else 'advanced') if is_test else ('standard' if i<30 else 'advanced')}
  target.append(q)
assert len(u['questions'])==100 and len(u['tests'])==15
u['guide']=json.loads((root/'教材整理/scripts/workbook-subtraction-guide.json').read_text())
u['status']='ready'
u['reviewNote']='2026-10-01 原本p8〜9の読める20問＋独自類題80問、確認テスト15問。符号に手書きが重なるB1(3)は保留。住所は原典対応または類題元の学習事項。独立解答検証と出典検証を通過して公開バンクへ接続。教科書本文は含めない。'
(root/'教材整理/確認済み/数学1年_ワーク減法_準備中.json').write_text(json.dumps(u,ensure_ascii=False,indent=2)+'\n')
print('Verified source-0295; subtraction inputs:',len(u['questions']),'tests:',len(u['tests']))
