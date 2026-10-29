# coding: utf-8
"""国語の特訓下書き用の部品（Claude・2026-10-13）。配信用の本データには書かない。
J()：書き抜きの答えに、文節のあいだの空白あり・なしの両方を登録する（意味は変わらない）。
K()：記号を順に答える問題の書き方のゆれ（「アイウ」「ア、イ、ウ」「ア→イ→ウ」など）を登録する。
"""
def J(*alts):
    out = []
    for a in alts:
        for v in (a, a.replace('　', ''), a.replace('　', ' ')):
            if v not in out: out.append(v)
    return out
def K(*letters):
    out = []
    for sep in ['', '、', ',', '・', '→', ' ', '　']:
        v = sep.join(letters)
        if v not in out: out.append(v)
    return out

# ── 2026-10-14 採点の点検で見つけた「自然な答えが不正解になる」「逆の答えが正解になる」ものを、原稿側の条件で直す ──
import re as _re
_LETTERS = set('アイウエオカキクケコ')
_RUBRIC_FIX = {
    # 問題文の一部: (足すキーワード {条件番号: [語]}, reject の語)
    '駅前の花だんに一年中花がさいているのはなぜですか': ({2: ['ので']}, []),
    'この活動には、どんなよいことがありますか': ({1: ['へる', 'へら', 'へっ']}, ['増え', 'ふえ']),
    '「天敵」「ひな」という言葉を使って、四十字以内でまとめよう': ({}, ['離れ', 'はなれ', '遠ざ', 'とおざ']),
    '筆者の主張を、文章中の言葉を使って三十字以内でまとめよう': ({}, ['共通語を大切', '共通語を受け', '共通語こそ']),
}
_RUBRIC_DROP = {'この活動には、どんなよいことがありますか': {1: ['へ']}}

def polish(u):
    for q in u.Q:
        a = q['answer']; p = q['prompt']
        if a['kind'] == 'set':
            if all(len(it) == 1 and it[0] in _LETTERS for it in a['items']):
                a['letters'] = True                      # 「アウオ」のように区切らずに書いても読む
            else:
                a['plain'] = True
                if '区切' not in p:
                    q['prompt'] = p + '（「、」で区切って書こう）'
        elif a['kind'] == 'number' and not a.get('units'):
            if 'いくつ' in p:
                a['units'] = ['拍', 'つ'] if '拍' in p else ['つ']
        elif a['kind'] == 'exact' and '書き抜' in p:
            acc = a['accepted']
            for v in list(acc):
                for w in ('「' + v + '」',):
                    if w not in acc: acc.append(w)   # かぎかっこをつけて書き抜いても正解
        elif a['kind'] == 'rubric':
            for key, (adds, rej) in _RUBRIC_FIX.items():
                if key in p:
                    for i, words in _RUBRIC_DROP.get(key, {}).items():
                        a['criteria'][i]['any'] = [t for t in a['criteria'][i]['any'] if t not in words]
                    for i, words in adds.items():
                        a['criteria'][i]['any'] += [t for t in words if t not in a['criteria'][i]['any']]
                    if rej: a['reject'] = [rej]
