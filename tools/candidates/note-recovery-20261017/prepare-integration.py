from pathlib import Path
import hashlib,json,sys
base=Path(__file__).resolve().parent
root=base.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def outputs():
 out={}
 names={'recovery.mjs':'openai-note-recovery.mjs','jobs.mjs':'openai-note-jobs.mjs','route.mjs':'openai-note-route.mjs'}
 for a,b in names.items():
  s=(base/a).read_text().replace('../../../cf-worker/src/','./')
  for old,new in names.items():s=s.replace("'./"+old+"'","'./"+new+"'")
  out['cf-worker/src/'+b]=s
 p='.claude/verify/run.sh';s=(root/p).read_text();anchor='node "$PROJECT_DIR/tools/candidates/extended-note-20261017/verify-browser.mjs" --main || fail=1'
 assert s.count(anchor)==1
 extra='\n'.join('node "$PROJECT_DIR/tools/candidates/note-recovery-20261017/'+name+'" --main || fail=1' for name in ['verify.mjs','verify-browser.mjs'])
 out[p]=s.replace(anchor,anchor+'\n'+extra)
 return out
out=outputs();manifest=base/'integration.json'
if len(sys.argv)==1:
 manifest.write_text(json.dumps({'files':[{'path':p,'before':sha(root/p),'after':hashlib.sha256(v.encode()).hexdigest()} for p,v in out.items()]},indent=2)+'\n');print('Prepared',len(out),'pinned files; main unchanged')
elif len(sys.argv)==3 and sys.argv[1]=='--apply':
 assert Path(sys.argv[2]).read_text().rstrip().endswith('\u2705 \u305c\u3093\u3076\u901a\u904e'),'full verification not successful'
 rows=json.loads(manifest.read_text())['files']
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
