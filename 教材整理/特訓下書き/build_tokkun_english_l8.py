# coding: utf-8
"""英語1年 Lesson 8（be going to・will・感嘆文と、過去・現在・未来の文）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p86〜93・p96〜97・p113（be going to ＋動詞のもとの形の肯定・否定・疑問文、疑問詞＋be going to／will ＋もとの形、
won't、Will ～? — Yes, ～ will.／What (a［an］) ～!・How ～!／時を表す語句と過去・現在・未来の使い分け／
look forward to ～・be interested in ～・help each other、Lesson 1〜7の文）。
使わないもの：現在完了・未来進行形など、ワークにない形。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l8', 'be going to・will・感嘆文（特訓）', 'Lesson 8', '英語', 1,
         {86: 'source-0483', 87: 'source-0483', 88: 'source-0484', 89: 'source-0484', 90: 'source-0485', 91: 'source-0485',
          92: 'source-0486', 93: 'source-0486', 96: 'source-0488', 97: 'source-0488', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l8.json', '確認済み/workbook-english-1-l3a.json', '確認済み/workbook-english-1-words.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)
TN = '（　）内の動詞を、時を表す語句に合う形にして順に書こう（カンマで区切る）。2語以上になってもよい。'
TR = '次の文を、［　］の指示にしたがって書きかえよう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
EX = '次の文を、「なんて～だろう」という感嘆文に書きかえよう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
BL = '（　）に入る語を順に書こう（カンマで区切る）。'

# ── A. 過去・現在・未来の使い分け ──
X(96, TN + '（play）\nKen (　) soccer yesterday. He (　) soccer every day. He (　) soccer tomorrow, too.（未来は will を使う）', seq('played', 'plays', 'will play'), expl='yesterday は過去 played、every day は現在 plays（3人称単数）、tomorrow は未来 will play。')
X(96, TN + '（be）\nI (　) in Tokyo last week. I (　) in Nagoya now. I (　) in Osaka next week.（未来は will を使う）', seq('was', 'am', 'will be'), expl='過去は was、現在は am、未来は will be。')
X(97, TN + '（visit）\nWe (　) Kyoto last year. We (　) Kyoto next year.（未来は be going to を使う）', seq('visited', 'are going to visit'), expl='last year は過去 visited。next year は予定なので are going to visit（主語 we に合わせて are）。')
X(97, TN + '（study）\nMy brother (　) math yesterday morning. He (　) English this evening.（未来は be going to を使う）', seq('studied', 'is going to study'), expl='過去は studied。予定は is going to study（主語に合わせて is）。')
X(97, '次の文の（　）に入れることができないものを選ぼう。\nI will visit my grandmother (　).\nア next Sunday　イ last Sunday　ウ tomorrow', ['イ'], expl='will は未来の文なので、過去を表す last Sunday は合わない。')

# ── B. 書きかえ ──
X(86, TR + '\nYuto goes to bed early.［tonight を加えて「～するつもりです」の文に］', ev('Yuto is going to go to bed early tonight.'), expl='主語が Yuto なので is going to。goes はもとの形 go。')
X(86, TR + '\nRina is going to visit Hokkaido.［否定文に］', ev("Rina isn't going to visit Hokkaido.", 'Rina is not going to visit Hokkaido.', "Rina's not going to visit Hokkaido."), expl='be動詞 is のあとに not。')
X(86, TR + '\nYou are going to buy a new bike.［疑問文にして、Yes で答える文も続けて］', ev('Are you going to buy a new bike? Yes, I am.'), expl='Are you going to ～? に Yes, I am.')
X(86, TR + '\nYou are going to buy a new bike ［next Saturday］.［下線部をたずねる疑問文に］', ev('When are you going to buy a new bike?'), expl='時をたずねるので When are you going to ～?')
X(88, TR + '\nIt is sunny today.［tomorrow を使って未来の文に（will を使う）］', ev('It will be sunny tomorrow.', "It'll be sunny tomorrow."), expl='is のもとの形は be。will be。')
X(88, TR + '\nTom will come to the party.［否定文に］', ev("Tom won't come to the party.", 'Tom will not come to the party.'), expl='will not（won\'t）＋もとの形。')
X(88, TR + '\nYour sister will be at home tonight.［疑問文にして、No で答える文も続けて］', ev("Will your sister be at home tonight? No, she won't.", 'Will your sister be at home tonight? No, she will not.'), expl='Will を主語の前に出す。答えは she won\'t。')
X(86, TR + '\nI clean my room.［tomorrow を加えて「～するつもりです」の文に］', ev("I'm going to clean my room tomorrow.", 'I am going to clean my room tomorrow.'), expl='I am going to ～.')
X(86, TR + '\nAya is going to watch a movie ［this weekend］.［下線部をたずねる疑問文に］', ev('When is Aya going to watch a movie?'), expl='When is Aya going to ～?')
X(86, TR + '\nKen is going to ［play tennis］ this afternoon.［下線部をたずねる疑問文に］', ev('What is Ken going to do this afternoon?', "What's Ken going to do this afternoon?"), expl='「何をするつもりか」は What is Ken going to do ～?')

# ── C. 2か所の誤り ──
X(86, FIX + '\nI am going to visits Kyoto. My sister are going to come with me.', ev('I am going to visit Kyoto. My sister is going to come with me.', "I'm going to visit Kyoto. My sister is going to come with me."), expl='going to のあとはもとの形 visit。My sister には is。')
X(88, FIX + '\nIt will snows tomorrow. It will is cold.', ev('It will snow tomorrow. It will be cold.'), expl='will のあとはもとの形。is のもとの形は be。')
X(86, FIX + '\nDo you going to cook lunch? — Yes, I do.', ev('Are you going to cook lunch? Yes, I am.'), expl='be going to の疑問文は Are you going to ～?。答えも am。')
X(88, FIX + '\nWill Ken comes tomorrow? — No, he isn\'t.', ev("Will Ken come tomorrow? No, he won't.", 'Will Ken come tomorrow? No, he will not.'), expl='Will のあとはもとの形 come。答えは won\'t。')
X(90, FIX + '\nHow a beautiful picture! What cute!', ev('What a beautiful picture! How cute!'), expl='「a＋形容詞＋名詞」は What、形容詞だけは How。')
X(96, FIX + '\nI went to the zoo tomorrow. I will see pandas yesterday.', ev('I will go to the zoo tomorrow. I saw pandas yesterday.', "I'll go to the zoo tomorrow. I saw pandas yesterday.", 'I am going to go to the zoo tomorrow. I saw pandas yesterday.'), expl='tomorrow は未来、yesterday は過去に合わせる。')
X(88, FIX + '\nI\'m not going to going there. I won\'t to see him.', ev("I'm not going to go there. I won't see him."), expl='going to のあとはもとの形 go。won\'t のあとに to はつけない。')
X(86, FIX + '\nWhat are you going do this weekend? — I going to play tennis.', ev("What are you going to do this weekend? I'm going to play tennis.", 'What are you going to do this weekend? I am going to play tennis.'), expl='going to do の to がぬけている。答えに be動詞 am が必要。')

# ── D. 感嘆文 ──
X(90, EX + '\nThat is a very old house.（What で始める）', ev('What an old house!'), expl='old は母音で始まるので an。What an old house!')
X(90, EX + '\nThis dog is very cute.（How で始める）', ev('How cute!'), expl='How ＋形容詞！')
X(90, EX + '\nThat is a very exciting game.（What で始める）', ev('What an exciting game!'), expl='exciting は母音で始まるので an。What an exciting game!')
X(90, EX + '\nThese are very nice shoes.（What で始める）', ev('What nice shoes!'), expl='複数形の名詞なので a はつけない。What nice shoes!')
X(90, '（　）に What か How を入れ、順に書こう（カンマで区切る）。\n(　) wonderful!\n(　) a delicious cake!\n(　) beautiful flowers!', seq('How', 'What', 'What'), expl='形容詞だけは How、「（a）＋形容詞＋名詞」は What。')
X(90, '場面に合う感嘆文として正しいものを選ぼう。\n（友達がとても上手にピアノをひいたとき）\nア What a good pianist!　イ How a good pianist!　ウ What good pianist!', ['ア'], expl='What a ＋形容詞＋名詞！')

# ── E. 複数の（　） ──
X(86, BL + '\nA: (　) you going to make breakfast?\nB: No, I\'m (　). My father is going to make it.', seq('Are', 'not'), expl='Are you going to ～? に No, I\'m not.')
X(88, BL + '\nA: (　) it rain tomorrow?\nB: Yes, it (　). Please take your umbrella.', seq('Will', 'will'), expl='Will it ～? に Yes, it will.')
X(92, BL + '\n私たちはその日を楽しみに待っています。私たちは美術に興味があります。\nWe\'re looking (　) to that day. We\'re interested (　) art.', seq('forward', 'in'), expl='look forward to ～「～を楽しみに待つ」、be interested in ～「～に興味がある」。')
X(97, BL + '\nA: (　) is your father going to buy a new car?\nB: He is going to (　) it next month.', seq('When', 'buy'), expl='時は When。going to のあとはもとの形 buy。')
X(92, BL + '\nYou should help (　)(　).（あなたたちはお互いに助け合うべきです）', seq('each', 'other'), expl='「お互い」は each other。')
X(88, BL + '\nA: What will the weather (　) like tomorrow?\nB: It (　) be sunny.', seq('be', 'will'), expl='will のあとはもとの形 be。答えも will be。')

# ── F. 使わない語が1つある並べかえ ──
X(87, NG + '\n私は来週、祖母に会うつもりです。（ I / am / going / to / see / my grandmother / next week / will ）.', NGA('I am going to see my grandmother next week.'), expl='be going to の文。will は使わない。')
X(87, NG + '\nあなたは今度の日曜日に何をするつもりですか。（ what / are / you / going / to / do / next Sunday / will ）?', NGA('What are you going to do next Sunday?'), expl='What are you going to do ～?。will は使わない。')
X(89, NG + '\n明日は雪が降らないでしょう。（ it / will / not / snow / tomorrow / snows ）.', NGA('It will not snow tomorrow.'), expl='will not ＋もとの形 snow。snows は使わない。')
X(89, NG + '\n私の弟は来年10歳になるでしょう。（ my brother / will / be / ten / next year / is ）.', NGA('My brother will be ten next year.'), expl='will be。is は使わない。')
X(91, NG + '\nなんてかっこいい車だろう。（ what / a / cool / car / how ）!', NGA('What a cool car!'), expl='a＋形容詞＋名詞なので What。how は使わない。')
X(91, NG + '\nなんておもしろいのだろう。（ how / interesting / what ）!', NGA('How interesting!'), expl='形容詞だけなので How。what は使わない。')
X(87, NG + '\n彼らは野球をするつもりはありません。（ they / are / not / going / to / play / baseball / don\'t ）.', NGA('They are not going to play baseball.'), expl='be going to の否定は are not going to。don\'t は使わない。')
X(89, NG + '\nあなたは明日、家にいるでしょうか。（ will / you / be / at home / tomorrow / are ）?', NGA('Will you be at home tomorrow?'), expl='Will you be ～?。are は使わない。')

# ── G. 英作文 ──
X(86, WR + '\n私は今週末、テニスをするつもりです。', ev("I'm going to play tennis this weekend.", 'I am going to play tennis this weekend.'), expl='be going to ＋もとの形。')
X(86, WR + '（質問と答えを続けて書く）\nあなたは明日、図書館に行くつもりですか。—いいえ、行きません。', ev("Are you going to go to the library tomorrow? No, I'm not."), expl='Are you going to ～? に No, I\'m not.')
X(88, WR + '\n明日の午後は暖かいでしょう。', ev('It will be warm tomorrow afternoon.', "It'll be warm tomorrow afternoon."), expl='will be warm。')
X(88, WR + '\n私はすぐに準備をします。', ev("I'll get ready quickly.", 'I will get ready quickly.', "I'll get ready soon.", 'I will get ready soon.'), expl='その場で決めたことは will。get ready「準備する」。')
X(90, WR + '\nなんて美しい湖だろう。', ev('What a beautiful lake!'), expl='a＋形容詞＋名詞なので What。')
X(86, WR + '\n私の兄は来月、カナダで英語を勉強する予定です。', ev('My brother is going to study English in Canada next month.'), expl='is going to study。')
X(88, WR + '（質問と答えを続けて書く）\n健はすぐにここに来るでしょうか。—はい、来るでしょう。', ev('Will Ken come here soon? Yes, he will.'), expl='Will Ken come ～? に Yes, he will.')

# ── H. オリジナルの対話・予定表を読んで答える ──
P1 = '次の対話を読んで答えよう。\nRyo: What are you going to do this Saturday, Emma?\nEmma: I\'m going to go shopping with my mother. How about you?\nRyo: I\'m going to play soccer. But it will rain on Saturday.\nEmma: Oh, no. Then, what will you do?\nRyo: I\'ll watch a movie at home. I\'m looking forward to it.\n'
P2 = '次の予定表を読んで答えよう。\n〈ミキの夏休みの予定〉\nAugust 3rd: visit my grandparents in Nagano\nAugust 10th: go to the sea with my friends\nAugust 15th: practice the piano for the concert\n'
u.strip = (P1, P2, TN, TR, FIX, EX, NG, WR, BL)
X(87, P1 + '問い：エマは土曜日にだれと買い物に行くつもりか。日本語で答えよう。', ['母', '母親', 'お母さん', 'エマの母'], expl='with my mother から。')
X(89, P1 + '問い：土曜日の天気はどうなると言っているか。日本語で答えよう。', ['雨', '雨が降る', '雨になる'], expl='it will rain on Saturday から。')
X(89, P1 + '問い：リョウは雨の日に何をするつもりか。日本語で答えよう。', ['家で映画を見る', '家で映画を見ること', '映画を見る'], expl='I\'ll watch a movie at home. から。')
X(87, P2 + '問い：ミキになったつもりで、次の質問に英語で答えよう。\nWhat are you going to do on August 10th?', ev("I'm going to go to the sea with my friends.", 'I am going to go to the sea with my friends.', "I'm going to go to the sea."), expl='予定表から、go to the sea with my friends。be going to で答える。')
X(87, P2 + '問い：ミキになったつもりで、次の質問に英語で答えよう。\nAre you going to visit your grandparents in August?', ev("Yes, I am.", "Yes, I am. I'm going to visit them on August 3rd."), expl='8月3日に祖父母を訪ねる予定なので Yes, I am.')
X(87, P2 + '問い：ミキが8月15日にすることは何か。日本語で答えよう。', ['コンサートに向けてピアノを練習する', 'ピアノの練習', 'ピアノを練習する', 'コンサートのためにピアノを練習する'], expl='practice the piano for the concert から。')

# ── I. 意味の違い・正しい文 ──
X(96, '次の2文の違いとして正しいものを選ぼう。\n(a) I\'m going to visit Kyoto.　(b) I\'ll visit Kyoto.\nア (a)は前から決めていた予定、(b)はその場で決めた意志を表すことが多い。　イ (a)は過去、(b)は未来を表す。　ウ (a)と(b)はどちらも過去を表す。', ['ア'], expl='be going to は前から決めていた予定、will はその場で決めたことや予想を表す。')
X(88, '「明日は晴れるでしょう。」の英文として正しいものを選ぼう。\nア It will sunny tomorrow.　イ It will be sunny tomorrow.　ウ It will is sunny tomorrow.', ['イ'], expl='will のあとは be。')
X(86, '「あなたはいつ帽子を買うつもりですか。」の英文として正しいものを選ぼう。\nア When are you going to buy a cap?　イ When do you going to buy a cap?　ウ When you are going to buy a cap?', ['ア'], expl='When ＋ are you going to ～?')
X(90, '「なんておいしいのだろう。」の英文として正しいものを選ぼう。\nア What delicious!　イ How delicious!　ウ How a delicious!', ['イ'], expl='形容詞だけなので How delicious!')

X(96, TN + '（have）\nWe (　) a party last Sunday. We (　) a party every month. We (　) a party next Sunday, too.（未来は be going to を使う）', seq('had', 'have', 'are going to have'), expl='過去は had、現在は have、予定は are going to have。')
X(88, TR + '\nKen will wash the car.［疑問文にして、Yes で答える文も続けて］', ev('Will Ken wash the car? Yes, he will.'), expl='Will Ken wash ～? に Yes, he will.')
X(86, TR + '\nThey are going to ［swim in the sea］ tomorrow.［下線部をたずねる疑問文に］', ev('What are they going to do tomorrow?'), expl='「何をするつもりか」は What are they going to do ～?')
X(88, FIX + '\nWill you are busy tomorrow? — Yes, I am.', ev('Will you be busy tomorrow? Yes, I will.'), expl='Will のあとは be。答えも will。')
X(90, EX + '\nThis is a very interesting book.（What で始める）', ev('What an interesting book!'), expl='interesting は母音で始まるので an。')
X(87, BL + '\nA: (　) are you going to (　) in Kyoto?\nB: I\'m going to visit some temples.', seq('What', 'do'), expl='「何をするつもりか」は What are you going to do ～?')
X(88, '場面に合う英文として正しいものを選ぼう。\n（雨が降りそうなのを見て、その場で傘を持っていくと決めたとき）\nア I\'ll take my umbrella.　イ I took my umbrella.　ウ I take my umbrella every day.', ['ア'], expl='その場で決めたことは will（I\'ll）。')
X(87, NG + '\nあなたは何時に起きるつもりですか。（ what time / are / you / going / to / get up / do ）?', NGA('What time are you going to get up?'), expl='What time are you going to ～?。do は使わない。')
X(87, P1 + '問い：次の質問に英語で答えよう。\nIs Emma going to play soccer on Saturday?', ev("No, she isn't.", "No, she's not.", 'No, she is not.'), expl='エマは母親と買い物に行く予定。サッカーをするのはリョウ。')
X(88, '次のうち、（　）に be が入るものを選ぼう。\nア It will (　) cold tomorrow.　イ I will (　) tennis.　ウ She is going (　) visit Nara.', ['ア'], expl='will のあとに形容詞 cold が続くので be が必要。イは play、ウは to。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp86〜91（Lesson8 Part1〜3の基本文・ポイント・A・B）、p92〜93（まとめテスト）、p96〜97（文法のまとめ：過去・現在・未来の文）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、時を表す語句で過去・現在・未来を使い分ける・形の変化に注意した書きかえ・疑問詞＋be going to・2か所の誤り・感嘆文の What と How・複数の空所・使わない語のある並べかえ・英作文・オリジナルの対話と予定表の読み取り・be going to と will の違い、の形にした。並べかえは与えた語を変える答えを認めない。')
