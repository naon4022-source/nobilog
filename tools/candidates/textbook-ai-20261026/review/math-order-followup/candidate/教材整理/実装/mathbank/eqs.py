"""3章 方程式（ワーク p54〜69・教科書 p89〜109 を写真で確認して作成）"""
from common import *
from bank import expr_answer, relation_answer
import alg
from alg import P as Poly, var, show as sh, paren, steps_txt
from moji2 import cpar, join_signed, lin

X = var('x')

def sol(lhs, rhs):
    """一次方程式 lhs=rhs（x の式）の解。解けなければ None"""
    d = lhs - rhs; a = d.coef('x'); b = d.const()
    if a == 0 or any(k not in ((), ('x',)) for k in d.t): return None
    return -b / a

def move_txt(lhs, rhs):
    """移項して ax=b → x=… の途中式"""
    a1, b1, a2, b2 = lhs.coef('x'), lhs.const(), rhs.coef('x'), rhs.const()
    left = alg.terms_txt([(('x',), a1), (('x',), -a2)]); right = alg.terms_txt([((), b2), ((), -b1)])
    k, m = a1 - a2, b2 - b1
    out = [f'{left}={right}', f'{sh(k * X)}={fmt_num(m)}']
    v = m / k
    out.append(f'x={fmt_num(v)}')
    return '、'.join(dict.fromkeys(out))

def eq_txt(l, r): return f'{l}={r}'

def solve_q(u, prompt_eq, lhs, rhs, expl_head, page, no, topic, tb, tbnote, near=(), lead='次の方程式を解こう。', mul=1):
    """mul：分母をはらう・小数を整数にするために両辺にかけた数（途中式はかけたあとの式で書く）"""
    v = sol(lhs, rhs)
    if v is None: return False
    nr = [ans_str(-v)] + [ans_str(F(n)) for n in near if n is not None]
    dec = any(w.denominator in (2, 4, 5, 10, 20, 25, 50, 100) and w.denominator != 1 for _, w in list(lhs.terms()) + list(rhs.terms())) and mul in (10, 100)
    return u.add(f'{lead}\n{prompt_eq}', num_answer(v, dec), f'{expl_head}{move_txt(lhs * mul, rhs * mul)}。答え x＝{fmt_num(v, "dec" if dec else "auto")}', page, no, topic, nr, tb=tb, tbnote=tbnote)

def nice_sol(r, lo=-12, hi=12, frac=False):
    x = F(rint(r, lo, hi))
    if frac and r.random() < .25: x = rfrac(r, (2, 3, 4, 5), 1, 9)
    return x

def build_eq(r, x, ca=(-9, 9), cb=(-15, 15), same_side=False):
    """解が x になる ax+b=cx+d（a≠c）を作る"""
    for _ in range(50):
        a, c = rint(r, *ca), rint(r, *ca)
        if a == c or (same_side and c == 0): continue
        b = rint(r, *cb); d = (a - c) * x + b
        if d.denominator != 1 or abs(d) > 99: continue
        return a * X + b, c * X + d
    return None

# ---------------- 方程式とその解①（ワーク p54・教科書 p89〜90） ----------------
def e1():
    u = Unit('workbook-math-1-eq1', 'workbook', '方程式とその解①', '方程式',
             '2026-10-05 Claude作成。数学ワークp54（A①解である方程式を選ぶ・B①小数やかっこをふくむ方程式・B+②解から□を求める）と教科書p89〜90（方程式・解・例1・問1・問2）を写真で確認。', tb=90)
    r = rng(1101)
    def t1():  # 解である方程式を選ぶ
        x = rint(r, -6, 8)
        eqs = []
        for k in range(4):
            if k % 2 == 0:
                e = build_eq(r, F(x) if r.random() < .6 else F(x + r.choice([1, -1, 2])))
                if not e: return
                eqs.append((e[0], e[1], sol(*e) == x))
            else:
                a, b = rint(r, -5, 5), rint(r, -9, 9); c = rdec(r, -2, 2)
                lhs = c * X + b if r.random() < .5 else a * (X + b)
                rhs_val = lhs.val(x=x) + (0 if r.random() < .5 else r.choice([1, -1]))
                eqs.append((lhs, Poly.of(rhs_val), sol(lhs, Poly.of(rhs_val)) == x))
        ok = [LETTERS[i] for i, (_, _, t) in enumerate(eqs) if t]
        if not ok or len(ok) == 4: return
        def dsp(p):
            out = ''
            for i, (k, w) in enumerate(p.terms()):
                body = (fmt_num(abs(w), 'dec') if abs(w) != 1 or not k else '') + alg.letters_txt(k)
                out += ('−' if w < 0 else ('' if i == 0 else '+')) + body
            return out or '0'
        txt = '\n'.join(f'{LETTERS[i]} {dsp(l)}={dsp(rr)}' for i, (l, rr, _) in enumerate(eqs))
        u.add(f'次のア〜エのうち、{fmt_num(F(x))} が解である方程式をすべて選び、記号で答えよう。\n{txt}', choice_answer(ok),
              f'x に {fmt_num(F(x))} を代入して、左辺と右辺が等しくなるものを選ぶ。' + '　'.join(f'{LETTERS[i]} 左辺{fmt_num(l.val(x=x), "dec")}・右辺{fmt_num(rr.val(x=x), "dec")}' for i, (l, rr, _) in enumerate(eqs)) + f'。正解：{"、".join(ok)}', 54, 'A①' if r.random() < .5 else 'B①', '方程式の解', tb=90, tbnote='例1・問2')
    def t2():  # 代入した値
        x = rint(r, -6, 8); e = build_eq(r, F(x))
        if not e: return
        side = r.choice(['左辺', '右辺']); p = e[0] if side == '左辺' else e[1]
        v = p.val(x=x)
        u.add(f'方程式 {sh(e[0])}={sh(e[1])} で、x に {fmt_num(F(x))} を代入したときの{side}の値を答えよう。', num_answer(v),
              f'{side}は {sh(p)}。x＝{fmt_num(F(x))} を代入すると {fmt_num(v)}。左辺と右辺が等しいので、{fmt_num(F(x))} はこの方程式の解。', 54, 'A①', '方程式の解を確かめる', [ans_str(-v)], tb=90, tbnote='例1')
    def t3():  # □ を求める（B+②）
        x = rint(r, 2, 6); a, c, d = rint(r, 1, 5), rint(r, 1, 5), rint(r, 1, 12)
        if a == c: return
        box = c * x + d - a * x
        u.add(f'方程式 {a if a != 1 else ""}x+□={d}+{c if c != 1 else ""}x の解が {x} であるとき、□ にあてはまる数を答えよう。', num_answer(box),
              f'x に {x} を代入すると、左辺と右辺が等しくなる。{a}×{x}＋□＝{d}＋{c}×{x} より、{a * x}＋□＝{d + c * x}、□＝{fmt_num(F(box))}', 54, 'B+②', '解から方程式の数を求める', [ans_str(-box), ans_str(F(box + 2 * a * x))], tb=90, tbnote='例1')
    def t4():  # 候補から解を選ぶ
        x = rint(r, -5, 5); e = build_eq(r, F(x))
        if not e: return
        cands = sorted(set([x, x + 1, x - 1, -x, x + 2]))
        u.add(f'{"、".join(fmt_num(F(c)) for c in cands)} のうち、方程式 {sh(e[0])}={sh(e[1])} の解はどれか答えよう。', num_answer(x),
              f'それぞれを代入して、左辺と右辺が等しくなるものをさがす。x＝{fmt_num(F(x))} のとき左辺 {fmt_num(e[0].val(x=x))}、右辺 {fmt_num(e[1].val(x=x))} で等しい。', 54, 'A①', '方程式の解', [ans_str(F(c)) for c in cands if c != x][:2], tb=90, tbnote='問2')
    def t5():  # 文字をふくむ係数
        x = rint(r, -4, 5); a = rint(r, -6, 6)
        if x == 0 or a == 0: return
        p, q = rint(r, -5, 5), rint(r, -9, 9)
        # 方程式 p x + q = a x + k の解が x のとき k を求める
        k = p * x + q - a * x
        u.add(f'方程式 {sh(p * X + q)}={sh(a * X)}+k の解が x＝{fmt_num(F(x))} であるとき、k の値を求めよう。', num_answer(k),
              f'解 x＝{fmt_num(F(x))} を代入すると等式が成り立つ。{fmt_num(F(p * x + q))}＝{fmt_num(F(a * x))}＋k だから k＝{fmt_num(F(k))}', 54, 'B+②', '解から方程式の数を求める', [ans_str(-k)], tb=90, tbnote='方程式の解')
    def t6():  # 文脈（バスの回数）
        fare, pass_ = r.choice([(180, 480), (210, 330), (160, 640), (230, 270)])
        n = r.randint(3, 8); total = fare * n + pass_
        u.add(f'1回 {fare} 円のバスに x 回乗り、ほかに {pass_} 円の入館料をはらうと、合計 {total} 円になった。この関係を方程式 {fare}x+{pass_}={total} と表すとき、方程式を成り立たせる x の値（方程式の解）を答えよう。', num_answer(n),
              f'x に 1、2、3、… を代入して左辺を調べるか、移項して解く。{fare}x＝{total}−{pass_}＝{fare * n}、x＝{n}', 54, 'A①', '方程式と解の意味', [str(n + 1), str(n - 1)], tb=90, tbnote='方程式・問1')
    plan = [t1] * 14 + [t2] * 10 + [t3] * 12 + [t4] * 12 + [t5] * 12 + [t6] * 10
    return fill(u, plan)

# ---------------- 方程式とその解②（ワーク p55・教科書 p91〜93：等式の性質） ----------------
def e2():
    u = Unit('workbook-math-1-eq2', 'workbook', '方程式とその解②', '方程式',
             '2026-10-05 Claude作成。数学ワークp55（A①等式の性質を使って解く・B①分数と小数・B+②x+0.8=−3.5）と教科書p91〜93（等式の性質①〜④・例2〜5・問3〜7・説明しよう・練習問題1）を写真で確認。単元一覧に未登録だったため追加した小単元。', tb=92)
    r = rng(1111)
    def why(k, c):
        return ['両辺に同じ数をたしても等式は成り立つ（性質①）', '両辺から同じ数をひいても等式は成り立つ（性質②）', '両辺に同じ数をかけても等式は成り立つ（性質③）', '両辺を同じ数でわっても等式は成り立つ（性質④）'][k]
    def t1():  # x+a=b
        a, x = rint(r, -15, 15), rint(r, -15, 15)
        b = x + a
        if a == 0: return
        s = f'x{"+" if a > 0 else "−"}{abs(a)}={fmt_num(F(b))}' if r.random() < .7 else f'{fmt_num(F(a))}+x={fmt_num(F(b))}'
        u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x), f'左辺を x だけにするために、両辺{"から " + str(a) + " をひく" if a > 0 else "に " + str(-a) + " をたす"}（{why(1 if a > 0 else 0, a)}）。x＝{fmt_num(F(x))}', 55, 'A①(1)(2)', '等式の性質（たす・ひく）', [ans_str(F(b + a)), ans_str(-x)], tb=92, tbnote='例2・例3・問4')
    def t2():  # x/a=b
        a, b = r.choice([2, 3, 4, 5, 6, 7, 8, -4, -3]), rint(r, -9, 9)
        if b == 0: return
        s = f'x/{a}={fmt_num(F(b))}' if a > 0 else f'−x/{-a}={fmt_num(F(b))}'
        x = a * b
        u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x), f'左辺を x だけにするために、両辺に {lit_txt(a, mul=True)} をかける（{why(2, a)}）。x＝{fmt_num(F(x))}', 55, 'A①(3)', '等式の性質（両辺に同じ数をかける）', [ans_str(F(b, a)), ans_str(-x)], tb=93, tbnote='例4・問6')
    def t3():  # ax=b
        a = r.choice([F(rint(r, -9, 9)), rdec(r, -1, 1)]); x = r.choice([F(rint(r, -12, 12)), rfrac(r, (3, 4, 5), 1, 7)])
        if a == 0 or abs(a) == 1: return
        b = a * x
        if b.denominator not in (1, 2, 5, 10): return
        s = f'{fmt_num(a, "dec") if a.denominator != 1 else (str(a) if a > 0 else "−" + str(-a))}x={fmt_num(b, "dec")}'
        u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x), f'左辺を x だけにするために、両辺を {lit_txt(a, mul=True, dec=True)} でわる（{why(3, a)}）。x＝{fmt_num(x)}', 55, 'A①(4)' if a.denominator == 1 else 'B①(4)', '等式の性質（両辺を同じ数でわる）', [ans_str(b * a), ans_str(-x), ans_str(1 / x) if x else None], tb=93, tbnote='例5・問7')
    def t4():  # 分数
        k = r.randrange(2)
        if k == 0:
            a, b = rfrac(r, (2, 3, 4, 5, 6), 1, 5), rfrac(r, (2, 3, 4, 6), 1, 9)
            x = b - a; s = f'{fmt_num(a)}+x={fmt_num(b)}'
            u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x), f'両辺から {fmt_num(a)} をひいてから通分する。x＝{ex(b, "−", a)}＝{fmt_num(x)}', 55, 'B①(2)', '分数をふくむ方程式', [ans_str(b + a), ans_str(-x)], tb=92, tbnote='問4(3)')
        else:
            c = rfrac(r, (2, 3, 4, 5, 6, 7), 1, 9); b = F(rint(r, -12, 12))
            if b == 0: return
            x = b / c; s = f'{sh(c * X)}={fmt_num(b)}'
            u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x), f'両辺に {fmt_num(c)} の逆数 {fmt_num(1 / c)} をかける（両辺を {lit_txt(c, mul=True)} でわるのと同じ）。x＝{fmt_num(x)}', 55, 'B①(3)', '分数をふくむ方程式', [ans_str(b * c), ans_str(-x)], tb=93, tbnote='問6(3)・説明しよう')
    def t5():  # 小数（B+②）
        a, x = rdec(r, -5, 5), rdec(r, -9, 9)
        b = x + a
        s = f'x{"+" if a > 0 else "−"}{fmt_num(abs(a), "dec")}={fmt_num(b, "dec")}'
        u.add(f'次の方程式を、等式の性質を使って解こう。\n{s}', num_answer(x, True), f'両辺{"から " + fmt_num(a, "dec") + " をひく" if a > 0 else "に " + fmt_num(-a, "dec") + " をたす"}。x＝{fmt_num(x, "dec")}', 55, 'B+②', '小数をふくむ方程式', [ans_str(b + a), ans_str(-x)], tb=93, tbnote='練習問題1(10)')
    def t6():  # 使った性質を選ぶ
        k = r.randrange(4); c = r.randint(2, 9)
        before, after = [(f'x−{c}=5', f'x={5 + c}'), (f'x+{c}=12', f'x={12 - c}'), (f'x/{c}=3', f'x={3 * c}'), (f'{c}x={c * 4}', 'x=4')][k]
        opts = ['両辺に同じ数をたす', '両辺から同じ数をひく', '両辺に同じ数をかける', '両辺を同じ数でわる']
        u.add(f'方程式 {before} を {after} に変形した。このとき使った等式の性質を、次のア〜エから選び、記号で答えよう。\n' + '　'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([LETTERS[k]]),
              f'{before} の左辺を x だけにするには、{["両辺に " + str(c) + " をたす", "両辺から " + str(c) + " をひく", "両辺に " + str(c) + " をかける", "両辺を " + str(c) + " でわる"][k]}。正解：{LETTERS[k]}', 55, 'A①', '等式の性質', tb=92, tbnote='等式の性質')
    def t7():  # 説明しよう：(2/3)x=8 の2つの方法
        p, q = r.choice([(2, 3), (3, 4), (3, 5), (4, 7), (5, 6)]); b = p * r.randint(2, 6) * r.choice([1, -1])
        x = F(b * q, p)
        u.add(f'方程式 {p}x/{q}={fmt_num(F(b))} を、①両辺に {q} をかける、②両辺を {p} でわる、の順に変形して解く。①のあとの方程式で、左辺は {p}x になる。右辺はいくつになるか答えよう。', num_answer(b * q),
              f'①両辺に {q} をかけると {p}x＝{fmt_num(F(b * q))}。②両辺を {p} でわって x＝{fmt_num(x)}（両辺に {q}/{p} をかけてもよい）。', 55, 'A①(3)', '等式の性質を組み合わせる', [ans_str(F(b)), ans_str(x)], tb=93, tbnote='説明しよう')
    plan = [t1] * 10 + [t2] * 9 + [t3] * 12 + [t4] * 12 + [t5] * 8 + [t6] * 10 + [t7] * 9
    return fill(u, plan)

# ---------------- 方程式の解き方①（ワーク p56〜57・教科書 p94〜95：移項） ----------------
def e3():
    u = Unit('workbook-math-1-solve1', 'workbook', '方程式の解き方①', '方程式',
             '2026-10-05 Claude作成。数学ワークp56〜57（A①移項して解く①・A②移項して解く②・A③方程式の解き方・B①・B+②まちがいの場所と正しい解き方）と教科書p94〜95（移項・例1・例2・例題1・問1〜3・説明しよう）を写真で確認。', tb=94)
    r = rng(1121)
    def t1():
        x = rint(r, -9, 9); a = rint(r, -9, 9); b = rint(r, -20, 20)
        if abs(a) < 2: return
        lhs, rhs = a * X + b, Poly.of(a * x + b)
        solve_q(u, eq_txt(sh(lhs), sh(rhs)), lhs, rhs, '数の項を右辺に移項する（符号が変わる）。', 56, 'A①', '移項して解く①', 94, '例1・問1')
    def t2():
        x = rint(r, -9, 9); a, c = rint(r, -9, 9), rint(r, -9, 9)
        if a == c or c == 0: return
        b = (a - c) * x
        lhs, rhs = a * X, c * X + b
        solve_q(u, eq_txt(sh(lhs), sh(rhs)), lhs, rhs, '右辺の文字の項を左辺に移項する。', 56, 'A②', '移項して解く②', 95, '例2・問2')
    def t3():
        x = nice_sol(r, -9, 9); e = build_eq(r, x)
        if not e: return
        solve_q(u, eq_txt(sh(e[0]), sh(e[1])), e[0], e[1], '文字の項を左辺に、数の項を右辺に移項して集める。', 57, 'A③', '方程式の解き方', 95, '例題1・問3')
    def t4():
        x = nice_sol(r, -80, 80); e = build_eq(r, x, ca=(-20, 20), cb=(-400, 400))
        if not e or abs(e[0].const()) < 10: return
        solve_q(u, eq_txt(sh(e[0]), sh(e[1])), e[0], e[1], '移項して ax＝b の形にする。', 57, 'B①', '方程式の解き方', 95, '例題1')
    def t5():  # まちがいの場所
        x = rint(r, -6, 6); a, c = r.randint(2, 6), r.randint(1, 4) * -1; b = rint(r, 2, 9); d = (a - c) * x + b
        lhs, rhs = a * X + b, c * X + d
        # まちがい：数の項の移項で符号を変え忘れる（ア）
        wrong_k = a - c; wrong_m = d + b
        steps = [f'{sh(a * X - c * X)}={fmt_num(F(d))}+{b}', f'{sh(wrong_k * X)}={fmt_num(F(wrong_m))}', f'x={fmt_num(F(wrong_m, wrong_k))}']
        r1 = r.random() < .5
        if r1:
            u.add(f'方程式 {sh(lhs)}={sh(rhs)} を次のように解いたが、まちがっている。はじめにまちがえた式を、ア〜ウから選び、記号で答えよう。\nア {steps[0]}\nイ {steps[1]}\nウ {steps[2]}', choice_answer(['ア']),
                  f'左辺の ＋{b} を右辺に移項すると −{b} になる。アで符号を変え忘れている。正しくは {move_txt(lhs, rhs)}', 57, 'B+②', '移項の符号のまちがい', tb=94, tbnote='移項')
        else:
            u.add(f'方程式 {sh(lhs)}={sh(rhs)} を、ある人は {steps[0]}、{steps[1]}、{steps[2]} と解いたが、まちがっていた。正しい解を求めよう。', num_answer(x),
                  f'＋{b} を移項すると −{b}。{move_txt(lhs, rhs)}', 57, 'B+②', '移項の符号のまちがい', [ans_str(F(wrong_m, wrong_k))], tb=94, tbnote='移項')
    def t6():  # □ の係数
        x = rint(r, -5, 6); c, b = rint(r, -6, 6), rint(r, -12, 12)
        if x == 0: return
        a = rint(r, -8, 8)
        if a == c or a == 0: return
        d = a * x - c * x + b
        u.add(f'方程式 □x{"+" if b >= 0 else "−"}{abs(b)}={sh(c * X + d)} の解が x＝{fmt_num(F(x))} のとき、□ にあてはまる数を答えよう。', num_answer(a),
              f'解を代入すると等式が成り立つ。□×({fmt_num(F(x))}){"+" if b >= 0 else "−"}{abs(b)}＝{fmt_num((c * X + d).val(x=x))} より、□×({fmt_num(F(x))})＝{fmt_num(F(a * x))}、□＝{fmt_num(F(a))}', 57, 'B①', '解から係数を求める', [ans_str(-a)], tb=95, tbnote='例題1')
    def t7():  # 説明しよう（左右を入れかえる）
        x = rint(r, -6, 6); a, b = rint(r, 2, 7), rint(r, 1, 9); c = a * x + b
        u.add(f'方程式 {fmt_num(F(c))}={sh(a * X + b)} を、まず左辺と右辺を入れかえて {sh(a * X + b)}={fmt_num(F(c))} としてから解く。解を求めよう。', num_answer(x),
              f'等式は A＝B ならば B＝A（左辺と右辺を入れかえてよい）。{sh(a * X)}＝{ex(c, "−", b)}＝{fmt_num(F(c - b))}、x＝{fmt_num(F(x))}', 57, 'A③', '方程式の解き方', [ans_str(-x), ans_str(F(c + b, a))], tb=95, tbnote='説明しよう')
    plan = [t1] * 10 + [t2] * 10 + [t3] * 16 + [t4] * 10 + [t5] * 10 + [t6] * 7 + [t7] * 7
    return fill(u, plan)

# ---------------- 方程式の解き方②（ワーク p58〜59・教科書 p96〜99：かっこ・分数・小数） ----------------
def e4():
    u = Unit('workbook-math-1-solve2', 'workbook', '方程式の解き方②', '方程式',
             '2026-10-05 Claude作成。数学ワークp58〜59（A①かっこがある方程式・A②分数をふくむ方程式（分母をはらう）・A③小数をふくむ方程式・B①・B+②分母のはらい方のまちがい）と教科書p96〜99（例題2・3・問4・問5・話しあおう・一次方程式を解く手順・練習問題）を写真で確認。', tb=96)
    r = rng(1131)
    def t1():  # かっこ
        x = nice_sol(r, -9, 9)
        for _ in range(30):
            m, n = rint(r, -6, 6), rint(r, -6, 6)
            if abs(m) < 2 or n == 0: continue
            p1, p2 = lin(r, X, 4, 9), lin(r, X, 4, 9)
            lhs = m * p1; rhs = n * p2 if r.random() < .5 else p2 * 1
            if sol(lhs, rhs) == x or True:
                v = sol(lhs, rhs)
                if v is None or v.denominator != 1 or abs(v) > 20: continue
                pe = eq_txt(cpar(m, p1), cpar(n, p2) if rhs != p2 else sh(p2))
                if solve_q(u, pe, lhs, rhs, f'かっこをはずしてから移項する。{pe} → {sh(lhs)}={sh(rhs)}、', 58, 'A①', 'かっこがある方程式', 96, '例題2・問4',
                           near=[sol(m * Poly({k: w for k, w in p1.t.items() if k}) + p1.const(), rhs)]): return
    def t2():  # 分数（分母をはらう）
        for _ in range(40):
            d1, d2 = r.choice([(2, 3), (3, 4), (2, 5), (4, 6), (3, 5), (5, 2), (6, 4), (8, 4)])
            p1 = lin(r, X, 5, 9); c, k = rfrac(r, (d2,), 1, 9), rint(r, -9, 9)
            lhs, rhs = p1 / d1, c * X + k
            v = sol(lhs, rhs)
            if v is None or v.denominator != 1 or abs(v) > 30 or not p1.const(): continue
            if math.gcd(math.gcd(int(p1.coef('x')), int(p1.const())), d1) > 1: continue  # (2x−2)/2 のように約分できる形は出さない
            L = math.lcm(d1, d2)
            pe = eq_txt(f'({sh(p1)})/{d1}', sh(rhs))
            if solve_q(u, pe, lhs, rhs, f'両辺に分母の最小公倍数 {L} をかけて分母をはらう。{sh(lhs * L)}={sh(rhs * L)}、', 58, 'A②', '分数をふくむ方程式', 97, '例題3・問5', lead='次の方程式を、分母をはらって解こう。', mul=L): return
    def t3():  # 小数
        for _ in range(40):
            k = r.choice([10, 100])
            x = nice_sol(r, -9, 9)
            a, c = F(rint(r, -30, 30), k), F(rint(r, -30, 30), k)
            if a == c or a == 0: continue
            b = F(rint(r, -40, 40), k); d = (a - c) * x + b
            if (d * k).denominator != 1: continue
            lhs, rhs = a * X + b, c * X + d
            def dsp(p):
                out = ''
                for i, (kk, w) in enumerate(p.terms()):
                    body = (fmt_num(abs(w), 'dec') if abs(w) != 1 or not kk else '') + alg.letters_txt(kk)
                    out += ('−' if w < 0 else ('' if i == 0 else '+')) + body
                return out or '0'
            pe = eq_txt(dsp(lhs), dsp(rhs))
            if solve_q(u, pe, lhs, rhs, f'両辺に {k} をかけて、係数を整数にする。{sh(lhs * k)}={sh(rhs * k)}、', 59, 'A③', '小数をふくむ方程式', 97, '話しあおう', mul=k): return
    def t4():  # まちがい（分数の片方だけ）
        a, b, d = r.choice([(5, 4, 2), (3, 2, 4), (7, 6, 3), (5, 6, 3)]), rint(r, 2, 9), r.choice([2, 3])
        p, q, m = a
        L = math.lcm(q, m)
        lhs, rhs = F(p, q) * X + b, X / m
        v = sol(lhs, rhs)
        wrong = sol(p * X + b, (L // m) * X) if L // q == 1 else sol(F(p * L, q) * X + b, F(L, m) * X)
        if v is None or wrong is None or v == wrong: return
        u.add(f'方程式 {p}x/{q}+{b}=x/{m} を、ある人は「両辺に {L} をかけて {sh(F(p * L, q) * X)}+{b}={sh(F(L, m) * X)}」と変形して解いたが、まちがっていた。正しく解いて、解を求めよう。', num_answer(v),
              f'両辺に {L} をかけるときは、すべての項にかける（数の項 {b} にもかける）。{sh(lhs * L)}={sh(rhs * L)}、{move_txt(lhs * L, rhs * L)}', 59, 'B+②', '分母のはらい方のまちがい', [ans_str(wrong)], tb=97, tbnote='例題3')
    def t5():  # 練習問題レベル（いろいろ）
        k = r.randrange(3)
        if k == 0:
            x = nice_sol(r, -9, 9); m = r.choice([F(1, 10), F(3, 10), F(1, 5)]); c = r.choice([F(2, 5), F(1, 2), F(3, 10)])
            n = rint(r, -4, 4); lhs = m * X; rhs = c * (X + n) + F(rint(r, -9, 9), 10)
            v = sol(lhs, rhs)
            if v is None or v.denominator != 1 or abs(v) > 30: return
            pe = eq_txt(f'{fmt_num(m, "dec")}x', f'{fmt_num(c, "dec")}({sh(X + n)}){"+" if rhs.const() - c * n >= 0 else "−"}{fmt_num(abs(rhs.const() - c * n), "dec")}')
            solve_q(u, pe, lhs, rhs, f'かっこをはずし、両辺に 10 をかけて係数を整数にする。{sh(lhs * 10)}={sh(rhs * 10)}、', 59, 'B①', 'いろいろな方程式', 99, '練習問題2(5)', mul=10)
        elif k == 1:
            d1, d2 = r.choice([(3, 2), (5, 3), (4, 3), (6, 4)])
            p1, p2 = lin(r, X, 4, 9), lin(r, X, 4, 9)
            lhs, rhs = p1 / d1, p2 / d2; v = sol(lhs, rhs)
            if v is None or v.denominator != 1 or abs(v) > 30 or not p1.const() or not p2.const(): return
            L = math.lcm(d1, d2)
            solve_q(u, eq_txt(f'({sh(p1)})/{d1}', f'({sh(p2)})/{d2}'), lhs, rhs, f'両辺に {L} をかけて分母をはらう。{L // d1}({sh(p1)})={L // d2}({sh(p2)})、', 59, 'B①(2)', '分数をふくむ方程式', 99, '練習問題2(7)', lead='次の方程式を、分母をはらって解こう。', mul=L)
        else:
            a, b = r.choice([3, 5, 7]), r.choice([100, 10])
            x = F(rint(r, -9, 9) * b // 10 * 10 if b == 100 else rint(r, -40, 40))
            c = a + r.choice([2, 4]); k = (c - a) * x / b
            if k.denominator != 1 or k == 0: return
            lhs, rhs = Poly.of(k) + F(a, b) * X, F(c, b) * X
            solve_q(u, eq_txt(f'{fmt_num(k)}+{a}x/{b}', f'{c}x/{b}'), lhs, rhs, f'両辺に {b} をかけて分母をはらう。{sh(lhs * b)}={sh(rhs * b)}、', 59, 'B①', '分数をふくむ方程式', 99, '練習問題2(8)', mul=b)
    def t6():  # 解から a を求める（入試型）
        x = rint(r, -5, 5); a = rint(r, -6, 6); p = rint(r, 2, 6); q = rint(r, -9, 9)
        if x == 0 or a == 0: return
        # x についての方程式 p x + a = a x + q の解が x のとき a
        if p * x + 0 == x * 0: return
        # p x + a = a x + q → a(1 − x) = q − p x
        if x == 1: return
        aval = F(q - p * x, 1 - x)
        if aval.denominator != 1: return
        u.add(f'x についての方程式 {p}x+a=ax{"+" if q >= 0 else "−"}{abs(q)} の解が x＝{fmt_num(F(x))} のとき、a の値を求めよう。', num_answer(aval),
              f'x＝{fmt_num(F(x))} を代入すると、{fmt_num(F(p * x))}＋a＝a×({fmt_num(F(x))}){"+" if q >= 0 else "−"}{abs(q)}。a についての方程式とみて解くと、{sh(Poly({("a",): F(1 - x)}))}＝{fmt_num(F(q - p * x))}、a＝{fmt_num(aval)}', 58, 'A①', '解から文字の値を求める', [ans_str(-aval)], tb=97, tbnote='一次方程式を解く手順')
    plan = [t1] * 14 + [t2] * 15 + [t3] * 12 + [t4] * 7 + [t5] * 14 + [t6] * 8
    return fill(u, plan)

# ---------------- 比と比例式（ワーク p60〜61・教科書 p100〜101） ----------------
def ratio_txt(a, b): return f'{a}:{b}'
def rnum(v): return fmt_num(F(v))

def e5():
    u = Unit('workbook-math-1-ratio', 'workbook', '比と比例式', '方程式',
             '2026-10-05 Claude作成。数学ワークp60〜61（A①比の値を使って解く・A②比例式の性質・A③かっこがある比例式・B①分数と小数の項・B+②）と教科書p100〜101（比の値・比例式・比例式の性質・例1・問1・問2・練習問題1）を写真で確認。', tb=101)
    r = rng(1141)
    def add(prompt_eq, x, expl, page, no, topic, near=(), tbnote='比例式の性質・例1'):
        u.add(f'次の比例式を解こう。\n{prompt_eq}', num_answer(x), expl, page, no, topic, [ans_str(F(n)) for n in near if n is not None], tb=101 if 'ひろげよう' not in tbnote else 100, tbnote=tbnote)
    def t1():  # x:a=b:c
        a, b, c = r.randint(2, 15), r.randint(2, 12), r.randint(2, 12)
        x = F(a * b, c)
        if x.denominator != 1 or b == c or a == c or x == a: return
        add(f'x:{a}={b}:{c}', x, f'比の値が等しいので x/{a}＝{b}/{c}。両辺に {a} をかけて x＝{fmt_num(x)}（比例式の性質 ad＝bc を使って {c}x＝{a * b} としてもよい）', 60, 'A①', '比の値を使って解く', [F(a * c, b)], tbnote='ひろげよう・問1')
    def t2():  # x がいろいろな場所
        a, b, c = r.randint(2, 15), r.randint(2, 15), r.randint(2, 15)
        k = r.randrange(3)
        if k == 0: s, x, prod = f'{a}:{b}=x:{c}', F(a * c, b), f'{b}x＝{a}×{c}'
        elif k == 1: s, x, prod = f'{a}:{b}={c}:x', F(b * c, a), f'{a}x＝{b}×{c}'
        else: s, x, prod = f'{a}:x={b}:{c}', F(a * c, b), f'{b}x＝{a}×{c}'
        if x.denominator != 1: return
        add(s, x, f'外側の項の積と内側の項の積は等しい（a:b＝c:d ならば ad＝bc）。{prod}、x＝{fmt_num(x)}', 60, 'A②', '比例式の性質', [F(b * c, a) if k != 1 else F(a * c, b)])
    def t3():  # かっこ
        for _ in range(30):
            x = rint(r, 2, 20); k = r.randrange(3)
            if k == 0:
                a = rint(r, -9, 9); b, c = x + a, x
                g = math.gcd(b, c) if b > 0 else 0
                if b <= 0 or g == 0: continue
                s = f'(x{"+" if a > 0 else "−"}{abs(a)}):x={b // g}:{c // g}'; p, q = b // g, c // g
                expl = f'外側の項の積と内側の項の積は等しい。{q}(x{"+" if a > 0 else "−"}{abs(a)})＝{p}x、{sh(q * X + q * a)}＝{p}x、x＝{x}'
            elif k == 1:
                a = r.randint(1, 9); b, c = x, x + a
                g = math.gcd(b, c); p, q = b // g, c // g
                s = f'x:{q * 2}=(x+{a}):{q * 2 * c // b}' if False else f'x:(x+{a})={p}:{q}'
                expl = f'外側の項の積と内側の項の積は等しい。{q}x＝{p}(x+{a})、{sh((q - p) * X)}＝{p * a}、x＝{x}'
            else:
                T = x + r.randint(2, 20); y = T - x; g = math.gcd(x, y); p, q = x // g, y // g
                s = f'x:({T}−x)={p}:{q}'
                expl = f'外側の項の積と内側の項の積は等しい。{q}x＝{p}({T}−x)、{sh((p + q) * X)}＝{p * T}、x＝{x}'
            add(s, x, expl, 61, 'A③', 'かっこがある比例式', [-x], tbnote='例1(2)・問2(4)'); return
    def t4():  # 分数・小数の項
        k = r.randrange(2)
        if k == 0:
            a, c = rfrac(r, (2, 3, 4, 5), 1, 9), rfrac(r, (2, 3, 4), 1, 9); b = r.randint(2, 20)
            x = a * b / c
            if x.denominator > 4: return
            add(f'x:{fmt_num(a)}={b}:{fmt_num(c)}', x, f'外側の項の積と内側の項の積は等しい。{sh(c * X)}＝{ex(a, "×", b)}、x＝{fmt_num(x)}', 61, 'B①(1)', '分数をふくむ比例式', [b * c / a])
        else:
            a, b = rdec(r, 1, 9), rdec(r, 1, 12); c = r.choice([20, 40, 60, 80, 100])
            x = a * c / b
            if x.denominator not in (1, 2, 5, 10): return
            u.add(f'次の比例式を解こう。\n{fmt_num(a, "dec")}:{fmt_num(b, "dec")}=x:{c}', num_answer(x, True), f'外側の項の積と内側の項の積は等しい。{fmt_num(b, "dec")}x＝{fmt_num(a, "dec")}×{c}、x＝{fmt_num(x, "dec")}', 61, 'B①(2)', '小数をふくむ比例式', [ans_str(b * c / a)], tb=101, tbnote='比例式の性質・例1')
            return
            add(f'{fmt_num(a, "dec")}:{fmt_num(b, "dec")}=x:{c}', x, f'外側の項の積と内側の項の積は等しい。{fmt_num(b, "dec")}x＝{fmt_num(a, "dec")}×{c}、x＝{fmt_num(x, "dec")}', 61, 'B①(2)', '小数をふくむ比例式', [b * c / a])
    def t5():  # B+②
        x = rint(r, 1, 6); a, q = rint(r, 1, 9), r.choice([F(1, 4), F(1, 2), F(1, 3), F(2, 3)])
        # (x+a):q = m x:1 → x + a = q m x
        m = (x + a) / (q * x)
        if m.denominator != 1: return
        add(f'(x+{a}):{fmt_num(q)}={m}x:1', F(x), f'外側の項の積と内側の項の積は等しい。(x+{a})×1＝{lit_txt(q, mul=True)}×{m}x、x+{a}＝{sh(q * m * X)}、x＝{x}', 61, 'B+②', 'かっこや分数がふくまれる比例式', [-x])
    def t6():  # 比の値・比例式の判定
        a, b = r.randint(4, 60), r.randint(4, 60)
        if a == b or math.gcd(a, b) == 1: return
        v = F(a, b)
        u.add(f'比 {a}:{b} の比の値を求めよう。', num_answer(v), f'比 a:b の比の値は a/b。{a}/{b} を約分して {fmt_num(v)}', 60, 'A①', '比の値', [ans_str(1 / v)], tb=100, tbnote='比の値')
    plan = [t1] * 12 + [t2] * 15 + [t3] * 17 + [t4] * 13 + [t5] * 9 + [t6] * 4
    return fill(u, plan)

# ---------------- ふりかえりドリル（ワーク p62〜63：方程式。入試問題をふくむ） ----------------
def e6():
    u = Unit('workbook-math-1-eqreview', 'workbook', 'ふりかえりドリル', '方程式',
             '2026-10-05 Claude作成。数学ワークp62〜63（①等式の性質（長野）・②方程式の解き方（熊本）・③かっこがある方程式・④分数をふくむ方程式（大阪）・⑤小数をふくむ方程式（大阪・千葉）・⑥比例式の性質（愛知・千葉））を写真で確認し、教科書p92〜101と照らして作り直した。')
    r = rng(1151)
    def t1():  # 等式の性質（長野）
        a, b = r.randint(2, 9), r.randint(1, 9); c = a * r.randint(1, 6) + b + r.randint(1, a - 1) if a > 1 else 0
        step = r.choice([1, 2])
        opts = [f'等式の両辺に {b} をたしても等式は成り立つから、変形してよい', f'等式の両辺から {b} をひいても等式は成り立つから、変形してよい', f'等式の両辺に {a} をかけても等式は成り立つから、変形してよい', f'等式の両辺を {a} でわっても等式は成り立つから、変形してよい']
        ans = 'イ' if step == 1 else 'エ'
        u.add(f'方程式 {a}x+{b}={c} を、①{a}x+{b}={c} → ②{a}x={c}−{b} → ③{a}x={c - b} → ④x={fmt_num(F(c - b, a))} と解いた。式{"①から式②" if step == 1 else "③から式④"}へ変形してよい理由を、次のア〜エから選び、記号で答えよう。\n' + '\n'.join(f'{LETTERS[i]} {o}' for i, o in enumerate(opts)), choice_answer([ans]),
              f'①から②は、両辺から {b} をひいている（移項）。③から④は、両辺を {a} でわっている。正解：{ans}', 62, '①', '等式の性質', tb=92, tbnote='等式の性質')
    def t2():
        x = nice_sol(r, -9, 9); e = build_eq(r, x)
        if not e: return
        solve_q(u, eq_txt(sh(e[0]), sh(e[1])), e[0], e[1], '移項して ax＝b の形にする。', 62, '②', '方程式の解き方', 95, '例題1')
    def t3():
        for _ in range(30):
            m, n = rint(r, -6, 6), rint(r, -6, 6)
            if abs(m) < 2 or abs(n) < 2: continue
            p1, p2 = lin(r, X, 9, 9), lin(r, X, 4, 9); k = rint(r, -9, 9)
            lhs, rhs = m * p1 + k, n * p2
            v = sol(lhs, rhs)
            if v is None or v.denominator != 1 or abs(v) > 20: continue
            pe = eq_txt(cpar(m, p1) + (('+' if k > 0 else '−') + str(abs(k)) if k else ''), cpar(n, p2))
            if solve_q(u, pe, lhs, rhs, f'かっこをはずしてから移項する。{sh(lhs)}={sh(rhs)}、', 62, '③', 'かっこがある方程式', 96, '例題2'): return
    def t4():
        for _ in range(40):
            d1, d2 = r.choice([(5, 3), (3, 4), (4, 6), (2, 3), (6, 4)])
            p1, p2 = lin(r, X, 9, 9), lin(r, X, 9, 9)
            v = sol(p1 / d1, p2 / d2)
            if v is None or v.denominator != 1 or abs(v) > 30 or not p1.const() or not p2.const(): continue
            L = math.lcm(d1, d2)
            if solve_q(u, eq_txt(f'({sh(p1)})/{d1}', f'({sh(p2)})/{d2}'), p1 / d1, p2 / d2, f'両辺に {L} をかけて分母をはらう。{L // d1}({sh(p1)})＝{L // d2}({sh(p2)})、', 63, '④', '分数をふくむ方程式', 97, '例題3', mul=L): return
    def t5():
        for _ in range(40):
            k = r.randrange(2)
            if k == 0:
                a, c = F(rint(r, -99, 99), 100), F(rint(r, -9, 9), 10); b = F(rint(r, -9, 9))
                if a == c: continue
                x = sol(a * X + b, c * X)
                if x is None or x.denominator != 1 or abs(x) > 40: continue
                pe = eq_txt(f'{fmt_num(a, "dec")}x{"+" if b > 0 else "−"}{abs(b)}' if b else f'{fmt_num(a, "dec")}x', f'{fmt_num(c, "dec")}x')
                if solve_q(u, pe, a * X + b, c * X, '両辺に 100 をかけて係数を整数にする。', 63, '⑤(1)', '小数をふくむ方程式', 97, '話しあおう', mul=100): return
            else:
                m, n = F(rint(r, 1, 9), 10), rint(r, -6, 6); k2 = F(rint(r, -19, 19), 10)
                lhs, rhs = m * (X + n), X + k2
                x = sol(lhs, rhs)
                if x is None or x.denominator != 1 or abs(x) > 40: continue
                pe = eq_txt(f'{fmt_num(m, "dec")}({sh(X + n)})', f'x{"+" if k2 > 0 else "−"}{fmt_num(abs(k2), "dec")}')
                if solve_q(u, pe, lhs, rhs, '両辺に 10 をかけて係数を整数にしてから、かっこをはずす。', 63, '⑤(2)', '小数をふくむ方程式', 97, '話しあおう', mul=10): return
    def t6():
        for _ in range(30):
            k = r.randrange(3); x = rint(r, 2, 30)
            if k == 0:
                a = rint(r, 1, 9); b = r.randint(2, 12)
                lhs_v = x - a; g = math.gcd(abs(lhs_v), b) if lhs_v else 0
                if lhs_v <= 0: continue
                p, q = lhs_v // g, b // g
                s = f'(x−{a}):{b}={p}:{q}'; expl = f'{q}(x−{a})＝{b}×{p}、x＝{x}'
            elif k == 1:
                a, b = r.randint(1, 9), r.randint(1, 9); L1, L2 = x - a, x + b
                if L1 <= 0: continue
                g = math.gcd(L1, L2); p, q = L1 // g, L2 // g
                s = f'{p}:{q}=(x−{a}):(x+{b})'; expl = f'外側の項の積と内側の項の積は等しい。{p}(x+{b})＝{q}(x−{a})、x＝{x}'
            else:
                q1, q2 = r.choice([(F(4, 9), F(1, 2)), (F(2, 3), F(1, 4)), (F(3, 5), F(1, 3))]); m = r.randint(2, 30)
                xv = q1 * m / q2
                if xv.denominator != 1: continue
                s = f'x:{fmt_num(q1)}={m}:{fmt_num(q2)}'; expl = f'{sh(q2 * X)}＝{ex(q1, "×", m)}、x＝{fmt_num(xv)}'; x = xv
            u.add(f'次の比例式を解こう。\n{s}', num_answer(x), f'比例式の性質（外側の項の積＝内側の項の積）を使う。{expl}', 63, '⑥', '比例式の性質', [ans_str(-F(x))], tb=101, tbnote='比例式の性質'); return
    plan = [t1] * 9 + [t2] * 12 + [t3] * 12 + [t4] * 13 + [t5] * 12 + [t6] * 12
    return fill(u, plan)

# ---------------- 方程式の利用①（ワーク p64〜65・教科書 p102〜105：代金・過不足） ----------------
def e7():
    u = Unit('workbook-math-1-equse1', 'workbook', '方程式の利用①', '方程式',
             '2026-10-05 Claude作成。数学ワークp64〜65（A①②代金の問題・A③過不足の問題・B①お皿とお菓子・B+②2種類のノート）と教科書p102〜105（方程式を使って問題を解く手順・例題1・例題2・問1・問2・練習問題1）を写真で確認。', tb=104)
    r = rng(1161)
    def t1():  # 〜は〜の○倍
        k = r.randint(2, 4); n = k + r.randint(1, 4); q = r.choice([60, 80, 100]); x = r.choice(range(100, 301, 10))
        p = k * (x + q) - n * x
        if p <= 0 or p % 10: return
        lhs, rhs = n * X + p, k * (X + q)
        if r.random() < .7:
            u.add(f'ボールペン {n} 本と {p} 円のノート1冊の代金は、ボールペン1本と {q} 円の消しゴム1個の代金の {k} 倍になった。ボールペン1本の値段を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['円']},
                  f'ボールペン1本を x 円とすると、{n}x＋{p}＝{k}(x＋{q})。{move_txt(lhs, rhs)}。この解は問題にあっている。答え {x} 円', 64, 'A①', '代金の問題', [str(x + q), str(-x)], tb=104, tbnote='例題1')
        else:
            u.add(f'ボールペン {n} 本と {p} 円のノート1冊の代金は、ボールペン1本と {q} 円の消しゴム1個の代金の {k} 倍になった。ボールペン1本の値段を x 円として、方程式をつくろう。', relation_answer(f'{n}x+{p}={k}(x+{q})'),
                  f'（ボールペン{n}本とノート1冊の代金）＝（ボールペン1本と消しゴム1個の代金）×{k}。{n}x＋{p}＝{k}(x＋{q})', 64, 'A①(2)', '代金の問題（方程式をつくる）', [f'{n}x+{p}={k}x+{q}', f'{n}x+{p}={k}(x−{q})'], tb=104, tbnote='例題1')
    def t2():  # 残金
        k = r.randint(2, 3); x = r.choice(range(200, 501, 10)); b = x + r.choice(range(80, 301, 10)); a = k * (b - x) + x
        if r.random() < .75:
            u.add(f'Aさんは {a} 円、Bさんは {b} 円持っていて、2人とも同じ値段の弁当を買った。すると、Aさんの残金は、Bさんの残金の {k} 倍になった。弁当1個の値段を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['円']},
                  f'弁当1個を x 円とすると、{a}−x＝{k}({b}−x)。{move_txt(a - X, k * (b - X))}。答え {x} 円', 64, 'A②', '残金の問題', [str(b - x), str(a - x)], tb=104, tbnote='問1')
        else:
            u.add(f'Aさんは {a} 円、Bさんは {b} 円持っていて、2人とも同じ値段の弁当を買った。すると、Aさんの残金は、Bさんの残金の {k} 倍になった。弁当1個の値段を x 円として、方程式をつくろう。', relation_answer(f'{a}−x={k}({b}−x)'),
                  f'（Aさんの残金）＝（Bさんの残金）×{k}。{a}−x＝{k}({b}−x)', 64, 'A②(2)', '残金の問題（方程式をつくる）', [f'{a}−x={k}{b}−x', f'{k}({a}−x)={b}−x'], tb=104, tbnote='問1')
    def t3():  # 過不足（人数）
        p, q = sorted(r.sample(range(3, 9), 2)); x = r.randint(6, 30); rem = r.randint(2, 15)
        total = p * x + rem; short = q * x - total
        if short <= 0: return
        ask = r.choice(['生徒の人数', '画用紙の枚数'])
        v = x if ask == '生徒の人数' else total
        u.add(f'何人かの生徒で、画用紙を同じ数ずつ分ける。1人に {p} 枚ずつ分けると {rem} 枚余り、{q} 枚ずつ分けると {short} 枚たりない。{ask}を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['人', '枚']},
              f'生徒の人数を x 人とすると、画用紙の枚数は2通りに表せる：{p}x＋{rem}＝{q}x−{short}。{move_txt(p * X + rem, q * X - short)}。画用紙は {p}×{x}＋{rem}＝{total} 枚。', 65, 'A③', '過不足の問題', [str(total if ask == '生徒の人数' else x)], tb=105, tbnote='例題2・問2')
    def t4():  # お皿とお菓子（B①）
        p, q = r.choice([(4, 6), (3, 5), (5, 7), (4, 7)]); x = r.randint(5, 15); rem = r.randint(2, 15); last = r.randint(1, q - 1)
        total = p * x + rem
        if q * (x - 1) + last != total: 
            # 条件に合うように rem を決め直す
            rem = q * (x - 1) + last - p * x
            if rem <= 0: return
            total = p * x + rem
        ask = r.choice(['お皿の枚数', 'お菓子の個数'])
        v = x if ask == 'お皿の枚数' else total
        u.add(f'お皿を何枚か並べる。お皿1枚に {p} 個ずつお菓子をのせると {rem} 個余り、{q} 個ずつのせると {last} 個だけのったお皿が1枚できた（ほかのお皿には {q} 個ずつのった）。{ask}を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['枚', '個']},
              f'お皿を x 枚とすると、お菓子の個数は {p}x＋{rem}（個）、または {q}(x−1)＋{last}（個）。{p}x＋{rem}＝{q}(x−1)＋{last}、{move_txt(p * X + rem, q * (X - 1) + last)}。お菓子は {total} 個。', 65, 'B①', '過不足の問題', [str(total if ask == 'お皿の枚数' else x)], tb=105, tbnote='例題2')
    def t5():  # 2種類のノート（B+②）
        a, b = r.choice([(120, 90), (150, 100), (130, 80), (110, 70)]); n = r.randint(6, 12); x = r.randint(2, n - 2)
        pay = r.choice([1000, 1500, 2000]); cost = a * x + b * (n - x); change = pay - cost
        if change <= 0: return
        ask = r.choice([f'1冊 {a} 円のノート', f'1冊 {b} 円のノート'])
        v = x if str(a) in ask else n - x
        u.add(f'{pay} 円を出して、1冊 {a} 円のノートと1冊 {b} 円のノートをあわせて {n} 冊買うと、おつりが {change} 円だった。{ask}を何冊買ったか求めよう。', {'kind': 'number', 'value': str(v), 'units': ['冊']},
              f'{a} 円のノートを x 冊とすると、{b} 円のノートは ({n}−x) 冊。{pay}−{{{a}x＋{b}({n}−x)}}＝{change}。{move_txt(pay - (a * X + b * (n - X)), Poly.of(change))}。{a} 円のノートは {x} 冊、{b} 円のノートは {n - x} 冊。', 65, 'B+②', '代金の問題', [str(n - v)], tb=104, tbnote='例題1')
    def t6():  # ケーキの値段（教科書 p102）
        n, j, ch = r.randint(3, 7), r.choice([150, 200, 120]), r.choice([50, 30, 100]); x = r.choice(range(200, 401, 10))
        pay = n * x + j + ch
        if pay % 500: pay2 = (pay // 500 + 1) * 500; ch = pay2 - n * x - j; pay = pay2
        u.add(f'{pay} 円で、ケーキ {n} 個と {j} 円のジュースを1本買うと、おつりが {ch} 円だった。ケーキ1個の値段を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['円']},
              f'ケーキ1個を x 円とすると、（出したお金）−（代金の合計）＝（おつり）より {pay}−({n}x＋{j})＝{ch}。{move_txt(pay - (n * X + j), Poly.of(ch))}。答え {x} 円', 64, 'A①', '代金の問題', [str(x + j)], tb=102, tbnote='方程式を使って問題を解く手順')
    def t7():  # 背番号（練習問題1）
        x = r.randint(3, 30); a, b = r.choice([(2, 5), (3, 5), (2, 4), (3, 7)]); p = r.randint(1, 15)
        q = b * x - a * x - p
        if q <= 0: return
        u.add(f'あるバスケットボール選手が「私の背番号は、{a}倍して {p} をたしても、{b}倍して {q} をひいても、同じになる数だよ」といった。この選手の背番号を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['番']},
              f'背番号を x とすると {a}x＋{p}＝{b}x−{q}。{move_txt(a * X + p, b * X - q)}', 64, 'A①', '数の問題', [str(-x)], tb=106, tbnote='練習問題1')
    plan = [t1] * 14 + [t2] * 12 + [t3] * 12 + [t4] * 10 + [t5] * 10 + [t6] * 6 + [t7] * 6
    return fill(u, plan)

# ---------------- 方程式の利用②（ワーク p66〜67・教科書 p106〜108：速さ・割合） ----------------
def e8():
    u = Unit('workbook-math-1-equse2', 'workbook', '方程式の利用②', '方程式',
             '2026-10-05 Claude作成。数学ワークp66〜67（A①速さ・時間・道のりの問題・A②割合の問題・B①おとなと子どもの人数・B+②かかった時間の差と道のり）と教科書p106〜108（何分後に弟に追いつくかな？・練習問題2）を写真で確認。', tb=106)
    r = rng(1171)
    def catch(r):
        v1, v2 = r.choice([(50, 80), (70, 210), (60, 200), (80, 240), (60, 90), (50, 150)])
        m = r.choice([6, 9, 10, 12, 14, 15, 20])
        x = F(v1 * m, v2 - v1)
        return (v1, v2, m, x) if x.denominator == 1 else None
    def t1():
        c = catch(r)
        if not c: return
        v1, v2, m, x = c
        u.add(f'弟が家を出発した。その {m} 分後に、姉が家を出発して同じ道を追いかけた。弟は分速 {v1} m、姉は分速 {v2} m で進むとすると、姉は出発してから何分後に弟に追いつくか求めよう。', {'kind': 'number', 'value': str(x), 'units': ['分', '分後']},
              f'姉が出発してから x 分後に追いつくとすると、追いついたとき2人の進んだ道のりは等しい。{v2}x＝{v1}({m}＋x)。{move_txt(v2 * X, v1 * (m + X))}。答え {x} 分後', 66, 'A①', '速さ・時間・道のりの問題', [str(x + m), str(F(v1 * m, v2))], tb=107, tbnote='解答')
    def t2():
        c = catch(r)
        if not c: return
        v1, v2, m, x = c; d = v2 * x
        u.add(f'弟が家を出発した。その {m} 分後に、姉が同じ道を追いかけた。弟は分速 {v1} m、姉は分速 {v2} m で進む。姉が弟に追いつくのは、家から何 m のところか求めよう。', {'kind': 'number', 'value': str(d), 'units': ['m']},
              f'姉が出発してから x 分後に追いつくとすると {v2}x＝{v1}({m}＋x)、x＝{x}。道のりは {v2}×{x}＝{d}（m）。', 66, 'A①(5)', '速さ・時間・道のりの問題', [str(v1 * x), str(x)], tb=107, tbnote='家から何mのところで追いついたかな')
    def t3():  # 表の欄（式）
        c = catch(r)
        if not c: return
        v1, v2, m, x = c
        k = r.randrange(3)
        cell, ans_, nr = [(f'姉が x 分間に進んだ道のり（m）', f'{v2}x', [f'{v1}x']), (f'弟が進んだ時間（分）', f'x+{m}', [f'x−{m}']), (f'弟が進んだ道のり（m）', f'{v1}(x+{m})', [f'{v1}x+{m}', f'{v1}x'])][k]
        u.add(f'弟が家を出発してから {m} 分後に、姉が同じ道を追いかける。弟は分速 {v1} m、姉は分速 {v2} m で進み、姉が出発してから x 分後に弟に追いつくとする。{cell}を、x を使った式で表そう。', expr_answer(ans_, form='any'),
              f'（道のり）＝（速さ）×（時間）。弟は姉より {m} 分早く出発しているので、弟の進んだ時間は (x＋{m}) 分。答え {ans_}', 66, 'A①(2)', '速さ・時間・道のり（表に整理する）', nr, tb=107, tbnote='表')
    def t4():  # 割合（来場者）
        p = r.choice([40, 50, 60, 75, 80]); q = r.choice([10, 20, 30, 40]); sun = r.choice(range(100, 401, 20))
        sat = sun * p // 100 + q
        if sun * p % 100: return
        N = sun + sat
        ask = r.choice(['土曜日', '日曜日'])
        v = sat if ask == '土曜日' else sun
        u.add(f'ある週の美術館の来場者の人数は、土曜日と日曜日をあわせて {N} 人だった。土曜日の来場者の人数は、日曜日の来場者の人数の {p}% より {q} 人多かった。{ask}の来場者の人数を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['人']},
              f'日曜日を x 人とすると、土曜日は ({N}−x) 人。{N}−x＝({p}/100)x＋{q}。両辺に 100 をかけて解くと x＝{sun}。土曜日は {sat} 人。', 67, 'A②', '割合の問題', [str(N - v)], tb=108, tbnote='練習問題2')
    def t5():  # B①
        p = r.choice([70, 60, 80, 50]); d = r.choice([26, 20, 30, 14]); c = r.choice(range(100, 301, 10))
        a = c * p // 100 + d
        if c * p % 100: return
        N = a + c
        ask = r.choice(['おとな', '子ども'])
        v = a if ask == 'おとな' else c
        u.add(f'あるイベントの参加人数は、おとなと子どもをあわせて {N} 人で、おとなの人数は子どもの人数の {p}% より {d} 人多い。{ask}の参加人数を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['人']},
              f'子どもを x 人とすると、おとなは {{({p}/100)x＋{d}}} 人。x＋({p}/100)x＋{d}＝{N}、両辺に 100 をかけて解くと x＝{c}。おとなは {a} 人。', 67, 'B①', '割合の問題', [str(N - v)], tb=108, tbnote='練習問題2')
    def t6():  # B+② 時間の差から道のり
        v1, v2 = r.choice([(60, 80), (50, 75), (60, 90), (40, 60), (70, 210)])
        t = r.choice([5, 6, 8, 10, 12])
        x = F(t * v1 * v2, v2 - v1)
        if x.denominator != 1: return
        k = r.randrange(2)
        if k == 0:
            u.add(f'家から駅まで、分速 {v1} m で歩いたときと、分速 {v2} m で歩いたときでは、かかった時間が {t} 分違った。家から駅までの道のりを求めよう。', {'kind': 'number', 'value': str(x), 'units': ['m']},
                  f'道のりを x m とすると、かかる時間は x/{v1} 分と x/{v2} 分。x/{v1}−x/{v2}＝{t}、両辺に {math.lcm(v1, v2)} をかけて解くと x＝{x}。', 67, 'B+②', '速さ・時間・道のりの問題', [str(x // 2), str(t * (v2 - v1))], tb=107, tbnote='速さ・時間・道のり')
        else:
            tt = x / v1
            u.add(f'家から駅まで、分速 {v1} m で歩いたときと、分速 {v2} m で歩いたときでは、かかった時間が {t} 分違った。分速 {v1} m で歩いたときにかかった時間を求めよう。', {'kind': 'number', 'value': str(tt), 'units': ['分']},
                  f'分速 {v1} m でかかった時間を x 分とすると、分速 {v2} m では (x−{t}) 分。道のりは等しいので {v1}x＝{v2}(x−{t})。{move_txt(v1 * X, v2 * (X - t))}', 67, 'B+②(2)', '速さ・時間・道のりの問題', [str(tt - t)], tb=107, tbnote='速さ・時間・道のり')
    def t7():  # 追いつけるか
        c = catch(r)
        if not c: return
        v1, v2, m, x = c; d = v2 * x; D = r.choice([d - 200, d + 200, d - 400, d + 500])
        if D <= v1 * m: return
        can = d <= D
        u.add(f'弟が {D} m 離れた駅に向かって家を出発した。その {m} 分後に、姉が同じ道を分速 {v2} m で追いかけた。弟は分速 {v1} m で進む。姉は、弟が駅に着くまでに追いつけるか。「ア 追いつける」「イ 追いつけない」から選び、記号で答えよう。', choice_answer(['ア' if can else 'イ']),
              f'追いつくのは姉が出発して {x} 分後で、家から {d} m のところ。駅までは {D} m なので、{"駅に着く前に追いつける" if can else "追いつく前に弟は駅に着いてしまう"}。正解：{"ア" if can else "イ"}', 66, 'A①', '方程式の解が問題にあっているか', tb=107, tbnote='深める例・条件をかえる')
    def t8():  # A小学校・B小学校（練習問題2）
        p = r.choice([80, 60, 75, 50]); d = r.choice([54, 30, 20, 12]); b = r.choice(range(100, 301, 10))
        a = b * p // 100 + d
        if b * p % 100: return
        N = a + b
        u.add(f'ある中学校の生徒数は {N} 人で、A小学校とB小学校の2校から入学してきた。A小学校から入学してきた生徒の人数は、B小学校から入学してきた生徒の人数の {p}% より {d} 人多い。A小学校から入学してきた生徒の人数を求めよう。', {'kind': 'number', 'value': str(a), 'units': ['人']},
              f'B小学校から入学してきた生徒を x 人とすると、A小学校は {{({p}/100)x＋{d}}} 人。x＋({p}/100)x＋{d}＝{N}、x＝{b}。A小学校は {a} 人。', 67, 'A②', '割合の問題', [str(b)], tb=108, tbnote='練習問題2')
    plan = [t1] * 12 + [t2] * 8 + [t3] * 8 + [t4] * 10 + [t5] * 9 + [t6] * 10 + [t7] * 6 + [t8] * 7
    return fill(u, plan)

# ---------------- 比例式の利用（ワーク p68・教科書 p109） ----------------
def e9():
    u = Unit('workbook-math-1-ratiouse', 'workbook', '比例式の利用', '方程式',
             '2026-10-05 Claude作成。数学ワークp68（A①ドレッシング・B①小麦粉とバター・B+②姉と弟の折り紙）と教科書p109（例題1 クッキー・問1 コーヒー牛乳）を写真で確認。', tb=109)
    r = rng(1181)
    def t1():
        p, q = r.sample(range(1, 7), 2); g = math.gcd(p, q); p, q = p // g, q // g; k = r.choice([20, 30, 40, 50, 60])
        T = (p + q) * k; x = q * k
        k2 = r.randrange(3)
        if k2 < 2:
            u.add(f'ドレッシングを {T} mL つくる。サラダ油と酢を {p}:{q} の割合で混ぜるとき、必要な酢の量を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['mL']},
                  f'酢を x mL とすると、サラダ油は ({T}−x) mL。({T}−x):x＝{p}:{q}、{p}x＝{"" if q == 1 else q}({T}−x)、x＝{x}', 68, 'A①', '比例式の利用', [str(T - x), str(p * k)], tb=109, tbnote='例題1')
        else:
            u.add(f'ドレッシングを {T} mL つくる。サラダ油と酢を {p}:{q} の割合で混ぜる。必要な酢の量を x mL とするとき、必要なサラダ油の量を x を使った式で表そう。', expr_answer(f'{T}−x', units=['mL']),
                  f'全体が {T} mL なので、サラダ油は ({T}−x) mL。', 68, 'A①(1)', '比例式の利用', [f'x−{T}', f'{T}+x'], tb=109, tbnote='例題1')
    def t2():
        F0, B0 = r.choice([(80, 20), (152, 32), (100, 40), (120, 30), (90, 30)]); p, q = r.choice([(5, 2), (7, 2), (3, 1), (4, 1), (2, 1), (7, 3)])
        x = F(p * B0 - q * F0, q - p)
        if x.denominator != 1 or x <= 0: return
        u.add(f'小麦粉が {F0} g、バターが {B0} g ある。これらに、それぞれ同じ量の小麦粉とバターを加えてから混ぜあわせ、小麦粉とバターの量の比が {p}:{q} となるクッキーの生地をつくる。小麦粉とバターを、それぞれ何 g ずつ加えればよいか求めよう。', {'kind': 'number', 'value': str(x), 'units': ['g']},
              f'それぞれ x g ずつ加えるとすると、({F0}＋x):({B0}＋x)＝{p}:{q}。{"" if q == 1 else q}({F0}＋x)＝{p}({B0}＋x)、{move_txt(q * (F0 + X), p * (B0 + X))}', 68, 'B①', '比例式の利用', [str(-x)], tb=109, tbnote='例題1')
    def t3():
        n = r.choice([50, 40, 60, 30]); p, q = r.choice([(11, 14), (3, 5), (2, 3), (7, 9), (4, 7)])
        x = F(n * (p - q), -(p + q)) if False else F(n * (q - p), p + q)
        if x.denominator != 1 or x <= 0 or x >= n: return
        u.add(f'姉と弟が折り紙を {n} 枚ずつ持っていた。姉が弟に何枚かあげたら、姉と弟の持っている折り紙の枚数の比は {p}:{q} になった。姉が弟にあげた折り紙の枚数を求めよう。', {'kind': 'number', 'value': str(x), 'units': ['枚']},
              f'あげた枚数を x 枚とすると、({n}−x):({n}＋x)＝{p}:{q}。{q}({n}−x)＝{p}({n}＋x)、{move_txt(q * (n - X), p * (n + X))}', 68, 'B+②', '比例式の利用', [str(n - x)], tb=109, tbnote='例題1')
    def t4():
        A0 = r.choice([400, 300, 500]); move = r.choice([100, 200]); p, q = r.choice([(5, 2), (3, 1), (4, 1), (2, 1), (3, 2)])
        y = F(q * (A0 + move), p) + move
        if y.denominator != 1: return
        u.add(f'Aの容器に牛乳が {A0} mL、Bの容器にコーヒーが何 mL かはいっている。Bの容器からコーヒーを {move} mL 取り出して、Aの容器に入れたところ、Aの容器のコーヒー牛乳とBの容器のコーヒーの量の比が {p}:{q} になった。はじめに、Bの容器には何 mL のコーヒーがはいっていたか求めよう。', {'kind': 'number', 'value': str(y), 'units': ['mL']},
              f'はじめのコーヒーを x mL とすると、({A0}＋{move}):(x−{move})＝{p}:{q}。{p}(x−{move})＝{q}×{A0 + move}、x＝{y}', 68, 'A①', '比例式の利用', [str(y - move), str(y - 2 * move)], tb=109, tbnote='問1')
    def t5():
        p, q = r.choice([(3, 2), (2, 3), (5, 3), (4, 1), (3, 4)]); T = (p + q) * r.choice([50, 30, 40, 25])
        x = F(T * q, p + q)
        ask = r.choice(['牛乳', 'コーヒー'])
        v = x if ask == '牛乳' else T - x
        u.add(f'コーヒー牛乳を {T} mL つくる。コーヒーと牛乳を {p}:{q} の割合で混ぜるとき、{ask}は何 mL 必要か求めよう。', {'kind': 'number', 'value': str(v), 'units': ['mL']},
              f'牛乳を x mL とすると、コーヒーは ({T}−x) mL。({T}−x):x＝{p}:{q}、{p}x＝{"" if q == 1 else q}({T}−x)、x＝{x}。コーヒーは {T - x} mL。', 68, 'A①', '比例式の利用', [str(T - v)], tb=109, tbnote='例題1')
    plan = [t1] * 16 + [t2] * 14 + [t3] * 14 + [t4] * 12 + [t5] * 14
    return fill(u, plan)

# ---------------- ふりかえりドリル（方程式の利用）（ワーク p69：入試問題） ----------------
def e10():
    u = Unit('workbook-math-1-equsereview', 'workbook', 'ふりかえりドリル（方程式の利用）', '方程式',
             '2026-10-05 Claude作成。数学ワークp69（①過不足の問題（三重・茨城）・②速さ・時間・道のりの問題（千葉）・③比例式の利用（宮崎））を写真で確認し、教科書p104〜109と照らして作り直した。単元一覧に未登録だったため追加した小単元。', tb=105)
    r = rng(1191)
    def t1():  # 三重：持っている金額
        n1, n2 = r.choice([(24, 20), (15, 12), (30, 25), (18, 14)]); s, l = r.choice([100, 60, 80]), r.choice([40, 20, 70])
        x = F(s + l, n1 - n2)
        if x.denominator != 1: return
        money = n2 * x + l
        ask = r.choice(['持っていた金額', 'チョコレート1個の値段'])
        v = money if ask == '持っていた金額' else x
        u.add(f'けいこさんは、ある店で同じチョコレートを {n1} 個買おうとしたが、持っていた金額では {s} 円たりなかった。そこで {n2} 個買うことにしたら {l} 円余った。{ask}を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['円']},
              f'チョコレート1個を x 円とすると、持っていた金額は {n1}x−{s}（円）、{n2}x＋{l}（円）と表せる。{n1}x−{s}＝{n2}x＋{l}、x＝{x}。持っていた金額は {money} 円。', 69, '①(1)', '過不足の問題', [str(money if v == x else x), str(n1 * x)], tb=105, tbnote='例題2')
    def t2():  # 茨城：箱
        p, q = r.choice([(30, 35), (20, 24), (25, 30), (12, 15)]); x = r.randint(4, 15); last = r.randint(1, q - 1)
        rem = q * (x - 1) + last - p * x
        if rem <= 0: return
        ask = r.choice(['箱の個数', 'チョコレートの個数'])
        tot = p * x + rem
        v = x if ask == '箱の個数' else tot
        u.add(f'チョコレートが何個かと、それを入れる箱が何個かある。1個の箱にチョコレートを {p} 個ずつ入れたところ、すべての箱に入れてもチョコレートは {rem} 個余った。そこで、1個の箱に {q} 個ずつ入れていったところ、最後の箱は {last} 個になった。{ask}を求めよう。', {'kind': 'number', 'value': str(v), 'units': ['個']},
              f'箱を x 個とすると、{p}x＋{rem}＝{q}(x−1)＋{last}。{move_txt(p * X + rem, q * (X - 1) + last)}。チョコレートは {tot} 個。', 69, '①(2)', '過不足の問題', [str(tot if v == x else x)], tb=105, tbnote='例題2')
    def t3():  # 千葉：追いつく
        v1, v2 = r.choice([(60, 200), (80, 240), (70, 210), (60, 180)]); m = r.choice([10, 14, 15, 20, 12])
        x = F(v1 * m, v2 - v1)
        if x.denominator != 1: return
        D = v2 * x + r.choice([100, 300, 600])
        u.add(f'あきこさんは、{fmt_num(F(D, 1000), "dec")} km 離れた駅に向けて家を出発した。それから {m} 分後に、お父さんは自転車で家を出発し、同じ道を通って駅に向かった。あきこさんは分速 {v1} m、お父さんは分速 {v2} m でそれぞれ一定の速さで進むとすると、お父さんが家を出発してから何分後にあきこさんに追いつくか求めよう。', {'kind': 'number', 'value': str(x), 'units': ['分', '分後']},
              f'お父さんが出発して x 分後に追いつくとすると {v2}x＝{v1}({m}＋x)、x＝{x}。追いつくのは家から {v2 * x} m のところで、駅（{D} m）より手前なので問題にあっている。', 69, '②', '速さ・時間・道のりの問題', [str(x + m)], tb=107, tbnote='解答')
    def t4():  # 宮崎：おはじき
        A0, mv = r.choice([(25, 14), (30, 10), (20, 16), (35, 15)]); p, q = r.choice([(3, 2), (4, 3), (5, 2), (2, 1)])
        y = F(q * (A0 + mv), p) + mv
        if y.denominator != 1: return
        u.add(f'おはじきが、はじめにAの袋に {A0} 個、Bの袋に何個かはいっている。Bの袋から {mv} 個取り出してAの袋に移したところ、AとBの袋の中のおはじきの個数の比が {p}:{q} になった。はじめにBの袋にはいっていたおはじきは何個か求めよう。', {'kind': 'number', 'value': str(y), 'units': ['個']},
              f'はじめのBの個数を x 個とすると、({A0}＋{mv}):(x−{mv})＝{p}:{q}、{p}(x−{mv})＝{q}×{A0 + mv}、x＝{y}', 69, '③', '比例式の利用', [str(y - mv), str(y - 2 * mv)], tb=109, tbnote='問1')
    plan = [t1] * 18 + [t2] * 18 + [t3] * 17 + [t4] * 17
    return fill(u, plan)
