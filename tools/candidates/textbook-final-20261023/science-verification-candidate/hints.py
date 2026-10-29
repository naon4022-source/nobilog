#!/usr/bin/env python3
"""確認（DQ）・練習（DP）の「手がかり」図をつくる（Claude・2026-10-05）。
DQ：その節の要点を、見出しごとの箱に整理した図。確認問題の答えになる言葉は（？）でかくす。
DP：例題の「考える順番」と、表（なければ かんたんにやる方法）を並べた図。練習問題の答えになる言葉は（？）でかくす。
中身はすべて原稿（教科書・ワークで根拠を確かめたもの）から取り、新しい事実は足さない。
  python3 hints.py kokugo1 [english1 ...]"""
import sys
from svg import SVG, COL, W, H
from layouts import compare, table, flow
from common import lessons, media, answer_tokens, Masker, soft
from reviewed_fractions import final_svg

def footer(g, s):
    g.rect(20, 492, W - 40, 40, COL['lemon'], COL['yellow'], 2, r=12); g.text(s, 70, 519, 18, COL['ink'], 'start', 700); g.sprout(40, 520, .5)

def dq(code, L):
    toks = answer_tokens(L['q']); g = SVG('確認問題を解く手がかり：' + L['title'])
    top = g.title_bar('確認問題を解く手がかり：' + L['title'])
    m = Masker(toks); cols = [(h.replace('**', ''), [m(soft(x)) for x in items[:4]]) for h, items in L['keys'][:3]]
    compare(g, cols, top + 6, 482)
    footer(g, '（？）に入る言葉が、確認問題の答えにつながるよ。本文で見つけよう。')
    return final_svg(code+'-DQ',g.done())

def dp(code, L):
    toks = answer_tokens(L['p']); g = SVG('練習問題の手がかり：' + L['title'])
    top = g.title_bar('練習問題の手がかり：' + L['title'])
    m = Masker(toks); steps = [m(soft(s)) for s in L['ex']['steps']][:5]
    # 左：考える順番
    g.rect(20, top + 4, 400, 482 - top - 4, '#fff', COL['line'], 2); g.text('考える順番', 40, top + 36, 22, COL['blue'], weight=800)
    n = len(steps); y0 = top + 50; hh = (482 - y0 - 10 - 10 * (n - 1)) / max(1, n)
    for k, s in enumerate(steps):
        y = y0 + k * (hh + 10); g.badge(k + 1, 52, y + hh / 2, COL['orange'])
        g.card(78, y, 330, hh, s, 1, big=20, small=11, anchor='start', sw=2)
    # 右：表 または かんたんにやる方法
    if L.get('table') and len(L['table']) <= 6 and max(len(r) for r in L['table']) <= 4:
        rows = [[m(soft(str(c))) if i else soft(str(c)) for c in r] for i, r in enumerate(L['table'])]
        # 表は右半分に入るように列幅を計算しなおす
        from svg import width
        nr, nc = len(rows), max(len(r) for r in rows); x0, x1 = 432, W - 20
        ws = [max(width(r[c] if c < len(r) else '', 18) for r in rows) + 24 for c in range(nc)]; tot = sum(ws); ws = [w * (x1 - x0) / tot for w in ws]
        rh = min(64, (482 - top - 4) / nr); y = top + 4 + ((482 - top - 4) - rh * nr) / 2
        for i, r in enumerate(rows):
            x = x0
            for c in range(nc):
                g.rect(x, y, ws[c], rh, COL['blue'] if i == 0 else ('#fff' if i % 2 else '#f7f9fc'), COL['line'], 1.5, r=0)
                g.para(r[c] if c < len(r) else '', x + 6, y + 3, ws[c] - 12, rh - 6, 20, 10, '#fff' if i == 0 else None, 'middle', box=f't{i}{c}')
                x += ws[c]
            y += rh
    else:
        from layouts import compare as cmp
        sub_items = [m(soft(x)) for x in (L.get('easy') or L['sum'])[:4]]
        g.bullets(432, top + 4, W - 452, 482 - top - 4, sub_items, 2, head='かんたんにやる方法', big=21)
    footer(g, '順番どおりに考えてから、練習問題に答えよう。（？）は自分でうめてみよう。')
    return g.done()

if __name__ == '__main__':
    n = 0
    for book in sys.argv[1:]:
        out = media(book)
        for code, U, L in lessons(book):
            (out / f'{code}-DQ.svg').write_text(dq(code, L), encoding='utf-8')
            (out / f'{code}-DP.svg').write_text(dp(code, L), encoding='utf-8'); n += 2
    print('written', n)
