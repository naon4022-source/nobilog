import json,sys
u=sys.argv[1];d=json.load(open(f'原本写し/tokkun-science-1-{u}.json'))
for q in d['questions']:
    a=q['answer'];k=a['kind']
    if k=='number':ans=f"N:{a['value']} u={a.get('units')}"
    elif k=='exact':ans=f"E:{a['accepted']}"
    elif k=='set':ans=f"S:{a['items']} ord={a.get('ordered')}"
    elif k=='rubric':ans=f"R:req={a.get('required')} cr={[c['any'] for c in a['criteria']]} rej={a.get('reject')} neg={a.get('allowNegation')} max={a.get('maxChars')}"
    else: ans=f"{k}:{a}"
    print(f"#{q['id'].split('-')[-1]} p{q['source']['page']}|{q['prompt']}\n  => {ans}\n  解:{q['explanation']}" + (f" near={q['near']}" if q.get('near') else '') + (" IMG" if q.get('image') else ''))
