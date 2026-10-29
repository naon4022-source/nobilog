"""④（本文にない性質が必要で、問題文にも示していない）georeview-22 の差しかえ案（Claude 2026-10-29）。
元（../../20261028_数学残16_再開/原稿）は変更しない。差しかえた単元の写しを ./tokkun-math-1-georeview.json に書き、検査する。"""
import json, sys, copy, hashlib, pathlib
from fractions import Fraction as F
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
ROOT = pathlib.Path('/Users/shimizunaotomoo/Desktop/my-app')
src = H.parent.parent / '20261028_数学残16_再開' / '原稿' / 'tokkun-math-1-georeview.json'
u = json.loads(src.read_text(encoding='utf-8')); before = copy.deepcopy(u)
old = u['questions'][21]; assert old['id'] == 'tokkun-math-1-georeview-22'
f = '数学教科書/S__16466018_0.jpg'; sha = hashlib.sha256((ROOT / f).read_bytes()).hexdigest()
new = dict(old)
new.update({'prompt': '長方形 ABCD の4つの頂点をすべて通る円をかきたい。対角線 AC の長さが 13 cm のとき、この円の半径を求めよう。',
            'answer': {'kind': 'number', 'value': '6.5', 'units': ['cm']},
            'explanation': '①長方形の2本の対角線は長さが等しく、たがいのまん中の点で交わる（算数で学んだ）　②その交点から4つの頂点までの長さは、どれも対角線の半分で等しいので、交点が円の中心になる　③半径は 13 ÷ 2 ＝ 6.5。答え 6.5 cm',
            'source': {'file': f, 'sha256': sha, 'page': 170, 'number': '特訓（教科書の考え方をもとにしたオリジナル）'},
            'textbook': {'file': f, 'sha256': sha, 'page': 170}})
# 別の方法の検算：座標の長方形で、対角線の交点から4頂点までの距離がすべて等しく、対角線の半分になる
import math
for w, h in ((5, 12), (12, 5), (F(39, 10), F(62, 5))):
    d = math.hypot(w, h)
    if abs(d - 13) > 1e-9: continue
    M = (w / 2, h / 2); ds = {round(math.hypot(M[0] - x, M[1] - y), 9) for x, y in ((0, 0), (w, 0), (w, h), (0, h))}
    assert len(ds) == 1 and abs(ds.pop() - 6.5) < 1e-9
u['questions'][21] = new
assert all(a == b for i, (a, b) in enumerate(zip(before['questions'], u['questions'])) if i != 21)
(H / 'tokkun-math-1-georeview.json').write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
errs = []
r = C.leak(new); errs += [r] if r else []
errs += C.lint(new)
mine = [(new['id'], C.mask(new['prompt']))]
others = [(q['id'], C.mask(q['prompt'])) for q in u['questions'] if q['id'] != new['id']]
for p in sorted((H.parent / '原稿').glob('tokkun-math-1-*.json')):
    if p.stem.endswith('georeview'): continue
    others += [(q['id'], C.mask(q['prompt'])) for q in json.loads(p.read_text(encoding='utf-8'))['questions']]
others += [(t, C.mask(p)) for t, p in C.existing_prompts()]
errs += [f'似すぎ {a} {b} {r}' for a, b, r in C.near_dups(mine, others)]
errs += C.engine_check(u)
rec = {'id': new['id'], 'reason': '元の問題は「直角三角形の3つの頂点を通る円の中心は斜辺の中点」を使うが、中1の教科書本文になく、問題文にも示していない。算数で学ぶ長方形の対角線の性質から同じ 6.5 cm を導ける形にした。',
       'old': {k: old[k] for k in ('prompt', 'answer', 'explanation')}, 'new': {k: new[k] for k in ('prompt', 'answer', 'explanation')}, 'page': 170, 'check': errs}
(H / '差しかえ表.json').write_text(json.dumps([rec], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('不合格', len(errs), errs)
sys.exit(1 if errs else 0)
