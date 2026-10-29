# coding: utf-8
"""教科書（台帳登録案）をワークと一緒に根拠にする特訓の共通部品（Claude・2026-10-14）。
- 問題の page に 整数 を書くとワークのページ（台帳に登録ずみ）、'T112' のように書くと教科書のページ（台帳登録案）。
- 教科書ページの出典は、台帳にまだ ID がないので id:null とし、登録案のファイル名・SHA-256・ページを入れる。
  Codex が登録案を台帳に入れたら、file と page で ID を入れられる。
- 教科書ページを1問でも使う単元は、70問そろっても ready にしない（status:draft、reviewNote に【台帳反映待ち】）。
- 本文まで読んで確認した教科書ページだけ使える（登録案の checkLevel が「本文」のページ）。
"""
import json, difflib
from tokkun_common import Unit, LEDGER, ROOT, HERE

PROPOSALS = {}
for name in ['理科の教科書', '地理教科書', '歴史きょうかしょ', '英語教科書']:
    d = json.loads((HERE / '台帳登録案' / f'{name}.json').read_text())
    for e in d['entries']:
        for p in e.get('pages') or []:
            PROPOSALS[(name, p)] = e


class TUnit(Unit):
    def __init__(self, uid, title, major, subject, grade, page_src, ref_label, compare_files, textbook, strip=()):
        super().__init__(uid, title, major, subject, grade, page_src, ref_label, compare_files, strip)
        self.textbook = textbook   # '地理教科書' など

    def N(self, page, prompt, value, exact, places=None, expl=''):
        """数の答え。共通部品で単位が決まらない言い方（何ポイント・何万人・何か国・何年・何％・いくつ）にも単位を付ける。"""
        super().N(page, prompt, value, exact, places, expl)
        a = self.Q[-1]['answer']
        if a.get('units'): return
        import re as _re
        table = [(r'何ポイント', ['ポイント']), (r'何万人', ['万人']), (r'何億人', ['億人']), (r'何億ドル', ['億ドル']), (r'何万t', ['万t', '万トン']), (r'何か国', ['か国', 'カ国', 'ヶ国']), (r'何年', ['年']),
                 (r'何[％%]', ['％', '%', 'パーセント'])]
        for pat, us in table:
            if _re.search(pat, prompt): a['units'] = us; return
        if 'いくつ' in prompt:
            m = _re.search(r'いくつの(?:主な)?(\S)', prompt)
            us = ['つ', '個', 'こ']
            if m and m.group(1) in '県島国': us = [m.group(1)] + us
            if '「県」' in prompt: us = ['県'] + us
            if '国' in prompt and 'いくつか' in prompt: us = ['か国', 'カ国', '国'] + us
            a['units'] = us

    def S(self, page, prompt, items, expl='', letters=False):
        """すべて答える問題。採点器は「、」「,」「・」空白で区切るので、問題文に区切り方を書く。
        用語の組は plain（「面」「点」などの字を削らない）、記号の組は letters。"""
        if '区切' not in prompt:
            prompt += '（「、」で区切って書こう）' if not letters else '（記号を「、」で区切って書こう）'
        ans = {'kind': 'set', 'items': items}
        ans['letters' if letters else 'plain'] = True
        self.Q.append(dict(page=page, prompt=prompt, answer=ans, explanation=expl))

    def RN(self, page, prompt, criteria, reject, expl=''):
        """自然な答えに「ない」「なく」が入る記述問題。allowNegation を付け、意味が逆になる書き方を reject で不正解にする。"""
        assert reject, '否定を許す問題には、逆の意味になる書き方（reject）を必ず入れる'
        self.Q.append(dict(page=page, prompt=prompt, answer={'kind': 'rubric', 'allowNegation': True, 'reject': [reject],
                       'criteria': [{'weight': 1, 'any': c} for c in criteria]}, explanation=expl))

    def finish(self, review_note, size=70):
        Q = self.Q
        print(self.uid, '問題数', len(Q))
        assert len({q['prompt'] for q in Q}) == len(Q), 'prompt duplicated'
        prompts = [self._clean(q['prompt']) for q in Q]
        others = []
        for f in self.compare_files:
            d = json.loads((ROOT / '教材整理' / f).read_text())
            others += [q['prompt'] for q in d['questions'] + d.get('tests', [])]
        pairs = [(difflib.SequenceMatcher(None, a, b).ratio(), a, b) for a in prompts for b in others]
        worst = max(pairs, default=(0, '', ''))
        inner_pairs = [(difflib.SequenceMatcher(None, a, b).ratio(), a, b) for i, a in enumerate(prompts) for b in prompts[i + 1:]]
        inner = max(inner_pairs, default=(0, '', ''))
        print('  ワーク・ドリルとの最大類似度', round(worst[0], 3), '|', worst[1][:40], '／', worst[2][:40])
        print('  特訓どうしの最大類似度', round(inner[0], 3), '|', inner[1][:40], '／', inner[2][:40])
        for r, a, b in sorted(pairs, reverse=True)[:5]:
            if r >= 0.75: print('   ワーク・ドリルと似ている組（目で確認）', round(r, 3), '|', a[:45], '／', b[:45])
        for r, a, b in sorted(inner_pairs, reverse=True)[:6]:
            if r >= 0.75: print('   似ている組（目で確認）', round(r, 3), '|', a[:45], '／', b[:45])
        assert worst[0] < 0.9 and inner[0] < 0.9, 'too similar'
        # 問題文に答えの語がそのまま入っていないか（選択肢の問題は除く）
        for q in Q:
            a = q['answer']
            if a['kind'] == 'exact' and len(a['accepted'][0]) >= 2 and a['accepted'][0] in q['prompt'] and not any(k in q['prompt'] for k in ('選ぼう', '選んで', 'から選', '答えよう（')):
                print('   ⚠問題文に答えの語が入っている（目で確認）', a['accepted'][0], '|', q['prompt'][:50])
        BYFILE = {r['file']: r for r in LEDGER.values()}
        def tb_row(p):   # 2026-10-22：教科書ページが台帳に登録・確認済みなら、その出典IDを使う
            e = PROPOSALS[(self.textbook, int(p[1:]))]; r = BYFILE.get(e['file'])
            return r if r and r.get('verified') and r.get('sha256') == e['sha256'] and int(p[1:]) in (r.get('pages') or []) else None
        n_tb = sum(isinstance(q['page'], str) and not tb_row(q['page']) for q in Q)
        status = 'ready' if len(Q) == size and not n_tb else 'draft'
        unit = {'id': self.uid, 'bank': 'tokkun', 'mode': 'workbook', 'subject': self.subject, 'grade': self.grade,
                'title': self.title, 'majorTitle': self.major, 'status': status,
                'size': size, 'schedule': 'marks', 'questions': [], 'tests': [], 'reviewNote': review_note}
        if len(Q) != size:
            unit['reviewNote'] += f'【保留・資料不足】考え方のちがう問題が{len(Q)}問までで、{size}問にとどかない（数を変えただけの水増しはしない）。'
        if n_tb:
            unit['reviewNote'] += f'【台帳反映待ち】{n_tb}問が{self.textbook}（台帳登録案）を出典にしている。台帳に登録されてIDが付くまで ready にしない。'
        for i, q in enumerate(Q, 1):
            p = q['page']
            base = {'id': f'{self.uid}-{i}', 'type': 'input', 'prompt': q['prompt'], 'answer': q['answer'], 'explanation': q['explanation']}
            if isinstance(p, str):
                n = int(p[1:])
                e = PROPOSALS[(self.textbook, n)]
                assert e.get('checkLevel') == '本文', ('本文未確認の教科書ページ', self.textbook, n)
                r = tb_row(p)
                base['source'] = {'id': r['id'], 'file': r['file'], 'sha256': r['sha256'], 'page': n, 'number': '特訓（教科書の内容をもとにしたオリジナル）'} if r else {'id': None, 'proposal': f'台帳登録案/{self.textbook}.json', 'file': e['file'], 'sha256': e['sha256'], 'page': n,
                                  'number': '特訓（教科書の内容をもとにしたオリジナル）'}
                base['ref'] = f'参考：{self.textbook} p{n}（特訓・オリジナル問題）'
            else:
                s = LEDGER[self.page_src[p]]
                assert p in s['pages'] and s['verified'], (p, s['id'])
                base['source'] = {'id': s['id'], 'file': s['file'], 'sha256': s['sha256'], 'page': p, 'number': '特訓（ワークの考え方をもとにしたオリジナル）'}
                base['ref'] = f'参考：{self.ref_label} p{p}（特訓・オリジナル問題）'
            base.update({'origin': 'original', 'reviewed': True, 'difficulty': 'hard', 'bank': 'tokkun'})
            unit['questions'].append(base)
        out = HERE / f'{self.uid}.json'
        out.write_text(json.dumps(unit, ensure_ascii=False, indent=1) + '\n')
        print('  書き出し', out.name, unit['status'], f'（教科書出典 {n_tb}問）')
        return unit
