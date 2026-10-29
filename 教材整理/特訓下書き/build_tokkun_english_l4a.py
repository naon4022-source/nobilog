# coding: utf-8
"""英語1年 Lesson 4 前半（三人称単数現在 likes・doesn't）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p42〜43・p45（語句）・p48〜53・p112（主語が3人称単数で現在のときの動詞の -s／-es／ies／has、
doesn't ＋動詞のもとの形、複数の主語との区別、他者紹介の表現、Lesson 1〜3の文）。
使わないもの：Does ～?・How many ～?・some/any（Lesson 4後半）、him・her・his などの代名詞の目的格・所有格（Lesson 6）。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l4a', "三人称単数現在（likes・doesn't）（特訓）", 'Lesson 4', '英語', 1,
         {42: 'source-0461', 43: 'source-0461', 45: 'source-0462', 48: 'source-0464', 49: 'source-0464', 50: 'source-0465', 51: 'source-0465',
          52: 'source-0466', 53: 'source-0466', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l4a.json', '確認済み/workbook-english-1-l4b.json', '確認済み/workbook-english-1-l3a.json'])
X = u.X
TW = '（　）内の動詞を、主語に合う正しい形にして順に書こう（カンマで区切る）。'
SP = '次の3つの動詞に s または es をつけた形（3人称単数現在の形）を、順に書こう（カンマで区切る）。'
NEG = '次の文を否定文にしよう。'
SUB = '次の文の主語を［　］の語句にかえて、全文を書こう。'
FIX = '次の英文には誤りが2か所ある。正しく直して全文を書こう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. 主語に合わせて動詞の形を使い分ける ──
X(42, TW + '（play）\nI (　) tennis. My brother (　) soccer.', seq('play', 'plays'), expl='I には play、My brother（3人称単数）には plays。')
X(42, TW + '（study）\nWe (　) English every day. Ken (　) Japanese every day.', seq('study', 'studies'), expl='We には study。Ken には y を i にかえて es をつけ studies。')
X(42, TW + '（go）\nMy sister (　) to the library every Sunday. I (　) to the park.', seq('goes', 'go'), expl='My sister には es をつけて goes、I には go。')
X(50, TW + '（practice）\nJun and I (　) soccer. Jun (　) soccer every morning, too.', seq('practice', 'practices'), expl='Jun and I は複数なので practice。Jun（1人）には practices。')
X(50, TW + '（have）\nShe (　) a white cat. They (　) two dogs.', seq('has', 'have'), expl='She には has（have の3人称単数の形）。They には have。')
X(50, TW + '（watch）\nMy father (　) TV after dinner. My brothers (　) movies on Sundays.', seq('watches', 'watch'), expl='My father には es をつけて watches。My brothers は複数なので watch。')
X(53, TW + '（speak）\nMr. Kato (　) English well. We (　) English in class, too.', seq('speaks', 'speak'), expl='Mr. Kato には speaks、We には speak。')
X(43, TW + '（make）\nEri (　) lunch every Sunday. Eri and Yuka (　) a cake on Saturdays.', seq('makes', 'make'), expl='Eri（1人）には makes、Eri and Yuka（2人）には make。')

# ── B. s・es のつけ方 ──
X(42, SP + '\nlike / watch / study', seq('likes', 'watches', 'studies'), expl='like はそのまま s。ch で終わる watch は es。子音字＋y の study は y を i にかえて es。')
X(42, SP + '\ngo / have / play', seq('goes', 'has', 'plays'), expl='go は es。have は不規則に has。母音字＋y の play はそのまま s。')
X(45, SP + '\nteach / know / try', seq('teaches', 'knows', 'tries'), expl='ch で終わる teach は es。know はそのまま s。子音字＋y の try は tries。')

# ── C. 否定文（動詞をもとの形にもどす／主語の数に注意） ──
X(42, NEG + '\nAki eats natto.', ev("Aki doesn't eat natto."), expl='doesn\'t のあとは s をとったもとの形 eat。')
X(42, NEG + '\nMy brother has a smartphone.', ev("My brother doesn't have a smartphone."), expl='has を doesn\'t のあとではもとの形 have にもどす。')
X(42, '次の文を否定文にし、さらに「彼女は英語を話します。」と続けよう。\nMs. Allen speaks Japanese.', ev("Ms. Allen doesn't speak Japanese. She speaks English."), expl='否定文は doesn\'t speak。続く文は She が主語なので speaks。')
X(42, NEG + '\nKen and Mai like fish.', ev("Ken and Mai don't like fish."), expl='Ken and Mai は複数なので doesn\'t ではなく don\'t。')
X(42, NEG + '\nTom watches TV every night.', ev("Tom doesn't watch TV every night."), expl='doesn\'t のあとはもとの形 watch（es をとる）。')
X(42, NEG + '\nMy sister goes to the library on Saturdays.', ev("My sister doesn't go to the library on Saturdays."), expl='doesn\'t のあとはもとの形 go（es をとる）。')

# ── D. 主語をかえる ──
X(42, SUB + '\nI like vegetables.［She］', ev('She likes vegetables.'), expl='主語が She（3人称単数）なので likes。')
X(42, SUB + '\nI don\'t like fish.［He］', ev("He doesn't like fish."), expl='主語が He なので don\'t を doesn\'t にかえる。like はそのまま。')
X(49, SUB + '\nWe have two birds.［Sachi］', ev('Sachi has two birds.'), expl='主語が Sachi なので have を has にかえる。')
X(49, SUB + '\nWe walk the dog every morning.［Kenta］', ev('Kenta walks the dog every morning.'), expl='主語が Kenta なので walks。')
X(53, SUB + '\nI study English hard.［My brother］', ev('My brother studies English hard.'), expl='主語が My brother なので studies。')
X(42, SUB + '\nYou don\'t eat breakfast.［Ken］', ev("Ken doesn't eat breakfast."), expl='主語が Ken なので doesn\'t eat。')

# ── E. 2か所の誤り ──
X(45, FIX + '\nMy father cook dinner. He make curry.', ev('My father cooks dinner. He makes curry.'), expl='主語が My father・He なので cooks・makes。')
X(42, FIX + '\nShe don\'t like dogs. She like cats.', ev("She doesn't like dogs. She likes cats."), expl='She の否定は doesn\'t。肯定文では likes。')
X(42, FIX + '\nKen doesn\'t plays tennis. He play soccer.', ev("Ken doesn't play tennis. He plays soccer."), expl='doesn\'t のあとはもとの形 play。肯定文では plays。')
X(50, FIX + '\nMy sister haves a cat. She don\'t have a dog.', ev("My sister has a cat. She doesn't have a dog."), expl='have の3人称単数の形は has。否定は doesn\'t。')
X(50, FIX + '\nTom studys Japanese every day. He watchs anime.', ev('Tom studies Japanese every day. He watches anime.'), expl='study→studies（y を i にかえて es）、watch→watches（ch で終わるので es）。')
X(50, FIX + '\nMy brothers plays soccer. They practices every day.', ev('My brothers play soccer. They practice every day.'), expl='My brothers・They は複数なので s をつけない。')
X(53, FIX + '\nMs. Abe is speak English. She teach music.', ev('Ms. Abe speaks English. She teaches music.'), expl='一般動詞の文に is は不要で speaks。teach は es をつけて teaches。')
X(42, FIX + '\nAya don\'t eats natto.', ev("Aya doesn't eat natto."), expl='Aya の否定は doesn\'t。doesn\'t のあとはもとの形 eat。')

# ── F. メモ・表から紹介する ──
X(43, '〈アンケート〉ネコが好き：ユキ＝はい、アイ＝いいえ\n表に合うように、（　）に入る語を順に書こう（カンマで区切る）。\nYuki (　) cats, but Ai (　) like cats.', seq('likes', "doesn't") + seq('likes', 'does not'), expl='ユキは好き（likes）、アイは好きではない（doesn\'t like）。')
X(52, '〈メモ〉兄：福岡に住んでいる・音楽が好き\nメモに合うように、（　）に入る語を順に書こう（カンマで区切る）。\nMy brother (　) in Fukuoka. He (　) music.', seq('lives', 'likes'), expl='主語が My brother・He なので lives・likes。')
X(52, '〈メモ〉友達のトム：オーストラリア出身・毎日日本語を勉強する\nメモをもとに、トムを紹介する英文を2文で書こう（2文目は He で始める）。', ev('Tom is from Australia. He studies Japanese every day.', 'My friend Tom is from Australia. He studies Japanese every day.'), expl='「～出身」は is from ～。2文目は He studies ～.')
X(52, '〈メモ〉姉：英語の先生・朝食を食べない\nメモをもとに、姉を紹介する英文を2文で書こう（2文目は She で始める）。', ev("My sister is an English teacher. She doesn't eat breakfast."), expl='an English teacher（English は母音で始まるので an）。2文目は doesn\'t eat。')
X(52, '〈メモ〉久美：イヌ2匹とネコ1匹を飼っている・料理が得意\nメモをもとに、久美を紹介する英文を2文で書こう（2文目は She で始める）。', ev('Kumi has two dogs and a cat. She is good at cooking.', "Kumi has two dogs and a cat. She's good at cooking."), expl='「飼っている」は has。「料理が得意」は is good at cooking。')
X(52, '〈メモ〉グリーン先生：カナダ出身・毎朝走る\nメモをもとに、グリーン先生（女性）を紹介する英文を2文で書こう（2文目は She で始める）。', ev('Ms. Green is from Canada. She runs every morning.'), expl='2文目は She runs ～.（run に s をつける）。')

# ── G. 使わない語が1つある並べかえ ──
X(42, NG + '\n私の母は毎朝コーヒーを飲みます。（ my mother / drinks / drink / coffee / every morning ）.', ev('My mother drinks coffee every morning.', contract=False), expl='My mother には drinks。drink は使わない。')
X(42, NG + '\n私の兄は魚を食べません。（ my brother / doesn\'t / don\'t / eat / fish ）.', ev("My brother doesn't eat fish.", contract=False), expl='My brother の否定は doesn\'t。don\'t は使わない。')
X(53, NG + '\n彼女は日本語をじょうずに話します。（ she / speaks / speak / Japanese / well ）.', ev('She speaks Japanese well.', contract=False), expl='She には speaks。speak は使わない。')
X(49, NG + '\n健は毎日イヌの散歩をします。（ Ken / the dog / walks / walk / every day ）.', ev('Ken walks the dog every day.', contract=False), expl='Ken には walks。walk は使わない。')
X(50, NG + '\n私の父はよく料理をします。（ my father / often / cooks / cook ）.', ev('My father often cooks.', contract=False), expl='often は動詞の前に置く。My father には cooks。cook は使わない。')
X(42, NG + '\n彼らは日曜日にサッカーをします。（ they / play / plays / soccer / on Sundays ）.', ev('They play soccer on Sundays.', contract=False), expl='They は複数なので play。plays は使わない。')
X(43, NG + '\nマイは雑誌を読みません。（ Mai / doesn\'t / read / reads / magazines ）.', ev("Mai doesn't read magazines.", contract=False), expl='doesn\'t のあとはもとの形 read。reads は使わない。')
X(49, NG + '\nサチはテニスが得意です。（ Sachi / is / does / good / at / tennis ）.', ev('Sachi is good at tennis.', contract=False), expl='good は形容詞なので be動詞 is。does は使わない。')

# ── H. オリジナルの紹介文を読んで答える ──
P1 = '次の紹介文を読んで答えよう。\nThis is my friend, Lisa. She is from London. She likes Japanese food. She eats sushi every week. But she doesn\'t eat natto. She plays the violin well.\n'
P2 = '次の文章を読んで答えよう。\nMy family has a dog, Kuro. My father walks Kuro every morning. My mother doesn\'t walk Kuro. She cooks breakfast. My brother and I play with Kuro after school.\n'
P3 = '次の紹介文を読んで答えよう。\nLook at this picture. This is Ryo. He is my brother. He plays the drums in a band. He practices every evening. He can\'t sing well, but he writes songs.\n'
u.strip = (P1, P2, P3, TW, SP, NEG, SUB, FIX, NG, WR)  # 共通の指示文・本文は、似ている度の計算から外す
X(52, P1 + '問い：リサはどこの出身か。日本語で答えよう。', ['ロンドン', 'ロンドン出身'], expl='She is from London. から。')
X(52, P1 + '問い：リサが食べないものは何か。日本語で答えよう。', ['納豆', 'なっとう'], expl='But she doesn\'t eat natto. から。')
X(52, P1 + '問い：紹介文の内容に合うものを選ぼう。\nア リサは毎週すしを食べる。　イ リサは納豆が好きである。　ウ リサはバイオリンが苦手である。', ['ア'], expl='She eats sushi every week. から、ア。納豆は食べず、バイオリンはじょうず。')
X(49, P2 + '問い：毎朝クロの散歩をするのはだれか。日本語で答えよう。', ['父', '父親', 'お父さん', '書いた人の父'], expl='My father walks Kuro every morning. から。')
X(45, P2 + '問い：書いた人の母は、朝に何をするか。日本語で答えよう。', ['朝食を作る', '朝ごはんを作る', '朝食をつくる', '朝食を料理する'], expl='She cooks breakfast. から。')
X(49, P2 + '問い：本文の内容に合うように、（　）に入る語を書こう。\nMy mother (　) walk Kuro.', ["doesn't", 'does not'], expl='My mother doesn\'t walk Kuro. と書かれている。主語が3人称単数なので doesn\'t。')
X(49, P3 + '問い：リョウがバンドで演奏する楽器は何か。日本語で答えよう。', ['ドラム', 'ドラムス', 'たいこ'], expl='He plays the drums in a band. から。')
X(49, P3 + '問い：リョウが毎晩することは何か。日本語で答えよう。', ['練習', '練習する', '練習すること', 'ドラムの練習', 'バンドの練習'], expl='He practices every evening. から、練習。')
X(49, P3 + '問い：リョウができないことは何か。日本語で答えよう。', ['じょうずに歌うこと', '歌うこと', 'じょうずに歌う', '上手に歌うこと'], expl='He can\'t sing well から。歌は書く（writes songs）。')

# ── I. 似た文から正しい文を選ぶ ──
X(42, '「健はイヌが好きです。」' + SEL + '\nア Ken like dogs.　イ Ken likes dogs.　ウ Ken is like dogs.', ['イ'], expl='主語が Ken（3人称単数）なので likes。is は不要。')
X(42, '「彼女はテニスをしません。」' + SEL + '\nア She don\'t play tennis.　イ She doesn\'t plays tennis.　ウ She doesn\'t play tennis.', ['ウ'], expl='doesn\'t ＋もとの形 play。')
X(50, '「私の兄は本をたくさん持っています。」' + SEL + '\nア My brother haves many books.　イ My brother has many books.　ウ My brother have many books.', ['イ'], expl='have の3人称単数の形は has。')
X(50, '「健と私は毎日走ります。」' + SEL + '\nア Ken and I runs every day.　イ Ken and I run every day.　ウ Ken and I am run every day.', ['イ'], expl='Ken and I は複数なので run（s をつけない）。')
X(42, '「彼女は日本語を勉強します。」' + SEL + '\nア She studys Japanese.　イ She studies Japanese.　ウ She studyes Japanese.', ['イ'], expl='study は y を i にかえて es。')
X(42, '「父は朝食を作りません。」' + SEL + '\nア My father doesn\'t make breakfast.　イ My father doesn\'t makes breakfast.　ウ My father isn\'t make breakfast.', ['ア'], expl='一般動詞の否定は doesn\'t ＋もとの形 make。')

# ── J. 主語が3人称単数かどうかを見分ける ──
X(50, '次のうち、（　）に plays が入るものを選ぼう。\nア I (　) tennis.　イ My sister (　) tennis.　ウ My sisters (　) tennis.', ['イ'], expl='3人称単数（My sister）のときだけ plays。My sisters は複数。')
X(42, '次のうち、（　）に doesn\'t が入るものを選ぼう。\nア They (　) like fish.　イ You (　) like fish.　ウ Mr. Kato (　) like fish.', ['ウ'], expl='Mr. Kato は3人称単数なので doesn\'t。They・You は don\'t。')
X(50, '次のうち、主語が3人称単数のものを選ぼう。\nア Ken and I　イ My mother　ウ You', ['イ'], expl='I・you 以外の1人（1つ）が3人称単数。Ken and I は複数、You は2人称。')
X(42, '次のうち、（　）に goes が入らないものを選ぼう。\nア Mai (　) to school.　イ He (　) to the park.　ウ We (　) to the library.', ['ウ'], expl='We は複数なので go。')

# ── K. 英作文 ──
X(52, WR + '\n私の姉は英語をじょうずに話します。', ev('My sister speaks English well.'), expl='My sister には speaks。well は文の最後。')
X(42, WR + '\n健はピアノをひきません。でも、ギターをひきます。（2文目は he を使う）', ev("Ken doesn't play the piano. But he plays the guitar.", "Ken doesn't play the piano, but he plays the guitar."), expl='否定は doesn\'t play、肯定は plays。')
X(42, WR + '\n私の母は毎日公園で走ります。', ev('My mother runs in the park every day.'), expl='My mother には runs。')
X(45, WR + '\n彼は数学が好きではありません。彼は英語が好きです。', ev("He doesn't like math. He likes English."), expl='doesn\'t like と likes を使い分ける。')
X(52, WR + '\n彼女は毎晩10時に寝ます。', ev('She goes to bed at ten every night.', 'She goes to bed at 10 every night.'), expl='go to bed の go に es をつけて goes。')
X(52, WR + '\nグリーン先生は日本に住んでいます。彼女は日本料理を作ります。', ev('Ms. Green lives in Japan. She makes Japanese food.', 'Ms. Green lives in Japan. She cooks Japanese food.'), expl='lives と makes（cooks）を使う。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp42〜43（Lesson4 Part1の基本文・ポイント・A・B）、p45（語句）、p48〜49（まとめテスト）、p50〜51（文法のまとめ・Project）、p52〜53（場面別ドリル）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、同じ動詞を主語によって使い分ける・s／es のつけ方の規則・複数の主語のわな・主語をかえる書きかえ・2か所の誤り・メモからの紹介文・使わない語のある並べかえ・オリジナルの紹介文の読み取り・3人称単数の判断・英作文、の形にした。Does ～?・How many・him/her などは使っていない。')
