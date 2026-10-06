"""理科1 しくみの図（D01）15枚（Claude・2026-10-06）。中身は 理科全体制作/原稿 の要点・表から取る。
作図（光・レンズ・ばね）は数式で座標を計算して描く。"""
import math
from svg import SVG, COL, PAIRS, W, H, width, fit
from layouts import flow, compare, table, tree, nest, pyramid, relation, timeline

def D(code):
    g = SVG(); t = FIG[code](g); g.title = t or code; return g.done()
def lab(g, s, x, y, z=19, col=None, anchor='middle', w=800): g.text(s, x, y, z, col or COL['ink'], anchor, w)

def l1(g):
    t = g.title_bar('ルーペの使い方：目に近づけて持ち、動かせる方を動かす')
    for k, (head, who) in enumerate([('動かせるものを見るとき', '見るものを前後に動かす'), ('動かせないものを見るとき', '自分（顔とルーペ）が前後に動く')]):
        x0 = 30 + k * 465; g.rect(x0, t + 10, 435, 330, '#fff', COL['line'], 2)
        lab(g, head, x0 + 217, t + 45, 22, COL[PAIRS[k][0]])
        ex, ey = x0 + 80, t + 190
        g.ellipse(ex, ey, 26, 16, '#fff', COL['ink'], 3); g.circle(ex + 6, ey, 8, COL['ink'])
        g.ellipse(ex + 55, ey, 9, 48, COL['sky'], COL['blue'], 3); g.rect(ex + 50, ey + 46, 10, 50, '#8a5a2b', None, r=3)
        lab(g, 'ルーペ', ex + 55, ey - 62, 16, COL['blue'])
        fx = x0 + 300
        g.line(fx, ey + 10, fx, ey + 70, COL['green'], 5); g.circle(fx, ey, 22, '#f6a5b5', '#c8414f', 3); g.circle(fx, ey, 7, COL['yellow'])
        if k == 0: g.arrow(fx - 60, ey + 82, fx + 60, ey + 82, COL['orange'], 4, 12, both=True); lab(g, '花を動かす', fx, ey + 108, 18, COL['orange'])
        else: g.arrow(ex - 40, ey + 82, ex + 90, ey + 82, COL['orange'], 4, 12, both=True); lab(g, '自分が動く', ex + 25, ey + 108, 18, COL['orange'])
        lab(g, who, x0 + 217, t + 330, 19)
    g.card(30, 420, 900, 100, 'ルーペは目に近づけて持つ。太陽をルーペで見てはいけない（目をいためる）。', 4, big=22)
    return 'ルーペの使い方'
def l2(g):
    t = g.title_bar('アブラナの花のつくり（外側から：がく・花弁・おしべ・めしべ）')
    cx, by = 330, 470
    for d in (-1, 1):   # がく（いちばん外側・下）
        g.path(f'M{cx + d * 40},{by} Q{cx + d * 175},{by - 30} {cx + d * 195},{by - 95} Q{cx + d * 120},{by - 55} {cx + d * 30},{by - 10} Z', COL['mint'], COL['green'], 3)
    for d in (-1, 1):   # 花弁
        g.path(f'M{cx + d * 35},{by - 10} Q{cx + d * 175},{by - 120} {cx + d * 150},{by - 250} Q{cx + d * 90},{by - 150} {cx + d * 25},{by - 25} Z', '#fff6a8', '#c9a400', 3)
    for d in (-1, 1):   # おしべ
        g.line(cx + d * 22, by - 20, cx + d * 55, by - 175, COL['ink'], 3); g.ellipse(cx + d * 55, by - 188, 11, 17, '#f6c945', '#b58900', 2)
    g.ellipse(cx, by - 50, 28, 46, COL['sky'], COL['blue'], 3)   # 子房
    for k in range(3): g.circle(cx, by - 72 + k * 22, 7, '#fff', COL['blue'], 2)   # 胚珠
    g.line(cx, by - 96, cx, by - 215, COL['blue'], 4); g.ellipse(cx, by - 220, 16, 8, COL['blue'], None)
    g.line(cx - 200, by + 4, cx + 200, by + 4, COL['green'], 5)
    labels = [('柱頭', cx + 16, by - 220, 640, by - 270), ('やく（おしべ）', cx + 66, by - 190, 640, by - 225), ('めしべ', cx + 4, by - 160, 640, by - 180),
              ('花弁', cx + 150, by - 200, 640, by - 135), ('胚珠', cx + 8, by - 50, 640, by - 90), ('子房', cx + 28, by - 30, 640, by - 45), ('がく', cx + 170, by - 60, 640, by + 0)]
    for s2, x1, y1, x2, y2 in labels:
        g.circle(x1, y1, 3.5, COL['gray']); g.line(x1, y1, x2 - 8, y2, COL['gray'], 1.5); lab(g, s2, x2, y2 + 7, 20, None, 'start')
    g.card(800, t + 30, 140, 190, '受粉すると\n子房→果実\n胚珠→種子', 1, big=18)
    g.card(800, t + 240, 140, 190, '胚珠が\n子房の中\n＝被子植物', 2, big=18)
    lab(g, '（花を縦に切った模式図）', 330, 530, 15, COL['gray'], 'middle', 600)
    return 'アブラナの花のつくり'

def l3(g):
    t = g.title_bar('植物の分類（種子をつくる？ → 胚珠は？ → 子葉は？）')
    tree(g, '植物', [('種子植物（種子でふえる）', [('被子植物（胚珠が子房の中）', [('単子葉類', '子葉1枚・平行脈・ひげ根'), ('双子葉類', '子葉2枚・網状脈・主根と側根')]), ('裸子植物', '胚珠がむき出し（マツ・イチョウ）')]),
                     ('種子をつくらない（胞子でふえる）', [('シダ植物', '根・茎・葉の区別がある'), ('コケ植物', '区別がない・仮根')])], t + 2, 528)
    return '植物の分類の木'
def l4(g):
    t = g.title_bar('セキツイ動物の5つのなかま（呼吸・体表・ふえ方）')
    table(g, [['なかま', '呼吸', '体表', 'ふえ方'], ['魚類', 'えら', 'うろこ', '卵生（水中・殻なし）'], ['両生類', '子：えら／親：肺と皮膚', 'しめった皮膚', '卵生（水中・殻なし）'],
              ['は虫類', '肺', 'うろこ', '卵生（陸上・殻あり）'], ['鳥類', '肺', '羽毛', '卵生（陸上・殻あり）'], ['哺乳類', '肺', '毛', '胎生']], t + 10, 525)
    return 'セキツイ動物の比べ表'
def e1(g):
    t = g.title_bar('地震計の記録：P波→初期微動、S波→主要動')
    x0, y0, x1 = 60, t + 170, 900
    g.line(x0, y0, x1, y0, COL['gray'], 1.5)
    pa, sa = 200, 470
    pts = []
    for k in range(x0, x1, 3):
        if k < pa: a = 1
        elif k < sa: a = 18
        else: a = 110 * math.exp(-(k - sa) / 220) + 6
        pts.append((k, y0 + a * math.sin(k * .55) * (0.6 + 0.4 * math.sin(k * .13))))
    g.path('M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts), 'none', COL['ink'], 2)
    for x, s, c in [(pa, 'P波が着く', 'blue'), (sa, 'S波が着く', 'red')]:
        g.line(x, t + 30, x, t + 300, COL[c], 2, '6 5'); lab(g, s, x, t + 25, 18, COL[c])
    g.arrow(pa, t + 260, sa, t + 260, COL['orange'], 4, 12, both=True, label='初期微動継続時間')
    lab(g, '初期微動（小さなゆれ）', (pa + sa) / 2, t + 110, 19, COL['blue']); lab(g, '主要動（大きなゆれ）', 680, t + 40, 19, COL['red'])
    lab(g, '時間 →', 880, y0 + 30, 16, COL['gray'], 'end', 600)
    compare(g, [('P波', ['速い（約6〜8km/s）', '初期微動を起こす']), ('S波', ['おそい（約3〜4km/s）', '主要動を起こす']), ('初期微動継続時間', ['震源からの距離に比例する', '遠いほど長い'])], t + 320, 528)
    return '地震計の記録'
def e2(g):
    t = g.title_bar('マグマのねばりけと火山の形')
    base = t + 250
    shapes = [('ドーム状（昭和新山）', f'M80,{base} Q90,{base - 160} 170,{base - 170} Q250,{base - 160} 260,{base} Z', '#e9e4dc', 0),
              ('円錐形（富士山）', f'M340,{base} L460,{base - 170} L580,{base} Z', '#b9a99a', 1),
              ('たて状（マウナロア）', f'M640,{base} Q770,{base - 70} 900,{base} Z', '#5a4d44', 2)]
    for s, d, fill, k in shapes:
        g.path(d, fill, COL['ink'], 3)
    for x, s in [(170, shapes[0][0]), (460, shapes[1][0]), (770, shapes[2][0])]: lab(g, s, x, base + 32, 19)
    g.arrow(80, base + 70, 900, base + 70, COL['orange'], 5, 14, both=True)
    lab(g, 'ねばりけが強い', 80, base + 60, 18, COL['ink'], 'start'); lab(g, 'ねばりけが弱い', 900, base + 60, 18, COL['ink'], 'end')
    compare(g, [('ねばりけが強い', ['激しい噴火', '白っぽい岩石']), ('中くらい', ['円錐形']), ('ねばりけが弱い', ['おだやかな噴火', '黒っぽい岩石'])], base + 90, 528)
    return 'マグマのねばりけと火山の形'
def e3(g):
    t = g.title_bar('河口から沖へ：粒の大きさと積もる場所')
    g.path(f'M30,{t + 120} L250,{t + 120} L250,{t + 140} L930,{t + 140} L930,{t + 340} L30,{t + 340} Z', '#cfe9fb', None)
    g.path(f'M30,{t + 120} L250,{t + 120} Q300,{t + 200} 930,{t + 300} L930,{t + 340} L30,{t + 340} Z', '#e9dcc4', COL['ink'], 2)
    lab(g, '陸（川）', 120, t + 105, 20); lab(g, '海', 700, t + 175, 22, COL['blue'])
    g.arrow(120, t + 80, 330, t + 80, COL['blue'], 4, 12, label='川が運ぶ')
    for k, (s, x, r, c) in enumerate([('れき（2mm以上）', 330, 9, '#8a6f50'), ('砂', 560, 5, '#c2a26f'), ('泥（0.06mm以下）', 800, 2.5, '#8a7a6a')]):
        for j in range(16): g.circle(x - 80 + (j % 8) * 22, t + 230 + (j // 8) * 18 + (x - 330) * .08, r, c)
        lab(g, s, x, t + 368, 20)
    g.arrow(250, t + 398, 930, t + 398, COL['orange'], 4, 12, label='岸から遠いほど、粒が小さい')
    g.card(30, 478, 900, 50, '粒が大きいものほど速く沈むので、岸の近くに積もる。粒は角がとれて丸い。', 3, big=19)
    return '粒の大きさと積もる場所'
def m1(g):
    t = g.title_bar('密度＝質量÷体積（1cm³あたりの質量）')
    for k, (nm, d, c) in enumerate([('水', '1.00 g', 'sky'), ('アルミニウム', '2.70 g', 'line'), ('鉄', '7.87 g', 'gray')]):
        x = 90 + k * 290; y = t + 60; s = 120
        g.path(f'M{x},{y + 30} L{x + 30},{y} L{x + s + 30},{y} L{x + s + 30},{y + s} L{x + s},{y + s + 30} L{x},{y + s + 30} Z', COL[c] if c != 'gray' else '#c7cdd4', COL['ink'], 2)
        g.path(f'M{x},{y + 30} L{x + s},{y + 30} L{x + s + 30},{y} M{x + s},{y + 30} L{x + s},{y + s + 30}', 'none', COL['ink'], 2)
        lab(g, nm, x + 75, y - 18, 22); lab(g, '1 cm³', x + 60, y + 100, 18, COL['gray']); lab(g, d, x + 75, y + s + 70, 26, COL['orange'])
    g.card(150, t + 270, 660, 90, '密度〔g/cm³〕＝ 質量〔g〕÷ 体積〔cm³〕', 0, big=30)
    g.card(150, t + 380, 660, 80, '水（1.00）より密度が小さい物質は水にうき、大きい物質はしずむ。', 2, big=20)
    return '密度の図'
def m2(g):
    t = g.title_bar('気体の集め方（水へのとけやすさ・空気との重さで選ぶ）')
    for k, (nm, cond) in enumerate([('水上置換法', '水にとけにくい'), ('下方置換法', '水にとけやすく空気より重い'), ('上方置換法', '水にとけやすく空気より軽い')]):
        x0 = 30 + k * 305; g.rect(x0, t + 10, 290, 330, '#fff', COL['line'], 2); lab(g, nm, x0 + 145, t + 42, 23, COL[PAIRS[k][0]])
        cx = x0 + 160
        if k == 0:
            g.rect(x0 + 40, t + 200, 220, 110, '#cfe9fb', COL['ink'], 2, r=6)
            g.rect(cx - 22, t + 110, 44, 150, '#eaf6ff', COL['ink'], 2, r=4); g.rect(cx - 22, t + 110, 44, 60, '#fff', None, r=4)
            g.path(f'M{x0 + 20},{t + 160} L{x0 + 60},{t + 160} L{x0 + 60},{t + 290} L{cx},{t + 290} L{cx},{t + 240}', 'none', COL['ink'], 3)
            for j in range(3): g.circle(cx, t + 225 - j * 22, 5, '#fff', COL['blue'], 1.5)
        elif k == 1:
            g.rect(cx - 25, t + 120, 50, 190, '#fff', COL['ink'], 2, r=4)
            g.path(f'M{x0 + 30},{t + 100} L{cx},{t + 100} L{cx},{t + 290}', 'none', COL['ink'], 3)
            g.arrow(cx + 40, t + 160, cx + 40, t + 280, COL['orange'], 3, 10); lab(g, '下にたまる', cx + 50, t + 230, 15, COL['orange'], 'start')
        else:
            g.rect(cx - 25, t + 80, 50, 190, '#fff', COL['ink'], 2, r=4)
            g.path(f'M{x0 + 30},{t + 300} L{cx},{t + 300} L{cx},{t + 100}', 'none', COL['ink'], 3)
            g.arrow(cx + 40, t + 250, cx + 40, t + 110, COL['orange'], 3, 10); lab(g, '上にたまる', cx + 50, t + 180, 15, COL['orange'], 'start')
        g.para(cond, x0 + 10, t + 345, 270, 50, 19, 13, None, 'middle')
    g.card(30, 465, 900, 60, '例：酸素・水素→水上置換法　二酸化炭素→水上・下方置換法　アンモニア→上方置換法', 3, big=19)
    lab(g, '（模式図）', 920, t + 30, 14, COL['gray'], 'end', 600)
    return '気体の集め方'
def m3(g):
    t = g.title_bar('溶質・溶媒・溶液と、質量パーセント濃度')
    def beaker(x, y, txt, fill, dots):
        g.path(f'M{x},{y} L{x},{y + 150} Q{x},{y + 170} {x + 20},{y + 170} L{x + 120},{y + 170} Q{x + 140},{y + 170} {x + 140},{y + 150} L{x + 140},{y}', 'none', COL['ink'], 3)
        if fill: g.rect(x + 3, y + 50, 134, 117, fill, None, r=8)
        for i in range(dots): g.circle(x + 20 + (i * 37) % 110, y + 70 + (i * 23) % 80, 4, COL['orange'])
        lab(g, txt, x + 70, y + 200, 21)
    g.circle(130, t + 150, 30, '#fff', COL['orange'], 3)
    for i in range(7): g.circle(115 + (i % 4) * 9, t + 140 + (i // 4) * 12, 4, COL['orange'])
    lab(g, '溶質（食塩）', 130, t + 220, 21); lab(g, '＋', 250, t + 160, 40, COL['gray'])
    beaker(300, t + 60, '溶媒（水）', '#cfe9fb', 0); lab(g, '＝', 500, t + 160, 40, COL['gray'])
    beaker(560, t + 60, '溶液（食塩水）', '#cfe9fb', 12)
    lab(g, '溶質はとけて全体に均一に広がる', 630, t + 40, 16, COL['gray'], 'middle', 600)
    g.card(60, t + 290, 840, 80, '濃度〔%〕＝ 溶質の質量 ÷ 溶液の質量 × 100', 0, big=28)
    g.card(60, t + 385, 840, 70, '溶液の質量 ＝ 溶質の質量 ＋ 溶媒の質量', 2, big=24)
    return '溶質・溶媒・溶液'
def m4(g):
    t = g.title_bar('固体・液体・気体の粒子のモデル')
    import random; rnd = random.Random(3)
    for k, (nm, note) in enumerate([('固体', '規則正しく並び、その場でふるえる'), ('液体', '自由に動くが、たがいにくっついている'), ('気体', '飛び回り、間が大きくあいている')]):
        x0 = 40 + k * 300; g.rect(x0, t + 20, 270, 270, '#fff', COL[PAIRS[k][0]], 3); lab(g, nm, x0 + 135, t + 330, 26, COL[PAIRS[k][0]])
        if k == 0:
            for i in range(5):
                for j in range(5): g.circle(x0 + 55 + j * 40, t + 75 + i * 40, 15, COL['sky'], COL['blue'], 2)
        elif k == 1:
            for i in range(22): g.circle(x0 + 40 + rnd.random() * 190, t + 110 + rnd.random() * 150, 15, COL['sky'], COL['blue'], 2)
        else:
            for i in range(7):
                x, y = x0 + 40 + rnd.random() * 190, t + 50 + rnd.random() * 210
                g.circle(x, y, 15, COL['sky'], COL['blue'], 2); a = rnd.random() * 6.28; g.arrow(x + 18 * math.cos(a), y + 18 * math.sin(a), x + 48 * math.cos(a), y + 48 * math.sin(a), COL['orange'], 2.5, 8)
        g.para(note, x0, t + 345, 270, 60, 19, 13, None, 'middle')
    g.card(40, 470, 870, 55, '状態が変わっても、粒の数は変わらない → 質量は変わらない（体積は変わる）', 3, big=19)
    return '粒子のモデル'
def n1(g):
    t = g.title_bar('反射（入射角＝反射角）と屈折（空気→水）')
    # 反射
    mx, my = 240, t + 330
    g.line(60, my, 420, my, COL['ink'], 5); lab(g, '鏡', 400, my + 30, 18)
    g.line(mx, my, mx, t + 60, COL['gray'], 2, '7 6'); lab(g, '鏡に垂直な線', mx, t + 50, 15, COL['gray'])
    a = math.radians(40); L = 230
    g.arrow(mx - L * math.sin(a), my - L * math.cos(a), mx, my, COL['red'], 4, 13); g.arrow(mx, my, mx + L * math.sin(a), my - L * math.cos(a), COL['red'], 4, 13)
    g.path(f'M{mx},{my - 70} A70,70 0 0,0 {mx - 70 * math.sin(a):.1f},{my - 70 * math.cos(a):.1f}', 'none', COL['orange'], 3)
    g.path(f'M{mx},{my - 85} A85,85 0 0,1 {mx + 85 * math.sin(a):.1f},{my - 85 * math.cos(a):.1f}', 'none', COL['green'], 3)
    lab(g, '入射角', mx - 70, my - 100, 17, COL['orange']); lab(g, '反射角', mx + 75, my - 110, 17, COL['green'])
    lab(g, '入射角 ＝ 反射角', 240, t + 380, 22, COL['red'])
    # 屈折
    bx, by = 700, t + 200
    g.rect(500, by, 430, 160, '#cfe9fb', None, r=0); g.line(500, by, 930, by, COL['blue'], 3)
    lab(g, '空気', 520, by - 12, 18, None, 'start'); lab(g, '水', 520, by + 30, 18, COL['blue'], 'start')
    g.line(bx, t + 50, bx, t + 350, COL['gray'], 2, '7 6'); lab(g, '垂直な線（法線）', bx, t + 45, 15, COL['gray'])
    ai, ar = math.radians(50), math.asin(math.sin(math.radians(50)) / 1.33)
    g.arrow(bx - 170 * math.sin(ai), by - 170 * math.cos(ai), bx, by, COL['red'], 4, 13); g.arrow(bx, by, bx + 150 * math.sin(ar), by + 150 * math.cos(ar), COL['red'], 4, 13)
    g.path(f'M{bx},{by - 60} A60,60 0 0,0 {bx - 60 * math.sin(ai):.1f},{by - 60 * math.cos(ai):.1f}', 'none', COL['orange'], 3)
    g.path(f'M{bx},{by + 70} A70,70 0 0,0 {bx + 70 * math.sin(ar):.1f},{by + 70 * math.cos(ar):.1f}', 'none', COL['green'], 3)
    lab(g, '入射角', bx - 60, by - 75, 17, COL['orange']); lab(g, '屈折角', bx + 70, by + 100, 17, COL['green'])
    lab(g, '空気→水：入射角 ＞ 屈折角', 715, t + 380, 22, COL['red'])
    g.card(30, 465, 900, 60, '水やガラス→空気では 入射角 ＜ 屈折角。入射角が大きいと全反射（光ファイバー）。', 3, big=19)
    return '反射と屈折の作図'
def n2(g):
    t = g.title_bar('凸レンズの作図：3本の光と実像（物体が焦点距離の2倍より遠いとき）')
    lx, ay, f = 470, t + 210, 100
    do, ho = 300, 90; di = 1 / (1 / f - 1 / do); hi = -ho * di / do
    g.line(30, ay, 930, ay, COL['gray'], 2); lab(g, '光軸', 925, ay - 8, 14, COL['gray'], 'end', 600)
    g.ellipse(lx, ay, 14, 150, COL['sky'], COL['blue'], 3)
    for d in (-1, 1):
        for m, s in ((1, 'F'), (2, '2F')):
            g.circle(lx + d * m * f, ay, 5, COL['ink']); lab(g, ('焦点 ' if m == 1 else '') + s, lx + d * m * f, ay + 26, 15)
    ox, oy = lx - do, ay - ho; ix, iy = lx + di, ay - hi
    g.arrow(ox, ay, ox, oy, COL['green'], 5, 14); lab(g, '物体', ox, oy - 12, 18, COL['green'])
    g.arrow(ix, ay, ix, iy, COL['red'], 5, 14); lab(g, '実像（さかさま・小さい）', ix + 10, iy + 30, 17, COL['red'], 'start')
    c = COL['orange']
    g.line(ox, oy, lx, oy, c, 3); g.line(lx, oy, ix, iy, c, 3)
    g.line(ox, oy, ix, iy, c, 3)
    yl = ay + (oy - ay) * (0 - 0) ; xF = lx - f; ylens = oy + (ay - oy) * (lx - ox) / (xF - ox)
    g.line(ox, oy, lx, ylens, c, 3); g.line(lx, ylens, ix, ylens, c, 3)
    for k, (s, y) in enumerate([('① 光軸に平行な光 → 反対側の焦点を通る', t + 330), ('② レンズの中心を通る光 → まっすぐ進む', t + 362), ('③ 焦点を通った光 → 光軸に平行に進む', t + 394)]):
        lab(g, s, 60, y, 18, None, 'start', 700)
    table(g, [['物体の位置', '像'], ['2Fより遠い', '小さい実像'], ['2Fの位置', '同じ大きさの実像'], ['2FとFの間', '大きい実像'], ['Fの位置', 'できない'], ['Fより内側', '大きい虚像（同じ向き）']], t + 300, 528, x0=560)
    return '凸レンズの作図'
def n3(g):
    t = g.title_bar('オシロスコープの波形：振幅＝音の大きさ、振動数＝音の高さ')
    def wave(x0, y0, amp, n, col, title):
        g.rect(x0, y0 - 95, 270, 190, '#0f2a1a', None, r=8); g.line(x0 + 10, y0, x0 + 260, y0, '#2e5a3d', 1)
        pts = [(x0 + 10 + i, y0 - amp * math.sin(i / 250 * n * 2 * math.pi)) for i in range(0, 251, 2)]
        g.path('M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts), 'none', '#7CFC9A', 3)
        lab(g, title, x0 + 135, y0 + 125, 19, col)
    wave(40, t + 130, 30, 3, COL['ink'], 'もとの音'); wave(345, t + 130, 75, 3, COL['red'], '大きい音（振幅が大きい）'); wave(650, t + 130, 30, 7, COL['blue'], '高い音（振動数が多い）')
    compare(g, [('音の大きさ', ['振幅（振れ幅）が大きいほど大きい音', 'たての高さを見る']), ('音の高さ', ['振動数（1秒間の振動の回数）が多いほど高い音', '単位はヘルツ（Hz）・山の数を見る']), ('弦の場合', ['短い・細い・強くはる → 高い音'])], t + 290, 528)
    return 'オシロスコープの波形'
def n4(g):
    t = g.title_bar('ばねののびと力の大きさ（フックの法則：比例）')
    x0, y0, sx, sy = 120, t + 345, 170, 36
    g.line(x0, y0, x0 + 3 * sx + 40, y0, COL['ink'], 3); g.line(x0, y0, x0, y0 - 7 * sy, COL['ink'], 3)
    for i in range(1, 4): g.line(x0 + i * sx, y0 - 7 * sy, x0 + i * sx, y0, COL['line'], 1); lab(g, str(i), x0 + i * sx, y0 + 26, 18)
    for j in range(1, 7): g.line(x0, y0 - j * sy, x0 + 3 * sx + 20, y0 - j * sy, COL['line'], 1); lab(g, str(j), x0 - 14, y0 - j * sy + 6, 16, None, 'end')
    lab(g, '0', x0 - 12, y0 + 22, 16); lab(g, '力の大きさ〔N〕', x0 + 3 * sx, y0 + 52, 18, None, 'end'); lab(g, 'ばねののび〔cm〕', x0 - 10, y0 - 7 * sy - 12, 18, None, 'start')
    g.line(x0, y0, x0 + 3 * sx, y0 - 6 * sy, COL['red'], 4)
    for i in range(1, 4): g.circle(x0 + i * sx, y0 - 2 * i * sy, 7, COL['red'], '#fff', 2)
    g.card(720, t + 30, 210, 170, '原点を通る直線\n＝ のびは力に比例', 0, big=20)
    g.card(720, t + 215, 210, 170, '例：1N で 2cm\n2N で 4cm\n3N で 6cm', 1, big=20)
    g.card(30, 470, 900, 55, '力は矢印で表す：作用点・向き・大きさ（矢印の長さ）。', 3, big=19)
    return 'ばねののびと力の大きさ'

FIG = {'S1-LIFE-S1': l1, 'S1-LIFE-S2': l2, 'S1-LIFE-S3': l3, 'S1-LIFE-S4': l4, 'S1-EARTH-S1': e1, 'S1-EARTH-S2': e2, 'S1-EARTH-S3': e3,
       'S1-MATTER-S1': m1, 'S1-MATTER-S2': m2, 'S1-MATTER-S3': m3, 'S1-MATTER-S4': m4, 'S1-ENERGY-S1': n1, 'S1-ENERGY-S2': n2, 'S1-ENERGY-S3': n3, 'S1-ENERGY-S4': n4}
