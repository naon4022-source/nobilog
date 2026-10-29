"""正解の選択肢だけがはっきり長い問題で（1回目：solid2・spaceline・solidmake・spaceuse の22問、2回目：前の作業の単元の13問。2択で数文字だけの line-63・invgraph-8・hist2-55 は手がかりにならないので書きなおさない）、
正解でない選択肢を、同じくらいの長さの、もっともらしいまちがいに書きなおす候補（Claude 2026-10-29）。
土台 ../正解位置の並べかえ/原稿（変更しない）。正解の選択肢の文・記号・選択肢の数・問題文の選択肢以外の部分は変えない。"""
import json, re, sys, pathlib, copy
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parent / 'build'))
import check_all as C
SRC = H.parent / '正解位置の並べかえ' / '原稿'
NEW = {
 'solidmake-13': {'イ': '底面が合同な円柱と円錐を、底面どうしで合わせた立体', 'ウ': '底面の半径が 3 cm、高さが 6 cm の1つの円錐'},
 'solidmake-14': {'イ': '底面の半径が 4 cm、高さが 4 cm の円錐', 'ウ': '底面の半径が 4 cm、高さが 4 cm の円柱'},
 'solidmake-22': {'ア': '底面が合同な2つの円柱を、底面どうしで合わせた立体', 'イ': '底面の半径が対角線の長さと等しい1つの円錐'},
 'solidmake-23': {'イ': '中心が同じ2つの球にはさまれた立体', 'ウ': '中に穴のあいていない太い円柱'},
 'solidmake-37': {'イ': '底面の多角形を、底面に垂直な直線を軸として1回転させてできた面', 'ウ': '底面の多角形の1つの頂点を、底面に平行に動かしてできた面'},
 'solidmake-38': {'イ': '底面の円を、底面に垂直な方向に平行に動かしてできた面', 'ウ': '円錐の高さの線分を、底面の円周にそって1まわりさせてできた面'},
 'solidmake-69': {'ア': '球から、中心が同じ小さい球をくりぬいた立体', 'ウ': '円錐から、中心が同じ小さい円錐をくりぬいた立体'},
 'spaceuse-12': {'ア': '展開図にすると、円錐の高さが母線と同じ長さとして表されるので、ひもの長さを高さではかれるから', 'ウ': '側面を切り開いて平面にすると、側面の面積がもとの円錐より小さくなり、その上にかいた線も短くなるから'},
 'spaceuse-19': {'ア': '二等辺三角形の高さだけで、母線と底辺は実際より短く表される', 'イ': '底辺だけで、等しい2辺（母線）と高さは実際より短く表される'},
 'spaceuse-20': {'イ': '平面図の円をかき、その直径をはかって、その長さを高さとする', 'ウ': '展開図のおうぎ形をかき、その弧の長さをはかって、その長さを高さとする'},
 'spaceline-45': {'ア': '3本の脚のほうが机全体が軽くなり、床を強くおさないから', 'イ': '4点をふくむ平面はいつも2つあり、どちらに乗るかが決まらないから'},
 'spaceline-61': {'イ': '1本だけ（平面の上と同じ）', 'ウ': 'ℓ をはさんで2本だけ'},
 'spaceline-64': {'ア': '1本だけ（ℓ の真下の直線）', 'ウ': 'ない（ℓ と P は交わらないから）'},
 'solid2-10': {'ア': '円柱を、底面に平行な平面で2つに切った立体の1つ', 'ウ': '四角錐を、底面に平行な平面で切って頂点のほうをとりのぞいた立体', 'エ': '球を、中心を通らない平面で切った立体の小さいほう'},
 'solid2-17': {'ア': '四角柱の上に、底面が同じ大きさの四角錐をのせた立体', 'イ': '円柱の上に、底面が同じ大きさの半球をのせた立体', 'ウ': '円錐の上に、底面が同じ大きさの円柱をのせた立体'},
 'solid2-18': {'イ': '球（どの方向から見ても円になる立体）', 'ウ': '底面の半径と高さが等しい円錐', 'エ': '底面の半径と高さが等しい円柱'},
 'solid2-37': {'ア': '三角形（頂点が見える）', 'ウ': '長方形（側面が見える）'},
 'solid2-39': {'イ': '底面が正方形で、側面が4つあれば、形はどれでもよい角錐', 'ウ': 'すべての辺の長さが等しく、側面が正三角形の角錐だけ'},
 'solid2-40': {'ア': '正三角錐は、底面が正三角形で側面も正三角形なので、どれもいつも正四面体である', 'イ': '底面が正三角形で、側面もすべて合同な正三角形であっても、正四面体になるとはかぎらない'},
 'solid2-53': {'イ': '円（シートが丸いので）', 'ウ': '台形（切り口がななめなので）'},
 'solid2-54': {'イ': '展開図（立体を切り開いた図）をもう1つ', 'ウ': '平面図（真上から見た図）をもう1つ'},
 'solid2-63': {'ア': '長方形の、高さと同じ長さの辺（向かい合う2辺）', 'ウ': '長方形の4つのかど（1つずつ）'},
 # ---- 2回目：前の作業で完成した単元の13問（Claude 作成の単元） ----
 'solid1-30': {'ア': '正六角形は線対称ではあっても点対称ではないので、立体の面にできないから', 'イ': '正六角形の1つの角は 108° で、3つ集まっても 324° にしかならないから'},
 'solid1-43': {'イ': '三角形（とがった頂点がある）', 'ウ': '台形（上の辺が短い）'},
 'draw2-27': {'ア': '円の半径を小さくして、ℓ に1点だけでふれるようにする', 'ウ': '作図できないので、分度器で 90° をはかってひく'},
 'draw2-38': {'イ': '点 A を通り、ℓ と 45° の角をつくる直線である', 'ウ': 'ℓ と平行で、P を通る直線になる'},
 'draw2-54': {'ア': '三角形が正三角形のときで、どの辺でもそうなる', 'イ': 'その辺が、3つの辺の中でいちばん長いとき'},
 'prob-25': {'ア': '10 回投げると、表がちょうど 5 回、裏がちょうど 5 回出る'},
 'circle-52': {'ア': '1本だけある（いちばん長い直径）', 'イ': '2本だけある（たてと横の直径）'},
 'muldiv2-11': {'ア': 'かならず正の数（○ の絶対値のほうが大きいから）', 'イ': 'かならず負の数（○ ÷ △ が負の数だから）'},
 'draw1-58': {'ア': 'ℓ 上に適当な2点をとり、その2点を結ぶ線分の垂直二等分線をひく', 'イ': 'P を中心とする円をかき、P を通ってその円に接する直線をひく'},
 'drawuse-51': {'ア': 'P を通る ℓ の平行線をひき、その線にそって道をつくる', 'ウ': 'ℓ 上の好きな点を1つ選び、P とその点を結んで道をつくる'},
 'move-32': {'イ': 'AA′ と BB′ はいつも平行で、長さも等しい', 'ウ': 'OA と OA′ は、いつも垂直に交わる'},
 'move-45': {'ア': '左へ 2・下へ 2 だけ動かす平行移動', 'ウ': 'y 軸についての対称移動（左右に折り返す）'},
 'move-69': {'ア': 'もとの線分 AB に垂直な、同じ長さの線分になる', 'イ': 'もとの線分をのばした直線の上に、ずれて重なる'},
}
units = {p.name: json.loads(p.read_text(encoding='utf-8')) for p in sorted(SRC.glob('*.json'))}
orig = copy.deepcopy(units); log = []; errs = []
for name, u in units.items():
    for q in u['questions']:
        k = q['id'].replace('tokkun-math-1-', '')
        if k not in NEW: continue
        lines = q['prompt'].split('\n'); ans = q['answer']['accepted'][0]
        for L, t in NEW[k].items():
            assert L != ans, (k, '正解の選択肢は書きかえない')
            j = next(j for j, l in enumerate(lines) if re.match('^' + L + r'\s', l)); lines[j] = L + ' ' + t
        before = q['prompt']; q['prompt'] = '\n'.join(lines)
        opts = dict(re.findall(r'^([アイウエオ])\s+(.+)$', q['prompt'], re.M)); L = {a: len(b) for a, b in opts.items()}
        others = sorted(v for a, v in L.items() if a != ans)
        if L[ans] >= 1.5 * others[-1]: errs.append(f'{k}: まだ正解だけが長い {L}')
        if len(set(opts.values())) != len(opts): errs.append(f'{k}: 選択肢が重なっている')
        r = C.leak(q); errs += [f'{k}: {r}'] if r else []
        errs += [f'{k}: {x}' for x in C.lint(q)]
        log.append({'id': q['id'], 'answer': ans, 'before': before, 'after': q['prompt'], 'lengths': L})
    (H / '原稿' / name).write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
assert len(log) == len(NEW), (len(log), len(NEW))
for name in units:   # 変わったのは prompt の選択肢の行だけ
    for a, b in zip(orig[name]['questions'], units[name]['questions']):
        d = {x for x in a if a[x] != b[x]}
        assert d <= {'prompt'}, (a['id'], d)
        if d:
            assert [l for l in a['prompt'].split('\n') if not re.match(r'^[アイウエオ]\s', l)] == [l for l in b['prompt'].split('\n') if not re.match(r'^[アイウエオ]\s', l)]
            ans = a['answer']['accepted'][0]; assert re.search('^' + ans + r'\s.+$', a['prompt'], re.M).group(0) == re.search('^' + ans + r'\s.+$', b['prompt'], re.M).group(0)
for name, u in units.items():
    if any(q['id'].replace('tokkun-math-1-', '') in NEW for q in u['questions']): errs += C.engine_check(u)
(H / '書きなおし一覧.json').write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('書きなおした問題', len(log), '不合格', len(errs)); [print('  ', e) for e in errs]
sys.exit(1 if errs else 0)
