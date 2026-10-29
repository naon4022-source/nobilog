"""英語ドリル 中級 5 助動詞／have to・had better・6 不定詞（ドリル p76〜87）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, third

SUB = [('I', 'I'), ('Ken', 'he'), ('My sister', 'she'), ('We', 'we'), ('They', 'they'), ('You', 'you')]
ACT = [('swim', 'in this river', 'この川で泳ぐ'), ('play', 'the piano', 'ピアノをひく'), ('speak', 'English', '英語を話す'), ('use', 'this computer', 'このコンピュータを使う'), ('read', 'this book', 'この本を読む'),
       ('go', 'to bed early', '早く寝る'), ('clean', 'the room', '部屋をそうじする'), ('finish', 'the homework', '宿題を終える'), ('help', 'my mother', '母を手伝う'), ('get up', 'at six', '6時に起きる')]
def low(s): return s if s in ('I', 'Ken') else s.lower()

def unit():
    u = GUnit('drill-english-2-modal-infinitive', '英語', '助動詞と不定詞', '中級 文法', grade=2)
    r = random.Random(2401)
    def ableto():
        (s, p), (v, o, _) = r.choice(SUB), r.choice(ACT)
        be = {'I': 'am', 'Ken': 'is', 'My sister': 'is'}.get(s, 'are')
        u.add(f'次の英文を、ほぼ同じ意味の be able to を使った文に書きかえよう。\n{s} can {v} {o}.', E(f'{s} {be} able to {v} {o}.'), f'can ＝ be able to＋原形。主語が {s} なので {be} able to。', 76, 'be able to', 'be able to')
    def could():
        (s, p), (v, o, _) = r.choice(SUB), r.choice(ACT)
        u.add(f'次の英文を過去の文に書きかえよう（1語の助動詞を使う）。\n{s} can {v} {o}.', E(f'{s} could {v} {o}.'), 'can の過去形は could。was / were able to でも表せる。', 78, '3', 'could')
    def hadto():
        (s, p), (v, o, _) = r.choice(SUB), r.choice(ACT)
        u.add(f'次の英文を過去の文に書きかえよう。\n{s} must {v} {o}.', E(f'{s} had to {v} {o}.'), 'must には過去形がないので had to＋原形を使う。', 78, '3', 'had to')
    def haveto():
        (s, p), (v, o, _) = r.choice(SUB), r.choice(ACT)
        h = 'has' if s in ('Ken', 'My sister') else 'have'
        u.add(f'次の英文を、have to を使ってほぼ同じ意味の文に書きかえよう。\n{s} must {v} {o}.', E(f'{s} {h} to {v} {o}.'), f'must ＝ have to。主語が {s} なので {h} to。', 77, 'have to', 'have to')
    def dont():
        (s, p), (v, o, j) = r.choice(SUB), r.choice(ACT)
        d = "doesn't" if s in ('Ken', 'My sister') else "don't"
        JA = {'I': '私', 'Ken': 'ケン', 'My sister': '姉', 'We': '私たち', 'They': '彼ら', 'You': 'あなた'}
        u.add(f'「{JA[s]}は{j}必要はない」という意味の文になるように、（　）に入る3語を書こう。\n{s} （　） {v} {o}.',
              E(f'{d} have to'), f'don\'t（doesn\'t）have to＋原形「〜する必要はない」。must not（〜してはいけない）とのちがいに注意。', 77, 'have to', "don't have to", near=["mustn't", 'must not'])
    MEAN = [('You must not swim in this lake.', '禁止', 'must not は「〜してはいけない」（禁止）。'), ('You don\'t have to come here.', '不必要', 'don\'t have to は「〜する必要はない」（不必要）。'),
            ('You may use my pen.', '許可', 'may は「〜してもよい」（許可）。'), ('It may rain tomorrow.', '推量', 'may は「〜かもしれない」（推量）の意味もある。'),
            ('He must be sick.', '推量', 'must be 〜 は「〜にちがいない」（推量）。'), ('The story cannot be true.', '推量', 'cannot be 〜 は「〜のはずがない」。'),
            ('You should see this movie.', '助言', 'should は「〜すべきだ・〜したほうがよい」（助言・義務）。'), ('You had better stay home.', '助言', 'had better＋原形「〜したほうがよい」（強い助言）。'),
            ('You must finish your homework.', '義務', 'must は「〜しなければならない」（義務）。'), ('May I come in?', '許可', 'May I 〜?「〜してもよいですか」（許可を求める）。')]
    mi = iter(r.sample(MEAN, len(MEAN)))
    def mean():
        s, a, e = next(mi)
        u.add(f'次の英文の助動詞の意味として最も適するものを、「義務」「禁止」「不必要」「許可」「推量」「助言」から選ぼう。\n{s}', exact([a]), e, r.choice([76, 77, 78]), '意味', '助動詞の意味')
    REPLY = [('May I use your phone?', 'はい', 'Yes, you may.', 'May I 〜? への答え（Sure. / Of course. もよく使う）。'), ('May I watch TV?', 'いいえ', 'No, you may not.', '「いいえ」は No, you may not. や No, you can\'t.'),
             ('Must I clean the room now?', 'いいえ', "No, you don't have to.", 'Must I 〜? に「いいえ（その必要はない）」は No, you don\'t have to. / No, you need not.'),
             ('Must Kevin stay at home?', 'はい', 'Yes, he must.', 'Must 〜? に「はい」は Yes, 〜 must.'), ('Does she have to try it?', 'はい', 'Yes, she does.', 'Does 〜 have to …? には does で答える。'),
             ('Are the boys able to swim?', 'いいえ', "No, they aren't.", 'Are 〜 able to …? には be動詞で答える。')]
    ri = iter(r.sample(REPLY, len(REPLY)))
    def reply():
        q, y, a, e = next(ri)
        extra = ["No, you can't.", 'No, you cannot.'] if 'may not' in a else (['No, you need not.', "No, you needn't."] if "don't have to" in a else [])
        u.add(f'次の疑問文に「{y}」で答えよう。\n{q}', E(a, *extra), e, 78, '2', '助動詞の答え方')
    INF = [('I went to the supermarket （　） buy some eggs.', 'to', '副詞的用法「〜するために」。'),
           ('I want something （　） drink.', 'to', '形容詞的用法「飲むための何か」。'),
           ('（　） cook is fun.', 'To', '名詞的用法「料理をすること」。'),
           ('She was the first girl （　） come here.', 'to', '形容詞的用法「ここに来た最初の少女」。'),
           ('My dream is （　） go to France.', 'to', '名詞的用法（補語）「フランスに行くこと」。')]
    def infuse():
        k = r.random()
        SENT = [('I visited Tokyo to see my uncle.', '副詞的用法', '「おじに会うために」動詞を修飾。'), ('I have a lot of homework to do today.', '形容詞的用法', '「するべき宿題」名詞を修飾。'),
                ('I like to read books.', '名詞的用法', '「本を読むこと」目的語。'), ('To speak English is difficult.', '名詞的用法', '「英語を話すこと」主語。'),
                ('Bob came to Japan to study Japanese.', '副詞的用法', '「日本語を学ぶために」目的。'), ('She has no time to watch TV.', '形容詞的用法', '「テレビを見る時間」名詞を修飾。'),
                ('My job is to teach English.', '名詞的用法', '「英語を教えること」補語。'), ('I was glad to see you.', '副詞的用法', '「あなたに会えて」感情の原因。'),
                ('Please give me something to eat.', '形容詞的用法', '「食べるための何か」。'), ('He decided to buy the car.', '名詞的用法', '「車を買うこと」目的語。'),
                ('We went to the park to play tennis.', '副詞的用法', '「テニスをするために」目的。'), ('There are no chairs to sit on in this room.', '形容詞的用法', '「すわるためのいす」。')]
        s, a, e = r.choice(SENT)
        u.add(f'次の英文の不定詞（to＋動詞の原形）の用法を、「名詞的用法」「副詞的用法」「形容詞的用法」から選ぼう。\n{s}', exact([a, a.replace('用法', '')]), e, 82, '不定詞', '不定詞の用法')
    TOO = [('This book is too difficult for me to read.', 'This book is so difficult that I cannot read it.'),
           ('He is too old to run fast.', 'He is so old that he cannot run fast.'),
           ('It was too cold to swim in the sea.', 'It was so cold that we could not swim in the sea.')]
    def tooto():
        k = r.random()
        if k < .5:
            adj, ja, who, verb = r.choice([('busy', '忙しすぎて', 'I am', 'watch TV'), ('tired', '疲れすぎて', 'I was', 'walk'), ('young', '若すぎて', 'You are', 'drive a car'), ('hot', '熱すぎて', 'This coffee is', 'drink'), ('old', '年をとりすぎて', 'He is', 'run fast')])
            u.add(f'「{ja}〜できない」という意味になるように、（　）に入る語を書こう。\n{who} （　） {adj} （　） {verb}.（2つの（　）の語を順に、間をあけて書こう）', E('too to'), 'too＋形容詞＋to＋原形「〜すぎて…できない」。', 82, 'too 〜 to', 'too 〜 to')
        else:
            adj, who, verb = r.choice([('rich', 'She is', 'buy the car'), ('dark', 'It is', 'see stars'), ('strong', 'Mike was', 'carry the heavy bag'), ('old', 'The children are', 'go to school')])
            u.add(f'「十分に〜なので…できる」という意味になるように、（　）に入る2語を書こう。\n{who} {adj} （　）（　） {verb}.', E('enough to'), '形容詞＋enough to＋原形「…するのに十分〜」。', 82, 'enough to', 'enough to')
    WH = [('how', '〜のしかた', ['make sushi', 'use this computer', 'play chess']), ('what', '何を〜すればよいか', ['do next', 'buy', 'say']),
          ('where', 'どこで（へ）〜すればよいか', ['go next', 'buy the ticket', 'get off']), ('when', 'いつ〜すればよいか', ['start', 'leave', 'call him']), ('which', 'どれを〜すればよいか', ['buy', 'choose', 'take'])]
    def whto():
        w, j, vs = r.choice(WH); v = r.choice(vs)
        u.add(f'「{j}」を表すように、（　）に入る2語を書こう。\nDo you know （　）（　） {v}?', E(f'{w} to'), f'疑問詞＋to＋原形：{w} to 〜「{j}」。', 83, '疑問詞＋to', '疑問詞＋to')
    def ittake():
        a, b, jj = r.choice([('to speak English', 'difficult', '英語を話すことは難しい'), ('to understand each other', 'important', 'たがいに理解し合うことは大切だ'), ('to do the work', 'easy', 'その仕事をするのは簡単だ'),
                             ('to play video games', 'interesting', 'テレビゲームをすることはおもしろい'), ('to study hard', 'important', '一生けんめい勉強することは大切だ'), ('to swim in this river', 'dangerous', 'この川で泳ぐのは危険だ')])
        u.add(f'「{jj}」を、仮の主語 It を使った英文にしよう。', E(f'It is {b} {a}.'), f'It is＋形容詞＋to＋原形。It は「それは」と訳さない仮の主語。', 83, '仮の主語', '仮の主語 it')
    X = lambda *a: exact(list(a))
    rows = [
        ('「〜したい」を表す2語の英語を書こう（例：I （　）（　） play baseball.）。', E('want to'), 'want to＋原形「〜したい」。', 83, 'ズバリ暗記', '不定詞を目的語にとる動詞', ['want']),
        ('「〜しようとする」は （　） to do。（　）に入る動詞を書こう。', X('try'), 'try to do「〜しようとする」。', 83, 'ズバリ暗記', '不定詞を目的語にとる動詞'),
        ('「〜しようと決心する」は （　） to do。（　）に入る動詞を書こう。', X('decide'), 'decide to do。', 83, 'ズバリ暗記', '不定詞を目的語にとる動詞', ['enjoy']),
        ('「もう帰ってもいいよ、ボブ」：Now you （　） go home, Bob. の（　）に入る助動詞を書こう。', X('may', 'can'), 'may / can「〜してもよい」。', 78, '1', 'may', ['must']),
        ('「無理をするな。休むべきだ」：Don\'t work too hard. You （　） take a rest. の（　）に入る1語を書こう。', X('should'), 'should「〜すべきだ」。', 78, '1', 'should', ['must not']),
        ('「もっと熱心にサッカーを練習したほうがよい」：You （　）（　） practice soccer harder. の（　）に入る2語を書こう。', E('had better'), 'had better＋原形「〜したほうがよい」。', 78, '1', 'had better', ['have better']),
        ('had better の否定形「〜しないほうがよい」：You had better （　） stay here. の（　）に入る語を書こう。', X('not'), 'had better not＋原形。', 77, 'had better', 'had better', ['don\'t']),
        ('「約束は守るべきです」：You （　） keep your promise. の（　）に入る1語を書こう。', X('should', 'must'), 'should / must。', 77, 'Check④', 'should'),
        ('「急ぐ必要はありません」：You （　）（　） hurry up. の（　）に入る2語を書こう（need を使う）。', E('need not', "needn't"), 'need not＋原形＝ don\'t have to。', 77, 'Check③', '不必要', ['must not']),
        ('「あなたに会えてうれしい」：I\'m glad （　） see you. の（　）に入る語を書こう。', X('to'), '感情の原因を表す不定詞。', 83, '感情', '不定詞の副詞的用法'),
        ('「彼女は早く起きるために9時に寝た」：She went to bed at nine （　）（　） up early. の（　）に入る2語を書こう。', E('to get'), '目的を表す to＋原形。', 82, 'Check①', '不定詞の副詞的用法'),
        ('「何か書くもの（筆記用具）がありますか」：Do you have anything to write （　）? の（　）に入る前置詞を書こう。', X('with'), 'write with a pen（ペンで書く）なので anything to write with。', 85, '3', '不定詞の形容詞的用法', ['on']),
        ('Mike was strong enough carry the heavy bag. に to を1つ補って正しい文にしよう。', E('Mike was strong enough to carry the heavy bag.'), 'enough to＋原形。', 84, '2', 'enough to'),
        ('Kyoto has a lot of places visit. に to を1つ補って正しい文にしよう。', E('Kyoto has a lot of places to visit.'), '形容詞的用法 places to visit「訪れるべき場所」。', 84, '2', '不定詞の形容詞的用法'),
    ]
    for (q, a, e) in INF:
        rows.append((f'（　）に入る1語を書こう。\n{q}', exact([a, a.lower()]), e, 84, '1', '不定詞'))
    fact, nf = facts(u, rows, r)
    gens = [ableto, mean, could, infuse, hadto, tooto, haveto, whto, dont, ittake, reply]
    plan = []
    for i in range(nf + 40):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 4) % len(gens)])
    fill(u, plan)
    guide = [{'title': 'can・may・must', 'body': 'can「〜できる」（＝be able to）、過去は could。may「〜してもよい」「〜かもしれない」。must「〜しなければならない」「〜にちがいない」、must not「〜してはいけない」。cannot be「〜のはずがない」。'},
             {'title': 'have to・should・had better', 'body': 'have to＝must（主語が3人称単数なら has to、過去は had to、未来は will have to）。don\'t have to「〜する必要はない」。should「〜すべきだ」、had better＋原形「〜したほうがよい」（否定は had better not）。'},
             {'title': '不定詞の3用法', 'body': '名詞的用法「〜すること」（I like to read.）、副詞的用法「〜するために／〜して」（I went there to see him. / I\'m glad to see you.）、形容詞的用法「〜するための・〜すべき」（something to drink）。'},
             {'title': '仮の主語 it と疑問詞＋to', 'body': 'It is 形容詞 to 〜.「〜することは…だ」。how to（〜のしかた）、what to（何を〜すべきか）、where to、when to、which to。'},
             {'title': 'too 〜 to と enough to', 'body': 'too＋形容詞＋to「〜すぎて…できない」（＝so 〜 that … can\'t）。形容詞＋enough to「…するのに十分〜」。'}]
    note = '2026-10-08 Claude作成。英語ドリル中級p76〜87（5 助動詞／have to・had better・6 不定詞、STEP1〜3）を写真で目視し、主語や語句を変えた類題を作った。絵・リスニングの問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
