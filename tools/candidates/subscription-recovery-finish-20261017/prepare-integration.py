from pathlib import Path
import hashlib,json,sys
base=Path(__file__).resolve().parent
root=base.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def outputs():
 out={}
 names={'recovery.mjs':'openai-note-recovery.mjs','jobs.mjs':'openai-note-jobs.mjs','route.mjs':'openai-note-route.mjs'}
 for src,dst in names.items():
  s=(base.parent/'note-recovery-20261017'/src).read_text().replace('../../../cf-worker/src/','./')
  for old,new in names.items():s=s.replace("'./"+old+"'","'./"+new+"'")
  out['cf-worker/src/'+dst]=s
 notice=base.parent/'ai-limit-notice-20261017'
 for src,dst in {'note-api.js':'site-assets/note-analysis-api.js','avatar-service.mjs':'cf-worker/src/openai-avatar-service.mjs','avatar-route.mjs':'cf-worker/src/openai-avatar-route.mjs','tutor-service.mjs':'cf-worker/src/openai-tutor-service.mjs','trial-control.mjs':'cf-worker/src/ai-trial-control.mjs'}.items():
  out[dst]=(notice/src).read_text().replace('../../../cf-worker/src/','./').replace("'./avatar-service.mjs'","'./openai-avatar-service.mjs'").replace("'./trial-control.mjs'","'./ai-trial-control.mjs'")
 compatibility=base.parent/'subscription-cache-compat-20261017'
 out['site-assets/plans-guide.js']=(compatibility/'guide.js').read_text()
 out['site-assets/subscription-ui.js']=(compatibility/'ui.js').read_text()
 patch=json.loads((notice/'index-patch.json').read_text()); current=(root/'index.html').read_text()
 assert current.count(patch['old'])==1,'photo adapter changed; review before applying'
 current=current.replace(patch['old'],patch['new'])
 exam=json.loads((base.parent/'exam-date-validation-20261017'/'patch.json').read_text())
 for old,new in [(exam['old'],exam['new']),(exam['addOld'],exam['addNew'])]:
  assert current.count(old)==1,'countdown source changed; review before applying'
  current=current.replace(old,new)
 out['index.html']=current
 p='.claude/verify/run.sh';s=(root/p).read_text();anchor='node "$PROJECT_DIR/tools/candidates/extended-note-20261017/verify-browser.mjs" --main || fail=1'
 assert s.count(anchor)==1
 tests=['note-recovery-20261017/verify.mjs','note-recovery-20261017/verify-browser.mjs','ai-limit-notice-20261017/verify.mjs','subscription-pricing-20261017/verify.mjs','exam-date-validation-20261017/verify.cjs','subscription-cache-compat-20261017/verify-browser.mjs']
 for t in tests:assert t not in s,'already registered '+t
 extra='\n'.join('node "$PROJECT_DIR/tools/candidates/'+t+'" --main || fail=1' for t in tests)
 out[p]=s.replace(anchor,anchor+'\n'+extra)
 diagnostic=json.loads((base/'book-diagnostic-patch.json').read_text())
 s=(root/diagnostic['path']).read_text();assert s.count(diagnostic['old'])==1
 out[diagnostic['path']]=s.replace(diagnostic['old'],diagnostic['new'])
 return out
out=outputs();manifest=base/'integration.json'
if len(sys.argv)==1:
 manifest.write_text(json.dumps({'files':[{'path':p,'before':sha(root/p),'after':hashlib.sha256(v.encode()).hexdigest()} for p,v in out.items()]},indent=2)+'\n')
 print('Prepared',len(out),'pinned files; main unchanged')
elif len(sys.argv)==3 and sys.argv[1]=='--apply':
 assert Path(sys.argv[2]).read_text().rstrip().endswith('\u2705 \u305c\u3093\u3076\u901a\u904e'),'full verification not successful'
 rows=json.loads(manifest.read_text())['files']; assert len(rows)==len(out)
 for row in rows:
  assert sha(root/row['path'])==row['before'],'source changed: '+row['path']
  assert hashlib.sha256(out[row['path']].encode()).hexdigest()==row['after'],'candidate changed'
 for row in rows:
  p=root/row['path']
  if p.exists():
   b=base/'previous'/row['path'];b.parent.mkdir(parents=True,exist_ok=True);assert not b.exists(),'already applied';b.write_bytes(p.read_bytes())
 for row in rows:(root/row['path']).write_text(out[row['path']])
 (base/'integrated-sha.json').write_text(json.dumps({row['path']:sha(root/row['path']) for row in rows},indent=2)+'\n')
 print('Applied',len(rows),'files; no deployment, provider call or credential access')
else:raise SystemExit('usage: prepare-integration.py [--apply successful-full-log]')
