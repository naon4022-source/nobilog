# 図形15単元の実数・出典・必要な図の種類を一覧にする（Claude 2026-10-28・読むだけ）
import json, pathlib, re
H = pathlib.Path(__file__).resolve().parent.parent
K = ['circle','line','move','draw1','draw2','drawuse','georeview','solid1','solid2','spaceline','surface1','surface2','solidmake','spaceuse','solidreview']
NEED = {'circle':'円・おうぎ形・接線（中心角・弧・半径の条件つき）','line':'直線・線分・半直線、垂直と平行、点と直線のきょり','move':'平行移動・回転移動・対称移動の前後の図形（方眼）',
 'draw1':'垂直二等分線・角の二等分線の作図','draw2':'垂線の作図','drawuse':'作図の利用（移動と作図の組み合わせ）','georeview':'平面図形のまとめ（上の図の組み合わせ）',
 'solid1':'角柱・円柱・角錐・円錐・多面体の見取図','solid2':'回転体・投影図','spaceline':'空間の直線と平面（ねじれ・垂直・平行）を示す直方体などの見取図',
 'surface1':'展開図（角柱・円柱）','surface2':'展開図（角錐・円錐・おうぎ形）','solidmake':'面や線を動かしてできる立体の図','spaceuse':'空間図形の利用（容器・切り口など）','solidreview':'空間図形のまとめ'}
rows = []
for k in K:
    u = json.load(open(H / '原稿' / f'tokkun-math-1-{k}.json'))
    qs = u['questions']
    pages = sorted({q.get('textbook', {}).get('page') for q in qs if q.get('textbook')} | {q.get('source', {}).get('page') for q in qs if q.get('source')} - {None})
    rows.append({'key': k, 'title': u.get('title'), '今の問題数': len(qs), 'あと': 70 - len(qs), '出典ページ': pages, '必要な図': NEED[k],
                 '図つきの問題': sum(1 for q in qs if q.get('image')), '問題の例': [q['prompt'][:60] for q in qs[:2]]})
json.dump(rows, open(H / '図の接続' / '図形15単元_一覧.json', 'w'), ensure_ascii=False, indent=1)
print('単元', len(rows), '今の合計', sum(r['今の問題数'] for r in rows), 'あと', sum(r['あと'] for r in rows))
for r in rows: print(r['key'], r['今の問題数'], r['出典ページ'][:6], r['問題の例'][0][:40])
