"""差しかえ候補20問の検査：書き方・答えの漏れ・似すぎ（元の単元・ほかの特訓・教科書問題）・本物の採点エンジン（正答○・誤答×）・validateUnit（Claude 2026-10-29）"""
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
bad = 0
tab = json.loads((H / '差しかえ表.json').read_text(encoding='utf-8'))
others = []
for f in sorted((H.parent / '原稿').glob('tokkun-math-1-*.json')):
    for q in json.loads(f.read_text(encoding='utf-8'))['questions']: others.append((q['id'], C.mask(q['prompt'])))
exist = [(t, C.mask(p)) for t, p in C.existing_prompts()]
for key in ('hist1', 'hist2'):
    u = json.loads((H / '原稿' / f'tokkun-math-1-{key}.json').read_text(encoding='utf-8'))
    ids = {r['id'] for r in tab if r['unit'] == key}
    new = [q for q in u['questions'] if q['id'] in ids]
    errs = []
    for q in new:
        r = C.leak(q)
        if r: errs.append(f'{q["id"]}: {r}')
        errs += [f'{q["id"]}: {x}' for x in C.lint(q)]
    mine = [(q['id'], C.mask(q['prompt'])) for q in new]
    rest = [(q['id'], C.mask(q['prompt'])) for q in u['questions'] if q['id'] not in ids]
    rest += [x for x in others if not x[0].startswith(f'tokkun-math-1-{key}-')]
    for a, b, r in C.near_dups(mine, rest + exist):
        errs.append(f'似すぎ: {a} と {b}（{r}）')
    errs += C.engine_check(u)
    print(f'■ {key}: 差しかえ {len(new)} 問・単元 {len(u["questions"])} 問', 'OK' if not errs else f'✗ {len(errs)}件')
    for e in errs: print('   ', e)
    bad += len(errs)
print('合計の不合格', bad)
sys.exit(1 if bad else 0)
