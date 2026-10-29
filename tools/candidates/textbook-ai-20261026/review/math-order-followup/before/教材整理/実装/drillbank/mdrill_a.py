"""数学ドリル 第1章 正負の数の計算と利用（ドリル p4〜17）"""
from mcommon import *

def unit():
    u = DUnit('drill-math-1-signedcalc', '正負の数の計算と利用', '正負の数')
    r = rng(1001)
    def add2():
        a, b = rint(r, -40, 40), rint(r, -40, 40)
        expr_q(u, C(L(a), '+', L(b)), 4, '1', '加法', lead='次の計算をしよう。')
    def addfd():
        if r.random() < .5:
            a, b = rdec(r, -9, 9), rdec(r, -9, 9); expr_q(u, C(Lit(a, 'dec'), '+', Lit(b, 'dec')), 4, '2', '小数の加法')
        else:
            a, b = rfrac(r, (2, 3, 4, 5, 6, 8), 1, 7), rfrac(r, (2, 3, 4, 5, 6, 8), 1, 7); expr_q(u, C(L(a), '+', L(b)), 4, '2', '分数の加法')
    def add3():
        a, b, c = rint(r, -12, 12), rint(r, -12, 12), rint(r, -12, 12)
        expr_q(u, C(L(a), '+', L(b), '+', L(c)), 5, '3', '3つの数の加法')
    def sub():
        k = r.random()
        if k < .4: a, b = L(rint(r, -15, 15)), L(rint(r, -15, 15))
        elif k < .7: a, b = Lit(rdec(r, -6, 6), 'dec'), Lit(rdec(r, -9, 9), 'dec')
        else: a, b = L(rfrac(r, (2, 3, 5, 6, 7), 1, 9)), L(rfrac(r, (2, 3, 4, 5, 6), 1, 7))
        expr_q(u, C(a, '−', b), 5, '4', '減法')
    def mix():
        vals = [rint(r, -9, 9) for _ in range(r.choice([3, 4]))]
        ops = [r.choice(['+', '−']) for _ in vals[1:]]
        parts = [L(vals[0])]
        for op, v in zip(ops, vals[1:]): parts += [op, L(v)]
        expr_q(u, C(*parts), 5, '5', '加減の混じった計算')
    def mixd():
        vals = [rdec(r, -8, 8) if r.random() < .5 else F(rint(r, -9, 9)) for _ in range(3)]
        ops = [r.choice(['+', '−']) for _ in range(2)]
        lits = [Lit(v, 'dec' if v.denominator != 1 else 'int') for v in vals]
        expr_q(u, C(lits[0], ops[0], lits[1], ops[1], lits[2]), 7, '5', '小数をふくむ加減')
    def mixf():
        dens = (2, 3, 4, 5, 6)
        vals = [rfrac(r, dens, 1, 5) for _ in range(3)]
        expr_q(u, C(L(vals[0]), r.choice(['+', '−']), L(vals[1]), r.choice(['+', '−']), L(vals[2])), 7, '5', '分数の加減')
    def mul():
        if r.random() < .5:
            expr_q(u, C(L(rint(r, -12, 12)), '×', L(rint(r, -9, 9))), 8, '1', '乗法')
        else:
            expr_q(u, C(L(rint(r, -6, 6)), '×', L(rint(r, -5, 5)), '×', L(rint(r, -4, 4))), 8, '2', '3つ以上の数の乗法')
    def mulf():
        a, b = rfrac(r, (2, 3, 4, 5, 6, 8, 9), 1, 9), rfrac(r, (2, 3, 4, 5, 6, 8, 9), 1, 9)
        e = C(L(a), '×', L(b))
        if nice(e.val(), 40): expr_q(u, e, 8, '1', '分数の乗法')
    def power():
        k = r.random(); a = r.randint(2, 5); n = r.randint(2, 4)
        if k < .35: e = Pow(L(-a), n)
        elif k < .7: e = Neg(Pow(L(a), n))
        elif k < .85: e = C(L(r.choice([2, 3, -2, -3, 4])), '×', Pow(L(r.choice([2, 3, 4])), 2))
        else: e = Pow(L(rfrac(r, (2, 3, 4, 5), 1, 4)), r.choice([2, 3]))
        if nice(e.val(), 200, 700): expr_q(u, e, 9, '3', '累乗', lead='次の計算をしよう。')
    def div():
        b = rint(r, -9, 9); q = rint(r, -12, 12)
        if r.random() < .6: expr_q(u, C(L(b * q), '÷', L(b)), 9, '4', '除法')
        else:
            a, c = rfrac(r, (2, 3, 4, 5, 6), 1, 7), rfrac(r, (2, 3, 4, 5, 6), 1, 7)
            e = C(L(a), '÷', L(c))
            if nice(e.val(), 30): expr_q(u, e, 9, '4', '分数の除法')
    def muldiv():
        a, b, c = rint(r, -8, 8), rint(r, -6, 6), rint(r, -6, 6)
        e = r.choice([C(L(a), '×', L(b), '÷', L(c)), C(L(a), '÷', L(b), '×', L(c)), C(L(a * b), '÷', L(b), '÷', L(c))])
        if nice(e.val(), 12, 200): expr_q(u, e, 9, '5', '乗除の混じった計算')
    def four():
        a, b, c = rint(r, -12, 12), rint(r, -6, 6), rint(r, -6, 6)
        e = r.choice([C(L(a), '+', L(b), '×', L(c)), C(L(a), '−', L(b), '×', L(c)), C(L(b * c), '÷', L(b), '−', L(a)), C(L(a), '×', L(b), '+', L(c * b), '÷', L(b))])
        expr_q(u, e, 10, '1', '四則の混じった計算')
    def fourpow():
        a = r.choice([2, 3, 4, 5]); b = rint(r, -12, 12); c = r.choice([-2, -3, 2, 3])
        e = r.choice([C(Pow(L(a), 2), '−', L(b)), C(Pow(L(-a), 2), '+', L(b)), C(Neg(Pow(L(a), 3)), '+', L(c), '×', Pow(L(-2), 2)),
                      C(Pow(L(c), 3), '÷', L(-4 if c % 2 == 0 else c), '−', Pow(L(a), 2)), C(L(abs(b) or 2), '×', Pow(L(a), 2), '−', L(c), '×', Pow(L(3), 2))])
        if nice(e.val(), 12, 400): expr_q(u, e, 10, '2', '累乗のある式の計算')
    def paren():
        a, b, c, d = rint(r, -9, 9), rint(r, -9, 9), rint(r, -6, 6), rint(r, -6, 6)
        e = r.choice([C(L(a), '+', L(c), '×', Grp(C(L(b), '−', L(d)))), C(Grp(C(L(a), '−', Pow(L(2), 2), '×', L(c))), '+', L(b)),
                      C(L(a * 3), '÷', Grp(C(L(1), '−', L(4))), '+', L(d))])
        if nice(e.val(), 12, 400): expr_q(u, e, 11, '3', 'かっこのある式の計算')
    def distrib():
        dens = r.choice([(2, 3), (3, 4), (4, 6), (5, 2), (6, 4)]); n = math.lcm(*dens) * r.choice([1, 2])
        a, b = F(rint(r, -5, 5), dens[0]), F(rint(r, -5, 5), dens[1])
        if a.denominator == 1 or b.denominator == 1: return
        e = C(Grp(C(L(a), '+', L(b))), '×', L(n if r.random() < .6 else -n))
        expr_q(u, e, 11, '4', '分配法則', lead='分配法則を利用して、次の計算をしよう。')
    def distrib2():
        k = rint(r, -9, 9); a, b = r.randint(10, 40), r.randint(10, 40)
        e = C(L(k), '×', L(a), '+', L(k), '×', L(b))
        u.add(f'分配法則を利用して、次の計算をくふうしてしよう。\n{show(e)}', num(e.val()), f'{fx(k)}×({a}＋{b})＝{fx(k)}×{a + b}＝{fx(e.val())}', 11, '4(3)', '分配法則の逆', near=[ans_str(k * a + b)])
    def table():
        base = r.choice([60, 65, 70, 75, 80]); names = 'ABCDEFGH'[:r.choice([5, 6])]
        diffs = [rint(r, -15, 18, nonzero=False) for _ in names]
        if len(set(diffs)) < len(diffs): return
        tbl = '　'.join(f'{n}：{"＋" if d > 0 else ("−" if d < 0 else "")}{abs(d)}' for n, d in zip(names, diffs))
        kind = r.random()
        head = f'次は、{len(names)}人のテストの得点を、{base}点を基準にして、基準との差を正負の数で表したものである。\n{tbl}\n'
        if kind < .3:
            i = r.randrange(len(names))
            u.add(head + f'{names[i]}の得点は何点か。', num(base + diffs[i]), f'{base}＋（{fx(diffs[i])}）＝{base + diffs[i]}点', 12, '1(1)', '基準のある表', near=[ans_str(base - diffs[i])])
        elif kind < .6:
            u.add(head + '得点の最も高い人と最も低い人の差は何点か。', num(max(diffs) - min(diffs)), f'{fx(max(diffs))}−（{fx(min(diffs))}）＝{max(diffs) - min(diffs)}点', 12, '1(2)', '基準のある表', near=[ans_str(max(diffs) + min(diffs))])
        else:
            avg = base + F(sum(diffs), len(names))
            if avg.denominator not in (1, 2, 5, 10): return
            u.add(head + f'{len(names)}人の平均点は何点か。', num_answer(avg, True), f'平均＝基準＋差の平均＝{base}＋（{sum(diffs)}）÷{len(names)}＝{fmt_num(avg, "dec")}点', 12, '1(3)', '平均の簡単な求め方', near=[ans_str(F(sum(diffs), len(names)))])
    def primes():
        pool = r.sample(range(1, 70), 9)
        ps = [x for x in pool if x > 1 and all(x % d for d in range(2, int(x ** .5) + 1))]
        if len(ps) < 2: return
        u.add('次の整数の中から、素数をすべて選んで書こう（読点で区切る）。\n' + '、'.join(map(str, sorted(pool))), nums_answer(ps), '素数は、1とその数自身のほかに約数がない、1より大きい自然数。' + '、'.join(map(str, sorted(ps))) + 'が素数。1は素数ではない。', 13, '3', '素数')
    def factor():
        n = r.choice([2, 3, 2, 5, 3, 7]) * r.choice([2, 3, 4, 6, 9, 5, 8, 12]) * r.choice([1, 2, 3, 5])
        if n < 12 or n > 400: return
        f, m, d = {}, n, 2
        while m > 1:
            while m % d == 0: f[d] = f.get(d, 0) + 1; m //= d
            d += 1
        sup = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
        forms = set()
        for style in ('sup', 'caret'):
            for sep in ('×', '*', '・'):
                parts = [str(p) if e == 1 else (f'{p}{str(e).translate(sup)}' if style == 'sup' else f'{p}^{e}') for p, e in sorted(f.items())]
                forms.add(sep.join(parts))
        expanded = '×'.join(str(p) for p, e in sorted(f.items()) for _ in range(e))
        main = '×'.join(str(p) if e == 1 else f'{p}{str(e).translate(sup)}' for p, e in sorted(f.items()))
        u.add(f'{n}を素因数分解しよう（同じ数の積は累乗の形で書く。例：2³×3）。', exact_answer([main] + sorted(forms - {main}), compact=True),
              f'小さい素数から順にわっていく。{n}＝{expanded}＝{main}', 13, '4', '素因数分解', near=[expanded] if expanded != main else [])
    def gcdlcm():
        g = r.choice([2, 3, 4, 5, 6]); a, b = g * r.randint(2, 9), g * r.randint(2, 9)
        if a == b or math.gcd(a, b) == min(a, b): return
        if r.random() < .5:
            u.add(f'{a}と{b}の最大公約数を求めよう。', num(math.gcd(a, b)), f'素因数分解して共通な素数を全部かける。最大公約数は{math.gcd(a, b)}', 13, '5', '最大公約数', near=[ans_str(math.lcm(a, b))])
        else:
            u.add(f'{a}と{b}の最小公倍数を求めよう。', num(math.lcm(a, b)), f'共通な素数と残りの素数をかける。最小公倍数は{math.lcm(a, b)}', 13, '5', '最小公倍数', near=[ans_str(math.gcd(a, b)), ans_str(a * b)])
    def lastdigit():
        b = r.choice([2, 3, 7, 8]); n = r.randint(11, 30)
        cyc = [pow(b, k, 10) for k in range(1, 5)]
        u.add(f'{b}の{n}乗を計算したとき、その一の位の数を求めよう。', num(pow(b, n, 10)), f'{b}をかけていくと、一の位は {"→".join(map(str, cyc))} の4つをくり返す。{n}÷4のあまりは{n % 4}なので、一の位は{pow(b, n, 10)}', 15, '3(1)', '累乗の一の位')
    def dice():
        left, right = r.choice([(2, 3), (1, 2), (3, 2), (2, 1)]); t = r.randint(8, 15); ev = r.randint(1, t - 1)
        pos = ev * right - (t - ev) * left
        u.add(f'数直線上の0の位置に点Pがある。さいころを投げて、奇数の目が出ると点Pは左へ{left}目盛り、偶数の目が出ると右へ{right}目盛り進む。さいころを{t}回投げ、偶数の目が{ev}回出たとき、点Pはどの位置にあるか。数で答えよう。',
              num(pos), f'右へ{right}×{ev}＝{right * ev}、左へ{left}×{t - ev}＝{left * (t - ev)}。{right * ev}−{left * (t - ev)}＝{pos}', 17, '4(1)', '正負の数の利用', near=[ans_str(-pos)])
    fixed = [
        ('a、bがどんな自然数でも、答えがいつも自然数になる計算はどれか。すべて選ぼう。\nア a＋b　イ a−b　ウ a×b　エ a÷b', choice_answer('アウ'), '自然数どうしのたし算とかけ算は必ず自然数。ひき算（2−5）やわり算（2÷4）は自然数にならないことがある。', 11, '5(1)', '数の集合と四則', ['ア', 'ウ']),
        ('整数の集合では、除法はいつでもできるとは限らない。除法がいつでもできるようにするには、さらにどんな数があればよいか。', exact_answer(['分数', '分数（小数）', '小数', '分数や小数']), '整数どうしの除法は分数（小数）になることがある。数全体の集合まで広げれば、0でわる場合を除いていつでもできる。', 11, '5(2)', '数の集合と四則', ['整数']),
        ('次のうち、正しくないものをすべて選ぼう。\nア 2つの自然数の和は必ず自然数　イ 自然数を自然数でわった商は必ず自然数　ウ 2つの整数の差は必ず整数　エ 2つの数の積が正なら、2つの数の和は必ず正', choice_answer('イエ'), 'イは2÷3、エは(−2)×(−3)＝6のとき和が−5となる例がある。', 15, '3(2)', '数の性質', ['イ', 'エ']),
        ('自然数全体の集まりを何というか。', exact_answer(['自然数の集合', '自然数全体の集合']), '1、2、3、…の集まりを自然数の集合という。0と負の整数を合わせたものが整数の集合。', 10, 'まとめ3', '数の集合', ['整数の集合']),
        ('約数が1とその数自身の2つしかない自然数を何というか。', exact_answer(['素数', 'そすう']), '素数（2、3、5、7、…）。1は素数にふくめない。', 12, 'まとめ2', '素数', ['約数']),
        ('自然数を素数の積で表すことを何というか。', exact_answer(['素因数分解', 'そいんすうぶんかい']), '素因数分解。例：45＝3²×5', 12, 'まとめ2', '素因数分解', ['因数分解']),
        ('平均を求めるとき、計算を簡単にするために仮に決めた基準の値を何というか。', exact_answer(['仮平均', 'かりへいきん']), '仮平均。平均＝仮平均＋（仮平均との差の平均）。', 13, 'Guide', '仮平均', ['平均']),
        ('10以上30以下の素数をすべて書こう（読点で区切る）。', nums_answer([11, 13, 17, 19, 23, 29]), '11、13、17、19、23、29。', 16, '1(1)', '素数', ['11、13、17、19、23']),
        ('面積が196cm²の正方形の1辺の長さは何cmか。素因数分解を利用して求めよう。', num(14), '196＝2²×7²＝(2×7)²なので、1辺は14cm。', 16, '1(3)', '素因数分解の利用', ['98']),
        ('12、18、30の最大公約数を求めよう。', num(6), '12＝2²×3、18＝2×3²、30＝2×3×5。共通な素数は2と3で、最大公約数は6。', 16, '1(2)', '最大公約数', ['180']),
        ('12、18、30の最小公倍数を求めよう。', num(180), '2²×3²×5＝180。', 16, '1(2)', '最小公倍数', ['6']),
    ]
    fixed_i = iter(fixed)
    def fixedq():
        p, a, e, page, nb, tp, nr = next(fixed_i)
        u.add(p, a, e, page, nb, tp, nr)
    plan = [add2, sub, addfd, add3, mix, mixd, mul, power, div, muldiv, four, fourpow, paren, distrib, mixf, table, primes, factor, gcdlcm,
            mulf, distrib2, lastdigit, dice, fixedq]
    fill(u, plan)
    guide = [{'title': '同符号・異符号の加法', 'body': '同符号の2数の和は、絶対値の和に共通の符号をつける。異符号の2数の和は、絶対値の大きいほうから小さいほうをひき、絶対値の大きいほうの符号をつける。例：(−5)＋(＋8)＝＋3'},
             {'title': '減法は加法になおす', 'body': 'ひく数の符号を変えて加える。a−b＝a＋(−b)。例：(−3)−(−7)＝(−3)＋(＋7)＝4。項が多いときは、正の項と負の項をそれぞれまとめてから計算する。'},
             {'title': '乗除の符号', 'body': '負の数が偶数個なら＋、奇数個なら−。わり算は、わる数の逆数をかけるかけ算になおす。例：(−6)÷(−3/4)＝(−6)×(−4/3)＝8'},
             {'title': '計算の順序と累乗', 'body': '累乗 → かっこの中 → 乗除 → 加減 の順に計算する。(−3)²＝9 と −3²＝−9 のちがいに注意。'},
             {'title': '素因数分解と最大公約数・最小公倍数', 'body': '小さい素数から順にわって素因数分解する。最大公約数は共通な素数をすべてかけ、最小公倍数は共通な素数と残りの素数をかける。例：8＝2³、28＝2²×7 → 最大公約数4、最小公倍数56'}]
    note = '2026-10-08 Claude作成。数学ドリルp4〜17（2 正負の数の加減・3 乗除・4 四則計算・5 正負の数の利用、標準問題・実力問題①②）を写真で目視し、数・条件を変えた類題を作った。手書きの答えは使っていない。'
    return u, guide, note
