"""英語ドリル 中級 9 受動態・10 感嘆文／Here is〜／その他（ドリル p100〜113）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, PP, PAST

ACT = [('Everyone', 'love', 'Ken', 'loves', 'is'), ('My father', 'use', 'this car', 'uses', 'is'), ('The students', 'clean', 'the room', 'clean', 'is'),
       ('Many people', 'visit', 'this temple', 'visit', 'is'), ('Mr. Brown', 'write', 'these novels', 'writes', 'are'), ('Children', 'sing', 'these songs', 'sing', 'are'),
       ('Nancy', 'like', 'these pictures', 'likes', 'are'), ('They', 'speak', 'English', 'speak', 'is'), ('Maki', 'make', 'this cake', 'makes', 'is'), ('Jack', 'open', 'the window', 'opens', 'is'),
       ('My mother', 'wash', 'the dishes', 'washes', 'are'), ('Tom', 'read', 'the book', 'reads', 'is')]
LOVE = {'love': 'loved', 'like': 'liked'}
OBJ = {'Ken': 'Ken', 'this car': 'This car', 'the room': 'The room', 'this temple': 'This temple', 'these novels': 'These novels', 'these songs': 'These songs', 'these pictures': 'These pictures',
       'English': 'English', 'this cake': 'This cake', 'the window': 'The window', 'the dishes': 'The dishes', 'the book': 'The book'}
def pp(v): return LOVE.get(v) or PP[v]
def byp(s): return {'Everyone': 'everyone', 'They': 'them', 'Many people': 'many people', 'Children': 'children', 'The students': 'the students', 'My father': 'my father', 'My mother': 'my mother'}.get(s, s)

def unit():
    u = GUnit('drill-english-2-passive-exclaim', '英語', '受動態と感嘆文', '中級 文法', grade=2)
    r = random.Random(2601)
    def passive():
        s, v, o, vs, be = r.choice(ACT); past = r.random() < .4
        b = ('was' if be == 'is' else 'were') if past else be
        verb = PAST.get(v, LOVE.get(v)) if past else vs
        by = ' in this country' if s == 'They' else f' by {byp(s)}'
        tail = ' in this country' if s == 'They' else ''
        u.add(f'次の英文を受動態（「〜される」）の文に書きかえよう。\n{s} {verb} {o}{tail}.', E(f'{OBJ[o]} {b} {pp(v)}{by}.'), f'受動態は be動詞＋過去分詞（＋by 〜）。{"過去の文なので was / were。" if past else ""}' + ('一般の人々を表す They は by them を省略する。' if s == 'They' else ''), 100, 'Check', '受動態の作り方')
    def active():
        s, v, o, vs, be = r.choice([a for a in ACT if a[0] != 'They']); past = r.random() < .5
        b = ('was' if be == 'is' else 'were') if past else be
        verb = PAST.get(v, LOVE.get(v)) if past else vs
        u.add(f'次の受動態の文を、能動態（「〜が…する」）の文に書きかえよう。\n{OBJ[o]} {b} {pp(v)} by {byp(s)}.', E(f'{s} {verb} {o}.'), f'by のあとの語を主語にし、動詞を{"過去形" if past else "現在形"}にする。{s} {verb} {o}.', 102, '2(5)', '能動態への書きかえ')
    def ppform():
        v = r.choice(list(PP))
        u.add(f'次の動詞の過去分詞を書こう。\n{v}', exact([PP[v]]), f'{v} − {PAST.get(v, PP[v]) if v != "be" else "was / were"} − {PP[v]}', 100, '過去分詞', '過去分詞', near=[v + 'ed'] if PP[v] != v + 'ed' else [])
    def negq():
        s, v, o, vs, be = r.choice([a for a in ACT if a[1] in ('use', 'clean', 'visit', 'speak', 'sing', 'wash', 'open', 'read')])
        if r.random() < .5:
            u.add(f'次の英文を否定文に書きかえよう。\n{OBJ[o]} {be} {pp(v)} every day.', E(f'{OBJ[o]} {be} not {pp(v)} every day.'), 'be動詞のあとに not。', 101, 'Check', '受動態の否定文')
        else:
            sq = OBJ[o] if OBJ[o] in ('Ken', 'English') else OBJ[o][0].lower() + OBJ[o][1:]
            u.add(f'次の英文を疑問文に書きかえよう。\n{OBJ[o]} {be} {pp(v)} every day.', E(f'{cap(be)} {sq} {pp(v)} every day?'), 'be動詞を主語の前に出す。答えは Yes, it is. / No, it isn\'t. など。', 101, 'Check', '受動態の疑問文')
    BYX = [('I am interested （　） history.', 'in', 'be interested in「〜に興味がある」。'), ('We were surprised （　） the result.', 'at', 'be surprised at「〜に驚く」。'),
           ('The garden was covered （　） snow.', 'with', 'be covered with「〜でおおわれている」。'), ('Wine is made （　） grapes.', 'from', '原料（形が変わる）は be made from。'),
           ('This box is made （　） paper.', 'of', '材料（見てわかる）は be made of。'), ('The player is known （　） everyone.', 'to', 'be known to「〜に知られている」。'),
           ('The glass was filled （　） water.', 'with', 'be filled with「〜で満たされている」。'), ('Sake is made （　） rice.', 'from', '米から形が変わってできるので from。'),
           ('I was born （　） 2013.', 'in', 'be born「生まれる」。年の前は in。'), ('My mother was pleased （　） the present.', 'with', 'be pleased with「〜を気に入る」。')]
    bi = iter(r.sample(BYX, len(BYX)))
    def byx():
        q, a, e = next(bi)
        u.add(f'（　）に最も適する前置詞を書こう。\n{q}', exact([a]), e, r.choice([101, 102]), 'by以外', 'by 以外の前置詞', near=['by'])
    HOWW = [('That cat is very pretty.', 'How pretty that cat is!', 'How'), ('This flower is very beautiful.', 'How beautiful this flower is!', 'How'), ('He runs very fast.', 'How fast he runs!', 'How'),
            ('These guitars are very cool.', 'How cool these guitars are!', 'How'), ('This apple is very big.', 'How big this apple is!', 'How'), ('Today is very hot.', 'How hot today is!', 'How'),
            ('That is a very pretty cat.', 'What a pretty cat that is!', 'What'), ('This is a very old house.', 'What an old house this is!', 'What'), ('These are very beautiful pictures.', 'What beautiful pictures these are!', 'What'),
            ('He is a very kind boy.', 'What a kind boy he is!', 'What'), ('This is a very exciting game.', 'What an exciting game this is!', 'What'), ('That is a very tall building.', 'What a tall building that is!', 'What')]
    hi = iter(r.sample(HOWW, len(HOWW)))
    def excl():
        a, b, w = next(hi)
        u.add(f'次の英文を {w} で始まる感嘆文に書きかえよう。\n{a}', E(b, b.replace('!', '.')), f'{"How＋形容詞（副詞）＋主語＋動詞！" if w == "How" else "What＋(a / an)＋形容詞＋名詞＋主語＋動詞！"}', 106, 'Check', '感嘆文')
    X = lambda *a: exact(list(a))
    rows = [
        ('「ここに私のラケットがあります」：Here （　） my racket. の（　）に入る be動詞を書こう。', X('is'), 'Here is＋単数名詞、Here are＋複数名詞。', 107, 'Here is', 'Here is / are', ['are']),
        ('「ここに本が3冊あります」：Here （　） three books. の（　）に入る be動詞を書こう。', X('are'), '複数名詞なので are。', 107, 'Here is', 'Here is / are', ['is']),
        ('「ほら、彼が来ました」：Here he （　）. の（　）に入る語を書こう（come を適切な形で）。', X('comes'), '代名詞が主語のときは Here＋主語＋動詞の語順。', 107, 'Here 一般動詞', 'Here comes', ['come']),
        ('「コーヒーを一杯いかがですか」：（　）（　） a cup of coffee? の（　）に入る2語を書こう。', E('How about', 'What about'), 'How（What）about 〜?「〜はいかがですか」。', 107, 'How about', 'How about'),
        ('「帽子をなくしたので、（新しく）1つ買うつもりです」：I lost my cap, so I will buy （　）. の（　）に入る語を書こう。', X('one'), '同じ種類の不特定のもの（a cap）は one。', 107, '代名詞 one', 'one と it', ['it']),
        ('「帽子をなくしたので、それをさがしています」：I lost my cap, so I\'m looking for （　）. の（　）に入る語を書こう。', X('it'), '前に出た特定のもの（the cap）は it。', 107, '代名詞 one', 'one と it', ['one']),
        ('「このシャツは大きい。もっと小さいのを見せてください」：Show me a smaller （　）. の（　）に入る語を書こう。', X('one'), '形容詞がつくと a＋形容詞＋one。', 107, '代名詞 one', 'one と it', ['it']),
        ('「彼らはいつもおたがいに助け合っています」：They always help （　）（　）. の（　）に入る2語を書こう。', E('one another', 'each other'), 'one another / each other「おたがい」。', 107, 'one another', 'one another', ['each one']),
        ('「イヌを2ひき飼っています。1ぴきは黒で、もう1ぴきは白です」：One is black, and （　）（　） is white. の（　）に入る2語を書こう。', E('the other'), '2つのうち「一方は one、他方は the other」。', 107, 'one 〜 the other', 'one と the other', ['another']),
        ('「行為者がわからないときや一般の人々のとき、by 〜 を省略することが多い」。They speak French in this country. を受動態にすると、by them はどうするか。「つける」か「省略する」で答えよう。', X('省略する', 'はぶく'), 'French is spoken in this country.（by them は省略）', 100, 'by以下の省略', 'by の省略', ['つける']),
        ('受動態の疑問文で、疑問詞が主語のとき：「どの車が毎日使われていますか」を英語にしよう（Which car で始める）。', E('Which car is used every day?'), '疑問詞が主語のときは「疑問詞＋be動詞＋過去分詞〜?」の語順。', 101, 'Check', '受動態の疑問文'),
        ('「この寺は794年に建てられました」：This temple （　）（　） in 794. の（　）に入る2語を書こう。', E('was built'), '過去の受動態 was＋過去分詞。build − built − built。', 103, '6', '過去の受動態', ['is built']),
        ('「何人の人が野球をするのに必要とされますか」：How many people （　）（　） to play baseball? の（　）に入る2語を書こう。', E('are needed'), 'How many people が主語。are＋過去分詞。', 103, '5', '受動態の疑問文'),
        ('「その犬はマリによって世話をされている」：The dog is taken care （　） by Mari. の（　）に入る前置詞を書こう。', X('of'), 'take care of の受動態は be taken care of by 〜。', 103, '5', '熟語の受動態', ['by']),
        ('「あなたのお父さんはどこで生まれましたか」：Where （　） your father （　）? の（　）に入る語を、間をあけて順に書こう。', E('was born'), 'be born「生まれる」の疑問文。', 103, '5', '受動態の疑問文'),
    ]
    fact, nf = facts(u, rows, r)
    gens = [passive, ppform, excl, negq, byx, active, negq, excl, active]
    plan = []
    for i in range(nf + 50):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 3) % len(gens)])
    fill(u, plan)
    guide = [{'title': '受動態の作り方', 'body': '「〜される・〜されている」は be動詞＋過去分詞（＋by 行為者）。Everyone loves Ken. → Ken is loved by everyone. 過去は was / were＋過去分詞。行為者がわからない・一般の人々のときは by 〜 を省略。'},
             {'title': '過去分詞', 'body': '規則動詞は過去形と同じ（-ed）。不規則動詞は1つずつ：speak − spoke − spoken、write − wrote − written、build − built − built、make − made − made、see − saw − seen、take − took − taken。'},
             {'title': '受動態の否定文・疑問文', 'body': '否定文は be動詞のあとに not（It is not used.）。疑問文は be動詞を主語の前に（Is it used?）。疑問詞が主語なら Which car is used every day?'},
             {'title': 'by 以外の前置詞', 'body': 'be interested in、be surprised at、be covered with、be filled with、be known to、be made of（材料）・from（原料）、be pleased with、be born（生まれる）。'},
             {'title': '感嘆文・Here is・one', 'body': 'How＋形容詞＋主語＋動詞！／What (a / an)＋形容詞＋名詞＋主語＋動詞！ Here is＋単数、Here are＋複数、Here he comes.。one は同じ種類の不特定のもの、it は前に出たその物。one another（おたがい）、one 〜 the other（2つのうち一方・他方）。'}]
    note = '2026-10-08 Claude作成。英語ドリル中級p100〜113（9 受動態・10 感嘆文／Here is〜／その他、STEP1〜3、理解度診断テスト）を写真で目視し、主語や語句を変えた類題を作った。絵・リスニング・長文の問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
