"""検査専用：教科書の書き方の式（−、×、÷、²、{ }、分数 a/b、文字）を、分数（Fraction）で正確に計算する。
作問側（mk.py）はこのファイルを使わない。答えを別の道すじで計算し直すためのもの。"""
import unicodedata
from fractions import Fraction as F

SUP = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'}


class ParseError(Exception):
    pass


def _prep(s):
    out, i = [], 0
    s = str(s)
    while i < len(s):
        c = s[i]
        if c in SUP:
            j = i
            while j < len(s) and s[j] in SUP: j += 1
            out.append('^' + ''.join(SUP[x] for x in s[i:j])); i = j; continue
        out.append(c); i += 1
    s = unicodedata.normalize('NFKC', ''.join(out))
    for a, b in (('−', '-'), ('–', '-'), ('－', '-'), ('＋', '+'), ('*', '×'), ('・', '×')):
        s = s.replace(a, b)
    return s.replace(' ', '').replace('　', '')


def tokens(s):
    s = _prep(s)
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c.isdigit() or c == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'): j += 1
            out.append(('n', F(s[i:j]))); i = j; continue
        if c.isalpha() and c.isascii() or c in 'π□':
            out.append(('v', c)); i += 1; continue
        if c in '+-×÷/()^{}[]':
            t = {'{': '(', '[': '(', '}': ')', ']': ')'}.get(c, c)
            out.append((t, None)); i += 1; continue
        raise ParseError(f'読めない文字 {c!r} in {s!r}')
    return out


def parse(s):
    """式 → 関数 env -> Fraction"""
    t = tokens(s); p = [0]

    def peek(): return t[p[0]][0] if p[0] < len(t) else None
    def take(): p[0] += 1; return t[p[0] - 1]

    def primary():
        k = peek()
        if k == 'n':
            v = take()[1]; return lambda e, v=v: v
        if k == 'v':
            name = take()[1]; return lambda e, n=name: F(e[n])
        if k == '(':
            take(); x = expr()
            if peek() != ')': raise ParseError('かっこが閉じていない: ' + s)
            take(); return x
        raise ParseError(f'式の形がおかしい: {s!r} at {p[0]}')

    def power():
        b = primary()
        if peek() == '^':
            take(); n = take()
            if n[0] != 'n' or n[1].denominator != 1: raise ParseError('指数')
            k = int(n[1]); return lambda e, b=b, k=k: b(e) ** k
        return b

    def unary():
        if peek() == '-':
            take(); u = unary(); return lambda e, u=u: -u(e)
        if peek() == '+':
            take(); return unary()
        return power()

    def term():
        a = unary()
        while True:
            k = peek()
            if k == '×':
                take(); b = unary(); a = (lambda e, a=a, b=b: a(e) * b(e))
            elif k in ('÷', '/'):
                take(); b = unary(); a = (lambda e, a=a, b=b: a(e) / b(e))
            elif k in ('n', 'v', '('):
                b = power(); a = (lambda e, a=a, b=b: a(e) * b(e))
            else:
                return a

    def expr():
        a = term()
        while peek() in ('+', '-'):
            k = take()[0]; b = term()
            a = (lambda e, a=a, b=b: a(e) + b(e)) if k == '+' else (lambda e, a=a, b=b: a(e) - b(e))
        return a

    f = expr()
    if p[0] != len(t): raise ParseError('式の終わりがおかしい: ' + s)
    return f


def variables(s):
    return sorted({v for k, v in tokens(s) if k == 'v'})


def value(s, env=None):
    return parse(s)(env or {})


def number(s):
    """答えの数（"-113/60"、"4.7"、"−3"）"""
    return value(s)


REL = ('≦', '≧', '<', '>', '=')


def relation(s):
    s2 = _prep(s).replace('<=', '≦').replace('>=', '≧').replace('≤', '≦').replace('≥', '≧')
    for op in ('≦', '≧', '<', '>', '='):
        if s2.count(op) == 1 and all(s2.count(o) == 0 for o in REL if o != op):
            l, r = s2.split(op)
            return parse(l), op, parse(r), variables(l + '+' + r)
    raise ParseError('関係式が読めない: ' + s)
