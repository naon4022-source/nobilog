async function googleLinked(env,uid) {
  if(!env.AUTH_DB)throw Error('authentication unavailable');
  const row=await env.AUTH_DB.prepare("SELECT 1 AS linked FROM auth_kv WHERE k>=? AND k<? AND v=? AND (expires_at=0 OR expires_at>?) LIMIT 1").bind('identity:google:','identity:google:\uFFFF',uid,Date.now()).first();
  return !!row;
}
async function sessionGoogleStart(request,env,session) {
  if(request.method!=='POST')return json({error:'method not allowed'},405);
  if(session.provider!=='pin'||!['u1','u2','u4'].includes(session.uid))return unauthorized();
  if(!env.AUTH_DB||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return serviceUnavailable();
  let body;try{body=await requestJson(request,4096);}catch(error){return invalidBody(error);}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='return')||(body.return!==undefined&&(typeof body.return!=='string'||body.return.length>2048)))return json({error:'bad body'},400);
  if(await googleLinked(env,session.uid))return json({alreadyLinked:true});
  const state=randomToken(24),nonce=randomToken(24),owner=await opaqueKey(session.token);
  const record={provider:'google',mode:'session-link',uid:session.uid,owner,nonce,back:safeReturn(body.return,env)};
  await authPut(env,'oauth:'+state,JSON.stringify(record),{expirationTtl:600});
  const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  Object.entries({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:callbackUrl(request,'google'),response_type:'code',scope:'openid profile email',state,nonce,prompt:'select_account'}).forEach(([key,value])=>target.searchParams.set(key,value));
  return json({url:target.href});
}
async function sessionGoogleCallback(request,env,state,data) {
  if(!env.AUTH_DB)return serviceUnavailable();
  const taken=await env.AUTH_DB.prepare('DELETE FROM auth_kv WHERE k=? AND expires_at>? RETURNING v').bind('oauth:'+state,Date.now()).first();
  if(!taken)return json({error:'invalid oauth callback'},400);
  let record;try{record=JSON.parse(taken.v);}catch{return json({error:'invalid oauth callback'},400);}
  if(record.mode!=='session-link'||record.provider!=='google')return json({error:'invalid oauth callback'},400);
  const back=safeReturn(record.back,env);
  if(data.get('error')||!data.get('code'))return Response.redirect(back+'#google_link_error=cancelled',302);
  try{
    const active=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('active-session:'+record.uid).first();
    if(!active||!constantEqual(active.v,record.owner))return Response.redirect(back+'#google_link_error=session_changed',302);
    const claims=await oauthClaims('google',data.get('code'),request,env,record.nonce),key='identity:google:'+claims.sub;
    const existing=await authGet(env,key);
    if(existing&&existing!==record.uid)return Response.redirect(back+'#google_link_error=linked_elsewhere',302);
    const saved=await env.AUTH_DB.prepare("INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0 WHERE auth_kv.v=excluded.v OR auth_kv.v='' RETURNING v").bind(key,record.uid,'active-session:'+record.uid,record.owner).first();
    if(!saved)return Response.redirect(back+'#google_link_error=failed',302);
    return Response.redirect(back+'#google_link=ok',302);
  }catch{return Response.redirect(back+'#google_link_error=failed',302);}
}
