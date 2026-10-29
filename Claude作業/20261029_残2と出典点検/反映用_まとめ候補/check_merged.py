"""反映用の写し54単元を、本物の採点エンジン（正答○・誤答×・わからない×）と validateUnit で調べ、元の候補と比べる（Claude 2026-10-29）"""
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
W = H.parent.parent
tot = bad = 0
for p in sorted((H / '原稿').glob('tokkun-math-1-*.json')):
    u = json.loads(p.read_text(encoding='utf-8'))
    errs = C.engine_check(u); tot += len(u['questions'])
    src = (H.parent / '原稿' / p.name) if p.stem.endswith(('spaceuse', 'solidreview')) else (W / '20261029_立体残7' / '原稿' / p.name)
    e0 = C.engine_check(json.loads(src.read_text(encoding='utf-8')))
    new = [e for e in errs if e not in e0]
    if errs or e0: print(p.stem, '元の候補', len(e0), '件／まとめ', len(errs), '件／ふえた', len(new))
    for e in new: print('   ', e)
    bad += len(new)
print('単元', len(list((H / '原稿').glob('*.json'))), '問', tot, 'ふえた不合格', bad)
sys.exit(1 if bad else 0)
