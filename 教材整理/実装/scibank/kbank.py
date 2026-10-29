"""70問の小単元（理科など、知識と計算の問題）を組み立てる共通部品。
出典はワークの見開き写真（教材照合台帳で確認済みにしたもの）と、教科書の見開き写真。"""
import json, hashlib, itertools, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
LEDGER_PATH = ROOT / '教材整理/教材照合台帳.json'
LEDGER = {e['file']: e for e in json.loads(LEDGER_PATH.read_text(encoding='utf-8'))}

def spreads(folder, first=2):
    """見開き写真を名前順に並べると、ワークの p2〜3、p4〜5…と続く（目視で確認）"""
    out = {}
    for k, p in enumerate(sorted((ROOT / folder).glob('S__*.jpg'), key=lambda x: x.name)):
        out[first + 2 * k] = out[first + 1 + 2 * k] = f'{folder}/{p.name}'
    return out

_SHA = {}
def sha(name):
    if name not in _SHA: _SHA[name] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    return _SHA[name]

# ---- 答えの形 ----
def T(*accepted, compact=False):
    """用語・ことばの答え（どれか1つと同じなら正解）"""
    a = {'kind': 'exact', 'accepted': list(dict.fromkeys(accepted))}
    if compact: a['compact'] = True
    return a
def C(letters):
    """記号の答え。3つまでは並び順・区切りを自由に（「イ、エ」「エイ」も正解）。4つ以上は組で採点"""
    letters = list(letters)
    if len(letters) <= 3:
        acc = []
        for perm in itertools.permutations(letters):
            for sep in ('、', ',', '', ' ', '・', 'と'):
                acc.append(sep.join(perm))
        return T(*acc)
    return {'kind': 'set', 'items': [[x] for x in letters], 'letters': True}
def SEQ(items, seps=('→', '、', ',', '', ' ', '-')):
    """順番の答え（4→2→3→1 など）。区切りは自由、順番は固定"""
    return T(*[s.join(items) for s in seps])
def N(value, units=(), required=False):
    a = {'kind': 'number', 'value': str(value)}
    if units: a['units'] = list(units)
    if required: a['unitRequired'] = True
    return a
def S(*items):
    """順不同の用語の組（「生産者、消費者」など）。items は同じ意味の言い方の並び"""
    return {'kind': 'set', 'items': [list(x) if isinstance(x, (list, tuple)) else [x] for x in items], 'plain': True}
def R(*criteria, required=(), reject=(), negation=None):
    """記述の答え。criteria は (重み, [どれか入っていればよい語…])。全部そろって正解、半分以上で△"""
    a = {'kind': 'rubric', 'criteria': [{'weight': w, 'any': list(any_)} for w, any_ in criteria]}
    if required: a['required'] = [list(r) for r in required]
    if reject: a['reject'] = [[x] if isinstance(x, str) else list(x) for x in reject]
    if negation: a['allowNegation'] = True
    elif negation is None: a['_auto'] = True  # 正解例に否定語があるときだけ否定を許す（KUnit.q で決める）
    return a

class KUnit:
    def __init__(self, uid, title, major, note, *, subject, mode, book, pages, allowed, tbfolder=None, tbpage=None, tbname='教科書', grade=1):
        self.uid, self.title, self.major, self.note = uid, title, major, note
        self.subject, self.mode, self.book, self.pages, self.allowed = subject, mode, book, pages, set(allowed)
        self.tbfolder, self.tbpage, self.tbname, self.grade = tbfolder, tbpage, tbname, grade
        self.qs, self.prompts = [], set()
    def q(self, page, number, topic, prompt, answer, expl, tb=None, tbnote='', near=(), hint=None, example=None):
        """1問追加。page/number はワークの写真で確かめたページと問題番号。tb は教科書の写真で確かめたページ"""
        assert page in self.allowed, (self.uid, page, prompt)
        assert prompt not in self.prompts, ('重複', self.uid, prompt)
        file = self.pages[page]; led = LEDGER[file]
        n = len(self.qs) + 1
        q = {'id': f'{self.uid}-{n}', 'type': 'input', 'prompt': prompt, 'answer': answer, 'explanation': expl,
             'source': {'id': led['id'], 'file': file, 'sha256': led['sha256'], 'page': page, 'number': number},
             'ref': f'参考：{self.book} p{page} {number}（{topic}）' + (f'・{self.tbname} p{tb}{(" " + tbnote) if tbnote else ""}' if tb else ''),
             'origin': 'adapted', 'reviewed': True, 'difficulty': 'hard'}
        if tb:
            f = self.tbpage(tb)
            q['textbook'] = {'file': f, 'sha256': sha(f), 'page': tb}
        near = [x for x in near if x]
        if answer['kind'] == 'exact': near = [x for x in dict.fromkeys(near) if x not in answer['accepted']]
        if answer['kind'] == 'number':  # 正解と同じ値は「惜しい」に入れない
            from fractions import Fraction as _F
            near = [x for x in dict.fromkeys(near) if _F(x) != _F(answer['value'])]
        if near: q['near'] = near
        if hint: q['nearHint'] = hint
        if answer['kind'] == 'rubric' and answer.pop('_auto', False):
            import re as _re
            if example and _re.search(r'(?:ない|なく|不要|無関係)', example): answer['allowNegation'] = True
        if example is not None: q['example'] = example  # 採点の自己確認用（正解になる答えの例）。出題には使わない
        self.prompts.add(prompt); self.qs.append(q)
        return q
    def json(self):
        assert len(self.qs) == 70, (self.uid, len(self.qs))
        qs = [{k: v for k, v in q.items() if k != 'example'} for q in self.qs]
        return {'id': self.uid, 'mode': self.mode, 'subject': self.subject, 'grade': self.grade, 'title': self.title,
                'majorTitle': self.major, 'status': 'ready', 'size': 70, 'schedule': 'marks', 'questions': qs, 'tests': [],
                'reviewNote': self.note}
    def examples(self):
        """各問の『正解になるはずの答え』（検査用）"""
        out = []
        for q in self.qs:
            a = q['answer']
            if 'example' in q: ex = q['example']
            elif a['kind'] == 'exact': ex = a['accepted'][0]
            elif a['kind'] == 'number': ex = a['value'] + (a.get('units') or [''])[0]
            elif a['kind'] == 'set': ex = '、'.join(x[0] for x in a['items'])
            else: ex = None
            out.append((q, ex))
        return out
