"""英語1 しくみの図（D01）23枚（Claude・2026-10-05）。中身は 英語全体制作/原稿 の要点・表から取る。英文は原稿の例文だけを使う。"""
from svg import SVG, COL, PAIRS, W, H, width, fit
from layouts import flow, compare, table, tree, nest, pyramid, relation, timeline

def D(code):
    g = SVG(); t = FIG[code](g); g.title = t or code; return g.done()
def words(g, y, ws, z=30, gap=14, x0=None):
    """語のブロックを横に並べる。ws＝[(語, 色番号)]。各ブロックの中心xを返す"""
    tot = sum(width(w, z) + 30 for w, _ in ws) + gap * (len(ws) - 1); x = x0 if x0 is not None else (W - tot) / 2; cs = []
    for w, c in ws:
        bw = width(w, z) + 30; st, fl = (COL[k] for k in PAIRS[c % len(PAIRS)])
        g.rect(x, y, bw, z + 30, fl, st, 3, r=10); g.text(w, x + bw / 2, y + (z + 30) / 2 + z * .36, z, None, 'middle'); cs.append(x + bw / 2); x += bw + gap
    return cs

def e0(g):
    t = g.title_bar('4本線と小文字の高さ')
    y0 = t + 40; ys = [y0, y0 + 50, y0 + 100, y0 + 150]
    for k, y in enumerate(ys): g.line(40, y, 920, y, COL['red'] if k == 2 else COL['blue'], 2.5 if k == 2 else 1.5)
    groups = [('上に出る', 'bdhkl', 0), ('3本目までの間', 'acemnorsuvwxz', 2), ('下に出る', 'gjpqy', 1)]
    shown = [('bdhk', 0), ('acem', 2), ('gjpy', 1)]; x = 60
    for letters, c in shown:
        for ch in letters:
            g.text(ch, x + 28, ys[2] - 2, 92, COL[PAIRS[c][0]], 'middle', 500); x += 62
        x += 48
    g.text('3本目（赤）が基本の線', 920, ys[2] + 22, 16, COL['red'], 'end', 700)
    for k, (nm, letters, c) in enumerate(groups):
        g.card(40 + k * 300, t + 210, 280, 110, ' '.join(letters), c, head=nm, big=22)
    g.card(40, 420, 880, 100, '大文字は上の3本の線の間に書く。まちがえやすいペア：b と d、p と q、m と n。', 3, big=21)
    return '4本線と小文字の高さ'
def e1_1(g):
    t = g.title_bar('「I am 〜.」はイコール、「I like 〜.」は動き')
    g.text('be動詞 am', 240, t + 40, 26, COL['blue'], 'middle', 800); g.text('一般動詞 like', 720, t + 40, 26, COL['orange'], 'middle', 800)
    g.card(60, t + 60, 140, 90, 'I', 0, big=40); g.text('＝', 240, t + 120, 48, COL['blue'], 'middle', 800); g.card(280, t + 60, 160, 90, 'Kenta', 0, big=32)
    g.para('わたしは ＝ ケンタ（I と 〜 がイコール）', 40, t + 160, 420, 50, 19, 14, None, 'middle')
    g.card(520, t + 60, 120, 90, 'I', 1, big=40); g.arrow(650, t + 105, 720, t + 105, COL['orange'], 6, 16, label='like'); g.card(730, t + 60, 190, 90, 'soccer', 1, big=32)
    g.para('わたしは サッカーが好き（like は動き・気持ち）', 500, t + 160, 440, 50, 19, 14, None, 'middle')
    table(g, [['型', '意味', '例'], ['I am 〜.', 'わたしは〜です', 'I am Aya.'], ['I like 〜.', 'わたしは〜が好きです', 'I like cats.'], ["I don't like 〜.", '〜は好きではありません', "I don't like natto."]], t + 230, 525)
    return 'I am と I like の比べ図'
def e1_2(g):
    t = g.title_bar('Are と Do が前に出て疑問文になる')
    g.text('be動詞の文', 40, t + 40, 22, COL['blue'], weight=800)
    a = words(g, t + 60, [('You', 0), ('are', 1), ('a student.', 0)], 28, x0=60)
    b = words(g, t + 160, [('Are', 1), ('you', 0), ('a student?', 0)], 28, x0=60)
    g.path(f'M{a[1]:.0f},{t + 118} C{a[1]:.0f},{t + 140} {b[0]:.0f},{t + 135} {b[0]:.0f},{t + 158}', 'none', COL['orange'], 4)
    g.text('Yes, I am. / No, I\'m not.', 60, t + 260, 22, COL['green'], weight=700)
    g.text('一般動詞の文', 520, t + 40, 22, COL['orange'], weight=800)
    words(g, t + 60, [('You', 0), ('play', 2), ('basketball.', 0)], 24, x0=520)
    words(g, t + 160, [('Do', 1), ('you', 0), ('play', 2), ('basketball?', 0)], 24, x0=520)
    g.text('Do を前に足す', 600, t + 145, 18, COL['orange'], 'start', 700)
    g.text('Yes, I do. / No, I don\'t.', 520, t + 260, 22, COL['green'], weight=700)
    g.card(40, 400, 880, 110, '疑問文の最後は「?」。話すときは、文の終わりを上げて言う。', 3, big=22)
    return 'Are と Do の疑問文'
def e1_3(g):
    t = g.title_bar('can は動詞の前に入る（I ＋ can ＋ swim）')
    c = words(g, t + 60, [('I', 0), ('can', 1), ('swim', 2), ('.', 0)], 40)
    g.text('〜できる', c[1], t + 150, 22, COL['orange'], 'middle'); g.text('動詞のもとの形', c[2], t + 150, 20, COL['green'], 'middle')
    compare(g, [('否定', ["I can't（cannot）＋ 動詞."]), ('疑問', ['Can you ＋ 動詞?', 'Yes, I can. / No, I can\'t.']), ('My favorite 〜 is 〜.', ['いちばん好きな〜は…です', 'My favorite color is blue.'])], t + 190, 520)
    return 'can の位置'
def e2_1(g):
    t = g.title_bar('What が先頭に来て、後ろはふつうの疑問文')
    words(g, t + 50, [('Do', 1), ('you', 0), ('like', 2), ('〜 ?', 0)], 30)
    g.arrow(480, t + 125, 480, t + 165, COL['orange'], 5, 14, label='前に What')
    words(g, t + 180, [('What', 3), ('do', 1), ('you', 0), ('like', 2), ('?', 0)], 30)
    g.text('あなたは何が好きですか', 480, t + 270, 22, COL['gray'], 'middle', 700)
    compare(g, [('What ＋ 名詞', ['What food do you like?', '「どんな〜を…しますか」']), ('答え方', ['Yes / No では答えない', '聞かれたものを具体的に：I like 〜. / It\'s 〜.'])], t + 300, 520)
    return 'What の疑問文'
def e2_2(g):
    t = g.title_bar('this（近く）と that（遠く）')
    g.sprout(140, t + 230, 1.3)
    g.circle(270, t + 220, 34, COL['cream'], COL['orange'], 4); g.text('this', 270, t + 160, 30, COL['orange'], 'middle', 800)
    g.circle(800, t + 220, 34, COL['sky'], COL['blue'], 4); g.text('that', 800, t + 160, 30, COL['blue'], 'middle', 800)
    g.arrow(180, t + 260, 260, t + 260, COL['orange'], 4, 12); g.arrow(180, t + 280, 790, t + 280, COL['blue'], 4, 12, dash='8 6')
    g.text('近く', 230, t + 300, 18, COL['orange'], 'middle'); g.text('はなれた所', 520, t + 310, 18, COL['blue'], 'middle')
    compare(g, [('This is 〜. / That is 〜.', ['That is は That\'s と短くできる', '答えは it：Yes, it is. / No, it isn\'t.']), ('Who is 〜?', ['「〜はだれですか」', 'He is 〜.（男の人）/ She is 〜.（女の人）'])], t + 330, 525)
    return 'this と that'
def e2_3(g):
    t = g.title_bar('be動詞の文と一般動詞の文の作り方')
    table(g, [['', 'be動詞の文', '一般動詞の文'], ['ふつうの文', 'You are a student.', 'You play tennis.'], ['疑問文', 'Are you a student?', 'Do you play tennis?'], ['否定文', 'I am not a student.', "I don't play tennis."],
              ['作り方', '疑問：be動詞を前へ／否定：後ろに not', '疑問：Do を前に／否定：動詞の前に don\'t']], t + 10, 450)
    g.card(40, 460, 880, 60, '一つの文に be動詞と一般動詞をいっしょに使わない。', 4, big=22)
    return 'be動詞と一般動詞の比べ表'
def e3_1(g):
    t = g.title_bar('動詞の過去形への変身')
    compare(g, [('ed をつける', ['play → played', 'watch → watched', 'e で終わる語は d だけ：like → liked、use → used']),
                ('形が変わる（不規則動詞）', ['go → went', 'eat → ate', 'see → saw', 'have → had', 'make → made']),
                ('be動詞', ['am・is → was', 'are → were', 'It was fun.'])], t + 10, 420)
    g.card(40, 435, 880, 85, '過去を表す言葉：yesterday（きのう）・last night（昨夜）・last Sunday（この前の日曜日）・〜 ago（〜前）', 3, big=20)
    return '過去形への変身'
def e3_2(g):
    t = g.title_bar('did が出てくると、動詞はもとの形にもどる')
    words(g, t + 40, [('I', 0), ('went', 2), ('to the park.', 0)], 28, x0=60)
    words(g, t + 150, [('I', 0), ("didn't", 1), ('go', 2), ('to the park.', 0)], 28, x0=60)
    words(g, t + 260, [('Did', 1), ('you', 0), ('go', 2), ('to the park?', 0)], 28, x0=60)
    g.text('went → go（もとの形）', 700, t + 205, 22, COL['green'], 'middle', 800)
    g.card(620, t + 40, 300, 90, 'Yes, I did.\nNo, I didn\'t.', 2, big=22)
    g.card(40, 410, 880, 110, 'was not（wasn\'t）・were not（weren\'t）、疑問は Was / Were を前に（Were you home?）', 3, head='be動詞の過去', big=20)
    return 'did ともとの形'
def e4_1(g):
    t = g.title_bar('主語によって、動詞に s がつくかどうか')
    rows = [('I', 'like', '一人称', 0), ('you', 'like', '二人称', 0), ('he / she / Ken', 'likes', '三人称単数', 1), ('we / they', 'like', '複数', 0)]
    for k, (s, v, nm, c) in enumerate(rows):
        y = t + 15 + k * 82
        g.card(40, y, 240, 70, s, 2, big=26); g.card(300, y, 150, 70, v, c, big=28); g.text(nm, 465, y + 44, 21, COL['gray'], weight=700)
    table(g, [['もとの形', '三単現', 'きまり'], ['play', 'plays', 's'], ['watch', 'watches', 'es'], ['study', 'studies', 'y→ies'], ['have', 'has', '形が変わる']], t + 15, 340, x0=660)
    g.card(40, 410, 880, 110, "doesn't ＋ 動詞のもとの形：He doesn't play tennis. doesn't が出てきたら、s は動詞からなくなる。", 3, head='否定文', big=20)
    return '三単現の s'
def e4_2(g):
    t = g.title_bar('How many ＋ 複数形 ＋ 疑問文')
    c = words(g, t + 50, [('How many', 1), ('cats', 2), ('do you have', 0), ('?', 0)], 30)
    g.text('数をたずねる', c[0], t + 140, 20, COL['orange'], 'middle'); g.text('複数形', c[1], t + 140, 20, COL['green'], 'middle'); g.text('ふつうの疑問文', c[2], t + 140, 20, COL['blue'], 'middle')
    g.text('— I have two cats.（答えは数を入れて言う）', 480, t + 185, 22, COL['green'], 'middle')
    compare(g, [('複数形の作り方', ['ふつうは s：books・pens', 'es：boxes・dishes', 'y→ies：city → cities', '形が変わる：child → children、man → men']),
                ('Does の疑問文', ['Does ＋ 主語 ＋ 動詞のもとの形 〜?', 'Yes, she does. / No, she doesn\'t.'])], t + 210, 525)
    return 'How many の組み立て'
def e5_1(g):
    t = g.title_bar('be動詞 ＋ 動詞ing ＝ 今この瞬間「〜している」')
    g.arrow(60, t + 90, 900, t + 90, COL['gray'], 5, 16); g.circle(480, t + 90, 14, COL['orange'], '#fff', 3)
    g.text('過去', 120, t + 70, 20, COL['gray'], 'middle'); g.text('今', 480, t + 60, 24, COL['orange'], 'middle', 800); g.text('未来', 840, t + 70, 20, COL['gray'], 'middle')
    words(g, t + 130, [('She', 0), ('is', 1), ('reading', 2), ('a book.', 0)], 30)
    table(g, [['主語', 'be動詞'], ['I', 'am'], ['He / She', 'is'], ['We / You / They', 'are']], t + 220, 525, x1=530)
    g.card(560, t + 220, 360, 243, 'ふつう：play → playing\ne をとる：make → making\n最後の字を重ねる：run → running、swim → swimming', 2, head='ing のつけ方', big=19, anchor='start')
    return '現在進行形の組み立て'
def e5_2(g):
    t = g.title_bar('What ＋ be動詞 ＋ 主語 ＋ doing?')
    c = words(g, t + 50, [('What', 3), ('are', 1), ('they', 0), ('doing', 2), ('?', 0)], 34)
    for x, s in zip(c, ['何を', 'be動詞', '主語', 'している']): g.text(s, x, t + 145, 19, COL['gray'], 'middle')
    words(g, t + 180, [('They', 0), ('are', 1), ('playing', 2), ('soccer.', 0)], 30)
    g.text('答え：主語 ＋ be動詞 ＋ 動詞ing', 480, t + 270, 21, COL['green'], 'middle')
    compare(g, [('疑問文', ['be動詞を主語の前へ', 'Are you studying? — Yes, I am.']), ('絵や写真の説明', ['人ごとに一文で', 'A girl is reading a book.'])], t + 300, 525)
    return 'What 〜 doing? の組み立て'
def e6_1(g):
    t = g.title_bar('Which（えらぶ）と Why（理由）の使い分け')
    g.card(40, t + 20, 420, 140, 'Which do you like, A or B?\n「AとBのどちらが好きですか」', 0, head='Which ＝ えらぶ', big=21)
    g.card(70, t + 190, 160, 80, 'A', 0, big=34); g.card(270, t + 190, 160, 80, 'B', 0, big=34); g.text('or', 250, t + 240, 22, COL['gray'], 'middle')
    g.card(500, t + 20, 420, 140, 'Why do you like summer?\n「なぜ〜ですか」', 1, head='Why ＝ 理由をたずねる', big=21)
    g.arrow(710, t + 165, 710, t + 200, COL['orange'], 5, 14)
    g.card(500, t + 205, 420, 110, 'Because I can swim in the sea.', 2, head='Because ＋ 理由の文', big=21)
    g.card(40, 410, 880, 100, 'Which ＋ 名詞 ＋ 疑問文? ＝「どの〜を…しますか」', 3, big=22)
    return 'Which と Why'
def e6_2(g):
    t = g.title_bar('代名詞の変化表（〜は・〜の・〜を・〜のもの）')
    table(g, [['〜は', '〜の', '〜を（に）', '〜のもの'], ['I', 'my', 'me', 'mine'], ['you', 'your', 'you', 'yours'], ['he', 'his', 'him', 'his'], ['she', 'her', 'her', 'hers'], ['we', 'our', 'us', 'ours'], ['they', 'their', 'them', 'theirs']], t + 10, 420)
    g.card(40, 432, 880, 90, "Whose ＋ 名詞 ＋ is this? — It's mine. / It's Ken's.", 3, head='Whose（だれの）', big=21)
    return '代名詞の変化表'
def e7_1(g):
    t = g.title_bar('should と have to の強さ')
    g.path(f'M60,{t + 250} L900,{t + 160} L900,{t + 250} Z', COL['lemon'], COL['yellow'], 2)
    g.text('弱い', 60, t + 275, 20, COL['gray']); g.text('強い', 900, t + 275, 20, COL['gray'], 'end')
    g.arrow(300, t + 135, 300, t + 225, COL['green'], 4, 12); g.arrow(730, t + 135, 730, t + 180, COL['orange'], 4, 12)
    g.card(150, t + 20, 300, 110, 'should ＋ 動詞のもとの形\n〜したほうがよい（アドバイス）', 2, big=19)
    g.card(560, t + 20, 340, 110, 'have to ＋ 動詞のもとの形\n〜しなければならない', 1, big=19)
    g.card(40, t + 295, 430, 160, "shouldn't ＝〜しないほうがよい\n主語が三人称単数なら has to（She has to get up early.）", 0, head='形', big=18, anchor='start')
    g.card(490, t + 295, 430, 160, "don't have to ＝「〜する必要はない」\n「〜してはいけない」ではない！", 4, head='注意', big=20)
    return 'should と have to'
def e7_2(g):
    t = g.title_bar('Can I（許可）と Can you（依頼）：矢印の向き')
    for k, (nm, sub, a, b) in enumerate([('Can I 〜?', '（わたしが）〜してもいいですか', 'わたし', 'あなた'), ('Can you 〜?', '（あなたが）〜してくれますか', 'あなた', 'わたし')]):
        x = 40 + k * 460
        g.text(nm, x + 210, t + 40, 30, COL[PAIRS[k][0]], 'middle', 800); g.text(sub, x + 210, t + 75, 19, None, 'middle')
        g.card(x + 20, t + 100, 140, 70, '話す人' if k == 0 else '話す人', 2, big=20); g.card(x + 260, t + 100, 140, 70, '相手', 3, big=20)
        g.arrow(x + 165, t + 135, x + 255, t + 135, COL['orange'], 4, 12, label='たのむ')
        g.para(('する人＝話す人（許可をもらう）' if k == 0 else 'する人＝相手（お願いする）'), x, t + 190, 420, 40, 19, 14, COL[PAIRS[k][0]], 'middle')
    compare(g, [('引き受ける', ['Sure. / Of course.', 'OK. / No problem.']), ('断る', ["Sorry, I can't.", "I'm sorry, but I'm busy now."]), ('看板の英語', ["Don't run.（〜してはいけない）", 'No smoking.（〜禁止）'])], t + 250, 525)
    return 'Can I と Can you'
def e8_1(g):
    t = g.title_bar('時間の線の上で：過去・現在・未来の文')
    g.arrow(40, t + 90, 920, t + 90, COL['gray'], 5, 16)
    for x, nm, c in [(160, '過去', 0), (480, '現在', 1), (800, '未来', 2)]: g.circle(x, t + 90, 12, COL[PAIRS[c][0]], '#fff', 3); g.text(nm, x, t + 60, 24, COL[PAIRS[c][0]], 'middle', 800)
    g.card(40, t + 120, 260, 120, 'I played tennis yesterday.', 0, big=21)
    g.card(350, t + 120, 260, 120, 'I play tennis every day.', 1, big=21)
    g.card(660, t + 120, 270, 120, "I'm going to play tennis tomorrow.\nI will play tennis tomorrow.", 2, big=18)
    compare(g, [('be going to', ['be動詞 ＋ going to ＋ 動詞のもとの形', '主語に合わせて am・is・are']), ('will', ['will ＋ 動詞のもとの形（主語が何でも will）', "否定 won't（will not）"])], t + 260, 525)
    return '過去・現在・未来の比べ図'
def e8_2(g):
    t = g.title_bar('名詞があれば What、なければ How')
    g.card(330, t + 15, 300, 80, '名詞がある？', 3, big=28)
    g.arrow(400, t + 100, 220, t + 160, COL['green'], 5, 14, label='ある'); g.arrow(560, t + 100, 740, t + 160, COL['red'], 5, 14, label='ない')
    g.card(40, t + 170, 400, 220, 'What ＋ a ＋ 形容詞 ＋ 名詞!\nWhat a big dog!\n複数なら a はつけない：What beautiful flowers!', 2, head='What の感嘆文', big=19)
    g.card(520, t + 170, 400, 220, 'How ＋ 形容詞（副詞）!\nHow cute! / How kind!', 4, head='How の感嘆文', big=21)
    return 'What と How の分かれ道'
def e9_1(g):
    t = g.title_bar('目で見る look、耳で聞く sound')
    g.ellipse(200, t + 110, 70, 40, '#fff', COL['blue'], 5); g.circle(200, t + 110, 20, COL['blue'])
    g.circle(650, t + 110, 16, COL['orange'])
    for k in range(3): g.path(f'M{680 + k * 30},{t + 70 - k * 15} Q{710 + k * 38},{t + 110} {680 + k * 30},{t + 150 + k * 15}', 'none', COL['orange'], 6)
    g.card(40, t + 190, 420, 150, 'look ＋ 形容詞 ＝「〜に見える」\nThis cake looks delicious.\nYou look tired.', 0, head='目で見る', big=20)
    g.card(500, t + 190, 420, 150, 'sound ＋ 形容詞 ＝「〜に聞こえる・〜のようだ」\nThat sounds fun! / Sounds great!', 1, head='耳で聞く', big=20)
    g.card(40, 420, 880, 90, '主語が三人称単数なら looks / sounds。相手の話への返事に sound をよく使う。', 3, big=21)
    return 'look と sound'
def e9_2(g):
    t = g.title_bar('on・in・under・by の位置')
    for k, (pr, jp) in enumerate([('on', '〜の上に'), ('in', '〜の中に'), ('under', '〜の下に'), ('by', '〜の近くに')]):
        x = 40 + k * 225; bx, by = x + 60, t + 110
        g.rect(bx, by, 100, 70, COL['cream'], '#8a5a2b', 3, r=6)
        pos = {'on': (bx + 50, by - 22), 'in': (bx + 50, by + 35), 'under': (bx + 50, by + 100), 'by': (bx + 135, by + 45)}[pr]
        g.circle(*pos, 18, COL['red'], '#fff', 3)
        g.text(pr, x + 110, t + 40, 32, COL['blue'], 'middle', 800); g.text(jp, x + 110, t + 250, 20, None, 'middle')
    g.card(40, t + 290, 430, 170, 'There is ＋ 単数の名詞 ＋ 場所.\nThere are ＋ 複数の名詞 ＋ 場所.', 0, head='There is / There are', big=20)
    g.card(490, t + 290, 430, 170, 'Is there 〜? / Are there 〜?\nHow many 〜 are there?', 2, head='疑問文', big=20)
    return '位置を表す言葉'
def e10_1(g):
    t = g.title_bar('英語の物語の流れ（はじめ → 出来事 → 結末）')
    flow(g, [('はじめ', '登場人物と場所をメモする（Who? Where?）'), ('出来事', '過去形（walked・said）で話が進む。知らない単語は前後から予想'), ('結末', 'どうなったか'), ('ことわざ', '「虎の威を借る狐」と結末を結びつける')], t + 10, 400)
    g.card(40, 415, 880, 100, '「虎の威を借る狐」＝強い者の力をかりて、いばる人のたとえ。', 3, big=22)
    return '物語の流れ'
def e10_2(g):
    t = g.title_bar('場面ごとの気持ちの変化（気持ちの線）')
    x0, y0, x1, y1 = 100, t + 30, 900, t + 280
    g.line(x0, y0, x0, y1, COL['gray'], 3); g.line(x0, y1, x1, y1, COL['gray'], 3)
    g.text('うれしい', x0 - 10, y0 + 20, 18, COL['green'], 'end'); g.text('悲しい', x0 - 10, y1 - 10, 18, COL['blue'], 'end')
    pts = [(200, y1 - 60, 'sad'), (420, y1 - 90, 'surprised'), (640, y0 + 60, 'happy'), (840, y0 + 30, 'smile')]
    g.path('M' + ' L'.join(f'{x},{y}' for x, y, _ in pts), 'none', COL['orange'], 5)
    for k, (x, y, w) in enumerate(pts): g.circle(x, y, 10, COL['orange'], '#fff', 3); g.text(w, x, y - 20, 22, None, 'middle'); g.text(f'場面{k + 1}', x, y1 + 26, 17, COL['gray'], 'middle')
    g.text('（線の形は例）', 900, y0 - 6, 15, COL['gray'], 'end', 600)
    compare(g, [('気持ちを表す英語', ['happy・sad・surprised', 'angry・lonely・scared']), ('気持ちのサイン', ['smile（ほほえむ）・cry（泣く）', '変わるきっかけの出来事をさがす'])], t + 330, 525)
    return '気持ちの変化'

FIG = {'E1-SB-S1': e0, 'E1-L1-S1': e1_1, 'E1-L1-S2': e1_2, 'E1-L1-S3': e1_3, 'E1-L2-S1': e2_1, 'E1-L2-S2': e2_2, 'E1-L2-S3': e2_3, 'E1-L3-S1': e3_1, 'E1-L3-S2': e3_2,
       'E1-L4-S1': e4_1, 'E1-L4-S2': e4_2, 'E1-L5-S1': e5_1, 'E1-L5-S2': e5_2, 'E1-L6-S1': e6_1, 'E1-L6-S2': e6_2, 'E1-L7-S1': e7_1, 'E1-L7-S2': e7_2, 'E1-L8-S1': e8_1,
       'E1-L8-S2': e8_2, 'E1-L9-S1': e9_1, 'E1-L9-S2': e9_2, 'E1-RD-S1': e10_1, 'E1-RD-S2': e10_2}
