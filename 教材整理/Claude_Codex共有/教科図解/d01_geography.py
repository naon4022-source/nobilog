"""社会 地理 しくみの図（D01）12枚（Claude・2026-10-06）。地図の形は不正確になりやすいので、位置関係・向きを示す模式図にする。"""
import math
from svg import SVG, COL, PAIRS, W, H, width, fit
from layouts import flow, compare, table, tree, nest, pyramid, relation, timeline
def D(code):
    g = SVG(); t = FIG[code](g); g.title = t or code; return g.done()
def lab(g, s, x, y, z=19, col=None, anchor='middle', w=800): g.text(s, x, y, z, col or COL['ink'], anchor, w)
def note(g, s='（模式図）'): lab(g, s, 945, 538, 12, COL['gray'], 'end', 600)

def g1(g):
    t = g.title_bar('緯度と経度：赤道と本初子午線が0度')
    cx, cy, r = 250, t + 230, 195
    g.circle(cx, cy, r, '#cfe9fb', COL['blue'], 3)
    for lat in (-60, -30, 30, 60):
        y = cy - r * math.sin(math.radians(lat)); w = r * math.cos(math.radians(lat))
        g.ellipse(cx, y, w, w * .18, 'none', COL['gray'], 1.5); lab(g, f"{'北' if lat > 0 else '南'}緯{abs(lat)}度", cx + w + 8, y + 6, 14, COL['gray'], 'start', 700)
    g.ellipse(cx, cy, r, r * .18, 'none', COL['red'], 4); lab(g, '赤道', cx + r + 8, cy + 6, 17, COL['red'], 'start')
    for k in (-60, -30, 30, 60): g.ellipse(cx, cy, r * abs(math.sin(math.radians(k))), r, 'none', COL['gray'], 1.2)
    g.line(cx, cy - r, cx, cy + r, COL['orange'], 4); lab(g, '本初子午線（経度0度）', cx, cy - r - 12, 17, COL['orange'])
    lab(g, '北極', cx, cy - r + 22, 15, COL['blue']); lab(g, '南極', cx, cy + r - 10, 15, COL['blue'])
    g.card(560, t + 10, 370, 140, '赤道を0度として、南北に90度まで（北緯・南緯）。同じ緯度を結んだ線＝緯線。', 3, head='緯度', big=18)
    g.card(560, t + 165, 370, 160, 'イギリスのロンドンを通る本初子午線を0度として、東西に180度まで（東経・西経）。同じ経度を結んだ線＝経線。', 1, head='経度', big=18)
    g.card(560, t + 340, 370, 120, '日本はおよそ北緯20〜46度・東経122〜154度の間にある。', 2, big=18)
    return '緯度と経度の地球の図'
def g2(g):
    t = g.title_bar('時差：経度15度ごとに1時間ずれる')
    x0, x1, y = 60, 900, t + 120
    g.line(x0, y, x1, y, COL['ink'], 3)
    for k in range(0, 10):
        x = x0 + k * (x1 - x0) / 9; g.line(x, y - 10, x, y + 10, COL['ink'], 2); lab(g, f'{k * 15}°', x, y + 32, 15, COL['gray'])
    for x, nm, tm, c in [(x0, 'ロンドン（0度）', '午前3時', 'blue'), (x1, '東京（東経135度）', '正午', 'red')]:
        an = 'start' if x == x0 else 'end'; g.circle(x, y, 10, COL[c]); lab(g, nm, x, y - 60, 19, COL[c], an); lab(g, tm, x, y - 30, 22, COL[c], an)
    g.arrow(x0, y + 60, x1, y + 60, COL['orange'], 4, 12, both=True, label='経度の差 135度 ÷ 15 ＝ 9時間')
    flow(g, [('①', '経度の差を求める（東経どうしは引き算、東経と西経は足し算）'), ('②', '経度の差 ÷ 15 ＝ 時差'), ('③', '東にあるほど時刻が進んでいる')], t + 220, 450)
    g.card(30, 462, 900, 64, '地球は24時間で360度回る → 1時間で15度。日付変更線（ほぼ180度）を西から東へこえるときは日付を1日おくらせる。', 3, big=16)
    return '時差の図'
def g3(g):
    t = g.title_bar('世界の気候帯：赤道から両極へ')
    bands = [('寒帯', 70, 90, '#e8f4fb'), ('冷帯', 50, 70, '#c9dcef'), ('温帯', 30, 50, '#cfeccf'), ('乾燥帯', 15, 30, '#f3e2b3'), ('熱帯', 0, 15, '#f7c9b9')]
    cy, sc = t + 390, 4.0
    for nm, a, b, c in bands:
        y1, y2 = cy - a * sc, cy - b * sc
        g.rect(80, y2, 420, y1 - y2, c, COL['line'], 1, r=0); lab(g, nm, 290, (y1 + y2) / 2 + 7, 20)
    g.line(60, cy, 520, cy, COL['red'], 3); lab(g, '赤道', 60, cy + 22, 16, COL['red'], 'start'); lab(g, '北極', 290, cy - 90 * sc - 4, 15, COL['gray'])
    g.para('（北半球の模式図。南半球もほぼ同じ順にならぶが、冷帯はほとんどない）', 60, cy + 30, 460, 50, 16, 12, COL['gray'], 'middle')
    table(g, [['気候帯', '特徴', '暮らしの例'], ['熱帯', '一年中暑く雨が多い', '高床の家・いも類'], ['乾燥帯', '雨が少ない', '日干しれんが・遊牧'], ['温帯', '四季がある', '地中海式農業'], ['冷帯', '冬が長く寒い', 'タイガ・高床'], ['寒帯', '一年中寒い', 'イヌイット']], t + 20, 440, x0=540)
    g.card(540, 452, 390, 74, '高床の家：熱帯は湿気をにがす、冷帯は凍土をとかさない', 3, big=15)
    note(g, '（気候帯の並び方の模式図）')
    return '世界の気候帯の分布の図'
def g4(g):
    t = g.title_bar('季節風（モンスーン）の向きとアジアの農業')
    for k, (nm, frm, to, s, c) in enumerate([('夏', '海', '大陸', '海から湿った風 → 雨が多い', 'red'), ('冬', '大陸', '海', '大陸から乾いた風 → 雨が少ない', 'blue')]):
        x0 = 30 + k * 460
        g.rect(x0, t + 10, 440, 270, '#fff', COL['line'], 2); lab(g, nm + 'の季節風', x0 + 220, t + 45, 24, COL[c])
        g.rect(x0 + 20, t + 70, 190, 170, '#e9dcc4', None, r=8); lab(g, '大陸', x0 + 115, t + 165, 22)
        g.rect(x0 + 230, t + 70, 190, 170, '#cfe9fb', None, r=8); lab(g, '海', x0 + 325, t + 165, 22, COL['blue'])
        if frm == '海': g.arrow(x0 + 330, t + 205, x0 + 110, t + 205, COL[c], 6, 16)
        else: g.arrow(x0 + 110, t + 205, x0 + 330, t + 205, COL[c], 6, 16)
        g.para(s, x0 + 10, t + 245, 420, 30, 18, 13, COL[c], 'middle')
    compare(g, [('稲作', ['中国南部・東南アジア', '東南アジアでは年2回の二期作も']), ('小麦', ['中国北部・インド北部']), ('産業', ['中国：経済特区で工業化', 'インド：ICT産業'])], t + 300, 528)
    note(g)
    return '季節風の図'
def g5(g):
    t = g.title_bar('北大西洋海流と偏西風がヨーロッパをあたためる')
    g.rect(30, t + 10, 900, 330, '#cfe9fb', None, r=10)
    g.path(f'M560,{t + 30} L900,{t + 30} L900,{t + 320} L620,{t + 320} Q560,{t + 200} 600,{t + 120} Z', '#e9dcc4', COL['ink'], 2)
    lab(g, 'ヨーロッパ', 760, t + 190, 26); lab(g, '大西洋', 200, t + 200, 24, COL['blue'])
    g.path(f'M120,{t + 300} C260,{t + 260} 420,{t + 170} 580,{t + 90}', 'none', COL['red'], 8)
    g.arrow(560, t + 100, 590, t + 85, COL['red'], 8, 18); lab(g, '北大西洋海流（暖流）', 430, t + 245, 20, COL['red'])
    for k in range(3): g.arrow(100 + k * 30, t + 60 + k * 45, 540 + k * 20, t + 60 + k * 45, COL['orange'], 4, 13)
    lab(g, '偏西風（西から東へ）', 300, t + 50, 19, COL['orange'])
    g.card(30, 360, 900, 80, '暖流の上をわたってくる偏西風が、暖かさを運ぶ → 日本より北にあるのに、冬も比較的温暖', 3, big=20)
    g.card(30, 452, 900, 73, '農業：混合農業（作物＋家畜）・地中海式農業・酪農。EU：加盟国間の経済格差、移民・難民への対応。', 1, big=17)
    note(g)
    return '北大西洋海流と偏西風の図'
def g6(g):
    t = g.title_bar('アメリカの農業：適地適作（土地に合った作物をつくる）')
    regions = [(40, t + 20, 230, 330, '放牧・かんがい農業\n（西部・雨が少ない）', 4), (280, t + 20, 200, 150, '小麦', 1), (280, t + 180, 200, 170, '放牧・小麦', 1),
               (490, t + 20, 200, 160, 'とうもろこし・大豆', 2), (490, t + 190, 200, 160, '綿花', 3), (700, t + 20, 230, 160, '酪農（五大湖の周辺）', 0), (700, t + 190, 230, 160, '果樹・野菜など', 5)]
    for x, y, w, h, s, c in regions: g.card(x, y, w, h, s, c, big=20)
    g.line(275, t + 10, 275, t + 360, COL['red'], 4, '10 7'); lab(g, '西経100度', 275, t + 380, 17, COL['red'])
    lab(g, '← 西（雨が少ない）', 140, t + 380, 16, COL['gray']); lab(g, '東（雨が多い）→', 800, t + 380, 16, COL['gray'])
    g.card(30, t + 400, 900, 65, '気候や土地に合わせて地域ごとに作物を決め、大型機械で大規模に生産する（企業的な農業）。', 2, big=18)
    note(g, '（地域の並びを表した模式図。実際の地図の形ではない）')
    return 'アメリカの農業地域の図'
def g7(g):
    t = g.title_bar('等高線の間隔と傾斜（急・ゆるやか）')
    cx, cy = 260, t + 190
    rs = [170, 150, 128, 104, 78, 50, 22]
    for k, r in enumerate(rs): g.ellipse(cx - (170 - r) * .62, cy, r, r * .62, 'none', COL['ink'], 2)   # 中心を左へずらす → 左側の間隔がせまい
    lab(g, '上から見た等高線', cx, t + 30, 19, COL['blue'])
    lab(g, '左：間隔がせまい→急', cx - 120, cy + 135, 16, COL['red']); lab(g, '右：間隔が広い→ゆるやか', cx + 110, cy + 135, 16, COL['green'])
    g.line(cx - 170, cy, cx + 170, cy, COL['orange'], 2, '6 5')
    x0, y0 = 540, t + 320
    g.path(f'M{x0},{y0} L{x0 + 60},{y0 - 220} Q{x0 + 100},{y0 - 250} {x0 + 140},{y0 - 220} L{x0 + 380},{y0} Z', '#e9dcc4', COL['ink'], 3)
    lab(g, '断面図（オレンジの線で切る）', x0 + 190, t + 30, 19, COL['blue'])
    lab(g, '急', x0 + 20, y0 - 120, 22, COL['red']); lab(g, 'ゆるやか', x0 + 300, y0 - 120, 20, COL['green'])
    compare(g, [('等高線', ['同じ高さの地点を結んだ線', '2万5千分の1：主曲線10mごと', '5万分の1：主曲線20mごと']), ('縮尺', ['実際の距離＝地図上の長さ×縮尺の分母', '例：2万5千分の1で4cm → 1km'])], t + 345, 528)
    return '等高線と傾斜の図'
def g8(g):
    t = g.title_bar('人口ピラミッドの三つの型')
    for k, (nm, ws, note2) in enumerate([('富士山型', [1, .85, .7, .55, .4, .25, .12], '子どもが多い・お年寄りが少ない'),
                                         ('つりがね型', [.55, .6, .62, .6, .55, .45, .25], '子どもとおとなの数が近い'),
                                         ('つぼ型', [.35, .4, .5, .62, .66, .6, .45], '子どもが少ない（少子高齢化）')]):
        cx = 170 + k * 310; yb = t + 300; h = 34
        for i, w in enumerate(ws):
            y = yb - (i + 1) * h; g.rect(cx - 120 * w, y, 120 * w, h - 3, '#7fb2e5', None, r=0); g.rect(cx, y, 120 * w, h - 3, '#f2a3a3', None, r=0)
        g.line(cx, yb - 7 * h, cx, yb, COL['ink'], 1.5)
        lab(g, nm, cx, t + 30, 24, COL[PAIRS[k][0]]); g.para(note2, cx - 140, yb + 10, 280, 50, 18, 13, None, 'middle')
    lab(g, '上ほどお年寄り・下ほど子ども（左＝男性・右＝女性）', 480, t + 385, 16, COL['gray'])
    g.card(30, 455, 900, 70, '日本は 富士山型 → つりがね型 → つぼ型 と変化し、今は つぼ型（少子高齢化）。三大都市圏に人口が集中。', 3, big=18)
    note(g)
    return '人口ピラミッドの三つの型'
def g9(g):
    t = g.title_bar('太平洋ベルト：太平洋側に工業地帯・地域が帯のように連なる')
    names = [('北九州', 3), ('瀬戸内', 2), ('阪神', 0), ('中京', 1), ('東海', 4), ('京浜', 0), ('京葉', 2)]
    x = 40
    g.path(f'M30,{t + 190} C250,{t + 260} 600,{t + 230} 930,{t + 120}', 'none', COL['red'], 70, op=.15)
    for k, (nm, c) in enumerate(names):
        cx = 80 + k * 130; cy = t + 230 - (k ** 1.6) * 6
        g.circle(cx, cy, 44, COL[PAIRS[c][1]], COL[PAIRS[c][0]], 3); lab(g, nm, cx, cy + 7, 21, COL[PAIRS[c][0]])
    lab(g, '← 西', 60, t + 110, 18, COL['gray']); lab(g, '東 →', 900, t + 60, 18, COL['gray'])
    lab(g, '太平洋側', 480, t + 330, 20, COL['blue'])
    g.card(30, 420, 440, 105, '原料・燃料を船で輸入し、製品を輸出しやすい臨海部に工場が集まった。', 1, head='なぜ海ぞい？', big=17)
    g.card(490, 420, 440, 105, '工場が海外に移り、国内の産業がおとろえる＝産業の空洞化。', 4, head='課題', big=17)
    note(g, '（並び順を表した模式図）')
    return '太平洋ベルトの図'
def g10(g):
    t = g.title_bar('本州四国連絡橋の三つのルート')
    g.rect(30, t + 10, 900, 70, '#e9dcc4', COL['ink'], 2); lab(g, '本州', 480, t + 55, 26)
    g.rect(30, t + 80, 900, 170, '#cfe9fb', None, r=0); lab(g, '瀬戸内海', 330, t + 170, 18, COL['blue'])
    g.rect(30, t + 250, 900, 70, '#e9dcc4', COL['ink'], 2); lab(g, '四国', 480, t + 295, 26)
    routes = [(780, '神戸・鳴門ルート', '明石海峡大橋・大鳴門橋', 'red'), (480, '児島・坂出ルート', '瀬戸大橋（鉄道も通る）', 'orange'), (180, '尾道・今治ルート', 'しまなみ海道', 'green')]
    for x, nm, br, c in routes:
        g.line(x, t + 80, x, t + 250, COL[c], 8)
        for yy, txt, z in ((t + 120, nm, 18), (t + 215, br, 15)):
            w = width(txt, z) + 16; g.rect(x - w / 2, yy - z - 2, w, z + 12, '#fff', COL[c], 1.5, r=8); lab(g, txt, x, yy, z, COL[c])
    g.card(30, 395, 900, 130, '交通が便利になり、大都市に人や買い物客が吸い寄せられる＝ストロー現象。一方で、観光や物流は活発になった。', 3, head='橋ができて', big=18)
    note(g, '（東西の並び：左が西・右が東の模式図）')
    return '本州四国連絡橋の図'
def g11(g):
    t = g.title_bar('東京都心の昼間人口と夜間人口')
    for k, (nm, d, n) in enumerate([('都心', 300, 110), ('郊外', 150, 230)]):
        x0 = 120 + k * 400; base = t + 330
        g.rect(x0, base - d, 110, d, COL['orange'], None, r=4); g.rect(x0 + 130, base - n, 110, n, COL['blue'], None, r=4)
        lab(g, '昼', x0 + 55, base + 25, 18, COL['orange']); lab(g, '夜', x0 + 185, base + 25, 18, COL['blue']); lab(g, nm, x0 + 120, base + 60, 24)
    g.line(80, t + 330, 880, t + 330, COL['ink'], 2)
    g.arrow(660, t + 100, 300, t + 100, COL['gray'], 4, 12, label='通勤・通学で都心へ')
    g.card(30, 460, 900, 65, '都心は昼間人口が多く、郊外は夜間人口が多い。政治・経済・文化の機能が東京に集中（一極集中）。', 3, big=17)
    note(g, '（棒の長さは大小関係だけを表した模式図）')
    return '昼間人口と夜間人口の図'
def g12(g):
    t = g.title_bar('やませがふく向きと冷害（東北地方）')
    g.rect(30, t + 10, 900, 360, '#cfe9fb', None, r=10)
    g.path(f'M330,{t + 30} L520,{t + 30} L560,{t + 340} L360,{t + 340} Z', '#e9dcc4', COL['ink'], 2)
    g.line(440, t + 40, 455, t + 330, '#8a6f50', 10); lab(g, '奥羽山脈', 405, t + 200, 16, '#5a4d44', 'end')
    lab(g, '日本海側', 250, t + 200, 20, COL['blue']); lab(g, '太平洋側', 720, t + 250, 20, COL['blue'])
    for k in range(3): g.arrow(860, t + 60 + k * 40, 600, t + 120 + k * 40, COL['blue'], 5, 15)
    lab(g, 'やませ（初夏〜夏の冷たく湿った北東の風）', 720, t + 50, 17, COL['blue'])
    lab(g, '日照不足・低温 → 冷害', 740, t + 300, 20, COL['red'])
    g.card(30, 390, 900, 135, '太平洋側（三陸など）で、稲が育たない冷害が起こりやすい。対策：品種改良で寒さに強い米をつくる。東北は東日本大震災（2011年）からの復興も進める。', 3, big=18)
    note(g)
    return 'やませの図'

FIG = {'G-C1-S1': g1, 'G-C1-S2': g2, 'G-C2-S1': g3, 'G-C3-S1': g4, 'G-C3-S2': g5, 'G-C3-S3': g6, 'G-C4-S1': g7, 'G-C4-S2': g8, 'G-C4-S3': g9, 'G-C5-S1': g10, 'G-C5-S2': g11, 'G-C5-S3': g12}
