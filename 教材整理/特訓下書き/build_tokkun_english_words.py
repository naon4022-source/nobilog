# coding: utf-8
"""英語1年「Reading 1・2 の語句と単語・連語チェック」の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p84〜85（Reading 1 Fox and Tiger の単語・重要表現）、p110〜111（Reading 2 An Old Woman and a Dog の単語・重要表現）、
p114〜120（巻末の単語・連語チェック Lesson 1〜9・Reading 1・2）。
使わないもの：Reading の物語本文の内容（本文は教科書にあり、手元の資料にないため読解問題は作らない）。
1語を書くだけの問題はワーク版にあるので、文の中での意味の判断・形の変化・連語の組み立て・似た語の使い分けにした。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_english import ev, seq

u = Unit('tokkun-english-1-words', 'Reading 1・2 の語句と単語・連語（特訓）', '単語・連語', '英語', 1,
         {84: 'source-0482', 85: 'source-0482', 110: 'source-0495', 111: 'source-0495', 114: 'source-0497', 115: 'source-0497',
          116: 'source-0498', 117: 'source-0498', 118: 'source-0499', 119: 'source-0499', 120: 'source-0500'},
         '英語ワーク', ['確認済み/workbook-english-1-words.json', '確認済み/workbook-english-1-review.json'])
X = u.X
MEAN = '次の英文の［　］の語の意味として正しいものを選ぼう。'
PAST = '（　）内の動詞を、文に合う形にして書こう。'
PH = '日本語に合うように、（　）に入る語を順に書こう（語と語の間はカンマで区切る）。'
ODD = '次の4つの語のうち、なかまはずれを1つ選ぼう。'
WH = '次の（　）に入る語を、［　］から選んで順に書こう（カンマで区切る）。'

# ── A. 1つの語のいろいろな意味（文の中で判断する） ──
X(115, MEAN + '\nTurn ［right］ at the station.\nア 正しい　イ 右に　ウ 権利', ['イ'], expl='turn right で「右に曲がる」。')
X(115, MEAN + '\nThat\'s ［right］.\nア 正しい、そのとおり　イ 右　ウ 光', ['ア'], expl='That\'s right. は「そのとおりです」。')
X(114, MEAN + '\nI ［play］ the trumpet.\nア 遊ぶ　イ 演奏する　ウ 劇', ['イ'], expl='楽器と使うと「演奏する」。')
X(117, MEAN + '\nShe ［left］ the room at five.\nア 左　イ 出発した、去った　ウ 残す', ['イ'], expl='leave（去る）の過去形 left。')
X(117, MEAN + '\nTurn ［left］ at the corner.\nア 左に　イ 去った　ウ 残った', ['ア'], expl='turn left で「左に曲がる」。')
X(120, MEAN + '\nYou should ［see］ a doctor.\nア 見る　イ （医者に）診てもらう　ウ 会う', ['イ'], expl='see a doctor で「医者に診てもらう」。')
X(120, MEAN + '\nYou should ［take］ this medicine.\nア 持っていく　イ （写真を）撮る　ウ （薬を）飲む', ['ウ'], expl='take medicine で「薬を飲む」。')
X(116, MEAN + '\nCan I ［take］ a picture?\nア （写真を）撮る　イ 持っていく　ウ 飲む', ['ア'], expl='take a picture で「写真を撮る」。')
X(116, MEAN + '\nThey are ［kind］ to everyone.\nア 種類　イ 親切な　ウ 王', ['イ'], expl='be kind to ～「～に親切だ」。')
X(116, MEAN + '\nI\'m ［full］.\nア いっぱいの、満腹で　イ 空腹な　ウ 楽しい', ['ア'], expl='I\'m full.「おなかがいっぱいです」。')
X(118, MEAN + '\nThe stars ［shine］ at night.\nア 輝く、光る　イ ～を持っていく　ウ 変わる', ['ア'], expl='shine は「輝く、光る」。')
X(119, MEAN + '\nThis T-shirt is ［out of fashion］.\nア 流行の　イ 時代遅れの　ウ 新しい', ['イ'], expl='out of fashion で「時代遅れの」。')
X(119, MEAN + '\n"JP" ［stands for］ Japan.\nア ～の前に立つ　イ ～を表す、意味する　ウ ～を待つ', ['イ'], expl='stand for ～「～を表す」。')

# ── B. 不規則に変化する過去形 ──
X(84, PAST + '\nThe fox (tell) the tiger a story yesterday.', ['told'], expl='tell の過去形は told。')
X(110, PAST + '\nI (think) about the old woman last night.', ['thought'], expl='think の過去形は thought。')
X(110, PAST + '\nShe (buy) a cookie at the coffee shop yesterday.', ['bought'], expl='buy の過去形は bought。')
X(111, PAST + '\nThe dog (bite) the cookie.', ['bit'], expl='bite の過去形は bit。')
X(111, PAST + '\nShe (say), "Thank you."', ['said'], expl='say の過去形は said。')
X(120, PAST + '\nThe old woman (sit) at the table yesterday.', ['sat'], expl='sit の過去形は sat。')
X(117, PAST + '\nWe (make) a cake for Mom last Sunday.', ['made'], expl='make の過去形は made。')
X(117, PAST + '\nI (get) a letter from Tom last week.', ['got'], expl='get の過去形は got。')
X(119, PAST + '\nShe (put) the book in the box yesterday.', ['put'], expl='put は過去形も put。')
X(116, PAST + '\nI (take) many pictures in Kyoto last year.', ['took'], expl='take の過去形は took。')
X(110, '次の動詞のうち、過去形の作り方がほかとちがう（規則的に -ed をつける）ものを選ぼう。\nア think　イ buy　ウ jump　エ say', ['ウ'], expl='jump→jumped は規則変化。think→thought、buy→bought、say→said は不規則。')
X(111, '次の語のうち、foot（足）と同じように、複数形が s をつける形ではないものを選ぼう。\nア tooth（歯）　イ cat　ウ book', ['ア'], expl='foot→feet と同じく、tooth→teeth（巻末チェック Lesson 2）。')

# ── C. 連語を組み立てる ──
X(118, PH + '\n私は夏休みを楽しみに待っています。\nI\'m looking (　)(　) the summer vacation.', seq('forward', 'to'), expl='look forward to ～「～を楽しみに待つ」。')
X(118, PH + '\n私たちはお互いに助け合います。\nWe help (　)(　).', seq('each', 'other'), expl='each other「お互い」。')
X(120, PH + '\n私はネコの世話をしなければなりません。\nI have to (　)(　) of my cat.', seq('take', 'care'), expl='take care of ～「～の世話をする」。')
X(119, PH + '\nごみを捨ててはいけません。\nDon\'t (　) the trash (　).', seq('throw', 'away'), expl='throw ～ away「～を捨てる」。')
X(118, PH + '\n夜遅くまで起きていてはいけません。\nDon\'t (　)(　) late.', seq('stay', 'up'), expl='stay up「寝ないで起きている」。')
X(111, PH + '\nイヌがその女性の足元にいました。\nA dog was (　) her (　).', seq('at', 'feet'), expl='at one\'s feet「～の足元に」。her を入れて at her feet。')
X(119, PH + '\nニュースによれば、明日は雨が降るでしょう。\n(　)(　) the news, it will rain tomorrow.', seq('According', 'to'), expl='according to ～「～によれば」。')
X(118, PH + '\n私は日本の文化に興味があります。\nI\'m (　)(　) Japanese culture.', seq('interested', 'in'), expl='be interested in ～「～に興味がある」。')
X(116, PH + '\nかばんから本を取り出しなさい。\n(　) the book (　) of your bag.', seq('Take', 'out'), expl='take ～ out of ...「…から～を取り出す」。')

# ── D. 似た語・まぎらわしい語の使い分け ──
X(115, WH + '［two / too / to］\nI have (　) dogs. I go (　) the park with them. My sister likes dogs, (　).', seq('two', 'to', 'too'), expl='two＝2、to＝～へ、too＝～も。')
X(115, WH + '［its / it\'s］\nThis is my dog. (　) name is Pochi. (　) very cute.', seq('Its', "It's"), expl='Its＝それの、It\'s＝It is（それは～だ）。')
X(117, WH + '［there / their］\nKen and Mai are my friends. (　) house is near the park. I often go (　).', seq('Their', 'there'), expl='Their＝彼らの、there＝そこへ。')
X(117, WH + '［whose / who\'s］\n(　) bag is this? — It\'s mine.', ['Whose'], expl='「だれの」は Whose。Who\'s は Who is の短縮形。')
X(116, WH + '［some / any］\nI have (　) pencils, but I don\'t have (　) erasers.', seq('some', 'any'), expl='肯定文は some、否定文は any。')
X(118, WH + '［will / won\'t］\nIt (　) rain tomorrow. We can play soccer.', ["won't"], expl='あとに「サッカーができる」と続くので、雨は降らない。won\'t＝will not「～しないだろう」。')
X(120, WH + '［quiet / quickly］\nPlease be (　) in the library.', ['quiet'], expl='「静かな」は quiet。')
X(117, WH + '［where / were］\n(　) is the nurse\'s office?', ['Where'], expl='「どこ」は Where。were は are の過去形。')

# ── E. なかまはずれ・反対の意味 ──
X(118, ODD + '\nア sunny　イ rainy　ウ snowy　エ hungry', ['エ'], expl='sunny・rainy・snowy は天気。hungry（空腹な）だけちがう。')
X(117, ODD + '\nア nurse　イ chef　ウ doctor　エ office', ['エ'], expl='nurse・chef・doctor は職業（人）。office は場所。')
X(119, ODD + '\nア headache　イ fever　ウ toothache　エ medicine', ['エ'], expl='headache・fever・toothache は症状。medicine（薬）だけちがう。')
X(114, ODD + '\nア Australia　イ Canada　ウ China　エ Chinese', ['エ'], expl='3つは国名。Chinese は「中国の、中国語」。')
X(118, ODD + '\nア uncle　イ aunt　ウ father　エ holiday', ['エ'], expl='uncle・aunt・father は家族。holiday は「休日」。')
X(115, '次の語と反対の意味の語を、巻末の単語から選んで順に書こう（カンマで区切る）。\nup ⇔ (　)　／　inside ⇔ (　)　／　come ⇔ (　)', seq('down', 'outside', 'go'), expl='up⇔down、inside⇔outside、come⇔go。')
X(117, '次の語と反対の意味の語を、順に書こう（カンマで区切る）。\nleft ⇔ (　)　／　early ⇔ (　)　／　hot ⇔ (　)', seq('right', 'late', 'cold'), expl='left⇔right、early⇔late、hot⇔cold。')
X(119, '次の語と反対の意味の語を、順に書こう（カンマで区切る）。\nlarge ⇔ (　)　／　before ⇔ (　)　／　difficult ⇔ (　)', seq('small', 'after', 'easy'), expl='large⇔small、before⇔after、difficult⇔easy。')

# ── F. 場面に合う決まった表現 ──
X(117, '場面に合う表現を選ぼう。\n（道をたずねられて、答え終わったあとにお礼を言われたとき）\nア You\'re welcome.　イ Excuse me.　ウ I see.', ['ア'], expl='お礼への返事は You\'re welcome.')
X(120, '場面に合う表現を選ぼう。\n（友達が「頭が痛い」と言ったとき）\nア That\'s too bad.　イ Sounds interesting.　ウ Just kidding.', ['ア'], expl='相手の不調には That\'s too bad.「それはいけませんね」。')
X(118, '場面に合う表現を選ぼう。\n（話を切り出して「ねえ、あのね」と言うとき）\nア You know what?　イ I have no idea.　ウ Of course.', ['ア'], expl='You know what? は話を切り出す表現。')
X(118, '場面に合う表現を選ぼう。\n（質問の答えがまったくわからないとき）\nア I have no idea.　イ I got it.　ウ Here you are.', ['ア'], expl='I have no idea.「わかりません」。')
X(119, '場面に合う表現を選ぼう。\n（友達に「ほら、見て」と何かを見せるとき）\nア There it is.　イ Look at this.　ウ That\'s right.', ['イ'], expl='「これを見て」は Look at this.')
X(85, '場面に合う表現を選ぼう。\n（久しぶりに友達に会ったとき）\nア Long time no see.　イ See you.　ウ No one.', ['ア'], expl='Long time no see.「久しぶりだね」。')
X(118, '場面に合う表現を選ぼう。\n（冗談を言ったあとで「ほんの冗談だよ」と言うとき）\nア Just kidding.　イ All right.　ウ Let me see.', ['ア'], expl='Just kidding.「ほんの冗談だよ」。')

# ── G. 語の形をかえる ──
X(117, '次の語を、（　）内の指示にしたがって形をかえて書こう。\nchild（複数形）', ['children'], expl='child の複数形は children。')
X(118, '次の語を、（　）内の指示にしたがって形をかえて書こう。\nI will（短縮形）', ["I'll", 'I’ll'], expl='I will → I\'ll。')
X(116, '次の語を、（　）内の指示にしたがって形をかえて書こう。\nhave（主語が he のときの現在の形）', ['has'], expl='3人称単数現在は has。')

X(120, MEAN + '\nI ate ［too］ much yesterday.\nア ～も　イ あまりに　ウ ～へ', ['イ'], expl='too much で「あまりにたくさん」。文の最後の , too（～も）とはちがう。')
X(111, MEAN + '\nThey stayed at the shop ［for］ a long time.\nア ～のために　イ ～の間　ウ ～に対して', ['イ'], expl='for a long time で「長い間」。for は期間を表す。')
X(120, MEAN + '\nI ［have］ a fever.\nア ～を持っている　イ （病気に）かかっている、～がある　ウ ～を食べる', ['イ'], expl='have a fever で「熱がある」。')
X(119, MEAN + '\n［Hold on］, please.\nア 待ってください　イ 持ってください　ウ 始めてください', ['ア'], expl='Hold on.（命令文）は「待って」。')
X(111, MEAN + '\n［Even］ my father was afraid of the big dog.\nア ～でさえ　イ 平らな　ウ いつも', ['ア'], expl='even ～「～でさえ」。')
X(85, MEAN + '\nShe is my ［only］ friend in this town.\nア ただひとりの、唯一の　イ たくさんの　ウ 新しい', ['ア'], expl='only＝ただひとりの、唯一の。')
X(111, MEAN + '\n"Thank you," the old woman ［replied］.\nア 叫んだ　イ ほほえんだ　ウ 答えた', ['ウ'], expl='reply（答える）の過去形 replied。')
X(111, ODD + '\nア told　イ said　ウ bit　エ bite', ['エ'], expl='told・said・bit は過去形。bite だけがもとの形。')
X(118, PH + '\nさあ、始めましょう。\nLet\'s (　)(　).', seq('get', 'started'), expl='get started「始める」。')
X(117, PH + '\nわかりました。ではまたね。\nI (　)(　). See you.', seq('got', 'it'), expl='I got it.「わかった」。')

u.finish('2026-10-13 Claude作成（特訓・下書き）。英語ワークp84〜85（Reading 1 の単語・重要表現）、p110〜111（Reading 2 の単語・重要表現）、p114〜120（巻末の単語・連語チェック）を写真で確認して作った。ワーク版70問の「日本語を英語1語で書く」問題とは形を変え、1つの語の複数の意味を文から判断する・不規則な過去形を文の中で使う・連語を組み立てる・まぎらわしい語の使い分け・なかまはずれと反対語・場面に合う決まった表現・語形の変化、にした。Reading の物語本文は教科書にあり手元の資料にないので、本文の内容を問う問題は作っていない。')
