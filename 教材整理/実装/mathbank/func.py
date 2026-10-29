"""4章 変化と対応（ワーク p74〜89・教科書 p115〜143 を写真で確認して作成）"""
from common import *
from bank import relation_answer
import alg
from alg import var, show as sh

X = var('x')

import re
NUM = r'\d+(?:\.\d+)?(?:/\d+)?'
def tidy(t):
    """式の書き方をそろえる：− の記号、× ÷ のとなりの負の数・分数はかっこ、正の整数の余分なかっこははずす"""
    t = re.sub(r'(?<![\w/.])-(?=\d)', '−', t)
    t = re.sub(r'([×÷/＝])\((\d+(?:\.\d+)?)\)', r'\1\2', t)
    t = re.sub(r'(^|[＝ ：、。])(−' + NUM + r')(\s?[×÷])', r'\1(\2)\3', t)
    t = re.sub(r'([×÷]\s?)(−?\d+/\d+)(?![\d)])', r'\1(\2)', t)
    t = re.sub(r'(^|[＝ ：、。])(\d+/\d+)(\s?[×÷])', r'\1(\2)\3', t)
    return t
def done(u):
    for q in u.qs:
        q['prompt'] = tidy(q['prompt']); q['explanation'] = tidy(q['explanation'])
    return u
def yax(a): return 'y=' + sh(F(a) * X)
def yinv(a):
    a = F(a)
    return 'y=' + ('−' if a < 0 else '') + fmt_num(abs(a)) + '/x'
def pt(x, y): return f'({fmt_num(F(x))}, {fmt_num(F(y))})'
def pt_answer(x, y):
    """座標の答え：(3, −2) の書き方のちがいを全部正解に"""
    a, b = ans_str(F(x)), ans_str(F(y))
    acc = []
    for l, rr in (('(', ')'), ('', '')):
        for sep in (',', '、'):
            acc.append(f'{l}{a}{sep}{b}{rr}')
    return exact_answer(acc, compact=True)
def range_answer(lo, lo_in, hi, hi_in, var_='x'):
    """変域の答え：−3≦x<1 など（≦ ≤ <= どれでも）"""
    le = ['≦', '≤', '<=']; lt = ['<']
    acc = []
    for o1 in (le if lo_in else lt):
        for o2 in (le if hi_in else lt):
            acc.append(f'{ans_str(F(lo))}{o1}{var_}{o2}{ans_str(F(hi))}')
    return exact_answer(acc, compact=True)
def range_txt(lo, lo_in, hi, hi_in, v='x'): return f'{fmt_num(F(lo))}{"≦" if lo_in else "<"}{v}{"≦" if hi_in else "<"}{fmt_num(F(hi))}'

FUNC_FACTS = [('1辺の長さが x cm の正方形の周の長さ y cm', True), ('身長 x cm の人の体重 y kg', False), ('分速 70 m で x 分間歩いたときに進んだ道のり y m', True),
              ('ある数 x の絶対値 y', True), ('絶対値が x である数 y', False), ('周の長さが x cm の正五角形の1辺の長さ y cm', True),
              ('電車の運賃が x 円のときの走行距離 y km', False), ('周の長さが 24 cm の長方形の縦の長さ x cm と横の長さ y cm', True),
              ('周の長さが x cm の長方形の面積 y cm²', False), ('半径 x cm の円の面積 y cm²', True), ('自然数 x の約数の個数 y 個', True),
              ('約数が x 個ある自然数 y', False), ('1人あたり 300 円のクラス会費を x 人から集めたときの金額 y 円', True), ('x 歳の人の身長 y cm', False)]

# ---------------- 関数（ワーク p74〜75・教科書 p116〜118） ----------------
def f1():
    u = Unit('workbook-math-1-func', 'workbook', '関数', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp74〜75（A①関数であるか・A②表で調べる（リボン）・A③変域・B①・B②変域・B+③ろうそく）と教科書p116〜118（関数・例1・例2 窓・問1〜4・変域・例3）を写真で確認。', tb=116)
    r = rng(1201)
    def t1():
        pick = r.sample(FUNC_FACTS, 4)
        ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t]
        if not ok or len(ok) == 4: return
        u.add('次のア〜エのうち、y が x の関数であるものをすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(pick)), choice_answer(ok),
              'x の値を決めると、それに対応して y の値がただ1つに決まるとき、y は x の関数である。例えば身長が同じでも体重はいろいろなので関数ではない。正解：' + '、'.join(ok), 74, 'A①' if r.random() < .5 else 'B①', '関数', tb=116, tbnote='関数・問1')
    def t2():
        L, c = r.choice([(12, 2), (30, 3), (20, 4), (50, 5), (40, 6)]); k = r.randint(1, L // c - 1)
        y = L - c * k
        u.add(f'長さが {L} cm のリボンから {c} cm のリボンを x 本切り取ったときの残りの長さを y cm とする。x＝{k} のときの y の値を求めよう。', {'kind': 'number', 'value': str(y), 'units': ['cm']},
              f'1本切り取るごとに {c} cm ずつ短くなるので、y＝{L}−{c}x。x＝{k} のとき y＝{L}−{c}×{k}＝{y}（cm）', 74, 'A②', '表で関数のようすを調べる', [str(c * k), str(L + c * k)], tb=117, tbnote='例1')
    def t3():
        L, c = r.choice([(27, 1), (30, 2), (24, 3), (40, 4), (36, 2)])
        if r.random() < .5:
            u.add(f'{L} cm のろうそくがあり、1分間に {c} cm の割合で短くなる。火をつけてから x 分後の残りの長さを y cm とするとき、x と y の関係を式に表そう。', relation_answer(f'y={L}−{c if c != 1 else ""}x'),
                  f'x 分間で {c}x cm 短くなるので、残りは y＝{L}−{c if c != 1 else ""}x', 75, 'B+③', '関数の関係を式に表す', [f'y={c if c != 1 else ""}x', f'y={L}+{c if c != 1 else ""}x'], tb=118, tbnote='例2')
        else:
            u.add(f'{L} cm のろうそくがあり、1分間に {c} cm の割合で短くなる。火をつけてから x 分後の残りの長さを y cm とする。ろうそくが燃えつきるまでの x の変域を、不等号を使って表そう。', range_answer(0, True, F(L, c), True),
                  f'燃えつきるのは {L}÷{c}＝{fmt_num(F(L, c))}（分後）。x の変域は {range_txt(0, True, F(L, c), True)}', 75, 'B+③', '変域', tb=118, tbnote='変域・例2')
    def t4():
        lo, hi = sorted(r.sample(range(-8, 9), 2)); a, b = r.random() < .5, r.random() < .5
        w1 = '以上' if a else 'より大きく'; w2 = '以下' if b else '未満'
        if lo == hi: return
        u.add(f'変数 x のとる値が「{fmt_num(F(lo))} {w1} {fmt_num(F(hi))} {w2}」であることを、不等号を使って表そう。', range_answer(lo, a, hi, b),
              f'「以上・以下」は ≦（その数をふくむ）、「より大きい・未満」は ＜（その数をふくまない）。{range_txt(lo, a, hi, b)}', 75, 'A③' if r.random() < .5 else 'B②', '変域', tb=118, tbnote='例3・問4')
    def t5():
        lo, hi = sorted(r.sample(range(-9, 10), 2)); a, b = r.random() < .5, r.random() < .5
        n = sum(1 for k in range(lo, hi + 1) if (k > lo or a) and (k < hi or b))
        if n < 2: return
        u.add(f'x の変域が {range_txt(lo, a, hi, b)} のとき、x のとる整数の値は全部で何個あるか答えよう。', {'kind': 'number', 'value': str(n), 'units': ['個']},
              f'{"≦ はその数をふくむ" if a or b else ""}{"、" if (a or b) and not (a and b) else ""}{"＜ はふくまない" if not (a and b) else ""}。あてはまる整数は {"、".join(fmt_num(F(k)) for k in range(lo, hi + 1) if (k > lo or a) and (k < hi or b))} の {n} 個', 75, 'A③', '変域', [str(n + 1), str(n - 1), str(hi - lo + 1)], tb=118, tbnote='変域')
    def t6():
        S = r.choice([16, 20, 24, 30]); k = r.randint(1, S // 2 - 1)
        side = S - 2 * k; ask = r.choice(['1辺の長さ', '面積'])
        v = side if ask == '1辺の長さ' else side * side
        u.add(f'1辺が {S} cm の正方形の紙の四すみから、1辺が x cm の正方形を切り取って、ふたのない箱をつくる。x＝{k} のとき、箱の底面の{ask}を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['cm', 'cm²', 'cm2']},
              f'底面は正方形で、1辺は {S}−2x（cm）。x＝{k} のとき {side} cm' + (f'、面積は {side}×{side}＝{v}（cm²）' if ask == '面積' else ''), 74, 'A②', '関数（箱づくり）', [str(S - k), str((S - k) ** 2)], tb=117, tbnote='例1・問2')
    def t7():
        h, m = r.choice([(130, 90), (120, 80), (150, 100), (110, 70)]); k = r.randint(10, m)
        u.add(f'縦が {h} cm の窓をあける。窓を動かした長さを x cm、あいた部分の面積を y cm² とすると y＝{h}x で、窓は最大 {m} cm まで動かせる。y の変域を、不等号を使って表そう。', range_answer(0, True, h * m, True, 'y'),
              f'x の変域は 0≦x≦{m}。y は x に比例して増えるので、y の最大は {h}×{m}＝{h * m}。y の変域は 0≦y≦{h * m}', 75, 'B②', '変域', tb=118, tbnote='例2・変域')
    plan = [t1] * 12 + [t2] * 9 + [t3] * 10 + [t4] * 12 + [t5] * 10 + [t6] * 9 + [t7] * 8
    return done(fill(u, plan))

PROP_FACTS = [('重さ x g のすいかを 100 g の箱に入れたときの全体の重さ y g', False), ('時速 x km で2時間走ったときに進む道のり y km', True),
              ('底面積が 8 cm²、高さが x cm の三角柱の体積 y cm³', True), ('底辺 x cm、高さ 5 cm の平行四辺形の面積 y cm²', True),
              ('x 円のりんごを3個買って、1000円出したときのおつり y 円', False), ('x m の道のりを分速 80 m で進むときにかかる時間 y 分', True),
              ('1本 120 円のペンを x 本買ったときの代金 y 円', True), ('1辺 x cm の正方形の面積 y cm²', False), ('200ページの本を x ページ読んだときの残りのページ数 y', False)]

# ---------------- 比例の式①（ワーク p76〜77・教科書 p120〜122） ----------------
def f2():
    u = Unit('workbook-math-1-prop1', 'workbook', '比例の式①', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp76〜77（A①表から比例の関係を読みとる・A②比例の関係・A③④変数が負の値をとるとき・B①・B+②分速50mで東へ）と教科書p120〜122（比例・比例定数・例1・問1・問2・説明しよう・練習問題1）を写真で確認。', tb=120)
    r = rng(1211)
    def t1():
        a = r.choice([F(rint(r, -12, 12)), rfrac(r, (2, 3, 4), 1, 9)])
        if a == 0: return
        xs = [1, 2, 3, 4, 5] if r.random() < .5 else [-2, -1, 1, 2, 3]
        tb = '　'.join(f'x＝{fmt_num(F(x))} のとき y＝{fmt_num(a * x)}' for x in xs)
        u.add(f'x と y の値が次のように対応している。y は x に比例する。x と y の関係を式に表そう。\n{tb}', relation_answer(yax(a)),
              f'y の値は x の値の {fmt_num(a)} 倍（y/x＝{fmt_num(a)} で一定）。{yax(a)}', 76, 'A①', '表から比例の関係を読みとる', [yax(-a), yax(1 / a)], tb=120, tbnote='例1・問1')
    def t2():
        pick = r.sample(PROP_FACTS, 4)
        ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t]
        if not ok or len(ok) == 4: return
        u.add('次のア〜エのうち、y が x に比例するものをすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(pick)), choice_answer(ok),
              'x と y の関係を式に表し、y＝ax の形になるものを選ぶ（＋の数がつく式や x² の式は比例ではない）。正解：' + '、'.join(ok), 77, 'B①', '比例の関係', tb=122, tbnote='練習問題1')
    def t3():
        a, x = rint(r, -9, 9), rint(r, -9, 9)
        if abs(a) < 2 or x == 0: return
        y = a * x
        u.add(f'{yax(a)} で、x＝{fmt_num(F(x))} のときの y の値を求めよう。', num_answer(y), f'x に {fmt_num(F(x))} を代入する。y＝{fmt_num(F(a))}×({fmt_num(F(x))})＝{fmt_num(F(y))}' if x < 0 else f'y＝{fmt_num(F(a))}×{x}＝{fmt_num(F(y))}', 77, 'A④', '変数が負の値をとるとき', [ans_str(-y)], tb=121, tbnote='例1・問2')
    def t4():
        c, k = r.choice([10, 8, 12, 6, 15]), r.randint(2, 9)
        if r.random() < .5:
            u.add(f'からではない浴そうに、1分間に {c} L の割合で水を入れる。午後6時を基準にして、その x 分後に浴そうの水の量が y L 増えるとすると y＝{c}x となる。x＝−{k} のときの y の値を求めよう。', num_answer(-c * k),
                  f'y＝{c}×(−{k})＝−{c * k}。これは「午後6時の {k} 分前は、水の量が午後6時より {c * k} L 少なかった」ことを表す。', 77, 'A③', '変数が負の値をとるとき', [str(c * k)], tb=121, tbnote='例1')
        else:
            u.add(f'からではない浴そうに、1分間に {c} L の割合で水を入れる。午後6時を基準にして x 分後に水の量が y L 増えるとすると y＝{c}x となる。午後6時の {k} 分前の水の量は、午後6時より何 L 少なかったか答えよう。', {'kind': 'number', 'value': str(c * k), 'units': ['L']},
                  f'{k} 分前は x＝−{k}。y＝{c}×(−{k})＝−{c * k} は、{c * k} L 少ないことを表す。', 77, 'A③(2)', '負の値の意味', [str(-c * k), str(c)], tb=121, tbnote='例1')
    def t5():
        v, k = r.choice([50, 60, 70, 80]), r.randint(2, 9)
        dirn = r.choice(['東', '北'])
        opp = '西' if dirn == '東' else '南'
        u.add(f'Aさんは、{dirn}へ向かって分速 {v} m で歩いている。途中のP地点を通過してから x 分後にP地点から{dirn}へ y m の所にいるとする（x 分前は x を負の数で表す）。x＝−{k} のとき、AさんはP地点からどちらの方角に何 m の所にいたか。距離（m）を答えよう。', {'kind': 'number', 'value': str(v * k), 'units': ['m']},
              f'y＝{v}x。x＝−{k} のとき y＝−{v * k}。これは、P地点を通過する {k} 分前にP地点から{opp}へ {v * k} m の所にいたことを表す。', 77, 'B+②', '負の値の意味', [str(-v * k)], tb=121, tbnote='例1')
    def t6():
        a = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4, 5), 1, 9)]); x = rint(r, -6, 6)
        if a == 0 or x == 0: return
        y = a * x
        if y.denominator != 1: return
        u.add(f'y は x に比例し、x＝{fmt_num(F(x))} のとき y＝{fmt_num(y)} である。対応する x と y の値の商 y/x を求めよう。', num_answer(a), f'比例の関係では y/x は一定で、比例定数に等しい。{fmt_num(y)}÷({fmt_num(F(x))})＝{fmt_num(a)}', 76, 'A②', '比例の関係（y/x は一定）', [ans_str(1 / a), ans_str(-a)], tb=121, tbnote='比例の関係(イ)')
    def t7():
        k = r.choice([2, 3, 4, 5]); m = r.choice([F(1, 2), F(1, 3)])
        if r.random() < .5:
            u.add(f'y は x に比例している。x の値が {k} 倍になると、y の値は何倍になるか答えよう。', num_answer(k), f'比例の関係では、x の値が2倍、3倍、…になると、y の値も2倍、3倍、…になる。答え {k} 倍', 76, 'A②', '比例の関係', [ans_str(F(1, k))], tb=121, tbnote='比例の関係(ア)')
        else:
            u.add(f'y は x に比例している。x の値が {fmt_num(m)} 倍になると、y の値は何倍になるか答えよう。', num_answer(m), f'比例では x と y は同じ倍率で変わる。答え {fmt_num(m)} 倍', 76, 'A②', '比例の関係', [ans_str(1 / m)], tb=121, tbnote='比例の関係(ア)')
    def t8():
        h, k = r.choice([4, 6, 8, 10]), r.randint(1, 5)
        shape = r.choice([('平行四辺形', 1), ('三角形', F(1, 2))])
        a = h * shape[1]
        u.add(f'底辺が {h} cm、高さが x cm の{shape[0]}の面積を y cm² とする。x と y の関係を式に表そう。', relation_answer(yax(a)),
              f'{shape[0]}の面積＝底辺×高さ{"÷2" if shape[1] != 1 else ""}。y＝{h}×x{"÷2" if shape[1] != 1 else ""} より {yax(a)}（比例定数 {fmt_num(a)}）', 76, 'A②', '比例の式', [yax(h * 2) if shape[1] != 1 else yax(F(h, 2))], tb=120, tbnote='問1(2)')
    plan = [t1] * 12 + [t2] * 9 + [t3] * 10 + [t4] * 8 + [t5] * 7 + [t6] * 8 + [t7] * 6 + [t8] * 8
    return done(fill(u, plan))

# ---------------- 比例の式②／座標（ワーク p78〜79・教科書 p122〜125） ----------------
def f3():
    u = Unit('workbook-math-1-prop2', 'workbook', '比例の式②／座標', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp78〜79（A①②比例の式を求める・A③④座標・B①・B+②点を動かす）と教科書p122〜125（例題1・問3・座標・例1・問1・問2）を写真で確認。', tb=122)
    r = rng(1221)
    def t1():
        a = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4, 5), 1, 9)]); x = rint(r, -8, 8)
        if a == 0 or x == 0 or (a * x).denominator != 1: return
        y = a * x
        u.add(f'y は x に比例し、x＝{fmt_num(F(x))} のとき y＝{fmt_num(y)} である。x と y の関係を式に表そう。', relation_answer(yax(a)),
              f'比例定数を a とすると y＝ax。{fmt_num(y)}＝a×({fmt_num(F(x))}) より a＝{fmt_num(a)}。したがって {yax(a)}', 78, 'A①' if a > 0 else 'A②', '比例の式を求める', [yax(-a), yax(1 / a)], tb=122, tbnote='例題1・問3')
    def t2():
        a = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4, 5), 1, 9)]); x1, x2 = rint(r, -12, 12), rint(r, -12, 12)
        if a == 0 or x1 == x2 or (a * x1).denominator != 1 or (a * x2).denominator != 1: return
        y1, y2 = a * x1, a * x2
        u.add(f'y は x に比例し、x＝{fmt_num(F(x1))} のとき y＝{fmt_num(y1)} である。x＝{fmt_num(F(x2))} のときの y の値を求めよう。', num_answer(y2),
              f'y＝ax に代入して a＝{fmt_num(y1)}÷({fmt_num(F(x1))})＝{fmt_num(a)}。{yax(a)} に x＝{fmt_num(F(x2))} を代入して y＝{fmt_num(y2)}', 79, 'B①(2)', '比例の式を求めて値を求める', [ans_str(-y2), ans_str(F(x2) / a)], tb=122, tbnote='例題1')
    def t3():
        px, py = rint(r, -5, 5, False), rint(r, -5, 5, False); dx, dy = rint(r, -7, 7), rint(r, -7, 7)
        w = lambda d, p, n: f'{p}へ {abs(d)}' if d > 0 else f'{n}へ {abs(d)}'
        u.add(f'点P{pt(px, py)} から {w(dx, "右", "左")}、{w(dy, "上", "下")} 進んだ位置にある点の座標を答えよう。', pt_answer(px + dx, py + dy),
              f'右へ進むと x 座標が大きく、左へ進むと小さくなる。上へ進むと y 座標が大きく、下へ進むと小さくなる。x 座標は {fmt_num(F(px))}{"+" if dx > 0 else "−"}{abs(dx)}＝{fmt_num(F(px + dx))}、y 座標は {fmt_num(F(py))}{"+" if dy > 0 else "−"}{abs(dy)}＝{fmt_num(F(py + dy))}。答え {pt(px + dx, py + dy)}', 79, 'B+②', '座標（点を動かす）', [ans_str(F(px + dy)) + ',' + ans_str(F(py + dx))], tb=125, tbnote='例1・問1')
    def t4():
        x, y = rint(r, -6, 6, False), rint(r, -6, 6, False)
        ws = (lambda d, p, n: '' if d == 0 else (f'{p}へ {abs(d)}' if d > 0 else f'{n}へ {abs(d)}'))
        mv = '、'.join(s for s in [ws(x, '右', '左'), ws(y, '上', '下')] if s) or '動かない'
        u.add(f'原点Oから {mv} 進んだところにある点の座標を答えよう。', pt_answer(x, y), f'原点の座標は (0, 0)。x 座標は左右、y 座標は上下の移動を表す。答え {pt(x, y)}', 79, 'A④', '座標', [ans_str(F(y)) + ',' + ans_str(F(x))], tb=125, tbnote='例1')
    def t5():
        k = r.randrange(3); v = rint(r, -6, 6)
        p, ans = [(pt(v, 0), 'ア'), (pt(0, v), 'イ'), ((0, 0), 'ウ')][k]
        if k == 2: p = '(0, 0)'
        u.add(f'点 {p} は、次のどれにあるか。ア〜エから選び、記号で答えよう。\nア x 軸上（原点をのぞく）　イ y 軸上（原点をのぞく）　ウ 原点　エ どの軸の上にもない', choice_answer([ans]),
              'y 座標が0の点は x 軸上、x 座標が0の点は y 軸上、(0, 0) は原点。正解：' + ans, 79, 'A③', '座標軸と原点', tb=124, tbnote='座標軸・原点')
    def t6():
        x1, y1 = rint(r, -5, 5, False), rint(r, -5, 5, False)
        if r.random() < .5:
            x2 = rint(r, -5, 5, False); d = abs(x2 - x1)
            if d == 0: return
            u.add(f'点A{pt(x1, y1)} と点B{pt(x2, y1)} は、どちらも y 座標が同じである。点Aから点Bまで、x 軸に平行に何目もり進めばよいか答えよう。', num_answer(d),
                  f'y 座標が同じなので、x 座標の差を考える。{fmt_num(F(max(x1, x2)))}−({fmt_num(F(min(x1, x2)))})＝{d}（目もり）', 79, 'B+②', '座標（点の移動）', [str(abs(x1) + abs(x2)) if x1 * x2 > 0 else str(abs(abs(x1) - abs(x2)))], tb=125, tbnote='問2')
        else:
            y2 = rint(r, -5, 5, False); d = abs(y2 - y1)
            if d == 0: return
            u.add(f'点A{pt(x1, y1)} と点B{pt(x1, y2)} は、どちらも x 座標が同じである。点Aから点Bまで、y 軸に平行に何目もり進めばよいか答えよう。', num_answer(d),
                  f'x 座標が同じなので、y 座標の差を考える。{fmt_num(F(max(y1, y2)))}−({fmt_num(F(min(y1, y2)))})＝{d}（目もり）', 79, 'B+②', '座標（点の移動）', [str(abs(abs(y1) - abs(y2))) if y1 * y2 < 0 else str(abs(y1) + abs(y2))], tb=125, tbnote='問2')
    def t7():
        a = rint(r, -6, 6); x = rint(r, -6, 6)
        if abs(a) < 2 or x == 0: return
        u.add(f'y は x に比例し、比例定数は {fmt_num(F(a))} である。x 座標が {fmt_num(F(x))} で、x と y の値の組が比例の関係を満たす点の座標を答えよう。', pt_answer(x, a * x),
              f'{yax(a)} に x＝{fmt_num(F(x))} を代入して y＝{fmt_num(F(a * x))}。答え {pt(x, a * x)}', 78, 'A①', '比例の式と座標', [ans_str(F(x)) + ',' + ans_str(F(-a * x))], tb=125, tbnote='座標')
    plan = [t1] * 13 + [t2] * 12 + [t3] * 11 + [t4] * 8 + [t5] * 7 + [t6] * 9 + [t7] * 10
    return done(fill(u, plan))

# ---------------- 比例のグラフ（ワーク p80〜81・教科書 p126〜129） ----------------
def f4():
    u = Unit('workbook-math-1-propgraph', 'workbook', '比例のグラフ', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp80〜81（A①②表とグラフ・A③原点ともう1つの点・B①増加と減少・B+②グラフから式）と教科書p126〜129（比例のグラフ・例1・問1〜4・説明しよう・練習問題1・2）を写真で確認。グラフをかく問題は、通る点や式を答える入力問題にした。', tb=128)
    r = rng(1231)
    def t1():
        p, q = r.choice([(1, 3), (2, 3), (3, 4), (1, 2), (3, 2), (5, 2), (4, 3)]); s = r.choice([1, -1])
        a = F(s * p, q)
        u.add(f'比例の関係 {yax(a)} のグラフは、原点と点({q}, □) を通る。□ にあてはまる数を答えよう。', num_answer(a * q), f'x 座標と y 座標がともに整数になる点をさがす。x＝{q} を代入すると y＝{fmt_num(a * q)}。', 81, 'A③', '原点ともう1つの点をとってグラフをかく', [ans_str(-a * q)], tb=128, tbnote='例1・問3')
    def t2():
        a = r.choice([F(rint(r, -6, 6)), rfrac(r, (2, 3, 4, 5), 1, 7)])
        if a == 0: return
        x = r.choice([1, 2, 3, 4, 5]) * (a.denominator)
        y = a * x
        if abs(y) > 6 or abs(x) > 6:
            x = a.denominator; y = a * x
        u.add(f'比例のグラフが、原点と点{pt(x, y)} を通る直線である。このグラフについて、x と y の関係を式に表そう。', relation_answer(yax(a)),
              f'y＝ax に x＝{x}、y＝{fmt_num(y)} を代入して a＝{fmt_num(a)}。{yax(a)}', 81, 'B+②', 'グラフから式を求める', [yax(-a), yax(1 / a)], tb=128, tbnote='例1')
    def t3():
        items = []
        for _ in range(4):
            c = r.choice([F(rint(r, -5, 5)), rfrac(r, (2, 3, 4, 5), 1, 7), rdec(r, -2, 2)])
            if c == 0: return
            items.append(c)
        if len(set(items)) < 4: return
        want = r.choice(['増加', '減少'])
        ok = [LETTERS[i] for i, c in enumerate(items) if (c > 0) == (want == '増加')]
        if not ok or len(ok) == 4: return
        txt = '　'.join(f'{LETTERS[i]} y={sh(c * X) if c.denominator not in (10,) else fmt_num(c, "dec") + "x" if abs(c) != 1 else sh(c * X)}' for i, c in enumerate(items))
        u.add(f'次のア〜エの関数のうち、x の値が増加するとき、y の値が{want}するものをすべて選び、記号で答えよう。\n{txt}', choice_answer(ok),
              f'比例の関係 y＝ax のグラフは、a＞0 なら右上がり（x が増加すると y も増加）、a＜0 なら右下がり（y は減少）。正解：' + '、'.join(ok), 81, 'B①', '比例のグラフの増加・減少', tb=128, tbnote='比例のグラフ・問4')
    def t4():
        a = r.choice([F(rint(r, -5, 5)), rfrac(r, (2, 3), 1, 5)])
        if a == 0: return
        pts = []
        for _ in range(4):
            x = rint(r, -6, 6); on = r.random() < .45
            y = a * x if on else a * x + r.choice([1, -1, 2])
            if y.denominator != 1: return
            pts.append((x, y, a * x == y))
        ok = [LETTERS[i] for i, (_, _, t) in enumerate(pts) if t]
        if not ok or len(ok) == 4 or len({(p[0], p[1]) for p in pts}) < 4: return
        u.add(f'次のア〜エの点のうち、関数 {yax(a)} のグラフ上にある点をすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} 点{pt(x, y)}' for i, (x, y, _) in enumerate(pts)), choice_answer(ok),
              f'x 座標を式に代入して、y 座標と等しくなるか調べる。' + '　'.join(f'{LETTERS[i]} x＝{fmt_num(F(x))} のとき y＝{fmt_num(a * x)}' for i, (x, _, _) in enumerate(pts)) + '。正解：' + '、'.join(ok), 80, 'A①', 'グラフ上の点', tb=126, tbnote='比例のグラフ')
    def t5():
        a = rint(r, -5, 5); xs = sorted(r.sample(range(-3, 4), 2))
        if abs(a) < 2: return
        ys = [a * x for x in xs]
        u.add(f'関数 {yax(a)} で、x の変域が {range_txt(xs[0], True, xs[1], True)} のとき、y の変域を不等号を使って表そう。', range_answer(min(ys), True, max(ys), True, 'y'),
              f'x＝{xs[0]} のとき y＝{ys[0]}、x＝{xs[1]} のとき y＝{ys[1]}。{"a＜0 なので大小が逆になる。" if a < 0 else ""}y の変域は {range_txt(min(ys), True, max(ys), True, "y")}', 80, 'A②', '比例のグラフと変域', tb=126, tbnote='比例のグラフ')
    def t6():
        p, q = r.choice([(1, 4), (1, -3), (2, 3), (3, -2), (-1, 2), (4, 1)])
        a = F(q, p); x = rint(r, -6, 6)
        if x == 0 or (a * x).denominator != 1: return
        u.add(f'原点と点{pt(p, q)} を通る直線のグラフで、x＝{fmt_num(F(x))} のときの y の値を求めよう。', num_answer(a * x),
              f'グラフは比例のグラフなので y＝ax。点{pt(p, q)} を通るので a＝{fmt_num(a)}。x＝{fmt_num(F(x))} のとき y＝{fmt_num(a * x)}', 81, 'B+②(1)', 'グラフから式を求める', [ans_str(-a * x), ans_str(F(x) / a)], tb=128, tbnote='例1')
    plan = [t1] * 13 + [t2] * 13 + [t3] * 10 + [t4] * 12 + [t5] * 10 + [t6] * 12
    return done(fill(u, plan))

INV_FACTS = [('24 L はいる水そうに、毎分 x L ずつ水を入れるとき、いっぱいになるまでにかかる時間 y 分', True), ('2000円で x 円のケーキを3個買ったときの残金 y 円', False),
             ('面積が 20 cm² の三角形の底辺 x cm と高さ y cm', True), ('36 cm のひもを x 等分したときの1本の長さ y cm', True), ('1辺が x cm の正方形の面積 y cm²', False),
             ('800 m の道のりを分速 x m で進むときにかかる時間 y 分', True), ('200ページの本を x ページ読んだときの残りのページ数 y', False), ('面積が 6 cm² の平行四辺形の底辺 x cm と高さ y cm', True),
             ('時速 x km で2時間走ったときに進む道のり y km', False)]

# ---------------- 反比例の式（ワーク p82〜83・教科書 p131〜133） ----------------
def f5():
    u = Unit('workbook-math-1-inv1', 'workbook', '反比例の式', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp82〜83（A①36cmのひもをx等分・A②反比例するもの・A③反比例の式を求める・B①・B+②表の空欄）と教科書p131〜133（反比例・比例定数・例1・問1〜3・例題1・説明しよう・練習問題1）を写真で確認。', tb=132)
    r = rng(1241)
    def t1():
        a = rint(r, -60, 60); x = r.choice([d for d in range(-12, 13) if d and a % d == 0] or [1])
        if abs(a) < 4 or abs(x) < 2: return
        y = F(a, x)
        u.add(f'y は x に反比例し、x＝{fmt_num(F(x))} のとき y＝{fmt_num(y)} である。x と y の関係を式に表そう。', relation_answer(yinv(a)),
              f'比例定数を a とすると y＝a/x。{fmt_num(y)}＝a/({fmt_num(F(x))}) より a＝{fmt_num(y)}×({fmt_num(F(x))})＝{a}。したがって {yinv(a)}', 83, 'A③' if a > 0 else 'B①', '反比例の式を求める', [yinv(-a), yax(F(a, x * x))], tb=133, tbnote='例題1・問3')
    def t2():
        a = rint(r, -60, 60); divs = [d for d in range(-12, 13) if d and a % d == 0]
        if abs(a) < 6 or len(divs) < 4: return
        x1, x2 = r.sample(divs, 2)
        y1, y2 = F(a, x1), F(a, x2)
        u.add(f'y は x に反比例し、x＝{fmt_num(F(x1))} のとき y＝{fmt_num(y1)} である。x＝{fmt_num(F(x2))} のときの y の値を求めよう。', num_answer(y2),
              f'xy＝a（一定）より a＝{fmt_num(F(x1))}×({fmt_num(y1)})＝{a}。{yinv(a)} に x＝{fmt_num(F(x2))} を代入して y＝{fmt_num(y2)}', 83, 'B①(2)', '反比例の式を求めて値を求める', [ans_str(-y2), ans_str(y1 * x2 / x1)], tb=133, tbnote='例題1')
    def t3():
        pick = r.sample(INV_FACTS, 4)
        ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t]
        if not ok or len(ok) == 4: return
        u.add('次のア〜エのうち、y が x に反比例するものをすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(pick)), choice_answer(ok),
              'x と y の関係を式に表し、y＝a/x（xy＝a）の形になるものを選ぶ。正解：' + '、'.join(ok), 82, 'A②', '反比例の関係', tb=133, tbnote='練習問題1')
    def t4():
        a = rint(r, -48, 48); divs = [d for d in range(-12, 13) if d and a % d == 0]
        if abs(a) < 6 or len(divs) < 4: return
        xs = sorted(r.sample(divs, 4))
        hide = r.randrange(4)
        row = '　'.join(f'x＝{fmt_num(F(x))}、y＝{"□" if i == hide else fmt_num(F(a, x))}' for i, x in enumerate(xs))
        u.add(f'次の x と y の値の組は、反比例の関係を表している。□ にあてはまる数を答えよう。\n{row}', num_answer(F(a, xs[hide])),
              f'反比例では xy が一定。ほかの組から xy＝{a}。□＝{a}÷({fmt_num(F(xs[hide]))})＝{fmt_num(F(a, xs[hide]))}', 83, 'B+②', '反比例の表', [ans_str(-F(a, xs[hide]))], tb=132, tbnote='反比例の関係(イ)')
    def t5():
        L = r.choice([36, 24, 48, 60, 72]); x = r.choice([d for d in range(2, 13) if L % d == 0])
        u.add(f'{L} cm のひもを x 等分すると、1本の長さは y cm になる。x＝{x} のときの y の値を求めよう。', {'kind': 'number', 'value': str(L // x), 'units': ['cm']},
              f'y＝{L}/x（xy＝{L}）。x＝{x} のとき y＝{L}÷{x}＝{L // x}（cm）', 82, 'A①', '反比例の式', [str(L * x)], tb=132, tbnote='問1(1)')
    def t6():
        k = r.choice([2, 3, 4, 5])
        u.add(f'y は x に反比例している。x の値が {k} 倍になると、y の値は何倍になるか答えよう。', num_answer(F(1, k)), f'反比例では、x の値が2倍、3倍、…になると、y の値は 1/2 倍、1/3 倍、…になる。答え 1/{k} 倍', 82, 'A①', '反比例の関係', [str(k)], tb=132, tbnote='反比例の関係(ア)')
    def t7():
        a = rint(r, -60, 60); divs = [d for d in range(-12, 13) if d and a % d == 0]
        if abs(a) < 6 or len(divs) < 3: return
        x = r.choice(divs)
        u.add(f'反比例の関係 {yinv(a)} で、x＝{fmt_num(F(x))} のときの y の値を求めよう。', num_answer(F(a, x)), f'y＝{a}÷({fmt_num(F(x))})＝{fmt_num(F(a, x))}', 82, 'A①', '反比例の式と値', [ans_str(-F(a, x)), ans_str(F(a * x))], tb=132, tbnote='例1・問2')
    def t8():
        a = rint(r, -40, 40); x = rint(r, -9, 9)
        if abs(a) < 4 or x == 0 or a % x: return
        u.add(f'y は x に反比例し、x＝{fmt_num(F(x))} のとき y＝{fmt_num(F(a, x))} である。対応する x と y の値の積 xy を求めよう。', num_answer(a), f'反比例の関係では xy は一定で、比例定数に等しい。{fmt_num(F(x))}×({fmt_num(F(a, x))})＝{a}', 82, 'A①(4)', '反比例の関係（xy は一定）', [ans_str(-F(a)), ans_str(F(a, x * x))], tb=132, tbnote='反比例の関係(イ)')
    plan = [t1] * 13 + [t2] * 12 + [t3] * 9 + [t4] * 10 + [t5] * 6 + [t6] * 5 + [t7] * 8 + [t8] * 7
    return done(fill(u, plan))

# ---------------- 反比例のグラフ（ワーク p84〜85・教科書 p134〜138） ----------------
def f6():
    u = Unit('workbook-math-1-invgraph', 'workbook', '反比例のグラフ', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp84〜85（A①②表とグラフ・A③グラフをかく・B①グラフの特徴・B+②点Aの座標と式）と教科書p134〜138（反比例のグラフ・双曲線・問1〜3・話しあおう・説明しよう・練習問題1・2）を写真で確認。グラフをかく問題は、通る点や式を答える入力問題にした。', tb=136)
    r = rng(1251)
    def t1():
        a = r.choice([4, 6, 8, 12, 16, -6, -8, -12, -16, 18, 20, -24])
        n = 2 * sum(1 for d in range(1, abs(a) + 1) if a % d == 0)
        u.add(f'反比例の関係 {yinv(a)} のグラフ上の点のうち、x 座標と y 座標がともに整数である点は全部で何個あるか答えよう。', {'kind': 'number', 'value': str(n), 'units': ['個']},
              f'x が {abs(a)} の約数（正と負）のとき、y も整数になる。{abs(a)} の約数は {sum(1 for d in range(1, abs(a) + 1) if a % d == 0)} 個で、正と負があるので {n} 個。', 85, 'B+②', '反比例のグラフ上の点', [str(n // 2), str(n - 1)], tb=136, tbnote='双曲線・説明しよう')
    def t2():
        p = r.choice([1, 2, 3, 4]); q = r.choice([1, 2, 3, 4, 6]) * r.choice([1, -1]); a = p * q
        x = r.choice([d for d in range(-12, 13) if d and a % d == 0 and d != p])
        u.add(f'反比例のグラフが点{pt(p, q)} を通る。このグラフ上で、x 座標が {fmt_num(F(x))} である点の y 座標を求めよう。', num_answer(F(a, x)),
              f'xy＝a より a＝{p}×({fmt_num(F(q))})＝{a}。{yinv(a)} に x＝{fmt_num(F(x))} を代入して y＝{fmt_num(F(a, x))}', 87, '⑥(1)', '反比例のグラフ', [ans_str(-F(a, x))], tb=136, tbnote='反比例のグラフ')
    def t3():
        facts = [('原点(0, 0)を通る直線である', False), ('x 軸、y 軸と交わらない', True), ('比例定数が正のとき、x＞0 の範囲で x の値を大きくしていくと、y の値は0に近づく', True),
                 ('なめらかな1つの曲線である', False), ('2つの曲線からなる双曲線である', True), ('x＝0 のときの y の値は0である', False)]
        pick = r.sample(facts, 4); ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t]
        if not ok or len(ok) == 4: return
        u.add('次のア〜エのうち、反比例のグラフについていえるものをすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(pick)), choice_answer(ok),
              '反比例 y＝a/x のグラフは、座標軸とは交わらない2つのなめらかな曲線（双曲線）。x＝0 のときの y の値はない。正解：' + '、'.join(ok), 85, 'B①', '反比例のグラフの特徴', tb=137, tbnote='反比例のグラフ・双曲線')
    def t4():
        a = r.choice([6, 8, 12, -6, -8, -12, 10, -10]); s = r.choice(['x＞0', 'x＜0'])
        pos = (a > 0) == (s == 'x＞0')
        u.add(f'反比例の関係 {yinv(a)} で、{s} のとき、y の値は正の数か負の数か。「ア 正の数」「イ 負の数」から選び、記号で答えよう。', choice_answer(['ア' if pos else 'イ']),
              f'y＝{a}÷x。{"a と x が同符号なので y は正" if pos else "a と x が異符号なので y は負"}。正解：{"ア" if pos else "イ"}', 84, 'A②', '反比例のグラフの位置', tb=137, tbnote='反比例のグラフ')
    def t5():
        a = r.choice([F(6), F(8), F(12), F(-6), F(-8), F(-12), F(10), F(-16)]); x = r.choice([d for d in range(-8, 9) if d and a.numerator % d == 0])
        u.add(f'反比例の関係 {yinv(a)} のグラフは、点({fmt_num(F(x))}, □) を通る。□ にあてはまる数を答えよう。', num_answer(a / x), f'x＝{fmt_num(F(x))} を代入して y＝{fmt_num(a)}÷({fmt_num(F(x))})＝{fmt_num(a / x)}', 84, 'A①', '反比例のグラフが通る点', [ans_str(-a / x)], tb=135, tbnote='例1・問2')
    def t6():
        p, q = rint(r, -4, 4), rint(r, -6, 6)
        if p == 0 or q == 0: return
        a = p * q
        u.add(f'反比例のグラフが点{pt(p, q)} を通る。このグラフについて、x と y の関係を式に表そう。', relation_answer(yinv(a)),
              f'y＝a/x に代入すると a＝xy＝{p}×({fmt_num(F(q))})＝{a}。したがって {yinv(a)}', 85, 'B+②(2)', 'グラフから反比例の式を求める', [yinv(-a), yax(F(q, p))], tb=136, tbnote='反比例のグラフ')
    def t7():
        a = r.choice([6, 12, 24, 60]); big = r.choice([10, 100, 1000])
        u.add(f'反比例の関係 {yinv(a)} で、x＝{big} のときの y の値を求めよう（x の値を大きくしていくと y の値は0に近づく）。', num_answer(F(a, big)), f'y＝{a}÷{big}＝{fmt_num(F(a, big))}。x の値が大きくなるほど y の値は0に近づくが、0にはならない。', 84, 'A①', '反比例のグラフ（x が大きくなるとき）', [ans_str(F(a * big))], tb=135, tbnote='問1')
    plan = [t1] * 12 + [t2] * 12 + [t3] * 9 + [t4] * 8 + [t5] * 10 + [t6] * 12 + [t7] * 7
    return done(fill(u, plan))

# ---------------- ふりかえりドリル（ワーク p86〜87：入試問題をふくむ） ----------------
def f7():
    u = Unit('workbook-math-1-funcreview', 'workbook', 'ふりかえりドリル', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp86〜87（①比例・反比例の関係（岩手）・②比例の式を求める（北海道）・③比例のグラフ（福島）・④反比例の関係（栃木）・⑤反比例の式を求める（高知）・⑥反比例のグラフ（岩手））を写真で確認し、教科書p120〜138と照らして作り直した。')
    r = rng(1261)
    def t1():
        facts = [('1辺の長さが x cm の正方形の面積は y cm² である', 'なし'), ('高速道路を時速 90 km で走っている自動車は、x 時間で y km 進む', '比例'),
                 ('200ページの本を x ページまで読んだとき、残りのページ数は y ページである', 'なし'), ('20 L はいる容器に毎分 x L ずつ水を入れるとき、いっぱいになるまでに y 分間かかる', '反比例'),
                 ('1個 80 円のパンを x 個買ったときの代金は y 円である', '比例'), ('面積が 30 cm² の長方形の縦 x cm と横 y cm', '反比例')]
        pick = r.sample(facts, 4); want = r.choice(['比例', '反比例'])
        ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t == want]
        if not ok or len(ok) == 4: return
        u.add(f'次のア〜エのうち、y が x に{want}するものをすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(pick)), choice_answer(ok),
              '式に表すと、比例は y＝ax、反比例は y＝a/x の形になる。正解：' + '、'.join(ok), 86, '①', '比例・反比例の関係', tb=122, tbnote='練習問題1')
    def t2():
        a = r.choice([F(rint(r, -6, 6)), rfrac(r, (2, 3, 4), 1, 7)]); x1, x2 = rint(r, -24, 24), rint(r, -40, 40)
        if a == 0 or (a * x1).denominator != 1 or (a * x2).denominator != 1 or x1 == 0: return
        u.add(f'y は x に比例し、x＝{fmt_num(F(x1))} のとき y＝{fmt_num(a * x1)} である。x＝{fmt_num(F(x2))} のときの y の値を求めよう。', num_answer(a * x2),
              f'y＝ax に代入して a＝{fmt_num(a)}。x＝{fmt_num(F(x2))} のとき y＝{fmt_num(a * x2)}', 86, '②', '比例の式を求める', [ans_str(-a * x2)], tb=122, tbnote='例題1')
    def t3():
        a = rint(r, -4, 4)
        if abs(a) < 2: return
        cands = [(x, a * x + (0 if i % 2 == 0 else r.choice([1, -1]))) for i, x in enumerate(r.sample(range(-4, 5), 4))]
        ok = [LETTERS[i] for i, (x, y) in enumerate(cands) if y == a * x]
        if not ok or len(ok) == 4: return
        u.add(f'次のア〜エの点のうち、関数 {yax(a)} のグラフ上にある点をすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} 点{pt(x, y)}' for i, (x, y) in enumerate(cands)), choice_answer(ok),
              '各点の x 座標を代入して、y 座標と一致するか調べる。正解：' + '、'.join(ok), 86, '③(1)', '比例のグラフ', tb=128, tbnote='例1')
    def t4():
        a = r.choice([12, -12, 24, -24, 18, 36]); xs = [d for d in (-1, 1, 2, 3, 4, 6) if a % d == 0][:5]
        row = '　'.join(f'x＝{fmt_num(F(x))}、y＝{fmt_num(F(a, x))}' for x in xs)
        u.add(f'下の x と y の値の組は、y が x に反比例する関係を表している。x と y の関係を式に表そう。\n{row}', relation_answer(yinv(a)),
              f'xy の値が一定で {a}。{yinv(a)}', 87, '④', '反比例の関係', [yinv(-a)], tb=133, tbnote='例題1')
    def t5():
        p, q = rint(r, -15, 15), rint(r, -9, 9)
        if p == 0 or q == 0: return
        a = p * q; x = r.choice([d for d in range(-15, 16) if d and a % d == 0 and d != p] or [p])
        if r.random() < .5:
            u.add(f'y は x に反比例し、x＝{fmt_num(F(p))} のとき y＝{fmt_num(F(q))} である。x＝{fmt_num(F(x))} のとき、y の値を求めよう。', num_answer(F(a, x)), f'a＝xy＝{a}。y＝{a}÷({fmt_num(F(x))})＝{fmt_num(F(a, x))}', 87, '⑤', '反比例の式を求める', [ans_str(-F(a, x))], tb=133, tbnote='例題1')
        else:
            u.add(f'y は x に反比例し、x＝{fmt_num(F(p))} のとき y＝{fmt_num(F(q))} である。x と y の関係を式に表そう。', relation_answer(yinv(a)), f'a＝xy＝{fmt_num(F(p))}×({fmt_num(F(q))})＝{a}。{yinv(a)}', 87, '⑤(3)', '反比例の式を求める', [yinv(-a)], tb=133, tbnote='例題1')
    def t6():
        p, q = r.choice([(2, 2), (1, 4), (2, 3), (3, 2), (4, 2)]); a = p * q
        x = r.choice([d for d in (1, 2, 3, 4, 6, 8, 12, 16) if a % d == 0 and d != p])
        u.add(f'反比例のグラフが点{pt(p, q)} を通る。このグラフ上で、x 座標が {x} である点Aの y 座標を求めよう。', num_answer(F(a, x)), f'a＝{p}×{q}＝{a}。y＝{a}÷{x}＝{fmt_num(F(a, x))}', 87, '⑥(1)', '反比例のグラフ', [ans_str(F(x * a, p * p))], tb=136, tbnote='反比例のグラフ')
    plan = [t1] * 10 + [t2] * 12 + [t3] * 10 + [t4] * 10 + [t5] * 16 + [t6] * 12
    return done(fill(u, plan))

# ---------------- 比例、反比例の利用（ワーク p88〜89・教科書 p139〜143） ----------------
def f8():
    u = Unit('workbook-math-1-funcuse', 'workbook', '比例、反比例の利用', '変化と対応',
             '2026-10-05 Claude作成。数学ワークp88〜89（A①はかり売りのチョコレート・A②マラソンコースと変域・A③ひもの等分・B①画用紙の束・B+②電子レンジ）と教科書p139〜143（リサイクル・比例の利用（ランニング）・反比例の利用（電子レンジ）・問1〜3・説明しよう）を写真で確認。', tb=140)
    r = rng(1271)
    def t1():
        g, p = r.choice([(100, 500), (100, 300), (100, 400), (50, 150)]); a = F(p, g)
        k = r.randrange(2)
        if k == 0:
            w = r.choice([160, 180, 250, 120, 350])
            u.add(f'{g} g の値段が {p} 円のはかり売りのチョコレートがある。このチョコレートを {w} g 買うときの代金を求めよう。', {'kind': 'number', 'value': num_answer(a * w, True)['value'], 'units': ['円']},
                  f'代金は重さに比例する。x g の代金を y 円とすると {yax(a).replace("=", "＝")}。x＝{w} のとき y＝{fmt_num(a * w)}（円）', 88, 'A①(2)', '比例の利用', [str(p * w)], tb=140, tbnote='比例の利用')
        else:
            m = r.choice([1200, 900, 1500, 600])
            u.add(f'{g} g の値段が {p} 円のはかり売りのチョコレートがある。{m} 円分のチョコレートを買うとき、何 g 買うことができるか求めよう。', {'kind': 'number', 'value': ans_str(F(m) / a), 'units': ['g']},
                  f'{yax(a).replace("=", "＝")} に y＝{m} を代入して x＝{m}÷{fmt_num(a)}＝{fmt_num(F(m) / a)}（g）', 88, 'A①(3)', '比例の利用', [ans_str(a * m)], tb=140, tbnote='比例の利用')
    def t2():
        D, v = r.choice([(3000, 250), (3000, 200), (2400, 200), (3000, 300)])
        if r.random() < .5 or v == 200:
            u.add(f'{D} m のマラソンコースを、Bさんは分速 {v} m で1周した。スタートしてからの時間を x 分、走った道のりを y m とする。x の変域を、不等号を使って表そう。', range_answer(0, True, F(D, v), True),
                  f'1周にかかる時間は {D}÷{v}＝{fmt_num(F(D, v))}（分）。x の変域は 0≦x≦{fmt_num(F(D, v))}（式は y＝{v}x）', 88, 'A②(2)', '変域のあるグラフ', tb=141, tbnote='問1(2)')
        else:
            t = r.randint(3, int(D // v) - 1)
            u.add(f'Aさんは分速 200 m、Bさんは分速 {v} m で、同時にスタートして {D} m のコースを走った。スタートしてから {t} 分間で、2人が走った道のりの差は何 m か求めよう。', {'kind': 'number', 'value': str(abs(v - 200) * t), 'units': ['m']},
                  f'Aさんは y＝200x、Bさんは y＝{v}x。{t} 分間では 200×{t}＝{200 * t}（m）と {v}×{t}＝{v * t}（m）。差は {abs(v - 200) * t} m', 88, 'A②', '比例の利用（2人の道のり）', [str(v * t)], tb=141, tbnote='問1(4)')
    def t3():
        L = r.choice([300, 240, 360, 480]); k = r.randrange(2)
        if k == 0:
            n = r.choice([d for d in range(10, 41) if L % d == 0])
            u.add(f'{L} cm のひもを x 人の生徒で等分すると、1人あたり y cm になる。{n} 人で分けるとき、1人あたりのひもの長さを求めよう。', {'kind': 'number', 'value': str(L // n), 'units': ['cm']}, f'y＝{L}/x。x＝{n} のとき y＝{L}÷{n}＝{L // n}（cm）', 89, 'A③(2)', '反比例の利用', [str(L * n)], tb=142, tbnote='反比例の利用')
        else:
            c = r.choice([d for d in range(8, 31) if L % d == 0])
            u.add(f'{L} cm のひもを x 人の生徒で等分すると、1人あたり y cm になる。1人あたりのひもの長さを {c} cm にすると、何人に分けることができるか求めよう。', {'kind': 'number', 'value': str(L // c), 'units': ['人']}, f'y＝{L}/x に y＝{c} を代入して x＝{L}÷{c}＝{L // c}（人）', 89, 'A③(3)', '反比例の利用', [str(L * c)], tb=142, tbnote='反比例の利用')
    def t4():
        w100 = r.choice([250, 200, 400]); tot = w100 * r.choice([3, F(17, 5), 4, F(5, 2)]); th = r.choice([30, 20, 25])
        n = F(tot * 100, w100); thick = th * n / 100
        if n.denominator != 1 or thick.denominator not in (1, 2, 10): return
        if r.random() < .5:
            u.add(f'束になった画用紙の重さをはかったら {fmt_num(F(tot))} g だった。同じ画用紙 100 枚の重さは {w100} g である。束になった画用紙は何枚あるか求めよう。', {'kind': 'number', 'value': str(n), 'units': ['枚']},
                  f'画用紙の枚数は重さに比例する。x g の枚数を y 枚とすると {yax(F(100, w100)).replace("=", "＝")}。x＝{fmt_num(F(tot))} のとき y＝{n}（枚）', 89, 'B①(1)', '比例の利用', [str(F(tot * w100, 100))], tb=140, tbnote='比例の利用')
        else:
            u.add(f'画用紙100枚の重さは {w100} g、厚さは {th} mm である。重さが {fmt_num(F(tot))} g の束になった同じ画用紙の厚さを求めよう。', {'kind': 'number', 'value': num_answer(thick, True)['value'], 'units': ['mm']},
                  f'まず枚数を求める。{fmt_num(F(tot))}÷{w100}×100＝{n}（枚）。厚さは枚数に比例するので {th}×{n}÷100＝{fmt_num(thick, "dec")}（mm）', 89, 'B①(2)', '比例の利用', [ans_str(F(tot * th, 100))], tb=140, tbnote='比例の利用')
    def t5():
        w1, s1 = r.choice([(500, 120), (500, 300), (600, 150), (1000, 90)]); w2 = r.choice([600, 1000, 1500, 500, 800])
        if w1 == w2: return
        s2 = F(w1 * s1, w2)
        if s2.denominator != 1: return
        u.add(f'食品が温まるまでの時間は、電子レンジの出力に反比例する。ある食品は {w1} W で温めると {s1} 秒かかる。この食品を {w2} W で温めると、何秒かかるか求めよう。', {'kind': 'number', 'value': str(s2), 'units': ['秒']},
              f'出力を x W、時間を y 秒とすると xy＝{w1}×{s1}＝{w1 * s1}。y＝{w1 * s1}÷{w2}＝{s2}（秒）', 89, 'B+②', '反比例の利用', [str(F(w2 * s1, w1))], tb=142, tbnote='反比例の利用・問2・問3')
    def t6():
        kg, n = r.choice([(1800, 9000), (3600, 18000), (5400, 27000)]); q = r.choice([2800, 4800, 1200, 3000])
        u.add(f'紙パック {kg} kg から、トイレットペーパーが {n} 個できる。トイレットペーパーの個数は紙パックの重さに比例するとして、紙パック {q} kg から何個のトイレットペーパーができるか求めよう。', {'kind': 'number', 'value': str(q * n // kg), 'units': ['個']},
              f'x kg から y 個できるとすると y＝{n // kg}x。x＝{q} のとき y＝{q * n // kg}（個）', 88, 'A①', '比例の利用', [str(q * kg // n)], tb=141, tbnote='ステップ2')
    def t7():
        v1, t1_ = r.choice([(60, 10), (80, 15), (50, 12), (70, 20)]); v2 = r.choice([50, 40, 60, 100, 120])
        D = v1 * t1_; t2 = F(D, v2)
        if v1 == v2 or t2.denominator != 1: return
        u.add(f'家から駅まで、分速 {v1} m で歩くと {t1_} 分かかる。同じ道のりを分速 {v2} m で歩くとき、かかる時間を求めよう。', {'kind': 'number', 'value': str(t2), 'units': ['分']},
              f'道のりは {v1}×{t1_}＝{D}（m）。速さを x、時間を y とすると xy＝{D} で、反比例の関係。y＝{D}÷{v2}＝{t2}（分）', 89, 'A③', '反比例の利用', [str(F(v2 * t1_, v1))], tb=142, tbnote='反比例の利用')
    def t8():
        y, x = r.choice([(25, 4), (20, 5), (30, 6), (40, 3)]); g = r.choice([10, 20, 50])
        d = F(y * x, g)
        if d.denominator not in (1, 2, 5): return
        u.add(f'モビールで、支点の左に x g のかざりを、支点から y cm の所につるし、右には {y} g のかざりを支点から {x} cm の所につるすと、左右がつりあう（x×y が一定）。左のかざりを {g} g にするとき、支点からの距離は何 cm にすればよいか求めよう。', {'kind': 'number', 'value': num_answer(d, True)['value'], 'units': ['cm']},
              f'xy＝{y}×{x}＝{y * x}。x＝{g} のとき y＝{y * x}÷{g}＝{fmt_num(d, "dec")}（cm）', 89, 'A③', '反比例の利用（モビール）', [ans_str(F(g * x, y))], tb=143, tbnote='数学ライブラリー')
    plan = [t1] * 10 + [t2] * 9 + [t3] * 9 + [t4] * 9 + [t5] * 10 + [t6] * 8 + [t7] * 8 + [t8] * 7
    return done(fill(u, plan))
