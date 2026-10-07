"""教科書の図解（SVG）の共通部品（Claude・2026-10-05）。
横長 960×540。文字は図の中に正しく入れる（画像生成の文字くずれを避けるため、ラベルは本物の文字）。
文字の幅は目安で計算し、箱からはみ出しそうなら字を小さくする。最後に check.mjs がブラウザで実際の大きさを測って確かめる。"""
import html, re
W, H = 960, 540
FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif'
COL = {'ink': '#1d2b3a', 'blue': '#1f5fa8', 'sky': '#e8f0fa', 'orange': '#e07a1f', 'cream': '#fff6e8', 'green': '#2a8a5b', 'mint': '#e6f5ec',
       'red': '#c8414f', 'pink': '#fdecee', 'purple': '#6a4aa0', 'lav': '#f0ebf8', 'yellow': '#f6c945', 'lemon': '#fff8d6', 'gray': '#8a96a3', 'line': '#c9d6e8', 'white': '#ffffff'}
PAIRS = [('blue', 'sky'), ('orange', 'cream'), ('green', 'mint'), ('purple', 'lav'), ('red', 'pink'), ('gray', 'white')]

def esc(s): return html.escape(str(s), quote=True)
def cw(ch):
    o = ord(ch)
    if ch == ' ': return .32
    if o < 128: return .66 if ch.isupper() or ch.isdigit() else .56
    return 1.0
def width(s, z): return sum(cw(c) for c in s) * z * 1.04   # 少し広めに見積もって、はみ出しを防ぐ
OPEN = '、。，．）」』！？!?,.)…ー：:ゃゅょっャュョッ'
def wrap(s, z, maxw):
    """英単語は切らない。行頭に句読点を置かない。"""
    out = []
    for para in str(s).split('\n'):
        toks = re.findall(r"[A-Za-z0-9][A-Za-z0-9'’.,!?%\-/]*\s*|\s+|.", para)
        line = ''
        for tk in toks:
            if line and width(line + tk.rstrip(), z) > maxw and tk[0] not in OPEN:
                cut = -1
                for k in range(len(line) - 1, int(len(line) * .6), -1):
                    if line[k] in '、。：／・」） ': cut = k + 1; break
                rest = ''
                if 0 < cut < len(line): rest, line = line[cut:], line[:cut]
                while len(line) > 1 and line[-1] in '「（『【(': rest, line = line[-1] + rest, line[:-1]
                out.append(line.rstrip()); line = (rest + tk).lstrip()
            else: line += tk
        if line.strip(): out.append(line.rstrip())
    return out
def fit(s, maxw, maxh, big=26, small=13, lh=1.35):
    for z in range(big, small - 1, -1):
        L = wrap(s, z, maxw - z * .9)   # 行末に句読点がぶら下がっても入るよう1字分あける
        orphan = len(L) > 1 and len(L[-1]) <= 2
        if len(L) * z * lh <= maxh and all(width(l, z) <= maxw + z * .5 for l in L) and not orphan: return z, L
    for z in range(big, small - 1, -1):
        L = wrap(s, z, maxw)
        if len(L) * z * lh <= maxh: return z, L
    return small, wrap(s, small, maxw)

import importlib.util as _iu, pathlib as _pl
_sp = _iu.spec_from_file_location('nobi_kit', _pl.Path(__file__).resolve().parent.parent / 'のびー' / 'nobi_kit.py'); NOBI = _iu.module_from_spec(_sp); _sp.loader.exec_module(NOBI)
class SVG:
    def __init__(self, title=''):
        self.p = []; self.title = title
    def add(self, s): self.p.append(s); return self
    def rect(self, x, y, w, h, fill='#fff', stroke=None, sw=2, r=14, dash=None, op=None):
        a = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
        if dash: a += f' stroke-dasharray="{dash}"'
        if op is not None: a += f' opacity="{op}"'
        return self.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r}" fill="{fill}"{a}/>')
    def text(self, s, x, y, z=22, col=None, anchor='start', weight=700, box=None):
        b = f' data-box="{box}"' if box else ''
        return self.add(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{z}" font-weight="{weight}" fill="{col or COL["ink"]}" text-anchor="{anchor}"{b}>{esc(s)}</text>')
    def lines(self, L, z, x, y, col=None, anchor='start', weight=700, lh=1.35, box=None):
        for k, l in enumerate(L): self.text(l, x, y + z * (k * lh + 1) - z * .18, z, col, anchor, weight, box)
        return self
    def para(self, s, x, y, w, h, big=24, small=13, col=None, anchor='start', valign='middle', weight=700, box=None):
        """箱（x,y,w,h）の中に文を入れる。anchor=middle のときは x を中央にする"""
        z, L = fit(s, w, h, big, small); th = len(L) * z * 1.35
        y0 = y + (h - th) / 2 if valign == 'middle' else y
        return self.lines(L, z, x + (w / 2 if anchor == 'middle' else 0), y0, col, anchor, weight, box=box)
    def card(self, x, y, w, h, s, pair=0, head=None, big=22, small=16, anchor='middle', pad=14, sw=3, bid=None):
        st, fl = (COL[c] for c in PAIRS[pair % len(PAIRS)])
        bid = bid or f'b{len(self.p)}'
        self.add(f'<g data-id="{bid}">'); self.rect(x, y, w, h, fl, st, sw)
        top = y + pad
        if head:
            hz, HL = fit(head, w - 2 * pad, 60, 22, 13)
            hh = len(HL) * hz * 1.35 + 10
            self.rect(x, y, w, hh + 8, st, None, r=14); self.rect(x, y + hh, w, 8, st, None, r=0)
            self.lines(HL, hz, x + w / 2, y + 5, '#fff', 'middle', 800, box=bid)
            top = y + hh + 8 + pad * .6
        if s: self.para(s, x + pad, top, w - 2 * pad, y + h - pad - top, big, small, anchor=anchor, box=bid)
        return self.add('</g>')
    def bullets(self, x, y, w, h, items, pair=0, head=None, big=20, small=14):
        """見出しつきの箱に、・の箇条書き"""
        st, fl = (COL[c] for c in PAIRS[pair % len(PAIRS)]); bid = f'b{len(self.p)}'
        self.add(f'<g data-id="{bid}">'); self.rect(x, y, w, h, fl, st, 3)
        top = y + 12
        if head:
            hz, HL = fit(head, w - 24, 56, 22, 13); hh = len(HL) * hz * 1.35 + 10
            self.rect(x, y, w, hh + 8, st, None); self.rect(x, y + hh, w, 8, st, None, r=0)
            self.lines(HL, hz, x + w / 2, y + 5, '#fff', 'middle', 800, box=bid); top = y + hh + 18
        avail = y + h - 12 - top
        for z in range(big, small - 1, -1):
            blocks = [wrap(t, z, w - 26 - 2 * z) for t in items]   # 行末に句読点がぶら下がっても箱に入るよう1字分あける
            tot = sum(len(b) for b in blocks) * z * 1.35 + (len(items) - 1) * z * .35
            if tot <= avail and all(width(l, z) <= w - 24 - z for bl in blocks for l in bl): break
        yy = top + (avail - tot) / 2
        for b in blocks:
            self.text('・', x + 10, yy + z * .82, z, st, box=bid)
            self.lines(b, z, x + 10 + z, yy, box=bid); yy += len(b) * z * 1.35 + z * .35
        return self.add('</g>')
    def arrow(self, x1, y1, x2, y2, col=None, sw=4, head=12, dash=None, label=None, lz=16, both=False):
        import math
        col = col or COL['orange']; a = math.atan2(y2 - y1, x2 - x1)
        d = f' stroke-dasharray="{dash}"' if dash else ''
        ex, ey = x2 - head * .8 * math.cos(a), y2 - head * .8 * math.sin(a)
        sx, sy = (x1 + head * .8 * math.cos(a), y1 + head * .8 * math.sin(a)) if both else (x1, y1)
        self.add(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{col}" stroke-width="{sw}" stroke-linecap="round"{d}/>')
        def tip(px, py, ang):
            pts = [(px, py), (px - head * math.cos(ang - .45), py - head * math.sin(ang - .45)), (px - head * math.cos(ang + .45), py - head * math.sin(ang + .45))]
            self.add('<polygon points="' + ' '.join(f'{u:.1f},{v:.1f}' for u, v in pts) + f'" fill="{col}"/>')
        tip(x2, y2, a)
        if both: tip(x1, y1, a + math.pi)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2; lw = width(label, lz) + 14
            self.rect(mx - lw / 2, my - lz * .8 - 4, lw, lz * 1.6, '#fff', col, 1.5, r=8); self.text(label, mx, my + lz * .35, lz, col, 'middle')
        return self
    def line(self, x1, y1, x2, y2, col=None, sw=3, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        return self.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col or COL["ink"]}" stroke-width="{sw}"{d}/>')
    def path(self, d, fill='none', stroke=None, sw=3, dash=None, op=None):
        a = f' stroke-dasharray="{dash}"' if dash else ''
        if op is not None: a += f' opacity="{op}"'
        return self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke or COL["ink"]}" stroke-width="{sw}"{a}/>')
    def circle(self, x, y, r, fill='#fff', stroke=None, sw=2):
        s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
        return self.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}"{s}/>')
    def ellipse(self, x, y, rx, ry, fill='#fff', stroke=None, sw=2, dash=None):
        s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
        if dash: s += f' stroke-dasharray="{dash}"'
        return self.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}"{s}/>')
    def badge(self, n, x, y, col=None, r=17):
        self.circle(x, y, r, col or COL['orange']); return self.text(str(n), x, y + r * .42, r * 1.15, '#fff', 'middle', 800)
    def title_bar(self, s):
        z, L = fit(s, W - 60, 40, 26, 15)
        self.rect(0, 0, W, 54, COL['sky'], None, r=0); self.lines(L[:1], z, W / 2, 27 - z * .68, COL['blue'], 'middle', 800, box='title')
        return 62
    def sprout(self, x, y, s=1.0, pose='normal'):
        """マスコット「のびー」を小さく添える。顔と形は のびー/nobi_kit.py が正本（動画・教科書と同じ）"""
        self._nb = getattr(self, '_nb', 0) + 1; k = f'nb{self._nb}'
        return self.add(NOBI.defs(k) + f'<g transform="translate({x},{y}) scale({s * .5})">' + NOBI.body_svg(pose, k) + '</g>')   # 前の芽と同じ大きさになるよう半分に
    def done(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family=\'{FONT}\' role="img" aria-label="{esc(self.title)}">'
                f'<rect width="{W}" height="{H}" fill="#ffffff"/>' + ''.join(self.p) + '</svg>\n')
