"""英語ドリル 中級 1 疑問詞で始まる疑問文・2 過去形／過去進行形（ドリル p52〜63）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, ING, PAST

SUB = [('Tom', 'he', 'トム'), ('My mother', 'she', '私の母'), ('Ken and Yuki', 'they', 'ケンとユキ'), ('Mr. Sato', 'he', '佐藤先生'), ('Emi', 'she', 'エミ'), ('They', 'they', '彼ら')]
ACT = [('visit', 'Kyoto', '京都を訪れ'), ('play', 'soccer', 'サッカーをし'), ('watch', 'the movie', 'その映画を見'), ('clean', 'the kitchen', '台所をそうじし'), ('cook', 'lunch', '昼食を作り'),
       ('make', 'a cake', 'ケーキを作り'), ('buy', 'a new bag', '新しいかばんを買い'), ('write', 'a letter', '手紙を書き'), ('read', 'the book', 'その本を読み'), ('study', 'math', '数学を勉強し'),
       ('see', 'Mr. Brown', 'ブラウン先生に会い'), ('eat', 'breakfast', '朝食を食べ'), ('use', 'the computer', 'そのコンピュータを使い'), ('wash', 'the car', '車を洗い')]
TIME = ['yesterday', 'last Sunday', 'last week', 'two days ago', 'last night']
QA = [('（　） is that tall boy? — He is my brother, Kenichi.', 'Who', '人をたずねるので Who。'),
      ('（　） did your sister get the nice bag? — She got it in London.', 'Where', '場所をたずねるので Where。'),
      ('（　） girl plays tennis better, Mai or Yuki? — Yuki does.', 'Which', '2人のうちどちらかをたずねるので Which＋名詞。'),
      ('（　） is your father in France now? — To work there.', 'Why', '目的・理由をたずねるので Why。'),
      ('（　） do you like Japanese food? — Very good!', 'How', '「〜はどうですか（気に入っていますか）」は How do you like 〜?'),
      ('（　） racket is this? — It is Ken\'s.', 'Whose', '持ち主をたずねるので Whose＋名詞。'),
      ('（　） time do you eat dinner? — At seven.', 'What', '「何時」は What time。'),
      ('（　） did you go there? — Last Saturday.', 'When', '時をたずねるので When。'),
      ('（　） did you come here? — By bus.', 'How', '手段をたずねるので How。'),
      ('（　） is the weather in Osaka? — It is sunny.', 'How', '様子をたずねるので How。'),
      ('（　） happened last night? — There was a big fire.', 'What', '主語の「何が」は What（3人称単数あつかい）。'),
      ('（　） took this picture? — My father did.', 'Who', '主語の「だれが」は Who。答えは 主語＋did。'),
      ('（　） did you meet at the station? — I met Mr. Smith.', 'Who', '目的語の「だれに」も Who（Whom）で始める。'),
      ('（　） season do you like, summer or winter? — I like winter.', 'Which', '選択肢から選ぶので Which。'),
      ('（　） don\'t you come with us? — OK, I will.', 'Why', 'Why don\'t you 〜? は「〜しませんか」というさそい。')]
HOW = [('How （　） are you? — I am thirteen years old.', 'old', '年齢は How old。'), ('How （　） is that bridge? — It is about 500 meters long.', 'long', '長さは How long。'),
       ('How （　） is your school from here? — It is only 500 meters.', 'far', '距離は How far。'), ('How （　） is this book? — It is 870 yen.', 'much', '値段は How much。'),
       ('How （　） books are there on the desk? — There are five.', 'many', '数は How many＋複数名詞。'), ('How （　） is Tom? — He is 165 centimeters tall.', 'tall', '背の高さは How tall。'),
       ('How （　） water do you need? — Just a little.', 'much', '数えられない名詞の量は How much。'), ('How （　） do you play tennis? — Twice a week.', 'often', '回数・頻度は How often。')]
PRON = ['/d/', '/t/', '/id/']
ED = {'played': '/d/', 'visited': '/id/', 'looked': '/t/', 'wanted': '/id/', 'lived': '/d/', 'danced': '/t/', 'stopped': '/t/', 'needed': '/id/', 'called': '/d/', 'washed': '/t/',
      'watched': '/t/', 'started': '/id/', 'cleaned': '/d/', 'helped': '/t/', 'liked': '/t/', 'used': '/d/', 'studied': '/d/', 'enjoyed': '/d/', 'waited': '/id/', 'walked': '/t/'}

def unit():
    u = GUnit('drill-english-2-question-past', '英語', '疑問詞と過去形・過去進行形', '中級 文法', grade=2)
    r = random.Random(2201)
    qa = iter(r.sample(QA, len(QA))); how = iter(r.sample(HOW, len(HOW)))
    def wh():
        q, a, e = next(qa)
        u.add(f'答えの文に合うように、（　）に入る疑問詞を書こう。\n{q}', exact([a, a.lower()]), e, r.choice([52, 54]), '1', '疑問詞')
    def hw():
        q, a, e = next(how)
        u.add(f'答えの文に合うように、（　）に入る1語を書こう。\n{q}', exact([a]), e, 53, 'How＋形容詞', 'How＋形容詞')
    def past():
        v = r.choice(list(PAST)); p = PAST[v]
        reg = p == v + 'ed' or p == v + 'd' or (v.endswith('y') and p == v[:-1] + 'ied') or (p == v + v[-1] + 'ed')
        u.add(f'次の動詞の過去形を書こう。\n{v}', exact([p]), f'{v} → {p}（{"規則動詞" if reg else "不規則動詞"}）。', 59, '1', '過去形', near=[v + 'ed'] if not reg else [])
    def ed():
        w = r.choice(list(ED))
        u.add(f'次の語の下線部 -ed の発音は /d/・/t/・/id/ のどれか。記号で書こう。\n{w}', exact([ED[w], ED[w].strip('/')]), f'{w} の -ed は {ED[w]}。t・d で終わる語は /id/、無声音（k・p・s・sh・ch など）のあとは /t/、それ以外は /d/。', 60, '1', '-ed の発音')
    def be_past():
        s, be, rest = r.choice([('I', 'was', 'in Nagoya three days ago'), ('They', 'were', 'tired last night'), ('My mother', 'was', 'angry then'), ('We', 'were', 'busy this morning'),
                                ('You', 'were', 'at home yesterday'), ('Tom and Nancy', 'were', 'in Canada last month'), ('It', 'was', 'very cold yesterday'), ('Mr. Smith', 'was', 'a teacher three years ago')])
        u.add(f'（　）に be動詞の過去形を書こう。\n{s} （　） {rest}.', exact([be]), f'過去の be動詞は am・is → was、are → were。主語が {s} なので {be}。', 58, '1', 'be動詞の過去形', near=['was' if be == 'were' else 'were'])
    def neg():
        (s, p, _), (v, o, _), t = r.choice(SUB), r.choice(ACT), r.choice(TIME)
        u.add(f'次の英文を否定文に書きかえよう。\n{s} {PAST[v]} {o} {t}.', E(f"{s} didn't {v} {o} {t}."), f'一般動詞の過去の否定文は did not（didn\'t）＋動詞の原形。{s} didn\'t {v} {o} {t}.', 61, '4', '過去の否定文')
    def que():
        (s, p, _), (v, o, _), t = r.choice(SUB), r.choice(ACT), r.choice(TIME)
        sq = s.lower() if s in ('They', 'My mother') else s
        u.add(f'次の英文を疑問文に書きかえよう。\n{s} {PAST[v]} {o} {t}.', E(f'Did {sq} {v} {o} {t}?'), f'Did＋主語＋動詞の原形〜? 答えは Yes, {p} did. / No, {p} didn\'t.', 59, '疑問文', '過去の疑問文')
    def ansq():
        (s, p, _), (v, o, _), t = r.choice(SUB), r.choice(ACT), r.choice(TIME)
        sq = s.lower() if s in ('They', 'My mother') else s; yes = r.random() < .5
        a = f'Yes, {p} did.' if yes else f"No, {p} didn't."
        u.add(f'次の疑問文に、{"「はい」" if yes else "「いいえ」"}で答えよう。\nDid {sq} {v} {o} {t}?', E(a), f'Did 〜? には did を使って答える。{a}', 59, '答え方', '過去の疑問文')
    def jp():
        (s, p, ja), (v, o, aj), t = r.choice(SUB), r.choice(ACT), r.choice(TIME[:2])
        tj = {'yesterday': 'きのう', 'last Sunday': 'この前の日曜日に'}[t]
        u.add(f'次の日本文を英語にしよう（{t} を文の最後に使う）。\n{ja}は{tj}{aj}ました。', E(f'{s} {PAST[v]} {o} {t}.'), f'過去の文は動詞を過去形にする。{s} {PAST[v]} {o} {t}.', 61, '3', '過去の文')
    def prog():
        (s, p, ja), (v, o, _) = r.choice(SUB), r.choice([a for a in ACT if a[0] in ING])
        be = 'were' if p == 'they' else 'was'
        if r.random() < .5:
            u.add(f'次の英文を過去進行形の文（「〜していた」）に書きかえよう。\n{s} {PAST[v]} {o}.', E(f'{s} {be} {ING[v]} {o}.'), f'過去進行形は was / were＋-ing形。{s} {be} {ING[v]} {o}.', 60, '4', '過去進行形')
        else:
            u.add(f'次の英文を否定文に書きかえよう。\n{s} {be} {ING[v]} {o} at that time.', E(f'{s} {be} not {ING[v]} {o} at that time.'), f'was / were のあとに not。{s} {be}n\'t {ING[v]} {o} at that time.', 59, '過去進行形', '過去進行形')
    def whq():
        (s, p, _), (v, o, _), t = r.choice(SUB), r.choice([a for a in ACT if a[0] not in ('visit', 'see')]), r.choice(TIME)
        sq = s.lower() if s in ('They', 'My mother') else s
        u.add(f'次の英文の下線部（{o}）が答えの中心になる疑問文を書こう。\n{s} {PAST[v]} {o} {t}.', E(f'What did {sq} {v} {t}?'), f'「何を」をたずねるので What で始め、did＋主語＋原形を続ける。', 52, 'Check', '下線部をたずねる疑問文')
    def whwhen():
        (s, p, _), (v, o, _), t = r.choice(SUB), r.choice(ACT), r.choice(TIME)
        sq = s.lower() if s in ('They', 'My mother') else s
        u.add(f'次の英文の下線部（{t}）が答えの中心になる疑問文を書こう。\n{s} {PAST[v]} {o} {t}.', E(f'When did {sq} {v} {o}?'), f'「いつ」をたずねるので When did＋主語＋原形〜?', 54, '3', '下線部をたずねる疑問文')
    X = lambda *a: exact(list(a))
    rows = [
        ('「なぜ家にいたのですか」— 「とても寒かったからです」：（　） it was very cold. の（　）に入る語を書こう。', X('Because', 'because'), 'Why 〜? には Because 〜.（理由）や To 〜.（目的）で答える。', 53, 'Why', 'Why と答え方', ['So']),
        ('「なぜ一生けんめい勉強するのですか」—「医者になるためです」：（　） become a doctor. の（　）に入る語を書こう。', X('To', 'to'), '目的は To＋動詞の原形で答える。', 53, 'Check⑦', 'Why と答え方', ['Because']),
        ('「〜しませんか」とさそう表現：（　）（　） you come with us? の（　）に入る2語を書こう。', E("Why don't"), 'Why don\'t you 〜? で「〜しませんか」。', 53, 'ズバリ暗記', 'さそう表現', ['Why do']),
        ('過去を表す語句のうち、「この前の〜」を表す語を書こう（例：（　） week）。', X('last'), 'last week（先週）、last night（昨夜）など。', 58, 'ズバリ暗記', '過去を表す語句', ['ago']),
        ('「3日前に」を英語で書こう。', E('three days ago'), '「〜前に」は 期間＋ago。', 58, 'ズバリ暗記', '過去を表す語句', ['before three days']),
        ('「（過去の）そのとき」を2語の英語で書こう。', E('at that time', 'then'), 'then（1語）や at that time（3語）。', 58, 'ズバリ暗記', '過去を表す語句'),
        ('次の疑問文に最も適する答えを選ぼう。\nWho was walking with John?\nア No, he didn\'t.　イ Cathy was.　ウ He was running there.', choice('イ'), '主語をたずねる Who 〜? には 主語＋was. で答える。', 61, '5', '答え方', ['ウ']),
        ('次の疑問文に最も適する答えを選ぼう。\nWhat was John doing in the park?\nア He was running there.　イ Yes, he was.　ウ John did.', choice('ア'), '何をしていたかには過去進行形で答える。', 61, '5', '答え方', ['イ']),
        ('「机の上に本が何冊かありました」：（　） were some books on the desk. の（　）に入る語を書こう。', X('There', 'there'), 'There was / were 〜. で「〜があった」。books が複数なので were。', 61, '6', 'There was / were', ['It']),
        ('「5時には雨が降っていませんでした」：（　） wasn\'t raining at five. の（　）に入る語を書こう。', X('It', 'it'), '天気を表す文の主語は it。', 61, '6', '天気の it', ['There']),
        ('「〜についてはどうですか」：（　）（　） you? の（　）に入る2語を書こう（例：I like cats. 〜 you?）。', E('How about', 'What about'), 'How about 〜? / What about 〜?', 53, 'ズバリ暗記', 'How about', ['How do']),
        ('「はじめまして」を英語で書こう。', E('How do you do', 'Nice to meet you'), 'How do you do? / Nice to meet you.', 53, 'ズバリ暗記', 'あいさつ'),
        ('次の英文の誤りを直して正しい文にしよう。\nHow many book are there on the desk?', E('How many books are there on the desk?'), 'How many のあとの名詞は複数形。', 56, '3', '誤りの訂正', ['How much books are there on the desk']),
        ('次の英文の誤りを直して正しい文にしよう。\nWho did break the window?', E('Who broke the window?'), '主語をたずねる Who は肯定文と同じ語順。did は使わず動詞を過去形にする。', 56, '3', '誤りの訂正'),
    ]
    fact, nf = facts(u, rows, r)
    gens = [wh, past, neg, que, hw, prog, ansq, ed, be_past, whq, jp, whwhen, past]
    plan = []
    for i in range(nf + 30):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 5) % len(gens)])
    fill(u, plan)
    guide = [{'title': '疑問詞の使い分け', 'body': 'Who（だれ）・What（何）・Whose（だれの）・Which（どちら）・When（いつ）・Where（どこ）・Why（なぜ）・How（どのように）。主語をたずねる Who / What は「Who＋動詞〜?」の語順（Who took this picture?）。'},
             {'title': 'How＋形容詞・副詞', 'body': 'How many＋複数名詞（数）、How much（値段・量）、How old（年齢）、How long（長さ・期間）、How far（距離）、How tall（背の高さ）、How often（回数）。'},
             {'title': '過去形の作り方', 'body': '規則動詞は -(e)d（play→played、like→liked、study→studied、stop→stopped）。不規則動詞は1つずつ覚える（go→went、see→saw、buy→bought）。-ed の発音は /d/・/t/・/id/。'},
             {'title': '過去の否定文・疑問文', 'body': 'be動詞：was / were のあとに not、疑問文は Was / Were を前へ。一般動詞：didn\'t＋原形、Did＋主語＋原形〜? 答えは Yes, 〜 did. / No, 〜 didn\'t.'},
             {'title': '過去進行形', 'body': '「〜していた」は was / were＋-ing形（She was watching TV then.）。否定文は was not 〜ing、疑問文は Was she 〜ing? then・at that time・at five などといっしょに使う。'}]
    note = '2026-10-08 Claude作成。英語ドリル中級p52〜63（1 疑問詞で始まる疑問文・2 be動詞・一般動詞の過去形／過去進行形、STEP1〜3）を写真で目視し、主語や語句を変えた類題を作った。絵・リスニング・長文の問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
