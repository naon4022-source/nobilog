from pathlib import Path
import hashlib,json,sys
base=Path(__file__).resolve().parent
root=base.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def once(s,a,b):
 assert s.count(a)==1,'anchor changed: '+a[:60]
 return s.replace(a,b)
def outputs():
 result={}
 names={'content.mjs':'openai-note-extended-content.mjs','transport.mjs':'openai-note-extended-transport.mjs','context.mjs':'openai-note-context.mjs','jobs.mjs':'openai-note-jobs.mjs','route.mjs':'openai-note-route.mjs','service.mjs':'openai-tutor-service.mjs'}
 for a,b in names.items():
  s=(base/a).read_text().replace('../../../cf-worker/src/','./')
  for old,new in names.items():s=s.replace("'./"+old+"'","'./"+new+"'")
  s=s.replace('// Unconnected candidate for whole saved notes, including private attachments.','// Whole saved notes, including only their owner-bound private attachments.')
  s=s.replace('// Candidate only. The authenticated note service must reserve the global','// The authenticated note service must reserve the global')
  result['cf-worker/src/'+b]=s
 result['site-assets/note-analysis.js']=(base/'panel.js').read_text()
 p='site-assets/plan-study.js';s=(root/p).read_text();s=once(s,'ノートの文章分析は編集画面で利用状態を確認できます。AIアイコン生成はまだ使えません。','ノートの文章・写真の分析は編集画面で、AIアイコン生成はアイコンの編集画面で、現在の利用状態を確認できます。');result[p]=s
 p='tools/candidates/note-analysis-20261017/verify-jobs.mjs';s=(root/p).read_text();s=once(s,"{...body,noteId:imageNote.id})).status,400)","{...body,noteId:imageNote.id})).status,mainMode?200:400)");result[p]=s
 p='tools/candidates/note-analysis-20261017/verify-browser.mjs';s=(root/p).read_text();s=once(s,"saved.images=['a'.repeat(64)];draft=structuredClone(saved);ui.refresh();});ok(await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).isDisabled());","saved.images=['a'.repeat(64)];draft=structuredClone(saved);ui.refresh();});ok((await page.getByRole('button',{name:'AIで振り返る（3回分）',exact:true}).isDisabled())===!mainMode);");result[p]=s
 p='.claude/verify/run.sh';s=(root/p).read_text();anchor='node "$PROJECT_DIR/tools/candidates/note-analysis-20261017/verify-flow.mjs" --main || fail=1';extra='\n'.join('node "$PROJECT_DIR/tools/candidates/extended-note-20261017/verify-'+n+'.mjs" --main || fail=1' for n in ['content','transport','service','browser']);result[p]=once(s,anchor,anchor+'\n'+extra)
 return result
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
 print('Applied',len(rows),'files; no deploy, provider call or credential access')
else:raise SystemExit('usage: prepare-integration.py [--apply successful-full-log]')
