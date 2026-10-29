"""英語ドリル 上級 5 不定詞を含む重要構文・6 話法と人称・時制の一致／仮定法（ドリル p140〜153）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap

def unit():
    u = GUnit('drill-english-3-infinitive-subjunctive', '英語', '不定詞の構文・話法と仮定法', '上級 文法', grade=3)
    r = random.Random(2901)
    ITF = [('easy', 'Kumi', 'to play the violin', 'for'), ('difficult', 'me', 'to read this English book', 'for'), ('important', 'us', 'to help old people', 'for'), ('hard', 'children', 'to swim in this river', 'for'),
           ('necessary', 'you', 'to study every day', 'for'), ('dangerous', 'the children', 'to play here', 'for'), ('kind', 'you', 'to help me', 'of'), ('stupid', 'you', 'to believe his story', 'of'),
           ('nice', 'him', 'to carry my bag', 'of'), ('wise', 'her', 'to say so', 'of')]
    def itfor():
        adj, who, inf, pr = r.choice(ITF)
        u.add(f'（　）に for か of を書こう。\nIt is {adj} （　） {who} {inf}.', exact([pr]), '人の性質（kind, nice, stupid, wise など）を表す形容詞のときは of、それ以外（easy, difficult, important など）は for。', 141, 'Check', 'It is 〜 for (of) 人 to …', near=['of' if pr == 'for' else 'for'])
    def itrew():
        sub, adj, ja = r.choice([('To speak French', 'not easy', 'フランス語を話すことは簡単ではない'), ('To swim in this river', 'dangerous', 'この川で泳ぐのは危険だ'), ('To help old people', 'good', 'お年寄りを助けることはよいことだ'),
                                ('To learn a foreign language', 'interesting', '外国語を学ぶのはおもしろい'), ('To get up early', 'hard', '早起きするのはたいへんだ')])
        rest = sub[0].lower() + sub[1:]
        u.add(f'次の英文を It を使ってほぼ同じ内容の文に書きかえよう。\n{sub} is {adj}.', E(f'It is {adj} {rest}.', f"It's {adj} {rest}."), '長い主語（to 〜）を後ろに回し、仮の主語 It を文頭に置く。', 142, '1', '仮の主語 it')
    TOO = [('I was too excited to sleep well.', 'I was so excited that I couldn\'t sleep well.'), ('This box is too heavy for me to carry.', 'This box is so heavy that I can\'t carry it.'),
           ('He was too busy to watch TV.', 'He was so busy that he couldn\'t watch TV.'), ('This coffee is too hot for me to drink.', 'This coffee is so hot that I can\'t drink it.'),
           ('The question was too difficult for us to answer.', 'The question was so difficult that we couldn\'t answer it.'), ('She is too young to drive a car.', 'She is so young that she can\'t drive a car.')]
    ti = iter(r.sample(TOO, len(TOO)))
    def too():
        a, b = next(ti)
        u.add(f'次の英文を so 〜 that … can\'t（couldn\'t）を使ってほぼ同じ意味の文に書きかえよう。\n{a}', E(b, b.replace("can't", 'cannot').replace("couldn't", 'could not')), 'too 〜 to …「〜すぎて…できない」＝ so 〜 that … can\'t。to のあとの目的語は that の文では it などで表す。', 142, '3', 'too 〜 to と so 〜 that')
    ENOUGH = [('Tom is so tall that he can touch the ceiling.', 'Tom is tall enough to touch the ceiling.'), ('Kumi got up so early that she could catch the first train.', 'Kumi got up early enough to catch the first train.'),
              ('He is so rich that he can buy the big house.', 'He is rich enough to buy the big house.'), ('The box is so light that a woman can carry it.', 'The box is light enough for a woman to carry.')]
    ei = iter(r.sample(ENOUGH, len(ENOUGH)))
    def enough():
        a, b = next(ei)
        u.add(f'次の英文を enough to を使ってほぼ同じ意味の文に書きかえよう。\n{a}', E(b), '形容詞（副詞）＋enough to …「…するのに十分〜」。', 142, '3', 'enough to')
    ASK = [('My father said to me, "Study harder."', 'My father told me to study harder.'), ('We said to her, "Please sing English songs."', 'We asked her to sing English songs.'),
           ('My mother said to me, "Clean your room."', 'My mother told me to clean my room.'), ('Nancy said to him, "Please open the window."', 'Nancy asked him to open the window.'),
           ('Our teacher always says to us, "Don\'t stay up late."', 'Our teacher always tells us not to stay up late.'), ('Mr. Ito said to us, "Don\'t be late for school."', 'Mr. Ito told us not to be late for school.')]
    ai = iter(r.sample(ASK, len(ASK)))
    def ask():
        a, b = next(ai)
        u.add(f'次の英文を tell（ask）＋人＋to … を使ってほぼ同じ意味の文に書きかえよう。\n{a}', E(b), '命令文は tell＋人＋to …、Please 〜 の依頼は ask＋人＋to …、Don\'t 〜 は tell＋人＋not to …。', 142, '3', 'tell / ask 人 to')
    def want():
        who, v, ja = r.choice([('you', 'go shopping', 'あなたに買い物に行ってほしい'), ('him', 'come to the party', '彼にパーティーに来てほしい'), ('you', 'be a great artist', 'あなたに立派な芸術家になってほしい'),
                                ('her', 'help me', '彼女に手伝ってほしい'), ('you', 'stay here', 'あなたにここにいてほしい'), ('my brother', 'clean his room', '弟に部屋をそうじしてほしい')])
        u.add(f'「私は{ja}」を英語で書こう（want を使う）。', E(f'I want {who} to {v}.'), 'want＋人＋to …「人に…してほしい」。', 141, 'want 人 to', 'want 人 to')
    def feel():
        adj, v, ja = r.choice([('glad', 'see you', 'あなたに会えてうれしい'), ('sad', 'hear the news', 'その知らせを聞いて悲しい'), ('sorry', 'hear that', 'それを聞いて残念だ'), ('surprised', 'see him there', 'そこで彼を見て驚いた'),
                                ('happy', 'meet you', 'あなたに会えて幸せだ'), ('excited', 'watch the game', 'その試合を見てわくわくしている')])
        tense = 'was' if adj == 'surprised' else 'am'
        u.add(f'「私は{ja}」を英語で書こう（{adj} と不定詞を使う）。', E(f'I {tense} {adj} to {v}.'), '感情を表す形容詞＋to …「…して〜」（感情の原因）。', 140, 'Check', '感情の原因の不定詞')
    REP = [('Tom said, "I am busy."', 'Tom said that he was busy.'), ('Jane said, "I am sorry."', 'Jane said that she was sorry.'), ('Ken said, "I like soccer."', 'Ken said that he liked soccer.'),
           ('Mary said, "I can play the piano."', 'Mary said that she could play the piano.'), ('Tom said to me, "I am busy."', 'Tom told me that he was busy.'),
           ('Jimmy said to me, "I will give you my cap."', 'Jimmy told me that he would give me his cap.'), ('Sue said to me, "I will buy a cake for you."', 'Sue told me that she would buy a cake for me.'),
           ('Miyuki said to us, "We have a school festival next week."', 'Miyuki told us that they had a school festival the next week.')]
    pi = iter(r.sample(REP, len(REP)))
    def rep():
        a, b = next(pi)
        u.add(f'次の英文を間接話法の文に書きかえよう（that を使う）。\n{a}', E(b, b.replace(' that ', ' ', 1)), '間接話法：said to 人 → told 人、引用部分の人称を話し手の立場に変え、時制を一致させる（am → was、will → would、can → could）。', 146, 'Check', '直接話法と間接話法')
    def tense():
        v, ok, a = r.choice([('think', 'is', 'was'), ('know', 'lives', 'lived'), ('hear', 'can', 'could'), ('think', 'will', 'would'), ('know', 'has', 'had')])
        tail = {'is': 'sick', 'lives': 'in Kyoto', 'can': 'swim well', 'will': 'come', 'has': 'a dog'}[ok]
        past = {'think': 'thought', 'know': 'knew', 'hear': 'heard'}[v]
        u.add(f'主節の動詞を過去形にしたとき、（　）に入る語を書こう。\nI {v} that she {ok} {tail}. → I {past} that she （　） {tail}.', exact([a]), '時制の一致：主節が過去なら that 以下も過去形にする。', 147, '時制の一致', '時制の一致', near=[ok])
    WISH = [('I am sorry I am not good at cooking.', 'I wish I were good at cooking.'), ('I am sorry I don\'t have a bike.', 'I wish I had a bike.'), ('I am sorry I can\'t speak English well.', 'I wish I could speak English well.'),
            ('I am sorry I don\'t know her address.', 'I wish I knew her address.'), ('I am sorry it is raining now.', 'I wish it were not raining now.'), ('I am sorry I don\'t have more time.', 'I wish I had more time.')]
    wi = iter(r.sample(WISH, len(WISH)))
    def wish():
        a, b = next(wi)
        alts = [b, b.replace(' were', ' was')]
        u.add(f'次の英文を I wish 〜 を使って、ほぼ同じ内容を表す文に書きかえよう。\n{a}', E(*alts), 'I wish＋主語＋過去形「〜ならいいのに」（現実と反対の願望）。be動詞はふつう were。', 147, 'Check', '仮定法過去（wish）')
    IF = [('I don\'t have enough money, so I can\'t buy the nice bag.', 'If I had enough money, I could buy the nice bag.'), ('Taro doesn\'t know how to play chess, so he cannot join us.', 'If Taro knew how to play chess, he could join us.'),
          ('This jacket is so expensive, so I won\'t buy it.', 'If this jacket were not so expensive, I would buy it.'), ('She is sick, so she can\'t go hiking.', 'If she were not sick, she could go hiking.'),
          ('I don\'t know her mail address, so I can\'t send an e-mail to her.', 'If I knew her mail address, I could send an e-mail to her.'), ('I am not a bird, so I can\'t fly to you.', 'If I were a bird, I could fly to you.')]
    ii = iter(r.sample(IF, len(IF)))
    def ifq():
        a, b = next(ii)
        alts = [b, b.replace(' were', ' was')]
        u.add(f'次の英文を If を使った仮定法の文に書きかえよう。\n{a}', E(*alts), 'If＋主語＋過去形, 主語＋would / could＋原形「もし〜なら、…だろうに」（現実と反対の仮定）。', 148, '1', '仮定法過去（if）')
    ADJ = [('easy', 'やさしい'), ('difficult', '難しい'), ('important', '大切だ'), ('necessary', '必要だ'), ('interesting', 'おもしろい'), ('hard', 'たいへんだ')]
    PER = [('me', '私'), ('us', '私たち'), ('him', '彼'), ('her', '彼女'), ('Ken', 'ケン')]
    INF = [('to read this book', 'この本を読む'), ('to swim in the sea', '海で泳ぐ'), ('to get up early', '早く起きる'), ('to learn English', '英語を学ぶ'), ('to cook dinner', '夕食を作る')]
    def itfor2():
        (a, aj), (p, pj), (i, ij) = r.choice(ADJ), r.choice(PER), r.choice(INF)
        u.add(f'「{pj}にとって{ij}ことは{aj}」を、It で始まる英文で書こう。', E(f'It is {a} for {p} {i}.', f"It's {a} for {p} {i}."), 'It is＋形容詞＋for＋人＋to＋原形。for 人 は不定詞の意味上の主語。', 140, '不定詞の意味上の主語', 'It is 〜 for 人 to …')
    WHO = [('me', 'me'), ('him', 'him'), ('her', 'her'), ('us', 'us')]
    CMD = [('Open the window', 'open the window'), ('Clean the room', 'clean the room'), ('Come here', 'come here'), ('Read this book', 'read this book'), ('Wash the dishes', 'wash the dishes'), ('Close the door', 'close the door')]
    def tell2():
        (w, w2), (c, c2) = r.choice(WHO), r.choice(CMD); s = r.choice(['Ken', 'My mother', 'Ms. Green'])
        if r.random() < .5:
            u.add(f'次の英文を tell＋人＋to … を使ってほぼ同じ意味の文に書きかえよう。\n{s} said to {w}, "{c}."', E(f'{s} told {w2} to {c2}.'), '命令文の伝達は tell＋人＋to＋原形。', 141, 'tell 人 to', 'tell / ask 人 to')
        else:
            u.add(f'次の英文を ask＋人＋to … を使ってほぼ同じ意味の文に書きかえよう。\n{s} said to {w}, "Please {c2}."', E(f'{s} asked {w2} to {c2}.'), 'Please 〜 の依頼は ask＋人＋to＋原形。', 141, 'ask 人 to', 'tell / ask 人 to')
    X = lambda *a: exact(list(a))
    rows = [
        ('「まず初めに」を3語の英語で書こう（不定詞を使う）。', E('to begin with'), 'to begin with「まず初めに」。', 140, 'ズバリ暗記', '独立不定詞'),
        ('「実を言うと」を4語の英語で書こう（不定詞を使う）。', E('to tell the truth'), 'to tell the truth「本当のことを言うと」。', 140, 'ズバリ暗記', '独立不定詞'),
        ('「いわば」を3語の英語で書こう（不定詞を使う）。', E('so to speak'), 'so to speak「いわば」。', 140, 'ズバリ暗記', '独立不定詞'),
        ('「確かに〜する」：be （　） to 〜。（　）に入る語を書こう。', X('sure'), 'be sure to 〜「きっと〜する」。', 140, 'ズバリ暗記', '不定詞の熟語'),
        ('「彼がそう言うなんておろかだ」：He must be a fool （　） say so. の（　）に入る語を書こう。', X('to'), '判断の理由を表す不定詞「〜するとは」。', 140, '判断の理由', '判断の理由の不定詞'),
        ('「宝くじに当たったら、シドニーに家を買うだろう」：If I （　）（win） a lottery, I would buy a house in Sydney. の（　）に入る語を書こう。', X('won'), '仮定法過去では if の文の動詞を過去形にする。', 149, '5', '仮定法過去（if）', ['win']),
        ('仮定法過去で、主語が I や he のとき、be動詞はふつう何を使うか。', X('were'), 'If I were 〜 / I wish I were 〜（口語では was も使われる）。', 147, '注', '仮定法過去', ['was']),
        ('「もし明日雨なら、家にいます」：If it （　）（rain） tomorrow, I will stay home. の（　）に入る語を書こう（実際に起こりうる条件）。', X('rains'), '起こりうる条件（直説法）では if の文は現在形。仮定法ではない。', 147, '注', '直説法と仮定法', ['rained']),
        ('He said, "I am busy." と同じ内容を間接話法にすると He said that he （　） busy. の（　）に入る語は何か。', X('was'), '時制の一致で am → was。', 146, '間接話法', '直接話法と間接話法', ['is']),
        ('「1日がもっと長ければいいのに」：I wish a day （　） longer. の（　）に入る語を書こう。', X('were', 'was'), 'I wish＋主語＋were 〜。', 149, '5(3)', '仮定法過去（wish）', ['is']),
    ]
    fact, nf = facts(u, rows, r)
    gens = [itfor, too, rep, wish, itrew, ask, ifq, enough, want, tense, feel, itfor2, tell2, itfor2]
    plan = []
    for i in range(nf + 60):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 6) % len(gens)])
    fill(u, plan)
    guide = [{'title': 'It is 〜 for (of) 人 to …', 'body': 'It is easy for me to read this book.「私にとって〜するのは…だ」。kind・nice・stupid など人の性質を表す形容詞のときは of（It was kind of you to help me.）。'},
             {'title': 'too 〜 to／enough to', 'body': 'too 〜 to …「〜すぎて…できない」＝ so 〜 that … can\'t。〜 enough to …「…するのに十分〜」＝ so 〜 that … can。'},
             {'title': 'want / tell / ask＋人＋to …', 'body': 'want 人 to …「人に…してほしい」、tell 人 to …「人に…するように言う」、ask 人 to …「人に…するように頼む」。否定は not to …。'},
             {'title': '話法と時制の一致', 'body': '直接話法 He said, "I am busy." → 間接話法 He said that he was busy.。said to 人 → told 人、人称（I → he / she、you → me など）と時制（am → was、will → would、can → could）を変える。'},
             {'title': '仮定法過去', 'body': '現実と反対のことは過去形で表す。If＋主語＋過去形, 主語＋would / could＋原形。I wish＋主語＋過去形（were・had・could 〜）。be動詞はふつう were。起こりうる条件の if は現在形のまま。'}]
    note = '2026-10-08 Claude作成。英語ドリル上級p140〜153（5 不定詞を含む重要構文・6 話法と人称・時制の一致／仮定法、STEP1〜3、理解度診断テスト）を写真で目視し、語句を変えた類題を作った。リスニング・長文・グラフの問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
