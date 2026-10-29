# coding: utf-8
"""数学以外の特訓下書きの共通部品（Claude・2026-10-13）。配信用の本データには書かない。
- N：数値の答え。分数で計算した本当の値と、書いた答え（四捨五入の指示つき）がそろうことを確かめる
- X：言葉・記号の答え（書き方の候補を並べる） / S：すべて答える / R：採点基準（キーワード）
- finish()：70問・重複なし・ワーク/ドリルとの類似度0.9未満・出典が台帳と一致 を確かめて書き出す
"""
from fractions import Fraction as F
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import json, difflib

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/shimizunaotomoo/Desktop/my-app')   # 2026-10-27：作業フォルダを移したので絶対パスにした
LEDGER = {s['id']: s for s in json.loads((ROOT / '教材整理/教材照合台帳.json').read_text())}

import re
UNITS = [('g/cm³', ['g/cm³', 'g/cm3']), ('cm³', ['cm³', 'cm3', 'mL', 'ml']), ('mL', ['mL', 'ml', 'cm³', 'cm3']), ('kg', ['kg']), ('km/s', ['km/s']), ('m/s', ['m/s']),
         ('cm²', ['cm²', 'cm2']), ('Hz', ['Hz', 'ヘルツ']), ('mm', ['mm']), ('km', ['km']), ('cm', ['cm']), ('℃', ['℃', '°C', '度']), ('%', ['%', '％']), ('g', ['g', 'ｇ']),
         ('N', ['N', 'ニュートン']), ('倍', ['倍']), ('秒', ['秒', 's']), ('度', ['度', '°']), ('m', ['m']), ('L', ['L']),
         ('本', ['本']), ('分', ['分']), ('回', ['回']), ('個', ['個', 'こ']), ('年', ['年']), ('対', ['対'])]   # 2026-10-22：本・分・回・個・年・対を追加
def infer_units(prompt):
    # 問題文の「何○か」から、答えにつけてよい単位を決める（見つからなければ単位なし）
    m = re.search(r'何(g/cm³|cm³|mL|kg|km/s|m/s|cm²|Hz|mm|km|cm|℃|%|g|N|倍|秒|度|m|L|本|分(?!の)|回|個|年|対)(?![a-zA-Z³²])', prompt)
    if not m: return None
    return dict(UNITS)[m.group(1)]

def rnd(x, places):
    return (Decimal(x.numerator) / Decimal(x.denominator)).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)

class Unit:
    def __init__(self, uid, title, major, subject, grade, page_src, ref_label, compare_files, strip=()):
        self.uid, self.title, self.major, self.subject, self.grade = uid, title, major, subject, grade
        self.page_src, self.ref_label, self.compare_files, self.strip = page_src, ref_label, compare_files, strip
        self.Q = []
    def N(self, page, prompt, value, exact, places=None, expl=''):
        v = Decimal(value)
        if places is None:
            assert Decimal(exact.numerator) / Decimal(exact.denominator) == v, (prompt, value, float(exact))
        else:
            assert rnd(exact, places) == v, (prompt, value, float(exact))
        ans = {'kind': 'number', 'value': value}
        u = infer_units(prompt)
        if u: ans['units'] = u
        self.Q.append(dict(page=page, prompt=prompt, answer=ans, explanation=expl))
    def X(self, page, prompt, accepted, expl=''):
        # 2026-10-22：「すべて選ぼう」「2つ選ぼう」の記号の答えは、順番を問わない（set・letters）にする。並べかえ（順に）は除く
        a0 = accepted[0]
        if re.search(r'すべて選|[2２二3３三]つ選', prompt) and '順' not in prompt and re.fullmatch(r'[ア-ン](、[ア-ン])+', a0):
            self.Q.append(dict(page=page, prompt=prompt, answer={'kind': 'set', 'items': [[c] for c in a0.split('、')], 'letters': True}, explanation=expl))
            return
        self.Q.append(dict(page=page, prompt=prompt, answer={'kind': 'exact', 'accepted': accepted}, explanation=expl))
    def S(self, page, prompt, items, expl=''):
        ans = {'kind': 'set', 'items': items}
        if all(len(x) and re.fullmatch(r'[ア-ン]', x[0]) for x in items): ans['letters'] = True   # 2026-10-22：記号だけの組は「アウ」のように続けて書いても正解
        self.Q.append(dict(page=page, prompt=prompt, answer=ans, explanation=expl))
    def R(self, page, prompt, criteria, expl=''):
        self.Q.append(dict(page=page, prompt=prompt, answer={'kind': 'rubric', 'criteria': [{'weight': 1, 'any': c} for c in criteria]}, explanation=expl))
    def _clean(self, p):
        for s in self.strip: p = p.replace(s, '')
        return p
    def finish(self, review_note, size=70):
        Q = self.Q
        print(self.uid, '問題数', len(Q))
        assert len({q['prompt'] for q in Q}) == len(Q), 'prompt duplicated'
        prompts = [self._clean(q['prompt']) for q in Q]
        others = []
        for f in self.compare_files:
            d = json.loads((ROOT / '教材整理' / f).read_text())
            others += [q['prompt'] for q in d['questions'] + d.get('tests', [])]
        worst = max(((difflib.SequenceMatcher(None, a, b).ratio(), a, b) for a in prompts for b in others), default=(0, '', ''))
        inner = max(((difflib.SequenceMatcher(None, a, b).ratio(), a, b) for i, a in enumerate(prompts) for b in prompts[i + 1:]), default=(0, '', ''))
        print('  ワーク・ドリルとの最大類似度', round(worst[0], 3), '|', worst[1][:40], '／', worst[2][:40])
        print('  特訓どうしの最大類似度', round(inner[0], 3), '|', inner[1][:40], '／', inner[2][:40])
        wnear = sorted(((difflib.SequenceMatcher(None, a, b).ratio(), a, b) for a in prompts for b in others), reverse=True)[:5]
        for r, a, b in wnear:
            if r >= 0.8: print('   ワーク・ドリルと似ている組（目で確認）', round(r, 3), '|', a[:45], '／', b[:45])
        near = sorted(((difflib.SequenceMatcher(None, a, b).ratio(), a, b) for i, a in enumerate(prompts) for b in prompts[i + 1:]), reverse=True)[:6]
        for r, a, b in near:
            if r >= 0.75: print('   似ている組（目で確認）', round(r, 3), '|', a[:45], '／', b[:45])
        assert worst[0] < 0.9 and inner[0] < 0.9, 'too similar'
        unit = {'id': self.uid, 'bank': 'tokkun', 'mode': 'workbook', 'subject': self.subject, 'grade': self.grade,
                'title': self.title, 'majorTitle': self.major, 'status': 'ready' if len(Q) == size else 'draft',
                'size': size, 'schedule': 'marks', 'questions': [], 'tests': [], 'reviewNote': review_note}
        if len(Q) != size:
            unit['reviewNote'] += f'【保留】考え方のちがう問題が{len(Q)}問までで、{size}問にとどかない（数を変えただけの水増しはしない）。'
        for i, q in enumerate(Q, 1):
            s = LEDGER[self.page_src[q['page']]]
            assert q['page'] in s['pages'] and s['verified'], (q['page'], s['id'])
            unit['questions'].append({'id': f'{self.uid}-{i}', 'type': 'input', 'prompt': q['prompt'], 'answer': q['answer'],
                'explanation': q['explanation'],
                'source': {'id': s['id'], 'file': s['file'], 'sha256': s['sha256'], 'page': q['page'], 'number': '特訓（ワークの考え方をもとにしたオリジナル）'},
                'ref': f"参考：{self.ref_label} p{q['page']}（特訓・オリジナル問題）", 'origin': 'original', 'reviewed': True,
                'difficulty': 'hard', 'bank': 'tokkun'})
        out = HERE.parent / '原稿' / f'{self.uid}.json'   # 2026-10-27：原稿フォルダへ
        out.write_text(json.dumps(unit, ensure_ascii=False, indent=1) + '\n')
        print('  書き出し', out.name, unit['status'])
        return unit
