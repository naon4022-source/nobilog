# 模擬検定5本を「確認済み」へ入れる（2026-10-22 Claude）。出典は教材照合台帳の mode:'kentei' の行（ID・SHAを照合）。
import json,pathlib
R=pathlib.Path(__file__).resolve().parents[3];H=pathlib.Path(__file__).parent
ledger={r['file']:r for r in json.loads((R/'教材整理/教材照合台帳.json').read_text(encoding='utf-8')) if r['mode']=='kentei'}
SUBJ={'数検':'数学','漢検':'国語','理科検定':'理科'}
for f in sorted(H.glob('kentei-*.json')):
  d=json.loads(f.read_text(encoding='utf-8'));qs=[]
  for q in d['questions']:
    r=ledger[q['source']['file']];assert r['sha256']==q['source']['sha256'] and r['verified'] and q['source']['page'] in r['pages']
    q=dict(q);q['source']=dict(q['source'],id=r['id']);
    a=q['answer']
    if a['kind']=='set' and all(len(x)==1 and len(x[0])==1 and 'ア'<=x[0]<='ン' for x in a['items']):q['answer']=dict(a,letters=True)
    # ↑記号を全部選ぶ問題は「アイエ」と区切らずに書いても読む（10/21の直しと同じ）
    assert q['type']=='input' and q['origin']=='original' and q['reviewed'] is True and q['explanation'];qs.append(q)
  unit={'id':d['id'],'mode':'kentei','bank':'kentei','subject':SUBJ[d['kentei']],'grade':1,'title':d['title'],'majorTitle':d['kentei'],'kentei':d['kentei'],'level':d['level'],
        'status':'ready','size':len(qs),'exam':d['exam'],'questions':qs,'tests':[],'reviewNote':d['reviewNote']}
  (R/'教材整理/確認済み'/f.name).write_text(json.dumps(unit,ensure_ascii=False,indent=1),encoding='utf-8');print(f.name,len(qs))
