"""英語ドリル 初級 現在進行形（ドリル p46〜49）と付録（p50 代名詞・曜日・月・序数）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, ING

SUBJ = [('I', 'am', 'わたし'), ('You', 'are', 'あなた'), ('He', 'is', '彼'), ('She', 'is', '彼女'), ('Ken', 'is', 'ケン'), ('My sister', 'is', '私の姉'),
        ('We', 'are', '私たち'), ('They', 'are', '彼ら'), ('Tom and Mary', 'are', 'トムとメアリー'), ('Emi', 'is', 'エミ')]
ACT = [('play', 'tennis', 'テニスをして'), ('read', 'a book', '本を読んで'), ('cook', 'dinner', '夕食を作って'), ('swim', 'in the sea', '海で泳いで'), ('write', 'a letter', '手紙を書いて'),
       ('watch', 'TV', 'テレビを見て'), ('study', 'English', '英語を勉強して'), ('run', 'in the park', '公園で走って'), ('make', 'a cake', 'ケーキを作って'), ('use', 'a computer', 'コンピュータを使って'),
       ('sing', 'a song', '歌を歌って'), ('clean', 'the room', '部屋をそうじして'), ('wash', 'the dishes', '皿を洗って'), ('sit', 'on the bench', 'ベンチにすわって'), ('listen', 'to music', '音楽を聞いて')]
THIRDS = [('He', 'is'), ('She', 'is'), ('Ken', 'is'), ('My sister', 'is'), ('They', 'are'), ('Tom and Mary', 'are'), ('Emi', 'is')]
def low(s): return s.lower() if s in ('He', 'She', 'We', 'They', 'My sister') else s
PRON = {'he': 'he', 'she': 'she', 'ken': 'he', 'my sister': 'she', 'emi': 'she', 'they': 'they', 'tom and mary': 'they', 'we': 'we', 'you': 'I', 'i': 'you'}

def unit():
    u = GUnit('drill-english-1-progressive', '英語', '現在進行形', '文法', grade=1)
    r = random.Random(2101)
    def ing():
        v = r.choice(list(ING)); g = ING[v]
        rule = 'そのまま ing をつける。' if g == v + 'ing' else ('ie を y にかえて ing。' if v.endswith('ie') else ('e をとって ing。' if g == v[:-1] + 'ing' else '最後の文字を重ねて ing。'))
        u.add(f'次の動詞の -ing 形を書こう。\n{v}', exact([g]), f'{v} → {g}。{rule}', 46, '1', '-ing形', near=[v + 'ing'])
    def form():
        (s, be, _), (v, o, _) = r.choice(SUBJ), r.choice(ACT)
        u.add(f'次の英文の（ ）内の語を、「今〜している」という意味になるように2語で書きかえよう。\n{s} （{v}） {o} now.', E(f'{be} {ING[v]}'), f'現在進行形は be動詞（am / is / are）＋ -ing 形。主語が {s} なので {be} {ING[v]}。', 46, '1', '現在進行形の形')
    def neg():
        (s, be, _), (v, o, _) = r.choice(SUBJ), r.choice(ACT)
        u.add(f'次の英文を否定文に書きかえよう。\n{s} {be} {ING[v]} {o}.', E(f'{s} {be} not {ING[v]} {o}.'), f'be動詞のあとに not を入れる。{s} {be} not {ING[v]} {o}.', 47, '5', '否定文')
    def ques():
        (s, be), (v, o, _) = r.choice(THIRDS), r.choice(ACT)
        u.add(f'次の英文を疑問文に書きかえよう。\n{s} {be} {ING[v]} {o}.', E(f'{cap(be)} {low(s)} {ING[v]} {o}?'), f'be動詞を主語の前に出す。{cap(be)} {low(s)} {ING[v]} {o}?', 47, '1', '疑問文')
    def ans():
        (s, be), (v, o, _) = r.choice(THIRDS), r.choice(ACT)
        p = PRON[s.lower()]
        yes = r.random() < .5
        a = f'Yes, {p} {be}.' if yes else f'No, {p} {be} not.'
        u.add(f'次の疑問文に、{"「はい」" if yes else "「いいえ」"}で答えよう。\n{cap(be)} {low(s)} {ING[v]} {o} now?', E(a), f'{s} は代名詞 {p} で受け、be動詞を使って答える。{a}', 46, '3', '答え方')
    def what():
        (s, be), (v, o, aj) = r.choice(THIRDS), r.choice(ACT)
        p = PRON[s.lower()]
        u.add(f'What {be} {low(s).replace("my sister", "your sister")} doing now? という質問に、「{aj}いるところです」と英語で答えよう（主語は代名詞にする）。', E(f'{cap(p)} {be} {ING[v]} {o}.'), f'「何をしているところですか」には進行形で答える。{cap(p)} {be} {ING[v]} {o}.', 46, '3', 'What 〜 doing?')
    def jp():
        (s, be, ja), (v, o, aj) = r.choice(SUBJ), r.choice(ACT)
        u.add(f'次の日本文を英語にしよう（now を文の最後に使う）。\n{ja}は今、{aj}います。', E(f'{s} {be} {ING[v]} {o} now.'), f'現在進行形：{s} {be} {ING[v]} {o} now.', 47, '5', '日本文を英語に')
    def tense():
        (s, be, _), (v, o, _) = r.choice([x for x in SUBJ if x[1] == 'is']), r.choice(ACT)
        from ecommon import third
        if r.random() < .5:
            u.add(f'（ ）内の語を適切な形にかえよう（1語または2語）。\n{s} （{v}） {o} every day.', E(third(v)), f'every day（毎日）は習慣なので現在形。主語が3人称単数なので {third(v)}。', 47, '4', '現在形と進行形', near=[f'is {ING[v]}'])
        else:
            u.add(f'（ ）内の語を適切な形にかえよう（1語または2語）。\n{s} （{v}） {o} now.', E(f'is {ING[v]}'), f'now（今）は進行中の動作なので現在進行形 is {ING[v]}。', 47, '4', '現在形と進行形', near=[third(v)])
    X = lambda *a: exact(list(a))
    rows = [
        ('like（好きだ）や know（知っている）のように、ふつう進行形にしない動詞がある。「私はネコが好きです」を英語にしよう。', E('I like cats.'), '状態を表す動詞（like, know, have〈持っている〉, want など）はふつう進行形にしない。', 46, 'まとめ', '進行形にしない動詞', ["I'm liking cats"]),
        ('「彼はその答えを知っています」を英語にしよう（know を使う）。', E('He knows the answer.'), 'know は状態を表す動詞なので進行形にしない。', 46, 'まとめ', '進行形にしない動詞', ['He is knowing the answer']),
        ('次の疑問文に対する答えとして最も適するものを選ぼう。\nWhat are you doing?\nア Yes, I am.　イ I am making a doll.　ウ I make a doll.', choice('イ'), '「何をしているところか」には進行形で具体的に答える。', 46, '3', '答え方', ['ア']),
        ('次の疑問文に対する答えとして最も適するものを選ぼう。\nIs John studying English now?\nア Yes, he does.　イ Yes, he is.　ウ No, he isn’t studying now English.', choice('イ'), 'Is 〜? の疑問文には is を使って答える。', 46, '3', '答え方', ['ア']),
        ('「〜はどこで…していますか」とたずねる文：（　）is Emi studying? の（　）に入る語を書こう。', X('Where', 'where'), '場所をたずねる疑問詞 where を文頭に置き、進行形の疑問文を続ける。', 46, '3', '疑問詞と進行形', ['What']),
        ('「だれが公園を走っていますか」：（　）is running in the park? の（　）に入る語を書こう。', X('Who', 'who'), '主語をたずねる who は3人称単数あつかいで、Who is running 〜? となる。', 46, '2(3)', '疑問詞と進行形', ['What']),
        ('「わたし」を表す I の所有格（わたしの）を書こう。', X('my'), 'I − my − me − mine', 50, '付録', '代名詞の格変化', ['me']),
        ('「わたし」を表す I の目的格（わたしを・わたしに）を書こう。', X('me'), 'I − my − me − mine', 50, '付録', '代名詞の格変化', ['my']),
        ('「わたしのもの」を1語の英語で書こう。', X('mine'), 'I − my − me − mine', 50, '付録', '代名詞の格変化', ['my']),
        ('he の所有格（彼の）を書こう。', X('his'), 'he − his − him − his', 50, '付録', '代名詞の格変化', ['him']),
        ('he の目的格（彼を・彼に）を書こう。', X('him'), 'he − his − him − his', 50, '付録', '代名詞の格変化', ['his']),
        ('she の所有格（彼女の）を書こう。', X('her'), 'she − her − her − hers', 50, '付録', '代名詞の格変化', ['hers']),
        ('「彼女のもの」を1語の英語で書こう。', X('hers'), 'she − her − her − hers', 50, '付録', '代名詞の格変化', ['her']),
        ('we の所有格（わたしたちの）を書こう。', X('our'), 'we − our − us − ours', 50, '付録', '代名詞の格変化', ['us']),
        ('we の目的格（わたしたちを・わたしたちに）を書こう。', X('us'), 'we − our − us − ours', 50, '付録', '代名詞の格変化', ['our']),
        ('「わたしたちのもの」を1語の英語で書こう。', X('ours'), 'we − our − us − ours', 50, '付録', '代名詞の格変化', ['our']),
        ('they の所有格（彼らの）を書こう。', X('their'), 'they − their − them − theirs', 50, '付録', '代名詞の格変化', ['them']),
        ('they の目的格（彼らを・彼らに）を書こう。', X('them'), 'they − their − them − theirs', 50, '付録', '代名詞の格変化', ['their']),
        ('「彼らのもの」を1語の英語で書こう。', X('theirs'), 'they − their − them − theirs', 50, '付録', '代名詞の格変化', ['their']),
        ('「あなたのもの」を1語の英語で書こう。', X('yours'), 'you − your − you − yours', 50, '付録', '代名詞の格変化', ['your']),
        ('it の所有格（それの）を書こう。', X('its'), "it − its − it。it's（it is の短縮形）と区別する。", 50, '付録', '代名詞の格変化', ["it's"]),
        ('who の所有格「だれの」を書こう。', X('whose'), 'who − whose − who(m)', 50, '付録', '代名詞の格変化', ['who']),
        ('This is my bag. を「このかばんはわたしのものです」という意味の文に書きかえよう。This bag is （　）. の（　）に入る1語を書こう。', X('mine'), '「わたしのもの」＝ mine。', 48, '4', '所有代名詞', ['my']),
        ('A と B の関係が C と D の関係と同じになるように、D に入る語を書こう。\nA: I　B: mine　C: we　D: ？', X('ours'), 'I − mine と同じく we − ours（所有代名詞）。', 48, '2', '語の関係', ['our']),
        ('A と B の関係が C と D の関係と同じになるように、D に入る語を書こう。\nA: pen　B: pens　C: man　D: ？', X('men'), 'man の複数形は men（不規則変化）。', 48, '2', '語の関係', ['mans']),
        ('A と B の関係が C と D の関係と同じになるように、D に入る語を書こう。\nA: play　B: plays　C: have　D: ？', X('has'), '3人称単数現在形：play → plays、have → has。', 48, '2', '語の関係', ['haves']),
        ('A と B の関係が C と D の関係と同じになるように、D に入る語を書こう。\nA: one　B: first　C: eight　D: ？', X('eighth'), '序数：eight → eighth（t は1つ）。', 48, '2', '語の関係', ['eightth']),
        ('「1年は12か月あります」：A year has （　） months. の（　）に入る語を書こう。', X('twelve'), '12 = twelve。', 48, '4', '数', ['twelfth']),
        ('「メアリーは私のおばです」：Mary is my （　）. の（　）に入る語を書こう。', X('aunt'), 'mother\'s sister = aunt（おば）。uncle はおじ。', 48, '4', '家族の語', ['uncle']),
        ('「〜時に来て」：Come here （　） nine. の（　）に入る前置詞を書こう。', X('at'), '時刻の前には at を使う。', 48, '4', '前置詞', ['on']),
    ]
    MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    DAY = [('日曜日', 'Sunday'), ('月曜日', 'Monday'), ('火曜日', 'Tuesday'), ('水曜日', 'Wednesday'), ('木曜日', 'Thursday'), ('金曜日', 'Friday'), ('土曜日', 'Saturday')]
    ORD = {1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 8: 'eighth', 9: 'ninth', 12: 'twelfth', 20: 'twentieth', 21: 'twenty-first', 22: 'twenty-second', 30: 'thirtieth', 40: 'fortieth', 11: 'eleventh', 13: 'thirteenth'}
    for i, m in enumerate(MONTH, 1): rows.append((f'「{i}月」を英語で書こう（最初は大文字）。', exact([m]), f'{i}月 = {m}。月の名前は大文字で書き始める。', 50, '付録', '月'))
    for j, e in DAY: rows.append((f'「{j}」を英語で書こう（最初は大文字）。', exact([e]), f'{j} = {e}。', 50, '付録', '曜日'))
    for n, o in ORD.items(): rows.append((f'序数（〜番目の）で「{n}番目の」を英語のつづりで書こう。', exact([o, o.replace('-', ' ')]), f'{n} → {o}。', 50, '付録', '序数'))
    fact, nf = facts(u, rows, r)
    gens = [form, neg, ques, ans, what, jp, tense, ing]
    plan = []
    for i in range(nf + 20):
        plan.append(fact); plan.append(gens[i % len(gens)])
    fill(u, plan)
    guide = [{'title': '現在進行形の形', 'body': '「（今）〜している」は be動詞（am / is / are）＋動詞の -ing 形。I am playing. / He is playing. / They are playing.'},
             {'title': '-ing のつけ方', 'body': 'ふつうは ing をつける（play → playing）。e で終わる語は e をとる（make → making）。短母音＋子音字は子音字を重ねる（run → running、swim → swimming、sit → sitting）。ie は y にかえる（die → dying）。'},
             {'title': '否定文・疑問文・答え方', 'body': '否定文は be動詞のあとに not（He is not playing.）。疑問文は be動詞を主語の前へ（Is he playing?）。答えは Yes, he is. / No, he isn\'t.。What are you doing? には I am 〜ing. で答える。'},
             {'title': '現在形と進行形', 'body': 'every day・often など習慣は現在形（He plays tennis every day.）。now・then など「今している」は進行形。like・know・want・have（持っている）などの状態を表す動詞はふつう進行形にしない。'},
             {'title': '代名詞・月・曜日・序数', 'body': 'I−my−me−mine、you−your−you−yours、he−his−him−his、she−her−her−hers、it−its−it、we−our−us−ours、they−their−them−theirs。月・曜日は大文字で書き始める。序数：first, second, third, fifth, eighth, ninth, twelfth, twentieth。'}]
    note = '2026-10-08 Claude作成。英語ドリル（中学3年間）の初級p46〜47（現在進行形 STEP3 発展問題）、p48〜49（理解度診断テスト）、p50（付録：代名詞の格変化・曜日・月・序数）を写真で目視し、主語や動作を変えた類題を作った。絵やリスニングの問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
