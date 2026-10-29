"""数学ドリル 第4章 比例と反比例（ドリル p48〜63）"""
from mcommon import *
from func import yax, yinv, pt, pt_answer, range_answer, range_txt, tidy

def divs(n): return [d for d in range(1, abs(n) + 1) if n % d == 0]

def unit():
    u = DUnit('drill-math-1-proportion', '比例と反比例', '変化と対応')
    r = rng(4004)
    def k_int(lo=-6, hi=6): return F(rint(r, lo, hi))
    def pform():
        k = k_int() if r.random() < .75 else rfrac(r, (2, 3, 4), 1, 5)
        x1 = rint(r, -8, 8)
        if (k * x1).denominator != 1: return
        y1 = k * x1
        u.add(f'y は x に比例し、x＝{fx(x1)} のとき y＝{fx(y1)} である。y を x の式で表そう。', relation_answer(yax(k)),
              f'比例定数を a とすると y＝ax。{fx(y1)}＝a×({fx(x1)}) より a＝{fx(k)}。したがって {yax(k)}', r.choice([49, 50]), '4(1)' if r.random() < .5 else '2', '比例の式', near=[yax(-k), yax(1 / k)])
    def pval():
        k = k_int(); x1, x2 = rint(r, -9, 9), rint(r, -12, 12)
        if x1 == x2: return
        u.add(f'y は x に比例し、x＝{fx(x1)} のとき y＝{fx(k * x1)} である。x＝{fx(x2)} のときの y の値を求めよう。', num(k * x2),
              f'y＝{fx(k)}x（{yax(k)}）。x＝{fx(x2)} を代入して y＝{fx(k * x2)}', 50, '2(2)', '比例の値', near=[ans_str(F(x2) / k)])
    def pxval():
        k = k_int(); x1 = rint(r, -9, 9); x2 = rint(r, -12, 12)
        u.add(f'y は x に比例し、x＝{fx(x1)} のとき y＝{fx(k * x1)} である。y＝{fx(k * x2)} のときの x の値を求めよう。', num(x2),
              f'{yax(k)} に y＝{fx(k * x2)} を代入して x＝{fx(x2)}', 55, '5(2)', '比例の値')
    def iform():
        a = rint(r, -48, 48)
        ds = [d for d in divs(a) if 1 < d <= 12] if abs(a) > 3 else []
        if not ds: return
        x1 = r.choice(ds) * r.choice([1, -1]); y1 = F(a, x1)
        u.add(f'y は x に反比例し、x＝{fx(x1)} のとき y＝{fx(y1)} である。y を x の式で表そう。', relation_answer(yinv(a)),
              f'比例定数を a とすると y＝a/x。a＝xy＝{fx(x1)}×({fx(y1)})＝{a}。したがって {yinv(a)}', r.choice([49, 51]), '6' if r.random() < .5 else '5(1)', '反比例の式', near=[yinv(-a)])
    def ival():
        a = r.choice([12, 18, 24, 36, -12, -24, 30, -30, 48, 60, -36, 20])
        xs = [d * s for d in divs(a) for s in (1, -1) if d <= 12]
        x1, x2 = r.sample(xs, 2)
        if r.random() < .6:
            u.add(f'y は x に反比例し、x＝{fx(x1)} のとき y＝{fx(F(a, x1))} である。x＝{fx(x2)} のときの y の値を求めよう。', num(F(a, x2)),
                  f'a＝xy＝{fx(x1)}×({fx(F(a, x1))})＝{a}。y＝{a}/x に x＝{fx(x2)} を代入して y＝{fx(F(a, x2))}', 51, '5(3)', '反比例の値', near=[ans_str(F(a) * x2)])
        else:
            u.add(f'y は x に反比例し、x＝{fx(x1)} のとき y＝{fx(F(a, x1))} である。y＝{fx(F(a, x2))} のときの x の値を求めよう。', num(x2),
                  f'a＝xy＝{a}。xy＝{a} に y＝{fx(F(a, x2))} を代入して x＝{fx(x2)}', 49, '6(3)', '反比例の値')
    SIT = [  # (文, 種類, 比例定数) 種類 p=比例 i=反比例 n=どちらでもない
        (lambda: (lambda p: (f'1本{p}円の鉛筆を x 本買ったときの代金 y 円', 'p', p))(r.choice([60, 80, 90, 120, 150]))),
        (lambda: (lambda S: (f'面積が{S}cm²の長方形の縦の長さ x cm と横の長さ y cm', 'i', S))(r.choice([12, 20, 24, 30, 36]))),
        (lambda: (lambda L: (f'{L}cmのひもから x cm を切り取ったときの残りの長さ y cm', 'n', None))(r.choice([50, 80, 100, 120]))),
        (lambda: (lambda D: (f'{D}kmの道のりを時速 x km で進むときにかかる時間 y 時間', 'i', D))(r.choice([6, 12, 24, 30, 60]))),
        (lambda: (lambda b: (f'底辺が{b}cm、高さが x cm の三角形の面積 y cm²', 'p', F(b, 2)))(r.choice([4, 6, 8, 10, 14]))),
        (lambda: (lambda L: (f'周の長さが{L}cmの長方形の縦の長さ x cm と横の長さ y cm', 'n', None))(r.choice([20, 24, 30, 40]))),
        (lambda: (lambda V: (f'{V}Lはいる水そうに毎分 x L ずつ水を入れるとき、いっぱいになるまでの時間 y 分', 'i', V))(r.choice([60, 80, 120, 150]))),
        (lambda: (lambda v: (f'毎分{v}Lずつ水を入れるとき、x 分間に入る水の量 y L', 'p', v))(r.choice([2, 3, 5, 8]))),
        (lambda: (lambda V: (f'{V}mLのジュースのうち x mL を飲んだときの残りの量 y mL', 'n', None))(r.choice([200, 350, 500, 1000]))),
        (lambda: (lambda S: (f'面積が{S}cm²の三角形の底辺 x cm と高さ y cm', 'i', 2 * S))(r.choice([10, 12, 15, 20]))),
        (lambda: (lambda L: (f'{L}cmのひもを x 等分したときの1本の長さ y cm', 'i', L))(r.choice([120, 150, 180, 240]))),
        (lambda: (lambda v: (f'分速{v}mで x 分間歩いたときに進む道のり y m', 'p', v))(r.choice([50, 60, 70, 80]))),
        (lambda: (lambda c: (f'{c}円持っていて、1個 x 円のパンを1個買ったときの残金 y 円', 'n', None))(r.choice([500, 1000]))),
        (lambda: ('1辺 x cm の正方形の周の長さ y cm', 'p', 4)),
        (lambda: ('1辺 x cm の正方形の面積 y cm²', 'n', None)),
    ]
    NAME = {'p': ['比例', 'ひれい'], 'i': ['反比例', 'はんぴれい'], 'n': ['どちらでもない', 'どちらでもない。', 'ない']}
    def which():
        s, kind, k = r.choice(SIT)()
        if r.random() < .55 or kind == 'n':
            u.add(f'次の x と y の関係で、y が x に比例するなら「比例」、反比例するなら「反比例」、どちらでもないなら「どちらでもない」と答えよう。\n{s}', exact_answer(NAME[kind]),
                  (f'y＝{fx(k)}x と表せるので比例。' if kind == 'p' else f'xy＝{fx(k)}（y＝{fx(k)}/x）と表せるので反比例。' if kind == 'i' else 'y＝ax の形にも y＝a/x の形にもならないので、どちらでもない。'),
                  r.choice([50, 51, 62]), r.choice(['1', '4']) if True else '', '比例・反比例の判定', near=[NAME[x][0] for x in NAME if x != kind][:1])
        else:
            ans = yax(k) if kind == 'p' else yinv(k)
            u.add(f'次の x と y の関係を、y を x の式で表そう。\n{s}', relation_answer(ans), f'{"比例" if kind == "p" else "反比例"}の関係で、{ans}', r.choice([48, 49, 62]), r.choice(['3', '5', '1']), '関係を式に表す')
    def sym():
        x, y = rint(r, -7, 7), rint(r, -7, 7); w = r.choice(['x軸', 'y軸', '原点'])
        X, Y = {'x軸': (x, -y), 'y軸': (-x, y), '原点': (-x, -y)}[w]
        u.add(f'点 {pt(x, y)} と{w}について対称な点の座標を求めよう。', pt_answer(X, Y),
              {'x軸': 'x軸について対称な点は、y座標の符号だけが変わる。', 'y軸': 'y軸について対称な点は、x座標の符号だけが変わる。', '原点': '原点について対称な点は、x座標・y座標の両方の符号が変わる。'}[w] + f'答え {pt(X, Y)}',
              54, '1', '対称な点', near=[f'{ans_str(F(x))},{ans_str(F(-y))}' if w != 'x軸' else f'{ans_str(F(-x))},{ans_str(F(y))}'])
    def quad():
        x, y = rint(r, -9, 9), rint(r, -9, 9)
        q = {(True, True): '右上', (False, True): '左上', (False, False): '左下', (True, False): '右下'}[(x > 0, y > 0)]
        sx, sy = ('正' if x > 0 else '負'), ('正' if y > 0 else '負')
        u.add(f'点 {pt(x, y)} の x座標・y座標の符号を、それぞれ「正」か「負」で答えよう（例：正、負）。', exact_answer([f'{sx}、{sy}', f'{sx},{sy}', f'{sx}{sy}', f'{sx} {sy}']),
              f'x座標 {fx(x)} は{sx}、y座標 {fx(y)} は{sy}。点は座標平面の{q}の部分にある。', 52, 'Guide', '座標の符号')
    def incr():
        k = k_int(); m = r.randint(2, 6)
        if r.random() < .5:
            u.add(f'y は x に比例し、x の値が{m}増加すると y の値は{abs(k * m)}{"増加" if k > 0 else "減少"}する。y を x の式で表そう。', relation_answer(yax(k)),
                  f'比例定数＝y の増加量 ÷ x の増加量 ＝ {fx(k * m)} ÷ {m} ＝ {fx(k)}。{yax(k)}', 53, '3(3)', '増加量から比例の式', near=[yax(-k)])
        else:
            x0, y0 = rint(r, -5, 5), None
            y0 = k * x0
            u.add(f'比例のグラフが点 {pt(x0, y0)} を通る。y を x の式で表そう。', relation_answer(yax(k)), f'y＝ax に代入して {fx(y0)}＝a×({fx(x0)})、a＝{fx(k)}。{yax(k)}', 53, '3(1)', 'グラフが通る点', near=[yax(1 / k)])
    def onpt():
        if r.random() < .5:
            k = r.choice([2, 3, -2, -3, 4, F(1, 2)]); x0 = r.choice([2, -3, 4, F(-6, 10), 5])
            y0 = F(k) * F(x0)
            if r.random() < .5:
                u.add(f'点 ({fmt_num(F(x0), "dec")}, □) は y＝{fx(k)}x のグラフ上にある。□にあてはまる数を求めよう。'.replace('y＝1/2x', 'y＝1/2x'), num(y0),
                      f'x＝{fmt_num(F(x0), "dec")} を代入して y＝{fmt_num(y0, "dec")}', 61, '3', 'グラフ上の点')
            else:
                u.add(f'点 (□, {fmt_num(y0, "dec")}) は y＝{fx(k)}x のグラフ上にある。□にあてはまる数を求めよう。', num(F(x0)),
                      f'y＝{fmt_num(y0, "dec")} を代入して {fmt_num(y0, "dec")}＝{fx(k)}x、x＝{fmt_num(F(x0), "dec")}', 61, '3', 'グラフ上の点')
        else:
            a = r.choice([-24, 24, -36, 18, 12, -12]); x0 = r.choice([d * s for d in divs(a) if d > 1 for s in (1, -1)] + [-9, 5])
            y0 = F(a, x0)
            if r.random() < .5:
                u.add(f'点 ({fx(x0)}, □) は y＝{yinv(a)[2:]} のグラフ上にある。□にあてはまる数を求めよう。', num(y0), f'y＝{a}÷({fx(x0)})＝{fx(y0)}', 61, '4', 'グラフ上の点')
            else:
                u.add(f'点 (□, {fx(y0)}) は y＝{yinv(a)[2:]} のグラフ上にある。□にあてはまる数を求めよう。', num(F(x0)), f'xy＝{a} より x＝{a}÷({fx(y0)})＝{fx(x0)}', 61, '4', 'グラフ上の点')
    def vrange():
        if r.random() < .5:
            k = k_int(-4, 4); lo, hi = sorted(r.sample(range(-6, 7), 2))
            ys = sorted([k * lo, k * hi])
            u.add(f'y＝{fx(k)}x で、x の変域が {range_txt(lo, True, hi, True)} のとき、y の変域を求めよう。', range_answer(ys[0], True, ys[1], True, 'y'),
                  f'x＝{lo} のとき y＝{fx(k * lo)}、x＝{hi} のとき y＝{fx(k * hi)}。' + ('比例定数が負なので大小が入れかわる。' if k < 0 else '') + f'y の変域は {range_txt(ys[0], True, ys[1], True, "y")}', 55, '7(1)', '変域')
        else:
            a = r.choice([12, 24, 36, 6, 18]); lo, hi = sorted(r.sample([d for d in divs(a) if d <= 12], 2))
            u.add(f'y＝{a}/x で、x の変域が {range_txt(lo, True, hi, True)} のとき、y の変域を求めよう。', range_answer(F(a, hi), True, F(a, lo), True, 'y'),
                  f'x＝{lo} のとき y＝{fx(F(a, lo))}、x＝{hi} のとき y＝{fx(F(a, hi))}。x が増えると y は減るので {range_txt(F(a, hi), True, F(a, lo), True, "y")}', 55, '7(2)', '変域')
    def lattice():
        a = r.choice([6, 8, 12, 16, 18, 20, 24, 30, 36]); neg = r.random() < .5
        n = len(divs(a)) * (1 if neg else 2)
        u.add(f'y＝{a}/x のグラフ上にあって、x座標・y座標がともに{"負の整数" if neg else "整数"}である点は何個あるか。', num(n),
              f'xy＝{a} となる整数の組を数える。{a} の正の約数は {len(divs(a))} 個（' + '、'.join(map(str, divs(a))) + '）' + ('で、両方が負の組も同じ数だけある。' if not neg else 'で、それぞれ両方を負にした組が条件に合う。') + f'答え {n} 個', 62, '2(2)' if neg else '2(3)', '整数の座標')
    def app_p():
        k = r.random()
        if k < .35:
            n1, g1 = r.choice([(30, 54), (20, 50), (40, 60), (25, 45)]); n2 = r.choice([100, 150, 60, 80])
            u.add(f'同じ種類のくぎがたくさんある。くぎの重さは本数に比例し、{n1}本の重さは{g1}gだった。くぎ{n2}本の重さは何gか。', num(F(g1 * n2, n1)),
                  f'1本の重さは {g1}÷{n1}＝{fmt_num(F(g1, n1), "dec")}g。y＝{fmt_num(F(g1, n1), "dec")}x に x＝{n2} を代入して {fmt_num(F(g1 * n2, n1), "dec")}g', 56, '1', '比例の利用')
        elif k < .7:
            m, g = r.choice([(2, 28), (3, 45), (5, 60), (4, 36)]); L = r.choice([7, 11, 15, 20])
            u.add(f'{m}mの重さが{g}gの針金がある。この針金{L}mの重さは何gか。', num(F(g * L, m)), f'1mの重さは {fmt_num(F(g, m), "dec")}g。{fmt_num(F(g, m), "dec")}×{L}＝{fmt_num(F(g * L, m), "dec")}g', 56, '2(1)', '比例の利用')
        else:
            n, g = r.choice([(50, 180), (100, 400), (20, 90)]); W = g * r.choice([3, 4, 6, 8]) // 1
            u.add(f'コピー用紙{n}枚の重さをはかったら{g}gあった。同じ紙の重さが{W}gのとき、紙は何枚あるか。', num(F(W * n, g)), f'紙の枚数は重さに比例する。{W}÷{g}＝{fx(F(W, g))}倍なので、{n}×{fx(F(W, g))}＝{fx(F(W * n, g))}枚', 56, '3', '比例の利用')
    def app_i():
        k = r.random()
        if k < .4:
            V = r.choice([60, 90, 120, 180]); v = r.choice([d for d in divs(V) if 3 <= d <= 30])
            u.add(f'{V}Lはいる水そうに毎分 x L の割合で水を入れると、y 分でいっぱいになる。毎分{v}Lの割合で入れると、何分でいっぱいになるか。', num(F(V, v)), f'xy＝{V}（y＝{V}/x）。x＝{v} を代入して y＝{fx(F(V, v))}', 57, '4(2)', '反比例の利用', near=[ans_str(F(V * v))])
        elif k < .75:
            ta, ra = r.choice([(35, 16), (24, 15), (40, 18), (30, 20)]); tb = r.choice([d for d in divs(ta * ra) if 10 <= d <= 60 and d != ta])
            u.add(f'歯数が{ta}で毎分{ra}回転している歯車Aに、歯数が{tb}の歯車Bがかみ合って回転している。歯車Bは毎分何回転するか。', num(F(ta * ra, tb)),
                  f'かみ合う歯の数は等しいので（歯数）×（回転数）が一定。{ta}×{ra}＝{ta * ra}、{ta * ra}÷{tb}＝{fx(F(ta * ra, tb))}', 58, '2(1)', '反比例の利用（歯車）')
        else:
            D, h = r.choice([(240, 4), (360, 6), (180, 3), (300, 5)]); s = r.choice([d for d in divs(D) if 30 <= d <= 120 and d != D // h])
            u.add(f'A市からB市まで、時速{D // h}kmで行くと{h}時間かかる。時速{s}kmで行くと何時間かかるか。', num(F(D, s)), f'道のりは {D // h}×{h}＝{D}km で一定なので、時間は速さに反比例する。{D}÷{s}＝{fx(F(D, s))}時間', 60, '1(3)', '反比例の利用')
    def cross():
        k = r.choice([F(3, 2), F(2), F(1, 2), F(3), F(4, 3)]); p = r.choice([2, 3, 4, 6])
        q = k * p
        if q.denominator != 1: return
        a = p * q
        if r.random() < .5:
            u.add(f'y＝{fx(k)}x のグラフと y＝a/x のグラフが点Pで交わっている。点Pの x座標が{p}のとき、a の値を求めよう。', num(a),
                  f'点Pは y＝{fx(k)}x 上にあるので y＝{fx(k)}×{p}＝{fx(q)}。P({p}, {fx(q)}) を y＝a/x に代入して a＝{p}×{fx(q)}＝{fx(a)}', 58, '3(1)', '比例と反比例の交点')
        else:
            u.add(f'y＝{fx(k)}x のグラフと y＝a/x のグラフが2点P、Qで交わっている。点Pの座標が ({p}, {fx(q)}) のとき、もう1つの交点Qの座標を求めよう。', pt_answer(-p, -q),
                  f'どちらのグラフも原点について対称なので、Qは Pと原点について対称な点 ({fx(-p)}, {fx(-q)})', 58, '3(2)', '比例と反比例の交点')
    def area():
        while True:
            pts = [(rint(r, -5, 5, False), rint(r, -5, 5, False)) for _ in range(3)]
            (x1, y1), (x2, y2), (x3, y3) = pts
            S = F(abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)), 2)
            if S > 0: break
        names = 'ABC'
        u.add(f'座標平面上に3点 A{pt(*pts[0])}、B{pt(*pts[1])}、C{pt(*pts[2])} がある。座標の1目盛りを1cmとするとき、三角形ABCの面積は何cm²か。', num(S),
              f'三角形をかこむ長方形の面積から、まわりの直角三角形の面積をひいて求める（または公式 1/2|(xB−xA)(yC−yA)−(xC−xA)(yB−yA)|）。答え {fx(S)}cm²', 59, '5', '座標と面積')
    def rectP():
        a, b = r.choice([(4, 8), (6, 10), (5, 8), (6, 9)]); x = r.randint(1, b - 1)
        if r.random() < .5:
            u.add(f'長方形ABCDで AB＝{a}cm、BC＝{b}cm である。点Pは辺BC上をBからCまで動く。BP＝x cm のときの三角形ABPの面積を y cm² とする。y を x の式で表そう。', relation_answer(yax(F(a, 2))),
                  f'三角形ABP＝1/2×BP×AB＝1/2×x×{a}。{yax(F(a, 2))}', 59, '4(1)', '動点と面積')
        else:
            y = F(a * x, 2)
            u.add(f'長方形ABCDで AB＝{a}cm、BC＝{b}cm である。点Pは辺BC上をBからCまで動く。三角形ABPの面積が{fx(y)}cm²になるときの BP の長さは何cmか。', num(x),
                  f'y＝{fx(F(a, 2))}x に y＝{fx(y)} を代入して x＝{x}', 59, '4(3)', '動点と面積')
    def water():
        v = r.choice([2, 3, 4, 5]); H = v * r.choice([6, 8, 10]); h = r.choice([d for d in range(v, H, v)])
        if r.random() < .5:
            u.add(f'深さ{H}cmの空の容器に水を入れていく。水面の高さが毎分{v}cmの割合で高くなるとき、水を入れ始めてから x 分後の水面の高さを y cm とする。x の変域を求めよう。', range_answer(0, True, F(H, v), True),
                  f'y＝{v}x。いっぱいになるのは {H}÷{v}＝{fx(F(H, v))} 分後なので {range_txt(0, True, F(H, v), True)}', 58, '1(2)', '変域')
        else:
            u.add(f'深さ{H}cmの空の容器に水を入れていく。水面の高さが毎分{v}cmの割合で高くなるとき、水面の高さが{h}cmになるのは入れ始めてから何分後か。', num(F(h, v)), f'y＝{v}x に y＝{h} を代入して x＝{fx(F(h, v))}', 58, '1(3)', '比例の利用')
    def stairs():
        n = r.randint(4, 15)
        u.add(f'1辺1cmの正方形を階段のように並べて図形をつくる（1番目は正方形1個、n番目は1段目から n 段目まで並べた階段の形）。{n}番目の図形の周の長さは何cmか。', num(4 * n),
              f'階段の形の周は、縦の長さ x cm と横の長さ x cm の長方形の周と同じ長さ。4×{n}＝{4 * n}cm', 61, '6', '規則と比例')
    def table():
        a = r.choice([-24, 24, 12, -12, 36]); xs = [x for x in (-3, -2, -1, 1, 2, 3, 4, 6) if a % x == 0]
        x1 = r.choice([x for x in xs if abs(x) <= 2]); xt = r.choice([x for x in xs if x != x1 and abs(x) >= 2])
        u.add(f'y が x に反比例し、表で x＝{fx(x1)} の欄が y＝{fx(F(a, x1))} になっている。同じ表の x＝{fx(xt)} の欄にあてはまる y の値を求めよう。', num(F(a, xt)),
              f'xy＝{fx(x1)}×({fx(F(a, x1))})＝{a}。x＝{fx(xt)} のとき y＝{a}÷({fx(xt)})＝{fx(F(a, xt))}', 51, '6', '反比例の表')
    fixed = [
        ('2つの変数 x、y があって、x の値を決めると y の値がただ1つに決まるとき、y は x の何であるというか。', exact_answer(['関数', 'かんすう']), 'y は x の関数であるという。', 48, '要点1', '用語', ['比例']),
        ('y＝ax（a は定数）で表される関係で、定数 a を何というか。', exact_answer(['比例定数', 'ひれいていすう']), 'a を比例定数という。反比例 y＝a/x の a も比例定数という。', 48, '要点2', '用語', ['定数']),
        ('変数のとりうる値の範囲を何というか。', exact_answer(['変域', 'へんいき']), '変域。不等号を使って −1＜x≦5 のように表す。', 48, 'Guide', '用語'),
        ('座標平面で、横の数直線（x軸）と縦の数直線（y軸）を合わせて何というか。', exact_answer(['座標軸', 'ざひょうじく']), 'x軸と y軸を合わせて座標軸、その交点Oを原点という。', 52, '要点1', '用語'),
        ('反比例のグラフのような、2つのなめらかな曲線を何というか。', exact_answer(['双曲線', 'そうきょくせん']), '反比例 y＝a/x のグラフは双曲線になる。', 52, '要点2', '用語', ['放物線']),
        ('x の変域が −1 より大きく 5 以下であることを、不等号を使って表そう。', range_answer(-1, False, 5, True), '「より大きい」は＜、「以下」は≦を使う。−1＜x≦5', 48, '2', '変域'),
        ('y＝6/x のグラフについて正しいものを1つ選ぼう。\nア x＞0 の範囲で、x が増加すると y も増加する　イ 原点を通る右下がりの直線　ウ 原点を対称の中心として点対称である　エ 点(1/6, 1) を通る', choice_answer('ウ'),
         '反比例のグラフは双曲線で、原点について点対称。x＞0 で x が増えると y は減る。(1/6, 36) は通るが (1/6, 1) は通らない。', 62, '3', '反比例のグラフ', ['ア']),
    ]
    fixed_i = iter(fixed)
    def fixedq():
        it = next(fixed_i, None)
        if it is None: return
        p, a, e, page, nb, tp, *nr = it
        u.add(p, a, e, page, nb, tp, nr[0] if nr else ())
    plan = [pform, pval, iform, ival, which, sym, incr, onpt, vrange, lattice, app_p, app_i, cross, area, rectP, water, table, pxval, which, quad, stairs, fixedq]
    fill(u, plan)
    for q in u.qs:
        q['prompt'] = tidy(q['prompt']); q['explanation'] = tidy(q['explanation'])
    guide = [{'title': '比例 y＝ax', 'body': 'x が2倍、3倍になると y も2倍、3倍になる。y÷x（商）が一定で、比例定数 a に等しい。1組の x、y から a を求めて式をつくる。例：x＝3 のとき y＝−12 → a＝−4、y＝−4x'},
             {'title': '反比例 y＝a/x', 'body': 'x が2倍、3倍になると y は1/2倍、1/3倍になる。xy（積）が一定で、比例定数 a に等しい。例：x＝2 のとき y＝−6 → a＝−12、y＝−12/x'},
             {'title': '座標と対称な点', 'body': '点(a, b) と x軸について対称な点は (a, −b)、y軸について対称な点は (−a, b)、原点について対称な点は (−a, −b)。'},
             {'title': 'グラフと変域', 'body': '比例のグラフは原点を通る直線（a＞0 なら右上がり）。反比例のグラフは双曲線。変域は、x の端の値を代入して y の値を求め、小さい方から並べる。'},
             {'title': '利用問題', 'body': 'ともなって変わる2つの数量が「比例（商が一定）」か「反比例（積が一定）」かを見きわめる。くぎの本数と重さ→比例、歯車の歯数と回転数→反比例、同じ道のりの速さと時間→反比例。'}]
    note = '2026-10-08 Claude作成。数学ドリルp48〜63（13 比例と反比例・14 座標とグラフ・15 比例と反比例の利用、標準問題・実力問題①②）を写真で目視し、数・場面を変えた類題を作った。グラフをかく問題は、式・座標・値を答える形にした。手書きの答えは使っていない。'
    return u, guide, note
