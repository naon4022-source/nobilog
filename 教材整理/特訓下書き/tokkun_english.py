# coding: utf-8
"""英語の特訓下書き用の部品（Claude・2026-10-13）。配信用の本データには書かない。
ev()：英文の答えの書き方の候補を作る（短縮形⇔もとの形、Yes/No のあとのカンマ、’ と '）。
      採点器は大文字・小文字と文末の記号を区別しないので、それ以外のゆれだけを足す。
seq()：（　）が複数ある問題の答え（語をカンマ・スペース・読点で区切る書き方）を作る。
"""
import itertools, re
PAIRS = [("don't", 'do not'), ("I'm", 'I am'), ("you're", 'you are'), ("aren't", 'are not'), ("doesn't", 'does not'),
         ("isn't", 'is not'), ("can't", 'cannot'), ("didn't", 'did not'), ("wasn't", 'was not'), ("weren't", 'were not'),
         ("it's", 'it is'), ("he's", 'he is'), ("she's", 'she is'), ("that's", 'that is'), ("let's", 'let us')]
def _toggles(s):
    # 文の中の短縮形・もとの形の出てくる場所を、それぞれ入れかえ可能にする
    pat = re.compile('|'.join(re.escape(a) + '|' + re.escape(b) for a, b in PAIRS if a != "let's"), re.I)
    parts, last, slots = [], 0, []
    for m in pat.finditer(s):
        parts.append(s[last:m.start()]); w = m.group(0)
        for a, b in PAIRS:
            if w.lower() == a.lower(): slots.append((w, b if w[0].islower() else b[0].upper() + b[1:])); break
            if w.lower() == b.lower(): slots.append((w, a if w[0].islower() else a[0].upper() + a[1:])); break
        parts.append(None); last = m.end()
    parts.append(s[last:])
    out = set()
    for choice in itertools.product(*[(x, y) for x, y in slots]) if slots else [()]:
        it = iter(choice); out.add(''.join(p if p is not None else next(it) for p in parts))
    return out
def ev(*alts, contract=True):
    res = []
    for a in alts:
        forms = _toggles(a) if contract else {a}
        more = set()
        for f in forms:
            more.add(f); more.add(re.sub(r'\b(Yes|No), ', r'\1 ', f))
        for f in list(more): more.add(f.replace("'", '’'))
        for f in sorted(more):
            if f not in res: res.append(f)
    return res[:120]
def seq(*words):
    res = []
    for sep in [', ', ',', ' ', '、', '・', ' / ']:
        for w in ev(sep.join(words), contract=False):
            if w not in res: res.append(w)
    return res
