"""小単元づくりの共通部品"""
import itertools, math
from fractions import Fraction as F
from bank import Unit, expr_q, num_answer, nums_answer, choice_answer, exact_answer, rng, explain
from helpers import rint, rfrac, rdec, sum_chain
from expr import C, L, D, Lit, Grp, Pow, Neg, show, fmt_num, ans_str

def nice(v, dmax=12, amax=400): return v.denominator <= dmax and abs(v) <= amax

def fill(u, plan, limit=40000):
    """plan の作り方を順番にくり返して70問そろえる（同じ問題文は入らない）"""
    i = 0
    while len(u.qs) < 70:
        try: plan[i % len(plan)]()
        except (ZeroDivisionError, IndexError, ValueError): pass
        i += 1
        if i > limit: raise SystemExit(f'{u.uid}: {len(u.qs)}問しか作れない')
    u.qs = u.qs[:70]
    for k, q in enumerate(u.qs, 1): q['id'] = f'{u.uid}-{k}'
    return u

def numlit(r, kinds=('int', 'dec', 'frac'), lo=-12, hi=12):
    k = r.choice(kinds)
    if k == 'int': return Lit(F(rint(r, lo, hi)), 'int')
    if k == 'dec': return Lit(rdec(r, lo / 2, hi / 2), 'dec')
    return Lit(rfrac(r, (2, 3, 4, 5, 6, 8, 9), 1, 11), 'frac')

def lit_txt(v, lead=False, dec=False, mul=False):
    """数を式の中の書き方で（途中の負の数はかっこ。mul=True はかけ算・わり算の中の書き方）。整数でなければ分数（dec=True で有限小数）"""
    v = F(v); k = 'int' if v.denominator == 1 else ('dec' if dec and v.denominator in (2, 4, 5, 10, 20, 25, 50, 100) else 'frac')
    return Lit(v, k).render(lead, mul)

LETTERS = 'アイウエオカキク'

def ex(*parts, dec=False):
    """C(...) と同じ並びで、式を教科書の書き方の文字にする。数は Fraction/int（整数でなければ分数。dec=True で有限小数）"""
    from expr import dec_str
    items = []
    for i, p in enumerate(parts):
        if i % 2 == 1: items.append(p)
        elif isinstance(p, Lit): items.append(p)
        else:
            v = F(p); items.append(Lit(v, 'int' if v.denominator == 1 else ('dec' if dec and dec_str(abs(v)) else 'frac')))
    return show(C(*items))
