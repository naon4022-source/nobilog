"""hist1・hist2 の「グラフを読む」補い候補（Claude 2026-10-29）。
元の70問（../../20261028_数学残18続き/原稿）は変更しない。差しかえ候補をつくり、元の問題の対象IDに入れた「差しかえ後の単元」を 原稿/ に書く。
図は度数のデータから座標でかき、かいた SVG から長方形・点の位置を読みもどして、データと同じかを確かめる。"""
import json, re, sys, hashlib, pathlib
from fractions import Fraction as F
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import fig
fig.FIGDIR = H / '図'
from fig import Fig
ROOT = pathlib.Path('/Users/shimizunaotomoo/Desktop/my-app')
SRC = {224: '数学教科書/S__16466048_0.jpg', 225: '数学教科書/S__16466048_0.jpg', 226: '数学教科書/S__16466049_0.jpg', 227: '数学教科書/S__16466049_0.jpg',
       228: '数学教科書/S__16466050_0.jpg', 231: '数学教科書/S__16466051_0.jpg', 232: '数学教科書/S__16466053_0.jpg'}
YS = 0.45            # 度数 1 あたりの高さ（図の座標）
REG = []


def only1(v):
    assert len(v) == 1, v
    return v[0]


def grid1(fg, n, top, ys, x0=0):
    """度数のグラフに、1人ごとのうすい横線をかく"""
    k = 1
    while k * ys <= top + 1e-9:
        a, b = fg.T((x0, k * ys)); c, d = fg.T((n + (0.5 if x0 else 0), k * ys))
        fg.el.insert(0, '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#cfcfcf" stroke-width="1"/>' % (a, b, c, d)); k += 1


def hist_fig(bounds, counts, ytick=5, title='', missing=None, rel=False, total=None, xunit='（分）'):
    """ヒストグラム。bounds は階級の境（両はし込み）、counts は度数（rel=True なら相対度数）。missing の番号の長方形はかかずに「?」"""
    n = len(counts); ys = YS if not rel else 9.0
    top = max(c for i, c in enumerate(counts) if i != missing) * ys
    fg = Fig(-1.6, n + 1.7, -1.4, top + 1.6, px=300)
    rects = []
    for i, c in enumerate(counts):
        if i == missing:
            fg.text('?', (i + 0.5, 0.6), size=18); continue
        fg.el.insert(0, '<path d="M%.1f,%.1f L%.1f,%.1f L%.1f,%.1f L%.1f,%.1f Z" fill="#d9d9d9" stroke="none"/>' % (*fg.T((i, 0)), *fg.T((i + 1, 0)), *fg.T((i + 1, c * ys)), *fg.T((i, c * ys))))
        fg.poly((i, 0), (i + 1, 0), (i + 1, c * ys), (i, c * ys)); rects.append((i, c))
    ymax = top + 0.9
    if not rel: grid1(fg, n, ymax, ys)
    fg.seg((0, 0), (n + 0.5, 0)); fg.seg((0, 0), (0, ymax))
    step = (ytick * ys)
    k = 0
    while k * step <= ymax + 1e-9:
        y = k * step
        if k: fg.seg((0, y), (n, y), dash=True)
        lab = ytick * k if not rel else round(ytick * k, 2)
        fg.text(('%g' % lab), (0, y), dx=-16, size=13); k += 1
    for i, b in enumerate(bounds): fg.text('%g' % b, (i, 0), dy=14, size=13)
    fg.text(xunit, (n + 1.0, 0), dy=14, size=12)
    if title: fg.text(title, (n / 2, ymax), dy=-10, size=13)
    fg.data = {'kind': 'hist', 'counts': counts, 'missing': missing, 'ys': ys, 'rects': rects}
    return fg


def poly_fig(bounds, series, ytick, rel=False, dashes=(False, True), names=None, xunit='（分）'):
    """度数分布多角形（両はしに度数 0 の点）。series は度数（または相対度数）の列のリスト"""
    n = len(bounds) - 1; ys = YS if not rel else 9.0
    top = max(max(s) for s in series) * ys
    fg = Fig(-2.0, n + 2.2, -1.4, top + 1.6, px=300)
    if not rel: grid1(fg, n, top + 0.9, ys, x0=-0.5)
    fg.seg((-0.5, 0), (n + 0.5, 0)); fg.seg((-0.5, 0), (-0.5, top + 0.9))
    step = ytick * ys; k = 0
    while k * step <= top + 0.9 + 1e-9:
        y = k * step
        if k: fg.seg((-0.5, y), (n + 0.5, y), dash=True)
        fg.text('%g' % (round(ytick * k, 2)), (-0.5, y), dx=-16, size=13); k += 1
    for i, b in enumerate(bounds): fg.text('%g' % b, (i, 0), dy=14, size=13)
    fg.text(xunit, (n + 1.3, 0), dy=14, size=12)
    pts_all = []
    for j, s in enumerate(series):
        pts = [(-0.5, 0)] + [(i + 0.5, c * ys) for i, c in enumerate(s)] + [(n + 0.5, 0)]
        fg.el.append('<polyline' + (' stroke-dasharray="6 4"' if dashes[j] else '') + ' points="' + ' '.join('%.1f,%.1f' % fg.T(p) for p in pts) + '"/>')
        for p in pts[1:-1]:
            x, y = fg.T(p); fg.el.append('<circle cx="%.1f" cy="%.1f" r="3" fill="#111" stroke="none"/>' % (x, y))
        pts_all.append(pts)
        if names: fg.text(names[j], pts[1 + s.index(max(s))], dy=-14, size=14)
    fg.data = {'kind': 'poly', 'series': series, 'ys': ys, 'pts': pts_all}
    return fg


def readback(svg, fg):
    """SVG の数字を読みもどして、図のデータが問題のデータと同じかを確かめる"""
    d = fg.data
    if d['kind'] == 'hist':
        got = []
        for m in re.finditer(r'<polygon points="([^"]+)"/>', svg):
            p = [tuple(map(float, xy.split(','))) for xy in m[1].split()]
            if len(p) == 4: got.append(round((p[0][1] - p[2][1]) / fg.k / d['ys'], 6))
        want = [float(c) for i, c in enumerate(d['counts']) if i != d['missing']]
        assert len(got) == len(want) and all(abs(g - w) < 0.02 for g, w in zip(got, want)), (got, want)   # SVG は 0.1 px 単位で丸めているので、読みもどしは 0.02 以内で一致を見る
    else:
        lines = re.findall(r'<polyline[^>]*points="([^"]+)"/>', svg)
        lines = [l for l in lines if len(l.split()) == len(d['series'][0]) + 2]
        assert len(lines) == len(d['series'])
        for l, s in zip(lines, d['series']):
            ys = [float(xy.split(',')[1]) for xy in l.split()][1:-1]
            base = float(l.split()[0].split(',')[1])
            got = [(base - y) / fg.k / d['ys'] for y in ys]
            assert all(abs(g - float(c)) < 0.02 for g, c in zip(got, s)), (got, s)


def make(key, n, prompt, answer, ex, page, fg, alt, check):
    """元の単元 key の n 番の問題を差しかえる候補"""
    assert check() == F(answer['value']) if answer['kind'] == 'number' else check() == answer['accepted'][0], (key, n, check())
    name = f'tokkun-fig-{key}-{n}.svg'
    s = fg.svg(alt); (H / '図').mkdir(exist_ok=True); (H / '図' / name).write_text(s, encoding='utf-8'); readback(s, fg)
    f = SRC[page]; sha = hashlib.sha256((ROOT / f).read_bytes()).hexdigest()
    q = {'id': f'tokkun-math-1-{key}-{n}', 'type': 'input', 'prompt': prompt, 'answer': answer, 'explanation': ex,
         'source': {'file': f, 'sha256': sha, 'page': page, 'number': '特訓（教科書の考え方をもとにしたオリジナル）'},
         'ref': '参考：教科書 p224〜232（ヒストグラム・度数分布多角形・相対度数）（特訓・オリジナル問題）', 'origin': 'original', 'reviewed': False,
         'difficulty': 'hard', 'bank': 'tokkun', 'textbook': {'file': f, 'sha256': sha, 'page': page}, 'image': '/' + name, 'imageAlt': alt}
    REG.append({'unit': key, 'number': n, 'file': name, 'sha256': hashlib.sha256(s.encode()).hexdigest(), 'image': '/' + name, 'imageAlt': alt,
                'claims': [], 'answerClaim': None, 'texts': fg.texts, 'answer': answer, 'data': fg.data.get('counts', fg.data.get('series'))})
    return q


def num(v, units=None):
    a = {'kind': 'number', 'value': str(v)}
    if units: a['units'] = units
    return a


NEW = {'hist1': {}, 'hist2': {}}
REASON = {'hist1': {19: 'ヒストグラムの長方形の面積を文字だけで問う問題。図から度数を読む問題がない', 20: '長方形の高さの比を文字だけで問う問題', 21: '度数折れ線の点の位置を文字で問う問題', 22: '度数折れ線の点の数を文字で問う問題', 35: '面積の合計から階級の幅を求める文字だけの問題', 36: '度数折れ線を文字だけで扱う問題', 38: 'ヒストグラムの高さが何を表すかの用語の問題（図がない）', 39: '度数折れ線の点の横の位置の用語の問題（図がない）', 57: 'ヒストグラムの高さを文字で与えた問題', 68: 'ヒストグラムの横の目もりを文字で問う問題'},
          'hist2': {26: '割合でくらべることを文字だけで問う選択問題', 30: '相対度数の列を文字で与えた問題', 31: '相対度数の列を文字で与えた問題', 33: '累積相対度数を文字で与えた問題', 35: '相対度数の合計が1になることの問題（図がない）', 52: '累積相対度数の列を文字で与えた問題', 54: '累積相対度数の性質の選択問題（図がない）', 59: '相対度数の比の文字だけの問題', 61: '2つの階級の相対度数を文字で与えた問題', 67: '2つの組の相対度数を文字で与えた問題'}}
P = ['人']
# ---------- hist1（ヒストグラム・度数分布多角形を読む） ----------
A = [2, 4, 7, 5, 3, 2]; AB = [0, 10, 20, 30, 40, 50, 60]   # 23 人の通学時間（分）
AALT = 'ヒストグラム（通学時間）。横の目もりは0、10、20、30、40、50、60（分）、たての目もりは0、5（人）で、1人ごとに点線がある。長方形の高さは左から順に読みとる。'
NEW['hist1'][19] = make('hist1', 19, '図は、ある組の通学時間（分）をヒストグラムに表したものである。20 分以上 30 分未満の人は何人か答えよう。', num(7, P),
                        '①20 分以上 30 分未満の階級は、左から3番目の長方形　②長方形の高さを、たての目もり（点線は1人ごと）で読む　③7 人。答え 7人', 225, hist_fig(AB, A, title='（人）'), AALT, lambda: A[2])
NEW['hist1'][20] = make('hist1', 20, '図は、ある組の通学時間（分）をヒストグラムに表したものである。この組の人数は全部で何人か答えよう。', num(23, P),
                        '①それぞれの長方形の高さが、その階級の度数（人数）　②左から 2、4、7、5、3、2 人　③たすと 23 人。答え 23人', 225, hist_fig(AB, A, title='（人）'), AALT, lambda: sum(A))
NEW['hist1'][21] = make('hist1', 21, '通学時間が 30 分未満の人数を知りたい。図のヒストグラム（23 人の通学時間を 10 分ごとの階級に分けたもの）の長方形の高さから求めよう。', num(13, P),
                        '①30 分未満は、0 分以上 10 分未満・10 分以上 20 分未満・20 分以上 30 分未満の3つの階級　②長方形の高さは 2、4、7 人　③2 ＋ 4 ＋ 7 ＝ 13。答え 13人', 225, hist_fig(AB, A, title='（人）'), AALT, lambda: sum(A[:3]))
NEW['hist1'][35] = make('hist1', 35, '図は、ある組の通学時間（分）をヒストグラムに表したものである。このヒストグラムから最頻値を求めよう（度数がもっとも多い階級の階級値）。', num(25, ['分']),
                        '①いちばん高い長方形は 20 分以上 30 分未満の階級（7 人）　②その階級値は (20 ＋ 30) ÷ 2　③25 分。答え 25分', 228, hist_fig(AB, A, title='（人）'), AALT,
                        lambda: F(AB[A.index(max(A))] + AB[A.index(max(A)) + 1], 2))
SRC[228] = '数学教科書/S__16466050_0.jpg'
B = [3, 6, 8, 5, 2, 1]
BALT = 'ヒストグラム（25人の家庭学習の時間）。横の目もりは0、10、20、30、40、50、60（分）、たての目もりは0、5（人）で、1人ごとに点線がある。'
NEW['hist1'][36] = make('hist1', 36, '図は、25 人の1日の家庭学習の時間（分）をヒストグラムに表したものである。学習時間が 20 分未満の人は、全体の何 % か答えよう。', num(36, ['%', '％']),
                        '①20 分未満は、左の2つの長方形で 3 ＋ 6 ＝ 9 人　②全体は 25 人　③9 ÷ 25 ＝ 0.36 で 36 %。答え 36%', 225, hist_fig(AB, B, title='（人）'), BALT, lambda: F(sum(B[:2]) * 100, sum(B)))
M = [4, 7, 0, 6, 3, 1]   # 3番目（20〜30）は ? で、度数の合計 30 から求める（本当は 9）
MREAL = [4, 7, 9, 6, 3, 1]
NEW['hist1'][57] = make('hist1', 57, '図は、30 人のハンドボール投げの記録（m）をヒストグラムに表そうとしたものだが、20 m 以上 30 m 未満の長方形がまだかかれていない。この階級の度数を求めよう。', num(9, P),
                        '①かかれている長方形の高さは 4、7、6、3、1 人で、合わせて 21 人　②全体は 30 人　③30 − 21 ＝ 9。答え 9人', 224,
                        hist_fig(AB, MREAL, title='（人）', missing=2, xunit='（m）'), 'ヒストグラム（30人のハンドボール投げ）。横の目もりは0、10、20、30、40、50、60（m）、たての目もりは0、5（人）。20m以上30m未満の長方形はかかれておらず「?」と書いてある。',
                        lambda: 30 - (sum(MREAL) - MREAL[2]))
C = [1, 3, 4, 6, 5, 2]
NEW['hist1'][68] = make('hist1', 68, '図は、21 人の通学時間（分）をヒストグラムに表したものである。中央値（短いほうから 11 番目の人の時間）がふくまれる階級の階級値を求めよう。', num(35, ['分']),
                        '①短いほうから順に、度数をたしていく：1、1 ＋ 3 ＝ 4、4 ＋ 4 ＝ 8、8 ＋ 6 ＝ 14　②11 番目は 14 人目までにはいる 30 分以上 40 分未満の階級　③階級値は 35 分。答え 35分', 224,
                        hist_fig(AB, C, title='（人）'), 'ヒストグラム（21人の通学時間）。横の目もりは0、10、20、30、40、50、60（分）、たての目もりは0、5（人）で、1人ごとに点線がある。',
                        lambda: next(F(AB[i] + AB[i + 1], 2) for i in range(6) if sum(C[:i + 1]) >= 11))
D = [3, 6, 9, 4, 2]; DB = [140, 145, 150, 155, 160, 165]
DALT = '度数分布多角形（身長）。横の目もりは140、145、150、155、160、165（cm）で、点は各階級のまん中の位置にある。両はしは度数0の点。たての目もりは0、5（人）で、1人ごとに点線がある。'
NEW['hist1'][22] = make('hist1', 22, '図は、ある組の身長（cm）を度数分布多角形（度数折れ線）に表したものである。150 cm 以上 155 cm 未満の階級の度数を答えよう。', num(9, P),
                        '①150 cm 以上 155 cm 未満の階級の点は、階級値 152.5 cm の位置にある　②その点の高さを、たての目もり（点線は1人ごと）で読む　③9 人。答え 9人', 226, poly_fig(DB, [D], 5, xunit='（cm）'), DALT, lambda: D[2])
NEW['hist1'][39] = make('hist1', 39, '図は、ある組の身長（cm）を度数分布多角形（両はしは度数 0 の点）に表したものである。この組の人数を求めよう。', num(24, P),
                        '①両はしの点（度数 0）以外の点の高さが、それぞれの階級の度数　②3、6、9、4、2 人　③合わせて 24 人。答え 24人', 226, poly_fig(DB, [D], 5, xunit='（cm）'), DALT, lambda: sum(D))
E1 = [1, 3, 8, 6, 2]; E2 = [4, 7, 5, 3, 1]; EB = [0, 10, 20, 30, 40, 50]
NEW['hist1'][38] = make('hist1', 38, '図は、A組とB組の 1 週間の読書時間（時間）を、同じ階級の度数分布多角形に表したものである（実線が A組、点線が B組）。読書時間が 20 時間以上の人は、A組のほうが B組より何人多いか答えよう。', num(7, P),
                        '①20 時間以上は、20〜30・30〜40・40〜50 の3つの階級　②A組は 8 ＋ 6 ＋ 2 ＝ 16 人、B組は 5 ＋ 3 ＋ 1 ＝ 9 人　③16 − 9 ＝ 7。答え 7人', 227,
                        poly_fig(EB, [E1, E2], 5, names=('A', 'B'), xunit='（時間）'), '2つの度数分布多角形。実線がA組、点線がB組。横の目もりは0、10、20、30、40、50（時間）、たての目もりは0、5（人）で、1人ごとに点線がある。',
                        lambda: sum(E1[2:]) - sum(E2[2:]))
# ---------- hist2（相対度数・累積相対度数のグラフを読む） ----------
RA = [2, 5, 8, 4, 1]; RB = [4, 12, 10, 10, 4]; RBND = [0, 10, 20, 30, 40, 50]
rel = lambda c: [F(x, sum(c)) for x in c]
RALT = '相対度数の度数分布多角形。実線がA組（20人）、点線がB組（40人）。横の目もりは0、10、20、30、40、50（分）、たての目もりは0、0.1、0.2、0.3、0.4（相対度数）。'
rfig = lambda: poly_fig(RBND, [[float(x) for x in rel(RA)], [float(x) for x in rel(RB)]], 0.1, rel=True, names=('A', 'B'))
NEW['hist2'][26] = make('hist2', 26, '図は、A組（20 人）と B組（40 人）の通学時間（分）を、相対度数の度数分布多角形に表したものである（実線が A組、点線が B組）。通学時間が 30 分以上の人の割合が大きいのはどちらの組か。次のア・イから選び、記号で答えよう。\nア A組\nイ B組', {'kind': 'exact', 'accepted': ['イ']},
                        '①30 分以上は 30〜40 と 40〜50 の階級　②A組は 0.2 ＋ 0.05 ＝ 0.25、B組は 0.25 ＋ 0.1 ＝ 0.35　③B組のほうが大きい（人数のちがう組は、度数ではなく相対度数でくらべる）。答え イ', 232, rfig(), RALT,
                        lambda: 'イ' if sum(rel(RB)[3:]) > sum(rel(RA)[3:]) else 'ア')
NEW['hist2'][30] = make('hist2', 30, '図は、A組（20 人）と B組（40 人）の通学時間（分）を、相対度数の度数分布多角形に表したものである（実線が A組、点線が B組）。A組で、相対度数がもっとも大きい階級の度数（人数）を求めよう。', num(8, P),
                        '①A組（実線）でいちばん高い点は 20〜30 分の階級で、相対度数 0.4　②度数 ＝ 相対度数 × 度数の合計　③0.4 × 20 ＝ 8。答え 8人', 232, rfig(), RALT, lambda: max(rel(RA)) * 20)
NEW['hist2'][31] = make('hist2', 31, '図は、A組（20 人）と B組（40 人）の通学時間（分）を、相対度数の度数分布多角形に表したものである（実線が A組、点線が B組）。B組で、通学時間が 20 分未満の人は何人か求めよう。', num(16, P),
                        '①B組（点線）の 0〜10 分は 0.1、10〜20 分は 0.3　②合わせて 0.4　③0.4 × 40 ＝ 16。答え 16人', 232, rfig(), RALT, lambda: sum(rel(RB)[:2]) * 40)
NEW['hist2'][67] = make('hist2', 67, '図は、A組（20 人）と B組（40 人）の通学時間（分）を、相対度数の度数分布多角形に表したものである（実線が A組、点線が B組）。2つの組の相対度数が等しい階級は1つだけある。その階級の階級値を求めよう。', num(5, ['分']),
                        '①実線と点線の点が同じ高さにあるのは、0 分以上 10 分未満の階級（どちらも 0.1）　②階級値は (0 ＋ 10) ÷ 2　③5 分。答え 5分', 232, rfig(), RALT,
                        lambda: only1([F(RBND[i] + RBND[i + 1], 2) for i in range(5) if rel(RA)[i] == rel(RB)[i]]))
NEW['hist2'][61] = make('hist2', 61, 'A組の 20 人のうち、通学時間が 20 分以上の人の割合を百分率で答えよう。図の相対度数の度数分布多角形（実線が A組、点線が 40 人の B組）を使う。', num(65, ['%', '％']),
                        '①A組（実線）の 20〜30 分は 0.4、30〜40 分は 0.2、40〜50 分は 0.05　②合わせて 0.65　③百分率で 65 %。答え 65%', 232, rfig(), RALT, lambda: sum(rel(RA)[2:]) * 100)
CUM = [F(1, 10), F(35, 100), F(7, 10), F(9, 10), F(1)]
SRC[231] = '数学教科書/S__16466051_0.jpg'
def cum_fig():
    """累積相対度数の折れ線（各階級の右はしの値に点をとる）"""
    n = 5; ys = 6.0
    fg = Fig(-1.6, n + 1.7, -1.4, ys + 1.6, px=300)
    fg.seg((0, 0), (n + 0.5, 0)); fg.seg((0, 0), (0, ys + 0.6)); fg.text('（分）', (n + 1.0, 0), dy=14, size=12)
    for k, v in enumerate([0, 0.5, 1]):
        fg.text('%g' % v, (0, v * ys), dx=-16, size=13)
        if k: fg.seg((0, v * ys), (n, v * ys), dash=True)
    for k in range(1, 10):
        if k != 5: fg.seg((0, k / 10 * ys), (n, k / 10 * ys), dash=True)
    for i, b in enumerate(RBND): fg.text('%g' % b, (i, 0), dy=14, size=13)
    pts = [(0, 0)] + [(i + 1, float(c) * ys) for i, c in enumerate(CUM)]
    fg.el.append('<polyline points="' + ' '.join('%.1f,%.1f' % fg.T(p) for p in pts) + '"/>')
    for p in pts[1:]:
        x, y = fg.T(p); fg.el.append('<circle cx="%.1f" cy="%.1f" r="3" fill="#111" stroke="none"/>' % (x, y))
    fg.data = {'kind': 'cum', 'cum': CUM, 'ys': ys, 'pts': pts}
    return fg
_rb = readback
def readback(svg, fg):
    if fg.data['kind'] == 'cum':
        l = re.findall(r'<polyline points="([^"]+)"/>', svg)[-1].split()
        base = float(l[0].split(',')[1])
        got = [(base - float(xy.split(',')[1])) / fg.k / fg.data['ys'] for xy in l[1:]]
        assert len(got) == 5 and all(abs(g - float(c)) < 0.02 for g, c in zip(got, fg.data['cum'])), got
        return
    _rb(svg, fg)
CALT = '累積相対度数の折れ線。横の目もりは0、10、20、30、40、50（分）で、点は各階級の右はしの位置にある。たての目もりは0、0.5、1で、0.1ごとに点線がある。'
NEW['hist2'][33] = make('hist2', 33, '図は、40 人の待ち時間（分）の累積相対度数を、各階級の右はしの値に点をとって折れ線で表したものである。20 分以上 30 分未満の階級の相対度数を求めよう。', num('0.35'),
                        '①30 分までの累積相対度数は 0.7、20 分までは 0.35　②その階級の相対度数は、ちがいで求める　③0.7 − 0.35 ＝ 0.35。答え 0.35', 231, cum_fig(), CALT, lambda: CUM[2] - CUM[1])
NEW['hist2'][52] = make('hist2', 52, '図は、40 人の待ち時間（分）の累積相対度数を、各階級の右はしの値に点をとって折れ線で表したものである。累積相対度数がはじめて 0.5 以上になる階級の階級値を求めよう。', num(25, ['分']),
                        '①累積相対度数は、10 分までで 0.1、20 分までで 0.35、30 分までで 0.7　②はじめて 0.5 以上になるのは 20 分以上 30 分未満の階級（中央値がふくまれる階級）　③階級値は 25 分。答え 25分', 231, cum_fig(), CALT,
                        lambda: next(F(RBND[i] + RBND[i + 1], 2) for i in range(5) if CUM[i] >= F(1, 2)))
NEW['hist2'][54] = make('hist2', 54, '図は、40 人の待ち時間（分）の累積相対度数を、各階級の右はしの値に点をとって折れ線で表したものである。待ち時間が 40 分以上の人は何人か求めよう。', num(4, P),
                        '①40 分までの累積相対度数は 0.9 なので、40 分以上の人の割合は 1 − 0.9 ＝ 0.1　②全体は 40 人　③0.1 × 40 ＝ 4。答え 4人', 231, cum_fig(), CALT, lambda: (1 - CUM[3]) * 40)
RH = [F(15, 100), F(3, 10), F(35, 100), F(2, 10)]; RHB = [0, 10, 20, 30, 40]
RHALT = '相対度数のヒストグラム（40人の運動時間）。横の目もりは0、10、20、30、40（時間）、たての目もりは0、0.1、0.2、0.3（相対度数）で、0.05ごとに点線がある。'
def relhist():
    fg = hist_fig(RHB, [float(x) for x in RH], ytick=0.1, rel=True, title='（相対度数）', xunit='（時間）')
    for k in range(1, 8):
        if k % 2: fg.seg((0, k * 0.05 * 9.0), (4, k * 0.05 * 9.0), dash=True)
    return fg
NEW['hist2'][35] = make('hist2', 35, '図は、40 人の1週間の運動時間（時間）を、相対度数のヒストグラムに表したものである。度数がもっとも多い階級の度数（人数）を求めよう。', num(14, P),
                        '①いちばん高い長方形は 20〜30 時間の階級で、相対度数 0.35　②度数 ＝ 相対度数 × 度数の合計　③0.35 × 40 ＝ 14。答え 14人', 232, relhist(), RHALT, lambda: max(RH) * 40)
NEW['hist2'][59] = make('hist2', 59, '図は、40 人の1週間の運動時間（時間）を、相対度数のヒストグラムに表したものである。運動時間が 20 時間以上の人は何人か求めよう。', num(22, P),
                        '①20 時間以上は、20〜30 時間（0.35）と 30〜40 時間（0.2）の階級　②合わせて 0.55　③0.55 × 40 ＝ 22。答え 22人', 232, relhist(), RHALT, lambda: sum(RH[2:]) * 40)


# ---------- 差しかえ後の単元・対応表・差しかえ表を書く ----------
PREV = H.parent.parent / '20261028_数学残18続き' / '原稿'
table = []
for key, new in NEW.items():
    u = json.loads((PREV / f'tokkun-math-1-{key}.json').read_text(encoding='utf-8'))
    assert u == json.loads((H / '原稿' / f'元_{key}.json').read_text(encoding='utf-8'))
    for n, q in sorted(new.items()):
        old = u['questions'][n - 1]; assert old['id'] == q['id']
        table.append({'unit': key, 'id': q['id'], 'oldPrompt': old['prompt'], 'oldAnswer': old['answer'], 'newPrompt': q['prompt'], 'newAnswer': q['answer'],
                      'image': q['image'], 'page': q['source']['page'], 'reason': REASON[key][n]})
        u['questions'][n - 1] = q
    u['reviewNote'] = u.get('reviewNote', '') + ' 2026-10-29 Claude：グラフを読む問題の補い候補として、%d問を図つきの問題に差しかえた案（元の問題は ../../20261028_数学残18続き/原稿 にそのまま）。' % len(new)
    (H / '原稿' / f'tokkun-math-1-{key}.json').write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (H / f'図の対応表_{key}.json').write_text(json.dumps([r for r in REG if r['unit'] == key], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '差しかえ表.json').write_text(json.dumps(table, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(table), '問の差しかえ候補', len(REG), '枚の図')
