// 確認版の個人ノート。UIDは認証済みセッションだけから取得する。
import {planAllows,subscriptionOn,planStoreMockChat,planStatus,historyWindow} from './plans.mjs';
import {creditPolicyOn} from './subscription-credits.mjs';
import {ownImages} from './learning-images.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{8,64}$/.test(x);
const CHAT_GAP=3000,STALE=60000;
async function boundedText(request,max){
 if(!request.body||Number(request.headers.get('Content-Length'))>max)throw Error('body');
 const reader=request.body.getReader(),parts=[];let n=0;
 try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>max){await reader.cancel();throw Error('body');}parts.push(r.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(n);let at=0;for(const p of parts){bytes.set(p,at);at+=p.byteLength;}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}

export async function learningAssistantRoute(request,env,session,helpers={}){
 if(!subscriptionOn(env))return reply({error:'not_found'},404);
 if(typeof session?.uid!=='string'||!session.uid)return reply({error:'unauthorized'},401);
 if(!env.AUTH_DB)return reply({error:'unavailable'},503);
 const url=new URL(request.url),db=env.AUTH_DB,uid=session.uid;
 if(url.pathname==='/learning-plan')return planner(request,env,uid);
 if(url.pathname==='/learning-review'){
  if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  const cursor=url.searchParams.get('cursor')||'';
  if([...url.searchParams.keys()].some(k=>k!=='cursor')||url.searchParams.getAll('cursor').length>1||(cursor&&!/^\d{13}:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(cursor)))return reply({error:'invalid_query'},400);
  try{
   const now=Date.now(),status=await planStatus(env,uid,now);
   if(!status.provisional||!status.features?.weakness)return reply({error:'plan_required',required:'pro'},403);
   const window=historyWindow(status.plan,now),prefix='material-history:'+uid+':',lower=window?prefix+String(Math.max(0,window.from)).padStart(13,'0'):prefix,upper=cursor?prefix+cursor:prefix+'\uffff';
   const rows=(await db.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<? ORDER BY k DESC LIMIT 51').bind(lower,upper).all()).results||[];
   const visible=rows.slice(0,50);return reply({items:visible.map(r=>JSON.parse(r.v)),next:rows.length>50?visible.at(-1).k.slice(prefix.length):null,window:window?{from:window.from,label:window.label}:null});
  }catch(_){return reply({error:'plan_unavailable'},503);}
 }
 if(url.pathname==='/learning-note-analysis-job'){
  const {noteJobRoute}=await import('./openai-note-jobs.mjs');
  return noteJobRoute(request,env,session,{owner:helpers.owner});
 }
 if(url.pathname==='/learning-note-analysis'){
  const [{noteAnalysisRoute},{serveNoteAnalysis}]=await Promise.all([import('./openai-note-route.mjs'),import('./openai-tutor-service.mjs')]);
  return noteAnalysisRoute(request,env,session,{owner:helpers.owner,fetcher:helpers.fetchImpl,serve:serveNoteAnalysis});
 }
 if(url.search)return reply({error:'invalid_query'},400);
 if(url.pathname==='/learning-chat'){
  if(env.OPENAI_ENABLED==='1'){
   const {openaiChatRoute}=await import('./openai-chat-route.mjs');
   return openaiChatRoute(request,env,session,{owner:helpers.owner,fetcher:helpers.fetchImpl});
  }
  return chat(request,env,session);
 }
 if(url.pathname!=='/learning-notes')return reply({error:'not_found'},404);
 const prefix='learning-note:'+uid+':';
 // 解約後も自分の原稿を読む・保存する権利は失わない。新規作成はPro以上。
 if(request.method==='GET'){
  const rows=(await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k LIMIT 100').bind(prefix,prefix+'￿').all()).results||[];
  return reply({items:rows.map(r=>JSON.parse(r.v))});
 }
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
 if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 let body;try{const text=await boundedText(request,48000);if(text.length>18000)throw 0;body=JSON.parse(text);}catch(_){return reply({error:'invalid_body'},400);}
 if(!body||!['id,revision,text,title','id,images,revision,text,title'].includes(Object.keys(body).sort().join(','))||!validId(body.id)||typeof body.title!=='string'||!body.title.trim()||body.title.length>100||typeof body.text!=='string'||body.text.length>12000||!Number.isSafeInteger(body.revision)||body.revision<0||body.revision>=1000000000)return reply({error:'invalid_body'},400);
 const key=prefix+body.id,raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 const images=Object.hasOwn(body,'images')?body.images:(raw?JSON.parse(raw).images||[]:[]);
 if(!await ownImages(db,uid,images))return reply({error:'invalid_images'},400);
 const same=r=>r&&r.revision===body.revision+1&&r.title===body.title.trim()&&r.text===body.text&&JSON.stringify(r.images||[])===JSON.stringify(images);
 if(raw&&same(JSON.parse(raw)))return reply({item:JSON.parse(raw),cached:true});
 if(!raw&&!await planAllows(env,uid,'notes'))return reply({error:'plan_required'},403);
 if(!raw){const count=await db.prepare('SELECT COUNT(*) n FROM auth_kv WHERE k>=? AND k<?').bind(prefix,prefix+'￿').first('n');if(count>=100)return reply({error:'note_limit'},409);}
 const value={id:body.id,title:body.title.trim(),text:body.text,images,revision:body.revision+1,updatedAt:Date.now()};
 const saved=raw
  ? await db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND CAST(json_extract(v,'$.revision') AS INTEGER)=? RETURNING v").bind(JSON.stringify(value),key,body.revision).first('v')
  : await db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE ?=0 AND (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<100 ON CONFLICT(k) DO NOTHING RETURNING v").bind(key,JSON.stringify(value),body.revision,prefix,prefix+'￿').first('v');
 if(!saved){
  const latest=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  if(latest&&same(JSON.parse(latest)))return reply({item:JSON.parse(latest),cached:true});
  if(!latest&&body.revision===0)return reply({error:'note_limit'},409);
  return reply({error:'revision_conflict'},409);
 }
 return reply({item:JSON.parse(saved)});
}

async function planner(request,env,uid){
 if(new URL(request.url).search)return reply({error:'invalid_query'},400);
 if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
 const db=env.AUTH_DB,key='learning-plan:'+uid;
 try{
  if(!await planAllows(env,uid,'planning'))return reply({error:'plan_required',required:'standard'},403);
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  if(raw){const stored=JSON.parse(raw);if(!Number.isSafeInteger(stored?.revision)||stored.revision<1||!Array.isArray(stored.tasks)||stored.tasks.length>35||!Number.isSafeInteger(stored.updatedAt))throw Error('invalid plan');}
  if(request.method==='GET')return reply({item:raw?JSON.parse(raw):{revision:0,tasks:[]},serverTime:Date.now()});
  if(request.headers.get('Origin')!==env.APP_ORIGIN||!env.APP_ORIGIN)return reply({error:'origin'},403);
  if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
  let b;try{b=JSON.parse(await boundedText(request,20000));}catch(_){return reply({error:'invalid_body'},400);}
  const validDay=x=>typeof x==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
  if(!b||Object.keys(b).sort().join(',')!=='revision,tasks'||!Number.isSafeInteger(b.revision)||b.revision<0||b.revision>=1000000000||!Array.isArray(b.tasks)||b.tasks.length>35||b.tasks.some(t=>!t||Object.keys(t).sort().join(',')!=='day,done,id,minutes,subject'||!validId(t.id)||!validDay(t.day)||!['数学','英語','国語','理科','社会'].includes(t.subject)||!Number.isInteger(t.minutes)||t.minutes<5||t.minutes>120||typeof t.done!=='boolean')||new Set(b.tasks.map(t=>t.id)).size!==b.tasks.length)return reply({error:'invalid_body'},400);
  const value={revision:b.revision+1,tasks:b.tasks,updatedAt:Date.now()},old=raw?JSON.parse(raw):null;
  if(old?.revision===value.revision&&JSON.stringify(old.tasks)===JSON.stringify(b.tasks))return reply({item:old,cached:true});
  const saved=raw?await db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND CAST(json_extract(v,'$.revision') AS INTEGER)=? RETURNING v").bind(JSON.stringify(value),key,b.revision).first('v'):await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE ?=0 ON CONFLICT(k) DO NOTHING RETURNING v').bind(key,JSON.stringify(value),b.revision).first('v');
  if(!saved)return reply({error:'revision_conflict'},409);return reply({item:JSON.parse(saved)});
 }catch(_){return reply({error:'plan_unavailable'},503);}
}

async function chat(request,env,session){
 const db=env.AUTH_DB,uid=session.uid,prefix='learning-chat:'+uid+':';
 if(!await planAllows(env,uid,'chat'))return reply({error:'plan_required'},403);
 if(request.method==='GET'){
  const rows=(await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k LIMIT 100').bind(prefix,prefix+'￿').all()).results||[];
  return reply({items:rows.map(r=>JSON.parse(r.v)).filter(r=>r.state==='done'),mock:true});
 }
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return reply({error:'origin'},403);
 if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 let b;try{const t=await boundedText(request,15000);if(t.length>7000)throw 0;b=JSON.parse(t);}catch(_){return reply({error:'invalid_body'},400);}
 if(!b||!['id,text','id,images,text'].includes(Object.keys(b).sort().join(','))||!validId(b.id)||typeof b.text!=='string'||b.text.length>3000)return reply({error:'invalid_body'},400);
 const images=Object.hasOwn(b,'images')?b.images:[];if(!await ownImages(db,uid,images))return reply({error:'invalid_images'},400);
 if(!b.text.trim()&&!images.length)return reply({error:'invalid_body'},400);
 // 外部通信は明示的に無効。実AI未接続を成功した学習分析として扱わない。
 if(env.GEMINI_MOCK!=='1'||env.GEMINI_ENABLED==='1')return reply({error:'provider_not_ready'},503);
 const key=prefix+b.id,now=Date.now(),pending={id:b.id,text:b.text,images,state:'pending',at:now,claim:crypto.randomUUID()};
 // 連打の見張り（2026-10-10 Claude）：新しい送信は3秒に1回まで。同じ送信IDの再試行はここで止めない
 if(!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=?').bind(key).first('x')&&!await db.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=excluded.expires_at WHERE auth_kv.expires_at<=? RETURNING v").bind('learning-chat-gap:'+uid,String(now),now+CHAT_GAP,now).first('v'))return reply({error:'too_fast'},429);
 const claimed=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?) ON CONFLICT(k) DO NOTHING RETURNING v').bind(key,JSON.stringify(pending),now+31*86400000).first('v');
 if(!claimed){
  const row=JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v'));
  if(row.text!==b.text||JSON.stringify(row.images||[])!==JSON.stringify(images))return reply({error:'id_conflict'},409);
  if(row.state==='done')return reply({item:row,cached:true,mock:true});
  if(row.state==='pending'&&row.at>now-STALE)return reply({error:'request_in_progress'},409);
  // 同じ送信の再試行は新しいIDを要求せず、失敗状態だけを取得する。
  // 途中で止まったまま1分たった送信も、同じIDでやり直せる（数は二重に使わない）
  const retry=await db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND (json_extract(v,'$.state')='failed' OR (json_extract(v,'$.state')='pending' AND CAST(json_extract(v,'$.at') AS INTEGER)<=?)) RETURNING v").bind(JSON.stringify(pending),key,now-STALE).first('v');
  if(!retry)return reply({error:'request_in_progress'},409);
 }
 try{
  const item={id:b.id,text:b.text,images,at:now,state:'done',mock:true,answer:'【動作確認用の仮返答】メッセージを受け取りました。実AIはまだ接続していないため、質問への解説・ノート分析は行っていません。送信回数、保存、再試行の確認だけができます。'};
  const units=images.length?6:2;
  const saved=await planStoreMockChat(env,db,uid,now,key,JSON.stringify(pending),JSON.stringify(item),units);
  if(!saved){
   const latest=JSON.parse(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v'));
   if(latest?.state==='done'&&latest.text===b.text&&JSON.stringify(latest.images||[])===JSON.stringify(images))return reply({item:latest,mock:true,cached:true});
   await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=?').bind(JSON.stringify({...pending,state:'failed'}),key,JSON.stringify(pending)).run();
   return reply({error:'ai_plan'},429);
  }
  return reply({item,mock:true,cached:false,creditsUsed:creditPolicyOn(env)?units/2:1});
 }catch(_){
  // A committed batch may have lost its reply. Never undo an unknown charge or
  // replace a completed answer; retry reads the authoritative stored result.
  await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=?').bind(JSON.stringify({...pending,state:'failed'}),key,JSON.stringify(pending)).run();
  return reply({error:'save_failed'},503);
 }
}
