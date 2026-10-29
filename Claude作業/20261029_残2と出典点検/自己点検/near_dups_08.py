"""数字を伏せて似ている割合 0.8 以上 0.9 未満の組（検査の基準 0.9 より下）を、Claude の6単元で拾う（Claude 2026-10-29）。読んで、数字だけ替えた水増しかどうかを判断するための一覧。"""
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
D = H.parent / '選択肢の書きなおし' / '原稿'
keys = ['solid2', 'spaceline', 'surface1', 'solidmake', 'spaceuse', 'solidreview']
items = []
for k in keys:
    u = json.loads((D / f'tokkun-math-1-{k}.json').read_text(encoding='utf-8'))
    items += [(q['id'], C.mask(q['prompt'])) for q in u['questions']]
pairs = [(a, b, r) for a, b, r in C.near_dups(items, [], th=0.8) if r < 0.9]
json.dump(pairs, open(H / 'near_dups_08-result.json', 'w'), ensure_ascii=False, indent=1)
print('0.8〜0.9 の組', len(pairs))
