# coding: utf-8
"""英語1年 Lesson 3 前半（過去の文 played・went・was）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p32〜33・p38〜41・p112（一般動詞の過去形：規則動詞 -(e)d・y→ied・子音字を重ねる／不規則動詞 went・saw・had・ate／
be動詞の過去形 was・were／yesterday・last ～・this morning などの時を表す語句、Lesson 1〜2の文）。
使わないもの：didn't・Did ～?・Were you ～?（Lesson 3後半）、3人称単数の -s（Lesson 4）、ワークにない不規則動詞の過去形。
1問ごとに問い方と文の組み合わせを変え、ワークより一段難しくした（単語の入れかえだけの問題は作らない）。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l3a', '過去の文（played・went・was）（特訓）', 'Lesson 3', '英語', 1,
         {32: 'source-0456', 33: 'source-0456', 36: 'source-0458', 38: 'source-0459', 39: 'source-0459', 40: 'source-0460', 112: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l3a.json', '確認済み/workbook-english-1-l3b.json', '確認済み/workbook-english-1-l2.json'])
X = u.X
TW = '（　）内の動詞を正しい形にして、（　）に入る語を順に書こう（カンマで区切る）。'
SP = '次の3つの動詞を過去形にして、順に書こう（カンマで区切る）。'
PT = '次の文を、［　］内の語句を加えて過去の文に書きかえよう。'
FIX = '次の英文には誤りが2か所ある。正しく直して全文を書こう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
BL = '（　）に入る語を、文の意味に合う形で順に書こう（カンマで区切る）。'
WR = '次の日本語を英語で書こう。'
SEL = 'の英文として正しいものを選ぼう。'

# ── A. 時を表す語句から、現在形か過去形かを判断する ──
X(32, TW + '（play）\nI (　) tennis every Sunday. I (　) tennis last Sunday, too.', seq('play', 'played'), expl='every Sunday は現在の習慣なので play、last Sunday は過去なので played。')
X(32, TW + '（go）\nWe (　) to the library yesterday. We (　) to the library every week.', seq('went', 'go'), expl='yesterday は過去なので went（go の過去形）、every week は現在の習慣なので go。')
X(32, TW + '（be）\nIt (　) fun yesterday. It (　) fun today, too.', seq('was', 'is'), expl='yesterday は過去なので was、today は現在なので is。')
X(33, TW + '（have）\nI (　) breakfast at seven this morning. I (　) breakfast at six every day.', seq('had', 'have'), expl='this morning は「今朝（もう終わった）」で had、every day は習慣なので have。')
X(40, TW + '（be）\nThey (　) busy last week. They (　) busy now.', seq('were', 'are'), expl='主語が they のとき、過去は were、現在は are。')
X(32, TW + '（study）\nI (　) English last night. I (　) English every night.', seq('studied', 'study'), expl='last night は過去なので studied（y を i にかえて ed）、every night は習慣なので study。')
X(32, TW + '（watch）\nWe (　) a movie yesterday. We (　) movies on Sundays.', seq('watched', 'watch'), expl='yesterday は過去なので watched、on Sundays は習慣なので watch。')
X(33, TW + '（see）\nI (　) Eri at school every day. I (　) Eri in the park yesterday.', seq('see', 'saw'), expl='every day は習慣なので see、yesterday は過去なので saw（see の過去形）。')

# ── B. 過去形のつくり方 ──
X(32, SP + '\nlike / stop / study', seq('liked', 'stopped', 'studied'), expl='e で終わる語は d だけ（liked）、短母音＋子音字は子音字を重ねて ed（stopped）、子音字＋y は y を i にかえて ed（studied）。')
X(33, SP + '\ngo / see / have', seq('went', 'saw', 'had'), expl='3つとも不規則に形がかわる動詞。go→went、see→saw、have→had。')
X(32, SP + '\ncook / enjoy / practice', seq('cooked', 'enjoyed', 'practiced'), expl='cook はそのまま ed。enjoy は母音字＋y なので y はそのまま ed（enjoyed）。practice は e で終わるので d だけ。')
X(33, SP + '\neat / be（主語が I） / be（主語が we）', seq('ate', 'was', 'were'), expl='eat→ate。be動詞は主語が I なら was、we なら were。')

# ── C. 時を表す語句を加えて過去の文に ──
X(32, PT + '\nI go to the park.［yesterday］', ev('I went to the park yesterday.', 'Yesterday, I went to the park.', 'Yesterday I went to the park.'), expl='go を過去形 went にして、yesterday を加える。')
X(32, PT + '\nWe are in Kobe.［last week］', ev('We were in Kobe last week.', 'Last week, we were in Kobe.', 'Last week we were in Kobe.'), expl='主語が we なので are の過去形は were。')
X(32, PT + '\nI study math after lunch.［yesterday］', ev('I studied math after lunch yesterday.', 'Yesterday, I studied math after lunch.', 'Yesterday I studied math after lunch.'), expl='study を studied にして yesterday を加える。')
X(40, PT + '\nIt is a lot of fun.［yesterday］', ev('It was a lot of fun yesterday.', 'Yesterday, it was a lot of fun.', 'Yesterday it was a lot of fun.'), expl='is の過去形は was。')
X(39, PT + '\nI see many fish at the beach.［last month］', ev('I saw many fish at the beach last month.', 'Last month, I saw many fish at the beach.', 'Last month I saw many fish at the beach.'), expl='see の過去形は saw。fish は複数でも fish のまま。')
X(39, PT + '\nWe have dinner at a restaurant.［last night］', ev('We had dinner at a restaurant last night.', 'Last night, we had dinner at a restaurant.', 'Last night we had dinner at a restaurant.'), expl='have の過去形は had。')

# ── D. 2か所の誤り ──
X(32, FIX + '\nI go to the museum yesterday. It is fun.', ev('I went to the museum yesterday. It was fun.'), expl='yesterday の話なので go→went、is→was。')
X(36, FIX + '\nWe playd soccer. It were exciting.', ev('We played soccer. It was exciting.'), expl='play の過去形は played。主語 it の be動詞の過去形は was。')
X(32, FIX + '\nI studyed English last night. I watch TV after that.', ev('I studied English last night. I watched TV after that.'), expl='study→studied（y を i にかえる）。after that「そのあと」も過去の話なので watched。')
X(33, FIX + '\nWe was at home yesterday. We eated lunch.', ev('We were at home yesterday. We ate lunch.', 'We were at home yesterday. We had lunch.'), expl='we の be動詞の過去形は were。eat の過去形は ate（eated ではない）。')
X(33, FIX + '\nI seed pandas last week. They was cute.', ev('I saw pandas last week. They were cute.'), expl='see の過去形は saw。they の be動詞の過去形は were。')
X(33, FIX + '\nI haved a party yesterday. It is a lot of fun.', ev('I had a party yesterday. It was a lot of fun.'), expl='have の過去形は had。昨日のパーティーの感想なので was。')
X(39, FIX + '\nI visitted Kyoto last month. I enjoy it.', ev('I visited Kyoto last month. I enjoyed it.'), expl='visit は vi-sit のあとが強く読まれないので子音字を重ねず visited。enjoy も過去形 enjoyed。')
X(32, FIX + '\nI am busy yesterday. I practiceed the piano.', ev('I was busy yesterday. I practiced the piano.'), expl='am の過去形は was。practice は e で終わるので d だけをつける。')

# ── E. メモ・予定から過去の文を書く ──
X(33, '〈メモ〉昨日：図書館へ行った・公園でテニスをした\nメモに合うように、（　）に入る語を順に書こう（カンマで区切る）。\nYesterday, I (　) to the library and (　) tennis in the park.', seq('went', 'played'), expl='「行った」は went、「テニスをした」は played tennis。')
X(40, '〈メモ〉午前：祖母を訪ねた／午後：いっしょにカレーを作った\nメモに合うように、（　）に入る語を順に書こう（カンマで区切る）。\nIn the morning, I (　) my grandmother. In the afternoon, we (　) curry.', seq('visited', 'cooked'), expl='「訪ねた」は visited、「（料理を）作った」は cooked。')
X(40, '〈日記のメモ〉友達のケンを訪ねた・映画を見た・とても楽しかった\nメモに合うように、（　）に入る語を順に書こう（カンマで区切る）。\nI (　) my friend Ken. We (　) a movie. It (　) a lot of fun.', seq('visited', 'watched', 'was'), expl='visited（訪ねた）、watched（見た）、was（楽しかった）。')
X(39, '〈日記のメモ〉この前の土曜日：海へ行った・たくさんの魚を見た\nメモに合うように、（　）に入る語を順に書こう（カンマで区切る）。\nLast Saturday, I (　) to the sea. I (　) many fish.', seq('went', 'saw'), expl='「行った」は went、「見た」は saw。')
X(32, '〈メモ〉昨日の夜：英語を勉強した\nメモの内容を、I で始まる英文1文で書こう。', ev('I studied English last night.'), expl='study の過去形 studied と last night「昨日の夜」を使う。')
X(33, '〈メモ〉今朝：7時に朝食を食べた\nメモの内容を、I で始まる英文1文で書こう（have を使う）。', ev('I had breakfast at seven this morning.', 'I had breakfast at 7 this morning.'), expl='have の過去形 had と this morning を使う。')

# ── F. 使わない語が1つある並べかえ ──
X(32, NG + '\n私は昨日、買い物に行きました。（ went / go / shopping / I / yesterday ）.', ev('I went shopping yesterday.'), expl='過去の文なので went を使う。go は使わない。')
X(40, NG + '\nそれはとても楽しかったです。（ was / is / it / fun / a lot of ）.', ev('It was a lot of fun.'), expl='過去の感想なので was。is は使わない。')
X(32, NG + '\n私たちは先週、京都にいました。（ were / was / we / in / Kyoto / last week ）.', ev('We were in Kyoto last week.'), expl='we には were。was は使わない。')
X(32, NG + '\n私は昨夜、テレビを見ました。（ watched / TV / I / last / night / watch ）.', ev('I watched TV last night.'), expl='過去の文なので watched。watch は使わない。')
X(39, NG + '\n私たちは浜辺でたくさんの魚を見ました。（ saw / many / we / fish / at / the beach / see ）.', ev('We saw many fish at the beach.'), expl='「見た」は saw。see は使わない。')
X(32, NG + '\n私は昼食のあとで数学を勉強しました。（ after / studied / lunch / math / I / study ）.', ev('I studied math after lunch.'), expl='「勉強した」は studied。study は使わない。')
X(38, NG + '\n私は先月、祖母を訪ねました。（ visited / my grandmother / I / last month / visit ）.', ev('I visited my grandmother last month.'), expl='「訪ねた」は visited。visit は使わない。')
X(40, NG + '\nそれらはとてもかわいかったです。（ they / were / very / cute / was ）.', ev('They were very cute.'), expl='they には were。was は使わない。')

# ── G. オリジナルの日記・メール・対話を読んで答える ──
P1 = '次の日記を読んで答えよう。\nSunday, May 12th\nI went to the zoo with my family. We saw pandas and koalas. They were very cute. We had lunch in the park. It was a lot of fun.\n'
P2 = '次のメールを読んで答えよう。\nHi, Mark. I visited Osaka last week. I ate takoyaki there. It was delicious. I talked with many people in English. It was exciting.\n'
P3 = '次の対話を読んで答えよう。\nAya: I played tennis with Kumi yesterday.\nBen: Great!\nAya: After that, we studied English at the library.\nBen: I watched a soccer game on TV yesterday. It was exciting.\n'
u.strip = (P1, P2, P3, TW, SP, PT, FIX, NG, BL, WR)  # 共通の指示文・本文は、似ている度の計算から外す
X(40, P1 + '問い：書いた人は日曜日にどこへ行ったか。日本語で答えよう。', ['動物園', '動物園へ行った'], expl='I went to the zoo から、動物園。')
X(40, P1 + '問い：3文目の They は何をさしているか。日本語で答えよう。', ['パンダとコアラ', 'コアラとパンダ'], expl='直前の We saw pandas and koalas. の pandas and koalas。')
X(40, P1 + '問い：書いた人たちはどこで昼食を食べたか。日本語で答えよう。', ['公園', '公園で'], expl='We had lunch in the park. から、公園。')
X(39, P2 + '問い：書いた人が大阪で食べたものは何か。日本語で答えよう。', ['たこ焼き', 'たこやき'], expl='I ate takoyaki there. から、たこ焼き。there は大阪をさす。')
X(39, P2 + '問い：書いた人は大阪で、英語で何をしたか。日本語で答えよう。', ['たくさんの人と話した', '多くの人と話した', 'たくさんの人と英語で話した', '人と話した'], expl='I talked with many people in English. から。')
X(39, P2 + '問い：メールの内容に合うものを選ぼう。\nア 書いた人は今週、大阪を訪れた。　イ たこ焼きはおいしかった。　ウ 英語で話すのはつまらなかった。', ['イ'], expl='It was delicious. から、イ。訪れたのは先週（last week）、英語で話すのはわくわくした（exciting）。')
X(32, P3 + '問い：アヤは昨日、だれとテニスをしたか。', ['クミ', 'Kumi', 'くみ'], expl='I played tennis with Kumi yesterday. から、クミ。')
X(32, P3 + '問い：アヤたちはテニスのあと、何をしたか。日本語で答えよう。', ['図書館で英語を勉強した', '英語を勉強した', '図書館で英語の勉強をした'], expl='After that, we studied English at the library. から。')
X(32, P3 + '問い：ベンは昨日、何をしたか。日本語で答えよう。', ['テレビでサッカーの試合を見た', 'サッカーの試合を見た', 'テレビでサッカーを見た'], expl='I watched a soccer game on TV yesterday. から。')

# ── H. 対話の（　）を文の意味に合う形でうめる ──
X(32, BL + '\nA: I (　) to Kyoto last week.\nB: Great!\nA: It (　) a lot of fun.', seq('went', 'was'), expl='last week の話なので went、感想も過去なので was。')
X(33, BL + '\nA: I (　) curry last night.\nB: Really?\nA: Yes. It (　) delicious.', seq('cooked', 'was'), expl='「カレーを作った」は cooked、「おいしかった」は was delicious。')
X(32, BL + '\nTom and I (　) in the music room after lunch yesterday. We (　) the guitar there.', seq('were', 'practiced'), expl='主語が Tom and I（2人）なので were。「練習した」は practiced。')
X(39, BL + '\nA: I (　) many colorful fish in the sea.\nB: Nice!\nA: We (　) a good time there.', seq('saw', 'had'), expl='「見た」は saw、「楽しい時を過ごした」は had a good time。')
X(32, BL + '\nRyo (　) to the library and (　) math there yesterday.', seq('went', 'studied'), expl='過去の文では主語が Ryo でも went・studied（s はつけない）。')
X(32, BL + '\nIt (　) a beautiful day yesterday, so we (　) to the beach.', seq('was', 'went'), expl='「天気のよい日だった」は was、「浜辺へ行った」は went。')

# ── I. 似た文から正しい文を選ぶ ──
X(32, '「私は昨日、サッカーをしました。」' + SEL + '\nア I play soccer yesterday.　イ I played soccer yesterday.　ウ I was play soccer yesterday.', ['イ'], expl='一般動詞の過去形 played を使う。was は不要。')
X(32, '「それはおいしかったです。」' + SEL + '\nア It is delicious.　イ It was delicious.　ウ It were delicious.', ['イ'], expl='it の be動詞の過去形は was。')
X(32, '「私たちは先週ひまでした。」' + SEL + '\nア We was free last week.　イ We were free last week.　ウ We are free last week.', ['イ'], expl='we の be動詞の過去形は were。')
X(32, '「私は英語を勉強しました。」' + SEL + '\nア I studyed English.　イ I studied English.　ウ I studies English.', ['イ'], expl='study は y を i にかえて ed。')
X(33, '「私は昨日コアラを見ました。」' + SEL + '\nア I saw koalas yesterday.　イ I seed koalas yesterday.　ウ I see koalas yesterday.', ['ア'], expl='see の過去形は saw（不規則動詞）。')
X(39, '「私は先月、北海道を訪れました。」' + SEL + '\nア I visited Hokkaido last month.　イ I visit Hokkaido last month.　ウ I visitted Hokkaido last month.', ['ア'], expl='visit の過去形は visited（t を重ねない）。')

# ── J. 時を表す語句と時制 ──
X(32, '次の文の（　）に入れることができないものを選ぼう。\nI played tennis (　).\nア yesterday　イ last Sunday　ウ every day', ['ウ'], expl='played は過去の文なので、習慣を表す every day は合わない。')
X(32, '次の文の（　）に入れることができないものを選ぼう。\nI go to school (　).\nア every day　イ yesterday　ウ on Mondays', ['イ'], expl='go は現在の文なので、過去を表す yesterday は合わない（過去なら went）。')
X(32, '次の文の（　）に入れることができないものを選ぼう。\nWe were busy (　).\nア this morning　イ last night　ウ now', ['ウ'], expl='were は過去の文なので、now「今」は合わない（今なら are）。')

# ── K. 2つの内容をふくむ英作文 ──
X(39, WR + '\n私は昨日、公園へ行きました。そこでテニスをしました。', ev('I went to the park yesterday. I played tennis there.', 'Yesterday, I went to the park. I played tennis there.', 'Yesterday I went to the park. I played tennis there.'), expl='went と played を使う。「そこで」は there。')
X(40, WR + '\n私たちはこの前の日曜日、動物園にいました。パンダはとてもかわいかったです。', ev('We were at the zoo last Sunday. The pandas were very cute.', 'We were at the zoo last Sunday. Pandas were very cute.', 'Last Sunday, we were at the zoo. The pandas were very cute.'), expl='we・the pandas（複数）の be動詞の過去形は were。')
X(36, WR + '\n私は昨夜、テレビでサッカーの試合を見ました。それはわくわくしました。', ev('I watched a soccer game on TV last night. It was exciting.', 'Last night, I watched a soccer game on TV. It was exciting.'), expl='watched と It was exciting. を使う。')
X(39, WR + '\n私たちは浜辺で楽しい時を過ごしました。', ev('We had a good time at the beach.'), expl='「楽しい時を過ごす」は have a good time。過去形 had にする。')
X(38, WR + '\n私は先月、祖母を訪ねました。私はうれしかったです。', ev('I visited my grandmother last month. I was happy.', 'Last month, I visited my grandmother. I was happy.'), expl='visited と I was happy. を使う。')
X(32, WR + '\n私は昼食のあとで英語を勉強しました。それは楽しかったです。', ev('I studied English after lunch. It was fun.'), expl='studied と It was fun. を使う。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp32〜33（Lesson3 Part1の基本文・ポイント・A・B）、p36（語句）、p38〜39（まとめテスト）、p40（日記を書いてみよう）、p112（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問の「1か所の穴うめ・並べかえ」より一段難しく、時を表す語句から現在形と過去形を判断する・過去形のつくり方の規則・語句を加えた書きかえ・2か所の誤り・メモからの過去の文・使わない語のある並べかえ・オリジナルの日記やメールの読み取り・時制に合わない語句の判断・英作文、の形にした。didn\'t・Did ～?・3人称単数の -s は使っていない。')
