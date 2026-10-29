"""英語ドリル 中級 7 SVCとSVOO／前置詞・8 動名詞（ドリル p88〜99）"""
import random
from gcommon import GUnit, exact, fill, facts, choice
from ecommon import E, cap, ING, PAST

def unit():
    u = GUnit('drill-english-2-sentence-gerund', '英語', '文型・前置詞と動名詞', '中級 文法', grade=2)
    r = random.Random(2501)
    TO = ['give', 'show', 'teach', 'tell', 'send', 'lend', 'write']; FOR = ['buy', 'make', 'cook', 'find']
    OBJ = {'give': 'a present', 'show': 'some pictures', 'teach': 'English', 'tell': 'the story', 'send': 'a letter', 'lend': 'my bike', 'write': 'a card', 'buy': 'a jacket', 'make': 'a chair', 'cook': 'dinner', 'find': 'a nice book'}
    PEOPLE = [('him', 'Tom'), ('her', 'Emi'), ('me', 'me'), ('them', 'them'), ('us', 'us')]
    def svoo():
        v = r.choice(TO + FOR); pr, nm = r.choice(PEOPLE); s = r.choice(['My father', 'Ms. Green', 'I', 'Ken']); t = PAST[v]
        if s == 'I' and pr in ('me', 'us'): return
        prep = 'to' if v in TO else 'for'
        if r.random() < .5:
            u.add(f'次の英文を、前置詞を使ってほぼ同じ意味の文に書きかえよう。\n{s} {t} {pr} {OBJ[v]}.', E(f'{s} {t} {OBJ[v]} {prep} {pr}.'), f'SVOO → SVO＋{prep}＋人。{v} は {prep} を使う動詞。', 88, 'SVOO', 'SVOO の書きかえ', near=[f'{s} {t} {OBJ[v]} {"for" if prep == "to" else "to"} {pr}.'])
        else:
            u.add(f'（　）に to か for のどちらかを書こう。\n{s} {t} {OBJ[v]} （　） {pr}.', exact([prep]), f'{v} は「人に届ける・伝える」動詞なので to。' if prep == 'to' else f'{v} は「人のために〜する」動詞なので for。', 90, '2', 'to と for', near=['for' if prep == 'to' else 'to'])
    SVC = [('He looks', 'happy', '彼は幸せそうに見える'), ('She became', 'a teacher', '彼女は先生になった'), ('I feel', 'tired', '私は疲れを感じる'), ('That idea sounds', 'good', 'その考えはよさそうに聞こえる'),
           ('This cake smells', 'good', 'このケーキはよいにおいがする'), ('This soup tastes', 'sweet', 'このスープはあまい味がする'), ('My brother got', 'sick', '弟は病気になった'), ('That cloud looks', 'like a cat', 'あの雲はネコのように見える'),
           ('It got', 'dark', '暗くなった'), ('Ken became', 'a doctor', 'ケンは医者になった'), ('You look', 'tired', 'あなたは疲れているように見える'), ('The song sounds', 'beautiful', 'その歌は美しく聞こえる')]
    svi = iter(r.sample(SVC, len(SVC)))
    def svc():
        sv, c, ja = next(svi); s, v = sv.rsplit(' ', 1)
        u.add(f'「{ja}」という意味になるように、（　）に入る1語を書こう。\n{s} （　） {c}.', exact([v]), f'SVC の文。{v} のあとの補語（{c}）は主語の様子・状態を表す（主語＝補語）。', 88, 'SVC', 'SVC', near=['is', 'was'])
    PREP = [('I get up （　） six.', 'at', '時刻は at。'), ('We play tennis （　） Sunday.', 'on', '曜日・日付は on。'), ('My birthday is （　） July.', 'in', '月・年・季節は in。'),
            ('Let\'s meet （　） June 20.', 'on', '日付は on。'), ('I lived in Canada （　） three years.', 'for', '期間「〜の間」は for。'), ('I went to Hokkaido （　） the vacation.', 'during', '特定の期間「〜の間に」は during。'),
            ('Please wait here （　） eleven.', 'till', '「〜まで（ずっと）」は till / until。'), ('Finish this work （　） eleven.', 'by', '「〜までに（期限）」は by。'), ('Wash your hands （　） lunch.', 'before', '「〜の前に」は before。'),
            ('Let\'s play soccer （　） school.', 'after', '「〜のあとで」は after。'), ('There is a cat （　） the desk.', 'under', '「〜の下に」は under。'), ('Turn left （　） the corner.', 'at', '地点は at。'),
            ('My father goes to work （　） bike.', 'by', '交通手段は by（by bus, by train）。'), ('I cut the cake （　） a knife.', 'with', '道具「〜で」は with。'), ('This song is popular （　） children.', 'among', '「（3人以上）の間で」は among。'),
            ('Tom played tennis （　） his sister.', 'with', '「〜といっしょに」は with。'), ('I read a book （　） history.', 'about', '「〜について」は about。'), ('He said it （　） English.', 'in', '言語「〜語で」は in。'),
            ('She walked （　） the river.', 'along', '「〜に沿って」は along。'), ('I will come back （　） three minutes.', 'in', '「（今から）〜後に」は in。'), ('He sat （　） Ken and me.', 'between', '「（2つ）の間に」は between。'),
            ('The train goes from Osaka （　） Kyoto.', 'to', 'from A to B「AからBまで」。'), ('He ran （　） the room.', 'into', '「〜の中へ」は into。'), ('She stood （　） front of the door.', 'in', 'in front of「〜の前に」。')]
    pi = iter(r.sample(PREP, len(PREP)))
    def prep():
        q, a, e = next(pi)
        u.add(f'（　）に最も適する前置詞を書こう。\n{q}', exact([a, 'until'] if a == 'till' else [a]), e, r.choice([89, 90, 92]), '前置詞', '前置詞')
    GER = ['enjoy', 'finish', 'stop', 'mind']; TOV = ['want', 'hope', 'decide', 'expect']; BOTH = ['like', 'love', 'begin', 'start']
    def gerinf():
        k = r.random(); s = r.choice(['I', 'We', 'They'])
        if k < .45:
            v = r.choice(GER); w = r.choice(['swim', 'read', 'play', 'watch', 'clean', 'write', 'cook', 'run'])
            o = {'swim': 'in the sea', 'read': 'the book', 'play': 'the guitar', 'watch': 'the movie', 'clean': 'the room', 'write': 'the letter', 'cook': 'dinner', 'run': 'in the park'}[w]
            vv = PAST[v] if v != 'mind' else "don't mind"
            u.add(f'（　）内の語を適切な形にかえよう（1語）。\n{s} {vv} （{w}） {o}.', exact([ING[w]]), f'{v} は動名詞（-ing）だけを目的語にとる動詞。', 95, 'Check', '動名詞を目的語にとる動詞', near=['to ' + w])
        elif k < .85:
            v = r.choice(TOV); w = r.choice(['become', 'visit', 'see', 'buy', 'go', 'study'])
            o = {'become': 'a doctor', 'visit': 'Hokkaido', 'see': 'you again', 'buy': 'a new bike', 'go': 'abroad', 'study': 'science'}[w]
            if w in ('become', 'buy'): s = 'I'
            u.add(f'（　）内の語を適切な形にかえよう（2語）。\n{s} {PAST[v]} （{w}） {o}.', E(f'to {w}'), f'{v} は不定詞（to＋原形）だけを目的語にとる動詞。', 95, 'Check', '不定詞を目的語にとる動詞', near=[ING.get(w, w + 'ing')])
        else:
            v = r.choice(['begin', 'start']); w = r.choice(['rain', 'snow']); vp = 'began' if v == 'begin' else 'started'
            ja = '雨' if w == 'rain' else '雪'
            u.add(f'「{ja}が降り始めた」：It {vp} （{w}） then. の（　）内の語を適切な形にかえよう（どちらの形でもよい。1つ書こう）。', E(f'to {w}', w + 'ing'), f'{v} は不定詞も動名詞も目的語にとれる（to {w} / {w}ing）。', 94, '使い分け', '両方とれる動詞')
    def afterprep():
        pre, w, o, ja = r.choice([('before', 'go', 'to bed', '寝る前に'), ('after', 'watch', 'TV', 'テレビを見たあとで'), ('without', 'say', 'goodbye', 'さようならを言わずに'), ('for', 'help', 'me', '手伝ってくれて'),
                                  ('at', 'paint', 'pictures', '絵をかくのが'), ('of', 'listen', 'to music', '音楽を聞くことが'), ('in', 'read', 'books', '本を読むことに'), ('about', 'play', 'tennis', 'テニスをするのは')])
        ctx = {'before': 'I read a book', 'after': 'I took a bath', 'without': 'He went out', 'for': 'Thank you', 'at': 'Kumi is good', 'of': "I'm fond", 'in': 'I am interested', 'about': 'How'}[pre]
        tail = '?' if pre == 'about' else '.'
        u.add(f'「{ja}」の意味になるように、（　）内の語を適切な形にかえよう。\n{ctx} {pre} （{w}） {o}{tail}', exact([ING[w] if w in ING else w + 'ing']), '前置詞のあとの動詞は動名詞（-ing）にする。', 95, '前置詞＋動名詞', '前置詞のあとの動名詞', near=['to ' + w])
    def gerund_form():
        w = r.choice(list(ING))
        u.add(f'次の動詞を動名詞（「〜すること」）にしよう。\n{w}', exact([ING[w]]), f'動名詞の作り方は進行形の -ing と同じ：{w} → {ING[w]}', 94, 'Check', '動名詞の形')
    def subj_ger():
        w, o, ja, adj = r.choice([('swim', 'in the sea', '海で泳ぐこと', 'fun'), ('speak', 'English', '英語を話すこと', 'difficult for me'), ('walk', 'in the morning', '朝に歩くこと', 'good for your health'),
                                  ('run', '', '走ること', 'good for your health'), ('read', 'books', '本を読むこと', 'interesting'), ('play', 'video games', 'テレビゲームをすること', 'a lot of fun')])
        g = cap(ING[w]) + (' ' + o if o else '')
        u.add(f'「{ja}は〜だ」という文になるように、動名詞を主語にした英文を完成させよう。\n（　） is {adj}.（{w} を使う。（　）に入る部分を書こう）', E(g), '動名詞は主語にもなる。動名詞の主語は3人称単数あつかいで is を使う。', 94, '主語', '主語になる動名詞')
    def stopq():
        if r.random() < .5:
            u.add('次の英文を日本語の意味に合うように選ぼう。「私たちはマイクと話すために立ち止まった」\nア We stopped talking with Mike.　イ We stopped to talk with Mike.', choice('イ'), 'stop to do「〜するために立ち止まる」（不定詞の副詞的用法）、stop doing「〜するのをやめる」。', 97, '5(2)', 'stop doing と stop to do', ['ア'])
            return
        v, ja, ok = r.choice([('remember', '（過去に）彼に会ったことを覚えている', 'meeting'), ('remember', '（これから）忘れずに手紙を出す', 'to mail'), ('forget', '（過去に）その話を母にしたことを忘れた', 'telling'), ('forget', '（これから）忘れずに窓を閉める→「閉めるのを忘れないで」', 'to close')])
        o = {'meeting': 'him', 'to mail': 'the letter', 'telling': 'the story to my mother', 'to close': 'the window'}[ok]
        verb = ok.split()[-1].replace('meeting', 'meet').replace('telling', 'tell')
        u.add(f'「{ja}」の意味になるように、（　）内の語を1語または2語の適切な形にかえよう。\n{v} （{verb}） {o}', E(ok), f'{v} doing「（過去に）〜したことを{"覚えている" if v == "remember" else "忘れる"}」、{v} to do「（これから）〜することを{"覚えている" if v == "remember" else "忘れる"}」。', 95, '注意すべき表現', 'remember / forget')
    X = lambda *a: exact(list(a))
    rows = [
        ('「あなたに会うのを楽しみにしています」：I\'m looking forward to （　）（see） you. の（　）に入る語を書こう。', X('seeing'), 'look forward to＋動名詞。この to は前置詞なので後ろは -ing。', 95, 'ズバリ暗記', 'look forward to', ['see']),
        ('「〜をおそれる」：be （　） of doing。（　）に入る1語を書こう。', X('afraid'), 'be afraid of doing「〜することをおそれる」。', 95, 'ズバリ暗記', '前置詞＋動名詞'),
        ('「手伝ってくれてありがとう」：Thank you for （　） me. の（　）に入る語を書こう（help を使う）。', X('helping'), 'Thank you for -ing。', 95, 'ズバリ暗記', '前置詞＋動名詞', ['help']),
        ('「明日公園に行くのはどうですか」：How （　） going to the park tomorrow? の（　）に入る語を書こう。', X('about'), 'How about -ing?「〜するのはどうですか」。', 95, 'ズバリ暗記', 'How about', ['for']),
        ('SVC の文で、補語になれるのは名詞と何か。', X('形容詞'), '補語は名詞か形容詞。He looks happy.（形容詞）／She became a teacher.（名詞）', 88, 'SVC', 'SVC', ['副詞']),
        ('look の後ろに名詞を続けて「〜のように見える」と言うとき、look のあとに入れる前置詞は何か。', X('like'), 'look like＋名詞「〜のように見える」。look＋形容詞「〜に見える」。', 88, 'SVC', 'SVC'),
        ('She was very tired yesterday. の was を looked にかえると、どんな意味になるか。「〜に見えた」を使って日本語で書こう。', {'kind': 'rubric', 'criteria': [{'weight': 1, 'any': ['疲れ']}, {'weight': 1, 'any': ['見えた', '見えました']}]}, '「彼女はきのうとても疲れているように見えた」。look は「〜に見える」。', 90, '3(1)', 'SVC'),
        ('「彼女は病気になりました」：She （　） sick. の（　）に入る語を1つ書こう（got か became）。', X('got', 'became'), 'get / become＋形容詞「〜になる」。', 90, '1(5)', 'SVC'),
        ('「〜の前で」を3語の英語で書こう。', E('in front of'), 'in front of 〜。', 89, '前置詞', '前置詞'),
        ('「〜のそばに」を表す前置詞を1語で書こう（by か near のどちらか）。', X('by', 'near'), 'by「〜のそばに」、near「〜の近くに」。', 89, '前置詞', '前置詞'),
    ]
    fact, nf = facts(u, rows, r)
    gens = [svoo, gerinf, prep, afterprep, svc, gerund_form, subj_ger, stopq, svoo, gerinf, prep]
    plan = []
    for i in range(nf + 50):
        plan.append(fact); plan.append(gens[i % len(gens)]); plan.append(gens[(i + 5) % len(gens)])
    fill(u, plan)
    guide = [{'title': 'SVC', 'body': '主語＋動詞＋補語（主語＝補語）。補語は名詞か形容詞。be・become・get（〜になる）、look（〜に見える）、feel、sound、smell、taste。look like＋名詞「〜のように見える」。'},
             {'title': 'SVOO と書きかえ', 'body': '動詞＋人＋物「人に物を〜する」。物を先に出すと 物＋to＋人（give, show, teach, tell, send, lend, write）、物＋for＋人（buy, make, cook, find）。'},
             {'title': '前置詞', 'body': '時：at（時刻）・on（曜日・日付）・in（月・年・季節）、for（期間）・during（特定の期間）、by（期限）・till / until（継続）。場所：at（地点）・on（接触）・in（広い所の中）。手段：by bus、with a knife、in English。'},
             {'title': '動名詞', 'body': '動詞の -ing 形で「〜すること」。主語・補語・目的語・前置詞の目的語になる。enjoy・finish・stop・mind は動名詞だけ、want・hope・decide・expect は不定詞だけを目的語にとる。like・begin・start はどちらも可。'},
             {'title': '前置詞＋動名詞と注意する表現', 'body': 'Thank you for -ing、be good at -ing、be fond of -ing、How about -ing?、look forward to -ing。stop -ing（やめる）と stop to do（〜するために止まる）、remember -ing（したことを覚えている）と remember to do（忘れずに〜する）。'}]
    note = '2026-10-08 Claude作成。英語ドリル中級p88〜99（7 SVCとSVOO／前置詞・8 動名詞、STEP1〜3）を写真で目視し、主語や語句を変えた類題を作った。絵・グラフ・リスニングの問題は使っていない。手書きの答えは使っていない。'
    return u, guide, note
