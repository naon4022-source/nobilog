# 正答だけ長い選択肢の一覧（原稿の記号のまま）を出す
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent)); from audit_choices import parse, answer_letters
W = Path(__file__).resolve().parent.parent
for uid in sys.argv[1:]:
    u = json.loads((W/(sys.argv[0].endswith('worklist.py') and __import__('os').environ.get('WL','原稿'))/f'{uid}.json').read_text())
    for q in u['questions']:
        a = answer_letters(q['answer']); o = parse(q['prompt'])
        if not a or not o or len(a) != 1: continue
        L = {k: len(v) for k, v in o.items()}
        if L[a[0]] == max(L.values()) and sorted(L.values())[-2] * 1.25 < L[a[0]]:
            head = q['prompt'].split('\n')[0][:70]
            print(f"{q['id'].split('-1-')[1]}|{a[0]}|{head}|" + ' / '.join(f'{k}:{v}' for k, v in o.items()))
