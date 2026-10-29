# 下書き（原稿/）→ 取り込み候補（候補/）。Claude 2026-10-27
# 1) 選択肢修正/<単元>.json の {問題ID: {記号: 新しい選択肢}} で選択肢の文を差しかえる（正答の内容は変えない）
# 2) 正答の位置が単元の中で偏らないよう、問題IDから決まる順で記号を並べかえ、正答・解説の記号も同じように付けかえる
# 3) 下書きは書きかえない
import json, re, sys, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent)); from audit_choices import parse, answer_letters
W = Path(__file__).resolve().parent.parent
KATA = 'ァ-ヶー'
def relabel(text, mp):
    return re.sub(rf'(?<![{KATA}「])([アイウエオ])(?![{KATA}」＝])', lambda m: mp.get(m.group(1), m.group(1)), text)   # 「ア」のように文字そのものを指すときは付けかえない
def first_option_start(prompt):
    m = re.search(r'(?:^|\n|　| )ア[ 　](?=\S)', prompt); return m.start() if m else None
def run(uid):
    u = json.loads((W/'原稿'/f'{uid}.json').read_text())
    fx_path = W/'選択肢修正'/f'{uid}.json'; fixes = json.loads(fx_path.read_text()) if fx_path.exists() else {}
    singles = []
    for q in u['questions']:
        if answer_letters(q['answer']) and parse(q['prompt']): singles.append(q)
    # 単元の中で正答の位置をそろえて分散させる：IDのハッシュ順に並べて、0,1,2,(3)…の位置を順に割り当てる
    order = sorted(singles, key=lambda q: hashlib.sha256(q['id'].encode()).hexdigest())
    target = {}
    for i, q in enumerate(order): target[q['id']] = i
    for q in u['questions']:
        opts = parse(q['prompt']); ans = answer_letters(q['answer'])
        if not opts or not ans: assert q['id'] not in fixes, q['id']; continue
        if q['id'] in fixes:
            new = fixes.pop(q['id']); rewrite = new.pop('_answerRewrite', False)
            assert set(new) == set(opts), (q['id'], 'fix must keep the same letters')
            for l in ans: assert new[l] == opts[l] or rewrite, q['id']   # 正答の文を短くするときは、意味を変えないことを記録した上で _answerRewrite を付ける
            opts = {k: new[k] for k in opts}
        letters = list(opts)
        seq = '順' in q['prompt'] and len(ans) > 1 and q['answer']['kind'] == 'exact'
        n = len(letters); i = target[q['id']]
        if len(ans) == 1:
            want = letters[i % n]                       # 正答を置く位置
            others = [l for l in letters if l != ans[0]]
            rot = (i // n) % len(others)
            others = others[rot:] + others[:rot]
            new_order = []; it = iter(others)
            for l in letters: new_order.append(ans[0] if l == want else next(it))
        else:
            rot = i % n; new_order = letters[rot:] + letters[:rot]
        mp = {old: letters[k] for k, old in enumerate(new_order)}   # 元の記号 → 新しい記号
        head = q['prompt'][:first_option_start(q['prompt'])].rstrip()
        lines = [f'{mp[old]}　{opts[old]}' for old in sorted(new_order, key=lambda o: letters.index(mp[o]))]
        q['prompt'] = head + '\n' + '\n'.join(lines)
        a = q['answer']
        if a['kind'] == 'exact':
            a['accepted'] = [relabel(x, mp) for x in a['accepted']]
            if not seq and len(ans) > 1:   # 「すべて選ぼう」など順番を問わない記号の答えは、ア・イ…の順にそろえる
                def srt(x):
                    m = re.fullmatch(r'([アイウエオ])([、,・]?)((?:[アイウエオ][、,・]?)*)', x)
                    if not m: return x
                    sep = m.group(2); ls = sorted(re.findall(r'[アイウエオ]', x), key=letters.index)
                    return sep.join(ls)
                a['accepted'] = list(dict.fromkeys(srt(x) for x in a['accepted']))
        elif a['kind'] == 'set':
            a['items'] = sorted([[relabel(v, mp) for v in it] for it in a['items']], key=lambda it: letters.index(it[0]))
        q['explanation'] = relabel(q['explanation'], mp)
        if seq: pass
    assert not fixes, ('fixes for unknown or non-choice ids', list(fixes))
    out = W/'候補'/f'{uid}.json'; out.write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n'); return out
if __name__ == '__main__':
    for uid in sys.argv[1:]: print(run(uid))
