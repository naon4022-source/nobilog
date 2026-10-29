"""特訓（tokkun）70問の下書きを組み立てる部品。
答えは問題ごとに手で書いた値（文字列）。検算は check.py が別の道すじ（jmath.py・総当たり）で行う。"""
import json
from pathlib import Path

ROOT = Path('/Users/shimizunaotomoo/Desktop/my-app')
DONE = ROOT / '教材整理/確認済み'
OUT = Path(__file__).resolve().parent.parent / '原稿'
UNITS = []


def textbook_pages(key):
    """同じ小単元の教科書問題に記録された、教科書の写真（ファイル・sha256・ページ）"""
    d = json.loads((DONE / f'workbook-math-1-{key}.json').read_text(encoding='utf-8'))
    pages = {}
    for q in d['questions']:
        t = q.get('textbook')
        if t: pages.setdefault(t['page'], {'file': t['file'], 'sha256': t['sha256'], 'page': t['page']})
    return d, pages


class Unit:
    def __init__(self, key, ref, note):
        self.key = key
        self.base, self.pages = textbook_pages(key)
        self.ref = ref
        self.note = note
        self.qs = []
        UNITS.append(self)

    # ---- 問題を足す ----
    def add(self, answer, prompt, ex, v, near=None, nearHint=None, ref=None, page=None):
        q = {'prompt': prompt, 'answer': answer, 'explanation': ex, 'v': v,
             'ref': '参考：' + (ref or self.ref) + '（特訓・オリジナル問題）', 'page': page}
        if near: q['near'] = [str(x) for x in near]
        if nearHint: q['nearHint'] = nearHint
        self.qs.append(q)
        return q

    def calc(self, expr, ans, ex, lead='次の計算をしよう。', units=None, **kw):
        a = {'kind': 'number', 'value': str(ans)}
        if units: a['units'] = units
        return self.add(a, lead + '\n' + expr, ex, 'auto', **kw)

    def eq(self, equation, ans, ex, lead='次の方程式を解こう。', **kw):
        return self.add({'kind': 'number', 'value': str(ans)}, lead + '\n' + equation, ex, 'autoeq', **kw)

    def num(self, prompt, ans, ex, v, units=None, **kw):
        a = {'kind': 'number', 'value': str(ans)}
        if units: a['units'] = units
        return self.add(a, prompt, ex, v, **kw)

    def nums(self, prompt, values, ex, v, ordered=False, **kw):
        a = {'kind': 'numbers', 'values': [str(x) for x in values]}
        if ordered: a['ordered'] = True
        return self.add(a, prompt, ex, v, **kw)

    def pick(self, prompt, letters, ex, v, **kw):
        a = {'kind': 'set', 'items': [[c] for c in letters], 'letters': True}
        return self.add(a, prompt, ex, v, **kw)

    def choice(self, prompt, letter, ex, v, **kw):
        return self.add({'kind': 'exact', 'accepted': [letter]}, prompt, ex, v, **kw)

    def order(self, prompt, letters, ex, v, **kw):
        acc = [sep.join(letters) for sep in ('', '、', ',', ' ', '・', '→', '<', '＜')]
        return self.add({'kind': 'exact', 'accepted': acc}, prompt, ex, v, **kw)

    def coord(self, prompt, xy, ex, v, **kw):
        """座標の答え。xy は ('2', '-3') のような文字列の組。v は vutil.pt(x, y) を返す"""
        x, y = xy
        acc = [f'({x},{y})', f'({x}、{y})', f'{x},{y}', f'{x}、{y}']
        return self.add({'kind': 'exact', 'accepted': acc, 'compact': True}, prompt, ex, v, **kw)

    def word(self, prompt, accepted, ex, v, **kw):
        return self.add({'kind': 'exact', 'accepted': list(accepted)}, prompt, ex, v, **kw)

    def simp(self, expr, ans, ex, lead='次の計算をしよう。', form=None, **kw):
        a = {'kind': 'expr', 'value': ans}
        if form: a['form'] = form
        return self.add(a, lead + '\n' + expr, ex, 'auto', **kw)

    def expr(self, prompt, ans, ex, v, form=None, **kw):
        a = {'kind': 'expr', 'value': ans}
        if form: a['form'] = form
        return self.add(a, prompt, ex, v, **kw)

    def rel(self, prompt, ans, ex, v, **kw):
        return self.add({'kind': 'relation', 'value': ans}, prompt, ex, v, **kw)

    # ---- 書き出し ----
    def unit_json(self):
        b = self.base
        page0 = min(self.pages)
        qs = []
        for i, q in enumerate(self.qs, 1):
            tb = self.pages.get(q['page'] or page0, self.pages[page0])
            item = {'id': f'tokkun-math-1-{self.key}-{i}', 'type': 'input', 'prompt': q['prompt'],
                    'answer': q['answer'], 'explanation': q['explanation'],
                    'source': {'file': tb['file'], 'sha256': tb['sha256'], 'page': tb['page'], 'number': '特訓（教科書の考え方をもとにしたオリジナル）'},
                    'ref': q['ref'], 'origin': 'original', 'reviewed': False, 'difficulty': 'hard', 'bank': 'tokkun',
                    'textbook': dict(tb)}
            for k in ('near', 'nearHint', 'image', 'imageAlt'):
                if k in q: item[k] = q[k]
            qs.append(item)
        return {'id': f'tokkun-math-1-{self.key}', 'bank': 'tokkun', 'mode': 'workbook', 'subject': '数学', 'grade': 1,
                'title': b['title'] + '（特訓）', 'majorTitle': b['majorTitle'], 'status': 'preparing', 'size': 70,
                'schedule': 'marks', 'questions': qs, 'tests': [], 'reviewNote': self.note}

    def write(self):
        OUT.mkdir(parents=True, exist_ok=True)
        p = OUT / f'tokkun-math-1-{self.key}.json'
        p.write_text(json.dumps(self.unit_json(), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        return p
