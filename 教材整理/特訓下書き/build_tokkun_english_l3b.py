# coding: utf-8
"""英語1年 Lesson 3 後半（過去の否定文・疑問文 didn't・Did ～?・Were ～?）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p34〜39・p112（didn't＋動詞のもとの形／was not・were not（wasn't・weren't）／Did ～? — Yes, ～ did./No, ～ didn't.／
Was［Were］～? — Yes, ～ was［were］./No, ～ wasn't［weren't］.／How was ～?、Lesson 3前半までの文）。
使わないもの：What did ～? などの疑問詞＋did（ワークにない）、3人称単数現在の -s（Lesson 4）、ワークにない不規則動詞の過去形。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l3b', "過去の否定文・疑問文（didn't・Did ～?・Were ～?）（特訓）", 'Lesson 3', '英語', 1,
         {33: 'source-0456', 34: 'source-0457', 35: 'source-0457', 36: 'source-0458', 37: 'source-0458', 38: 'source-0459', 39: 'source-0459', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l3b.json', '確認済み/workbook-english-1-l3a.json', '確認済み/workbook-english-1-l2.json'])
X = u.X
QA = '対話が成り立つように、Aの質問を（　）内の語句を使って英語で書こう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
CH = '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nア Yes, I did.　イ No, I didn\'t.　ウ Yes, I was.　エ No, I wasn\'t.'
BL = '（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'
WR = '次の日本語を英語で書こう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. 否定文への書きかえ（形の変化に注意） ──
X(34, '次の文を否定文にし、さらに「私はギターをひきました。」と続けよう。\nI played the piano yesterday.', ev("I didn't play the piano yesterday. I played the guitar."), expl='過去の否定文は didn\'t ＋動詞のもとの形（play）。')
X(34, '次の文を否定文にし、さらに「私たちはひまでした。」と続けよう。\nWe were busy this morning.', ev("We weren't busy this morning. We were free."), expl='be動詞の過去の否定は were not（weren\'t）。')
X(34, '次の文を否定文にしよう。\nKota had practice yesterday.', ev("Kota didn't have practice yesterday."), expl='主語が Kota でも didn\'t ＋もとの形 have。had のままにしない。')
X(34, '次の文を否定文にしよう。\nI saw Miu yesterday.', ev("I didn't see Miu yesterday."), expl='saw を、didn\'t のあとではもとの形 see にもどす。')
X(34, '次の文を否定文にしよう。\nThey ate lunch at home.', ev("They didn't eat lunch at home."), expl='ate を、didn\'t のあとではもとの形 eat にもどす。')

# ── B. 疑問文にして答える（2つの操作） ──
X(36, '次の文を疑問文にして、No で答える文も続けて書こう。\nYou had a game yesterday.', ev("Did you have a game yesterday? No, I didn't."), expl='Did you ＋もとの形 have ～? にし、No, I didn\'t. と答える。')
X(36, '次の文を疑問文にして、Yes で答える文も続けて書こう。\nYou were tired after the game.', ev('Were you tired after the game? Yes, I was.'), expl='be動詞の過去の疑問文は Were を前に出す。答えは主語 I にあわせて was。')
X(36, '次の文を疑問文にして、Yes で答える文も続けて書こう。\nSaki studied yesterday.', ev('Did Saki study yesterday? Yes, she did.'), expl='Did Saki ＋もとの形 study ～?。答えでは Saki を she にかえる。')
X(36, '次の文を疑問文にして、No で答える文も続けて書こう。\nThe movie was exciting.', ev("Was the movie exciting? No, it wasn't."), expl='Was を前に出す。答えでは the movie を it にかえる。')
X(36, '次の文を疑問文にして、Yes で答える文も続けて書こう。\nYou went to the park yesterday.', ev('Did you go to the park yesterday? Yes, I did.'), expl='went を、Did のあとではもとの形 go にする。')
X(36, '次の文を疑問文にして、No で答える文も続けて書こう。\nYou were at the library this morning.', ev("Were you at the library this morning? No, I wasn't."), expl='Were you ～? の答えは、主語 I にあわせて wasn\'t。')
X(33, '次の文を疑問文にして、Yes で答える文も続けて書こう。\nYou saw the fireworks last night.', ev('Did you see the fireworks last night? Yes, I did.'), expl='saw を、Did のあとではもとの形 see にする。')
X(36, '次の文を疑問文にして、No で答える文も続けて書こう。\nRyo and Ken played soccer last weekend.', ev("Did Ryo and Ken play soccer last weekend? No, they didn't."), expl='答えでは Ryo and Ken を they にかえる。')

# ── C. 答えに合う質問をつくる ──
X(36, QA + '（watch / the soccer game）\nA: (　)\nB: Yes, I did. I watched it on TV.', ev('Did you watch the soccer game?'), expl='Yes, I did. と答えているので Did you ～? の疑問文。')
X(36, QA + '（in the park）\nA: (　)\nB: No, I wasn\'t. I was at home.', ev('Were you in the park?'), expl='No, I wasn\'t. と答えているので Were you ～? の疑問文。')
X(36, QA + '（the party / fun）\nA: (　)\nB: Yes, it was. It was a lot of fun.', ev('Was the party fun?'), expl='Yes, it was. と答えているので Was ～? の疑問文。')
X(36, QA + '（Yuki / practice tennis）\nA: (　)\nB: No, she didn\'t. She studied English.', ev('Did Yuki practice tennis?'), expl='No, she didn\'t. と答えているので Did Yuki ＋もとの形 practice ～?')
X(36, QA + '（Tom and Ann / at home）\nA: (　)\nB: No, they weren\'t. They were at school.', ev('Were Tom and Ann at home?'), expl='No, they weren\'t. と答えているので Were Tom and Ann ～?')

# ── D. 2か所の誤り ──
X(34, FIX + '\nI didn\'t went to school yesterday. I am at home.', ev("I didn't go to school yesterday. I was at home."), expl='didn\'t のあとはもとの形 go。昨日の話なので was。')
X(36, FIX + '\nDid you saw the movie? — Yes, I saw.', ev('Did you see the movie? Yes, I did.'), expl='Did のあとはもとの形 see。答えも did を使う。')
X(36, FIX + '\nWas you busy last night? — No, I didn\'t.', ev("Were you busy last night? No, I wasn't."), expl='you の be動詞の過去形は were。Were you ～? には was で答える。')
X(34, FIX + '\nWe wasn\'t in Tokyo last Sunday. We was in Chiba.', ev("We weren't in Tokyo last Sunday. We were in Chiba."), expl='we の be動詞の過去形は were（weren\'t）。')
X(36, FIX + '\nDid Saki studied yesterday? — Yes, she was.', ev('Did Saki study yesterday? Yes, she did.'), expl='Did のあとはもとの形 study。Did ～? には did で答える。')
X(34, FIX + '\nI don\'t watched TV last night. I didn\'t sleepy.', ev("I didn't watch TV last night. I wasn't sleepy."), expl='過去の否定は didn\'t ＋もとの形 watch。sleepy は形容詞なので be動詞の否定 wasn\'t。')
X(36, FIX + '\nWere you play tennis yesterday? — No, I weren\'t.', ev("Did you play tennis yesterday? No, I didn't."), expl='play は一般動詞なので Did you ～?。答えも didn\'t。')
X(36, FIX + '\nDid the game exciting? — Yes, it did.', ev('Was the game exciting? Yes, it was.'), expl='exciting は形容詞なので be動詞の疑問文 Was ～?。答えも was。')

# ── E. 対話の流れから答え方を選ぶ ──
X(36, CH + '\nA: Did you go to the museum yesterday?\nB: (　) I went to the library.', ['イ'], expl='図書館へ行ったと続くので、美術館へは行かなかった。No, I didn\'t.')
X(36, CH + '\nA: Were you busy this morning?\nB: (　) I cleaned my room and helped my mother.', ['ウ'], expl='部屋のそうじと母の手伝いをしたので忙しかった。Yes, I was.')
X(36, CH + '\nA: Did you have breakfast this morning?\nB: (　) I had toast.', ['ア'], expl='トーストを食べたと続くので Yes, I did.')
X(36, CH + '\nA: Were you at home last night?\nB: (　) I was at the library.', ['エ'], expl='図書館にいたと続くので、家にはいなかった。No, I wasn\'t.')
X(36, CH + '\nA: Did you see Miu yesterday?\nB: (　) We talked in the park.', ['ア'], expl='公園で話したと続くので、会った。Yes, I did.')

# ── F. 複数の（　） ──
X(36, BL + '\nA: (　) you at the zoo yesterday?\nB: Yes, I (　).', seq('Were', 'was'), expl='be動詞の過去の疑問文 Were you ～? に Yes, I was. と答える。')
X(36, BL + '\nA: (　) you visit Kyoto last month?\nB: No, I (　). I visited Nara.', seq('Did', "didn't") + seq('Did', 'did not'), expl='一般動詞の過去の疑問文 Did you ～? に No, I didn\'t. と答える。')
X(39, BL + '\nA: (　) the concert good?\nB: Yes, it (　).', seq('Was', 'was'), expl='the concert には was。答えでは it にかえて Yes, it was.')
X(34, BL + '（「眠かったけれど、寝なかった」という意味にする）\nI (　) sleepy, but I (　) go to bed.', seq('was', "didn't") + seq('was', 'did not'), expl='「眠かった」は was sleepy、「寝なかった」は didn\'t go to bed。')
X(34, BL + '（「昨日は練習がなかったので、ひまだった」という意味にする）\nWe (　) have practice yesterday, so we (　) free.', seq("didn't", 'were') + seq('did not', 'were'), expl='「練習がなかった」は didn\'t have practice、「ひまだった」は were free。')
X(36, BL + '\nA: (　) Tom and Amy swim in the sea?\nB: No, they (　).', seq('Did', "didn't") + seq('Did', 'did not'), expl='Did ＋主語＋もとの形 swim ～?。答えは they didn\'t。')

# ── G. 英作文 ──
X(34, WR + '\n私は昨日、数学を勉強しませんでした。', ev("I didn't study math yesterday."), expl='didn\'t ＋もとの形 study。')
X(36, WR + '（質問と答えを続けて書く）\nあなたは昨夜、忙しかったですか。—いいえ、忙しくありませんでした。', ev("Were you busy last night? No, I wasn't."), expl='Were you busy ～? に No, I wasn\'t. と答える。')
X(36, WR + '（質問と答えを続けて書く）\nあなたはこの前の週末、サッカーをしましたか。—はい、しました。', ev('Did you play soccer last weekend? Yes, I did.'), expl='Did you play ～? に Yes, I did. と答える。')
X(34, WR + '\n私たちはこの前の日曜日、東京にいませんでした。', ev("We weren't in Tokyo last Sunday."), expl='we の be動詞の過去の否定は weren\'t（were not）。')
X(36, WR + '（質問と答えを続けて書く）\nその映画はわくわくしましたか。—はい、しました。', ev('Was the movie exciting? Yes, it was.'), expl='exciting は形容詞なので Was ～?。答えは it was。')
X(34, WR + '\n私は今朝、朝食を食べませんでした。', ev("I didn't have breakfast this morning.", "I didn't eat breakfast this morning."), expl='didn\'t ＋もとの形 have（eat）。')
X(36, WR + '（質問と答えを続けて書く）\n彼は昨日テレビを見ましたか。—いいえ、見ませんでした。', ev("Did he watch TV yesterday? No, he didn't."), expl='Did he watch ～? に No, he didn\'t. と答える。')
X(34, WR + '\n私は昨日、練習がありませんでした。だから、家にいました。', ev("I didn't have practice yesterday. So I was home.", "I didn't have practice yesterday. So I was at home.", "I didn't have practice yesterday, so I was home.", "I didn't have practice yesterday, so I was at home."), expl='didn\'t have practice と was home（at home）を so「だから」でつなぐ。')

# ── H. 使わない語が1つある並べかえ ──
X(34, NG + '\n私は昨日、ピアノをひきませんでした。（ didn\'t / I / play / played / the piano / yesterday ）.', ev("I didn't play the piano yesterday.", contract=False), expl='didn\'t のあとはもとの形 play。played は使わない。')
X(34, NG + '\n裕二は日本にいませんでした。（ not / in / Yuji / Japan / was / did ）.', ev('Yuji was not in Japan.', contract=False), expl='「いなかった」は be動詞の否定 was not。did は使わない。')
X(36, NG + '\nあなたはこの前の日曜日、図書館へ行きましたか。（ go / did / to / the library / you / went / last Sunday ）?', ev('Did you go to the library last Sunday?', contract=False), expl='Did のあとはもとの形 go。went は使わない。')
X(36, NG + '\nあなたは今朝、眠かったですか。（ you / sleepy / were / did / this morning ）?', ev('Were you sleepy this morning?', contract=False), expl='sleepy は形容詞なので Were you ～?。did は使わない。')
X(34, NG + '\n私たちは昨夜、テレビを見ませんでした。（ we / watch / didn\'t / TV / weren\'t / last night ）.', ev("We didn't watch TV last night.", contract=False), expl='一般動詞 watch の否定なので didn\'t。weren\'t は使わない。')
X(36, NG + '\nその試合はわくわくしましたか。（ was / the game / exciting / did ）?', ev('Was the game exciting?', contract=False), expl='exciting は形容詞なので Was ～?。did は使わない。')
X(34, NG + '\n私は先週、祖母を訪ねませんでした。（ visit / visited / I / didn\'t / my grandmother / last week ）.', ev("I didn't visit my grandmother last week.", contract=False), expl='didn\'t のあとはもとの形 visit。visited は使わない。')
X(36, NG + '\n健は昨日、学校にいましたか。（ Ken / at school / was / yesterday / did ）?', ev('Was Ken at school yesterday?', contract=False), expl='「いましたか」は be動詞の疑問文 Was ～?。did は使わない。')

# ── I. オリジナルの対話・日記・メールを読んで答える ──
P1 = '次の対話を読んで答えよう。\nMaria: How was your weekend, Taiki?\nTaiki: It was great. I went to the sea with my family.\nMaria: Did you swim?\nTaiki: No, I didn\'t. But I saw many fish.\nMaria: Were you tired?\nTaiki: Yes, I was. I went to bed at eight.\n'
P2 = '次の日記を読んで答えよう。\nSaturday\nI didn\'t have practice today. I wasn\'t busy. In the morning, I cleaned my room. In the afternoon, I helped my mother. I didn\'t watch TV.\n'
P3 = '次のメールを読んで答えよう。\nHi, Kenta. I visited my uncle in Canada last month. We didn\'t go to the museum, but we went to a big park. Were you busy last week? I wasn\'t busy.\n'
u.strip = (P1, P2, P3, QA, FIX, CH, BL, WR, NG)  # 共通の指示文・本文は、似ている度の計算から外す
X(37, P1 + '問い：タイキは週末、家族とどこへ行ったか。日本語で答えよう。', ['海', '海へ行った', '海に行った'], expl='I went to the sea with my family. から、海。')
X(37, P1 + '問い：次の質問に英語で答えよう。\nDid Taiki swim in the sea?', ev("No, he didn't."), expl='Taiki は No, I didn\'t. と言っている。Taiki を he にかえて答える。')
X(37, P1 + '問い：タイキは何時に寝たか。', ['8時', '八時', '8時に寝た', '午後8時'], expl='I went to bed at eight. から、8時。')
X(35, P2 + '問い：書いた人は土曜日の午前中に何をしたか。日本語で答えよう。', ['部屋のそうじ', '部屋をそうじした', '自分の部屋をそうじした', '部屋の掃除', '部屋を掃除した'], expl='In the morning, I cleaned my room. から。')
X(35, P2 + '問い：日記の内容に合うものを選ぼう。\nア 土曜日は練習があった。　イ 午後に母親の手伝いをした。　ウ テレビを見た。', ['イ'], expl='In the afternoon, I helped my mother. から、イ。練習はなく、テレビも見なかった。')
X(35, P2 + '問い：書いた人は土曜日、忙しかったか。「はい」か「いいえ」で答えよう。', ['いいえ'], expl='I wasn\'t busy. とあるので、忙しくなかった。')
X(39, P3 + '問い：書いた人はカナダでだれを訪ねたか。日本語で答えよう。', ['おじ', 'おじさん', '叔父', '伯父'], expl='I visited my uncle in Canada から、おじ。')
X(39, P3 + '問い：書いた人たちが行かなかった場所はどこか。日本語で答えよう。', ['博物館', '美術館', '博物館（美術館）'], expl='We didn\'t go to the museum から、博物館（美術館）。大きな公園へは行った。')
X(39, P3 + '問い：書いた人になったつもりで、次の質問に英語で答えよう。\nWere you busy last week?', ev("No, I wasn't."), expl='I wasn\'t busy. とあるので No, I wasn\'t.')

# ── J. 似た文から正しい文を選ぶ ──
X(34, '「私は昨日、学校へ行きませんでした。」' + SEL + '\nア I didn\'t went to school yesterday.　イ I didn\'t go to school yesterday.　ウ I don\'t went to school yesterday.', ['イ'], expl='didn\'t ＋もとの形 go。')
X(36, '「あなたは昨日ひまでしたか。」' + SEL + '\nア Did you free yesterday?　イ Were you free yesterday?　ウ Was you free yesterday?', ['イ'], expl='free は形容詞なので be動詞の疑問文。you には Were。')
X(36, '「彼女は数学を勉強しましたか。」' + SEL + '\nア Did she study math?　イ Did she studied math?　ウ Was she study math?', ['ア'], expl='Did ＋主語＋もとの形 study ～?')
X(34, '「私たちは疲れていませんでした。」' + SEL + '\nア We didn\'t tired.　イ We weren\'t tired.　ウ We wasn\'t tired.', ['イ'], expl='tired は形容詞なので be動詞の否定。we には weren\'t。')
X(36, '「その映画はわくわくしましたか。—はい。」' + SEL + '\nア Was the movie exciting? — Yes, it was.　イ Did the movie exciting? — Yes, it did.　ウ Was the movie exciting? — Yes, I was.', ['ア'], expl='Was ～? には it was で答える（the movie を it にかえる）。')

# ── K. Did／Was／Were と didn't／wasn't／weren't の使い分け ──
X(37, '（　）に Did・Was・Were から正しい語を選び、順に書こう（カンマで区切る）。\n(　) you tired yesterday?\n(　) you go to bed at ten?\n(　) Ken at home last night?', seq('Were', 'Did', 'Was'), expl='you ＋形容詞は Were、一般動詞 go は Did、Ken（1人）＋at home は Was。')
X(37, '（　）に Did・Was・Were から正しい語を選び、順に書こう（カンマで区切る）。\n(　) the festival fun?\n(　) they enjoy it?\n(　) you and Amy there?', seq('Was', 'Did', 'Were'), expl='the festival は Was、一般動詞 enjoy は Did、you and Amy（2人）は Were。')
X(35, '（　）に didn\'t・wasn\'t・weren\'t から正しい語を選び、順に書こう（カンマで区切る）。\nI (　) busy yesterday.\nWe (　) at school last Sunday.\nI (　) study last night.', seq("wasn't", "weren't", "didn't"), expl='I ＋形容詞は wasn\'t、we は weren\'t、一般動詞 study は didn\'t。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp34〜37（Lesson3 Part2・3の基本文・ポイント・A・B）、p38〜39（まとめテスト）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、不規則動詞をもとの形にもどす否定文・疑問文と答えを続けて書く・答えから質問を作る・2か所の誤り・対話の流れ・意味に合う複数の空所・英作文・使わない語のある並べかえ・オリジナルの文章の読み取り（3人称で答える）・Did／Was／Were の使い分け、の形にした。疑問詞＋did と3人称単数現在の -s は使っていない。')
