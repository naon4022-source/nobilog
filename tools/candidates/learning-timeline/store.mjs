// 本人別サーバー保存の候補。実Workerには未接続。catalogはサーバーの教材台帳。
import validation from './validate.cjs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ACTIVE='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
export async function route(request,env,session,{owner,catalog,now=Date.now(),limits={perMinute:20,capacity:100000}}){
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(!env.AUTH_DB)return json({error:'unavailable'},503);
 if(!session?.uid||typeof owner!=='string'||!owner)return json({error:'unauthorized'},401);
 const db=env.AUTH_DB,url=new URL(request.url),guard=['active-session:'+session.uid,owner,now];
 const prefix='learning-time:'+session.uid+':',starts='learning-time-start:'+session.uid+':';
 try{
  if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard).first('v'))return json({error:'active_session'},409);
  if(request.method==='GET'&&url.pathname==='/learning-time'){
   const cursor=url.searchParams.get('cursor')||'';
   if([...url.searchParams.keys()].some(k=>k!=='cursor')||url.searchParams.getAll('cursor').length>1||(cursor&&!UUID.test(cursor)))return json({error:'bad query'},400);
   const rows=(await db.prepare('SELECT k,v FROM auth_kv WHERE k>? AND k<? AND '+ACTIVE+' ORDER BY k LIMIT 201').bind(prefix+cursor,prefix+'\uffff',...guard).all()).results||[];
   const items=rows.slice(0,200).map(row=>JSON.parse(row.v));
   if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard).first('v'))return json({error:'active_session'},409);
   return json({items,next:rows.length>200?items.at(-1).id:null,serverTime:now});
  }
  if(request.method!=='POST'||!['/learning-time','/learning-time-start'].includes(url.pathname))return json({error:'method not allowed'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'origin'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'content type'},415);
  if(url.search)return json({error:'bad query'},400);
  const reader=request.body?.getReader();if(!reader)return json({error:'bad body'},400);
  let raw='',size=0;const decoder=new TextDecoder();
  try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();return json({error:'body too large'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}
  let body;try{body=JSON.parse(raw);}catch(_){return json({error:'bad body'},400);}
  if(!body||Array.isArray(body)||!UUID.test(body.id||''))return json({error:'bad body'},400);
  if(url.pathname==='/learning-time-start'){
   if(Object.keys(body).length!==1)return json({error:'bad body'},400);
   const key=starts+body.id;
   const previous=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+ACTIVE).bind(key,...guard).first('v');
   if(previous)return json({session:JSON.parse(previous),serverTime:now});
   const quota='learning-time-start-budget:'+session.uid+':'+Math.floor((now+32400000)/86400000),nonce=crypto.randomUUID(),missing='NOT EXISTS (SELECT 1 FROM auth_kv WHERE k=?)';
   await db.batch([
    db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE '+ACTIVE+' AND '+missing+' ON CONFLICT(k) DO UPDATE SET v=json_object(\'n\',CAST(json_extract(auth_kv.v,\'$.n\') AS INTEGER)+1,\'nonce\',?) WHERE CAST(json_extract(auth_kv.v,\'$.n\') AS INTEGER)<96 AND '+missing)
     .bind(quota,JSON.stringify({n:1,nonce}),now+2*86400000,...guard,key,nonce,key),
    db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE '+ACTIVE+' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,\'$.nonce\')=?) ON CONFLICT(k) DO NOTHING')
     .bind(key,JSON.stringify({id:body.id,startedAt:now}),now+7*86400000,...guard,quota,nonce)
   ]);
   const saved=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+ACTIVE).bind(key,...guard).first('v');
   if(saved)return json({session:JSON.parse(saved),serverTime:now});
   if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard).first('v'))return json({error:'active_session'},409);
   return json({error:'time_start_limit'},429);
  }
  if(Object.keys(body).sort().join(',')!=='id,sessionId,spans'||!UUID.test(body.sessionId||'')||!Array.isArray(body.spans)||body.spans.length<1||body.spans.length>60)return json({error:'bad body'},400);
  if(body.spans.some(span=>!span||Object.keys(span).sort().join(',')!=='activity,endOffset,startOffset'))return json({error:'bad interval'},400);
  const content=JSON.stringify({sessionId:body.sessionId,spans:body.spans.map(s=>({activity:s.activity,startOffset:s.startOffset,endOffset:s.endOffset}))}),key=prefix+body.id;
  const previous=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+ACTIVE).bind(key,...guard).first('v');
  if(previous){const stored=JSON.parse(previous);return stored.content===content?json({id:body.id,acceptedAt:stored.acceptedAt,serverTime:now}):json({error:'conflict'},409);}
  const savedStart=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+ACTIVE).bind(starts+body.sessionId,...guard).first('v');
  if(!savedStart)return json({error:'unknown session'},409);
  let spans;try{spans=body.spans.map(span=>{
   if(!span||Object.keys(span).sort().join(',')!=='activity,endOffset,startOffset')throw Error('bad span');
   return validation.validate({...span,id:body.id,sessionId:body.sessionId},{session:JSON.parse(savedStart),catalog,now});
  });}catch(_){return json({error:'bad interval'},400);}
  const record={id:body.id,content,spans:spans.map((s,i)=>({...s,id:body.id+':'+i})),acceptedAt:now};
  if(!Number.isSafeInteger(limits.perMinute)||limits.perMinute<1||!Number.isSafeInteger(limits.capacity)||limits.capacity<1)throw Error('bad limits');
  // 予約と保存を同じ取引で行う。再送・失敗・別使用権で回数や容量を増やさない。
  const quota='learning-time-budget:'+session.uid+':'+Math.floor(now/60000),nonce=crypto.randomUUID();
  const missing='NOT EXISTS (SELECT 1 FROM auth_kv WHERE k=?)',space='(SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<?';
  await db.batch([
   db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE '+ACTIVE+' AND '+missing+' AND '+space+' ON CONFLICT(k) DO UPDATE SET v=json_object(\'n\',CAST(json_extract(auth_kv.v,\'$.n\') AS INTEGER)+1,\'nonce\',?) WHERE CAST(json_extract(auth_kv.v,\'$.n\') AS INTEGER)<? AND '+missing+' AND '+space)
    .bind(quota,JSON.stringify({n:1,nonce}),now+86400000,...guard,key,prefix,prefix+'\uffff',limits.capacity,nonce,limits.perMinute,key,prefix,prefix+'\uffff',limits.capacity),
   db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+ACTIVE+' AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,\'$.nonce\')=?) ON CONFLICT(k) DO NOTHING')
    .bind(key,JSON.stringify(record),...guard,quota,nonce)
  ]);
  const saved=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND '+ACTIVE).bind(key,...guard).first('v');
  if(!saved){if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard).first('v'))return json({error:'active_session'},409);return json({error:'time_save_limit'},429);}
  const stored=JSON.parse(saved);return stored.content===content?json({id:body.id,acceptedAt:stored.acceptedAt,serverTime:now}):json({error:'conflict'},409);
 }catch(_){return json({error:'unavailable'},503);}
}
