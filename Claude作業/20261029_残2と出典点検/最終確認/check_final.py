"""最後の段（数字替えの差しかえ/原稿）の54単元を本物のエンジン（正答○・誤答×・わからない×）と validateUnit で調べる（Claude 2026-10-29）"""
import json, sys, pathlib
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
bad = tot = 0
for p in sorted((H.parent / '数字替えの差しかえ' / '原稿').glob('*.json')):
    u = json.loads(p.read_text(encoding='utf-8')); e = C.engine_check(u); tot += len(u['questions']); bad += len(e)
    for x in e: print(p.stem, x)
print('単元', len(list((H.parent / '数字替えの差しかえ' / '原稿').glob('*.json'))), '問', tot, '不合格', bad); sys.exit(1 if bad else 0)
