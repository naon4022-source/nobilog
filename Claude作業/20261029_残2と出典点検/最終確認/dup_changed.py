"""最後の段で、問題文が変わった問題（並べかえ・選択肢の書きなおし・差しかえ）が、ほかの問題と似すぎていないか（基準 0.9）と、書き方の決まりを調べる（Claude 2026-10-29）"""
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
F = H.parent / '数字替えの差しかえ' / '原稿'; B = H.parent / '反映用_まとめ候補' / '原稿'
allq = {}; changed = []
for p in sorted(F.glob('*.json')):
    a = {q['id']: q for q in json.loads((B / p.name).read_text(encoding='utf-8'))['questions']}
    for q in json.loads(p.read_text(encoding='utf-8'))['questions']:
        allq[q['id']] = q
        if a[q['id']]['prompt'] != q['prompt']: changed.append(q['id'])
items = [(i, C.mask(allq[i]['prompt'])) for i in changed]
others = [(i, C.mask(q['prompt'])) for i, q in allq.items() if i not in changed] + [(t, C.mask(p)) for t, p in C.existing_prompts()]
errs = [f'似すぎ {a} {b} {r}' for a, b, r in C.near_dups(items, others)]
for i in changed: errs += [f'{i}: {x}' for x in C.lint(allq[i])]; e = C.leak(allq[i]); errs += [f'{i}: {e}'] if e else []
print('問題文が変わった問題', len(changed), '不合格', len(errs)); [print('  ', e) for e in errs]; sys.exit(1 if errs else 0)
