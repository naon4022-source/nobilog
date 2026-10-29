from fractions import Fraction as F
from expr import Lit, Chain, L, D, dec_str

def rint(r, lo, hi, nonzero=True):
    while True:
        x = r.randint(lo, hi)
        if not (nonzero and x == 0): return x

def rfrac(r, dens=(2, 3, 4, 5, 6, 8, 9, 10, 12), lo=1, hi=11, sign=True):
    while True:
        d = r.choice(dens); n = r.randint(lo, hi)
        v = F(n, d)
        if v.denominator == 1: continue
        if sign and r.random() < 0.5: v = -v
        return v

def rdec(r, lo, hi, places=1, nonzero=True):
    while True:
        x = F(r.randint(int(lo * 10 ** places), int(hi * 10 ** places)), 10 ** places)
        if x.denominator == 1: continue
        if nonzero and x == 0: continue
        return x

def lit(v, kind=None):
    v = F(v)
    if kind == 'dec' or (kind is None and v.denominator != 1 and dec_str(abs(v)) and v.denominator in (10, 100, 2, 4, 5, 20, 25, 50)):
        if kind == 'dec': return Lit(v, 'dec')
    return L(v, kind)

def sum_chain(r, contribs, kinds=None, simple=0.5):
    """寄与（足される量）の並びから、かっこつき・かっこなしをまぜた加減の式を作る"""
    kinds = kinds or ['int'] * len(contribs)
    c0 = F(contribs[0])
    first = Lit(c0, kinds[0])
    rest = []
    for c, k in zip(contribs[1:], kinds[1:]):
        c = F(c)
        if r.random() < simple and k != 'frac':
            rest.append(('+', Lit(c, k)) if c > 0 else ('−', Lit(-c, k)))
        else:
            if r.random() < 0.5: rest.append(('+', Lit(c, k)))
            else: rest.append(('−', Lit(-c, k)))
    return Chain(first, *rest)
