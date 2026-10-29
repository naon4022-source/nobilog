"""数学ドリル 第7章 データの整理（ドリル p96〜101・p104）"""
from mcommon import *
from bank import num_answer

def dn(v): return num_answer(F(v), dec=True)
def ds(v):
    v = F(v); s = dec_str(abs(v)) if v.denominator != 1 else str(abs(v.numerator))
    return ('−' if v < 0 else '') + (s if s is not None else fx(abs(v)))
def median(xs):
    s = sorted(xs); n = len(s)
    return F(s[n // 2]) if n % 2 else F(s[n // 2 - 1] + s[n // 2], 2)

def unit():
    u = DUnit('drill-math-1-data', 'データの整理', 'データの活用')
    r = rng(7007)
    def data(n, lo, hi): return [r.randint(lo, hi) for _ in range(n)]
    def listing(xs): return '、'.join(map(str, xs))
    def rng_q():
        xs = data(r.randint(8, 12), 20, 60)
        u.add(f'次のデータの範囲（レンジ）を求めよう。\n{listing(xs)}', num(max(xs) - min(xs)), f'範囲＝最大値−最小値＝{max(xs)}−{min(xs)}＝{max(xs) - min(xs)}', 96, '1(1)', '範囲', near=[ans_str(F(max(xs)))])
    def mean_q():
        n = r.choice([5, 6, 8, 10]); xs = data(n, 30, 55)
        m = F(sum(xs), n)
        if dec_str(m) is None and m.denominator != 1: return
        u.add(f'次の{n}個のデータの平均値を求めよう。\n{listing(xs)}', dn(m), f'平均値＝合計÷個数＝{sum(xs)}÷{n}＝{ds(m)}', 97, '3(3)', '平均値')
    def median_q():
        n = r.choice([7, 9, 10, 12, 11, 8]); xs = data(n, 30, 55)
        md = median(xs); s = sorted(xs)
        u.add(f'次の{n}個のデータの中央値（メジアン）を求めよう。\n{listing(xs)}', dn(md),
              f'小さい順に並べると {listing(s)}。' + (f'まん中の{n // 2 + 1}番目の値で {ds(md)}' if n % 2 else f'個数が偶数なので、{n // 2}番目と{n // 2 + 1}番目の平均で ({s[n // 2 - 1]}＋{s[n // 2]})÷2＝{ds(md)}'), 98, '2(3)', '中央値', near=[ans_str(F(sum(xs), n))])
    def mode_q():
        base = data(r.randint(6, 9), 3, 10); m = r.choice(base); xs = base + [m, m]
        r.shuffle(xs)
        cnt = {v: xs.count(v) for v in xs}; top = max(cnt.values())
        if list(cnt.values()).count(top) != 1: return
        md = max(cnt, key=cnt.get)
        u.add(f'次のデータの最頻値（モード）を求めよう。\n{listing(xs)}', num(md), f'いちばん多く出てくる値は {md}（{top}回）。', 97, '3(2)', '最頻値')
    def table3():
        pts = list(range(3, 11)); cnts = [r.randint(1, 6) for _ in pts]; N = sum(cnts)
        k = r.random(); head = '得点（点）：' + '、'.join(map(str, pts)) + '\n人数（人）：' + '、'.join(map(str, cnts))
        flat = [p for p, c in zip(pts, cnts) for _ in range(c)]
        if k < .35:
            md = median(flat)
            u.add(f'次の表は、{N}人のテストの得点を表したものである。中央値を求めよう。\n{head}', dn(md), f'{N}人を小さい順に並べると、' + (f'{N // 2 + 1}番目' if N % 2 else f'{N // 2}番目と{N // 2 + 1}番目の平均') + f'が中央値で {ds(md)}点', 97, '3(1)', '中央値')
        elif k < .65:
            top = max(cnts)
            if cnts.count(top) != 1: return
            md = pts[cnts.index(top)]
            u.add(f'次の表は、{N}人のテストの得点を表したものである。最頻値を求めよう。\n{head}', num(md), f'人数がいちばん多い得点は {md}点（{top}人）。', 97, '3(2)', '最頻値')
        else:
            m = F(sum(flat), N)
            if dec_str(m) is None and m.denominator != 1: return
            u.add(f'次の表は、{N}人のテストの得点を表したものである。平均値を求めよう。\n{head}', dn(m), f'(得点×人数)の合計 {sum(flat)} ÷ {N}人 ＝ {ds(m)}点', 97, '3(3)', '平均値')
    def classes(lo, w, k): return [(lo + i * w, lo + (i + 1) * w) for i in range(k)]
    def freq_table():
        lo, w = r.choice([(140, 5), (145, 5), (40, 10), (130, 10), (30, 5), (0, 10)]); k = 5
        cl = classes(lo, w, k); fr = [r.randint(1, 9) for _ in cl]; N = sum(fr)
        unit_ = 'cm' if lo >= 130 else '点' if lo in (40, 0) else 'cm'
        tbl = '\n'.join(f'{a}以上{b}未満：{f}人' for (a, b), f in zip(cl, fr))
        q = r.random(); i = r.randrange(k)
        if q < .2:
            rf = F(fr[i], N)
            if dec_str(rf) is None or rf.denominator > 100: return
            u.add(f'次の度数分布表で、{cl[i][0]}以上{cl[i][1]}未満の階級の相対度数を求めよう（小数で答える）。\n{tbl}\n合計：{N}人', dn(rf), f'相対度数＝その階級の度数÷度数の合計＝{fr[i]}÷{N}＝{ds(rf)}', 97, '4', '相対度数')
        elif q < .4:
            cf = sum(fr[:i + 1])
            u.add(f'次の度数分布表で、{cl[i][0]}以上{cl[i][1]}未満の階級までの累積度数を求めよう。\n{tbl}', num(cf), f'最初の階級からその階級までの度数の合計。' + '＋'.join(map(str, fr[:i + 1])) + f'＝{cf}人', 96, '1(3)', '累積度数')
        elif q < .55:
            mv = F(cl[i][0] + cl[i][1], 2)
            u.add(f'度数分布表で、{cl[i][0]}{unit_}以上{cl[i][1]}{unit_}未満の階級の階級値を求めよう。', dn(mv), f'階級値は階級のまん中の値。({cl[i][0]}＋{cl[i][1]})÷2＝{ds(mv)}', 100, '1(1)', '階級値')
        elif q < .75:
            m = F(sum(F(a + b, 2) * f for (a, b), f in zip(cl, fr)), N)
            if dec_str(m) is None: return
            u.add(f'次の度数分布表から、平均値を求めよう（階級値を使う）。\n{tbl}', dn(m), f'(階級値×度数)の合計 {ds(sum(F(a + b, 2) * f for (a, b), f in zip(cl, fr)))} ÷ {N} ＝ {ds(m)}', 100, '1(3)', '度数分布表と平均値')
        elif q < .9:
            top = max(fr)
            if fr.count(top) != 1: return
            j = fr.index(top); mv = F(cl[j][0] + cl[j][1], 2)
            u.add(f'次の度数分布表で、最頻値を求めよう。\n{tbl}', dn(mv), f'度数がいちばん多い階級は {cl[j][0]}以上{cl[j][1]}未満。度数分布表では、その階級値 {ds(mv)} を最頻値とする。', 98, '1(3)', '度数分布表と最頻値', near=[ans_str(F(top))])
        else:
            j = r.randrange(1, k); above = sum(fr[j:]); pc = F(above * 100, N)
            if dec_str(pc) is None: return
            u.add(f'次の度数分布表で、{cl[j][0]}{unit_}以上の人は全体の何％か。\n{tbl}', dn(pc), f'{cl[j][0]}以上の人は ' + '＋'.join(map(str, fr[j:])) + f'＝{above}人。{above}÷{N}×100＝{ds(pc)}％', 98, '1(2)', '割合')
    def which_class():
        lo, w = r.choice([(2.75, 0.25), (140, 5), (30, 5), (40, 10)]); k = 6
        cl = [(F(lo) + i * F(w), F(lo) + (i + 1) * F(w)) for i in range(k)]
        i = r.randrange(k); v = cl[i][0] if r.random() < .4 else cl[i][0] + F(w) / 2
        acc = [f'{ds(cl[i][0])}以上{ds(cl[i][1])}未満', f'{ds(cl[i][0])}~{ds(cl[i][1])}', f'{ds(cl[i][0])}〜{ds(cl[i][1])}', f'{ds(cl[i][0])}-{ds(cl[i][1])}']
        u.add(f'階級の幅を{ds(F(w))}として、{ds(F(lo))}以上{ds(cl[0][1])}未満、{ds(cl[1][0])}以上{ds(cl[1][1])}未満、…と階級を分けた度数分布表がある。{ds(v)}の記録はどの階級に入るか。「〇以上〇未満」の形で答えよう。',
              exact_answer(acc, compact=True), f'{ds(v)}は {ds(cl[i][0])}以上{ds(cl[i][1])}未満 の階級に入る。' + ('「以上」は境目の値をふくむ。' if v == cl[i][0] else ''), 96, '1(2)', '階級')
    def rel_rev():
        N = r.choice([20, 40, 50, 25]); rf = r.choice([F(1, 10), F(3, 20), F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 20)])
        f = rf * N
        if f.denominator != 1: return
        u.add(f'度数の合計が{N}人の度数分布表で、ある階級の相対度数が{ds(rf)}である。この階級の度数を求めよう。', num(f), f'度数＝度数の合計×相対度数＝{N}×{ds(rf)}＝{fx(f)}人', 99, '4(1)', '相対度数')
    def cum_rel():
        N = 20; fr = [r.randint(1, 6) for _ in range(5)]
        s = sum(fr)
        if s != 20:
            fr[-1] += 20 - s
            if fr[-1] <= 0: return
        i = r.randrange(1, 5); c = F(sum(fr[:i + 1]), N)
        tbl = '、'.join(f'{f}人' for f in fr)
        u.add(f'5つの階級の度数が、小さい階級から順に {tbl}（合計20人）である。小さい方から{i + 1}番目の階級の累積相対度数を求めよう。', dn(c),
              f'累積度数 ' + '＋'.join(map(str, fr[:i + 1])) + f'＝{sum(fr[:i + 1])}人。{sum(fr[:i + 1])}÷20＝{ds(c)}', 97, '4', '累積相対度数')
    def compare3():
        while True:
            xs = data(r.choice([9, 11, 10, 12]), 1, 9)
            vals = {'平均値': F(sum(xs), len(xs)), '中央値': median(xs)}
            cnt = {v: xs.count(v) for v in xs}; top = max(cnt.values())
            if list(cnt.values()).count(top) != 1: continue
            vals['最頻値'] = F(max(cnt, key=cnt.get))
            if len(set(vals.values())) == 3: break
        big = max(vals, key=vals.get)
        u.add(f'次のデータについて、平均値・中央値・最頻値のうち、最も大きいものはどれか。\n{listing(xs)}', exact_answer([big]),
              '、'.join(f'{k}は{ds(v)}' for k, v in vals.items()) + f'。最も大きいのは{big}。', 104, '10(1)', '代表値の比較')
    fixed = [
        ('データをいくつかの区間に分け、それぞれの区間に入るデータの個数を示した表を何というか。', exact_answer(['度数分布表', 'どすうぶんぷひょう']), '度数分布表。区間を階級、区間の幅を階級の幅、個数を度数という。', 96, '要点1', '用語', ['ヒストグラム']),
        ('度数分布表で、データを整理するための区間を何というか。', exact_answer(['階級', 'かいきゅう']), '階級。その区間の幅を階級の幅という。', 96, 'Guide', '用語', ['度数']),
        ('度数分布表で、それぞれの階級に入るデータの個数を何というか。', exact_answer(['度数', 'どすう']), '度数。', 96, 'Guide', '用語', ['階級']),
        ('各階級の幅を横、度数を縦とする長方形を順に並べてかいたグラフを何というか。', exact_answer(['ヒストグラム', '柱状グラフ']), 'ヒストグラム（柱状グラフ）。', 96, '要点1', '用語', ['度数折れ線']),
        ('ヒストグラムの長方形の上の辺の中点を順に結んでつくったグラフを何というか。', exact_answer(['度数折れ線', '度数分布多角形']), '度数折れ線（度数分布多角形）。', 97, 'Guide', '用語', ['ヒストグラム']),
        ('各階級の度数の、全体に対する割合を何というか。', exact_answer(['相対度数', 'そうたいどすう']), '相対度数＝その階級の度数÷度数の合計。', 96, '要点1', '用語', ['累積度数']),
        ('データの値を大きさの順に並べたとき、中央にくる値を何というか。', exact_answer(['中央値', 'メジアン', 'ちゅうおうち']), '中央値（メジアン）。データが偶数個のときは中央の2つの値の平均。', 96, '要点2', '用語', ['平均値']),
        ('データの中で、最も多く出てくる値を何というか。', exact_answer(['最頻値', 'モード', 'さいひんち']), '最頻値（モード）。度数分布表では度数が最も多い階級の階級値。', 96, '要点2', '用語', ['中央値']),
        ('平均値・中央値・最頻値のように、データ全体のようすを表す数値をまとめて何というか。', exact_answer(['代表値', 'だいひょうち']), '代表値。', 97, 'Guide', '用語'),
        ('最大値から最小値をひいた値を何というか。', exact_answer(['範囲', 'レンジ', 'はんい']), '範囲（レンジ）＝最大値−最小値。', 96, 'Guide', '用語', ['階級の幅']),
        ('度数分布表で、階級のまん中の値を何というか。', exact_answer(['階級値', 'かいきゅうち']), '階級値。例：10以上20未満の階級値は15。', 96, 'Guide', '用語'),
    ]
    fixed_i = iter(fixed)
    def fixedq():
        it = next(fixed_i, None)
        if it is None: return
        p, a, e, page, nb, tp, *nr = it
        u.add(p, a, e, page, nb, tp, nr[0] if nr else ())
    plan = [rng_q, mean_q, median_q, mode_q, table3, freq_table, which_class, rel_rev, cum_rel, compare3, fixedq, freq_table, table3, fixedq]
    fill(u, plan)
    guide = [{'title': '度数分布表', 'body': 'データを階級に分けて度数を数える。「以上」は境目の値をふくみ、「未満」はふくまない。累積度数は最初の階級からその階級までの度数の合計。'},
             {'title': 'ヒストグラムと度数折れ線', 'body': '階級の幅を横、度数を縦にした長方形を並べたグラフがヒストグラム。長方形の上の辺の中点を結ぶと度数折れ線になる。'},
             {'title': '相対度数', 'body': '相対度数＝その階級の度数÷度数の合計。全部の相対度数の合計は1.00。度数＝度数の合計×相対度数。例：40人中12人の階級は 12÷40＝0.30'},
             {'title': '代表値', 'body': '平均値＝合計÷個数（度数分布表では（階級値×度数）の合計÷度数の合計）。中央値は大きさの順でまん中（偶数個なら中央2つの平均）。最頻値は最も多い値（表では度数最大の階級の階級値）。範囲＝最大値−最小値。'},
             {'title': '代表値の使い分け', 'body': '極端に大きい・小さい値があると平均値は引っぱられる。そのときは中央値も見て判断する。2つの集団を比べるときは、1つの階級だけでなく全体の傾向（代表値）で比べる。'}]
    note = '2026-10-08 Claude作成。数学ドリルp96〜101（23 データの整理、標準問題・実力問題）とp104（総仕上げ10）を写真で目視し、数値を変えた類題を作った。ヒストグラムは度数を文章で示した。手書きの答えは使っていない。'
    return u, guide, note
