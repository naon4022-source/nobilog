# 並べかえ問題の正答候補に、与えた語句にない語（短縮形の言いかえ等）が入っていないかを調べる（Claude・2026-10-14）
import json,glob,re,sys
from collections import Counter
def words(s): return re.findall(r"[a-z']+", s.lower().replace('’',"'"))
tot={}
for f in sys.argv[1:]:
    d=json.load(open(f)); bad=[]
    for q in d['questions']:
        p=q['prompt']
        if '並べかえ' not in p and '並べ替え' not in p: continue
        m=re.search(r'[（(]([^（）()]*/[^（）()]*)[）)]',p)
        if not m: continue
        given=Counter(w for part in m.group(1).split('/') for w in words(part))
        for a in q['answer'].get('accepted',[]):
            c=Counter(words(a))
            extra=[w for w in c if c[w]>given.get(w,0)]
            if extra: bad.append((q['id'],a,extra)); 
    print(f.split('/')[-1], '与えた語にない語をふくむ正答候補', len(bad))
    for b in bad[:30]: print('   ',b)
