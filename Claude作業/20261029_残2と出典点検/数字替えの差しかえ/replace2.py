"""数字だけを替えた問題（似ている割合 0.8〜0.9 の組を読んで判断）の差しかえ案（Claude 2026-10-29）。土台 ../選択肢の書きなおし/原稿（変更しない）。
spaceuse-14（solid2-70 の円錐を転がす回転数と同じ型）、solid2-13（solidmake-1 の円柱の展開図の横の長さと同じ型。図はそのまま使う）。"""
import json, sys, copy, math, pathlib
from fractions import Fraction as F
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
SRC = H.parent / '選択肢の書きなおし' / '原稿'
units = {p.name: json.loads(p.read_text(encoding='utf-8')) for p in sorted(SRC.glob('*.json'))}
orig = copy.deepcopy(units)
def q_of(i):
    for n, u in units.items():
        for q in u['questions']:
            if q['id'] == i: return n, q
log = []
# spaceuse-14
n, q = q_of('tokkun-math-1-spaceuse-14'); old = {k: q[k] for k in ('prompt', 'answer', 'explanation')}
q['prompt'] = '底面の半径 2 cm、母線の長さ 12 cm の円錐に、底面の円周上の点 A から側面を 1 周して A にもどるように、ひもをもっとも短くなるように巻いた。ひもの長さは、底面の円周の長さの何倍か。π を使って答えよう。'
q['answer'] = {'kind': 'expr', 'value': '3/π', 'units': ['倍']}
q['explanation'] = '①展開図のおうぎ形の中心角は 360° × 2 ÷ 12 ＝ 60° で、ひもと2本の母線は正三角形をつくるので、ひもの長さは 12 cm　②底面の円周は 2π × 2 ＝ 4π cm　③12 ÷ 4π ＝ 3/π。答え 3/π 倍'
th = 360 * 2 / 12; L = 2 * 12 * math.sin(math.radians(th / 2)); assert abs(L / (2 * math.pi * 2) - 3 / math.pi) < 1e-12
log.append({'id': q['id'], 'reason': 'solid2-70（円錐を床の上で転がす回転数）と数字だけちがう同じ型だった', 'old': old, 'new': {k: q[k] for k in ('prompt', 'answer', 'explanation')}})
# solid2-13（図：底面の半径 4 cm・高さ 5 cm の円柱の展開図）
n, q = q_of('tokkun-math-1-solid2-13'); old = {k: q[k] for k in ('prompt', 'answer', 'explanation')}
assert '半径が 4 cm、高さが 5 cm の円柱の展開図' in old['prompt']
q['prompt'] = '図は、底面の半径が 4 cm、高さが 5 cm の円柱の展開図である。この展開図を組み立ててできる円柱の体積を、π を使って答えよう（cm³）。'
q['answer'] = {'kind': 'expr', 'value': '80π', 'units': ['cm³', 'cm3']}
q['explanation'] = '①組み立てると、2つの円が底面、長方形が側面になり、長方形のたての長さが高さ 5 cm　②底面積は π × 4 × 4 ＝ 16π cm²　③16π × 5 ＝ 80π。答え 80π cm³'
assert F(4) * 4 * 5 == 80
log.append({'id': q['id'], 'reason': 'solidmake-1（円柱の展開図の側面の横の長さ）と数字だけちがう同じ型だった。図（展開図）はそのまま使う', 'old': old, 'new': {k: q[k] for k in ('prompt', 'answer', 'explanation')}})
errs = []
allp = [(x['id'], C.mask(x['prompt'])) for u in units.values() for x in u['questions']] + [(t, C.mask(p)) for t, p in C.existing_prompts()]
for r in log:
    n, q = q_of(r['id'])
    e = C.leak(q); errs += [f"{q['id']}: {e}"] if e else []
    errs += [f"{q['id']}: {x}" for x in C.lint(q)]
    errs += [f'似すぎ {a} {b} {s}' for a, b, s in C.near_dups([(q['id'], C.mask(q['prompt']))], [x for x in allp if x[0] != q['id']])]
for name in {q_of(r['id'])[0] for r in log}: errs += C.engine_check(units[name])
for name, u in units.items():
    for a, b in zip(orig[name]['questions'], u['questions']):
        d = {k for k in a if a[k] != b[k]}
        assert not d or (a['id'] in {r['id'] for r in log} and d <= {'prompt', 'answer', 'explanation'}), (a['id'], d)
    (H / '原稿' / name).write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '差しかえ表.json').write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('差しかえ', len(log), '不合格', len(errs)); [print('  ', e) for e in errs]; sys.exit(1 if errs else 0)
