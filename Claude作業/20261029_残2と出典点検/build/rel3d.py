"""空間の2直線・直線と平面・2平面の位置関係を座標から判定する（Claude 2026-10-29・検算用）"""
from fractions import Fraction as F
def sub(a, b): return tuple(F(x) - F(y) for x, y in zip(a, b))
def cross(u, v): return (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
def dot(u, v): return sum(x * y for x, y in zip(u, v))
def zero(v): return all(x == 0 for x in v)
def line_rel(V, e1, e2):
    """'平行'・'交わる'・'ねじれ'（辺を直線とみる。同じ直線は '同じ'）"""
    p, q = V[e1[0]], V[e1[1]]; r, s = V[e2[0]], V[e2[1]]
    d1, d2 = sub(q, p), sub(s, r); c = cross(d1, d2)
    if zero(c): return '同じ' if zero(cross(d1, sub(r, p))) else '平行'
    return '交わる' if dot(sub(r, p), c) == 0 else 'ねじれ'
def perp(V, e1, e2): return dot(sub(V[e1[1]], V[e1[0]]), sub(V[e2[1]], V[e2[0]])) == 0
def normal(V, f): return cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]]))
def line_plane(V, e, f):
    """'平面上'・'交わる'・'平行'"""
    n = normal(V, f); d = sub(V[e[1]], V[e[0]])
    if dot(d, n) != 0: return '交わる'
    return '平面上' if dot(sub(V[e[0]], V[f[0]]), n) == 0 else '平行'
def line_perp_plane(V, e, f): return zero(cross(sub(V[e[1]], V[e[0]]), normal(V, f)))
def plane_rel(V, f, g):
    n, m = normal(V, f), normal(V, g)
    if zero(cross(n, m)): return '同じ' if dot(sub(V[g[0]], V[f[0]]), n) == 0 else '平行'
    return '垂直' if dot(n, m) == 0 else '交わる'
def edges_of(faces):
    es = []
    for f in faces:
        for i in range(len(f)):
            e = tuple(sorted((f[i], f[(i + 1) % len(f)])))
            if e not in es: es.append(e)
    return es
