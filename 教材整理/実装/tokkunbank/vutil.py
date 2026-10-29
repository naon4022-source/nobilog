"""検算用の小道具（作問側の答えは使わない）"""


def only(it):
    """条件に合う答えが1つだけであることを確かめて返す（答えが2つ以上ある問題を見つける）"""
    vals = []
    for v in it:
        if v not in vals: vals.append(v)
    if len(vals) != 1: raise ValueError(f'答えが1つに決まらない: {vals[:6]}')
    return vals[0]


def pt(x, y):
    """座標を答えの書き方 (x,y) にする（検算用）"""
    from fractions import Fraction as F
    f = lambda v: str(F(v)).replace(' ', '')
    return f'({f(x)},{f(y)})'
