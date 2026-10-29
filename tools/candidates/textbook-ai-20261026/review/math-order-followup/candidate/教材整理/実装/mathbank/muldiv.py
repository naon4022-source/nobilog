"""1章 乗法、除法①②③（ワーク p12〜17・教科書 p33〜41 を写真で確認して作成）"""
from common import *

# ---------------- 乗法、除法①（ワーク p12〜13・教科書 p33〜35：2数の積と符号） ----------------
def w2():
    u = Unit('workbook-math-1-muldiv1', 'workbook', '乗法、除法①', '正負の数',
             '2026-10-05 Claude作成。数学ワークp12〜13（A①負×正・A②正×負・A③負×負・B①・B+②符号を入れて最小）と教科書p33〜35（例1〜3・数直線・かける数を1ずつ小さくするきまり・説明しよう）を写真で確認。2数の積だけを使い、除法・小数・分数（次の回で学ぶ）は使わない。', tb=34)
    r = rng(211)
    def t1():  # 2けた×2けたの積（符号を先に決める）
        a, b = rint(r, -48, 48), rint(r, -36, 36)
        if abs(a) < 11 or abs(b) < 11 or a > 0 and b > 0: return
        no = 'A①' if a < 0 < b else 'A②' if b < 0 < a else 'A③'
        tb = 33 if a < 0 < b else 34 if b < 0 < a else 35
        expr_q(u, C(L(a), '×', L(b)), 12 if no != 'A③' else 13, no, '2数の積・符号を先に決める', tb=tb, tbnote='例1' if tb == 33 else '例2' if tb == 34 else '例3')
    def t2():  # ○に＋か−を入れて最小・最大（B+②の発展）
        a, b, c, d = (rint(r, 2, 12, False) for _ in range(4))
        want = r.choice(['小さく', '大きく'])
        best = None
        for s1, s2 in itertools.product([1, -1], repeat=2):
            v = F(-a) * (s1 * b) + (s2 * c) * F(-d)
            if best is None or (v < best if want == '小さく' else v > best): best = v
        u.add(f'次の式の 2つの ○ に「＋」か「−」の符号を1つずつ書き入れて、計算結果がもっとも{want}なるようにする。そのときの計算結果を答えよう。\n(−{a}) × (○{b}) + (○{c}) × (−{d})', num_answer(best),
              f'それぞれの積を{"負" if want == "小さく" else "正"}の数にすればよい。(−{a})×(○{b}) は ○ を{"＋" if want == "小さく" else "−"}、(○{c})×(−{d}) は ○ を{"＋" if want == "小さく" else "−"}にする。結果は {fmt_num(best)}。',
              13, 'B+②', '積の符号を決める', [ans_str(-best)], tb=35, tbnote='正の数・負の数の乗法のまとめ')
    def t3():  # 文字の符号から積の符号
        conds = [('a＜0、b＞0', -2, 3), ('a＞0、b＜0', 2, -3), ('a＜0、b＜0', -2, -3)]
        cnd, a, b = r.choice(conds)
        exprs = [('a×b', a * b), ('a×a', a * a), ('(−a)×b', -a * b), ('a×(−b)', a * (-b)), ('(−a)×(−b)', (-a) * (-b)), ('b×b', b * b), ('(−b)×a', -b * a)]
        r.shuffle(exprs); exprs = exprs[:5]; want = r.choice(['負', '正'])
        pick = [LETTERS[i] for i, (_, v) in enumerate(exprs) if (v < 0) == (want == '負')]
        if not pick or len(pick) == 5: return
        txt = '　'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(exprs))
        u.add(f'{cnd} のとき、次のア〜オのうち、値がかならず{want}の数になるものをすべて選び、記号で答えよう。\n{txt}', choice_answer(pick),
              '符号だけを考える。同符号の2数の積は正、異符号の2数の積は負。−a は a と符号が反対の数。正解：' + '、'.join(pick), 13, 'A③', '積の符号', tb=35, tbnote='負の数×負の数')
    def t4():  # 積と和から2数
        x, y = rint(r, -15, 15), rint(r, -15, 15)
        if x == y or abs(x) == abs(y) or (x * y > 0 and r.random() < .6): return
        p, s = x * y, x + y
        u.add(f'2つの整数があり、その積は {fmt_num(F(p))}、和は {fmt_num(F(s))} である。この2つの整数を答えよう（読点で区切る）。', nums_answer([x, y]),
              f'積が{"負" if p < 0 else "正"}なので、2数は{"異符号" if p < 0 else "同符号"}。積の絶対値 {abs(p)} になる2数の組から、和が {fmt_num(F(s))} になる組をさがすと {fmt_num(F(x))} と {fmt_num(F(y))}。',
              13, 'A③', '積の符号から2数を考える', [], tb=35, tbnote='例3')
    def t5():  # かける数を1ずつ小さくするきまり
        a = rint(r, -15, 15)
        if abs(a) < 2: return
        ch = -a
        u.add(f'({fmt_num(F(a)) if a < 0 else "+" + str(a)})×(+3)、({fmt_num(F(a)) if a < 0 else "+" + str(a)})×(+2)、({fmt_num(F(a)) if a < 0 else "+" + str(a)})×(+1)、… のように、かける数を1ずつ小さくしていく。積は1回ごとにいくつずつ変わるか。大きくなるときは正の数、小さくなるときは負の数で答えよう。',
              num_answer(ch), f'かける数が1小さくなると、積はかけられる数 {fmt_num(F(a))} の分だけ減る。だから変化は {fmt_num(F(ch))}（{"大きくなる" if ch > 0 else "小さくなる"}）。このきまりから、かける数が負になっても同じように続けられる。',
              13, 'A③', 'かける数を1ずつ小さくするきまり', [ans_str(-ch)], tb=35, tbnote='説明しよう')
    def t6():  # 数直線
        a = rint(r, -9, 9); k = r.randint(2, 6); same = r.random() < 0.5
        v = F(a) * (k if same else -k)
        u.add(f'数直線上で、0から {fmt_num(F(a))} までの距離を、{"同じ" if same else "反対の"}方向に {k} 倍にのばしたところにある数を答えよう。', num_answer(v),
              f'{"同じ方向に k 倍は +k をかけること" if same else "反対の方向に k 倍は −k をかけること"}。{lit_txt(a, True, mul=True)} × ({"+" if same else "−"}{k}) ＝ {fmt_num(v)}。',
              12, 'A①', '数直線と積', [ans_str(-v)], tb=33 if same else 35, tbnote='数直線（正の数をかける）' if same else '数直線（負の数をかける）')
    def t7():  # 2数を選んで積を最大・最小
        nums = sorted(set(rint(r, -12, 12) for _ in range(6)))
        if len(nums) < 5: return
        nums = nums[:5]; r.shuffle(nums)
        prods = [x * y for x, y in itertools.combinations(nums, 2)]
        want = r.choice(['大きく', '小さく']); v = max(prods) if want == '大きく' else min(prods)
        u.add(f'次の5つの数から2つを選んでかける。積がもっとも{want}なるときの積を答えよう。\n{"、".join(fmt_num(F(x)) for x in nums)}', num_answer(v),
              f'{"同符号どうしで絶対値の積が大きい組" if want == "大きく" else "異符号で絶対値の積が大きい組"}を考える。{"負どうしの積は正になることに注意。" if want == "大きく" else ""}答え {fmt_num(F(v))}。',
              13, 'B①', '積の符号と大小', [ans_str(min(prods) if want == '大きく' else max(prods))], tb=35, tbnote='正の数・負の数の乗法のまとめ')
    def t8():  # 積が N になる整数の組
        n = r.choice([-12, -18, -20, -24, -30, -36, 12, 18, 20, 24, 28, 36, -16, -28, 16, 30])
        pairs = {tuple(sorted((x, n // x))) for x in range(-abs(n), abs(n) + 1) if x and n % x == 0}
        u.add(f'2つの整数の積が {fmt_num(F(n))} になる組は全部で何組あるか答えよう。ただし、(2, 3) と (3, 2) は同じ組と考える。', {'kind': 'number', 'value': str(len(pairs)), 'units': ['組']},
              f'絶対値の積が {abs(n)} になる組を書き出し、{"異" if n < 0 else "同"}符号にする。{"負の数どうしの組も忘れない。" if n > 0 else "どちらを負にするかで2通りずつある（絶対値が同じ組は1通り）。"}全部で {len(pairs)} 組。',
              13, 'B①', '積の符号と組み合わせ', [str(len(pairs) // 2), str(len(pairs) * 2)], tb=35, tbnote='正の数・負の数の乗法のまとめ')
    def t9():  # □ にあてはまる数（かけ算で考える）
        a, x = rint(r, -15, 15), rint(r, -15, 15)
        if abs(a) < 2 or abs(x) < 2: return
        p = a * x
        if r.random() < .5: s = f'{lit_txt(a, True, mul=True)} × □ ＝ {fmt_num(F(p))}'
        else: s = f'□ × {lit_txt(a, mul=True)} ＝ {fmt_num(F(p))}'
        u.add(f'次の □ にあてはまる整数を答えよう。\n{s}', num_answer(x),
              f'まず積の符号から □ の符号を決める（{fmt_num(F(a))} と □ が{"同" if p > 0 else "異"}符号）。絶対値は {abs(p)} ÷ {abs(a)} ＝ {abs(x)}。答え {fmt_num(F(x))}。',
              12, 'A②', '積から1つの数を考える', [ans_str(-x)], tb=34, tbnote='例2')
    def t10():  # いつでも成り立つか
        facts = [('負の数に負の数をかけると、積はもとの数より大きくなる', True), ('正の数に負の数をかけると、積はもとの正の数より小さくなる', True),
                 ('ある数に負の数をかけると、積はかならず負の数になる', False), ('絶対値が等しい正の数と負の数の積は、かならず負の数になる', True),
                 ('2つの数の積が正の数ならば、2つの数はどちらも正の数である', False), ('2つの数の積が負の数ならば、2つの数は異符号である', True),
                 ('負の数に正の数をかけると、積の絶対値はかならず大きくなる', False), ('異符号の2数の積の絶対値は、2数の絶対値の積である', True)]
        pick = r.sample(facts, 5)
        if all(t for _, t in pick) or not any(t for _, t in pick): return
        ok = [LETTERS[i] for i, (_, t) in enumerate(pick) if t]
        u.add('次のア〜オのうち、いつでも成り立つものをすべて選び、記号で答えよう（整数で考える）。\n' + '\n'.join(f'{LETTERS[i]} {f}' for i, (f, _) in enumerate(pick)), choice_answer(ok),
              '成り立たないものは反例を1つ見つける（例：(−2)×(−3)＝6 は正。(−1)×2＝−2 は絶対値が大きくならない）。正解：' + '、'.join(ok), 13, 'B①', '積の符号のきまり', tb=35, tbnote='説明しよう')
    plan = [t1] * 8 + [t2] * 7 + [t3] * 7 + [t4] * 8 + [t5] * 5 + [t6] * 6 + [t7] * 8 + [t8] * 6 + [t9] * 8 + [t10] * 6
    return fill(u, plan)

# ---------------- 乗法、除法②（ワーク p14〜15・教科書 p36〜37：除法・0・小数と分数の乗除） ----------------
def w3():
    u = Unit('workbook-math-1-muldiv2', 'workbook', '乗法、除法②', '正負の数',
             '2026-10-05 Claude作成。数学ワークp14〜15（A①②除法の符号・A③小数をふくむ乗除・B①わり切れない商と0・B+②分数の乗法）と教科書p36〜37（例4〜6・0の積と商・0でわれない）を写真で確認。逆数による分数の除法（次の回）は使わない。', tb=36)
    r = rng(311)
    def t1():
        a, b = rint(r, -60, 60), rint(r, -16, 16)
        if a % b == 0 or math.gcd(a, b) == 1 or abs(b) in (1, 10) or abs(a) < 12: return
        expr_q(u, C(L(a), '÷', L(b)), 15, 'B①(1)', 'わり切れない除法（分数で答える）', tb=36, tbnote='例4(3)')
    def t2():
        a, b = rdec(r, -9, 9, 2), rdec(r, -3, 3, 1)
        q = a / b
        if q.denominator not in (1, 2, 4, 5, 10, 20) or abs(q) > 60: return
        expr_q(u, C(Lit(a, 'dec'), '÷', Lit(b, 'dec')), 15, 'A③(6)', '小数でわる除法', tb=37, tbnote='例5・問5')
    def t3():
        a, b = rint(r, -30, 30), rdec(r, -2, 2, 1)
        if (F(a) / b).denominator == 1: return
        expr_q(u, C(L(a), '÷', Lit(b, 'dec')), 15, 'B①(3)', '整数÷小数（わり切れないときは分数で答える）', tb=37, tbnote='例5')
    def t4():
        a, b = rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12, 14, 15), 1, 13), rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12, 14, 15), 1, 13)
        e = C(Lit(a, 'frac'), '×', Lit(b, 'frac'))
        if nice(e.val(), 30) and math.gcd(a.numerator, b.denominator) * math.gcd(b.numerator, a.denominator) > 1: expr_q(u, e, 15, 'B+②', '分数の乗法・約分してから計算', tb=37, tbnote='例6・問6')
    def t5():
        a = numlit(r, ('int', 'dec'), -12, 12); q = numlit(r, ('int', 'dec'), -12, 12)
        x = a.v * q.v
        if abs(a.v) == 1 or abs(q.v) == 1: return
        u.add(f'次の □ にあてはまる数を答えよう。\n□ ÷ {a.render(False)} ＝ {q.render(True)}', num_answer(x, True),
              f'□ ÷ {a.render(False, True)} ＝ {q.render(True)} は、{q.render(True, True)} × {a.render(False, True)} ＝ □ と同じ（わり算はかけ算の逆）。□ ＝ {fmt_num(x, "dec")}。',
              14, 'A②', '除法とかけ算の関係', [ans_str(-x), ans_str(q.v / a.v)], tb=36, tbnote='ひろげよう（□×2＝−6）')
    def t6():
        a = numlit(r, ('int', 'dec'), -9, 9); x = numlit(r, ('int', 'dec'), -20, 20)
        if abs(a.v) == 1: return
        wrong = x.v * a.v; right = x.v / a.v
        if not nice(right, 12): return
        u.add(f'ある数を {a.render(True)} でわるところを、まちがえて {a.render(True)} をかけてしまったので、答えが {fmt_num(wrong, "dec")} になった。正しい答えを求めよう。', num_answer(right, True),
              f'まずある数を求める：{Lit(wrong, x.kind if a.kind == "int" else "dec").render(True, True)} ÷ {a.render(False, True)} ＝ {fmt_num(x.v, "dec")}。正しい答えは {x.render(True, True)} ÷ {a.render(False, True)} ＝ {fmt_num(right, "dec")}。', 15, 'A③', '乗除の関係・まちがい直し', [ans_str(x.v), ans_str(-right)], tb=37, tbnote='例5')
    def t7():
        days = r.randint(4, 8); vals = [rdec(r, -4, 3) for _ in range(days)]
        s = sum(vals); avg = s / days
        if avg.denominator not in (1, 2, 4, 5, 10, 20, 25, 50): return
        u.add(f'ある池の水位を、前の日との差で記録した（上がった日を＋）。{days}日間の記録は {"、".join(fmt_num(v, "dec") for v in vals)}（cm）だった。1日あたり平均何cm変化したと考えられるか答えよう。', {'kind': 'number', 'value': num_answer(avg, True)['value'], 'units': ['cm']},
              f'変化の合計 {fmt_num(s, "dec")} を日数 {days} でわる。{show(C(Lit(s, "dec" if s.denominator != 1 else "int"), "÷", L(days)))} ＝ {fmt_num(avg, "dec")}（cm）。', 15, 'A③(5)', '負の小数÷整数の利用', [ans_str(-avg), ans_str(s)], tb=37, tbnote='例5')
    def t8():
        items = [C(numlit(r, ('int', 'dec'), -20, 20), '÷', numlit(r, ('int', 'dec'), -6, 6)) for _ in range(4)]
        vals = [e.val() for e in items]
        if len(set(vals)) < 4: return
        want = r.choice(['小さい', '大きい']); v = min(vals) if want == '小さい' else max(vals)
        u.add(f'次の商のうち、もっとも{want}ものを記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {show(e)}' for i, e in enumerate(items)), choice_answer([LETTERS[vals.index(v)]]),
              '各商は ' + '、'.join(f'{LETTERS[i]}＝{fmt_num(x)}' for i, x in enumerate(vals)) + '。負の数どうしは絶対値が大きいほど小さい。', 15, 'B①', '商の符号と大小', tb=37, tbnote='正の数・負の数の乗法、除法のまとめ')
    def t9():
        a = rdec(r, -2, 2, 2); b = rdec(r, -3, 3, 1)
        p = a * b
        if p.denominator > 1000: return
        expr_q(u, C(Lit(a, 'dec'), '×', Lit(b, 'dec')), 15, 'A③(2)', '小数どうしの乗法・小数点の位置', extra_near=[p * 10, p / 10], tb=37, tbnote='例5(1)')
    def t10():  # 0 のきまり
        dl = lambda: Lit(rdec(r, -9, 9), 'dec')
        z = [(show(C(L(0), '÷', dl())), '0'), (show(C(L(rint(r, -20, 20)), '×', L(0))), '0'), (show(C(dl(), '÷', L(0))), 'x'),
             (show(C(L(0), '×', L(rint(r, -20, 20)))), '0'), (show(C(L(rint(r, -20, 20)), '÷', L(rint(r, -9, 9)))), 'n')]
        r.shuffle(z); z = z[:4]
        bad = [LETTERS[i] for i, (_, k) in enumerate(z) if k == 'x']
        want = r.choice(['計算できない', '値が0になる'])
        pick = bad if want == '計算できない' else [LETTERS[i] for i, (_, k) in enumerate(z) if k == '0']
        if not pick: return
        u.add(f'次のア〜エのうち、{want}ものをすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(z)), choice_answer(pick),
              '0と正の数、0と負の数の積は0。0を正の数・負の数でわった商も0。しかし、どんな数も0でわることはできない。正解：' + '、'.join(pick), 15, 'B①(2)', '0をふくむ乗除', tb=37, tbnote='0の積と商')
    def t11():  # 商の符号から符号を決める
        cases = [('a ÷ b が負の数で、b が負の数', 'a', '正'), ('a ÷ b が正の数で、a が負の数', 'b', '負'), ('a ÷ b が負の数で、a が負の数', 'b', '正'),
                 ('a × b が正の数で、b ÷ c が負の数、c が正の数', 'a', '負'), ('a ÷ b が正の数で、b × c が負の数、c が負の数', 'a', '正')]
        cnd, who, ans = r.choice(cases)
        u.add(f'{cnd}のとき、{who} は正の数か負の数か。「ア 正の数」「イ 負の数」から選び、記号で答えよう（どの数も0ではない）。', choice_answer(['ア' if ans == '正' else 'イ']),
              f'商の符号は積と同じきまり（同符号なら正、異符号なら負）。わかっている数から順に符号を決めると、{who} は{ans}の数。', 14, 'A①', '商の符号のきまり', tb=37, tbnote='正の数・負の数の乗法、除法のまとめ')
    plan = [t1] * 8 + [t2] * 8 + [t3] * 6 + [t4] * 8 + [t5] * 7 + [t6] * 6 + [t7] * 5 + [t8] * 6 + [t9] * 7 + [t10] * 5 + [t11] * 5
    return fill(u, plan)

# ---------------- 乗法、除法③（ワーク p16〜17・教科書 p38〜41：逆数・3数以上の乗除） ----------------
def w4():
    u = Unit('workbook-math-1-muldiv3', 'workbook', '乗法、除法③', '正負の数',
             '2026-10-05 Claude作成。数学ワークp16〜17（A①逆数・A②除法を乗法に・A③3数以上の乗法・A④3数以上の乗除・B①・B+②まちがいを直す）と教科書p38〜41（例7〜10・乗法の交換法則と結合法則・負の符号の個数・話しあおう）を写真で確認。', tb=38)
    r = rng(411)
    def t1():
        v = r.choice([rfrac(r, (3, 5, 7, 9, 11, 13), 1, 20), F(rint(r, -12, 12)), rdec(r, -3, 3, 1)])
        if v == 0 or abs(v) == 1: return
        shown = fmt_num(v, 'dec')
        conv = '' if v.denominator != 1 and shown == fmt_num(v) else f'{shown} を分数で表すと {fmt_num(v) if v.denominator != 1 else fmt_num(v) + "/1"} だから、'
        u.add(f'{shown} の逆数を答えよう。', num_answer(1 / v), f'2つの数の積が1になるとき、一方を他方の逆数という。{conv}逆数は {fmt_num(1 / v)}（分子と分母を入れかえる。符号はそのまま）。', 16, 'A①', '逆数', [ans_str(-1 / v), ans_str(-v)], tb=38, tbnote='例7・問7')
    def t2():
        v = rfrac(r, (2, 3, 4, 5, 7), 1, 11)
        u.add(f'{fmt_num(v)} と、その逆数の和を答えよう。', num_answer(v + 1 / v), f'逆数は {fmt_num(1 / v)}。和は {ex(v, "+", 1 / v)} ＝ {fmt_num(v + 1 / v)}（通分して計算する）。', 16, 'A①', '逆数', [ans_str(v - 1 / v), ans_str(v * 0 + 1)], tb=38, tbnote='例7')
    def t3():
        e = C(Lit(rfrac(r, (3, 4, 5, 6, 8, 9, 10, 12), 1, 15), 'frac'), '÷', Lit(rfrac(r, (3, 4, 5, 6, 9, 10, 15), 1, 15), 'frac'), '÷', Lit(rfrac(r, (2, 3, 5, 7), 1, 9), 'frac'))
        if nice(e.val(), 60): expr_q(u, e, 17, 'B①(3)', 'すべての除法を乗法になおす', tb=40, tbnote='例10')
    def t4():
        n = r.randint(4, 5); fs = [L(rint(r, -9, 9)) for _ in range(n)]
        if any(abs(f.v) == 1 for f in fs): return
        e = C(fs[0], *[x for f in fs[1:] for x in ('×', f)])
        if abs(e.val()) < 3000: expr_q(u, e, 16, 'A③', '3数以上の乗法・積の符号', tb=40, tbnote='例9')
    def t5():
        parts = [numlit(r, ('int', 'frac', 'dec'), -12, 12) for _ in range(3)]
        ops = [r.choice('×÷'), r.choice('×÷')]
        if '÷' not in ops: return
        e = C(parts[0], ops[0], parts[1], ops[1], parts[2])
        if nice(e.val(), 30, 300): expr_q(u, e, 17, 'A④', '乗除の混じった計算（÷を×になおす）', tb=41, tbnote='練習問題4')
    def t6():
        n = r.randint(5, 8); k = r.randint(1, 3)
        terms = [F(-(i + 1), 1) if i % k == 0 else F(i + 1) for i in range(n)]
        e = C(L(terms[0]), *[x for t in terms[1:] for x in ('×', L(t))])
        expr_q(u, e, 16, 'A③', '負の符号の個数と積の符号', tb=40, tbnote='ひろげよう・負の符号の個数')
    def t7():
        a, b, c = rint(r, -60, 60), rint(r, 2, 8) * r.choice([1, -1]), rint(r, 2, 6) * r.choice([1, -1])
        right = F(a) / b / c; wrong = F(a) / (F(b) / c)
        if right == wrong or not nice(right, 12) or not nice(wrong, 12): return
        u.add(f'Bさんは {ex(a, "÷", b, "÷", c)} を、後ろの {ex(b, "÷", c)} から先に計算して {fmt_num(wrong)} と答えた。正しい答えを求めよう。', num_answer(right),
              f'除法は左から順に計算する。÷ を × になおすと {ex(a, "×", F(1, b), "×", F(1, c))}。正しい答えは {fmt_num(right)}。', 17, 'B+②', 'まちがいを正しく直す', [ans_str(wrong)], tb=41, tbnote='話しあおう')
    def t8():
        cases = [('a＜0、b＞0、a×b×c＞0', '負'), ('a＞0、b＞0、a×b×c＜0', '負'), ('a＜0、b＜0、a×b÷c＞0', '正'), ('a＜0、b＞0、a÷b×c＜0', '正'), ('a×b＜0、a×b×c＞0', '負'), ('a×b×c×d＞0 で、a、b、c がすべて負', '負')]
        cnd, ansv = r.choice(cases)
        who = 'd' if 'd＞0' in cnd else 'c'
        u.add(f'{cnd} のとき、{who} は正の数か負の数か。「ア 正の数」「イ 負の数」から選び、記号で答えよう。', choice_answer(['ア' if ansv == '正' else 'イ']),
              f'乗除だけの式の符号は、負の符号の個数が偶数なら＋、奇数なら−。わかっている数の符号から数えると、{who} は{ansv}の数。', 16, 'A③', '負の符号の個数から符号を決める', tb=40, tbnote='負の符号の個数')
    def t9():
        a, b = rfrac(r, (3, 4, 5, 9), 1, 11), rfrac(r, (2, 3, 7, 9), 1, 11); x = rfrac(r, (2, 3, 4, 5), 1, 11) if r.random() < .5 else F(rint(r, -9, 9))
        res = a * x / b
        if not nice(res, 20) or abs(x) == 1: return
        u.add(f'次の □ にあてはまる数を答えよう。\n{Lit(a, "frac").render(True, True)} × □ ÷ {Lit(b, "frac").render(False, True)} ＝ {fmt_num(res)}', num_answer(x),
              f'□ ＝ {ex(res, "×", b, "÷", a)} ＝ {ex(res, "×", b, "×", 1 / a)} ＝ {fmt_num(x)}（÷ は逆数をかけることと同じ）。', 17, 'B①(3)', '乗除の逆算', [ans_str(-x), ans_str(1 / x)], tb=38, tbnote='除法を乗法に')
    def t10():
        v = rfrac(r, (2, 3, 4, 5, 7, 9), 1, 13)
        u.add(f'{fmt_num(v)} でわることは、ある数をかけることと同じである。その数を答えよう。', num_answer(1 / v), f'正の数・負の数でわるには、その数の逆数をかければよい。{fmt_num(v)} の逆数は {fmt_num(1 / v)}。', 16, 'A②', '除法を乗法になおす', [ans_str(-1 / v), ans_str(v)], tb=38, tbnote='除法を乗法に')
    def t11():  # 交換法則・結合法則で工夫
        k = r.choice([(25, 4), (125, 8), (50, 2), (5, 2), (20, 5), (250, 4)])
        a, b = k[0] * r.choice([1, -1]), k[1] * r.choice([1, -1]); m = rint(r, -39, 39)
        if abs(m) < 7: return
        order = [L(a), L(m), L(b)]; r.shuffle(order)
        expr_q(u, C(order[0], '×', order[1], '×', order[2]), 16, 'A③', '乗法の交換法則・結合法則で工夫する', tb=39, tbnote='問9・問10')
    plan = [t1] * 6 + [t2] * 5 + [t3] * 8 + [t4] * 7 + [t5] * 10 + [t6] * 5 + [t7] * 7 + [t8] * 6 + [t9] * 7 + [t10] * 4 + [t11] * 6
    return fill(u, plan)
