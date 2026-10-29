"""1章 いろいろな計算①②（ワーク p18〜21・教科書 p42〜44 を写真で確認して作成）"""
from common import *

def P(base, n):
    """累乗：base が負なら (−3)² の形"""
    return Pow(L(base) if not isinstance(base, E_) else base, n)
from expr import E as E_

def negpow(a, n): return Neg(Pow(L(a), n))  # −3² の形

def small_int(r, lo=-9, hi=9): return rint(r, lo, hi)

# ---------------- いろいろな計算①（ワーク p18〜19・教科書 p42〜43：累乗・四則の混じった計算） ----------------
def w5():
    u = Unit('workbook-math-1-calc1', 'workbook', 'いろいろな計算①', '正負の数',
             '2026-10-05 Claude作成。数学ワークp18〜19（A①同じ数の積・A②指数をふくむ計算・A③四則が混じった計算・B①・B+②(−10)¹⁰と(−10)¹¹の大小と理由）と教科書p42〜43（例1・例2・問2・説明しよう・例3・問3）を写真で確認。かっこの中を先に計算する式（次の回）は使わない。', tb=42)
    r = rng(511)
    def t1():  # 分数・小数の累乗
        kind = r.choice(['frac', 'dec', 'neg'])
        if kind == 'frac':
            v = rfrac(r, (2, 3, 4, 5), 1, 5); n = r.choice([2, 3, 3])
            e = Pow(Lit(v, 'frac'), n) if r.random() < .7 else Neg(Pow(Lit(abs(v), 'frac'), n))
        elif kind == 'dec':
            v = rdec(r, -1.5, 1.5); n = r.choice([2, 3])
            e = Pow(Lit(v, 'dec'), n) if r.random() < .6 else Neg(Pow(Lit(abs(v), 'dec'), n))
        else:
            a = r.randint(2, 6); n = r.randint(2, 4)
            e = Neg(Pow(L(a), n)) if r.random() < .5 else Pow(L(-a), n)
        expr_q(u, e, 18, 'A①', '同じ数の積（指数）', lead='次の数を計算しよう。', tb=42, tbnote='例1・問2')
    def t2():  # 累乗をふくむ乗除
        a, b = r.choice([-2, -3, 2, 3, -4, -5, -6]), r.choice([-2, -3, 2, 3, -1])
        m, n = r.randint(2, 3), r.randint(2, 4)
        x = L(r.choice([2, 3, 4, 5, 6, -4, -6, -8, 12]))
        first = Pow(L(a), m) if r.random() < .5 else Neg(Pow(L(abs(a)), m))
        second = Pow(L(b), n) if r.random() < .6 else Neg(Pow(L(abs(b)), n))
        e = r.choice([C(first, '÷', second), C(first, '×', second, '÷', x), C(x, '×', first, '÷', second), C(first, '÷', x, '×', second)])
        if nice(e.val(), 12, 600): expr_q(u, e, 18, 'A②', '指数をふくむ計算', tb=42, tbnote='例2')
    def t3():  # 四則と累乗（B①）
        a = L(rint(r, -30, 30)); b = L(rint(r, -9, 9)); c = Pow(L(r.choice([-2, -3, -4, -5])), r.choice([2, 3])) if r.random() < .5 else Neg(Pow(L(r.choice([2, 3, 4, 5])), 2))
        d = L(rint(r, -9, 9))
        e = r.choice([C(a, '−', c, '×', d), C(a, '×', b, '+', c), C(a, '÷', b, '−', c, '×', d), C(c, '−', a, '÷', b), C(a, '+', b, '×', c)])
        if any(abs(x.v) <= 1 for x in (a, b, d)): return
        if nice(e.val(), 6, 600) and e.val().denominator == 1: expr_q(u, e, 19, 'B①', '四則と指数が混じった計算', tb=43, tbnote='例3(2)・問3')
    def t4():  # 四則（A③）
        a, b, c, d, f = (L(rint(r, -15, 15)) for _ in range(5))
        e = r.choice([C(a, '−', b, '×', c), C(a, '+', b, '÷', c), C(a, '×', b, '−', c, '×', d), C(a, '÷', b, '+', c, '×', d, '−', f), C(a, '−', b, '÷', c, '×', d)])
        if any(abs(x.v) <= 1 for x in (a, b, c, d, f)): return
        if e.val().denominator == 1 and abs(e.val()) < 400: expr_q(u, e, 19, 'A③', '四則が混じった計算（乗除を先に）', tb=43, tbnote='例3(1)')
    def t5():  # 大小
        a = r.choice([2, 3, 5, 10]); m = r.randint(2, 5)
        items = [('(−%d)%s' % (a, str(m).translate(SUPT)), F(-a) ** m), ('−%d%s' % (a, str(m).translate(SUPT)), -F(a) ** m),
                 ('(−%d)%s' % (a, str(m + 1).translate(SUPT)), F(-a) ** (m + 1)), ('−%d%s' % (a, str(m + 1).translate(SUPT)), -F(a) ** (m + 1))]
        vals = [v for _, v in items]
        if len(set(vals)) < 4: return
        want = r.choice(['大きい', '小さい'])
        v = max(vals) if want == '大きい' else min(vals)
        u.add(f'次のア〜エのうち、もっとも{want}数を記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(items)), choice_answer([LETTERS[vals.index(v)]]),
              '負の数の累乗は、指数が偶数なら正、奇数なら負。−a□ は a□ に − がついたもの。値は ' + '、'.join(f'{LETTERS[i]}＝{fmt_num(x)}' for i, x in enumerate(vals)) + '。', 19, 'B+②', '累乗の符号と大小', tb=42, tbnote='説明しよう')
    def t6():  # (−1)の累乗の和
        n = r.randint(5, 30); start = r.randint(1, 3)
        s = sum(F(-1) ** k for k in range(start, n + 1))
        u.add(f'(−1){str(start).translate(SUPT)} + (−1){str(start + 1).translate(SUPT)} + (−1){str(start + 2).translate(SUPT)} + … + (−1){str(n).translate(SUPT)} を計算しよう。', num_answer(s),
              f'(−1) の累乗は、指数が偶数なら 1、奇数なら −1。となりどうしで 0 になる組を作ると、{"1つ残る" if (n - start + 1) % 2 else "すべて打ち消し合う"}。答え {fmt_num(s)}。', 19, 'B+②', '負の数の累乗の符号', [ans_str(-s), str(n - start + 1)], tb=42, tbnote='説明しよう')
    def t7():  # 指数をあてる
        b = r.choice([-2, -3, -5, -10]); n = r.randint(2, 6)
        v = F(b) ** n
        u.add(f'(−{abs(b)})□ ＝ {fmt_num(v)} となるとき、□ にあてはまる自然数を答えよう。', num_answer(n),
              f'{abs(b)} を何回かければ {abs(v)} になるかを考えると {n} 回。符号が{"正" if v > 0 else "負"}なので指数は{"偶数" if v > 0 else "奇数"}で、{n} は条件に合う。', 18, 'A①', '指数', [str(n + 1), str(n - 1)], tb=42, tbnote='説明しよう')
    def t8():  # ミスに注意 −3² の誤り
        a, b = r.randint(2, 7), r.randint(2, 7)
        e = C(Neg(Pow(L(a), 2)), r.choice(['+', '−']), Pow(L(-b), 2))
        wrong = e.val('negpow')
        if wrong == e.val(): return
        u.add(f'Cさんは {show(e)} を計算して {fmt_num(wrong)} と答えたが、まちがっていた。正しい答えを求めよう。', num_answer(e.val()),
              f'−{a}² は {a}² に − がついたもので −{a*a}。(−{b})² は (−{b})×(−{b}) で {b*b}。' + explain(e), 18, 'A①（ミスに注意）', '−a² と (−a)² のちがい', [ans_str(wrong)], tb=42, tbnote='例1')
    def t9():  # □ にあてはまる数（四則）
        a, x, c = rint(r, -20, 20), rint(r, -9, 9), rint(r, -9, 9)
        if abs(x) < 2 or abs(c) < 2: return
        op = r.choice(['+', '−']); res = F(a) + x * c if op == '+' else F(a) - x * c
        u.add(f'次の □ にあてはまる数を答えよう。\n{lit_txt(a, True)} {op} □ × {lit_txt(c, mul=True)} ＝ {fmt_num(res)}', num_answer(x),
              f'乗法を先に計算するので、□ × {lit_txt(c, mul=True)} の部分は {fmt_num(res - a if op == "+" else a - res)}。だから □ ＝ {fmt_num(x)}。', 19, 'A③', '四則の計算の順序（逆算）', [ans_str(-x)], tb=43, tbnote='計算の順序')
    plan = [t1] * 8 + [t2] * 10 + [t3] * 11 + [t4] * 8 + [t5] * 6 + [t6] * 6 + [t7] * 6 + [t8] * 7 + [t9] * 8
    return fill(u, plan)

SUPT = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')

# ---------------- いろいろな計算②（ワーク p20〜21・教科書 p43〜44：かっこ・指数・分配法則） ----------------
def w6():
    u = Unit('workbook-math-1-calc2', 'workbook', 'いろいろな計算②', '正負の数',
             '2026-10-05 Claude作成。数学ワークp20〜21（A①かっこがある式・A②かっこと指数がある式・A③分配法則・B①・B+②75×(−13)−125×(−13)）と教科書p43〜44（例4・問4・分配法則・問5・説明しよう・練習問題）を写真で確認。', tb=43)
    r = rng(611)
    def inner():
        a, b = L(rint(r, -15, 15)), L(rint(r, -15, 15))
        k = r.random()
        if k < .4: return Grp(C(a, r.choice(['+', '−']), b))
        if k < .7: return Grp(C(a, r.choice(['+', '−']), Pow(L(r.choice([2, 3, -2, -3, -4])), 2) if r.random() < .5 else Neg(Pow(L(r.choice([2, 3, 4])), 2))))
        return Grp(C(Pow(L(r.choice([2, 3, 5, -2, -4])), r.choice([2, 3])), '−', L(rint(r, -12, 12))))
    def t1():  # かっこ・指数・{ }
        x, y = L(rint(r, -12, 12)), L(rint(r, -9, 9))
        g = inner()
        forms = [C(x, '−', y, '×', g), C(x, '+', g, '÷', y), C(x, '×', Grp(C(y, '−', g), '{}')), C(x, '−', Grp(C(Pow(L(r.choice([-2, -3])), 2), '−', g), '{}')), C(g, '×', y, '−', x)]
        e = r.choice(forms)
        if e.val().denominator == 1 and abs(e.val()) < 500 and abs(e.val()) > 0: expr_q(u, e, 20, r.choice(['A①', 'A②']), 'かっこと指数がある式（計算の順序）', tb=43, tbnote='例4・問4')
    def t2():  # 分配法則（分数）
        dens = r.choice([(2, 3), (3, 4), (4, 6), (5, 3), (6, 9), (2, 5), (4, 5), (3, 8)])
        m = math.lcm(*dens) * r.choice([1, 2, -1, -2])
        a, b = F(r.choice([1, -1]) * r.randint(1, dens[0] - 1 if dens[0] > 2 else 1), dens[0]), F(r.choice([1, -1]) * r.randint(1, dens[1] + 3), dens[1])
        if a.denominator == 1 or b.denominator == 1: return
        if a == b: return
        g = Grp(C(Lit(a, 'frac'), '+' if b > 0 else '−', Lit(abs(b), 'frac')))
        left = r.random() < .5
        e = C(g, '×', L(m)) if left else C(L(m), '×', g)
        d = ex(a, '×', m, '+', b, '×', m) if left else ex(m, '×', a, '+', m, '×', b)
        u.add(f'分配法則を使って、次の計算をしよう。\n{show(e)}', num_answer(e.val()),
              f'分配法則で、かっこの中のそれぞれに {lit_txt(m, mul=True)} をかける。{show(e)} ＝ {d} ＝ {ex(a * m, "+", b * m)} ＝ {fmt_num(e.val())}。答え {fmt_num(e.val())}',
              21, 'A③', '分配法則', [ans_str(a + b * m), ans_str(a * m + b)], tb=44, tbnote='分配法則・説明しよう（あおいさんの方法）')
    def t3():  # 共通な数でくくる（B+②）
        c = rint(r, -29, 29)
        if abs(c) < 6: return
        x = r.choice([100, 1000, 10, 50]); a = r.randint(11, x - 1) if x > 10 else r.randint(11, 79)
        if x == 10: x = 100
        b = x - a if r.random() < .5 else -(x + a) if False else x - a
        op = r.choice(['+', '−'])
        if op == '−': p, q = a + x, a
        else: p, q = a, b
        e = C(L(p), '×', L(c), op, L(q), '×', L(c))
        k = p + q if op == '+' else p - q
        u.add(f'くふうして、次の計算をしよう。\n{show(e)}', num_answer(e.val()),
              f'どちらの項にも {lit_txt(c, mul=True)} がかかっているので、分配法則を逆に使ってまとめる。{show(e)} ＝ ({p} {op} {q}) × {lit_txt(c, mul=True)} ＝ {ex(k, "×", c)} ＝ {fmt_num(e.val())}。答え {fmt_num(e.val())}',
              21, 'B+②', '分配法則を逆に使って工夫する', [ans_str(p * c), ans_str(k)], tb=44, tbnote='分配法則')
    def t4():  # 小数のかっこ（B①(2)）
        a, b, c = rdec(r, -2, 2), rdec(r, -2, 2), rdec(r, -1, 1)
        e = C(Grp(C(L(rint(r, -3, 3)), '+', Grp(C(Lit(a, 'dec'), '−', Lit(b, 'dec')))), '{}'), '×', Lit(c, 'dec'))
        expr_q(u, e, 21, 'B①(2)', '小数をふくむかっこの計算', tb=43, tbnote='例4')
    def t5():  # 分配法則＋加減（B①(4)）
        d1, d2 = r.choice([(6, 9), (4, 6), (3, 4), (5, 10), (2, 7), (3, 8)])
        m = math.lcm(d1, d2) * r.choice([1, -1, 2])
        a, b = F(r.choice([1, -1]) * r.randint(1, d1 - 1), d1), F(r.choice([1, -1]) * r.randint(1, d2 - 1), d2)
        if a.denominator == 1 or b.denominator == 1: return
        op, c = r.choice(['+', '−']), rint(r, 2, 20)
        e = C(Grp(C(Lit(a, 'frac'), '+' if b > 0 else '−', Lit(abs(b), 'frac'))), '×', L(m), op, L(c))
        v = e.val()
        u.add(f'次の計算をしよう。\n{show(e)}', num_answer(v),
              f'分配法則を使うと {show(e)} ＝ {ex(a, "×", m, "+", b, "×", m, op, c)} ＝ {ex(a * m, "+", b * m, op, c)} ＝ {fmt_num(v)}。答え {fmt_num(v)}',
              21, 'B①(4)', '分配法則と加減', [ans_str((a + b) * m)], tb=44, tbnote='分配法則')
    def t6():  # 計算の順序のまちがい
        a, b, c, d = rint(r, -12, 12), rint(r, 2, 9), r.choice([2, 3, 4, 5]), rint(r, -9, 9)
        e = C(L(a), '−', Grp(C(L(b), '−', Pow(L(c), 2))), '×', L(d))
        wrong = (F(a) - (b - c * c)) * d
        if wrong == e.val(): return
        u.add(f'Dさんは {show(e)} を、左から順に計算して {fmt_num(wrong)} と答えた。正しい答えを求めよう。', num_answer(e.val()),
              f'計算の順序は「指数 → かっこの中 → 乗除 → 加減」。{c}² ＝ {c*c}、かっこの中は {fmt_num(F(b - c*c))}、乗法 {ex(b - c*c, "×", d)} ＝ {fmt_num(F((b - c*c) * d))} を先に計算して、答え {fmt_num(e.val())}。', 20, 'A②', '計算の順序', [ans_str(wrong)], tb=43, tbnote='例4')
    def t7():  # □ をふくむかっこの式
        a, b, k = rint(r, -12, 12), rint(r, -12, 12), r.choice([2, 3, -2, -3, 4])
        x = rint(r, -15, 15)
        res = k * (a - (x - b))
        u.add(f'次の □ にあてはまる数を答えよう。\n{lit_txt(k, True, mul=True)} × {{{lit_txt(a, True)} − (□ − {lit_txt(b)})}} ＝ {fmt_num(F(res))}', num_answer(x),
              f'外側から順にもどす。{{ }} の中は {ex(res, "÷", k)} ＝ {fmt_num(F(a - (x - b)))}。だから (□ − {lit_txt(b)}) ＝ {ex(a, "−", a - (x - b))} ＝ {fmt_num(F(x - b))}、□ ＝ {fmt_num(F(x))}。', 20, 'A①(4)', 'かっこがある式の逆算', [ans_str(-x), ans_str(x + 2 * b)], tb=43, tbnote='例4')
    def t8():  # 分配法則で等しい式を選ぶ
        a, b, c = rint(r, -9, 9), rint(r, -9, 9), rint(r, -9, 9)
        if len({a, b, c}) < 3 or a + b == 0 or min(abs(a), abs(b), abs(c)) < 2: return
        base = f'({lit_txt(a, True)} + {lit_txt(b)}) × {lit_txt(c, mul=True)}'
        opts = [(ex(a, '×', c, '+', b, '×', c), True), (ex(a, '×', c, '+', b), (a + b) * c == a * c + b),
                (ex(a, '+', b, '×', c), (a + b) * c == a + b * c), (ex(c, '×', a, '+', c, '×', b), True)]
        r.shuffle(opts)
        ok = [LETTERS[i] for i, (_, t) in enumerate(opts) if t]
        u.add(f'次のア〜エのうち、{base} と同じ値になる式をすべて選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(opts)), choice_answer(ok),
              f'分配法則 (a＋b)×c＝a×c＋b×c、c×(a＋b)＝c×a＋c×b。もとの式の値は {fmt_num(F((a + b) * c))}。それぞれ計算して確かめる。正解：' + '、'.join(ok), 21, 'A③', '分配法則', tb=44, tbnote='分配法則・問5')
    def t9():  # 大きなかっこと指数（B①(3)）
        a, b, c = r.choice([2, 3, 4, 5, 6, 7]), rint(r, -12, 12), rint(r, -12, 12)
        e = C(Grp(C(Neg(Pow(L(a), 2)), '−', Grp(C(L(b), '−', L(c)))), '{}'), r.choice(['+', '−']), L(rint(r, 2, 20)))
        expr_q(u, e, 21, 'B①(3)', '{ } と指数がある式', tb=43, tbnote='問4(2)')
    plan = [t1] * 14 + [t2] * 9 + [t3] * 7 + [t4] * 6 + [t5] * 7 + [t6] * 6 + [t7] * 7 + [t8] * 6 + [t9] * 8
    return fill(u, plan)
