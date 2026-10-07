#!/usr/bin/env python3
"""英検の練習800問（tools/eiken-series-bank.json）を、のびログの画面で解くためのデータにする（Claude・2026-10-06）。
  python3 tools/build-eiken-practice-json.py          → site-assets/eiken-practice-bank.json
  python3 tools/build-eiken-practice-json.py --check  → 作り直しが必要なら 1 で終わる
問題文・答え・解説は元のデータのまま。問題の種類（穴うめ・並べかえ・読解・作文）と、日本語で答える読解だけを判定して付け足す。"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / 'tools' / 'eiken-series-bank.json'; OUT = ROOT / 'site-assets' / 'eiken-practice-bank.json'
CHOICE = re.compile(r'\(([^()]*/[^()]*)\)')
def kind(q):
    if 'rubric' in q: return 'writing'
    if 'context' in q or 'passage' in q: return 'reading'
    if '並べ替え' in q['q'] or (q['q'].startswith('「') and CHOICE.search(q['q'])): return 'order'
    return 'cloze'
def build():
    d = json.loads(SRC.read_text(encoding='utf-8')); out = {'v': 1, 'source': 'tools/eiken-series-bank.json', 'grades': []}
    for g in ['5', '4', '3', 'pre2']:
        G = d[g]; grade = {'id': g, 'label': G['label'], 'sets': []}
        for si, s in enumerate(G['sets'], 1):
            qs = []
            # 読解の本文と題名は passages にある（第1セットは問題の側に context が無い）。作文の観点は writing にある
            pas = {pq['id']: (title, text) for title, text, pqs in s.get('passages', []) for pq in pqs}
            wr = {w['id']: w for w in s.get('writing', [])}
            for q in s['questions']:
                q = dict(q)
                if q['id'] in pas: q['passage'] = pas[q['id']]; q.setdefault('context', pas[q['id']][1])
                if q['id'] in wr and 'rubric' not in q and wr[q['id']].get('rubric'): q['rubric'] = wr[q['id']]['rubric']
                k = kind(q); item = {'id': f'{g}-{si:02d}-{q["id"]:02d}', 'n': q['id'], 'kind': k, 'q': q['q'], 'answer': q['answer'], 'accepted': q.get('accepted') or [], 'why': q.get('why', '')}
                if k == 'reading':
                    item['context'] = q['context']
                    if q.get('passage'): item['title'] = q['passage'][0]
                    if q['context'] != (q.get('passage') or [None, q['context']])[1]: raise SystemExit(f'本文が一致しない: {item["id"]}')
                    if q.get('evidence'): item['evidence'] = q['evidence']
                    if '日本語で答え' in q['q']: item['self'] = True      # 日本語の記述は自分で〇をつける
                if k == 'writing': item['rubric'] = q['rubric']; item['self'] = True
                if k in ('cloze', 'order'):
                    m = list(CHOICE.finditer(q['q']))
                    if not m: raise SystemExit(f'選択肢がない: {item["id"]}')
                    if k == 'cloze' and q['answer'] not in [x.strip() for x in m[-1].group(1).split('/')]: raise SystemExit(f'答えが選択肢にない: {item["id"]}')
                qs.append(item)
            if len(qs) != 20: raise SystemExit(f'{g} set {si}: {len(qs)}問')
            grade['sets'].append({'n': si, 'questions': qs})
        if len(grade['sets']) != 10: raise SystemExit(f'{g}: {len(grade["sets"])}セット')
        out['grades'].append(grade)
    return json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n'
if __name__ == '__main__':
    text = build()
    if '--check' in sys.argv:
        same = OUT.exists() and OUT.read_text(encoding='utf-8') == text
        print('eiken-practice-bank.json: ' + ('up to date' if same else 'needs rebuild')); sys.exit(0 if same else 1)
    OUT.write_text(text, encoding='utf-8'); print('wrote', OUT.relative_to(ROOT), len(text), 'bytes')
