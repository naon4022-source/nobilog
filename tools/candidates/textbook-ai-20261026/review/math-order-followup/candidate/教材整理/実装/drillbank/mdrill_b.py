"""数学ドリル 第2章 文字と式（ドリル p18〜33）"""
from mcommon import *

def unit():
    u = DUnit('drill-math-1-moji', '文字と式', '文字式')
    r = rng(2002)
    LET = 'abxymn'
    def omitmul():
        k = rint(r, -9, 9); vs = sorted(r.sample('abxy', r.choice([1, 2])))
        reps = {v: r.choice([1, 1, 2]) for v in vs}
        factors = [str(k) if k > 0 else f'({MI}{-k})'] + [v for v in vs for _ in range(reps[v])]
        r.shuffle(factors)
        mono = ''.join(v + (f'^{reps[v]}' if reps[v] > 1 else '') for v in vs)
        val = ('-' if k < 0 else '') + ('' if abs(k) == 1 else str(abs(k))) + mono
        disp = ('−' if k < 0 else '') + ('' if abs(k) == 1 else str(abs(k))) + ''.join(v + ('²' if reps[v] == 2 else '') for v in vs)
        u.add('次の式を、×の記号を使わないで表そう。\n' + '×'.join(factors), expr_answer(val, order=True),
              f'数は文字の前に書き、文字はアルファベット順、同じ文字の積は累乗で表す。答え {disp}', 18, '1', '積の表し方')
    def omitdiv():
        k = r.choice([2, 3, 4, 5, 6, 7, 9]); kind = r.random()
        if kind < .3:
            v = r.choice('abxy'); c = rint(r, -8, 8)
            if math.gcd(abs(c), k) != 1: return
            val = f'{c}{v}/{k}'.replace('1' + v, v) if abs(c) == 1 else f'{c}{v}/{k}'
            if c == -1: val = f'-{v}/{k}'
            u.add(f'次の式を、÷の記号を使わないで表そう。\n{term(c, v, True)}÷{k}', expr_answer(val), f'わる数を分母にして分数の形で表す。答え {term(c, v, True)}/{k}', 18, '2', '商の表し方')
        elif kind < .55:
            v = r.choice('ax'); c = rint(r, -9, 9)
            u.add(f'次の式を、÷の記号を使わないで表そう。\n{"(" + MI + str(-c) + ")" if c < 0 else c}÷{v}', expr_answer(f'{c}/{v}'),
                  f'文字でわるときも分数の形にする。答え {(MI if c < 0 else "") + str(abs(c))}/{v}', 18, '2', '商の表し方')
        elif kind < .8:
            a, b = r.sample('abxy', 2); a, b = sorted([a, b])
            u.add(f'次の式を、÷の記号を使わないで表そう。\n({a}＋{b})÷{k}', expr_answer(f'({a}+{b})/{k}'), f'かっこの式全体を分子にする。答え ({a}＋{b})/{k}', 18, '2', '商の表し方', near=[f'{a}+{b}/{k}'])
        else:
            q = rint(r, -6, 6); v = r.choice('ax')
            sgn = r.choice([1, -1])
            val = lin(F(q * sgn), 0, v)
            u.add(f'次の式を、÷の記号を使わないで表そう。\n{q * k}{v}÷{"(" + MI + str(k) + ")" if sgn < 0 else k}', expr_answer(val), f'数どうしで約分する。答え {lin(F(q * sgn), 0, v, True)}', 18, '2', '商の表し方')
    def mixed():
        a = r.choice([2, 3, 4, 5, 7, 9]); k = r.choice([-1, 1])
        kind = r.random()
        if kind < .5:
            u.add(f'次の式を、×、÷の記号を使わないで表そう。\na÷{a}×{"(" + MI + "b)" if k < 0 else "b"}', expr_answer(('-' if k < 0 else '') + f'ab/{a}'),
                  f'a÷{a}×b＝a×(1/{a})×b。答え {"−" if k < 0 else ""}ab/{a}', 19, '3', '四則混合の表し方')
        else:
            c = r.choice([2, 3, 5, 6]); d = r.choice([2, 4, 7])
            u.add(f'次の式を、×、÷の記号を使わないで表そう。\n{c}−x÷{d}×y', expr_answer(f'{c}-xy/{d}'), f'＋、−は省けない。x÷{d}×y＝xy/{d}。答え {c}−xy/{d}', 19, '3', '四則混合の表し方', near=[f'({c}-x)y/{d}'])
    def withsign():
        c = rint(r, -9, 9); v = sorted(r.sample('abxy', 2))
        acc = [f'{c}×{v[0]}×{v[1]}', f'({c})×{v[0]}×{v[1]}', f'{c}*{v[0]}*{v[1]}', f'{v[0]}×{v[1]}×{c}', f'{v[0]}×{v[1]}×({c})']
        acc = [a.replace('(-', '(−').replace('-', '−') for a in acc] + acc
        u.add(f'次の式を、×の記号を使って表そう。\n{term(c, v[0] + v[1], True)}', exact_answer(acc, compact=True), f'{term(c, v[0] + v[1], True)}＝{c}×{v[0]}×{v[1]}（数と文字、文字と文字の間に×を入れる）', 19, '4', '×を使った表し方')
    QUANT = [
        (lambda a: (f'1個{a}円のパンをx個買ったときの代金', f'{a}x', ['円'], f'代金＝単価×個数＝{a}x（円）'), 20, '1(1)'),
        (lambda a: (f'{a}人が同じ金額ずつ出し合ってx円の品物を買ったときの、1人あたりの金額', f'x/{a}', ['円'], f'x÷{a}＝x/{a}（円）'), 20, '1(2)'),
        (lambda a: (f'1辺がa cmの正{a if a > 2 else 3}角形の周の長さ'.replace(f'正{a}角形', f'正{a}角形') if a >= 3 else ('', '', [], ''), f'{a}a', ['cm'], f'{a}×a＝{a}a（cm）'), 20, '2(1)'),
        (lambda a: (f'a mの道のりを分速{a} mで歩いたときにかかる時間（分）', f'a/{a}', ['分'], f'時間＝道のり÷速さ＝a/{a}（分）'), 21, '3(1)'),
        (lambda a: (f'a mの道のりを分速b mで{a}分進んだときの残りの道のり', f'a-{a}b', ['m'], f'残り＝a−b×{a}＝a−{a}b（m）'), 21, '3(2)'),
        (lambda a: (f'x円の{a}割', f'{a}x/10', ['円'], f'1割＝1/10。x×{a}/10＝{a}x/10（円）'), 21, '4(1)'),
        (lambda a: (f'x円の{a}％', f'{a}x/100', ['円'], f'1％＝1/100。x×{a}/100＝{a}x/100（円）'), 21, '4(2)'),
        (lambda a: (f'濃度{a}％の食塩水x gにふくまれる食塩の重さ', f'{a}x/100', ['g'], f'食塩の重さ＝食塩水の重さ×濃度/100＝{a}x/100（g）'), 21, '4(3)'),
        (lambda a: (f'定価a円の品物を{a}％引きで買ったときの代金', f'{100 - a}a/100', ['円'], f'a×(1−{a}/100)＝{100 - a}a/100（円）'), 23, '4(2)'),
        (lambda a: (f'原価{a * 100}円の品物に、x割の利益を見込んでつけた定価', f'{a * 100}+{a * 10}x', ['円'], f'{a * 100}×(1＋x/10)＝{a * 100}＋{a * 10}x（円）'), 23, '4(1)'),
    ]
    def quant():
        f, page, nb = r.choice(QUANT); a = r.choice([3, 4, 5, 6, 7, 8, 9])
        p, val, units, e = f(a)
        if not p: return
        u.add(f'次の数量を表す式を書こう。\n{p}', expr_answer(val, units=units), e, page, nb, '数量を表す式')
    def quant2():
        kind = r.random()
        if kind < .25:
            u.add('十の位がa、一の位がbである2けたの正の整数を、a、bを使って表そう。', expr_answer('10a+b'), '十の位の数は10倍する。10a＋b', 20, '1(3)', '数量を表す式', near=['ab', 'a+b'])
        elif kind < .5:
            n = r.choice([3, 4, 5]); names = 'abc'[:n] if n == 3 else 'abcd'[:n]
            u.add(f'{n}回のテストの得点がそれぞれ{"点、".join(names)}点のとき、{n}回の平均点を表す式を書こう。', expr_answer(f'({"+".join(names)})/{n}', units=['点']), f'平均＝合計÷回数＝({"＋".join(names)})/{n}', 20, '1(4)', '平均の表し方', near=["+".join(names[:-1]) + f'+{names[-1]}/{n}'])
        elif kind < .75:
            m, k = r.choice([(2, 3), (3, 2), (4, 3), (5, 2)])
            u.add(f'x kgの荷物{m}個とy kgの荷物{k}個があるとき、これら{m + k}個の平均の重さを表す式を書こう。', expr_answer(f'({m}x+{k}y)/{m + k}', units=['kg']), f'合計は{m}x＋{k}y（kg）。平均は({m}x＋{k}y)/{m + k}（kg）', 22, '1(6)', '平均の表し方', near=[f'(x+y)/{m + k}'])
        else:
            a = r.choice([3, 4, 5, 6, 7])
            u.add(f'aでわったとき、商がbで余りが{a - 1 if a > 2 else 1}になる数を表す式を書こう。', expr_answer(f'ab+{a - 1 if a > 2 else 1}'), f'わられる数＝わる数×商＋余り＝ab＋{a - 1 if a > 2 else 1}', 22, '1(3)', 'わり算の関係', near=[f'a/b+{a - 1 if a > 2 else 1}'])
    UNITS = [('a分', '秒', '60a', '1分＝60秒'), ('b分', '時間', 'b/60', '1時間＝60分'), ('x g', 'kg', 'x/1000', '1kg＝1000g'), ('y L', 'mL', '1000y', '1L＝1000mL'),
             ('p cm', 'm', 'p/100', '1m＝100cm'), ('q km', 'm', '1000q', '1km＝1000m'), ('y m²', 'cm²', '10000y', '1m²＝10000cm²'), ('a時間', '分', '60a', '1時間＝60分'),
             ('x cmとy mmの和', 'mm', '10x+y', '1cm＝10mm'), ('a時間とb分の和', '分', '60a+b', '1時間＝60分'), ('x kgとy gの和', 'g', '1000x+y', '1kg＝1000g')]
    unit_i = iter(UNITS)
    def unitconv():
        a, to, val, why = next(unit_i)
        u.add(f'{a}を、（{to}）の単位で表そう。', expr_answer(val, units=[to]), f'{why}なので {val.replace("-", MI)}（{to}）', 21 if 'の和' not in a else 22, '5' if 'の和' not in a else '2', '式と単位')
    def coef():
        a, b = rint(r, -9, 9), rint(r, -9, 9); v = r.choice('xay')
        if r.random() < .5:
            u.add(f'1次式 {lin(a, b, v, True)} で、{v}の係数を答えよう。', num(a), f'文字の項 {term(a, v, True)} の数の部分が係数。答え {fx(a)}', 24, '1', '項と係数', near=[ans_str(F(b))])
        else:
            c = r.choice([2, 3, 4, 5, 8]); k = r.choice([1, -1])
            u.add(f'次の式で、{v}の係数を答えよう。\n{"−" if k < 0 else ""}{v}/{c}', num(F(k, c)), f'{v}/{c}＝(1/{c}){v}なので係数は{fx(F(k, c))}', 24, '1(4)', '項と係数', near=[ans_str(F(c * k))])
    def like():
        v = r.choice('axyb'); a, b = rint(r, -9, 9), rint(r, -9, 9)
        if r.random() < .6:
            c, d = rint(r, -9, 9), rint(r, -9, 9)
            ex = f'{term(a, v, True)}{term(c, "")}{term(b, v)}{term(d, "")}'
            u.add(f'次の式を簡単にしよう。\n{ex}', expr_answer(lin(a + b, c + d, v)), f'文字の項どうし、数の項どうしをまとめる。{fx(a)}＋（{fx(b)}）＝{fx(a + b)}、{fx(c)}＋（{fx(d)}）＝{fx(c + d)}。答え {lin(a + b, c + d, v, True)}', 25, '3', '式を簡単にする', near=[lin(a - b, c + d, v)])
        else:
            a, b = rfrac(r, (2, 3, 4, 5, 6), 1, 5), rfrac(r, (2, 3, 4, 5, 6), 1, 5)
            if a + b == 0: return
            u.add(f'次の式を簡単にしよう。\n{term(a, v, True)}{term(b, v)}', expr_answer(lin(a + b, 0, v)), f'係数をまとめる。{fx(a)}＋（{fx(b)}）＝{fx(a + b)}。答え {lin(a + b, 0, v, True)}', 24, '2', '文字の部分が同じ項')
    def addsub():
        v = r.choice('axy'); a, b, c, d = (rint(r, -9, 9) for _ in range(4)); op = r.choice(['＋', '−'])
        s = 1 if op == '＋' else -1
        u.add(f'次の計算をしよう。\n({lin(a, b, v, True)}){op}({lin(c, d, v, True)})', expr_answer(lin(a + s * c, b + s * d, v)),
              ('かっこをそのままはずす。' if s > 0 else '−( ) は各項の符号を変えてはずす。') + f'答え {lin(a + s * c, b + s * d, v, True)}', 25, '4', '1次式の加減',
              near=[lin(a + s * c, b + d, v)] if s < 0 else [])
    def muldiv():
        v = r.choice('axy'); kind = r.random()
        if kind < .5:
            k = rint(r, -6, 6); a, b = rint(r, -9, 9), rint(r, -9, 9)
            u.add(f'次の計算をしよう。\n{"(" + MI + str(-k) + ")" if k < 0 else k}({lin(a, b, v, True)})', expr_answer(lin(k * a, k * b, v)), f'分配法則で、かっこの中の各項に{fx(k)}をかける。答え {lin(k * a, k * b, v, True)}', 25, '6', '1次式と数の乗法', near=[lin(k * a, b, v)])
        else:
            k = r.choice([-5, -4, -3, -2, 2, 3, 4, 5]); a, b = rint(r, -4, 4) * k, rint(r, -4, 4) * k
            u.add(f'次の計算をしよう。\n({lin(a, b, v, True)})÷{"(" + MI + str(-k) + ")" if k < 0 else k}', expr_answer(lin(F(a, k), F(b, k), v)), f'各項を{fx(k)}でわる。答え {lin(F(a, k), F(b, k), v, True)}', 25, '6', '1次式と数の除法', near=[lin(F(a, k), b, v)])
    def combo():
        v = r.choice('axy'); p, q = rint(r, -4, 5), rint(r, -4, 5); a, b, c, d = (rint(r, -6, 6) for _ in range(4))
        ra, rb = p * a + q * c, p * b + q * d
        if ra == 0: return
        ps = f'{p}' if p > 0 else f'{MI}{-p}'; qs = f'＋{q}' if q > 0 else f'{MI}{-q}'
        if abs(p) == 1: ps = '' if p == 1 else MI
        if abs(q) == 1: qs = '＋' if q == 1 else MI
        u.add(f'次の計算をしよう。\n{ps}({lin(a, b, v, True)}){qs}({lin(c, d, v, True)})', expr_answer(lin(ra, rb, v)), f'それぞれ分配法則でかっこをはずし、同類項をまとめる。答え {lin(ra, rb, v, True)}', 26, '2', 'いろいろな計算',
              near=[lin(p * a + q * c, p * b + q * d * -1, v)] if q * d else [])
    def fracmul():
        d = r.choice([2, 3, 4, 5, 6]); k = d * r.choice([2, 3, -2, -3, 1, -1]); a, b = rint(r, -7, 7), rint(r, -7, 7)
        if k in (d, -d) and r.random() < .5: return
        u.add(f'次の計算をしよう。\n{"(" + MI + str(-k) + ")" if k < 0 else k}×({lin(a, b, "x", True)})/{d}', expr_answer(lin(F(k * a, d), F(k * b, d))),
              f'先に分母と{fx(k)}を約分してから分配法則を使う。答え {lin(F(k * a, d), F(k * b, d), "x", True)}', 26, '3', '分数の形の式と数の乗法')
    def fracform():
        d1, d2 = r.choice([(2, 3), (3, 4), (4, 6), (2, 5), (6, 4), (3, 2)]); L_ = math.lcm(d1, d2)
        a, b, c, e = rint(r, -5, 5), rint(r, -5, 5), rint(r, -5, 5), rint(r, -5, 5); op = r.choice([1, -1])
        A = F(a, d1) + op * F(c, d2); B = F(b, d1) + op * F(e, d2)
        num_ = lin(A * L_, B * L_, 'x')
        val = f'({num_})/{L_}'
        u.add(f'次の計算をしよう。\n({lin(a, b, "x", True)})/{d1} {"＋" if op > 0 else MI} ({lin(c, e, "x", True)})/{d2}', expr_answer(val, form='any'),
              f'分母を{L_}にそろえて分子を計算する。答え ({lin(A * L_, B * L_, "x", True)})/{L_}', 27, '6', '分数の形の式の加減')
    def subst():
        x = rint(r, -5, 5); kind = r.random()
        if kind < .5:
            a, b = rint(r, -6, 6), rint(r, -9, 9)
            u.add(f'x＝{fx(x)}のとき、次の式の値を求めよう。\n{lin(a, b, "x", True)}', num(a * x + b), f'xに({fx(x)})を代入する。{fx(a)}×({fx(x)})＋({fx(b)})＝{fx(a * x + b)}', 28, '1', '式の値', near=[ans_str(F(-a * x + b))])
        elif kind < .8:
            k = r.choice([2, 3]); s = r.choice([1, -1])
            v = s * x ** k
            u.add(f'x＝{fx(x)}のとき、次の式の値を求めよう。\n{"−" if s < 0 else ""}x{"²" if k == 2 else "³"}', num(v), f'{"−" if s < 0 else ""}({fx(x)}){"²" if k == 2 else "³"}＝{fx(v)}', 28, '1(7)', '式の値（累乗）', near=[ans_str(F(-v))])
        else:
            a = r.choice([2, 3, 4]); b = r.choice([1, 2])
            v = a * x ** 2 - x ** 3 * b
            u.add(f'x＝{fx(x)}のとき、次の式の値を求めよう。\n{a}x²{MI}{"" if b == 1 else b}x³', num(v), f'{a}×({fx(x)})²−{"" if b == 1 else str(b) + "×"}({fx(x)})³＝{fx(v)}', 28, '2(6)', '式の値（累乗）')
    REL = [
        (lambda a, b, c: (f'ある数xを{a}倍して{b}をひくと、{c}になる。', f'{a}x-{b}={c}'), 29, '3(1)'),
        (lambda a, b, c: (f'a円のメロンを{a}個と{b}0円のりんごを3個買ったところ、代金は{c}00円になった。', f'{a}a+{b * 30}={c * 100}'), 29, '3(2)'),
        (lambda a, b, c: (f'ある数xを{a}倍して{b}を加えると、{c}より大きい。', f'{a}x+{b}>{c}'), 29, '4(1)'),
        (lambda a, b, c: (f'{c * 10}枚ある色紙を、a人の子どもに1人{a}枚ずつ配ろうとすると、足りない。', f'{c * 10}<{a}a'), 29, '4(2)'),
        (lambda a, b, c: (f'重さx kgの箱に、1個{a} kgの品物をy個つめても、全体の重さは{c} kg以下である。', f'x+{a}y<={c}'), 29, '4(3)'),
        (lambda a, b, c: (f'1本x円の鉛筆{a}本と1冊y円のノート{b}冊の代金の合計は、{c}00円以下である。', f'{a}x+{b}y<={c * 100}'), 30, '4(2)'),
    ]
    def rel():
        f, page, nb = r.choice(REL); a, b, c = r.randint(2, 6), r.randint(2, 9), r.randint(11, 30)
        p, val = f(a, b, c)
        u.add(f'次の数量の関係を、等式または不等式で表そう。\n{p}', relation_answer(val), '左辺と右辺の数量を式に表し、等号（＝）や不等号（＜、≦など）でつなぐ。答え ' + val.replace('<=', '≦').replace('-', MI), page, nb, '等式・不等式')
    PAT = [('マッチ棒を並べて、正三角形を左から順につないでいく（1個目は3本、1個増えるごとに2本ずつ増える）。', 3, 2, 29, '5'),
           ('マッチ棒を並べて、正方形を右方向につないでいく（1個目は4本、1個増えるごとに3本ずつ増える）。', 4, 3, 44, '5'),
           ('長さ10 cmのリボンを、のりしろ2 cmでつなげていく（1本ふえるごとに8 cmずつ長くなる）。', 10, 8, 33, '7')]
    def pattern():
        desc, first, step, page, nb = r.choice(PAT); n = r.randint(4, 12)
        what = '全体の長さは何cm' if 'リボン' in desc else 'マッチ棒は何本'
        if r.random() < .6:
            u.add(f'{desc}\n{n}{"本つないだ" if "リボン" in desc else "個つくった"}とき、{what}か。', num(first + step * (n - 1)), f'{first}＋{step}×({n}−1)＝{first + step * (n - 1)}', page, nb, '規則性')
        else:
            u.add(f'{desc}\nn{"本つないだ" if "リボン" in desc else "個つくった"}とき、{what}になるか。nを使った式で表そう。', expr_answer(lin(step, first - step, 'n')), f'{first}＋{step}(n−1)＝{lin(step, first - step, "n", True)}', page, nb, '規則性')
    plan = [omitmul, omitdiv, mixed, quant, coef, like, addsub, muldiv, combo, subst, rel, quant2, fracmul, fracform, pattern, withsign, unitconv, omitmul, quant, like]
    fill(u, plan)
    guide = [{'title': '×と÷の記号をはぶく', 'body': '数は文字の前、文字はアルファベット順、同じ文字の積は累乗で書く。1と−1は書かずに x、−x とする。わり算は分数の形にする。例：x÷(−7)＝−x/7、a×b×(−3)＝−3ab'},
             {'title': '数量を式に表す', 'body': '代金＝単価×個数、時間＝道のり÷速さ、比べる量＝もとにする量×割合。1割＝1/10、1％＝1/100。単位をそろえることも忘れない（1時間＝60分、1kg＝1000g）。'},
             {'title': '同類項をまとめる', 'body': '文字の部分が同じ項（同類項）は係数をまとめる。5x＋3x＝8x。数の項どうしもまとめる。−( ) をはずすときは、かっこの中のすべての項の符号を変える。'},
             {'title': '分配法則と分数の形の式', 'body': 'a(b＋c)＝ab＋ac。分数の形の式に数をかけるときは、先に分母と約分する。分数の形の式どうしの加減は、分母の最小公倍数で通分して分子を計算する。'},
             {'title': '等式・不等式と規則性', 'body': '「〜になる」は＝、「〜より大きい」は＞、「〜以上」は≧、「〜以下」は≦。規則的に増えるものは、はじめの数＋増える数×(n−1)で表せる。'}]
    note = '2026-10-08 Claude作成。数学ドリルp18〜33（6 文字式の表し方・7 数量を表す式・8 1次式の計算・9 文字式の利用、標準問題・実力問題①②）を写真で目視し、数や場面を変えた類題を作った。手書きの答えは使っていない。'
    return u, guide, note
