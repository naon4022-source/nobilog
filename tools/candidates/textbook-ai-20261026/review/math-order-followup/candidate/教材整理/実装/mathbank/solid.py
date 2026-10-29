"""6章 空間図形（ワーク p114〜129・教科書 p184〜215 を写真で確認して作成）"""
from common import *
from bank import expr_answer
from geo import pi_txt, pi_answer, deg_answer, len_answer, done, CM, CM2
CM3 = ['cm³', 'cm3']

def set_answer(items):
    """items：['AB', 'CD'] のような名前の並び。答えは順番・向き自由"""
    out = []
    for it in items:
        alts = [it, it[::-1]] if len(it) == 2 else [it[i:] + it[:i] for i in range(len(it))] + [(it[i:] + it[:i])[::-1] for i in range(len(it))]
        out.append(list(dict.fromkeys(alts)))
    return {'kind': 'set', 'items': out}

# ---- 立体のモデル（座標で、辺どうし・辺と面・面どうしの位置関係を計算する） ----
def sub(p, q): return tuple(a - b for a, b in zip(p, q))
def cross(u, v): return (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
def dot(u, v): return sum(a * b for a, b in zip(u, v))
def zero(u): return all(a == 0 for a in u)
class Solid:
    def __init__(self, name, P, edges, faces):
        self.name, self.P, self.edges, self.faces = name, P, edges, faces
    def d(self, e): return sub(self.P[e[1]], self.P[e[0]])
    def normal(self, f): return cross(sub(self.P[f[1]], self.P[f[0]]), sub(self.P[f[2]], self.P[f[0]]))
    def coplanar(self, e1, e2):
        return dot(cross(self.d(e1), self.d(e2)), sub(self.P[e2[0]], self.P[e1[0]])) == 0
    def rel(self, e1, e2):
        if e1 == e2: return 'same'
        if zero(cross(self.d(e1), self.d(e2))): return '平行'
        if self.coplanar(e1, e2): return '交わる'
        return 'ねじれ'
    def line_plane(self, e, f):
        n = self.normal(f)
        if all(dot(n, sub(self.P[v], self.P[f[0]])) == 0 for v in e): return '平面上'
        if zero(cross(self.d(e), n)): return '垂直'
        if dot(self.d(e), n) == 0: return '平行'
        return '交わる'
    def plane_plane(self, f, g):
        n, m = self.normal(f), self.normal(g)
        if zero(cross(n, m)): return '平行' if f != g else 'same'
        if dot(n, m) == 0: return '垂直'
        return '交わる'

def cuboid():
    P = {'A': (0, 1, 1), 'B': (0, 0, 1), 'C': (1, 0, 1), 'D': (1, 1, 1), 'E': (0, 1, 0), 'F': (0, 0, 0), 'G': (1, 0, 0), 'H': (1, 1, 0)}
    E = ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH']
    Fc = ['ABCD', 'EFGH', 'ABFE', 'BCGF', 'CDHG', 'DAEH']
    return Solid('直方体ABCD−EFGH（面ABCDが上の面、面EFGHが下の面で、AとE、BとF、CとG、DとHがそれぞれ辺で結ばれている）', P, E, Fc)
def prism3():
    P = {'A': (0, 0, 1), 'B': (2, 0, 1), 'C': (0, 1, 1), 'D': (0, 0, 0), 'E': (2, 0, 0), 'F': (0, 1, 0)}
    E = ['AB', 'BC', 'CA', 'DE', 'EF', 'FD', 'AD', 'BE', 'CF']
    Fc = ['ABC', 'DEF', 'ABED', 'BCFE', 'CADF']
    return Solid('三角柱ABC−DEF（面ABCが上の底面、面DEFが下の底面で、AとD、BとE、CとFがそれぞれ側面の辺で結ばれている）', P, E, Fc)
def pyramid4():
    P = {'A': (1, 1, 2), 'B': (0, 0, 0), 'C': (2, 0, 0), 'D': (2, 2, 0), 'E': (0, 2, 0)}
    E = ['AB', 'AC', 'AD', 'AE', 'BC', 'CD', 'DE', 'EB']
    return Solid('正四角錐A−BCDE（Aが頂点で、底面は正方形BCDE）', P, E, ['BCDE'])

WORDS = {'交わる': '交わる', '平行': '平行な', 'ねじれ': 'ねじれの位置にある'}

# ---------------- いろいろな立体①（ワーク p114〜115・教科書 p184〜189） ----------------
def s1():
    u = Unit('workbook-math-1-solid1', 'workbook', 'いろいろな立体①', '空間図形',
             '2026-10-05 Claude作成。数学ワークp114〜115（A①立体の名前と面の数・A②展開図・A③正三角錐の展開図・A④投影図・B①投影図・B+②正三角柱と正三角錐を組み合わせた立体）と教科書p184〜189（角柱・角錐・円柱・円錐・多面体・問1・問2・正多面体・投影図・問3〜8）を写真で確認。', tb=184)
    r = rng(1401)
    NUM = {3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八'}
    def t1():
        n = r.randint(3, 8); kind = r.choice(['角柱', '角錐']); what = r.choice(['面', '辺', '頂点'])
        F_, E_, V_ = (n + 2, 3 * n, 2 * n) if kind == '角柱' else (n + 1, 2 * n, n + 1)
        v = {'面': F_, '辺': E_, '頂点': V_}[what]
        why = {('角柱', '面'): f'底面2つと側面 {n} つ', ('角柱', '辺'): f'上の底面 {n} 本・下の底面 {n} 本・側面の辺 {n} 本', ('角柱', '頂点'): f'上の底面 {n} 個と下の底面 {n} 個',
               ('角錐', '面'): f'底面1つと側面 {n} つ', ('角錐', '辺'): f'底面の辺 {n} 本と、頂点から出る辺 {n} 本', ('角錐', '頂点'): f'底面の {n} 個と頂点1個'}[(kind, what)]
        u.add(f'{NUM[n]}{kind}の{what}の数を答えよう。', num_answer(v), f'{why}で、{v}。', 114, 'A①', '角柱と角錐の面・辺・頂点', [str(F_ if what != '面' else E_), str(v + 1), str(v - 1)], tb=184, tbnote='角柱・角錐')
    def t2():
        n = r.randint(3, 8); kind = r.choice(['角柱', '角錐'])
        v = n + 2 if kind == '角柱' else n + 1
        u.add(f'{NUM[n]}{kind}は何面体か答えよう。', exact_answer([f'{v}面体', f'{["", "", "", "", "四", "五", "六", "七", "八", "九", "十"][v]}面体', str(v)]),
              f'いくつかの平面で囲まれた立体を多面体といい、面の数で○面体という。{NUM[n]}{kind}の面は {v} つなので {["", "", "", "", "四", "五", "六", "七", "八", "九", "十"][v]}面体。', 114, 'A①(2)', '多面体', [f'{v - 1}面体', f'{v + 1}面体'], tb=185, tbnote='多面体・問1')
    def t3():
        q = r.randrange(5)
        if q == 0: u.add('次のア〜カのうち、多面体であるものをすべて選び、記号で答えよう。\nア 三角柱　イ 円柱　ウ 四角錐　エ 球　オ 立方体　カ 円錐', choice_answer(['ア', 'ウ', 'オ']), '平面だけで囲まれた立体が多面体。円柱・円錐・球は曲面があるので多面体ではない。正解：ア、ウ、オ', 114, 'A①', '多面体', tb=185, tbnote='多面体')
        elif q == 1: u.add('面の数がもっとも少ない多面体は何面体か答えよう。', exact_answer(['四面体', '4面体']), '3つの面では立体を囲めない。三角錐が四面体で、面の数がもっとも少ない。', 114, 'A①', '多面体', ['三面体'], tb=185, tbnote='問2')
        elif q == 2: u.add('正多面体は何種類あるか答えよう。', {'kind': 'number', 'value': '5', 'units': ['種類']}, '正四面体・正六面体（立方体）・正八面体・正十二面体・正二十面体の5種類しかない。', 114, 'A①', '正多面体', ['6', '4'], tb=185, tbnote='数学ライブラリー 正多面体')
        elif q == 3: u.add('角錐と円錐のように、先がとがった立体の、とがった点を何というか答えよう。', exact_answer(['頂点']), '角錐や円錐の点Aのような、とがった点を頂点という。', 114, 'A①', '角錐・円錐の頂点', ['底面'], tb=184, tbnote='底面・側面・頂点')
        else: u.add('角柱で、2つの底面はどのような関係にあるか。「ア 合同な多角形」「イ 大きさのちがう多角形」から選び、記号で答えよう。', choice_answer(['ア']), '角柱では、2つの底面は合同な多角形で、側面は長方形。', 114, 'A②', '角柱の特徴', tb=187, tbnote='角柱')
    def t4():
        pairs = [('三角形', '長方形', ['三角柱']), ('三角形', '三角形', ['三角錐']), ('四角形', '三角形', ['四角錐']), ('円', '長方形', ['円柱']), ('円', '三角形', ['円錐']), ('円', '円', ['球']), ('長方形', '長方形', ['四角柱', '直方体']), ('長方形', '三角形', ['三角柱']), ('三角形', '四角形', ['四角錐'])]
        a, b, ans = r.choice(pairs)
        u.add(f'立面図が{a}、平面図が{b}で表される立体の名前を答えよう（立面図は真正面から見た図、平面図は真上から見た図）。', exact_answer(ans),
              f'真上から見た形（平面図）で底面がわかり、真正面から見た形（立面図）で柱か錐かがわかる。答え {ans[0]}', 115, 'A④', '投影図', tb=188, tbnote='投影図・問3・問8')
    def t5():
        k = r.randrange(3)
        if k == 0: u.add('立体を真正面から見た図と真上から見た図を組にして表したものを何というか答えよう。', exact_answer(['投影図']), '真正面から見た図を立面図、真上から見た図を平面図といい、2つをあわせて投影図という。', 115, 'A④', '投影図', ['立面図', '平面図'], tb=188, tbnote='投影図')
        elif k == 1: u.add('投影図で、実際には見えない辺はどのような線で表すか。「ア 実線」「イ 破線」から選び、記号で答えよう。', choice_answer(['イ']), '見えない辺は破線で表す。', 115, 'A④', '投影図の約束', tb=189, tbnote='注意')
        else: u.add('立体を真上から見た図を何というか答えよう。', exact_answer(['平面図']), '真上から見た図が平面図、真正面から見た図が立面図。', 115, 'A④', '投影図', ['立面図'], tb=188, tbnote='立面図・平面図')
    def t6():
        k = r.randrange(3)
        if k == 0: u.add('底面が合同な正三角柱と正三角錐を、底面どうしをぴったり重ねて組み合わせた立体がある。この立体は何面体か答えよう。', exact_answer(['七面体', '7面体', '7']), '重ねた底面は外から見えなくなる。正三角柱の面5−1＝4、正三角錐の面4−1＝3で、4＋3＝7。七面体。', 115, 'B+②(1)', '組み合わせた立体と多面体', ['九面体', '9面体', '8面体', '八面体'], tb=185, tbnote='多面体')
        elif k == 1: u.add('底面が合同な正三角柱と正三角錐を、底面どうしをぴったり重ねて組み合わせた立体がある。この立体の辺の数を答えよう。', num_answer(12), '正三角柱の辺9本に、正三角錐の側面の辺3本が加わる（重ねた底面の辺は共通）。9＋3＝12（本）', 115, 'B+②', '組み合わせた立体', ['15', '9'], tb=185, tbnote='多面体')
        else:
            n = r.randint(3, 6)
            u.add(f'正{NUM[n]}角柱と、底面が合同な正{NUM[n]}角錐を、底面どうしをぴったり重ねて組み合わせた立体は何面体か答えよう。', exact_answer([f'{2 * n + 1}面体', str(2 * n + 1)]), f'角柱の面 {n + 2}−1、角錐の面 {n + 1}−1。合わせて {2 * n + 1}。', 115, 'B+②(1)', '組み合わせた立体と多面体', [f'{2 * n + 3}面体'], tb=185, tbnote='多面体')
    def t7():
        k = r.randrange(3)
        if k == 0: u.add('正三角錐の展開図は、正三角形4つでできている。この展開図を組み立てるとき、1つの頂点に集まる面の数を答えよう。', num_answer(3), '正三角錐（正四面体）は、どの頂点にも3つの面が集まる。', 114, 'A③', '展開図と頂点', ['4', '2'], tb=185, tbnote='正多面体')
        elif k == 1: u.add('立方体（正六面体）で、1つの頂点に集まる面の数と辺の数を足すといくつか答えよう。', num_answer(6), '立方体の1つの頂点には、面が3つ、辺が3本集まる。3＋3＝6', 114, 'A①', '正多面体', ['5', '4'], tb=185, tbnote='正多面体')
        else: u.add('正四角錐の側面は、どのような三角形か。「ア 正三角形」「イ 合同な二等辺三角形」「ウ 直角三角形」から選び、記号で答えよう（側面がすべて合同な二等辺三角形である角錐を正角錐という）。', choice_answer(['イ']), '正角錐は、底面が正多角形で、側面がすべて合同な二等辺三角形。', 115, 'A④', '正角錐', tb=189, tbnote='正三角錐・正四角錐')
    plan = [t1] * 18 + [t2] * 10 + [t3] * 6 + [t4] * 14 + [t5] * 4 + [t6] * 8 + [t7] * 6
    return done(fill(u, plan))

# ---------------- いろいろな立体②（ワーク p116〜117・教科書 p189〜191） ----------------
def s2():
    u = Unit('workbook-math-1-solid2', 'workbook', 'いろいろな立体②', '空間図形',
             '2026-10-05 Claude作成。数学ワークp116〜117（A①円柱の展開図・A②円錐の展開図・A③④円柱と円錐の投影図・B①・B+②円錐の展開図の中心角）と教科書p189〜191（円柱・円錐の見取図と展開図・問9〜11・話しあおう）を写真で確認。答えは π を使う。', tb=190)
    r = rng(1411)
    def t1():
        rr, h = r.randint(2, 9), r.randint(3, 15)
        k = r.randrange(3)
        if k == 0: u.add(f'底面の半径が {rr}cm、高さが {h}cm の円柱の展開図で、側面の長方形の横の長さ（底面の円周と重なる辺）を求めよう（π を使って答える）。', pi_answer(2 * rr, CM), f'側面の長方形の横の長さは、底面の円周の長さと等しい。2π×{rr}＝{pi_txt(2 * rr)}（cm）', 116, 'A①(3)', '円柱の展開図', [pi_txt(rr), pi_txt(rr * rr)], tb=190, tbnote='問9')
        elif k == 1: u.add(f'底面の半径が {rr}cm、高さが {h}cm の円柱の展開図で、側面の長方形の縦の長さを求めよう。', len_answer(h), f'側面の長方形の縦の長さは、円柱の高さと等しい。{h}cm', 116, 'A①(3)', '円柱の展開図', [str(rr)], tb=190, tbnote='問9')
        else: u.add('円柱の側面の展開図はどんな図形か、名前を答えよう。', exact_answer(['長方形']), '円柱の側面は曲面で、展開すると長方形になる。', 116, 'A①(2)', '円柱の展開図', ['おうぎ形'], tb=189, tbnote='円柱の展開図')
    def t2():
        rr, l = r.choice([(3, 10), (2, 6), (4, 6), (3, 9), (5, 8), (2, 5), (4, 12), (1, 6), (6, 9), (5, 15)])
        k = r.randrange(3)
        if k == 0: u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の展開図で、側面のおうぎ形の弧の長さを求めよう（π を使って答える）。', pi_answer(2 * rr, CM), f'側面のおうぎ形の弧の長さは、底面の円周と等しい。2π×{rr}＝{pi_txt(2 * rr)}（cm）', 116, 'A②(3)', '円錐の展開図', [pi_txt(2 * l)], tb=191, tbnote='問10')
        elif k == 1: u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の展開図で、側面のおうぎ形の中心角の大きさを求めよう。', deg_answer(F(360 * rr, l)),
                       f'おうぎ形の半径は母線 {l}cm。中心角を x° とすると、弧の長さ 2π×{rr} は、半径 {l}cm の円周 2π×{l} の x/360 倍。x＝360×{rr}/{l}＝{fmt_num(F(360 * rr, l))}', 117, 'B+②(2)', '円錐の展開図の中心角', [ans_str(F(360 * l, rr)), str(360 - F(360 * rr, l))], tb=191, tbnote='円錐の展開図')
        else: u.add('円錐の側面の展開図はどんな図形か、名前を答えよう。', exact_answer(['おうぎ形', '扇形']), '円錐の側面は曲面で、展開するとおうぎ形になる。', 116, 'A②(1)', '円錐の展開図', ['長方形', '円'], tb=191, tbnote='円錐の展開図')
    def t3():
        a = r.choice([60, 90, 120, 144, 150, 180, 216, 240, 270])
        l = r.choice([6, 10, 12, 15, 20, 30]); rr = F(a * l, 360)
        if rr.denominator != 1: return
        u.add(f'円錐の展開図で、側面のおうぎ形は半径 {l}cm、中心角 {a}° である。この円錐の底面の円の半径を求めよう。', len_answer(rr),
              f'弧の長さ 2π×{l}×{a}/360＝{pi_txt(2 * rr)} が底面の円周 2π×（半径）と等しいので、半径は {fmt_num(rr)}cm', 117, 'B+②', '円錐の展開図', [str(F(a * l, 180))], tb=191, tbnote='円錐の展開図')
    def t4():
        sets = [(['三角柱', '円柱', '四角錐'], '立面図が四角形', ['三角柱', '円柱']), (['三角柱', '三角錐', '四角錐', '円柱', '円錐'], '平面図が四角形', ['四角錐']),
                (['円柱', '円錐', '球', '三角錐'], '平面図が円', ['円柱', '円錐', '球']), (['三角柱', '三角錐', '四角錐', '円柱', '円錐'], '立面図が三角形', ['三角錐', '四角錐', '円錐'])]
        opts, cond, ans = r.choice(sets)
        letters = [LETTERS[i] for i in range(len(opts))]
        ok = [letters[i] for i, o in enumerate(opts) if o in ans]
        u.add(f'次の立体を、底面を下にして置いて投影図をかく。{cond}になる立体をすべて選び、記号で答えよう。\n' + '　'.join(f'{letters[i]} {o}' for i, o in enumerate(opts)), choice_answer(ok),
              '柱は立面図が長方形（四角形）、錐は立面図が三角形。平面図は底面の形（錐は底面の形の中に頂点に集まる線が見える）。正解：' + '、'.join(ok), 117, 'B①', '円柱・円錐の投影図', tb=191, tbnote='問11')
    def t5():
        d = r.randint(2, 8)
        u.add(f'底面の直径と高さがどちらも {d}cm の円柱を投影図で表す。立面図はどんな図形になるか。名前を答えよう。', exact_answer(['正方形']), f'立面図は、横の長さが直径 {d}cm、縦の長さが高さ {d}cm の四角形で、正方形になる。', 117, 'A④', '円柱の投影図', ['長方形', '円'], tb=191, tbnote='話しあおう')
    def t6():
        rr, h = r.randint(2, 6), r.randint(3, 12)
        u.add(f'底面の半径が {rr}cm、高さが {h}cm の円柱を、底面を下にして置いたとき、平面図の円の直径を求めよう。', len_answer(2 * rr), f'平面図は底面の円と同じで、直径は {2 * rr}cm', 117, 'A③', '円柱の投影図', [str(rr)], tb=191, tbnote='問11')
    plan = [t1] * 15 + [t2] * 18 + [t3] * 12 + [t4] * 10 + [t5] * 6 + [t6] * 9
    return done(fill(u, plan))

# ---------------- 空間内の平面と直線（ワーク p118〜119・教科書 p194〜197） ----------------
def s3():
    u = Unit('workbook-math-1-spaceline', 'workbook', '空間内の平面と直線', '空間図形',
             '2026-10-05 Claude作成。数学ワークp118〜119（A①2直線の位置関係・A②直線と平面の位置関係・A③2平面の位置関係・B①三角錐の高さ・B②展開図と位置関係・B+③ねじれの位置）と教科書p194〜197（2直線の位置関係・ねじれの位置・問1・問2・直線と平面・垂直・点と平面との距離・問3・問4）を写真で確認。立体は文章で示し、関係は座標で計算して確かめた。', tb=195)
    r = rng(1421)
    models = [cuboid(), prism3(), pyramid4()]
    def t1():
        S = r.choice(models[:2] + [models[2]])
        e = r.choice(S.edges); want = r.choice(['交わる', '平行', 'ねじれ'])
        ans = [x for x in S.edges if S.rel(e, x) == want]
        if not ans: return
        u.add(f'{S.name}で、辺を直線とみる。直線{e}と{WORDS[want]}直線をすべて答えよう。', set_answer(ans),
              f'同じ平面上にあって交わるもの、同じ平面上にあって交わらないもの（平行）、同じ平面上にないもの（ねじれの位置）に分ける。答え {"、".join(ans)}', 118, 'A①' if S is not models[2] else 'A①', '2直線の位置関係', tb=195, tbnote='問2' if S is models[2] else '2直線の位置関係')
    def t2():
        S = models[0]; e = r.choice(S.edges)
        n = sum(1 for x in S.edges if S.rel(e, x) == 'ねじれ')
        u.add(f'{S.name}で、辺を直線とみる。直線{e}とねじれの位置にある辺は全部で何本あるか答えよう。', {'kind': 'number', 'value': str(n), 'units': ['本']},
              f'交わる辺（{sum(1 for x in S.edges if S.rel(e, x) == "交わる")}本）と平行な辺（{sum(1 for x in S.edges if S.rel(e, x) == "平行")}本）をのぞいた残りがねじれの位置。12−1−{12 - 1 - n}＝{n}（本）', 118, 'A①(3)', 'ねじれの位置', ['8', '3'], tb=195, tbnote='ねじれの位置')
    def t3():
        S = r.choice(models[:2]); f = r.choice(S.faces if S is models[0] else ['ABC', 'DEF']); want = r.choice(['平面上', '垂直', '平行'])
        ans = [x for x in S.edges if S.line_plane(x, f) == want]
        if not ans: return
        w = {'平面上': f'平面{f}上にある', '垂直': f'平面{f}と垂直に交わる', '平行': f'平面{f}と平行な'}[want]
        u.add(f'{S.name}で、辺を直線、面を平面とみる。{w}直線をすべて答えよう。', set_answer(ans),
              f'直線と平面の位置関係は「平面上にある」「交わる」「平行である」の3つ。垂直は、交わる点を通る平面上のすべての直線と垂直なとき。答え {"、".join(ans)}', 118, 'A②', '直線と平面の位置関係', tb=196, tbnote='問3')
    def t4():
        S = r.choice(models[:2]); f = r.choice(S.faces if S is models[0] else ['ABC', 'DEF']); want = r.choice(['平行', '垂直'])
        ans = [g for g in S.faces if g != f and S.plane_plane(f, g) == want]
        if not ans: return
        u.add(f'{S.name}で、面を平面とみる。平面{f}と{"平行な" if want == "平行" else "垂直な"}平面をすべて答えよう。', set_answer(ans),
              f'2平面の位置関係は「交わる」「平行である」の2つ。平面Pに垂直な直線をふくむ平面は、Pと垂直。答え {"、".join(ans)}', 119, 'A③', '2平面の位置関係', tb=196, tbnote='直線と平面の位置関係・垂直')
    def t5():
        S = models[0]; e = r.choice(S.edges)
        ans = [f for f in S.faces if S.line_plane(e, f) == '平面上']
        u.add(f'{S.name}で、直線{e}をふくむ平面をすべて答えよう。', set_answer(ans), f'直線{e}は2つの面の境目の辺なので、2つの平面にふくまれる。答え {"、".join(ans)}', 118, 'A②(4)', '直線をふくむ平面', tb=196, tbnote='直線は平面上にある')
    def t6():
        a, b, c = r.randint(2, 9), r.randint(2, 9), r.randint(2, 9)
        k = r.randrange(2)
        if k == 0:
            u.add(f'直方体の頂点Aに集まる3本の辺の長さが AB＝{a}cm、AD＝{b}cm、AE＝{c}cm である。この直方体から、3点B、D、Eを通る平面で切り取った三角錐A−BDEについて、面ABDを底面としたときの高さを求めよう。', len_answer(c),
                  f'AEは、面ABDをふくむ平面（直方体の上の面）と垂直なので、高さはAEの長さ {c}cm', 119, 'B①(1)', '三角錐の高さ・点と平面との距離', [str(a), str(b)], tb=197, tbnote='問4')
        else:
            V = F(a * b * c, 6)
            u.add(f'直方体の頂点Aに集まる3本の辺の長さが AB＝{a}cm、AD＝{b}cm、AE＝{c}cm である。この直方体から切り取った三角錐A−BDEの体積を求めよう。', len_answer(V, 'cm³'),
                  f'面ABDを底面とすると、底面積は {a}×{b}÷2、高さは AE＝{c}。体積は ({a}×{b}÷2)×{c}÷3＝{fmt_num(V, "dec")}（cm³）', 119, 'B①', '三角錐の高さと体積', [ans_str(F(a * b * c, 2)), ans_str(F(a * b * c, 3))], tb=197, tbnote='問4')
    def t7():
        q = r.randrange(3)
        if q == 0: u.add('空間内の2直線が、平行でなく、交わらないとき、2直線はどのような位置にあるというか答えよう。', exact_answer(['ねじれの位置', 'ねじれ']), '空間内の2直線の位置関係は「交わる」「平行である」「ねじれの位置にある」の3つ。ねじれの位置にある2直線は同じ平面上にない。', 118, 'A①', 'ねじれの位置', ['平行'], tb=195, tbnote='ねじれの位置')
        elif q == 1: u.add('点Aから平面Pに垂線をひき、平面Pとの交点をHとする。線分AHの長さを何というか。「点Aと平面Pとの○○」の○○にあてはまることばを答えよう。', exact_answer(['距離']), '線分AHは、点Aと平面P上の点を結ぶ線分のうちでもっとも短い。その長さを点Aと平面Pとの距離という。', 119, 'B①', '点と平面との距離', ['高さ'], tb=197, tbnote='点と平面との距離')
        else: u.add('三脚のように脚が3本だと、カメラを支えるとぐらつかない。これは、同じ直線上にない3点をふくむ平面が、いくつに決まるからか。数で答えよう。', num_answer(1), '同じ直線上にない3点をふくむ平面はただ1つに決まる。だから3本の脚の先は必ず1つの平面（床）にのる。', 118, 'A②', '平面が1つに決まる条件', ['3', '2'], tb=194, tbnote='説明しよう')
    plan = [t1] * 20 + [t2] * 6 + [t3] * 16 + [t4] * 10 + [t5] * 6 + [t6] * 8 + [t7] * 4
    return done(fill(u, plan))

# ---------------- 立体の構成（ワーク p120〜121・教科書 p200〜201） ----------------
def s4():
    u = Unit('workbook-math-1-solidmake', 'workbook', '立体の構成', '空間図形',
             '2026-10-05 Claude作成。数学ワークp120〜121（A①②面を平行に動かしてできる立体・A③④面を回転させてできる立体・A⑤⑥線を動かしてできる立体・B①・B+②プリン）と教科書p200〜201（面を平行に動かしてできる立体・問1・回転体・回転の軸・問2・問3・線を動かしてできる立体・母線）を写真で確認。', tb=200)
    r = rng(1431)
    def t1():
        shapes = [('円', '円柱'), ('三角形', '三角柱'), ('四角形', '四角柱'), ('五角形', '五角柱'), ('正方形', '四角柱（正四角柱）'), ('六角形', '六角柱')]
        a, b = r.choice(shapes)
        acc = [b.split('（')[0]] + (['正四角柱', '直方体', '立方体'] if '正四角柱' in b else [])
        u.add(f'{a}を、その面に垂直な方向に一定の距離だけ平行に動かしてできる立体の名前を答えよう。', exact_answer(acc), f'角柱や円柱は、底面の多角形や円を、その面に垂直な方向に平行に動かしてできる立体とみることができる。答え {b}', 120, 'A①', '面を平行に動かしてできる立体', tb=200, tbnote='面を平行に動かしてできる立体')
    def t2():
        h = r.randint(3, 12); n = r.choice(['三角形', '五角形', '六角形', '円'])
        nm = {'三角形': '三角柱', '五角形': '五角柱', '六角形': '六角柱', '円': '円柱'}[n]
        u.add(f'高さ {h}cm の{nm}は、{n}を、その面に垂直な方向に何 cm 動かしてできる立体とみることができるか答えよう。', len_answer(h), f'動かした距離が立体の高さになる。{h}cm', 120, 'A②', '面を平行に動かしてできる立体', tb=200, tbnote='問1')
    def t3():
        shapes = [('長方形', '円柱'), ('直角三角形（直角をはさむ辺の1つを軸にする）', '円錐'), ('半円（直径を軸にする）', '球'), ('円を4等分したおうぎ形（半径の1つを軸にする）', '半球'),
                  ('長方形と直角三角形をつないだ図形（長方形の辺を軸にする）', '円柱と円錐を組み合わせた立体'), ('直角をもつ台形（直角をはさむ高さの辺を軸にする）', '円錐の先を切り取った立体')]
        a, b = r.choice(shapes)
        acc = [b] + (['円錐台'] if '切り取った' in b else []) + (['円錐と円柱', '円柱と円錐'] if '組み合わせ' in b else [])
        u.add(f'{a}を、直線ℓを回転の軸として1回転させてできる立体の名前を答えよう。', exact_answer(acc), f'平面図形を、その平面上の直線のまわりに1回転させてできる立体を回転体という。答え {b}', 120, 'A③', '回転体', tb=201, tbnote='回転体・問2')
    def t4():
        k = r.randrange(4)
        if k == 0: u.add('円錐を、回転の軸に垂直な平面で切ると、切り口はどんな図形になるか、名前を答えよう。', exact_answer(['円']), '回転体を回転の軸に垂直な平面で切ると、切り口はいつも円になる。', 120, 'A④(1)', '回転体の切り口', ['二等辺三角形'], tb=201, tbnote='問3')
        elif k == 1: u.add('円錐を、回転の軸をふくむ平面で切ると、切り口はどんな図形になるか、名前を答えよう。', exact_answer(['二等辺三角形']), '回転の軸をふくむ平面で切ると、切り口は回転させたもとの図形を線対称に2つ合わせた形。円錐ではもとの直角三角形を2つ合わせた二等辺三角形。', 120, 'A④(2)', '回転体の切り口', ['円', '直角三角形', '正三角形'], tb=201, tbnote='問3')
        elif k == 2: u.add('円柱を、回転の軸をふくむ平面で切ると、切り口はどんな図形になるか、名前を答えよう。', exact_answer(['長方形']), '回転の軸をふくむ平面で切ると、もとの長方形を2つ合わせた長方形になる。', 120, 'A④', '回転体の切り口', ['円'], tb=201, tbnote='問3')
        else: u.add('球をどんな平面で切っても、切り口はどんな図形になるか、名前を答えよう。', exact_answer(['円']), '球はどの方向から見ても回転体なので、切り口はいつも円になる。', 120, 'A④', '回転体の切り口', tb=201, tbnote='回転体')
    def t5():
        k = r.randrange(3)
        if k == 0: u.add('円柱や円錐の側面をつくる線分（線分ABを円の周にそってまわすときの線分AB）を、その立体の何というか答えよう。', exact_answer(['母線']), '円柱や円錐の側面をえがく線分を母線という。', 121, 'A⑤', '母線', ['高さ', '半径'], tb=201, tbnote='線を動かしてできる立体')
        elif k == 1: u.add('線分ABを、四角形に垂直に立てたまま、その周にそって1まわりさせると、線分ABが動いたあとにできる図形は、どんな立体の側面か答えよう。', exact_answer(['四角柱']), '多角形の周にそって垂直に立てた線分を動かすと角柱の側面、円の周にそって動かすと円柱の側面になる。', 121, 'A⑤', '線を動かしてできる立体', ['四角錐'], tb=201, tbnote='線を動かしてできる立体')
        else: u.add('円の中心の真上に固定した点Oと円周上の点Pを結ぶ線分OPをひき、点Pを円周にそって1まわりさせる。線分OPが動いたあとにできる面と円で囲まれた立体の名前を答えよう。', exact_answer(['円錐']), '線分OPは円錐の側面をえがき、OPはその円錐の母線になる。', 121, 'A⑥(1)', '線を動かしてできる立体', ['円柱'], tb=201, tbnote='線を動かしてできる立体')
    def t6():
        opts = ['球', '三角柱', '五角錐', '円柱', '円錐', '立方体']
        want = r.choice(['平行に動かして', '回転させて'])
        ok = [LETTERS[i] for i, o in enumerate(opts) if (o in ('三角柱', '円柱', '立方体')) == (want == '平行に動かして')] if want == '平行に動かして' else [LETTERS[i] for i, o in enumerate(opts) if o in ('球', '円柱', '円錐')]
        u.add(f'次のア〜カの立体のうち、平面図形を{"その面に垂直な方向に一定の距離だけ平行に動かして" if want == "平行に動かして" else "その平面上の直線のまわりに1回転させて"}できる立体とみることができるものをすべて選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer(ok),
              '柱体（角柱・円柱）は平行移動、円柱・円錐・球は回転体。円柱はどちらともみられる。正解：' + '、'.join(ok), 121, 'B①', '面を動かしてできる立体', tb=200, tbnote='立体の構成')
    def t7():
        k = r.randrange(2)
        if k == 0: u.add('プリン、電車、はさみ、トランプ、トイレットペーパー、跳び箱のうち、回転体とみることができるものを2つ答えよう（読点で区切る）。', {'kind': 'set', 'items': [['プリン'], ['トイレットペーパー']]}, '回転体は、回転の軸に垂直な平面で切ると切り口が円になる。プリンとトイレットペーパー。', 121, 'B+②(1)', '回転体', tb=201, tbnote='回転体')
        else: u.add('プリンは、どのような図形を1回転させてできた立体とみることができるか。図形の名前を答えよう（上の面と下の面が平行で、横から見ると上がせまい形）。', exact_answer(['台形']), 'プリンは円錐の先を切り取った形で、直角をもつ台形を、直角をはさむ辺を軸として1回転させてできる。', 121, 'B+②(2)', '回転体', ['長方形', '三角形'], tb=201, tbnote='回転体')
    def t8():
        a, b = r.sample(range(2, 13), 2); ax = r.choice(['縦', '横']); ask = r.choice(['底面の円の半径', '高さ'])
        h, rr = (a, b) if ax == '縦' else (b, a)
        v = rr if ask == '底面の円の半径' else h
        u.add(f'縦 {a}cm、横 {b}cm の長方形を、{ax}の辺を回転の軸として1回転させると円柱ができる。この円柱の{ask}を求めよう。', len_answer(v), f'回転の軸になる辺の長さが高さ（{h}cm）、軸と垂直な辺の長さが底面の円の半径（{rr}cm）になる。答え {v}cm', 120, 'A③', '回転体の大きさ', [str(h if v == rr else rr), str(2 * v)], tb=201, tbnote='回転体')
    def t9():
        a, b = r.sample(range(2, 13), 2); ask = r.choice(['底面の円の半径', '高さ'])
        v = b if ask == '底面の円の半径' else a
        u.add(f'∠C＝90° の直角三角形ABCで、AC＝{a}cm、BC＝{b}cm である。辺ACを回転の軸として1回転させてできる円錐の{ask}を求めよう。', len_answer(v), f'できる円錐は、高さが AC＝{a}cm、底面の円の半径が BC＝{b}cm。答え {v}cm', 120, 'A③', '回転体の大きさ', [str(a if v == b else b)], tb=201, tbnote='回転体・話しあおう')
    def t10():
        n = r.randint(3, 8); h = r.randint(2, 9)
        nm = {3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八'}[n]
        u.add(f'{nm}角形を、その面に垂直な方向に {h}cm だけ平行に動かしてできる立体の面の数を答えよう。', num_answer(n + 2), f'{nm}角柱ができる。面は底面2つと側面 {n} つで {n + 2}。', 120, 'A①', '面を平行に動かしてできる立体', [str(n + 1), str(n)], tb=200, tbnote='問1')
    plan = [t1] * 8 + [t2] * 6 + [t3] * 8 + [t4] * 6 + [t5] * 6 + [t6] * 8 + [t7] * 6 + [t8] * 12 + [t9] * 12 + [t10] * 8
    return done(fill(u, plan))

# ---------------- 立体の体積（ワーク p122〜123・教科書 p204〜207） ----------------
def s5():
    u = Unit('workbook-math-1-volume', 'workbook', '立体の体積', '空間図形',
             '2026-10-05 Claude作成。数学ワークp122〜123（A①角柱・円柱の体積・A②角錐・円錐の体積・A③④球の体積・B①四角柱・B②直角三角形を回転させてできる立体・B+③鉄球と水）と教科書p204〜207（V＝Sh・V＝πr²h・V＝Sh/3・V＝πr²h/3・問1・問2・話しあおう・V＝4πr³/3・例1・問3・練習問題1・2）を写真で確認。答えは π を使う。', tb=204)
    r = rng(1441)
    def t1():
        k = r.randrange(4)
        if k == 0:
            a, b, h = r.randint(2, 9), r.randint(2, 9), r.randint(2, 12); V = F(a * b * h, 2)
            u.add(f'底面が、直角をはさむ2辺が {a}cm と {b}cm の直角三角形で、高さが {h}cm の三角柱の体積を求めよう。', len_answer(V, 'cm³'), f'V＝Sh。底面積は {a}×{b}÷2＝{fmt_num(F(a * b, 2), "dec")}。体積は {fmt_num(F(a * b, 2), "dec")}×{h}＝{fmt_num(V, "dec")}（cm³）', 122, 'A①(1)', '角柱の体積', [str(a * b * h), ans_str(F(a * b * h, 6))], tb=204, tbnote='問1(1)')
        elif k == 1:
            a, b, c = r.randint(2, 9), r.randint(2, 9), r.randint(2, 9)
            u.add(f'縦 {a}cm、横 {b}cm、高さ {c}cm の直方体の体積を求めよう。', len_answer(a * b * c, 'cm³'), f'{a}×{b}×{c}＝{a * b * c}（cm³）', 122, 'A①(2)', '角柱の体積', [str(2 * (a * b + b * c + c * a))], tb=204, tbnote='角柱の体積')
        elif k == 2:
            rr, h = r.randint(2, 9), r.randint(2, 12)
            u.add(f'底面の半径が {rr}cm、高さが {h}cm の円柱の体積を求めよう（π を使って答える）。', pi_answer(rr * rr * h, CM3), f'V＝πr²h＝π×{rr}²×{h}＝{pi_txt(rr * rr * h)}（cm³）', 122, 'A①(3)', '円柱の体積', [pi_txt(2 * rr * h), pi_txt(F(rr * rr * h, 3))], tb=204, tbnote='問1(3)')
        else:
            p, q, h = r.randint(3, 9), r.randint(3, 9), r.randint(3, 10); d1, d2 = p, q
            V = F(d1 * d2, 2) * h
            u.add(f'底面が、対角線の長さが {d1}cm と {d2}cm のひし形で、高さが {h}cm の四角柱の体積を求めよう。', len_answer(V, 'cm³'), f'底面のひし形の面積は {d1}×{d2}÷2＝{fmt_num(F(d1 * d2, 2), "dec")}。体積は {fmt_num(F(d1 * d2, 2), "dec")}×{h}＝{fmt_num(V, "dec")}（cm³）', 123, 'B①', '角柱の体積（底面を分けて考える）', [str(d1 * d2 * h)], tb=204, tbnote='問1(2)')
    def t2():
        k = r.randrange(3)
        if k == 0:
            a, h = r.randint(2, 9), r.randint(3, 15); V = F(a * a * h, 3)
            u.add(f'底面が1辺 {a}cm の正方形で、高さが {h}cm の正四角錐の体積を求めよう。', len_answer(V, 'cm³'), f'V＝Sh/3。{a}×{a}×{h}÷3＝{fmt_num(V, "dec")}（cm³）', 122, 'A②(1)', '角錐の体積', [str(a * a * h)], tb=206, tbnote='問2(1)')
        elif k == 1:
            rr, h = r.randint(2, 9), r.choice([3, 6, 9, 12, 15, 4, 5]); V = F(rr * rr * h, 3)
            u.add(f'底面の半径が {rr}cm、高さが {h}cm の円錐の体積を求めよう（π を使って答える）。', pi_answer(V, CM3), f'V＝πr²h/3＝π×{rr}²×{h}÷3＝{pi_txt(V)}（cm³）', 122, 'A②(3)', '円錐の体積', [pi_txt(rr * rr * h)], tb=206, tbnote='問2(2)')
        else:
            a, b, h = r.randint(2, 9), r.randint(2, 9), r.randint(2, 12); V = F(a * b * h, 6)
            u.add(f'底面が、直角をはさむ2辺が {a}cm と {b}cm の直角三角形で、高さが {h}cm の三角錐の体積を求めよう。', len_answer(V, 'cm³'), f'底面積は {a}×{b}÷2。体積は {a}×{b}÷2×{h}÷3＝{fmt_num(V, "dec")}（cm³）', 122, 'A②(2)', '角錐の体積', [ans_str(F(a * b * h, 2))], tb=206, tbnote='角錐の体積')
    def t3():
        rr = r.randint(1, 12); dia = r.random() < .4; half = r.random() < .3
        V = F(4 * rr ** 3, 3) / (2 if half else 1)
        given = f'直径 {2 * rr}cm' if dia else f'半径 {rr}cm'
        u.add(f'{given}の{"半球" if half else "球"}の体積を求めよう（π を使って答える）。', pi_answer(V, CM3), f'{"直径の半分で半径 " + str(rr) + "cm。" if dia else ""}V＝4πr³/3＝4π×{rr}³÷3＝{pi_txt(F(4 * rr ** 3, 3))}{"。半球はその半分で " + pi_txt(V) if half else ""}（cm³）', 123, 'A④' if half else 'A③', '球の体積', [pi_txt(4 * rr * rr), pi_txt(F(4 * rr ** 3, 3) * (1 if half else 2))], tb=207, tbnote='例1・問3')
    def t4():
        a, b = r.randint(2, 9), r.randint(2, 9)
        axis = r.choice(['a', 'b'])
        h, rr = (a, b) if axis == 'a' else (b, a)
        V = F(rr * rr * h, 3)
        u.add(f'直角をはさむ2辺の長さが {a}cm（辺AB）と {b}cm（辺AC）の直角三角形ABC（∠A＝90°）を、辺{"AB" if axis == "a" else "AC"}を回転の軸として1回転させてできる立体の体積を求めよう（π を使って答える）。', pi_answer(V, CM3),
              f'できる立体は、底面の半径 {rr}cm、高さ {h}cm の円錐。π×{rr}²×{h}÷3＝{pi_txt(V)}（cm³）', 123, 'B②', '回転体の体積', [pi_txt(F(h * h * rr, 3)), pi_txt(rr * rr * h)], tb=206, tbnote='話しあおう')
    def t5():
        R, H, w, b = r.choice([(4, 12, 10, 3), (5, 10, 8, 3), (6, 10, 9, 3), (4, 10, 8, 2), (5, 12, 10, 4), (3, 10, 8, 2)])
        room = R * R * (H - w); ball = F(4 * b ** 3, 3)
        over = ball > room
        u.add(f'底面の半径が {R}cm、高さが {H}cm の円柱の容器に、水が {w}cm の高さまではいっている。この容器に半径 {b}cm の鉄球を沈めると、水はあふれるか。「ア あふれる」「イ あふれない」から選び、記号で答えよう（水面の高さが容器の高さより高くなったとき水はあふれるものとする）。', choice_answer(['ア' if over else 'イ']),
              f'容器にさらに入れられる水の量は π×{R}²×{H - w}＝{pi_txt(room)}、鉄球の体積は {pi_txt(ball)}。{"鉄球の方が大きいのであふれる" if over else "鉄球の方が小さいのであふれない"}。正解：{"ア" if over else "イ"}', 123, 'B+③', '体積の利用', tb=207, tbnote='球の体積')
    def t6():
        rr = r.randint(2, 6)
        k = r.randrange(2)
        if k == 0: u.add(f'底面の半径が {rr}cm、高さが {2 * rr}cm の円柱に、ちょうどはいる球の体積は、円柱の体積の何倍か答えよう。', num_answer(F(2, 3)), f'円柱 π×{rr}²×{2 * rr}＝{pi_txt(2 * rr ** 3)}、球 {pi_txt(F(4 * rr ** 3, 3))}。比べると 2/3 倍。', 123, 'A③', '球と円柱の体積', ['1/3', '3/2'], tb=206, tbnote='球の体積')
        else: u.add(f'底面の半径が {rr}cm の円柱と円錐があり、高さはどちらも {rr * 2}cm である。円柱の体積は円錐の体積の何倍か答えよう。', num_answer(3), '底面が合同で高さが等しいとき、円錐の体積は円柱の体積の 1/3。だから円柱は円錐の3倍。', 122, 'A②', '円錐と円柱の体積', ['1/3', '2'], tb=205, tbnote='角錐、円錐の体積')
    plan = [t1] * 14 + [t2] * 14 + [t3] * 12 + [t4] * 12 + [t5] * 9 + [t6] * 9
    return done(fill(u, plan))

# ---------------- 立体の表面積①（ワーク p124〜125・教科書 p208〜210） ----------------
def s6():
    u = Unit('workbook-math-1-surface1', 'workbook', '立体の表面積①', '空間図形',
             '2026-10-05 Claude作成。数学ワークp124〜125（A①円柱の表面積・A②正四角錐の表面積・A③円錐の表面積・B①・B②・B+③円柱から円錐をくりぬいた立体）と教科書p208〜210（表面積・側面積・問1・例1・問2・問3・例2・問4・例題1 円錐の側面積・問5・問6）を写真で確認。答えは π を使う。', tb=209)
    r = rng(1451)
    def t1():
        rr, h = r.randint(2, 9), r.randint(2, 12); dia = r.random() < .3
        what = r.choice(['側面積', '表面積'])
        side, base = 2 * rr * h, rr * rr
        v = side if what == '側面積' else side + 2 * base
        u.add(f'底面の{"直径" if dia else "半径"}が {2 * rr if dia else rr}cm、高さが {h}cm の円柱の{what}を求めよう（π を使って答える）。', pi_answer(v, CM2),
              f'{"半径は " + str(rr) + "cm。" if dia else ""}側面の展開図は、縦 {h}cm、横（底面の円周）{pi_txt(2 * rr)}cm の長方形で、側面積は {pi_txt(side)}。' + (f'底面積は π×{rr}²＝{pi_txt(base)} で2つあるので、表面積は {pi_txt(side)}＋{pi_txt(base)}×2＝{pi_txt(v)}（cm²）' if what == '表面積' else f'答え {pi_txt(v)}（cm²）'),
              124 if not dia else 125, 'A①' if not dia else 'B①', '円柱の表面積', [pi_txt(side + base), pi_txt(side)] if what == '表面積' else [pi_txt(rr * h)], tb=209, tbnote='例1・問2・問3')
    def t2():
        a, h = r.randint(3, 12), r.randint(3, 12)
        what = r.choice(['側面積', '表面積'])
        side = 2 * a * h; v = side if what == '側面積' else side + a * a
        u.add(f'底面が1辺 {a}cm の正方形で、側面の二等辺三角形の高さが {h}cm の正四角錐の{what}を求めよう。', len_answer(v, 'cm²'),
              f'4つの側面は合同な二等辺三角形。側面積は ({a}×{h}÷2)×4＝{side}' + (f'、底面積は {a}×{a}＝{a * a}。表面積は {side}＋{a * a}＝{v}（cm²）' if what == '表面積' else '（cm²）'), 124, 'A②', '正四角錐の表面積', [str(side + 2 * a * a), str(a * h * 4)] if what == '表面積' else [str(a * h * 4), str(a * h)], tb=209, tbnote='例2・問4')
    def t3():
        rr, l = r.choice([(6, 9), (5, 9), (2, 5), (6, 12), (3, 6), (6, 8), (4, 6), (3, 9), (4, 10), (5, 8), (2, 6), (3, 5)])
        ang = F(360 * rr, l); side = rr * l; base = rr * rr
        k = r.randrange(3)
        if k == 0: u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の、側面のおうぎ形の中心角を求めよう。', deg_answer(ang), f'(2π×{rr}):(2π×{l})＝x:360 より x＝{fmt_num(ang)}', 125, 'A③(1)', '円錐の展開図の中心角', [ans_str(F(360 * l, rr))], tb=210, tbnote='例題1')
        elif k == 1: u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の側面積を求めよう（π を使って答える）。', pi_answer(side, CM2), f'中心角は {fmt_num(ang)}°。側面積は π×{l}²×{fmt_num(ang)}/360＝{pi_txt(side)}（cm²）', 125, 'A③(1)', '円錐の側面積', [pi_txt(l * l), pi_txt(2 * rr * l)], tb=210, tbnote='例題1・問5')
        else: u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の表面積を求めよう（π を使って答える）。', pi_answer(side + base, CM2), f'側面積 {pi_txt(side)}（中心角 {fmt_num(ang)}°）と底面積 π×{rr}²＝{pi_txt(base)} をたして {pi_txt(side + base)}（cm²）', 125, 'A③(3)', '円錐の表面積', [pi_txt(side), pi_txt(side + 2 * base)], tb=210, tbnote='問6')
    def t4():
        rr, h, l = r.choice([(6, 8, 10), (3, 4, 5), (5, 12, 13), (8, 6, 10), (6, 12, 0)])
        if l == 0: return
        H = r.choice([h + 2, h + 4, h + 1])
        S = 2 * rr * H + rr * rr + rr * l
        u.add(f'底面の半径が {rr}cm、高さが {H}cm の円柱から、同じ底面で高さ {h}cm、母線の長さ {l}cm の円錐をくりぬいた立体がある（円錐の頂点は円柱の内部にある）。この立体の表面積を求めよう（π を使って答える）。', pi_answer(S, CM2),
              f'外側は、円柱の側面 {pi_txt(2 * rr * H)} と、くりぬいていない方の底面 {pi_txt(rr * rr)}。内側は円錐の側面 π×{rr}×{l}＝{pi_txt(rr * l)}。合計 {pi_txt(S)}（cm²）', 125, 'B+③', '組み合わせた立体の表面積', [pi_txt(S + rr * rr), pi_txt(2 * rr * H + 2 * rr * rr)], tb=210, tbnote='円錐の側面積')
    def t5():
        a, b, c = r.randint(2, 9), r.randint(2, 9), r.randint(2, 9)
        u.add(f'縦 {a}cm、横 {b}cm、高さ {c}cm の直方体の表面積を求めよう。', len_answer(2 * (a * b + b * c + c * a), 'cm²'), f'向かい合う面は合同。({a}×{b}＋{b}×{c}＋{c}×{a})×2＝{2 * (a * b + b * c + c * a)}（cm²）', 124, 'A①', '角柱の表面積', [str(a * b * c), str(a * b + b * c + c * a)], tb=208, tbnote='問1')
    plan = [t1] * 16 + [t2] * 14 + [t3] * 22 + [t4] * 8 + [t5] * 10
    return done(fill(u, plan))

# ---------------- 立体の表面積②（ワーク p126・教科書 p211） ----------------
def s7():
    u = Unit('workbook-math-1-surface2', 'workbook', '立体の表面積②', '空間図形',
             '2026-10-05 Claude作成。数学ワークp126（A①球の表面積・A②半球の表面積・B①球の1/4と1/8の表面積・B+②円柱と半球を組み合わせた立体）と教科書p211（S＝4πr²・例3・問7・説明しよう）を写真で確認。答えは π を使う。', tb=211)
    r = rng(1461)
    def t1():
        rr = r.randint(1, 15); dia = r.random() < .4
        u.add(f'{"直径" if dia else "半径"} {2 * rr if dia else rr}cm の球の表面積を求めよう（π を使って答える）。', pi_answer(4 * rr * rr, CM2), f'{"半径は " + str(rr) + "cm。" if dia else ""}S＝4πr²＝4π×{rr}²＝{pi_txt(4 * rr * rr)}（cm²）', 126, 'A①', '球の表面積', [pi_txt(rr * rr), pi_txt(16 * rr * rr) if dia else pi_txt(F(4 * rr ** 3, 3))], tb=211, tbnote='例3・問7')
    def t2():
        rr = r.randint(2, 12); k = r.randrange(2)
        if k == 0: u.add(f'半径 {rr}cm の半球の、曲面の部分の面積を求めよう（π を使って答える）。', pi_answer(2 * rr * rr, CM2), f'球の表面積の半分。4π×{rr}²÷2＝{pi_txt(2 * rr * rr)}（cm²）', 126, 'A②(1)', '半球の表面積', [pi_txt(4 * rr * rr), pi_txt(3 * rr * rr)], tb=211, tbnote='球の表面積')
        else: u.add(f'半径 {rr}cm の半球の表面積を求めよう（π を使って答える）。', pi_answer(3 * rr * rr, CM2), f'曲面 4π×{rr}²÷2＝{pi_txt(2 * rr * rr)} と、切り口の円 π×{rr}²＝{pi_txt(rr * rr)} をあわせて {pi_txt(3 * rr * rr)}（cm²）', 126, 'A②(2)', '半球の表面積', [pi_txt(2 * rr * rr), pi_txt(4 * rr * rr)], tb=211, tbnote='球の表面積')
    def t3():
        rr = r.randint(2, 12); dia = r.random() < .5; part = r.choice([4, 8])
        if part == 4: S = rr * rr + rr * rr; how = f'曲面は球の表面積の1/4で π×{rr}²、切り口は半円が2つで π×{rr}²×1/2×2＝{pi_txt(rr * rr)}'
        else: S = F(rr * rr, 2) + F(3 * rr * rr, 4); how = f'曲面は球の表面積の1/8で {pi_txt(F(rr * rr, 2))}、切り口は円の1/4が3つで {pi_txt(F(3 * rr * rr, 4))}'
        u.add(f'{"直径" if dia else "半径"} {2 * rr if dia else rr}cm の球を、中心を通る平面で切って、もとの球の 1/{part} にした立体がある。この立体の表面積を求めよう（π を使って答える）。', pi_answer(S, CM2), f'{"半径は " + str(rr) + "cm。" if dia else ""}{how}。合計 {pi_txt(S)}（cm²）', 126, 'B①', '球の一部の表面積', [pi_txt(F(4 * rr * rr, part))], tb=211, tbnote='球の表面積')
    def t4():
        rr, h = r.randint(2, 8), r.randint(2, 12)
        S = 2 * rr * rr + 2 * rr * h + rr * rr
        u.add(f'底面の半径が {rr}cm、高さが {h}cm の円柱の上に、半径 {rr}cm の半球をのせた立体がある。この立体の表面積を求めよう（π を使って答える）。', pi_answer(S, CM2),
              f'半球の曲面 {pi_txt(2 * rr * rr)}、円柱の側面 2π×{rr}×{h}＝{pi_txt(2 * rr * h)}、円柱の下の底面 {pi_txt(rr * rr)}。合計 {pi_txt(S)}（cm²）', 126, 'B+②', '組み合わせた立体の表面積', [pi_txt(S + rr * rr), pi_txt(S + 2 * rr * rr)], tb=211, tbnote='球の表面積')
    def t5():
        rr = r.randint(2, 9)
        u.add(f'半径 {rr}cm の球の表面積は、半径 {rr}cm の円の面積の何倍か答えよう。', num_answer(4), f'球の表面積は 4π×{rr}²、円の面積は π×{rr}²。4倍。（4πr²＝π×(2r)² なので、半径 {2 * rr}cm の円の面積とも等しい）', 126, 'A①', '球の表面積の公式', ['2', '3'], tb=211, tbnote='説明しよう')
    plan = [t1] * 16 + [t2] * 16 + [t3] * 16 + [t4] * 18 + [t5] * 4
    return done(fill(u, plan))

# ---------------- 空間図形の利用（ワーク p127・教科書 p214〜215） ----------------
def s8():
    u = Unit('workbook-math-1-spaceuse', 'workbook', '空間図形の利用', '空間図形',
             '2026-10-05 Claude作成。数学ワークp127（A①ひもをかける問題（円錐）・B①円錐の投影図・B+②直方体にひもをかける）と教科書p214〜215（空間図形の利用・ステップ1〜3・練習問題1）を写真で確認。単元一覧に未登録だったため追加した小単元。長さが整数になる場合だけを出す。', tb=214)
    r = rng(1471)
    BOX = '直方体ABCD−EFGH（上の面ABCD、下の面EFGH、AとE、BとF、CとG、DとHが辺で結ばれている）'
    def sq(n):
        k = math.isqrt(n); return k if k * k == n else None
    def t1():
        rr = r.randint(1, 6); l = r.choice([x for x in range(rr + 1, 31) if 360 * rr % x == 0])
        ang = F(360 * rr, l)
        u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐がある。側面の展開図のおうぎ形の中心角を求めよう。', deg_answer(ang), f'おうぎ形の弧の長さは底面の円周と等しい。(2π×{rr}):(2π×{l})＝x:360 より x＝{fmt_num(ang)}', 127, 'A①(1)', 'ひもをかける問題（中心角）', [ans_str(F(360 * l, rr))], tb=214, tbnote='ステップ2')
    def t2():
        rr = r.randint(1, 8); ang = r.choice([60, 180]); l = 6 * rr if ang == 60 else 2 * rr
        v = l if ang == 60 else 2 * l
        u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐がある。底面の円周上の点Aから、側面を1周して同じ点にもどるようにひもを巻く。ひもの長さがもっとも短くなるとき、その長さを求めよう。', len_answer(v),
              f'側面の展開図は半径 {l}cm、中心角 {ang}° のおうぎ形OAB（中心角は 360×{rr}/{l}）。もっとも短いひもは線分AB。' + (f'中心角60°で OA＝OB なので△OABは正三角形になり、AB＝{l}cm' if ang == 60 else f'中心角180°なのでABは半円の直径で、AB＝{l}×2＝{2 * l}cm'),
              127, 'A①(2)', 'ひもをかける問題（もっとも短い長さ）', [str(l if ang == 180 else 2 * l), ans_str(F(2 * rr))], tb=214, tbnote='ステップ2・説明しよう')
    def t3():
        a, b, c = r.randint(1, 12), r.randint(1, 12), r.randint(1, 12)
        via = r.choice(['BC', 'CD'])
        p, q = (a + c, b) if via == 'BC' else (b + c, a)
        L = sq(p * p + q * q)
        if not L: return
        u.add(f'{BOX}で、AB＝{a}cm、AD＝{b}cm、AE＝{c}cm である。この直方体の表面に、頂点Aから辺{via}を通って頂点Gまで、ひもをゆるまないようにかける。ひもの長さがもっとも短くなるとき、その長さを求めよう。', len_answer(L),
              f'辺{via}をはさむ2つの面を展開図にすると、ひもは線分AGになる。AとGは、{via}に垂直な方向に {p - c}＋{c}＝{p}cm、{via}の方向に {q}cm はなれている。{p}²＋{q}²＝{L}² なので AG＝{L}cm', 127, 'B+②', 'ひもをかける問題（直方体）', [str(a + b + c), str(p + q)], tb=215, tbnote='練習問題1')
    def t4():
        a, b, c = r.randint(1, 12), r.randint(1, 12), r.randint(1, 12)
        L1 = (a + c) ** 2 + b * b; L2 = (b + c) ** 2 + a * a
        if L1 == L2: return
        short = 'BC' if L1 < L2 else 'CD'
        u.add(f'{BOX}で、AB＝{a}cm、AD＝{b}cm、AE＝{c}cm である。頂点Aから頂点Gまで、表面にひもをかける。辺BCを通る場合と辺CDを通る場合で、ひもの長さをもっとも短くしたとき、短くなるのはどちらか。「ア 辺BCを通る」「イ 辺CDを通る」から選び、記号で答えよう。', choice_answer(['ア' if short == 'BC' else 'イ']),
              f'展開図で考えると、BCを通るときの長さの2乗は ({a}＋{c})²＋{b}²＝{L1}、CDを通るときは ({b}＋{c})²＋{a}²＝{L2}。{"BC" if short == "BC" else "CD"}を通る方が短い。', 127, 'B+②', 'ひもをかける問題（どちらが短いか）', tb=215, tbnote='練習問題1')
    def t5():
        rr = r.randint(1, 6); l = r.choice([x for x in range(rr + 1, 25) if 360 * rr % x == 0])
        what = r.choice(['底辺の長さ', '等しい2辺の長さ'])
        v = 2 * rr if what == '底辺の長さ' else l
        u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の投影図をかく。立面図は二等辺三角形になる。その{what}を求めよう。', len_answer(v), f'立面図の底辺は底面の直径 {2 * rr}cm、等しい2辺は母線 {l}cm。答え {v}cm', 127, 'B①(1)', '円錐の投影図', [str(rr), str(l if v != l else 2 * rr)], tb=215, tbnote='ステップ3')
    plan = [t1] * 16 + [t2] * 12 + [t3] * 22 + [t4] * 10 + [t5] * 10
    return done(fill(u, plan))

# ---------------- ふりかえりドリル（ワーク p128〜129：入試問題をふくむ） ----------------
def s9():
    u = Unit('workbook-math-1-solidreview', 'workbook', 'ふりかえりドリル', '空間図形',
             '2026-10-05 Claude作成。数学ワークp128〜129（①角柱と角錐（山形・千葉）・②投影図（栃木）・③空間内の平面と直線（岡山）・④立体の体積（長野・山口）・⑤球の体積（山口）・⑥円錐の表面積（兵庫）・⑦球の表面積（京都））を写真で確認し、教科書p184〜211と照らして作り直した。')
    r = rng(1481)
    S = cuboid(); T = prism3()
    def t1():
        e = r.choice(S.edges); n = sum(1 for x in S.edges if S.rel(e, x) == 'ねじれ')
        u.add(f'{S.name}のすべての辺のうち、直線{e}とねじれの位置にある辺は全部で何本あるか答えよう。', {'kind': 'number', 'value': str(n), 'units': ['本']}, f'直線{e}と交わる辺・平行な辺をのぞくと {n} 本。', 128, '③(1)', 'ねじれの位置', ['8', '3'], tb=195, tbnote='ねじれの位置')
    def t2():
        f = r.choice(S.faces); w = r.choice(['垂直', '平行'])
        ans = [x for x in S.edges if S.line_plane(x, f) == w]
        u.add(f'{S.name}で、辺を直線、面を平面とみる。平面{f}と{"垂直に交わる" if w == "垂直" else "平行な"}直線をすべて答えよう。', set_answer(ans), f'答え {"、".join(ans)}', 128, '③(2)', '直線と平面の位置関係', tb=196, tbnote='問3')
    def t3():
        f = r.choice(['ABC', 'DEF']); w = r.choice(['垂直', '平行'])
        ans = [g for g in T.faces if g != f and T.plane_plane(f, g) == w]
        u.add(f'{T.name}で、面を平面とみる。平面{f}と{"垂直な" if w == "垂直" else "平行な"}平面をすべて答えよう。', set_answer(ans), f'側面は底面と垂直、2つの底面は平行。答え {"、".join(ans)}', 128, '③(3)', '2平面の位置関係', tb=196, tbnote='垂直')
    def t4():
        a = r.choice([3, 6, 9, 12]); k = r.randrange(2)
        V = F(a ** 3, 6)
        if k == 0: u.add(f'1辺の長さが {a}cm の立方体を、1つの頂点に集まる3本の辺の、それぞれのもう一方の端の3点を通る平面で切ると、三角錐が切り取られる。この三角錐の体積を求めよう。', len_answer(V, 'cm³'), f'底面は直角をはさむ辺が {a}cm の直角二等辺三角形、高さ {a}cm。{a}×{a}÷2×{a}÷3＝{fmt_num(V, "dec")}（cm³）', 129, '④(1)', '立体の体積', [ans_str(F(a ** 3, 2)), ans_str(a ** 3 - V)], tb=206, tbnote='角錐の体積')
        else: u.add(f'1辺の長さが {a}cm の立方体から、1つの頂点に集まる3本の辺の、もう一方の端の3点を通る平面で三角錐を切り取った。残った立体の体積を求めよう。', len_answer(a ** 3 - V, 'cm³'), f'立方体 {a ** 3} から三角錐 {fmt_num(V, "dec")} をひいて {fmt_num(a ** 3 - V, "dec")}（cm³）', 129, '④(1)', '立体の体積', [ans_str(V)], tb=206, tbnote='角錐の体積')
    def t5():
        rr, h1 = r.randint(2, 6), r.randint(2, 6); h2 = h1 + r.choice([3, 6, 9])
        V = rr * rr * h1 + F(rr * rr * (h2 - h1), 3)
        u.add(f'台形ABCDで、∠C＝∠D＝90°、BC＝{h1}cm、AD＝{h2}cm、CD＝{rr}cm である。辺ADを軸として、この台形を1回転させてできる立体の体積を求めよう（π を使って答える）。', pi_answer(V, CM3),
              f'底面の半径 {rr}cm、高さ {h1}cm の円柱と、底面の半径 {rr}cm、高さ {h2 - h1}cm の円錐を組み合わせた立体。π×{rr}²×{h1}＋π×{rr}²×{h2 - h1}÷3＝{pi_txt(V)}（cm³）', 129, '④(2)', '回転体の体積', [pi_txt(rr * rr * h2), pi_txt(rr * rr * h1 + rr * rr * (h2 - h1))], tb=206, tbnote='円錐の体積')
    def t6():
        d = r.choice([6, 4, 8, 10, 12, 2]); rr = d // 2
        u.add(f'直径ABが {d}cm の半円がある。線分ABを軸としてこの半円を1回転させてできる立体の体積を求めよう（π を使って答える）。', pi_answer(F(4 * rr ** 3, 3), CM3), f'できる立体は半径 {rr}cm の球。4π×{rr}³÷3＝{pi_txt(F(4 * rr ** 3, 3))}（cm³）', 129, '⑤', '球の体積', [pi_txt(F(4 * d ** 3, 3)), pi_txt(4 * rr * rr)], tb=207, tbnote='例1')
    def t7():
        rr = r.randint(2, 6); l = r.choice([x for x in range(rr + 1, 16) if 360 * rr % x == 0])
        u.add(f'底面の半径が {rr}cm、母線の長さが {l}cm の円錐の側面積を求めよう（π を使って答える）。', pi_answer(rr * l, CM2), f'側面のおうぎ形の中心角は 360×{rr}/{l}＝{fmt_num(F(360 * rr, l))}°。π×{l}²×{fmt_num(F(360 * rr, l))}/360＝{pi_txt(rr * l)}（cm²）', 129, '⑥', '円錐の表面積', [pi_txt(l * l), pi_txt(rr * l + rr * rr)], tb=210, tbnote='例題1')
    def t8():
        k = r.randrange(2)
        if k == 0:
            rr = r.choice([4, 3, 5, 6]); u.add(f'半径 {rr}cm の半球の表面積を求めよう（π を使って答える）。', pi_answer(3 * rr * rr, CM2), f'曲面 {pi_txt(2 * rr * rr)} と切り口の円 {pi_txt(rr * rr)}。合計 {pi_txt(3 * rr * rr)}（cm²）', 129, '⑦(1)', '球の表面積', [pi_txt(2 * rr * rr)], tb=211, tbnote='球の表面積')
        else:
            d = r.choice([14, 10, 8, 12, 6]); rr = d // 2; u.add(f'直径 {d}cm の球の表面積を求めよう（π を使って答える）。', pi_answer(4 * rr * rr, CM2), f'半径 {rr}cm。4π×{rr}²＝{pi_txt(4 * rr * rr)}（cm²）', 129, '⑦(2)', '球の表面積', [pi_txt(4 * d * d)], tb=211, tbnote='例3')
    def t9():
        u.add('立面図が三角形、平面図が対角線をひいた四角形で表される立体を、次のア〜エから1つ選び、記号で答えよう。\nア 四角錐　イ 四角柱　ウ 三角錐　エ 三角柱', choice_answer(['ア']), '平面図が四角形で、頂点に向かう線（対角線）が見えるので四角錐。', 128, '②', '投影図', tb=189, tbnote='問8')
    plan = [t1] * 8 + [t2] * 10 + [t3] * 6 + [t4] * 8 + [t5] * 10 + [t6] * 8 + [t7] * 10 + [t8] * 9 + [t9] * 1
    return done(fill(u, plan))
