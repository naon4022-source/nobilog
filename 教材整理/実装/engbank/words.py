"""英語：Reading 1・2 の語句と巻末の単語・連語チェック（ワーク p84〜85・110〜111・114〜120）"""
from eng import unit, EN, CS, T, C, SEQ, R
from l1 import FILL

def words():
    u = unit('words', "Reading 1・2 の語句と単語・連語チェック", '単語・連語', {84, 85, 110, 111, 114, 115, 116, 117, 118, 119, 120},
             "2026-10-07 Claude作成。英語ワークp84〜85（Reading1 Fox and Tiger の単語チェック・重要表現）、p110〜111（Reading2 An Old Woman and a Dog の単語チェック・重要表現）、p114〜120（巻末の単語・連語のチェック）を写真で確認し、例文と場面を変えて作り直した。物語の本文は教科書の写真が読み込めないため問わない。手書きの答えは使っていない。")
    q = u.q
    W = "を英語1語で書こう。"
    # Reading 1
    for ja, en, nr, page in [("「～を信じる」", "believe", ["beleive", "belive"], 84), ("「～についてくる［いく］」", "follow", ["folow", "fallow"], 84),
                             ("「すぐに」", "soon", ["soom", "sun"], 84), ("「簡単な、やさしい」", "easy", ["eazy", "easily"], 84),
                             ("tell の過去形", "told", ["telled", "tolled"], 84), ("「～に頼む、たずねる」", "ask", ["aks", "asked"], 84),
                             ("「あとで、のちに」", "later", ["latter", "late"], 84), ("「うそつき」", "liar", ["lier", "lyer"], 85),
                             ("「彼自身」", "himself", ["hisself", "himselves"], 85), ("「起こる、生じる」", "happen", ["hapen", "happened"], 85),
                             ("「～をだます」", "trick", ["trik", "tric"], 85), ("「（せきの音）ゴホン、せき」", "cough", ["coff", "caugh"], 85),
                             ("「怖がって、恐れて」", "afraid", ["afraide", "afreid"], 85), ("「ただひとりの、唯一の」", "only", ["onry", "onley"], 85)]:
        q(page, "単語チェック", "Reading 1", ja + W, EN(en), f"{en}。", near=nr)
    q(84, "重要表現", "Reading 1", FILL + "\n私は逃げ出したいです。\nI want to (　)(　).（2語）", EN("run away"), "run away＝逃げる。", near=["run out", "ran away"])
    q(84, "重要表現", "Reading 1", FILL + "\nこのごろ、彼女はひとりでいます。\nShe's (　) these days.（1語）", EN("alone"), "alone＝ひとりで。", near=["lonely", "along"])
    q(84, "重要表現", "Reading 1", FILL + "\n私の弟はしばしば風邪をひきます。\nMy brother often (　) a cold.（1語）", EN("catches", "has"), "catch［have］a cold＝風邪をひく。主語が三人称単数なので catches／has。", near=["catch", "takes"])
    q(85, "重要表現", "Reading 1", FILL + "\n私は家にいましたが、だれも訪ねてきませんでした。\nI stayed home, but (　) visited me.（1語）", EN("nobody", "no one"), "nobody［no one］＝だれも～ない。", near=["anybody", "somebody"])
    q(85, "重要表現", "Reading 1", FILL + "\nトラはひとり言を言いました。\nThe tiger talked (　) himself.（1語）", EN("to"), "talk to oneself＝ひとり言を言う。", near=["with", "for"])
    q(85, "重要表現", "Reading 1", FILL + "\n私はクモがこわいです。\nI'm (　)(　) spiders.（2語）", EN("afraid of"), "be afraid of ～＝～をこわがる。", near=["afraid for", "scared"])
    q(85, "重要表現", "Reading 1", FILL + "\nやっぱり、彼は私のただひとりの兄です。\n(　)(　), he is my only brother.（2語）", EN("After all"), "after all＝やはり、結局。", near=["At all", "After that"])
    # Reading 2
    for ja, en, nr, page in [("「のどが渇いた」", "thirsty", ["thirsy", "thursty"], 110), ("「女性」", "woman", ["women", "weman"], 110),
                             ("「静かな」", "quiet", ["quite", "quiat"], 110), ("「ひとりぼっちの、寂しい」", "lonely", ["lonly", "alone"], 110),
                             ("foot（足）の複数形", "feet", ["foots", "feets"], 110), ("buy の過去形", "bought", ["buyed", "brought"], 110),
                             ("think の過去形", "thought", ["thinked", "though"], 110), ("「答える、返事をする」", "reply", ["replay", "repry"], 111),
                             ("「～の内側に［で］」", "inside", ["inside of", "insaid"], 111), ("say の過去形", "said", ["sayed", "sed"], 111),
                             ("「ほほえむ」", "smile", ["smail", "smaile"], 111), ("「（～と）叫ぶ」", "scream", ["screem", "cream"], 111),
                             ("「人に慣れた」", "tame", ["teim", "taim"], 111), ("bite（かむ）の過去形", "bit", ["bited", "bitten"], 111)]:
        q(page, "単語チェック", "Reading 2", ja + W, EN(en), f"{en}。", near=nr)
    q(110, "重要表現", "Reading 2", FILL + "\n彼女は書店へ入りました。\nShe (　)(　) a bookstore.（2語）", EN("went into"), "go into ～ の過去 went into。", near=["go into", "went in"])
    q(110, "重要表現", "Reading 2", FILL + "\n彼はコップ1杯の牛乳を飲みました。\nHe had a (　)(　) milk.（2語）", EN("glass of"), "a glass of ～＝コップ1杯の～。", near=["cup of", "grass of"])
    q(110, "重要表現", "Reading 2", FILL + "\nその転校生はエミの隣にすわっています。\nThe new student is sitting (　)(　) Emi.（2語）", EN("next to"), "next to ～＝～の隣に。", near=["near to", "next of"])
    q(110, "重要表現", "Reading 2", FILL + "\n席について先生の話を聞きなさい。\nPlease (　)(　) and listen to your teacher.（2語）", EN("sit down"), "sit down＝すわる。", near=["sit up", "stand up"])
    q(110, "重要表現", "Reading 2", FILL + "\n彼らは長い間、その店にとどまっていました。\nThey stayed at the shop (　) a long (　).（順に2語）", SEQ(["for", "time"], seps=(" ", "、", ",", ", ", "・")), "for a long time＝長い間。", near=["in time", "for times"])
    q(111, "重要表現", "Reading 2", FILL + "\n彼はネコでさえ怖がりました。\nHe was (　) afraid of cats.（1語）", EN("even"), "even＝～さえ。", near=["ever", "every"])
    q(111, "重要表現", "Reading 2", FILL + "\n私はすぐに跳び上がりました。\nI (　)(　) quickly.（2語）", EN("jumped up"), "jump up の過去 jumped up。", near=["jump up", "jumped down"])
    # 巻末チェック
    for ja, en, nr, page in [("「よく、しばしば」", "often", ["offen", "ofen"], 116), ("「となりの人、近所の人」", "neighbor", ["neighber", "nabor"], 114),
                             ("「いつでも、常に」", "always", ["allways", "alway"], 114), ("「天気」", "weather", ["whether", "wether"], 115),
                             ("「最近」", "recently", ["resently", "recentry"], 116), ("「同級生、クラスメート」", "classmate", ["class mate", "crassmate"], 116),
                             ("「賞」", "prize", ["price", "prise"], 116), ("「文化」", "culture", ["calture", "cultur"], 117),
                             ("「おみやげ」", "souvenir", ["souvenier", "suvenir"], 117), ("「温泉」（2語）", "hot spring", ["hot springs", "hotspring"], 117),
                             ("「ヒント」", "hint", ["hinto", "hent"], 117),
                             ("「おじ」", "uncle", ["ancle", "uncl"], 118), ("「おば」", "aunt", ["ant", "aunte"], 118),
                             ("「試合」（m で始まる）", "match", ["mach", "much"], 118), ("「休日」", "holiday", ["holyday", "horiday"], 118),
                             ("「政府」", "government", ["goverment", "govenment"], 119), ("「持続可能な」", "sustainable", ["sustanable", "sustainabl"], 119),
                             ("「～を再利用する」", "recycle", ["recicle", "reuse"], 119), ("「熱」（病気の）", "fever", ["fiver", "feaver"], 119),
                             ("「薬」", "medicine", ["medisine", "medicin"], 119), ("「世話」", "care", ["cear", "car"], 119)]:
        q(page, "単語・連語のチェック", "巻末チェック", ja + ("を英語で書こう。" if "（2語）" in ja else W), EN(en), f"{en}。", near=nr)
    q(116, "単語・連語のチェック", "巻末チェック", "「～ねえ、あのね」と話を切り出す表現を英語3語で書こう（You で始める）。", EN("You know what?"), "You know what?＝ねえ、あのね。", near=["Do you know what?", "You know?"])
    q(118, "単語・連語のチェック", "巻末チェック", "「ほんの冗談だよ。」を英語2語で書こう（Just で始める）。", EN("Just kidding."), "Just kidding.＝冗談だよ。", near=["Just kid.", "Only kidding."])
    q(118, "単語・連語のチェック", "巻末チェック", "「寝ないで起きている」を英語2語で書こう（stay で始める）。", EN("stay up"), "stay up＝夜ふかしする。", near=["get up", "stand up"])
    q(119, "単語・連語のチェック", "巻末チェック", "「～によれば」を英語2語で書こう（according で始める）。", EN("according to"), "according to ～。", near=["according", "acording to"])
    q(119, "単語・連語のチェック", "巻末チェック", "「～を捨てる」を英語2語で書こう（throw で始める）。", EN("throw away"), "throw away ～＝～を捨てる。", near=["throw out", "throwaway"])
    q(120, "単語・連語のチェック", "巻末チェック", "「家に帰る」を英語2語で書こう（go で始める）。", EN("go home"), "home の前に to はつけない。", near=["go to home", "come home"])
    q(120, "単語・連語のチェック", "巻末チェック", "「承知しました。」を英語2語で書こう（All で始める）。", EN("All right.", "Alright."), "All right.", near=["All light.", "Allright."])
    return u
