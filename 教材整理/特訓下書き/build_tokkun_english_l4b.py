# coding: utf-8
"""英語1年 Lesson 4 後半（Does ～?／How many ～?／some・any と他者紹介）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p44〜49・p52〜53・p112（Does ＋主語＋動詞のもとの形 ～? — Yes, ～ does./No, ～ doesn't.／
How many ＋名詞の複数形 ～?／some（肯定文）・any（否定文・疑問文）、Lesson 1〜4前半の文）。
使わないもの：him・her・his・them などの目的格・所有格（Lesson 6）、現在進行形（Lesson 5）。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l4b', 'Does ～?／How many ～? と他者紹介（特訓）', 'Lesson 4', '英語', 1,
         {43: 'source-0461', 44: 'source-0462', 45: 'source-0462', 46: 'source-0463', 47: 'source-0463', 48: 'source-0464', 49: 'source-0464',
          52: 'source-0466', 53: 'source-0466', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l4b.json', '確認済み/workbook-english-1-l4a.json', '確認済み/workbook-english-1-l3b.json'])
X = u.X
QY = '次の文を疑問文にして、Yes で答える文も続けて書こう。'
QN = '次の文を疑問文にして、No で答える文も続けて書こう。'
QA = '対話が成り立つように、Aの質問を（　）内の語句を使って英語で書こう。'
HM = '次の英文の［　］の部分をたずねる疑問文を書こう。'
FIX = '次の対話（英文）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
CH = '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nア Yes, he does.　イ No, he doesn\'t.　ウ Yes, he is.　エ No, he isn\'t.'
BL = '対話が成り立つように、（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'
WR = '次の日本語を英語で書こう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. Does の疑問文と答え（動詞の形・代名詞・複数に注意） ──
X(44, QY + '\nYour grandfather walks every morning.', ev('Does your grandfather walk every morning? Yes, he does.'), expl='Does を主語の前に置き、walks はもとの形 walk にする。答えでは your grandfather を he にかえる。')
X(44, QN + '\nMai speaks English.', ev("Does Mai speak English? No, she doesn't."), expl='Does Mai speak ～? にし、No, she doesn\'t. と答える。')
X(44, QY + '\nKen has a smartphone.', ev('Does Ken have a smartphone? Yes, he does.'), expl='has は、Does のあとではもとの形 have にする。')
X(44, QN + '\nYour sister swims well.', ev("Does your sister swim well? No, she doesn't."), expl='swims をもとの形 swim にする。答えは she doesn\'t。')
X(44, QY + '\nTom and Ken play baseball.', ev('Do Tom and Ken play baseball? Yes, they do.'), expl='Tom and Ken は複数なので Does ではなく Do。答えは they do。')
X(44, QY + '\nMs. Green goes to the library on Sundays.', ev('Does Ms. Green go to the library on Sundays? Yes, she does.'), expl='goes をもとの形 go にする。Ms. は女性なので she。')
X(44, QN + '\nYour brother studies math every day.', ev("Does your brother study math every day? No, he doesn't."), expl='studies をもとの形 study にする。')
X(44, QN + '\nThis dog eats vegetables.', ev("Does this dog eat vegetables? No, it doesn't."), expl='動物（this dog）は it で受ける。No, it doesn\'t.')

# ── B. 答えに合う質問をつくる ──
X(44, QA + '（your mother / cook）\nA: (　)\nB: Yes, she does. She cooks every day.', ev('Does your mother cook?'), expl='Yes, she does. と答えているので Does your mother ～?')
X(44, QA + '（Ken / like / soccer）\nA: (　)\nB: No, he doesn\'t. He likes baseball.', ev('Does Ken like soccer?'), expl='No, he doesn\'t. と答えているので Does Ken like ～?')
X(46, QA + '（Aya / cats）\nA: (　)\nB: She has three cats.', ev('How many cats does Aya have?'), expl='数を答えているので How many cats does Aya have?')
X(46, QA + '（pencils / you）\nA: (　)\nB: I have five pencils.', ev('How many pencils do you have?'), expl='主語が you なので do you have。')
X(44, QA + '（your sisters / play the piano）\nA: (　)\nB: Yes, they do.', ev('Do your sisters play the piano?'), expl='your sisters は複数なので Do。答えも they do。')
X(46, QA + '（Mr. Oka / dogs）\nA: (　)\nB: He has two dogs.', ev('How many dogs does Mr. Oka have?'), expl='How many dogs does Mr. Oka have? の has はもとの形 have。')

# ── C. How many でたずねる ──
X(46, HM + '\nI have ［three］ brothers.', ev('How many brothers do you have?'), expl='I の文を、you でたずねる。How many brothers do you have?')
X(47, HM + '\nKenta has ［ten］ T-shirts.', ev('How many T-shirts does Kenta have?'), expl='主語が Kenta なので does Kenta have。has はもとの形 have。')
X(47, HM + '\nMike wants ［three］ apples.', ev('How many apples does Mike want?'), expl='wants はもとの形 want にする。')
X(46, HM + '\nI need ［two］ notebooks.', ev('How many notebooks do you need?'), expl='How many notebooks do you need?')

# ── D. some と any ──
X(46, '（　）に some か any を入れ、順に書こう（カンマで区切る）。\nI have (　) pens. / I don\'t have (　) pens. / Do you have (　) pens?', seq('some', 'any', 'any'), expl='肯定文は some、否定文・疑問文は any。')
X(46, '（　）に some か any を入れ、順に書こう（カンマで区切る）。\nShe has (　) comic books. She doesn\'t have (　) magazines.', seq('some', 'any'), expl='肯定文は some、否定文は any。')
X(46, WR + '\n私は1本もペンを持っていません。', ev("I don't have any pens."), expl='not ～ any で「1つも～ない」。')
X(46, WR + '\nあなたはペットを（何匹か）飼っていますか。', ev('Do you have any pets?'), expl='疑問文なので any を使う。')
X(46, '次の英文には誤りが2か所ある。正しく直して全文を書こう。\nI don\'t have some books. I have any notebooks.', ev("I don't have any books. I have some notebooks."), expl='否定文は any、肯定文は some。')
X(46, '次のうち、（　）に any が入るものを選ぼう。\nア I have (　) apples.　イ Do you have (　) apples?　ウ She has (　) apples.', ['イ'], expl='疑問文では any。ア・ウは肯定文なので some。')

# ── E. 2か所の誤り ──
X(44, FIX + '\nDoes your father cooks? — Yes, he do.', ev('Does your father cook? Yes, he does.'), expl='Does のあとはもとの形 cook。答えも does。')
X(44, FIX + '\nDo Aoi like soccer? — No, she don\'t.', ev("Does Aoi like soccer? No, she doesn't."), expl='Aoi は3人称単数なので Does。答えも doesn\'t。')
X(46, FIX + '\nHow many book does you have?', ev('How many books do you have?'), expl='How many のあとは複数形 books。you には do。')
X(46, FIX + '\nHow many cats does she has? — She have three cats.', ev('How many cats does she have? She has three cats.'), expl='does のあとはもとの形 have。答えの文では has。')
X(44, FIX + '\nDoes your sisters play tennis? — Yes, they does.', ev('Do your sisters play tennis? Yes, they do.'), expl='your sisters は複数なので Do。答えも do。')
X(44, FIX + '\nIs your mother like music? — Yes, she is.', ev('Does your mother like music? Yes, she does.'), expl='like は一般動詞なので Does ～?。答えも does。')
X(44, FIX + '\nDoes he studies English? — No, he isn\'t.', ev("Does he study English? No, he doesn't."), expl='Does のあとはもとの形 study。答えは doesn\'t。')
X(46, FIX + '\nHow many pets you have? — I have a dog and two cat.', ev('How many pets do you have? I have a dog and two cats.'), expl='How many pets のあとに do you have。two のあとは複数形 cats。')

# ── F. 対話の流れから答え方を選ぶ ──
X(44, CH + '\nA: Does your brother play tennis?\nB: (　) He plays baseball.', ['イ'], expl='野球をすると続くので、テニスはしない。No, he doesn\'t.')
X(44, CH + '\nA: Is your brother a student?\nB: (　) He goes to Kita Junior High School.', ['ウ'], expl='Is ～? の質問で、中学校に通っていると続くので Yes, he is.')
X(44, CH + '\nA: Does Mr. Goto speak Japanese?\nB: (　) He speaks it very well.', ['ア'], expl='Does ～? の質問で、とてもじょうずに話すと続くので Yes, he does.')
X(44, CH + '\nA: Is Ken busy today?\nB: (　) He is free.', ['エ'], expl='Is ～? の質問で、ひまだと続くので No, he isn\'t.')
X(45, CH + '\nA: Does your father work on Sundays?\nB: (　) He cooks lunch for us.', ['イ'], expl='日曜日は私たちに昼食を作ると続くので、働かない。No, he doesn\'t.')

# ── G. 複数の（　） ──
X(44, BL + '\nA: (　) your sister like cats?\nB: Yes, she (　). She (　) two cats.', seq('Does', 'does', 'has'), expl='Does ～? に does で答え、「飼っている」は has。')
X(46, BL + '\nA: How (　) books (　) Mary have?\nB: She has ten books.', seq('many', 'does'), expl='How many books does Mary have?')
X(46, BL + '\nA: (　) you have any pets?\nB: No, I (　). But my brother (　) a dog.', seq('Do', "don't", 'has') + seq('Do', 'do not', 'has'), expl='Do you ～? に No, I don\'t.。my brother には has。')
X(44, BL + '\nA: (　) Tom and Ken play soccer?\nB: Yes, they (　).', seq('Do', 'do'), expl='Tom and Ken は複数なので Do ～? と do。')
X(44, BL + '\nA: Does Yumi play the piano?\nB: No, she (　). But she (　) the guitar.', seq("doesn't", 'plays') + seq('does not', 'plays'), expl='No, she doesn\'t.。肯定文では plays。')
X(46, BL + '\nA: I don\'t have (　) pencils.\nB: I have (　) pencils. You can use my pencil.', seq('any', 'some'), expl='否定文は any、肯定文は some。')

# ── H. 英作文 ──
X(44, WR + '（質問と答えを続けて書く）\nあなたのお姉さんはテニスをしますか。—いいえ、しません。', ev("Does your sister play tennis? No, she doesn't."), expl='Does your sister play ～? に No, she doesn\'t.')
X(46, WR + '（質問と答えを続けて書く）\nあなたは何冊の本を持っていますか。—30冊持っています。', ev('How many books do you have? I have thirty books.', 'How many books do you have? I have 30 books.'), expl='How many books do you have? に I have thirty books.')
X(46, WR + '（質問と答えを続けて書く）\n健は何匹のネコを飼っていますか。—2匹飼っています。', ev('How many cats does Ken have? He has two cats.'), expl='does Ken have と He has を使い分ける。')
X(46, WR + '\n私は何冊かマンガ本を持っています。', ev('I have some comic books.'), expl='肯定文なので some。')
X(47, WR + '\n彼女は帽子を1つも持っていません。', ev("She doesn't have any caps."), expl='doesn\'t have any ～ で「1つも持っていない」。')
X(44, WR + '（質問と答えを続けて書く）\nあなたの弟は毎朝走りますか。—はい、走ります。', ev('Does your brother run every morning? Yes, he does.'), expl='Does your brother run ～? に Yes, he does.')
X(44, WR + '（質問と答えを続けて書く）\nグリーン先生は日本語を話しますか。—はい。彼女は日本語をじょうずに話します。', ev('Does Ms. Green speak Japanese? Yes, she does. She speaks Japanese well.'), expl='答えのあとに She speaks Japanese well. を続ける。')
X(47, WR + '（質問と答えを続けて書く）\nあなたはリンゴが何個ほしいですか。—3個ほしいです。', ev('How many apples do you want? I want three apples.', 'How many apples do you want? I want three.'), expl='How many apples do you want? に I want three (apples).')

# ── I. 使わない語が1つある並べかえ ──
X(44, NG + '\n健は毎朝走りますか。（ Ken / does / do / run / every morning ）?', ev('Does Ken run every morning?', contract=False), expl='Ken は3人称単数なので Does。do は使わない。')
X(46, NG + '\n彼女は何本のギターを持っていますか。（ many / guitars / how / does / she / have / has ）?', ev('How many guitars does she have?', contract=False), expl='does のあとはもとの形 have。has は使わない。')
X(44, NG + '\n彼らは野球をしますか。（ they / play / do / does / baseball ）?', ev('Do they play baseball?', contract=False), expl='they は複数なので Do。does は使わない。')
X(47, NG + '\n私はTシャツを1枚も持っていません。（ I / don\'t / any / some / T-shirts / have ）.', ev("I don't have any T-shirts.", contract=False), expl='否定文なので any。some は使わない。')
X(44, NG + '\nあなたのお父さんはコーヒーを飲みますか。（ your father / does / drinks / drink / coffee ）?', ev('Does your father drink coffee?', contract=False), expl='Does のあとはもとの形 drink。drinks は使わない。')
X(47, NG + '\nアヤは何本のペンがほしいですか。（ Aya / how / many / pens / does / want / wants ）?', ev('How many pens does Aya want?', contract=False), expl='does のあとはもとの形 want。wants は使わない。')
X(46, NG + '\n私には何人か友達がいます。（ I / have / some / any / friends ）.', ev('I have some friends.', contract=False), expl='肯定文なので some。any は使わない。')
X(44, NG + '\nあなたのお兄さんは英語を勉強しますか。（ your brother / study / studies / does / English ）?', ev('Does your brother study English?', contract=False), expl='Does のあとはもとの形 study。studies は使わない。')

# ── J. オリジナルの対話・紹介文・メールを読んで答える ──
P1 = '次の対話を読んで答えよう。\nEmma: Does your brother play sports, Sota?\nSota: Yes, he does. He plays soccer.\nEmma: How many soccer balls does he have?\nSota: He has three soccer balls.\nEmma: Does he play the guitar?\nSota: No, he doesn\'t. But he likes music.\n'
P2 = '次の紹介文を読んで答えよう。\nThis is my friend, Nana. She has two cats and a rabbit. She doesn\'t have any dogs. Does she like dogs? Yes, she does. She wants a dog.\n'
P3 = '次のメールを読んで答えよう。\nHi, Lily. My uncle lives in Aomori. He works at a fruit shop. He likes apples very much. He eats some apples every day. Does your uncle like fruit?\n'
u.strip = (P1, P2, P3, QY, QN, QA, HM, FIX, CH, BL, WR, NG)  # 共通の指示文・本文は、似ている度の計算から外す
X(45, P1 + '問い：ソウタの兄がするスポーツは何か。日本語で答えよう。', ['サッカー'], expl='He plays soccer. から。')
X(46, P1 + '問い：次の質問に英語で答えよう。\nHow many soccer balls does Sota\'s brother have?', ev('He has three soccer balls.', 'He has three.', 'Three soccer balls.', 'Three.'), expl='He has three soccer balls. と答える。')
X(44, P1 + '問い：次の質問に英語で答えよう。\nDoes Sota\'s brother play the guitar?', ev("No, he doesn't."), expl='Sota は No, he doesn\'t. と答えている。')
X(46, P2 + '問い：ナナは動物を全部で何匹飼っているか。数字で答えよう。', ['3', '3匹', '三匹', '3ひき'], expl='ネコ2匹とウサギ1匹で、合わせて3匹。')
X(47, P2 + '問い：ナナがほしいと思っている動物は何か。日本語で答えよう。', ['イヌ', '犬', 'いぬ'], expl='She wants a dog. から。')
X(46, P2 + '問い：次の質問に英語で答えよう。\nHow many cats does Nana have?', ev('She has two cats.', 'She has two.', 'Two cats.', 'Two.'), expl='She has two cats and a rabbit. から、2匹。')
X(52, P3 + '問い：書いた人のおじはどこに住んでいるか。日本語で答えよう。', ['青森', '青森県'], expl='My uncle lives in Aomori. から。')
X(45, P3 + '問い：書いた人のおじが毎日することは何か。日本語で答えよう。', ['リンゴを食べる', 'リンゴを食べること', 'りんごを食べる', 'リンゴをいくつか食べる'], expl='He eats some apples every day. から。')
X(44, P3 + '問い：次の質問に英語で答えよう。\nDoes the writer\'s uncle work at a fruit shop?', ev('Yes, he does.'), expl='He works at a fruit shop. とあるので Yes, he does.')

# ── K. 似た文から正しい文を選ぶ ──
X(44, '「彼女はネコを飼っていますか。」' + SEL + '\nア Does she has a cat?　イ Does she have a cat?　ウ Is she have a cat?', ['イ'], expl='Does ＋主語＋もとの形 have ～?')
X(46, '「あなたは何匹のイヌを飼っていますか。」' + SEL + '\nア How many dog do you have?　イ How many dogs do you have?　ウ How many dogs you have?', ['イ'], expl='How many のあとは複数形。そのあとに do you have を続ける。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp43〜47（Lesson4 Part2・3の基本文・ポイント・A・B）、p48〜49（まとめテスト）、p52〜53（場面別ドリル）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、Does／Do の使い分け（複数の主語・動物は it）・答えから質問を作る・How many でたずねる・some と any・2か所の誤り・対話の流れ・複数の空所・英作文・使わない語のある並べかえ・オリジナルの文章の読み取り、の形にした。him/her・現在進行形は使っていない。')
