# coding: utf-8
"""英語1年「小学校の復習（アルファベット・ヘボン式ローマ字・基本の単語）」の特訓70問（Claude・2026-10-13）。
範囲：英語ワーク p2〜5（大文字・小文字、似ている文字、ヘボン式ローマ字の表（shi・chi・tsu・fu・ji・zu・sha・cha・ja など）、
曜日・月の名前、フレーズで覚える動詞、つづりに注意したい単語（l と r・a と o・n と m・b と v）、品詞の名前）。
使わないもの：小さい「っ」・のばす音・「ん」のあとの区切りなど、p3の表にないローマ字の決まり。
単語を入れかえただけの問題は作らず、順番・規則・誤りさがし・組み合わせで考える問いにした。
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tokkun_common import Unit
from tokkun_textbook import TUnit
from tokkun_english import ev, seq

u = TUnit('tokkun-english-1-review', 'アルファベット・ローマ字・基本の単語（特訓）', '小学校の復習', '英語', 1,
         {2: 'source-0441', 3: 'source-0441', 4: 'source-0442', 5: 'source-0442'},
         '英語ワーク', ['確認済み/workbook-english-1-review.json', '確認済み/workbook-english-1-words.json'], '英語教科書')
X = u.X
def CS(*a): return list(a)  # 大文字・小文字を区別する答え
def exact_case(*a):
    u.Q[-1]['answer']['caseSensitive'] = True

# ── A. アルファベットの順番を考える ──
X(2, 'アルファベットの順で、大文字の K から数えて3つあとの文字を大文字で書こう（K は数えない）。', ['N'], expl='K の次から L・M・N。3つあとは N。'); exact_case()
X(2, 'アルファベットの順で、ちょうどまん中にある2文字（13番目と14番目）を大文字で順に書こう（カンマで区切る）。', seq('M', 'N'), expl='26文字の13番目は M、14番目は N。'); exact_case()
X(2, 'アルファベットの順で、H と L の間にある文字はいくつあるか。数字で答えよう。', ['3', '3つ', '三つ'], expl='H と L の間は I・J・K の3つ。')
X(2, '次の単語を、アルファベットの順（辞書にのっている順）に並べかえよう（カンマで区切る）。\ncamp / apple / bird', seq('apple', 'bird', 'camp'), expl='最初の文字で比べる。a→b→c の順。')
X(2, '次の単語を、アルファベットの順（辞書にのっている順）に並べかえよう（カンマで区切る）。\nwarm / work / war', seq('war', 'warm', 'work'), expl='w・a までが同じなら3文字目で比べる。war は warm の前（短いほうが先）。work は2文字目が o なので最後。')
X(2, '次の単語を、アルファベットの順（辞書にのっている順）に並べかえよう（カンマで区切る）。\nmember / music / map', seq('map', 'member', 'music'), expl='2文字目で比べる。a→e→u の順。')
X(2, '大文字が A から Z までの26文字のうち、「たての線1本だけ」で書ける大文字を書こう。', ['I'], expl='I はたての線1本（上と下の横線をつける書き方もあるが、基本はたて線）。'); exact_case()

# ── B. 似ている文字を区別する ──
X(2, '次の小文字の組のうち、左右を反対にすると同じ形になる組を選ぼう。\nア b と d　イ h と n　ウ f と t', ['ア'], expl='b と d は丸の位置が左右反対。h と n は線の長さ、f と t は曲がり方がちがう。')
X(2, '次の英単語のうち、つづりが正しいものを選ぼう。\nア bog（男の子）　イ boy（男の子）　ウ doy（男の子）', ['イ'], expl='「男の子」は boy。b と d、y と g をとりちがえない。')
X(2, '次の英単語の中で、小文字の n と m をとりちがえてつづりがまちがっているものを選ぼう。\nア nember　イ number　ウ camp', ['ア'], expl='「メンバー」は member。nember は m を n とまちがえている。')

# ── C. ヘボン式ローマ字のきまり ──
X(3, '「し」「ち」「つ」「ふ」をヘボン式ローマ字で順に書こう（カンマで区切る）。', seq('shi', 'chi', 'tsu', 'fu'), expl='ヘボン式では shi・chi・tsu・fu と書く（si・ti・tu・hu ではない）。')
X(3, '次のうち、ヘボン式ローマ字として正しくないものを選ぼう。\nア sushi　イ tikatetu　ウ fuji', ['イ'], expl='「ちかてつ」はヘボン式では chikatetsu。ti・tu は使わない。')
X(3, '次のうち、ヘボン式ローマ字として正しくないものを選ぼう。\nア huton　イ futon　ウ shika', ['ア'], expl='「ふとん」は futon。「ふ」は fu。')
X(3, '次のローマ字には、ヘボン式ではない書き方が1か所ある。正しいヘボン式に直して書こう。\nsiro（しろ）', ['shiro'], expl='「し」は shi。shiro。')
X(3, '「ぢ」と「づ」は、ヘボン式ローマ字でそれぞれ何と書くか。順に書こう（カンマで区切る）。', seq('ji', 'zu'), expl='p3 の表では、ダ行の「ぢ」はザ行の「じ」と同じ ji、「づ」は「ず」と同じ zu。')
X(3, 'ヘボン式ローマ字の「ja」「ju」「jo」は、ひらがなで何と読むか。順に書こう（カンマで区切る）。', seq('じゃ', 'じゅ', 'じょ'), expl='ja＝じゃ、ju＝じゅ、jo＝じょ。')
X(3, '次の言葉をヘボン式ローマ字で書くと、何文字のアルファベットになるか。数字で答えよう。\nちず（地図）', ['5', '5文字', '五文字'], expl='chizu で c・h・i・z・u の5文字。')
X(3, '「しゃ」「ちゃ」「じゃ」をヘボン式ローマ字で順に書こう（カンマで区切る）。', seq('sha', 'cha', 'ja'), expl='sha・cha・ja。sya・tya・zya ではない。')
X(3, '次のローマ字を読んで、ひらがなで書こう。\nfuyu no chawan', ['ふゆのちゃわん', 'ふゆ の ちゃわん'], expl='fuyu＝ふゆ、no＝の、chawan＝ちゃわん。')
X(3, '次のローマ字を読んで、ひらがなで書こう。\nshuji', ['しゅじ'], expl='shu＝しゅ、ji＝じ。')
X(3, '次の地名をヘボン式ローマ字で書こう（最初の文字は大文字）。\nちちぶ（秩父）', ['Chichibu'], expl='chi・chi・bu で Chichibu。'); exact_case()
X(3, '次の人名を「姓 名」の順にヘボン式ローマ字で書こう（それぞれ最初は大文字）。\nふじた ちかこ', ['Fujita Chikako'], expl='ふじた＝Fujita、ちかこ＝Chikako。'); exact_case()

# ── D. 曜日・月を考える ──
X(4, '今日が Friday（金曜日）のとき、2日後の曜日を英語で書こう（最初は大文字）。', ['Sunday'], expl='金曜日の2日後は日曜日。Sunday。'); exact_case()
X(4, '今が April（4月）のとき、5か月前の月を英語で書こう（最初は大文字）。', ['November'], expl='4月の5か月前は11月。November。'); exact_case()
X(4, '次の曜日のうち、Thursday の次の日を選ぼう。\nア Tuesday　イ Friday　ウ Wednesday', ['イ'], expl='Thursday（木曜日）の次は Friday（金曜日）。')
X(4, '次の月の名前を、1年の順に並べかえよう（カンマで区切る）。\nOctober / August / December / June', seq('June', 'August', 'October', 'December'), expl='6月→8月→10月→12月。')
X(4, '次の曜日の名前を、日曜日から始まる1週間の順に並べかえよう（カンマで区切る）。\nSaturday / Tuesday / Wednesday / Sunday', seq('Sunday', 'Tuesday', 'Wednesday', 'Saturday'), expl='日→火→水→土。')
X(4, '月の名前のうち、R の文字をふくまないものを1年の順にすべて書こう（カンマで区切る）。', seq('May', 'June', 'July', 'August'), expl='5月～8月（May・June・July・August）は R をふくまない。ほかの8つは r をふくむ。')
X(4, '曜日の名前のうち、T で始まるものを2つ、週の順に書こう（カンマで区切る）。', seq('Tuesday', 'Thursday'), expl='火曜日 Tuesday と木曜日 Thursday。')
X(4, '月の名前のうち、J で始まるものを3つ、1年の順に書こう（カンマで区切る）。', seq('January', 'June', 'July'), expl='1月 January・6月 June・7月 July。')
X(4, '次の英文には、大文字にしなければならない単語が2つある。正しく直して全文を書こう。\nmy birthday is in april.', ['My birthday is in April.'], expl='文の最初の My と、月の名前 April は大文字で始める。'); exact_case()
X(4, '次の英文には、大文字にしなければならない単語が2つある。正しく直して全文を書こう。\ni play tennis on sunday.', ['I play tennis on Sunday.'], expl='「私は」の I と曜日の Sunday は大文字。'); exact_case()

# ── E. つづりに注意したい単語 ──
X(5, '次の英単語のうち、l と r をとりちがえてつづりがまちがっているものを選ぼう。\nア library　イ libraly　ウ right', ['イ'], expl='「図書館」は library。libraly は最後の r を l とまちがえている。')
X(5, '次の英単語のうち、a と o をとりちがえてつづりがまちがっているものを選ぼう。\nア work（働く）　イ company（会社）　ウ wark（働く）', ['ウ'], expl='「働く」は work。wark は o を a とまちがえている。')
X(5, '次の英単語のうち、b と v をとりちがえてつづりがまちがっているものを選ぼう。\nア event　イ remenber　ウ bolleyball', ['ウ'], expl='「バレーボール」は volleyball。bolleyball は v を b とまちがえている。イは m を n とまちがえた誤り。')
X(5, 'war（戦争）と warm（あたたかい）のつづりのちがいは何か。次から選ぼう。\nア 最後に m があるかどうか　イ 最初の文字　ウ a と o', ['ア'], expl='war の最後に m をつけると warm。1文字で意味が大きく変わる。')
X(5, 'light（光）と right（右）のつづりのちがいは何か。日本語で答えよう。', ['最初の文字がlかrか', '最初の文字', 'lとr', 'lとrのちがい', '最初がlかrか'], expl='最初の文字が l か r かのちがい。')
X(5, 'play（演奏する）と pray（祈る）のように、1文字のちがいで意味が変わる組を、次から選ぼう。\nア walk（歩く）と work（働く）　イ camp と camps　ウ number と numbers', ['ア'], expl='walk と work は a と o・l と r のちがいで意味が変わる。イ・ウは同じ語の単数と複数。')

# ── F. フレーズと品詞 ──
X(5, '「本を読む」「英語を勉強する」「ピアノをひく」「カレーを食べる」の4つのフレーズで、動詞を順に書こう（カンマで区切る）。', seq('read', 'study', 'play', 'eat'), expl='read a book・study English・play the piano・eat curry。')
X(5, '次の英語のフレーズのうち、まちがっているものを選ぼう。\nア play the piano　イ read a book　ウ eat the English', ['ウ'], expl='「英語を勉強する」は study English。eat（食べる）と English は合わない。')
X(5, '次の単語のうち、名詞ではないものを選ぼう。\nア library　イ warm　ウ company　エ member', ['イ'], expl='warm（あたたかい）は形容詞。ほかはものや人の名前で名詞。')
X(5, '次の単語のうち、動詞であるものを選ぼう。\nア information　イ remember　ウ volleyball', ['イ'], expl='remember（思い出す）は動作を表す動詞。ほかは名詞。')
X(5, '次の単語を、名詞・動詞・形容詞に分けたとき、形容詞に入るものを選ぼう。\nア event　イ warm　ウ study', ['イ'], expl='warm（あたたかい）はようすを表すので形容詞。event は名詞、study は動詞。')
X(5, '次の文の（　）に入る単語の品詞として正しいものを選ぼう。\nI (　) English every day.（私は毎日英語を勉強します）\nア 名詞　イ 動詞　ウ 形容詞', ['イ'], expl='「勉強する」は動作なので動詞 study が入る。')
X(5, '「number」「remember」「member」に共通する文字の並びを、小文字で書こう（4文字）。', ['mber'], expl='3つとも最後が m-b-e-r。'); exact_case()


# ── 2026-10-14 追加：英語教科書 p4〜5 Classroom English（台帳登録案。写真を開いて表現と場面の絵まで確認）──
# 場面から表現を選ぶ・表現から行動を選ぶ問題。訳をそのまま答えるだけにしない。
CR = '次の場面で、英語で何と言うとよいか。教科書の「役に立つ表現」から書こう。'
u.strip = getattr(u, 'strip', ()) + (CR,)
X('T5', CR + '\n先生の話が聞き取れなかったので、もう一度言ってほしい。', ['Pardon?', 'Pardon', 'Pardon me?'], expl='聞き返すときは Pardon?（上げ調子で言う）。')
X('T5', CR + '\n授業中に、先生にたずねたいことがあるので手をあげた。', ev('I have a question.'), expl='質問するときは I have a question.')
X('T5', CR + '\n忙しそうにしている先生に、話しかけたい。', ['Excuse me.', 'Excuse me'], expl='話しかけるときは Excuse me.')
X('T5', CR + '\n友だちにたのまれたプリントを手渡す。', ev('Here you are.'), expl='ものを渡すときは Here you are.')
X('T5', CR + '\n友だちの足をうっかりふんでしまった。', ev("I'm sorry."), expl='謝るときは I\'m sorry.')
X('T5', '「制服」は英語で何と言うのかを、先生にたずねたい。教科書の表現を使って書こう。', ev('How do you say "seifuku" in English?', "How do you say 'seifuku' in English?", 'How do you say seifuku in English?', 'How do you say “seifuku” in English?'),
  expl='英語で何と言うか聞くときは How do you say ～ in English?')
X('T5', '先生が黒板に書いた単語のつづりが分からない。つづりをたずねる文を書こう。', ev('How do you spell that word?', 'How do you spell this word?', 'How do you spell it?'), expl='つづりを聞くときは How do you spell that word?')
X('T4', '先生が "Open your textbooks to page five." と言った。何をすればよいか。次から選ぼう。\nア 教科書の5ページを開く　イ 教科書を5冊集める　ウ 教科書を閉じる', ['ア'], expl='open your textbooks to page five＝教科書の5ページを開きなさい。')
X('T4', '先生が "Make a group of four." と言った。何をすればよいか。次から選ぼう。\nア 4人のグループを作る　イ 4ページを読む　ウ 4回くり返す', ['ア'], expl='make a group of four＝4人のグループを作りなさい。')
X('T4', '先生が "Get into pairs." と言った。何をすればよいか。次から選ぼう。\nア 2人1組になる　イ 席にもどる　ウ 前に出てくる', ['ア'], expl='get into pairs＝ペア（2人1組）になりなさい。')
X('T4', '先生の指示のうち、「教室の前に出てくる」ことを表すものを選ぼう。\nア Come up to the front.　イ Go back to your seat.　ウ Sit down, please.', ['ア'], expl='Come up to the front.＝前に出てきなさい。Go back to your seat. は席にもどりなさい。')
X('T4', '先生が "Repeat after me." と言った。何をすればよいか。次から選ぼう。\nア 先生のあとについて言う　イ 先生より先に言う　ウ 何も言わずに聞く', ['ア'], expl='repeat after me＝私のあとについてくり返しなさい。')
X('T4', '先生の指示のうち、反対の動作になっている組み合わせを選ぼう。\nア Stand up, please. と Sit down, please.　イ Listen to the audio. と Look at the blackboard.　ウ Get into pairs. と Repeat after me.', ['ア'],
  expl='立ちなさい（Stand up）と座りなさい（Sit down）は反対の動作。Open your textbooks と Close your textbooks も反対。')

u.finish('2026-10-13（2026-10-14 英語教科書 p4〜5 Classroom English から13問追加。教科書は台帳登録案で、95ファイル中92は画像の中身がないため、それ以外のページは使っていない） Claude作成（特訓・下書き）。英語ワークp2〜3（アルファベット・似ている文字・ヘボン式ローマ字の表）、p4〜5（曜日・月・フレーズ・つづりに注意したい単語・品詞のTips）を写真で確認し、その範囲だけで作った。ワーク版70問の「1文字・1単語を書く」問題より一段難しく、順番を数える・辞書の順に並べる・形の似た文字の関係・ヘボン式でないつづりを直す・曜日や月を計算する・大文字のきまりを文で直す・つづりの誤りを見つける・フレーズと品詞の判断、の形にした。小さい「っ」・のばす音など p3 の表にないローマ字の決まりは使っていない。大文字・小文字が答えの一部である問題は、区別して採点する。p2〜5 は1文字・1単語の練習が中心で、ワーク版70問がほぼ出しきっている。単語や数だけを変えた同じ形の問題は1問にまとめたため、考え方のちがう問題は45問になった。70問にするには、ローマ字の追加のきまり（小さい「っ」・のばす音）が載っている資料（教科書の小学校の復習ページなど）が必要。')
