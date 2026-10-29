"""2章 文字式②：加法・減法①②、乗法・除法①②、ふりかえりドリル、関係を表す式（ワーク p38〜49・教科書 p69〜81 を写真で確認して作成）"""
from common import *
from bank import expr_answer, relation_answer
import alg
from alg import P as Poly, var, show as sh, paren, steps_txt, collect, coef_txt, num as anum
from moji1 import subst

X, Y, A, B = var('x'), var('y'), var('a'), var('b')

def lin(r, v, cmax=9, kmax=9, frac=False, zero_const=False):
    """一次式 a·v＋b（a≠0）"""
    a = F(rint(r, -cmax, cmax))
    if frac and r.random() < .5: a = rfrac(r, (2, 3, 4, 5, 6), 1, 9)
    b = F(0) if zero_const else F(rint(r, -kmax, kmax))
    return a * v + b

def cpar(c, p, lead=True):
    """c(p) の表示：4(2a+3)、−2(x−5)、(3/4)(2a/3−3)"""
    c = F(c)
    if c.denominator != 1: return ('(' if True else '') + (('−' if c < 0 else '') + f'{abs(c.numerator)}/{c.denominator}') + ')' + paren(p) if lead or c > 0 else '(−' + f'{abs(c.numerator)}/{c.denominator})' + paren(p)
    if c == 1: return paren(p)
    if c == -1: return '−' + paren(p)
    return coef_txt(c, lead) + paren(p)

def join_signed(items):
    """[(符号つき係数c, 式p)] を c(p) の和として表示：4(2x+1)−5(x−6)"""
    out = ''
    for i, (c, p) in enumerate(items):
        c = F(c)
        if i == 0: out += cpar(c, p, True)
        else: out += ('−' if c < 0 else '+') + cpar(abs(c), p, True)
    return out

def eq_q(u, prompt, p, expl, page, no, topic, near=(), tb=None, tbnote='', form=None):
    u.add(prompt, expr_answer(sh(p), form=form), expl, page, no, topic, [sh(n) if isinstance(n, Poly) else n for n in near], tb=tb, tbnote=tbnote)

# ---------------- 文字式の加法、減法①（ワーク p38〜39・教科書 p70〜72） ----------------
def m4():
    u = Unit('workbook-math-1-moji4', 'workbook', '文字式の加法、減法①', '文字式',
             '2026-10-05 Claude作成。数学ワークp38〜39（A①項と係数・A②文字の部分が同じ項をまとめる・A③それぞれの項をまとめる・B①小数と分数の係数・B+②）と教科書p70〜72（例1〜4・問1〜3・一次式）を写真で確認。', tb=71)
    r = rng(1041)
    def t1():  # 係数
        k = r.randrange(5)
        if k == 0: d = r.randint(2, 9); c = rint(r, -9, 9); s = f'x/{d}{"+" if c > 0 else "−"}{abs(c)}y'; ask, v, why = 'x', F(1, d), f'x/{d} ＝ (1/{d})x だから、x の係数は 1/{d}'
        elif k == 1: c = rint(r, 2, 9); s = f'{c}−x'; ask, v, why = 'x', F(-1), '−x ＝ (−1)×x だから、x の係数は −1'
        elif k == 2: d = r.randint(2, 9); s = f'−a/{d}+b−{r.randint(1, 9)}'; ask, v, why = 'a', F(-1, d), f'−a/{d} ＝ (−1/{d})a だから、a の係数は −1/{d}'
        elif k == 3:
            c, d = r.randint(2, 7), r.randint(3, 9)
            if math.gcd(c, d) != 1: return
            s = f'{c}x/{d}−y+1'; ask, v, why = 'x', F(c, d), f'{c}x/{d} ＝ ({c}/{d})x だから、x の係数は {c}/{d}'
        else: c = r.randint(2, 9); s = f'{c}x−y+{r.randint(1, 9)}'; ask, v, why = 'y', F(-1), '−y ＝ (−1)×y だから、y の係数は −1'
        u.add(f'式 {s} で、{ask} をふくむ項の係数を答えよう。', num_answer(v), f'文字をふくむ項で、数と文字の積の形にしたときの数の部分が係数。{why}。答え {fmt_num(v)}',
              38, 'A①', '項と係数', [ans_str(-v), ans_str(1 / v) if v else None], tb=70, tbnote='例1・例2・問1')
    def t2():  # 項
        a, b, c = rint(r, -9, 9), rint(r, -9, 9), rint(r, -9, 9)
        p = a * X + b * Y + c
        terms = [alg.term_txt(k, v, True) for k, v in p.terms()]
        acc = []
        for perm in itertools.permutations(terms):
            for sep in ('、', ','):
                acc.append(sep.join(perm))
        u.add(f'式 {sh(p)} の項をすべて答えよう（読点で区切る）。', exact_answer(acc, compact=True), f'加法だけの式になおすと {" ＋ ".join(("(" + t + ")") if t.startswith("−") else t for t in terms)}。項は {"、".join(terms)}', 38, 'A①', '項', tb=70, tbnote='例1・問1')
    def t3():  # 同類項
        cs = [rint(r, -12, 12) for _ in range(r.randint(2, 4))]
        if sum(cs) == 0 and r.random() < .7: return
        v = r.choice([X, A, Y, B])
        s = ''.join(alg.term_txt(v.terms()[0][0], F(c), i == 0) for i, c in enumerate(cs))
        p = sum(cs) * v
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'文字の部分が同じ項は、係数どうしを計算してまとめる（mx＋nx＝(m＋n)x）。{s} ＝ ({"+".join(str(c) for c in cs).replace("+-", "−").replace("-", "−")}){alg.letters_txt(v.terms()[0][0])} ＝ {sh(p)}', 38, 'A②', '文字の部分が同じ項をまとめる', [-p], tb=71, tbnote='例3・問2')
    def t4():  # 項をまとめる
        n = r.randint(4, 6); items = []
        for _ in range(n):
            items.append((('x',), F(rint(r, -12, 12))) if r.random() < .55 else ((), F(rint(r, -15, 15))))
        p = Poly({}); [p := p + Poly({k: v}) for k, v in items]
        if not p.coef('x'): return
        s = alg.terms_txt(items)
        mid = alg.terms_txt(sorted(items, key=lambda t: t[0] == ()))
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'文字の部分が同じ項どうし、数の項どうしを集めてまとめる。{s}{" ＝ " + mid if mid != s else ""} ＝ {sh(p)}', 39, 'A③', 'それぞれの項をまとめる', [Poly({('x',): -p.coef('x'), (): p.const()}), Poly({('x',): p.coef('x'), (): -p.const()})], tb=72, tbnote='例4・問3')
    def t5():  # 小数
        cs = [rdec(r, -3, 3) for _ in range(r.randint(2, 3))]; c0 = rdec(r, -4, 4)
        v = r.choice([A, X])
        items = [(v.terms()[0][0], c) for c in cs] + [((), c0)]; r.shuffle(items)
        p = Poly({}); [p := p + Poly({k: w}) for k, w in items]
        def dterm(k, w, first):
            body = (fmt_num(abs(w), 'dec') if abs(w) != 1 or not k else '') + alg.letters_txt(k)
            return ('−' if w < 0 else ('' if first else '+')) + body
        s = ''.join(dterm(k, w, i == 0) for i, (k, w) in enumerate(items))
        def dtxt(q):
            out = ''
            for i, (k, w) in enumerate(q.terms()):
                body = (fmt_num(abs(w), 'dec') if abs(w) != 1 or not k else '') + alg.letters_txt(k)
                out += ('−' if w < 0 else ('' if i == 0 else '+')) + body
            return out or '0'
        u.add(f'次の計算をしよう。\n{s}', expr_answer(dtxt(p)), f'小数の係数でも、文字の部分が同じ項どうし・数の項どうしをまとめる。答え {dtxt(p)}', 39, 'B①(2)', '小数の係数', [sh(-p)], tb=71, tbnote='問2(4)')
    def t6():  # 分数の係数
        d1, d2 = r.choice([(5, 5), (7, 7), (3, 6), (2, 3), (4, 6), (6, 9)])
        c1, c2 = F(rint(r, -d1 * 2, d1 * 2), d1), F(rint(r, -d2 * 2, d2 * 2), d2)
        if c1.denominator == 1 or c2.denominator == 1: return
        v = r.choice([X, A])
        p = (c1 + c2) * v
        s = alg.terms_txt([(v.terms()[0][0], c1), (v.terms()[0][0], c2)])
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'係数を通分して計算する。({fmt_num(c1)}) ＋ ({fmt_num(c2)}) ＝ {fmt_num(c1 + c2)} だから {sh(p)}', 39, 'B①(3)', '分数の係数', [(c1 - c2) * v], tb=71, tbnote='問2(5)(6)')
    def t7():  # 分数の係数と数の項（B+②）
        d = r.choice([3, 4, 5, 6]); c1, c2 = F(rint(r, -9, 9), d), F(rint(r, -5, 5))
        k1, k2 = F(rint(r, -9, 9)), F(rint(r, -9, 9), d)
        if c1.denominator == 1 or k2.denominator == 1: return
        items = [(('a',), c1), ((), k1), ((), k2), (('a',), c2)]
        p = Poly({}); [p := p + Poly({k: w}) for k, w in items]
        s = alg.terms_txt(items)
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'文字の項どうし、数の項どうしを集め、係数を通分して計算する。{s} ＝ {alg.terms_txt([items[0], items[3], items[1], items[2]])} ＝ {sh(p)}', 39, 'B+②', '分数の係数の式をまとめる', [Poly({('a',): c1 + c2, (): k1 - k2})], tb=72, tbnote='例4')
    def t8():  # 一次式を選ぶ
        good = ['5x', '4x+3', '2x−3y+1', 'x/5−2', '−y', '0.3a−1']
        bad = ['x²+1', '3/x', 'xy+2', '5', 'a²−a', '2/(x+1)']
        g = r.sample(good, r.randint(1, 3)); bd = r.sample(bad, 5 - len(g)); opts = g + bd; r.shuffle(opts)
        ok = [LETTERS[i] for i, o in enumerate(opts) if o in good]
        u.add('次のア〜オのうち、一次式をすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer(ok),
              '文字が1つだけの項（1次の項）だけの式、または1次の項と数の項の和で表される式が一次式。x²、xy、3/x などがあると一次式ではない。正解：' + '、'.join(ok), 38, 'A①', '一次式', tb=70, tbnote='1次の項・一次式')
    def t9():  # □にあてはまる係数
        a, b, c = rint(r, -9, 9), rint(r, -9, 9), rint(r, -9, 9)
        if a == 0: return
        rhs = (a + b) * X + c
        u.add(f'次の □ にあてはまる数を答えよう。\n□x {"+" if b > 0 else "−"} {abs(b)}x {"+" if c > 0 else "−"} {abs(c)} ＝ {sh(rhs)}', num_answer(a),
              f'x の係数どうしで考える。□ ＋ ({fmt_num(F(b))}) ＝ {fmt_num(F(a + b))} だから □ ＝ {fmt_num(F(a))}', 38, 'A②', '同類項の係数', [ans_str(F(a + 2 * b)), ans_str(F(-a))], tb=71, tbnote='例3')
    plan = [t1] * 7 + [t2] * 5 + [t3] * 8 + [t4] * 12 + [t5] * 8 + [t6] * 10 + [t7] * 8 + [t8] * 6 + [t9] * 6
    return fill(u, plan)

# ---------------- 文字式の加法、減法②（ワーク p40〜41・教科書 p72〜74） ----------------
def m5():
    u = Unit('workbook-math-1-moji5', 'workbook', '文字式の加法、減法②', '文字式',
             '2026-10-05 Claude作成。数学ワークp40〜41（A①かっこをはずして計算・A②式をたす・A③式をひく・B①分数の係数の式の和と差・B+②計算してから代入）と教科書p72〜74（例5・例6・問4・問5・練習問題1〜3）を写真で確認。', tb=73)
    r = rng(1051)
    def t1():
        p1, p2 = lin(r, X), lin(r, X)
        if not p1.coef('x') or not p2.coef('x') or not p2.const(): return
        sgn = r.choice([1, -1])
        start = sh(p1) + ('+' if sgn > 0 else '−') + paren(p2)
        eq_q(u, f'次の式を、かっこをはずして計算しよう。\n{start}', p1 + sgn * p2, f'かっこの前が＋ならそのままかっこをはずし、−ならかっこの中の各項の符号を変えてはずす。{steps_txt(start, [(1, p1), (sgn, p2)])}', 40, 'A①', 'かっこをはずして計算する', [p1 - sgn * p2, p1 + sgn * Poly({("x",): p2.coef("x"), (): -p2.const()})], tb=73, tbnote='例5・問4')
    def t2():
        p1, p2 = lin(r, A), lin(r, A)
        if not p1.const() or not p2.const(): return
        start = paren(p1) + '+' + paren(p2)
        eq_q(u, f'次の2つの式をたそう。\n{sh(p1)}、{sh(p2)}', p1 + p2, f'2つの式にかっこをつけて ＋ でつなぎ、かっこをはずす。{steps_txt(start, [(1, p1), (1, p2)])}', 40, 'A②', '式をたすこと', [p1 - p2], tb=74, tbnote='例6(1)・問5')
    def t3():
        p1, p2 = lin(r, X), lin(r, X)
        if not p2.const() or not p2.coef('x'): return
        start = paren(p1) + '−' + paren(p2)
        wrong = p1 - Poly({('x',): p2.coef('x'), (): -p2.const()})
        eq_q(u, f'次の2つの式で、左の式から右の式をひこう。\n{sh(p1)}、{sh(p2)}', p1 - p2, f'かっこをつけて − でつなぎ、ひく式の各項の符号を変えてかっこをはずす。{steps_txt(start, [(1, p1), (-1, p2)])}', 41, 'A③', '式をひくこと', [wrong, p2 - p1], tb=74, tbnote='例6(2)・問5')
    def t4():
        c1, c2 = rfrac(r, (5, 10, 3, 6, 4, 8), 1, 9), rfrac(r, (5, 10, 3, 6, 4, 8), 1, 9)
        p1, p2 = c1 * X + rint(r, -9, 9), c2 * X + rint(r, -9, 9)
        sgn = r.choice([1, -1]); word = 'たそう' if sgn > 0 else 'ひこう（左の式から右の式をひく）'
        start = paren(p1) + ('+' if sgn > 0 else '−') + paren(p2)
        eq_q(u, f'次の2つの式を{word}。\n{sh(p1)}、{sh(p2)}', p1 + sgn * p2, f'係数が分数でも整数のときと同じように計算する（係数は通分する）。{steps_txt(start, [(1, p1), (sgn, p2)])}', 41, 'B①', '分数の係数の式の和と差', [p1 - sgn * p2], tb=74, tbnote='例6')
    def t5():
        p1, p2 = lin(r, X), lin(r, X)
        x = rint(r, -6, 6)
        if abs(x) < 2: return
        q = p1 - p2; v = q.val(x=x)
        start = paren(p1) + '−' + paren(p2)
        u.add(f'x＝{fmt_num(F(x))} のとき、{start} の値を求めよう。', num_answer(v),
              f'先に式を計算して簡単にしてから代入する。{steps_txt(start, [(1, p1), (-1, p2)])}。x＝{fmt_num(F(x))} を代入して {subst(q, {"x": x})}', 41, 'B+②', '式を簡単にしてから代入する', [ans_str((p1 + p2).val(x=x)), ans_str(-v)], tb=74, tbnote='例6')
    def t6():  # □ に たすと
        target, known = lin(r, A), lin(r, A)
        ans = target - known
        if not ans.coef('a') or not known.const(): return
        u.add(f'ある式に {sh(known)} をたすと {sh(target)} になる。ある式を求めよう。', expr_answer(sh(ans)),
              f'（ある式）＝ {paren(target)} − {paren(known)} ＝ {steps_txt(paren(target) + "−" + paren(known), [(1, target), (-1, known)]).split(" ＝ ", 1)[1]}', 40, 'A②', '式をたすこと（逆に考える）', [sh(target + known)], tb=74, tbnote='練習問題3(1)')
    def t7():  # □ から ひくと
        target, known = lin(r, A), lin(r, A)
        ans = target + known
        if not ans.coef('a') or not known.const(): return
        u.add(f'ある式から {sh(known)} をひくと {sh(target)} になる。ある式を求めよう。', expr_answer(sh(ans)),
              f'（ある式）＝ {paren(target)} ＋ {paren(known)} ＝ {sh(ans)}', 41, 'A③', '式をひくこと（逆に考える）', [sh(target - known)], tb=74, tbnote='練習問題3(2)')
    def t8():  # ミスに注意
        p1, p2 = lin(r, A), lin(r, A)
        if p2.const() >= 0 or not p2.coef('a'): return
        wrong = p1 - Poly({('a',): p2.coef('a'), (): -p2.const()})
        start = paren(p1) + '−' + paren(p2)
        eq_q(u, f'Eさんは {start} を、かっこをはずすときに −{abs(p2.const())} の符号を変えずに計算して {sh(wrong)} と答えた。正しい答えを求めよう。', p1 - p2,
             f'かっこの前が − のときは、かっこの中のすべての項の符号を変える。{steps_txt(start, [(1, p1), (-1, p2)])}', 41, 'A③（ミスに注意）', '式をひくこと', [wrong], tb=73, tbnote='例5(2)')
    plan = [t1] * 12 + [t2] * 9 + [t3] * 10 + [t4] * 10 + [t5] * 8 + [t6] * 7 + [t7] * 7 + [t8] * 7
    return fill(u, plan)

# ---------------- 文字式と数の乗法、除法①（ワーク p42〜43・教科書 p75〜77） ----------------
def m6():
    u = Unit('workbook-math-1-moji6', 'workbook', '文字式と数の乗法、除法①', '文字式',
             '2026-10-05 Claude作成。数学ワークp42〜43（A①文字式×数・文字式÷数・A②項が2つの式と数の乗法・A③項が2つの式と数の除法・B①・B+②まちがいを直す）と教科書p75〜77（例1〜4・問1〜4・話しあおう・練習問題）を写真で確認。', tb=75)
    r = rng(1061)
    def t1():  # 単項式×数
        c = r.choice([F(rint(r, -9, 9)), rfrac(r, (3, 4, 5, 7, 10), 1, 9)]); m = r.choice([F(rint(r, -12, 12)), rfrac(r, (3, 5, 7, 10), 1, 9), F(18), F(-18)])
        v = r.choice([X, A, Y])
        if c == 0 or m == 0 or abs(m) == 1: return
        p = c * m * v
        if p.terms()[0][1].denominator > 6: return
        s = f'{sh(c * v)} × {lit_txt(m, mul=True)}'
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'数どうしをかけて、文字の前に書く。{lit_txt(c, True, mul=True)} × {lit_txt(m, mul=True)} ＝ {fmt_num(c * m)} だから {sh(p)}', 42 if c.denominator == 1 else 43, 'A①' if c.denominator == 1 else 'B①(1)', '文字式×数', [-p], tb=75, tbnote='例1・問1')
    def t2():  # 単項式÷数
        c = F(rint(r, -24, 24)); m = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4, 5), 1, 9)])
        if c == 0 or m == 0 or abs(m) == 1: return
        v = r.choice([X, Y, A]); p = c / m * v
        if p.terms()[0][1].denominator > 4: return
        s = f'{sh(c * v)} ÷ {lit_txt(m, mul=True)}'
        how = f'分数の形にして約分する（{sh(c * v)} ÷ {lit_txt(m, mul=True)} ＝ {sh(c * v)}/{fmt_num(m)}）' if m.denominator == 1 else f'わる数の逆数をかける（÷ {lit_txt(m, mul=True)} は × {lit_txt(1 / m, mul=True)}）'
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'{how}。答え {sh(p)}', 42, 'A①', '文字式÷数', [c * m * v, -p], tb=75, tbnote='例2・問2')
    def t3():  # 分配法則
        p = lin(r, r.choice([X, A, B]), frac=r.random() < .3); m = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4), 1, 9)])
        if not p.const() or abs(m) == 1 or m == 0: return
        q = m * p
        if any(w.denominator > 6 for _, w in q.terms()): return
        start = cpar(m, p) if r.random() < .6 or m.denominator != 1 else paren(p) + '×' + lit_txt(m, mul=True)
        eq_q(u, f'次の計算をしよう。\n{start}', q, f'分配法則 m(a＋b)＝ma＋mb で、かっこの中の各項に {lit_txt(m, mul=True)} をかける。{steps_txt(start, [(m, p)])}', 42, 'A②', '項が2つの式と数の乗法', [m * Poly({k: v for k, v in p.t.items() if k}) + p.const(), -q], tb=76, tbnote='例3・問3')
    def t4():  # ÷数
        m = r.choice([F(rint(r, -9, 9)), rfrac(r, (2, 3, 4, 5), 1, 9)])
        if m == 0 or abs(m) == 1: return
        q = lin(r, X, cmax=6, kmax=9); p = q * m
        if any(w.denominator > 5 for _, w in p.terms()) or not q.const(): return
        start = paren(p) + '÷' + lit_txt(m, mul=True)
        how = f'かっこの中の各項を {lit_txt(m, mul=True)} でわる。({sh(Poly({k: v for k, v in p.t.items() if k}))})÷{lit_txt(m, mul=True)} ＋ ({fmt_num(p.const())})÷{lit_txt(m, mul=True)}' if m.denominator == 1 else f'わる数の逆数 {fmt_num(1 / m)} をかける'
        eq_q(u, f'次の計算をしよう。\n{start}', q, f'{how}。答え {sh(q)}', 43, 'A③' if m.denominator == 1 else 'B①(3)', '項が2つの式と数の除法', [Poly({k: v for k, v in p.t.items() if k}) / m + p.const(), q * -1], tb=76, tbnote='例4・問4')
    def t5():  # まちがいを直す（B+②）
        m = r.randint(3, 9); a, b = r.randint(2, 9), r.randint(2, 9) * r.choice([1, -1])
        p = Poly({('a',): F(a * m), (): F(b * m)}); right = p / m
        wrong = Poly({('a',): F(a), (): F(b * m)})
        u.add(f'Fさんは ({sh(p)})÷{m} を、{sh(p)}/{m} ＝ {sh(wrong)} と計算したが、まちがっていた。正しく計算した答えを求めよう。', expr_answer(sh(right)),
              f'数の項 {fmt_num(F(b * m))} も {m} でわらなければいけない。({sh(p)})÷{m} ＝ {sh(Poly({("a",): F(a * m)}))}/{m} ＋ ({fmt_num(F(b * m))})/{m} ＝ {sh(right)}', 43, 'B+②', 'まちがいを正しく直す', [sh(wrong)], tb=77, tbnote='話しあおう')
    def t6():  # □
        m = r.randint(2, 6); a, b = rint(r, -9, 9), rint(r, -9, 9)
        if a == 0 or b == 0: return
        u.add(f'次の □ にあてはまる数を答えよう。\n(□x {"+" if b * m > 0 else "−"} {abs(b * m)}) ÷ {m} ＝ {sh(a * X + b)}', num_answer(a * m),
              f'わる前の式は {m} × ({sh(a * X + b)}) ＝ {sh(m * (a * X + b))}。だから □ ＝ {fmt_num(F(a * m))}', 43, 'A③', '項が2つの式と数の除法（逆に考える）', [str(a), str(-a * m)], tb=76, tbnote='例4')
    def t7():  # 小数
        k = r.randrange(2)
        if k == 0:
            m = r.choice([10, 100]); c, d = rdec(r, -2, 2), rdec(r, -9, 9)
            p = c * X + d; start = f'{m}({fmt_num(c, "dec")}x{"+" if d > 0 else "−"}{fmt_num(abs(d), "dec")})'
            q = m * p
        else:
            m = r.choice([100, 10]); c, d = r.randint(1, 9) * m * r.choice([1, -1]), r.randint(1, 9) * m * r.choice([1, -1])
            p = c * X + d; start = f'({sh(p)})÷{m}'; q = p / m
        eq_q(u, f'次の計算をしよう。\n{start}', q, f'小数の係数でも同じように、かっこの中の各項にかける（各項をわる）。答え {sh(q)}', 42, 'A②', '項が2つの式と数の乗法・除法', [-q], tb=77, tbnote='練習問題2(1)(2)')
    plan = [t1] * 11 + [t2] * 10 + [t3] * 12 + [t4] * 12 + [t5] * 8 + [t6] * 8 + [t7] * 9
    return fill(u, plan)

# ---------------- 文字式と数の乗法、除法②（ワーク p44〜45・教科書 p76〜77） ----------------
def m7():
    u = Unit('workbook-math-1-moji7', 'workbook', '文字式と数の乗法、除法②', '文字式',
             '2026-10-05 Claude作成。数学ワークp44〜45（A①分数の形の式に数をかける・A②かっこがある式の計算①・A③かっこがある式の計算②・B①・B+②分数の形の式の差（愛知））と教科書p76〜77（例5・問5・例題1・問6・練習問題2）を写真で確認。', tb=77)
    r = rng(1071)
    def t1():  # 分数の形×数
        d = r.choice([2, 3, 4, 5, 6]); p = lin(r, X, cmax=9, kmax=9)
        if not p.const(): return
        m = d * r.choice([1, 2, 3, -1, -2])
        q = p * F(m, d)
        s = f'({sh(p)})/{d} × {lit_txt(m, mul=True)}' if r.random() < .6 else f'{lit_txt(m, True, mul=True)} × ({sh(p)})/{d}'
        eq_q(u, f'次の計算をしよう。\n{s}', q, f'かける数と分母の数で約分してから、分配法則を使う。({sh(p)}) × {lit_txt(F(m, d), mul=True)} ＝ {sh(q)}', 44, 'A①', '分数の形の式に数をかける', [p * m, q - (F(m, d) - 1) * p.const() if False else -q], tb=76, tbnote='例5・問5')
    def t2():  # a(..)+b(..)
        p1, p2 = lin(r, X), lin(r, X); a, b = rint(r, -9, 9), rint(r, -9, 9)
        if abs(a) < 2 or abs(b) < 2 or not p2.const(): return
        start = join_signed([(a, p1), (b, p2)])
        wrong = a * p1 + b * Poly({k: v for k, v in p2.t.items() if k}) + p2.const() * abs(b)
        eq_q(u, f'次の計算をしよう。\n{start}', a * p1 + b * p2, f'それぞれのかっこをはずしてから、項をまとめる。{steps_txt(start, [(a, p1), (b, p2)])}', 44, 'A②', 'かっこがある式の計算①', [wrong], tb=77, tbnote='例題1・問6')
    def t3():  # 分数の係数
        d = r.choice([2, 3, 4, 5, 6]); q1 = lin(r, X, cmax=3) * d; c1 = F(r.choice([1, -1, 2, -3]), d)
        p2 = lin(r, X); b = rint(r, -6, 6)
        if abs(b) < 2 or q1.coef('x') == 0: return
        start = join_signed([(c1, q1), (b, p2)])
        eq_q(u, f'次の計算をしよう。\n{start}', c1 * q1 + b * p2, f'分数のときも分配法則を使って計算する。{steps_txt(start, [(c1, q1), (b, p2)])}', 45, 'A③', 'かっこがある式の計算②', [c1 * q1 - b * p2], tb=77, tbnote='問6(6)')
    def t4():  # B① いろいろ
        d1, d2 = r.choice([(4, 5), (2, 3), (3, 4), (4, 6)])
        q1, q2 = lin(r, A, cmax=3) * d1, lin(r, A, cmax=3) * d2
        c1, c2 = F(rint(r, -3, 3), d1), F(rint(r, -3, 3), d2)
        if c1 == 0 or c2 == 0 or c1.denominator == 1 or c2.denominator == 1: return
        start = join_signed([(c1, q1), (c2, q2)])
        eq_q(u, f'次の計算をしよう。\n{start}', c1 * q1 + c2 * q2, f'{steps_txt(start, [(c1, q1), (c2, q2)])}', 45, 'B①(3)', 'かっこがある式の計算', [c1 * q1 - c2 * q2], tb=77, tbnote='問6')
    def t5():  # B+② 分数の形の式の差・和
        d1, d2 = r.choice([(3, 2), (4, 6), (2, 5), (3, 4), (6, 4), (5, 3)])
        p1, p2 = lin(r, X, cmax=7), lin(r, X, cmax=7)
        if not p1.const() or not p2.const(): return
        sgn = r.choice([1, -1])
        q = p1 / d1 + sgn * p2 / d2
        L = math.lcm(d1, d2)
        num_ = p1 * (L // d1) + sgn * p2 * (L // d2)
        g = math.gcd(L, *[int(w) for _, w in num_.terms()]) if all(w.denominator == 1 for _, w in num_.terms()) else 1
        red = f'({sh(num_ / g)})/{L // g}' if L // g != 1 else sh(num_ / g)
        if len(num_.t) < 2: red = sh(q)
        s = f'({sh(p1)})/{d1} {"+" if sgn > 0 else "−"} ({sh(p2)})/{d2}'
        u.add(f'次の計算をしよう。\n{s}', expr_answer(sh(q)),
              f'通分して1つの分数にまとめる。分母を {L} にすると、{{{L // d1}({sh(p1)}) {"+" if sgn > 0 else "−"} {L // d2}({sh(p2)})}}/{L} ＝ ({sh(num_)})/{L}' + (f' ＝ {red}' if g != 1 else '') + f'。答え {red}（{sh(q)} と書いてもよい）', 45, 'B+②', '分数の形の式の和と差', [sh(p1 / d1 - sgn * p2 / d2)], tb=76, tbnote='例5')
    def t6():  # ミスに注意
        a, b = r.randint(2, 6), r.randint(2, 6); p1, p2 = lin(r, X, cmax=5), lin(r, X, cmax=5)
        if p2.const() >= 0: return
        wrong = a * p1 - b * Poly({k: v for k, v in p2.t.items() if k}) + b * p2.const()
        right = a * p1 - b * p2
        if wrong == right: return
        start = join_signed([(a, p1), (-b, p2)])
        eq_q(u, f'Gさんは {start} を計算して {sh(wrong)} と答えたが、まちがっていた。正しい答えを求めよう。', right,
             f'かっこをはずすとき、−{b} はかっこの中のすべての項にかける（符号の変え忘れに注意）。{steps_txt(start, [(a, p1), (-b, p2)])}', 44, 'A②（ミスに注意）', 'かっこがある式の計算', [wrong], tb=77, tbnote='例題1')
    def t7():  # □
        a, c = r.randint(2, 5), r.randint(2, 4); k = rint(r, -9, 9); p2 = lin(r, X, cmax=4)
        if k == 0 or not p2.const(): return
        res = a * (2 * X + k) - c * p2
        u.add(f'次の □ にあてはまる数を答えよう。\n{a}(2x {"+" if True else ""} □) − {c}({sh(p2)}) ＝ {sh(res)}', num_answer(k),
              f'左の式をかっこをはずして計算すると {sh(a * 2 * X - c * p2)} ＋ {a}×□。数の項を比べると {a}×□ ＝ {fmt_num(res.const() + c * p2.const())} だから □ ＝ {fmt_num(F(k))}', 44, 'A②', 'かっこがある式の計算（逆に考える）', [ans_str(-k), ans_str(F(k * a))], tb=77, tbnote='例題1')
    plan = [t1] * 11 + [t2] * 12 + [t3] * 10 + [t4] * 9 + [t5] * 12 + [t6] * 8 + [t7] * 8
    return fill(u, plan)

# ---------------- ふりかえりドリル（ワーク p46〜47：入試問題をふくむ） ----------------
def m8():
    u = Unit('workbook-math-1-mojireview', 'workbook', 'ふりかえりドリル', '文字式',
             '2026-10-05 Claude作成。数学ワークp46〜47（①式の値〜⑧かっこがある式の計算。大阪・千葉・栃木・山口・岩手・高知・鳥取・新潟・愛知の入試問題をふくむ）を写真で確認し、教科書p66〜77の該当箇所と照らして入試レベルに作り直した。')
    r = rng(1081)
    def t1():  # 式の値
        k = r.randrange(3)
        if k == 0:
            a = rint(r, -9, 9); p = rint(r, -9, 9) * A + rint(r, -9, 9)
            if not p.coef('a') or abs(a) < 2: return
            v = p.val(a=a); u.add(f'a＝{fmt_num(F(a))} のとき、{sh(p)} の値を求めよう。', num_answer(v), f'{subst(p, {"a": a})}', 46, '①(1)', '式の値', [ans_str(-v)], tb=66, tbnote='例1')
        elif k == 1:
            x = r.choice([-2, -3, -5, 2, 4]); n = r.choice([10, 12, 20, 30, 60]); c = r.choice([1, -1])
            if n % x: return
            v = F(x * x) + c * F(n, x)
            u.add(f'x＝{fmt_num(F(x))} のとき、x² {"+" if c > 0 else "−"} {n}/x の値を求めよう。', num_answer(v), f'x² ＝ {lit_txt(x, mul=True) if x < 0 else x}² ＝ {x * x}、{n}/x ＝ {ex(n, "÷", x)} ＝ {fmt_num(F(n, x))}。だから {ex(x * x, "+" if c > 0 else "−", F(n, x))} ＝ {fmt_num(v)}', 46, '①(2)', '式の値', [ans_str(F(x * x) - c * F(n, x)), ans_str(-F(x * x) + c * F(n, x))], tb=67, tbnote='例3・例4')
        else:
            a, b = rint(r, -9, 9), rint(r, -9, 9); p = rint(r, -9, 9) * A + rint(r, -9, 9) * B
            if len(p.t) < 2: return
            v = p.val(a=a, b=b); u.add(f'a＝{fmt_num(F(a))}、b＝{fmt_num(F(b))} のとき、{sh(p)} の値を求めよう。', num_answer(v), f'{subst(p, {"a": a, "b": b})}', 46, '①(3)', '式の値', [ans_str(-v)], tb=68, tbnote='例6')
    def t2():  # 項をまとめる
        k = r.randrange(2)
        if k == 0:
            c1, c2 = rfrac(r, (3, 5, 4, 6), 1, 13), rfrac(r, (3, 5, 4, 6), 1, 13)
            items = [(('a',), c1), (('a',), c2)]
        else:
            c1, c2 = rdec(r, -3, 3), rdec(r, -3, 3); items = [(('x',), c1), ((), F(rint(r, -9, 9))), (('x',), c2)]
        p = Poly({}); [p := p + Poly({kk: w}) for kk, w in items]
        s = alg.terms_txt(items)
        if k == 1: s = s.replace(f'{abs(c1.numerator)}x/{c1.denominator}', fmt_num(abs(c1), 'dec') + 'x').replace(f'{abs(c2.numerator)}x/{c2.denominator}', fmt_num(abs(c2), 'dec') + 'x')
        if '/' in s and k == 1: return
        eq_q(u, f'次の計算をしよう。\n{s}', p, f'文字の部分が同じ項どうし、数の項どうしをまとめる。答え {sh(p)}', 46, '②', '項をまとめる', [-p], tb=71, tbnote='例3・例4')
    def t3():  # かっこをはずす
        p1, p2 = lin(r, A, frac=r.random() < .3), lin(r, A)
        sgn = r.choice([1, -1])
        if not p2.const(): return
        start = sh(p1) + ('+' if sgn > 0 else '−') + paren(p2)
        eq_q(u, f'次の計算をしよう。\n{start}', p1 + sgn * p2, f'{steps_txt(start, [(1, p1), (sgn, p2)])}', 46, '③', 'かっこをはずして計算する', [p1 - sgn * p2], tb=73, tbnote='例5')
    def t4():  # 式をたす・ひく
        p1, p2 = lin(r, X), lin(r, X)
        start = paren(p1) + '−' + paren(p2)
        eq_q(u, f'次の計算をしよう。\n{start}', p1 - p2, f'{steps_txt(start, [(1, p1), (-1, p2)])}', 46, '④', '式をたすこと、式をひくこと', [p1 + p2], tb=74, tbnote='例6')
    def t5():  # 項が2つの式と数の乗法
        m = r.choice([F(6), F(-4, 7), F(3, 2), F(-6), F(8), F(-2, 3)]); den = m.numerator if m.denominator != 1 else 1
        p = r.choice([F(3, 2), F(-7), F(5, 4), F(1, 3), F(9)]) * X + rint(r, -21, 21)
        q = m * p
        if any(w.denominator > 4 for _, w in q.terms()) or not p.const(): return
        start = cpar(m, p) if m.denominator == 1 else paren(p) + '×' + lit_txt(m, mul=True)
        eq_q(u, f'次の計算をしよう。\n{start}', q, f'{steps_txt(start, [(m, p)])}', 47, '⑤', '項が2つの式と数の乗法', [-q], tb=76, tbnote='例3')
    def t6():  # 除法
        m = r.choice([F(4, 3), F(-6), F(-5, 6), F(3), F(-2, 3)]); q = lin(r, X, cmax=6)
        p = q * m
        if any(w.denominator > 6 for _, w in p.terms()) or not q.const(): return
        start = paren(p) + '÷' + lit_txt(m, mul=True)
        eq_q(u, f'次の計算をしよう。\n{start}', q, f'わる数が分数のときは逆数をかける。÷ {lit_txt(m, mul=True)} ＝ × {lit_txt(1 / m, mul=True)}。答え {sh(q)}', 47, '⑥', '項が2つの式と数の除法', [p * m, -q], tb=76, tbnote='例4')
    def t7():  # 分数の形に数をかける
        d = r.choice([2, 3, 4]); p = lin(r, A, cmax=9); m = d * r.choice([2, -4, 3, -2])
        if not p.const(): return
        s = r.choice([f'{lit_txt(m, True, mul=True)} × ({sh(p)})/{d}', f'({sh(p)})/{d} × {lit_txt(m, mul=True)}'])
        eq_q(u, f'次の計算をしよう。\n{s}', p * F(m, d), f'約分してから分配法則。答え {sh(p * F(m, d))}', 47, '⑦', '分数の形の式に数をかける', [p * m], tb=76, tbnote='例5')
    def t8():  # かっこがある式
        d1, d2 = r.choice([(3, 5), (2, 3), (4, 5), (2, 7)])
        q1, q2 = lin(r, X, cmax=3) * d1, lin(r, X, cmax=3) * d2
        c1, c2 = F(r.choice([1, 2, -1]), d1), F(r.choice([-1, 1, -3]), d2)
        start = join_signed([(c1, q1), (c2, q2)])
        eq_q(u, f'次の計算をしよう。\n{start}', c1 * q1 + c2 * q2, f'{steps_txt(start, [(c1, q1), (c2, q2)])}', 47, '⑧', 'かっこがある式の計算', [c1 * q1 - c2 * q2], tb=77, tbnote='問6')
    plan = [t1] * 10 + [t2] * 8 + [t3] * 8 + [t4] * 8 + [t5] * 9 + [t6] * 9 + [t7] * 8 + [t8] * 10
    return fill(u, plan)

# ---------------- 関係を表す式（ワーク p48〜49・教科書 p78〜81） ----------------
def m9():
    u = Unit('workbook-math-1-relation', 'workbook', '関係を表す式', '文字式',
             '2026-10-05 Claude作成。数学ワークp48〜49（A①等式・A②不等式・A③≧≦を使う不等式・B①式が表すこと・B②リボンの不等式・B+③おつりの不等式）と教科書p78〜81（例1〜4・問1〜7・練習問題1・2）を写真で確認。', tb=78)
    r = rng(1091)
    def rel_q(text, ans, expl, page, no, topic, near=(), tb=78, tbnote='', units=None):
        u.add(f'次の数量の関係を、{"等式" if "=" in ans else "不等式"}に表そう。\n{text}', relation_answer(ans, units), expl, page, no, topic, list(near), tb=tb, tbnote=tbnote)
    def t1():  # 等式
        k = r.randrange(5)
        if k == 0: d = r.randint(2, 9); rel_q(f'ある日の最高気温 a ℃ は、最低気温 b ℃ より {d} ℃ 高かった。', f'a=b+{d}', f'（最高気温）＝（最低気温）＋{d}。a＝b＋{d}（a−b＝{d} などでもよい）', 48, 'A①', '等しい関係を表す式', [f'a=b−{d}', f'a+{d}=b'], tbnote='例1・問2')
        elif k == 1: n = r.randint(3, 9); rel_q(f'1個 x 円のケーキ {n} 個の代金は y 円である。', f'{n}x=y', f'代金は {n}x 円。これが y 円に等しい。{n}x＝y', 48, 'A①', '等しい関係を表す式', [f'x={n}y'], tbnote='問2(1)')
        elif k == 2: m = r.choice([500, 1000]); rel_q(f'{m} 円出して a 円のコンパスを買うと、おつりは b 円である。', f'{m}−a=b', f'（出したお金）−（代金）＝（おつり）。{m}−a＝b', 48, 'A①', '等しい関係を表す式', [f'a−{m}=b'], tbnote='問2(2)')
        elif k == 3: p, q = r.randint(2, 4), r.randint(2, 6); rel_q(f'y 冊のノートを、1人に {p} 冊ずつ x 人に分けようとすると {q} 冊たりなかった。', f'y={p}x−{q}', f'分けるのに必要なのは {p}x 冊。y 冊はそれより {q} 冊少ない。y＝{p}x−{q}', 48, 'A①', '等しい関係を表す式', [f'y={p}x+{q}'], tbnote='例2')
        else: p, q = r.choice([400, 300, 500]), r.choice([100, 200, 300]); rel_q(f'a 人が1人 {p} 円ずつ出して b 円のボールを買ったところ、{q} 円残った。', f'{p}a−b={q}', f'集めたお金は {p}a 円。そこから b 円をひくと {q} 円。{p}a−b＝{q}', 48, 'A①', '等しい関係を表す式', [f'{p}a+b={q}', f'{p}a−b=−{q}'], tbnote='問3・練習問題1')
    def t2():  # 不等式（＜＞）
        k = r.randrange(4)
        if k == 0: m, s, n = r.randint(2, 5), r.randint(1, 9), r.randint(1, 9); rel_q(f'ある数 x の {m} 倍から {s} をひくと、{n} より小さい。', f'{m}x−{s}<{n}', f'{m}x−{s} が {n} より小さいので {m}x−{s}＜{n}', 48, 'A②', '大小関係を表す式', [f'{m}x−{s}>{n}', f'{m}x−{s}≦{n}'], tb=79, tbnote='問4(1)')
        elif k == 1: d, k2 = r.choice([200, 300]), r.choice([100, 150]); rel_q(f'a mL 入りのジュースを {d} mL 飲むと、残りは {k2} mL より多い。', f'a−{d}>{k2}', f'残りは a−{d}（mL）。{k2} より多いので a−{d}＞{k2}', 48, 'A②', '大小関係を表す式', [f'a−{d}<{k2}', f'a−{d}≧{k2}'], tb=79, tbnote='問4(2)')
        elif k == 2: p, q, m = r.randint(3, 9), r.randint(2, 5), r.choice([1000, 2000]); rel_q(f'1個 x 円のりんご {p} 個と1個 y 円のみかん {q} 個を買ったときの代金は {m} 円未満である。', f'{p}x+{q}y<{m}', f'「未満」は「より小さい」。{p}x＋{q}y＜{m}', 48, 'A②', '大小関係を表す式', [f'{p}x+{q}y≦{m}'], tb=79, tbnote='問4')
        else: v = r.randint(3, 6); rel_q(f'a km の道のりを時速 {v} km で歩くと、かかる時間は b 時間より多い。', f'a/{v}>b', f'かかる時間は a/{v} 時間。b より多いので a/{v}＞b', 48, 'A②', '大小関係を表す式', [f'{v}a>b', f'a/{v}<b'], tb=79, tbnote='問4')
    def t3():  # ≧ ≦
        k = r.randrange(4)
        if k == 0: n = r.choice([20, 24, 32]); rel_q(f'1辺の長さが a cm の正方形の周の長さは、{n} cm 以上になる。', f'4a≧{n}', f'周の長さは 4a cm。「以上」は ≧ を使う。4a≧{n}', 49, 'A③', '≧、≦を使った不等式', [f'4a>{n}', f'a≧{n}'], tb=80, tbnote='例3・問5')
        elif k == 1: g, w, t = r.choice([4, 5]), r.choice([200, 300]), r.choice([300, 500]); rel_q(f'1個 {g} g の角砂糖 x 個を、重さ {w} g のびんに入れると、全体の重さは {t} g 以下になる。', f'{w}+{g}x≦{t}', f'全体の重さは {w}＋{g}x（g）。「以下」は ≦。{w}＋{g}x≦{t}', 49, 'A③', '≧、≦を使った不等式', [f'{w}+{g}x<{t}'], tb=80, tbnote='例3・問5')
        elif k == 2: p, q, m = r.randint(3, 6), r.randint(2, 4), r.choice([800, 1000]); rel_q(f'1本 a 円の鉛筆 {p} 本と1冊 b 円のノート {q} 冊を買ったときの代金は {m} 円以下だった。', f'{p}a+{q}b≦{m}', f'代金は {p}a＋{q}b（円）。「以下」は ≦。', 49, 'A③', '≧、≦を使った不等式', [f'{p}a+{q}b<{m}', f'{p}a+{q}b≧{m}'], tb=80, tbnote='問5')
        else: m = r.choice([1000, 1200, 1500]); rel_q(f'x 円の本と y 円のブックカバーの両方を、{m} 円あれば買うことができる。', f'x+y≦{m}', f'代金の合計 x＋y が {m} 円以下なら買える。x＋y≦{m}', 49, 'A③', '≧、≦を使った不等式', [f'x+y<{m}', f'x+y≧{m}'], tb=80, tbnote='問5(2)')
    def t4():  # 式が表すこと（B①）
        p, q = r.randint(2, 4), r.randint(2, 4); total = r.choice([3600, 5800, 9000])
        k = r.randrange(2)
        if k == 0:
            opts = [f'おとな {p} 人と子ども1人の入館料の合計が {total} 円', f'おとな1人と子ども {p} 人の入館料の合計が {total} 円', f'おとな {p} 人の入館料が子ども1人より {total} 円高い', f'おとな {p} 人と子ども1人の入館料の合計が {total} 円以下']
            r.shuffle(opts); ans = LETTERS[opts.index(f'おとな {p} 人と子ども1人の入館料の合計が {total} 円')]
            u.add(f'ある美術館の入館料は、おとな1人が a 円、子ども1人が b 円である。等式 {p}a＋b＝{total} は、どんなことを表しているか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
                  f'{p}a はおとな {p} 人分、b は子ども1人分。＝ はちょうど等しいこと。正解：{ans}', 49, 'B①(1)', '関係を表す式の意味', tb=80, tbnote='例4・問6')
        else:
            opts = [f'おとな {p} 人分の入館料は、子ども {q} 人分の入館料以下である', f'おとな {p} 人分の入館料は、子ども {q} 人分の入館料より高い', f'おとな {q} 人分の入館料は、子ども {p} 人分の入館料以下である', f'おとな1人と子ども1人の入館料の合計は {p + q} 円以下である']
            r.shuffle(opts); ans = LETTERS[opts.index(f'おとな {p} 人分の入館料は、子ども {q} 人分の入館料以下である')]
            u.add(f'ある美術館の入館料は、おとな1人が a 円、子ども1人が b 円である。不等式 {p}a≦{q}b は、どんなことを表しているか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
                  f'≦ は「以下」。{p}a≦{q}b は、おとな {p} 人分が子ども {q} 人分以下であることを表す。正解：{ans}', 49, 'B①(2)', '関係を表す式の意味', tb=80, tbnote='問6(4)')
    def t5():  # リボン（B②）
        n, m = r.randint(2, 6), r.randint(1, 5)
        word = r.choice([('短い', '<'), ('長い', '>'), ('以上', '≧'), ('以下', '≦')])
        rel_q(f'x m のリボンから、y m のリボンを {n} 本切り取ると、残りは {m} m {"より" if word[0] in ("短い", "長い") else ""}{word[0]}。', f'x−{n}y{word[1]}{m}',
              f'残りは x−{n}y（m）。「{word[0]}」なので {word[1]} を使う。x−{n}y{word[1]}{m}', 49, 'B②', '大小関係を表す式', [f'x−y{word[1]}{m}', f'x+{n}y{word[1]}{m}'], tb=79, tbnote='問4(2)')
    def t6():  # おつりがもらえる（B+③）
        m, p = r.choice([(1000, 200), (2000, 300), (1000, 150), (500, 80)])
        opts = [f'{m}−{p}x≦0', f'{m}−{p}x>0', f'{m}≦{p}x', f'{m}−{p}x<0']
        word = r.choice(['おつりがもらえる', 'お金がたりない（おつりがもらえない）'])
        good = [f'{m}−{p}x>0'] if word == 'おつりがもらえる' else [f'{m}−{p}x<0']
        r.shuffle(opts); ans = [LETTERS[opts.index(g)] for g in good]
        u.add(f'{m} 円を出して、{p} 円のケーキを x 個買うと{word}という関係を表している不等式を、次のア〜エから選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer(ans),
              f'（出したお金）−（代金）が{"正（0より大きい）ならおつりがもらえる" if word == "おつりがもらえる" else "負（0より小さい）ならお金がたりない"}。正解：' + '、'.join(ans), 49, 'B+③', '不等式の意味', tb=81, tbnote='練習問題2')
    def t7():  # 左辺・右辺
        a, b, c = r.randint(2, 9), r.randint(2, 9), r.randint(2, 9)
        side = r.choice(['左辺', '右辺'])
        eq = f'{a}x−{b}={c}y'
        val = f'{a}x−{b}' if side == '左辺' else f'{c}y'
        u.add(f'等式 {eq} の{side}を答えよう。', expr_answer(val), f'等号の左側の式が左辺、右側の式が右辺。{side}は {val}', 48, 'A①', '左辺と右辺', [f'{c}y' if side == '左辺' else f'{a}x−{b}'], tb=78, tbnote='問1')
    def t8():  # 兄弟の買い物（問7）
        A_, B_ = r.choice([(1500, 500), (2000, 800), (3000, 1000)])
        opts = ['兄の残金は、弟の残金の2倍より多い', '兄の残金は、弟の残金の2倍より少ない', '兄が買った本の値段は、弟のノートの値段の2倍より高い', '兄の残金と弟の残金の合計は2倍になる']
        r.shuffle(opts); ans = LETTERS[opts.index('兄の残金は、弟の残金の2倍より多い')]
        u.add(f'兄は {A_} 円、弟は {B_} 円持って買い物に行き、兄は a 円の本、弟は b 円のノートを買った。不等式 {A_}−a＞2({B_}−b) はどんなことを表しているか。次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
              f'{A_}−a は兄の残金、{B_}−b は弟の残金。＞ は「より大きい（多い）」。正解：{ans}', 49, 'B①', '不等式の意味', tb=81, tbnote='問7')
    plan = [t1] * 12 + [t2] * 10 + [t3] * 10 + [t4] * 8 + [t5] * 9 + [t6] * 6 + [t7] * 7 + [t8] * 8
    return fill(u, plan)
