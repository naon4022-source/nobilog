"""選択問題（ア〜エから1つ）の選択肢の並び順を入れかえて、単元ごとに正解の位置をそろえる候補（Claude 2026-10-29）。
土台は ../反映用_まとめ候補/原稿（変更しない）。選択肢の文・答えの内容・問題の意味は変えない。解説の中の、ひとりで立っている記号（アは… イ、ウは…）だけを書きかえる。
「ア〜エ」「ア・イから選び」のような範囲の書き方は書きかえない。"""
import json, re, pathlib, copy, collections
H = pathlib.Path(__file__).resolve().parent
SRC = H.parent / '反映用_まとめ候補' / '原稿'
K = 'アイウエオ'
ISO = re.compile(r'(?<![ァ-ヶー〜・])([アイウエオ])(?![ァ-ヶー〜・])')
log = []
G = collections.defaultdict(collections.Counter)   # 2回目：全単元を通して、選択肢の数ごとの正解の位置の数（1回目は単元ごとにアから数え直したため、アがまだ多かった）
for p in sorted(SRC.glob('*.json')):
    u = json.loads(p.read_text(encoding='utf-8'))
    targets = []
    for i, q in enumerate(u['questions']):
        a = q['answer']
        if a['kind'] != 'exact' or len(a['accepted']) != 1 or a['accepted'][0] not in K: continue
        lines = q['prompt'].split('\n')
        idx = [j for j, l in enumerate(lines) if re.match(r'^[アイウエオ]\s', l)]
        letters = [lines[j][0] for j in idx]
        if len(idx) < 2 or letters != list(K[:len(idx)]) or idx != list(range(idx[0], idx[0] + len(idx))) or idx[-1] != len(lines) - 1: continue
        if a['accepted'][0] not in letters: continue
        targets.append((i, idx))
    # 単元の中で、正解の位置を順にまわす（選択肢の数ごと）
    for i, idx in targets:
        q = u['questions'][i]; k = len(idx); lines = q['prompt'].split('\n')
        texts = [lines[j][1:].lstrip() for j in idx]
        old = K.index(q['answer']['accepted'][0])
        new = min(range(k), key=lambda t: (G[k][t], (t - len(log)) % k)); G[k][new] += 1
        if new == old: continue
        order = [t for t in range(k) if t != old]; order.insert(new, old)          # order[位置] ＝ もとの番号
        mp = {K[o]: K[pos] for pos, o in enumerate(order)}                         # もとの記号 → あたらしい記号
        nl = lines[:idx[0]] + [K[pos] + ' ' + texts[o] for pos, o in enumerate(order)]
        before = copy.deepcopy(q)
        q['prompt'] = '\n'.join(nl)
        q['answer'] = dict(q['answer'], accepted=[mp[q['answer']['accepted'][0]]])
        q['explanation'] = ISO.sub(lambda m: mp.get(m.group(1), m.group(1)), q['explanation'])
        log.append({'id': q['id'], 'map': mp, 'oldAnswer': before['answer']['accepted'][0], 'newAnswer': q['answer']['accepted'][0],
                    'oldPrompt': before['prompt'], 'oldExplanation': before['explanation'], 'newExplanation': q['explanation']})
    (H / '原稿' / p.name).write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '並べかえ一覧.json').write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('並べかえた問題', len(log))
