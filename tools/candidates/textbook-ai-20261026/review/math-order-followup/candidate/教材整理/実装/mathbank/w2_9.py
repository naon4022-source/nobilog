import itertools, math
from fractions import Fraction as F
from bank import Unit, expr_q, num_answer, nums_answer, choice_answer, exact_answer, rng, explain
from helpers import rint, rfrac, rdec, sum_chain
from expr import C, L, D, Lit, Grp, Pow, Neg, show, fmt_num, ans_str

def nice(v, dmax=12, amax=400): return v.denominator <= dmax and abs(v) <= amax

def fill(u, plan, limit=20000):
    i = 0
    while len(u.qs) < 70:
        try: plan[i % len(plan)]()
        except (ZeroDivisionError, IndexError): pass
        i += 1
        if i > limit: raise SystemExit(f'{u.uid}: {len(u.qs)}問しか作れない')
    u.qs = u.qs[:70]
    for k, q in enumerate(u.qs, 1): q['id'] = f'{u.uid}-{k}'
    return u

def numlit(r, kinds=('int', 'dec', 'frac'), lo=-12, hi=12):
    k = r.choice(kinds)
    if k == 'int': return Lit(F(rint(r, lo, hi)), 'int')
    if k == 'dec': return Lit(rdec(r, lo / 2, hi / 2), 'dec')
    return Lit(rfrac(r, (2, 3, 4, 5, 6, 8, 9), 1, 11), 'frac')

# ---------------- 乗法、除法① ----------------
def w2():
    u = Unit('workbook-math-1-muldiv1', 'workbook', '乗法、除法①', '正負の数', '2026-10-05 Claude作成。数学ワークp12〜13（1章6 乗法、除法①）の2数の積を参考に、小数・分数・工夫して計算・符号の推論・逆算へ作り直した。')
    r = rng(201)
    def t1():
        a, b = numlit(r, ('dec', 'frac', 'int'), -15, 15), numlit(r, ('dec', 'frac'), -15, 15)
        e = C(a, '×', b)
        if nice(e.val(), 12) and e.val().denominator != 1 or e.val().denominator == 1 and abs(e.val()) > 6: expr_q(u, e, 13, 'B①(4)', '2数の積・小数と分数')
    def t2():
        a = r.choice([25, 125, 0.25, 2.5, 12.5, 50, 0.125]); b = r.choice([4, 8, 16, 24, 36, 44, 48, 64, 88, 32])
        a, b = F(str(a)) * r.choice([1, -1]), F(b) * r.choice([1, -1])
        ka = 'dec' if a.denominator != 1 else 'int'
        expr_q(u, C(Lit(b, 'int'), '×', Lit(a, ka)) if r.random() < .5 else C(Lit(a, ka), '×', Lit(b, 'int')), 13, 'B①(5)', '工夫して計算する積')
    def t3():
        a, b, c, d = rint(r, 2, 9), rint(r, 2, 9), rint(r, 2, 9), rint(r, 2, 9)
        best = None
        for s1, s2 in itertools.product([1, -1], repeat=2):
            v = F(-a) * (s1 * b) + (s2 * c) * F(-d)
            if best is None or v < best[0]: best = (v, s1, s2)
        u.add(f'次の式の ○ に「＋」か「−」の符号を1つずつ書き入れて、計算結果がもっとも小さくなるようにする。そのときの計算結果を答えよう。\n(−{a}) × (○{b}) + (○{c}) × (−{d})', num_answer(best[0]),
              f'(−{a})×(○{b}) を小さくするには ○ を＋、(○{c})×(−{d}) を小さくするには ○ を＋にする。結果は −{a*b} + (−{c*d}) ＝ {fmt_num(best[0])}。', 13, 'B+②', '積の符号を決める', [ans_str(-best[0])])
    def t4():
        conds = [('a＜0、b＞0', -2, 3), ('a＞0、b＜0', 2, -3), ('a＜0、b＜0', -2, -3)]
        cnd, a, b = r.choice(conds)
        exprs = [('a×b', a * b), ('a×a', a * a), ('(−a)×b', -a * b), ('a×(−b)', a * (-b)), ('(−a)×(−b)', (-a) * (-b)), ('−a×a', -a * a)]
        r.shuffle(exprs); exprs = exprs[:4]; letters = 'アイウエ'
        neg = [letters[i] for i, (_, v) in enumerate(exprs) if v < 0]
        if not neg: return
        txt = '　'.join(f'{letters[i]} {s}' for i, (s, _) in enumerate(exprs))
        u.add(f'{cnd} のとき、次のうち値がかならず負の数になるものをすべて選び、記号で答えよう。\n{txt}', choice_answer(neg),
              '符号だけを考える。異符号の2数の積は負、同符号の2数の積は正。−a は a と符号が反対の数。正解：' + '、'.join(neg), 12, 'A①・A②', '積の符号')
    def t5():
        x, y = rint(r, -15, 15), rint(r, -15, 15)
        if x == y or x * y >= 0 and r.random() < .5: return
        p, s = x * y, x + y
        u.add(f'2つの整数があり、その積は {fmt_num(F(p))}、和は {fmt_num(F(s))} である。この2つの整数を答えよう（読点で区切る）。', nums_answer([x, y]),
              f'積が{"負" if p < 0 else "正"}なので、2数は{"異符号" if p < 0 else "同符号"}。和が {fmt_num(F(s))} になる組をさがすと {fmt_num(F(x))} と {fmt_num(F(y))}。', 13, 'A③', '積と和から2数を求める')
    def t6():
        a = r.choice([F(3, 2), F(5, 2), F(7, 10), F(9, 10), F(6, 5), F(13, 10), F(11, 4)])
        u.add(f'絶対値が等しく、符号が異なる2つの数の積が {fmt_num(-a * a, "dec")} である。2つの数のうち正のほうを答えよう。', num_answer(a),
              f'2数を a と −a とすると、積は −a²。a² ＝ {fmt_num(a*a, "dec")} だから a ＝ {fmt_num(a, "dec")}。', 12, 'A②', '異符号の2数の積', [ans_str(-a), ans_str(a * a)])
    def t7():
        a = numlit(r, ('int', 'dec'), -12, 12); x = numlit(r, ('int', 'dec', 'frac'), -9, 9)
        p = a.v * x.v
        if not nice(p, 20): return
        u.add(f'次の □ にあてはまる数を答えよう。\n{a.render(True)} × □ ＝ {fmt_num(p, "dec" if p.denominator in (2,4,5,10,20,25,50,100) else None)}', num_answer(x.v),
              f'□ ＝ {fmt_num(p)} ÷ ({fmt_num(a.v)}) ＝ {fmt_num(x.v)}。積の符号から先に □ の符号を決めるとまちがえにくい。', 12, 'A②', '積から1つの数を求める', [ans_str(-x.v)])
    def t8():
        items = []
        for _ in range(4):
            a, b = numlit(r, ('int', 'dec'), -12, 12), numlit(r, ('int', 'dec', 'frac'), -12, 12)
            items.append(C(a, '×', b))
        vals = [e.val() for e in items]
        if len(set(vals)) < 4: return
        letters = 'アイウエ'; best = letters[vals.index(max(vals))]
        txt = '　'.join(f'{letters[i]} {show(e)}' for i, e in enumerate(items))
        u.add(f'次の積のうち、もっとも大きいものを記号で答えよう。\n{txt}', choice_answer([best]), '各積は ' + '、'.join(f'{letters[i]}＝{fmt_num(v)}' for i, v in enumerate(vals)) + '。', 13, 'B①', '積の大小')
    def t9():
        d = rdec(r, 0.5, 4.5); n = r.randint(3, 12)
        u.add(f'ある日の気温は、正午から毎時間 {fmt_num(d, "dec")}℃ ずつ下がった。正午の気温を基準（0）とすると、正午の {n} 時間前の気温は何℃と表せるか。上がる方向を＋として答えよう。', {'kind': 'number', 'value': ans_str(d * n), 'units': ['℃', '度']},
              f'1時間に −{fmt_num(d, "dec")}℃ 変化、時間は −{n}（{n}時間前）。(−{fmt_num(d,"dec")})×(−{n}) ＝ +{fmt_num(d*n, "dec")}（℃）。', 12, 'A③（ポイント1-18）', '負の数×負の数の意味', [ans_str(-d * n)])
    plan = [t1] * 9 + [t2] * 8 + [t3] * 6 + [t4] * 7 + [t5] * 8 + [t6] * 6 + [t7] * 9 + [t8] * 7 + [t9] * 6
    return fill(u, plan)

# ---------------- 乗法、除法② ----------------
def w3():
    u = Unit('workbook-math-1-muldiv2', 'workbook', '乗法、除法②', '正負の数', '2026-10-05 Claude作成。数学ワークp14〜15（1章7 乗法、除法②）の除法・小数の乗除を参考に、わり切れない商・小数でわる計算・逆算・まちがい直しへ作り直した。')
    r = rng(301)
    def t1():
        a, b = rint(r, -60, 60), rint(r, -16, 16)
        if a % b == 0 or math.gcd(a, b) == 1 or abs(b) in (1, 10) or abs(a) < 12: return
        expr_q(u, C(L(a), '÷', L(b)), 15, 'B①(1)', 'わり切れない除法（分数で答える）')
    def t2():
        a, b = rdec(r, -9, 9, 2), rdec(r, -3, 3, 1)
        q = a / b
        if q.denominator not in (1, 2, 4, 5, 10, 20) or abs(q) > 60: return
        expr_q(u, C(Lit(a, 'dec'), '÷', Lit(b, 'dec')), 15, 'A③(6)', '小数でわる除法')
    def t3():
        a, b = rint(r, -30, 30), rdec(r, -2, 2, 1)
        expr_q(u, C(L(a), '÷', Lit(b, 'dec')), 15, 'B①(3)', '整数÷小数（分数で答える）')
    def t4():
        a, b = rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12, 14, 15), 1, 13), rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12, 14, 15), 1, 13)
        e = C(Lit(a, 'frac'), '×', Lit(b, 'frac'))
        if nice(e.val(), 30) and math.gcd(a.numerator, b.denominator) * math.gcd(b.numerator, a.denominator) > 1: expr_q(u, e, 15, 'B+②', '分数の乗法・約分')
    def t5():
        a, x = numlit(r, ('dec', 'frac'), -10, 10), numlit(r, ('int', 'dec'), -20, 20)
        q = x.v / a.v
        if not nice(q, 12): return
        u.add(f'次の □ にあてはまる数を答えよう。\n□ ÷ {a.render(False)} ＝ {fmt_num(q)}', num_answer(x.v), f'□ ＝ {fmt_num(q)} × ({fmt_num(a.v)}) ＝ {fmt_num(x.v)}。', 14, 'A①', '除法の逆算', [ans_str(-x.v), ans_str(q / a.v)])
    def t6():
        a = numlit(r, ('int', 'dec'), -9, 9); x = numlit(r, ('int', 'dec'), -20, 20)
        wrong = x.v * a.v; right = x.v / a.v
        if not nice(right, 12): return
        u.add(f'ある数を {a.render(True)} でわるところを、まちがえて {a.render(True)} をかけてしまったので、答えが {fmt_num(wrong)} になった。正しい答えを求めよう。', num_answer(right),
              f'まずある数を求める：{fmt_num(wrong)} ÷ ({fmt_num(a.v)}) ＝ {fmt_num(x.v)}。正しい答えは {fmt_num(x.v)} ÷ ({fmt_num(a.v)}) ＝ {fmt_num(right)}。', 14, 'A①', '逆算・まちがい直し', [ans_str(x.v), ans_str(-right)])
    def t7():
        days = r.randint(4, 8); vals = [rdec(r, -4, 3) for _ in range(days)]
        s = sum(vals); avg = s / days
        if avg.denominator not in (1, 2, 4, 5, 10, 20, 25, 50): return
        u.add(f'ある池の水位を、前の日との差で記録した（上がった＝＋）。{days}日間の記録は {"、".join(fmt_num(v, "dec") for v in vals)}（cm）。1日あたり平均何cm変化したか答えよう。', {'kind': 'number', 'value': ans_str(avg), 'units': ['cm']},
              f'合計 {fmt_num(s, "dec")} を {days} でわる。{fmt_num(s, "dec")} ÷ {days} ＝ {fmt_num(avg, "dec")}（cm）。', 15, 'A③(5)', '小数の除法の利用', [ans_str(-avg), ans_str(s)])
    def t8():
        items = [C(numlit(r, ('int', 'dec'), -20, 20), '÷', numlit(r, ('int', 'dec', 'frac'), -6, 6)) for _ in range(4)]
        vals = [e.val() for e in items]
        if len(set(vals)) < 4: return
        letters = 'アイウエ'; small = letters[vals.index(min(vals))]
        u.add('次の商のうち、もっとも小さいものを記号で答えよう。\n' + '　'.join(f'{letters[i]} {show(e)}' for i, e in enumerate(items)), choice_answer([small]),
              '各商は ' + '、'.join(f'{letters[i]}＝{fmt_num(v)}' for i, v in enumerate(vals)) + '。負の数どうしは絶対値が大きいほど小さい。', 15, 'B①', '商の大小')
    def t9():
        a = rdec(r, -2, 2, 2); b = rdec(r, -3, 3, 1)
        p = a * b
        if p.denominator > 1000: return
        expr_q(u, C(Lit(a, 'dec'), '×', Lit(b, 'dec')), 15, 'A③(2)', '小数どうしの乗法・小数点の位置', extra_near=[p * 10, p / 10])
    plan = [t1] * 9 + [t2] * 9 + [t3] * 7 + [t4] * 9 + [t5] * 8 + [t6] * 8 + [t7] * 6 + [t8] * 6 + [t9] * 8
    return fill(u, plan)

# ---------------- 乗法、除法③ ----------------
def w4():
    u = Unit('workbook-math-1-muldiv3', 'workbook', '乗法、除法③', '正負の数', '2026-10-05 Claude作成。数学ワークp16〜17（1章8 乗法、除法③）の逆数・分数の除法・3数以上の乗除・まちがい直しを参考に作り直した。')
    r = rng(401)
    def t1():
        v = r.choice([rdec(r, -3, 3, 1), rdec(r, -3, 3, 2), rfrac(r, (3, 5, 7, 9, 11), 1, 20)])
        if v == 0 or abs(v) == 1 or v.denominator == 1 or v.denominator == 100 and v.numerator % 5 != 0 and v.numerator % 2 != 0 and abs(v.numerator) > 30: return
        kind = 'dec' if v.denominator in (2, 4, 5, 10, 20, 25, 50, 100) else None
        u.add(f'{fmt_num(v, "dec" if kind else None)} の逆数を答えよう。', num_answer(1 / v), f'積が1になる数が逆数。{fmt_num(v)} ＝ {ans_str(v)}（分数に直す）なので逆数は {fmt_num(1 / v)}。符号はそのまま。', 16, 'A①', '逆数', [ans_str(-1 / v), ans_str(-v)])
    def t2():
        v = rfrac(r, (2, 3, 4, 5, 7), 1, 11)
        u.add(f'{fmt_num(v)} と、その逆数の和を答えよう。', num_answer(v + 1 / v), f'逆数は {fmt_num(1 / v)}。和は {fmt_num(v)} + ({fmt_num(1 / v)}) ＝ {fmt_num(v + 1 / v)}。', 16, 'A①', '逆数', [ans_str(v - 1 / v)])
    def t3():
        e = C(Lit(rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12), 1, 15), 'frac'), '÷', Lit(rfrac(r, (3, 4, 5, 6, 9, 10, 15), 1, 15), 'frac'), '÷', Lit(rfrac(r, (2, 3, 5, 7), 1, 9), 'frac'))
        if nice(e.val(), 60): expr_q(u, e, 17, 'B①(3)', '分数の除法（逆数をかける）', extra_near=[C(*([e.first] + [x for op, el in e.rest for x in ('×', el)])).val()])
    def t4():
        n = r.randint(4, 5); fs = [L(rint(r, -9, 9)) for _ in range(n)]
        e = C(fs[0], *[x for f in fs[1:] for x in ('×', f)])
        if abs(e.val()) < 2000: expr_q(u, e, 16, 'A③(4)', '3数以上の乗法・積の符号')
    def t5():
        parts = [numlit(r, ('int', 'frac', 'dec'), -12, 12) for _ in range(3)]
        ops = [r.choice('×÷'), r.choice('×÷')]
        e = C(parts[0], ops[0], parts[1], ops[1], parts[2])
        if nice(e.val(), 30, 300): expr_q(u, e, 17, 'A④', '乗除の混じった計算（÷を×になおす）')
    def t6():
        n = r.randint(4, 7); k = r.randint(1, 3)
        terms = [F(-(i + 1), 1) if i % k == 0 else F(i + 1) for i in range(n)]
        e = C(L(terms[0]), *[x for t in terms[1:] for x in ('×', L(t))])
        expr_q(u, e, 16, 'A③（ポイント1-23）', '負の数の個数と積の符号')
    def t7():
        a, b, c = rint(r, -60, 60), rint(r, 2, 8) * r.choice([1, -1]), rint(r, 2, 6) * r.choice([1, -1])
        right = F(a) / b / c; wrong = F(a) / (F(b) / c)
        if right == wrong or not nice(right, 12) or not nice(wrong, 12): return
        u.add(f'Bさんは {fmt_num(F(a))} ÷ {L(b).render(False)} ÷ {L(c).render(False)} を、後ろの {L(b).render(False)} ÷ {L(c).render(False)} から先に計算して {fmt_num(wrong)} と答えた。正しい答えを求めよう。', num_answer(right),
              f'除法は左から順に計算する（÷ を × になおすと {fmt_num(F(a))} × (1/{b}) × (1/{c})）。正しい答えは {fmt_num(right)}。', 17, 'B+②', 'まちがいを正しく直す', [ans_str(wrong)])
    def t8():
        cases = [('a＜0、b＞0、a×b×c＞0', '負'), ('a＞0、b＞0、a×b×c＜0', '負'), ('a＜0、b＜0、a×b÷c＞0', '正'), ('a＜0、b＞0、a÷b×c＜0', '正'), ('a×b＜0、a×b×c＞0', '負')]
        cnd, ansv = r.choice(cases)
        u.add(f'{cnd} のとき、c は正の数か負の数か。「ア 正の数」「イ 負の数」から選び、記号で答えよう。', choice_answer(['ア' if ansv == '正' else 'イ']),
              f'わかっている数の符号から、残りの符号を決める。c は {ansv}の数。', 16, 'A③（ポイント1-23）', '積の符号の推論')
    def t9():
        a, b = rfrac(r, (3, 4, 5, 9), 1, 11), rfrac(r, (2, 3, 7, 9), 1, 11); x = rfrac(r, (2, 3, 4, 5), 1, 11) if r.random() < .5 else F(rint(r, -9, 9))
        res = a * x / b
        if not nice(res, 20): return
        u.add(f'次の □ にあてはまる数を答えよう。\n{Lit(a, "frac").render(True)} × □ ÷ {Lit(b, "frac").render(False)} ＝ {fmt_num(res)}', num_answer(x),
              f'□ ＝ {fmt_num(res)} × ({fmt_num(b)}) ÷ ({fmt_num(a)}) ＝ {fmt_num(x)}。', 17, 'B①(3)', '乗除の逆算', [ans_str(-x), ans_str(1 / x)])
    def t10():
        v = rfrac(r, (2, 3, 4, 5, 7, 9), 1, 13)
        u.add(f'{fmt_num(v)} でわることは、ある数をかけることと同じである。その数を答えよう。', num_answer(1 / v), f'わる数の逆数をかける。{fmt_num(v)} の逆数は {fmt_num(1 / v)}。', 16, 'A②（ポイント1-22）', '除法を乗法になおす', [ans_str(-1 / v), ans_str(v)])
    plan = [t1] * 6 + [t2] * 6 + [t3] * 9 + [t4] * 7 + [t5] * 10 + [t6] * 5 + [t7] * 8 + [t8] * 5 + [t9] * 8 + [t10] * 5
    return fill(u, plan)
