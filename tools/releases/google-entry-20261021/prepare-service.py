from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent;source=H/'nobilog-board/src/index.js';original=source.read_text();s=original
def once(a,b):
 global s
 assert s.count(a)==1,a[:80];s=s.replace(a,b,1)
s="import {googleStatus,unlinkGoogle,claimGoogleLink} from './google-account.mjs';\n"+s
once('    let resetApplies = (String(key).startsWith("identity:google:") || String(key).startsWith("legacy:")) && value === "u1";', '    let resetUid = (String(key).startsWith("identity:google:") || String(key).startsWith("legacy:")) && ["u1","u2","u4"].includes(value) ? value : null;')
once('        resetApplies = prior.uid === "u1" && prior.provider === "google";', '        resetUid = ["u1","u2","u4"].includes(prior.uid) && prior.provider === "google" ? prior.uid : null;')
once('    if (resetApplies) {','    if (resetUid) {')
once('.bind("google-reset:u1").first();','.bind("google-reset:"+resetUid).first();')
once('  const record = { provider: "google", mode: "session-link", uid: session.uid, owner, nonce, back: safeReturn(body.return, env) };','  const generation = await authGet(env,"google-link-version:"+session.uid) || "";\n  const record = { provider: "google", mode: "session-link", uid: session.uid, owner, nonce, generation, back: safeReturn(body.return, env) };')
a='const saved = await env.AUTH_DB.prepare("INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0 WHERE auth_kv.v=excluded.v OR auth_kv.v=\'\' RETURNING v").bind(key, record.uid, "active-session:" + record.uid, record.owner).first();'
b='const saved = await env.AUTH_DB.prepare("INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) AND COALESCE((SELECT v FROM auth_kv WHERE k=?),\'\')=? ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0 WHERE auth_kv.v=excluded.v OR auth_kv.v=\'\' RETURNING v").bind(key, record.uid, "active-session:" + record.uid, record.owner,Date.now(),"google-link-version:"+record.uid,record.generation||"").first();'
once(a,b)
verified='''async function verifiedGoogleStart(request,env,session) {
  if(!["u1","u2","u4"].includes(session.uid))return unauthorized();
  if(!env.AUTH_DB||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return serviceUnavailable();
  let body;try{body=await requestJson(request,4096);}catch(error){return invalidBody(error);}
  if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(k=>!["ticket","return"].includes(k))||(body.return!==undefined&&typeof body.return!=="string"))return json({error:"bad body"},400);
  const state=randomToken(24),nonce=randomToken(24),owner=await opaqueKey(session.token),generation=await authGet(env,"google-link-version:"+session.uid)||"";
  const record={provider:"google",mode:"session-link",uid:session.uid,owner,nonce,generation,back:safeReturn(body.return,env)};
  const claimed=await claimGoogleLink(env.AUTH_DB,session,{ticket:body.ticket,ownerHash:owner,state,record});
  if(claimed.status!==200)return json({error:claimed.error},claimed.status);
  const target=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  Object.entries({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:callbackUrl(request,"google"),response_type:"code",scope:"openid profile email",state,nonce,prompt:"select_account"}).forEach(([k,v])=>target.searchParams.set(k,v));
  return json({url:target.href});
}
'''
once('async function sessionGoogleStart(request, env, session) {',verified+'async function sessionGoogleStart(request, env, session) {')
once('session.provider === "google" || await googleLinked(env, session.uid)','await googleLinked(env, session.uid)')
route='''      if(path === "/auth/google/link" && request.method === "POST")return await verifiedGoogleStart(request,env,session);
      if(path === "/auth/google" && request.method === "GET") {
        const result=await googleStatus(env.AUTH_DB,session);const {status,...body}=result;return json(body,status);
      }
      if(path === "/auth/google/unlink" && request.method === "POST") {
        let body;try{body=await requestJson(request,4096);}catch(error){return invalidBody(error);}
        if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(k=>k!=="ticket"))return json({error:"bad body"},400);
        const result=await unlinkGoogle(env.AUTH_DB,session,{ticket:body.ticket,ownerHash:await opaqueKey(session.token),operationId:randomToken(24)});
        const {status,...output}=result;return json(output,status);
      }
'''
once('      if (path === "/auth/link/google")',route+'      if (path === "/auth/link/google")')
out=H/'candidate/cf-worker/src';out.mkdir(parents=True,exist_ok=True);(out/'index.js').write_text(s);(out/'google-account.mjs').write_bytes((H/'google-account.mjs').read_bytes())
base=H/'baseline/cf-worker/src';base.mkdir(parents=True,exist_ok=True);(base/'index.js').write_text(original)
(H/'service-candidate.json').write_text(json.dumps({'status':'prepared; integration unverified; not published','baselineSha256':hashlib.sha256(original.encode()).hexdigest(),'candidateSha256':hashlib.sha256(s.encode()).hexdigest(),'currentPublicWorkerDownloaded':True,'accountDataRead':False},indent=2)+'\n')
print('Prepared settings service against current published Worker; not deployed')
