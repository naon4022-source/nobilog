"""選択問題（ア〜エから1つ）の正解の位置のかたより、正解の選択肢だけが長い手がかりを調べる（Claude 2026-10-29）。対象：反映用の写し。"""
import json, re, pathlib, collections
D = pathlib.Path(__file__).resolve().parent.parent / '選択肢の書きなおし' / '原稿'
K = 'アイウエオ'
out = {}; longest = []; tot = collections.Counter(); n_all = 0
for p in sorted(D.glob('*.json')):
    u = json.loads(p.read_text(encoding='utf-8')); key = p.stem.replace('tokkun-math-1-', '')
    c = collections.Counter(); n = lng = 0
    for q in u['questions']:
        a = q['answer']
        if a['kind'] != 'exact' or len(a['accepted']) != 1 or a['accepted'][0] not in K: continue
        opts = dict(re.findall(r'^([アイウエオ])\s+(.+)$', q['prompt'], re.M))
        if len(opts) < 2 or a['accepted'][0] not in opts: continue
        n += 1; c[a['accepted'][0]] += 1
        L = {k: len(v) for k, v in opts.items()}; m = max(L.values())
        if L[a['accepted'][0]] == m and sum(1 for v in L.values() if v == m) == 1 and m >= 1.5 * sorted(L.values())[-2]:
            lng += 1; longest.append(q['id'])
    if n: out[key] = {'choices': n, 'byLetter': dict(c), 'answerClearlyLongest': lng}; tot += c; n_all += n
json.dump({'units': out, 'total': n_all, 'byLetter': dict(tot), 'clearlyLongestIds': longest}, open(pathlib.Path(__file__).parent / 'choice_balance_rewrite-result.json', 'w'), ensure_ascii=False, indent=1)
print('選択問題', n_all, '正解の位置', dict(tot), '正解だけが1.5倍以上長い', len(longest))
for k, v in out.items():
    if v['choices'] >= 5: print(' ', k, v)
