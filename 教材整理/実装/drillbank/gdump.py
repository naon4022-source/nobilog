import sys, importlib
u, g, n = importlib.import_module(sys.argv[1]).unit()
from collections import Counter
print(Counter(q['ref'].split('（')[-1].rstrip('）') for q in u.qs).most_common(40))
for q in u.qs[int(sys.argv[2]) if len(sys.argv) > 2 else 0:]:
    a = q['answer']; v = a.get('value') or a.get('values') or (a.get('accepted') or [None])[0] or a.get('items') or a.get('criteria')
    print(q['source']['page'], q['prompt'].replace('\n', ' / ')[:140], '=>', v)
