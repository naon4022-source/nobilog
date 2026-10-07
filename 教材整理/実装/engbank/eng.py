"""英語1年（英語ワーク60枚。教科書の写真は92枚が空のファイルなので参照しない）の設定と、英文の答えの作り方"""
import sys, re, itertools
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scibank'))
from kbank import KUnit, spreads, T, C, SEQ, N, S, R

PAGES = spreads('英語ワーク')  # 目視：名前順 k番目の写真 = ワーク p(2+2k)〜p(3+2k)。最後の写真(k59)は p120 の1ページだけ

def unit(key, title, major, allowed, note):
    return KUnit(f'workbook-english-1-{key}', title, major, note, subject='英語', mode='workbook', book='英語ワーク',
                 pages=PAGES, allowed=allowed)

# 短縮形（左）と元の形（右）。答えにどちらで書いても正解にする（fixed=True の問題を除く）
PAIRS = [("i'm", 'i am'), ("you're", 'you are'), ("we're", 'we are'), ("they're", 'they are'), ("she's", 'she is'),
         ("it's", 'it is'), ("that's", 'that is'), ("what's", 'what is'), ("where's", 'where is'), ("who's", 'who is'),
         ("there's", 'there is'), ("don't", 'do not'), ("doesn't", 'does not'), ("didn't", 'did not'), ("isn't", 'is not'),
         ("aren't", 'are not'), ("wasn't", 'was not'), ("weren't", 'were not'), ("can't", 'cannot'), ("won't", 'will not'),
         ("shouldn't", 'should not'), ("i'll", 'i will'), ("you'll", 'you will'), ("we'll", 'we will'), ("he's", 'he is')]

def _variants(s, fixed):
    out = {s}
    if not fixed:
        for short, long in PAIRS:
            nxt = set()
            for v in out:
                low = v.lower(); nxt.add(v)
                if re.search(r"(?<![a-z'])" + re.escape(short) + r"(?![a-z'])", low):
                    nxt.add(re.sub(r"(?<![a-z'])" + re.escape(short) + r"(?![a-z'])", long, low))
                # 「Yes, I am.」→「Yes, I'm.」のように文の終わりで縮めた形は誤りなので、後ろに語が続くときだけ縮める
                tail = r"(?=\s+[a-z0-9\"'])" if not short.endswith("n't") and short not in ('cannot',) else r"(?![a-z'])"
                pat = r"(?<![a-z'])" + re.escape(long) + tail
                if re.search(pat, low) and short not in ("he's",):
                    nxt.add(re.sub(pat, short, low))
            out = nxt
        for v in list(out):
            if re.search(r"(?<![a-z])can't(?![a-z])|(?<![a-z])cannot(?![a-z])", v.lower()):
                out.add(re.sub(r"can't|cannot", 'can not', v.lower()))
    for v in list(out):
        if "'" in v: out.add(v.replace("'", '’'))
    return out

def EN(*answers, fixed=False):
    """英語の答え（大文字・小文字と文末の . ? ! は採点で区別しない）。短縮形と元の形、’ と ' のどちらでも正解"""
    acc = []
    for a in answers:
        acc.append(a)
        for v in sorted(_variants(a, fixed)):
            if v.lower() not in {x.lower() for x in acc}: acc.append(v)
    return T(*acc)

# 写真で全体を目視した見開き（ワークの左ページ番号 → 見出し）。2026-10-07 Claude が60枚すべてを1枚ずつ確認。
SPREAD_TITLES = {
    2: '小学校の復習 アルファベット／ヘボン式ローマ字', 4: '小学校の復習 単語を確認しよう①②',
    6: 'Lesson1 Part1 I am ～.／I like ～. I don\'t ～.', 8: 'Lesson1 Part1 語句・伝える練習／Part2 You are ～. Are you ～?',
    10: 'Lesson1 Part2 Do you ～?・語句・伝える練習', 12: 'Lesson1 Part3 can／My favorite ～ is ～.',
    14: 'Lesson1 Part3 語句・伝える練習／Joyful Articles アメリカ合衆国', 16: 'Lesson1 まとめテスト',
    18: 'Lesson2 Part1 What\'s ～?／Can you ～?', 20: 'Lesson2 Part1 語句・伝える練習／Part2 What＋名詞 do you like?',
    22: 'Lesson2 Part2 Is it ～?・語句・伝える練習', 24: 'Lesson2 Part3 What do you do ～?／Who is ～?',
    26: 'Lesson2 Part3 When is ～?／文法① be動詞と一般動詞', 28: 'Lesson2 まとめテスト',
    30: '場面別ドリル 自己紹介（Lesson1・2）', 32: 'Lesson3 Part1 過去形（played・went・was）',
    34: 'Lesson3 Part2 過去の否定文（didn\'t・wasn\'t）', 36: 'Lesson3 Part3 過去の疑問文（Did ～?・Were ～?）',
    38: 'Lesson3 まとめテスト', 40: 'Tips for Writing① 日記／Joyful Articles',
    42: 'Lesson4 Part1 三人称単数現在（likes・doesn\'t）', 44: 'Lesson4 Part2 Does ～?',
    46: 'Lesson4 Part3 How many ～?・some／any', 48: 'Lesson4 まとめテスト',
    50: '文法② 人称と一般動詞（現在）／Project1 My Favorite Person', 52: '場面別ドリル 他者紹介（Project1）',
    54: 'Lesson5 Part1 現在進行形', 56: 'Lesson5 Part2 現在進行形の疑問文', 58: 'Lesson5 Part3 重要文／読解のコツ① 主語と動詞',
    60: 'Lesson5 まとめテスト', 62: 'Lesson6 Part1 Which ～?／Why ～? Because ～.', 64: 'Lesson6 Part2 Who ～?／Whose ～?・mine',
    66: 'Lesson6 Part3 him・her（代名詞）', 68: 'Lesson6 まとめテスト', 70: '文法③ 疑問詞で始まる疑問文',
    72: 'Useful Expressions① 校舎案内／文法④ 代名詞', 74: 'Lesson7 Part1 should', 76: 'Lesson7 Part2 have to',
    78: 'Lesson7 Part3 Can I ～?／Can you ～?', 80: 'Lesson7 まとめテスト', 82: 'Joyful Articles 世界の中学校生活／Project2 My Original Sign',
    84: 'Reading1 Fox and Tiger ①②', 86: 'Lesson8 Part1 be going to', 88: 'Lesson8 Part2 will',
    90: 'Lesson8 Part3 感嘆文 What ～!／How ～!', 92: 'Lesson8 まとめテスト', 94: 'Joyful Articles 世界のNew Year／読解のコツ② 代名詞',
    96: '文法⑤ 過去・現在・未来の文', 98: 'Lesson9 Part1 look・sound＋形容詞', 100: 'Lesson9 Part2 There is［are］～.',
    102: 'Lesson9 Part3 Is there ～?', 104: 'Lesson9 まとめテスト', 106: 'Useful Expressions② 体調不良／Project3 Take Action for a Better World',
    108: '場面別ドリル SDGsについての発表（Project3）', 110: 'Reading2 An Old Woman and a Dog ①②', 112: '基本文総チェック',
    114: '単語・連語のチェック（Lesson1〜3）', 116: '単語・連語のチェック（Lesson3〜7）', 118: '単語・連語のチェック（Lesson7〜9・Reading1）',
    120: '単語・連語のチェック（Useful Expressions②・Reading2）',
}
def file_info():
    info = {}
    for left, title in SPREAD_TITLES.items():
        info[PAGES[left]] = ([120] if left == 120 else [left, left + 1], title)
    return info

def CS(*accepted):
    """大文字・小文字も採点する答え（アルファベット・名前の書き方など）。小文字だけのちがいは△"""
    return {'kind': 'exact', 'accepted': list(dict.fromkeys(accepted)), 'caseSensitive': True}
