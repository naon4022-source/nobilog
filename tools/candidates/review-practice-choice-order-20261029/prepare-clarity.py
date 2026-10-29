"""An explicit five-text-edit successor affecting only three unshipped questions."""
from pathlib import Path
import json,copy,hashlib
base=Path(__file__).parent;out=base/'clarity';out.mkdir(exist_ok=True)
parse=lambda p:json.loads(p.read_text().removeprefix('export default ').rstrip().removesuffix(';'))
parent=base/'ai-review-practice-data.mjs';old=parse(parent);data=copy.deepcopy(old);edits=json.loads((base/'clarity-edits.json').read_text())
questions={q['id']:q for q in data['questions']}
for e in edits:
 q=questions[e['id']];assert q[e['field']].count(e['before'])==1,e
 q[e['field']]=q[e['field']].replace(e['before'],e['after'])
changed=[]
for a,b in zip(old['questions'],data['questions']):
 assert a['id']==b['id'] and a['answer']==b['answer']
 if a!=b:changed.append(a['id'])
 assert {k:v for k,v in a.items() if k not in ['prompt','explanation']}=={k:v for k,v in b.items() if k not in ['prompt','explanation']}
assert set(changed)=={e['id'] for e in edits}
for k in data:
 if k!='questions':assert data[k]==old[k]
(out/'ai-review-practice-data.mjs').write_text('export default '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
(out/'relocated-library.mjs').write_bytes((base/'relocated-library.mjs').read_bytes())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
prep=json.loads((base/'preparation.json').read_text());prep['inputs'] += [{'file':str(parent),'sha256':sha(parent)},{'file':str(base/'clarity-edits.json'),'sha256':sha(base/'clarity-edits.json')}];prep['clarityChanges']=edits;prep['clarifiedQuestions']=changed;prep['candidateSha256']=sha(out/'ai-review-practice-data.mjs');(out/'preparation.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2)+'\n')
s=(base/'verify.mjs').read_text().replace("from './ai-review-practice-data.mjs'","from './clarity/ai-review-practice-data.mjs'").replace("from './relocated-library.mjs'","from './clarity/relocated-library.mjs'").replace("here=new URL('./',import.meta.url)","here=new URL('./clarity/',import.meta.url)")
assert s!=(base/'verify.mjs').read_text();(base/'verify-clarity.mjs').write_text(s)
print('Prepared3 unshipped question clarifications; all answers, IDs, source bindings, and shipped48 unchanged.')
