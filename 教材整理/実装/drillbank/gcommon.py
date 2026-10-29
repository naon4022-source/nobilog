"""国語・理科・英語のドリル（写真を名前順に並べた見開き）の共通部品。Claude が全写真を目視して確認。
写真 k 番目（0 から）＝ 印刷ページ first+2k 〜 first+2k+1。最後の写真だけ1ページ（single）。"""
import json, random, itertools, unicodedata as ud
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
LEDGER = {e['file']: e for e in json.loads((ROOT / '教材整理/教材照合台帳.json').read_text(encoding='utf-8'))}

FOLDERS = {'国語': ('ドリル/国語', 2, 104, '国語ドリル'), '理科': ('ドリル/りか', 2, 104, '理科ドリル'), '英語': ('ドリル/英語', 46, 176, '英語ドリル')}

def spreads(subject):
    """{ページ: 台帳のファイル名(NFD)}、{ファイル名: [ページ…]}"""
    folder, first, single, _ = FOLDERS[subject]
    files = sorted((ROOT / folder).glob('S__*.jpg'), key=lambda p: p.name)
    page2file, file2pages = {}, {}
    for k, p in enumerate(files):
        name = ud.normalize('NFD', f'{folder}/{p.name}')
        assert name in LEDGER, name
        l = first + 2 * k
        pages = [l] if l == single else [l, l + 1]
        for pg in pages: page2file[pg] = name
        file2pages[name] = pages
    return page2file, file2pages

def exact(accepted, compact=False, case=False):
    a = {'kind': 'exact', 'accepted': list(dict.fromkeys(accepted))}
    if compact: a['compact'] = True
    if case: a['caseSensitive'] = True
    return a
def number(v, units=None, required=False):
    from fractions import Fraction as F
    v = F(v)
    s = str(v.numerator) if v.denominator == 1 else None
    if s is None:
        d = v.denominator; k = 0
        while d % 2 == 0: d //= 2; k += 1
        m = 0
        while d % 5 == 0: d //= 5; m += 1
        if d == 1:
            n = max(k, m); s = str(abs(v.numerator) * 10 ** n // v.denominator)
            s = s.rjust(n + 1, '0'); s = ('-' if v < 0 else '') + s[:-n] + '.' + s[-n:]
        else: s = f'{v.numerator}/{v.denominator}'
    a = {'kind': 'number', 'value': s}
    if units: a['units'] = list(units)
    if required: a['unitRequired'] = True
    return a
def choice(letters):
    letters = list(letters); acc = []
    for perm in itertools.permutations(letters):
        for sep in ('、', ',', '', ' ', '・'): acc.append(sep.join(perm))
    return exact(acc)
def items(groups):
    """set の答え：groups は [[書き方1, 書き方2…], …]"""
    return {'kind': 'set', 'items': [list(dict.fromkeys(g)) for g in groups], 'plain': True}

class GUnit:
    def __init__(self, uid, subject, title, major, grade=1):
        self.uid, self.subject, self.title, self.major, self.grade = uid, subject, title, major, grade
        self.page2file, _ = spreads(subject)
        self.book = FOLDERS[subject][3]
        self.qs = []; self.prompts = set()
    def add(self, prompt, answer, explanation, page, number, topic, near=(), example=None):
        if prompt in self.prompts: return False
        file = self.page2file[page]; led = LEDGER[file]
        q = {'id': f'{self.uid}-{len(self.qs) + 1}', 'type': 'input', 'prompt': prompt, 'answer': answer, 'explanation': explanation,
             'source': {'id': led['id'], 'file': file, 'sha256': led['sha256'], 'page': page, 'number': number},
             'ref': f'参考：{self.book} p{page} {number}（{topic}）', 'origin': 'adapted', 'reviewed': True, 'difficulty': 'standard'}
        if answer.get('kind') == 'exact':
            near = [x for x in dict.fromkeys(near) if x and x not in answer['accepted']]
        else: near = [x for x in dict.fromkeys(near) if x]
        if near: q['near'] = near
        if example is not None: q['example'] = example
        self.prompts.add(prompt); self.qs.append(q); return True

def fill(u, plan, n=115, limit=80000):
    """plan を順に回して n 問そろえる。最後の15問が確認テスト"""
    i = 0
    while len(u.qs) < n:
        try: plan[i % len(plan)]()
        except (ZeroDivisionError, IndexError, ValueError, AssertionError, StopIteration): pass
        i += 1
        if i > limit: raise SystemExit(f'{u.uid}: {len(u.qs)}問しか作れない')
    u.qs = u.qs[:n]
    return u

def facts(u, rows, r=None):
    """(prompt, answer, explanation, page, number, topic[, near]) の並びを順に出す関数"""
    rows = list(rows)
    if r: r.shuffle(rows)
    it = iter(rows)
    def f():
        row = next(it, None)
        if row is None: return
        p, a, e, page, nb, tp, *nr = row
        u.add(p, a, e, page, nb, tp, nr[0] if nr else ())
    return f, len(rows)

def file_info(subject, titles):
    """titles: {左ページ: 見出し}"""
    p2f, f2p = spreads(subject)
    return {f: (pages, titles.get(pages[0], '')) for f, pages in f2p.items()}

def viewed(subject):
    p2f, _ = spreads(subject)
    return set(p2f)
