"""図の型（Claude・2026-10-05）。どれも SVG に描きこむ。中身（ラベル）は原稿の要点・表から取る。"""
from svg import SVG, COL, PAIRS, W, H, fit, width

def flow(g, steps, top=70, bottom=530, notes=None, vertical=None, pair0=0):
    """順番の図。steps＝[(見出し, 説明)] か 文字。4つ以下は横、5つ以上は2段（ジグザグにせず左から右へ）。"""
    n = len(steps); steps = [s if isinstance(s, (list, tuple)) else (s, '') for s in steps]
    vertical = n > 5 if vertical is None else vertical
    if vertical:
        gap = 16; h = (bottom - top - gap * (n - 1)) / n
        for k, (hd, tx) in enumerate(steps):
            y = top + k * (h + gap)
            g.badge(k + 1, 60, y + h / 2, COL[PAIRS[(pair0 + k) % 4][0]])
            g.card(90, y, W - 130, h, (hd + ('：' + tx if tx else '')), (pair0 + k) % 4, big=22, anchor='start', sw=2)
            if k < n - 1: g.arrow(60, y + h / 2 + 20, 60, y + h + gap + h / 2 - 20, COL['gray'], 3, 9)
        return
    rows = 1 if n <= 4 else 2; per = -(-n // rows); gapx = 46
    w = (W - 60 - gapx * (per - 1)) / per; rh = (bottom - top - 30 * (rows - 1)) / rows
    for k, (hd, tx) in enumerate(steps):
        r, c = divmod(k, per); x = 30 + c * (w + gapx); y = top + r * (rh + 30)
        if tx: g.card(x, y, w, rh, tx, (pair0 + k) % 4, head=hd, big=26)
        else: g.card(x, y, w, rh, hd, (pair0 + k) % 4, big=26)
        if c < per - 1 and k < n - 1: g.arrow(x + w + 4, y + rh / 2, x + w + gapx - 4, y + rh / 2, COL['orange'], 5, 14)
        elif k < n - 1: g.arrow(x + w / 2, y + rh + 2, 30 + w / 2, y + rh + 28, COL['orange'], 4, 11, dash='6 6')
    return

def compare(g, cols, top=70, bottom=530, pair0=0):
    """くらべる図。cols＝[(見出し, [項目…])]"""
    n = len(cols); gap = 18; w = (W - 60 - gap * (n - 1)) / n
    for k, (hd, items) in enumerate(cols):
        g.bullets(30 + k * (w + gap), top, w, bottom - top, items, (pair0 + k) % 6, head=hd, big=21)

def table(g, rows, top=70, bottom=530, hl_col=0, x0=30, x1=W - 30):
    """表。1行目が見出し。"""
    nr, nc = len(rows), max(len(r) for r in rows)
    ws = [max(width(str(r[c]) if c < len(r) else '', 20) for r in rows) + 30 for c in range(nc)]
    tot = sum(ws); ws = [w * (x1 - x0) / tot for w in ws]
    rh = min(70, (bottom - top) / nr); y = top + ((bottom - top) - rh * nr) / 2
    for i, r in enumerate(rows):
        x = x0
        for c in range(nc):
            v = str(r[c]) if c < len(r) else ''
            fill = COL['blue'] if i == 0 else (COL['sky'] if c == hl_col and hl_col is not None else ('#fff' if i % 2 else '#f7f9fc'))
            g.rect(x, y, ws[c], rh, fill, COL['line'], 1.5, r=0)
            g.para(v, x + 8, y + 4, ws[c] - 16, rh - 8, 22, 11, '#fff' if i == 0 else None, 'middle', box=f't{i}{c}')
            x += ws[c]
        y += rh

def tree(g, root, kids, top=70, bottom=530):
    """分類の木。root＝見出し、kids＝[(名前, [(名前, [...])…] or 説明)]。3段まで。"""
    def leaves(n):
        ch = n[1] if isinstance(n[1], list) else None
        return sum(leaves(c) for c in ch) if ch else 1
    total = sum(leaves(k) for k in kids); depth = 1
    def dep(n, d):
        ch = n[1] if isinstance(n[1], list) else None
        return max([dep(c, d + 1) for c in ch]) if ch else d
    depth = max(dep(k, 1) for k in kids)
    lh = (bottom - top - 70) / max(1, depth); lw = (W - 40) / total
    g.card(W / 2 - 150, top, 300, 56, root, 0, big=24)
    def draw(n, d, x0, pyx, pyy, k):
        nl = leaves(n); cx = x0 + nl * lw / 2; y = top + 70 + (d - 1) * lh + 10
        bh = min(lh - 34, 120) if not isinstance(n[1], list) else 56
        g.path(f'M{pyx:.1f},{pyy:.1f} L{pyx:.1f},{(pyy + y) / 2:.1f} L{cx:.1f},{(pyy + y) / 2:.1f} L{cx:.1f},{y:.1f}', stroke=COL['gray'], sw=3)
        txt = n[0] + ('' if isinstance(n[1], list) or not n[1] else '\n' + n[1])
        bw = min(lw * nl - 12, 260)
        g.card(cx - bw / 2, y, bw, bh, txt, (d + k) % 4, big=20, small=13, pad=8)
        if isinstance(n[1], list):
            xx = x0
            for j, c in enumerate(n[1]): draw(c, d + 1, xx, cx, y + bh, j); xx += leaves(c) * lw
    xx = 20
    for j, k in enumerate(kids): draw(k, 1, xx, W / 2, top + 56, j); xx += leaves(k) * lw

def nest(g, labels, top=70, bottom=530):
    """入れ子（外ほど大きい）。labels＝[(名前, 説明)] 外側から"""
    n = len(labels); dx = (W - 60) / (2 * n + 1) * .9; dy = (bottom - top) / (2 * n + 2)
    for k, (nm, tx) in enumerate(labels):
        x, y = 30 + k * dx, top + k * dy; w, h = W - 60 - 2 * k * dx, bottom - top - 2 * k * dy
        st, fl = (COL[c] for c in PAIRS[k % 4])
        g.rect(x, y, w, h, fl, st, 3, r=18)
        g.text(nm, x + 14, y + 30, 22, st, weight=800)
        if tx: g.para(tx, x + 14 + width(nm, 22) + 12, y + 8, w - width(nm, 22) - 40, 30, 17, 11, anchor='start', box=f'n{k}')

def pyramid(g, levels, top=70, bottom=530, side=None):
    """上ほどせまい三角。levels＝[(名前, 説明)] 上から。side＝右に添える説明"""
    n = len(levels); h = (bottom - top) / n; cx = 300 if side else W / 2; half = 260
    for k, (nm, tx) in enumerate(levels):
        y0, y1 = top + k * h, top + (k + 1) * h; w0, w1 = half * (k + .35) / n, half * (k + 1.35) / n
        st, fl = (COL[c] for c in PAIRS[k % 4])
        g.path(f'M{cx - w0:.1f},{y0 + 3:.1f} L{cx + w0:.1f},{y0 + 3:.1f} L{cx + w1:.1f},{y1 - 3:.1f} L{cx - w1:.1f},{y1 - 3:.1f} Z', fl, st, 3)
        g.para(nm, cx - w0, y0 + 6, 2 * w0, h - 12, 22, 12, st, 'middle', box=f'p{k}')
        if tx:
            g.line(cx + (w0 + w1) / 2 + 6, (y0 + y1) / 2, 640, (y0 + y1) / 2, COL['line'], 2, '5 5')
            g.card(645, y0 + 6, W - 675, h - 12, tx, k % 4, big=19, anchor='start', sw=2)

def relation(g, nodes, edges, top=70):
    """関係図。nodes＝{id: (cx, cy, w, h, 文, 色番号)}、edges＝[(a, b, ラベル, 両向き?)]"""
    import math
    for a, b, lab, *both in edges:
        ax, ay, aw, ah = nodes[a][:4]; bx, by, bw, bh = nodes[b][:4]
        def edge(cx, cy, w, h, tx, ty):
            dx, dy = tx - cx, ty - cy
            if dx == 0 and dy == 0: return cx, cy
            t = min(w / 2 / abs(dx) if dx else 1e9, h / 2 / abs(dy) if dy else 1e9)
            return cx + dx * t, cy + dy * t
        x1, y1 = edge(ax, ay, aw + 16, ah + 16, bx, by); x2, y2 = edge(bx, by, bw + 16, bh + 16, ax, ay)
        g.arrow(x1, y1, x2, y2, COL['orange'], 4, 13, label=lab, both=bool(both and both[0]))
    for k, (cx, cy, w, h, s, c) in nodes.items():
        g.card(cx - w / 2, cy - h / 2, w, h, s, c, big=21, small=14, pad=10)

def timeline(g, events, top=70, bottom=530):
    """年表。events＝[(時代・年, できごと)] 左から右へ。上下交互にカード。"""
    n = len(events); y = (top + bottom) / 2; x0, x1 = 50, W - 50
    g.arrow(x0 - 20, y, x1 + 25, y, COL['gray'], 5, 16)
    step = (x1 - x0) / max(1, n - 1) if n > 1 else 0; cw = min(230, step * 1.7 if n > 1 else 300)
    for k, (when, what) in enumerate(events):
        x = x0 + k * step if n > 1 else W / 2; up = k % 2 == 0
        g.circle(x, y, 9, COL['orange'], '#fff', 3)
        ch = (y - top - 30)
        cy = top if up else y + 30
        g.line(x, y + (-12 if up else 12), x, cy + ch if up else cy, COL['line'], 2, '4 4')
        g.card(max(10, min(W - 10 - cw, x - cw / 2)), cy, cw, ch, what, k % 4, head=when, big=19, small=13, pad=8)
