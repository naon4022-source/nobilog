"""Reorder only unshipped predictable options; preserve every option's meaning and references."""
from pathlib import Path
import json,re,hashlib,random,copy
out=Path(__file__).parent;root=Path.cwd()
source=Path('Claude作業/20261028_類題拡大_残10/候補/ai-review-practice-data.mjs')
main=Path('cf-worker/src/ai-review-practice-data.mjs')
def parse(p):return json.loads(p.read_text().removeprefix('export default ').rstrip().removesuffix(';'))
old=parse(source);data=copy.deepcopy(old);shipped=parse(main);questions={q['id']:q for q in data['questions']};shipped_ids={q['id'] for q in shipped['questions']}
labels='アイウ';groups=[]
for p in data['patterns']:
 ids=p['practiceIds']
 if len(ids)==3 and not any(i in shipped_ids for i in ids) and [questions[i]['answer']['accepted'] for i in ids]==[[x] for x in labels]:groups.append(ids)
assert len(groups)==10
rng=random.Random('nobilog-unshipped-choice-order-20261029')
positions=list(labels*10);rng.shuffle(positions)
assert any(len(set(positions[n:n+3]))<3 for n in range(0,30,3))
changes=[]
for n,qid in enumerate(i for group in groups for i in group):
 q=questions[qid];before=copy.deepcopy(q);lines=q['prompt'].splitlines();opts={}
 for line in lines:
  m=re.fullmatch(r'([アイウ])　(.*)',line)
  if m:opts[m[1]]=m[2]
 assert len(opts)==3 and len(lines)==4
 previous=q['answer']['accepted'][0];target=positions[n]
 remaining_old=[x for x in labels if x!=previous];remaining_new=[x for x in labels if x!=target];rng.shuffle(remaining_new)
 relabel={previous:target,**dict(zip(remaining_old,remaining_new))}
 reordered={relabel[k]:v for k,v in opts.items()}
 q['prompt']=lines[0]+'\n'+'\n'.join(k+'　'+reordered[k] for k in labels)
 q['answer']['accepted']=[target]
 pattern=r'(?<![ァ-ヶー])[アイウ](?![ァ-ヶー])'
 q['explanation']=re.sub(pattern,lambda m:relabel[m[0]],q['explanation'])
 assert reordered[target]==opts[previous]
 assert sorted(reordered.values())==sorted(opts.values())
 inverse={v:k for k,v in relabel.items()}
 assert re.sub(pattern,lambda m:inverse[m[0]],q['explanation'])==before['explanation']
 assert {k:v for k,v in q.items() if k not in ['prompt','answer','explanation']}=={k:v for k,v in before.items() if k not in ['prompt','answer','explanation']}
 changes.append({'id':qid,'oldCorrect':previous,'newCorrect':target,'optionMap':relabel,'before':before,'after':copy.deepcopy(q)})
for q in shipped['questions']:assert questions[q['id']]==q
for p in shipped['patterns']:assert next(x for x in data['patterns'] if x['id']==p['id'])==p
for k in old:
 if k!='questions':assert data[k]==old[k]
(out/'ai-review-practice-data.mjs').write_text('export default '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(out/'preparation.json').write_text(json.dumps({'status':'candidate only; content approval and main integration pending','inputs':[{'file':str(p),'sha256':sha(p)} for p in [source,main]],'preservedShippedQuestions':len(shipped_ids),'targetedUnshippedQuestions':len(changes),'changedUnshippedQuestions':sum(r['before']!=r['after'] for r in changes),'changes':changes,'candidateSha256':sha(out/'ai-review-practice-data.mjs')},ensure_ascii=False,indent=2)+'\n')
library=Path('cf-worker/src/ai-review-practice-library.mjs').read_text()
library=library.replace("from './material-engine.cjs'","from '"+(root/'cf-worker/src/material-engine.cjs').as_uri()+"'")
(out/'relocated-library.mjs').write_text(library)
print('Prepared30 unshipped choice reorderings; existing48 and all source bindings unchanged.')
