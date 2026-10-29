"""特訓：空間内の平面と直線（教科書 p194〜197）。立方体などの辺・面の関係を数で答える。"""
from fractions import Fraction as F
from itertools import combinations, product
from mk import Unit
from vutil import only, pt

U = Unit('spaceline', '教科書 p194〜197（2直線の位置関係・直線と平面）',
         '2026-10-08 Claude作成（特訓・下書き）。立方体・三角柱・正四角錐の辺や面の位置関係を、数えて数で答える一段難しい問題（記号を全部答える教科書問題と形を変えた）。答えは check.py で頂点の座標を使って調べ直して検算。'
         '【保留】図なしで伝えられる問題は 6 問まで。70問にしていない。')
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
