# coding: utf-8
"""英語1年 Lesson 1 後半（can／My favorite ～ is ～. と自己紹介）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p12〜17・p30〜31・p112（I/We/He can ～・can't［cannot］・My favorite ～ is ～.・It's fun.・
This is ～./That is ～.・am/are/is の使い分け、Lesson 1前半の文）。
使わないもの：Can you ～?（Lesson 2）、What などの疑問詞、3人称単数の -s、isn't。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l1b', 'can／My favorite ～ is ～. と自己紹介（特訓）', 'Lesson 1', '英語', 1,
         {9: 'source-0444', 12: 'source-0446', 13: 'source-0446', 14: 'source-0447', 15: 'source-0447', 16: 'source-0448', 17: 'source-0448',
          30: 'source-0455', 31: 'source-0455', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l1b.json', '確認済み/workbook-english-1-l1a.json', '確認済み/workbook-english-1-review.json'])
X = u.X
BL = '日本語に合うように、（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'
FIX = '次の英文には誤りが2か所ある。正しく直して全文を書こう。'
WR = '次の日本語を英語で書こう。'
NG = '日本語に合うように、（　）内の語を並べかえて全文を書こう。ただし、使わない語が1つある。'
FL = '対話の流れに合うように、（　）に入る文を選ぼう。'
BE = '（　）に am・are・is から正しい語を入れ、順に書こう（カンマで区切る）。'

# ── A. 2つの文で、can／be動詞／一般動詞を使い分ける ──
X(12, BL + '\n私はギターをひくことができますが、ピアノはひけません。\nI (　) play the guitar, but I (　) play the piano.', seq('can', "can't") + seq('can', 'cannot'), expl='「ひくことができる」は can、「ひけない」は can\'t（cannot）。')
X(13, BL + '\n私の大好きなスポーツはテニスです。私はテニスをじょうずにすることができます。\nMy favorite sport (　) tennis. I (　) play tennis well.', seq('is', 'can'), expl='My favorite sport は「1つのもの」なので be動詞は is。「できる」は can。')
X(31, BL + '\n私はサッカーファンです。私は毎日サッカーをします。\nI (　) a soccer fan. I (　) soccer every day.', seq('am', 'play'), expl='「ファンです」は be動詞 am、「サッカーをする」は一般動詞 play。')
X(14, BL + '\n私はネコが好きではありません。でも、ネコをじょうずにかくことができます。\nI (　) like cats. But I (　) draw cats well.', seq("don't", 'can') + seq('do not', 'can'), expl='「好きではない」は一般動詞の否定 don\'t like、「かくことができる」は can draw。')
X(13, BL + '\n私の大好きな色は青です。それはすてきな色です。\nMy favorite color (　) blue. (　) a nice color.', seq('is', "It's") + seq('is', 'It is'), expl='My favorite color のあとは is。「それは～です」は It\'s（It is）。')
X(13, BL + '\n私たちはサッカーをすることができます。それは楽しいです。\nWe (　) play soccer. (　) fun.', seq('can', "It's") + seq('can', 'It is'), expl='「～できる」は主語が We でも can。「それは楽しい」は It\'s fun.')
X(14, BL + '\n私は京都出身です。私は漢字をじょうずに読むことができます。\nI (　) from Kyoto. I (　) read kanji well.', seq('am', 'can'), expl='「～出身です」は be動詞 am。「読むことができる」は can read。')
X(12, BL + '\n彼はギターをひくことができません。でも、ドラムはたたくことができます。\nHe (　) play the guitar. But he (　) play the drums.', seq("can't", 'can') + seq('cannot', 'can'), expl='主語が he でも can／can\'t の形は変わらない。')

# ── B. 2か所の誤りを直す ──
X(12, FIX + '\nI can swims well. I can\'t skating.', ev("I can swim well. I can't skate."), expl='can のあとの動詞はもとの形（swim・skate）。')
X(13, FIX + '\nMy favorite sport are soccer. Its fun.', ev("My favorite sport is soccer. It's fun."), expl='My favorite sport には is。「それは」は It\'s（It is の短縮形）で、Its ではない。')
X(12, FIX + '\nI am can run fast. I don\'t can swim.', ev("I can run fast. I can't swim.", 'I can run fast. I cannot swim.'), expl='can の文に am は不要。can の否定は can\'t（cannot）で、don\'t can とは言わない。')
X(14, FIX + '\nI can playing the koto. But I not can play the shamisen.', ev("I can play the koto. But I can't play the shamisen.", 'I can play the koto. But I cannot play the shamisen.'), expl='can のあとはもとの形 play。否定は can\'t（cannot）。')
X(13, FIX + '\nThis are my bag. My favorite color are red.', ev('This is my bag. My favorite color is red.'), expl='This や My favorite color のように「1つのもの」が主語のときの be動詞は is。')
X(13, FIX + '\nWe can plays tennis. It fun.', ev("We can play tennis. It's fun."), expl='can のあとはもとの形 play。「それは楽しい」は It\'s fun.（is が必要）。')
X(12, FIX + '\nHe can\'t sings well. He can dances well.', ev("He can't sing well. He can dance well.", 'He cannot sing well. He can dance well.'), expl='主語が he でも、can／can\'t のあとの動詞はもとの形。')
X(14, FIX + '\nI\'m can read hiragana. I can\'t reads kanji.', ev("I can read hiragana. I can't read kanji.", 'I can read hiragana. I cannot read kanji.'), expl='can の文に am（I\'m）は不要。can\'t のあとはもとの形 read。')

# ── C. メモの内容に合う文 ──
M1 = '〈アキのメモ〉できること：速く走る・英語を話す／できないこと：じょうずに泳ぐ・ギターをひく\n'
M2 = '〈リョウのメモ〉大好きな教科：音楽／できること：ピアノをひく／できないこと：ドラムをたたく\n'
M3 = '〈エミのメモ〉大好きなスポーツ：バドミントン（楽しい）／できないこと：スケート\n'
X(14, M1 + 'アキになったつもりで、メモに合う文を選ぼう。\nア I can swim well.　イ I can\'t run fast.　ウ I can speak English.', ['ウ'], expl='アキは英語を話すことができる。泳ぐことはできず、速く走ることはできる。')
X(14, M1 + 'アキになったつもりで、「速く走ることはできるが、じょうずに泳ぐことはできない」を but を使って1文で書こう。', ev("I can run fast, but I can't swim well.", "I can run fast but I can't swim well.", 'I can run fast, but I cannot swim well.', 'I can run fast but I cannot swim well.'), expl='can run fast と can\'t swim well を but でつなぐ。')
X(14, M2 + 'リョウの紹介文の（　）に入る語を順に書こう（カンマで区切る）。\nMy favorite (　) is music. I (　) play the piano, but I (　) play the drums.', seq('subject', 'can', "can't") + seq('subject', 'can', 'cannot'), expl='「大好きな教科」は favorite subject。ピアノはできる（can）、ドラムはできない（can\'t）。')
X(14, M2 + 'メモに合う文を選ぼう。\nア My favorite subject is the piano.　イ I can\'t play the drums.　ウ I can play the drums.', ['イ'], expl='リョウはドラムをたたくことができない。大好きな教科は音楽で、ピアノではない。')
X(13, M3 + 'エミになったつもりで、大好きなスポーツとその感想を2文で書こう。', ev("My favorite sport is badminton. It's fun."), expl='My favorite sport is badminton. のあとに It\'s fun. を続ける。')
X(14, M3 + 'メモの内容と合わないものを選ぼう。\nア I can\'t skate.　イ Badminton is my favorite sport.　ウ I can skate well.', ['ウ'], expl='エミはスケートができないので、ウが合わない。')

# ── D. 2つの内容をふくむ英作文 ──
X(12, WR + '\n私は速く走ることができます。でも、じょうずに泳ぐことはできません。', ev("I can run fast. But I can't swim well.", "I can run fast, but I can't swim well.", 'I can run fast. But I cannot swim well.', 'I can run fast, but I cannot swim well.'), expl='「～できる」は can、「～できない」は can\'t（cannot）。')
X(13, WR + '\n私の大好きな教科は英語です。それは楽しいです。', ev("My favorite subject is English. It's fun."), expl='My favorite subject is ～. と It\'s fun.')
X(15, WR + '（but を使って1文で）\n私はスキーができますが、スケートはできません。', ev("I can ski, but I can't skate.", "I can ski but I can't skate.", 'I can ski, but I cannot skate.', 'I can ski but I cannot skate.'), expl='「スキーをする」は ski、「スケートをする」は skate（どちらも動詞）。')
X(13, WR + '\nこれは私のギターです。私はギターをじょうずにひくことができます。', ev('This is my guitar. I can play the guitar well.'), expl='「これは～です」は This is ～.。「じょうずにひける」は can play ～ well。')
X(13, WR + '\n私の大好きなスポーツはバスケットボールです。私は毎日バスケットボールをします。', ev('My favorite sport is basketball. I play basketball every day.'), expl='My favorite sport is ～. のあとに、一般動詞の文 I play ～ every day. を続ける。')
X(14, WR + '\n私はケーキを作ることができます。でも、すしは作れません。', ev("I can make a cake. But I can't make sushi.", "I can make a cake, but I can't make sushi.", 'I can make a cake. But I cannot make sushi.', 'I can make a cake, but I cannot make sushi.'), expl='「作る」は make。can make と can\'t make を使う。')
X(14, WR + '\n私は三味線をひくことができます。それは楽しいです。', ev("I can play the shamisen. It's fun."), expl='「（楽器）をひく」は play the ～。It\'s fun. を続ける。')
X(12, WR + '\nあなたは英語を話しますか。—はい、話します。私は英語をじょうずに話すことができます。', ev("Do you speak English? Yes, I do. I can speak English well."), expl='Do you ～? の質問に Yes, I do. と答え、can の文を続ける。')

# ── E. 書きかえ ──
X(12, '次の文を、「～することができます」という意味の文に書きかえよう。\nI swim well.', ev('I can swim well.'), expl='動詞の前に can を置く。')
X(12, '次の文を否定文にし、さらに「でも、私は三味線をひくことができます。」と続けよう。\nI can play the koto.', ev("I can't play the koto. But I can play the shamisen.", "I can't play the koto, but I can play the shamisen.", 'I cannot play the koto. But I can play the shamisen.', 'I cannot play the koto, but I can play the shamisen.'), expl='can の否定は can\'t（cannot）。')
X(13, '次の文を、My favorite sport を使って「私の大好きなスポーツはサッカーです。」という文に書きかえよう。\nI like soccer.', ev('My favorite sport is soccer.'), expl='My favorite sport is ～. で「大好きなスポーツ」を言う。')
X(12, '次の文の主語を He にかえて、全文を書こう。\nI can\'t sing well.', ev("He can't sing well.", 'He cannot sing well.'), expl='can\'t は主語が he でも形が変わらず、sing もそのまま。')

# ── F. 似た文から正しい文を選ぶ ──
X(12, '「私は速く走ることができます。」の英文として正しいものを選ぼう。\nア I can runs fast.　イ I can run fast.　ウ I am can run fast.', ['イ'], expl='can ＋動詞のもとの形。am は不要。')
X(12, '「私は泳ぐことができません。」の英文として正しいものを選ぼう。\nア I don\'t can swim.　イ I can\'t swim.　ウ I can swim not.', ['イ'], expl='can の否定は can\'t（cannot）を動詞の前に置く。')
X(13, '「私の大好きな色は青です。」の英文として正しいものを選ぼう。\nア My favorite color am blue.　イ My favorite color is blue.　ウ I favorite color is blue.', ['イ'], expl='「私の」は My。My favorite color には is。')
X(13, '「それは楽しいです。」の英文として正しいものを選ぼう。\nア It fun.　イ Its fun.　ウ It\'s fun.', ['ウ'], expl='It is を短縮した It\'s を使う。Its は「それの」という意味。')
X(12, '「彼はスキーができます。」の英文として正しいものを選ぼう。\nア He can ski.　イ He cans ski.　ウ He can skis.', ['ア'], expl='can にも動詞にも s をつけない。')
X(13, '「これは私のペンです。」の英文として正しいものを選ぼう。\nア This is my pen.　イ This am my pen.　ウ This my pen is.', ['ア'], expl='This は1つのものなので is。This is my pen.')

# ── G. 使わない語が1つある並べかえ ──
X(12, NG + '\n私はじょうずに泳ぐことができます。（ can / swim / well / am / I ）.', ev('I can swim well.', contract=False), expl='can の文なので am は使わない。')
X(12, NG + '\n私はギターをひくことができません。（ play / can\'t / don\'t / I / the guitar ）.', ev("I can't play the guitar.", contract=False), expl='「できない」は can\'t。don\'t は使わない。')
X(13, NG + '\n私の大好きな教科は数学です。（ subject / is / favorite / my / am / math ）.', ev('My favorite subject is math.', contract=False), expl='My favorite subject には is。am は使わない。')
X(13, NG + '\n私の大好きなスポーツは野球です。それは楽しいです。（ sport / is / my / favorite / baseball / it\'s / fun / am ）.', ev("My favorite sport is baseball. It's fun.", contract=False), expl='My favorite sport is baseball. と It\'s fun.。am は使わない。')
X(12, NG + '\n私たちはテニスをすることができます。（ we / can / tennis / play / are ）.', ev('We can play tennis.', contract=False), expl='can の文なので are は使わない。')
X(14, NG + '\n彼はケーキを作ることができます。（ he / a cake / can / make / makes ）.', ev('He can make a cake.', contract=False), expl='can のあとはもとの形 make。makes は使わない。')
X(13, NG + '\nこれは私の大好きな色です。（ color / this / favorite / is / my / am ）.', ev('This is my favorite color.', contract=False), expl='This には is。am は使わない。')
X(14, NG + '\n私は漢字を読むことができません。（ read / cannot / kanji / I / not ）.', ev('I cannot read kanji.', contract=False), expl='cannot は1語で「できない」。not は使わない。')

# ── H. オリジナルの文章を読んで答える ──
P1 = '次の自己紹介を読んで答えよう。\nHi, I\'m Lucy. I\'m from London. My favorite sport is tennis. It\'s fun. I can play tennis well. I can\'t swim, but I can ski. Do you like sports?\n'
P2 = '次の対話を読んで答えよう。\nKota: This is my guitar.\nAnn: Wow! Do you play the guitar?\nKota: Yes, I do. I can play the guitar well. But I can\'t sing well.\nAnn: I can sing well! My favorite subject is music.\n'
P3 = '次のメールを読んで答えよう。\nHello, Mr. Brown. I\'m Hina. I\'m on the volleyball team. I can play volleyball well, but I can\'t run fast. My favorite subject is science. It\'s fun.\n'
u.strip = (P1, P2, P3, BL, FIX, WR, NG, FL, BE, M1, M2, M3)  # 共通の指示文・本文は、似ている度の計算から外す
X(13, P1 + '問い：ルーシーの大好きなスポーツは何か。日本語で答えよう。', ['テニス'], expl='My favorite sport is tennis. から、テニス。')
X(14, P1 + '問い：ルーシーができないことは何か。日本語で答えよう。', ['泳ぐこと', '泳ぐ', '水泳', 'およぐこと', '泳げない', '泳ぐことができない'], expl='I can\'t swim から、泳ぐこと（スキーはできる）。')
X(13, P1 + '問い：ルーシーになったつもりで、次の質問に英語で答えよう。\nDo you play tennis?', ev('Yes, I do.'), expl='ルーシーはテニスがじょうずにできるので Yes, I do.')
X(13, P2 + '問い：アンの大好きな教科は何か。日本語で答えよう。', ['音楽'], expl='Ann の My favorite subject is music. から、音楽。')
X(12, P2 + '問い：対話の内容に合うものを選ぼう。\nア コウタはじょうずに歌うことができる。　イ アンはじょうずに歌うことができる。　ウ アンはギターをひいている。', ['イ'], expl='Ann は I can sing well! と言っている。コウタはじょうずに歌えない。')
X(12, P2 + '問い：コウタになったつもりで、次の質問に英語で答えよう。\nDo you sing well?', ev("No, I don't."), expl='コウタは But I can\'t sing well. と言っているので No, I don\'t.')
X(17, P3 + '問い：ヒナは何部の一員か。日本語で答えよう。', ['バレーボール部', 'バレーボール', 'バレー部'], expl='I\'m on the volleyball team. から、バレーボール部。')
X(14, P3 + '問い：ヒナがじょうずにできるスポーツは何か。日本語で答えよう。', ['バレーボール', 'バレー'], expl='I can play volleyball well から、バレーボール（速く走ることはできない）。')
X(13, P3 + '問い：最後の文の It は何をさしているか。日本語で答えよう。', ['理科', 'ヒナの大好きな教科', '大好きな教科の理科'], expl='直前の My favorite subject is science. の science（理科）をさしている。')

# ── I. 対話の流れに合う文を選ぶ ──
X(13, FL + '\nA: Do you play sports?\nB: Yes, I do. (　)\nア My favorite sport is soccer.　イ My favorite sport is music.　ウ I can\'t play sports.', ['ア'], expl='スポーツをすると答えているので、大好きなスポーツを言うアが自然。music はスポーツではない。')
X(12, FL + '\nA: Do you swim?\nB: No, I don\'t. (　)\nア I can swim well.　イ I can\'t swim.　ウ I swim every day.', ['イ'], expl='泳がないと答えているので、「泳げない」と続くイが自然。')
X(14, FL + '\nA: This is my cake.\nB: Wow! (　)\nア You can make a cake!　イ You can\'t make a cake.　ウ I\'m a cake.', ['ア'], expl='相手が作ったケーキを見て「ケーキが作れるんだね！」と言うアが自然。')
X(13, FL + '\nA: Do you like English?\nB: Yes. (　)\nア It\'s fun.　イ It\'s my bag.　ウ I can\'t English.', ['ア'], expl='英語が好きだと答え、「それは楽しい」と続けるアが自然。ウは動詞がない。')
X(14, FL + '\nA: Do you play the koto?\nB: No, I don\'t. (　)\nア But I can play the shamisen.　イ But I can play the koto well.　ウ I play the koto every day.', ['ア'], expl='琴はひかないと答えているので、「でも三味線はひける」のアが自然。イ・ウは答えと合わない。')
X(9, FL + '\nA: Are you from Canada?\nB: No, I\'m not. I\'m from Japan. (　)\nア I can speak Japanese.　イ I\'m Japanese food.　ウ I can\'t from Japan.', ['ア'], expl='日本出身なので「日本語が話せる」のアが自然。イ・ウは文として成り立たない。')

# ── K. am／are／is の使い分け ──
X(13, BE + '\nI (　) Ken. You (　) my friend. My favorite color (　) blue.', seq('am', 'are', 'is'), expl='I には am、you には are、1つのもの（My favorite color）には is。')
X(13, BE + '\nThis (　) my pen. That (　) my bag. I (　) from Nara.', seq('is', 'is', 'am'), expl='This・That には is、I には am。')
X(13, BE + '\nYou (　) a good singer. It (　) fun. I (　) twelve.', seq('are', 'is', 'am'), expl='you には are、it には is、I には am。')
X(12, '次のうち、（　）に can が入らないものを選ぼう。\nア I (　) run fast.　イ I (　) a student.　ウ I (　) swim well.', ['イ'], expl='イは「私は生徒です」で be動詞 am が入る。can のあとには動詞が必要。')
X(13, '次のうち、（　）に is が入るものを選ぼう。\nア My favorite subject (　) English.　イ I (　) play soccer.　ウ You (　) from Japan.', ['ア'], expl='アは1つのもの（My favorite subject）が主語なので is。イは can など、ウは are。')

# ── M. メモから自己紹介を書く ──
X(16, '次のメモをもとに、自己紹介を3文で書こう。\n〈メモ〉名前：タク（Taku）／大好きな教科：数学／できること：速く走る', ev("I'm Taku. My favorite subject is math. I can run fast.", 'My name is Taku. My favorite subject is math. I can run fast.'), expl='I\'m ～.（My name is ～.）、My favorite subject is ～.、I can ～. の3文。')
X(16, '次のメモをもとに、2文で書こう。\n〈メモ〉大好きなスポーツ：野球／できないこと：泳ぐ', ev("My favorite sport is baseball. I can't swim.", "My favorite sport is baseball. But I can't swim.", 'My favorite sport is baseball. I cannot swim.', 'My favorite sport is baseball. But I cannot swim.'), expl='My favorite sport is baseball. と I can\'t swim.')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp12〜15（Lesson1 Part3の基本文・ポイント・A・B）、p16〜17（まとめテスト）、p30〜31（場面別ドリル）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、can・be動詞・一般動詞の使い分け、2か所の誤り、メモからの文作り、2つの内容の英作文、使わない語のある並べかえ、オリジナルの文章の読み取り（代名詞 It の指すもの）、対話の流れ、の形にした。Can you ～?・疑問詞・3人称単数の -s は使っていない。')
