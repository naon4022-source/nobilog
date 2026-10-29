# 元の問題（ID・本文・答え・解説・出典）が1文字も変わっていないか、ほかの単元が前のフォルダと同じかを確かめる（Claude 2026-10-28）
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
PREV = H.parent / '20261028_数学残18続き' / '原稿'
bad = 0
for key in sys.argv[1:]:
    before = json.load(open(H / f'{key}_before.json'))['questions']
    after = json.load(open(H / '原稿' / f'tokkun-math-1-{key}.json'))['questions']
    same = after[:len(before)] == before
    ids = [q['id'] for q in after]
    print(key, '元の問題数', len(before), '同じ:', same, '全体', len(after), 'IDの重なり', len(ids) - len(set(ids)))
    bad += (not same) + (len(ids) != len(set(ids)))
changed = [p.name for p in PREV.glob('*.json') if p.stem.split('-')[-1] not in sys.argv[1:] and p.read_bytes() != (H / '原稿' / p.name).read_bytes()]
print('ほかの単元で前のフォルダと変わったもの', changed)
sys.exit(1 if bad or changed else 0)
