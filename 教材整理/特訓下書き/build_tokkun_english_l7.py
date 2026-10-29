# coding: utf-8
"""英語1年 Lesson 7（should・have to・Can I ～?／Can you ～? と標識の命令文）の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p74〜81・p83・p113（should／shouldn't ＋動詞のもとの形／have［has］to ～／don't［doesn't］have to ～／
Do［Does］～ have to ～?／Can I ～? — Sure./OK./Of course./I'm sorry, ～.／Can you ～?／命令文 Don't ～.・Please ～.・Let's ～.、
Lesson 1〜6の文）。
使わないもの：must・may・will（Lesson 8で扱う未来の文）・be able to など、ワークにない助動詞。
並べかえ問題は、与えた語を変える答え（短縮形への言いかえなど）を正解にしない。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-l7', 'should・have to・Can I ～?／Can you ～?（特訓）', 'Lesson 7', '英語', 1,
         {74: 'source-0477', 75: 'source-0477', 76: 'source-0478', 77: 'source-0478', 78: 'source-0479', 79: 'source-0479',
          80: 'source-0480', 81: 'source-0480', 83: 'source-0481', 113: 'source-0496'},
         '英語ワーク', ['確認済み/workbook-english-1-l7.json', '確認済み/workbook-english-1-l2.json', '確認済み/workbook-english-1-words.json'])
X = u.X
def NGA(*a): return ev(*a, contract=False)
TR = '次の文を、［　］の指示にしたがって書きかえよう。'
FIX = '次の英文（対話）には誤りが2か所ある。正しく直して全文を書こう（— は書かなくてよい）。'
CH = '場面に合う英文として最も適切なものを選ぼう。'
NG = '日本語に合うように、（　）内の語句を並べかえて全文を書こう。ただし、使わない語が1つある。'
WR = '次の日本語を英語で書こう。'
BL = '（　）に入る語を順に書こう（カンマで区切る）。'
SG = '次の標識の意味を、Don\'t で始まる命令文で書こう。'

# ── A. 書きかえ（主語・形の変化に注意） ──
X(76, TR + '\nKen cleans his room.［「～しなければならない」という文に］', ev('Ken has to clean his room.'), expl='主語が3人称単数なので has to。cleans はもとの形 clean。')
X(74, TR + '\nAya drinks coffee.［「～すべきではない」という文に］', ev("Aya shouldn't drink coffee.", 'Aya should not drink coffee.'), expl='should not（shouldn\'t）＋もとの形 drink。')
X(76, TR + '\nI have to go to school today.［否定文に（「～する必要はない」）］', ev("I don't have to go to school today."), expl='have to の否定は don\'t have to。')
X(76, TR + '\nMy mother has to work on Sundays.［否定文に］', ev("My mother doesn't have to work on Sundays."), expl='has to の否定は doesn\'t have to（has は have にもどす）。')
X(76, TR + '\nYou have to leave now.［疑問文に］', ev('Do you have to leave now?'), expl='Do you have to ～? の形。')
X(76, TR + '\nTaku has to study hard.［疑問文にして、Yes で答える文も続けて］', ev('Does Taku have to study hard? Yes, he does.'), expl='Does Taku have to ～? に Yes, he does.')
X(74, TR + '\nYou eat salad.［「～すべきだ」という文に］', ev('You should eat salad.'), expl='should ＋もとの形。')
X(78, TR + '\nI use your pen.［「～してもいいですか」とたずねる文に］', ev('Can I use your pen?'), expl='許可を求めるのは Can I ～?')
X(78, TR + '\nYou help me.［「～してもらえませんか」と頼む文に］', ev('Can you help me?'), expl='依頼は Can you ～?')
X(83, TR + '\nYou swim here.［「～してはいけない」という命令文に］', ev("Don't swim here."), expl='否定の命令文は Don\'t ＋動詞のもとの形。')

# ── B. 意味の違いを区別する ──
X(76, '次の2文の意味の違いとして正しいものを選ぼう。\n(a) You don\'t have to run.　(b) You shouldn\'t run.\nア (a)「走る必要はない」(b)「走るべきではない」　イ (a)「走るべきではない」(b)「走る必要はない」　ウ どちらも「走ってはいけない」', ['ア'], expl='don\'t have to は「～する必要はない」、shouldn\'t は「～すべきではない」。')
X(78, '次の2文の意味の違いとして正しいものを選ぼう。\n(a) Can I open the window?　(b) Can you open the window?\nア (a)「窓を開けてもいいですか」(b)「窓を開けてもらえませんか」　イ (a)「窓を開けてもらえませんか」(b)「窓を開けてもいいですか」　ウ どちらも「窓を開けることができますか」', ['ア'], expl='Can I ～? は許可、Can you ～? は依頼。')
X(76, '「明日は日曜日なので、早く起きなくてもいい」という意味になる文を選ぼう。\nア You have to get up early tomorrow.　イ You don\'t have to get up early tomorrow.　ウ You should get up early tomorrow.', ['イ'], expl='「～しなくてもよい」は don\'t have to。')
X(74, '「かぜをひいているので、泳ぐべきではない」という意味になる文を選ぼう。\nア You should swim today.　イ You don\'t have to swim today.　ウ You shouldn\'t swim today.', ['ウ'], expl='「～すべきではない」は shouldn\'t。')

# ── C. 2か所の誤り ──
X(74, FIX + '\nYou should to study English. You should not plays games.', ev('You should study English. You should not play games.', "You should study English. You shouldn't play games."), expl='should のあとは to をつけずもとの形。play もそのまま。')
X(76, FIX + '\nKen have to study for the test. He have to go home now.', ev('Ken has to study for the test. He has to go home now.'), expl='主語が3人称単数なので has to。')
X(76, FIX + '\nI don\'t have to washing the dishes. My sister have to do it.', ev("I don't have to wash the dishes. My sister has to do it."), expl='have to のあとはもとの形 wash。My sister には has to。')
X(76, FIX + '\nDoes Mai has to clean the room? — Yes, she has.', ev('Does Mai have to clean the room? Yes, she does.'), expl='Does のあとは have to。答えは does。')
X(78, FIX + '\nCan I to use this computer? — Sure, you do.', ev('Can I use this computer? Sure.', 'Can I use this computer? Sure, you can.'), expl='Can のあとは to をつけない。答えは Sure. または Sure, you can.')
X(78, FIX + '\nDo you can help me? — Of course, I do.', ev('Can you help me? Of course.', 'Can you help me? Of course, I can.'), expl='依頼は Can you ～?（do と can をいっしょに使わない）。答えは Of course.（Of course, I can.）')
X(83, FIX + '\nNot eat here. Please be quietly in the library.', ev("Don't eat here. Please be quiet in the library."), expl='否定の命令文は Don\'t ～.。be のあとは形容詞 quiet。')
X(76, FIX + '\nMy father doesn\'t has to work today. He don\'t have to get up early.', ev("My father doesn't have to work today. He doesn't have to get up early."), expl='doesn\'t のあとは have。He には doesn\'t。')

# ── D. 場面に合う英文 ──
X(78, CH + '\n（友達のマンガ本を借りたいとき）\nア Can you borrow your comic book?　イ Can I borrow your comic book?　ウ You should borrow my comic book.', ['イ'], expl='自分が借りてもいいかをたずねるので Can I ～?')
X(78, CH + '\n（重い荷物を運ぶのを手伝ってほしいとき）\nア Can I help you?　イ Can you help me?　ウ You don\'t have to help me.', ['イ'], expl='相手に頼むので Can you help me?')
X(78, CH + '\n（「質問してもいいですか」と聞かれて、いいよと答えるとき）\nア Sure.　イ I\'m sorry.　ウ No, you can\'t ask.', ['ア'], expl='許可するときは Sure.／OK.／Of course.')
X(78, CH + '\n（「手伝ってくれる？」と頼まれたが、今は忙しくて断るとき）\nア Of course.　イ I\'m sorry. I have to do my homework now.　ウ Yes, I can help you.', ['イ'], expl='断るときは I\'m sorry. と言ってから理由を続ける。')
X(74, CH + '\n（顔色の悪い友達に「病院に行くべきだよ」と言うとき）\nア You should go to the hospital.　イ You have to go to the hospital?　ウ Can I go to the hospital?', ['ア'], expl='助言は You should ～.')
X(83, CH + '\n（図書館で大声で話している人に注意するとき）\nア Let\'s talk here.　イ Please talk here.　ウ Don\'t talk loudly here.', ['ウ'], expl='「～してはいけない」は Don\'t ～.')
X(77, CH + '\n（友達が「今、行かなきゃいけないの？」と聞いたのに、「まだ行かなくていいよ」と答えるとき）\nア No, you don\'t have to.　イ Yes, you have to.　ウ No, you can\'t.', ['ア'], expl='「～する必要はない」は No, you don\'t have to.')

# ── E. 複数の（　） ──
X(76, BL + '\nA: (　) you have to go now?\nB: Yes, I (　). I have to do my homework.', seq('Do', 'do'), expl='Do you have to ～? に Yes, I do.')
X(77, BL + '\nA: (　) Eri have to help her mother today?\nB: No, she (　).', seq('Does', "doesn't") + seq('Does', 'does not'), expl='Does Eri have to ～? に No, she doesn\'t.')
X(78, BL + '\nA: (　) I take pictures here?\nB: I\'m (　). You (　) take pictures in this museum.', seq('Can', 'sorry', "can't") + seq('Can', 'sorry', 'cannot'), expl='Can I ～? に I\'m sorry. で断り、can\'t（～できない）を続ける。')
X(74, BL + '\nYou (　) eat too much. You (　) eat vegetables, too.（「食べすぎるべきではない。野菜も食べるべきだ」）', seq("shouldn't", 'should') + seq('should not', 'should'), expl='shouldn\'t と should の使い分け。')
X(79, BL + '\nA: Can you (　) some juice to the party?\nB: (　) course.', seq('bring', 'Of'), expl='「持ってくる」は bring。「もちろん」は Of course.')
X(83, BL + '\n放課後テニスをしましょう。3時に公園に来てください。\n(　) play tennis after school. (　) to the park at three.', seq("Let's", 'Come'), expl='「～しましょう」は Let\'s ～.、「～しなさい・～してください」は動詞のもとの形で文を始める。')

# ── F. 使わない語が1つある並べかえ ──
X(75, NG + '\nあなたは早く寝るべきです。（ you / should / go / to bed / early / have ）.', NGA('You should go to bed early.'), expl='should ＋ go。have は使わない。')
X(77, NG + '\n私の姉は今日、夕食を作らなければなりません。（ my sister / has / to / cook / dinner / today / have ）.', NGA('My sister has to cook dinner today.'), expl='3人称単数なので has to。have は使わない。')
X(77, NG + '\nあなたは傘を持っていく必要はありません。（ you / don\'t / have / to / take / an umbrella / shouldn\'t ）.', NGA("You don't have to take an umbrella."), expl='「必要はない」は don\'t have to。shouldn\'t は使わない。')
X(79, NG + '\nこの辞書を使ってもいいですか。（ can / I / use / this dictionary / you ）?', NGA('Can I use this dictionary?'), expl='許可は Can I ～?。you は使わない。')
X(79, NG + '\n私といっしょに歌ってもらえませんか。（ can / you / sing / with / me / I ）?', NGA('Can you sing with me?'), expl='依頼は Can you ～?。I は使わない。')
X(77, NG + '\n健は明日、学校へ行かなければなりませんか。（ does / Ken / have / to / go / to school / tomorrow / has ）?', NGA('Does Ken have to go to school tomorrow?'), expl='Does のあとは have to。has は使わない。')
X(83, NG + '\nここで自転車に乗ってはいけません。（ don\'t / ride / your bicycle / here / not ）.', NGA("Don't ride your bicycle here."), expl='否定の命令文は Don\'t ～.。not は使わない。')
X(75, NG + '\n彼らはここでサッカーをするべきではありません。（ they / should / not / play / soccer / here / don\'t ）.', NGA('They should not play soccer here.'), expl='should not ＋もとの形。don\'t は使わない。')

# ── G. 英作文 ──
X(75, WR + '\nあなたは毎日歯をみがくべきです。', ev('You should brush your teeth every day.'), expl='should brush your teeth。')
X(76, WR + '\n私は数学のテストに向けて勉強しなければなりません。', ev('I have to study for the math test.'), expl='have to study for ～。')
X(77, WR + '\n私の兄は今日、早く帰宅する必要はありません。', ev("My brother doesn't have to come home early today."), expl='3人称単数の否定は doesn\'t have to。')
X(78, WR + '（質問と答えを続けて書く）\n窓を開けてもいいですか。—いいですよ。', ev('Can I open the window? Sure.', 'Can I open the window? OK.', 'Can I open the window? Of course.'), expl='Can I ～? に Sure.（OK./Of course.）')
X(79, WR + '\nケーキを作ってもらえませんか。', ev('Can you make a cake?'), expl='依頼は Can you ～?')
X(83, WR + '\nこの部屋ではくつをぬいでください。', ev('Please take off your shoes in this room.', 'Take off your shoes in this room, please.', 'Please take your shoes off in this room.'), expl='「ぬぐ」は take off。Please ～.')
X(81, WR + '\nあなたはそれをさわってはいけません。', ev("Don't touch it.", "You shouldn't touch it.", 'You should not touch it.'), expl='Don\'t touch it.（You shouldn\'t touch it. も可）')

# ── H. メモ・表から書く ──
X(77, '〈ユミのやることリスト〉✓部屋のそうじ　✓宿題　□皿洗い\nユミになったつもりで、「私は宿題をしなければなりませんが、皿を洗う必要はありません。」を英語で書こう。', ev("I have to do my homework, but I don't have to wash the dishes.", "I have to do my homework. But I don't have to wash the dishes."), expl='have to と don\'t have to を but でつなぐ。')
X(75, '〈今日すべきこと〉ボブ：数学を勉強する／ケイト：早く寝る\nボブとケイトに「あなたは今日～すべきです」と1文ずつ言おう。', ev('You should study math today. You should go to bed early today.'), expl='どちらも You should ～ today.')
X(79, '〈料理クラブで必要なこと〉卵を持ってくる\n友達に「卵を持ってきてもらえませんか」と頼む英文を書こう。', ev('Can you bring some eggs?', 'Can you bring eggs?', 'Can you bring some eggs to the cooking club?'), expl='依頼は Can you bring ～?')
X(79, '〈授業のあとでしたいこと〉友達のノートを見る\n友達に「あなたのノートを見てもいいですか」とたずねる英文を書こう。', ev('Can I see your notebook?', 'Can I look at your notebook?'), expl='許可は Can I see［look at］your notebook?')

# ── I. オリジナルの対話を読んで答える ──
P1 = '次の対話を読んで答えよう。\nTom: Mom, can I go to the park now?\nMother: You have to do your homework first.\nTom: OK. Can you help me with math?\nMother: Sure. But you should finish it by five.\nTom: Do I have to clean my room, too?\nMother: No, you don\'t have to. I cleaned it this morning.\n'
P2 = '次の文章を読んで答えよう。\nThis is a sign in our school library. It means "Don\'t eat or drink here." You can read books here, but you can\'t eat lunch. You should be quiet, too. You don\'t have to bring your own pencils. We have some here.\n'
u.strip = (P1, P2, TR, FIX, CH, NG, WR, BL, SG)
X(77, P1 + '問い：トムが公園に行く前にしなければならないことは何か。日本語で答えよう。', ['宿題', '宿題をすること', '宿題をする'], expl='You have to do your homework first. から。')
X(79, P1 + '問い：トムが母親に頼んだことは何か。日本語で答えよう。', ['数学を手伝うこと', '数学を手伝ってもらうこと', '数学を手伝って', '数学の手伝い', '数学を手伝ってくれること'], expl='Can you help me with math? から。')
X(77, P1 + '問い：次の質問に英語で答えよう。\nDoes Tom have to clean his room?', ev("No, he doesn't."), expl='Mother は No, you don\'t have to. と言っている。')
X(81, P2 + '問い：この図書館でしてはいけないことは何か。日本語で2つ答えよう（読点で区切る）。', ['食べること、飲むこと', '飲むこと、食べること', '食べる、飲む', '飲む、食べる', '飲食', '食べたり飲んだりすること'], expl='Don\'t eat or drink here. から。')
X(81, P2 + '問い：この図書館で鉛筆を持ってくる必要があるか。「ある」か「ない」で答えよう。', ['ない'], expl='You don\'t have to bring your own pencils. から、必要はない。')
X(81, P2 + '問い：文章の内容に合うものを選ぼう。\nア 図書館で昼食を食べてもよい。　イ 図書館では静かにするべきだ。　ウ 図書館に鉛筆はない。', ['イ'], expl='You should be quiet, too. から、イ。')

# ── J. 標識を命令文で ──
X(83, SG + '\n（ボールに斜線の標識。場所は公園）', ev("Don't play with a ball here.", "Don't play ball here.", "Don't play with balls here."), expl='Don\'t play with a ball here.')
X(83, SG + '\n（カメラに斜線の標識）', ev("Don't take pictures here.", "Don't take pictures.", "Don't take a picture here."), expl='「写真をとる」は take pictures。')

X(74, TR + '\nWe should go home now.［否定文に］', ev("We shouldn't go home now.", 'We should not go home now.'), expl='should の否定は should not（shouldn\'t）。')
X(76, TR + '\nThey have to wait here.［疑問文にして、No で答える文も続けて］', ev("Do they have to wait here? No, they don't."), expl='Do they have to ～? に No, they don\'t.')
X(78, CH + '\n（友達が「ぼくのペンを使っていいよ」と言ってくれたが、自分のペンを持っているとき）\nア Thank you, but I don\'t have to use it. I have my pen.　イ Yes, I have to use it.　ウ Can you use my pen?', ['ア'], expl='「使う必要はない」は don\'t have to use。自分のペンがあると理由を続ける。')
X(78, FIX + '\nCan you teaches me math? — I\'m sorry. I has to go home.', ev("Can you teach me math? I'm sorry. I have to go home."), expl='Can のあとはもとの形 teach。I には have to。')
X(77, WR + '\n私たちは日曜日に学校に行く必要はありません。', ev("We don't have to go to school on Sundays."), expl='「～する必要はない」は don\'t have to。')
X(77, WR + '（質問と答えを続けて書く）\n私はここで待たなければなりませんか。—いいえ、その必要はありません。', ev("Do I have to wait here? No, you don't.", "Do I have to wait here? No, you don't have to."), expl='Do I have to ～? に No, you don\'t (have to).')
X(83, SG + '\n（イヌに斜線の標識。場所は店の入り口）', ev("Don't bring your dog here.", "Don't bring dogs here.", "Don't bring your dog into the shop.", "Don't bring dogs into the shop."), expl='「（イヌを）連れてくる」は bring。')
X(81, P2 + '問い：次の質問に英語で答えよう。\nCan we read books in this library?', ev('Yes, we can.', 'Yes, you can.'), expl='You can read books here から、Yes, we［you］can.')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp74〜79（Lesson7 Part1〜3の基本文・ポイント・A・B）、p80〜81（まとめテスト）、p83（標識・命令文）、p113（基本文総チェック）を写真で確認し、その範囲の文法と語句だけを使って作った。ワーク版70問より一段難しく、主語と形の変化に注意した書きかえ・don\'t have to と shouldn\'t、Can I と Can you の意味の違い・2か所の誤り・場面に合う表現・複数の空所・使わない語のある並べかえ・英作文・メモからの文・オリジナルの文章の読み取り・標識の命令文、の形にした。並べかえは与えた語を変える答えを認めない。標識の問題は、絵の代わりに問題文で標識の内容を説明しているので画像は不要。')
