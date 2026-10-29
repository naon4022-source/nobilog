# 動画の枠にのせる NHK の番組（Claude・2026-10-06）。
# ユーザー指示「教科書の動画、NHKか自分で作成して、できたらNHKでやってほしい」。合う回がある枠はNHK、ない枠は Claude が作った動画（メディア/<ID>.mp4）。
# 中学向けの英語番組が NHK for School にないため、文法が中1と重なる NHK高校講座「ベーシック英語」（英語の基礎を学び直す番組）を使う。
# 回の一覧（series.json）の題名・キーワード・内容説明で選んだ（実視聴は未確認）。放送前の回（2026年度第22回以降）は使っていない。V01＝例題の枠、VP＝ポイントの枠。
NHK = {
 "I am 〜. / I like 〜.": {
  "V01": [
   {
    "label": "友だちをつくろう 〜am/are/is の使い方②（自己紹介）〜（ベーシック英語 2026年度 第8回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180462_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "少し詳しく言ってみよう 〜基本的な一般動詞〜（ベーシック英語 2026年度 第11回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180465_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Are you 〜? / Do you 〜?": {
  "V01": [
   {
    "label": "質問をして、お近づきになろう！ 〜am/are/is を使う疑問文〜（ベーシック英語 2026年度 第9回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180463_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "少し詳しく聞いてみよう 〜一般動詞を使った疑問文〜（ベーシック英語 2026年度 第12回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180466_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "I can 〜. / My favorite 〜 is 〜.": {
  "VP": [
   {
    "label": "できる！っていうときは（can・お願いの can）（ベーシック英語 2025年度 第12回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180220_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "What 〜? で「何」をたずねる": {
  "V01": [
   {
    "label": "誰が？ 何を？（Who・What の疑問文）（ベーシック英語 2025年度 第10回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180218_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "あなたのお気に入りは？ 〜what, who で始まる疑問文〜（ベーシック英語 2026年度 第18回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180472_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Is this 〜? / Who 〜?": {
  "V01": [
   {
    "label": "買い物しよう 〜ものを指し示す this/that など〜（ベーシック英語 2026年度 第10回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180464_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "これは何？ あれは誰？（ベーシック英語 2025年度 第6回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180214_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "When 〜? と be動詞・一般動詞の整理": {
  "VP": [
   {
    "label": "ライフスタイルは人それぞれ 〜what, where, when で始まる疑問文〜（ベーシック英語 2026年度 第19回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180473_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "過去の文（〜した・〜だった）": {
  "V01": [
   {
    "label": "以前やったことを言ってみよう（-ed の過去形）（ベーシック英語 2025年度 第14回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180222_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "今よりも前のことを言う！（was・were）（ベーシック英語 2025年度 第13回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180221_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Does 〜? / How many 〜?": {
  "V01": [
   {
    "label": "いろいろな動きを質問！（Do・Does の疑問文）（ベーシック英語 2025年度 第9回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180217_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "現在進行形（〜している）": {
  "V01": [
   {
    "label": "今やっていることを言ってみよう（現在進行形）（ベーシック英語 2025年度 第17回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180225_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "何してる？ 〜進行中の動作や活動を表す表現〜（ベーシック英語 2026年度 第16回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180470_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Which / Why 〜? Because 〜.": {
  "VP": [
   {
    "label": "「なんで？」と聞きたい（Why・Because）（ベーシック英語 2025年度 第33回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180241_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Whose / Who 〜? と代名詞": {
  "V01": [
   {
    "label": "同じ人について言う（代名詞）（ベーシック英語 2025年度 第7回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180215_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "気に入っていることを伝えよう 〜「私の」「あなたの」〜（ベーシック英語 2026年度 第6回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180460_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "should / have to": {
  "VP": [
   {
    "label": "したいことを言ってみよう（want to・have to）（ベーシック英語 2025年度 第11回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180219_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "Can I 〜? / Can you 〜?": {
  "VP": [
   {
    "label": "してもいいこと／いけないこと 〜can と can’t〜（ベーシック英語 2026年度 第17回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180471_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "be going to / will": {
  "VP": [
   {
    "label": "未来を語ろう！（will・be going to）（ベーシック英語 2025年度 第18回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180226_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "look / sound ＋ 形容詞": {
  "V01": [
   {
    "label": "人やものの外見や特徴を伝えよう 〜look/smell/feel の使い方〜（ベーシック英語 2026年度 第14回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180468_00000",
    "source": "NHK高校講座"
   }
  ],
  "VP": [
   {
    "label": "感じたことを言う（look・sound・smell など）（ベーシック英語 2025年度 第26回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180234_00000",
    "source": "NHK高校講座"
   }
  ]
 },
 "There is / There are 〜.": {
  "VP": [
   {
    "label": "どこに何があるか伝えよう 〜There is a ... / There are ...〜（ベーシック英語 2026年度 第15回・10分）",
    "url": "https://edu.web.nhk/kokokoza/watch/?das_id=D0022180469_00000",
    "source": "NHK高校講座"
   }
  ]
 }
}
