"""数学ドリル 第3章 1次方程式（ドリル p34〜47）"""
from mcommon import *
from bank import num_answer

def dl(a, b, v='x'): return lin(F(a), F(b), v, True)
def dd(v): return fmt_num(F(v), 'dec')
def sg(v, f=fx):
    """ ＋ 3 / − 3 の形（0 は空）"""
    v = F(v)
    return '' if v == 0 else (f' ＋ {f(v)}' if v > 0 else f' − {f(-v)}')

def unit():
    u = DUnit('drill-math-1-equation', '1次方程式', '方程式')
    r = rng(3003)
    def solve_txt(a, b, c, d):
        """ax+b=cx+d → (a−c)x=d−b → x"""
        k, m = F(a) - F(c), F(d) - F(b)
        return f'x をふくむ項を左辺、数の項を右辺に移項すると {dl(k, 0)} ＝ {fx(m)}。両辺を {fx(k)} でわって x ＝ {fx(m / k)}'
    def isroot():
        x0 = rint(r, -8, 8); a = rint(r, -6, 6); b = rint(r, -12, 12); t = r.choice([x0, x0, x0 + r.choice([-2, -1, 1, 2])])
        c = a * x0 + b
        ok = a * t + b == c
        u.add(f'方程式 {dl(a, b)} ＝ {fx(c)} について、x ＝ {fx(t)} はこの方程式の解か。解なら「○」、解でないなら「×」で答えよう。',
              exact_answer(['○', 'まる', '〇'] if ok else ['×', 'ばつ', 'バツ']),
              f'x ＝ {fx(t)} を左辺に代入すると {fx(a * t + b)}。右辺は {fx(c)} なので、' + ('等しくなり、解である。' if ok else '等しくならないので、解ではない。'),
              34, '1' if t > 0 else '2', '方程式の解')
    def addsub():
        t = r.random()
        if t < .3: x0, kind = rdec(r, -5, 5), 'dec'
        elif t < .55: x0, kind = rfrac(r, (2, 3, 4, 5, 8), 1, 9), 'auto'
        else: x0, kind = F(rint(r, -15, 15)), 'auto'
        a = rint(r, -12, 12); c = x0 + a
        f = lambda v: fmt_num(F(v), kind)
        lhs = (f'x{sg(a, f)}') if r.random() < .7 else f'{f(a)} ＋ x'
        u.add(f'等式の性質を使って、次の方程式を解こう。\n{lhs} ＝ {f(c)}', num_answer(x0, dec=(kind == 'dec')),
              f'両辺から {f(a)} をひく（移項する）と、x ＝ {f(c)} − ({f(a)}) ＝ {f(x0)}', 35, '3', '等式の性質')
    def muldiv():
        x0 = F(rint(r, -12, 12)); k = r.random()
        if k < .4:
            a = rint(r, -9, 9)
            if abs(a) == 1: a = r.choice([-7, 3, 4, -5])
            u.add(f'等式の性質を使って、次の方程式を解こう。\n{dl(a, 0)} ＝ {fx(a * x0)}', num(x0), f'両辺を {fx(a)} でわると x ＝ {fx(a * x0)} ÷ ({fx(a)}) ＝ {fx(x0)}', 35, '4', '等式の性質')
        elif k < .7:
            m = r.choice([2, 3, 4, 5, 6, 8]); s = r.choice([1, -1])
            u.add(f'等式の性質を使って、次の方程式を解こう。\n{"−" if s < 0 else ""}x/{m} ＝ {fx(x0)}', num(s * m * x0), f'両辺に {fx(s * m)} をかけると x ＝ {fx(x0)} × ({fx(s * m)}) ＝ {fx(s * m * x0)}', 35, '4', '等式の性質', near=[ans_str(F(x0, s * m))])
        else:
            a = r.choice([F(1, 10), F(-6, 10), F(3, 10), F(-4, 10), F(12, 10), F(5, 10)])
            x1 = F(rint(r, -9, 9))
            u.add(f'等式の性質を使って、次の方程式を解こう。\n{dd(a)}x ＝ {dd(a * x1)}', num(x1), f'両辺を {dd(a)} でわる（両辺を10倍して整数にしてもよい）。x ＝ {fx(x1)}', 35, '4', '等式の性質')
    def twostep():
        x0 = F(rint(r, -9, 9)); k = r.random()
        if k < .55:
            a, b = rint(r, -7, 7), rint(r, -12, 12)
            if abs(a) == 1 and r.random() < .5: a = r.choice([3, -5, 4])
            c = a * x0 + b
            u.add(f'次の方程式を解こう。\n{dl(a, b)} ＝ {fx(c)}', num(x0), solve_txt(a, b, 0, c), 35, '5', '等式の性質')
        elif k < .8:
            a = r.choice([F(1, 2), F(3, 5), F(1, 4), F(2, 3), F(-3, 4)]); b = rfrac(r, (2, 4, 8), 1, 5)
            x1 = F(r.choice([-8, -4, 4, 8, 12, 20])) if a.denominator in (2, 4) else (F(r.choice([-10, 5, 10, 15])) if a.denominator == 5 else F(r.choice([-6, 3, 6, 9])))
            c = a * x1 + b
            u.add(f'次の方程式を解こう。\n{dl(a, b)} ＝ {fx(c)}', num(x1), f'{fx(b)} を移項して {dl(a, 0)} ＝ {fx(c - b)}。両辺に {fx(1 / a)} をかけて x ＝ {fx(x1)}', 35, '5', '係数が分数')
        else:
            a, b = rdec(r, -2, 2), rdec(r, -3, 3); x1 = F(rint(r, -9, 9)); c = a * x1 + b
            u.add(f'次の方程式を解こう。\n{dd(a)}x{sg(b, dd)} ＝ {dd(c)}', num(x1), f'両辺を10倍して {dl(a * 10, b * 10)} ＝ {fx(c * 10)}。これを解いて x ＝ {fx(x1)}', 35, '5', '係数が小数')
    def move():
        x0 = F(rint(r, -10, 10)); a, c = rint(r, -9, 9), rint(r, -9, 9)
        if a == c: return
        b = rint(r, -18, 18); d = (a - c) * x0 + b
        page, nb = r.choice([(36, '1'), (38, '1')])
        u.add(f'次の方程式を解こう。\n{dl(a, b)} ＝ {dl(c, d)}', num(x0), solve_txt(a, b, c, d), page, nb, '移項')
    def paren():
        x0 = F(rint(r, -8, 8)); p, q = rint(r, -5, 5), rint(r, -6, 6); s = rint(r, -4, 4); t = rint(r, -6, 6)
        if p == s: return
        w = p * (x0 + q) - s * (x0 + t)
        co = lambda k: fx(k) if abs(k) != 1 else ('−' if k < 0 else '')
        L = f'{co(p)}({dl(1, q)})'
        R = f'{co(s)}({dl(1, t)}){sg(w)}'
        page, nb = r.choice([(37, '2'), (38, '2')])
        u.add(f'次の方程式を解こう。\n{L} ＝ {R}', num(x0), f'分配法則でかっこをはずすと {dl(p, p * q)} ＝ {dl(s, s * t + w)}。' + solve_txt(p, p * q, s, s * t + w), page, nb, 'かっこのある方程式')
    def decimal():
        x0 = F(rint(r, -9, 9)); a, c = rdec(r, -2, 2), rdec(r, -2, 2)
        if a == c: return
        b = rdec(r, -3, 3); d = (a - c) * x0 + b
        if d == 0 or (d * 10).denominator != 1: return
        page, nb = r.choice([(37, '3'), (38, '3')])
        u.add(f'次の方程式を解こう。\n{dd(a)}x{sg(b, dd)} ＝ {dd(c)}x{sg(d, dd)}', num(x0), f'両辺を10倍すると {dl(a * 10, b * 10)} ＝ {dl(c * 10, d * 10)}。' + solve_txt(a * 10, b * 10, c * 10, d * 10), page, nb, '係数が小数')
    def frac():
        x0 = F(rint(r, -9, 9)); m, n = r.sample([2, 3, 4, 5, 6], 2); a, c = rint(r, -4, 4), rint(r, -4, 4)
        if F(a, m) == F(c, n): return
        b = rint(r, -9, 9); val = (a * x0 + b) * F(1, m)
        d = val * n - c * x0
        if d.denominator != 1: return
        lc = math.lcm(m, n)
        page, nb = r.choice([(39, '4'), (44, '1')])
        u.add(f'次の方程式を解こう。\n({dl(a, b)})/{m} ＝ ({dl(c, d)})/{n}', num(x0),
              f'両辺に分母の最小公倍数 {lc} をかけて分母をはらうと {fx(lc // m)}({dl(a, b)}) ＝ {fx(lc // n)}({dl(c, d)})。これを解いて x ＝ {fx(x0)}', page, nb, '係数が分数')
    def ratio():
        k = r.random(); x0 = F(rint(r, 1, 12)) if r.random() < .8 else rfrac(r, (2, 3, 4), 1, 9, sign=False)
        b, c = r.randint(2, 9), r.randint(2, 9)
        if k < .5:
            a = x0 * c / b
            if a.denominator != 1: return
            u.add(f'次の比例式を解こう。\nx : {fx(a)} ＝ {b} : {c}', num(x0), f'外項の積と内項の積は等しいので、{c}x ＝ {fx(a)} × {b}。x ＝ {fx(x0)}', 37, '4', '比例式')
            return
        if k < .8:
            a = F(b) * x0 / c
            if a.denominator != 1 or a == 0: return
            u.add(f'次の比例式を解こう。\n{b} : {fx(a)} ＝ x : {c}', num(F(b * c) / a), f'{fx(a)} × x ＝ {b} × {c}。x ＝ {fx(F(b * c) / a)}', 39, '5', '比例式')
            return
        p, q = rint(r, 1, 5), rint(r, -6, 6); s = r.randint(2, 7); t = r.randint(2, 7)
        if s == t: return
        xv = F(s * p - t * q, t - s)
        u.add(f'次の比例式を解こう。\n({dl(1, q)}) : {s} ＝ ({dl(1, p)}) : {t}', num(xv), f'{t}({dl(1, q)}) ＝ {s}({dl(1, p)})。{dl(t, t * q)} ＝ {dl(s, s * p)} を解いて x ＝ {fx(xv)}', 46, '2', '比例式')
    def find_a():
        x0 = rint(r, -5, 5); b, c, d = rint(r, -9, 9), rint(r, -6, 6), rint(r, -9, 9)
        av = F(c * x0 + d - b, x0)
        if av.denominator != 1: return
        u.add(f'x についての1次方程式 ax{sg(b)} ＝ {dl(c, d)} の解が {fx(x0)} のとき、a の値を求めよう。', num(av),
              f'x ＝ {fx(x0)} を代入すると {fx(x0)}a{sg(b)} ＝ {fx(c * x0 + d)}。a についての方程式として解いて a ＝ {fx(av)}', 39, '6', '解から係数を求める')
    def num_word():
        x0 = rint(r, -9, 12); a, b, m = r.randint(2, 6), r.randint(1, 9), r.randint(2, 4)
        v = (a * x0 + b) * m
        u.add(f'ある数を{a}倍して{b}をたしたあと、{m}倍したところ{fx(v)}になった。ある数を求めよう。', num(x0), f'ある数を x とすると ({a}x ＋ {b}) × {m} ＝ {fx(v)}。これを解いて x ＝ {fx(x0)}', 42, '1', 'ある数')
    def num_word2():
        x0 = rint(r, -8, 15); a, b = r.sample(range(2, 10), 2); p = rint(r, -12, 12)
        q = a * x0 + p - b * x0
        if q == 0 or abs(q) > 60: return
        how = lambda v: f'{abs(v)}を{"たした" if v > 0 else "ひいた"}'
        u.add(f'ある数を{a}倍して{how(p)}数と、ある数を{b}倍して{how(q)}数は等しくなった。ある数を求めよう。', num(x0),
              f'ある数を x とすると {dl(a, p)} ＝ {dl(b, q)}。' + solve_txt(a, p, b, q), 42, '1', 'ある数')
    def consec():
        n = r.choice([3, 3, 5]); kind = r.choice(['整数', '整数', '奇数', '偶数'])
        st = 2 if kind != '整数' else 1
        first = r.randint(-5, 30)
        if kind == '奇数' and first % 2 == 0: first += 1
        if kind == '偶数' and first % 2: first += 1
        ans = [first + st * i for i in range(n)]; tot = sum(ans)
        u.add(f'連続する{n}つの{kind}の和が{fx(tot)}であるとき、この{n}つの{kind}を小さい順に書こう（読点で区切る）。', nums_answer(ans, ordered=True),
              f'まん中の数を x とすると、{n}つの和は {n}x と表せる。{n}x ＝ {fx(tot)} より x ＝ {fx(ans[n // 2])}。答え ' + '、'.join(fx(v) for v in ans), 42 if n == 3 else 44, '2' if n == 3 else '3', '連続する数')
    def coins():
        p1, p2 = r.choice([(50, 84), (60, 90), (80, 120), (90, 150), (110, 140), (63, 84)]); a = r.randint(3, 15); b = r.randint(3, 15)
        tot = p1 * a + p2 * b
        item = r.choice([('切手', '枚'), ('ノート', '冊'), ('お菓子', '個')])
        u.add(f'1{item[1]}{p1}円の{item[0]}と1{item[1]}{p2}円の{item[0]}を合わせて{a + b}{item[1]}買ったところ、代金の合計が{tot}円だった。{p1}円の{item[0]}を何{item[1]}買ったか。', num(a),
              f'{p1}円のものを x {item[1]}とすると、{p2}円のものは ({a + b}−x){item[1]}。{p1}x ＋ {p2}({a + b}−x) ＝ {tot} を解いて x ＝ {a}', 42, '3', '個数と代金', near=[ans_str(F(b))])
    def kafusoku():
        n = r.randint(5, 30); p, q = r.sample(range(3, 12), 2); p, q = max(p, q), min(p, q)
        extra = r.randint(1, 15); total = q * n + extra; short = p * n - total
        if short <= 0: return
        thing = r.choice([('折り紙', '枚'), ('鉛筆', '本'), ('カード', '枚'), ('あめ', '個')])
        if r.random() < .5:
            u.add(f'{thing[0]}を何人かの子どもに分けるのに、1人に{p}{thing[1]}ずつ分けると{short}{thing[1]}足りず、1人に{q}{thing[1]}ずつ分けると{extra}{thing[1]}余る。子どもの人数を求めよう。', num(n),
                  f'子どもを x 人とすると {p}x − {short} ＝ {q}x ＋ {extra}。これを解いて x ＝ {n}', 41, '4(1)', '過不足', near=[ans_str(F(total))])
        else:
            u.add(f'{thing[0]}を何人かの子どもに分けるのに、1人に{p}{thing[1]}ずつ分けると{short}{thing[1]}足りず、1人に{q}{thing[1]}ずつ分けると{extra}{thing[1]}余る。{thing[0]}は全部で何{thing[1]}あるか。', num(total),
                  f'子どもを x 人とすると {p}x − {short} ＝ {q}x ＋ {extra} より x ＝ {n}。{thing[0]}は {q}×{n}＋{extra} ＝ {total}{thing[1]}', 42, '4(2)', '過不足', near=[ans_str(F(n))])
    def chase():
        v1, v2 = r.choice([(60, 75), (50, 90), (60, 80), (70, 210), (80, 120), (60, 100)]); d = r.randint(2, 12)
        lead = v1 * d
        if lead % (v2 - v1): return
        t = lead // (v2 - v1)
        u.add(f'弟が家を出発して分速{v1}mで歩いて行った。その{d}分後に、兄が同じ道を分速{v2}mで追いかけた。兄は出発してから何分後に弟に追いつくか。', num(t),
              f'兄が x 分後に追いつくとすると、弟は (x＋{d}) 分歩いている。{v1}(x＋{d}) ＝ {v2}x を解いて x ＝ {t}', 41, '3', '速さ（追いつく）', near=[ans_str(F(t + d))])
    def pond():
        v1, v2 = r.choice([(80, 100), (60, 90), (70, 80), (50, 70), (75, 105)]); t = r.randint(5, 15)
        L = (v1 + v2) * t
        u.add(f'1周{L}mの池のまわりを、兄と弟が同じ地点から反対方向に同時に進んだところ、{t}分後に出会った。弟の速さが分速{v1}mのとき、兄の速さは分速何mか。', num(v2),
              f'兄の速さを分速 x m とすると {v1}×{t} ＋ {t}x ＝ {L}。これを解いて x ＝ {v2}', 43, '5(1)', '速さ（出会う）')
    def roundtrip():
        a, b = r.choice([(75, 60), (80, 60), (90, 60), (60, 40), (100, 75)]); diff = r.randint(2, 8)
        dist = F(a * b * diff, a - b)
        if dist.denominator != 1: return
        u.add(f'家から学校まで、行きは分速{a}mで、帰りは分速{b}mで歩いたところ、帰りのほうが{diff}分多くかかった。家から学校までの道のりは何mか。', num(dist),
              f'道のりを x m とすると x/{b} − x/{a} ＝ {diff}。両辺に{math.lcm(a, b)}をかけて解くと x ＝ {fx(dist)}', 43, '5(4)', '速さ（行き帰り）')
    def twodigit():
        t = r.randint(1, 4); o = t + r.choice([2, 3, 4, 5])
        if o > 9: return
        orig = 10 * t + o; swp = 10 * o + t
        k = r.choice([2, 3]); c = swp - k * orig
        if c == 0: return
        rel = f'もとの整数の{k}倍より{abs(c)}{"大きい" if c > 0 else "小さい"}'
        u.add(f'2けたの正の整数がある。一の位の数は十の位の数より{o - t}大きい。また、十の位と一の位を入れかえた数は、{rel}。もとの整数を求めよう。', num(orig),
              f'十の位を x とすると、もとの数は 10x＋(x＋{o - t})、入れかえた数は 10(x＋{o - t})＋x。式を立てて解くと x ＝ {t}、もとの整数は {orig}', 43, '6', '2けたの整数', near=[ans_str(F(swp))])
    def money():
        x0 = r.randint(5, 30) * 100; k = r.choice([2, 3]); a, b = r.choice([(3000, 500), (2000, 400), (1500, 300), (2500, 500), (4000, 200)])
        m = F(k * x0 + a, x0 + b)
        if m.denominator != 1 or m <= 1: return
        u.add(f'はじめ兄は弟の{k}倍の所持金を持っていた。兄が{a}円、弟が{b}円をもらったところ、兄の所持金は弟の所持金の{m}倍になった。はじめ弟はいくら持っていたか。', num(x0),
              f'はじめの弟の所持金を x 円とすると、兄は {k}x 円。{k}x ＋ {a} ＝ {m}(x ＋ {b}) を解いて x ＝ {x0}', 43, '7', '所持金')
    def share():
        tot = r.randint(10, 60) * 100; k = r.choice([2, 3]); d = r.randint(1, 9) * 100
        x0 = F(tot + d, k + 1)
        if x0.denominator != 1: return
        u.add(f'{tot}円を姉妹2人で分けるのに、姉の分は妹の分の{k}倍よりも{d}円少なくなるようにしたい。妹の分は何円か。', num(x0),
              f'妹の分を x 円とすると、姉は ({k}x−{d}) 円。x ＋ {k}x − {d} ＝ {tot} を解いて x ＝ {fx(x0)}', 41, '5', 'お金の分配', near=[ans_str(F(tot) - x0)])
    def discount():
        price = r.randint(5, 30) * 100; w = r.choice([2, 3, 4]); n = r.choice([2, 3]); pay = r.choice([2000, 3000, 5000, 10000])
        if price * n * (10 - w) % 10: return
        cost = price * n * (10 - w) // 10
        if cost >= pay: return
        u.add(f'ある店で定価が同じ{n}枚のハンカチを{w}割引きで買い、{pay}円を払ったところ、おつりは{pay - cost}円だった。ハンカチ1枚の定価は何円か。', num(price),
              f'定価を x 円とすると {n} × (1 − {w}/10)x ＝ {pay} − {pay - cost}。これを解いて x ＝ {price}', 45, '6', '割合')
    def salt():
        a, b, w = r.choice([(4, 20, 80), (1, 10, 90), (4, 10, 150), (5, 10, 180), (1, 4, 160), (2, 5, 190), (2, 6, 235), (4, 8, 230), (5, 8, 184)])
        x0 = F(w * (b - a), 100 - b)
        u.add(f'{a}％の食塩水{w}gに食塩を加えて、{b}％の食塩水をつくりたい。食塩を何g加えればよいか。', num(x0),
              f'加える食塩を x g とすると、食塩の重さで式をつくる。{w}×{a}/100 ＋ x ＝ ({w}＋x)×{b}/100 を解いて x ＝ {fx(x0)}', 45, '7', '食塩水')
    def desks():
        n = r.randint(5, 15); p = r.choice([4, 5, 6]); q = p + 1; last = r.randint(1, q - 1)
        works = q * (n - 1) + last; short = works - p * n
        if short <= 0: return
        u.add(f'長机に作品を並べる。長机1台に{p}個ずつ並べると、作品を{short}個並べることができなかった。そこで1台に{q}個ずつ並べなおしたところ、最後の1台には作品が{last}個だけになった。長机は何台あるか。', num(n),
              f'長机を x 台とすると {p}x ＋ {short} ＝ {q}(x − 1) ＋ {last}。これを解いて x ＝ {n}。作品は {works} 個', 45, '8', '過不足', near=[ans_str(F(works))])
    def train():
        L = r.randint(10, 30) * 10; v = r.choice([15, 20, 25, 30]); bridge = r.randint(20, 60) * 10
        t = F(bridge + L, v)
        if t.denominator != 1: return
        u.add(f'長さ{L}mの列車が秒速{v}mで走っている。この列車が長さ{bridge}mの鉄橋を渡りはじめてから渡り終わるまでに何秒かかるか。', num(t),
              f'渡りはじめから渡り終わるまでに列車が進む道のりは、鉄橋の長さ＋列車の長さ ＝ {bridge + L} m。{bridge + L} ÷ {v} ＝ {fx(t)}', 47, '5', '列車', near=[ans_str(F(bridge, v))])
    def square():
        x0 = r.randint(3, 15); p, q = r.sample(range(2, 9), 2)
        inc = (x0 + p) * (x0 + q) - x0 * x0
        u.add(f'1辺の長さが x cm の正方形がある。縦の長さを{p}cm、横の長さを{q}cm長くした長方形は、もとの正方形より面積が{inc}cm²大きくなった。x の値を求めよう。', num(x0),
              f'(x＋{p})(x＋{q}) − x² ＝ {inc}。x² が消えて {p + q}x ＋ {p * q} ＝ {inc}、x ＝ {x0}', 44, '4', '図形')
    def match():
        tot = r.randint(40, 200); first, step = r.choice([(4, 3), (3, 2)])
        n = (tot - first) // step + 1
        shape = '正方形' if first == 4 else '正三角形'
        u.add(f'{tot}本のマッチ棒を使って、{shape}を右方向にのみつないでつくっていく（1個目は{first}本、1個ふえるごとに{step}本ずつふえる）。{shape}は最大で何個つくれるか。', num(n),
              f'x 個つくるのに {first}＋{step}(x−1) 本いる。{first}＋{step}(x−1) ≦ {tot} を満たす最大の x は {n}', 44, '5', '規則性')
    def ratio_word():
        a, b = r.choice([(3, 2), (5, 3), (4, 7), (2, 5), (3, 4)]); k = r.randint(2, 12)
        tot = (a + b) * k * 10
        u.add(f'{tot}円を兄と弟で {a}:{b} の比に分ける。兄の分は何円か。', num(a * k * 10), f'兄の分を x 円とすると x : ({tot}−x) ＝ {a} : {b}。これを解いて x ＝ {a * k * 10}', 37, '4', '比例式の利用', near=[ans_str(F(b * k * 10))])
    fixed = [
        ('まだわかっていない数を表す文字をふくむ等式を何というか。', exact_answer(['方程式', 'ほうていしき']), '文字に特別な値を代入したときだけ成り立つ等式を方程式という。', 34, '要点1', '用語', ['等式']),
        ('方程式を成り立たせる文字の値を何というか。', exact_answer(['解', '方程式の解', 'かい']), '方程式を成り立たせる文字の値を方程式の解といい、解を求めることを方程式を解くという。', 34, '要点1', '用語', ['答え']),
        ('等式の一方の辺にある項を、符号を変えて他方の辺に移すことを何というか。', exact_answer(['移項', 'いこう']), '移項。例：2x＋6＝4 → 2x＝4−6', 36, '要点1', '用語', ['移動']),
        ('比例式 a : b ＝ c : d が成り立つとき、ad と bc の間にはどんな関係があるか。等式で答えよう。', exact_answer(['ad=bc', 'bc=ad', 'ad＝bc'], compact=True), '比例式の外項の積と内項の積は等しい。ad＝bc', 36, '要点2', '比例式'),
        ('人数を求める文章題で、方程式の解が x ＝ 7/2 になった。これをそのまま答えにしてよいか。「よい」か「よくない」で答えよう。', exact_answer(['よくない', '良くない', 'だめ']), '人数は自然数でなければならないので、7/2 は答えにできない（式のつくり方を見直す）。', 41, 'Guide', '解の吟味', ['よい']),
    ]
    fixed_i = iter(fixed)
    def fixedq():
        it = next(fixed_i, None)
        if it is None: return
        p, a, e, page, nb, tp, *nr = it
        u.add(p, a, e, page, nb, tp, nr[0] if nr else ())
    plan = [isroot, addsub, muldiv, twostep, move, paren, decimal, frac, ratio, find_a, move, num_word, consec, coins, kafusoku, chase, pond,
            roundtrip, twodigit, money, share, discount, salt, desks, train, square, num_word2, match, ratio_word, fixedq]
    fill(u, plan)
    guide = [{'title': '等式の性質', 'body': 'A＝B ならば A＋C＝B＋C、A−C＝B−C、AC＝BC、A/C＝B/C（C≠0）。両辺に同じ操作をして x＝（数）の形にする。例：x/3＝−4 → 両辺に3をかけて x＝−12'},
             {'title': '移項して ax＝b の形に', 'body': 'x をふくむ項を左辺、数の項を右辺に、符号を変えて移す。例：3x−6＝5x−10 → 3x−5x＝−10＋6 → −2x＝−4 → x＝2'},
             {'title': 'かっこ・小数・分数のある方程式', 'body': 'かっこは分配法則ではずす（後ろの項の符号に注意）。小数は両辺を10倍・100倍、分数は分母の最小公倍数を両辺にかけて、係数を整数にしてから解く。'},
             {'title': '比例式', 'body': 'a：b＝c：d ならば ad＝bc（外側どうしの積＝内側どうしの積）。例：x：6＝3：2 → 2x＝18 → x＝9'},
             {'title': '文章題の手順', 'body': '①何を x にするか決める ②等しい数量に注目して方程式をつくる ③解く ④答えが問題に合うか確かめる（人数・個数は自然数）。速さは「道のり＝速さ×時間」、過不足は「全体の数」を2通りに表す。'}]
    note = '2026-10-08 Claude作成。数学ドリルp34〜47（10 1次方程式の解き方・11 いろいろな1次方程式・12 1次方程式の利用、標準問題・実力問題①②）を写真で目視し、数・場面を変えた類題を作った。手書きの答えは使っていない。'
    return u, guide, note
