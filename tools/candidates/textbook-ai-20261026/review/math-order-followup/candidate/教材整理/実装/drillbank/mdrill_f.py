"""数学ドリル 第6章 空間図形（ドリル p80〜95）"""
from mcommon import *
from mdrill_e import pi, pid, deg, cm

def setans(items): return {'kind': 'set', 'items': [[x, x[::-1]] for x in items]}
def faceans(fs):
    out = []
    for f in fs:
        alts = []
        for k in range(len(f)):
            rot = f[k:] + f[:k]; alts += [rot, rot[::-1]]
        out.append(list(dict.fromkeys(alts)))
    return {'kind': 'set', 'items': out}
def vol(v): return {'kind': 'number', 'value': ans_str(F(v)), 'units': ['cm³', 'cm3']}

# 直方体 ABCD-EFGH（上の面 ABCD、A の真下が E …）
P = {'A': (0, 0, 1), 'B': (1, 0, 1), 'C': (1, 1, 1), 'D': (0, 1, 1), 'E': (0, 0, 0), 'F': (1, 0, 0), 'G': (1, 1, 0), 'H': (0, 1, 0)}
EDGES = ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH']
FACES = ['ABCD', 'EFGH', 'ABFE', 'BCGF', 'CDHG', 'DAEH']
def vec(e): a, b = P[e[0]], P[e[1]]; return tuple(abs(b[i] - a[i]) for i in range(3))
def par(e1, e2): return e1 != e2 and vec(e1) == vec(e2)
def meet(e1, e2): return e1 != e2 and len(set(e1) & set(e2)) == 1
def skew(e1, e2): return e1 != e2 and not par(e1, e2) and not meet(e1, e2)
def normal(f):
    pts = [P[c] for c in f]
    return tuple(i for i in range(3) if len({p[i] for p in pts}) == 1)[0]
def on_face(e, f): return set(e) <= set(f)
def e_perp_f(e, f): return vec(e)[normal(f)] == 1
def e_par_f(e, f): return vec(e)[normal(f)] == 0 and not on_face(e, f)

def unit():
    u = DUnit('drill-math-1-space', '空間図形', '空間図形')
    r = rng(6006)
    def edges_q():
        e = r.choice(EDGES); k = r.choice(['par', 'meet', 'skew'])
        f = {'par': par, 'meet': meet, 'skew': skew}[k]
        ans = [x for x in EDGES if f(e, x)]
        word = {'par': '平行な辺', 'meet': '垂直に交わる辺', 'skew': 'ねじれの位置にある辺'}[k]
        u.add(f'直方体ABCD－EFGH（上の面がABCD、Aの真下がE、Bの真下がF、Cの真下がG、Dの真下がH）で、辺{e}と{word}をすべて答えよう（読点で区切る）。', setans(ans),
              f'辺{e}と{word}は ' + '、'.join('辺' + x for x in ans) + '。' + ('平行でなく交わらない辺がねじれの位置にある。' if k == 'skew' else ''), 80 if k != 'skew' else r.choice([80, 92]), '1(1)' if k == 'par' else ('1(2)' if k == 'meet' else '1(3)'), '2直線の位置関係')
    def face_q():
        k = r.random()
        if k < .35:
            e = r.choice(EDGES); ans = [f for f in FACES if e_perp_f(e, f)]
            u.add(f'直方体ABCD－EFGH（上の面がABCD、Aの真下がE、Bの真下がF、Cの真下がG、Dの真下がH）で、辺{e}と垂直な面をすべて答えよう（読点で区切る）。', faceans(ans),
                  f'辺{e}と垂直な面は ' + '、'.join('面' + f for f in ans), 81, '3(1)', '直線と平面の位置関係')
        elif k < .7:
            e = r.choice(EDGES); ans = [f for f in FACES if e_par_f(e, f)]
            u.add(f'直方体ABCD－EFGH（上の面がABCD、Aの真下がE、Bの真下がF、Cの真下がG、Dの真下がH）で、辺{e}と平行な面をすべて答えよう（読点で区切る）。', faceans(ans),
                  f'辺{e}をふくまず、交わらない面は ' + '、'.join('面' + f for f in ans), 81, '3(2)', '直線と平面の位置関係')
        else:
            f = r.choice(FACES); ans = [e for e in EDGES if e_perp_f(e, f)]
            u.add(f'直方体ABCD－EFGH（上の面がABCD、Aの真下がE、Bの真下がF、Cの真下がG、Dの真下がH）で、面{f}に垂直な辺をすべて答えよう（読点で区切る）。', setans(ans),
                  f'面{f}に垂直な辺は ' + '、'.join('辺' + x for x in ans), 81, '3(4)', '直線と平面の位置関係')
    POLY = [('正四面体', '正三角形', 4, 4, 6), ('正六面体', '正方形', 6, 8, 12), ('正八面体', '正三角形', 8, 6, 12), ('正十二面体', '正五角形', 12, 20, 30), ('正二十面体', '正三角形', 20, 12, 30)]
    def poly():
        n, shape, f, v, e = r.choice(POLY); k = r.choice(['面の形', '面の数', '頂点の数', '辺の数'])
        ans = {'面の形': exact_answer([shape]), '面の数': num(f), '頂点の数': num(v), '辺の数': num(e)}[k]
        u.add(f'{n}の{k}を答えよう。', ans, f'{n}：面の形は{shape}、面の数{f}、頂点の数{v}、辺の数{e}。（頂点の数）−（辺の数）＋（面の数）＝2 になっている。', 82, '1', '正多面体')
    ROT = [('長方形', '円柱'), ('直角三角形（直角をはさむ辺の1つを軸にする）', '円錐'), ('半円（直径を軸にする）', '球'), ('直角三角形（斜辺ではなく直角をはさむ辺を軸）', '円錐')]
    def rot():
        k = r.random()
        if k < .4:
            a, b = r.randint(2, 9), r.randint(2, 12)
            u.add(f'縦{b}cm、横{a}cmの長方形を、縦の辺を軸として1回転させてできる立体の体積を求めよう。', expr_answer(pi(a * a * b), units=['cm³', 'cm3']),
                  f'底面の半径{a}cm、高さ{b}cmの円柱ができる。π×{a}²×{b}＝{pid(a * a * b)}（cm³）', 87, '6(1)', '回転体の体積', near=[pi(b * b * a)])
        elif k < .8:
            a, b = r.randint(2, 9), r.randint(3, 12)
            c = F(a * a * b, 3)
            u.add(f'直角をはさむ2辺が{a}cmと{b}cmの直角三角形を、{b}cmの辺を軸として1回転させてできる立体の体積を求めよう。', expr_answer(pi(c), units=['cm³', 'cm3']),
                  f'底面の半径{a}cm、高さ{b}cmの円錐ができる。1/3×π×{a}²×{b}＝{pid(c)}（cm³）', 87, '6(2)', '回転体の体積', near=[pi(a * a * b)])
        else:
            s, name = r.choice(ROT)
            u.add(f'{s}を、1本の直線を軸として1回転させるとどんな立体ができるか。', exact_answer([name]), f'{name}ができる。このような立体を回転体という。', 82, '2', '回転体')
    def prism():
        k = r.random()
        if k < .3:
            S, h = r.randint(10, 60), r.randint(3, 15)
            u.add(f'底面積が{S}cm²、高さが{h}cmの角柱の体積を求めよう。', vol(S * h), f'角柱の体積＝底面積×高さ＝{S}×{h}＝{S * h}（cm³）', 88, '1(1)', '角柱の体積', near=[ans_str(F(S * h, 3))])
        elif k < .6:
            S, h = r.randint(10, 60), r.choice([3, 6, 9, 12, 4, 8])
            u.add(f'底面積が{S}cm²、高さが{h}cmの角錐の体積を求めよう。', vol(F(S * h, 3)), f'角錐の体積＝1/3×底面積×高さ＝1/3×{S}×{h}＝{fx(F(S * h, 3))}（cm³）', 88, '1(2)', '角錐の体積', near=[ans_str(F(S * h))])
        else:
            a, b, h = r.randint(3, 8), r.randint(3, 8), r.randint(4, 12)
            u.add(f'底面が直角をはさむ2辺{a}cm、{b}cmの直角三角形で、高さが{h}cmの三角柱の体積を求めよう。', vol(F(a * b * h, 2)), f'底面積 {a}×{b}÷2＝{fx(F(a * b, 2))}cm²。×{h}＝{fx(F(a * b * h, 2))}（cm³）', 86, '1(1)', '角柱の体積')
    def cyl():
        R, h = r.randint(2, 8), r.randint(3, 12); k = r.random()
        if k < .3:
            u.add(f'底面の半径が{R}cm、高さが{h}cmの円柱の体積を求めよう。', expr_answer(pi(R * R * h), units=['cm³', 'cm3']), f'π×{R}²×{h}＝{pid(R * R * h)}（cm³）', 86, '1(2)', '円柱の体積')
        elif k < .55:
            u.add(f'底面の半径が{R}cm、高さが{h}cmの円柱の側面積を求めよう。', expr_answer(pi(2 * R * h), units=['cm²', 'cm2']), f'側面の展開図は縦{h}cm、横（底面の円周）2π×{R}cmの長方形。{pid(2 * R * h)}（cm²）', 86, '2', '円柱の表面積')
        elif k < .8:
            u.add(f'底面の半径が{R}cm、高さが{h}cmの円柱の表面積を求めよう。', expr_answer(pi(2 * R * R + 2 * R * h), units=['cm²', 'cm2']),
                  f'底面積 π×{R}²×2＝{pid(2 * R * R)}、側面積 2π×{R}×{h}＝{pid(2 * R * h)}。合計 {pid(2 * R * R + 2 * R * h)}（cm²）', 86, '2(2)', '円柱の表面積', near=[pi(R * R + 2 * R * h)])
        else:
            c = F(R * R * h, 3)
            u.add(f'底面の半径が{R}cm、高さが{h}cmの円錐の体積を求めよう。', expr_answer(pi(c), units=['cm³', 'cm3']), f'1/3×π×{R}²×{h}＝{pid(c)}（cm³）', 87, '3(2)', '円錐の体積', near=[pi(R * R * h)])
    def cone():
        R = r.randint(2, 6); L = R * r.choice([2, 3, 4, 5, 6]) if r.random() < .6 else r.randint(R + 1, 15)
        k = r.random(); ang = F(360 * R, L)
        if k < .35:
            u.add(f'底面の半径が{R}cm、母線の長さが{L}cmの円錐の展開図で、側面のおうぎ形の中心角を求めよう。', deg(ang), f'おうぎ形の弧の長さ＝底面の円周。中心角＝360×{R}/{L}＝{fx(ang)}°', r.choice([87, 92]), '5(1)', '円錐の展開図')
        elif k < .7:
            u.add(f'底面の半径が{R}cm、母線の長さが{L}cmの円錐の側面積を求めよう。', expr_answer(pi(R * L), units=['cm²', 'cm2']), f'側面積＝π×母線×半径＝π×{L}×{R}＝{pid(R * L)}（cm²）', 87, 'Guide', '円錐の側面積', near=[pi(L * L)])
        else:
            u.add(f'底面の半径が{R}cm、母線の長さが{L}cmの円錐の表面積を求めよう。', expr_answer(pi(R * R + R * L), units=['cm²', 'cm2']),
                  f'底面積 π×{R}²＝{pid(R * R)}、側面積 π×{L}×{R}＝{pid(R * L)}。合計 {pid(R * R + R * L)}（cm²）', 87, '5(2)', '円錐の表面積', near=[pi(R * L)])
    def cone_rev():
        R = r.randint(2, 6); L = r.choice([x for x in range(R + 1, 16)])
        k = r.random()
        if k < .5:
            S = R * R + R * L
            u.add(f'底面の半径が{R}cm、表面積が{S}πcm²の円錐の母線の長さを求めよう。', cm(L), f'π×{R}² ＋ π×{R}×母線 ＝ {S}π。{R}×母線＝{S - R * R}、母線＝{L}cm', 88, '1(4)', '円錐の母線', near=[ans_str(F(S, R))])
        else:
            ang = r.choice([90, 120, 144, 180, 240, 216]); Lc = r.choice([5, 6, 10, 15, 9, 12])
            Rv = F(ang * Lc, 360)
            u.add(f'円錐の展開図で、側面のおうぎ形の半径が{Lc}cm、中心角が{ang}°のとき、底面の円の半径を求めよう。', cm(Rv), f'弧の長さ 2π×{Lc}×{ang}/360 が底面の円周 2π×r と等しい。r＝{Lc}×{ang}/360＝{fx(Rv)}cm', 89, '3(1)', '円錐の展開図')
    def sphere():
        R = r.choice([2, 3, 4, 5, 6, 9]); k = r.random()
        if k < .35:
            u.add(f'半径{R}cmの球の表面積を求めよう。', expr_answer(pi(4 * R * R), units=['cm²', 'cm2']), f'S＝4πr²＝4π×{R}²＝{pid(4 * R * R)}（cm²）', 87, '4', '球の表面積', near=[pi(F(4 * R ** 3, 3))])
        elif k < .7:
            u.add(f'半径{R}cmの球の体積を求めよう。', expr_answer(pi(F(4 * R ** 3, 3)), units=['cm³', 'cm3']), f'V＝4/3πr³＝4/3π×{R}³＝{pid(F(4 * R ** 3, 3))}（cm³）', 87, '4', '球の体積', near=[pi(4 * R * R)])
        else:
            u.add(f'半径{R}cmの球を、中心を通る平面で切った半球の表面積（切り口もふくむ）を求めよう。', expr_answer(pi(3 * R * R), units=['cm²', 'cm2']), f'曲面 4π×{R}²÷2＝{pid(2 * R * R)}、切り口の円 π×{R}²＝{pid(R * R)}。合計 {pid(3 * R * R)}（cm²）', 88, '2(3)', '半球の表面積', near=[pi(2 * R * R)])
    def pyramid_s():
        a, s = r.choice([(10, 16), (6, 8), (4, 5), (8, 10), (12, 9)])
        u.add(f'底面が1辺{a}cmの正方形で、側面の二等辺三角形の高さが{s}cmの正四角錐の表面積を求めよう。', {'kind': 'number', 'value': str(a * a + 2 * a * s), 'units': ['cm²', 'cm2']},
              f'底面 {a}×{a}＝{a * a}、側面 {a}×{s}÷2×4＝{2 * a * s}。合計 {a * a + 2 * a * s}（cm²）', 88, '2(1)', '角錐の表面積')
    def water():
        k = r.random()
        if k < .5:
            r1, h1 = r.choice([(5, 8), (6, 4), (4, 9), (6, 8)]); r2 = r.choice([x for x in (2, 3, 4, 6, 8, 10) if x != r1 and (r1 * r1 * h1) % (x * x) == 0] or [r1 + 1])
            h2 = F(r1 * r1 * h1, r2 * r2)
            u.add(f'底面の半径が{r1}cmの円柱の容器に{h1}cmの深さまで水を入れた。この水を底面の半径が{r2}cmの円柱の容器に移すと、水の深さは何cmになるか（容器の深さは十分にある）。', cm(h2),
                  f'水の体積は π×{r1}²×{h1}＝{pid(r1 * r1 * h1)}cm³。これを π×{r2}²＝{pid(r2 * r2)} でわって {fx(h2)}cm', 93, '4(1)', '水の深さ')
        else:
            R, s = r.choice([(6, 3), (4, 2), (6, 6), (3, 3), (4, 4)]); h = r.randint(8, 12)
            rise = F(4 * s ** 3, 3 * R * R)
            u.add(f'底面の半径が{R}cmの円柱の容器に{h}cmの深さまで水が入っている。そこに半径{s}cmの球（鉄球）を入れて完全に沈めたとき、水の深さは何cmになるか（容器の深さは十分にある）。', cm(h + rise),
                  f'水面は 球の体積 4/3π×{s}³ ÷ 底面積 π×{R}² ＝ {fx(rise)}cm 上がる。{h}＋{fx(rise)}＝{fx(h + rise)}cm', 93, '4(2)', '水の深さ', near=[ans_str(rise)])
    def cubecut():
        a = r.choice([3, 6, 9, 12]); k = r.random()
        if k < .5:
            u.add(f'1辺{a}cmの立方体ABCD－EFGHを、3点D、E、Gを通る平面で切断した。点Hをふくむ方の立体の体積を求めよう。', vol(F(a ** 3, 6)),
                  f'点Hをふくむ立体は三角錐D－EGH。底面△EGH＝{a}×{a}÷2、高さDH＝{a}。1/3×{fx(F(a * a, 2))}×{a}＝{fx(F(a ** 3, 6))}（cm³）', 91, '3(1)', '立体の切断', near=[ans_str(F(5 * a ** 3, 6))])
        else:
            u.add(f'1辺{a}cmの立方体の各面の対角線の交点（6つ）を頂点とする正八面体の体積を求めよう。', vol(F(a ** 3, 6)),
                  f'正八面体は、底面が対角線{a}cmの正方形（面積{fx(F(a * a, 2))}cm²）、高さ{fx(F(a, 2))}cmの四角錐2つ分。1/3×{fx(F(a * a, 2))}×{fx(F(a, 2))}×2＝{fx(F(a ** 3, 6))}（cm³）', 95, '5', '正八面体の体積')
    def string_cone():
        R = r.choice([2, 3, 4, 5]); L = 6 * R
        u.add(f'底面の半径が{R}cm、母線が{L}cmの円錐がある。底面の円周上の点Aから側面を1周して点Aまで、ひもを最も短くなるようにかける。ひもの長さを求めよう。', cm(L),
              f'側面の展開図の中心角は 360×{R}/{L}＝60°。展開図でひもは直線になり、正三角形の1辺と等しくなるので {L}cm', 93, '6(3)', '最短のひも', near=[pi(2 * R)])
    def compare():
        r0 = r.choice([1, 2, 3, 6])
        u.add(f'半径{r0}cmの半球の形をした容器Aと、底面の半径が{r0}cm、高さが{2 * r0}cmの円柱の形をした容器Bがある。容器Aに水をいっぱいに入れて容器Bに移すとき、容器Aの何杯分で容器Bがいっぱいになるか。', num(3),
              f'容器A：2/3π×{r0}³、容器B：π×{r0}²×{2 * r0}＝2π×{r0}³。2÷2/3＝3杯', 95, '6', '体積の比較')
    def ratio_vol():
        u.add('底面の1辺の長さと高さが等しい正四角錐がある。1辺の長さがこの正四角錐の高さの2倍の立方体の体積は、正四角錐の体積の何倍か。', num(24),
              '正四角錐の1辺と高さを a とすると、体積は 1/3×a²×a＝a³/3。立方体は (2a)³＝8a³。8a³÷(a³/3)＝24倍', 104, '7', '体積の比較')
    fixed = [
        ('空間内で、平行でなく交わらない2つの直線の位置関係を何というか。', exact_answer(['ねじれの位置', 'ねじれ']), 'ねじれの位置にあるという。', 80, 'Guide', '2直線の位置関係', ['平行']),
        ('次のうち、1つの平面に決まるものをすべて選ぼう。\nア 平行な2直線　イ 交わる2直線　ウ ねじれの位置にある2直線　エ 一直線上にない3点', choice_answer('アイエ'), 'ねじれの位置にある2直線は同じ平面上にないので、平面は決まらない。', 80, '2', '平面の決定', ['アイ']),
        ('平面だけで囲まれた立体を何というか。', exact_answer(['多面体', 'ためんたい']), '多面体。どの面も合同な正多角形で、どの頂点にも面が同じ数だけ集まるへこみのない多面体を正多面体という。', 82, '要点1', '用語', ['正多面体']),
        ('1つの平面図形を1つの直線を軸として1回転させてできる立体を何というか。', exact_answer(['回転体', 'かいてんたい']), '回転体。側面をえがく線分を母線という。', 82, '要点2', '用語'),
        ('立体を正面から見た図と真上から見た図を組にして表した図を何というか。', exact_answer(['投影図', 'とうえいず']), '投影図。正面から見た図を立面図、真上から見た図を平面図という。', 82, '要点3', '用語', ['展開図']),
        ('投影図で、立面図が三角形、平面図が円である立体は何か。', exact_answer(['円錐', 'えんすい']), '真上から見て円、正面から見て三角形なのは円錐。', 83, '3', '投影図', ['円柱']),
        ('投影図で、立面図が長方形、平面図が円である立体は何か。', exact_answer(['円柱', 'えんちゅう']), '真上から見て円、正面から見て長方形なのは円柱。', 83, '3', '投影図', ['円錐']),
        ('投影図で、立面図が三角形、平面図が正方形（対角線入り）である立体は何か。', exact_answer(['正四角錐', '四角錐']), '真上から見て正方形、正面から見て三角形なのは正四角錐。', 82, '要点3', '投影図', ['三角柱']),
        ('円柱を、軸をふくむ平面で切ると、切り口はどんな形になるか。', exact_answer(['長方形', 'ちょうほうけい']), '軸をふくむ平面で切ると長方形、軸に垂直な平面で切ると円になる。', 84, '1(1)', '回転体の切り口', ['円']),
        ('円柱を、軸に垂直な平面で切ると、切り口はどんな形になるか。', exact_answer(['円', 'えん']), '軸に垂直な平面で切ると、どこで切っても底面と合同な円になる。', 84, '1(2)', '回転体の切り口', ['長方形']),
        ('次のうち、正しいものを1つ選ぼう。\nア 1つの平面に平行な2つの直線は平行である　イ 1つの平面に垂直な2つの平面は垂直である　ウ 1つの直線に平行な2つの直線は平行である　エ 1つの直線に垂直な2つの平面は垂直である', choice_answer('ウ'),
         'アはねじれの位置や交わることもある。イは平行なこともある。エの2平面は平行になる。', 94, '1', '空間の位置関係', ['ア']),
        ('正四面体ABCDで、辺ABとねじれの位置にある辺を答えよう。', setans(['CD']), '辺ABと交わらず、平行でもないのは辺CD。', 94, '2(1)', 'ねじれの位置'),
        ('三角柱ABC－DEF（Aの真下がD、Bの真下がE、Cの真下がF）で、辺ABとねじれの位置にある辺をすべて答えよう（読点で区切る）。', setans(['CF', 'DF', 'EF']), '辺ABと平行なのはDE。交わるのはBC、CA、AD、BE。残りのCF、DF、EFがねじれの位置。', 94, '2(2)', 'ねじれの位置'),
        ('立方体ABCD－EFGHを、3点A、C、Fを通る平面で切ると、切り口はどんな形になるか。', exact_answer(['正三角形', 'せいさんかくけい']), 'AC、CF、FA はどれも立方体の面の対角線で長さが等しいので、正三角形。', 90, '1(1)', '立体の切断', ['二等辺三角形']),
        ('立方体ABCD－EFGHを、3点A、E、Gを通る平面で切ると、切り口はどんな形になるか。', exact_answer(['長方形', 'ちょうほうけい']), '切り口は A、E、G、C を頂点とする長方形（AE と CG は平行で、AC は面の対角線）。', 90, '1(3)', '立体の切断', ['正方形']),
        ('立方体を1つの平面で切ったとき、切り口として実際にはできないものを1つ選ぼう。\nア 正三角形　イ 長方形　ウ 正五角形　エ 正六角形', choice_answer('ウ'), '立方体の面は平行な3組。切り口の辺は平行な面に平行な組で現れるので、正五角形はできない（五角形はできるが正五角形にはならない）。', 92, '1(3)', '立体の切断', ['エ']),
    ]
    fixed_i = iter(fixed)
    def fixedq():
        it = next(fixed_i, None)
        if it is None: return
        p, a, e, page, nb, tp, *nr = it
        u.add(p, a, e, page, nb, tp, nr[0] if nr else ())
    plan = [edges_q, face_q, poly, rot, prism, cyl, cone, cone_rev, sphere, pyramid_s, water, cubecut, string_cone, fixedq, edges_q, fixedq, compare, ratio_vol]
    fill(u, plan)
    guide = [{'title': '2直線・直線と平面の位置関係', 'body': '2直線は「交わる」「平行」「ねじれの位置（平行でなく交わらない）」の3通り。直線と平面は「交わる」「平行」「平面上にある」。直方体では、辺と面の垂直・平行を見取図で1つずつ確かめる。'},
             {'title': '正多面体と回転体', 'body': '正多面体は5種類（正四・正六・正八・正十二・正二十面体）。長方形を回転→円柱、直角三角形→円錐、半円→球。投影図は立面図（正面）と平面図（真上）で立体を表す。'},
             {'title': '体積の公式', 'body': '角柱・円柱：底面積×高さ。角錐・円錐：1/3×底面積×高さ。球：4/3πr³。例：底面の半径3cm、高さ4cmの円錐は 1/3×π×9×4＝12π cm³'},
             {'title': '表面積と円錐の展開図', 'body': '表面積＝底面積×2＋側面積（柱）、底面積＋側面積（錐）。円錐の側面のおうぎ形は、中心角＝360×（底面の半径）÷（母線）、側面積＝π×母線×底面の半径。球の表面積は 4πr²。'},
             {'title': '切断と水の深さ', 'body': '立方体の切り口は、同じ面上の2点を直線で結び、平行な面には平行な線をひいて求める。容器の水を移す問題は、水の体積が変わらないことを使う（深さ＝体積÷底面積）。'}]
    note = '2026-10-08 Claude作成。数学ドリルp80〜95（19 直線や平面の位置関係・20 立体のいろいろな見方・21 立体の表面積と体積・22 立体の切断、標準問題・実力問題①②）とp104（総仕上げ7）を写真で目視し、数や条件を変えた類題を作った。見取図や展開図は文章で条件を示した。手書きの答えは使っていない。'
    return u, guide, note
