"""2章 文字式①：数量を文字で表すこと／文字式の表し方①・文字式の表し方②・式の値（ワーク p32〜37・教科書 p59〜68 を写真で確認して作成）"""
from common import *
from bank import expr_answer
import alg
from alg import P as Poly, var, show as sh

X, Y, A, B, Hh = var('x'), var('y'), var('a'), var('b'), var('h')
def pick(r, xs): return r.choice(xs)

def subst(p, env):
    """代入の途中式：9x+8 ＝ 9×(−5/3)+8 ＝ −15+8 ＝ −7"""
    def wrap(v):
        v = F(v); t = fmt_num(v)
        return '(' + t + ')' if v < 0 or v.denominator != 1 else t
    s1 = []; vals = []
    for i, (k, c) in enumerate(p.terms()):
        fs = []
        for ch in sorted(set(k)):
            n = k.count(ch); fs.append(wrap(env[ch]) + (str(n).translate(alg.SUP) if n > 1 else ''))
        a = abs(c)
        cs = '' if a == 1 and fs else (str(a.numerator) if a.denominator == 1 else f'{a.numerator}/{a.denominator}')
        if fs and a.denominator != 1:  # 分数の係数はかっこでくくる：(−5/3)×6
            s1.append(('' if i == 0 else ' + ') + '(' + ('−' if c < 0 else '') + cs + ')×' + '×'.join(fs))
        else:
            if i == 0 and c < 0 and cs and fs:  # 先頭の負の係数はかっこ：(−5)×3（教科書 p68 例6）
                s1.append('(−' + cs + ')×' + '×'.join(fs)); 
            else:
                body = '×'.join(([cs] if cs else []) + fs) if fs else cs
                s1.append((('−' if c < 0 else '') if i == 0 else (' − ' if c < 0 else ' + ')) + body)
        x = c
        for ch in k: x *= F(env[ch])
        vals.append(x)
    s2 = ''.join(((fmt_num(v) if i == 0 else (' − ' + fmt_num(-v) if v < 0 else ' + ' + fmt_num(v)))) for i, v in enumerate(vals))
    v = p.val(**env)
    steps = [sh(p), ''.join(s1)] + ([s2] if len(vals) > 1 else []) + [fmt_num(v)]
    out = []
    for t in steps:
        if not out or out[-1] != t: out.append(t)
    return ' ＝ '.join(out)

# ---------------- 数量を文字で表すこと／文字式の表し方①（ワーク p32〜33・教科書 p59〜63） ----------------
def m1():
    u = Unit('workbook-math-1-moji1', 'workbook', '数量を文字で表すこと／文字式の表し方①', '文字式',
             '2026-10-05 Claude作成。数学ワークp32〜33（A①数量を表す文字式・A②積の表し方・A③記号×を使う・A④商の表し方・A⑤記号÷を使う・B①・B+②平均点とひし形の面積）と教科書p59〜63（例1・問1〜3、文字式の表し方①〜④、例1〜3・問1〜6）を写真で確認。', tb=61)
    r = rng(1011)
    def t1():  # 数量を文字式で
        k = r.randrange(9)
        if k == 0:
            p = r.choice([80, 90, 120, 130, 150]); q = r.choice([100, 110, 140, 160])
            txt, e, un, nr, tb = f'1個 a 円のりんごを x 個と、1本 {q} 円のジュースを y 本買ったときの代金', A * X + q * Y, ['円'], [], 61
        elif k == 1:
            txt, e, un, nr, tb = '長さ a cm のひもから、長さ b cm のひもを x 本切り取ったときの残りの長さ', A - B * X, ['cm'], [alg.ans(A + B * X)], 61
        elif k == 2:
            txt, e, un, nr, tb = '底辺が a cm、高さが h cm の三角形の面積', A * Hh / 2, ['cm²', 'cm2'], [alg.ans(A * Hh)], 61
        elif k == 3:
            n = r.randint(6, 15); w = r.choice([100, 150, 200, 250])
            txt, e, un, nr, tb = f'1枚 x g のクッキー {n} 枚を、{w} g のかごにつめてもらったときの全体の重さ', n * X + w, ['g'], [alg.ans(n * X)], 61
        elif k == 4:
            txt, e, un, nr, tb = '縦が a cm、横が b cm の長方形の周の長さ', 2 * A + 2 * B, ['cm'], [alg.ans(A + B), alg.ans(A * B)], 62
        elif k == 5:
            p, q = r.sample([2, 3, 4, 5, 6], 2)
            txt, e, un, nr, tb = f'{p}人部屋 a 室と {q}人部屋 b 室をすべて使って宿泊できる人数', p * A + q * B, ['人'], [], 61
        elif k == 6:
            p, q = r.choice([(100, 10), (500, 50), (100, 5), (50, 10)])
            txt, e, un, nr, tb = f'{p}円硬貨 x 枚と {q}円硬貨 y 枚をあわせた金額', p * X + q * Y, ['円'], [], 61
        elif k == 7:
            txt, e, un, nr, tb = '画用紙を横に1列に、となりと少し重ねてはる。重なった所は1つのマグネットでとめるので、画用紙が1枚のとき4個、2枚のとき6個、3枚のとき8個のマグネットが必要になる。画用紙が a 枚のときに必要なマグネットの個数', 2 * A + 2, ['個'], [alg.ans(4 * A), alg.ans(2 * A)], 60
        else:
            n = r.randint(3, 9)
            txt, e, un, nr, tb = f'1辺が a cm の正方形を {n} 個すきまなく横に並べてできる長方形の面積', n * A * A, ['cm²', 'cm2'], [alg.ans(n * A)], 62
        u.add(f'次の数量を表す文字式を、文字式の表し方にしたがって書こう。\n{txt}', expr_answer(alg.ans(e), units=un), f'ことばの式に文字をあてはめ、× を省いて書く。答え {sh(e)}（{un[0]}）', 32, 'A①', '数量を文字で表す', nr, tb=tb, tbnote='例1・問2・問3' if tb == 61 else ('ひろげよう' if tb == 62 else '問1'))
    def t2():  # 積の表し方
        letters = r.choice(['ab', 'abb', 'xy', 'xyy', 'aab', 'abc', 'xxy', 'bca', 'yx'])
        c = r.choice([F(1), F(-1), F(3), F(-2), F(5), F(-4), F(1, 10), F(-3, 10)])
        fs = [ch for ch in letters]; num_str = None
        if c != 1: num_str = '(−1)' if c == -1 else ('(' + fmt_num(c, 'dec') + ')' if c < 0 else fmt_num(c, 'dec'))
        items = fs + ([num_str] if num_str else [])
        r.shuffle(items)
        p = Poly({tuple(letters): c})
        u.add(f'次の式を、文字式の表し方にしたがって書こう。\n{" × ".join(items)}', expr_answer(alg.ans(p) if c.denominator == 1 else alg.ans(p), order=True),
              f'① × を省く ② 数を文字の前に書く ③ 同じ文字の積は指数で書く ④ 文字はふつうアルファベット順。1 は書かず、−1 は − だけ書く。答え {sh(p)}', 32, 'A②', '積の表し方', [alg.ans(-p)], tb=62, tbnote='文字式の表し方①〜③・例1・問1')
    def t3():  # ÷ を分数の形に
        k = r.randrange(4)
        if k == 0: n = r.randint(2, 9); s, val, nr = f'a ÷ {n}', f'a/{n}', [f'{n}/a']
        elif k == 1: n = r.randint(2, 9); s, val, nr = f'{n} ÷ x', f'{n}/x', [f'x/{n}']
        elif k == 2: n = r.randint(2, 9); s, val, nr = f'(x + y) ÷ {n}', f'(x+y)/{n}', []
        else: n = r.randint(2, 9); s, val, nr = f'(a − b) ÷ (−{n})', f'−(a−b)/{n}', [f'(a−b)/{n}']
        u.add(f'次の式を、記号 ÷ を使わないで表そう。\n{s}', expr_answer(val, form='nosign'), f'わり算は、記号 ÷ を使わないで分数の形で書く（わる数が分母）。答え {val}', 33, 'A④', '商の表し方', nr, tb=63, tbnote='文字式の表し方④・例2・問3')
    def t4():  # × ÷ がまざった式
        a1, b1, c1 = r.randint(2, 9), r.randint(2, 9), r.randint(10, 90)
        k = r.randrange(4)
        if k == 0: s, val = f'x ÷ {a1} − y × {b1}', f'x/{a1}−{b1}y'
        elif k == 1: s, val = f'(a + b) × {a1} + c ÷ {b1}', f'{a1}(a+b)+c/{b1}'
        elif k == 2: s, val = f'{c1} × n + {a1 * 10}', f'{c1}n+{a1 * 10}'
        else: s, val = f'a × {a1} − b ÷ {b1} × c', f'{a1}a−bc/{b1}'
        u.add(f'次の式を、記号 ×、÷ を使わないで表そう。\n{s}', expr_answer(val, form='nosign', order=True), f'× は省き、÷ は分数の形にする。＋ と − の記号は省略できない。答え {val}', 33, 'B①', '記号×、÷を使わない表し方', tb=63, tbnote='例3・問5')
    def t5():  # × ÷ を使って表す（逆）
        k = r.randrange(5)
        if k == 0:
            n = r.randint(2, 9); fs = [str(n), 'a', 'b']; s = f'{n}ab'
        elif k == 1:
            n = r.randint(2, 9); fs = [str(n), 'x', 'x', 'y']; s = f'{n}x²y'
        elif k == 2:
            n = r.randint(2, 9); fs = None; s = f'a/{n}'; acc = [f'a÷{n}']
        elif k == 3:
            n = r.randint(2, 9); fs = None; s = f'(a+b)/{n}'; acc = [f'(a+b)÷{n}']
        else:
            n, m = r.randint(2, 9), r.randint(2, 9); fs = None; s = f'x/{n}−{m}(x+y)'; acc = [f'x÷{n}−{m}×(x+y)', f'x÷{n}−(x+y)×{m}']
        if fs:
            acc = sorted({'×'.join(p) for p in itertools.permutations(fs)}, key=lambda t: (not t[0].isdigit(), t))
        u.add(f'次の式を、記号 ×、÷ を使って表そう。\n{s}', exact_answer(acc, compact=True), f'省いてある × を書き、分数の形は ÷ にもどす。例えば {acc[0]}。', 32 if k < 2 else 33, 'A③' if k < 2 else ('A⑤' if k < 4 else 'B①(2)'), '記号×、÷を使って表す', tb=62 if k < 2 else 63, tbnote='問2' if k < 2 else '問4・問6')
    def t6():  # 平均・面積（B+②）
        k = r.randrange(4)
        if k == 0:
            s = r.choice([40, 50, 60, 70]); txt, e, un = f'3回のテストで、1回目が a 点、2回目が b 点、3回目が {s} 点のときの3回の平均点', f'(a+b+{s})/3', ['点']
            nr = [f'a+b+{s}/3']
        elif k == 1: txt, e, un, nr = '対角線の長さが a cm と b cm のひし形の面積', 'ab/2', ['cm²', 'cm2'], ['ab']
        elif k == 2: txt, e, un, nr = '上底が a cm、下底が b cm、高さが h cm の台形の面積', '(a+b)h/2', ['cm²', 'cm2'], ['(a+b)h']
        else:
            n = r.choice([4, 5, 6]); txt, e, un, nr = f'{n} 人の身長の合計が x cm のときの平均の身長', f'x/{n}', ['cm'], [f'{n}x']
        u.add(f'次の数量を表す文字式を、記号 ×、÷ を使わないで書こう。\n{txt}', expr_answer(e, form='nosign', units=un), f'（平均）＝（合計）÷（個数）、ひし形の面積＝（対角線）×（対角線）÷2、台形の面積＝（上底＋下底）×（高さ）÷2。答え {e}（{un[0]}）', 33, 'B+②', '数量を文字式で表す', nr, tb=63, tbnote='文字式の表し方')
    def t7():  # 正しく書かれているもの
        good = ['ab²', '−y', '3(x+1)', 'x/4', '−2ab', '5a−3', 'a/b', '0.1x']
        bad = ['a×3', '1x', 'x÷2', 'ba', 'a3', '−1y', 'aaa', '(a+b)×2']
        g = r.sample(good, r.randint(1, 3)); b_ = r.sample(bad, 5 - len(g))
        opts = g + b_; r.shuffle(opts)
        ok = [LETTERS[i] for i, o in enumerate(opts) if o in good]
        u.add('次のア〜オのうち、文字式の表し方にしたがって正しく書かれているものをすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer(ok),
              '× は省く、数は文字の前、同じ文字の積は指数、÷ は分数の形、1 は書かない、文字はふつうアルファベット順。正解：' + '、'.join(ok), 32, 'A②', '文字式の表し方', tb=62, tbnote='文字式の表し方')
    plan = [t1] * 14 + [t2] * 12 + [t3] * 8 + [t4] * 8 + [t5] * 10 + [t6] * 8 + [t7] * 10
    return fill(u, plan)

# ---------------- 文字式の表し方②（ワーク p34〜35・教科書 p64〜65：代金とおつり・速さ・割合・式の意味） ----------------
def m2():
    u = Unit('workbook-math-1-moji2', 'workbook', '文字式の表し方②', '文字式',
             '2026-10-05 Claude作成。数学ワークp34〜35（A①代金とおつり・A②速さ・時間・道のり・A③割合・B①25%増し・B②式が表すもの・B+③割合の割合）と教科書p64〜65（例4〜7・問7〜11）を写真で確認。', tb=64)
    r = rng(1021)
    def t1():  # 代金とおつり
        k = r.randrange(4)
        if k == 0:
            n = r.randint(3, 9); m = r.choice([1000, 2000, 5000])
            txt, e, nr = f'{m} 円を出して、1個 x 円のプリンを {n} 個買ったときのおつり', f'{m}−{n}x', [f'{n}x−{m}']
        elif k == 1:
            n = r.randint(3, 6); p = r.choice([500, 800, 1200])
            txt, e, nr = f'{n} 人が a 円ずつ出して、{p} 円の品物を買ったときの残金', f'{n}a−{p}', [f'{p}−{n}a']
        elif k == 2:
            p, q = r.randint(2, 4), r.randint(2, 5)
            txt, e, nr = f'1冊 x 円の小説 {p} 冊と、1冊 y 円のまんが {q} 冊を買ったときの代金', f'{p}x+{q}y', []
        else:
            p, q, m = r.randint(2, 5), r.randint(2, 5), r.choice([1000, 2000])
            txt, e, nr = f'{m} 円を出して、1本 a 円のペン {p} 本と、1冊 b 円のノート {q} 冊を買ったときのおつり', f'{m}−{p}a−{q}b', [f'{m}−{p}a+{q}b']
        u.add(f'次の数量を表す式を書こう。\n{txt}', expr_answer(e, units=['円']), f'（おつり）＝（出したお金）−（代金）、（代金）＝（1個の値段）×（個数）。答え {e}（円）', 34, 'A①', '代金とおつり', nr, tb=64, tbnote='例4・問7')
    def t2():  # 速さ・時間・道のり
        k = r.randrange(6)
        if k == 0: h = r.randint(2, 6); txt, e, un, nr = f'道のり a km の登山コースを {h} 時間かかって登ったときの速さ', f'a/{h}', ['km/h', '(km/h)'], [f'{h}a']
        elif k == 1: v = r.randint(2, 6); txt, e, un, nr = f'時速 {v} km で x 時間歩いたときの道のり', f'{v}x', ['km'], [f'x/{v}']
        elif k == 2: v = r.randint(2, 6); txt, e, un, nr = f'y km の道のりを時速 {v} km で歩いたときにかかった時間', f'y/{v}', ['時間'], [f'{v}y']
        elif k == 3: m = r.choice([20, 30, 40, 15]); txt, e, un, nr = f'時速 x km で {m} 分間走ったときの道のり', f'{F(m, 60).numerator}x/{F(m, 60).denominator}' if F(m, 60).numerator != 1 else f'x/{F(m, 60).denominator}', ['km'], [f'{m}x']
        elif k == 4: txt, e, un, nr = '分速 a m で x 分歩いたときの道のり（km で表す）', 'ax/1000', ['km'], ['ax']
        else: v = r.randint(3, 6); txt, e, un, nr = f'a km の道のりを時速 {v} km で歩いたときにかかる時間（分で表す）', f'{F(60, v)}a' if F(60, v).denominator == 1 else f'{F(60, v).numerator}a/{F(60, v).denominator}', ['分'], [f'a/{v}']
        u.add(f'次の数量を表す式を書こう。\n{txt}', expr_answer(e, units=un), f'（速さ）＝（道のり）÷（時間）、（時間）＝（道のり）÷（速さ）、（道のり）＝（速さ）×（時間）。時間の単位をそろえる（30分＝1/2時間、1km＝1000m）。答え {e}', 34, 'A②', '速さ・時間・道のり', nr, tb=64, tbnote='例5・問8')
    def t3():  # 割合
        k = r.randrange(5)
        if k == 0: p = r.randint(11, 97); txt, e, un = f'a kg のねん土の {p}% の重さ', f'{p}a/100' if math.gcd(p, 100) == 1 else alg.ans(A * F(p, 100)), ['kg']
        elif k == 1: p = r.randint(1, 9); txt, e, un = f'A市の人口 x 人の {p} 割の人数', alg.ans(X * F(p, 10)), ['人']
        elif k == 2: p = r.randint(1, 5); txt, e, un = f'b 円の品物を、{p} 割引きで買ったときの代金', alg.ans(B * F(10 - p, 10)), ['円']
        elif k == 3: p = r.randint(5, 40); txt, e, un = f'ある食品の塩分量 y g を、{p}% 減らしたときの塩分量', alg.ans(Y * F(100 - p, 100)), ['g']
        else: p = r.randint(5, 50); txt, e, un = f'x g の小麦粉の {p}% の重さ', alg.ans(X * F(p, 100)), ['g']
        u.add(f'次の数量を表す式を書こう。\n{txt}', expr_answer(e, units=un), f'1% は 1/100、1割は 1/10。（もとにする量）×（割合）で表す。○割引きは、もとの (10−○) 割。答え {e}（小数で表してもよい）', 35, 'A③', '割合', tb=65, tbnote='例6・問9')
    def t4():  # 何%増し
        k = r.randrange(3)
        if k == 0: p = r.choice([10, 20, 25, 30, 40, 50]); txt, e, nr = f'a 円で仕入れた品物に、仕入れ値の {p}% の利益を見こんでつけた定価', alg.ans(A * F(100 + p, 100)), [alg.ans(A * F(p, 100))]
        elif k == 1: p, d = r.choice([2, 3]), r.choice([50, 100, 200]); txt, e, nr = f'定価 a 円の品物を {p} 割引きにし、さらに {d} 円引いた値段', alg.ans(A * F(10 - p, 10) - d), [alg.ans(A * F(p, 10) - d)]
        else: p = r.choice([10, 20, 25]); txt, e, nr = f'ある商品の内容量 x g を {p}% 増量したときの内容量', alg.ans(X * F(100 + p, 100)), [alg.ans(X * F(p, 100))]
        u.add(f'次の数量を表す式を書こう。\n{txt}', expr_answer(e, units=['円', 'g']), f'○% 増しは、もとの (100＋○)%。答え {e}', 35, 'B①', '割合（〜%増し）', nr, tb=65, tbnote='例6')
    def t5():  # 割合の割合
        p, q = r.choice([(32, 25), (40, 25), (60, 50), (20, 30), (75, 40), (50, 12)])
        e = alg.ans(A * F(p, 100) * F(q, 100))
        u.add(f'ある美術館の面積は a m² で、その {p}% が中庭である。中庭の面積の {q}% が池のとき、池の面積を表す式を書こう。', expr_answer(e, units=['m²', 'm2']), f'中庭は a × ({p}/100)（m²）、池はその {q}/100 倍。a × ({p}/100) × ({q}/100) ＝ {e}（m²）', 35, 'B+③', '割合の割合', [alg.ans(A * F(p + q, 100)), alg.ans(A * F(p, 100))], tb=65, tbnote='例6')
    def t6():  # 式の意味
        k = r.randrange(3)
        if k == 0:
            p, q = r.randint(2, 4), r.randint(2, 5)
            opts = [f'おとな {p} 人と子ども {q} 人の入館料の合計', f'おとな {q} 人と子ども {p} 人の入館料の合計', f'おとな1人と子ども1人の入館料の差', f'おとな {p} 人の入館料と子ども {q} 人の入館料の差']
            r.shuffle(opts); ans = LETTERS[opts.index(f'おとな {p} 人と子ども {q} 人の入館料の合計')]
            u.add(f'ある博物館の入館料は、おとな1人が a 円、子ども1人が b 円である。式 {p}a＋{q}b（円）は何を表しているか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
                  f'{p}a はおとな {p} 人分、{q}b は子ども {q} 人分の入館料。その和なので合計。正解：{ans}', 35, 'B②', '式が表す数量', tb=65, tbnote='例7・問10')
        else:
            v1, v2 = r.choice([(60, 80), (50, 70), (40, 200)])
            which = r.choice(['x+y', f'{v1}x+{v2}y'])
            opts = ['家から駅までかかった時間（分）', '家から駅までの道のり（m）', '歩いた速さの平均（m/分）', '走った時間と歩いた時間の差（分）']
            ans = LETTERS[0] if which == 'x+y' else LETTERS[1]
            u.add(f'家を出てから、分速 {v1} m で x 分間歩き、さらに分速 {v2} m で y 分間歩いて駅に着いた。式 {which} は何を表しているか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
                  f'x、y は時間（分）、{v1}x と {v2}y はそれぞれ進んだ道のり（m）。正解：{ans}', 35, 'B②', '式が表す数量', tb=65, tbnote='問11')
    def t7():  # 時間・長さの単位
        k = r.randrange(4)
        if k == 0: txt, e, un, nr = 'x 時間 y 分を、分の単位で表した時間', '60x+y', ['分'], ['x+y', '100x+y']
        elif k == 1: txt, e, un, nr = 'a 分を、時間の単位で表した時間', 'a/60', ['時間'], ['60a']
        elif k == 2: txt, e, un, nr = 'x m と y cm をあわせた長さを、cm の単位で表したもの', '100x+y', ['cm'], ['x+y', '10x+y']
        else: txt, e, un, nr = 'a kg と b g をあわせた重さを、g の単位で表したもの', '1000a+b', ['g'], ['a+b', '100a+b']
        u.add(f'次の数量を表す式を書こう。\n{txt}', expr_answer(e, units=un), f'1時間＝60分、1m＝100cm、1kg＝1000g。単位をそろえてから加える。答え {e}（{un[0]}）', 34, 'A②(4)', '単位をそろえて表す', nr, tb=64, tbnote='例5')
    plan = [t1] * 12 + [t2] * 12 + [t3] * 12 + [t4] * 8 + [t5] * 6 + [t6] * 10 + [t7] * 10
    return fill(u, plan)

# ---------------- 式の値（ワーク p36〜37・教科書 p66〜68） ----------------
def m3():
    u = Unit('workbook-math-1-moji3', 'workbook', '式の値', '文字式',
             '2026-10-05 Claude作成。数学ワークp36〜37（A①文字が1つの式の値・A②文字に指数がある式の値・A③④2つの文字をふくむ式の値・B①②・B+③硬貨の金額）と教科書p66〜68（例1〜6・問1〜8・数学ライブラリー）を写真で確認。', tb=66)
    r = rng(1031)
    def val_q(expr_txt, p, env, page, no, topic, tb, tbnote, extra=''):
        v = p.val(**env)
        envtxt = '、'.join(f'{k}＝{fmt_num(F(x))}' for k, x in env.items())
        u.add(f'{envtxt} のとき、次の式の値を求めよう。\n{expr_txt}', num_answer(v),
              f'{extra}負の数や分数はかっこをつけて代入する。{subst(p, env)}。答え {fmt_num(v)}', page, no, topic, [ans_str(-v)], tb=tb, tbnote=tbnote)
    def t1():
        a, b = rint(r, -9, 9), rint(r, -9, 9); x = r.choice([rint(r, -9, -1), F(rint(r, -5, 5), r.choice([2, 3]))])
        if F(x).denominator != 1 and (a * F(x)).denominator != 1: return
        if abs(F(x)) < 2 and F(x).denominator == 1 or abs(a) < 2: return
        p = a * X + b
        val_q(sh(p), p, {'x': x}, 36, 'A①', '文字が1つの式の値', 66, '例1・問2')
    def t2():
        a = r.choice([rint(r, -9, -2), F(r.choice([1, 2, -1, -2]), r.choice([2, 3]))])
        k = r.randrange(3)
        if k == 0: p, s = A * A, 'a²'
        elif k == 1: p, s = -A * A, '−a²'
        else: c = rint(r, -5, 5); p, s = c * A * A, sh(c * A * A)
        val_q(s, p, {'a': a}, 36, 'A②', '指数がある式の値', 67, '例4・問5・問6', extra=f'a² ＝ ({fmt_num(F(a))})×({fmt_num(F(a))})。' + ('−a² は a² に − がついたもの。' if k == 1 else ''))
    def t3():
        n = r.choice([12, 18, 24, 30, 36, 48]); x = r.choice([d for d in range(-12, 0) if n % d == 0 and d != -1])
        sgn = r.choice([1, -1])
        s = f'{"−" if sgn < 0 else ""}{n}/x'; v = F(sgn * n, x)
        u.add(f'x＝{fmt_num(F(x))} のとき、次の式の値を求めよう。\n{s}', num_answer(v), f'{n}/x ＝ {n} ÷ x と考える。{s} ＝ {ex(sgn * n, "÷", x)} ＝ {fmt_num(v)}', 36, 'A①(3)', '分数の形の式の値', [ans_str(-v), ans_str(F(x, n))], tb=67, tbnote='例3・問4')
    def t4():
        a, b = rint(r, -9, 9), rint(r, -9, 9); x, y = rint(r, -6, 6), rint(r, -6, 6)
        p = a * X + b * Y
        val_q(sh(p), p, {'x': x, 'y': y}, 37, 'A③', '2つの文字をふくむ式の値', 68, '例5・例6・問7')
    def t5():
        k = r.randrange(3); a = r.choice([-6, -3, 6, 9, -9, 12])
        if k == 0: c = r.choice([F(-1, 3), F(2, 3), F(-5, 3)]); p = c * A + rint(r, -5, 5); s = sh(p)
        elif k == 1:
            c = rint(r, -4, 4)
            if abs(c) < 2: return
            p = c * A * A; s = sh(p)
        else: c = rint(r, -4, 4); d = rint(r, -9, 9); p = c * A * A + d * A; s = sh(p)
        val_q(s, p, {'a': a}, 37, 'B①', '式の値', 67, '例4')
    def t6():
        x, y = rint(r, -6, 6), rint(r, -9, 9); c = r.choice([F(5, 2), F(3, 2), F(-3, 4)])
        if (c * x).denominator != 1: return
        k = r.randrange(2)
        p = c * X + Y if k == 0 else X * X - 2 * Y
        val_q(sh(p), p, {'x': x, 'y': y}, 37, 'B②', '2つの文字をふくむ式の値', 68, '問7(3)')
    def t7():
        p1, p2 = r.choice([(100, 10), (500, 100), (50, 10)]); x, y = r.randint(2, 9), r.randint(2, 15)
        v = p1 * x + p2 * y
        u.add(f'{p1}円硬貨が x 枚、{p2}円硬貨が y 枚ある。x＝{x}、y＝{y} のとき、金額の合計は何円か答えよう。', {'kind': 'number', 'value': str(v), 'units': ['円']},
              f'金額の合計は {p1}x＋{p2}y（円）。代入して {p1}×{x}＋{p2}×{y}＝{v}（円）', 37, 'B+③', '式の値の利用', [str(p1 * y + p2 * x)], tb=68, tbnote='問8')
    def t8():
        a = r.randint(3, 15)
        v = 24 + 4 * (a - 2)
        u.add(f'2歳以上の小型犬の年齢が a 歳のとき、人間であれば何歳にあたるかは、式 24＋4(a−2) で求められるといわれている。{a} 歳の小型犬は、人間であれば何歳にあたるか答えよう。', {'kind': 'number', 'value': str(v), 'units': ['歳']},
              f'a に {a} を代入する。24＋4×({a}−2)＝24＋{4 * (a - 2)}＝{v}（歳）', 37, 'B+③', '式の値の利用', [str(24 + 4 * a - 2)], tb=68, tbnote='数学ライブラリー')
    def t9():  # 式の値の大小
        x = rint(r, -5, -2)
        exprs = [(X * X, 'x²'), (-X * X, '−x²'), (X * X * X, 'x³'), (-X, '−x'), (1 / F(1) * X, 'x')]
        r.shuffle(exprs); exprs = exprs[:4]
        vals = [p.val(x=x) for p, _ in exprs]
        if len(set(vals)) < 4: return
        want = r.choice(['大きい', '小さい']); v = max(vals) if want == '大きい' else min(vals)
        u.add(f'x＝{fmt_num(F(x))} のとき、次のア〜エの式のうち、値がもっとも{want}ものを記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {s}' for i, (_, s) in enumerate(exprs)), choice_answer([LETTERS[vals.index(v)]]),
              '代入すると ' + '、'.join(f'{LETTERS[i]}＝{fmt_num(z)}' for i, z in enumerate(vals)) + '。', 36, 'A②', '式の値の大小', tb=67, tbnote='例4')
    plan = [t1] * 9 + [t2] * 10 + [t3] * 7 + [t4] * 10 + [t5] * 9 + [t6] * 7 + [t7] * 6 + [t8] * 5 + [t9] * 7
    return fill(u, plan)
