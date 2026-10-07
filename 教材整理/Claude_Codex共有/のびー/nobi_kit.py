#!/usr/bin/env python3
"""マスコット「のびー」の部品（Claude・2026-10-06）。
動画（教科動画/template.js の nobi）・図解（教科図解/svg.py の sprout）・教科書・アプリのどこでも同じ顔で使うための正本。
  python3 nobi_kit.py  → site-assets/nobi-<ポーズ>.svg を書き出す（教科書・アプリの画面で <img> として使う）
ポーズ：normal（ふつう）/ wave（手をふる）/ point（指さす）/ think（考え中）/ surprise（びっくり）/ joy（やったね）/ read（本を読む）
大きさ：体の幅 120・高さ（葉の先から影まで）約 170 の座標で描く。原点は体の中心。"""
import pathlib

L = '#3e8f55'; INK = '#2b2f45'; HAND = '#9edbae'

def defs(k):
    return (f'<defs><radialGradient id="{k}b" cx="35%" cy="25%" r="75%"><stop offset="0" stop-color="#d9f7df"/><stop offset=".55" stop-color="#a9e4b6"/><stop offset="1" stop-color="#7fcf93"/></radialGradient>'
            f'<linearGradient id="{k}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4fb562"/><stop offset="1" stop-color="#8be09a"/></linearGradient>'
            f'<radialGradient id="{k}c"><stop offset="0" stop-color="#ff8096" stop-opacity=".75"/><stop offset="1" stop-color="#ff8096" stop-opacity="0"/></radialGradient></defs>')

def hand(x, y, deg):
    return f'<ellipse cx="0" cy="14" rx="10" ry="16" fill="{HAND}" stroke="{L}" stroke-width="3" transform="translate({x},{y}) rotate({deg})"/>'

def eyes(kind):
    s = ''
    for d in (-1, 1):
        ex = d * 19
        if kind == 'joy':
            s += f'<path d="M{ex-9},8 Q{ex},-4 {ex+9},8" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
            continue
        if kind == 'closed':
            s += f'<path d="M{ex-8},4 Q{ex},11 {ex+8},4" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>'
            continue
        dx, dy, ry = {'think': (-3, -3, 11.5), 'surprise': (0, 0, 13.5), 'read': (0, 3, 9)}.get(kind, (0, 0, 11.5))
        rx = 10.5 if kind == 'surprise' else 9
        s += (f'<ellipse cx="{ex}" cy="4" rx="{rx}" ry="{ry}" fill="{INK}"/><ellipse cx="{ex+dx*.3}" cy="{7+dy*.3}" rx="{rx-2.5}" ry="{ry-4.5}" fill="#6e96eb" fill-opacity=".55"/>'
              f'<circle cx="{ex-3+dx}" cy="{-0.5+dy}" r="3.6" fill="#fff"/><circle cx="{ex+3.4+dx*.5}" cy="{8+dy*.5}" r="1.7" fill="#fff"/>')
    return s

def mouth(kind):
    if kind in ('wave', 'joy'):
        return (f'<path d="M-9,17 Q0,32 9,17Z" fill="#e8566c" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
                '<ellipse cx="0" cy="25" rx="4" ry="2.6" fill="#ff9aa8"/>')
    if kind == 'surprise':
        return f'<ellipse cx="0" cy="22" rx="6" ry="7.5" fill="#e8566c" stroke="{INK}" stroke-width="3"/>'
    if kind == 'think':
        return f'<path d="M-7,21 Q-2,18 2,21 Q5,23 8,20" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
    return f'<path d="M-8,18 Q-4,23 0,18 Q4,23 8,18" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'

def body_svg(pose='normal', k='nb'):
    """のびー本体（<g> の中身）。原点＝体の中心。"""
    g = '<ellipse cx="0" cy="54" rx="50" ry="9" fill="#285a3c" fill-opacity=".13"/>'
    g += ''.join(f'<ellipse cx="{d*20}" cy="46" rx="15" ry="9" fill="#6cbf80" stroke="{L}" stroke-width="3"/>' for d in (-1, 1))
    tilt = {'think': -8, 'joy': 0, 'surprise': 0}.get(pose, 0)
    g += f'<g transform="rotate({tilt} 0 -44)"><path d="M0,-38 Q2,-54 0,-66" fill="none" stroke="{L}" stroke-width="5" stroke-linecap="round"/>'
    spread = {'joy': 64, 'surprise': 66, 'think': 48}.get(pose, 54)
    for d in (-1, 1):
        g += (f'<g transform="translate(0,-64) rotate({d*spread})"><path d="M0,0 C{d*22},-6 {d*24},-34 0,-42 C{d*-16},-32 {d*-12},-8 0,0Z" fill="url(#{k}l)" stroke="{L}" stroke-width="3"/>'
              f'<path d="M0,-3 Q{d*4},-20 0,-36" fill="none" stroke="#2e7846" stroke-opacity=".55" stroke-width="2"/>'
              f'<ellipse cx="{d*6}" cy="-28" rx="3.5" ry="6" fill="#fff" fill-opacity=".55" transform="rotate({d*23} {d*6} -28)"/></g>')
    g += '</g>'
    # 後ろの手（体のうしろに少し見える）
    back = {'normal': [(-50, 10, 26), (50, 10, -26)], 'wave': [(-50, 10, 26)], 'point': [(-50, 10, 26)], 'think': [(-50, 10, 26)],
            'surprise': [], 'joy': [], 'read': []}[pose]
    g += ''.join(hand(x, y, a) for x, y, a in back)
    g += f'<path d="M0,-46 C40,-46 60,-18 60,12 C60,40 34,50 0,50 C-34,50 -60,40 -60,12 C-60,-18 -40,-46 0,-46Z" fill="url(#{k}b)" stroke="{L}" stroke-width="3.5"/>'
    g += '<ellipse cx="-30" cy="-22" rx="9" ry="5" fill="#fff" fill-opacity=".7" transform="rotate(-34 -30 -22)"/><circle cx="-17" cy="-31" r="2.6" fill="#fff" fill-opacity=".7"/>'
    g += ''.join(f'<circle cx="{d*33}" cy="16" r="13" fill="url(#{k}c)"/>' for d in (-1, 1))
    g += eyes({'joy': 'joy', 'think': 'think', 'surprise': 'surprise', 'read': 'read'}.get(pose, 'open')) + mouth(pose)
    # 前の手・小物
    if pose == 'wave': g += hand(52, -4, -158)
    if pose == 'point': g += hand(54, 6, -109) + f'<circle cx="80" cy="-2" r="5" fill="{HAND}" stroke="{L}" stroke-width="3"/>'
    if pose == 'think': g += hand(30, 26, -150) + f'<text x="62" y="-44" font-size="34" font-weight="800" fill="#4a90d9" font-family="sans-serif">?</text>'
    if pose == 'surprise': g += hand(-54, -6, 150) + hand(54, -6, -150) + f'<text x="56" y="-50" font-size="36" font-weight="900" fill="#f08a24" font-family="sans-serif">!</text>'
    if pose == 'joy':
        g += hand(-56, -10, 160) + hand(56, -10, -160)
        for x, y, r in ((-74, -58, 7), (76, -64, 8), (-62, -84, 4.5), (64, -88, 4)):
            g += f'<path d="M{x},{y-r} L{x+r*.3},{y-r*.3} L{x+r},{y} L{x+r*.3},{y+r*.3} L{x},{y+r} L{x-r*.3},{y+r*.3} L{x-r},{y} L{x-r*.3},{y-r*.3}Z" fill="#f6c945"/>'
    if pose == 'read':
        # 開いた本を両手で持つ
        g += ('<g transform="translate(0,42) scale(.85)"><path d="M-40,-14 Q-20,-20 0,-12 L0,16 Q-20,8 -40,14Z" fill="#fff" stroke="#c0503c" stroke-width="3" stroke-linejoin="round"/>'
              '<path d="M40,-14 Q20,-20 0,-12 L0,16 Q20,8 40,14Z" fill="#fff" stroke="#c0503c" stroke-width="3" stroke-linejoin="round"/>'
              '<path d="M-32,-6 Q-18,-10 -6,-5 M-32,2 Q-18,-2 -6,3 M32,-6 Q18,-10 6,-5 M32,2 Q18,-2 6,3" fill="none" stroke="#9aa8b8" stroke-width="2" stroke-linecap="round"/></g>')
        g += hand(-40, 30, 60) + hand(40, 30, -60)
    return g

POSES = ['normal', 'wave', 'point', 'think', 'surprise', 'joy', 'read']

def svg_file(pose, label='のびー'):
    k = 'nb' + pose
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-92 -116 184 180" width="184" height="180" role="img" aria-label="{label}">'
            + defs(k) + body_svg(pose, k) + '</svg>\n')

if __name__ == '__main__':
    out = pathlib.Path(__file__).resolve().parents[3] / 'site-assets'
    for p in POSES: (out / f'nobi-{p}.svg').write_text(svg_file(p), encoding='utf-8')
    print('書き出し', len(POSES), out)
