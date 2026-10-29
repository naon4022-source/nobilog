"""1章 ふりかえりドリル・数の世界のひろがり・正の数・負の数の利用（ワーク p22〜27・教科書 p20, p30〜53 を写真で確認して作成）"""
from common import *
from calc import negpow, SUPT

def signed(v, dec=True):
    """表の中の数：正の数には ＋ をつける"""
    v = F(v); s = fmt_num(v, 'dec' if dec else 'auto')
    return ('+' + s) if v > 0 else s

# ---------------- ふりかえりドリル（ワーク p22〜23：1章のまとめ・入試問題をふくむ） ----------------
def w7():
    u = Unit('workbook-math-1-review', 'workbook', 'ふりかえりドリル', '正負の数',
             '2026-10-05 Claude作成。数学ワークp22〜23（①絶対値〜⑨かっこがある式の計算・分配法則。各地の入試問題をふくむ）を写真で確認し、教科書p20・p30〜44の該当箇所と照らして、入試レベルの問題に作り直した。')
    r = rng(711)
    def t1():  # 絶対値
        k = r.random()
        if k < .4:
            lo = r.randint(1, 6); hi = lo + r.randint(2, 8)
            n = 2 * (hi - lo + 1)
            u.add(f'絶対値が {lo} 以上 {hi} 以下の整数はいくつあるか答えよう。', {'kind': 'number', 'value': str(n), 'units': ['個']},
                  f'正の数 {lo}〜{hi} の {hi - lo + 1} 個と、負の数 −{hi}〜−{lo} の {hi - lo + 1} 個。合わせて {n} 個。', 22, '①(2)', '絶対値', [str(n // 2), str(n + 1)], tb=20, tbnote='数の大小・絶対値')
        elif k < .7:
            a = rdec(r, 1, 9); n = math.floor(a)
            u.add(f'絶対値が {fmt_num(a, "dec")} より小さい整数は何個あるか答えよう。', {'kind': 'number', 'value': str(2 * n + 1), 'units': ['個']},
                  f'数直線上で 0 からの距離が {fmt_num(a, "dec")} より小さい整数は、−{n} から {n} まで。0 も忘れずに数えて {2 * n + 1} 個。', 22, '①(1)', '絶対値', [str(2 * n), str(n)], tb=20, tbnote='数の大小・絶対値')
        else:
            nums = [rint(r, -9, 9) for _ in range(3)] + [rdec(r, -6, 6), rfrac(r, (2, 3, 4), 1, 15)]
            if len({abs(x) for x in nums}) < 5: return
            big = max(nums, key=abs)
            u.add('次の数のうち、絶対値がもっとも大きい数を答えよう。\n' + '、'.join(fmt_num(F(x), 'dec' if F(x).denominator in (10,) else 'auto') for x in nums), num_answer(big),
                  f'絶対値は、数直線上で 0 からの距離。符号を取って比べると {fmt_num(abs(F(big)))} がいちばん大きいので、答え {fmt_num(F(big))}。', 22, '①', '絶対値', [ans_str(-F(big))], tb=20, tbnote='数の大小・絶対値')
    def t2():  # 加法・減法（分数・小数）
        cs = [rdec(r, -6, 6), rfrac(r, (3, 4, 6), 1, 13), rint(r, -9, 9), rfrac(r, (2, 3, 4), 1, 9)]
        r.shuffle(cs)
        kinds = ['dec' if F(c).denominator in (10,) else ('int' if F(c).denominator == 1 else 'frac') for c in cs]
        e = sum_chain(r, cs, kinds)
        expr_q(u, e, 22, r.choice(['②', '③']), '正の数・負の数の加法・減法', tb=32, tbnote='練習問題1・2')
    def t3():
        cs = [rint(r, -60, 60) for _ in range(6)]
        expr_q(u, sum_chain(r, cs, None, .5), 22, '④', '3数以上の加減', tb=31, tbnote='例7')
    def t4():
        a, b, c = rint(r, -25, 25), rint(r, -25, 25), rint(r, -9, 9)
        if min(abs(a), abs(b), abs(c)) < 3: return
        expr_q(u, C(L(a), '×', L(b), '×', L(c)), 22, '⑤', '正の数・負の数の乗法', tb=40, tbnote='例9')
    def t5():  # 分数をふくむ除法
        a, b, c = rfrac(r, (3, 5, 6, 8, 9, 10), 1, 13), rfrac(r, (3, 4, 5, 15, 9), 1, 16), rfrac(r, (2, 3, 4, 7), 1, 11)
        e = r.choice([C(Lit(a, 'frac'), '÷', Lit(b, 'frac')), C(Lit(a, 'frac'), '÷', Lit(b, 'frac'), '×', Lit(c, 'frac')), C(Lit(a, 'frac'), '×', Lit(b, 'frac'), '÷', Lit(c, 'frac'))])
        if nice(e.val(), 40): expr_q(u, e, 23, '⑥', '分数をふくむ除法', tb=38, tbnote='例8')
    def t6():  # 指数をふくむ計算
        x = L(r.choice([6, 8, 12, -12, 18, 24, -36]))
        f = r.choice([lambda: C(x, '÷', Pow(L(-2), 2), '×', L(r.choice([3, -3, 5]))), lambda: C(Grp(negpow(r.choice([2, 3]), 2)), '×', Pow(L(r.choice([2, 5, -2])), 2)),
                      lambda: C(Pow(L(r.choice([4, 6, 8])), 2), '÷', Pow(L(-1), r.choice([5, 6, 7])), '÷', Pow(L(2), r.choice([2, 3]))),
                      lambda: C(negpow(r.choice([2, 3, 4]), 2), '×', Pow(L(r.choice([-1, -2])), r.choice([3, 4])), '÷', L(r.choice([-4, 6, 8])))])
        e = f()
        if nice(e.val(), 12, 900): expr_q(u, e, 23, '⑦', '指数をふくむ計算', tb=42, tbnote='例1・例2')
    def t7():  # 四則
        a, b, c, d = (L(rint(r, -15, 15)) for _ in range(4))
        if any(abs(z.v) < 2 for z in (a, b, c, d)): return
        e = r.choice([C(L(rint(r, 2, 9)), '×', a, '−', b), C(a, '÷', b, '+', c, '×', d), C(negpow(r.choice([2, 3, 4]), 2), '−', a, '×', b), C(a, '×', b, '−', c, '÷', d)])
        if e.val().denominator == 1: expr_q(u, e, 23, '⑧', '四則が混じった計算', tb=43, tbnote='例3')
    def t8():  # かっこ・分配法則
        d1, d2 = r.choice([(6, 4), (3, 4), (5, 2), (9, 6), (8, 12), (7, 14)])
        a, b = rfrac(r, (d1,), 1, 2 * d1), rfrac(r, (d2,), 1, 2 * d2)
        m = F(math.lcm(a.denominator, b.denominator)) * r.choice([1, -1]) * (r.choice([1, 2]) if r.random() < .6 else F(1, r.choice([3, 5, 7])))
        if m.denominator != 1:
            m = F(r.choice([1, -1]) * r.randint(1, 9), r.choice([5, 7])) * math.lcm(a.denominator, b.denominator)
        e = C(Grp(C(Lit(a, 'frac'), '+' if b > 0 else '−', Lit(abs(b), 'frac'))), '×', Lit(m, 'int' if m.denominator == 1 else 'frac'))
        if nice(e.val(), 30): expr_q(u, e, 23, '⑨', 'かっこがある式の計算・分配法則', tb=44, tbnote='分配法則')
    def t9():  # 大小（累乗・分数・小数）
        pool = [((show(Pow(L(-2), 3))), F(-8)), (show(negpow(3, 2)), F(-9)), (show(Pow(L(-3), 2)), F(9)), ('−2.5', F(-5, 2)), (show(Pow(Lit(F(-1, 2), 'frac'), 2)), F(1, 4)),
                ('−7/3', F(-7, 3)), (show(negpow(2, 2)), F(-4)), ('−0.3', F(-3, 10)), (show(Pow(L(-1), 5)), F(-1)), ('−10/3', F(-10, 3)), ('3/2', F(3, 2))]
        items = r.sample(pool, 5)
        if len({v for _, v in items}) < 5: return
        k = r.randint(2, 4); order = sorted(v for _, v in items)
        u.add(f'次の5つの数を小さい順に並べたとき、{k} 番目の数を答えよう。\n' + '、'.join(s for s, _ in items), num_answer(order[k - 1]),
              '累乗は先に計算する。値は ' + '、'.join(s if s == fmt_num(v) else f'{s}＝{fmt_num(v)}' for s, v in items) + f'。負の数は絶対値が大きいほど小さい。小さい順に並べると {k} 番目は {fmt_num(order[k - 1])}。',
              22, '①', '数の大小・累乗', [ans_str(order[-k]), ans_str(order[k - 2]) if k > 1 else None], tb=20, tbnote='数の大小')
    plan = [t1] * 7 + [t2] * 8 + [t3] * 5 + [t4] * 6 + [t5] * 8 + [t6] * 9 + [t7] * 9 + [t8] * 9 + [t9] * 9
    return fill(u, plan)

# ---------------- 数の世界のひろがり（ワーク p24〜25・教科書 p46〜50：数の集合・素数・素因数分解） ----------------
def factor(n):
    f = {}; p = 2
    while p * p <= n:
        while n % p == 0: f[p] = f.get(p, 0) + 1; n //= p
        p += 1
    if n > 1: f[n] = f.get(n, 0) + 1
    return f

def factor_answer(n):
    """素因数分解の答え：2^3×3^2×5 / 2×2×2×3×3×5 / 2³×3²×5（NFKC で 23×32×5 になる形も）。かける順は自由"""
    f = factor(n); groups = sorted(f.items())
    acc = []
    for perm in itertools.permutations(groups):
        for sep in ('×', '*', 'x', '・'):
            acc.append(sep.join(f'{p}^{e}' if e > 1 else str(p) for p, e in perm))
            acc.append(sep.join(sep.join([str(p)] * e) for p, e in perm))
            acc.append(sep.join(f'{p}{str(e).translate(SUPT)}' if e > 1 else str(p) for p, e in perm))
    shown = '×'.join(f'{p}{str(e).translate(SUPT)}' if e > 1 else str(p) for p, e in groups)
    return exact_answer(acc), shown

def w8():
    u = Unit('workbook-math-1-numworld', 'workbook', '数の世界のひろがり', '正負の数',
             '2026-10-05 Claude作成。数学ワークp24〜25（A①数の集合・A②いつでも自然数になる計算・A③素因数分解・A④倍数・A⑤3つの数をわり切るいちばん大きい自然数・B①素数・B②・B+③135に小さい数をかけて20の倍数）と教科書p46〜50（ひろげよう・自然数/整数/数全体の集合・素数・例1〜2・問2〜4・練習問題1・2・エラトステネスのふるい）を写真で確認。', tb=48)
    r = rng(811)
    def t1():  # 集合
        pool = [F(3), F(-5), F(0), F(2, 3), F(-7, 4), F(12), F(-1), F(27, 10), F(-13, 10), F(8, 4), F(-6, 3), F(1, 9)]
        nums = r.sample(pool, 6)
        which = r.choice(['自然数', '整数', '負の整数', '整数でない数'])
        test = {'自然数': lambda v: v.denominator == 1 and v > 0, '整数': lambda v: v.denominator == 1, '負の整数': lambda v: v.denominator == 1 and v < 0, '整数でない数': lambda v: v.denominator != 1}[which]
        shown = ['8/4' if v == 2 and False else fmt_num(v, 'dec' if v.denominator == 10 else 'auto') for v in nums]
        ok = [LETTERS[i] for i, v in enumerate(nums) if test(v)]
        if not ok or len(ok) == 6: return
        u.add(f'次のア〜カの数のうち、{which}をすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {s}' for i, s in enumerate(shown)), choice_answer(ok),
              '自然数は正の整数（1, 2, 3, …）。整数は自然数と0と負の整数。分数や小数で表される数のうち、約分して整数になるもの（例：−6/3＝−2）は整数。正解：' + '、'.join(ok), 24, 'A①', '数の集合', tb=47, tbnote='自然数の集合・整数の集合・数全体の集合')
    def t2():  # いつでもできる計算
        sets = {'自然数の集合': ['加法', '乗法'], '整数の集合': ['加法', '減法', '乗法'], '数全体の集合': ['加法', '減法', '乗法', '除法']}
        s = r.choice(list(sets))
        ops = ['加法', '減法', '乗法', '除法']
        ok = [LETTERS[i] for i, o in enumerate(ops) if o in sets[s]]
        u.add(f'{s}の中だけで計算するとき、計算の結果がいつもその集合の中の数になる計算を、次のア〜エからすべて選び、記号で答えよう（除法では0でわることは考えない）。\nア 加法　イ 減法　ウ 乗法　エ 除法', choice_answer(ok),
              f'例えば自然数では 2−5 や 2÷5 が自然数にならない。整数では 2÷5 が整数にならない。数全体なら四則計算はいつでもできる。{s}では ' + '、'.join(sets[s]) + '。', 24, 'A②', '数の範囲と四則計算', tb=47, tbnote='ひろげよう・まとめ')
    def t3():  # 素因数分解
        n = r.choice([r.randint(60, 999), r.randint(1000, 3000)])
        f = factor(n)
        if len(f) < 2 or max(f) > 37 or sum(f.values()) < 4: return
        ans, shown = factor_answer(n)
        u.add(f'{n} を素因数分解しよう。累乗は 2^3 のように ^ を使って書くか、2×2×2 のように書こう。', ans,
              f'小さい素数から順にわっていく。{n} ＝ {shown}。', 25, 'B②', '素因数分解', tb=49, tbnote='例1・問3')
    def t4():  # 倍数の判定
        k = r.choice([6, 10, 12, 14, 15, 18, 20, 21, 45, 28])
        forms = []
        while len(forms) < 6:
            f = {p: r.randint(0, 3) for p in (2, 3, 5, 7)}
            f = {p: e for p, e in f.items() if e}
            if len(f) < 2: continue
            s = '×'.join(f'{p}{str(e).translate(SUPT)}' if e > 1 else str(p) for p, e in sorted(f.items()))
            if s in [x for x, _ in forms]: continue
            v = 1
            for p, e in f.items(): v *= p ** e
            forms.append((s, v % k == 0))
        ok = [LETTERS[i] for i, (_, t) in enumerate(forms) if t]
        if not ok or len(ok) == 6: return
        kf = '×'.join(f'{p}{str(e).translate(SUPT)}' if e > 1 else str(p) for p, e in sorted(factor(k).items()))
        u.add(f'次のア〜カの数のうち、{k} の倍数をすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {s}' for i, (s, _) in enumerate(forms)), choice_answer(ok),
              f'{k} ＝ {kf}。{k} の倍数は「{kf} × 整数」の形にできる数。素因数の中に {kf} がそろっているものを選ぶ。正解：' + '、'.join(ok), 25, 'A④', '素因数分解と倍数', tb=49, tbnote='例2・問4')
    def t5():  # 最大公約数（3つの数）
        g = r.choice([6, 7, 12, 14, 15, 18, 21, 24, 28, 35])
        ms = r.sample([m for m in range(5, 60) if math.gcd(m, 2) and m > 4], 3)
        if math.gcd(math.gcd(ms[0], ms[1]), ms[2]) != 1: return
        nums = sorted(g * m for m in ms)
        if nums[-1] > 2000: return
        u.add(f'次の3つの数をすべてわり切ることのできる、いちばん大きい自然数を求めよう。\n{"、".join(map(str, nums))}', num_answer(g),
              '3つの数を素因数分解して、共通な素因数の積を求める。' + '、'.join(f'{n}＝{factor_answer(n)[1]}' for n in nums) + f'。共通な部分の積は {g}。', 25, 'A⑤', '素因数分解の利用（最大公約数）',
              [str(g * p) for p in (2, 3) if all(n % (g * p) == 0 for n in nums)] + [str(g // p) for p in (2, 3, 5, 7) if g % p == 0][:1], tb=50, tbnote='練習問題2')
    def t6():  # 小さい数をかけて倍数に
        k = r.choice([12, 18, 20, 24, 30, 36, 40, 45, 48, 60])
        n = r.randint(30, 600)
        m = k // math.gcd(n, k)
        if m == 1 or m == k: return
        u.add(f'{n} にできるだけ小さい自然数をかけて、{k} の倍数にするには、どんな数をかければよいか答えよう。', num_answer(m),
              f'{n} ＝ {factor_answer(n)[1]}、{k} ＝ {factor_answer(k)[1]}。{k} の素因数のうち {n} に足りない部分をかける。足りないのは {factor_answer(m)[1] + " ＝ " + str(m) if factor_answer(m)[1] != str(m) else str(m)}。', 25, 'B+③', '素因数分解の利用', [str(k), str(m * 2)], tb=50, tbnote='練習問題1')
    def t7():  # 平方数にする
        n = r.randint(20, 900)
        f = factor(n); m = 1
        for p, e in f.items():
            if e % 2: m *= p
        if m in (1, n) or len(f) < 2: return
        root = int(math.isqrt(n * m))
        u.add(f'{n} にできるだけ小さい自然数をかけて、ある自然数の2乗（平方）にしたい。どんな数をかければよいか答えよう。', num_answer(m),
              f'{n} ＝ {factor_answer(n)[1]}。2乗の数は、どの素因数の指数も偶数になる。指数が奇数の素因数をかけて {m}。このとき {n}×{m}＝{n*m}＝{root}²。', 25, 'B+③', '素因数分解の利用（平方）', [str(n * m), str(root)], tb=49, tbnote='素因数分解・p42 平方')
    def t8():  # 素数
        lo = r.choice([20, 30, 40, 50, 60, 70, 80, 90]); hi = lo + r.choice([10, 15, 20])
        ps = [p for p in range(lo, hi + 1) if all(p % d for d in range(2, int(p ** .5) + 1))]
        if len(ps) < 2: return
        u.add(f'{lo} 以上 {hi} 以下の素数をすべて答えよう（読点で区切る）。', nums_answer(ps),
              f'1とその数のほかに約数がない自然数が素数。2・3・5・7でわり切れるかを順に調べる（エラトステネスのふるいと同じ考え）。答え {"、".join(map(str, ps))}。', 25, 'B①', '素数', tb=48, tbnote='問2・p50 エラトステネスのふるい')
    def t9():  # 約数の個数
        n = r.choice([r.randint(24, 400)])
        f = factor(n)
        if len(f) < 2: return
        cnt = 1
        for e in f.values(): cnt *= e + 1
        divs = [d for d in range(1, n + 1) if n % d == 0]
        if cnt != len(divs) or cnt > 20: return
        u.add(f'{n} の約数は全部で何個あるか答えよう。', {'kind': 'number', 'value': str(cnt), 'units': ['個']},
              f'{n} ＝ {factor_answer(n)[1]}。約数を小さい順に書き出すと {"、".join(map(str, divs))} で {cnt} 個（1 と {n} 自身もふくむ）。', 25, 'B②', '素因数分解と約数', [str(cnt - 2), str(cnt - 1)], tb=48, tbnote='ふりかえり（約数）')
    plan = [t1] * 7 + [t2] * 3 + [t3] * 14 + [t4] * 8 + [t5] * 8 + [t6] * 8 + [t7] * 8 + [t8] * 7 + [t9] * 7
    return fill(u, plan)

# ---------------- 正の数・負の数の利用（ワーク p26〜27・教科書 p52〜53：仮平均） ----------------
def w9():
    u = Unit('workbook-math-1-use', 'workbook', '正の数・負の数の利用', '正負の数',
             '2026-10-05 Claude作成。数学ワークp26〜27（A①テストの得点と仮平均・B①卵の重さ・B②100m走・B③最低気温と仮平均・B+④本の冊数）と教科書p52〜53（収集量の平均・仮平均・練習問題1 讃岐うどん店）を写真で確認。', tb=52)
    r = rng(911)
    names = ['Aさん', 'Bさん', 'Cさん', 'Dさん', 'Eさん', 'Fさん']
    days = ['月', '火', '水', '木', '金', '土', '日']
    def table(labels, vals, dec=False): return '　'.join(f'{l}：{signed(v, dec)}' for l, v in zip(labels, vals))
    def t1():  # 基準と違いから平均
        n = r.randint(5, 7)
        ctx = r.choice([('ある店の1日の売上数', '個', [150, 180, 200], days, 25), ('ある図書館の1日の来館者数', '人', [120, 90, 240], days, 25), ('テストの得点', '点', [60, 65, 70], names, 15), ('卵の重さ', 'g', [60, 58, 62], 'ABCDEFG', 5)])
        what, unit, bases, labs, w = ctx; base = r.choice(bases)
        diffs = [rint(r, -w, w, False) for _ in range(n)]
        avg = base + F(sum(diffs), n)
        if avg.denominator not in (1, 2, 5, 10): return
        u.add(f'{what}を、{base}{unit} を基準にして、基準との違いで表した。\n{table(labs[:n], diffs)}\nこの{n}つの平均を求めよう。', {'kind': 'number', 'value': num_answer(avg, True)['value'], 'units': [unit]},
              f'（平均）＝（基準）＋（基準との違いの平均）。違いの合計は {fmt_num(F(sum(diffs)))}、平均は {ex(sum(diffs), "÷", n)} ＝ {fmt_num(F(sum(diffs), n), "dec")}。{ex(base, "+", F(sum(diffs), n), dec=True)} ＝ {fmt_num(avg, "dec")}（{unit}）。',
              26, 'A①(2)', '仮平均', [ans_str(F(sum(diffs), n)), ans_str(base + sum(diffs))], tb=52, tbnote='仮平均')
    def t2():  # 違いを求める
        base = r.choice([60, 65, 70, 72, 58]); x = base + rint(r, -15, 15)
        u.add(f'Dさんの得点 {base} 点を仮平均として、それぞれの得点と仮平均との違いを表す。Bさんの得点が {x} 点のとき、Bさんの「仮平均との違い」を符号をつけて答えよう。', num_answer(x - base),
              f'仮平均より大きいときは正の数、小さいときは負の数で表す。{x} − {base} ＝ {fmt_num(F(x - base))}。', 26, 'A①(2)①', '仮平均との違い', [ans_str(base - x)], tb=53, tbnote='仮平均との違い')
    def t3():  # 仮平均を求める
        base = F(r.randint(40, 120), 10); vals = [base + rdec(r, -3, 3) for _ in range(5)]
        i = r.randrange(5)
        u.add(f'ある地点の5日間の最低気温を、仮平均を使って調べる。{days[i]}曜日の最低気温は {fmt_num(vals[i], "dec")}℃ で、仮平均との違いは {signed(vals[i] - base)}℃ だった。仮平均を何℃にしたか答えよう。', {'kind': 'number', 'value': num_answer(base, True)['value'], 'units': ['℃', '度']},
              f'（仮平均）＝（気温）−（仮平均との違い）。{fmt_num(vals[i], "dec")} − ({signed(vals[i] - base)}) ＝ {fmt_num(base, "dec")}（℃）。', 27, 'B③(1)', '仮平均を求める', [ans_str(vals[i] + (vals[i] - base))], tb=53, tbnote='仮平均')
    def t4():  # 基準から実際の値
        base = r.choice([19, 15, 17, 16]); d = [rint(r, -6, 8, False) for _ in range(4)]
        d[1] = 0  # 基準のBさんは 0
        i = r.choice([0, 2, 3])
        unit = '秒'
        u.add(f'4人の100m走の記録を、Bさんの記録 {base}{unit} を基準にして、基準との違いで表した。\n{table(names[:4], d)}\n{names[i]}の記録は何{unit}か答えよう。', {'kind': 'number', 'value': str(base + d[i]), 'units': [unit]},
              f'（記録）＝（基準）＋（基準との違い）。{ex(base, "+", d[i])} ＝ {base + d[i]}（{unit}）。', 27, 'B②', '基準との違いから記録を求める', [str(base - d[i])], tb=53, tbnote='仮平均')
    def t5():  # 平均から違いの空欄
        n = 5; base = r.choice([65, 70, 80, 60]); d = [rint(r, -15, 20, False) for _ in range(n)]
        avg = base + F(sum(d), n)
        if avg.denominator != 1: return
        i = r.randrange(n)
        shown = [('□' if j == i else signed(v)) for j, v in enumerate(d)]
        u.add(f'5人の得点を、{base} 点を仮平均として表した。5人の得点の平均が {avg} 点のとき、□ にあてはまる数を答えよう。\n' + '　'.join(f'{names[j]}：{s}' for j, s in enumerate(shown)), num_answer(d[i]),
              f'平均 {avg} 点と仮平均との違いは {fmt_num(avg - base)} 点なので、5人の違いの合計は {ex(avg - base, "×", 5)} ＝ {fmt_num((avg - base) * 5)}。ほかの4人の違いの合計は {fmt_num(F(sum(d) - d[i]))} だから、□ ＝ {ex((avg - base) * 5, "−", sum(d) - d[i])} ＝ {fmt_num(F(d[i]))}。',
              26, 'A①', '仮平均（逆算）', [ans_str(-d[i])], tb=53, tbnote='仮平均')
    def t6():  # 総数
        n = 7; base = r.choice([150, 200, 120, 90]); d = [rint(r, -20, 25, False) for _ in range(n)]
        total = base * n + sum(d)
        u.add(f'あるうどん店は、1日の売上数を {base} 杯を基準にして記録している。\n{table(days, d)}\nこの7日間の総売上数を求めよう。', {'kind': 'number', 'value': str(total), 'units': ['杯']},
              f'（総数）＝（基準）×（日数）＋（違いの合計）。{ex(base, "×", 7, "+", sum(d))} ＝ {total}（杯）。', 27, 'B④', '仮平均と総数', [str(base * n), str(sum(d))], tb=53, tbnote='練習問題1')
    def t7():  # 仮平均を変える
        vals = [r.randint(300, 380) for _ in range(5)]
        b1, b2 = r.sample([320, 326, 330, 340, 350], 2)
        u.add(f'5年間の収集量（kg）は {"、".join(map(str, vals))} だった。仮平均を {b2}kg にしたとき、仮平均との違いの合計はいくつになるか、符号をつけて答えよう。', num_answer(sum(vals) - 5 * b2),
              f'違いはそれぞれ（収集量）−{b2}。合計は（収集量の合計 {sum(vals)}）−{b2}×5 ＝ {fmt_num(F(sum(vals) - 5 * b2))}。', 27, 'B④', '仮平均のくふう', [ans_str(5 * b2 - sum(vals))], tb=53, tbnote='①・②')
    def t8():  # 基準を取りかえる
        d = [rint(r, -8, 8, False) for _ in range(4)]
        d[1] = 0  # 基準のBさんは 0
        i, j = r.sample([0, 2, 3], 2)
        u.add(f'4人の記録（秒）を、Bさんの記録を基準にして、基準との違いで表した。\n{table(names[:4], d)}\nこの記録を、{names[j]}を基準にして表し直すと、{names[i]}は何秒になるか。符号をつけて答えよう。', num_answer(d[i] - d[j]),
              f'{names[i]}と{names[j]}の差を考える。{signed(d[i])} − ({signed(d[j])}) ＝ {fmt_num(F(d[i] - d[j]))}。', 27, 'B②', '基準を変えて表す', [ans_str(d[j] - d[i]), ans_str(d[i] + d[j])], tb=53, tbnote='仮平均')
    def t9():  # 最大と最小の差
        n = r.randint(5, 7); d = [rint(r, -15, 18, False) for _ in range(n)]
        u.add(f'ある店の{n}日間の来客数を、基準との違いで表した。\n{table(days[:n], d)}\n来客数がもっとも多い日と、もっとも少ない日の差は何人か答えよう。', {'kind': 'number', 'value': str(max(d) - min(d)), 'units': ['人']},
              f'差は（もっとも大きい違い）−（もっとも小さい違い）で求められる。{signed(max(d))} − ({signed(min(d))}) ＝ {max(d) - min(d)}（人）。基準の値は使わなくてよい。', 26, 'A①', '基準との違いの差', [str(max(d) + min(d))], tb=52, tbnote='仮平均')
    plan = [t1] * 10 + [t2] * 6 + [t3] * 8 + [t4] * 7 + [t5] * 10 + [t6] * 8 + [t7] * 7 + [t8] * 7 + [t9] * 7
    return fill(u, plan)
