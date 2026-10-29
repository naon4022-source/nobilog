"""式を組み立てて、表示（中学の教科書の書き方）と値（分数で正確に）を同時に作る。
よくある計算ミス（左から順に計算・−3²を(−3)²とする）の値も出して「惜しい（△）」の判定に使う。"""
from fractions import Fraction as F

SUP = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
MINUS = '−'

def fmt_num(v: F, kind='auto'):
    """答えや表の数を表示用の文字にする（分数は p/q、小数は有限小数のときだけ）"""
    sign = MINUS if v < 0 else ''
    a = abs(v)
    if a.denominator == 1:
        return sign + str(a.numerator)
    if kind == 'dec':
        s = dec_str(a)
        if s is not None:
            return sign + s
    return sign + f'{a.numerator}/{a.denominator}'

def dec_str(a: F):
    d = a.denominator
    k = 0
    while d % 2 == 0: d //= 2; k += 1
    m = 0
    while d % 5 == 0: d //= 5; m += 1
    if d != 1: return None
    n = max(k, m)
    s = str(a.numerator * 10 ** n // a.denominator)
    if n == 0: return s
    s = s.rjust(n + 1, '0')
    return (s[:-n] + '.' + s[-n:]).rstrip('0').rstrip('.')

def ans_str(v: F):
    """採点用（半角）。分数は 'p/q'。"""
    if v.denominator == 1: return str(v.numerator)
    return f'{v.numerator}/{v.denominator}'

class E:
    prec = 9
    def lead(self): return self.render(True)

class Lit(E):
    def __init__(self, v, kind='int'):
        self.v = F(v); self.kind = kind
    def val(self, mode='ok'): return self.v
    def render(self, leading=False, mul=False):
        neg = self.v < 0
        a = abs(self.v)
        if self.kind == 'dec':
            body = dec_str(a)
            assert body is not None, self.v
        elif a.denominator == 1:
            body = str(a.numerator)
        else:
            # 分数：たし算・ひき算の中ではかっこなし（負の数で途中にあるときだけかっこ）、× ÷ のとなりでは必ずかっこ
            body = f'{a.numerator}/{a.denominator}'
            if mul: return '(' + (MINUS if neg else '') + body + ')'
            if neg: return (MINUS + body) if leading else '(' + MINUS + body + ')'
            return body
        if neg:
            # かけ算・わり算の式では、先頭の負の数もかっこをつける（教科書の (−4)×8 の書き方）
            return (MINUS + body) if leading and not mul else '(' + MINUS + body + ')'
        return body
    def starts_minus(self, leading): return self.v < 0 and leading and not (abs(self.v).denominator != 1 and self.kind != 'dec')

class Grp(E):
    def __init__(self, e, br='()'):
        self.e = e; self.br = br
    def val(self, mode='ok'): return self.e.val(mode)
    def render(self, leading=False): return self.br[0] + self.e.render(True) + self.br[1]

class Pow(E):
    def __init__(self, base, n):
        self.base = base; self.n = n
    def val(self, mode='ok'): return self.base.val(mode) ** self.n
    def render(self, leading=False):
        b = self.base
        if isinstance(b, Lit) and (b.v < 0 or b.v.denominator != 1 or b.kind == 'dec' and b.v < 0):
            if b.v.denominator != 1 and b.kind != 'dec':
                s = b.render(False, True)  # 分数はかっこつき
            else:
                s = '(' + b.render(True) + ')'
        else:
            s = b.render(True)
        return s + str(self.n).translate(SUP)

class Neg(E):
    """−3² のように、累乗や かっこ の前につく −"""
    def __init__(self, e): self.e = e
    def val(self, mode='ok'):
        if mode == 'negpow' and isinstance(self.e, Pow) and isinstance(self.e.base, Lit):
            return (-self.e.base.v) ** self.e.n
        return -self.e.val(mode)
    def render(self, leading=False):
        s = MINUS + self.e.render(True)
        return s if leading else '(' + s + ')'

class Chain(E):
    """a op b op c …（＋ − × ÷ がまざった並び）"""
    def __init__(self, first, *rest):
        self.first = first; self.rest = list(rest)  # [(op, e)]
    def val(self, mode='ok'):
        if mode == 'ltr':
            v = self.first.val(mode)
            for op, e in self.rest: v = apply(op, v, e.val(mode))
            return v
        # 乗除を先に
        terms = [(None, [self.first.val(mode)], [])]
        cur_vals = [self.first.val(mode)]
        groups = []  # list of (sign_op, value)
        acc = self.first.val(mode); sign = '+'
        for op, e in self.rest:
            x = e.val(mode)
            if op in '×÷':
                acc = apply(op, acc, x)
            else:
                groups.append((sign, acc)); sign = op; acc = x
        groups.append((sign, acc))
        total = F(0)
        for s, v in groups: total = total + v if s == '+' else total - v
        return total
    def terms(self):
        """加減で区切った各部分（説明用）"""
        out = []; cur = [self.first]; ops = []
        for op, e in self.rest:
            if op in '×÷': cur.append((op, e))
            else: out.append(cur); cur = [e]; ops.append(op)
        out.append(cur)
        return out, ops
    def render(self, leading=False):
        ops = [op for op, _ in self.rest]
        def r(e, lead, i):
            mul = (i > 0 and ops[i - 1] in '×÷') or (i < len(ops) and ops[i] in '×÷')
            return e.render(lead, mul) if isinstance(e, Lit) else e.render(lead)
        s = r(self.first, leading, 0)
        for i, (op, e) in enumerate(self.rest, 1):
            s += f' {op} ' + r(e, False, i)
        return s

def apply(op, a, b):
    if op == '+': return a + b
    if op == '−': return a - b
    if op == '×': return a * b
    if op == '÷': return a / b
    raise ValueError(op)

def C(first, *pairs):
    """C(a, '+', b, '×', c) の書き方で Chain を作る"""
    rest = [(pairs[i], pairs[i + 1]) for i in range(0, len(pairs), 2)]
    return Chain(first, *rest)

def L(v, kind=None):
    v = F(v)
    if kind is None: kind = 'int' if v.denominator == 1 else 'frac'
    return Lit(v, kind)

def D(s):
    """小数（文字で指定）"""
    return Lit(F(s), 'dec')

def show(e): return e.render(True)

def mistakes(e):
    """よくある誤りの値（正しい値と同じものは除く）"""
    ok = e.val('ok'); out = []
    for m in ('ltr', 'negpow'):
        try:
            v = e.val(m)
        except ZeroDivisionError:
            continue
        if v != ok and v not in out: out.append(v)
    return out

def lits(e):
    """式の中の数（Lit）をすべて"""
    if isinstance(e, Lit): return [e]
    if isinstance(e, (Grp, Neg)): return lits(e.e)
    if isinstance(e, Pow): return lits(e.base)
    if isinstance(e, Chain): return lits(e.first) + [x for _, t in e.rest for x in lits(t)]
    return []

# ---- 途中式（かっこの内側から、その中では累乗・乗除・加減の順に1段ずつ） ----
def _lit(v, dec):
    v = F(v)
    if v.denominator == 1: return Lit(v, 'int')
    if dec and dec_str(abs(v)) is not None: return Lit(v, 'dec')
    return Lit(v, 'frac')

def _map(e, f):
    """子を先に変換してから f を当てる"""
    if isinstance(e, Grp): e = Grp(_map(e.e, f), e.br)
    elif isinstance(e, Neg): e = Neg(_map(e.e, f))
    elif isinstance(e, Pow): e = Pow(_map(e.base, f), e.n)
    elif isinstance(e, Chain): e = Chain(_map(e.first, f), *[(op, _map(t, f)) for op, t in e.rest])
    return f(e)

def _has(e, cls):
    if isinstance(e, cls): return True
    if isinstance(e, (Grp, Neg)): return _has(e.e, cls)
    if isinstance(e, Pow): return _has(e.base, cls)
    if isinstance(e, Chain): return _has(e.first, cls) or any(_has(t, cls) for _, t in e.rest)
    return False

def steps(e, dec=False):
    """途中式の文字の並び（最初の式は含めない）"""
    out = []
    def push(x):
        s = show(x)
        if not out or out[-1] != s: out.append(s)
    cur = e
    for _ in range(12):
        # 1) いちばん内側のかっこ
        if _has(cur, Grp):
            def red(x):
                # いちばん内側のかっこだけを1段ずつ数にする（外側は次の段で）
                if isinstance(x, Grp): return _lit(x.val(), dec) if not _has(x.e, Grp) else Grp(red(x.e), x.br)
                if isinstance(x, Neg): return Neg(red(x.e))
                if isinstance(x, Pow): return Pow(red(x.base), x.n)
                if isinstance(x, Chain): return Chain(red(x.first), *[(op, red(t)) for op, t in x.rest])
                return x
            cur = red(cur); push(cur); continue
        # 2) かっこを数にした後の累乗（−3² もここで）
        if _has(cur, Pow):
            cur = _map(cur, lambda x: _lit(x.val(), dec) if isinstance(x, Pow) and isinstance(x.base, Lit) else (_lit(x.val(), dec) if isinstance(x, Neg) and isinstance(x.e, Lit) else x))
            push(cur); continue
        break
    # 3) 乗除
    if isinstance(cur, Chain) and any(op in '×÷' for op, _ in cur.rest):
        parts, ops = cur.terms()
        vals = [(Chain(p[0], *p[1:]) if len(p) > 1 else p[0]).val() for p in parts]
        if len(parts) > 1:
            cur = Chain(_lit(vals[0], dec), *[(op, _lit(v, dec)) for op, v in zip(ops, vals[1:])]); push(cur)
    return out + [fmt_num(e.val(), 'dec' if dec else 'auto')] if (not out or out[-1] != fmt_num(e.val(), 'dec' if dec else 'auto')) else out
