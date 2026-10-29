from fractions import Fraction as F
from bank import Unit, expr_q, num_answer, nums_answer, choice_answer, rng
from helpers import rint, rfrac, rdec, sum_chain
from expr import C, L, D, Lit, Grp, show, fmt_num, ans_str

def build():
    u = Unit('workbook-math-1-addsub3', 'workbook', '加法、減法③', '正負の数',
             '2026-10-05 Claude作成。数学ワークp10〜11（1章5 加法、減法③）の問題を参考に、項の多い加減・小数と分数の混合・項の読み取り・逆算などへ作り直した。答えは分数で正確に検算済み。')
    r = rng(101)
    jobs = []
    def t1():  # 7〜8項の整数
        n = r.choice([7, 8]); cs = [rint(r, -40, 40) for _ in range(n)]
        expr_q(u, sum_chain(r, cs, None, 0.3), 11, 'A④(5)', '3数以上の加減・項の多い式', tb=31, tbnote='例7・問10')
    def t2():
        cs = [rdec(r, -9.9, 9.9) for _ in range(5)]
        expr_q(u, sum_chain(r, cs, ['dec'] * 5, 0.4), 11, 'B①(3)', '小数の加減', tb=32, tbnote='練習問題2(3)(4)')
    def t3():
        cs = [rfrac(r, (2, 3, 4, 6, 8, 9, 12), 1, 17) for _ in range(4)]
        e = sum_chain(r, cs, ['frac'] * 4)
        if e.val().denominator > 72: return
        expr_q(u, e, 11, 'B①(4)', '分数の加減・通分', tb=32, tbnote='練習問題2(5)(6)')
    def t4():
        decs = [r.choice([F(1, 4), F(3, 4), F(1, 2), F(6, 5), F(3, 10), F(7, 10), F(5, 2), F(9, 4)]) * r.choice([1, -1]) for _ in range(2)]
        fr = [rfrac(r, (3, 6, 12, 9), 1, 11) for _ in range(2)]
        cs = [decs[0], fr[0], decs[1], fr[1]]; r.shuffle(cs)
        kinds = ['dec' if c in decs else 'frac' for c in cs]
        expr_q(u, sum_chain(r, cs, kinds), 11, 'B+②', '分数と小数がまざった加減', tb=32, tbnote='練習問題1・2')
    def t5():
        cs = [rint(r, -12, 12), rdec(r, -6, 6), rfrac(r, (3, 4, 5), 1, 9), rint(r, -15, 15), rfrac(r, (2, 6), 1, 7)]
        kinds = ['int', 'dec', 'frac', 'int', 'frac']
        e = sum_chain(r, cs, kinds); negs = [c for c in cs if c < 0]
        if len(negs) < 2: return
        s = sum(negs)
        u.add(f'次の式の負の項をすべて足すと、いくつになるか答えよう。\n{show(e)}', num_answer(s),
              f'かっこをはずして加法だけの式にすると、項は {"、".join(fmt_num(c, k) for c, k in zip(cs, kinds))}。負の項 {"、".join(fmt_num(c, k) for c, k in zip(cs, kinds) if c < 0)} の和は {fmt_num(s)}（分数と小数は、小数を分数になおしてから通分する）。',
              10, 'A③', '正の項・負の項', [ans_str(sum(c for c in cs if c > 0)), ans_str(-s)], tb=31, tbnote='項・正の項・負の項')
    def t6():
        cs = [rint(r, -20, 20) for _ in range(5)]
        e = sum_chain(r, cs, None, 0.3)
        u.add(f'次の式を加法だけの式に直したとき、式の項をすべて答えよう（順番は自由、読点で区切る）。\n{show(e)}', nums_answer(cs),
              f'ひく数は符号を変えて加える。項は {"、".join(fmt_num(c) for c in cs)}。', 10, 'A③', '正の項・負の項', tb=31, tbnote='項・正の項・負の項')
    def t7():
        a = r.choice([198, 299, 397, 499, 2.75, 3.6, 1.25])
        a = F(str(a)); b = rdec(r, -9, 9) if r.random() < .5 else F(rint(r, -60, 60))
        c = rdec(r, -5, 5)
        cs = [a, b, -a, c, -b + r.choice([1, -1, F(1, 2)])]
        kinds = ['dec' if x.denominator != 1 else 'int' for x in cs]
        expr_q(u, sum_chain(r, cs, kinds, 0.5), 10, 'A②(2)', '交換法則・結合法則を使った工夫', tb=30, tbnote='加法の交換法則・結合法則')
    def t8():
        cs = [rint(r, -15, 15), rdec(r, -8, 8), rint(r, -20, 20)]
        x = rdec(r, -9, 9) if r.random() < .5 else F(rint(r, -25, 25))
        total = x + sum(cs)
        e = sum_chain(r, [cs[0], x, cs[1], cs[2]], ['int', 'dec' if x.denominator != 1 else 'int', 'dec', 'int'])
        op, lit = e.rest[0]
        s2 = e.first.render(True) + f' {op} □' + ''.join(f' {o} ' + x.render(False) for o, x in e.rest[1:])
        val = lit.v
        rest = total - x
        how = (f'□ ＝ {fmt_num(total, "dec")} − ({fmt_num(rest, "dec")}) ＝ {fmt_num(val, "dec")}' if op == '+' else
               f'−□ ＝ {fmt_num(total, "dec")} − ({fmt_num(rest, "dec")}) ＝ {fmt_num(x, "dec")} だから、□ ＝ {fmt_num(val, "dec")}')
        u.add(f'次の式の □ にあてはまる数を答えよう。\n{s2} ＝ {fmt_num(total, "dec")}', num_answer(val, True),
              f'加法だけの式とみて、□ 以外の項を先にまとめると {fmt_num(rest, "dec")}。{how}（式に入れて {fmt_num(total, "dec")} になることを確かめる）。',
              11, 'A④', '加減の逆算', [ans_str(-val)], tb=31, tbnote='加法だけの式とみる')
    def t9():
        a, b, c = rint(r, -9, 12), rint(r, 2, 15), rint(r, 2, 15)
        correct = a - (-b) - c; wrong = a - b - c
        u.add(f'Aさんは {fmt_num(a)} − (−{b}) − {c} を、かっこをはずすときに符号を変えずに {fmt_num(a)} − {b} − {c} と計算した。正しい答えは、Aさんの答えよりいくつ大きいか答えよう。',
              num_answer(correct - wrong), f'正しくは {fmt_num(a)} + {b} − {c} ＝ {fmt_num(correct)}。Aさんは {fmt_num(wrong)}。差は {fmt_num(correct - wrong)}（ひく数の符号を変え忘れると 2×{b} だけずれる）。',
              11, 'A④(1)', 'かっこのはずし方', [ans_str(correct), ans_str(-(correct - wrong))], tb=30, tbnote='例6')
    def t10():
        t0 = rdec(r, -6, 3); ch = [rdec(r, 2, 9), -rdec(r, 1, 6), -rdec(r, 1, 6)]
        names = ['朝の気温は', '昼までに', '夕方までに', '夜までにさらに']
        txt = f'ある日の朝の気温は {fmt_num(t0, "dec")}℃ だった。昼までに {fmt_num(ch[0], "dec")}℃ 上がり、夕方までに {fmt_num(-ch[1], "dec")}℃ 下がり、夜までにさらに {fmt_num(-ch[2], "dec")}℃ 下がった。夜の気温は何℃か答えよう。'
        v = t0 + sum(ch)
        u.add(txt, {'kind': 'number', 'value': ans_str(v), 'units': ['℃', '度']}, f'{fmt_num(t0,"dec")} + {fmt_num(ch[0],"dec")} − {fmt_num(-ch[1],"dec")} − {fmt_num(-ch[2],"dec")} ＝ {fmt_num(v,"dec")}（℃）',
              11, 'B①(3)', '小数の加減（気温の変化の場面）', [ans_str(t0 + ch[0] - ch[1] - ch[2])], tb=32, tbnote='練習問題2(3)(4)')
    def t11():
        lo = -F(r.randint(11, 79), 10); hi = F(r.randint(2, 70), 10)
        ints = [k for k in range(-9, 10) if lo <= k < hi]
        s = sum(ints)
        if s == 0: return
        u.add(f'{fmt_num(lo,"dec")} 以上 {fmt_num(hi,"dec")} 未満の整数をすべて足すと、いくつになるか答えよう。', num_answer(s),
              f'あてはまる整数は {"、".join(fmt_num(F(k)) for k in ints)}。正と負で打ち消し合う組を先に消すと速い。合計 {fmt_num(s)}。', 10, 'A②(2)', '加法の交換法則・結合法則', tb=30, tbnote='加法の交換法則・結合法則', near=
              [ans_str(s + (hi if hi.denominator == 1 else 0)), ans_str(s - min(ints)), ans_str(s + (max(ints) + 1))])
    def t12():
        nums = [rdec(r, -5, 5), rfrac(r, (3, 4, 6), 1, 9), rint(r, -6, 6), rfrac(r, (2, 5), 1, 9), rdec(r, -4, 4)]
        k = 3; best = min(sum(c) for c in __import__('itertools').combinations(nums, k))
        disp = '、'.join(fmt_num(x, 'dec') if x.denominator in (10, 100) else fmt_num(x) for x in nums)
        worst = max(sum(c) for c in __import__('itertools').combinations(nums, k))
        u.add(f'次の5つの数から3つを選んで足す。和がもっとも小さくなるとき、その和を答えよう。\n{disp}', num_answer(best),
              f'負の数のうち絶対値の大きいものから3つ選ぶ（負の数が足りなければ、正の数は小さいものから）。和は {fmt_num(best)}。', 11, 'B+②', '分数と小数がまざった加減', [ans_str(worst)], tb=31, tbnote='正の項の和・負の項の和')
    def t13():
        facts = [('正の数と負の数の和は、かならず負の数になる', False), ('正の数から負の数をひくと、かならず正の数になる', True),
                 ('負の数から正の数をひくと、かならず負の数になる', True), ('2つの負の数の和は、かならず負の数になる', True),
                 ('負の数から負の数をひくと、かならず負の数になる', False), ('正の数から正の数をひくと、かならず正の数になる', False),
                 ('ある数に負の数を加えると、和はもとの数より小さくなる', True), ('ある数から負の数をひくと、差はもとの数より小さくなる', False),
                 ('絶対値が等しい正の数と負の数の和は0になる', True), ('2つの数の差は、かならず2つの数のどちらよりも小さい', False)]
        pick = r.sample(facts, 5)
        if not any(t for _, t in pick) or all(t for _, t in pick): return
        letters = 'アイウエオ'
        ok = [letters[i] for i, (_, t) in enumerate(pick) if t]
        lines = '\n'.join(f'{letters[i]} {f}' for i, (f, _) in enumerate(pick))
        u.add(f'次のア〜オのうち、いつでも成り立つものをすべて選び、記号で答えよう。\n{lines}', choice_answer(ok),
              '成り立たないものは反例を1つ見つければよい（例：3＋(−5)＝−2 だが 5＋(−3)＝2 は正）。ひく数の符号を変えて加法になおすと考えやすい。正解：' + '、'.join(ok),
              11, 'A④', '正の数・負の数の和と差の性質', tb=32, tbnote='練習問題3')
    plan = [t1] * 8 + [t2] * 7 + [t3] * 8 + [t4] * 8 + [t5] * 6 + [t6] * 5 + [t7] * 6 + [t8] * 6 + [t9] * 5 + [t10] * 5 + [t11] * 5 + [t12] * 4 + [t13] * 5
    i = 0
    while len(u.qs) < 70:
        plan[i % len(plan)]() if i < 4000 else None
        i += 1
        if i > 8000: raise SystemExit('w1 足りない')
    u.qs = u.qs[:70]
    return u
