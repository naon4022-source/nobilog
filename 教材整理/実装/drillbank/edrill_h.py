"""英語ドリル 上級 3 分詞・4 名詞を修飾する文／関係代名詞（ドリル p128〜139）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, ING, PP

def unit():
    u = GUnit('drill-english-3-participle-relative', '英語', '分詞と関係代名詞', '上級 文法', grade=3)
    r = random.Random(2801)
    PRES = [('the boy', 'swim', 'in the river', '川で泳いでいる少年'), ('the girl', 'play', 'the piano', 'ピアノをひいている少女'), ('the man', 'stand', 'over there', '向こうに立っている男性'),
            ('the dog', 'run', 'in the park', '公園を走っている犬'), ('the woman', 'talk', 'with Nancy', 'ナンシーと話している女性'), ('the students', 'clean', 'the classroom', '教室をそうじしている生徒たち'),
            ('the baby', 'sleep', 'on the bed', 'ベッドで眠っている赤ちゃん'), ('the girl', 'wait', 'for the bus', 'バスを待っている少女')]
    PAS = [('a car', 'make', 'in Japan', '日本で作られた車'), ('the books', 'write', 'in English', '英語で書かれた本'), ('the language', 'speak', 'in India', 'インドで話されている言語'),
           ('a cake', 'bake', 'by Kumi', 'クミによって焼かれたケーキ'), ('the picture', 'paint', 'by Nancy', 'ナンシーによってかかれた絵'), ('a hotel', 'build', 'fifty years ago', '50年前に建てられたホテル'),
           ('the photos', 'take', 'by him', '彼によって撮られた写真'), ('a doll', 'give', 'by my aunt', 'おばからもらった人形'), ('the fish', 'catch', 'in this river', 'この川でとれた魚')]
    ING2 = dict(ING, stand='standing', talk='talking', wait='waiting', sleep='sleeping')
    PP2 = dict(PP, bake='baked')
    def arts(x):
        h, rest = x.split(' ', 1)
        return [x] + [f'{a} {rest}' for a in ('the', 'a', 'an') if a != h] + ([rest] if rest.split()[0].endswith('s') else [])
    def ppart():
        if r.random() < .5:
            n, v, rest, ja = r.choice(PRES)
            u.add(f'「{ja}」を英語で書こう（{v} を使う）。', E(*arts(f'{n} {ING2[v]} {rest}')), '現在分詞（-ing）＋語句が名詞を後ろから修飾する「〜している…」。', 129, '分詞の位置', '現在分詞の後置修飾')
        else:
            n, v, rest, ja = r.choice(PAS)
            u.add(f'「{ja}」を英語で書こう（{v} を使う）。', E(*arts(f'{n} {PP2[v]} {rest}')), '過去分詞＋語句が名詞を後ろから修飾する「〜された…」。', 129, '分詞の位置', '過去分詞の後置修飾')
    def choose():
        k = r.random()
        if k < .5:
            n, v, rest, ja = r.choice(PRES)
            u.add(f'（　）内の語を適切な形にかえよう。\nDo you know {n} （{v}） {rest}?', exact([ING2[v]]), f'「{ja}」なので現在分詞。', 130, '1', '現在分詞と過去分詞', near=[PP2.get(v, v + 'ed')])
        else:
            n, v, rest, ja = r.choice(PAS)
            u.add(f'（　）内の語を適切な形にかえよう。\nThis is {n} （{v}） {rest}.'.replace('This is the books', 'These are the books').replace('This is the photos', 'These are the photos'), exact([PP2[v]]), f'「{ja}」なので過去分詞。', 132, '1', '現在分詞と過去分詞', near=[ING2.get(v, v + 'ing')])
    def front():
        adj, n, ja, ok = r.choice([('sleeping', 'dog', '眠っているイヌ', 'sleep'), ('used', 'car', '使われた車（中古車）', 'use'), ('boiled', 'eggs', 'ゆでられた卵（ゆで卵）', 'boil'),
                                    ('broken', 'window', '割られた窓', 'break'), ('rising', 'sun', 'のぼる太陽（朝日）', 'rise'), ('singing', 'girl', '歌っている少女', 'sing'), ('fallen', 'leaves', '落ちた葉（落ち葉）', 'fall'), ('crying', 'baby', '泣いている赤ちゃん', 'cry')])
        u.add(f'「{ja}」となるように、（　）内の語を適切な形にかえよう。\na （{ok}） {n}'.replace('a （boil） eggs', '（boil） eggs').replace('a （fall） leaves', '（fall） leaves'), exact([adj]), '分詞が1語だけのときは名詞の前に置く。', 129, 'Check', '分詞の前置修飾')
    def emo():
        w, ja, ok = r.choice([('exciting', 'わくわくさせる', 'excite'), ('excited', 'わくわくした（人が）', 'excite'), ('surprising', '驚くべき', 'surprise'), ('surprised', '驚いた（人が）', 'surprise'),
                              ('tired', '疲れた（人が）', 'tire'), ('tiring', '疲れさせる', 'tire'), ('interesting', '興味深い', 'interest'), ('interested', '興味がある（人が）', 'interest')])
        if w.endswith('ing'):
            sent = r.choice([f'The game was （{ok}）.', f'It was an （{ok}） story.' if w[0] in 'aeiou' else f'It was a （{ok}） story.'])
        else:
            sent = r.choice([f'We were （{ok}）.', f'The audience was （{ok}）.'])
        u.add(f'「{ja}」の意味になるように、（　）内の語を -ing か -ed の形にしよう。\n{sent}', exact([w]), '-ing は「（物事が人を）〜させる」、-ed は「（人が）〜させられた・〜した」。', 128, 'ズバリ暗記', '感情を表す分詞', near=[w[:-3] + 'ed' if w.endswith('ing') else (w[:-2] + 'ing' if w.endswith('ed') else w)])
    REL = [('I know the man.', 'He wrote the story.', 'I know the man who wrote the story.', 'who'), ('Nancy has a dog.', 'It can swim very well.', 'Nancy has a dog which can swim very well.', 'which'),
           ('That is the girl.', 'I saw her on the train.', 'That is the girl that I saw on the train.', 'that'), ('The boy is very tall.', 'He is standing by the door.', 'The boy who is standing by the door is very tall.', 'who'),
           ('This is the book.', 'My mother read it last night.', 'This is the book which my mother read last night.', 'which'), ('I have a friend.', 'He lives in China.', 'I have a friend who lives in China.', 'who'),
           ('Please show me the pictures.', 'You took them in China.', 'Please show me the pictures which you took in China.', 'which'), ('Kaori likes books.', 'They have a lot of pictures.', 'Kaori likes books which have a lot of pictures.', 'which'),
           ('The flowers were beautiful.', 'Kumi gave them to her mother.', 'The flowers which Kumi gave to her mother were beautiful.', 'which'), ('That is the police officer.', 'I asked him the way to the bank.', 'That is the police officer who I asked the way to the bank.', 'who')]
    ri = iter(r.sample(REL, len(REL)))
    def rel():
        a, b, c, w = next(ri)
        alts = [c, c.replace(f' {w} ', ' that ')]
        if w == 'that': alts += [c.replace(' that ', ' who '), c.replace(' that ', ' whom ')]
        if 'who I' in c: alts.append(c.replace('who I', 'whom I'))
        u.add(f'次の2文を、関係代名詞を使って1つの文にしよう。\n{a} {b}', E(*alts), f'先行詞が人なら who（that）、人以外なら which（that）。目的格の関係代名詞は省略できる。', 136, '2', '関係代名詞で2文をつなぐ')
    PICK = [('Nancy is a girl （　） can play the violin well.', ['who', 'that'], '先行詞 a girl は人で、主格→ who（that）。'), ('Baseball is the sport （　） I like the best.', ['that', 'which'], '先行詞に最上級（the best）がつくので that がよく使われる（which も可）。'),
            ('This is the best watch （　） I\'ve ever bought.', ['that', 'which'], '最上級がつく先行詞は that がふつう。'), ('Is there anything （　） I can do for you?', ['that'], '先行詞が anything のときは that。'),
            ('I have a friend （　） lives in Kyoto.', ['who', 'that'], '人・主格→ who（that）。'), ('This is a car （　） runs very fast.', ['which', 'that'], '人以外・主格→ which（that）。'),
            ('Look at the boy and his dog （　） are running over there.', ['that'], '先行詞が「人＋動物」のときは that。'), ('He is the only student （　） can speak French.', ['that', 'who'], 'the only がつく先行詞は that がよく使われる。'),
            ('The house （　） has a red roof is mine.', ['which', 'that'], '人以外・主格→ which（that）。'), ('The boy （　） broke this window is Tom.', ['who', 'that'], '人・主格→ who（that）。')]
    pk = iter(r.sample(PICK, len(PICK)))
    def pick():
        q, a, e = next(pk)
        u.add(f'（　）に入る関係代名詞を1つ書こう（who・which・that から）。\n{q}', exact(a), e, 135, 'Check', '関係代名詞の使い分け')
    CONTACT = [('This is the watch I bought in Canada.', 'I bought in Canada', '私がカナダで買った'), ('That is the house Tom\'s family lived in.', 'Tom\'s family lived in', 'トムの家族が住んでいた'),
               ('The cake my mother made was delicious.', 'my mother made', '私の母が作った'), ('The bag we are looking for is blue.', 'we are looking for', '私たちがさがしている'),
               ('Is this the book you read yesterday?', 'you read yesterday', 'あなたがきのう読んだ')]
    ci = iter(r.sample(CONTACT, len(CONTACT)))
    def contact():
        s, part, ja = next(ci)
        n = s.split(' ' + part.split()[0])[0].split()[-1]
        u.add(f'次の英文で、名詞 {n} を後ろから修飾している「主語＋動詞〜」の部分をそのまま書きぬこう。\n{s}', E(part), f'「{ja}{n}」。名詞＋主語＋動詞〜で名詞を修飾できる（目的格の関係代名詞の省略）。', 134, 'Check', '名詞を修飾する文')
    def relfill():
        if r.random() < .5:
            n, v, rest, ja = r.choice(PRES)
            be = 'are' if n.endswith('s') else 'is'
            person = n.split()[-1] not in ('dog',)
            u.add(f'「{ja}」を、関係代名詞を使って表すとき、（　）に入る1語を書こう。\n{n} （　） {be} {ING2[v]} {rest}', exact(['who', 'that'] if person else ['which', 'that']), f'先行詞 {n} は{"人" if person else "人以外"}なので {"who" if person else "which"}（that）。', 136, '3', '主格の関係代名詞')
        else:
            n, v, rest, ja = r.choice(PAS)
            be = 'were' if n.endswith(('s', 'photos')) else 'was'
            if v in ('speak',): be = 'is'
            u.add(f'「{ja}」を、関係代名詞を使って表すとき、（　）に入る1語を書こう。\n{n} （　） {be} {PP2[v]} {rest}', exact(['which', 'that']), f'先行詞 {n} は人以外なので which（that）。', 136, '3', '主格の関係代名詞')
    def join2():
        n, v, rest, ja = r.choice(PRES)
        N = n.split()[-1]; pr = 'They' if N.endswith('s') else ('He' if N in ('boy', 'man') else ('She' if N in ('girl', 'woman') else 'It')); be = 'are' if pr == 'They' else 'is'
        u.add(f'次の2文を、分詞を使って1つの文にしよう。\nI know {n}. {pr} {be} {ING2[v]} {rest}.', E(f'I know {n} {ING2[v]} {rest}.'), '現在分詞＋語句を名詞のすぐ後ろに置く。', 130, '4', '分詞で2文をつなぐ')
    X = lambda *a: exact(list(a))
    rows = [
        ('「ジェーンはよく買い物に行きますか」：Does Jane often go （　）? の（　）に入る語を書こう（shop を使う）。', X('shopping'), 'go 〜ing「〜しに行く」。', 129, '熟語', 'go -ing', ['shop']),
        ('「私は部屋のそうじで忙しい」：I am busy （　） my room. の（　）に入る語を書こう（clean を使う）。', X('cleaning'), 'be busy 〜ing「〜するのに忙しい」。', 129, '熟語', 'be busy -ing', ['to clean']),
        ('「明日スキーに行こう」：Let\'s go （　） tomorrow. の（　）に入る語を書こう（ski を使う）。', X('skiing'), 'go skiing。', 129, 'Check⑩', 'go -ing'),
        ('関係代名詞のうち、先行詞が人で、主格のときに使うものを2つ書こう（読点で区切る）。', {'kind': 'set', 'items': [['who'], ['that']], 'plain': True}, '人・主格→ who / that。', 135, '表', '関係代名詞の使い分け'),
        ('関係代名詞のうち、先行詞が人以外で、目的格のときに使うものを2つ書こう（読点で区切る）。', {'kind': 'set', 'items': [['which'], ['that']], 'plain': True}, '人以外・目的格→ which / that（省略可）。', 135, '表', '関係代名詞の使い分け'),
        ('主格と目的格の関係代名詞のうち、省略できるのはどちらか。', X('目的格', '目的格の関係代名詞'), '目的格は省略できる（the book I read）。主格は省略できない。', 135, '注', '関係代名詞の省略', ['主格']),
        ('関係代名詞が修飾する前の名詞を何というか。', X('先行詞', 'せんこうし'), '先行詞。', 134, '用語', '先行詞'),
        ('「長い耳をもったイヌ」を英語で書こう（with を使う）。', E('the dog with long ears', 'a dog with long ears'), '前置詞のまとまりが名詞を後ろから修飾する。', 134, '名詞を修飾する語句', '前置詞句の後置修飾'),
        ('「病院に連れて行くべきイヌ」：the dog （　）（　） to the hospital. の（　）に入る2語を書こう。', E('to take'), '不定詞が名詞を後ろから修飾（形容詞的用法）。', 134, '名詞を修飾する語句', '不定詞の後置修飾'),
        ('「みんなに愛されているイヌ」：the dog （　） by everyone. の（　）に入る1語を書こう。', X('loved'), '過去分詞が後ろから修飾。', 134, '名詞を修飾する語句', '過去分詞の後置修飾'),
        ('「その本はおもしろかった」の意味になるように、（interest）を適切な形にしよう。\nThe book was （interest）.', X('interesting'), '物事が人の興味を引く→ interesting。', 128, 'Check', '感情を表す分詞', ['interested']),
    ]
    fact, nf = facts(u, rows, r)
    gens = [ppart, choose, rel, front, emo, pick, contact, relfill, join2, ppart, choose, emo, relfill]
    plan = []
    for i in range(nf + 60):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 4) % len(gens)])
    fill(u, plan)
    guide = [{'title': '現在分詞と過去分詞', 'body': '現在分詞（-ing）「〜している」、過去分詞「〜された・〜した」。分詞1語なら名詞の前（a sleeping dog）、語句がつくと名詞の後ろ（the boy swimming in the river、a car made in Japan）。'},
             {'title': '感情を表す分詞', 'body': 'exciting（わくわくさせる）／excited（わくわくした）、surprising／surprised、tiring／tired、interesting／interested。物事が主語なら -ing、人が感じるなら -ed がふつう。'},
             {'title': '関係代名詞の使い分け', 'body': '主格：人 who / that、人以外 which / that。目的格：人 that（who）、人以外 which / that（省略可）。先行詞に最上級・the only・all・anything や「人＋動物」がつくと that がよく使われる。'},
             {'title': '2文を1文にする', 'body': '共通の名詞を見つけ、2つ目の文のその語（he / it / them など）を関係代名詞にかえて、先行詞の直後に置く。I know the man. He wrote it. → I know the man who wrote it.'},
             {'title': '名詞を後ろから修飾する形', 'body': '前置詞のまとまり（with long ears）、不定詞（to take）、分詞（running over there / loved by everyone）、主語＋動詞（I bought）、関係代名詞（who / which / that 〜）。'}]
    note = '2026-10-08 Claude作成。英語ドリル上級p128〜139（3 分詞・4 名詞を修飾する文／関係代名詞、STEP1〜3）を写真で目視し、語句を変えた類題を作った。絵・リスニング・長文の問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
