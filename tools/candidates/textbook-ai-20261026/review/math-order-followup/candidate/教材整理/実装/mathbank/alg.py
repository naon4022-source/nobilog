"""文字式（多項式）：計算は分数で正確に、表示は教科書の書き方（3x−5、a²b、2x/3、−ab³）"""
from fractions import Fraction as F
SUP = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
M = '−'

class P:
    """多項式。{('a','b'): 係数} のように、文字（並べたもの）→係数"""
    def __init__(self, terms=None):
        self.t = {}
        for k, v in (terms or {}).items():
            v = F(v)
            if v: self.t[tuple(sorted(k))] = self.t.get(tuple(sorted(k)), 0) + v
        self.t = {k: v for k, v in self.t.items() if v}
    @staticmethod
    def of(x):
        if isinstance(x, P): return x
        return P({(): F(x)})
    def __add__(self, o):
        o = P.of(o); r = dict(self.t)
        for k, v in o.t.items(): r[k] = r.get(k, 0) + v
        return P(r)
    __radd__ = __add__
    def __neg__(self): return P({k: -v for k, v in self.t.items()})
    def __sub__(self, o): return self + (-P.of(o))
    def __rsub__(self, o): return P.of(o) - self
    def __mul__(self, o):
        o = P.of(o); r = {}
        for a, x in self.t.items():
            for b, y in o.t.items():
                k = tuple(sorted(a + b)); r[k] = r.get(k, 0) + x * y
        return P(r)
    __rmul__ = __mul__
    def __truediv__(self, o): return self * P.of(1 / F(o))
    def __eq__(self, o): return isinstance(o, P) and self.t == o.t
    def __hash__(self): return hash(tuple(sorted(self.t.items())))
    def val(self, **env):
        s = F(0)
        for k, v in self.t.items():
            x = v
            for ch in k: x *= F(env[ch])
            s += x
        return s
    def coef(self, *letters): return self.t.get(tuple(sorted(letters)), F(0))
    def const(self): return self.t.get((), F(0))
    def terms(self):
        """表示の順：文字の項（アルファベット順・次数の高い順）→ 数の項"""
        keys = sorted(self.t, key=lambda k: (len(k) == 0, k[:1] if k else ('~',), -len(k), k))
        return [(k, self.t[k]) for k in keys]
    def is_num(self): return all(k == () for k in self.t)

def letters_txt(k):
    out = ''
    for ch in sorted(set(k)):
        n = k.count(ch); out += ch + (str(n).translate(SUP) if n > 1 else '')
    return out

def term_txt(k, v, first):
    """1つの項（符号つき）。分数の係数は 2x/3 の形"""
    neg = v < 0; a = abs(v); lt = letters_txt(k)
    if not lt: body = str(a.numerator) if a.denominator == 1 else f'{a.numerator}/{a.denominator}'
    elif a.denominator == 1: body = ('' if a.numerator == 1 else str(a.numerator)) + lt
    else: body = ('' if a.numerator == 1 else str(a.numerator)) + lt + f'/{a.denominator}'
    if first: return (M if neg else '') + body
    return (M if neg else '+') + body

def show(p):
    p = P.of(p)
    if not p.t: return '0'
    return ''.join(term_txt(k, v, i == 0) for i, (k, v) in enumerate(p.terms()))

def ans(p):
    """採点用の答え（エンジンが読める形：− も ² もそのままでよい）"""
    return show(p)

def var(ch): return P({(ch,): 1})

def paren(p):
    """かっこつき表示 (3x−5)。数だけ・1つの項なら符号に応じて"""
    s = show(p)
    return '(' + s + ')'

def coef_txt(c, lead=False):
    """かけ算の前の数（式の外側）：3(…)、−2(…)、1/2(…)"""
    c = F(c)
    s = (str(abs(c.numerator)) if c.denominator == 1 else f'{abs(c.numerator)}/{c.denominator}')
    if c < 0: return M + s if lead else '(' + M + s + ')'
    return s

def num(c, lead=False):
    """式の中の数（負ならかっこ）"""
    c = F(c); s = str(abs(c.numerator)) if c.denominator == 1 else f'{abs(c.numerator)}/{c.denominator}'
    if c < 0: return (M + s) if lead else '(' + M + s + ')'
    return s

def expand_terms(parts):
    """[(係数, 式)] を、まとめる前の項の並びにする（分配法則でかっこをはずした形）"""
    out = []
    for c, p in parts:
        for k, v in P.of(p).terms(): out.append((k, F(c) * v))
    return out

def terms_txt(terms):
    terms = [(k, v) for k, v in terms if v != 0]
    if not terms: return '0'
    return ''.join(term_txt(k, v, i == 0) for i, (k, v) in enumerate(terms))

def collect(parts):
    s = P.of(0)
    for c, p in parts: s = s + F(c) * P.of(p)
    return s

def steps_txt(start, parts):
    """start ＝ かっこをはずした形 ＝ まとめた形"""
    mid = terms_txt(expand_terms(parts)); end = show(collect(parts))
    seq = [start, mid, end]; out = []
    for t in seq:
        if not out or out[-1] != t: out.append(t)
    return ' ＝ '.join(out)
