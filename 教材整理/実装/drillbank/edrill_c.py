"""英語ドリル 中級 3 未来表現／接続詞・4 比較表現（ドリル p64〜75）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, third

SUB = [('I', 'am'), ('Ken', 'is'), ('We', 'are'), ('My sister', 'is'), ('They', 'are'), ('She', 'is')]
ACT = [('visit', 'my uncle'), ('play', 'tennis'), ('clean', 'the room'), ('make', 'a cake'), ('watch', 'the soccer game'), ('read', 'this book'), ('study', 'English'), ('help', 'my mother'), ('go', 'to the library')]
TM = ['tomorrow', 'next Sunday', 'this weekend', 'next week']
CMP = {'tall': ('taller', 'tallest'), 'old': ('older', 'oldest'), 'long': ('longer', 'longest'), 'fast': ('faster', 'fastest'), 'young': ('younger', 'youngest'), 'small': ('smaller', 'smallest'),
       'big': ('bigger', 'biggest'), 'hot': ('hotter', 'hottest'), 'large': ('larger', 'largest'), 'nice': ('nicer', 'nicest'), 'easy': ('easier', 'easiest'), 'happy': ('happier', 'happiest'),
       'busy': ('busier', 'busiest'), 'early': ('earlier', 'earliest'), 'heavy': ('heavier', 'heaviest'), 'pretty': ('prettier', 'prettiest'), 'cold': ('colder', 'coldest'),
       'beautiful': ('more beautiful', 'most beautiful'), 'interesting': ('more interesting', 'most interesting'), 'popular': ('more popular', 'most popular'),
       'difficult': ('more difficult', 'most difficult'), 'important': ('more important', 'most important'), 'famous': ('more famous', 'most famous'), 'useful': ('more useful', 'most useful'),
       'good': ('better', 'best'), 'well': ('better', 'best'), 'many': ('more', 'most'), 'much': ('more', 'most'), 'bad': ('worse', 'worst')}
PAIRS = [('Ken', 'Bob', 'tall'), ('This bag', 'that one', 'big'), ('My brother', 'me', 'old'), ('Today', 'yesterday', 'hot'), ('This question', 'that one', 'easy'), ('This river', 'that one', 'long'),
         ('Tom', 'Ken', 'fast'), ('This book', 'that one', 'interesting'), ('This movie', 'that one', 'popular'), ('Math', 'science', 'difficult'), ('This flower', 'that one', 'beautiful'),
         ('This dictionary', 'that one', 'useful'), ('Yuki', 'her mother', 'busy'), ('This box', 'that one', 'heavy')]
SUPER = [('Bob', 'tall', 'in his class'), ('This book', 'interesting', 'of the three'), ('Mt. Fuji', 'high', 'in Japan'), ('Emi', 'young', 'in her family'), ('This park', 'large', 'in our city'),
         ('Tom', 'fast', 'of the five'), ('This song', 'popular', 'in Japan'), ('August', 'hot', 'of the year'), ('This question', 'difficult', 'of all'), ('Ken', 'busy', 'in our class')]
CMP['high'] = ('higher', 'highest')

def unit():
    u = GUnit('drill-english-2-future-compare', '英語', '未来表現・接続詞と比較', '中級 文法', grade=2)
    r = random.Random(2301)
    def going():
        (s, be), (v, o), t = r.choice(SUB), r.choice(ACT), r.choice(TM)
        u.add(f'次の英文を、文末に {t} を加えて be going to を使った未来の文に書きかえよう。\n{s} {third(v) if be == "is" else v} {o}.', E(f'{s} {be} going to {v} {o} {t}.'),
              f'be going to＋動詞の原形で「〜するつもりだ・〜しようとしている」。{s} {be} going to {v} {o} {t}.', 64, 'Check', 'be going to')
    def will():
        (s, be), (v, o), t = r.choice(SUB), r.choice(ACT), r.choice(TM)
        k = r.random()
        if k < .4:
            u.add(f'次の英文を、will を使った未来の文に書きかえよう（文末に {t} を加える）。\n{s} {third(v) if be == "is" else v} {o}.', E(f'{s} will {v} {o} {t}.'), f'will＋動詞の原形。主語が何でも will の形は変わらない。', 66, '2', 'will')
        elif k < .7:
            u.add(f'次の英文を否定文に書きかえよう。\n{s} will {v} {o} {t}.', E(f"{s} won't {v} {o} {t}."), f"will not（won't）＋原形。", 64, 'Check④', 'will の否定文')
        else:
            sq = s.lower() if s in ('They', 'She', 'We', 'My sister') else s
            if s == 'I': return
            u.add(f'次の英文を疑問文に書きかえよう。\n{s} will {v} {o} {t}.', E(f'Will {sq} {v} {o} {t}?'), 'Will を主語の前に出す。答えは Yes, 〜 will. / No, 〜 won\'t.', 64, 'Check③', 'will の疑問文')
    def comp():
        a, b, adj = r.choice(PAIRS); c = CMP[adj][0]
        be = 'are' if a in ('We', 'They') else 'is'
        u.add(f'（　）内の語を適切な形にかえよう（1語または2語）。\n{a} {be} （{adj}） than {b}.', E(c), f'比較級：{adj} → {c}。「…より〜」は 比較級＋than。', 72, '1', '比較級', near=[CMP[adj][1]])
    def sup():
        a, adj, rng = r.choice(SUPER); c = CMP[adj][1]
        u.add(f'（　）内の語を適切な形にかえよう（the もふくめて書く）。\n{a} is （{adj}） {rng}.', E(f'the {c}'), f'最上級：the＋{c}。「〜の中で」は of＋複数・数、in＋場所・集団。', 72, '1', '最上級', near=[c, CMP[adj][0]])
    def forms():
        adj = r.choice([a for a in CMP if a not in ('many', 'much', 'well')])
        if r.random() < .5:
            u.add(f'次の語の比較級を書こう。\n{adj}', E(CMP[adj][0]), f'{adj} − {CMP[adj][0]} − {CMP[adj][1]}', 70, 'ズバリ暗記', '比較変化', near=[adj + 'er', 'more ' + adj])
        else:
            u.add(f'次の語の最上級を書こう。\n{adj}', E(CMP[adj][1]), f'{adj} − {CMP[adj][0]} − {CMP[adj][1]}', 70, 'ズバリ暗記', '比較変化', near=[adj + 'est', 'most ' + adj])
    def asas():
        a, b, adj = r.choice([p for p in PAIRS if p[2] in ('tall', 'old', 'big', 'fast', 'long', 'busy', 'heavy', 'popular', 'interesting')])
        be = 'is'
        if r.random() < .5:
            u.add(f'「…と同じくらい〜」の意味になるように、（　）に入る3語を書こう。\n{a} {be} （　） {b}.（{adj} を使う）', E(f'as {adj} as'), 'as＋原級＋as で「…と同じくらい〜」。', 70, '1', 'as 〜 as', near=[f'as {CMP[adj][0]} as'])
        else:
            u.add(f'「…ほど〜ではない」の意味になるように、（　）に入る3語を書こう。\n{a} {be} not （　） {b}.（{adj} を使う）', E(f'as {adj} as'), 'not as＋原級＋as で「…ほど〜ではない」。', 70, '1', 'not as 〜 as')
    CONJ = [('Hurry up, （　） you will catch the train.', 'and', '命令文, and 〜.「〜しなさい、そうすれば…」'), ('Study hard, （　） you will not pass the exam.', 'or', '命令文, or 〜.「〜しなさい、そうしないと…」'),
            ('I was hungry, （　） I ate three hamburgers.', 'so', 'so「だから」で結果を表す。'), ('I didn\'t go to school （　） I was sick.', 'because', '理由を表す because。'),
            ('I went to school （　） I was sick.', 'though', '「〜だけれども」は though。'), ('（　） I got home, my mother was cooking.', 'When', '「〜したとき」は when。'),
            ('（　） it rains tomorrow, I will stay home.', 'If', '「もし〜なら」は if。if の文の中は未来のことでも現在形。'), ('Ms. Green is rich, （　） she is not happy.', 'but', '「しかし」は but。'),
            ('Do you like cats （　） dogs?', 'or', '「AかB」は A or B。'), ('Beth is either in the music room （　） in the library.', 'or', 'either A or B「AかBのどちらか」。'),
            ('Both Ken （　） Mike like cats.', 'and', 'both A and B「AもBも両方」。'), ('Not only Tom （　） also I am from Kobe.', 'but', 'not only A but also B「AだけでなくBも」。'),
            ('Run as fast （　） you can.', 'as', 'as 〜 as you can「できるだけ〜」。'), ('He worked so hard （　） he became rich.', 'that', 'so 〜 that …「とても〜なので…」。'),
            ('Please call me （　） you are free.', 'when', '「ひまなときに」は when。'), ('I can\'t buy this car （　） I don\'t have enough money.', 'because', '理由を表す because。')]
    ci = iter(r.sample(CONJ, len(CONJ)))
    def conj():
        q, a, e = next(ci)
        u.add(f'（　）に最も適する接続詞を書こう。\n{q}', exact([a, a.lower(), cap(a)]), e, r.choice([65, 66, 68]), '接続詞', '接続詞')
    X = lambda *a: exact(list(a))
    rows = [
        ('「窓を開けましょうか」と相手の意向をたずねるとき：（　）（　） open the window? の（　）に入る2語を書こう。', E('Shall I'), 'Shall I 〜?「（私が）〜しましょうか」。答えは Yes, please. / No, thank you.', 65, 'Shall', 'Shall I / we', ['Will you']),
        ('「ここで昼食にしましょうか」とさそうとき：（　）（　） have lunch here? の（　）に入る2語を書こう。', E('Shall we'), 'Shall we 〜?「（いっしょに）〜しましょうか」。答えは Yes, let\'s. / No, let\'s not.', 65, 'Shall', 'Shall I / we', ['Shall I']),
        ('「今夜電話をしてくれませんか」と頼むとき：（　）（　） call me tonight? の（　）に入る2語を書こう。', E('Will you'), 'Will you 〜?「〜してくれませんか」。', 65, 'Will you', 'Will you', ['Shall I']),
        ('Shall we watch TV in the living room? に「はい、そうしましょう」と答えるとき、最も適するものを選ぼう。\nア Yes, I am.　イ Yes, let\'s.　ウ Yes, please.', choice('イ'), 'Shall we 〜? には Yes, let\'s. / No, let\'s not.', 67, '4', 'Shall I / we', ['ウ']),
        ('Shall I make dinner for you? に「はい、お願いします」と答えるとき、最も適するものを選ぼう。\nア Yes, please.　イ Yes, let\'s.　ウ Yes, I will.', choice('ア'), 'Shall I 〜? には Yes, please. / No, thank you.', 67, '4', 'Shall I / we', ['イ']),
        ('If it （　）（be の適切な形） sunny tomorrow, I will go out. の（　）に入る語を書こう。', X('is'), '時・条件を表す if・when の文の中は、未来のことでも現在形。', 66, '1(3)', 'if と時制', ['will be']),
        ('「2人のうちどちらが年上ですか」：（　） is older, Tom or Bob? の（　）に入る語を書こう（人の場合）。', X('Who', 'who'), '人をくらべるときは Who がよく使われる。物は Which。', 71, '疑問詞', '比較の疑問文', ['Which']),
        ('「ネコとイヌではどちらが好きですか」：Which do you like （　）, cats or dogs? の（　）に入る語を書こう。', X('better'), 'like 〜 better「〜のほうが好き」。', 71, 'like', 'like better', ['more']),
        ('「すべてのスポーツの中でテニスがいちばん好き」：I like tennis （　）（　） all sports. の（　）に入る2語を書こう。', E('the best of', 'best of'), 'like 〜 (the) best「〜がいちばん好き」。', 71, 'like', 'like best', ['better of']),
        ('「東京は世界で最も大きな都市の1つです」：Tokyo is one of the biggest （　） in the world. の（　）に入る語を書こう。', X('cities'), 'one of the＋最上級＋複数名詞「最も〜な…の1つ」。', 71, '重要表現', '最上級の重要表現', ['city']),
        ('「その子犬はますます大きくなっています」：The puppy is getting （　） and （　）. の（　）に入る語を書こう（同じ語が2回入る。1つだけ書こう）。', X('bigger'), '比較級 and 比較級「ますます〜」。', 71, '重要表現', '比較級 and 比較級', ['big']),
        ('「ジョンはクラスのほかのどの男子よりも速く泳ぐ」：John swims faster than any other （　） in his class. の（　）に入る語を書こう。', X('boy'), '比較級＋than any other＋単数名詞「ほかのどの〜よりも」。', 71, '重要表現', 'any other', ['boys']),
        ('This question is more difficult than that one. とほぼ同じ意味になるように：That question is （　） than this one. の（　）に入る語を書こう。', X('easier'), '反対の意味の語で比べる：difficult ↔ easy。', 75, '3', '書きかえ', ['more easy']),
        ('「〜の中で」を表す in と of の使い分け：「3人の中で」は （　） the three。（　）に入る語を書こう。', X('of'), 'of＋複数・数（of the three, of all）、in＋場所・集団（in my class）。', 70, '最上級', 'in と of', ['in']),
        ('「〜の中で」を表す in と of の使い分け：「私のクラスの中で」は （　） my class。（　）に入る語を書こう。', X('in'), 'in＋場所・集団。', 70, '最上級', 'in と of', ['of']),
        ('未来を表す語句「次の〜」を1語で書こう（例：（　） Sunday）。', X('next'), 'next Sunday、next week など。', 64, 'ズバリ暗記', '未来を表す語句', ['last']),
        ('「あさって」を4語の英語で書こう。', E('the day after tomorrow'), 'the day after tomorrow。', 64, 'ズバリ暗記', '未来を表す語句'),
    ]
    fact, nf = facts(u, rows, r)
    gens = [going, comp, will, sup, conj, forms, asas, comp, will, sup]
    plan = []
    for i in range(nf + 40):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 3) % len(gens)])
    fill(u, plan)
    guide = [{'title': 'be going to と will', 'body': 'be going to＋原形「〜するつもりだ（予定）」、will＋原形「〜するだろう・〜します（その場で決めた意志）」。否定は be not going to / will not（won\'t）、疑問は Are you going to 〜? / Will you 〜?'},
             {'title': 'Shall I / Shall we / Will you', 'body': 'Shall I 〜?（〜しましょうか）→ Yes, please. / No, thank you. Shall we 〜?（いっしょに〜しましょう）→ Yes, let\'s. / No, let\'s not. Will you 〜?（〜してくれませんか）→ Sure. / All right.'},
             {'title': '接続詞', 'body': 'and / but / or / so、when（とき）・if（もし）・because（なぜなら）・though（けれども）。命令文, and（そうすれば）／命令文, or（そうしないと）。both A and B、either A or B、not only A but also B、so 〜 that …、as 〜 as you can。'},
             {'title': '比較級・最上級の作り方', 'body': 'er / est（tall）、e で終わる→r / st（large）、子音字を重ねる（big → bigger）、y→ier（easy → easier）、長い語は more / most（beautiful）。不規則：good・well → better → best、many・much → more → most、bad → worse → worst。'},
             {'title': '比較の文', 'body': 'A is 比較級 than B.／A is the 最上級 in（場所・集団）／of（複数）．as 原級 as「同じくらい」、not as 〜 as「…ほど〜ない」。one of the 最上級＋複数名詞、比較級＋than any other＋単数名詞。'}]
    note = '2026-10-08 Claude作成。英語ドリル中級p64〜75（3 未来表現／接続詞・4 比較表現、STEP1〜3）を写真で目視し、主語や語句を変えた類題を作った。グラフ・絵・リスニングの問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
