from pathlib import Path
from fractions import Fraction as F
import json,hashlib
root=Path(__file__).resolve().parents[2];catalog=json.loads((root/'教材整理/教材照合台帳.json').read_text())
sources={s['id']:s for s in catalog if s['id'] in ['source-0292','source-0293','source-0294']}
for s in sources.values():assert s['verified'] and hashlib.sha256((root/s['file']).read_bytes()).hexdigest()==s['sha256']
u={'id':'workbook-math-1-signed','mode':'workbook','subject':'数学','grade':1,'title':'正の数・負の数','status':'preparing','questions':[],'tests':[]}
def number(x):return {'kind':'number','value':str(F(str(x)))}
def exact(*x):return {'kind':'exact','accepted':list(x)}
def numbers(x,ordered=False):return {'kind':'numbers','values':list(map(str,x)),'ordered':ordered}
def add(prompt,answer,ex,page,ref,sid,origin='adapted'):
 s=sources[sid];u['questions'].append({'id':u['id']+'-'+str(len(u['questions'])+1),'type':'input','prompt':prompt,'answer':answer,'explanation':ex,'source':{'id':sid,'file':s['file'],'sha256':s['sha256'],'page':page,'number':ref},'origin':origin,'reviewed':True,'difficulty':'standard'})
sid='source-0292'
for i,v in enumerate([5,'1.5'],1):add(f'0℃より{v}℃低い温度を、℃を除いた数で入力してください。',number(-F(v)),'0より低い温度は負の数です。大きさに負の符号を付けます。',2,f'A1({i})',sid)
for i,(v,d) in enumerate([(13,'小さい'),(8,'大きい'),('3/4','小さい')],1):add(f'0より{v}{d}数を書いてください。',number(F(v)*(-1 if d=='小さい' else 1)),'0より小さければ負、大きければ正の数です。',2,f'A2({i})',sid)
for group,points in [(1,[('A',-3,-1),('B',2,4),('C',4,5)]),(2,[('A',-5,-4),('B',-2,0),('C',2,3)])]:
 for label,l,r in points:add(f'数直線上の点{label}は{l}と{r}のちょうど中央です。この点が表す数を書いてください。',number(F(l+r,2)),f'中央は両端の数の平均です。({l}+{r})÷2={F(l+r,2)}となります。',2,f'A3({group}){label}',sid)
for i,v in enumerate(['-4','-1/2','2','3.5'],1):
 direction='左' if F(v)<0 else '右';distance=abs(F(v));add(f'1目盛りを1とする数直線に{v}を取ります。原点からの方向と距離を「右2」のように書いてください。',exact(direction+str(distance),direction+str(float(distance))),f'負の数は左、正の数は右です。距離は絶対値{distance}です。',2,f'A4({i})',sid)
for prompt,v,ref,ex in [('600円の収入を＋600円とします。200円の支出を、円を除いた正負の数で書いてください。',-200,'A5(1)①','収入と支出は反対なので、支出には負の符号を付けます。'),('地点Aから8m北を＋8mとします。地点Aから7m南を、mを除いた正負の数で書いてください。',-7,'A5(1)②','北を正とすると、反対方向の南は負です。'),('「15g重い」を「□g軽い」と表します。□の数を書いてください。',-15,'A5(2)①','重いと軽いは反対の意味です。数の符号も反対にすると同じ意味になります。'),('「80円余る」を「□円足りない」と表します。□の数を書いてください。',-80,'A5(2)②','余ると足りないは反対の意味なので、−80円足りないとなります。'),('「125cm短い」を「□cm長い」と表します。□の数を書いてください。',-125,'A5(2)③','短いと長いの意味を逆にし、数を負にします。')]:add(prompt,number(v),ex,3,ref,sid)
values=['8','-9','5/6','0','-4.3','16','-18']
for label,predicate,ref in [('自然数',lambda x:F(x)>0 and F(x).denominator==1,1),('負の数',lambda x:F(x)<0,2),('整数',lambda x:F(x).denominator==1,3)]:
 answer=[x for x in values if predicate(x)];add('＋8、−9、5/6、0、−4.3、16、−18から'+label+'をすべて選び、読点で区切ってください。',numbers(answer),'自然数は正の整数です。0は整数で、負の数ではありません。値の種類と符号を分けて判断します。',3,f'B1({ref})',sid)
for i,n in enumerate([13,6],1):add(f'英単語を1週間に10個覚える目標に対し、実際は{n}個でした。実際の個数から目標の個数を引いた差を書いてください。',number(n-10),f'実際−目標={n}−10={n-10}です。目標未満なら負になります。',3,f'B2({i})',sid)
add('500円の利益を＋500円とします。−1000円はどのような損益ですか。「1000円の損失」のように書いてください。',exact('1000円の損失','1000円のそんしつ','1000円損する'),'利益と反対の意味なので損失です。大きさ1000円を合わせて書きます。',3,'B+3',sid)
sid='source-0293'
for i,v in enumerate(['6','-9','2.3','-1/4'],1):
 add(f'{v}の絶対値を書いてください。',number(abs(F(v))),'絶対値は原点からの距離です。距離は負になりません。',4,f'A1({i})絶対値',sid)
 add(f'{v}の符号を変えた数を書いてください。',number(-F(v)),'数の大きさを変えず、正負の符号を反対にします。絶対値を求める操作とは区別してください。',4,f'A1({i})符号',sid)
for i,(a,b) in enumerate([(-4,2),(-3,-1)],1):add(f'{a}と{b}のうち、大きい数を書いてください。',number(max(a,b)),'数直線で右側の数が大きい数です。負の数どうしなら0に近い方が大きくなります。',4,f'A2({i})',sid)
for i,a,b in [(1,'3','6'),(2,'-2','-4'),(4,'-5/9','-8/9')]:add(f'{a} □ {b}の□に入る不等号を入力してください。',exact('<' if F(a)<F(b) else '>'),'不等号の開いた側に大きい数、尖った側に小さい数が来ます。負の数は絶対値の大小と数の大小が逆です。',4,f'A3({i})',sid)
for i,start,change in [(1,-4,7),(2,3,-5),(3,-3,-2),(4,6,-3)]:add(f'数直線で{start}より{abs(change)}'+('大きい' if change>0 else '小さい')+'数を書いてください。',number(start+change),f'出発点{start}から'+('右' if change>0 else '左')+f'へ{abs(change)}進むので、答えは{start+change}です。',5,f'A4({i})',sid)
add('絶対値が3以下の整数をすべて、読点で区切って書いてください。',numbers(range(-3,4)),'「以下」は端も含みます。原点からの距離が3以内なので、−3から3までの7個です。',5,'B1(1)',sid)
for i,a,b in [(1,'-0.2','-0.02'),(2,'-1/4','-1/3')]:add(f'{a}と{b}の大小を「{a}>{b}」のように不等号で書いてください。',exact(a+('>' if F(a)>F(b) else '<')+b),'負の数では、絶対値の小さい方が大きい数です。分数なら通分して比べられます。',5,'B1(2)'+('①' if i==1 else '②'),sid)
vals=['-0.6','0.3','-1.5','0','-5/3','3/4'];ordered=sorted(vals,key=F)
add('−0.6、0.3、−1.5、0、−5/3、3/4を小さい順に並べ、読点で区切ってください。',numbers(ordered,True),'分数と小数を共通の形で比べます。−5/3は−1.666…なので、−1.5より小さくなります。',5,'B2(1)',sid)
add('−0.6、0.3、−1.5、0、−5/3、3/4の中で、絶対値が最も大きい数そのものを書いてください。',number('-5/3'),'絶対値が最大なのは5/3です。問われている数そのものは、符号を残した−5/3です。',5,'B2(2)',sid)
add('□より6大きい数は3です。□の数を書いてください。',number(-3),'□＋6＝3なので、□＝3−6＝−3です。',5,'B+3(1)',sid)
add('2より□大きい数は−4です。□の数を書いてください。',number(-6),'2＋□＝−4なので、□＝−4−2＝−6です。',5,'B+3(2)',sid)
# 原典の範囲に対応させた独自の類題。住所は元の学習事項、転記ではない。
def append_adapted_tsv(filename,is_test=False):
 rows=(root/'教材整理/確認済み'/filename).read_text().splitlines()
 assert len(rows)==(15 if is_test else 50)
 for i,row in enumerate(rows):
  prompt,kind,value,page,ref,ex=row.split('|');page=int(page)
  answer=number(value) if kind=='number' else exact(*value.split('/')) if kind=='exact' else numbers(value.split(','),kind=='ordered')
  add(prompt,answer,ex,page,ref,'source-0292' if page<=3 else 'source-0293')
  q=u['questions'][-1]
  q['difficulty']=('basic' if i<5 else 'standard' if i<10 else 'advanced') if is_test else ('advanced' if i>=25 else 'standard')
  if is_test:
   u['questions'].pop();q['id']=u['id']+'-test-'+str(i+1);u['tests'].append(q)
append_adapted_tsv('数学1年_ワーク正負の数_類題.tsv')
append_adapted_tsv('数学1年_ワーク正負の数_確認テスト.tsv',True)
assert len(u['questions'])==100 and len(u['tests'])==15
u['status']='ready'
u['guide']=json.loads((root/'教材整理/scripts/workbook-signed-guide.json').read_text())
u['reviewNote']='2026-10-01 p2〜5の照合済み学習事項から入力100問（原典対応50・独自類題50）と確認テスト15問を構成。p4 A3(3)は読めないため除外。全問に答え・解説・類題元の住所。出典と独立の解答照合を通過し、公開バンクへ接続。教科書本文は含めない。'
(root/'教材整理/確認済み/数学1年_ワーク正負の数_準備中.json').write_text(json.dumps(u,ensure_ascii=False,indent=2)+'\n')
print('fundamentals:',len(u['questions']))
u={'id':'workbook-math-1-addition','mode':'workbook','subject':'数学','grade':1,'title':'正の数・負の数の加法','status':'preparing','questions':[],'tests':[]};sid='source-0294'
for page,ref,a,b in [(6,'A1(1)','-4','-3'),(6,'A1(2)','7','2'),(6,'A1(3)','-1','-6'),(6,'A1(4)','-5','-3'),(6,'A1(5)','-9','-4'),(6,'A1(6)','-16','-4'),(6,'A2(1)','-6','2'),(6,'A2(2)','4','-3'),(6,'A2(3)','-5','8'),(6,'A2(4)','6','-9'),(6,'A2(5)','-10','2'),(6,'A2(6)','7','-18'),(7,'A3(1)','-0.4','-1.2'),(7,'A3(2)','2.1','-3.6'),(7,'A3(3)','-2/7','-3/7'),(7,'A3(4)','3/4','-2/3'),(7,'B1(1)','-23','-13'),(7,'B1(2)','-17','28'),(7,'B1(3)','8','-8'),(7,'B1(4)','-5/6','5/6'),(7,'B1(5)','-9','0')]:
 value=F(a)+F(b);add(f'({a})＋({b})を計算してください。',number(value),f'正負の符号を確かめ、必要なら通分して足します。({a})＋({b})＝{value}です。',page,ref,sid,origin='original');u['questions'][-1]['verificationExpression']=[a,'+',b]
add('2.58＋□＝0を満たす□の数を、正負の符号を含めて書いてください。',number('-2.58'),'和が0になる二つの数は、大きさが等しく符号が反対です。',7,'B+2',sid)
u['questions'][-1]['verificationExpression']=['0','-','2.58']
for filename,count,is_test in [('数学1年_ワーク加法_類題.tsv',78,False),('数学1年_ワーク加法_確認テスト.tsv',15,True)]:
 rows=(root/'教材整理/確認済み'/filename).read_text().splitlines();assert len(rows)==count
 for i,row in enumerate(rows):
  prompt,kind,value,page,ref,ex=row.split('|');page=int(page)
  answer=number(value) if kind=='number' else exact(*value.split('/')) if kind=='exact' else numbers(value.split(','),kind=='ordered')
  add(prompt,answer,ex,page,ref,sid)
  q=u['questions'][-1];q['difficulty']=('basic' if i<5 else 'standard' if i<10 else 'advanced') if is_test else ('standard' if i<32 else 'advanced')
  if is_test:
   u['questions'].pop();q['id']=u['id']+'-test-'+str(i+1);u['tests'].append(q)
assert len(u['questions'])==100 and len(u['tests'])==15
u['guide']=json.loads((root/'教材整理/scripts/workbook-addition-guide.json').read_text())
u['status']='ready'
u['reviewNote']='2026-10-01 p6〜7の印刷21問・逆算類題1問に、原典の学習事項を応用した独自類題78問と確認テスト15問を追加。全問に出典/答え/解説を付け、手書き答案は根拠にしない。別に作成した期待解答による検算、正誤/境界確認、ready検証を通過して公開バンクへ接続。教科書本文は含めない。'
(root/'教材整理/確認済み/数学1年_ワーク加法_準備中.json').write_text(json.dumps(u,ensure_ascii=False,indent=2)+'\n')
print('addition:',len(u['questions']))
