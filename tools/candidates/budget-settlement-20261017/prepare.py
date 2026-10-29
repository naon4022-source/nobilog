from pathlib import Path
import hashlib,json,sys
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def once(text,old,new):
 assert text.count(old)==1,'anchor changed'
 return text.replace(old,new)
def outputs():
 result={}
 result['cf-worker/src/openai-priced-operation.mjs']=(BASE/'priced-operation.mjs').read_text().replace('../../../cf-worker/src/','./')
 name='cf-worker/src/openai-tutor-service.mjs';s=(ROOT/name).read_text()
 for patch in json.loads((BASE/'service-patches.json').read_text()):s=once(s,patch['old'],patch['new'])
 result[name]=s
 name='cf-worker/src/openai-transport.mjs';s=(ROOT/name).read_text()
 for patch in json.loads((BASE/'transport-patches.json').read_text()):s=once(s,patch['old'],patch['new'])
 result[name]=s
 name='.claude/verify/verify-openai-tutor-service-failure.mjs';s=(ROOT/name).read_text()
 old='   const prepare=db.prepare.bind(db);'
 new=old+'''
   const batch=db.batch.bind(db);
   db.batch=async statements=>{const result=await batch(statements),row=db.get('openai-operation:p_pro:request_1');if(lost&&row&&JSON.parse(row.v).state==='done'){lost=false;throw Error('Synthetic lost batch reply');}return result;};'''
 result[name]=once(s,old,new)
 name='.claude/verify/run.sh';s=(ROOT/name).read_text()
 old='node "$VERIFY_DIR/verify-ai-trial-integration.mjs" || fail=1'
 new=old+'\nnode "$PROJECT_DIR/tools/candidates/budget-settlement-20261017/verify.mjs" --main || fail=1\nnode "$PROJECT_DIR/tools/candidates/budget-settlement-20261017/verify-service.mjs" --main || fail=1'
 result[name]=once(s,old,new)
 return result
out=outputs();manifest=BASE/'integration.json'
if len(sys.argv)==1:
 manifest.write_text(json.dumps({'files':[{'path':p,'before':sha(ROOT/p),'after':hashlib.sha256(v.encode()).hexdigest()} for p,v in out.items()]},indent=2)+'\n')
 print('Prepared',len(out),'pinned files; runtime unchanged')
elif len(sys.argv)==3 and sys.argv[1]=='--apply':
 assert Path(sys.argv[2]).read_text().rstrip().endswith('\u2705 \u305c\u3093\u3076\u901a\u904e'),'verification not successful'
 records=json.loads(manifest.read_text())['files']
 for row in records:
  assert sha(ROOT/row['path'])==row['before'],'source changed: '+row['path']
  assert hashlib.sha256(out[row['path']].encode()).hexdigest()==row['after'],'candidate changed'
 for row in records:(ROOT/row['path']).write_text(out[row['path']])
 print('Applied',len(records),'files; no deployment')
else:raise SystemExit('usage: prepare.py [--apply completed-success-log]')
