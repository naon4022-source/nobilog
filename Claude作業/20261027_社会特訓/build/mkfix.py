# 選択肢修正の書き方を短くする補助：行の形「問題番号|イの新しい文|ウの新しい文」（正答の記号はアで、文は変えない）
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent)); from audit_choices import parse, answer_letters
W = Path(__file__).resolve().parent.parent
def make(uid, text):
    u = json.loads((W/'原稿'/f'{uid}.json').read_text()); qs = {q['id']: q for q in u['questions']}
    fx = {}
    for line in text.strip().splitlines():
        parts = line.split('|'); qid = f'{uid}-{parts[0]}'; q = qs[qid]
        o = parse(q['prompt']); a = answer_letters(q['answer'])[0]
        new = dict(o)
        if parts[-1].startswith('='): new[a] = parts.pop()[1:].strip(); new['_answerRewrite'] = True   # 正答の言いかえ（意味は同じ）
        others = [l for l in o if l != a]; assert len(parts) - 1 == len(others), (qid, len(parts)-1, len(others))
        for l, t in zip(others, parts[1:]): new[l] = t.strip()
        fx[qid] = new
    p = W/'選択肢修正'/f'{uid}.json'
    old = json.loads(p.read_text()) if p.exists() else {}
    old.update(fx); p.write_text(json.dumps(old, ensure_ascii=False, indent=1) + '\n'); print(uid, len(old))
if __name__ == '__main__': make(sys.argv[1], sys.stdin.read())
