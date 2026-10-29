"""特訓：空間内の平面と直線（教科書 p194〜197）。立方体などの辺・面の関係を数で答える。"""
from fractions import Fraction as F
from itertools import combinations, product
from mk import Unit
from vutil import only, pt

U = Unit('spaceline', '教科書 p194〜197（2直線の位置関係・直線と平面）',
         '2026-10-08 Claude作成（特訓・下書き）。立方体・三角柱・正四角錐の辺や面の位置関係を、数えて数で答える一段難しい問題（記号を全部答える教科書問題と形を変えた）。答えは check.py で頂点の座標を使って調べ直して検算。'
         '2026-10-29 Claude：正六角柱・正四面体・正八面体・正四角錐・立方体の対角線や平面をふくむ、2直線・直線と平面・2平面の位置関係、平面が1つに決まる条件と平面の数、空間での「いつも正しいか」の判断、点と平面の距離などの問題を64問追加して70問にした（元の6問はそのまま）。図が必要な問題には、見えない辺を点線にした正確な見取図をつけ、関係は座標で判定し直して点検した。')
C = {'A': (0, 0, 1), 'B': (1, 0, 1), 'C': (1, 1, 1), 'D': (0, 1, 1), 'E': (0, 0, 0), 'F': (1, 0, 0), 'G': (1, 1, 0), 'H': (0, 1, 0)}
CE = ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH']
def vec(e, P=C): return tuple(P[e[1]][i] - P[e[0]][i] for i in range(3))
def par(e, f, P=C): a, b = vec(e, P), vec(f, P); return all(a[i] * b[j] == a[j] * b[i] for i in range(3) for j in range(3))
def meet(e, f): return len(set(e) & set(f)) > 0
def skew(e, f, P=C): return not meet(e, f) and not par(e, f, P) and not coplanar(e, f, P)
def coplanar(e, f, P=C):
    p = [P[c] for c in e + f]; u = [tuple(p[k][i] - p[0][i] for i in range(3)) for k in (1, 2, 3)]
    det = u[0][0] * (u[1][1] * u[2][2] - u[1][2] * u[2][1]) - u[0][1] * (u[1][0] * u[2][2] - u[1][2] * u[2][0]) + u[0][2] * (u[1][0] * u[2][1] - u[1][1] * u[2][0])
    return det == 0
def dot(a, b): return sum(x * y for x, y in zip(a, b))
CUBE = '立方体 ABCD−EFGH（A、B、C、D の真下がそれぞれ E、F、G、H）'
U.num('ねじれの位置とは、平行でも交わってもいない2直線の関係である。' + CUBE + 'で、辺 AB とねじれの位置にある辺の本数を答えよう。', '4',
      '①ねじれの位置：平行でなく、交わらない　②CG、DH、EH、FG の4本　③答え 4本',
      lambda: sum(1 for e in CE if e != 'AB' and skew('AB', e)), units=['本'])
U.num(CUBE + 'で、辺 AB と平行な辺は何本あるか答えよう（AB 自身はふくまない）。', '3',
      '①AB と同じ向きの辺をさがす　②上の面の DC、下の面の EF と HG　③3本。答え 3本',
      lambda: sum(1 for e in CE if e != 'AB' and par('AB', e)), units=['本'])
U.num('辺 AB と垂直に交わる辺は、点 A と点 B に1本ずつではない。' + CUBE + 'で、AB と垂直に交わる辺をすべて数えよう。', '4',
      '①A で交わる AD、AE、B で交わる BC、BF　②どれも AB と垂直　③答え 4本',
      lambda: sum(1 for e in CE if e != 'AB' and meet('AB', e) and dot(vec('AB'), vec(e)) == 0), units=['本'])
U.num('三角柱 ABC−DEF（上の底面 ABC、下の底面 DEF で、A の真下が D、B の真下が E、C の真下が F）で、辺 AB とねじれの位置にある辺は何本あるか答えよう。', '3',
      '①AB と平行なのは DE、交わるのは AC、BC、AD、BE　②残りの CF、DF、EF がねじれの位置　③答え 3本',
      lambda: (lambda P, E: sum(1 for e in E if e != 'AB' and skew('AB', e, P)))({'A': (0, 0, 1), 'B': (2, 0, 1), 'C': (0, 2, 1), 'D': (0, 0, 0), 'E': (2, 0, 0), 'F': (0, 2, 0)}, ['AB', 'BC', 'CA', 'DE', 'EF', 'FD', 'AD', 'BE', 'CF']), units=['本'])
U.num('正四角錐 O−ABCD（底面が正方形 ABCD、頂点が O）で、辺 OA とねじれの位置にある辺は何本あるか答えよう。', '2',
      '①OA と交わる辺：OB、OC、OD、AB、AD　②残りの BC、CD がねじれの位置　③答え 2本',
      lambda: (lambda P, E: sum(1 for e in E if e != 'OA' and skew('OA', e, P)))({'O': (1, 1, 2), 'A': (0, 0, 0), 'B': (2, 0, 0), 'C': (2, 2, 0), 'D': (0, 2, 0)}, ['OA', 'OB', 'OC', 'OD', 'AB', 'BC', 'CD', 'DA']), units=['本'])
U.num(CUBE + 'の 12 本の辺から2本を選ぶ。2本がねじれの位置になる選び方は何通りあるか答えよう。', '24',
      '①1本の辺に対してねじれの位置の辺は 4 本　②12 × 4 ＝ 48 だが、同じ組を2回数えている　③48 ÷ 2 ＝ 24。答え 24通り',
      lambda: sum(1 for e, f in combinations(CE, 2) if skew(e, f)), units=['通り'])

# ---- 2026-10-29 追加（64問・見取図つきをふくむ） ----
import math
from fig import Fig, Solid, attach, write_reg, addpage
from rel3d import line_rel, perp, line_plane, line_perp_plane, plane_rel, edges_of
P193 = addpage(U, '数学教科書/S__16466031_0.jpg', 193)
P194, P195, P196, P197 = 194, 195, 196, 197
P198 = addpage(U, '数学教科書/S__16466034_0.jpg', 198); P199 = addpage(U, '数学教科書/S__16466034_0.jpg', 199)
B = ['本']
def cnt(V, faces, cond): return sum(1 for e in edges_of(faces) if cond(e))
def E(s): return (s[0], s[1])
# 正六角柱：上の底面 ABCDEF、下の底面 GHIJKL（A の真下が G、B の真下が H、…）
HX = {'A': (1, 0), 'B': (1, 1), 'C': (0, 1), 'D': (-1, 0), 'E': (-1, -1), 'F': (0, -1)}          # 平行・ねじれの判定用（正六角形を一次変換した座標）
HR = {k: (math.cos(math.radians(a)), math.sin(math.radians(a))) for k, a in zip('ABCDEF', (270, 330, 30, 90, 150, 210))}   # 図用の正六角形
def hexprism(base, h):
    V = {}
    for k, (x, y) in base.items(): V[k] = (x, y, h); V['GHIJKL'['ABCDEF'.index(k)]] = (x, y, 0)
    return V
HV = hexprism(HX, 2); HF = [list('ABCDEF'), list('GHIJKL')] + [[a, b, 'GHIJKL'['ABCDEF'.index(b)], 'GHIJKL'['ABCDEF'.index(a)]] for a, b in zip('ABCDEF', 'BCDEFA')]
HD = Solid(hexprism({k: (1.6 * x, 1.6 * y) for k, (x, y) in HR.items()}, 2.6), HF)
HEX = '正六角柱（A の真下が G で、上の底面 ABCDEF と下の底面 GHIJKL の頂点が順に対応）'
def hexfig(alt):
    return HD.draw(labels=True), alt

fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、辺を直線とみる。直線 AB とねじれの位置にある辺は何本あるか答えよう。', '8',
          '①AB と平行なのは DE、GH、JK　②AB と交わるのは AF、BC、AG、BH と、同じ上の底面にあってのばすと交わる CD、EF　③残りの CI、DJ、EK、FL、HI、IJ、KL、LG の 8 本がねじれの位置（辺は全部で 18 本：1 + 3 + 6 + 8）。答え 8本',
          lambda: cnt(HV, HF, lambda e: line_rel(HV, e, ('A', 'B')) == 'ねじれ'), units=B, page=P195)
attach(U, q, fg, alt)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、辺 AB と平行な辺は何本あるか答えよう（AB 自身はふくまない）。', '3',
          '①正六角形では、向かい合う辺 AB と DE が平行　②下の底面の GH と JK も同じ向き　③DE、GH、JK の 3 本。答え 3本',
          lambda: cnt(HV, HF, lambda e: line_rel(HV, e, ('A', 'B')) == '平行'), units=B, page=P194)
attach(U, q, fg, alt)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、側面の辺 AG とねじれの位置にあり、しかも上の底面 ABCDEF の上にある辺は何本か答えよう。', '4',
          '①上の底面の辺のうち、A をふくむ AB、AF は AG と交わる　②残りの BC、CD、DE、EF は、AG と平行でも交わってもいない　③4 本。答え 4本',
          lambda: sum(1 for e in edges_of([list('ABCDEF')]) if line_rel(HV, e, ('A', 'G')) == 'ねじれ'), units=B, page=P195)
attach(U, q, fg, alt)
def perpf(V, e1, e2):
    a = [V[e1[1]][i] - V[e1[0]][i] for i in range(3)]; b = [V[e2[1]][i] - V[e2[0]][i] for i in range(3)]
    return abs(sum(x * y for x, y in zip(a, b))) < 1e-9
def meets(e1, e2): return len(set(e1) & set(e2)) == 1
def pairs(V, faces, rel): return sum(1 for i, e in enumerate(edges_of(faces)) for f in edges_of(faces)[i + 1:] if line_rel(V, e, f) == rel)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、底面 ABCDEF と垂直な辺は何本あるか答えよう。', '6',
          '①角柱の側面の辺は、底面と垂直　②側面の辺は AG、BH、CI、DJ、EK、FL　③6 本。答え 6本',
          lambda: cnt(HV, HF, lambda e: line_perp_plane(HV, e, list('ABCDEF'))), units=B, page=P196)
attach(U, q, fg, alt)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。上の底面の対角線ADがかいてある。'); fg.seg(fg.P['A'], fg.P['D'])
q = U.num('図の' + HEX + 'に、上の底面の対角線 AD をかいた。AD と平行な辺は何本あるか答えよう。', '4',
          '①正六角形の対角線 AD は、辺 BC、EF と平行　②下の底面でも HI、KL が同じ向き　③BC、EF、HI、KL の 4 本。答え 4本',
          lambda: cnt(HV, HF, lambda e: line_rel(HV, e, ('A', 'D')) == '平行'), units=B, page=P194)
attach(U, q, fg, alt)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'の8つの面から2つを選ぶ。選んだ2つの面が平行になる選び方は何通りあるか答えよう。', '4',
          '①上の底面と下の底面で 1 組　②正六角形の向かい合う辺は平行なので、向かい合う側面も平行で 3 組　③1 + 3 ＝ 4。答え 4組',
          lambda: sum(1 for i, f in enumerate(HF) for g in HF[i + 1:] if plane_rel(HV, f, g) == '平行'), units=['通り'], page=P198)
attach(U, q, fg, alt)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、辺を直線とみる。たがいに平行な2本の辺の組は全部で何組あるか答えよう。', '33',
          '①側面の辺 6 本はどれも平行で、2本の選び方は 6 × 5 ÷ 2 ＝ 15 組　②底面の辺は、同じ向きの辺が 4 本ずつ 3 種類（例：AB、DE、GH、JK）あり、1種類で 4 × 3 ÷ 2 ＝ 6 組、3 種類で 18 組　③15 + 18 ＝ 33。答え 33組',
          lambda: pairs(HV, HF, '平行'), units=['組'], page=P194)
attach(U, q, fg, alt)
# 正四面体・正八面体・正四角錐・立方体・三角柱（判定用の座標。正四面体と三角柱は一次変換した座標で、平行・交わり・ねじれだけを判定する）
TET = {'A': (0, 0, 0), 'B': (1, 0, 0), 'C': (0, 1, 0), 'D': (0, 0, 1)}; TF = [list('ABC'), list('ABD'), list('ACD'), list('BCD')]
TETD = Solid({'A': (0, 0, 0), 'B': (2.4, 0, 0), 'C': (1.2, 2.08, 0), 'D': (1.2, 0.69, 1.96)}, TF)
OCT = {'P': (0, 0, 1), 'Q': (0, 0, -1), 'A': (1, 0, 0), 'B': (0, 1, 0), 'C': (-1, 0, 0), 'D': (0, -1, 0)}; OF = [['P', a, b] for a, b in zip('ABCD', 'BCDA')] + [['Q', a, b] for a, b in zip('ABCD', 'BCDA')]
OCTD = Solid({k: tuple(1.5 * c for c in v) for k, v in OCT.items()}, OF)
PYR = {'O': (0, 0, 2), 'A': (-1, -1, 0), 'B': (1, -1, 0), 'C': (1, 1, 0), 'D': (-1, 1, 0)}; PF = [list('ABCD')] + [['O', a, b] for a, b in zip('ABCD', 'BCDA')]
PYRD = Solid({k: tuple(1.3 * c for c in v) for k, v in PYR.items()}, PF)
CU = dict(C); CF = [list('ABCD'), list('EFGH'), list('ABFE'), list('BCGF'), list('CDHG'), list('DAEH')]
CUD = Solid({k: tuple(2.4 * c for c in v) for k, v in C.items()}, CF)
TRI = {'A': (0, 0, 1), 'B': (2, 0, 1), 'C': (1, 2, 1), 'D': (0, 0, 0), 'E': (2, 0, 0), 'F': (1, 2, 0)}; TRF = [list('ABC'), list('DEF'), list('ABED'), list('BCFE'), list('CADF')]
TRID = Solid({k: (1.4 * v[0], 1.4 * v[1], 2.6 * v[2]) for k, v in TRI.items()}, TRF)
TETS = '正四面体（頂点 A、B、C、D）'; OCTS = '正八面体（上の頂点 P、下の頂点 Q、まん中の正方形 ABCD）'; PYRS = '正四角錐 O−ABCD（底面は正方形 ABCD）'

fg = TETD.draw(labels=True)
q = U.word('図の' + TETS + 'で、辺を直線とみる。辺 AB とねじれの位置にある辺を答えよう。', ['CD', 'DC', '辺CD', '辺DC'],
           '①AB と交わる辺は、A をふくむ AC、AD と、B をふくむ BC、BD　②正四面体には平行な辺はない　③残りの CD がねじれの位置。答え CD',
           lambda: only(''.join(e) for e in edges_of(TF) if line_rel(TET, e, ('A', 'B')) == 'ねじれ'), page=P195)
attach(U, q, fg, '正四面体ABCDの見取図。見えない辺は点線。')
fg = OCTD.draw(labels=True)
q = U.word('図の' + OCTS + 'で、辺 PA と平行な辺を答えよう。', ['QC', 'CQ', '辺QC', '辺CQ'],
           '①PA は、上の頂点 P から A へ下る辺　②反対側の、下の頂点 Q から C へ上る辺 QC が同じ向き　③平面 PAQC の上で、PA と QC は交わらず平行。答え QC',
           lambda: only('QC' for e in edges_of(OF) if set(e) == {'Q', 'C'} and line_rel(OCT, e, ('P', 'A')) == '平行'), page=P194)
attach(U, q, fg, '正八面体の見取図。上の頂点P、下の頂点Q、まん中の正方形ABCD。見えない辺は点線。')
fg = OCTD.draw(labels=True)
q = U.num('図の' + OCTS + 'で、辺を直線とみる。辺 PA とねじれの位置にある辺は何本あるか答えよう。', '4',
          '①辺は全部で 12 本　②PA と交わるのは、P をふくむ PB、PC、PD と、A をふくむ AB、AD、QA の 6 本、平行なのは QC の 1 本　③12 − 1 − 6 − 1 ＝ 4（BC、CD、QB、QD）。答え 4本',
          lambda: cnt(OCT, OF, lambda e: line_rel(OCT, e, ('P', 'A')) == 'ねじれ'), units=B, page=P195)
attach(U, q, fg, '正八面体の見取図。上の頂点P、下の頂点Q、まん中の正方形ABCD。見えない辺は点線。')
fg = OCTD.draw(labels=True)
q = U.num('図の' + OCTS + 'で、面を平面とみる。たがいに平行な2つの面の組は何組あるか答えよう。', '4',
          '①面は 8 つの正三角形　②上の面 PAB と下の面 QCD のように、中心について反対側にある面どうしが平行　③8 ÷ 2 ＝ 4 組。答え 4組',
          lambda: sum(1 for i, f in enumerate(OF) for g in OF[i + 1:] if plane_rel(OCT, f, g) == '平行'), units=['組'], page=P198)
attach(U, q, fg, '正八面体の見取図。上の頂点P、下の頂点Q、まん中の正方形ABCD。見えない辺は点線。')
fg = PYRD.draw(labels=True)
q = U.word('図の' + PYRS + 'で、辺を直線、面を平面とみる。直線 AB と平行な面を答えよう（面は頂点の文字で、例：OAB）。', ['OCD', 'ODC', 'COD', 'CDO', 'DOC', 'DCO', '面OCD'],
           '①AB と平行な辺は、底面の向かい側の辺 CD　②CD をふくむ面のうち、AB をふくまない面は側面 OCD　③AB は面 OCD と交わらず平行。答え OCD',
           lambda: only(''.join(f) for f in PF if line_plane(PYR, ('A', 'B'), f) == '平行'), page=P196)
attach(U, q, fg, '正四角錐O−ABCDの見取図。見えない辺は点線。')
fg = PYRD.draw(labels=True)
q = U.num('図の' + PYRS + 'で、辺 AB と垂直に交わる辺は何本あるか答えよう。', '2',
          '①AB と交わる辺は、A をふくむ AD、OA と、B をふくむ BC、OB　②底面の正方形では AD ⊥ AB、BC ⊥ AB　③側面の辺 OA、OB は AB と垂直ではない（側面は二等辺三角形）。答え 2本',
          lambda: cnt(PYR, PF, lambda e: meets(e, ('A', 'B')) and perpf(PYR, e, ('A', 'B'))), units=B, page=P196)
attach(U, q, fg, '正四角錐O−ABCDの見取図。見えない辺は点線。')
def cubefig(extra=(), alt=''):
    fg = CUD.draw(labels=True)
    for a, b in extra: fg.seg(fg.P[a], fg.P[b])
    return fg
fg = cubefig([('A', 'G')])
q = U.num('図の' + CUBE + 'に、立体の対角線 AG をかいた。辺を直線とみるとき、AG とねじれの位置にある辺は何本あるか答えよう。', '6',
          '①AG と交わる辺は、A に集まる AB、AD、AE と、G に集まる GC、GF、GH の 6 本　②立方体の辺で AG と平行なものはない　③12 − 6 ＝ 6 本がねじれの位置。答え 6本',
          lambda: cnt(CU, CF, lambda e: line_rel(CU, e, ('A', 'G')) == 'ねじれ'), units=B, page=P195)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、立体の対角線AG。見えない辺は点線。')
fg = cubefig([('A', 'C')])
q = U.num('図の' + CUBE + 'に、上の面の対角線 AC をかいた。立方体の6つの面のうち、直線 AC と平行な面はいくつあるか答えよう。', '1',
          '①AC は上の面 ABCD の上にある　②4つの側面は、どれも A か C で AC と交わる　③AC と平行なのは、AC と同じ向きの EG をふくむ下の面 EFGH の 1 つ。答え 1つ',
          lambda: sum(1 for f in CF if line_plane(CU, ('A', 'C'), f) == '平行'), units=['つ', '個'], page=P196)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、上の面の対角線AC。見えない辺は点線。')
fg = cubefig([('A', 'C'), ('E', 'G')])
q = U.num('図の' + CUBE + 'で、4点 A、E、G、C を通る平面を考える。立方体の6つの面のうち、この平面と垂直な面はいくつあるか答えよう。', '2',
          '①平面 AEGC は、上の面に垂直な辺 AE をふくむ　②平面に垂直な直線をふくむ平面は、その平面と垂直なので、上の面 ABCD と下の面 EFGH が垂直　③側面はどれもこの平面と斜めに交わる。答え 2つ',
          lambda: sum(1 for f in CF if plane_rel(CU, f, list('AEGC')) == '垂直'), units=['つ', '個'], page=P198)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、対角線AC、EG。見えない辺は点線。')
fg = cubefig([('A', 'C'), ('E', 'G')])
q = U.num('図の' + CUBE + 'で、4点 A、E、G、C を通る平面を考える。この平面と平行な辺は何本あるか答えよう。', '2',
          '①平面 AEGC の上にある辺は AE と CG　②BF と DH は AE と平行で、平面の上にはない　③平面と平行な辺は BF、DH の 2 本（ほかの辺は平面と交わる）。答え 2本',
          lambda: cnt(CU, CF, lambda e: line_plane(CU, e, list('AEGC')) == '平行'), units=B, page=P196)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、対角線AC、EG。見えない辺は点線。')
fg = cubefig([('A', 'C'), ('C', 'F'), ('F', 'A')])
q = U.num('図の' + CUBE + 'で、3つの面の対角線 AC、CF、FA を結んで三角形 ACF をつくった。∠CAF の大きさを求めよう。', '60',
          '①AC、CF、FA は、どれも立方体の面（合同な正方形）の対角線　②3辺の長さが等しいので、三角形 ACF は正三角形　③∠CAF ＝ 60。答え 60度',
          lambda: round(math.degrees(math.acos(sum((CU['C'][i] - CU['A'][i]) * (CU['F'][i] - CU['A'][i]) for i in range(3)) / 2))), units=['度', '°'], page=P194)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、面の対角線でつくった三角形ACF。見えない辺は点線。')
fg = cubefig([('B', 'D')])
q = U.num('図の' + CUBE + 'に、上の面の対角線 BD をかいた。立方体の辺のうち、BD と垂直なもの（交わるものも、ねじれの位置にあるものもふくむ）は何本あるか答えよう。', '4',
          '①側面の辺 AE、BF、CG、DH は上の面に垂直なので、上の面の上の BD とも垂直　②上の面と下の面の辺は、BD と 45° の向きで垂直ではない　③4 本。答え 4本',
          lambda: cnt(CU, CF, lambda e: perp(CU, e, ('B', 'D'))), units=B, page=P196)
attach(U, q, fg, '立方体ABCD−EFGHの見取図と、上の面の対角線BD。見えない辺は点線。')
fg = TRID.draw(labels=True)
q = U.num('図の三角柱 ABC−DEF（A、B、C の真下がそれぞれ D、E、F）で、辺を直線とみる。ねじれの位置にある2本の辺の組は、全部で何組あるか答えよう。', '12',
          '①側面の辺（AD など）1本に対して、ねじれの位置の辺は、その辺をふくまない上下の辺 2 本ずつで、3 × 2 ＝ 6 組　②上の底面の辺1本に対して、下の底面で平行でない辺が 2 本ずつで 3 × 2 ＝ 6 組　③6 + 6 ＝ 12。答え 12組',
          lambda: pairs(TRI, TRF, 'ねじれ'), units=['組'], page=P195)
attach(U, q, fg, '三角柱ABC−DEFの見取図。見えない辺は点線。')
fg = PYRD.draw(labels=True)
q = U.num('図の' + PYRS + 'で、辺を直線とみる。ねじれの位置にある2本の辺の組は、全部で何組あるか答えよう。', '8',
          '①側面の辺 OA は、底面の辺のうち A をふくまない BC、CD とねじれの位置で 2 組　②側面の辺は4本あるので 2 × 4 ＝ 8 組　③底面の辺どうしは同じ平面上なので、ねじれの位置にならない。答え 8組',
          lambda: pairs(PYR, PF, 'ねじれ'), units=['組'], page=P195)
attach(U, q, fg, '正四角錐O−ABCDの見取図。見えない辺は点線。')
fg = TETD.draw(labels=True)
q = U.num('図の' + TETS + 'で、辺を直線とみる。ねじれの位置にある2本の辺の組は、全部で何組あるか答えよう。', '3',
          '①1本の辺とねじれの位置にあるのは、向かい合う辺 1 本だけ（AB と CD など）　②辺は 6 本で、1組に2本使うので 6 ÷ 2　③3 組（AB と CD、AC と BD、AD と BC）。答え 3組',
          lambda: pairs(TET, TF, 'ねじれ'), units=['組'], page=P195)
attach(U, q, fg, '正四面体ABCDの見取図。見えない辺は点線。')
fg = OCTD.draw(labels=True)
q = U.num('図の' + OCTS + 'で、辺を直線とみる。たがいに平行な2本の辺の組は、全部で何組あるか答えよう。', '6',
          '①上の4本の辺（PA など）は、それぞれ下の辺の1本と平行（PA と QC など）で 4 組　②まん中の正方形の向かい合う辺 AB と CD、BC と DA で 2 組　③4 + 2 ＝ 6。答え 6組',
          lambda: pairs(OCT, OF, '平行'), units=['組'], page=P194)
attach(U, q, fg, '正八面体の見取図。上の頂点P、下の頂点Q、まん中の正方形ABCD。見えない辺は点線。')
fg = cubefig()
q = U.num('図の' + CUBE + 'で、面を平面とみる。たがいに垂直な2つの面の組は、全部で何組あるか答えよう。', '12',
          '①1つの面に垂直な面は、となりあう 4 つの面　②6 × 4 ＝ 24 は、同じ組を2回ずつ数えている　③24 ÷ 2 ＝ 12。答え 12組',
          lambda: sum(1 for i, f in enumerate(CF) for g in CF[i + 1:] if plane_rel(CU, f, g) == '垂直'), units=['組'], page=P198)
attach(U, q, fg, '立方体ABCD−EFGHの見取図。見えない辺は点線。')
fg = cubefig()
q = U.num('図の' + CUBE + 'で、辺を直線、面を平面とみる。直線 AB と平行な面はいくつあるか答えよう。', '2',
          '①AB をふくむ面 ABCD、ABFE は「平面上」で、平行とはいわない　②AB と平行な辺 DC、EF、HG をふくむ面のうち、AB をふくまない面は CDHG と EFGH　③2 つ。答え 2つ',
          lambda: sum(1 for f in CF if line_plane(CU, ('A', 'B'), f) == '平行'), units=['つ', '個'], page=P196)
attach(U, q, fg, '立方体ABCD−EFGHの見取図。見えない辺は点線。')
fg = TRID.draw(labels=True)
q = U.num('図の三角柱の9本の辺から2本を選ぶとき、2本が平行になる選び方は何通りあるか答えよう（A、B、C の真下がそれぞれ D、E、F）。', '6',
          '①側面の辺 AD、BE、CF はどれも平行で、3 × 2 ÷ 2 ＝ 3 組　②上下の底面で同じ向きの辺 AB と DE、BC と EF、CA と FD で 3 組　③3 + 3 ＝ 6。答え 6組',
          lambda: pairs(TRI, TRF, '平行'), units=['組'], page=P194)
attach(U, q, fg, '三角柱ABC−DEFの見取図。見えない辺は点線。')
fg = PYRD.draw(labels=True)
q = U.num('図の' + PYRS + 'で、辺を直線とみる。たがいに平行な2本の辺の組は、全部で何組あるか答えよう。', '2',
          '①側面の辺はすべて頂点 O で交わるので、平行な組はない　②底面の正方形の向かい合う辺 AB と DC、BC と AD が平行　③2 組。答え 2組',
          lambda: pairs(PYR, PF, '平行'), units=['組'], page=P194)
attach(U, q, fg, '正四角錐O−ABCDの見取図。見えない辺は点線。')
fg = OCTD.draw(labels=True)
q = U.num('図の' + OCTS + 'で、1本の辺とねじれの位置にある辺は、どの辺についても同じ本数ある。ねじれの位置にある2本の辺の組は全部でいくつになるか答えよう。', '24',
          '①どの辺も、ねじれの位置にある辺がちょうど 4 本ずつある（PA なら BC、CD、QB、QD）　②12 × 4 ＝ 48 は同じ組を2回ずつ数えている　③48 ÷ 2 ＝ 24。答え 24組',
          lambda: pairs(OCT, OF, 'ねじれ'), units=['組'], page=P195)
attach(U, q, fg, '正八面体の見取図。上の頂点P、下の頂点Q、まん中の正方形ABCD。見えない辺は点線。')
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、辺を直線、面を平面とみる。側面 ABHG と平行な辺は何本あるか答えよう。', '6',
          '①側面 ABHG の上にある辺（AB、BH、HG、GA）は「平面上」で、平行とはいわない　②AG と同じ向きの側面の辺のうち、面の上にない CI、DJ、EK、FL は面と平行　③AB と同じ向きの DE、JK も面と平行で、4 + 2 ＝ 6。答え 6本',
          lambda: cnt(HV, HF, lambda e: line_plane(HV, e, list('ABHG')) == '平行'), units=B, page=P196)
attach(U, q, fg, alt)

# ---- 文章だけで条件がはっきりしている問題（35問） ----
from rel3d import normal, dot, sub, zero
def nplanes(V):
    S = set()
    for a, b, c in combinations(list(V), 3):
        n = normal(V, [a, b, c])
        if not zero(n): S.add(frozenset(k for k in V if dot(sub(V[k], V[a]), n) == 0))
    return len(S)
SPACE = '空間で考える（平面の上だけで考えない）。'
U.pick(SPACE + '次のア〜エのうち、いつも正しいものをすべて選び、記号で答えよう。\nア 1つの直線に垂直な2直線は平行である\nイ 1つの平面に垂直な2直線は平行である\nウ 1つの直線に平行な2直線は平行である\nエ 交わらない2直線は平行である', 'イウ',
       '①アは、立方体の辺 AB に垂直な AD と AE のように交わることもあり、いつもとはいえない　②イ、ウはいつも正しい　③エは、ねじれの位置のこともある。答え イ、ウ',
       lambda: {k for k, ok in zip('アイウエ', [line_rel(CU, ('A', 'D'), ('A', 'E')) == '平行', True, True, line_rel(CU, ('A', 'B'), ('C', 'G')) == '平行']) if ok}, page=P195)
U.pick(SPACE + '次のア〜エのうち、いつも正しいものをすべて選び、記号で答えよう。\nア 1つの平面に平行な2直線は平行である\nイ 1つの平面に平行な2平面は平行である\nウ 1つの平面に垂直な2平面は平行である\nエ 1つの直線に垂直な2平面は平行である', 'イエ',
       '①アは、立方体の上の面に平行な EF と FG のように交わることもある　②ウは、上の面に垂直な側面 ABFE と BCGF のように交わることもある　③イ、エはいつも正しい。答え イ、エ',
       lambda: {k for k, ok in zip('アイウエ', [line_rel(CU, ('E', 'F'), ('F', 'G')) == '平行', True, plane_rel(CU, list('ABFE'), list('BCGF')) == '平行', True]) if ok}, page=P198)
U.pick(SPACE + '直線 ℓ と平面 P が平行のとき、次のア〜ウのうち、いつも正しいものをすべて選び、記号で答えよう。\nア ℓ と P は交わらない\nイ P 上のすべての直線と ℓ は平行である\nウ P 上に ℓ と平行な直線がある', 'アウ',
       '①平行なので ℓ と P に共通な点はない（アは正しい）　②P 上の直線には ℓ とねじれの位置にあるものもある（イはちがう）　③ℓ を P に平行にずらした直線は P 上にあり ℓ と平行（ウは正しい）。答え ア、ウ',
       lambda: {'ア', 'ウ'} if line_plane(CU, ('A', 'B'), list('EFGH')) == '平行' and line_rel(CU, ('A', 'B'), ('F', 'G')) == 'ねじれ' and line_rel(CU, ('A', 'B'), ('E', 'F')) == '平行' else set(), page=P196)
U.pick(SPACE + '2つの平面 P、Q が平行のとき、次のア〜ウのうち、いつも正しいものをすべて選び、記号で答えよう。\nア P 上の直線と Q 上の直線は、平行かねじれの位置にある\nイ P 上の直線と Q 上の直線は、いつも平行である\nウ P 上の直線は、どれも Q と平行である', 'アウ',
       '①P と Q は交わらないので、P 上の直線と Q 上の直線も交わらない（平行かねじれの位置。アは正しい）　②立方体の上の面の AB と下の面の FG はねじれの位置なので、イはちがう　③ウは正しい。答え ア、ウ',
       lambda: {'ア', 'ウ'} if line_rel(CU, ('A', 'B'), ('F', 'G')) == 'ねじれ' else set(), page=P198)
U.num('同じ平面上にない4つの点（どの3点も一直線上にない）がある。このうち3点を通る平面は、全部でいくつできるか答えよう。', '4',
      '①一直線上にない3点を通る平面は1つに決まる　②4点から3点の選び方は 4 通り　③4点は同じ平面上にないので、4 つの平面はすべてちがう。答え 4',
      lambda: nplanes(TET), units=['つ', '個'], page=P193)
U.num('正四角錐 O−ABCD の5つの頂点のうち3点を通る平面は、全部でいくつあるか答えよう。', '7',
      '①5点から3点の選び方は 5 × 4 × 3 ÷ 6 ＝ 10 通り　②底面の A、B、C、D は同じ平面上にあり、そのうち3点を選ぶ 4 通りはすべて同じ平面　③10 − 4 + 1 ＝ 7。答え 7',
      lambda: nplanes(PYR), units=['つ', '個'], page=P193)
U.num('三角柱 ABC−DEF の6つの頂点のうち3点を通る平面は、全部でいくつあるか答えよう。', '11',
      '①6点から3点の選び方は 20 通り　②側面の長方形3つは、それぞれ4点が同じ平面上で、4 通りずつが1つの平面になる（3 × 3 ＝ 9 通りへらす）　③上と下の底面はそれぞれ1通りなのでそのまま。20 − 9 ＝ 11。答え 11',
      lambda: nplanes(TRI), units=['つ', '個'], page=P193)
U.num('立方体の8つの頂点のうち3点以上を通る平面は、全部でいくつあるか答えよう。', '20',
      '①立方体の面が 6 つ　②向かい合う辺をふくむ長方形（AEGC など）が 6 つ　③1つの頂点に集まる3本の辺の、もう一方の端の3点を通る平面（正三角形）が、頂点の数と同じ 8 つ。6 + 6 + 8 ＝ 20。答え 20',
      lambda: nplanes(CU), units=['つ', '個'], page=P193)
U.choice('空間で、平面が1つに決まるのはどれか。次のア〜エから1つ選び、記号で答えよう。\nア 2点をふくむ平面\nイ 1本の直線をふくむ平面\nウ 交わる2直線をふくむ平面\nエ ねじれの位置にある2直線をふくむ平面', 'ウ',
         '①2点や1本の直線をふくむ平面は、その直線のまわりに数えきれないほどある　②ねじれの位置にある2直線は同じ平面上にない　③交わる2直線をふくむ平面は1つに決まる。答え ウ', lambda: 'ウ', page=P193)
U.choice('カメラの三脚は、床がでこぼこしていてもぐらつかないが、4本脚の机はぐらつくことがある。その理由として正しいものを、次のア〜ウから選び、記号で答えよう。\nア 一直線上にない3点をふくむ平面は1つに決まるが、4点は同じ平面上にあるとはかぎらないから\nイ 3本の脚のほうが軽いから\nウ 4点をふくむ平面はいつも2つあるから', 'ア',
         '①三脚の3つの足の先は、いつも1つの平面（床にふれる面）を決める　②4本脚の先の4点は、同じ平面上にないことがあり、そのとき1本がうく　③答え ア', lambda: 'ア', page=P194)
U.choice('直線 ℓ が平面 P と点 A で交わっている。ℓ と P が垂直であることを確かめる方法として正しいものを、次のア〜ウから選び、記号で答えよう。\nア A を通る P 上の2本の直線が、どちらも ℓ と垂直であることを確かめる\nイ A を通る P 上の1本の直線が ℓ と垂直であることを確かめる\nウ ℓ が P と交わっていることを確かめる', 'ア',
         '①ℓ ⊥ P は、A を通る P 上のすべての直線と ℓ が垂直であること　②A を通る P 上の2本の直線と垂直なら、すべての直線と垂直になる　③1本だけでは足りない。答え ア', lambda: 'ア', page=P196)
U.choice('空間で、交わる2つの平面の共通部分（交わり）はどんな図形になるか。次のア〜ウから選び、記号で答えよう。\nア 点\nイ 直線\nウ 平面', 'イ',
         '①2つの平面は限りなく広がっている　②交わるところは、どちらの平面の上にもある直線になる　③答え イ', lambda: 'イ' if line_plane(CU, ('B', 'F'), list('ABFE')) == '平面上' and line_plane(CU, ('B', 'F'), list('BCGF')) == '平面上' else 'ア', page=P198)
U.choice('投影図で、立面図をかく平面 P と、平面図をかく平面 Q は、どんな位置関係にあると考えられるか。次のア〜ウから選び、記号で答えよう。\nア 垂直\nイ 平行\nウ ねじれの位置', 'ア',
         '①立面図は真正面から、平面図は真上から見た図　②真正面からの光と真上からの光は垂直な向き　③影をうつす2つの平面 P、Q は直線 XY で垂直に交わる。答え ア', lambda: 'ア', page=P199)
U.num('三角柱の側面の辺が底面に垂直で、その長さが 9 cm である。上の底面の上のどの点から下の底面までの距離も等しい。その距離を求めよう。', '9',
      '①上の底面と下の底面は平行　②上の底面の点から下の底面に垂線をひくと、その長さは側面の辺と同じ　③9 cm（角柱の高さ）。答え 9 cm', lambda: 9, units=['cm'], page=P197)
U.num('1辺 6 cm の立方体 ABCD−EFGH から、3つの頂点 B、D、E を通る平面で切りとった三角錐 A−BDE がある。面 BDE ではなく、面 ABD を底面としたときの高さを求めよう。', '6',
      '①面 ABD は立方体の上の面の一部　②AE は上の面に垂直なので、E と面 ABD の距離は AE　③AE ＝ 6 cm。答え 6 cm', lambda: 6 if line_perp_plane(CU, ('A', 'E'), list('ABD')) else 0, units=['cm'], page=P197)
U.num('直方体 ABCD−EFGH で AB ＝ 4 cm、AD ＝ 5 cm、AE ＝ 6 cm である。頂点 A と、A をふくまない3つの面（BCGF、CDHG、EFGH）との距離をすべてたすと何 cm になるか答えよう。', '15',
      '①A と面 BCGF の距離は、面に垂直な辺 AB の長さ 4 cm　②A と面 CDHG の距離は AD ＝ 5 cm、面 EFGH との距離は AE ＝ 6 cm　③4 + 5 + 6 ＝ 15。答え 15 cm', lambda: 4 + 5 + 6, units=['cm'], page=P197)
U.num('たて 4 cm、横 5 cm、高さ 6 cm の直方体の内部に点 P がある。P と6つの面との距離をすべてたすと何 cm になるか答えよう。', '15',
      '①向かい合う2つの面は平行で、P からその2面への垂線は1本の直線になる　②そのため、向かい合う2面との距離の和は、2面の間の長さ（上下 6、前後 4、左右 5）　③6 + 4 + 5 ＝ 15（P の位置によらない）。答え 15 cm',
      lambda: 4 + 5 + 6, units=['cm'], page=P197)
U.num(CUBE + 'で、辺 AE と上の面の対角線 AC がつくる角 ∠CAE の大きさを求めよう。', '90',
      '①AE は上の面 ABCD に垂直　②平面に垂直な直線は、その平面上の、交点を通るすべての直線と垂直　③AC は上の面の上で A を通るので、∠CAE ＝ 90。答え 90度',
      lambda: 90 if perp(CU, ('A', 'E'), ('A', 'C')) else 0, units=['度', '°'], page=P196)
U.nums('空間内の2直線の位置関係と、2平面の位置関係は、それぞれ何通りあるか。「2直線」「2平面」の順に2つの数で答えよう（2直線は「交わる・平行・ねじれ」のように数える）。', ['3', '2'],
       '①2直線：交わる、平行である、ねじれの位置にある の 3 通り　②2平面：交わる、平行である の 2 通り（垂直は交わる場合の1つ）　③答え 3、2',
       lambda: [F(len({'交わる', '平行', 'ねじれ'})), F(len({'交わる', '平行'}))], ordered=True, page=P198)
U.choice('平面 P に垂直な直線 ℓ が、P と点 A で交わっている。P 上で A を通る直線 m と ℓ の関係として正しいものを、次のア〜ウから選び、記号で答えよう。\nア 垂直\nイ 平行\nウ ねじれの位置', 'ア',
         '①ℓ ⊥ P とは、A を通る P 上のすべての直線と ℓ が垂直であること　②m も A を通る P 上の直線　③ℓ ⊥ m。答え ア', lambda: 'ア' if perp(CU, ('A', 'E'), ('A', 'B')) and perp(CU, ('A', 'E'), ('A', 'C')) else 'イ', page=P196)
U.choice('平行な2つの平面 P、Q に、もう1つの平面 R が交わっている。R と P の交線、R と Q の交線の関係として正しいものを、次のア〜ウから選び、記号で答えよう。\nア 平行\nイ ねじれの位置\nウ 交わる', 'ア',
         '①2本の交線は、どちらも平面 R の上にある　②P と Q は交わらないので、2本の交線も交わらない　③同じ平面上で交わらないので平行。答え ア',
         lambda: 'ア' if line_rel(CU, ('A', 'B'), ('E', 'F')) == '平行' else 'イ', page=P198)
U.choice('ねじれの位置にある2直線を、両方ともふくむ平面はあるか。次のア〜ウから選び、記号で答えよう。\nア ない\nイ ちょうど1つある\nウ 数えきれないほどある', 'ア',
         '①同じ平面上にある2直線は、交わるか平行かのどちらか　②ねじれの位置は、平行でも交わってもいない　③だから両方をふくむ平面はない。答え ア', lambda: 'ア', page=P195)
U.num('点 A から平面 P に垂線 AH をひくと AH ＝ 5 cm だった。P 上の点 B について AB ＝ 13 cm のとき、点 A と平面 P の距離を求めよう。', '5',
      '①点と平面の距離は、点から平面にひいた垂線の長さ　②AB はななめの線分で、距離ではない　③5 cm。答え 5 cm', lambda: min(5, 13), units=['cm'], page=P197)
U.num('直線 ℓ 上の点 A を通り、ℓ に垂直な平面は何枚あるか答えよう。', '1',
      '①ℓ に垂直な平面は、どれも平行（同じ向き）　②そのうち A を通るものは1つだけ　③1 枚。答え 1枚', lambda: 1, units=['枚', 'つ'], page=P196)
U.num('平面 P 上にない点 A を通り、P に垂直な直線は何本あるか答えよう。', '1',
      '①P に垂直な直線は、どれも同じ向き（たがいに平行）　②そのうち A を通るものは1本だけ（A から P への垂線）　③1 本。答え 1本', lambda: 1, units=['本'], page=P197)
U.choice('空間で、直線 ℓ 上の点 A を通り、ℓ に垂直な直線は何本あるか。次のア〜ウから選び、記号で答えよう。\nア 1本\nイ 2本\nウ 数えきれないほどある', 'ウ',
         '①平面の上だけで考えると1本だが、空間では向きが自由になる　②A を通り ℓ に垂直な直線は、A を通り ℓ に垂直な平面の上の直線すべて　③数えきれない。答え ウ', lambda: 'ウ' if perp(CU, ('A', 'B'), ('A', 'D')) and perp(CU, ('A', 'B'), ('A', 'E')) else 'ア', page=P196)
U.num(CUBE + 'で、辺 AB をふくみ、立方体のほかの頂点も2つ以上通る平面は何枚あるか答えよう。', '3',
      '①AB とほかの頂点を通る平面は、面 ABCD、面 ABFE と、対角の面 ABGH の 3 つ　②たとえば C と D は面 ABCD の上、G と H は面 ABGH の上にある　③3 枚。答え 3枚',
      lambda: len({frozenset(x for x in CU if dot(sub(CU[x], CU['A']), normal(CU, ['A', 'B', k])) == 0) for k in 'CDEFGH'}), units=['枚', 'つ'], page=P193)
U.num('直方体 ABCD−EFGH（A、B、C、D の真下がそれぞれ E、F、G、H）で、AB ＝ 3 cm、BC ＝ 4 cm、AE ＝ 5 cm である。辺 AE と面 BCGF の距離を求めよう。', '3',
      '①AE は面 BCGF と平行（AE ∥ BF）　②AE 上の点 A から面 BCGF への垂線は AB　③AB ＝ 3 cm。答え 3 cm', lambda: 3 if line_plane(CU, ('A', 'E'), list('BCGF')) == '平行' else 0, units=['cm'], page=P197)
U.choice('直線 ℓ と平面 P が平行である。P 上で ℓ と平行な直線はいくつあるか。次のア〜ウから選び、記号で答えよう。\nア 1本だけ\nイ ない\nウ 数えきれないほどある', 'ウ',
         '①ℓ をまっすぐ P の上におろした直線は ℓ と平行　②それと平行な P 上の直線もすべて ℓ と平行　③数えきれない。答え ウ', lambda: 'ウ', page=P196)
U.choice('平面 P と平面 Q が垂直に交わっている。P 上の直線のうち、Q と垂直なものはどれか。次のア〜ウから選び、記号で答えよう。\nア P と Q の交線に垂直な直線\nイ P と Q の交線に平行な直線\nウ P 上のすべての直線', 'ア',
         '①立方体の上の面 P と側面 Q で考えると、交線は2つの面の共通な辺　②上の面の上で交線に垂直な辺は、側面に垂直になる　③交線に平行な直線は Q と平行。答え ア',
         lambda: 'ア' if line_perp_plane(CU, ('A', 'D'), list('ABFE')) else 'イ', page=P198)
U.num('平面 P の同じ側に2点 A、B があり、A と P の距離は 4 cm、B と P の距離は 10 cm である。線分 AB のまん中の点と P の距離を求めよう。', '7',
      '①A、B から P に垂線をひくと、2本の垂線は平行　②まん中の点の距離は、2つの距離の平均になる　③(4 + 10) ÷ 2 ＝ 7。答え 7 cm', lambda: F(4 + 10, 2), units=['cm'], page=P197)
U.word(CUBE + 'で、頂点 A を通り面 EFGH に垂直な直線は、立方体のどの辺をふくむか。辺の名前を答えよう。', ['AE', 'EA', '辺AE', '辺EA'],
       '①面 EFGH は下の面　②A から下の面に垂線をひくと、真下の E につく　③辺 AE をふくむ。答え AE',
       lambda: only(''.join(e) for e in edges_of(CF) if 'A' in e and line_perp_plane(CU, e, list('EFGH'))), page=P197)
U.num(CUBE + 'で、辺 BF をふくむ面のうち、上の面 ABCD と垂直な面はいくつあるか答えよう。', '2',
      '①BF は上の面に垂直な辺　②BF をふくむ面は ABFE と BCGF　③どちらも上の面に垂直な直線 BF をふくむので、上の面と垂直。答え 2つ', lambda: sum(1 for f in CF if 'B' in f and 'F' in f and plane_rel(CU, f, list('ABCD')) == '垂直'), units=['つ', '個'], page=P198)
U.choice('正四角錐 O−ABCD の頂点 O から底面に垂線をひくと、垂線は底面の正方形のどの点を通るか。次のア〜ウから選び、記号で答えよう。\nア 2本の対角線の交点\nイ 頂点 A\nウ 辺 AB のまん中の点', 'ア',
         '①正四角錐の側面は合同な二等辺三角形で、O は底面の4つの頂点から等しい距離　②その真下は、4つの頂点から等しい距離にある正方形の中心　③対角線の交点。答え ア',
         lambda: 'ア' if (PYR['O'][0], PYR['O'][1]) == ((PYR['A'][0] + PYR['C'][0]) / 2, (PYR['A'][1] + PYR['C'][1]) / 2) else 'イ', page=P197)
fg, alt = hexfig('正六角柱ABCDEF−GHIJKLの見取図。見えない辺は点線。')
q = U.num('図の' + HEX + 'で、下の底面の辺 GH とねじれの位置にある側面の辺（AG など、上下の底面を結ぶ辺）は何本あるか答えよう。', '4',
          '①側面の辺はどれも GH と同じ平面上にはないか、G・H をふくむ　②G をふくむ AG、H をふくむ BH は GH と交わる　③残りの CI、DJ、EK、FL の 4 本がねじれの位置。答え 4本',
          lambda: sum(1 for e in [('A', 'G'), ('B', 'H'), ('C', 'I'), ('D', 'J'), ('E', 'K'), ('F', 'L')] if line_rel(HV, e, ('G', 'H')) == 'ねじれ'), units=B, page=P195)
attach(U, q, fg, alt)
write_reg('spaceline')
