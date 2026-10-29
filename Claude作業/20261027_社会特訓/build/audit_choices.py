# 選択肢問題の点検（Claude 2026-10-27）：答えの位置のかたより・正答だけ長い選択肢・答えの記号が選択肢にあるか
import json, re, sys, collections
L = 'アイウエオ'
def parse(prompt):
    m = list(re.finditer(r'(?:^|\n|　| )([アイウエオ])[ 　](?=\S)', prompt))
    if len(m) < 2: return None
    opts = {}
    for i, x in enumerate(m):
        end = m[i+1].start() if i+1 < len(m) else len(prompt)
        opts[x.group(1)] = prompt[x.end():end].strip()
    return opts
def answer_letters(a):
    if a['kind'] == 'exact' and re.fullmatch(r'[アイウエオ]', a['accepted'][0]): return [a['accepted'][0]]
    if a['kind'] == 'exact' and re.fullmatch(r'[アイウエオ](、[アイウエオ])+', a['accepted'][0]): return a['accepted'][0].split('、')
    if a['kind'] == 'set' and all(len(x) and re.fullmatch(r'[アイウエオ]', x[0]) for x in a['items']): return [x[0] for x in a['items']]
    return None
def audit(path):
    u = json.load(open(path)); pos = collections.Counter(); longest = single = 0; probs = []
    for q in u['questions']:
        ans = answer_letters(q['answer']); opts = parse(q['prompt'])
        if not ans or not opts: continue
        if any(x not in opts for x in ans): probs.append(q['id'] + ' answer letter not in options')
        if len(ans) == 1:
            single += 1; pos[ans[0]] += 1
            lens = {k: len(v) for k, v in opts.items()}
            if lens[ans[0]] == max(lens.values()) and sorted(lens.values())[-2] * 1.25 < lens[ans[0]]: longest += 1
    return dict(unit=u['id'], single=single, positions=dict(sorted(pos.items())), correctClearlyLongest=longest, problems=probs)
if __name__ == '__main__':
    for p in sys.argv[1:]: print(json.dumps(audit(p), ensure_ascii=False))
