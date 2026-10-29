from pathlib import Path
import hashlib,json,sys
base=Path(__file__).resolve().parent
root=base.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def once(s,a,b):
 assert s.count(a)==1,'anchor changed: '+a[:65]
 return s.replace(a,b)
def outputs():
 result={}
 names={'png.mjs':'openai-avatar-png.mjs','transport.mjs':'openai-avatar-transport.mjs','service.mjs':'openai-avatar-service.mjs','route.mjs':'openai-avatar-route.mjs'}
 for source,target in names.items():
  s=(base/source).read_text().replace('../../../cf-worker/src/','./')
  for a,b in names.items():s=s.replace("'./"+a+"'","'./"+b+"'")
  s=s.replace("'./trial-control.mjs'","'./ai-trial-control.mjs'")
  result['cf-worker/src/'+target]=s
 trial=json.loads((base/'trial-patches.json').read_text());p=root/'cf-worker/src/ai-trial-control.mjs';assert sha(p)==trial['sourceSHA'],'trial changed'
 s=p.read_text()
 for q in trial['patches']:s=once(s,q['old'],q['new'])
 result['cf-worker/src/ai-trial-control.mjs']=s
 ui=json.loads((base/'ui-patches.json').read_text());p=root/'site-assets/profile-photos.js';assert sha(p)==ui['sourceSHA'],'profile UI changed'
 s=p.read_text()
 for q in ui['patches']:s=once(s,q['old'],q['new'])
 assert s==(base/'profile-photos.js').read_text(),'UI candidate changed'
 result['site-assets/profile-photos.js']=s
 name='cf-worker/src/profile-photos.mjs';s=(root/name).read_text()
 s=once(s,'export async function profilePhotosRoute(request,env,session){','export async function profilePhotosRoute(request,env,session,helpers={}){')
 anchor=' const url=new URL(request.url),path=url.pathname;'
 s=once(s,anchor,anchor+"\n if(path==='/avatar-generations'||path==='/avatar-generate'&&env.OPENAI_AVATAR_READY==='1'){\n  const {avatarRoute}=await import('./openai-avatar-route.mjs');\n  return avatarRoute(request,env,session,helpers);\n }")
 result[name]=s
 name='cf-worker/src/index.js';s=(root/name).read_text()
 s=once(s,"if(path==='/avatar'||path==='/avatar-image'||path==='/photos'||path==='/avatar-generate'){","if(path==='/avatar'||path==='/avatar-image'||path==='/photos'||path==='/avatar-generate'||path==='/avatar-generations'){")
 s=once(s,'await profilePhotosRoute(request,env,session)','await profilePhotosRoute(request,env,session,{owner:await opaqueKey(session.token)})');result[name]=s
 name='cf-worker/src/plans.mjs';s=(root/name).read_text();s=once(s,'voice:rank>=4,nao:rank>=4','voice:rank>=4,aiAvatar:rank>=4,nao:rank>=4');result[name]=s
 name='index.html';s=(root/name).read_text()
 s=once(s,"body:JSON.stringify(body)},20000);if(!cloudSame(who))throw Error('changed');let json=null;","body:JSON.stringify(body)},path==='/avatar-generate'?75000:20000);if(!cloudSame(who))throw Error('changed');let json=null;")
 anchor='        saved(){void avatarRefresh();}});'
 new="""        async generatorStatus(){return this.get('/avatar-generations');},
        async imageBlob(id){if(!/^[a-f0-9]{64}$/.test(id)||!cloudSame(who))throw Error('image');const r=await cloudTry(cloudUrl('/learning-image?id='+id),{cache:'no-store'},15000);if(!r.ok||!cloudSame(who))throw Error('image');const b=await r.blob();if(!cloudSame(who))throw Error('changed');return b;},
"""+anchor
 s=once(s,anchor,new);result[name]=s
 name='site-assets/sw.js';s=(root/name).read_text();s=once(s,'avatar(?:-image|-generate)?','avatar(?:-image|-generations|-generate)?');result[name]=s
 name='.claude/verify/verify-learning-images-cache.mjs';s=(root/name).read_text();s=once(s,"'/avatar-generate']","'/avatar-generate','/avatar-generations','/api/avatar-generations']");result[name]=s
 name='.claude/verify/verify-photos-browser.mjs';s=(root/name).read_text()
 s=once(s,"const src=URL.createObjectURL(await png());return json({real:true,candidates:[{id:'c1',src},{id:'c2',src}]});","return json({real:true,candidates:['a'.repeat(64),'b'.repeat(64)].map(id=>({src:'/learning-image?id='+id}))});")
 anchor="  if(p==='/avatar')return json({avatar:F.avatar?{id:F.avatar.id,rev:F.avatar.rev}:null});"
 s=once(s,anchor,"  if(p==='/avatar-generations')return json({ready:F.gen==='real',items:[],credits:3});\n"+anchor);result[name]=s
 name='.claude/verify/run.sh';s=(root/name).read_text();anchor='node "$PROJECT_DIR/tools/candidates/budget-settlement-20261017/verify-service.mjs" --main || fail=1'
 extra='\n'.join('node "$PROJECT_DIR/tools/candidates/ai-avatar-20261017/verify-'+n+'.mjs" --main || fail=1' for n in ['png','transport','trial','service','route','ui'])
 result[name]=once(s,anchor,anchor+'\n'+extra)
 return result
out=outputs();manifest=base/'integration.json'
if len(sys.argv)==1:
 manifest.write_text(json.dumps({'files':[{'path':p,'before':sha(root/p),'after':hashlib.sha256(v.encode()).hexdigest()} for p,v in out.items()]},indent=2)+'\n');print('Prepared',len(out),'pinned files; main unchanged')
elif len(sys.argv)==3 and sys.argv[1]=='--apply':
 assert Path(sys.argv[2]).read_text().rstrip().endswith('\u2705 \u305c\u3093\u3076\u901a\u904e'),'full verification not successful'
 records=json.loads(manifest.read_text())['files']
 for row in records:
  assert sha(root/row['path'])==row['before'],'source changed: '+row['path']
  assert hashlib.sha256(out[row['path']].encode()).hexdigest()==row['after'],'candidate changed'
 backup=base/'previous';backup.mkdir(exist_ok=True)
 for row in records:
  p=root/row['path']
  if p.exists():
   b=backup/row['path'];b.parent.mkdir(parents=True,exist_ok=True);assert not b.exists(),'already applied';b.write_bytes(p.read_bytes())
 for row in records:(root/row['path']).write_text(out[row['path']])
 print('Applied',len(records),'files; no deploy, API call or credential access')
else:raise SystemExit('usage: prepare-integration.py [--apply successful-full-log]')
