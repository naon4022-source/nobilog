# coding: utf-8
"""英語1年 Lesson 6 後半（代名詞 me・him・her・us・them と校舎案内）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p66〜69・p72〜73・p113（代名詞の4つの形 ～は・～の・～を［に］・～のもの／for her・about him など前置詞のあと／
Please tell us about ～.／Where's ～? It's on the ～ floor.／Go up［down］the stairs and turn right［left］.／on your left［right］、
Lesson 1〜6前半の文）。
使わないもの：should・have to（Lesson 7）、未来の文（Lesson 8）、ワークにない場所の語。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l6b', '代名詞（him・her・them など）と校舎案内（特訓）', 'Lesson 6', '英語', 1,
         {64: 'source-0472', 66: 'source-0473', 67: 'source-0473', 68: 'source-0474', 69: 'source-0474', 72: 'source-0476', 73: 'source-0476', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l6b.json', '確認済み/workbook-english-1-l6a.json', '確認済み/workbook-english-1-l4a.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)
PN = '次の文の［　］の語句を、1語の代名詞にかえて全文を書こう。'
FM = '（　）内の代名詞を、文に合う正しい形にして順に書こう（カンマで区切る）。'
FIX = '次の英文には誤りが2か所ある。正しく直して全文を書こう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
SEL = 'の英文として正しいものを選ぼう。'
MAP = '（案内図：1階＝職員室・保健室、2階＝図書室・音楽室、3階＝理科室・コンピュータ室。階段は建物の中央にあり、上がって右に図書室と理科室、左に音楽室とコンピュータ室がある。）'

# ── A. 文の中の働きで形をかえる ──
X(66, FM + '（she）\n(　) is my friend Eri. I like (　) very much. This is (　) bag.', seq('She', 'her', 'her'), expl='主語は She、like のあとは her（彼女を）、名詞の前は her（彼女の）。')
X(66, FM + '（he）\nThat is Ken. Do you know (　)? (　) is in the soccer club.', seq('him', 'He'), expl='know のあとは him（彼を）。主語は He。')
X(66, FM + '（they）\nI have two cats. (　) are cute. I play with (　) every day.', seq('They', 'them'), expl='主語は They。with のあとは them（それらと）。')
X(66, FM + '（we）\nMs. Abe is (　) English teacher. She often talks to (　).', seq('our', 'us'), expl='名詞の前は our（私たちの）。to のあとは us（私たちに）。')
X(66, FM + '（I）\nMy cats love (　). They sleep in (　) room.', seq('me', 'my'), expl='love のあとは me（私を）。名詞の前は my（私の）。')
X(73, FM + '（it）\nThis is my dog. (　) name is Pochi. I walk (　) every morning.', seq('Its', 'it'), expl='名詞の前は Its（それの）。walk のあとは it（それを）。')
X(66, FM + '（you）\nThis present is for (　). Is this pen (　), too?', seq('you', 'yours'), expl='for のあとは you。「あなたのもの」は yours。')
X(73, FM + '（they）\nKen and Yumi are my friends. (　) house is near my house. I often visit (　).', seq('Their', 'them'), expl='名詞の前は Their（彼らの）。visit のあとは them（彼らを）。')

# ── B. 語句を代名詞にかえる ──
X(73, PN + '\nI know ［Mr. Tanaka and his wife］.', NGA('I know them.'), expl='2人なので them（彼らを）。')
X(73, PN + '\n［Aya and I］ play tennis on Sundays.', NGA('We play tennis on Sundays.'), expl='Aya and I は「私たちは」なので We。')
X(73, PN + '\nThis is ［Mr. Brown\'s］ car.', NGA('This is his car.'), expl='Mr. Brown\'s は「彼の」なので his。')
X(73, PN + '\nPlease help ［Kumi and me］.', NGA('Please help us.'), expl='Kumi and me は「私たちを」なので us。')
X(73, PN + '\nDo you like ［this song］?', NGA('Do you like it?'), expl='this song は「それを」なので it。')
X(73, PN + '\nThat racket is ［Ms. Ito\'s］.', NGA('That racket is hers.'), expl='Ms. Ito\'s（伊藤さんのもの）は hers。Ms. は女性につける。')
X(73, PN + '\nI cook for ［my sister］.', NGA('I cook for her.'), expl='for のあとなので her（彼女のために）。')
X(73, PN + '\nTom often talks with ［Ken and Jun］.', NGA('Tom often talks with them.'), expl='with のあとの2人は them。')

# ── C. 2か所の誤り ──
X(66, FIX + '\nThis is Mai. Do you know she? She is very kind. We like she.', ev('This is Mai. Do you know her? She is very kind. We like her.'), expl='know・like のあとは「～を」の形 her。')
X(66, FIX + '\nThat boy is Jack. I don\'t know he. Please tell me about he.', ev("That boy is Jack. I don't know him. Please tell me about him."), expl='know・about のあとは him。')
X(73, FIX + '\nI have two dogs. It like me. I play with it every day.', ev('I have two dogs. They like me. I play with them every day.'), expl='two dogs は複数なので They と them。')
X(73, FIX + '\nThis is Ms. Kato. He is our teacher. We like his very much.', ev('This is Ms. Kato. She is our teacher. We like her very much.'), expl='Ms. は女性なので She と her。')
X(66, FIX + '\nMy brother and I like music. Our often sing together. Please listen to we.', ev('My brother and I like music. We often sing together. Please listen to us.'), expl='主語は We、to のあとは us。')
X(64, FIX + '\nIs this you bag? — Yes, it\'s my.', ev("Is this your bag? Yes, it's mine.", 'Is this your bag? Yes, it is mine.'), expl='「あなたの」は your、「私のもの」は mine。')
X(73, FIX + '\nMy parents like movies. Them often watch movies on Sundays. I sometimes go with they.', ev('My parents like movies. They often watch movies on Sundays. I sometimes go with them.'), expl='主語は They、with のあとは them。')
X(66, FIX + '\nI know that girl. Her name is Lisa. I often talk to she. She likes I.', ev('I know that girl. Her name is Lisa. I often talk to her. She likes me.'), expl='to のあとは her、likes のあとは me。')

# ── D. 文の意味から代名詞を選ぶ ──
X(66, '（　）に入る語として正しいものを選ぼう。\nThis is Mr. Oka. Do you know (　)?\nア he　イ his　ウ him　エ her', ['ウ'], expl='know のあとで、男性（Mr.）なので him。')
X(66, '（　）に入る語として正しいものを選ぼう。\nEmi and I are in the same class. Our teacher always helps (　).\nア we　イ us　ウ them　エ our', ['イ'], expl='helps のあとで「私たちを」なので us。')
X(66, '（　）に入る語として正しいものを選ぼう。\nI have many comic books. I read (　) every night.\nア it　イ they　ウ them　エ their', ['ウ'], expl='many comic books（複数）を「それらを」で受けるので them。')
X(73, '（　）に入る語として正しいものを選ぼう。\nThat is Aki\'s bike. (　) bike is new.\nア She　イ Her　ウ Hers　エ Him', ['イ'], expl='名詞 bike の前なので Her（彼女の）。')
X(73, '（　）に入る語として正しいものを選ぼう。\nThis notebook is not mine. Is it (　)?\nア you　イ your　ウ yours　エ yourself', ['ウ'], expl='「あなたのもの」なので yours。')
X(66, '（　）に入る語として正しいものを選ぼう。\nMy grandmother lives in Nara. I sometimes call (　).\nア she　イ her　ウ hers　エ him', ['イ'], expl='call のあとで「彼女に」なので her。')

# ── E. 使わない語が1つある並べかえ ──
X(67, NG + '\n私は彼のためにケーキを作りました。（ I / made / a cake / for / him / he ）.', NGA('I made a cake for him.'), expl='for のあとは him。he は使わない。')
X(67, NG + '\n私たちに彼女について教えてください。（ please / tell / us / about / her / we ）.', NGA('Please tell us about her.'), expl='tell のあとは us。we は使わない。')
X(67, NG + '\nあなたは彼らを知っていますか。（ do / you / know / them / they ）?', NGA('Do you know them?'), expl='know のあとは them。they は使わない。')
X(73, NG + '\nこれは私のネコです。それの名前はタマです。（ this / is / my cat / its / name / is / Tama / it ）.', NGA('This is my cat. Its name is Tama.'), expl='名詞の前は Its。it は使わない。')
X(67, NG + '\n私はあなたといっしょに行きたいです。（ I / want / to / go / with / you / your ）.', NGA('I want to go with you.'), expl='with のあとは you。your は使わない。')
X(66, NG + '\nそのイヌは私が大好きです。（ the dog / likes / me / very much / my ）.', NGA('The dog likes me very much.'), expl='likes のあとは me。my は使わない。')
X(72, NG + '\n階段を上がって左に曲がってください。（ go up / the stairs / and / turn / left / right ）.', NGA('Go up the stairs and turn left.'), expl='「左に」は left。right は使わない。')
X(72, NG + '\n音楽室はどこですか。（ where / is / the music room / what ）?', NGA('Where is the music room?'), expl='場所は Where。what は使わない。')

# ── F. 校舎案内（図の条件から考える） ──
X(72, MAP + '\n問い：図書室は何階にあるか。英語で答えよう（It\'s で始める）。', ev("It's on the second floor."), expl='2階は the second floor。「～階に」は on the ～ floor。')
X(72, MAP + '\n問い：1階の職員室から理科室へ行く道順を英語で答えよう（Go で始める）。', ev('Go up the stairs and turn right.', 'Go up the stairs to the third floor and turn right.'), expl='理科室は3階で、階段を上がって右。')
X(72, MAP + '\n問い：3階のコンピュータ室から、2階の音楽室へ行くときの最初の動きとして正しいものを選ぼう。\nア Go up the stairs.　イ Go down the stairs.　ウ Turn left at the library.', ['イ'], expl='3階から2階へは階段を下りる（go down）。')
X(72, MAP + '\n問い：保健室をさがしている人に「それは1階にあります。」と英語で答えよう。', ev("It's on the first floor."), expl='1階は the first floor。')
X(72, MAP + '\n問い：次の英文が正しければ〇、誤りなら×を書こう。\nThe music room is on the third floor.', ['×', 'x', 'X', '✕'], expl='音楽室は2階（the second floor）なので×。')
X(72, '（　）に入る語を順に書こう（カンマで区切る）。\nすみません。職員室はどこですか。—それは2階にあります。\n(　) me. (　) the teachers\' room? — It\'s (　) the second floor.', seq('Excuse', "Where's", 'on') + seq('Excuse', 'Where is', 'on'), expl='Excuse me.／Where\'s ～?／on the ～ floor。')
X(72, '（　）に入る語を順に書こう（カンマで区切る）。\n階段を下りてください。それはあなたの右側にあります。\nGo (　) the stairs. It\'s (　) your (　).', seq('down', 'on', 'right'), expl='「下りる」は go down、「あなたの右側に」は on your right。')
X(72, WR + '\n音楽室はどこですか。—3階にあります。', ev("Where's the music room? It's on the third floor.", "Where is the music room? It's on the third floor.", 'Where is the music room? It is on the third floor.'), expl='Where\'s ～? に It\'s on the third floor.')

# ── G. 英作文 ──
X(67, WR + '\nこちらはルーカスです。あなたは彼を知っていますか。', ev('This is Lucas. Do you know him?'), expl='This is ～. と Do you know him?')
X(67, WR + '\n私は母のために昼食を作ります。私は彼女が大好きです。', ev('I cook lunch for my mother. I like her very much.', 'I make lunch for my mother. I like her very much.', 'I cook lunch for my mother. I love her.', 'I make lunch for my mother. I love her.'), expl='for my mother、like her very much（love her）。')
X(67, WR + '\n健と私は友達です。彼は私たちに数学を教えてくれます。', ev('Ken and I are friends. He teaches us math.', 'Ken and I are friends. He teaches math to us.'), expl='teaches のあとは us。')
X(66, WR + '\nあれは私の祖父母です。私は毎週日曜日に彼らを訪ねます。', ev('Those are my grandparents. I visit them every Sunday.', 'Those are my grandparents. I visit them on Sundays.'), expl='visit のあとは them。')
X(67, WR + '\n実際に、私はイヌが好きではありません。', ev("Actually, I don't like dogs."), expl='「実際は」は Actually。')
X(73, WR + '\nこのネコは私のものではありません。それは彼のものです。', ev("This cat is not mine. It's his.", "This cat isn't mine. It's his.", "This cat is not mine. It is his."), expl='mine と his（彼のもの）。')

# ── H. オリジナルの文章を読んで答える ──
P1 = '次の文章を読んで答えよう。\nThis is my friend, Nick. He is from Canada. He is very kind. Every morning he waits for me at the station. We go to school together. I like him very much. His sister, Amy, plays the piano well. I often listen to her.\n'
P2 = '次の対話を読んで答えよう。\nEllen: Excuse me. Where\'s the computer room?\nAki: It\'s on the third floor. Go up the stairs and turn left.\nEllen: Thank you. Do you know Mr. Green?\nAki: Yes. He\'s our science teacher. We like him. Is he your teacher, too?\nEllen: Yes. I want to talk to him.\n'
u.strip = (P1, P2, MAP, PN, FM, FIX, NG, WR)
X(66, P1 + '問い：最後の文の her はだれをさしているか。日本語で答えよう。', ['エイミー', 'ニックの姉', 'ニックの妹', 'ニックの姉（妹）のエイミー', 'Amy'], expl='直前の His sister, Amy から、エイミー。')
X(66, P1 + '問い：毎朝、駅で書いた人を待っているのはだれか。日本語で答えよう。', ['ニック', 'Nick'], expl='Every morning he waits for me at the station. の he はニック。')
X(66, P1 + '問い：次の質問に英語で答えよう。\nWho plays the piano well?', ev('Amy does.', "Nick's sister does.", "Nick's sister, Amy, does.", 'Amy.'), expl='His sister, Amy, plays the piano well. から、Amy does.')
X(72, P2 + '問い：コンピュータ室は何階にあるか。日本語で答えよう。', ['3階', '三階'], expl='It\'s on the third floor. から。')
X(72, P2 + '問い：コンピュータ室へは、階段を上がってからどちらに曲がるか。日本語で答えよう。', ['左', '左に', '左へ'], expl='turn left から、左。')
X(66, P2 + '問い：アキの最後の発言の him はだれをさしているか。日本語で答えよう。', ['グリーン先生', 'Mr. Green', 'グリーンさん'], expl='直前の Mr. Green（理科の先生）をさす。')

# ── I. 正しい文を選ぶ ──
X(66, '「私たちは彼女が大好きです。」' + SEL + '\nア We like she very much.　イ We like her very much.　ウ Us like her very much.', ['イ'], expl='主語は We、like のあとは her。')
X(66, '「あなたは彼らを知っていますか。」' + SEL + '\nア Do you know they?　イ Do you know their?　ウ Do you know them?', ['ウ'], expl='know のあとは them。')
X(73, '「これらは彼のノートです。」' + SEL + '\nア These are him notebooks.　イ These are his notebooks.　ウ These are he notebooks.', ['イ'], expl='名詞の前は his（彼の）。')
X(72, '「それはあなたの左側にあります。」' + SEL + '\nア It\'s on your left.　イ It\'s in you left.　ウ It\'s on you left.', ['ア'], expl='on your left。')

X(66, FM + '（he）\nMike is my classmate. (　) house is by the station. I go to school with (　).', seq('His', 'him'), expl='名詞の前は His（彼の）。with のあとは him。')
X(66, FM + '（I）\nThis is (　) mother. She makes lunch for (　) every day.', seq('my', 'me'), expl='名詞の前は my、for のあとは me。')
X(73, PN + '\n［Your brother and you］ are good at soccer.', NGA('You are good at soccer.'), expl='「あなたとお兄さん」は「あなたたちは」なので You。')
X(73, PN + '\nI often eat lunch with ［Saki］.', NGA('I often eat lunch with her.'), expl='with のあとの女性は her。')
X(66, '（　）に入る語として正しいものを選ぼう。\nLook at those birds. (　) are flying.\nア It　イ They　ウ Them　エ Their', ['イ'], expl='those birds（複数）を主語で受けるので They。')
X(72, MAP + '\n問い：2階の図書室の前にいる人に、3階の理科室への最初の動きを英語で答えよう（Go で始める）。', ev('Go up the stairs.', 'Go up the stairs and turn right.'), expl='2階から3階へは階段を上がる（go up）。')
X(67, WR + '\n私の姉はピアノの先生です。彼女の生徒たちは彼女が大好きです。', ev('My sister is a piano teacher. Her students like her very much.', 'My sister is a piano teacher. Her students love her.'), expl='名詞の前は Her、like のあとは her。')
X(73, '「彼女の名前はリサです。」' + SEL + '\nア She name is Lisa.　イ Her name is Lisa.　ウ Hers name is Lisa.', ['イ'], expl='名詞 name の前は Her。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp64（代名詞の表）、p66〜67（Lesson6 Part3の基本文・ポイント・A・B）、p68〜69（まとめテスト）、p72〜73（校舎案内・代名詞のまとめ）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、1つの人物を文の働きに合わせて形をかえる・語句を代名詞にかえる・2か所の誤り・意味から選ぶ・使わない語のある並べかえ・案内図の条件から道順を考える・英作文・オリジナルの文章で代名詞のさすものを答える、の形にした。並べかえは与えた語を変える答えを認めない。')
