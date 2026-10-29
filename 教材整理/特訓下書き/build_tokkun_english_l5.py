# coding: utf-8
"""英語1年 Lesson 5（現在進行形 am［are, is］＋～ing）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p54〜61・p113（現在進行形の肯定文・否定文・疑問文と答え方／What is ～ doing?／-ing のつけ方／
ふだんの習慣（現在形）と今していること（進行形）の区別、by the ～・take ～ out of ～、Lesson 1〜4の文）。
使わないもの：Which・Why・Whose・Where（Lesson 6以降）、him・her・them（Lesson 6）。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l5', '現在進行形（am［are, is］＋～ing）（特訓）', 'Lesson 5', '英語', 1,
         {54: 'source-0467', 55: 'source-0467', 56: 'source-0468', 57: 'source-0468', 58: 'source-0469', 59: 'source-0469',
          60: 'source-0470', 61: 'source-0470', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l5.json', '確認済み/drill-english-1-progressive.json', '確認済み/workbook-english-1-l4a.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)   # 並べかえ：与えた語を変える答えは認めない
TW = '（　）内の動詞を、文に合う形にして順に書こう（カンマで区切る）。'
ING = '次の3つの動詞を -ing の形にして、順に書こう（カンマで区切る）。'
PR = '次の文を、文末に now を加えて「今～しているところです」という文に書きかえよう。'
QY = '次の文を疑問文にして、Yes で答える文も続けて書こう。'
QN = '次の文を疑問文にして、No で答える文も続けて書こう。'
WH = '次の英文の［　］の部分をたずねる疑問文を書こう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. ふだんのこと（現在形）と今していること（進行形）の使い分け ──
X(54, TW + '（eat）\nShe (　) lunch at twelve every day. She (　) lunch now.', seq('eats', 'is eating'), expl='every day はふだんの習慣なので eats。now は今していることなので is eating。')
X(56, TW + '（cook）\nDo you (　) breakfast every day? Are you (　) breakfast now?', seq('cook', 'cooking'), expl='Do you のあとは動詞のもとの形 cook。Are you のあとは -ing の形 cooking。')
X(56, TW + '（practice）\nDan (　) soccer on Sundays. Is Dan (　) soccer now?', seq('practices', 'practicing'), expl='on Sundays は習慣なので3人称単数の practices。進行形は e をとって practicing。')
X(54, TW + '（run）\nKen (　) every morning. He (　) in the park now.', seq('runs', 'is running'), expl='習慣は runs。進行形は n を重ねて running。')
X(54, TW + '（play）\nMy brothers (　) baseball after school. They (　) baseball now.', seq('play', 'are playing'), expl='主語が複数なので play、進行形は are playing。')
X(54, TW + '（write）\nI (　) a letter now. I (　) letters to my grandmother every month.', seq('am writing', 'write'), expl='now があるので am writing（e をとる）。every month は習慣なので write。')
X(54, '次の文の（　）に入るものとして正しいものを選ぼう。\nKen (　) in Tokyo.（健は東京に住んでいます）\nア lives　イ is living　ウ living', ['ア'], expl='「住んでいる」は今の状態なので、進行形ではなく現在形 lives を使う。')
X(54, '次の文の（　）に入るものとして正しいものを選ぼう。\nI (　) this song very much.（私はこの歌が大好きです）\nア am liking　イ like　ウ liking', ['イ'], expl='like は「好きである」という状態を表すので、ふつう進行形にしない。')

# ── B. -ing のつけ方 ──
X(54, ING + '\nplay / make / run', seq('playing', 'making', 'running'), expl='play はそのまま ing。make は e をとって making。run は n を重ねて running。')
X(54, ING + '\nswim / write / study', seq('swimming', 'writing', 'studying'), expl='swim は m を重ねる。write は e をとる。study はそのまま ing（y を i にかえない）。')
X(56, ING + '\nhave / sit / drink', seq('having', 'sitting', 'drinking'), expl='have は e をとる。sit は t を重ねる。drink はそのまま ing。')
X(58, ING + '\ntake / stand / dance', seq('taking', 'standing', 'dancing'), expl='take・dance は e をとる。stand はそのまま ing。')

# ── C. 書きかえ（形の変化に注意） ──
X(54, PR + '\nShe makes a cake.', ev('She is making a cake now.'), expl='is ＋ making（e をとる）。s はとる。')
X(54, PR + '\nThey swim in the sea.', ev('They are swimming in the sea now.'), expl='they には are。swim は m を重ねて swimming。')
X(54, PR + '\nI don\'t watch TV.', ev("I'm not watching TV now.", 'I am not watching TV now.'), expl='進行形の否定は be動詞のあとに not。don\'t は使わない。')
X(54, PR + '\nMy father doesn\'t drink coffee.', ev("My father isn't drinking coffee now.", "My father's not drinking coffee now."), expl='3人称単数なので is not（isn\'t）＋ drinking。doesn\'t は使わない。')
X(56, QY + '\nAya is singing.', ev('Is Aya singing? Yes, she is.'), expl='is を主語の前に出す。答えは she is。')
X(56, QN + '\nThe students are watching a movie.', ev("Are the students watching a movie? No, they aren't.", "Are the students watching a movie? No, they're not."), expl='are を主語の前に出す。答えは they aren\'t。')
X(56, QN + '\nYou are reading a comic book.', ev("Are you reading a comic book? No, I'm not."), expl='Are you ～? には I で答える。No, I\'m not.')
X(56, QY + '\nTaku is going to the park.', ev('Is Taku going to the park? Yes, he is.'), expl='Is Taku going ～? に Yes, he is.')

# ── D. 何をしているかをたずねる ──
X(56, WH + '\nShe is ［singing "My Ballad"］.', ev('What is she doing?', "What's she doing?"), expl='「何をしているか」は What is she doing?')
X(56, WH + '\nTom is eating ［an apple］.', ev('What is Tom eating?', "What's Tom eating?"), expl='食べている「もの」をたずねるので What is Tom eating?')
X(56, WH + '\nThe boys are ［playing baseball］.', ev('What are the boys doing?'), expl='主語が複数なので What are the boys doing?')
X(57, WH + '\nI\'m studying ［science］.（「あなたは」でたずねる）', ev('What are you studying?'), expl='勉強している教科をたずねる。What are you studying?')
X(57, WH + '\nKent is reading ［a math book］.', ev('What is Kent reading?', "What's Kent reading?"), expl='読んでいるものをたずねる。What is Kent reading?')
X(56, WH + '\nMy mother is ［cooking curry］.（「あなたのお母さんは」でたずねる）', ev('What is your mother doing?', "What's your mother doing?"), expl='「何をしているか」なので doing を使う。')

# ── E. 2か所の誤り ──
X(54, FIX + '\nI am play the guitar now. My brother is sing.', ev('I am playing the guitar now. My brother is singing.', "I'm playing the guitar now. My brother is singing."), expl='進行形は be動詞＋ -ing。play→playing、sing→singing。')
X(54, FIX + '\nWe are swiming now. Kumi are running.', ev('We are swimming now. Kumi is running.'), expl='swim は m を重ねて swimming。Kumi（1人）には is。')
X(56, FIX + '\nDo you eating tempura? — Yes, I do.', ev('Are you eating tempura? Yes, I am.'), expl='進行形の疑問文は Are you ～ing?。答えも am。')
X(56, FIX + '\nWhat is Sho does? — He is cleanning his room.', ev('What is Sho doing? He is cleaning his room.', "What's Sho doing? He's cleaning his room."), expl='What is Sho doing? の形。clean はそのまま ing。')
X(54, FIX + '\nI don\'t listening to music now. I\'m study English.', ev("I'm not listening to music now. I'm studying English.", "I am not listening to music now. I am studying English."), expl='進行形の否定は be動詞＋ not。2文目も studying。')
X(56, FIX + '\nIs Yuka and Mami watching TV? — No, they isn\'t.', ev("Are Yuka and Mami watching TV? No, they aren't.", "Are Yuka and Mami watching TV? No, they're not."), expl='主語が2人なので Are。答えも aren\'t。')
X(54, FIX + '\nThe cats is drinking milk. Chami is eat tuna.', ev('The cats are drinking milk. Chami is eating tuna.'), expl='The cats（複数）には are。eat も eating にする。')
X(58, FIX + '\nA boy are standing by the desk. He is takeing a CD out of the case.', ev('A boy is standing by the desk. He is taking a CD out of the case.'), expl='A boy（1人）には is。take は e をとって taking。')

# ── F. 対話の流れ・答え方 ──
X(56, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: Is Liz playing the guitar?\nB: (　) She is playing the piano.\nア Yes, she is.　イ No, she isn\'t.　ウ No, she doesn\'t.', ['イ'], expl='ピアノをひいていると続くので No, she isn\'t.。進行形の質問には be動詞で答える。')
X(56, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: Are you busy now?\nB: Yes. (　)\nア I\'m doing my homework.　イ I do my homework.　ウ I\'m not doing anything.', ['ア'], expl='「今忙しい」に続くのは、今していること I\'m doing my homework.')
X(56, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: What are you doing?\nB: (　)\nア Yes, I am.　イ I\'m drawing a picture.　ウ I draw pictures.', ['イ'], expl='What are you doing? には、今していることを進行形で答える。Yes／No は使わない。')
X(56, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: Do you play the piano?\nB: (　) I play it every day.\nア Yes, I am.　イ Yes, I do.　ウ Yes, I\'m playing.', ['イ'], expl='Do you ～? の習慣の質問には Yes, I do.')
X(57, '対話が成り立つように、（　）に入る語を順に書こう（カンマで区切る）。\nA: (　) is Jim doing?\nB: He (　) watching TV.', seq('What', 'is'), expl='What is Jim doing? に He is watching TV. と答える。')
X(56, '対話が成り立つように、（　）に入る語を順に書こう（カンマで区切る）。\nA: (　) Kota having milk?\nB: No, he (　). He is having juice.', seq('Is', "isn't") + seq('Is', 'is not'), expl='Is Kota having ～? に No, he isn\'t.')
X(57, '対話が成り立つように、（　）に入る語を順に書こう（カンマで区切る）。\nA: Are Becky and Kent sleeping?\nB: No, they (　). Becky is (　) and Kent is (　) a math book.（Becky はテレビを見ていて、Kent は数学の本を読んでいる）', seq("aren't", 'watching TV', 'reading') + seq('are not', 'watching TV', 'reading'), expl='No, they aren\'t.。watching TV と reading を使う。')

# ── G. 使わない語が1つある並べかえ（ワークの並べかえとは別の文） ──
X(55, NG + '\nマイクはフルーツジュースを飲んでいます。（ Mike / is / drinking / fruit juice / drinks ）.', NGA('Mike is drinking fruit juice.'), expl='進行形なので drinking。drinks は使わない。')
X(55, NG + '\nジムとリズはテレビを見ていません。（ Jim and Liz / are / not / watching / TV / don\'t ）.', NGA('Jim and Liz are not watching TV.'), expl='進行形の否定は are not。don\'t は使わない。')
X(57, NG + '\nあなたは何を作っているのですか。（ what / are / you / making / do ）?', NGA('What are you making?'), expl='進行形の疑問文なので are。do は使わない。')
X(57, NG + '\nあなたのお母さんは料理をしていますか。（ your mother / cooking / is / does ）?', NGA('Is your mother cooking?'), expl='進行形の疑問文なので Is。does は使わない。')
X(55, NG + '\n女の子たちは公園で歌っています。（ the girls / are / singing / in the park / sings ）.', NGA('The girls are singing in the park.'), expl='進行形なので singing。sings は使わない。')
X(57, NG + '\nあなたのお姉さんは今、コンピュータを使っていますか。（ your sister / is / using / the computer / now / does ）?', NGA('Is your sister using the computer now?'), expl='Is ～ using ～?。does は使わない。')
X(55, NG + '\nあの男の子たちは野球をしていません。（ those boys / are / not / playing / baseball / is ）.', NGA('Those boys are not playing baseball.'), expl='those boys は複数なので are。is は使わない。')
X(58, NG + '\n健は今、かばんからペンを取り出しています。（ Ken / is / taking / a pen / out of / his bag / takes ）.', NGA('Ken is taking a pen out of his bag.'), expl='take ～ out of ...「…から～を取り出す」の進行形。takes は使わない。')

# ── H. 英作文 ──
X(54, WR + '\n私の姉は今、ケーキを作っています。', ev('My sister is making a cake now.'), expl='is making（e をとる）。')
X(54, WR + '\n美紀と久美は今、踊っていません。', ev("Miki and Kumi aren't dancing now.", 'Miki and Kumi are not dancing now.'), expl='主語が2人なので are not dancing。')
X(56, WR + '（質問と答えを続けて書く）\nあなたは今、何をしているのですか。—私は手紙を書いています。', ev("What are you doing now? I'm writing a letter.", 'What are you doing? I am writing a letter.', "What are you doing? I'm writing a letter.", 'What are you doing now? I am writing a letter.'), expl='What are you doing? に I\'m writing ～. と答える。')
X(56, WR + '（質問と答えを続けて書く）\nアヤは今、歌っていますか。—いいえ、歌っていません。彼女はピアノをひいています。', ev("Is Aya singing now? No, she isn't. She is playing the piano.", "Is Aya singing? No, she isn't. She is playing the piano.", "Is Aya singing now? No, she's not. She's playing the piano."), expl='Is Aya singing? に No, she isn\'t. と答え、進行形の文を続ける。')
X(58, WR + '\nクロはベッドの上で寝ています。ペロは部屋の中を走っています。', ev('Kuro is sleeping on the bed. Pero is running in the room.'), expl='「～の上で」は on、「～の中を」は in。どちらも is ～ing。')
X(58, WR + '\n一人の少年がドアのそばに立っています。', ev('A boy is standing by the door.'), expl='「～のそばに」は by ～。is standing。')
X(54, WR + '\n私はふだん自転車で学校へ行きますが、今日は歩いています。', ev("I usually go to school by bike, but I'm walking today.", 'I usually go to school by bike, but I am walking today.', "I usually go to school by bike. But I'm walking today.", 'I usually go to school by bike. But I am walking today.'), expl='ふだんのことは現在形 go、今日していることは進行形 am walking。')

# ── I. オリジナルの文章を読んで答える ──
P1 = '次のメールを読んで答えよう。\nHi, Kana. I\'m at the park with my family now. My father is taking pictures of birds. My mother is reading a book under a tree. My brother and I are playing badminton. It\'s sunny and warm. What are you doing now?\n'
P2 = '次の文章を読んで答えよう。\nIt\'s Sunday morning. My grandmother is cooking breakfast. My grandfather is not watching TV. He is cleaning the car. My dog, Hana, is sleeping by the door. I\'m drinking orange juice.\n'
u.strip = (P1, P2, TW, ING, PR, QY, QN, WH, FIX, NG, WR)
X(55, P1 + '問い：書いた人の父は今、何をしているか。日本語で答えよう。', ['鳥の写真をとっている', '鳥の写真を撮っている', '鳥の写真をとる', '鳥の写真を撮る', '鳥の写真'], expl='My father is taking pictures of birds. から。')
X(55, P1 + '問い：書いた人の母は、どこで本を読んでいるか。日本語で答えよう。', ['木の下', '木の下で'], expl='under a tree「木の下で」。')
X(57, P1 + '問い：次の質問に英語で答えよう。\nWhat are the writer and the brother doing?', ev('They are playing badminton.', "They're playing badminton."), expl='My brother and I are playing badminton. から、They are playing badminton.')
X(55, P2 + '問い：おじいさんは今、何をしているか。日本語で答えよう。', ['車をあらっている', '車を洗っている', '車のそうじ', '車を掃除している', '車をそうじしている'], expl='He is cleaning the car. から。テレビは見ていない。')
X(57, P2 + '問い：次の質問に英語で答えよう。\nIs Hana eating?', ev("No, she isn't.", "No, it isn't.", "No, she's not.", "No, it's not."), expl='Hana is sleeping by the door. なので食べていない。')
X(55, P2 + '問い：文章の内容に合うものを選ぼう。\nア おばあさんはテレビを見ている。　イ 書いた人はオレンジジュースを飲んでいる。　ウ ハナはドアのそばで走っている。', ['イ'], expl='I\'m drinking orange juice. から、イ。')

X(54, PR + '\nMike and I study in the library.', ev('Mike and I are studying in the library now.'), expl='Mike and I は複数なので are。study はそのまま ing。')
X(54, '次のうち、正しくない文を選ぼう。\nア We are having lunch now.　イ I am having two dogs.　ウ She has a dog.', ['イ'], expl='「食べる」の have は進行形にできるが、「飼っている（持っている）」の have は状態なので進行形にしない。I have two dogs. が正しい。')
X(55, '〈今のようす〉ユイ：イヌといっしょに走っている／タク：水を飲んでいる\nこのようすを、ユイとタクについて1文ずつ英語で書こう。', ev('Yui is running with a dog. Taku is drinking water.', 'Yui is running with her dog. Taku is drinking water.'), expl='それぞれ is ＋ -ing。「～といっしょに走る」は run with ～。')
X(57, P2 + '問い：次の質問に英語で答えよう。\nWhat is the grandmother doing?', ev('She is cooking breakfast.', "She's cooking breakfast."), expl='My grandmother is cooking breakfast. から。')

# ── J. 正しい文を選ぶ ──
X(54, '「彼らは今、英語を話しています。」' + SEL + '\nア They are speak English now.　イ They are speaking English now.　ウ They speaking English now.', ['イ'], expl='be動詞 are ＋ speaking。')
X(56, '「あなたは何を飲んでいるのですか。」' + SEL + '\nア What do you drinking?　イ What are you drink?　ウ What are you drinking?', ['ウ'], expl='What ＋ are you ＋ -ing ～?')
X(54, '「エリーは今、ピアノをひいていません。」' + SEL + '\nア Elly isn\'t playing the piano now.　イ Elly doesn\'t playing the piano now.　ウ Elly not playing the piano now.', ['ア'], expl='進行形の否定は isn\'t ＋ -ing。')
X(54, '次のうち、（　）に running が入るものを選ぼう。\nア I (　) every day.　イ I am (　) now.　ウ Do you (　) fast?', ['イ'], expl='be動詞のあとの -ing の形。ア・ウはもとの形 run。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp54〜57（Lesson5 Part1・2の基本文・ポイント・A・B）、p58〜59（Part3・読解）、p60〜61（まとめテスト）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、習慣と進行中の動作の使い分け（like・live は進行形にしない）・-ing のつけ方の規則・形の変化に注意する書きかえ・何をしているかの疑問文・2か所の誤り・対話の流れ・使わない語のある並べかえ・英作文・オリジナルの文章の読み取り、の形にした。並べかえは与えた語を変える答えを認めない。Which・Why・him/her は使っていない。')
