from pathlib import Path
from fractions import Fraction as F
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
u={'id':'drill-math-1-signed','mode':'drill','subject':'数学','grade':1,'title':'正負の数','status':'ready','questions':[],'tests':[],'reviewNote':'原画像p2〜3の全小問を入力用に構成。作図は位置の説明を入力する形式へ変更。原典対応29問、類題71問。'}
file='ドリル/数学/S__15589387_0.jpg'
source=next(s for s in json.loads((ROOT/'教材照合台帳.json').read_text()) if s['file']==file)
assert source['verified'] and source['grade']==1 and source['pages']==[2,3]
assert hashlib.sha256((ROOT.parent/file).read_bytes()).hexdigest()==source['sha256']
def num(v):return {'kind':'number','value':str(v)}
def exact(*a):return {'kind':'exact','accepted':list(a)}
def numbers(v,ordered=False):return {'kind':'numbers','values':list(map(str,v)),'ordered':ordered}
def add(prompt,a,ex,page,number,origin='adapted',target=None,level='standard'):
 target=u['questions'] if target is None else target
 q={'id':u['id']+('-test-' if target is u['tests'] else '-')+str(len(target)+1),'type':'input','prompt':prompt,'answer':a,'explanation':ex,'source':{'id':source['id'],'file':file,'sha256':source['sha256'],'page':page,'number':number},'origin':origin,'reviewed':True,'difficulty':level}
 target.append(q)
add('−1.5、8、−3、＋10、−0.9、1/5、0、−3/7の中から整数をすべて選び、読点で区切って書いてください。',numbers([8,-3,10,0]),'整数は…、−2、−1、0、1、2、…という数です。分数で書かれていても、割り切れて整数の値になる場合は整数です。この一覧では8、−3、＋10、0が当てはまります。',2,'1①')
add('−1.5、8、−3、＋10、−0.9、1/5、0、−3/7の中から自然数をすべて選び、読点で区切って書いてください。',numbers([8,10]),'この教材で自然数とは1、2、3、…という正の整数です。0を含めません。',2,'1②')
for label,v,desc in [('A',-3,'−5と−1の中央'),('B',-1.5,'−2と−1の中央'),('C',.5,'0と＋1の中央')]:add(f'数直線上の点{label}は{desc}にあります。点{label}が表す数を書いてください。',num(v),'等間隔の目盛りから、中央の位置の値を求めます。',2,'2'+label)
for label,v in [('D','3.5'),('E','-5/2'),('F','-9/2'),('G','-9/2')]:
 direction='右' if F(v)>0 else '左';distance=str(abs(F(v)))
 add(f'数直線に点{label}（{v}）を取ります。原点から左右どちらに、何目盛り進みますか。1目盛りを1として「右3.5」のように入力してください。',exact(direction+str(float(abs(F(v)))),direction+distance),f'{v}は{direction}側です。原点からの距離は絶対値{distance}です。',2,'2'+label)
for raw,out in [('−7増える','7減る'),('−3減る','3増える'),('−6大きい','6小さい'),('−4小さい','4大きい')]:add(f'「{raw}」を、負の数を使わない言い方に直してください。',exact(out),'負の符号を外すときは、言葉も反対の意味に変えます。',2,'3-'+str(len(u['questions'])-8))
for i,v in enumerate(['-6','7','-4.5','3/8'],1):add(f'{v}の絶対値を書いてください。',num(abs(F(v))),'絶対値は原点からの距離なので、負になりません。',3,f'4-{i}',origin='original')
for prompt,v,ref in [('0の絶対値を書いてください。',0,'5-1'),('絶対値が4である正の数を書いてください。',4,'5-2①'),('絶対値が4である負の数を書いてください。',-4,'5-2②'),('絶対値が5より小さい整数は全部で何個ありますか。',9,'5-3')]:add(prompt,num(v),'絶対値が5より小さい整数は−4から4までです。' if v==9 else '絶対値は0からの距離です。正負の条件も確かめます。',3,ref)
for i,values in enumerate([['-1.1','-2'],['-1/6','-6'],['0','3','-1'],['-1/2','-1/4','-1/3']],1):
 sortedv=sorted(values,key=F);add('次の数を小さい順に、読点で区切って書いてください：'+ '、'.join(values),numbers(sortedv,True),'負の数は、絶対値が大きいほど小さくなります。答え：'+'、'.join(sortedv),3,f'6-{i}')
for i,values in enumerate([['-3','2','2.4','0','7','-3.6'],['1','-1/2','-4','1/4','12/5','-6/3']],1):
 sortedv=sorted(values,key=F);add('次の6個の数を小さい順に並べ、読点で区切ってください：'+'、'.join(values),numbers(sortedv,True),'分数を小数に直すと比較しやすくなります。答え：'+'、'.join(sortedv),3,f'7-{i}')
for v in [7,-3]:
 direction='東' if v>0 else '西';add(f'地点Aから東を正とするとき、{v:+d}kmはAからどちらへ何kmの地点ですか。「東4km」のように入力してください。',exact(f'{direction}{abs(v)}km',f'{direction}に{abs(v)}km',f'{direction}{abs(v)}キロメートル'),'東が正なら、負の数は西の地点を表します。',3,'8-1' if v>0 else '8-2')
assert len(u['questions'])==29,len(u['questions'])
def load_authored(name,target,count):
 rows=(ROOT/'確認済み'/name).read_text().splitlines()
 assert len(rows)==count
 for i,row in enumerate(rows):
  prompt,page,ref,kind,value,ex=row.split('|')
  if kind=='number':answer=num(value)
  elif kind=='exact':answer=exact(*value.split(';'))
  elif kind in ('ordered','numbers'):answer=numbers(value.split(','),kind=='ordered')
  else:raise ValueError(kind)
  level=('basic' if i<5 else 'standard' if i<10 else 'advanced') if target is u['tests'] else 'standard'
  add(prompt,answer,ex,int(page),ref,target=target,level=level)
load_authored('正負の数_追加問題.tsv',u['questions'],71)
load_authored('正負の数_確認テスト.tsv',u['tests'],15)
assert len(u['questions'])==100 and len(u['tests'])==15
u['reviewNote']='2026-10-01 原画像p2〜3を照合。原典対応29問＋条件・問い方を変えた類題71問。確認テスト15問は基礎5・標準5・発展5。図の作図は位置の説明を入力する形式へ変更。教科書本文は含めない。'
u['guide']=[
 {'title':'整数と自然数を見分ける','body':'整数は…、−2、−1、0、1、2、…です。自然数はこの教材では正の整数だけを指します。まず分数や小数の値を確かめ、その後で整数か、正の整数かを判断します。例：6/3は2なので自然数、−6/3は−2なので整数ですが自然数ではありません。0は整数で、自然数ではありません。'},
 {'title':'数直線は方向と1目盛りを分ける','body':'原点の右が正、左が負です。先に隣り合う目盛りの差を確認してください。例：0と2の間を4等分すると1区間は0.5です。原点から左へ3区間なら、距離は1.5、表す数は−1.5になります。距離を聞かれたら正の1.5、位置の数を聞かれたら−1.5と答えます。'},
 {'title':'絶対値は原点からの距離','body':'絶対値は0以上で、負にはなりません。−3/4の絶対値は3/4です。「絶対値が2」という条件だけなら−2と2の二つが候補です。「負の数」「右側」などの追加条件を使って一つに絞ります。絶対値が0になる数は0だけです。'},
 {'title':'負の数の大小を比べる','body':'数直線の右にある数ほど大きくなります。負の数どうしでは、絶対値が小さい方が大きな数です。例：−3/4＝−9/12、−2/3＝−8/12です。−8/12の方が0に近いので、−2/3の方が大きい数です。「大きい順」と「絶対値が大きい順」は別の指定なので、問題文を読み直しましょう。'},
 {'title':'範囲・個数・反対の意味','body':'「以上・以下」は端の数を含み、「より大きい・より小さい・未満」は端を含みません。例：絶対値が2未満の整数は−1、0、1の3個です。絶対値が2以下なら−2と2も入り5個です。負の数を使わない言い方では、符号と言葉の向きを両方変えます。例：「−3増える」は「3減る」です。答えは指定された方向・順番・個数も確認してください。'}
]
(ROOT/'確認済み/数学1年_正負の数.json').write_text(json.dumps(u,ensure_ascii=False,indent=2)+'\n')
print('Math: 100 practice, 15 tests; source SHA-256 verified')
