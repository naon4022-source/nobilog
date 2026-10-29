"""英語ドリル 上級 1 現在完了形／現在完了進行形・2 SVO/SVOO/SVOC/原形不定詞（ドリル p114〜127）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, PP, PAST, ING

SUB = [('I', 'have'), ('We', 'have'), ('They', 'have'), ('Ken', 'has'), ('My sister', 'has'), ('She', 'has')]
EXP = [('visit', 'Kyoto'), ('see', 'a panda'), ('read', 'this book'), ('climb', 'Mt. Fuji'), ('eat', 'sushi'), ('write', 'a letter in English'), ('meet', 'his sister'), ('play', 'the guitar')]
PP2 = dict(PP, climb='climbed')
CON = [('live', 'in Tokyo', 'lived'), ('know', 'Sam', 'known'), ('be', 'busy', 'been'), ('want', 'a new bike', 'wanted'), ('study', 'English', 'studied')]
def low(s): return s if s in ('I', 'Ken') else s[0].lower() + s[1:]

def unit():
    u = GUnit('drill-english-3-perfect-sentence', '英語', '現在完了形と文型', '上級 文法', grade=3)
    r = random.Random(2701)
    def ppf():
        v = r.choice(list(PP))
        u.add(f'次の動詞の過去分詞を書こう。\n{v}', exact([PP[v]]), f'{v} − {PAST.get(v, "was / were")} − {PP[v]}', 114, '付録', '過去分詞', near=[PAST.get(v, '')] if PAST.get(v) != PP[v] else [])
    def exper():
        (s, h), (v, o) = r.choice(SUB), r.choice(EXP); n = r.choice(['twice', 'three times', 'once', 'before'])
        u.add(f'次の英文を、文末に {n} を加えて現在完了形（経験）の文に書きかえよう。\n{s} {PAST.get(v, v + "ed") if v != "climb" else "climbed"} {o}.', E(f'{s} {h} {PP2[v]} {o} {n}.'), f'経験「〜したことがある」は have / has＋過去分詞。{n} などといっしょに使う。', 116, 'Check', '現在完了（経験）')
    def never():
        (s, h), (v, o) = r.choice(SUB), r.choice(EXP)
        JA = {'I': '私', 'We': '私たち', 'They': '彼ら', 'Ken': 'ケン', 'My sister': '姉', 'She': '彼女'}
        u.add(f'「{JA[s]}は一度も〜したことがない」という否定文にしよう（never を使う）。\n{s} {h} {PP2[v]} {o}.', E(f'{s} {h} never {PP2[v]} {o}.'), 'have / has never＋過去分詞「一度も〜したことがない」。', 116, '経験', '現在完了（経験）')
    def ever():
        (s, h), (v, o) = r.choice(SUB), r.choice(EXP)
        if s == 'I': return
        u.add(f'「〜したことがありますか」とたずねる文にしよう（ever を使う）。\n{s} {h} {PP2[v]} {o}.', E(f'{cap(h)} {low(s)} ever {PP2[v]} {o}?'), 'Have / Has＋主語＋ever＋過去分詞〜?', 117, 'Check⑤', '現在完了（経験）')
    def cont():
        (s, h), (v, o, p) = r.choice(SUB), r.choice(CON)
        k = r.random()
        if k < .5:
            n = r.choice(['three years', 'a long time', 'ten years', 'two weeks'])
            u.add(f'（　）に for か since を書こう。\n{s} {h} {p} {o} （　） {n}.', exact(['for']), 'for＋期間（〜の間）。since＋起点（〜以来）。', 116, '継続', 'for と since', near=['since'])
        else:
            n = r.choice(['2020', 'last year', 'yesterday', 'I was a child', 'last month'])
            u.add(f'（　）に for か since を書こう。\n{s} {h} {p} {o} （　） {n}.', exact(['since']), 'since＋起点（〜以来）。for＋期間。', 116, '継続', 'for と since', near=['for'])
    def howlong():
        (s, h), (v, o, p) = r.choice(SUB), r.choice(CON)
        if s == 'I': return
        n = r.choice(['for three years', 'since 2020', 'for a long time'])
        u.add(f'次の英文の下線部（{n}）をたずねる疑問文にしよう。\n{s} {h} {p} {o} {n}.', E(f'How long {h} {low(s)} {p} {o}?'), '期間をたずねるときは How long have / has＋主語＋過去分詞〜?', 118, '3(3)', 'How long')
    def done():
        (s, h), (v, o) = r.choice(SUB), r.choice([('finish', 'my homework'), ('clean', 'the room'), ('eat', 'lunch'), ('read', 'the letter'), ('wash', 'the car'), ('do', 'the work')])
        o = o.replace('my', 'his' if s == 'Ken' else ('her' if s in ('My sister', 'She') else ('our' if s == 'We' else ('their' if s == 'They' else 'my'))))
        k = r.random(); P = dict(PP, finish='finished')
        if k < .35:
            u.add(f'「もう〜してしまった」という文にしよう（already を使う）。\n{s} {PAST.get(v, v + "ed")} {o}.', E(f'{s} {h} already {P[v]} {o}.'), '完了「もう〜した」は have / has already＋過去分詞。', 117, '完了', '現在完了（完了）')
        elif k < .7:
            if s == 'I': return
            u.add(f'「もう〜しましたか」とたずねる文にしよう（yet を使う）。\n{s} {h} {P[v]} {o}.', E(f'{cap(h)} {low(s)} {P[v]} {o} yet?'), '疑問文の yet「もう」は文末に置く。', 117, '完了', '現在完了（完了）')
        else:
            u.add(f'「まだ〜していない」という文にしよう（yet を使う）。\n{s} {h} {P[v]} {o}.', E(f"{s} {h} not {P[v]} {o} yet."), '否定文の yet「まだ」は文末。have / has not＋過去分詞〜 yet。', 117, '完了', '現在完了（完了）')
    def prog():
        (s, h), (v, o, j) = r.choice(SUB), r.choice([('play', 'tennis', 'テニスをし'), ('wait', 'for her', '彼女を待ち'), ('study', 'English', '英語を勉強し'), ('run', 'in the park', '公園で走り'), ('read', 'the book', 'その本を読み')])
        n = r.choice(['for an hour', 'since this morning', 'for two hours'])
        g = ING.get(v, v + 'ing')
        u.add(f'「ずっと〜し続けている」という現在完了進行形の文にしよう。\n{s} {"am" if s == "I" else ("is" if h == "has" else "are")} {g} {o} now.（文末に {n} を加える）', E(f'{s} {h} been {g} {o} {n}.'), '動作の継続は have / has been＋-ing（現在完了進行形）。', 116, '進行形', '現在完了進行形')
    MEAN = [('My father has been to China twice.', '経験', '「行ったことがある」は have been to。'), ('Koji has gone to Australia.', '結果', 'have gone to「〜へ行ってしまった（今ここにいない）」。'),
            ('I have just finished my homework.', '完了', 'just「ちょうど」→完了。'), ('We have lived here for ten years.', '継続', 'for ten years→継続。'),
            ('Have you ever seen a koala?', '経験', 'ever→経験。'), ('She has known him since she was a child.', '継続', 'since→継続。'),
            ('I have already eaten lunch.', '完了', 'already→完了。'), ('He has never climbed Mt. Fuji.', '経験', 'never→経験。')]
    mi = iter(r.sample(MEAN, len(MEAN)))
    def mean():
        s, a, e = next(mi)
        u.add(f'次の英文の現在完了の用法を「継続」「経験」「完了」「結果」から選ぼう。\n{s}', exact([a]), e, 118, '6', '現在完了の用法')
    def svoc():
        s, v, o, c, ja = r.choice([('We', 'call', 'the cat', 'Kuro', '私たちはそのネコをクロと呼ぶ'), ('They', 'named', 'their daughter', 'Nancy', '彼らは娘をナンシーと名づけた'),
                                   ('The news', 'made', 'him', 'sad', 'その知らせは彼を悲しくさせた'), ('Please keep', '', 'the room', 'clean', '部屋をきれいにしておいて'),
                                   ('This song always makes', '', 'me', 'happy', 'この歌はいつも私を幸せにする'), ('Tom made', '', 'his son', 'a doctor', 'トムは息子を医者にした'), ('I found', '', 'the room', 'empty', '部屋はからっぽだとわかった')])
        sv = f'{s} {v}'.strip()
        u.add(f'「{ja}」となるように、語を並べかえて英文を書こう。\n（ {" / ".join(r.sample([o, c], 2))} ）を使って：{sv} （　）（　）.', E(f'{o} {c}'), 'SVOC：動詞＋目的語＋補語（O＝C）。call / name / make / keep / find など。', 123, 'SVOC', 'SVOC')
    def bare():
        v, ja, rest, verb = r.choice([('let', '〜させてあげる', 'me', 'use your computer'), ('made', '〜させた', 'me', 'wait for a long time'), ('helped', '〜するのを手伝った', 'me', 'cook dinner'),
                                       ('saw', '〜するのを見た', 'the train', 'cross the bridge'), ('heard', '〜するのを聞いた', 'her', 'sing'), ('felt', '〜するのを感じた', 'the earth', 'shake')])
        s = 'Please' if v == 'let' else r.choice(['I', 'My mother', 'He'])
        u.add(f'（　）に入る1語を書こう（原形不定詞を使う）。\n{s} {v} {rest} （　） {" ".join(verb.split()[1:])}.'.replace('  ', ' ').replace(' .', '.'), exact([verb.split()[0]]), f'{v}＋目的語＋動詞の原形（to をつけない）＝原形不定詞。', 123, '原形不定詞', '原形不定詞', near=['to ' + verb.split()[0]])
    def indq():
        q, a = r.choice([('Who is that girl?', 'I know who that girl is.'), ('Where is Yumi from?', 'I want to know where Yumi is from.'), ('What did Ken buy last week?', 'Do you know what Ken bought last week?'),
                         ('Who broke the window?', "We don't know who broke the window."), ('When does the game start?', 'Do you know when the game starts?'), ('What is this?', 'I know what this is.')])
        head = a.split(' ' + {'who': 'who', 'where': 'where', 'what': 'what', 'when': 'when'}[q.split()[0].lower()] + ' ', 1)[0]
        u.add(f'次の疑問文を、「{head} 〜」に続く間接疑問文にして、文全体を書こう。\n{q}', E(a), '間接疑問は「疑問詞＋主語＋動詞」の語順（do / does / did は使わない）。', 122, '間接疑問', '間接疑問文')
    X = lambda *a: exact(list(a))
    rows = [
        ('「私の兄はちょうど学校へ出かけたところです」：My brother has （　） left for school. の（　）に入る語を書こう。', X('just'), 'just「ちょうど」は have / has と過去分詞の間。', 119, '7(2)', '現在完了（完了）', ['already']),
        ('「〜へ行ったことがある」は have （　） to 〜。（　）に入る語を書こう。', X('been'), 'have been to「〜へ行ったことがある」、have gone to「〜へ行ってしまった」。', 117, 'be と go', 'been to と gone to', ['gone']),
        ('Mr. Smith have been sick since last week. の誤りを直して正しい文にしよう。', E('Mr. Smith has been sick since last week.'), '主語が3人称単数なので has。', 118, '4(1)', '誤りの訂正'),
        ('Did you gone to the library last Saturday? の誤りを直して正しい文にしよう。', E('Did you go to the library last Saturday?'), 'last Saturday（過去の特定の時）は現在完了と使えないので過去形の文にする。', 118, '4(3)', '誤りの訂正'),
        ('I have known Ken for last year. の誤りを直して正しい文にしよう（下線部 for last year の部分）。', E('I have known Ken since last year.'), '起点（last year）には since。', 121, '5(1)', '誤りの訂正'),
        ('When have you bought the car? の誤りを直して正しい文にしよう。', E('When did you buy the car?'), 'When で始まる疑問文には現在完了は使えない。過去形にする。', 121, '5(2)', '誤りの訂正'),
        ('「私は彼が私たちの新しい先生だと思う」：I think （　） he is our new teacher. の（　）に入る接続詞を書こう（省略可だが書こう）。', X('that'), 'think / know / hope / say＋that＋文。この that は省略できる。', 122, 'that', 'SVO（that節）'),
        ('「次に何をすればよいかわからない」：I don\'t know （　）（　） do next. の（　）に入る2語を書こう。', E('what to'), '疑問詞＋to do が目的語。', 122, 'Check①', '疑問詞＋to'),
        ('「駅への道を教えてくれた」：A kind person told me （　）（　） get to the station. の（　）に入る2語を書こう。', E('how to'), 'SVOO の2つ目の目的語が how to 〜。', 123, 'SVOO', '疑問詞＋to'),
        ('「ジムにすてきないすを買ってあげた」：I bought a nice chair （　） Jim. の（　）に入る前置詞を書こう。', X('for'), 'buy は for を使う。', 123, 'Check⑤', 'SVOO の書きかえ', ['to']),
        ('「あなたのノートをジョンに見せて」：Please show your notebook （　） John. の（　）に入る前置詞を書こう。', X('to'), 'show は to を使う。', 123, 'Check④', 'SVOO の書きかえ', ['for']),
        ('「〜を…と呼ぶ」の意味で SVOC をつくる動詞を1つ英語で書こう（call / name / make / keep / find のうち「呼ぶ」）。', X('call'), 'call O C「OをCと呼ぶ」。', 123, 'ズバリ暗記', 'SVOC', ['name']),
    ]
    fact, nf = facts(u, rows, r)
    gens = [exper, ppf, cont, done, mean, svoc, never, prog, bare, ever, indq, howlong, ppf]
    plan = []
    for i in range(nf + 50):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 5) % len(gens)])
    fill(u, plan)
    guide = [{'title': '現在完了の形', 'body': 'have / has＋過去分詞。否定文は have / has not＋過去分詞、疑問文は Have / Has＋主語＋過去分詞〜? 答えは Yes, I have. / No, I haven\'t.。'},
             {'title': '継続・経験・完了', 'body': '継続（ずっと〜している）：for＋期間・since＋起点、How long 〜?。経験（〜したことがある）：ever・never・before・once・twice・〜 times。完了（〜したところ・もう〜した）：just・already・yet。'},
             {'title': '注意する現在完了', 'body': 'have been to（行ったことがある）と have gone to（行ってしまった）。yesterday・last 〜・〜 ago・When 〜? など過去の特定の時は現在完了と使えない。動作の継続は現在完了進行形 have been 〜ing。'},
             {'title': 'SVO・SVOO・間接疑問', 'body': 'think / know / hope＋that 節。目的語が疑問詞＋to do（how to 〜）。間接疑問は 疑問詞＋主語＋動詞（I know what this is.）。SVOO→ to（give, show, tell, teach）・for（buy, make, cook）。'},
             {'title': 'SVOC と原形不定詞', 'body': 'call / name O C「OをCと呼ぶ・名づける」、make O C「OをCにする」、keep O C「OをCにしておく」、find O C「OがCだとわかる」。make / let / help＋O＋原形「Oに〜させる」、see / hear / feel＋O＋原形「Oが〜するのを見る・聞く・感じる」。'}]
    note = '2026-10-08 Claude作成。英語ドリル上級p114〜127（付録 不規則動詞の活用表・1 現在完了形／現在完了進行形・2 SVO/SVOO/SVOC/原形不定詞、STEP1〜3）を写真で目視し、主語や語句を変えた類題を作った。リスニング・長文の問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
