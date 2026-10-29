# coding: utf-8
"""検定原稿の共通部品（Claude・2026-10-13）。配信用の本データ・台帳には書かない。
- 問題はすべて独自作成。検定の過去問は「出題の形式と難しさ」の参考にだけ使う（文章・数値・図は使わない）。
- N：数の答え（Fractionで計算した値と一致を確認）／E：式の答え（いくつかの値を代入して、意図した式と一致を確認）
- X：言葉・記号の答え／S：すべて答える／L：数の組（連立方程式など）
- save()：重複なし・答えの確認ずみで、教材エンジンの形（draft）で書き出す。
"""
import json, hashlib, re, random
from fractions import Fraction as F
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]

def sha(rel): return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
def pyexpr(s):
    s = s.replace('−', '-').replace('×', '*').replace('÷', '/').replace('^', '**')
    s = re.sub(r'(\d|\))\s*([a-z(])', r'\1*\2', s)
    s = re.sub(r'([a-z])\s*([a-z(\d])', r'\1*\2', s)
    s = re.sub(r'(\d+(?:\.\d+)?)', r"F('\1')", s)
    return s
class Book:
    def __init__(self, uid, title, kentei, level, refs):
        self.uid, self.title, self.kentei, self.level, self.refs = uid, title, kentei, level, refs
        self.Q = []; self.sec = ''
    def section(self, name): self.sec = name
    def _add(self, prompt, ans, expl, ref, kind):
        self.Q.append(dict(section=self.sec, role=kind, prompt=prompt, answer=ans, explanation=expl, ref=ref))
    def N(self, prompt, value, exact, expl, ref, role='確認', units=None):
        assert F(value) == exact, (prompt, value, exact)
        a = {'kind': 'number', 'value': value}
        if units: a['units'] = units
        self._add(prompt, a, expl, ref, role)
    def E(self, prompt, value, fn, expl, ref, role='確認', vars='xy'):
        for _ in range(5):
            env = {v: F(random.randint(-9, 9), random.randint(1, 5)) for v in vars}
            env['F'] = F
            assert eval(pyexpr(value), {}, env) == fn(*[env[v] for v in vars]), (prompt, value)
        self._add(prompt, {'kind': 'expr', 'value': value}, expl, ref, role)
    def X(self, prompt, accepted, expl, ref, role='確認'):
        self._add(prompt, {'kind': 'exact', 'accepted': accepted}, expl, ref, role)
    def S(self, prompt, items, expl, ref, role='確認'):
        self._add(prompt, {'kind': 'set', 'items': items}, expl, ref, role)
    def L(self, prompt, values, expl, ref, role='確認'):
        self._add(prompt, {'kind': 'numbers', 'values': values, 'ordered': True}, expl, ref, role)
    def R(self, prompt, value, expl, ref, role='確認'):
        self._add(prompt, {'kind': 'relation', 'value': value}, expl, ref, role)
    def save(self, outdir, note):
        assert len({q['prompt'] for q in self.Q}) == len(self.Q), 'duplicate prompt'
        unit = {'id': self.uid, 'bank': 'kentei', 'kentei': self.kentei, 'level': self.level, 'title': self.title,
                'status': 'draft', 'questions': [], 'reviewNote': note}
        for i, q in enumerate(self.Q, 1):
            f, page = self.refs[q['ref']]
            unit['questions'].append({'id': f'{self.uid}-{i}', 'type': 'input', 'section': q['section'], 'role': q['role'],
                'prompt': q['prompt'], 'answer': q['answer'], 'explanation': q['explanation'],
                'source': {'id': None, 'file': f, 'sha256': sha(f), 'page': page, 'number': '形式とレベルの参考（問題はClaudeの独自作成）'},
                'origin': 'original', 'reviewed': True})
        out = Path(outdir) / f'{self.uid}.json'
        out.write_text(json.dumps(unit, ensure_ascii=False, indent=1) + '\n')
        from collections import Counter
        print(self.uid, len(self.Q), dict(Counter(q['section'] for q in self.Q)))
