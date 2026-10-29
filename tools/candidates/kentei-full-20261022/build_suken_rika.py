# 数検5級・4級・3級（1次30＋2次20＝50問）と理科検定5級（20問）を、本番と同じ問題数に組み直す（2026-10-22 Claude）。
# 前の原稿の問題は文を変えずに使い、やさしいものを外し、難しめの独自問題を足す。答えは下で検算する。
import json,pathlib,hashlib
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[3];D=R/'教材整理/特訓下書き/検定原稿';OUT=pathlib.Path(__file__).parent
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
def src(f):return {'id':None,'file':f,'sha256':sha(f),'page':1,'number':'形式とレベルの参考（問題はClaudeの独自作成）'}
def X(v):return ['x='+v,'x＝'+v,v]+(['x=−'+v[1:],'x＝−'+v[1:]] if v.startswith('-') else [])
def num(v,units=None):a={'kind':'number','value':v};
def mk(section,prompt,answer,explanation,file):return {'type':'input','section':section,'role':'確認','prompt':prompt,'answer':answer,'explanation':explanation,'source':src(file),'origin':'original','reviewed':True}
def N(v,units=None):return {'kind':'number','value':v,**({'units':units} if units else {})}
def assemble(level,old,first,second,new1,new2,f1,f2,minutes,note):
  d=json.loads((D/f'数検/kentei-suken-{level}.json').read_text(encoding='utf-8'));q=d['questions']
  p1=[dict(q[i-1],part='1次（計算技能）') for i in first]+[dict(mk(s,p,a,e,f1),part='1次（計算技能）') for s,p,a,e in new1]
  p2=[dict(q[i-1],part='2次（数理技能）') for i in second]+[dict(mk(s,p,a,e,f2),part='2次（数理技能）') for s,p,a,e in new2]
  assert len(p1)==30 and len(p2)==20,(level,len(p1),len(p2))
  out=[dict(x,id=f'kentei-suken-{level}-{i+1}') for i,x in enumerate(p1+p2)]
  assert len({x['prompt'] for x in out})==50
  unit={k:d[k] for k in ['id','bank','kentei','level']};unit.update({'title':f'数検{level}級 模擬検定（独自問題）','status':'draft',
   'exam':{'parts':[{'name':'1次（計算技能）','count':30,'minutes':50,'passRate':0.7},{'name':'2次（数理技能）','count':20,'minutes':60,'passRate':0.6}],'passNote':'合格のめやすは1次70％・2次60％（日本数学検定協会の基準）'},
   'questions':out,'reviewNote':d['reviewNote']+' 2026-10-22 Claude：本番と同じ1次30問・2次20問に組み直した。'+note})
  (OUT/f'kentei-suken-{level}.json').write_text(json.dumps(unit,ensure_ascii=False,indent=1),encoding='utf-8');print('suken',level,len(out))
# ---- 5級 ----
assert F(-9)-F(-8)*F(1,4)==-7 and F(-6,10)/F(3,10)-F(-3,2)*4==4
assert F(48).limit_denominator()==48
import math;assert math.gcd(48,72,120)==24 and F(12*5,8)==F(15,2)
x=F(-5);assert F(2,10)*(x-3)==F(5,10)*x+F(9,10)
f1='数検/5q_que_1ji.pdf';f2='数検/5q_que_2ji.pdf'
assemble(5,None,list(range(1,22))+[37,38,39],[22,23,27,28,29,30,31,32,33,34,35,36,40,41,42,44,45,46,47,48],
 [('正負の数・文字式（中学1年）','次の計算をしよう。\n−3² − (−2)³ × 1/4',N('-7'),'−9 −(−8)×1/4 ＝ −9＋2 ＝ −7。'),
  ('正負の数・文字式（中学1年）','次の計算をしよう。\n(−0.6) ÷ 3/10 − (−1.5) × 4',N('4'),'−0.6÷0.3＝−2、−(−1.5)×4＝＋6。−2＋6＝4。'),
  ('正負の数・文字式（中学1年）','次の計算をしよう。\n(6x − 9)/3 − (4x − 10)/2',N('2'),'(2x−3)−(2x−5)＝2。xが消える。'),
  ('1次方程式（中学1年）','次の方程式を解こう。「x＝」をつけて答えよう。\n0.2(x − 3) = 0.5x + 0.9',{'kind':'exact','accepted':X('-5')},'0.2x−0.6＝0.5x＋0.9 → −0.3x＝1.5 → x＝−5。'),
  ('比と比の値','次の比例式で、xの値を求めよう。\nx : 12 = 5 : 8',N('7.5'),'8x＝60 → x＝7.5。'),
  ('最大公約数・最小公倍数','（48、72、120）の最大公約数を求めよう。',N('24'),'48＝2⁴×3、72＝2³×3²、120＝2³×3×5。共通は2³×3＝24。')],[],f1,f2,None,
 '辺・面・頂点を数えるだけの4問を外し、1次に難しめの計算6問を追加。')
# ---- 4級 ----
assemble(4,None,[i for i in range(1,36) if i not in (7,15,18,21,31)],[i for i in range(36,65) if i not in (36,40,41,47,49,53,59,62,63)],[],[],'数検/4q_que_1ji.pdf','数検/4q_que_2ji.pdf',None,
 'やさしい問題（3人の並び方・さいころの目の数・平行四辺形の対角など）を外して50問にした。新しい問題はない。')
# ---- 3級 ----
assert all(F(v)**2+4*F(v)-21==0 for v in (3,-7)) and all((F(v)-2)**2==9 for v in (5,-1))
assert 11*12==132 and 8*(14-8)==48 and F(12,4)==3 and (F(1,2)*36-F(1,2)*4)/4==4 and (2*25-2*9)/2==16 and F(3,2)*18/2==F(27,2)
assert 5*5+12*12==13*13 and 6*6+8*8==100 and 130/2==65
pairs=[(a,b) for a in range(1,6) for b in range(1,6) if a!=b];assert F(sum((10*a+b)%3==0 for a,b in pairs),len(pairs))==F(2,5)
assert F(8,40)==F(1,5) and 50*5-50==200 and F(5+6,2)==F(11,2)
assert all((7-3)**2==16 for _ in [0])
f1='数検/3q_que_1ji.pdf';f2='数検/3q_que_2ji.pdf'
def EX(*v):return {'kind':'exact','accepted':list(v)}
assemble(3,None,list(range(1,22)),list(range(22,30)),
 [('式の展開【中3】','次の式を展開しよう。\n(3x − 2)(x + 4)',{'kind':'expr','value':'3x^2+10x-8'},'3x²＋12x−2x−8＝3x²＋10x−8。'),
  ('式の展開【中3】','次の式を計算しよう。\n(a + 2b)(a − 2b) − (a − b)²',{'kind':'expr','value':'2ab-5b^2'},'a²−4b²−(a²−2ab＋b²)＝2ab−5b²。'),
  ('因数分解【中3】','次の式を因数分解しよう。\n2x² + 8x − 42',EX('2(x+7)(x-3)','2(x-3)(x+7)','2(x+7)(x−3)','2(x−3)(x+7)'),'2(x²＋4x−21)＝2(x＋7)(x−3)。共通因数2を先にくくり出す。'),
  ('因数分解【中3】','次の式を因数分解しよう。\nx² − 10x + 25',EX('(x-5)^2','(x-5)²','(x−5)^2','(x−5)²','(x-5)(x-5)'),'(x−5)²。'),
  ('平方根【中3】','次の計算をしよう。\n(√6 + √2)(√6 − √2)',N('4'),'和と差の積で 6−2＝4。'),
  ('方程式','次の2次方程式を解こう（解を読点で区切って書こう）。\nx² + 4x − 21 = 0',{'kind':'numbers','values':['3','-7']},'(x＋7)(x−3)＝0 → x＝3、−7。'),
  ('方程式','次の2次方程式を解こう（解を読点で区切って書こう）。\n(x − 2)² = 9',{'kind':'numbers','values':['5','-1']},'x−2＝±3 → x＝5、−1。'),
  ('関数y＝ax²【中3】','関数 y＝−x² で、xの変域が −3≦x≦1 のとき、yの変域を「〇≦y≦〇」の形で答えよう。',EX('-9≦y≦0','−9≦y≦0','-9<=y<=0'),'x＝0で最大0、x＝−3で最小−9。'),
  ('式の計算（中1・中2の復習）','x＝7、y＝3 のとき、x² − 2xy + y² の値を求めよう。',N('16'),'(x−y)²＝4²＝16。因数分解してから代入すると速い。')],
 [('方程式','連続する2つの正の整数があり、その積は132である。小さいほうの整数を求めよう。',N('11'),'x(x＋1)＝132 → x²＋x−132＝0 → (x＋12)(x−11)＝0。正なので11。'),
  ('方程式','周の長さが28cm、面積が48cm²の長方形がある。長いほうの辺の長さは何cmか。',N('8',['cm']),'たてx、横14−x。x(14−x)＝48 → x＝6、8。長いほうは8cm。'),
  ('関数y＝ax²【中3】','関数 y＝ax² のグラフが点(−2, 12)を通るとき、aの値を求めよう。',N('3'),'12＝a×4 → a＝3。'),
  ('関数y＝ax²【中3】','関数 y＝1/2 x² で、xが2から6まで増加するときの変化の割合を求めよう。',N('4'),'(18−2)÷(6−2)＝4。'),
  ('関数y＝ax²【中3】','斜面を転がるボールが、転がり始めてからx秒間に進む距離をymとすると、y＝2x² になった。転がり始めて3秒後から5秒後までの平均の速さは毎秒何mか。',N('16',['m/s','メートル毎秒','m']),'(2×25−2×9)÷(5−3)＝16。'),
  ('図形【中2・中3】','長さ1.5mの棒を地面に垂直に立てると、影の長さは2mだった。同じ時刻に、影の長さが18mの木の高さは何mか。',N('13.5',['m']),'1.5：2＝x：18 → x＝13.5。相似の利用。'),
  ('図形【中2・中3】','たて5cm、横12cmの長方形の対角線の長さは何cmか。',N('13',['cm']),'5²＋12²＝169＝13²。三平方の定理。'),
  ('図形【中2・中3】','座標平面上の2点 A(1, 2)、B(7, 10) の間の距離を求めよう（1目もりを1cmとする）。',N('10',['cm']),'横6・たて8の直角三角形の斜辺。√(36＋64)＝10。'),
  ('図形【中2・中3】','円Oで、弧ABに対する中心角∠AOBが130°のとき、弧ABに対する円周角は何度か。',N('65',['度','°']),'円周角は中心角の半分。'),
  ('確率・データ','1から5までの数字を1つずつ書いた5枚のカードから2枚を取り出して並べ、2けたの整数をつくる。その整数が3の倍数になる確率を求めよう。',N('2/5'),'全部で5×4＝20通り。各位の和が3の倍数になる組は{1,2}{1,5}{2,4}{4,5}で、それぞれ2通り → 8通り。8/20＝2/5。'),
  ('確率・データ','白い球がたくさん入った袋に赤い球を50個入れてよく混ぜ、40個を取り出したら赤い球は8個だった。袋の中の白い球はおよそ何個と考えられるか。',N('200',['個']),'赤の割合8/40＝1/5。全体はおよそ50÷1/5＝250個。白は250−50＝200個。標本調査。'),
  ('確率・データ','次のデータの第1四分位数を求めよう。\n3, 5, 6, 8, 9, 11, 12, 14',N('5.5'),'前半の4つ（3,5,6,8）の中央値 (5＋6)÷2＝5.5。')],f1,f2,None,
 '1次9問・2次12問（2次方程式の利用・相似・三平方・標本調査・四分位数など）を独自に追加。平方根が答えになる問題は採点できないので、答えが整数・分数になる形にした。')
# ---- 理科検定5級 ----
d=json.loads((D/'理科検定/kentei-rika-5.json').read_text(encoding='utf-8'));q=d['questions'];rf=q[0]['source']['file']
keep=[1,3,4,6,8,9,11,14,16,17,18,19,20,22,26,27,28,31]
assert 10*40==400
newr=[mk('生物：植物と動物','顕微鏡で、10倍の接眼レンズと40倍の対物レンズを組み合わせて観察した。観察している倍率は何倍か。',N('400',['倍']),'倍率＝接眼レンズの倍率×対物レンズの倍率＝10×40。',rf),
      mk('生物：植物と動物','被子植物の花で、受粉したあと成長して果実になる部分はどこか。',{'kind':'exact','accepted':['子房','しぼう']},'子房は果実に、胚珠は種子になる。',rf)]
out=[q[i-1] for i in keep[:14]]+newr+[q[i-1] for i in keep[14:]]
out=[dict(x,id=f'kentei-rika-5-{i+1}') for i,x in enumerate(out)];assert len(out)==20 and len({x['prompt'] for x in out})==20
unit={k:d[k] for k in ['id','bank','kentei','level']};unit.update({'title':'理科検定5級 模擬検定（独自問題）','status':'draft','exam':{'minutes':50,'count':20,'passRate':0.7,'passNote':'合格のめやすは70％（日本理科検定協会の基準）'},'questions':out,
 'reviewNote':d['reviewNote']+' 2026-10-22 Claude：本番と同じ20問にした。物理6・化学6・生物4・地学4。やさしい問題（反射角・磁石につく金属など）を外し、生物を2問追加。'})
(OUT/'kentei-rika-5.json').write_text(json.dumps(unit,ensure_ascii=False,indent=1),encoding='utf-8');print('rika',len(out))
