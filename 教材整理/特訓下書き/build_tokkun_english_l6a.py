# coding: utf-8
"""英語1年 Lesson 6 前半（Which・Why・Who・Whose の疑問文と、疑問詞で始まる疑問文の整理）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p62〜65・p68〜71・p113（Which＋名詞 ～?／Why ～? — Because ～.／Who＋動詞 ～?（who が主語）／
Whose＋名詞 ～? — It's mine.・～'s／mine・yours・his・hers・ours・theirs／What time・Where・How old・How many・When と答えの前置詞、
Lesson 1〜5の文）。
使わないもの：him・her・them など目的格の代名詞の書きかえ（Lesson 6後半で扱う）、should・have to（Lesson 7）、未来の文（Lesson 8）。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l6a', 'Which・Why・Who・Whose の疑問文（特訓）', 'Lesson 6', '英語', 1,
         {62: 'source-0471', 63: 'source-0471', 64: 'source-0472', 65: 'source-0472', 68: 'source-0474', 69: 'source-0474',
          70: 'source-0475', 71: 'source-0475', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l6a.json', '確認済み/workbook-english-1-l6b.json', '確認済み/workbook-english-1-l2.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)
UL = '次の英文の［　］の部分をたずねる疑問文を書こう。'
QW = '（　）に入る疑問詞を、下から選んで順に書こう（カンマで区切る）。'
CH = '対話が成り立つように、Bの答えとして最も適切なものを選ぼう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
PS = '［　］内の語句を、1語の「～のもの」を表す語にかえて、全文を書こう。'
WR = '次の日本語を英語で書こう。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. ［　］の部分をたずねる疑問文（何をたずねるかを判断する） ──
X(62, UL + '\nI like ［winter］.（「どの季節」でたずねる）', ev('Which season do you like?'), expl='「どの～」は Which＋名詞。Which season do you like?')
X(62, UL + '\nI study English hard ［because I like English songs］.（「あなたは」でたずねる）', ev('Why do you study English hard?'), expl='理由をたずねるので Why do you ～?')
X(64, UL + '\n［Kenta］ wants a cake.', ev('Who wants a cake?'), expl='主語の人をたずねるので、Who が主語になる。Who wants ～?（wants の s はそのまま）')
X(64, UL + '\nThat is ［Akari\'s］ hat.', ev('Whose hat is that?'), expl='持ち主をたずねるので Whose hat is that?')
X(64, UL + '\n［Ken and I］ cooked lunch.', ev('Who cooked lunch?'), expl='主語の人をたずねるので Who cooked lunch?')
X(70, UL + '\nI get up ［at six］.（「あなたは」でたずねる）', ev('What time do you get up?'), expl='時刻をたずねるので What time do you get up?')
X(70, UL + '\nKen is ［in his room］.', ev('Where is Ken?', "Where's Ken?"), expl='場所をたずねるので Where is Ken?')
X(70, UL + '\nMy father is ［forty］ years old.（「あなたのお父さんは」でたずねる）', ev('How old is your father?'), expl='年齢をたずねるので How old is your father?')
X(64, UL + '\nThis bike is ［mine］.（「この自転車はだれのものですか」とたずねる）', ev('Whose bike is this?', 'Whose is this bike?'), expl='持ち主をたずねる。Whose bike is this?')
X(62, UL + '\nRika wants ［the red］ T-shirt.（「どのTシャツ」でたずねる）', ev('Which T-shirt does Rika want?'), expl='「どのTシャツ」は Which T-shirt。主語が Rika なので does Rika want。')

# ── B. 疑問詞の使い分け ──
X(62, QW + '〔Which / Why / Who〕\n(　) do you like swimming? — Because it\'s fun.\n(　) flower do you want? — I want this one.\n(　) plays the guitar? — Tom does.', seq('Why', 'Which', 'Who'), expl='理由は Why、「どの花」は Which flower、ギターをひく人は Who。')
X(64, QW + '〔Whose / Who / What〕\n(　) room is this? — It\'s my sister\'s.\n(　) is that boy? — He\'s my friend Sho.\n(　) is in the box? — A cake is.', seq('Whose', 'Who', 'What'), expl='持ち主は Whose room、人は Who、物は What。')
X(70, QW + '〔Where / When / What time〕\n(　) is your birthday? — It\'s June 21st.\n(　) do you have lunch? — At 12:30.\n(　) do you live? — I live in Chiba.', seq('When', 'What time', 'Where'), expl='日付は When、時刻は What time、場所は Where。')
X(71, QW + '〔How old / How many / Which〕\n(　) is your brother? — He\'s fifteen.\n(　) CDs do you have? — I have ten.\n(　) bag is yours? — The blue one.', seq('How old', 'How many', 'Which'), expl='年齢は How old、数は How many、「どのかばん」は Which bag。')

# ── C. 答えを選ぶ ──
X(62, CH + '\nA: Why do you like this song?\nア Yes, I do.　イ Because it\'s beautiful.　ウ I like it every day.', ['イ'], expl='Why の質問には Because ～. で理由を答える。')
X(64, CH + '\nA: Who can play the piano?\nア Yes, I can.　イ Mai can.　ウ Mai is.', ['イ'], expl='Who can ～? には「人＋can.」で答える。')
X(64, CH + '\nA: Whose umbrella is this?\nア It\'s mine.　イ It\'s me.　ウ Yes, it is.', ['ア'], expl='持ち主は mine「私のもの」で答える。me は「私を」。')
X(64, CH + '\nA: Who cooked dinner yesterday?\nア My father does.　イ My father did.　ウ My father is.', ['イ'], expl='過去の文なので did で答える。')
X(62, CH + '\nA: Which do you want, tea or coffee?\nア Tea, please.　イ Yes, I want.　ウ Because I like tea.', ['ア'], expl='「AとBのどちら」には、どちらかを答える。')
X(71, CH + '\nA: Where do you eat lunch?\nア At 12:30.　イ In the classroom.　ウ With my friends.', ['イ'], expl='Where には場所で答える。')
X(64, CH + '\nA: Who wants some juice?\nア I do.　イ I am.　ウ I want.', ['ア'], expl='Who wants ～? には「人＋do［does］.」で答える。I do.')

# ── D. 2か所の誤り ──
X(64, FIX + '\nWho do play soccer after school? — Ryo plays.', ev('Who plays soccer after school? Ryo does.'), expl='who が主語の文は Who＋動詞（3人称単数 plays）。答えは Ryo does.')
X(64, FIX + '\nWhose is pen this? — It\'s my.', ev("Whose pen is this? It's mine."), expl='Whose pen is this? の語順。「私のもの」は mine。')
X(62, FIX + '\nWhich subject you like? — Yes, I like math.', ev('Which subject do you like? I like math.'), expl='Which subject のあとに do you like。疑問詞の質問に Yes は使わない。')
X(62, FIX + '\nWhy do you get up early? — So I run in the park.', ev('Why do you get up early? Because I run in the park.'), expl='Why の答えは Because ～.')
X(71, FIX + '\nWhen is your birthday? — It\'s in May 3rd. Who make a cake for you?', ev("When is your birthday? It's May 3rd. Who makes a cake for you?", "When is your birthday? It's on May 3rd. Who makes a cake for you?"), expl='日付には in を使わない（It\'s May 3rd. または on May 3rd）。who が主語の文は Who makes（3人称単数）。')
X(64, FIX + '\nWho wants tea? — I want. Whose cup is this? — It\'s your.', ev("Who wants tea? I do. Whose cup is this? It's yours."), expl='Who wants ～? には I do.。「あなたのもの」は yours。')

# ── E. ～のもの（所有代名詞・'s） ──
X(64, PS + '\nThis guitar is ［my guitar］.', NGA('This guitar is mine.'), expl='my guitar → mine「私のもの」。')
X(64, PS + '\nThat bag is ［his bag］.', NGA('That bag is his.'), expl='his bag → his（「彼のもの」も his）。')
X(64, PS + '\nThese books are ［our books］.', NGA('These books are ours.'), expl='our books → ours。')
X(64, PS + '\nThose rackets are ［their rackets］.', NGA('Those rackets are theirs.'), expl='their rackets → theirs。')
X(64, PS + '\nThis cap is ［her cap］.', NGA('This cap is hers.'), expl='her cap → hers。')
X(64, '「～の」と「～のもの」を使い分けて、（　）に入る語を順に書こう（カンマで区切る）。\nThis is (　) desk.（あなたの）That desk is (　).（私のもの）', seq('your', 'mine'), expl='名詞の前は your「あなたの」、1語で「私のもの」は mine。')
X(64, '日本語に合うように、（　）に入る語を順に書こう（カンマで区切る）。\nこれはベッキーの自転車ですか。—いいえ。それは私の父のものです。\nIs this (　) bike? — No. It\'s my (　).', seq("Becky's", "father's"), expl='「ベッキーの」は Becky\'s、「父のもの」は father\'s。')

# ── F. 使わない語が1つある並べかえ ──
X(62, NG + '\nあなたはどの教科が好きですか。（ which / subject / do / you / like / is ）?', NGA('Which subject do you like?'), expl='Which subject do you like?。is は使わない。')
X(62, NG + '\nあなたはなぜ英語を勉強するのですか。（ why / do / you / study / English / because ）?', NGA('Why do you study English?'), expl='Why do you ～? の文。because は使わない。')
X(64, NG + '\nだれがこのケーキを作りましたか。（ who / made / this cake / did ）?', NGA('Who made this cake?'), expl='who が主語なので Who made ～?。did は使わない。')
X(64, NG + '\nこれはだれのかばんですか。（ whose / bag / is / this / who ）?', NGA('Whose bag is this?'), expl='Whose bag is this?。who は使わない。')
X(64, NG + '\nそのラケットは私のものではありません。（ the racket / is / not / mine / my ）.', NGA('The racket is not mine.'), expl='「私のもの」は mine。my は使わない。')
X(71, NG + '\nあなたは何時に寝ますか。（ what / time / do / you / go to bed / when ）?', NGA('What time do you go to bed?'), expl='時刻は What time。when は使わない。')
X(70, NG + '\nあなたのおばあさんは何歳ですか。（ how / old / is / your grandmother / many ）?', NGA('How old is your grandmother?'), expl='年齢は How old。many は使わない。')
X(64, NG + '\nだれがじょうずに英語を話しますか。（ who / speaks / English / well / does ）?', NGA('Who speaks English well?'), expl='who が主語なので Who speaks ～?。does は使わない。')

# ── G. 英作文 ──
X(62, WR + '（質問と答えを続けて書く）\nあなたはどのスポーツが好きですか。—私はテニスが好きです。', ev('Which sport do you like? I like tennis.'), expl='Which sport do you like? に I like tennis.')
X(62, WR + '（質問と答えを続けて書く）\nあなたはなぜ早く寝るのですか。—毎朝早く起きるからです。', ev('Why do you go to bed early? Because I get up early every morning.'), expl='Why ～? に Because ～. と答える。')
X(64, WR + '（質問と答えを続けて書く）\nだれがイヌを飼っていますか。—健です。', ev('Who keeps a dog? Ken does.', 'Who has a dog? Ken does.'), expl='who が主語で3人称単数扱い。Who keeps［has］a dog? に Ken does.')
X(64, WR + '（質問と答えを続けて書く）\nあれはだれの自転車ですか。—それは彼のものです。', ev("Whose bike is that? It's his.", "Whose bicycle is that? It's his."), expl='Whose bike is that? に It\'s his.')
X(62, WR + '（質問と答えを続けて書く）\nあなたはどの映画を見ますか。—私はあの映画を見ます。', ev('Which movie do you watch? I watch that movie.', 'Which movie do you watch? I watch that one.'), expl='Which movie do you watch? に I watch that movie.')
X(70, WR + '（質問と答えを続けて書く）\nあなたのお姉さんはどこにいますか。—彼女は自分の部屋にいます。', ev('Where is your sister? She is in her room.', "Where's your sister? She's in her room."), expl='Where is ～? に She is in her room.')
X(64, WR + '（質問と答えを続けて書く）\nだれが昨日、窓をそうじしましたか。—私です。', ev('Who cleaned the window yesterday? I did.', 'Who cleaned the windows yesterday? I did.'), expl='過去の文なので答えは I did.')

# ── H. オリジナルの対話を読んで答える ──
P1 = '次の対話を読んで答えよう。\nNick: Whose notebook is this?\nMai: It\'s not mine. Maybe it\'s Ken\'s.\nNick: Ken? Who is Ken?\nMai: He\'s my classmate. He sits by the window.\nNick: Which boy? The boy with a red cap?\nMai: Yes. Why do you have his notebook?\nNick: It was on my desk.\n'
P2 = '次の対話を読んで答えよう。\nLisa: Which season do you like, Taku?\nTaku: I like summer.\nLisa: Why do you like it?\nTaku: Because I can swim in the sea with my family. Who is your favorite singer, Lisa?\nLisa: Aileen. Her songs are great.\n'
u.strip = (P1, P2, UL, QW, CH, FIX, NG, PS, WR)
X(64, P1 + '問い：ノートはだれのものだとマイは考えているか。日本語で答えよう。', ['ケン', '健', 'ケンのもの', '健のもの', 'Ken'], expl='Maybe it\'s Ken\'s. から、ケンのもの。')
X(64, P1 + '問い：ケンはどこに座っているか。日本語で答えよう。', ['窓のそば', '窓のそばに', '窓ぎわ', '窓のところ'], expl='He sits by the window. から。')
X(62, P1 + '問い：ニックがケンのノートを持っている理由は何か。日本語で答えよう。', ['ニックの机の上にあったから', '机の上にあったから', 'ニックの机にあったから', '自分の机の上にあったから'], expl='It was on my desk. から。')
X(62, P2 + '問い：次の質問に英語で答えよう。\nWhich season does Taku like?', ev('He likes summer.', 'Summer.'), expl='Taku は I like summer. と言っている。')
X(62, P2 + '問い：タクが夏を好きな理由は何か。日本語で答えよう。', ['家族と海で泳げるから', '家族といっしょに海で泳げるから', '海で泳げるから', '家族と海で泳ぐことができるから'], expl='Because I can swim in the sea with my family. から。')
X(64, P2 + '問い：次の質問に英語で答えよう。\nWho is Lisa\'s favorite singer?', ev('Aileen is.', 'Aileen.', 'It is Aileen.', 'Her favorite singer is Aileen.'), expl='Lisa は Aileen. と答えている。')

# ── I. 正しい文を選ぶ・判断する ──
X(64, '「だれが毎朝走りますか。」' + SEL + '\nア Who does run every morning?　イ Who runs every morning?　ウ Who run every morning?', ['イ'], expl='who が主語のときは3人称単数として Who runs ～?')
X(64, '「これはだれの部屋ですか。」' + SEL + '\nア Whose room is this?　イ Who room is this?　ウ Whose is room this?', ['ア'], expl='Whose＋名詞＋is this?')
X(62, '「あなたはどの花がほしいですか。」' + SEL + '\nア Which flower you want?　イ Which do you want flower?　ウ Which flower do you want?', ['ウ'], expl='Which flower のあとに do you want。')
X(64, '次のうち、（　）に mine が入るものを選ぼう。\nア This is (　) pen.　イ This pen is (　).　ウ Do you know (　)?', ['イ'], expl='名詞が後ろに続かず「私のもの」を表すとき mine。アは my、ウは me。')
X(71, '次のうち、（　）に at が入るものを選ぼう。\nア I get up (　) six.　イ My birthday is (　) May.　ウ We play tennis (　) Sundays.', ['ア'], expl='時刻は at、月は in、曜日は on。')

X(64, QW + '〔Whose / Who / Which〕\n(　) cap is this? — It\'s Ryo\'s.\n(　) is Ryo? — He\'s my brother.\n(　) cap do you like, the blue one or the red one? — The red one.', seq('Whose', 'Who', 'Which'), expl='持ち主は Whose cap、人は Who、「どちらの帽子」は Which cap。')
X(64, CH + '\nA: Whose shoes are these?\nア They\'re mine.　イ It\'s mine.　ウ They\'re me.', ['ア'], expl='shoes は複数なので They\'re。「私のもの」は mine。')
X(64, '［　］内の語句を、1語の「～のもの」を表す語にかえて、全文を書こう。\nIs this notebook ［your notebook］?', NGA('Is this notebook yours?'), expl='your notebook → yours「あなたのもの」。')
X(64, UL + '\n［Mr. Oka］ has many cats.', ev('Who has many cats?'), expl='who が主語のときは3人称単数として has を使う。Who has many cats?')
X(62, WR + '（質問と答えを続けて書く）\nどちらの絵があなたのものですか。—青いほうです。', ev('Which picture is yours? The blue one.', "Which picture is yours? The blue one is.", "Which picture is yours? It's the blue one."), expl='Which picture is yours? に The blue one. と答える。')
X(70, UL + '\nYuki has ［two］ brothers.', ev('How many brothers does Yuki have?'), expl='数をたずねるので How many brothers does Yuki have?（has はもとの形 have）')
X(64, FIX + '\nWhose are these shoes? — They are my.', ev('Whose shoes are these? They are mine.', "Whose shoes are these? They're mine."), expl='Whose shoes are these? の語順。「私のもの」は mine。')
X(62, FIX + '\nWhy you like winter? — Because I can skis.', ev('Why do you like winter? Because I can ski.'), expl='Why do you ～? の形。can のあとはもとの形 ski。')
X(62, '「あなたはなぜ冬が好きなのですか。」' + SEL + '\nア Why do you like winter?　イ Why you like winter?　ウ Why are you like winter?', ['ア'], expl='Why のあとに do you like ～? の語順。')

X(64, CH + '\nA: Who is that woman?\nア She\'s Ms. Green, our English teacher.　イ It\'s Ms. Green\'s.　ウ Yes, she is.', ['ア'], expl='Who is ～? には、その人がだれかを答える。イは「グリーン先生のもの」で持ち主の答え。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp62〜65（Lesson6 Part1・2の基本文・ポイント・A・B）、p68〜69（まとめテスト）、p70〜71（文法のまとめ：疑問詞で始まる疑問文）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、たずねる部分から疑問詞を判断する・疑問詞の使い分け・答えの選択・2か所の誤り・～のもの（mine など）・使わない語のある並べかえ・英作文・オリジナルの対話の読み取り、の形にした。並べかえは与えた語を変える答えを認めない。him/her の書きかえは Lesson 6後半にまわした。')
