"""Prepare pinned runtime changes; --apply requires a completed successful suite."""
from pathlib import Path
import hashlib,json,sys

BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
MANIFEST=BASE/'integration.json'
def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
def replace_once(text,old,new):
 if text.count(old)!=1:raise ValueError('source anchor not unique')
 return text.replace(old,new)
def outputs():
 result={}
 for src,dst in [('note-content.mjs','openai-note-content.mjs'),('note-context.mjs','openai-note-context.mjs'),('note-route.mjs','openai-note-route.mjs'),('note-jobs.mjs','openai-note-jobs.mjs')]:
  text=(BASE/src).read_text()
  text=text.replace("../../../cf-worker/src/plans.mjs","./plans.mjs")
  for old,new in [('note-content.mjs','openai-note-content.mjs'),('note-context.mjs','openai-note-context.mjs'),('note-jobs.mjs','openai-note-jobs.mjs')]:text=text.replace("'./"+old+"'","'./"+new+"'")
  result['cf-worker/src/'+dst]=text
 for src,dst in [('note-panel.js','note-analysis.js'),('note-panel.css','note-analysis.css'),('note-browser-api.js','note-analysis-api.js')]:result['site-assets/'+dst]=(BASE/src).read_text()
 path='cf-worker/src/openai-tutor-service.mjs';text=(ROOT/path).read_text()
 for patch in json.loads((BASE/'service-authorization-patches.json').read_text()):
  assert text.count(patch['old'])==patch['count'],'authorization anchor changed'
  text=text.replace(patch['old'],patch['new'])
 text="import {capturedNote} from './openai-note-context.mjs';\nimport {noteContent} from './openai-note-content.mjs';\n"+text
 text=replace_once(text,"error?.message==='chat_context_conflict'","['chat_context_conflict','note_context_conflict'].includes(error?.message)")
 text+='\n'+(BASE/'service-export.txt').read_text();result[path]=text
 path='cf-worker/src/subscription-credits.mjs';text=(ROOT/path).read_text()
 text=replace_once(text,"['note_analysis','deep_explain'].includes(purpose)","['note_analysis','note-analysis','deep_explain','detailed-explanation','test-review'].includes(purpose)")
 result[path]=text
 path='cf-worker/src/plans.mjs';text=(ROOT/path).read_text()
 text=replace_once(text,"standard:{label:'Standard'","standard:{label:'Student'")
 text=replace_once(text,"const plan=PREVIEW_PROFILES[uid]||'free';","const plan=PREVIEW_PROFILES[uid]||(uid==='u1'?'unlimit':'free');")
 text=replace_once(text,"end:plan==='free'?null:start+365*DAY","end:plan==='free'||uid==='u1'?null:start+365*DAY")
 text=replace_once(text,"reason:PREVIEW_PROFILES[uid]?'確認版のテスト':'初回設定'","reason:PREVIEW_PROFILES[uid]?'確認版のテスト':uid==='u1'?'運営者':'初回設定'")
 result[path]=text
 path='cf-worker/src/learning-assistant.mjs';text=(ROOT/path).read_text()
 anchor=" if(url.search)return reply({error:'invalid_query'},400);\n if(url.pathname==='/learning-chat')"
 addition=""" if(url.pathname==='/learning-note-analysis-job'){
  const {noteJobRoute}=await import('./openai-note-jobs.mjs');
  return noteJobRoute(request,env,session,{owner:helpers.owner});
 }
 if(url.pathname==='/learning-note-analysis'){
  const [{noteAnalysisRoute},{serveNoteAnalysis}]=await Promise.all([import('./openai-note-route.mjs'),import('./openai-tutor-service.mjs')]);
  return noteAnalysisRoute(request,env,session,{owner:helpers.owner,fetcher:helpers.fetchImpl,serve:serveNoteAnalysis});
 }
"""
 text=replace_once(text,anchor,addition+anchor);result[path]=text
 path='cf-worker/src/index.js';text=(ROOT/path).read_text()
 text=replace_once(text,"path==='/learning-review'||path==='/learning-plan'","path==='/learning-review'||path==='/learning-plan'||path==='/learning-note-analysis'||path==='/learning-note-analysis-job'");result[path]=text
 path='index.html';text=(ROOT/path).read_text()
 text=replace_once(text,'    <script src="/plan-study.js" defer></script>','    <script src="/plan-study.js" defer></script>\n    <link rel="stylesheet" href="/note-analysis.css">\n    <script src="/note-analysis-api.js" defer></script>\n    <script src="/note-analysis.js" defer></script>')
 text=replace_once(text,'まとめた内容はサーバーに保存します。AIによる分析はまだ使えません。','まとめた内容はサーバーに保存します。保存した文章のAI振り返りは、編集画面で利用状態を確認できます。')
 old="        const attachments=window.NobiLearningImages?.create(imageHost,{initial:item.images||[],readonly:!canAttach,pasteTarget:text,current:()=>cloudSame(who),request:(path,options)=>learningImageRequest(path,options,who)});"
 new="""        let noteAI=null;
        const attachments=window.NobiLearningImages?.create(imageHost,{initial:item.images||[],readonly:!canAttach,pasteTarget:text,current:()=>cloudSame(who),request:(path,options)=>learningImageRequest(path,options,who),change:()=>noteAI?.refresh()});
        if(window.NobiNoteAnalysis&&window.NobiNoteAnalysisAPI){
            const panel=document.createElement('section');button.after(panel);
            const api=NobiNoteAnalysisAPI.create({
                same:()=>cloudSame(who)&&panel.isConnected,
                saved:()=>item,draft:()=>({title:title.value,text:text.value,images:attachments?attachments.ids():item.images||[]}),allowed:()=>canAttach,
                async request(path,options){if(!cloudSame(who))throw Error('session_changed');const response=await cloudTry(cloudUrl(path),options,90000);if(!cloudSame(who))throw Error('session_changed');return response;},
                lock(value){button.disabled=value;title.disabled=value;text.disabled=value;attachments?.setDisabled(value);}
            });
            noteAI=NobiNoteAnalysis.mount(panel,api);
            title.addEventListener('input',()=>noteAI?.refresh());text.addEventListener('input',()=>noteAI?.refresh());
        }"""
 text=replace_once(text,old,new)
 text=replace_once(text,"item.revision=data.item.revision;item.images=data.item.images||[];status.textContent='サーバーに保存しました。';","item.revision=data.item.revision;item.title=data.item.title;item.text=data.item.text;item.images=data.item.images||[];status.textContent='サーバーに保存しました。';noteAI?.refresh();")
 result[path]=text
 path='site-assets/plan-study.js';text=(ROOT/path).read_text()
 text=replace_once(text,'ノートのAI分析とAIアイコン生成は、まだ使えません。','ノートの文章分析は編集画面で利用状態を確認できます。AIアイコン生成はまだ使えません。');result[path]=text
 path='.claude/verify/run.sh';text=(ROOT/path).read_text()
 anchor='node "$VERIFY_DIR/verify-plan-study-api.mjs" || fail=1'
 addition='\n'.join('node "$PROJECT_DIR/tools/candidates/note-analysis-20261017/'+name+'.mjs" --main || fail=1' for name in ['verify','verify-jobs','verify-browser-api','verify-authorization','verify-owner-plan','verify-browser','verify-flow'])
 result[path]=replace_once(text,anchor,anchor+'\n'+addition)
 return result

generated=outputs()
if len(sys.argv)==1:
 data={'version':1,'files':[{'path':p,'before':sha(ROOT/p),'after':hashlib.sha256(v.encode()).hexdigest()} for p,v in generated.items()]}
 MANIFEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print('Prepared',len(generated),'pinned runtime files; none applied')
elif len(sys.argv)==3 and sys.argv[1]=='--apply':
 log=Path(sys.argv[2]);assert log.read_text().rstrip().endswith('✅ ぜんぶ通過'),'full verification has not passed'
 data=json.loads(MANIFEST.read_text())
 for row in data['files']:
  assert sha(ROOT/row['path'])==row['before'],'source changed: '+row['path']
  assert hashlib.sha256(generated[row['path']].encode()).hexdigest()==row['after'],'candidate changed: '+row['path']
 for row in data['files']:
  destination=ROOT/row['path'];destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(generated[row['path']])
 print('Applied',len(data['files']),'pinned files; deployment not performed')
else:raise SystemExit('usage: prepare-integration.py [--apply successful-verification.log]')
