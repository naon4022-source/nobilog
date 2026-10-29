"""図形の特訓用：座標から正確なSVGをつくる部品（Claude 2026-10-28・候補）。
図の点・長さ・角はすべて座標で決め、図に書く数値（claims）と答え（answer）を座標から計算し直して点検できるように記録する。
SVGにはスクリプト・外部参照を入れない。"""
import math, json, hashlib
from pathlib import Path
DASH = ' stroke-dasharray="5 4"'
FIGDIR = Path(__file__).resolve().parent.parent / '図'


def ang(A, V, B):
    """∠AVB（0〜180度）"""
    a = math.atan2(A[1] - V[1], A[0] - V[0]); b = math.atan2(B[1] - V[1], B[0] - V[0])
    d = abs(math.degrees(a - b)) % 360
    return 360 - d if d > 180 else d


def dist(P, Q): return math.hypot(P[0] - Q[0], P[1] - Q[1])
def on(c, r, deg): return (c[0] + r * math.cos(math.radians(deg)), c[1] + r * math.sin(math.radians(deg)))


class Fig:
    def __init__(self, xmin, xmax, ymin, ymax, px=300):
        self.x0, self.y1 = xmin, ymax
        self.k = px / max(xmax - xmin, ymax - ymin)
        self.W = round((xmax - xmin) * self.k) + 40; self.H = round((ymax - ymin) * self.k) + 40
        self.el = []; self.P = {}; self.claims = []; self.texts = []

    def T(self, p): return (20 + (p[0] - self.x0) * self.k, 20 + (self.y1 - p[1]) * self.k)

    def grid(self, x0, x1, y0, y1):
        """方眼（1目もり＝1 cm として座標で点検する）"""
        for x in range(x0, x1 + 1):
            (a, b), (c, d) = self.T((x, y0)), self.T((x, y1)); self.el.append(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="#c8c8c8" stroke-width="1"/>')
        for y in range(y0, y1 + 1):
            (a, b), (c, d) = self.T((x0, y)), self.T((x1, y)); self.el.append(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="#c8c8c8" stroke-width="1"/>')

    def circle(self, c, r, dash=False):
        x, y = self.T(c)
        self.el.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * self.k:.1f}"{DASH if dash else ""}/>')

    def seg(self, p, q, dash=False, ext=0):
        if ext:
            dx, dy = q[0] - p[0], q[1] - p[1]; L = math.hypot(dx, dy)
            p = (p[0] - dx / L * ext, p[1] - dy / L * ext); q = (q[0] + dx / L * ext, q[1] + dy / L * ext)
        (x1, y1), (x2, y2) = self.T(p), self.T(q)
        self.el.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"{DASH if dash else ""}/>')

    def arc(self, c, r, d1, d2, dash=False):
        """コンパスの線（中心 c・半径 r の円の d1°〜d2° の部分）"""
        pts = [self.T((c[0] + r * math.cos(math.radians(d1 + (d2 - d1) * i / 24)), c[1] + r * math.sin(math.radians(d1 + (d2 - d1) * i / 24)))) for i in range(25)]
        self.el.append('<polyline stroke="#555" stroke-width="1.3"' + (DASH if dash else '') + ' points="' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + '"/>')

    def region(self, *loops):
        """かげをつけた部分（点の列の輪を重ねて evenodd でぬる）。線はかかないので、あとで輪郭をかく"""
        d = ''
        for loop in loops:
            pts = [self.T(p) for p in loop]; d += 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + ' Z '
        self.el.insert(0, f'<path d="{d.strip()}" fill="#d9d9d9" stroke="none" fill-rule="evenodd"/>')

    def poly(self, *pts):
        s = ' '.join(f'{x:.1f},{y:.1f}' for x, y in (self.T(p) for p in pts))
        self.el.append(f'<polygon points="{s}"/>')

    def text(self, s, p, dx=0, dy=0, size=16):
        x, y = self.T(p); x += dx; y += dy
        self.texts.append(s)
        self.el.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="middle" dominant-baseline="central" stroke="none" fill="#111">{s}</text>')

    def point(self, name, p, away=None, d=14, dot=True, off=None):
        """点を打ち、名前を away（離れる向きの基準点）から遠ざけて書く"""
        self.P[name] = p
        x, y = self.T(p)
        if dot: self.el.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="#111" stroke="none"/>')
        if off is not None: ux, uy = off; L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
        elif away is None: ux, uy = 0, -1
        else:
            ax, ay = self.T(away); ux, uy = x - ax, y - ay; L = math.hypot(ux, uy) or 1; ux, uy = ux / L, uy / L
        self.texts.append(name)
        self.el.append(f'<text x="{x + ux * d:.1f}" y="{y + uy * d:.1f}" font-size="17" text-anchor="middle" dominant-baseline="central" stroke="none" fill="#111" font-style="italic">{name}</text>')

    def angle(self, A, V, B, label=None, r=22, value=None, right=False, lr=None):
        """∠AVB の印。label は図に書く文字。value はその角の本当の大きさ（座標から点検する）"""
        P = self.P
        a, v, b = P[A], P[V], P[B]
        vx, vy = self.T(v)
        t1 = math.atan2(-(a[1] - v[1]), a[0] - v[0]); t2 = math.atan2(-(b[1] - v[1]), b[0] - v[0])
        d = (t2 - t1) % (2 * math.pi)
        if d > math.pi: t1, t2, d = t2, t1, 2 * math.pi - d
        if right:
            s = 12
            ux, uy = math.cos(t1), math.sin(t1); wx, wy = math.cos(t2), math.sin(t2)
            pts = [(vx + ux * s, vy + uy * s), (vx + (ux + wx) * s, vy + (uy + wy) * s), (vx + wx * s, vy + wy * s)]
            self.el.append('<polyline points="' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + '"/>')
        else:
            x1, y1 = vx + r * math.cos(t1), vy + r * math.sin(t1); x2, y2 = vx + r * math.cos(t2), vy + r * math.sin(t2)
            self.el.append(f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 0 1 {x2:.1f},{y2:.1f}"/>')
        if label:
            m = t1 + d / 2; rr = lr or r + 16
            self.texts.append(label)
            self.el.append(f'<text x="{vx + rr * math.cos(m):.1f}" y="{vy + rr * math.sin(m):.1f}" font-size="15" text-anchor="middle" dominant-baseline="central" stroke="none" fill="#111">{label}</text>')
        if value is not None or right:
            self.claims.append({'kind': 'angle', 'at': [A, V, B], 'value': 90 if right else value, 'shown': label or ('直角の印' if right else '')})

    def claim(self, kind, at, value, shown=''):
        self.claims.append({'kind': kind, 'at': at, 'value': value, 'shown': shown})

    def check(self):
        """図に書いた（または印をつけた）値を座標で計算し直す"""
        bad = []
        for c in self.claims:
            P = self.P
            if c['kind'] == 'angle': got = ang(P[c['at'][0]], P[c['at'][1]], P[c['at'][2]])
            elif c['kind'] == 'len': got = dist(P[c['at'][0]], P[c['at'][1]]) / c.get('unit', 1)
            elif c['kind'] == 'ratio': got = dist(P[c['at'][0]], P[c['at'][1]]) / dist(P[c['at'][2]], P[c['at'][3]])
            elif c['kind'] == 'eq': got = abs(dist(P[c['at'][0]], P[c['at'][1]]) - dist(P[c['at'][2]], P[c['at'][3]])); c = dict(c, value=0)
            else: raise ValueError(c['kind'])
            if abs(got - float(c['value'])) > 1e-6: bad.append((c, got))
        return bad

    def svg(self, title):
        body = '\n'.join(self.el)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.W} {self.H}" width="{self.W}" height="{self.H}" role="img">\n'
                f'<title>{title}</title>\n<rect width="100%" height="100%" fill="#fff"/>\n'
                f'<g fill="none" stroke="#111" stroke-width="1.8" font-family="sans-serif">\n{body}\n</g>\n</svg>\n')


REG = []  # 対応表（図ごと）


def attach(U, q, fig, alt, answer_claim=None):
    """直前に足した問題 q に図をつける。ファイル名は site-assets 直下に置く前提の英数字（tokkun-fig-<単元>-<番号>.svg）"""
    n = len(U.qs)
    name = f'tokkun-fig-{U.key}-{n}.svg'
    bad = fig.check()
    assert not bad, (name, bad)
    if answer_claim:
        k, at, v = answer_claim
        f2 = Fig(0, 1, 0, 1); f2.P = fig.P; f2.claims = [{'kind': k, 'at': at, 'value': v}]
        assert not f2.check(), (name, '答えが図の座標と合わない', f2.check())
    s = fig.svg(alt)
    FIGDIR.mkdir(exist_ok=True)
    (FIGDIR / name).write_text(s, encoding='utf-8')
    q['image'] = '/' + name; q['imageAlt'] = alt
    REG.append({'unit': U.key, 'number': n, 'file': name, 'sha256': hashlib.sha256(s.encode()).hexdigest(), 'image': '/' + name, 'imageAlt': alt,
                'claims': fig.claims, 'answerClaim': answer_claim, 'texts': fig.texts, 'answer': q['answer']})
    return q


def write_reg(key):
    p = FIGDIR.parent / f'図の対応表_{key}.json'
    p.write_text(json.dumps([r for r in REG if r['unit'] == key], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


class Solid:
    """凸な多面体の見取図（キャビネット図：奥行きを 1/2 にして 45° 斜めにかく）。
    faces は外から見て反時計回りの頂点名の列。見えない辺（両側の面がどちらも向こう向き）は点線にする。
    頂点・辺・面の数はこのデータから数え直して、答えの点検に使う。"""
    K = 0.5 * math.cos(math.radians(45))

    def __init__(self, V, faces):
        self.V, self.faces = V, faces
        es = {}
        for f in faces:
            for i in range(len(f)):
                a, b = f[i], f[(i + 1) % len(f)]
                es.setdefault(frozenset((a, b)), []).append(f)
        self.edges = es
        assert all(len(v) == 2 for v in es.values()), '辺がちょうど2つの面に共有されていない'
        assert len(V) - len(es) + len(faces) == 2, 'オイラーの関係が成り立たない'

    def proj(self, p): return (p[0] + self.K * p[1], p[2] + self.K * p[1])

    def normal(self, f):
        P = [self.V[n] for n in f]; nx = ny = nz = 0.0
        for i in range(len(P)):
            a, b = P[i], P[(i + 1) % len(P)]
            nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1])
        c = [sum(p[i] for p in self.V.values()) / len(self.V) for i in range(3)]; m = [sum(p[i] for p in P) / len(P) for i in range(3)]
        if nx * (m[0] - c[0]) + ny * (m[1] - c[1]) + nz * (m[2] - c[2]) < 0: nx, ny, nz = -nx, -ny, -nz   # 外向きにそろえる
        return (nx, ny, nz)

    def front(self, f):
        n = self.normal(f); v = (-self.K, 1, -self.K)
        return n[0] * v[0] + n[1] * v[1] + n[2] * v[2] < -1e-9

    def counts(self): return len(self.V), len(self.edges), len(self.faces)

    def draw(self, labels=False, pad=0.8, px=260):
        Q = {n: self.proj(p) for n, p in self.V.items()}
        xs = [q[0] for q in Q.values()]; ys = [q[1] for q in Q.values()]
        fg = Fig(min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad, px=px)
        for e, fs in self.edges.items():
            a, b = tuple(e); vis = any(self.front(f) for f in fs)
            fg.seg(Q[a], Q[b], dash=not vis)
        if labels:
            c = (sum(xs) / len(xs), sum(ys) / len(ys))
            for n, q in Q.items(): fg.point(n, q, away=c, dot=False)
        else:
            for n, q in Q.items(): fg.P[n] = q
        fg.solid = self
        return fg
