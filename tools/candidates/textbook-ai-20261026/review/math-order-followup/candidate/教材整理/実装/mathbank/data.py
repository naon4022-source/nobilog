"""7章 データの活用（ワーク p134〜141・教科書 p222〜243 を写真で確認して作成）"""
from common import *
from geo import done

def dec(v): return num_answer(F(v), True)
def ftab(classes, freqs, unit, extra=None, head='度数'):
    """度数分布表を文字で：「10以上15未満：3」"""
    lines = []
    for i, ((a, b), f) in enumerate(zip(classes, freqs)):
        row = f'{fmt_num(F(a), "dec")}{unit}以上{fmt_num(F(b), "dec")}{unit}未満：{head} {f}'
        if extra: row += '　' + extra[i]
        lines.append(row)
    return '\n'.join(lines)
def mk_classes(start, width, n): return [(start + width * i, start + width * (i + 1)) for i in range(n)]
def rand_freqs(r, n, total=None, lo=0, hi=12):
    while True:
        fs = [r.randint(lo, hi) for _ in range(n)]
        if total is None or sum(fs) == total: return fs
        if total is not None:
            d = total - sum(fs); i = r.randrange(n)
            if fs[i] + d >= lo: fs[i] += d; return fs

# ---------------- ヒストグラムと相対度数①（ワーク p134〜135・教科書 p222〜227） ----------------
def d1():
    u = Unit('workbook-math-1-hist1', 'workbook', 'ヒストグラムと相対度数①', 'データの活用',
             '2026-10-05 Claude作成。数学ワークp134〜135（A①範囲・度数分布表・累積度数・A②ヒストグラムと度数分布多角形・B①身長のヒストグラム・B+②よごれたデータと範囲）と教科書p224〜227（階級・度数・度数分布表・累積度数・例2・問2・問3・ヒストグラム・度数分布多角形）を写真で確認。表やグラフは文章で示した。', tb=224)
    r = rng(1501)
    def raw(n): return sorted(r.sample(range(10, 40), n), key=lambda _: r.random())
    def t1():
        n = r.randint(10, 15); xs = [r.randint(10, 35) for _ in range(n)]
        u.add(f'次のデータは、ある中学校の生徒 {n} 人のハンドボール投げの記録（m）である。分布の範囲を求めよう。\n{"、".join(map(str, xs))}', {'kind': 'number', 'value': str(max(xs) - min(xs)), 'units': ['m']},
              f'範囲＝最大値−最小値。最大値 {max(xs)}、最小値 {min(xs)} だから {max(xs)}−{min(xs)}＝{max(xs) - min(xs)}（m）', 134, 'A①(1)', '範囲', [str(max(xs)), str(max(xs) + min(xs))], tb=224, tbnote='度数分布表')
    def t2():
        n = r.randint(12, 16); xs = [r.randint(10, 34) for _ in range(n)]; w = 5; a = r.choice([10, 15, 20, 25, 30])
        f = sum(1 for x in xs if a <= x < a + w)
        u.add(f'次のデータは、生徒 {n} 人のハンドボール投げの記録（m）である。階級の幅を 5m として度数分布表に整理するとき、{a}m 以上 {a + w}m 未満の階級の度数を求めよう。\n{"、".join(map(str, xs))}', {'kind': 'number', 'value': str(f), 'units': ['人']},
              f'{a} 以上 {a + w} 未満にあてはまる値は {"、".join(str(x) for x in sorted(xs) if a <= x < a + w) or "なし"} で {f} 人（{a + w} はふくまない）。', 134, 'A①(2)', '度数分布表', [str(sum(1 for x in xs if a <= x <= a + w)), str(sum(1 for x in xs if a < x <= a + w))], tb=224, tbnote='度数分布表')
    def t3():
        n = r.randint(5, 7); cls = mk_classes(r.choice([10, 135, 35, 0, 40]), r.choice([5, 10]), n); fs = rand_freqs(r, n, None, 0, 9)
        k = r.randint(2, n - 1); cum = sum(fs[:k])
        u.add(f'次の度数分布表で、{fmt_num(F(cls[k - 1][1]))} 未満の累積度数を求めよう。\n{ftab(cls, fs, "")}', num_answer(cum),
              f'累積度数は、最初の階級からその階級までの度数の合計。{"＋".join(map(str, fs[:k]))}＝{cum}', 134, 'A①(2)', '累積度数', [str(fs[k - 1]), str(sum(fs[:k + 1]))], tb=224, tbnote='例2・問2')
    def t4():
        n = r.randint(5, 7); cls = mk_classes(r.choice([135, 30, 10]), 5, n); fs = rand_freqs(r, n, None, 1, 12)
        if len(set(fs)) < n or fs.index(max(fs)) is None: return
        i = fs.index(max(fs))
        u.add(f'次の度数分布表で、度数がもっとも大きい階級を答えよう（「○以上○未満」のように答える）。\n{ftab(cls, fs, "")}', exact_answer([f'{cls[i][0]}以上{cls[i][1]}未満', f'{cls[i][0]}〜{cls[i][1]}'], compact=True),
              f'度数がもっとも大きいのは {max(fs)} の階級で、{cls[i][0]} 以上 {cls[i][1]} 未満。', 134, 'A①(2)④', '度数分布表', tb=224, tbnote='度数分布表')
    def t5():
        n = 6; cls = mk_classes(r.choice([135, 140, 30]), 5, n); fs = rand_freqs(r, n, None, 1, 12)
        k = r.randint(1, sum(fs)); acc = 0
        for i in range(n - 1, -1, -1):
            acc += fs[i]
            if acc >= k: break
        u.add(f'あるクラスの生徒の身長を、階級の幅 5cm のヒストグラムに表した。それぞれの階級の度数は、低い方から順に {"、".join(map(str, fs))} 人で、最初の階級は {cls[0][0]}cm 以上 {cls[0][1]}cm 未満である。身長の高い方から数えて {k} 番目の生徒は、どの階級にはいるか答えよう（「○以上○未満」のように答える）。', exact_answer([f'{cls[i][0]}以上{cls[i][1]}未満', f'{cls[i][0]}cm以上{cls[i][1]}cm未満', f'{cls[i][0]}〜{cls[i][1]}'], compact=True),
              f'高い方の階級から度数をたしていく。{"、".join(f"{cls[j][0]}〜{cls[j][1]}：{fs[j]}人" for j in range(n - 1, i - 1, -1))} で、合計が {k} 人以上になるのは {cls[i][0]} 以上 {cls[i][1]} 未満の階級。', 135, 'B①(2)', 'ヒストグラムの読み取り', tb=225, tbnote='ヒストグラム')
    def t6():
        n = 6; fs = rand_freqs(r, n, None, 0, 12)
        u.add(f'あるクラスの生徒の身長をヒストグラムに表した。それぞれの長方形の高さ（度数）は、左から順に {"、".join(map(str, fs))} 人である。このクラスの生徒の人数を求めよう。', {'kind': 'number', 'value': str(sum(fs)), 'units': ['人']}, f'ヒストグラムの長方形の高さ（度数）を全部たす。{"＋".join(map(str, fs))}＝{sum(fs)}（人）', 135, 'B①(1)', 'ヒストグラムの読み取り', [str(max(fs)), str(n)], tb=225, tbnote='ヒストグラム')
    def t7():
        w = r.choice([20, 10]); n = 5; total = 10
        vals = sorted(r.sample(range(1, 100 if w == 20 else 50), total))
        R = vals[-1] - vals[0]
        hide = r.randrange(1, total - 1)
        shown = [str(v) for i, v in enumerate(vals) if i != hide] + ['？']
        r.shuffle(shown)
        cls = mk_classes(0, w, n if w == 20 else 5)
        fs = [sum(1 for v in vals if a <= v < b) for a, b in cls]
        k = cls.index(next(c for c in cls if c[0] <= vals[hide] < c[1]))
        u.add(f'10人の生徒のテストの得点があるが、1つ（？）がよごれて読めなくなった。読めた得点は {"、".join(x for x in shown if x != "？")} で、10人の得点の範囲は {R} 点であることがわかっている。また、度数分布表で {cls[k][0]} 点以上 {cls[k][1]} 点未満の階級の度数は {fs[k]} 人である。読めなくなった得点は、どの階級にはいるか答えよう（「○以上○未満」のように答える）。', exact_answer([f'{cls[k][0]}以上{cls[k][1]}未満', f'{cls[k][0]}点以上{cls[k][1]}点未満', f'{cls[k][0]}〜{cls[k][1]}'], compact=True),
              f'読めた9つの値で {cls[k][0]} 以上 {cls[k][1]} 未満にはいるのは {fs[k] - 1} 人。度数が {fs[k]} 人なので、読めない得点はこの階級にはいる。範囲が {R} 点なので、最大値と最小値は読めている値で決まる（{vals[0]} と {vals[-1]}）。', 135, 'B+②', 'よごれたデータと度数分布表', tb=224, tbnote='度数分布表')
    def t8():
        k = r.randrange(3)
        if k == 0: u.add('度数分布表で、データを整理した1つ1つの区間を何というか答えよう。', exact_answer(['階級']), '区間を階級、区間の幅を階級の幅、各階級にはいるデータの個数を度数という。', 134, 'A①', '用語', ['度数'], tb=224, tbnote='階級・度数')
        elif k == 1: u.add('ヒストグラムの1つ1つの長方形の上の辺の中点を、順に線分で結んでできる折れ線グラフを何というか答えよう。', exact_answer(['度数分布多角形', '度数折れ線']), '両端では、度数0の階級があるものと考えて、線分を横軸までのばす。', 135, 'A②', '度数分布多角形', ['ヒストグラム'], tb=226, tbnote='度数分布多角形')
        else:
            a, b = r.choice([(10, 15), (1.4, 1.8), (40, 45), (20, 25)])
            u.add(f'{fmt_num(F(str(a)), "dec")} 以上 {fmt_num(F(str(b)), "dec")} 未満の階級の、階級の幅を求めよう。', dec(F(str(b)) - F(str(a))), f'階級の幅は {fmt_num(F(str(b)), "dec")}−{fmt_num(F(str(a)), "dec")}＝{fmt_num(F(str(b)) - F(str(a)), "dec")}', 134, 'A①(2)①', '階級の幅', tb=224, tbnote='階級の幅')
    plan = [t1] * 10 + [t2] * 12 + [t3] * 12 + [t4] * 8 + [t5] * 10 + [t6] * 6 + [t7] * 8 + [t8] * 4
    return done(fill(u, plan))

# ---------------- ヒストグラムと相対度数②（ワーク p136〜137・教科書 p227〜231） ----------------
def d2():
    u = Unit('workbook-math-1-hist2', 'workbook', 'ヒストグラムと相対度数②', 'データの活用',
             '2026-10-05 Claude作成。数学ワークp136〜137（A①平均値・中央値・最頻値・A②階級値と最頻値・A③相対度数と累積相対度数・B①数学のテストの得点・B+②代表値を使った説明）と教科書p227〜231（代表値・階級値・最頻値・問5・相対度数・例3・問6・累積相対度数・例4）を写真で確認。', tb=228)
    r = rng(1511)
    def t1():
        n = r.choice([9, 10, 11, 12]); xs = [r.randint(2, 20) for _ in range(n)]
        what = r.choice(['平均値', '中央値'])
        s = sorted(xs)
        med = F(s[n // 2]) if n % 2 else F(s[n // 2 - 1] + s[n // 2], 2)
        v = F(sum(xs), n) if what == '平均値' else med
        if what == '平均値' and v.denominator not in (1, 2, 4, 5, 10): return
        expl = f'平均値＝（合計）÷（個数）＝{sum(xs)}÷{n}＝{fmt_num(v, "dec")}' if what == '平均値' else f'小さい順に並べると {"、".join(map(str, s))}。{"中央の" + str(n // 2 + 1) + "番目" if n % 2 else str(n // 2) + "番目と" + str(n // 2 + 1) + "番目の平均"}で {fmt_num(med, "dec")}'
        u.add(f'次のデータは、ある中学校の生徒 {n} 人が先月読んだ本の冊数である。{what}を求めよう。\n{"、".join(map(str, xs))}', dec(v), expl, 136, 'A①', '代表値', [ans_str(med if what == '平均値' else F(sum(xs), n)), str(s[n // 2])], tb=227, tbnote='代表値')
    def t2():
        n = r.choice([9, 10, 11]); base = [r.randint(2, 20) for _ in range(n - 2)]; m = r.choice(base); xs = base + [m, m]; r.shuffle(xs)
        c = collections_mode(xs)
        if c is None: return
        u.add(f'次のデータの最頻値を求めよう。\n{"、".join(map(str, xs))}', num_answer(c), f'最頻値は、データの中でもっとも多く現れる値。{c} が {xs.count(c)} 回でもっとも多い。', 136, 'A①(3)', '最頻値', [str(max(xs))], tb=227, tbnote='最頻値')
    def t3():
        a, w = r.choice([(10, 6), (15, 5), (20, 10), (1.40, F(2, 5)), (35, 5), (0, 10)])
        a = F(str(a)) if not isinstance(a, F) else a; w = F(w)
        i = r.randint(0, 4); lo = a + w * i
        v = lo + w / 2
        u.add(f'{fmt_num(lo, "dec")} 以上 {fmt_num(lo + w, "dec")} 未満の階級の階級値を求めよう。', dec(v), f'階級値は、階級のまん中の値。({fmt_num(lo, "dec")}＋{fmt_num(lo + w, "dec")})÷2＝{fmt_num(v, "dec")}', 136, 'A②(1)', '階級値', [ans_str(lo + w), ans_str(w / 2)], tb=228, tbnote='階級値・問5')
    def t4():
        n = 5; a, w = r.choice([(10, 6), (15, 5), (20, 10), (0, 10), (25, 5)]); cls = mk_classes(a, w, n); fs = rand_freqs(r, n, None, 1, 14)
        if fs.count(max(fs)) > 1: return
        i = fs.index(max(fs)); v = F(cls[i][0] + cls[i][1], 2)
        u.add(f'次の度数分布表で、最頻値を求めよう。\n{ftab(cls, fs, "")}', dec(v), f'度数分布表では、度数がもっとも多い階級の階級値を最頻値とする。{cls[i][0]} 以上 {cls[i][1]} 未満の階級の階級値で {fmt_num(v, "dec")}', 136, 'A②(2)', '度数分布表と最頻値', [str(max(fs)), str(cls[i][0])], tb=228, tbnote='問5')
    def t5():
        total = r.choice([20, 25, 50, 40]); n = 4; fs = rand_freqs(r, n, total, 1, total)
        cls = mk_classes(F(15, 2), F(1, 2), n)
        k = r.randrange(n); rf = F(fs[k], total)
        u.add(f'ある中学校の1年生 {total} 人の 50m 走の記録（秒）を度数分布表にまとめた。{fmt_num(cls[k][0], "dec")} 秒以上 {fmt_num(cls[k][1], "dec")} 秒未満の階級の度数は {fs[k]} 人である。この階級の相対度数を求めよう。', dec(rf), f'相対度数＝（階級の度数）÷（度数の合計）＝{fs[k]}÷{total}＝{fmt_num(rf, "dec")}', 137, 'A③(1)', '相対度数', [ans_str(F(total, fs[k])), str(fs[k])], tb=231, tbnote='相対度数・例3')
    def t6():
        total = r.choice([20, 25, 50]); n = 5; fs = rand_freqs(r, n, total, 1, total)
        cls = mk_classes(0, 20, n); k = r.randint(1, n - 1)
        crf = F(sum(fs[:k]), total)
        u.add(f'生徒 {total} 人の数学のテストの得点を度数分布表にまとめた。各階級の度数は、0点以上20点未満から順に {"、".join(map(str, fs))} 人である。{cls[k - 1][1]} 点未満の累積相対度数を求めよう。', dec(crf),
              f'累積相対度数は、最初の階級からその階級までの相対度数の合計。累積度数 {sum(fs[:k])} を合計 {total} でわって {fmt_num(crf, "dec")}', 137, 'B①(1)', '累積相対度数', [ans_str(F(fs[k - 1], total)), ans_str(F(sum(fs[:k + 1]), total))], tb=231, tbnote='累積相対度数・例4')
    def t7():
        total = r.choice([20, 25, 50]); n = 4; fs = rand_freqs(r, n, total, 1, total); k = r.randint(1, n - 1)
        p = F(sum(fs[:k]) * 100, total)
        cls = mk_classes(F(15, 2), F(1, 2), n)
        u.add(f'1年生 {total} 人の 50m 走の記録を度数分布表にまとめた。各階級の度数は、7.5秒以上8.0秒未満から順に {"、".join(map(str, fs))} 人である（階級の幅は0.5秒）。{fmt_num(cls[k - 1][1], "dec")} 秒未満であるのは、全体の何%か求めよう。', {'kind': 'number', 'value': num_answer(p, True)['value'], 'units': ['%', '％']},
              f'{fmt_num(cls[k - 1][1], "dec")} 秒未満の累積相対度数は {sum(fs[:k])}÷{total}＝{fmt_num(F(sum(fs[:k]), total), "dec")}。百分率で {fmt_num(p, "dec")}%', 137, 'A③(2)', '累積相対度数', [ans_str(F(sum(fs[:k]), total)), str(sum(fs[:k]))], tb=231, tbnote='累積相対度数')
    def t8():
        n = 25; mean, med, mode = r.choice([(54, 56, 75), (60, 58, 70), (48, 52, 40)])
        sc = r.choice([med - 1, med + 1, med - 3])
        ans = 'イ' if sc < med else 'ア'
        u.add(f'ある中学校の生徒 {n} 人の数学のテストの得点の代表値は、平均値 {mean} 点、中央値 {med} 点、最頻値 {mode} 点だった。ゆうきさんの得点は {sc} 点である。ゆうきさんの得点は、高い方から数えて半数以内にはいっているといえるか。「ア いえる」「イ いえない」から選び、記号で答えよう。', choice_answer([ans]),
              f'ちょうど半数を表す代表値は中央値。中央値 {med} 点より{"低い" if sc < med else "高い"}ので、高い方から半数以内に{"はいっていない" if sc < med else "はいっている"}。平均値や最頻値では判断できない。正解：{ans}', 137, 'B+②', '代表値を使った説明', tb=227, tbnote='代表値')
    plan = [t1] * 14 + [t2] * 6 + [t3] * 8 + [t4] * 10 + [t5] * 10 + [t6] * 10 + [t7] * 8 + [t8] * 4
    return done(fill(u, plan))

def collections_mode(xs):
    import collections
    c = collections.Counter(xs).most_common()
    if len(c) > 1 and c[0][1] == c[1][1]: return None
    return c[0][0]

# ---------------- ヒストグラムと相対度数③（ワーク p138〜139・教科書 p235〜237） ----------------
def d3():
    u = Unit('workbook-math-1-hist3', 'workbook', 'ヒストグラムと相対度数③', 'データの活用',
             '2026-10-05 Claude作成。数学ワークp138〜139（A①データの分布のようす（範囲）・A②度数分布表と平均値・B①ヒストグラムから平均値・B+②範囲・平均値・中央値の比較）と教科書p234〜237（度数分布表の読みとり・データの分布のようす・度数分布表から平均値を求める・例1・問1）を写真で確認。', tb=236)
    r = rng(1521)
    def t1():
        n = 9; A = [r.randint(2, 20) for _ in range(n)]; B = [r.randint(2, 20) for _ in range(n)]
        if sum(A) != sum(B): B[-1] += sum(A) - sum(B)
        if not (0 < B[-1] < 30) or sum(A) % n: return
        which = r.choice(['A班', 'B班']); xs = A if which == 'A班' else B
        u.add(f'A班とB班のゲームの得点（点）は次のとおりで、平均値はどちらも {fmt_num(F(sum(A), n), "dec")} 点だった。{which}の得点の範囲を求めよう。\nA班：{"、".join(map(str, A))}\nB班：{"、".join(map(str, B))}', {'kind': 'number', 'value': str(max(xs) - min(xs)), 'units': ['点']},
              f'範囲＝最大値−最小値＝{max(xs)}−{min(xs)}＝{max(xs) - min(xs)}（点）。平均値が同じでも、範囲がちがえば散らばりのようすがちがう。', 138, 'A①(1)', 'データの分布のようす', [str(max(xs)), str(max(A + B) - min(A + B))], tb=236, tbnote='データの分布のようす')
    def t2():
        n = r.randint(4, 6); a, w = r.choice([(0, 10), (2, 2), (22, 2), (10, 4), (0, 5)]); cls = mk_classes(a, w, n); fs = rand_freqs(r, n, None, 0, 9)
        if sum(fs) == 0: return
        mids = [F(c[0] + c[1], 2) for c in cls]; S = sum(m * f for m, f in zip(mids, fs)); avg = S / sum(fs)
        if avg.denominator not in (1, 2, 4, 5, 10, 20): return
        u.add(f'次の度数分布表から、平均値を求めよう。\n{ftab(cls, fs, "")}', dec(avg),
              f'それぞれの階級の階級値×度数の合計を、度数の合計でわる。階級値は {"、".join(fmt_num(m, "dec") for m in mids)}。（階級値×度数）の合計は {fmt_num(S, "dec")}、度数の合計は {sum(fs)}。{fmt_num(S, "dec")}÷{sum(fs)}＝{fmt_num(avg, "dec")}', 138, 'A②', '度数分布表と平均値', [ans_str(S), ans_str(F(sum(fs), n))], tb=237, tbnote='例1・問1')
    def t3():
        n = r.randint(4, 6); a, w = r.choice([(0, 10), (22, 2), (10, 4), (0, 5)]); cls = mk_classes(a, w, n); fs = rand_freqs(r, n, None, 1, 9)
        k = r.randrange(n); mid = F(cls[k][0] + cls[k][1], 2)
        u.add(f'次の度数分布表で、{cls[k][0]} 以上 {cls[k][1]} 未満の階級の（階級値×度数）を求めよう。\n{ftab(cls, fs, "")}', dec(mid * fs[k]), f'階級値は ({cls[k][0]}＋{cls[k][1]})÷2＝{fmt_num(mid, "dec")}。{fmt_num(mid, "dec")}×{fs[k]}＝{fmt_num(mid * fs[k], "dec")}', 138, 'A②(1)', '階級値×度数', [ans_str(F(cls[k][0] * fs[k])), str(fs[k])], tb=237, tbnote='問1')
    def t4():
        n = 6; a, w = r.choice([(0, 10), (10, 2), (5, 5)]); cls = mk_classes(a, w, n); fs = rand_freqs(r, n, None, 1, 9)
        tot = sum(fs); target = tot // 2 + 1 if tot % 2 else tot // 2
        acc = 0
        for i, f in enumerate(fs):
            acc += f
            if acc >= (tot + 1) // 2: break
        if tot % 2 == 0:
            acc2 = 0
            for j, f in enumerate(fs):
                acc2 += f
                if acc2 >= tot // 2 + 1: break
            if j != i: return
        u.add(f'次の度数分布表で、中央値がふくまれる階級を答えよう（「○以上○未満」のように答える）。\n{ftab(cls, fs, "")}', exact_answer([f'{cls[i][0]}以上{cls[i][1]}未満', f'{cls[i][0]}〜{cls[i][1]}'], compact=True),
              f'度数の合計は {tot}。中央値は小さい方から {(tot + 1) // 2 if tot % 2 else str(tot // 2) + "番目と" + str(tot // 2 + 1)} 番目の値。累積度数を調べると、{cls[i][0]} 以上 {cls[i][1]} 未満の階級にふくまれる。', 139, 'A②', '中央値がふくまれる階級', tb=237, tbnote='問1')
    def t5():
        cls = mk_classes(10, 10, 9)
        hs = []
        for _ in range(4):
            fs = [0] * 9; c = r.randint(1, 7); spread = r.randint(1, 3)
            for i in range(9):
                if abs(i - c) <= spread: fs[i] = r.randint(1, 10)
            hs.append(fs)
        what = r.choice(['範囲', '平均値'])
        def rng_(fs): nz = [i for i, f in enumerate(fs) if f]; return (nz[-1] - nz[0] + 1) * 10
        def avg(fs): return sum((15 + 10 * i) * f for i, f in enumerate(fs)) / F(sum(fs))
        vals = [rng_(h) if what == '範囲' else avg(h) for h in hs]
        if vals.count(max(vals)) > 1: return
        txt = '\n'.join(f'{LETTERS[i]} ' + '、'.join(str(f) for f in h) for i, h in enumerate(hs))
        u.add(f'次のア〜エは、10点以上20点未満から90点以上100点未満まで（階級の幅10点）の度数を、左から順に並べたものである。{what}がもっとも大きいと考えられるものを記号で答えよう（{"範囲は、度数が0でない最初と最後の階級から考える" if what == "範囲" else "平均値は階級値を使って求める"}）。\n{txt}', choice_answer([LETTERS[vals.index(max(vals))]]),
              ('度数が0でない階級の広がりを比べる。' if what == '範囲' else '各ヒストグラムで（階級値×度数）の合計÷度数の合計を比べる。') + '　'.join(f'{LETTERS[i]} {fmt_num(v, "dec") if what == "範囲" else fmt_num(F(round(v * 10), 10), "dec") + "くらい"}' for i, v in enumerate(vals)), 139, 'B+②', '範囲・平均値の比較', tb=236, tbnote='データの分布のようす')
    def t6():
        k = r.randrange(2)
        if k == 0: u.add('度数分布表から平均値を求めるとき、1つの階級にはいっているデータの値は、すべてその階級の何であると考えるか答えよう。', exact_answer(['階級値']), '度数分布表では、各階級のデータの値をすべて階級値とみなして、（階級値×度数）の合計÷度数の合計 で平均値を求める。', 138, 'A②', '度数分布表と平均値', ['最頻値', '中央値'], tb=237, tbnote='度数分布表から平均値を求める')
        else: u.add('2つの容器の卵の重さの平均値と中央値は同じだが、範囲は容器Aが5.5g、容器Bが13.9gだった。重さが平均値の近くに集まっていると考えられるのはどちらか。「ア 容器A」「イ 容器B」から選び、記号で答えよう。', choice_answer(['ア']), '範囲が小さい容器Aの方が、データが平均値の近くに集まっている。代表値だけでなく範囲や分布のようすも合わせて考える。', 138, 'A①', 'データの分布のようす', tb=236, tbnote='データの分布のようす')
    plan = [t1] * 10 + [t2] * 18 + [t3] * 12 + [t4] * 12 + [t5] * 14 + [t6] * 4
    return done(fill(u, plan))

# ---------------- データにもとづく確率（ワーク p140〜141・教科書 p239〜243） ----------------
def d4():
    u = Unit('workbook-math-1-prob', 'workbook', 'データにもとづく確率', 'データの活用',
             '2026-10-05 Claude作成。数学ワークp140〜141（A①ボタンを投げたときの相対度数・B①50年間の3月1日の天気・B②バスの所要時間・B+③くじ引きの1等）と教科書p239〜243（相対度数と確率・問1・問2・実験をおこなうことができないことがらの確率・問3・データをもとに予想・説明しよう）を写真で確認。', tb=240)
    r = rng(1531)
    def t1():
        n = r.choice([50, 100, 200, 400, 500, 1000]); k = r.randint(n * 3 // 10, n * 7 // 10)
        u.add(f'あるボタンを {n} 回投げたところ、裏が {k} 回出た。裏の出た相対度数を求めよう。', dec(F(k, n)), f'相対度数＝（ことがらの起こった回数）÷（全体の回数）＝{k}÷{n}＝{fmt_num(F(k, n), "dec")}', 140, 'A①(1)', '相対度数', [ans_str(F(n - k, n)), ans_str(F(n, k))], tb=240, tbnote='相対度数')
    def t2():
        p = r.choice([F(64, 100), F(47, 100), F(38, 100), F(55, 100), F(72, 100)])
        rows = []
        for n in (50, 100, 200, 500, 1000, 2000):
            k = round(p * n + r.randint(-n // 12, n // 12) * (1 if n < 500 else 0) + (r.randint(-2, 2) if n >= 500 else 0))
            rows.append((n, k))
        n, k = rows[-1]; est = F(round(F(k, n) * 100), 100)
        u.add('あることがらについて実験をくり返した結果は次のとおりである。このことがらの起こる確率は、どのくらいだと考えられるか。小数第2位までの数で答えよう。\n' + '\n'.join(f'{n} 回中 {k} 回' for n, k in rows), dec(est),
              f'回数が多くなるにつれて、相対度数のばらつきは小さくなり、ある値に近づく。いちばん回数の多い {n} 回で {k}÷{n}＝{fmt_num(F(k, n), "dec")} なので、約 {fmt_num(est, "dec")}', 140, 'A①(3)', '相対度数と確率', [ans_str(F(rows[0][1], rows[0][0]))], tb=241, tbnote='確率')
    def t3():
        days = 50; s = r.randint(8, 20); rr = r.randint(5, 15); c = days - s - rr - r.randint(0, 2); snow = days - s - rr - c
        what = r.choice(['晴れ', '雨'])
        k = s if what == '晴れ' else rr
        u.add(f'ある都市の1975年から2024年までの50年間で、3月1日の天気は、晴れ {s} 回、くもり {c} 回、雨 {rr} 回、雪 {snow} 回だった。この都市で、3月1日の天気が{what}である確率は、どのくらいだと考えられるか求めよう。', dec(F(k, days)),
              f'実験ができないことがらでも、多くのデータをもとにして確率を考える。{k}÷{days}＝{fmt_num(F(k, days), "dec")}', 141, 'B①', 'データにもとづく確率', [ans_str(F(days - k, days))], tb=242, tbnote='実験をおこなうことができないことがらの確率')
    def t4():
        total = 50; fs = rand_freqs(r, 5, total, 1, 25)
        cls = mk_classes(15, 5, 5); k = r.randint(1, 4)
        p = F(sum(fs[:k]), total)
        u.add(f'日曜日の午前中に、駅から遊園地までの直通バスが到着するまでにかかった時間を50回調べた。かかった時間（分）の度数は、15分以上20分未満から5分ごとに順に {"、".join(map(str, fs))} 回だった。到着するまでにかかる時間が {cls[k - 1][1]} 分未満である確率を求めよう。', dec(p),
              f'累積相対度数を使う。{cls[k - 1][1]} 分未満は {"＋".join(map(str, fs[:k]))}＝{sum(fs[:k])} 回。{sum(fs[:k])}÷50＝{fmt_num(p, "dec")}', 141, 'B②(2)', '累積相対度数と確率', [ans_str(F(fs[k - 1], total)), ans_str(1 - p)], tb=243, tbnote='データをもとに予想')
    def t5():
        names = ['A', 'B', 'C']
        while True:
            tot = [r.choice([800, 1000, 1200, 1500, 2000]) for _ in range(3)]; one = [r.randint(10, 40) for _ in range(3)]
            ps = [F(o, t) for o, t in zip(one, tot)]
            if len(set(ps)) == 3: break
        order = [names[i] for i in sorted(range(3), key=lambda i: -ps[i])]
        acc = [sep.join(order) for sep in ('→', '、', ',', '', ' ', '＞', '>')]
        u.add(f'商店A、B、Cがくじ引きをする。くじの合計本数と1等の本数は、Aが {tot[0]} 本中 {one[0]} 本、Bが {tot[1]} 本中 {one[1]} 本、Cが {tot[2]} 本中 {one[2]} 本である。1等があたりやすい順に、A、B、Cを並べよう。', exact_answer(acc, compact=True),
              '1等の割合（相対度数）を比べる。' + '、'.join(f'{n}＝{o}÷{t}＝{fmt_num(p, "dec")}' for n, o, t, p in zip(names, one, tot, ps)) + f'。大きい順に {"→".join(order)}', 141, 'B+③', '確率の比較', tb=241, tbnote='確率')
    def t6():
        n, k = r.choice([(160, 120), (200, 150), (80, 52), (250, 200), (400, 260)])
        u.add(f'あるツアーは、これまで {n} 回おこなったうち、{k} 回でイルカに遭遇できた。このツアーに参加したときにイルカに遭遇できる確率は、どのくらいだと考えられるか求めよう。', dec(F(k, n)), f'{k}÷{n}＝{fmt_num(F(k, n), "dec")}', 141, 'B①', 'データにもとづく確率', [ans_str(F(n - k, n))], tb=242, tbnote='問3')
    def t7():
        rel = [F(4, 100), F(8, 100), F(14, 100), F(20, 100), F(26, 100), F(16, 100), F(6, 100), F(4, 100), F(2, 100)]
        lo = r.choice([(25, '2等賞', [5, 6]), (35, '1等賞', [7, 8]), (15, '3等賞', [3, 4])])
        m = r.choice([50, 80, 100, 150, 200])
        p = sum(rel[i] for i in lo[2]) if lo[1] != '1等賞' else sum(rel[7:])
        v = p * m
        if v.denominator != 1: return
        u.add(f'的あてゲームの合計得点で賞を決める。昨年の参加者のデータから、得点の相対度数は、0点以上5点未満から5点ごとに順に 0.04、0.08、0.14、0.20、0.26、0.16、0.06、0.04、0.02 である。{lo[1]}は{"35点以上" if lo[1] == "1等賞" else ("25〜34点" if lo[1] == "2等賞" else "15〜24点")}である。今年の参加者が {m} 人のとき、{lo[1]}の景品は何個くらい用意すればよいか。データにもとづく確率を使って求めよう。', {'kind': 'number', 'value': str(v), 'units': ['個']},
              f'{lo[1]}になる確率は、該当する階級の相対度数の合計で {fmt_num(p, "dec")}。{m}×{fmt_num(p, "dec")}＝{v}（個）くらい', 141, 'B②', '確率を使った予想', [str(round(m * rel[lo[2][0]]))], tb=243, tbnote='説明しよう')
    def t8():
        u.add('あることがらの起こりやすさの程度を表す数を、そのことがらの起こる何というか答えよう。', exact_answer(['確率']), '多数回の実験では、相対度数を確率と考える。', 140, 'A①', '確率', ['相対度数'], tb=241, tbnote='確率')
    plan = [t1] * 12 + [t2] * 10 + [t3] * 10 + [t4] * 10 + [t5] * 10 + [t6] * 5 + [t7] * 10 + [t8] * 1
    return done(fill(u, plan))
