"""5章 平面図形（ワーク p94〜109・教科書 p150〜176 を写真で確認して作成）
作図の問題は、作図そのものは入力できないので、教科書で学ぶ作図の性質（垂直二等分線・角の二等分線・垂線・対称移動）を
座標・長さ・角の大きさ・記号で答える問題にした。図は文章で説明する。"""
from common import *
from bank import expr_answer, relation_answer
from func import pt, pt_answer, tidy

DEG = ['°', '度']
def deg_answer(v): return {'kind': 'number', 'value': ans_str(F(v)), 'units': DEG}
def len_answer(v, unit='cm'): return {'kind': 'number', 'value': num_answer(F(v), True)['value'], 'units': [unit]}
def tri_answer(name):
    """三角形の名前：頂点の順番は自由、△ はあってもなくてもよい"""
    acc = []
    for p in itertools.permutations(name):
        for pre in ('△', ''):
            acc.append(pre + ''.join(p))
    return exact_answer(acc, compact=True)
def seg_answer(a, b, syms):
    acc = []
    for x in (a, a[::-1]):
        for y in (b, b[::-1]):
            for s in syms:
                acc += [x + s + y, y + s + x]
    return exact_answer(acc, compact=True)
PAR = ['//', '∥', '‖', '／／']; PERP = ['⊥']
def angle_answer(a, v, b): return exact_answer(['∠' + a + v + b, '∠' + b + v + a], compact=True)
def pi_txt(c):
    """π の係数つき表示：12π、3π/2、π"""
    c = F(c)
    if c == 0: return '0'
    n = abs(c.numerator); s = ('−' if c < 0 else '') + ('' if n == 1 else str(n)) + 'π'
    return s + (f'/{c.denominator}' if c.denominator != 1 else '')
def pi_answer(c, units): return expr_answer(pi_txt(c), units=units)
def walk(dx, dy):
    """移動をことばで：右に3、下に2"""
    out = []
    if dx: out.append(f'{"右" if dx > 0 else "左"}に{abs(dx)}')
    if dy: out.append(f'{"上" if dy > 0 else "下"}に{abs(dy)}')
    return '、'.join(out) or '動かない'
def done(u):
    for q in u.qs:
        q['prompt'] = tidy(q['prompt']); q['explanation'] = tidy(q['explanation'])
    return u

# ---------------- 直線と図形（ワーク p94〜95・教科書 p150〜154） ----------------
def g1():
    u = Unit('workbook-math-1-line', 'workbook', '直線と図形', '平面図形',
             '2026-10-05 Claude作成。数学ワークp94〜95（A①直線・線分・半直線・A②角の表し方・A③垂直と平行・A④平行な直線・A⑤⑥三角形・B①点と直線の距離・B+②角の表し方）と教科書p150〜154（直線・線分・半直線・2点間の距離・角・垂直・垂線・点と直線との距離・平行・平行な2直線間の距離・問5・三角形の表し方・問6）を写真で確認。図は文章で説明した。', tb=150)
    r = rng(1301)
    def t1():
        n = r.randint(4, 8); k = r.choice(['直線', '線分', '半直線'])
        v = n * (n - 1) // 2 if k != '半直線' else n * (n - 1)
        u.add(f'平面上に {n} 個の点があり、どの3点も1つの直線上にはない。このうち2点を選んで{k}をひく（{k}AB のように、2つの点の名前で表せるものを数える）。{k}は全部で何本ひけるか答えよう。', {'kind': 'number', 'value': str(v), 'units': ['本']},
              f'2点を通る直線は1本しかない。2点の選び方は {n}×{n - 1}÷2＝{n * (n - 1) // 2}（通り）。' + ('半直線は、どちらの点を端にするかで2本ずつあるので、その2倍。' if k == '半直線' else '') + f'答え {v} 本', 94, 'A①', '直線・線分・半直線', [str(n * (n - 1)) if k != '半直線' else str(n * (n - 1) // 2)], tb=150, tbnote='直線・線分・半直線')
    def t2():
        n = r.randint(3, 6); names = 'ABCDEF'[:n]
        v = n * (n - 1) // 2
        u.add(f'1つの直線上に、点 {"、".join(names)} がこの順に並んでいる。両端がこれらの点である線分は、全部で何本あるか答えよう。', {'kind': 'number', 'value': str(v), 'units': ['本']},
              f'両端の2点の選び方を数える（線分ABと線分BAは同じ）。{n}×{n - 1}÷2＝{v}（本）', 94, 'A①', '線分', [str(n - 1), str(n * (n - 1))], tb=150, tbnote='線分')
    def t3():
        k = r.choice([1, 2, 3]); base = r.choice([(3, 4, 5), (5, 12, 13), (6, 8, 10)])
        dx, h, c = (x * (k if base == (3, 4, 5) else 1) for x in base)
        a = r.randint(2, 9); b = a + dx
        ask = r.randrange(4)
        desc = f'台形ABCDで、AD∥BC、∠C＝∠D＝90° である。AD＝{a}cm、BC＝{b}cm、CD＝{h}cm、AB＝{c}cm とする。'
        if ask == 0: u.add(desc + '点Aと直線CDとの距離を求めよう。', len_answer(a), f'点Aから直線CDにひいた垂線はADなので、距離は AD＝{a}cm', 95, 'B①(1)', '点と直線との距離', [str(c), str(h)], tb=152, tbnote='点と直線との距離')
        elif ask == 1: u.add(desc + '点Aと直線BCとの距離を求めよう。', len_answer(h), f'点Aから直線BCにひいた垂線の長さは、CDの長さと等しく {h}cm（ABは垂線ではないので {c}cm ではない）', 95, 'B①(2)', '点と直線との距離', [str(c), str(a)], tb=152, tbnote='点と直線との距離')
        elif ask == 2: u.add(desc + '平行な2つの線分ADとBCの間の距離を求めよう。', len_answer(h), f'平行な2直線間の距離は、一方の直線上の点からもう一方にひいた垂線の長さ。CD⊥BC なので {h}cm', 95, 'B①(4)', '平行な2直線間の距離', [str(c), str(b - a)], tb=153, tbnote='平行な2直線間の距離')
        else: u.add(desc + '平行な線分を、記号 // を使って表そう。', seg_answer('AD', 'BC', PAR), 'AD と BC は平行なので AD//BC（AD∥BC と書いてもよい）', 95, 'B①(3)', '平行の記号', tb=153, tbnote='問4')
    def t4():
        h, a, b = r.choice([(4, 3, 5), (12, 5, 9), (12, 5, 16), (8, 6, 15), (12, 9, 16)])
        ca, cb = {(4, 3): 5, (12, 5): 13, (12, 9): 15, (8, 6): 10}[(h, a)], {(4, 5): None, (12, 9): 15, (12, 16): 20, (8, 15): 17}.get((h, b))
        if cb is None: return
        u.add(f'△ABCで、点Cから辺ABに垂線をひき、ABとの交点をHとする。CA＝{ca}cm、CB＝{cb}cm、CH＝{h}cm、AB＝{a + b}cm のとき、点Cと直線ABとの距離を求めよう。', len_answer(h),
              f'点Cと直線AB上の点を結ぶ線分のうち、もっとも短いのは垂線CH。点Cと直線ABとの距離は CH の長さで {h}cm', 95, 'B①', '点と直線との距離', [str(ca), str(cb)], tb=152, tbnote='点と直線との距離')
    def t5():
        k = r.randrange(3)
        if k == 0:
            d, e = r.randint(1, 9), r.randint(1, 9)
            u.add(f'3つの直線ℓ、m、n は平行で、m はℓとnの間にある。ℓとmの距離が {d}cm、mとnの距離が {e}cm のとき、ℓとnの距離を求めよう。', len_answer(d + e), f'平行な直線間の距離は、一方の直線上のどこに点をとっても一定。ℓとnの距離は {d}＋{e}＝{d + e}（cm）', 94, 'A④', '平行な2直線間の距離', [str(abs(d - e))], tb=153, tbnote='平行な2直線間の距離')
        elif k == 1:
            d, e = r.randint(4, 12), r.randint(1, 3)
            u.add(f'2つの直線ℓ、m は平行で、ℓとmの距離は {d}cm である。直線n はℓ、m と平行で、ℓとの距離が {e}cm、mとの距離が {d - e}cm である。直線n はℓとmの間にあるか、外側にあるか。「ア 間にある」「イ 外側にある」から選び、記号で答えよう。', choice_answer(['ア']),
                  f'nからℓまで {e}cm、mまで {d - e}cm で、合計がℓとmの距離 {d}cm と等しいので、nはℓとmの間にある。', 94, 'A④', '平行な2直線間の距離', tb=153, tbnote='平行な2直線間の距離')
        else:
            d = r.randint(1, 5)
            u.add(f'直線ABと平行で、直線ABとの距離が {d}cm となる直線は、何本ひけるか答えよう。', {'kind': 'number', 'value': '2', 'units': ['本']}, '直線ABの両側に1本ずつひける。答え 2本', 94, 'A④', '平行な直線', ['1'], tb=153, tbnote='問5')
    def t6():
        k = r.randint(1, 5)
        v = (k + 2) * (k + 1) // 2
        names = 'DEFGH'[:k]
        u.add(f'△ABCの辺BC上に、点 {"、".join(names)} を{"とり" if k > 1 else "とり"}、点Aとそれぞれ結ぶ。このとき、図の中にある三角形は全部でいくつあるか答えよう。', {'kind': 'number', 'value': str(v), 'units': ['個', 'つ']},
              f'どの三角形も頂点Aと、辺BC上の2点（B、{"、".join(names)}、C の {k + 2} 点から2つ）でできる。2点の選び方は {k + 2}×{k + 1}÷2＝{v}（通り）', 95, 'A⑤', '三角形', [str(k + 1), str(2 * k + 1)], tb=154, tbnote='問6')
    def t7():
        k = r.randrange(4)
        if k == 0: u.add('ひし形ABCDで、垂直な線分を記号 ⊥ を使って表そう。', seg_answer('AC', 'BD', PERP), 'ひし形の対角線は垂直に交わる。AC⊥BD', 94, 'A③(1)', '垂直の記号', tb=152, tbnote='問3')
        elif k == 1: u.add('長方形ABCDで、辺ABと平行な辺を、記号 // を使って AB//□□ の形で表すとき、□□ にあてはまる辺を答えよう。', exact_answer(['DC', 'CD']), '長方形の向かい合う辺は平行。AB//DC', 94, 'A③(2)', '平行の記号', ['BC', 'AD'], tb=153, tbnote='平行')
        elif k == 2: u.add('△ABCで、辺ABと辺ACの長さが等しい。このことを、記号を使って表そう。', exact_answer(['AB=AC', 'AC=AB', 'BA=AC', 'AB=CA', 'BA=CA', 'AC=BA', 'CA=AB', 'CA=BA'], compact=True), '辺ABと辺ACの長さが等しいことを AB＝AC と表す。', 95, 'A⑥(1)', '三角形の辺の表し方', tb=154, tbnote='AB＝AC')
        else: u.add('△ABCで、頂点Bと頂点Cの角の大きさが等しい。このことを、記号∠を使って表そう。', exact_answer(['∠ABC=∠ACB', '∠ACB=∠ABC', '∠CBA=∠BCA', '∠BCA=∠CBA', '∠ABC=∠BCA', '∠CBA=∠ACB', '∠ACB=∠CBA', '∠BCA=∠ABC'], compact=True), '∠ABCと∠ACBの大きさが等しいことを ∠ABC＝∠ACB と表す。', 95, 'A⑥(2)', '角の表し方', ['∠B=∠C'], tb=154, tbnote='∠ABC＝∠ACB')
    def t8():
        a = r.choice([60, 65, 70, 75, 80, 95, 100, 110, 115, 120])
        u.add(f'△ABCの辺AB上に点Dをとり、DとCを結ぶ。∠ADC＝{a}° のとき、∠BDC の大きさを求めよう。', deg_answer(180 - a), f'点Dでは、∠ADCと∠BDCを合わせると一直線の角で180°。∠BDC＝180°−{a}°＝{180 - a}°。点Dには角が2つできるので、∠D だけではどちらの角かわからない。', 95, 'B+②', '角の表し方', [str(a), str(90 - a) if a < 90 else str(a - 90)], tb=151, tbnote='角・∠ABC')
    def t9():
        a, v, b = r.sample('ABCDEPQRXYO', 3)
        u.add(f'点{v}を頂点とし、半直線{v}{a}と半直線{v}{b}を辺とする角を、記号∠と3つの文字を使って表そう。', angle_answer(a, v, b), f'頂点の文字を真ん中に書く。∠{a}{v}{b}（∠{b}{v}{a} でもよい）', 94, 'A②', '角の表し方', ['∠' + v + a + b], tb=151, tbnote='角・問2')
    plan = [t1] * 9 + [t2] * 7 + [t3] * 12 + [t4] * 6 + [t5] * 8 + [t6] * 8 + [t7] * 8 + [t8] * 7 + [t9] * 5
    return done(fill(u, plan))

# ---------------- 図形の移動（ワーク p96〜97・教科書 p155〜161） ----------------
SQ = {'A': (0, 2), 'B': (0, 0), 'C': (2, 0), 'D': (2, 2), 'O': (1, 1), 'P': (0, 1), 'Q': (1, 0), 'R': (2, 1), 'S': (1, 2)}
EIGHT = ['OAP', 'OPB', 'OBQ', 'OQC', 'OCR', 'ORD', 'ODS', 'OSA']
SQ_DESC = '正方形ABCD（Aが左上、Bが左下、Cが右下、Dが右上）の対角線の交点をOとし、辺AB、BC、CD、DAの中点をそれぞれP、Q、R、Sとする。線分PR、SQをひくと、正方形は合同な8つの直角二等辺三角形 △OAP、△OPB、△OBQ、△OQC、△OCR、△ORD、△ODS、△OSA に分けられる。'
def sq_name(pt_):
    for k, v in SQ.items():
        if v == pt_: return k
    return None
def sq_moves():
    m = []
    for a, b in itertools.permutations(SQ, 2):
        d = (SQ[b][0] - SQ[a][0], SQ[b][1] - SQ[a][1])
        m.append((f'矢印{a}{b}の方向に、その長さだけ平行移動', lambda p, d=d: (p[0] + d[0], p[1] + d[1])))
    for k, nm in ((1, '反時計まわりに90°'), (2, '180°'), (3, '時計まわりに90°')):
        def rot(p, k=k):
            x, y = p[0] - 1, p[1] - 1
            for _ in range(k): x, y = -y, x
            return (x + 1, y + 1)
        m.append((f'点Oを回転の中心として{nm}回転移動', rot))
    m += [('直線PRを対称の軸として対称移動', lambda p: (p[0], 2 - p[1])), ('直線SQを対称の軸として対称移動', lambda p: (2 - p[0], p[1])),
          ('直線ACを対称の軸として対称移動', lambda p: (2 - p[1], 2 - p[0])), ('直線BDを対称の軸として対称移動', lambda p: (p[1], p[0]))]
    return m
def sq_image(tri, fs):
    pts = [SQ[c] for c in tri]
    for f in fs: pts = [f(p) for p in pts]
    names = [sq_name(p) for p in pts]
    if None in names: return None
    for e in EIGHT:
        if set(e) == set(names): return e, names
    return None

def g2():
    u = Unit('workbook-math-1-move', 'workbook', '図形の移動', '平面図形',
             '2026-10-05 Claude作成。数学ワークp96〜97（A①②平行移動・A③④回転移動・A⑤⑥対称移動・B①正方形の8つの三角形・B+②2種類の移動の組み合わせ）と教科書p156〜161（平行移動・回転移動・点対称移動・対称移動・中点・垂直二等分線・例4・練習問題1）を写真で確認。方眼の図は座標で表した。', tb=157)
    r = rng(1311)
    moves = sq_moves()
    def t1():
        mx, my, nx, ny = (rint(r, -6, 6, False) for _ in range(4)); ax, ay = rint(r, -5, 5, False), rint(r, -5, 5, False)
        if (mx, my) == (nx, ny): return
        dx, dy = nx - mx, ny - my
        u.add(f'座標平面上に、点M{pt(mx, my)}、N{pt(nx, ny)} がある。点A{pt(ax, ay)} を、矢印MNの方向に、その長さだけ平行移動した点の座標を答えよう。', pt_answer(ax + dx, ay + dy),
              f'MからNへは、x 座標が {fmt_num(F(dx))}、y 座標が {fmt_num(F(dy))} 変わる。平行移動では、どの点も同じ方向に同じ長さだけ動くので、Aも同じだけ動かして {pt(ax + dx, ay + dy)}', 96, 'A②', '平行移動', [ans_str(F(ax - dx)) + ',' + ans_str(F(ay - dy))], tb=156, tbnote='例1・問2')
    def t2():
        ox, oy, ax, ay = (rint(r, -4, 4, False) for _ in range(4))
        if (ox, oy) == (ax, ay): return
        bx, by = 2 * ox - ax, 2 * oy - ay
        u.add(f'点A{pt(ax, ay)} を、点O{pt(ox, oy)} を回転の中心として 180° 回転移動（点対称移動）した点の座標を答えよう。', pt_answer(bx, by),
              f'点対称移動では、対応する点と回転の中心は1つの直線上にあり、OA＝OA′。Aから O へ（x が {fmt_num(F(ox - ax))}、y が {fmt_num(F(oy - ay))}）と同じだけ、Oからさらに進む。答え {pt(bx, by)}', 96, 'A④', '点対称移動', [ans_str(F(-ax)) + ',' + ans_str(F(-ay))], tb=158, tbnote='問5・点対称移動')
    def t3():
        ax, ay = rint(r, -5, 5, False), rint(r, -5, 5, False)
        k = r.choice([1, 3]); nm = '反時計まわりに 90°' if k == 1 else '時計まわりに 90°'
        if r.random() < .25: k, nm = 3, '反時計まわりに 270°'
        x, y = ax, ay
        for _ in range(k): x, y = -y, x
        if (x, y) == (ax, ay): return
        u.add(f'点A{pt(ax, ay)} を、原点Oを回転の中心として{nm}回転移動した点の座標を答えよう。', pt_answer(x, y),
              f'回転移動では OA＝OA′ で、∠AOA′ が回転した角になる。原点からAへは「{walk(ax, ay)}」。この動きを図形ごと回すと、原点から A′ へは「{walk(x, y)}」になる。答え {pt(x, y)}', 96, 'A③', '回転移動', [ans_str(F(-x)) + ',' + ans_str(F(-y))], tb=157, tbnote='例2・回転移動')
    def t4():
        ax, ay = rint(r, -5, 5, False), rint(r, -5, 5, False); k = rint(r, -3, 3, False); vert = r.random() < .5
        if vert: bx, by, ln = 2 * k - ax, ay, f'x 座標が {fmt_num(F(k))} の点を通り y 軸に平行な直線'
        else: bx, by, ln = ax, 2 * k - ay, f'y 座標が {fmt_num(F(k))} の点を通り x 軸に平行な直線'
        if (bx, by) == (ax, ay): return
        u.add(f'点A{pt(ax, ay)} を、{ln}を対称の軸として対称移動した点の座標を答えよう。', pt_answer(bx, by),
              f'対称移動では、対応する点を結んだ線分は対称の軸と垂直に交わり、その交点で2等分される。軸までの距離が同じになるように反対側へ移す。答え {pt(bx, by)}', 97, 'A⑥', '対称移動', [ans_str(F(-ax)) + ',' + ans_str(F(ay)) if vert else ans_str(F(ax)) + ',' + ans_str(F(-ay))], tb=158, tbnote='例3・対称移動')
    def t5():
        k = r.randrange(4)
        if k == 0:
            a, l = r.choice([50, 60, 70, 80, 100, 120, 135, 150]), r.randint(3, 9)
            u.add(f'△PQRは、△ABCを、点Oを回転の中心として時計まわりに {a}° 回転移動したものである（AとP、BとQ、CとRが対応する）。OB＝{l}cm のとき、OQ の長さを求めよう。', len_answer(l), f'対応する点は回転の中心からの距離が等しいので OQ＝OB＝{l}cm（∠BOQ＝{a}°）', 96, 'A③(1)', '回転移動の性質', [str(a)], tb=157, tbnote='回転移動の性質')
        elif k == 1:
            a = r.choice([50, 60, 70, 80, 100, 120, 135, 150])
            u.add(f'△PQRは、△ABCを、点Oを回転の中心として時計まわりに {a}° 回転移動したものである（AとP、BとQ、CとRが対応する）。∠COR の大きさを求めよう。', deg_answer(a), f'対応する点と回転の中心とを結んでできた角の大きさは、すべて回転した角に等しい。∠COR＝{a}°', 96, 'A③(2)', '回転移動の性質', [str(360 - a), str(180 - a)], tb=157, tbnote='回転移動の性質')
        elif k == 2:
            l = r.randint(4, 16)
            u.add(f'△PQRは、△ABCを、直線ℓを対称の軸として対称移動したものである（AとP が対応する）。線分APと直線ℓとの交点をMとする。AP＝{l}cm のとき、AM の長さを求めよう。', len_answer(F(l, 2)), f'対応する点を結んだ線分は対称の軸と垂直に交わり、その交点で2等分される。AM＝{l}÷2＝{fmt_num(F(l, 2), "dec")}（cm）', 97, 'A⑤(1)', '対称移動の性質', [str(l)], tb=159, tbnote='対称移動の性質')
        else:
            l = r.randint(3, 12)
            u.add(f'△PQRは、△ABCを、ある方向にある長さだけ平行移動したものである（AとP、BとQ、CとRが対応する）。AP＝{l}cm のとき、CR の長さを求めよう。', len_answer(l), f'平行移動では、対応する点を結んだ線分どうしは平行で、長さはすべて等しい。CR＝AP＝{l}cm', 96, 'A①(2)', '平行移動の性質', [str(l * 2)], tb=156, tbnote='問1・平行移動の性質')
    def t6():
        tri = r.choice(EIGHT); mv = r.choice(moves)
        img = sq_image(tri, [mv[1]])
        if not img or img[0] == tri: return
        u.add(f'{SQ_DESC}\n△{tri} を、{mv[0]}すると、どの三角形と重なるか答えよう。', tri_answer(img[0]),
              f'各頂点の行き先を調べる。{"、".join(f"{a}→{b}" for a, b in zip(tri, img[1]))} なので △{img[0]}', 97, 'B①', '平行移動・回転移動・対称移動', tb=161, tbnote='練習問題1')
    def t7():
        tri = r.choice(EIGHT); m1, m2 = r.sample(moves[-7:], 2)
        img = sq_image(tri, [m1[1], m2[1]])
        if not img or img[0] == tri: return
        mid = sq_image(tri, [m1[1]])
        u.add(f'{SQ_DESC}\n△{tri} を、{m1[0]}し、さらに{m2[0]}すると、どの三角形と重なるか答えよう。', tri_answer(img[0]),
              f'1回目で △{mid[0]}、2回目で △{img[0]} に重なる（頂点は {"、".join(f"{a}→{b}" for a, b in zip(tri, img[1]))}）。', 97, 'B+②', '移動の組み合わせ', [mid[0]], tb=160, tbnote='例4・練習問題1(4)')
    def t8():
        tri = r.choice(EIGHT); target = r.choice([e for e in EIGHT if e != tri])
        ok = [mv[0] for mv in moves[-7:] if (sq_image(tri, [mv[1]]) or [None])[0] == target]
        if len(ok) != 1: return
        opts = [mv[0] for mv in moves[-7:]]
        r.shuffle(opts); opts = opts[:4]
        if ok[0] not in opts: opts[0] = ok[0]; r.shuffle(opts)
        ans = LETTERS[opts.index(ok[0])]
        u.add(f'{SQ_DESC}\n△{tri} を1回移動して △{target} に重ねるには、どのように移動すればよいか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
              f'それぞれの移動で頂点の行き先を調べると、△{target} に重なるのは「{ok[0]}」。正解：{ans}', 97, 'B①', '移動の見分け方', tb=161, tbnote='練習問題1')
    plan = [t1] * 9 + [t2] * 8 + [t3] * 9 + [t4] * 9 + [t5] * 8 + [t6] * 12 + [t7] * 9 + [t8] * 6
    return done(fill(u, plan))

# ---------------- 基本の作図①（ワーク p98〜99・教科書 p162〜163） ----------------
CIRC = [(3, 4), (4, 3), (5, 0), (0, 5), (-3, 4), (-4, 3), (-5, 0), (0, -5), (3, -4), (4, -3), (-3, -4), (-4, -3)]
def g3():
    u = Unit('workbook-math-1-draw1', 'workbook', '基本の作図①', '平面図形',
             '2026-10-05 Claude作成。数学ワークp98〜99（A①垂直二等分線と中点・A②③垂直二等分線・A④角の二等分線・B①2点から等しい距離にある点・B②4等分・B+③円の中心）と教科書p162〜163（線分の垂直二等分線の作図・ひし形・問1・角の二等分線の作図・問2）を写真で確認。作図は性質・座標・角の大きさで答える問題にした。', tb=162)
    r = rng(1321)
    def t1():
        k = r.randrange(2)
        if k == 0:
            l = r.randint(3, 15)
            u.add(f'点Pは、線分ABの垂直二等分線上にある。PA＝{l}cm のとき、PB の長さを求めよう。', len_answer(l), f'垂直二等分線上の点は、線分の両端から等しい距離にある。PB＝PA＝{l}cm', 98, 'A①', '垂直二等分線の性質', [str(l * 2)], tb=163, tbnote='垂直二等分線')
        else:
            l = r.randint(5, 24)
            u.add(f'線分ABの長さは {l}cm である。ABの垂直二等分線とABとの交点をMとするとき、AM の長さを求めよう。', len_answer(F(l, 2)), f'垂直二等分線とABとの交点は中点。AM＝{l}÷2＝{fmt_num(F(l, 2), "dec")}（cm）', 98, 'A①(2)', '中点', [str(l)], tb=163, tbnote='中点')
    def t2():
        y = rint(r, -4, 4); x1 = rint(r, -8, 2); x2 = x1 + 2 * r.randint(2, 6); k = rint(r, -6, 6)
        horiz = r.random() < .5
        if horiz:
            m = (x1 + x2) // 2
            u.add(f'点A{pt(x1, y)}、B{pt(x2, y)} がある。線分ABの垂直二等分線上にあって、y 座標が {fmt_num(F(k))} である点の座標を答えよう。', pt_answer(m, k),
                  f'ABの中点は {pt(m, y)}。ABは x 軸に平行なので、垂直二等分線は中点を通り y 軸に平行な直線（x 座標がすべて {m}）。答え {pt(m, k)}', 98, 'A②', '垂直二等分線', [ans_str(F(k)) + ',' + ans_str(F(m))], tb=163, tbnote='垂直二等分線')
        else:
            m = (x1 + x2) // 2
            u.add(f'点A{pt(y, x1)}、B{pt(y, x2)} がある。線分ABの垂直二等分線上にあって、x 座標が {fmt_num(F(k))} である点の座標を答えよう。', pt_answer(k, m),
                  f'ABの中点は {pt(y, m)}。ABは y 軸に平行なので、垂直二等分線は中点を通り x 軸に平行な直線（y 座標がすべて {m}）。答え {pt(k, m)}', 98, 'A②', '垂直二等分線', [ans_str(F(m)) + ',' + ans_str(F(k))], tb=163, tbnote='垂直二等分線')
    def t3():
        a = r.choice([40, 60, 72, 80, 100, 120, 128, 136, 140, 160]); n = r.choice([2, 2, 4])
        u.add(f'∠XOY＝{a}° である。∠XOYを{"2" if n == 2 else "4"}等分する半直線を作図したとき、等分された1つの角の大きさを求めよう。', deg_answer(F(a, n)),
              f'角の二等分線で2等分し、{"" if n == 2 else "できた角をさらに二等分すると4等分になる。"}{a}÷{n}＝{fmt_num(F(a, n))}（°）', 99, 'A④' if n == 2 else 'B②', '角の二等分線', [ans_str(F(a, 2 if n == 4 else 4))], tb=163, tbnote='角の二等分線・問2')
    def t4():
        a = r.choice([40, 50, 60, 70, 80, 100, 110, 120, 130, 140])
        k = r.randrange(2)
        if k == 0: u.add(f'ひし形ABCDで、∠BAD＝{a}° である。対角線ACと辺ABがつくる角∠BACの大きさを求めよう。', deg_answer(F(a, 2)), f'ひし形の対角線は、頂点にできる角の二等分線になる。∠BAC＝{a}÷2＝{fmt_num(F(a, 2))}°', 98, 'A②', '角の二等分線（ひし形）', [str(a)], tb=163, tbnote='ひし形と角の二等分線')
        else: u.add(f'ひし形ABCDで、∠BAD＝{a}° である。2本の対角線ACとBDがつくる角の大きさを求めよう。', deg_answer(90), 'ひし形の対角線は垂直に交わる（一方の対角線は、もう一方の対角線の垂直二等分線）。90°', 98, 'A②', '垂直二等分線（ひし形）', [str(a), str(F(a, 2))], tb=162, tbnote='ひし形と垂直二等分線')
    def t5():
        b = r.choice([30, 40, 50, 56, 60, 64, 70])
        u.add(f'∠C＝90°、∠B＝{b}° の直角三角形ABCを、辺BCが辺BAに重なるように折る。このときできる折り目と辺BCがつくる角の大きさを求めよう。', deg_answer(F(b, 2)),
              f'辺BCが辺BAに重なるように折ると、折り目は∠ABCの二等分線になる。{b}÷2＝{fmt_num(F(b, 2))}°', 99, 'A④', '角の二等分線（折り目）', [str(b), str(90 - b)], tb=163, tbnote='角の二等分線')
    def t6():
        h, k = rint(r, -3, 3, False), rint(r, -3, 3, False)
        ps = r.sample(CIRC, 3)
        pts_ = [(h + a, k + b) for a, b in ps]
        u.add(f'3点A{pt(*pts_[0])}、B{pt(*pts_[1])}、C{pt(*pts_[2])} は、ある円の周上にある。この円の中心の座標を答えよう（中心は、線分AB、BC の垂直二等分線の交点）。', pt_answer(h, k),
              f'円の中心は、円周上のどの点からも等しい距離にあるので、弦の垂直二等分線の交点になる。中心 {pt(h, k)} からA、B、Cまでの距離はどれも 5。', 99, 'B+③', '円の中心の作図', [ans_str(F(k)) + ',' + ans_str(F(h))], tb=163, tbnote='垂直二等分線')
    def t7():
        y = r.randint(1, 6); x1 = rint(r, -8, 2); x2 = x1 + 2 * r.randint(2, 6)
        m = (x1 + x2) // 2
        u.add(f'x 軸上にあって、2点A{pt(x1, y)}、B{pt(x2, y)} から等しい距離にある点Mの座標を答えよう。', pt_answer(m, 0),
              f'2点から等しい距離にある点は、線分ABの垂直二等分線上にある。この垂直二等分線は x＝{m} の直線なので、x 軸との交点は {pt(m, 0)}', 99, 'B①', '2点から等しい距離にある点', [ans_str(F(m)) + ',' + ans_str(F(y))], tb=163, tbnote='垂直二等分線')
    def t8():
        steps = ['点Oを中心とする円をかき、半直線OX、OYとの交点をそれぞれP、Qとする', '2点P、Qをそれぞれ中心として、等しい半径の円をかき、その交点の1つをRとする', '半直線ORをひく']
        if r.random() < .5:
            steps = ['線分の両端の点A、Bを、それぞれ中心として、等しい半径の円をかく', 'かいた2つの円の交点をP、Qとする', '直線PQをひく']; what = '線分ABの垂直二等分線'
        else: what = '∠XOYの二等分線'
        order = list(range(3)); r.shuffle(order)
        if order == [0, 1, 2]: return
        shown = [steps[i] for i in order]
        ans = [LETTERS[order.index(i)] for i in range(3)]
        acc = [sep.join(ans) for sep in ('、', ',', '→', '', ' ')]
        u.add(f'{what}の作図の手順を、正しい順に並べ、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, s in enumerate(shown)), exact_answer(acc),
              f'正しい順は {"→".join(ans)}。作図では定規とコンパスだけを使う。', 98 if '垂直' in what else 99, 'A①' if '垂直' in what else 'A④', '作図の手順', tb=162 if '垂直' in what else 163, tbnote='線分の垂直二等分線の作図' if '垂直' in what else '角の二等分線の作図')
    plan = [t1] * 9 + [t2] * 11 + [t3] * 9 + [t4] * 8 + [t5] * 7 + [t6] * 11 + [t7] * 9 + [t8] * 6
    return done(fill(u, plan))

# ---------------- 基本の作図②（ワーク p100〜101・教科書 p164〜165） ----------------
def g4():
    u = Unit('workbook-math-1-draw2', 'workbook', '基本の作図②', '平面図形',
             '2026-10-05 Claude作成。数学ワークp100〜101（A①②直線上の点を通る垂線・A③④直線上にない点を通る垂線・B①〜④・B⑤三角形の高さAH・B+⑥平行な2直線間の距離）と教科書p164〜165（直線上の1点を通る垂線の作図・直線上にない1点を通る垂線の作図・問3・問4）を写真で確認。作図は性質・座標・長さ・角で答える問題にした。', tb=164)
    r = rng(1331)
    def t1():
        px, py = rint(r, -6, 6, False), rint(r, -6, 6, False); k = r.randrange(4); c = rint(r, -4, 4)
        if k == 0: ln, foot = 'x 軸', (px, 0)
        elif k == 1: ln, foot = 'y 軸', (0, py)
        elif k == 2: ln, foot = f'点{pt(0, c)} を通り x 軸に平行な直線', (px, c)
        else: ln, foot = f'点{pt(c, 0)} を通り y 軸に平行な直線', (c, py)
        if foot == (px, py): return
        u.add(f'点P{pt(px, py)} から{ln}に垂線をひいたとき、垂線と{ln}との交点の座標を答えよう。', pt_answer(*foot),
              f'この直線は{"x 軸" if k in (0, 2) else "y 軸"}{"そのもの" if k in (0, 1) else "に平行"}なので、垂線は{"y 軸に平行で、x 座標は変わらない" if k in (0, 2) else "x 軸に平行で、y 座標は変わらない"}。答え {pt(*foot)}', 100, 'A③', '直線上にない点を通る垂線', [ans_str(F(foot[1])) + ',' + ans_str(F(foot[0]))], tb=165, tbnote='直線上にない1点を通る垂線')
    def t2():
        b, h = r.choice([(6, 4), (8, 5), (10, 6), (12, 7), (9, 8), (14, 6), (5, 8)])
        S = F(b * h, 2)
        if r.random() < .5:
            u.add(f'△ABCで、辺BCを底辺とみたときの高さを表す線分AHを作図する（Hは直線BC上の点）。BC＝{b}cm、△ABCの面積が {fmt_num(S, "dec")}cm² のとき、AH の長さを求めよう。', len_answer(h), f'AHは、頂点Aから直線BCにひいた垂線。面積＝BC×AH÷2 より、AH＝{fmt_num(S, "dec")}×2÷{b}＝{h}（cm）', 101, 'B⑤', '三角形の高さ（垂線）', [str(F(S, b)), str(h * 2)], tb=165, tbnote='問4')
        else:
            bx, cx = sorted(r.sample(range(-6, 7), 2)); ax, ay = r.randint(-6, 6), r.choice([3, 4, 5, 6, -4, -5])
            area = F((cx - bx) * abs(ay), 2)
            u.add(f'3点A{pt(ax, ay)}、B{pt(bx, 0)}、C{pt(cx, 0)} を頂点とする△ABCがある。頂点Aから直線BCにひいた垂線と直線BCとの交点Hの座標を答えよう。', pt_answer(ax, 0),
                  f'BCは x 軸上にあるので、Aから x 軸にひいた垂線の足は {pt(ax, 0)}。高さ AH＝{abs(ay)}、面積は {cx - bx}×{abs(ay)}÷2＝{fmt_num(area, "dec")}', 101, 'B③', '三角形の高さ（垂線）', [ans_str(F(0)) + ',' + ans_str(F(ay))], tb=165, tbnote='問4')
    def t3():
        bx, cx = 0, r.randint(3, 6); ax = r.choice([cx + r.randint(1, 4), -r.randint(1, 4)]); ay = r.randint(2, 6)
        u.add(f'3点A{pt(ax, ay)}、B{pt(bx, 0)}、C{pt(cx, 0)} を頂点とする△ABCで、頂点Aを通る直線BCの垂線と直線BCとの交点をHとする。Hは辺BC上にあるか、辺BCをのばした直線上にあるか。「ア 辺BC上」「イ 辺BCをのばした直線上」から選び、記号で答えよう。', choice_answer(['イ']),
              f'Hの座標は {pt(ax, 0)} で、BC（x 座標が {bx}〜{cx}）の外にある。∠Bか∠Cが鈍角のときは、辺BCをのばして垂線をひく。正解：イ', 101, 'B③', '直線上にない点を通る垂線', tb=165, tbnote='問4')
    def t4():
        a = r.choice([20, 25, 30, 35, 40, 50, 55, 60, 65, 70])
        u.add(f'∠XOY＝{a}° である。半直線OX上の点Pを通りOXに垂直な直線をひき、半直線OYとの交点をQとする。∠OQPの大きさを求めよう。', deg_answer(90 - a), f'∠OPQ＝90°、三角形の3つの角の和は180°。∠OQP＝180°−90°−{a}°＝{90 - a}°', 101, 'B④', '直線上の点を通る垂線', [str(a), str(180 - a)], tb=164, tbnote='直線上の1点を通る垂線')
    def t5():
        p, q = rint(r, -6, 6), rint(r, -6, 6)
        if p == q: return
        u.add(f'2つの直線ℓ、m は x 軸に平行で、ℓは点{pt(0, p)}、m は点{pt(0, q)} を通る。ℓ上の点Pから m に垂線PQをひくとき、PQ の長さ（ℓとmの距離）を求めよう。', num_answer(abs(p - q)), f'平行な2直線間の距離は、一方の直線上のどこから垂線をひいても一定。{max(p, q)}−({fmt_num(F(min(p, q)))})＝{abs(p - q)}', 101, 'B+⑥', '平行な2直線間の距離', [str(abs(p + q))], tb=153, tbnote='平行な2直線間の距離')
    def t6():
        k = r.randrange(2)
        if k == 0: u.add('直線XY上の点Pを通る垂線は、何度の角の二等分線とみることができるか答えよう。', deg_answer(180), '直線XY上の点Pでは、半直線PXとPYが180°の角をつくる。その二等分線が垂線（90°ずつに分ける）。', 100, 'A①', '直線上の1点を通る垂線', ['90'], tb=164, tbnote='垂線は180°の角の二等分線')
        else: u.add('直線XY上にない点Pを通る直線XYの垂線を作図するとき、点Pを中心とする円と直線XYとの交点をA、Bとする。次に、A、Bをそれぞれ中心として、半径が何の長さの円をかけばよいか。線分の名前で答えよう。', exact_answer(['PA', 'AP', 'PB', 'BP']), 'A、Bをそれぞれ中心として、半径PAの円をかき、その交点の1つをQとする。直線PQが垂線。', 100, 'A③', '直線上にない1点を通る垂線', ['AB'], tb=165, tbnote='直線上にない1点を通る垂線の作図')
    def t7():
        ax, ay = rint(r, -5, -1), r.randint(2, 6); w = r.randint(3, 6); s = r.randint(1, 3)
        bx, by = ax - s, 0; cx = bx + w; px = r.randint(bx + 1, cx - 1)
        u.add(f'平行四辺形ABCDで、B{pt(bx, by)}、C{pt(cx, 0)}、A{pt(ax, ay)} である。辺BC上の点P{pt(px, 0)} を通る辺BCの垂線をひくとき、この垂線と直線ADとの交点の座標を答えよう。', pt_answer(px, ay),
              f'ADはBCと平行（x 軸に平行で y＝{ay}）。BCの垂線は y 軸に平行な直線 x＝{px} なので、交点は {pt(px, ay)}', 101, 'B②', '直線上の点を通る垂線', [ans_str(F(ay)) + ',' + ans_str(F(px))], tb=164, tbnote='問3')
    plan = [t1] * 12 + [t2] * 13 + [t3] * 5 + [t4] * 10 + [t5] * 10 + [t6] * 6 + [t7] * 10
    return done(fill(u, plan))

# ---------------- 図形の移動と基本の作図の利用（ワーク p102〜103・教科書 p166〜168） ----------------
def g5():
    u = Unit('workbook-math-1-drawuse', 'workbook', '図形の移動と基本の作図の利用', '平面図形',
             '2026-10-05 Claude作成。数学ワークp102〜103（A①もっとも短い道のり・A②いろいろな角の作図・B①AP＋PDがもっとも短い点・B+②105°の作図）と教科書p166〜168（どこで水を飲ませる？・対称移動の利用・説明しよう・いろいろな角の作図・問1・話しあおう75°）を写真で確認。作図は座標と角の大きさで答える問題にした。', tb=167)
    r = rng(1341)
    def shortest():
        for _ in range(100):
            x1, y1, x2, y2 = rint(r, -6, 2), r.randint(1, 6), rint(r, 1, 8), r.randint(1, 6)
            if x2 <= x1: continue
            px = x1 + F((x2 - x1) * y1, y1 + y2)
            if px.denominator == 1: return x1, y1, x2, y2, px
        return None
    def t1():
        s = shortest()
        if not s: return
        x1, y1, x2, y2, px = s
        k = r.randrange(2)
        if k == 0:
            u.add(f'x 軸を直線ℓとみる。2点A{pt(x1, y1)}、B{pt(x2, y2)} があり、ℓ上に点Pをとって AP＋PB がもっとも短くなるようにする。そのために、直線ℓを対称の軸として点Bを対称移動した点B′の座標を答えよう。', pt_answer(x2, -y2),
                  f'対称の軸が x 軸なので、y 座標の符号だけが変わる。B′{pt(x2, -y2)}。PB＝PB′ なので、AP＋PB＝AP＋PB′ が一直線になるとき最短。', 102, 'A①(1)', 'もっとも短い道のり', [ans_str(F(-x2)) + ',' + ans_str(F(y2))], tb=167, tbnote='対称移動の利用')
        else:
            u.add(f'x 軸を直線ℓとみる。2点A{pt(x1, y1)}、B{pt(x2, y2)} があり、ℓ上に点Pをとって AP＋PB がもっとも短くなるようにする。点Pの座標を答えよう（Bをℓについて対称移動した点B′と、Aとを結んだ直線がℓと交わる点がP）。', pt_answer(px, 0),
                  f'B′{pt(x2, -y2)}。AからB′へは、y が {y1} から −{y2} まで {y1 + y2} 下がる間に、x が {x2 - x1} 進む。ℓ（y＝0）までは {y1} 下がるので、x は {x2 - x1}×{y1}/{y1 + y2}＝{fmt_num(px - x1)} 進む。P{pt(px, 0)}', 102, 'A①(3)', 'もっとも短い道のり', [ans_str(F(x1 + x2, 2)) + ',0'], tb=167, tbnote='ステップ2')
    def t2():
        u.add('直線ℓを対称の軸として、点Bを対称移動した点をB′とする。ℓ上に点Pをとると BP＝B′P となる。その理由を説明する次の文の □ にあてはまることばを答えよう。\n「直線ℓは、線分BB′の □ と考えられる。2点から等しい距離にある点は、その2点を結んだ線分の □ 上にあるから。」', exact_answer(['垂直二等分線']),
              '対称移動の対称の軸は、対応する点を結んだ線分の垂直二等分線。垂直二等分線上の点は、線分の両端から等しい距離にある。', 102, 'A①(2)', 'もっとも短い道のりの理由', ['垂線', '中点'], tb=159, tbnote='垂直二等分線')
    def t3():
        start = r.choice([('正三角形の1つの角', 60), ('垂線でできる角', 90)])
        ops = []; v = F(start[1]); txt = start[0] + f'（{start[1]}°）'; trail = [f'{start[1]}°']
        for i in range(r.randint(1, 3)):
            k = r.randrange(3)
            if k == 0: v = v / 2; ops.append('その角を二等分する'); trail.append(f'二等分して {fmt_num(v)}°')
            elif k == 1:
                add = r.choice([45, 60, 90]); v = v + add; ops.append(f'その角に {add}° の角を加える'); trail.append(f'{add}° を加えて {fmt_num(v)}°')
            else: v = 180 - v; ops.append('一直線（180°）から、その角をひいた残りの角をつくる'); trail.append(f'180° からひいて {fmt_num(v)}°')
            if v <= 0 or v >= 180: return
        if v.denominator != 1 or v in (60, 90): return
        steps = '。次に'.join(ops)
        u.add(f'定規とコンパスで角を作図する。{txt}をもとにして、{steps}。できた角の大きさを求めよう。', deg_answer(v),
              '順に計算する。' + ' → '.join(trail) + f'。答え {fmt_num(v)}°', 103, 'A②', 'いろいろな角の作図', tb=168, tbnote='いろいろな角の作図・問1')
    def t4():
        a, parts = r.choice([(105, (90, 15)), (75, (60, 15)), (135, (90, 45)), (150, (90, 60)), (165, (180, -15)), (120, (180, -60)), (105, (60, 45)), (75, (45, 30))])
        p, q = parts
        how = {15: '15° は、正三角形の60°を二等分した30°を、さらに二等分してつくる', 30: '30° は、正三角形の60°を二等分してつくる', 45: '45° は、垂線の90°を二等分してつくる', 60: '60° は、正三角形をかいてつくる'}
        if q > 0:
            u.add(f'{a}° の角を作図するとき、{a}°＝{p}°＋□° と考える。□ にあてはまる数を答えよう。', deg_answer(q), f'{a}−{p}＝{q}。{how[q]}。{p}° の角と合わせて {a}°。', 103, 'B+②(1)', 'いろいろな角の作図', [str(q * 2)], tb=168, tbnote='話しあおう（75°）')
        else:
            u.add(f'{a}° の角を作図するとき、一直線の角 180° から □° の角をひくと考える。□ にあてはまる数を答えよう。', deg_answer(-q), f'180−{a}＝{-q}。{how[-q]}。一直線からその角をのぞいた残りが {a}°。', 103, 'B+②(2)', 'いろいろな角の作図', [str(a)], tb=168, tbnote='いろいろな角の作図')
    def t5():
        a = r.choice([30, 15, 45, 75, 60, 120])
        u.add(f'線分ABを直径とする半円がある。ABの中点をO、半円の弧AB上に点Pをとり、∠POB＝{a}° となるようにしたい。∠POA の大きさを求めよう。', deg_answer(180 - a), f'∠POAと∠POBを合わせると、一直線の角で180°。∠POA＝180°−{a}°＝{180 - a}°', 103, 'A②', 'いろいろな角の作図', [str(a), str(90 - a) if a < 90 else str(a - 90)], tb=168, tbnote='いろいろな角の作図')
    plan = [t1] * 18 + [t2] * 3 + [t3] * 22 + [t4] * 15 + [t5] * 12
    return done(fill(u, plan))

# ---------------- 円とおうぎ形の性質（ワーク p104〜105・教科書 p170〜172） ----------------
def g6():
    u = Unit('workbook-math-1-circle', 'workbook', '円とおうぎ形の性質', '平面図形',
             '2026-10-05 Claude作成。数学ワークp104〜105（A①弧と弦・中心角・A②③円の接線・A④正五角形とおうぎ形・A⑤おうぎ形・B①接線と半径・B+②接する円）と教科書p170〜172（円・弧・弦・中心角・問1〜4・接線・接点・円の接線の性質・おうぎ形・問6・説明しよう）を写真で確認。', tb=170)
    r = rng(1351)
    WORDS = [('円周上の2点A、Bで、円周のAからBまでの部分', '弧', ['弦']), ('円周上の2点A、Bを結んだ線分', '弦', ['弧', '直径']), ('円の中心を通る弦', '直径', ['半径', '弦']),
             ('円の中心Oと弧ABの両端を結んでできる∠AOB を、弧ABに対して何というか', '中心角', ['円周角']), ('円と直線が1点だけを共有するときの、その直線', '接線', ['接点']),
             ('円と接線が共有する点', '接点', ['接線']), ('円の2つの半径と弧で囲まれた図形', 'おうぎ形', ['扇形'])]
    def t1():
        q, a, nr = r.choice(WORDS)
        acc = [a] + (['扇形'] if a == 'おうぎ形' else [])
        u.add(f'次のものを何というか、ことばで答えよう。\n{q}', exact_answer(acc), f'答え {a}。教科書の用語を正確に覚えよう。', 104, 'A①', '円とおうぎ形の用語', [x for x in nr if x not in acc], tb=170 if a != '接線' and a != '接点' and a != 'おうぎ形' else (171 if a in ('接線', '接点') else 172), tbnote='用語')
    def t2():
        k = r.randrange(2); r0 = r.randint(3, 9); d = r.randint(1, r0 - 1)
        if k == 0:
            u.add(f'円Oの半径は {r0}cm で、点Cは円の内部にあり OC＝{d}cm である。円周上の点をAとするとき、線分OAとOCの長さの関係を、不等号を使って表そう。', relation_answer('OA>OC'),
                  f'円周上の点と中心との距離は半径 {r0}cm。内部の点は中心からの距離が半径より短い。OA＞OC（OC＜OA）', 104, 'A①(1)', '円の内部の点', [], tb=170, tbnote='問1')
        else:
            u.add(f'円Oの半径は {r0}cm で、点Rは円の外部にある。円周上の点をPとするとき、線分OPとORの長さの関係を、不等号を使って表そう。', relation_answer('OP<OR'),
                  '円の外部の点は、中心からの距離が半径より長い。OP＜OR（OR＞OP）', 104, 'A①(1)', '円の外部の点', [], tb=170, tbnote='問1')
    def t3():
        n = r.choice([5, 6, 8, 10, 12, 9]); names = 'ABCDEFGHIJKL'[:n]
        i = r.randint(2, n - 2)
        k = r.randrange(2)
        if k == 0:
            u.add(f'円Oの周を {n} 等分する点を、順に {"、".join(names)} とし、正{n}角形をかいた。弧ABに対する中心角∠AOBの大きさを求めよう。', deg_answer(F(360, n)), f'中心のまわりの角 360° を {n} 等分する。360÷{n}＝{fmt_num(F(360, n))}°', 105, 'A④', 'おうぎ形と中心角', [ans_str(F(180, n))], tb=172, tbnote='おうぎ形・中心角')
        else:
            longer = n - i
            u.add(f'円Oの周を {n} 等分する点を、順に {"、".join(names)} とする。点{names[i + 1] if i + 1 < n else names[0]}をふくむ方の弧A{names[i]} の長さは、弧ABの長さの何倍か答えよう。', num_answer(longer),
                  f'Aから{names[i]}へ、{names[i + 1] if i + 1 < n else names[0]}を通る方に進むと、等分した弧を {longer} 個ふくむ。中心角も {longer} 倍。答え {longer} 倍', 105, 'A④(2)', '弧の長さと中心角', [str(i)], tb=172, tbnote='合同なおうぎ形')
    def t4():
        a = r.choice([20, 25, 30, 35, 40, 50, 55, 60, 65, 70])
        ask = r.choice(['POA', 'OAP'])
        given = 'OAP' if ask == 'POA' else 'POA'
        u.add(f'直線ℓは円Oの接線で、点Pは接点である。直線ℓ上に点Aをとり、OとAを結ぶ。∠{given}＝{a}° のとき、∠{ask}の大きさを求めよう。', deg_answer(90 - a),
              f'円の接線は、その接点を通る半径に垂直なので ∠OPA＝90°。△OPAで ∠{ask}＝180°−90°−{a}°＝{90 - a}°', 105, 'B①(2)', '円の接線の性質', [str(a), str(180 - a)], tb=171, tbnote='円の接線の性質')
    def t5():
        c = r.randint(4, 20)
        u.add(f'円Oで、直径nが弦ABと点Mで垂直に交わっている。AB＝{c}cm のとき、AM の長さを求めよう。', len_answer(F(c, 2)), f'円は直径を対称の軸とする線対称な図形。弦ABは直径nによって2等分される。AM＝{c}÷2＝{fmt_num(F(c, 2), "dec")}（cm）', 104, 'A②', '弦と直径', [str(c)], tb=171, tbnote='問4')
    def t6():
        k = r.randrange(3)
        if k == 0: u.add('弦ABが円の直径であるとき、弧ABに対する中心角は何度か答えよう。', deg_answer(180), '直径の両端A、Bと中心Oは一直線上にあるので、∠AOB＝180°', 104, 'A①', '中心角', ['90', '360'], tb=171, tbnote='問3')
        elif k == 1:
            r0 = r.randint(2, 15)
            u.add(f'円Oの半径が {r0}cm のとき、直径の長さを求めよう。', len_answer(2 * r0), f'直径は半径の2倍。{r0}×2＝{2 * r0}（cm）', 104, 'A①', '半径と直径', [str(r0)], tb=170, tbnote='直径は半径の2倍')
        else:
            a, b = r.sample([30, 40, 45, 60, 72, 90, 120, 150], 2)
            u.add(f'半径の等しい2つのおうぎ形があり、中心角はそれぞれ {a}° と {b}° である。中心角が {a}° のおうぎ形の弧の長さは、中心角が {b}° のおうぎ形の弧の長さの何倍か答えよう。', num_answer(F(a, b)),
                  f'1つの円（半径が等しい円）では、おうぎ形の弧の長さは中心角の大きさに比例する。{a}÷{b}＝{fmt_num(F(a, b))}（倍）', 105, 'A⑤', 'おうぎ形と中心角', [ans_str(F(b, a))], tb=175, tbnote='ひろげよう')
    def t7():
        d = r.randint(2, 9)
        u.add(f'点Oを中心として直線ℓに接する円をかく。点Oと直線ℓとの距離が {d}cm のとき、この円の半径を求めよう。', len_answer(d), f'円の接線は、接点を通る半径に垂直。だから接点は、Oからℓにひいた垂線の足で、半径は点Oと直線ℓとの距離 {d}cm', 105, 'B+②', '接する円の作図', [str(2 * d)], tb=171, tbnote='円の接線の性質')
    plan = [t1] * 7 + [t2] * 2 + [t3] * 14 + [t4] * 16 + [t5] * 10 + [t6] * 14 + [t7] * 7
    return done(fill(u, plan))

# ---------------- 円とおうぎ形の計量（ワーク p106〜107・教科書 p173〜176） ----------------
CM = ['cm']; CM2 = ['cm²', 'cm2']
def g7():
    u = Unit('workbook-math-1-circlecalc', 'workbook', '円とおうぎ形の計量', '平面図形',
             '2026-10-05 Claude作成。数学ワークp106〜107（A①円の周の長さと面積・A②おうぎ形の弧の長さと面積・A③中心角の求め方・B①・B+②2つのおうぎ形を組み合わせた図形）と教科書p173〜176（円周率π・例1・問1・おうぎ形の弧の長さと面積・問2・例2・問3・例題1・問4・問5）を写真で確認。答えは π を使って表す。', tb=175)
    r = rng(1361)
    ANG = [20, 30, 36, 40, 45, 60, 72, 80, 90, 100, 108, 120, 135, 144, 150, 160, 180, 200, 210, 225, 240, 270, 300, 315]
    def t1():
        rr = r.randint(2, 15); dia = r.random() < .5; what = r.choice(['周の長さ', '面積'])
        rad = rr
        given = f'直径 {2 * rr}cm' if dia else f'半径 {rr}cm'
        v = 2 * rad if what == '周の長さ' else rad * rad
        u.add(f'{given}の円の{what}を求めよう（π を使って答える）。', pi_answer(v, CM if what == '周の長さ' else CM2),
              f'{"直径の半分が半径で " + str(rad) + "cm。" if dia else ""}{"周の長さ ℓ＝2πr＝2π×" + str(rad) if what == "周の長さ" else "面積 S＝πr²＝π×" + str(rad) + "²"}＝{pi_txt(v)}', 106, 'A①', '円の周の長さと面積', [pi_txt(rad * rad if what == '周の長さ' else 2 * rad)] + ([pi_txt(4 * rad if what == '周の長さ' else 4 * rad * rad)] if dia else []), tb=173, tbnote='例1・問1')
    def t2():
        rr = r.randint(2, 18); a = r.choice(ANG); what = r.choice(['弧の長さ', '面積'])
        v = F(2 * rr * a, 360) if what == '弧の長さ' else F(rr * rr * a, 360)
        if v.denominator > 2: return
        u.add(f'半径 {rr}cm、中心角 {a}° のおうぎ形の{what}を求めよう（π を使って答える）。', pi_answer(v, CM if what == '弧の長さ' else CM2),
              f'{"ℓ＝2πr×a/360＝2π×" + str(rr) if what == "弧の長さ" else "S＝πr²×a/360＝π×" + str(rr) + "²"}×{a}/360＝{pi_txt(v)}', 106, 'A②', 'おうぎ形の弧の長さと面積', [pi_txt(F(rr * rr * a, 360) if what == '弧の長さ' else F(2 * rr * a, 360)), pi_txt(2 * rr if what == '弧の長さ' else rr * rr)], tb=175, tbnote='例2・問3')
    def t3():
        rr = r.randint(3, 18); a = r.choice(ANG); arc = F(2 * rr * a, 360)
        if arc.denominator != 1: return
        u.add(f'半径 {rr}cm、弧の長さ {pi_txt(arc)}cm のおうぎ形の中心角の大きさを求めよう。', deg_answer(a),
              f'中心角を x° とすると、（弧の長さ）:（円の周の長さ）＝x:360 より {pi_txt(arc)}:{pi_txt(2 * rr)}＝x:360。{2 * rr}x＝{arc}×360、x＝{a}', 107, 'A③', '中心角の求め方', [str(360 - a), ans_str(arc)], tb=176, tbnote='例題1')
    def t4():
        rr = r.randint(3, 18); a = r.choice(ANG); S = F(rr * rr * a, 360); arc = F(2 * rr * a, 360)
        if S.denominator != 1 or arc.denominator != 1: return
        k = r.randrange(3)
        if k == 0:
            u.add(f'半径 {rr}cm、面積 {pi_txt(S)}cm² のおうぎ形の中心角の大きさを求めよう。', deg_answer(a), f'中心角を x° とすると {pi_txt(S)}＝π×{rr}²×x/360、x＝{S}×360÷{rr * rr}＝{a}', 107, 'B①(2)', '中心角の求め方', [str(360 - a)], tb=176, tbnote='問5')
        elif k == 1:
            u.add(f'半径 {rr}cm、面積 {pi_txt(S)}cm² のおうぎ形の弧の長さを求めよう（π を使って答える）。', pi_answer(arc, CM), f'まず中心角を求めると {a}°。弧の長さ＝2π×{rr}×{a}/360＝{pi_txt(arc)}（cm）', 107, 'B①(2)', 'おうぎ形の弧の長さ', [pi_txt(S), str(a)], tb=176, tbnote='問5')
        else:
            u.add(f'半径 {rr}cm、弧の長さ {pi_txt(arc)}cm のおうぎ形の面積を求めよう（π を使って答える）。', pi_answer(S, CM2), f'中心角は {a}°。面積＝π×{rr}²×{a}/360＝{pi_txt(S)}（cm²）', 107, 'B①(1)', 'おうぎ形の面積', [pi_txt(arc), pi_txt(2 * S)], tb=176, tbnote='問4・問5')
    def t5():
        r1, w = r.randint(4, 12), r.randint(2, 6); r2 = r1 + w; a = r.choice([36, 45, 60, 72, 90, 120, 144, 180])
        arcs = F(2 * (r1 + r2) * a, 360); area = F((r2 * r2 - r1 * r1) * a, 360)
        if arcs.denominator != 1 or area.denominator != 1: return
        what = r.choice(['周の長さ', '面積'])
        if what == '周の長さ':
            ans = expr_answer(f'{pi_txt(arcs)}+{2 * w}', units=CM)
            u.add(f'中心角 {a}° で、半径 {r2}cm のおうぎ形から、同じ中心で半径 {r1}cm のおうぎ形を取りのぞいた図形がある（{w}cm の辺が2本ある）。この図形の周の長さを求めよう（π を使って答える）。', ans,
                  f'周は、大きい弧＋小さい弧＋{w}cm の辺2本。2π×{r2}×{a}/360＋2π×{r1}×{a}/360＋{w}×2＝{pi_txt(arcs)}＋{2 * w}（cm）', 107, 'B+②', '組み合わせた図形の周の長さ', [pi_txt(arcs)], tb=175, tbnote='おうぎ形の弧の長さ')
        else:
            u.add(f'中心角 {a}° で、半径 {r2}cm のおうぎ形から、同じ中心で半径 {r1}cm のおうぎ形を取りのぞいた図形がある。この図形の面積を求めよう（π を使って答える）。', pi_answer(area, CM2),
                  f'π×{r2}²×{a}/360−π×{r1}²×{a}/360＝{pi_txt(area)}（cm²）', 107, 'B+②', '組み合わせた図形の面積', [pi_txt(F(w * w * a, 360))], tb=175, tbnote='おうぎ形の面積')
    def t6():
        a = r.choice([30, 45, 60, 72, 90, 120, 135, 144, 150, 240, 270])
        what = r.choice(['周の長さ', '面積'])
        u.add(f'中心角が {a}° のおうぎ形の弧の長さは、同じ半径の円の周の長さの何倍か答えよう。' if what == '周の長さ' else f'中心角が {a}° のおうぎ形の面積は、同じ半径の円の面積の何倍か答えよう。', num_answer(F(a, 360)),
              f'1つの円では、おうぎ形の弧の長さや面積は中心角に比例する。{a}/360＝{fmt_num(F(a, 360))}（倍）', 106, 'A②', 'おうぎ形と円の関係', [ans_str(F(360, a))], tb=174, tbnote='問2')
    def t7():
        rr = r.choice([4, 6, 8, 10, 12]); a = r.choice([30, 45, 60, 90])
        S = F(rr * rr * a, 360)
        if S.denominator != 1: return
        u.add(f'半径 {rr}cm、中心角 {a}° のおうぎ形OABがある。線分OAを直径とする半円と、線分OBを直径とする半円を、おうぎ形と同じ側にかいた。おうぎ形OABの面積に、OBを直径とする半円の面積を加え、OAを直径とする半円の面積をひいてできる部分の面積を求めよう（π を使って答える）。', pi_answer(S, CM2),
              f'OA＝OB なので2つの半円の面積は等しく、加えてひくと打ち消し合う。残るのはおうぎ形の面積で π×{rr}²×{a}/360＝{pi_txt(S)}（cm²）', 109, '⑦(1)', '組み合わせた図形の面積', [pi_txt(S + F(rr * rr, 8))], tb=175, tbnote='おうぎ形の面積')
    plan = [t1] * 10 + [t2] * 14 + [t3] * 10 + [t4] * 14 + [t5] * 10 + [t6] * 6 + [t7] * 6
    return done(fill(u, plan))

# ---------------- ふりかえりドリル（ワーク p108〜109：入試問題をふくむ） ----------------
def g8():
    u = Unit('workbook-math-1-georeview', 'workbook', 'ふりかえりドリル', '平面図形',
             '2026-10-05 Claude作成。数学ワークp108〜109（①回転移動（京都）・②垂直二等分線の作図（東京）・③角の二等分線の作図（兵庫）・④垂線の作図（岩手）・⑤いろいろな角の作図（千葉）・⑥円の接線（福島）・⑦おうぎ形の計量（埼玉・京都））を写真で確認し、教科書p156〜176と照らして作り直した。')
    r = rng(1371)
    def t1():
        ax, ay = rint(r, -5, 5, False), rint(r, -5, 5, False); ox, oy = rint(r, -2, 2), rint(r, -2, 2)
        x, y = ax - ox, ay - oy
        for _ in range(3): x, y = -y, x   # 反時計まわり270° ＝ 時計まわり90°
        u.add(f'点A{pt(ax, ay)} を、点O{pt(ox, oy)} を回転の中心として、時計まわりに 270° 回転移動した点の座標を答えよう。', pt_answer(x + ox, y + oy),
              f'時計まわりに 270° は、反時計まわりに 90° と同じ。OからAへの「{walk(ax - ox, ay - oy)}」を反時計まわりに90°回すと「{walk(x, y)}」。答え {pt(x + ox, y + oy)}', 108, '①', '回転移動', [ans_str(F(-(x) + ox)) + ',' + ans_str(F(-(y) + oy))], tb=157, tbnote='回転移動')
    def t2():
        h, k = rint(r, -3, 3), rint(r, -3, 3); ps = r.sample(CIRC, 3); P = [(h + a, k + b) for a, b in ps]
        u.add(f'3点A{pt(*P[0])}、B{pt(*P[1])}、C{pt(*P[2])} のそれぞれから等しい距離にある点Pの座標を答えよう。', pt_answer(h, k),
              f'Pは、線分ABの垂直二等分線と線分BCの垂直二等分線の交点。{pt(h, k)} からはどの点も距離 5。', 108, '②(1)', '垂直二等分線の利用', [ans_str(F(k)) + ',' + ans_str(F(h))], tb=163, tbnote='垂直二等分線')
    def t3():
        y1 = r.randint(1, 6); x1 = rint(r, -8, 0); x2 = x1 + 2 * r.randint(1, 6)
        u.add(f'x 軸を直線ℓとみる。直線ℓ上にあって、2点A{pt(x1, y1)}、B{pt(x2, y1)} から等しい距離にある点Qの座標を答えよう。', pt_answer((x1 + x2) // 2, 0),
              f'Qは線分ABの垂直二等分線（x＝{(x1 + x2) // 2}）とℓとの交点。', 108, '②(2)', '垂直二等分線の利用', [ans_str(F((x1 + x2) // 2)) + ',' + str(y1)], tb=163, tbnote='垂直二等分線')
    def t4():
        b = r.choice([40, 50, 60, 70, 80]); c = r.choice([30, 40, 50, 60]);
        if b + c >= 180: return
        u.add(f'△ABCで、∠B＝{b}°、∠C＝{c}° である。辺BCが辺BAに重なるように折ったときにできる折り目と、辺BCがつくる角の大きさを求めよう。', deg_answer(F(b, 2)), f'折り目は∠ABCの二等分線になる。{b}÷2＝{fmt_num(F(b, 2))}°', 108, '③(1)', '角の二等分線の利用', [str(b), ans_str(F(c, 2))], tb=163, tbnote='角の二等分線')
    def t5():
        px, py = rint(r, -6, 6, False), rint(r, -6, 6, False); k = rint(r, -3, 3)
        if px == k: return
        u.add(f'点P{pt(px, py)} を、点{pt(k, 0)} を通り y 軸に平行な直線ℓについて対称移動した点Qの座標を答えよう（Pからℓにひいた垂線を、反対側に同じ長さだけのばした点がQ）。', pt_answer(2 * k - px, py),
              f'PQはℓに垂直で、ℓによって2等分される。ℓまでの距離は {abs(px - k)}。答え {pt(2 * k - px, py)}', 108, '④', '垂線の利用', [ans_str(F(-px)) + ',' + ans_str(F(py))], tb=165, tbnote='直線上にない1点を通る垂線')
    def t6():
        a, way = r.choice([(165, '180°−15°'), (135, '90°＋45°'), (150, '90°＋60°'), (105, '90°＋15°'), (75, '60°＋15°'), (120, '180°−60°')])
        u.add(f'線分OXを使って、∠XOY＝{a}° となるような線分OYを作図したい（{a}°＝{way} と考えられる）。線分XOをOの方へのばした半直線をOZとするとき、∠YOZ が何度になるように作図すればよいか答えよう。', deg_answer(180 - a),
              f'∠XOYと∠YOZを合わせると一直線の角で180°。∠YOZ＝180°−{a}°＝{180 - a}°。この角が作図できれば {a}° もつくれる。', 109, '⑤(2)', 'いろいろな角の作図', [str(a)], tb=168, tbnote='いろいろな角の作図')
    def t7():
        a = r.choice([25, 30, 35, 40, 50, 55, 60, 65])
        u.add(f'円Oの周上の点Pを通る接線ℓをひく。ℓ上に点Qをとると ∠OQP＝{a}° となった。∠POQの大きさを求めよう。', deg_answer(90 - a), f'接線は接点を通る半径に垂直なので ∠OPQ＝90°。∠POQ＝180°−90°−{a}°＝{90 - a}°', 109, '⑥', '円の接線', [str(a), str(180 - a)], tb=171, tbnote='円の接線の性質')
    def t8():
        rr = r.choice([4, 6, 18, 9, 12, 10]); a = r.choice([45, 60, 90, 120, 135, 240, 270, 300, 340])
        S = F(rr * rr * a, 360); arc = F(2 * rr * a, 360)
        if S.denominator != 1 or arc.denominator != 1: return
        k = r.randrange(3)
        if k == 0: u.add(f'半径 {rr}cm、面積 {pi_txt(S)}cm² のおうぎ形の中心角の大きさを求めよう。', deg_answer(a), f'π×{rr}²×x/360＝{pi_txt(S)} より x＝{a}', 109, '⑦(2)', 'おうぎ形の中心角', [str(360 - a)], tb=176, tbnote='問5')
        elif k == 1: u.add(f'半径 {rr}cm、面積 {pi_txt(S)}cm² のおうぎ形の弧の長さを求めよう（π を使って答える）。', pi_answer(arc, CM), f'中心角は {a}°。2π×{rr}×{a}/360＝{pi_txt(arc)}（cm）', 109, '⑦(3)', 'おうぎ形の弧の長さ', [pi_txt(S)], tb=176, tbnote='問5')
        else: u.add(f'半径 {rr}cm、弧の長さ {pi_txt(arc)}cm のおうぎ形の面積を求めよう（π を使って答える）。', pi_answer(S, CM2), f'中心角は {a}°。π×{rr}²×{a}/360＝{pi_txt(S)}（cm²）', 109, '⑦(4)', 'おうぎ形の面積', [pi_txt(arc)], tb=176, tbnote='問5')
    plan = [t1] * 10 + [t2] * 10 + [t3] * 7 + [t4] * 7 + [t5] * 8 + [t6] * 6 + [t7] * 8 + [t8] * 14
    return done(fill(u, plan))
