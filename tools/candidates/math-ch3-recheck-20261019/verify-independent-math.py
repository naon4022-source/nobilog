"""Independent exact arithmetic for the 11 adopted chapter-three video scripts/scenes.
This is an internal audit, never a learner-facing answer artifact or grading engine.
"""
from pathlib import Path
from fractions import Fraction as F
from math import lcm
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
scene=(S/'数学3章_場面.js').read_text();checks=0;review={}
def ok(value,label):
 global checks
 assert value,label
 checks+=1
def equation(left,right):return (F(left[0])-F(right[0]),F(left[1])-F(right[1]))
def root(eq):
 ok(eq[0]!=0,'unique linear solution requires nonzero coefficient')
 return -eq[1]/eq[0]
def verify(ident,reason,needles):
 p=S/(ident+'.json');d=load(p);text='\n'.join(d['summary']+[x['say'] for x in d['steps']])
 for needle in needles:ok(needle in text,ident+': script matches reviewed quantities '+needle)
 review[ident]={'id':ident,'status':'passed','reason':reason,'scriptSha256':sha(p),'spokenSteps':len(d['steps'])}
# Substitution uses an independent arithmetic table, not the renderer's formula evaluator.
table=[(-2,4),(1,5),(4,6),(7,7)]
for x,pair in enumerate(table,1):ok((3*x-5,x+3)==pair,'substitution '+str(x))
ok(root(equation((3,-5),(1,3)))==4,'substitution solution is unique')
verify('M1-C3-S1-V01','x=1〜4の左右の値を別計算し、一致する解を検算。', ['左辺はマイナス2、右辺は4','左辺は1、右辺は5','左辺は4、右辺は6','どちらも7'])
# Equal balance: 80 = 50 + 30, remove the same 30 from both sides.
ok(80==50+30 and 50+30-30==80-30,'equal weights removed')
ok(root(equation((1,30),(0,80)))==50,'balance solution')
verify('M1-C3-S1-V02','80=50+30、左右から30を除いて等しさを保つ。', ['30グラム','80グラム','50グラム'])
# Transposition rows all have the same left-minus-right polynomial.
rows=[equation((6,5),(2,-11)),equation((6,0),(2,-16)),equation((4,0),(0,-16))]
ok(all(e==(4,16) for e in rows),'each transposition preserves equation')
ok(root(rows[0])==-4,'transposition exact check')
ok(4!=0 and tuple(v/4 for v in rows[-1])==(1,4),'division by nonzero four')
for formula in ['6x＋5＝2x−11','6x＝2x−11−5','6x−2x＝−11−5','4x＝−16','(4x)÷4＝(−16)÷4']:ok(formula in scene,'reviewed transposition appears in scene')
verify('M1-C3-S1-V03','両辺から5、2xを順に引き、非零の4で割る同値変形。', ['両辺から5','両辺から2エックス','4エックスイコールマイナス16','両辺を4'])
# Multiply the whole rational equation, including its constant term, by 12.
ok(lcm(4,3)==12,'least common denominator')
original=equation((F(1,4),F(1,4)),(F(2,3),-1));cleared=equation((3,3),(8,-12))
ok(tuple(v*12 for v in original)==cleared,'every term multiplied by twelve')
ok(root(original)==root(cleared)==3,'rational and integer equations same root')
for formula in ['3(x＋1)＝(2/3)x×12−1×12','3(x＋1)＝8x−1×12','3(x＋1)＝8x−12']:ok(formula in scene,'cleared denominator scene '+formula)
verify('M1-C3-S1-V04','分母4と3の最小公倍数12を全項へ掛け、括弧と−1にも掛ける。', ['最小公倍数は12','8エックス','マイナス12'])
ratio=equation((F(1,10),0),(0,F(2,5)));cross=equation((5,0),(0,20))
ok(tuple(v*50 for v in ratio)==cross,'cross products with nonzero denominators')
ok(root(ratio)==root(cross),'ratio equivalence')
verify('M1-C3-S1-V05','x/10=2/5の分母は非零。両辺へ50を掛けた5x=20を検算。', ['x：10＝2：5','5エックス','積は20'])
verify('M1-C3-S1-VP','同じ重さを除く・移項・全項への乗法・比例式の4場面は上の検算と同一。', ['同じ重さ','符号','すべての項','外側と内側'])
# Actual excess diagram's normalized widths encode the same total without labels exposing answers.
people=root(equation((6,15),(8,-9)));total=6*people+15
ok(people.denominator==1 and people>0,'whole positive number of recipients')
ok(total==8*people-9 and 8*people-total==9,'same total and shortfall')
ok(6*people==72 and total==87 and 8*people==96,'diagram lengths match exact quantities')
for fragment in ['x+87*scale','x+96*scale','72*scale','15*scale','9*scale','6x＋15＝8x−9']:ok(fragment in scene,'excess scene reviewed '+fragment)
verify('M1-C3-S2-V01','6x+15と8x−9が同じ全体。正整数の人数と図の72/87/96の長さを検算。', ['6枚','余った15枚','8枚','9枚足りない','6エックスたす15イコール8エックスひく9'])
time=root(equation((150,0),(60,60*15)));distance=150*time
ok(time>0 and distance==60*(15+time),'pursuit distances and times')
ok(F(60*15,distance)==F(3,5) and F(60,150)==F(2,5),'animation lead and remaining motion use correct distance ratio')
for formula in ['15＋x','60(15＋x)','150x','150x＝60(15＋x)']:ok(formula in scene,'pursuit scene '+formula)
verify('M1-C3-S2-V02','妹の先行15分・分速60と姉150の時間差、同じ道のり、動きの0.6/0.4の比を検算。', ['分速60','15分','分速150','15たすエックス','150エックスイコール60かける15たすエックス'])
white=F(180*2,9);blue=F(180*7,9)
ok(2+7==9 and white+blue==180,'parts add to whole')
ok(white/blue==F(2,7) and white/180==F(2,9),'white-to-blue and white-to-whole distinguished')
for formula in ['j<9','j<2','全体180g（9）','2：9＝x：180']:ok(formula in scene,'mixing scene '+formula)
verify('M1-C3-S2-V03','白:青=2:7から白:全体=2:9。9等分・180gの関係を分数で検算。', ['2さじ','7さじ','9つ','180グラム','2対9イコールエックス対180'])
verify('M1-C3-S2-VP','代金+おつり=支払い、追いつきの距離一致、部分と全体の比。再利用場面も上の数量条件と同一。', ['代金とおつりの合計','家からの道のり','部分と全体'])
verify('M1-C3-REVIEW-V01','同値変形・数量設定・道のり一致・単位と意味の確認。再利用場面を同じ検算に対応。', ['両辺へ同じ操作','数量をエックス','2人の道のり','単位や意味'])
expected={x['id'] for x in load(S/'69本_制作進捗.json')['items'] if x['id'].startswith('M1-C3-')}
ok(set(review)==expected and len(review)==11,'all eleven videos accounted for')
(H/'independent-math-result.json').write_text(json.dumps({'status':'passed','checks':checks,'videos':list(review.values()),'sceneSha256':sha(S/'数学3章_場面.js'),'scope':'11本の動画台本・既表示数式・数量と比の独立計算。本文全問/出典写真全文照合や新たな耳の確認は含まない。','learnerFacingFilesChanged':False,'realUserDataUsed':False},ensure_ascii=False,indent=2)+'\n')
print('Chapter3 independent mathematics:',checks,'checks passed; all 11 scripts and scene quantities; source photos/full manuscript/listening separate')
