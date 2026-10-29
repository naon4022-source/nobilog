# probes/<uid>.json を作る。cases は (問題文の一部, 入力, 期待, 理由) の並び。問題文の先頭は単元ファイルから自動で入れる。
import json,sys
from pathlib import Path
D=Path('/Users/shimizunaotomoo/Desktop/my-app/教材整理/特訓下書き')
def make(uid, cases):
    u=json.loads((D/f'{uid}.json').read_text())
    out={'unit':f'{uid}.json','cases':[]}
    for key,inp,exp,why in cases:
        hits=[i for i,q in enumerate(u['questions'],1) if key in q['prompt']]
        assert len(hits)==1,(uid,key,hits)
        n=hits[0]
        out['cases'].append({'n':n,'head':u['questions'][n-1]['prompt'][:20],'input':inp,'expect':exp,'why':why})
    p=Path(__file__).resolve().parent/'probes'/f'{uid}.json'
    p.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
