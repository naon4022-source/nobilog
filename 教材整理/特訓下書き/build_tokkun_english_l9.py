# coding: utf-8
"""英語1年 Lesson 9（look・sound と There is［are］～.／Is［Are］there ～?、体調不良の表現）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p98〜109・p113（主語＋look［sound］＋形容詞／There is［are］～＋場所・There is not／Is［Are］there ～? —
Yes, there is［are］./No, there isn't［aren't］.／How many ～ are there ～?／any・some／I have a headache［fever, stomachache］.・
What's wrong?・You should ～.／SDGs の発表の表現、Lesson 1〜8の文）。
使わないもの：look like ～（ワークは注のみ）、比較、現在完了。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l9', 'look・sound と There is［are］～.（特訓）', 'Lesson 9', '英語', 1,
         {98: 'source-0489', 99: 'source-0489', 100: 'source-0490', 101: 'source-0490', 102: 'source-0491', 103: 'source-0491',
          104: 'source-0492', 105: 'source-0492', 106: 'source-0493', 107: 'source-0493', 108: 'source-0494', 109: 'source-0494', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l9.json', '確認済み/workbook-english-1-l4b.json', '確認済み/workbook-english-1-words.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)
TR = '次の文を、［　］の指示にしたがって書きかえよう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
BL = '（　）に入る語を順に書こう（カンマで区切る）。'
ROOM = '（ケンの部屋のようす：机の上にコンピュータが1台、本だなに本が20冊、ベッドの下にネコが2匹いる。ギターとテレビはない。）'

# ── A. be動詞・look・sound の使い分け ──
X(98, TR + '\nMy grandfather is busy.［「～そうに見える」という文に］', ev('My grandfather looks busy.'), expl='主語が3人称単数なので looks。is は使わない。')
X(98, TR + '\nThe new song is exciting.［「～そうに聞こえる」という文に］', ev('The new song sounds exciting.'), expl='sounds ＋形容詞。')
X(98, TR + '\nThese shoes are new.［「～そうに見える」という文に］', ev('These shoes look new.'), expl='主語が複数なので look（s はつけない）。')
X(98, TR + '\nYour idea is good.［「～そうに聞こえる」という文に］', ev('Your idea sounds good.'), expl='sounds good。')
X(98, '（　）に入る語を、look・looks・sounds から選んで順に書こう（カンマで区切る）。\nYou (　) happy.\nThe cake (　) delicious.\nHis idea (　) good.', seq('look', 'looks', 'sounds'), expl='主語 You は look、The cake は looks（見た目）、His idea は sounds（話を聞いて）。')
X(98, '次の2文の意味の違いとして正しいものを選ぼう。\n(a) Mai is happy.　(b) Mai looks happy.\nア (a)「マイは幸せだ」(b)「マイは幸せそうに見える」　イ (a)「マイは幸せそうに見える」(b)「マイは幸せだ」　ウ どちらも同じ意味', ['ア'], expl='be動詞は「～である」、look は「～そうに見える」。')
X(98, '場面に合う英文として正しいものを選ぼう。\n（友達から週末の計画を聞いて「楽しそうだね」と言うとき）\nア It looks fun.　イ That sounds fun.　ウ That is fun yesterday.', ['イ'], expl='話を聞いた感想は sound を使う。That sounds fun.')

# ── B. There is／are の使い分け ──
X(100, '（　）に is か are を入れ、順に書こう（カンマで区切る）。\nThere (　) a cat under the table.\nThere (　) two cats on the bed.\nThere (　) some water in the glass.', seq('is', 'are', 'is'), expl='1匹は is、2匹は are。water は数えられないので is。')
X(100, TR + '\nThere is a park near my house.［a park を three parks にかえて］', ev('There are three parks near my house.'), expl='複数なので are。park も parks にする。')
X(102, TR + '\nThere is a station by the park.［疑問文にして、No で答える文も続けて］', ev("Is there a station by the park? No, there isn't.", 'Is there a station by the park? No, there is not.'), expl='Is there ～? に No, there isn\'t.')
X(102, TR + '\nThere are some restaurants on this street.［疑問文に］', ev('Are there any restaurants on this street?'), expl='疑問文では some を any にかえる。')
X(102, TR + '\nThere are some eggs in the box.［否定文に］', ev("There aren't any eggs in the box.", 'There are not any eggs in the box.'), expl='否定文では some を any にかえる。')
X(102, TR + '\nThere are ［four］ rooms in your house.［下線部をたずねる疑問文に］', ev('How many rooms are there in your house?'), expl='How many rooms are there ～?')
X(102, TR + '\nThere are ［thirty］ students in your class.［下線部をたずねる疑問文に］', ev('How many students are there in your class?'), expl='How many students are there ～?')

# ── C. 2か所の誤り ──
X(98, FIX + '\nYou look like tired. Your dog look sleepy, too.', ev('You look tired. Your dog looks sleepy, too.'), expl='look ＋形容詞（like は不要）。Your dog には looks。')
X(100, FIX + '\nThere is two chairs in my room. There are a desk, too.', ev('There are two chairs in my room. There is a desk, too.'), expl='two chairs は are、a desk は is。')
X(102, FIX + '\nIs there any cats under the table? — Yes, it is.', ev('Are there any cats under the table? Yes, there are.'), expl='cats は複数なので Are there。答えも there are。')
X(102, FIX + '\nHow many teachers are there in your school? — There is twenty teachers.', ev('How many teachers are there in your school? There are twenty teachers.', 'How many teachers are there in your school? There are twenty.', 'How many teachers are there in your school? There are 20 teachers.'), expl='twenty teachers は複数なので There are。')
X(98, FIX + '\nThe festival sound fantastic. Their bags looks new.', ev('The festival sounds fantastic. Their bags look new.'), expl='The festival（1つ）は sounds、Their bags（複数）は look。')
X(102, FIX + '\nAre there a convenience store around here? — No, there aren\'t.', ev("Is there a convenience store around here? No, there isn't."), expl='a convenience store は1つなので Is there、答えも isn\'t。')
X(106, FIX + '\nI has a headache. You should taking some medicine.', ev('I have a headache. You should take some medicine.'), expl='I には have。should のあとはもとの形 take。')
X(102, FIX + '\nThere isn\'t some milk in the fridge. Is there some juice?', ev("There isn't any milk in the fridge. Is there any juice?"), expl='否定文・疑問文では any。')

# ── D. 部屋のようすから答える ──
X(100, ROOM + '\n問い：机の上に何があるかを、There で始まる英文で書こう。', ev('There is a computer on the desk.'), expl='1台なので There is a computer ～。')
X(102, ROOM + '\n問い：次の質問に英語で答えよう。\nIs there a guitar in Ken\'s room?', ev("No, there isn't.", 'No, there is not.'), expl='ギターはないので No, there isn\'t.')
X(102, ROOM + '\n問い：次の質問に英語で答えよう。\nHow many cats are there under the bed?', ev('There are two cats.', 'There are two.', 'Two cats.', 'Two.'), expl='2匹なので There are two (cats).')
X(102, ROOM + '\n問い：次の質問に英語で答えよう。\nAre there any books in Ken\'s room?', ev('Yes, there are.'), expl='本が20冊あるので Yes, there are.')
X(100, ROOM + '\n問い：ネコについて、There で始まる英文で書こう。', ev('There are two cats under the bed.'), expl='2匹なので There are two cats under the bed.')

# ── E. 使わない語が1つある並べかえ ──
X(99, NG + '\nあなたのお姉さんはうれしそうに見えます。（ your sister / looks / happy / sounds ）.', NGA('Your sister looks happy.'), expl='見た目なので looks。sounds は使わない。')
X(99, NG + '\nそれはおもしろそうに聞こえます。（ that / sounds / interesting / looks ）.', NGA('That sounds interesting.'), expl='聞いた感想なので sounds。looks は使わない。')
X(101, NG + '\nいすの下にボールが1つあります。（ there / is / a ball / under / the chair / are ）.', NGA('There is a ball under the chair.'), expl='1つなので is。are は使わない。')
X(101, NG + '\n箱の中にたくさんのリンゴがあります。（ there / are / many / apples / in / the box / is ）.', NGA('There are many apples in the box.'), expl='複数なので are。is は使わない。')
X(103, NG + '\nこの近くに本屋はありますか。（ is / there / a bookstore / near here / are ）?', NGA('Is there a bookstore near here?'), expl='1つなので Is there。are は使わない。')
X(103, NG + '\nこの公園に動物はいますか。（ are / there / any / animals / in this park / some ）?', NGA('Are there any animals in this park?'), expl='疑問文なので any。some は使わない。')
X(103, NG + '\nあなたの町には寺がいくつありますか。（ how many / temples / are / there / in your town / is ）?', NGA('How many temples are there in your town?'), expl='How many temples are there ～?。is は使わない。')
X(101, NG + '\n冷蔵庫の中には何もありません。（ there / is / not / anything / in the fridge / some ）.', NGA('There is not anything in the fridge.'), expl='否定文なので anything。some は使わない。')

# ── F. 体調不良と助言 ──
X(106, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: What\'s wrong?\nB: (　)\nA: That\'s too bad. You should see a doctor.\nア I have a fever.　イ I\'m fine, thank you.　ウ I\'m very happy.', ['ア'], expl='医者に診てもらうべきだと言われているので、体調が悪いことを伝える。')
X(106, '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nA: I have a headache.\nB: (　)\nア You should take some medicine.　イ You should eat a lot of cake.　ウ That sounds fun.', ['ア'], expl='頭が痛い人への助言として、薬を飲むべきだと言う。')
X(106, WR + '\nどうしたのですか。—おなかが痛いです。', ev("What's wrong? I have a stomachache.", 'What is wrong? I have a stomachache.'), expl='What\'s wrong? に I have a stomachache.')
X(106, WR + '\nあなたは家に帰るべきです。あなたは顔色が悪く見えます。', ev('You should go home. You look pale.'), expl='should go home と look pale。')
X(106, WR + '\n私は熱があります。私は今日、学校を休まなければなりません。', ev('I have a fever. I have to stay home today.', "I have a fever. I can't go to school today.", 'I have a fever. I have to stay at home today.'), expl='have a fever。「休む（家にいる）」は stay home。')
X(106, '（　）に入る語を順に書こう（カンマで区切る）。\nA: You (　) pale. Are you OK?\nB: No. I (　) a toothache.', seq('look', 'have'), expl='「青ざめて見える」は look pale、「歯が痛い」は have a toothache。')

# ── G. 英作文 ──
X(98, WR + '\nこのケーキはおいしそうに見えます。', ev('This cake looks delicious.'), expl='looks delicious。')
X(98, WR + '\nその話はおもしろそうに聞こえます。', ev('That story sounds interesting.', 'The story sounds interesting.', 'That sounds interesting.'), expl='sounds interesting。')
X(100, WR + '\n1年には12か月あります。', ev('There are twelve months in a year.', 'There are 12 months in a year.'), expl='There are twelve months in a year.')
X(100, WR + '\n私の家の近くに大きな公園があります。', ev('There is a big park near my house.', "There's a big park near my house."), expl='There is a big park near ～.')
X(102, WR + '（質問と答えを続けて書く）\nあなたの学校にプールはありますか。—はい、あります。', ev('Is there a pool in your school? Yes, there is.', 'Is there a swimming pool in your school? Yes, there is.'), expl='Is there ～? に Yes, there is.')
X(102, WR + '（質問と答えを続けて書く）\nあなたのクラスには何人の生徒がいますか。—35人います。', ev('How many students are there in your class? There are thirty-five students.', 'How many students are there in your class? There are thirty-five.', 'How many students are there in your class? There are 35 students.', 'How many students are there in your class? There are 35.'), expl='How many students are there ～? に There are thirty-five (students).')

# ── H. オリジナルの文章を読んで答える ──
P1 = '次の文章を読んで答えよう。\nThere is a big park near our school. There are many trees and flowers in it. There is a small lake in the park, too. There are some ducks on the lake. They look very cute. But there aren\'t any shops in the park.\n'
P2 = '次の発表を読んで答えよう。\nHello, everyone. My goal is No. 14, "LIFE BELOW WATER." There is a lot of plastic trash in the sea. It\'s bad for fish and other sea animals. We should not throw away plastic bags. Let\'s use our own bags. It\'s a small action, but it\'s important.\n'
u.strip = (P1, P2, ROOM, TR, FIX, NG, WR, BL)
X(101, P1 + '問い：公園の湖の上には何がいるか。日本語で答えよう。', ['カモ', 'かも', 'アヒル', 'カモ（アヒル）', '鳥'], expl='There are some ducks on the lake. から。')
X(102, P1 + '問い：次の質問に英語で答えよう。\nAre there any shops in the park?', ev("No, there aren't.", 'No, there are not.'), expl='there aren\'t any shops in the park から。')
X(99, P1 + '問い：They look very cute. の They は何をさしているか。日本語で答えよう。', ['カモ', 'かも', 'アヒル', 'カモたち', '湖の上のカモ'], expl='直前の some ducks をさす。')
X(108, P2 + '問い：発表者の目標は何番か。数字で答えよう。', ['14', '14番', 'No. 14', '十四'], expl='My goal is No. 14 から。')
X(108, P2 + '問い：海には何がたくさんあると言っているか。日本語で答えよう。', ['プラスチックのごみ', 'プラスチックごみ', 'プラスチックのゴミ', 'プラスチックゴミ'], expl='There is a lot of plastic trash in the sea. から。')
X(108, P2 + '問い：発表者が提案していることは何か。日本語で答えよう。', ['自分のバッグを使うこと', '自分のバッグを使う', 'マイバッグを使うこと', 'マイバッグを使う', '自分の袋を使うこと'], expl='Let\'s use our own bags. から。')

# ── I. 正しい文を選ぶ ──
X(100, '「テーブルの上にペンが3本あります。」の英文として正しいものを選ぼう。\nア There is three pens on the table.　イ There are three pens on the table.　ウ Three pens are there on the table.', ['イ'], expl='複数なので There are。')
X(98, '「あなたは疲れているように見えます。」の英文として正しいものを選ぼう。\nア You look tired.　イ You looks tired.　ウ You are look tired.', ['ア'], expl='You には look。be動詞は不要。')
X(102, '「この部屋にコンピュータはありますか。—いいえ、ありません。」の英文として正しいものを選ぼう。\nア Is there a computer in this room? — No, there isn\'t.　イ Is there a computer in this room? — No, it isn\'t.　ウ Are there a computer in this room? — No, there aren\'t.', ['ア'], expl='Is there ～? には there を使って答える。')

X(100, '次の文が表す内容として正しいものを選ぼう。\nThere are seven days in a week.\nア 1週間は7日ある。　イ 7日間で1週間が終わった。　ウ 毎週7日に会う。', ['ア'], expl='There are ～ in ...「…に～がある」。')
X(100, '次のうち、（　）に are が入るものを選ぼう。\nア There (　) a pudding in the fridge.　イ There (　) many people in the restaurant.　ウ There (　) some milk in the cup.', ['イ'], expl='many people は複数なので are。pudding は1つ、milk は数えられないので is。')
X(98, '次のうち、（　）に looks が入るものを選ぼう。\nア The apples (　) delicious.　イ Your mother (　) young.　ウ You (　) happy.', ['イ'], expl='3人称単数の Your mother には looks。The apples と You は look。')
X(100, BL + '\nA: There (　) a nice restaurant near the station.\nB: Really? It (　) good. Let\'s go there.', seq('is', 'sounds'), expl='1つなので is。話を聞いた感想は sounds。')
X(102, BL + '\nA: (　) there any students in the gym?\nB: Yes, there (　). They are playing basketball.', seq('Are', 'are'), expl='students は複数なので Are there ～? と there are。')
X(102, BL + '\nA: How many (　) are there in your house?\nB: There (　) five.（部屋の数をたずねる）', seq('rooms', 'are'), expl='How many rooms are there ～? に There are five.')
X(102, ROOM + '\n問い：次の質問に英語で答えよう。\nHow many books are there in Ken\'s room?', ev('There are twenty books.', 'There are twenty.', 'There are 20 books.', 'Twenty books.', 'Twenty.'), expl='本は20冊なので There are twenty (books).')
X(102, ROOM + '\n問い：ケンに「あなたの部屋にテレビはありますか」とたずねる英文を書こう。', ev('Is there a TV in your room?'), expl='Is there a TV in your room?')
X(103, NG + '\n駅の近くに銀行はありますか。—はい、あります。（ is / there / a bank / near the station / yes / there / is / are ）', NGA('Is there a bank near the station? Yes, there is.'), expl='1つなので Is there ～? と there is。are は使わない。')
X(106, WR + '\n私は歯が痛いです。私は歯医者に行かなければなりません。', ev('I have a toothache. I have to go to the dentist.', 'I have a toothache. I have to see a dentist.'), expl='have a toothache と have to go to the dentist。')
X(108, P2 + '問い：次の質問に英語で答えよう。\nIs there a lot of plastic trash in the sea?', ev('Yes, there is.'), expl='There is a lot of plastic trash in the sea. から。trash は数えられないので is。')
X(98, '「そのリンゴはおいしそうに見えます。」の英文として正しいものを選ぼう。\nア The apples look delicious.　イ The apples looks delicious.　ウ The apples are look delicious.', ['ア'], expl='複数の主語なので look。be動詞は不要。')
X(100, WR + '\n私のかばんの中にペンが何本かあります。', ev('There are some pens in my bag.'), expl='肯定文なので some。There are some pens ～.')

X(101, NG + '\n私たちの町には有名な寺があります。（ there / is / a famous temple / in / our town / has ）.', NGA('There is a famous temple in our town.'), expl='There is ～ in our town.。has は使わない。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp98〜103（Lesson9 Part1〜3の基本文・ポイント・A・B）、p104〜105（まとめテスト）、p106〜107（体調不良・Project 3）、p108〜109（場面別ドリル）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、be動詞・look・sound の使い分け、There is と are（数えられない名詞をふくむ）、some と any、How many ～ are there、2か所の誤り、部屋のようすの条件からの答え、使わない語のある並べかえ、体調不良と助言、英作文、オリジナルの文章・発表の読み取り、の形にした。部屋のようすは絵の代わりに問題文で説明しているので画像は不要。並べかえは与えた語を変える答えを認めない。')
