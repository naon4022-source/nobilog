"""特訓：円とおうぎ形の性質（教科書 p170〜172・175）。"""
from fractions import Fraction as F
from mk import Unit
from vutil import only

U = Unit('circle', '教科書 p170〜172（円・弦・接線・中心角と弧）',
         '2026-10-08 Claude作成（特訓・下書き）。教科書 p170〜172 の円の性質（弦、接線は接点を通る半径に垂直、中心角と弧の長さは比例）を使う一段難しい問題。図はことばで説明している。'
         '答えは check.py で検算。'
         '2026-10-28 Claude：中心角と弧、弦と二等辺三角形、接線と半径、2つの円、座標上の円などの問題を59問追加して70問にした（元の11問はそのまま）。図が必要な問題には、座標から作った正確な図（SVG）をつけた。')
Q = [F(n, 10) for n in range(0, 7201)]

U.num('円Oの円周を 9 等分する点を、順に A、B、C、…、I とする。点Bをふくむほうの弧 AD に対する中心角は何度か答えよう。', '120',
      '①9 等分なので、となりの点どうしの中心角は 360 ÷ 9 ＝ 40 度　②弧 AD は A→B→C→D の 3 つ分　③40 × 3 ＝ 120。答え 120度',
      lambda: F(360, 9) * 3, units=['度', '°'])
U.num('同じ円で、中心角 40° のおうぎ形の弧の長さが 5 cm のとき、中心角 136° のおうぎ形の弧の長さを求めよう。', '17',
      '①弧の長さは中心角に比例する　②5 × (136/40) ＝ 17　③答え 17cm',
      lambda: only(L for L in Q if L * 40 == 5 * 136), units=['cm'])
U.num('円Oの外の点Pから円に2本の接線をひき、接点をA、Bとする。∠APB ＝ 50° のとき、∠AOB の大きさを求めよう。', '130',
      '①接線は接点を通る半径に垂直なので、∠OAP ＝ ∠OBP ＝ 90°　②四角形 OAPB の内角の和は 360°　③∠AOB ＝ 360 − 90 − 90 − 50 ＝ 130。答え 130度',
      lambda: 360 - 90 - 90 - 50, units=['度', '°'])
U.num('半径 6 cm の円Oの円周上に2点A、Bがあり、∠AOB ＝ 60° である。弦 AB の長さを求めよう。', '6',
      '①OA ＝ OB ＝ 6 で、三角形 OAB は二等辺三角形　②頂角 60° なので底角も (180 − 60) ÷ 2 ＝ 60°、正三角形になる　③AB ＝ 6。答え 6cm',
      lambda: 6 if (180 - 60) / 2 == 60 else 0, units=['cm'])
U.pick('半径 5 cm の円Oと直線 ℓ がある。円の中心Oと直線 ℓ のきょりが次のア〜エのとき、円と直線の共有点が2つになるものをすべて選び、記号で答えよう。\nア 3 cm\nイ 5 cm\nウ 7 cm\nエ 0 cm', 'アエ',
       '①きょりが半径より小さいと共有点は2つ、等しいと1つ（接する）、大きいと0　②ア 3 ＜ 5（2つ）、イ 5 ＝ 5（1つ）、ウ 7 ＞ 5（0）、エ 0（中心を通り2つ）　③答え ア、エ',
       lambda: {n for n, d in zip('アイウエ', [3, 5, 7, 0]) if d < 5})
U.num('1つの円を、中心角の比が 2：3：4 になるように3つのおうぎ形に分けた。いちばん大きいおうぎ形の中心角を求めよう。', '160',
      '①360 度を 2 + 3 + 4 ＝ 9 つ分に分ける　②1つ分 40 度　③4 × 40 ＝ 160。答え 160度',
      lambda: only(4 * k for k in Q if 9 * k == 360), units=['度', '°'])
U.num('正六角形の6つの頂点が、すべて同じ円の周上にある。正六角形の1辺が 4 cm のとき、円の半径を求めよう。', '4',
      '①円の中心と正六角形の頂点を結ぶと、6 つの合同な三角形ができ、中心角は 60°　②それぞれ正三角形なので、半径 ＝ 1辺　③答え 4cm',
      lambda: 4 if F(360, 6) == 60 else 0, units=['cm'])
U.num('円周を 8 等分する点を順に結んで正八角形をつくった。となり合う2つの頂点A、Bと円の中心Oについて、∠AOB の大きさを求めよう。', '45',
      '①8 等分なので中心角は 360 ÷ 8　②45 度　③答え 45度',
      lambda: F(360, 8), units=['度', '°'])
U.num('円周の長さが 30π cm の円を、弧の長さの比が 2：3：5 になるように3つのおうぎ形に分けた。いちばん長い弧のおうぎ形の中心角を求めよう。', '180',
      '①中心角も弧の長さと同じ比 2：3：5 になる　②360 × (5/10) ＝ 180　③答え 180度（ちょうど半円）',
      lambda: F(360 * 5, 10), units=['度', '°'])
U.num('ある円の周上に2点 A(−3, 4)、B(5, 4) がある。弦 AB の垂直二等分線は円の中心を通る。円の中心の x 座標を求めよう。', '1',
      '①AB は x 軸に平行で、まん中の点は ((−3 + 5)/2, 4) ＝ (1, 4)　②垂直二等分線は x ＝ 1 の直線（y 軸に平行）　③中心の x 座標は 1。答え 1',
      lambda: F(-3 + 5, 2))
U.pick('半径 5 cm の円と半径 3 cm の円がある。2つの円の中心のきょりが次のア〜エのとき、2つの円がちょうど1点で接するものをすべて選び、記号で答えよう。\nア 2 cm\nイ 4 cm\nウ 8 cm\nエ 10 cm', 'アウ',
       '①中心のきょりが半径の和 8 なら外側で接する　②半径の差 2 なら内側で接する　③4 は2点で交わり、10 ははなれている。答え ア、ウ',
       lambda: {n for n, d in zip('アイウエ', [2, 4, 8, 10]) if d in (5 + 3, 5 - 3)})

# ---- 2026-10-28 追加（59問・図つきをふくむ） ----
import math
from fig import Fig, ang, dist, on, attach, write_reg
D = ['度', '°']
O = (0, 0)
def cfig(r=3, m=1.2, x2=None, y1=None, y0=None):
    return Fig(-r - m, x2 if x2 is not None else r + m, y0 if y0 is not None else -r - m, y1 if y1 is not None else r + m)
def A(fg, val, *at): return ('angle', list(at), val)

# 1 接線2本・中心角から
fg = cfig(x2=9.6); r = 3; Pa, Pb = on(O, r, 68), on(O, r, -68); P = (r / math.cos(math.radians(68)), 0)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(P, Pa, ext=0.6); fg.seg(P, Pb, ext=0.6)
fg.point('O', O, off=(-1, 0), d=16); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('P', P, off=(1, 0), d=16)
fg.angle('A', 'O', 'B', label='136°', value=136); fg.angle('O', 'A', 'P', right=True); fg.angle('O', 'B', 'P', right=True)
q = U.num('図のように、円Oの外の点Pから2本の接線 PA、PB をひいた（A、B は接点）。∠AOB ＝ 136° のとき、∠APB の大きさを求めよう。', '44',
      '①接線は接点を通る半径に垂直なので ∠OAP ＝ ∠OBP ＝ 90°　②四角形 OAPB の4つの角の和は 360°　③∠APB ＝ 360 − 90 − 90 − 136 ＝ 44。答え 44度',
      lambda: 360 - 90 - 90 - 136, units=D)
attach(U, q, fg, '円Oの外の点Pから接線PA、PBをひいた図。A、Bに直角の印、∠AOBに136°と書いてある。', A(fg, 44, 'A', 'P', 'B'))

# 2 接線の長さが等しい → 二等辺三角形
fg = cfig(x2=8.6); Pa, Pb = on(O, r, 65), on(O, r, -65); P = (r / math.cos(math.radians(65)), 0)
fg.circle(O, r); fg.seg(P, Pa, ext=0.5); fg.seg(P, Pb, ext=0.5); fg.seg(Pa, Pb)
fg.point('O', O, away=(-1, 1)); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('P', P, away=O)
fg.angle('A', 'P', 'B', label='50°', value=50, r=26)
q = U.num('図のように、円Oの外の点Pから2本の接線 PA、PB をひき、A と B を結んだ。点Pから接点までの長さ PA と PB は等しい。∠APB ＝ 50° のとき、∠PAB の大きさを求めよう。', '65',
      '①PA ＝ PB なので、三角形 PAB は二等辺三角形　②底角 ∠PAB ＝ ∠PBA　③(180 − 50) ÷ 2 ＝ 65。答え 65度',
      lambda: F(180 - 50, 2), units=D)
attach(U, q, fg, '円Oの外の点Pから接線PA、PBをひき、ABを結んだ図。∠APBに50°と書いてある。', A(fg, 65, 'P', 'A', 'B'))

# 3 接線と中心を結ぶ線
fg = Fig(-4.2, 7, -4.4, 4.2); Pa = (0, -3); P = (3 * math.tan(math.radians(58)), -3)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, P); fg.seg((-3.5, -3), (6.6, -3))
fg.point('O', O, off=(-1, -0.6), d=16); fg.point('A', Pa, off=(0, 1), d=16); fg.point('P', P, off=(0, 1), d=16)
fg.angle('A', 'O', 'P', label='58°', value=58, r=24); fg.angle('O', 'A', 'P', right=True); fg.text('ℓ', (-3.2, -3), dy=-12)
q = U.num('図で、直線 ℓ は点Aで円Oに接している。ℓ 上の点Pと中心Oを結んだところ、∠AOP ＝ 58° だった。∠APO の大きさを求めよう。', '32',
      '①接線は接点を通る半径に垂直なので ∠OAP ＝ 90°　②三角形 OAP の角の和は 180°　③∠APO ＝ 180 − 90 − 58 ＝ 32。答え 32度',
      lambda: 180 - 90 - 58, units=D)
attach(U, q, fg, '点Aで円Oに接する直線ℓと、ℓ上の点P。Aに直角の印、∠AOPに58°と書いてある。', A(fg, 32, 'A', 'P', 'O'))

# 4 接線と弦がつくる角
fg = Fig(-4.2, 5.2, -4.2, 4.2); Pa = (0, -3); u = (math.sin(math.radians(25)), math.cos(math.radians(25))); Lc = 2 * r * math.cos(math.radians(25))
Pb = (Pa[0] + u[0] * Lc, Pa[1] + u[1] * Lc); Tt = (4.6, -3)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(Pa, Pb); fg.seg((-3.8, -3), Tt)
fg.point('O', O, away=(-1, 0)); fg.point('A', Pa, away=(0.5, 1)); fg.point('B', Pb, away=O); fg.point('T', Tt, off=(1, 0), d=12, dot=False)
fg.angle('O', 'A', 'B', label='25°', value=25, r=30, lr=44)
q = U.num('図で、直線 AT は点Aで円Oに接している。弦 AB をひくと、∠OAB ＝ 25° だった。弦 AB と接線 AT がつくる角 ∠BAT の大きさを求めよう。', '65',
      '①接線は接点を通る半径に垂直なので ∠OAT ＝ 90°　②∠BAT ＝ ∠OAT − ∠OAB　③90 − 25 ＝ 65。答え 65度',
      lambda: 90 - 25, units=D)
attach(U, q, fg, '点Aで円Oに接する直線ATと弦AB。∠OABに25°と書いてある。', A(fg, 65, 'B', 'A', 'T'))

# 5 接線でできる四角形の面積
fg = Fig(-7.2, 11.2, -7.2, 7.2); r6 = 6; P = (10, 0); t = math.degrees(math.acos(6 / 10)); Pa, Pb = on(O, r6, t), on(O, r6, -t)
fg.circle(O, r6); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(P, Pa); fg.seg(P, Pb)
fg.point('O', O, away=(-1, 0)); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('P', P, away=O)
fg.angle('O', 'A', 'P', right=True); fg.angle('O', 'B', 'P', right=True)
mA = ((Pa[0]) / 2, Pa[1] / 2); fg.text('6 cm', mA, dx=-22, dy=-4); mP = ((Pa[0] + P[0]) / 2, (Pa[1] + P[1]) / 2); fg.text('8 cm', mP, dx=18, dy=-12)
fg.claim('len', ['O', 'A'], 6, '6 cm'); fg.claim('len', ['P', 'A'], 8, '8 cm')
def shoelace(*p): return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2
q = U.num('図のように、半径 6 cm の円Oの外の点Pから接線 PA、PB をひいた。PA ＝ PB ＝ 8 cm のとき、四角形 OAPB の面積を求めよう。', '48',
      '①接線は半径に垂直なので、三角形 OAP は ∠OAP ＝ 90° の直角三角形　②三角形 OAP の面積 6 × 8 ÷ 2 ＝ 24　③三角形 OBP も同じ面積なので 24 × 2 ＝ 48。答え 48 cm²',
      lambda Pa=Pa, P=P, Pb=Pb: only([round(shoelace(O, Pa, P, Pb), 9)]), units=['cm²', 'cm2', '平方センチメートル'])
attach(U, q, fg, '半径6cmの円Oと外の点Pからの接線PA、PB。OAに6cm、PAに8cm、A、Bに直角の印。')

# 6 円周上の3点と中心
fg = cfig(); Pb, Pa, Pc = on(O, r, 90), on(O, r, 230), on(O, r, -20)
fg.circle(O, r); fg.poly(Pa, Pb, Pc); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(O, Pc)
fg.point('O', O, away=(0, 1), d=15); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('C', Pc, away=O)
fg.angle('O', 'A', 'B', label='20°', value=20, r=40, lr=62); fg.angle('B', 'C', 'O', label='35°', value=35, r=30, lr=44)
q = U.num('図のように、円Oの周上に3点A、B、Cがあり、中心Oと3点を結んだ。∠OAB ＝ 20°、∠OCB ＝ 35° のとき、∠ABC の大きさを求めよう。', '55',
      '①OA ＝ OB なので三角形 OAB は二等辺三角形で ∠OBA ＝ ∠OAB ＝ 20°　②同じように OB ＝ OC から ∠OBC ＝ ∠OCB ＝ 35°　③∠ABC ＝ 20 + 35 ＝ 55。答え 55度',
      lambda: 20 + 35, units=D)
attach(U, q, fg, '円周上の3点A、B、Cでできた三角形と、中心Oから3点へ結んだ半径。∠OABに20°、∠OCBに35°と書いてある。', A(fg, 55, 'A', 'B', 'C'))

# 7 直径と中心角
fg = cfig(); Pa, Pb, Pc = (-3, 0), (3, 0), on(O, r, 68)
fg.circle(O, r); fg.seg(Pa, Pb); fg.seg(Pa, Pc); fg.seg(O, Pc)
fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('C', Pc, away=O); fg.point('O', O, away=(0, 1))
fg.angle('B', 'A', 'C', label='34°', value=34, r=34, lr=48)
q = U.num('図で、AB は円Oの直径、C は円周上の点である。∠CAB ＝ 34° のとき、∠COB の大きさを求めよう。', '68',
      '①OA ＝ OC なので三角形 OAC は二等辺三角形で ∠OCA ＝ 34°　②∠AOC ＝ 180 − 34 − 34 ＝ 112°　③AB は一直線なので ∠COB ＝ 180 − 112 ＝ 68。答え 68度',
      lambda: 180 - (180 - 34 - 34), units=D)
attach(U, q, fg, '円Oの直径ABと円周上の点C。AC、OCが結んであり、∠CABに34°と書いてある。', A(fg, 68, 'C', 'O', 'B'))

# 8 弦の中点と中心
fg = cfig(); Pa, Pb = on(O, r, 220), on(O, r, 320); M = (0, Pa[1])
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(Pa, Pb); fg.seg(O, M)
fg.point('O', O, away=(0, -1)); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('M', M, away=(0, 0.5))
fg.angle('O', 'M', 'B', right=True); fg.angle('O', 'A', 'B', label='40°', value=40, r=30, lr=44)
fg.claim('eq', ['A', 'M', 'M', 'B'], 0)
q = U.num('図で、M は円Oの弦 AB の中点で、OM と AB は垂直である。∠OAM ＝ 40° のとき、∠AOM の大きさを求めよう。', '50',
      '①∠OMA ＝ 90°　②三角形 OAM の角の和は 180°　③∠AOM ＝ 180 − 90 − 40 ＝ 50。答え 50度',
      lambda: 180 - 90 - 40, units=D)
attach(U, q, fg, '円Oの弦ABとその中点M。OMとABに直角の印、∠OAMに40°と書いてある。', A(fg, 50, 'A', 'O', 'M'))

# 9 半径と同じ長さの弦を2本
fg = cfig(); Pa, Pb, Pc = on(O, r, 150), on(O, r, 90), on(O, r, 30)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(O, Pc); fg.seg(Pa, Pb); fg.seg(Pb, Pc)
fg.point('O', O, away=(0, 1)); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('C', Pc, away=O)
fg.claim('eq', ['A', 'B', 'O', 'A'], 0); fg.claim('eq', ['B', 'C', 'O', 'A'], 0)
q = U.num('図のように、円Oの周上に、弦 AB、BC の長さがどちらも半径と等しくなるように点A、B、Cをとった。∠AOC の大きさを求めよう（A と C の間に B がある側の角）。', '120',
      '①OA ＝ OB ＝ AB なので三角形 OAB は正三角形で ∠AOB ＝ 60°　②同じように ∠BOC ＝ 60°　③∠AOC ＝ 60 + 60 ＝ 120。答え 120度',
      lambda: 60 + 60, units=D)
attach(U, q, fg, '円Oの周上の点A、B、Cと半径OA、OB、OC。弦AB、BCは半径と同じ長さ。', A(fg, 120, 'A', 'O', 'C'))

# 10 円周を4つに分ける
fg = cfig(); angs = [200, 236, 308, 56]; pts = [on(O, r, a) for a in angs]
fg.circle(O, r)
for nm, p in zip('ABCD', pts): fg.seg(O, p); fg.point(nm, p, away=O)
fg.point('O', O, away=(1, -1))
q = U.num('図のように、円周上の点A、B、C、Dで、弧 AB、BC、CD、DA の長さの比が 1：2：3：4 になっている。∠AOC（点Bがある側の角）の大きさを求めよう。', '108',
      '①中心角の比も 1：2：3：4 で、合計 10 つ分が 360°　②1つ分は 36°　③∠AOC は弧 AB と BC の分で 36 × (1 + 2) ＝ 108。答え 108度',
      lambda: F(360, 10) * 3, units=D)
attach(U, q, fg, '円Oの周上の4点A、B、C、Dと、中心からの半径。弧の長さの比は1：2：3：4。', A(fg, 108, 'A', 'O', 'C'))
for (i, j, k) in ((0, 1, 36), (1, 2, 72), (2, 3, 108)): assert abs(ang(pts[i], O, pts[j]) - k) < 1e-9

# 11 二等辺三角形が円に入っている
fg = cfig(); Pa, Pb, Pc = on(O, r, 90), on(O, r, 230), on(O, r, 310)
fg.circle(O, r); fg.poly(Pa, Pb, Pc); fg.seg(O, Pa); fg.seg(O, Pb)
fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('C', Pc, away=O); fg.point('O', O, away=(1, 0))
fg.angle('B', 'A', 'C', label='40°', value=40, r=30, lr=44); fg.claim('eq', ['A', 'B', 'A', 'C'], 0)
q = U.num('図のように、AB ＝ AC の二等辺三角形 ABC の3つの頂点が円Oの周上にある。∠BAC ＝ 40° のとき、∠OBA の大きさを求めよう。', '20',
      '①図は直線 AO について対称なので、AO は ∠BAC を2等分し ∠OAB ＝ 20°　②OA ＝ OB なので三角形 OAB は二等辺三角形　③∠OBA ＝ ∠OAB ＝ 20。答え 20度',
      lambda: F(40, 2), units=D)
attach(U, q, fg, 'AB＝ACの二等辺三角形ABCが円Oの周上にあり、OA、OBが結んである。∠BACに40°と書いてある。', A(fg, 20, 'O', 'B', 'A'))

# 12 同心円と弦
fg = Fig(-6.2, 6.2, -6.2, 6.2); R5, r3 = 5, 3; Pa, Pb, M = (-4, -3), (4, -3), (0, -3)
fg.circle(O, R5); fg.circle(O, r3); fg.seg(Pa, Pb); fg.seg(O, M)
fg.point('O', O, away=(0, -1)); fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('M', M, away=(0, 1))
fg.angle('O', 'M', 'B', right=True); fg.text('4 cm', (-2, -3), dy=16)
fg.claim('len', ['A', 'M'], 4, '4 cm'); fg.claim('len', ['O', 'M'], 3)
q = U.num('図のように、中心が同じ2つの円がある。大きい円の弦 AB が、小さい円に点Mで接している。AM ＝ 4 cm のとき、弦 AB の長さを求めよう。', '8',
      '①接線 AB は接点を通る半径 OM に垂直　②中心から弦にひいた垂線は弦を2等分するので、M は AB の中点　③AB ＝ 4 × 2 ＝ 8。答え 8 cm',
      lambda: 2 * 4, units=['cm'])
attach(U, q, fg, '中心Oが同じ大小2つの円。大きい円の弦ABが小さい円に点Mで接し、OMとABに直角の印。AMに4cmと書いてある。', ('len', ['A', 'B'], 8))

# 13 三角形の内側で3辺に接する円
B0, C0 = (0, 0), (8, 0); A0 = (2, math.sqrt(45)); I0 = (3, math.sqrt(45) / 3); ri = math.sqrt(45) / 3
def foot(P, Q, X):
    dx, dy = Q[0] - P[0], Q[1] - P[1]; t = ((X[0] - P[0]) * dx + (X[1] - P[1]) * dy) / (dx * dx + dy * dy); return (P[0] + t * dx, P[1] + t * dy)
Tp, Tq, Tr = foot(A0, B0, I0), foot(B0, C0, I0), foot(C0, A0, I0)
assert abs(dist(I0, Tp) - ri) < 1e-9 and abs(dist(I0, Tq) - ri) < 1e-9 and abs(dist(I0, Tr) - ri) < 1e-9
fg = Fig(-0.8, 8.8, -1.0, 7.4); fg.poly(A0, B0, C0); fg.circle(I0, ri)
fg.point('A', A0, away=I0); fg.point('B', B0, away=I0); fg.point('C', C0, away=I0)
fg.point('P', Tp, away=I0); fg.point('Q', Tq, away=I0); fg.point('R', Tr, away=I0)
fg.text('7 cm', ((A0[0] + B0[0]) / 2, (A0[1] + B0[1]) / 2), dx=-26, dy=-14); fg.text('8 cm', (4.6, 0), dy=24); fg.text('9 cm', ((A0[0] + C0[0]) / 2, (A0[1] + C0[1]) / 2), dx=34, dy=6)
fg.claim('len', ['A', 'B'], 7, '7 cm'); fg.claim('len', ['B', 'C'], 8, '8 cm'); fg.claim('len', ['C', 'A'], 9, '9 cm')
q = U.num('図のように、AB ＝ 7 cm、BC ＝ 8 cm、CA ＝ 9 cm の三角形 ABC の3辺に、1つの円が点P、Q、Rで接している。円の外の点から円にひいた2本の接線の長さは等しい（AP ＝ AR など）。AP の長さを求めよう。', '4',
      '①AP ＝ AR ＝ x、BP ＝ BQ ＝ y、CQ ＝ CR ＝ z とする　②x + y ＝ 7、y + z ＝ 8、z + x ＝ 9 で、3つをたすと 2(x + y + z) ＝ 24、x + y + z ＝ 12　③x ＝ 12 − (y + z) ＝ 12 − 8 ＝ 4。答え 4 cm',
      lambda: only(x for x in Q if (7 - x) + (9 - x) == 8), units=['cm'])
attach(U, q, fg, 'AB7cm、BC8cm、CA9cmの三角形ABCと、3辺に点P、Q、Rで接する円。', ('len', ['A', 'P'], 4))

# 14 4辺に接する円がある四角形
tl = [2, 4, 3, 6]  # 頂点 A、B、C、D からの接線の長さ
lo, hi = 0.1, 20.0
for _ in range(200):
    mid = (lo + hi) / 2
    if sum(2 * math.atan(t / mid) for t in tl) > 2 * math.pi: lo = mid
    else: hi = mid
rq = (lo + hi) / 2
phi, V, cur = [], [], 0.0
for t in tl:
    h = math.atan(t / rq); V.append(on(O, math.hypot(t, rq), cur + math.degrees(h))); cur += math.degrees(2 * h)
names = 'ABCD'
for i in range(4): pass
sides = [dist(V[i], V[(i + 1) % 4]) for i in range(4)]
assert all(abs(a - b) < 1e-9 for a, b in zip(sides, [6, 7, 9, 8]))
fg = Fig(min(p[0] for p in V) - 1, max(p[0] for p in V) + 1, min(p[1] for p in V) - 1, max(p[1] for p in V) + 1)
fg.poly(*V); fg.circle(O, rq)
for nm, p in zip(names, V): fg.point(nm, p, away=O)
mids = [((V[i][0] + V[(i + 1) % 4][0]) / 2, (V[i][1] + V[(i + 1) % 4][1]) / 2) for i in range(4)]
for i, lab in enumerate(['6 cm', '7 cm', '9 cm']):
    mx, my = mids[i]; ux, uy = mx, my; L = math.hypot(ux, uy); fg.text(lab, (mx + ux / L * 1.0, my + uy / L * 1.0))
fg.claim('len', ['A', 'B'], 6, '6 cm'); fg.claim('len', ['B', 'C'], 7, '7 cm'); fg.claim('len', ['C', 'D'], 9, '9 cm')
q = U.num('図のように、四角形 ABCD の4辺に1つの円が接している。AB ＝ 6 cm、BC ＝ 7 cm、CD ＝ 9 cm のとき、AD の長さを求めよう（円の外の点からひいた2本の接線の長さは等しい）。', '8',
      '①各頂点からの接線の長さを、A から順に a、b、c、d とする　②AB + CD ＝ (a + b) + (c + d)、AD + BC ＝ (d + a) + (b + c) で、どちらも a + b + c + d　③AD ＝ 6 + 9 − 7 ＝ 8。答え 8 cm',
      lambda: only(x for x in Q if 6 + 9 == x + 7), units=['cm'])
attach(U, q, fg, '4辺に円が接している四角形ABCD。ABに6cm、BCに7cm、CDに9cmと書いてある。', ('len', ['D', 'A'], 8))

# 15 2つの円の共通な弦
O1, O2, r1, r2 = (0, 0), (4, 0), 3, 2.5
xm = (16 + 9 - 6.25) / 8; ym = math.sqrt(9 - xm * xm); Pa, Pb, M = (xm, ym), (xm, -ym), (xm, 0)
fg = Fig(-3.8, 7.2, -3.8, 3.8); fg.circle(O1, r1); fg.circle(O2, r2); fg.seg(O1, O2); fg.seg(Pa, Pb)
fg.point('A', Pa, away=M, d=16); fg.point('B', Pb, away=M, d=16); fg.point('O', O1, away=(-1, 1)); fg.point("O'", O2, away=(5, 1)); fg.point('M', M, off=(-1, 1), d=16, dot=False)
for p, R in ((O1, r1), (O2, r2)): assert abs(dist(p, Pa) - R) < 1e-9 and abs(dist(p, Pb) - R) < 1e-9
q = U.num("図のように、中心O、O' の2つの円が2点A、Bで交わっている。線分 OO' と AB が交わる点をMとするとき、∠AMO' の大きさを求めよう。", '90',
      "①OA ＝ OB なので、O は A、B から等しいきょりにあり、弦 AB の垂直二等分線上の点　②O'A ＝ O'B なので O' も同じ　③直線 OO' は AB の垂直二等分線で、∠AMO' ＝ 90。答え 90度",
      lambda: 90, units=D)
attach(U, q, fg, "2点A、Bで交わる中心O、O'の2つの円と、線分OO'、AB。交わる点がM。", A(fg, 90, 'A', 'M', "O'"))

# 16 円周を10等分
fg = cfig(); pts10 = [on(O, r, 90 - 36 * i) for i in range(10)]
fg.circle(O, r)
for i, p in enumerate(pts10):
    if i in (0, 1): fg.point('AB'[i], p, away=O)
    else: fg.el.append('<circle cx="%.1f" cy="%.1f" r="2.6" fill="#111" stroke="none"/>' % fg.T(p))
fg.seg(O, pts10[0]); fg.seg(O, pts10[1]); fg.seg(pts10[0], pts10[1]); fg.point('O', O, off=(-1, 0.4), d=16)
q = U.num('図のように、円Oの周を 10 等分する点をとり、となりあう2点をA、Bとした。∠OAB の大きさを求めよう。', '72',
      '①10 等分なので ∠AOB ＝ 360 ÷ 10 ＝ 36°　②OA ＝ OB の二等辺三角形　③∠OAB ＝ (180 − 36) ÷ 2 ＝ 72。答え 72度',
      lambda: F(180 - F(360, 10), 2), units=D)
attach(U, q, fg, '円Oの周を10等分する点と、となりあう2点A、B。OA、OB、ABが結んである。', A(fg, 72, 'O', 'A', 'B'))

# 17 長さの等しい弦
fg = cfig(); Pa, Pb, Pc, Pd = on(O, r, 100), on(O, r, 170), on(O, r, 250), on(O, r, 320)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(O, Pc); fg.seg(O, Pd); fg.seg(Pa, Pb); fg.seg(Pc, Pd)
for nm, p in zip('ABCD', (Pa, Pb, Pc, Pd)): fg.point(nm, p, away=O)
fg.point('O', O, off=(1, -0.2), d=18); fg.angle('A', 'O', 'B', label='70°', value=70, r=20, lr=34); fg.claim('eq', ['A', 'B', 'C', 'D'], 0)
q = U.num('図で、円Oの弦 AB と弦 CD の長さは等しい。∠AOB ＝ 70° のとき、∠OCD の大きさを求めよう。', '55',
      '①長さの等しい弦に対する中心角は等しいので ∠COD ＝ 70°　②OC ＝ OD の二等辺三角形　③∠OCD ＝ (180 − 70) ÷ 2 ＝ 55。答え 55度',
      lambda: F(180 - 70, 2), units=D)
attach(U, q, fg, '円Oの長さの等しい弦ABと弦CD、中心から4点への半径。∠AOBに70°と書いてある。', A(fg, 55, 'O', 'C', 'D'))

# 18 中心角を足す・引く
fg = cfig(); Pb, Pa, Pc = on(O, r, 90), on(O, r, 190), on(O, r, -30)
fg.circle(O, r); fg.seg(O, Pa); fg.seg(O, Pb); fg.seg(O, Pc)
fg.point('A', Pa, away=O); fg.point('B', Pb, away=O); fg.point('C', Pc, away=O); fg.point('O', O, off=(0, 1), d=18)
fg.angle('B', 'O', 'A', label='100°', value=100, r=20, lr=36); fg.angle('C', 'O', 'B', label='120°', value=120, r=26, lr=42)
q = U.num('図のように、円Oの周上に3点A、B、Cがある。∠AOB ＝ 100°、∠BOC ＝ 120° のとき、点Bをふくまない側の ∠AOC の大きさを求めよう。', '140',
      '①中心のまわりの角は全部で 360°　②B をふくまない側の ∠AOC ＝ 360 − 100 − 120　③140。答え 140度',
      lambda: 360 - 100 - 120, units=D)
attach(U, q, fg, '円Oの周上の3点A、B、Cと半径OA、OB、OC。∠AOBに100°、∠BOCに120°と書いてある。', A(fg, 140, 'A', 'O', 'C'))

# 19 正五角形
fg = cfig(); P5 = [on(O, r, 90 + 72 * i) for i in range(5)]
fg.circle(O, r); fg.poly(*P5); fg.seg(O, P5[0]); fg.seg(O, P5[1])
fg.point('A', P5[0], away=O); fg.point('B', P5[1], away=O); fg.point('O', O, off=(1, 0.2), d=16)
q = U.num('図のように、正五角形の5つの頂点が円Oの周上にある。となりあう頂点をA、Bとするとき、∠OAB の大きさを求めよう。', '54',
      '①5 つの頂点は円周を 5 等分するので ∠AOB ＝ 360 ÷ 5 ＝ 72°　②OA ＝ OB の二等辺三角形　③∠OAB ＝ (180 − 72) ÷ 2 ＝ 54。答え 54度',
      lambda: F(180 - F(360, 5), 2), units=D)
attach(U, q, fg, '円Oの周上に頂点がある正五角形と、となりあう頂点A、Bへの半径。', A(fg, 54, 'O', 'A', 'B'))

# 20 長方形に入った2つの円
fg = Fig(-0.6, 12.6, -0.6, 6.6); R0 = [(0, 0), (12, 0), (12, 6), (0, 6)]
fg.poly(*R0); fg.circle((3, 3), 3); fg.circle((9, 3), 3); fg.seg((3, 3), (3, 6), dash=True)
for nm, p in zip('ABCD', R0): fg.point(nm, p, away=(6, 3))
fg.P['O1'] = (3, 3); fg.P['T1'] = (3, 6); fg.text('3 cm', (3, 4.5), dx=20); fg.claim('len', ['O1', 'T1'], 3, '3 cm')
q = U.num('図のように、長方形 ABCD の中に、半径 3 cm の2つの円が、たがいに接し、それぞれ長方形の3つの辺に接するように入っている。長方形 ABCD の面積を求めよう。', '72',
      '①たての長さは円の直径で 6 cm　②横の長さは直径2つ分で 12 cm　③6 × 12 ＝ 72。答え 72 cm²',
      lambda: only([round(shoelace(*R0), 9)]), units=['cm²', 'cm2'])
attach(U, q, fg, '長方形ABCDの中に、たがいに接し長方形の辺に接する半径3cmの2つの円。')
assert abs(dist((3, 3), (9, 3)) - 6) < 1e-9

# 21 たがいに接する3つの円
C1, C2 = (0, 0), (5, 0); x3 = (36 - 49 + 25) / 10; C3 = (x3, math.sqrt(36 - x3 * x3))
assert abs(dist(C1, C3) - 6) < 1e-9 and abs(dist(C2, C3) - 7) < 1e-9
fg = Fig(-2.6, 9.4, -4.4, 9.8); fg.circle(C1, 2); fg.circle(C2, 3); fg.circle(C3, 4); fg.poly(C1, C2, C3)
fg.point('P', C1, off=(0.2, -1), d=14); fg.point('Q', C2, off=(1, -1), d=14); fg.point('R', C3, away=(2, 0))
fg.seg(C1, (-2, 0), dash=True); fg.seg(C2, (5, -3), dash=True); fg.seg(C3, (C3[0] - 4, C3[1]), dash=True)
fg.text('2 cm', (-1, 0), dx=6, dy=14); fg.text('3 cm', (5, -1.5), dx=24); fg.text('4 cm', (C3[0] - 2, C3[1]), dy=-12)
q = U.num('図のように、半径 2 cm、3 cm、4 cm の3つの円が、たがいに外側で接している。3つの円の中心 P、Q、R を結んだ三角形 PQR のまわりの長さを求めよう。', '18',
      '①外側で接する2つの円の中心のきょりは、半径の和　②PQ ＝ 2 + 3 ＝ 5、QR ＝ 3 + 4 ＝ 7、RP ＝ 4 + 2 ＝ 6　③5 + 7 + 6 ＝ 18。答え 18 cm',
      lambda: only([round(dist(C1, C2) + dist(C2, C3) + dist(C3, C1), 9)]), units=['cm'])
attach(U, q, fg, '半径2cm、3cm、4cmの3つの円がたがいに外側で接し、中心P、Q、Rを結んだ三角形がかいてある。')

# ---- 文章だけで条件がはっきりしている問題（38問） ----
U.num('時計の文字盤を円と考える。長い針が 12 時ちょうどから 20 分間に動いたとき、長い針の先がえがいた弧に対する中心角は何度か答えよう。', '120',
      '①長い針は 60 分で 1 周 360°　②1 分で 6° 動く　③20 × 6 ＝ 120。答え 120度', lambda: F(360, 60) * 20, units=D)
U.num('同じ円の2つのおうぎ形A、Bで、弧の長さの比が 3：5 である。おうぎ形Aの中心角が 54° のとき、おうぎ形Bの中心角を求めよう。', '90',
      '①同じ円では、中心角は弧の長さに比例する　②54 ÷ 3 × 5　③90。答え 90度', lambda: only(x for x in Q if x * 3 == 54 * 5), units=D)
U.num('円周が 36 cm の円で、中心角 70° のおうぎ形の弧の長さを求めよう。', '7',
      '①弧の長さは円周の (70 ÷ 360) 倍　②36 × 70 ÷ 360　③7。答え 7 cm', lambda: F(36 * 70, 360), units=['cm'])
U.num('ある円で、中心角 48° のおうぎ形の弧の長さが 8 cm である。同じ円で、弧の長さが 22 cm のおうぎ形の中心角を求めよう。', '132',
      '①弧の長さ 1 cm あたりの中心角は 48 ÷ 8 ＝ 6°　②22 cm では 6 × 22　③132。答え 132度', lambda: only(x for x in Q if x * 8 == 48 * 22), units=D)
U.num('円周を何等分かした点をとると、となりあう2点と中心がつくる中心角が 24° になった。円周を何等分したか答えよう。', '15',
      '①中心のまわりは 360°　②360 ÷ 24　③15。答え 15等分', lambda: only(n for n in range(1, 400) if F(360, n) == 24), units=['等分'])
U.num('円の周上に頂点がある正多角形で、となりあう2つの頂点と円の中心を結んでできる角が 30° だった。この正多角形は正何角形か答えよう。', '12',
      '①頂点は円周を等分する　②360 ÷ 30 ＝ 12 等分　③正十二角形。答え 12', lambda: F(360, 30), units=['角形'])
U.nums('原点Oを中心とする半径 4 の円がある。x 軸に平行な直線 y ＝ k がこの円に接するときの k の値を、2つとも答えよう。', ['4', '-4'],
       '①x 軸に平行な接線は、円のいちばん上といちばん下で接する　②いちばん上の点は (0, 4)、いちばん下は (0, −4)　③k ＝ 4、−4。答え 4、−4',
       lambda: [F(k) for k in range(-10, 11) if abs(k) == 4])
U.nums('点 (3, 2) を中心とする半径 5 の円の周上にあり、x 座標が 3 である点の y 座標を、2つとも答えよう。', ['7', '-3'],
       '①x 座標が 3 の点は、中心の真上と真下にある　②中心から上下に 5 はなれる　③2 + 5 ＝ 7、2 − 5 ＝ −3。答え 7、−3',
       lambda: [F(y) for y in range(-20, 21) if abs(y - 2) == 5])
U.coord('3点 A(−1, 0)、B(5, 0)、C(−1, 6) を通る円の中心の座標を答えよう（弦の垂直二等分線は中心を通る）。', ('2', '3'),
        '①弦 AB の垂直二等分線は x ＝ (−1 + 5) ÷ 2 ＝ 2 の直線　②弦 AC の垂直二等分線は y ＝ (0 + 6) ÷ 2 ＝ 3 の直線　③交わる点 (2, 3) が中心。答え (2, 3)',
        lambda: '(2,3)' if dist((2, 3), (-1, 0)) == dist((2, 3), (5, 0)) == dist((2, 3), (-1, 6)) else None)
U.num('円Oの弦 AB について、∠OAB ＝ 28° のとき、∠AOB の大きさを求めよう。', '124',
      '①OA ＝ OB なので三角形 OAB は二等辺三角形で ∠OBA ＝ 28°　②三角形の角の和は 180°　③180 − 28 × 2 ＝ 124。答え 124度', lambda: 180 - 2 * 28, units=D)
U.num('円Oで、半径と同じ長さの弦を、となりあう弦どうしが端の点を共有するように円周にそってつぎつぎにひいていく。ちょうど1周してもとの点にもどるまでに、弦は何本ひけるか答えよう。', '6',
      '①弦の長さが半径と同じなら、中心と弦の両端でできる三角形は正三角形で、中心角 60°　②360 ÷ 60 ＝ 6　③6 本（正六角形ができる）。答え 6本', lambda: F(360, 60), units=['本'])
U.num('円Oの弦 AB に中心Oから垂線 OM をひいた。AB ＝ 18 cm のとき、AM の長さを求めよう。', '9',
      '①中心から弦にひいた垂線は、弦を2等分する　②AM ＝ AB ÷ 2　③18 ÷ 2 ＝ 9。答え 9 cm', lambda: F(18, 2), units=['cm'])
U.num('円周上の3点で、円周を3つの弧に分けた。弧の長さの比が 4：5：9 のとき、いちばん長い弧に対する中心角を求めよう。', '180',
      '①中心角の比も 4：5：9 で、合計 18 つ分が 360°　②1つ分 20°　③9 × 20 ＝ 180（ちょうど半円）。答え 180度', lambda: F(360, 18) * 9, units=D)
U.num('半径が同じ2つのおうぎ形で、中心角が 108° と 72° である。中心角 108° のおうぎ形の弧の長さは、中心角 72° のおうぎ形の弧の長さの何倍か答えよう。', '1.5',
      '①同じ半径なら弧の長さは中心角に比例する　②108 ÷ 72　③1.5 倍。答え 1.5倍', lambda: F(108, 72), units=['倍'])
U.num('ある円で、中心角 35° のおうぎ形の弧の長さが 7 cm である。同じ円で中心角を何度にすれば、弧の長さが 3 倍になるか答えよう。', '105',
      '①弧の長さは中心角に比例する　②弧の長さを 3 倍にするには中心角も 3 倍　③35 × 3 ＝ 105。答え 105度', lambda: only(x for x in Q if x * 7 == 35 * 21), units=D)
U.pick('半径 6 cm の円Oがある。中心Oからのきょりが次のア〜エである点のうち、円の内部にある点をすべて選び、記号で答えよう。\nア 4 cm\nイ 6 cm\nウ 9 cm\nエ 5.9 cm', 'アエ',
       '①中心からのきょりが半径より小さい点は円の内部、等しい点は円周上、大きい点は外部　②ア 4 ＜ 6、エ 5.9 ＜ 6 は内部、イは円周上、ウは外部　③答え ア、エ',
       lambda: {n for n, d in zip('アイウエ', [4, 6, 9, F(59, 10)]) if d < 6})
U.num('円Oと直線 ℓ が接していて、中心Oと直線 ℓ のきょりは 7 cm である。この円の直径を求めよう。', '14',
      '①接するとき、中心と直線のきょりは半径に等しい　②半径 7 cm　③直径 7 × 2 ＝ 14。答え 14 cm', lambda: 7 * 2, units=['cm'])
U.num('半径 7 cm の円と半径 4 cm の円が、外側で1点で接している。2つの円の中心のきょりを求めよう。', '11',
      '①外側で接するとき、中心は接点をはさんで反対側にある　②中心のきょりは半径の和　③7 + 4 ＝ 11。答え 11 cm', lambda: 7 + 4, units=['cm'])
U.num('大きい円の内側で、小さい円が1点で接している。大きい円の半径は 9 cm、2つの円の中心のきょりは 3 cm である。小さい円の半径を求めよう。', '6',
      '①内側で接するとき、中心のきょりは半径の差　②9 − 小さい円の半径 ＝ 3　③小さい円の半径は 6。答え 6 cm', lambda: only(x for x in Q if 9 - x == 3), units=['cm'])
U.choice('円の対称の軸について正しいものを、次のア〜ウから選び、記号で答えよう。\nア 1本だけある\nイ 2本だけある\nウ 中心を通る直線はすべて対称の軸で、数えきれない', 'ウ',
         '①円は、中心を通るどの直線で折ってもぴったり重なる　②中心を通る直線は数えきれないほどある　③答え ウ', lambda: 'ウ')
U.num('中心角 140° のおうぎ形を、対称の軸で折ると両側がぴったり重なった。対称の軸と、おうぎ形の一方の半径がつくる角の大きさを求めよう。', '70',
      '①おうぎ形の対称の軸は、中心角を2等分する　②140 ÷ 2　③70。答え 70度', lambda: F(140, 2), units=D)
U.coord('点 (2, −1) を中心とする半径 3 の円の周上で、いちばん下にある点の座標を答えよう。', ('2', '-4'),
        '①いちばん下の点は中心の真下　②x 座標は 2 のまま、y 座標は 3 小さい　③(2, −4)。答え (2, −4)',
        lambda: '(2,-4)' if min([(2 + 3 * math.cos(math.radians(a)), round(-1 + 3 * math.sin(math.radians(a)), 9)) for a in range(360)], key=lambda p: p[1])[1] == -4 else None)
U.coord('点 (2, 1) を中心とする円の周上に点 A(5, 1) がある。A を一方の端とする直径のもう一方の端の座標を答えよう。', ('-1', '1'),
        '①直径の両端の中点が中心　②A から中心までは x 方向に −3　③中心からさらに −3 進んで (−1, 1)。答え (−1, 1)', lambda: '(-1,1)' if ((5 + -1) / 2, (1 + 1) / 2) == (2, 1) else None)
U.num('点 (3, −2) を中心とする半径 4 の円の、いちばん上の点で接する接線は、x 軸に平行な直線 y ＝ k になる。k の値を答えよう。', '2',
      '①いちばん上の点は (3, −2 + 4) ＝ (3, 2)　②接線は接点を通る半径（たての線）に垂直なので、横の直線　③y ＝ 2。答え 2', lambda: F(-2 + 4))
U.num('正八角形の8つの頂点が円Oの周上にある。となりあう頂点をA、Bとするとき、∠OAB の大きさを求めよう。', '67.5',
      '①∠AOB ＝ 360 ÷ 8 ＝ 45°　②OA ＝ OB の二等辺三角形　③(180 − 45) ÷ 2 ＝ 67.5。答え 67.5度', lambda: F(180 - 45, 2), units=D)
U.num('円周を 12 等分する点を、順に A、B、C、D、… とする。∠AOD（B、C がある側）の大きさを求めよう。', '90',
      '①となりあう点の中心角は 360 ÷ 12 ＝ 30°　②A から D までは 3 つ分　③30 × 3 ＝ 90。答え 90度', lambda: F(360, 12) * 3, units=D)
U.num('円Oの外の点Pから2本の接線 PA、PB をひくと、∠APB ＝ 60° になった。PA ＝ 7 cm のとき、弦 AB の長さを求めよう（PA ＝ PB である）。', '7',
      '①PA ＝ PB の二等辺三角形で頂角が 60°　②底角は (180 − 60) ÷ 2 ＝ 60° で、正三角形になる　③AB ＝ PA ＝ 7。答え 7 cm', lambda: 7 if F(180 - 60, 2) == 60 else 0, units=['cm'])
U.num('円Oの弧 AB の中点を M とする。∠AOB ＝ 110° のとき、∠AOM の大きさを求めよう。', '55',
      '①弧の長さが等しいと中心角も等しい　②弧 AM ＝ 弧 MB なので ∠AOM ＝ ∠MOB　③110 ÷ 2 ＝ 55。答え 55度', lambda: F(110, 2), units=D)
U.choice('円の中心がわからない円がある。中心を見つける方法として正しいものを、次のア〜ウから選び、記号で答えよう。\nア 円周上の2点を結ぶ弦を1本ひき、その中点を中心とする\nイ 弦を2本ひき、それぞれの垂直二等分線の交点を中心とする\nウ 円周上の1点で接線をひき、その接点を中心とする', 'イ',
         '①中心は、どの弦の垂直二等分線の上にもある　②2本の垂直二等分線の交点は、中心の1点だけ　③アは直径のときだけ正しい。答え イ', lambda: 'イ')
U.choice('円Oの周上の点Aを通る接線のかき方として正しいものを、次のア〜ウから選び、記号で答えよう。\nア 点Aを通り、半径 OA に垂直な直線をひく\nイ 点Aを通り、半径 OA に平行な直線をひく\nウ 点Aと中心Oを通る直線をひく', 'ア',
         '①接線は接点を通る半径に垂直　②A を通り OA に垂直な直線が接線　③答え ア', lambda: 'ア')
U.num('円周上に6つの点があり、どの3点も一直線上にない。2点を結ぶ弦は全部で何本ひけるか答えよう。', '15',
      '①1つの点から、ほかの 5 点へ 5 本ずつひける　②6 × 5 ＝ 30 は、同じ弦を2回ずつ数えている　③30 ÷ 2 ＝ 15。答え 15本',
      lambda: len({frozenset((i, j)) for i in range(6) for j in range(6) if i != j}), units=['本'])
U.choice('円周上の2点A、Bについて、弧 AB（短いほう）と弦 AB の長さをくらべたものとして正しいものを、次のア〜ウから選び、記号で答えよう。\nア 弦 AB のほうが長い\nイ 弧 AB のほうが長い\nウ いつも同じ長さ', 'イ',
         '①弦 AB は2点を結ぶ線分　②2点を結ぶ線の中で、線分がいちばん短い　③曲がっている弧 AB のほうが長い。答え イ',
         lambda: 'イ' if math.radians(60) * 1 > 2 * math.sin(math.radians(30)) else 'ア')
U.num('あるおうぎ形の弧の長さは、同じ半径の円の円周の 0.35 倍だった。このおうぎ形の中心角を求めよう。', '126',
      '①弧の長さは中心角に比例する　②360 × 0.35　③126。答え 126度', lambda: 360 * F(35, 100), units=D)
U.num('2つの円が、たがいに外側にはなれている（交わらず、接してもいない）。2つの円の両方に接する直線は、全部で何本ひけるか答えよう。', '4',
      '①2つの円の外側を通る共通な接線が 2 本　②2つの円の間を交差して通る共通な接線が 2 本　③合わせて 4 本。答え 4本', lambda: 2 + 2, units=['本'])
U.num('半径が同じ2つのおうぎ形A、Bで、Aの弧の長さはBの弧の長さの 2.5 倍である。Bの中心角が 48° のとき、Aの中心角を求めよう。', '120',
      '①半径が同じなら弧の長さは中心角に比例する　②A の中心角も B の 2.5 倍　③48 × 2.5 ＝ 120。答え 120度', lambda: 48 * F(25, 10), units=D)
U.num('円の内部にある点を通って、その円の接線をひこうとした。ひける接線は何本か答えよう。', '0',
      '①接線は円と1点だけで出会う直線　②円の内部の点を通る直線は、必ず円周と2点で交わる　③接線はひけない。答え 0本', lambda: 0, units=['本'])
U.num('半径 5 cm の2つの円があり、それぞれの円がもう一方の円の中心を通っている。2つの円の交点の1つをA、2つの中心を O、O\' とするとき、∠OAO\' の大きさを求めよう。', '60',
      "①OA と O'A はどちらも半径で 5 cm　②OO' も、一方の円の中心がもう一方の円周上にあるので 5 cm　③三角形 OAO' は正三角形で、∠OAO' ＝ 60。答え 60度",
      lambda: 60 if dist((0, 0), (5, 0)) == 5 and abs(ang((0, 0), (2.5, 5 * math.sqrt(3) / 2), (5, 0)) - 60) < 1e-9 else 0, units=D)
U.num('円Oの周上に点A、Bがあり、∠AOB ＝ 90° である。弦 AB と半径 OA がつくる角 ∠OAB の大きさを求めよう。', '45',
      '①OA ＝ OB の二等辺三角形で頂角が 90°　②底角は (180 − 90) ÷ 2　③45。答え 45度', lambda: F(180 - 90, 2), units=D)
write_reg('circle')
