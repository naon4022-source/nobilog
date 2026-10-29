# coding: utf-8
"""英語1年 Lesson 2（What・Who・When の疑問文と Can you ～?／Is this ～?）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p18〜29・p112（What is ～?／What＋名詞 do you like［play］?／What do you do［want］?／Who is ～?／
When is ～?・月の名前／Can you ～? と答え方／Is this［that］～? — Yes, it is./No, it isn't.、Lesson 1の文）。
使わないもの：過去形（Lesson 3）、3人称単数の -s（Lesson 4）、Which・Why・Whose（Lesson 6）。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l2', 'What・Who・When の疑問文と Can you ～?（特訓）', 'Lesson 2', '英語', 1,
         {14: 'source-0447', 18: 'source-0449', 19: 'source-0449', 20: 'source-0450', 21: 'source-0450', 22: 'source-0451', 23: 'source-0451',
          24: 'source-0452', 25: 'source-0452', 26: 'source-0453', 27: 'source-0453', 28: 'source-0454', 29: 'source-0454', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l2.json', '確認済み/workbook-english-1-l1b.json', '確認済み/workbook-english-1-review.json'])
X = u.X
UL = '次の英文の［　］の部分をたずねる疑問文を書こう。'
CH = '対話が成り立つように、Bの答えとして正しいものを選ぼう。'
FIX = '次の対話には誤りが2か所ある。正しく直して、質問と答えを続けて書こう（— は書かなくてよい）。'
BL = '対話が成り立つように、（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'
WR = '次の日本語を英語で書こう（質問と答えを続けて書く）。'
NG = '日本語に合うように、（　）内の語を並べかえて全文を書こう。ただし、使わない語が1つある。'
WH = '（　）に What・Who・When から正しい語を選び、順に書こう（カンマで区切る）。'
SEL = 'の英文として正しいものを選ぼう。'
def W(*a): return ev(*a) + ev(*[x.replace('What is', "What's").replace('Who is', "Who's").replace('When is', "When's") for x in a])

# ── A. ［　］の部分をたずねる疑問文 ──
X(18, UL + '\nMy favorite subject is ［science］.', W('What is your favorite subject?'), expl='「何」をたずねるので What is your favorite subject?')
X(20, UL + '\nI like ［tigers］.', ev('What animal do you like?'), expl='「どんな動物」をたずねるので What animal do you like?（What ＋名詞＋ do you like?）')
X(24, UL + '\nI ［play the piano］ in my free time.', ev('What do you do in your free time?'), expl='「何をするか」をたずねるので What do you do in your free time?（2つ目の do は「する」）')
X(24, UL + '\nI want ［new shoes］.', ev('What do you want?'), expl='「何がほしいか」をたずねるので What do you want?')
X(25, UL + '\nMy favorite singer is ［Aileen］.', W('Who is your favorite singer?'), expl='人をたずねるので Who is your favorite singer?')
X(26, UL + '\nMy birthday is ［May 5th］.', W('When is your birthday?'), expl='「いつ」をたずねるので When is your birthday?')
X(18, UL + '\n（「これは何ですか」とたずねる）It\'s ［a computer］.', W('What is this?'), expl='「これは何ですか」は What is this?。答えでは this を it にかえて It\'s ～. と言う。')
X(21, UL + '\nI play ［basketball］.', ev('What sport do you play?'), expl='「何のスポーツ」をたずねるので What sport do you play?')
X(19, '対話が成り立つように、Aの質問を（　）内の語を使って英語で書こう。（cook / curry）\nA: (　)\nB: Yes, I can. I can cook curry well.', ev('Can you cook curry?', 'Can you cook curry well?'), expl='Yes, I can. と答えているので Can you ～? の疑問文。')
X(22, '対話が成り立つように、Aの質問を（　）内の語を使って英語で書こう。（that / shrine）\nA: (　)\nB: No, it isn\'t. It\'s a temple.', ev('Is that a shrine?'), expl='No, it isn\'t. と答えているので Is that ～? の疑問文。')

# ── B. 疑問文に合う答えを選ぶ ──
X(26, CH + '\nA: When is the festival?\nア It\'s in the park.　イ It\'s July 7th.　ウ Yes, it is.', ['イ'], expl='When「いつ」の質問には、日付で答える。')
X(25, CH + '\nA: Who is your favorite player?\nア I like Ohtani Shohei.　イ It\'s baseball.　ウ Yes, I am.', ['ア'], expl='Who「だれ」の質問には、人の名前で答える。')
X(24, CH + '\nA: What do you want?\nア Yes, I do.　イ I want a pencil.　ウ I\'m a pencil.', ['イ'], expl='What の質問には Yes／No を使わず、ほしいものを具体的に答える。')
X(19, CH + '\nA: Can you swim fast?\nア Yes, I do.　イ No, I can\'t.　ウ No, I\'m not.', ['イ'], expl='Can you ～? には can を使って答える。')
X(22, CH + '\nA: Is that your school?\nア Yes, it is.　イ Yes, I am.　ウ Yes, it does.', ['ア'], expl='Is that ～? には that を it にかえて Yes, it is. と答える。')
X(18, CH + '\nA: What\'s your favorite food?\nア It\'s sushi.　イ I\'m sushi.　ウ Yes, it is.', ['ア'], expl='「大好きな食べ物は何か」には It\'s ～. で具体的に答える。')
X(21, CH + '\nA: What sport do you like?\nア I like music.　イ I like tennis.　ウ I can tennis.', ['イ'], expl='「何のスポーツ」の質問にはスポーツの名前で答える。ウは動詞がない。')
X(29, CH + '\nA: Who is that boy?\nア He\'s my friend Ken.　イ It\'s my friend.　ウ Yes, he is.', ['ア'], expl='男の子についての Who の質問には He\'s ～. で答える（Yes／No は使わない）。')

# ── C. 2か所の誤り ──
X(21, FIX + '\nWhat do you like sport? — Yes, I like soccer.', ev('What sport do you like? I like soccer.'), expl='What sport を文の最初に置く。What の質問には Yes を使わない。')
X(26, FIX + '\nWhen are you birthday? — It\'s June 5th.', W('When is your birthday? It\'s June 5th.'), expl='your birthday（1つのもの）には is。「あなたの」は your。')
X(19, FIX + '\nCan you plays the guitar? — Yes, I do.', ev('Can you play the guitar? Yes, I can.'), expl='can のあとはもとの形 play。Can you ～? には Yes, I can. と答える。')
X(22, FIX + '\nIs this you bag? — Yes, this is.', ev('Is this your bag? Yes, it is.'), expl='「あなたの」は your。答えでは this を it にかえる。')
X(25, FIX + '\nWho your favorite musician? — Yes, I love Aileen.', W('Who is your favorite musician? I love Aileen.'), expl='Who のあとに is が必要。Who の質問には Yes を使わない。')
X(24, FIX + '\nWhat are you do in your free time? — I\'m play chess.', ev('What do you do in your free time? I play chess.'), expl='一般動詞 do の疑問文なので What do you do ～?。答えの play に am（I\'m）は不要。')
X(20, FIX + '\nWhat food you like? — Yes, I like dumplings.', ev('What food do you like? I like dumplings.'), expl='What food のあとに do you like? が必要。What の質問には Yes を使わない。')
X(22, FIX + '\nIs that a hospital? — No, it is. It a school.', ev("Is that a hospital? No, it isn't. It's a school.", "Is that a hospital? No, it's not. It's a school."), expl='No のあとは否定 it isn\'t。「それは学校です」は It\'s a school.（is が必要）。')

# ── D. 対話の（　）を複数うめる ──
X(26, BL + '\nA: (　) is your birthday?\nB: (　) June 16th.', seq('When', "It's") + seq('When', 'It is'), expl='「いつ」は When。答えは It\'s ～. で日付を言う。')
X(20, BL + '\nA: (　)(　) do you like?\nB: I like dumplings.', seq('What', 'food'), expl='「どんな食べ物」は What food。')
X(19, BL + '\nA: (　) you cook?\nB: Yes, I (　). I can make curry.', seq('Can', 'can'), expl='「料理ができますか」は Can you cook?。答えも can を使う。')
X(22, BL + '\nA: Is this your umbrella?\nB: No, (　)(　). My umbrella is red.', seq('it', "isn't") + seq("it's", 'not'), expl='No, it isn\'t.（No, it\'s not.）と答える。this は it にかえる。')
X(25, BL + '\nA: (　) is your favorite singer?\nB: I (　) Aileen.', seq('Who', 'love') + seq('Who', 'like'), expl='人をたずねる Who。答えは I love［like］～.')
X(24, BL + '\nA: What do you (　) in your free time?\nB: I (　) video games.', seq('do', 'play'), expl='「何をしますか」は What do you do ～?。「テレビゲームをする」は play video games。')
X(18, BL + '\nA: (　)(　) that?\nB: It\'s a temple.', seq('What', 'is'), expl='「あれは何ですか」は What is that?')
X(20, BL + '\nA: (　) Ryo play baseball?\nB: No, he (　). But he can play tennis.', seq('Can', "can't") + seq('Can', 'cannot'), expl='「リョウは野球ができますか」は Can Ryo play baseball?。答えは No, he can\'t.')

# ── E. 質問と答えの英作文 ──
X(18, WR + '\nあなたの大好きな教科は何ですか。—理科です。', W("What is your favorite subject? It's science."), expl='What is your favorite subject? に It\'s science. と答える。')
X(19, WR + '\nあなたはギターをひくことができますか。—いいえ、ひけません。', ev("Can you play the guitar? No, I can't.", 'Can you play the guitar? No, I cannot.'), expl='Can you ～? に No, I can\'t. と答える。')
X(22, WR + '\nこれはあなたのかさですか。—はい、そうです。', ev('Is this your umbrella? Yes, it is.'), expl='Is this ～? に Yes, it is. と答える。')
X(21, WR + '\nあなたは何のスポーツをしますか。—私はバレーボールをします。', ev('What sport do you play? I play volleyball.'), expl='What sport do you play? に I play volleyball. と答える。')
X(26, WR + '（「12月3日」は December 3rd と書く）\nあなたの誕生日はいつですか。—12月3日です。', W("When is your birthday? It's December 3rd."), expl='When is your birthday? に It\'s December 3rd. と答える。')
X(25, WR + '（「アイリーン」は Aileen と書く）\nあなたの大好きな歌手はだれですか。—私はアイリーンが大好きです。', W('Who is your favorite singer? I love Aileen.', 'Who is your favorite singer? I like Aileen.'), expl='Who is your favorite singer? に I love［like］Aileen. と答える。')
X(24, WR + '\nあなたは自由な時間に何をしますか。—私は本を読みます。', ev('What do you do in your free time? I read books.'), expl='What do you do in your free time? に I read books. と答える。')
X(22, WR + '\nあれはあなたの学校ですか。—いいえ、ちがいます。あれは病院です。', ev("Is that your school? No, it isn't. It's a hospital.", "Is that your school? No, it's not. It's a hospital."), expl='Is that ～? に No, it isn\'t. と答え、It\'s a hospital. を続ける。')

# ── F. 使わない語が1つある並べかえ ──
X(21, NG + '\nあなたは何の動物が好きですか。（ animal / do / you / like / what / are ）?', ev('What animal do you like?'), expl='一般動詞 like の疑問文なので are は使わない。')
X(18, NG + '\nあなたの大好きな食べ物は何ですか。（ your / food / is / what / favorite / do ）?', ev('What is your favorite food?'), expl='「～は何ですか」は What is ～?。do は使わない。')
X(19, NG + '\nあなたは速く走ることができますか。（ run / can / you / fast / do ）?', ev('Can you run fast?'), expl='「できますか」は Can you ～?。do は使わない。')
X(22, NG + '\nこれはあなたの机ですか。（ your / this / desk / is / are ）?', ev('Is this your desk?'), expl='this には is。are は使わない。')
X(25, NG + '\nあなたの大好きな芸術家はだれですか。（ is / who / favorite / your / artist / what ）?', ev('Who is your favorite artist?'), expl='「だれ」は Who。what は使わない。')
X(24, NG + '\nあなたは何がほしいですか。（ want / what / do / you / are ）?', ev('What do you want?'), expl='want は一般動詞なので do を使う。are は使わない。')
X(26, NG + '\nお祭りはいつですか。（ is / the / when / festival / does ）?', ev('When is the festival?'), expl='「～はいつですか」は When is ～?。does は使わない。')
X(24, NG + '\nあなたは毎週日曜日に何をしますか。（ do / do / what / you / on / Sundays / are ）?', ev('What do you do on Sundays?'), expl='What do you do ～? で do を2回使う。are は使わない。')

# ── G. オリジナルの対話・文章を読んで答える ──
P1 = '次の対話を読んで答えよう。\nMike: What\'s your favorite sport, Saki?\nSaki: It\'s badminton. I\'m on the badminton team.\nMike: Can you play tennis, too?\nSaki: No, I can\'t. But I can swim fast. What sport do you like?\nMike: I like baseball. My favorite player is Ohtani Shohei.\n'
P2 = '次の対話を読んで答えよう。\nKen: When is your birthday, Emma?\nEmma: It\'s October 10th. When is your birthday?\nKen: It\'s October 12th.\nEmma: Oh! What do you want for your birthday?\nKen: I want a new guitar. I can play the guitar.\n'
P3 = '次の自己紹介を読んで答えよう。\nHi! I\'m Rin. My birthday is August 2nd. In my free time, I read comic books. I can draw pictures well, too. Who is your favorite artist?\n'
u.strip = (P1, P2, P3, UL, CH, FIX, BL, WR, NG, WH)  # 共通の指示文・本文は、似ている度の計算から外す
X(18, P1 + '問い：サキの大好きなスポーツは何か。日本語で答えよう。', ['バドミントン'], expl='Saki は It\'s badminton. と答えている。')
X(25, P1 + '問い：マイクの大好きな選手はだれか。', ['大谷翔平', 'おおたにしょうへい', 'Ohtani Shohei', '大谷', '大谷選手', '大谷翔平選手'], expl='My favorite player is Ohtani Shohei. から。')
X(19, P1 + '問い：サキになったつもりで、次の質問に英語で答えよう。\nCan you play tennis?', ev("No, I can't.", 'No, I cannot.'), expl='サキは No, I can\'t. と言っている（速く泳ぐことはできる）。')
X(26, P2 + '問い：エマの誕生日はいつか。日本語で答えよう。', ['10月10日', '十月十日'], expl='Emma は It\'s October 10th. と答えている。')
X(24, P2 + '問い：ケンが誕生日にほしいものは何か。日本語で答えよう。', ['新しいギター', 'ギター'], expl='Ken は I want a new guitar. と言っている。')
X(19, P2 + '問い：ケンになったつもりで、次の質問に英語で答えよう。\nCan you play the guitar?', ev('Yes, I can.'), expl='Ken は I can play the guitar. と言っている。')
X(14, P3 + '問い：リンがじょうずにできることは何か。日本語で答えよう。', ['絵をかくこと', '絵をかく', '絵を描くこと', '絵を描く', '絵'], expl='I can draw pictures well から、絵をかくこと。')
X(24, P3 + '問い：リンが自由な時間にすることは何か。日本語で答えよう。', ['マンガ本を読むこと', 'マンガを読むこと', 'マンガ本を読む', 'マンガを読む', '漫画を読むこと', '漫画を読む'], expl='In my free time, I read comic books. から。')
X(24, P3 + '問い：リンになったつもりで、次の質問に英語で答えよう。\nWhat do you do in your free time?', ev('I read comic books.', 'I read comic books in my free time.'), expl='What do you do ～? には I read comic books. と具体的に答える。')

# ── H. 疑問詞の使い分け ──
X(26, WH + '\n(　) is your birthday? — It\'s March 3rd.\n(　) is your favorite singer? — I like Aileen.\n(　) do you want? — I want a new bag.', seq('When', 'Who', 'What'), expl='日付は When、人は Who、ものは What でたずねる。')
X(25, WH + '\n(　) is this? — It\'s a koto.\n(　) is the festival? — It\'s July 7th.\n(　) is your favorite comedian? — I love Mr. Kato.', seq('What', 'When', 'Who'), expl='もの（琴）は What、日付は When、人は Who。')
X(26, WH + '\n(　) sport do you play? — I play rugby.\n(　) is kodomo no hi? — It\'s May 5th.\n(　) is your favorite artist? — I like Katsushika Hokusai.', seq('What', 'When', 'Who'), expl='スポーツは What sport、日付は When、人は Who。')

# ── I. be動詞・do・can の使い分け ──
X(27, '日本語に合うように、（　）に Are・Do・Is から正しい語を選び、順に書こう（カンマで区切る）。\n(　) you a soccer fan?（あなたはサッカーファンですか）\n(　) you play soccer?（あなたはサッカーをしますか）\n(　) this your ball?（これはあなたのボールですか）', seq('Are', 'Do', 'Is'), expl='you ＋名詞は Are、一般動詞は Do、this には Is。')
X(27, '日本語に合うように、（　）に Is・Can・Do から正しい語を選び、順に書こう（カンマで区切る）。\n(　) that a temple?（あれはお寺ですか）\n(　) you swim fast?（あなたは速く泳げますか）\n(　) you like temples?（あなたはお寺が好きですか）', seq('Is', 'Can', 'Do'), expl='that には Is、「できますか」は Can、一般動詞 like は Do。')

# ── K. 似た文から正しい文を選ぶ ──
X(20, '「あなたは何の食べ物が好きですか。」' + SEL + '\nア What do you like food?　イ What food do you like?　ウ What food you like?', ['イ'], expl='What food を文の最初に置き、do you like? を続ける。')
X(22, '「あれはあなたの学校ですか。」' + SEL + '\nア Is that your school?　イ That is your school?　ウ Are that your school?', ['ア'], expl='is を that の前に出す。that には are を使わない。')
X(26, '「あなたの誕生日はいつですか。」' + SEL + '\nア When your birthday is?　イ When is your birthday?　ウ What is your birthday?', ['イ'], expl='When のあとは is your birthday の順。「いつ」なので What ではない。')
X(19, '「あなたはピアノをひけますか。」' + SEL + '\nア Do you can play the piano?　イ Can you play the piano?　ウ Can you plays the piano?', ['イ'], expl='Can を主語の前に出し、動詞はもとの形。do と can はいっしょに使わない。')
X(25, '「あなたの大好きなミュージシャンはだれですか。」' + SEL + '\nア Who is your favorite musician?　イ Who your favorite musician is?　ウ What is your favorite musician?', ['ア'], expl='Who is ～? の語順。人なので What ではなく Who。')
X(23, '「これは何ですか。—それは琴です。」' + SEL + '\nア What is this? — This is a koto.　イ What is this? — It\'s a koto.　ウ What this is? — It\'s a koto.', ['イ'], expl='What is this? の答えでは this を it にかえて It\'s ～. と答える。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp18〜25（Lesson2 Part1〜3の基本文・ポイント・A・B）、p26〜27（When・文法のまとめ）、p28〜29（まとめテスト）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、下線部をたずねる疑問文・答えの選択・2か所の誤り・複数の空所・質問と答えの英作文・使わない語のある並べかえ・オリジナルの対話文の読み取り・疑問詞や be／do／can の使い分け・正しい文の選択、の形にした。過去形・3人称単数・Which などは使っていない。')
