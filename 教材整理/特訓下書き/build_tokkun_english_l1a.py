# coding: utf-8
"""英語1年 Lesson 1（I am ～./I like ～./Are you ～?/Do you ～?）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p6〜11・p16〜17・p30〜31（be動詞 am/are・一般動詞・否定文・疑問文と答え方・want to・good at・
like ～ing・Please call me ～・Look at ～・too・but）。
使わないもの：can（Lesson 1の後半）、he/she/it と is の文（My name is ～ だけ使う）、What などの疑問詞。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l1a', 'I am ～.／I like ～.／Are you ～?／Do you ～?（特訓）', 'Lesson 1', '英語', 1,
         {6: 'source-0443', 7: 'source-0443', 8: 'source-0444', 9: 'source-0444', 10: 'source-0445', 11: 'source-0445',
          16: 'source-0448', 17: 'source-0448', 30: 'source-0455', 31: 'source-0455'},
         '英語ワーク', ['確認済み/workbook-english-1-l1a.json', '確認済み/workbook-english-1-l1b.json', '確認済み/workbook-english-1-review.json'])
X, R = u.X, u.R
QA = '対話が成り立つように、Aの質問を（　）内の語を使って英語で書こう。'
FIX = '次の対話（または文）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
CH = '対話の流れに合うように、Bの（　）に入るものを選ぼう。\nア Yes, I am.　イ No, I\'m not.　ウ Yes, I do.　エ No, I don\'t.'
WR = '次の日本語を英語で書こう。'
NG = '日本語に合うように、（　）内の語を並べかえて全文を書こう。ただし、使わない語が1つある。'
BL = '対話の（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'

# ── A. 答えから質問を組み立てる（be動詞か do かを判断する） ──
X(9, QA + '（hungry）\nA: (　)\nB: Yes, I am. I want to eat lunch.', ev('Are you hungry?'), expl='B が Yes, I am. と答えているので be動詞の疑問文。Are you hungry?')
X(10, QA + '（play / the guitar）\nA: (　)\nB: No, I don\'t. I play the drums.', ev('Do you play the guitar?'), expl='B が No, I don\'t. と答えているので一般動詞の疑問文。Do you play the guitar?')
X(9, QA + '（from / Kyoto）\nA: (　)\nB: No, I\'m not. I\'m from Nara.', ev('Are you from Kyoto?'), expl='No, I\'m not. で答えるのは Are you ～? の疑問文。')
X(10, QA + '（like / natto）\nA: (　)\nB: Yes, I do. I eat natto for breakfast.', ev('Do you like natto?'), expl='Yes, I do. で答えるのは Do you ～? の疑問文。')
X(17, QA + '（on / the tennis team）\nA: (　)\nB: Yes, I am. I play tennis every day.', ev('Are you on the tennis team?'), expl='「テニス部の一員」は on the tennis team。be動詞の疑問文 Are you on the tennis team?')
X(31, QA + '（want to / play / soccer）\nA: (　)\nB: Yes, I do. I love soccer.', ev('Do you want to play soccer?'), expl='want は一般動詞なので Do you want to ～? でたずねる。')
X(31, QA + '（good at / math）\nA: (　)\nB: Yes, I am. I study math every day.', ev('Are you good at math?'), expl='be good at ～「～が得意だ」は be動詞の文なので Are you good at math?')
X(11, QA + '（know / Tokyo Tower）\nA: (　)\nB: Yes, I do. I love Tokyo Tower.', ev('Do you know Tokyo Tower?'), expl='know は一般動詞なので Do you know ～?')

# ── B. 2か所の誤りを直す（質問と答えのつじつま） ──
X(10, FIX + '\nAre you like cats? — Yes, I am.', ev('Do you like cats? Yes, I do.'), expl='like は一般動詞なので Do you like ～? にし、答えも Yes, I do. にする。')
X(9, FIX + '\nDo you a fan of this team? — Yes, I do.', ev('Are you a fan of this team? Yes, I am.'), expl='「ファンですか」は be動詞の文なので Are you ～? にし、答えも Yes, I am. にする。')
X(7, FIX + '\nI am not play the piano. I am play the guitar.', ev("I don't play the piano. I play the guitar."), expl='一般動詞 play の否定は don\'t play。肯定文に am は不要。')
X(9, FIX + '\nAre you from Canada? — No, I don\'t. I from Australia.', ev("Are you from Canada? No, I'm not. I'm from Australia."), expl='Are you ～? には No, I\'m not. と答える。「～出身です」は I\'m from ～. で am が必要。')
X(9, FIX + '\nDo you busy now? — Yes, I do.', ev('Are you busy now? Yes, I am.'), expl='busy は形容詞なので be動詞の疑問文 Are you busy? にし、Yes, I am. と答える。')
X(17, FIX + '\nI like play tennis. I don\'t on the tennis team.', ev("I like playing tennis. I'm not on the tennis team.", "I like to play tennis. I'm not on the tennis team."), expl='like のあとは playing（または to play）。on the team の否定は be動詞の否定 I\'m not。')
X(10, FIX + '\nYou is my friend. Are you like music?', ev('You are my friend. Do you like music?'), expl='you のときの be動詞は are。like は一般動詞なので Do you like ～?')
X(31, FIX + '\nI hungry. I am want to eat lunch.', ev("I'm hungry. I want to eat lunch."), expl='「おなかがすいている」は I\'m hungry.（am が必要）。want は一般動詞なので am は不要。')

# ── C. 対話の流れから答え方を選ぶ ──
X(9, CH + '\nA: Are you from Osaka?\nB: (　) I\'m from Kobe.', ['イ'], expl='Are you ～? の質問で、あとに「神戸出身」と続くので No, I\'m not.')
X(10, CH + '\nA: Do you have a pet?\nB: (　) I have two dogs.', ['ウ'], expl='Do you ～? の質問で、あとに「犬を2匹飼っている」と続くので Yes, I do.')
X(17, CH + '\nA: Do you play the violin?\nB: (　) But I play the piano.', ['エ'], expl='But「でも」でピアノをひくと続くので、バイオリンはひかない。No, I don\'t.')
X(9, CH + '\nA: Are you a member of the brass band?\nB: (　) I play the trumpet in the band.', ['ア'], expl='Are you ～? の質問で、そのバンドでトランペットをふいていると続くので Yes, I am.')
X(9, CH + '\nA: Are you busy today?\nB: (　) I\'m free today.', ['イ'], expl='「今日はひま」と続くので、忙しくない。No, I\'m not.')
X(8, CH + '\nA: I like natto. Do you like natto, too?\nB: (　) I eat natto every day.', ['ウ'], expl='Do you ～? の質問で、毎日食べると続くので Yes, I do.')
X(9, CH + '\nA: Are you a soccer fan?\nB: (　) I watch soccer on TV every day.', ['ア'], expl='毎日テレビでサッカーを見ると続くので、サッカーファンである。Yes, I am.')
X(30, CH + '\nA: Do you know Tokyo Tower?\nB: (　) I want to know about Tokyo Tower.', ['エ'], expl='「東京タワーについて知りたい」と続くので、知らない。No, I don\'t.')

# ── D. 2つの内容をふくむ英作文 ──
X(8, WR + '（but を使って1文で）\n私はネコが好きですが、ネコを飼っていません。', ev("I like cats, but I don't have a cat.", "I like cats, but I don't have cats.", "I like cats but I don't have a cat.", "I like cats but I don't have cats."), expl='「～が好き」は like、「飼っていない」は don\'t have。2つを but でつなぐ。')
X(9, WR + '\nあなたは中学生ですか。—はい、そうです。（質問と答えを続けて書く）', ev('Are you a junior high school student? Yes, I am.'), expl='be動詞の疑問文 Are you a junior high school student? に、Yes, I am. と答える。')
X(17, WR + '\n私はテニス部の一員です。私は毎日テニスをします。', ev("I'm on the tennis team. I play tennis every day."), expl='「～部の一員」は on the ～ team（be動詞の文）、「テニスをする」は play tennis（一般動詞の文）。')
X(31, WR + '\n私はスポーツが得意ではありません。でも、スポーツを見ることは好きです。', ev("I'm not good at sports. But I like watching sports.", "I'm not good at sports, but I like watching sports.", "I'm not good at sports. But I like to watch sports.", "I'm not good at sports, but I like to watch sports."), expl='「得意ではない」は I\'m not good at ～。「見ることが好き」は like watching（like to watch）。')
X(8, WR + '\n私をケンと呼んでください。私は京都出身です。', ev("Please call me Ken. I'm from Kyoto."), expl='Please call me ～. と I\'m from ～. の2文。')
X(10, WR + '\nあなたは英語を話しますか。—いいえ、話しません。私は日本語を話します。', ev("Do you speak English? No, I don't. I speak Japanese."), expl='Do you speak ～? に No, I don\'t. と答え、I speak Japanese. を続ける。')
X(31, WR + '（want to と well を使う）\n私はピアノをじょうずにひきたいです。', ev('I want to play the piano well.'), expl='「～したい」は want to ～、「じょうずに」は well で文の終わりに置く。')
X(11, WR + '\nこの写真を見て。あなたは東京タワーを知っていますか。', ev('Look at this picture. Do you know Tokyo Tower?'), expl='「～を見て」は Look at ～.、「知っていますか」は Do you know ～?')

# ── E. 2つの操作を続けて行う書きかえ ──
X(9, '次の文を疑問文にし、No で答え、さらに「私は青森出身です。」と続けよう（3文）。\nYou are from Hokkaido.', ev("Are you from Hokkaido? No, I'm not. I'm from Aomori."), expl='be動詞の疑問文は Are you ～?。No, I\'m not. のあとに I\'m from Aomori.')
X(10, '次の文を疑問文にして、Yes で答える文も続けて書こう。\nYou play basketball every day.', ev('Do you play basketball every day? Yes, I do.'), expl='一般動詞の疑問文は Do you ～?、答えは Yes, I do.')
X(7, '次の文を否定文にし、さらに「私はネコが好きです。」と続けよう。\nI like dogs.', ev("I don't like dogs. I like cats."), expl='一般動詞の否定文は don\'t like。I like cats. を続ける。')
X(17, '次の文を、「あなたは～ですか」とたずねる疑問文に書きかえよう。\nI\'m on the volleyball team.', ev('Are you on the volleyball team?'), expl='主語を you にかえ、be動詞 are を前に出す。')
X(16, '次の質問に No で答え、さらに「私は新しいスマートフォンがほしいです。」と続けよう。\nDo you want a new bag?', ev("No, I don't. I want a new smartphone."), expl='Do you ～? への No の答えは No, I don\'t.。want a new smartphone を続ける。')
X(7, '次の否定文を、「あなたは～しますか」とたずねる疑問文に書きかえよう。\nI don\'t eat breakfast.', ev('Do you eat breakfast?'), expl='主語を you にして Do you eat breakfast? とする（don\'t は使わない）。')

# ── F. 同じ意味の文への言いかえ ──
X(31, '次の文を、good at を使ってほぼ同じ意味の文に書きかえよう。\nI play tennis well.', ev("I'm good at tennis.", "I'm good at playing tennis."), expl='「テニスがじょうず」→「テニスが得意」は be good at ～。')
X(30, '次の文を、to を使って同じ意味の文に書きかえよう。\nI like playing the guitar.', ev('I like to play the guitar.'), expl='like ～ing と like to ～ は、どちらも「～することが好き」。')
X(30, '次の文を、My name を使って同じ意味の文に書きかえよう。\nI am Sato Ken.', ev('My name is Sato Ken.'), expl='「私は～です」は「私の名前は～です」と言いかえられる。My name is ～.')

# ── G. 似た文から正しい文を選ぶ ──
X(10, '「あなたはテニスが好きですか。」の英文として正しいものを選ぼう。\nア Are you like tennis?　イ Do you like tennis?　ウ Do you are like tennis?', ['イ'], expl='like は一般動詞なので Do you like ～?')
X(7, '「私は野球をしません。」の英文として正しいものを選ぼう。\nア I am not play baseball.　イ I not play baseball.　ウ I don\'t play baseball.', ['ウ'], expl='一般動詞の否定は don\'t ＋動詞。')
X(9, '「あなたは忙しいですか。」の英文として正しいものを選ぼう。\nア Do you busy?　イ Are you busy?　ウ You busy?', ['イ'], expl='busy は形容詞なので be動詞の疑問文。')
X(7, '「私はトマトが好きではありません。」の英文として正しいものを選ぼう。\nア I don\'t like tomatoes.　イ I\'m not like tomatoes.　ウ I don\'t am like tomatoes.', ['ア'], expl='一般動詞 like の否定は don\'t like。am と like をいっしょに使わない。')
X(9, '「あなたはカナダ出身ですか。—いいえ、ちがいます。」の英文として正しいものを選ぼう。\nア Are you from Canada? — No, I don\'t.　イ Are you from Canada? — No, I\'m not.　ウ Do you from Canada? — No, I\'m not.', ['イ'], expl='Are you ～? には be動詞で答える。No, I\'m not.')
X(30, '「私は朝食にトーストを食べます。」の英文として正しいものを選ぼう。\nア I eat toast for breakfast.　イ I am eat toast for breakfast.　ウ I eat for breakfast toast.', ['ア'], expl='一般動詞の文に am は不要。「何を」（toast）は動詞のすぐあと。')

# ── H. 使わない語が1つある並べかえ ──
X(9, NG + '\n私はサッカーファンです。（ am / a / do / I / soccer / fan ）.', ev("I am a soccer fan.", contract=False), expl='be動詞の文なので do は使わない。I am a soccer fan.')
X(9, NG + '\nあなたは千葉出身ですか。（ from / do / you / are / Chiba ）?', ev('Are you from Chiba?', contract=False), expl='「～出身ですか」は be動詞の疑問文。do は使わない。')
X(7, NG + '\n私はピアノをひきません。（ don\'t / am / play / I / the / piano ）.', ev("I don't play the piano.", contract=False), expl='一般動詞の否定文なので am は使わない。')
X(10, NG + '\nあなたは毎日理科を勉強しますか。（ study / are / science / every / do / you / day ）?', ev('Do you study science every day?', contract=False), expl='study は一般動詞なので Do you ～?。are は使わない。')
X(31, NG + '\n私はおなかがすいていません。（ not / hungry / don\'t / I\'m ）.', ev("I'm not hungry.", contract=False), expl='hungry は形容詞なので be動詞の否定 I\'m not。don\'t は使わない。')
X(31, NG + '\n私はバスケットボールがしたいです。（ basketball / to / play / want / I / am ）.', ev('I want to play basketball.', contract=False), expl='want は一般動詞なので am は使わない。I want to play basketball.')
X(9, NG + '\nあなたは吹奏楽部の部員ですか。（ a / member / of / you / are / do / the / brass band ）?', ev('Are you a member of the brass band?', contract=False), expl='「部員ですか」は be動詞の疑問文。do は使わない。')
X(8, NG + '\n私をユイと呼んでください。（ call / please / me / I / Yui ）.', ev('Please call me Yui.', contract=False), expl='Please call me ～.「私を～と呼んでください」。I は使わない。')

# ── I. オリジナルの対話・自己紹介文を読んで答える ──
P1 = '次の対話を読んで答えよう。\nKen: Hi, I\'m Ken. I\'m from Osaka. Are you from Tokyo?\nMia: No, I\'m not. I\'m from Canada. I like Japanese food.\nKen: Do you like natto?\nMia: Yes, I do. I eat natto for breakfast. But I don\'t like tomatoes.\n'
P2 = '次の自己紹介を読んで答えよう。\nHello, everyone. I\'m Sato Riku. Please call me Riku. I\'m on the basketball team. I play basketball every day. I like music, too. I don\'t play the guitar, but I play the drums. Do you like music?\n'
P3 = '次のメールを読んで答えよう。\nHi, Emma. I\'m Yuki. I\'m thirteen. I\'m in the science club. I like reading comic books. Are you from Australia? I want to know about Australia.\n'
u.strip = (P1, P2, P3, QA, FIX, CH, WR, NG, BL)  # 共通の指示文と本文は、似ている度の計算から外す（問いの中身だけで比べる）
X(17, P1 + '問い：ミアはどこの出身か。日本語で答えよう。', ['カナダ', 'カナダ出身'], expl='Mia は I\'m from Canada. と言っている。')
X(17, P1 + '問い：ミアになったつもりで、次の質問に英語で答えよう。\nDo you eat natto for breakfast?', ev('Yes, I do.'), expl='ミアは I eat natto for breakfast. と言っているので Yes, I do.')
X(17, P1 + '問い：対話の内容に合うものを選ぼう。\nア ケンは東京出身である。　イ ミアはトマトが好きではない。　ウ ミアは日本の食べ物が好きではない。', ['イ'], expl='Mia の最後の文 But I don\'t like tomatoes. から、イが正しい。ケンは大阪出身、ミアは日本の食べ物が好き。')
X(8, P2 + '問い：リクは何部の一員か。日本語で答えよう。', ['バスケットボール部', 'バスケットボール', 'バスケ部', 'バスケットボールチーム'], expl='I\'m on the basketball team. から、バスケットボール部。')
X(8, P2 + '問い：リクが演奏する楽器は何か。日本語で答えよう。', ['ドラム', 'ドラムス', 'たいこ'], expl='I don\'t play the guitar, but I play the drums. から、ドラム（ギターはひかない）。')
X(8, P2 + '問い：リクになったつもりで、次の質問に英語で答えよう。\nDo you play the guitar?', ev("No, I don't."), expl='リクは I don\'t play the guitar と言っているので No, I don\'t.')
X(30, P3 + '問い：ユキは何歳か。数字で答えよう。', ['13', '13歳', '十三', '十三歳'], expl='I\'m thirteen. から13歳。')
X(30, P3 + '問い：ユキが知りたいと思っていることは何か。日本語で答えよう。', ['オーストラリアについて', 'オーストラリアのこと', 'オーストラリア'], expl='I want to know about Australia. から、オーストラリアについて知りたい。')
X(30, P3 + '問い：ユキになったつもりで、次の質問に英語で答えよう。\nAre you in the music club?', ev("No, I'm not."), expl='ユキは科学部（science club）なので、音楽部ではない。No, I\'m not.')

# ── K. 対話の（　）を複数うめる ──
X(17, BL + '\nA: (　) you on the soccer team?\nB: No, I\'m (　). I\'m in the music club.\nA: (　) you play the piano?\nB: Yes, I (　).', seq('Are', 'not', 'Do', 'do'), expl='be動詞の疑問文 Are you ～? → No, I\'m not.、一般動詞の疑問文 Do you ～? → Yes, I do.')
X(9, BL + '\nA: Do you like baseball?\nB: Yes, I (　). I (　) a baseball fan.', seq('do', 'am'), expl='Do you ～? には do で答える。「ファンです」は be動詞 am。')
X(31, BL + '\nA: (　) you free now?\nB: Yes. I (　) to play tennis.', seq('Are', 'want'), expl='free は形容詞なので be動詞の疑問文 Are you ～?。「～したい」は want to ～。')
X(9, BL + '\nA: Are you from Japan?\nB: Yes, I (　). I\'m (　) Sapporo.', seq('am', 'from'), expl='Are you ～? には am で答える。「札幌出身」は from Sapporo。')
X(16, BL + '\nA: I (　) Japanese food. Do you like Japanese food, (　)?\nB: Yes, I do.', seq('like', 'too'), expl='「～も」は文の終わりに , too をつける。')
X(16, BL + '\nA: (　)(　) me Tom.\nB: OK, Tom. (　) you a student here?', seq('Please', 'call', 'Are'), expl='「私をトムと呼んでください」は Please call me Tom.。student は名詞なので be動詞の疑問文 Are you ～?')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp6〜11（Lesson1 Part1・2の基本文・ポイント・A・B）、p16〜17（まとめテスト）、p30〜31（場面別ドリル）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・1か所の誤り・並べかえ」より一段難しく、答えから質問を組み立てる・2か所の誤りを質問と答えのつじつまで直す・対話の流れから答え方を選ぶ・2つの内容の英作文・2つの操作の書きかえ・言いかえ・使わない語のある並べかえ・オリジナルの文章の読み取り・複数の空所、の形にした。単語を入れかえただけの問題は作っていない。can・3人称単数・疑問詞は使っていない。')
