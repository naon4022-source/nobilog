/* =========================================================
   のびログ 同期サーバー（Cloudflare Workers 用）
   ・/       … ⚔️対戦ボード（GET=取得 / POST=良い記録だけ保存）
   ・/chat   … 💬 DM（なお ⇄ りらん の1対1チャット）
   ・/news   … 📰 ニュースの「たね」（毎日 朝7時・昼12時・夕方18時 日本時間に新しくなる）
   ・/tests  … 📝 オンラインテスト（なおが出したテスト）
   ・/answers… 📝 提出された解答
   ・/save   … 💾 きろくのクラウド保存（端末が変わっても同じ記録）
   これを Cloudflare の Worker にまるごと貼りつけて Deploy する。
   ・KV（データ置き場）を BOARD という名前でひもづける
   ・OAuthのクライアント情報とPINの署名検証値は Worker secrets に保存する
   ・cron（wrangler.toml の [triggers]）は UTC。22:00/03:00/09:00 = 日本の 7時/12時/18時
   ========================================================= */

// ブラウザからは本番アプリとローカル開発だけを許可（originAllowedでも必ず検査する）
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function unauthorized() {
  return json({ error: "unauthorized" }, 401);
}
function scopedApiResponse(response,env){
  const headers=new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',env.APP_ORIGIN||'https://nobilog.pages.dev');
  headers.set('Vary','Origin');
  return new Response(response.body,{status:response.status,headers});
}
function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const app = String(env.APP_ORIGIN || "https://nobilog.pages.dev").replace(/\/$/, "");
  return origin === app || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

const enc = new TextEncoder();
function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return b64url(a);
}
function randomSixDigitCode() {
  const range = 900000;
  const limit = Math.floor(0x100000000 / range) * range;
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= limit);
  return String(100000 + (a[0] % range));
}
async function opaqueKey(value) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(String(value))));
}
async function keyedDigest(value, secret) {
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", enc.encode(String(secret)), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(String(value))));
}
function constantEqual(a, b) {
  const x = enc.encode(String(a || "")), y = enc.encode(String(b || ""));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i % (x.length || 1)] || 0) ^ (y[i % (y.length || 1)] || 0);
  return diff === 0;
}
// 認証はD1へ分離する。無料KVの1日1,000書き込み上限に達してもログインを止めない。
// 既存セッション・既存OAuth連携はBOARDから読み取れるよう後方互換を残す。
async function authGet(env, key) {
  if (env.AUTH_DB) {
    try {
      const row = await env.AUTH_DB.prepare("SELECT v, expires_at FROM auth_kv WHERE k = ?").bind(String(key)).first();
      if (row) return Number(row.expires_at) > 0 && Number(row.expires_at) <= Date.now() ? null : String(row.v);
    } catch (e) { /* 移行直後などは旧KVを読む */ }
  }
  try { return await env.BOARD.get(String(key)); } catch (e) { return null; }
}
async function authPut(env, key, value, options) {
  if (!env.AUTH_DB) return env.BOARD.put(String(key), String(value), options);
  const ttl = Math.max(0, Number(options && options.expirationTtl) || 0);
  const expires = ttl ? Date.now() + ttl * 1000 : 0;
  await env.AUTH_DB.prepare("INSERT INTO auth_kv (k, v, expires_at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, expires_at = excluded.expires_at")
    .bind(String(key), String(value), expires).run();
}
async function authDelete(env, key) {
  // 旧KVの削除が遅れたり失敗しても、無効にした認証が復活しないよう墓標を残す。
  if (env.AUTH_DB) await authPut(env, key, "");
  try { await env.BOARD.delete(String(key)); } catch (e) { /* KV上限でもD1側の無効化は完了 */ }
}

const ACTIVE_LEASE_MS = 180000;
function serviceUnavailable() { return json({error:"temporarily_unavailable"}, 503); }
function activeSessionResponse() { return json({error:"active_session",retryAfter:Math.ceil(ACTIVE_LEASE_MS/1000)}, 409); }
async function requestJson(request, limit) {
  if (Number(request.headers.get("Content-Length")) > limit) throw new RangeError("body too large");
  if (!request.body) throw new SyntaxError("body required");
  const reader = request.body.getReader(), decoder = new TextDecoder("utf-8", {fatal:true});
  let text = "", bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new RangeError("body too large"); }
      text += decoder.decode(chunk.value, {stream:true});
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}
function invalidBody(error) { return json({error:error instanceof RangeError ? "too big" : "bad json"}, error instanceof RangeError ? 413 : 400); }
async function reservePinAttempt(env, key) {
  if (!env.AUTH_DB) throw new Error("authentication store unavailable");
  const now = Date.now(), until = now+900000;
  const row = await env.AUTH_DB.prepare("INSERT INTO auth_kv (k, v, expires_at) VALUES (?, '1', ?) ON CONFLICT(k) DO UPDATE SET v = CAST(CASE WHEN auth_kv.expires_at <= ? THEN 1 ELSE CAST(auth_kv.v AS INTEGER) + 1 END AS TEXT), expires_at = CASE WHEN auth_kv.expires_at <= ? THEN excluded.expires_at ELSE auth_kv.expires_at END WHERE auth_kv.expires_at <= ? OR CAST(auth_kv.v AS INTEGER) < 5 RETURNING v")
    .bind(key,until,now,now,now).first();
  return !!row;
}
// D1の1つの条件付き更新で先着1台だけに使用権を渡す。KVにはフォールバックしない。
async function claimActiveSession(env, uid, token) {
  if (!env.AUTH_DB) throw new Error("session store unavailable");
  const owner = await opaqueKey(token), now = Date.now();
  const row = await env.AUTH_DB.prepare("INSERT INTO auth_kv (k, v, expires_at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, expires_at = excluded.expires_at WHERE auth_kv.expires_at <= ? OR auth_kv.v = excluded.v RETURNING v")
    .bind("active-session:"+uid, owner, now+ACTIVE_LEASE_MS, now).first();
  return !!row && row.v === owner;
}
async function releaseActiveSession(env, uid, token) {
  if (!env.AUTH_DB) throw new Error("session store unavailable");
  await env.AUTH_DB.prepare("DELETE FROM auth_kv WHERE k = ? AND v = ?")
    .bind("active-session:"+uid, await opaqueKey(token)).run();
}
async function issueSession(env, uid, name, provider) {
  const token = randomToken(32);
  if (!(await claimActiveSession(env, uid, token))) return null;
  try {
    await authPut(env, "session:"+token, JSON.stringify({uid,name,provider}), {expirationTtl:604800});
    return token;
  } catch (e) {
    await releaseActiveSession(env, uid, token);
    throw e;
  }
}

function cloudSavePrefix(uid) { return "cloud-save:"+uid; }
function cloudKeysEqual(a, b) {
  return !!a && !!b && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]);
}
// 本体を小さな行に分ける。1回の取得で世代と全行を読み、途中の保存は見せない。
async function cloudSnapshotGet(env, uid) {
  if (!env.AUTH_DB) throw new Error("save store unavailable");
  const key = cloudSavePrefix(uid), prefix = key+":";
  const result = await env.AUTH_DB.prepare("SELECT k, v FROM auth_kv WHERE k = ? OR (k >= ? AND k < ?)")
    .bind(key, prefix, prefix+"\uffff").all();
  const rows = result.results || [], row = rows.find(r => r.k === key);
  // D1に一度も保存していない利用者だけ、既存のKVを読み取る。
  if (!row) {
    const raw = await env.BOARD.get("save:"+uid);
    if (!raw) return null;
    return JSON.parse(raw);
  }
  const manifest = JSON.parse(row.v);
  if (!Number.isSafeInteger(manifest.parts) || manifest.parts < 1 || manifest.parts > 40) throw new Error("invalid save manifest");
  const parts = new Map(rows.map(r => [r.k, r.v]));
  let raw = "";
  for (let i=0; i<manifest.parts; i++) {
    const part = parts.get(prefix+String(i).padStart(3,"0"));
    if (typeof part !== "string") throw new Error("incomplete save");
    raw += part;
  }
  const rec = JSON.parse(raw);
  if (rec.v !== manifest.v || !rec.keys || typeof rec.keys !== "object") throw new Error("invalid save");
  return rec;
}
async function cloudSnapshotPut(env, session, body) {
  const uid = session.uid, v = Number(body.v);
  if (!Number.isSafeInteger(v) || v < 1) return json({error:"bad version"},400);
  if (!body.keys || typeof body.keys !== "object" || Array.isArray(body.keys) || Object.keys(body.keys).some(k => !k.startsWith(uid+":") || typeof body.keys[k] !== "string")) return json({error:"bad body"},400);
  const current = await cloudSnapshotGet(env, uid);
  if (current && Number(current.v) >= v) {
    const same = Number(current.v) === v && cloudKeysEqual(current.keys, body.keys);
    return json(same ? {ok:true,v} : {ok:false,stale:true,v:Number(current.v)});
  }
  const at = Date.now(), raw = JSON.stringify({v,at,keys:body.keys}), bytes = enc.encode(raw);
  if (bytes.byteLength > 20000000) return json({error:"too big"},413);
  const parts = [], decoder = new TextDecoder();
  for (let i=0;i<bytes.length;i+=600000) parts.push(decoder.decode(bytes.subarray(i,i+600000),{stream:i+600000<bytes.length}));
  const key = cloudSavePrefix(uid), prefix = key+":", owner = await opaqueKey(session.token);
  const guard = "(NOT EXISTS (SELECT 1 FROM auth_kv WHERE k = ?) OR (SELECT CAST(json_extract(v, '$.v') AS INTEGER) FROM auth_kv WHERE k = ?) < ?) AND EXISTS (SELECT 1 FROM auth_kv WHERE k = ? AND v = ? AND expires_at > ?)";
  const guardValues = [key,key,v,"active-session:"+uid,owner,at];
  const put = (k,value) => env.AUTH_DB.prepare("INSERT INTO auth_kv (k, v, expires_at) SELECT ?, ?, 0 WHERE "+guard+" ON CONFLICT(k) DO UPDATE SET v = excluded.v, expires_at = 0")
    .bind(k,value,...guardValues);
  const statements = parts.map((part,i) => put(prefix+String(i).padStart(3,"0"),part));
  statements.push(env.AUTH_DB.prepare("DELETE FROM auth_kv WHERE k >= ? AND k < ? AND "+guard)
    .bind(prefix+String(parts.length).padStart(3,"0"),prefix+"\uffff",...guardValues));
  statements.push(put(key,JSON.stringify({v,at,parts:parts.length})));
  // batchは1取引。失敗・競合なら世代も本体もまとめて変更しない。
  const results = await env.AUTH_DB.batch(statements);
  if (Number(results[results.length-1]?.meta?.changes) === 1) return json({ok:true,v});
  const latest = await cloudSnapshotGet(env, uid);
  if (latest && latest.v === v && cloudKeysEqual(latest.keys, body.keys)) return json({ok:true,v});
  return json({ok:false,stale:true,v:Number(latest && latest.v)||0});
}
async function verifyTurnstile(request, env, token, expectedAction) {
  token = String(token || "");
  if (!env.TURNSTILE_SECRET || token.length < 20 || token.length > 2048) return false;
  const usedKey = "turnstile-used:" + await opaqueKey(token);
  if (await authGet(env, usedKey)) return false;
  const form = new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:request.headers.get("CF-Connecting-IP") || ""});
  let result;
  try {
    const options = {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form};
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) options.signal = AbortSignal.timeout(10000);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", options);
    if (!response.ok) return false;
    result = await response.json();
  } catch (e) { return false; }
  let hostname = "";
  try { hostname = new URL(env.APP_ORIGIN || "https://nobilog.pages.dev").hostname; } catch (e) {}
  const when = Date.parse(result && result.challenge_ts);
  if (!result || result.success !== true || result.action !== expectedAction || result.hostname !== hostname || !Number.isFinite(when) || Math.abs(Date.now()-when) > 300000) return false;
  await authPut(env, usedKey,"1",{expirationTtl:600});
  return true;
}
function safeReturn(value, env) {
  const fallback = (env.APP_ORIGIN || "https://nobilog.pages.dev").replace(/\/$/, "");
  try {
    const u = new URL(value || fallback);
    const allowed = new URL(fallback);
    if (u.origin === allowed.origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(u.origin)) return u.origin + u.pathname;
  } catch (e) {}
  return fallback + "/";
}
function callbackUrl(request, provider) {
  return new URL(request.url).origin + "/auth/callback/" + provider;
}
async function readSession(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token.length > 256 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const raw = await authGet(env, "session:" + token);
    const session = raw ? JSON.parse(raw) : null;
    return session && session.uid ? { ...session, token } : null;
  } catch (e) { return null; }
}
async function oauthStart(request, env) {
  const u = new URL(request.url);
  const provider = u.searchParams.get("provider");
  const mode = u.searchParams.get("mode") || "login";
  if (!["google", "line"].includes(provider) || !["login", "create", "link"].includes(mode)) return json({ error:"bad request" }, 400);
  const ticket = u.searchParams.get("ticket") || "";
  if (mode === "link" && !(await authGet(env, "legacy:" + ticket))) return json({ error:"link ticket expired" }, 400);
  const state = randomToken(24), nonce = randomToken(24);
  const rec = { provider, mode, ticket, nonce, back:safeReturn(u.searchParams.get("return"), env) };
  await authPut(env, "oauth:" + state, JSON.stringify(rec), { expirationTtl:600 });
  const redirect = callbackUrl(request, provider);
  let target;
  if (provider === "google") {
    target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    Object.entries({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:redirect,response_type:"code",scope:"openid profile email",state,nonce,prompt:"select_account"}).forEach(([k,v])=>target.searchParams.set(k,v||""));
  } else if (provider === "line") {
    target = new URL("https://access.line.me/oauth2/v2.1/authorize");
    Object.entries({client_id:env.LINE_CLIENT_ID,redirect_uri:redirect,response_type:"code",scope:"openid profile",state,nonce}).forEach(([k,v])=>target.searchParams.set(k,v||""));
  }
  return Response.redirect(target.toString(), 302);
}
async function oauthClaims(provider, code, request, env, nonce) {
  const redirect = callbackUrl(request, provider);
  if (provider === "google") {
    const form = new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirect,grant_type:"authorization_code"});
    const tok = await fetch("https://oauth2.googleapis.com/token", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form}).then(r=>r.json());
    if (!tok.access_token) throw new Error("google token failed");
    const p = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {headers:{Authorization:"Bearer "+tok.access_token}}).then(r=>r.json());
    if (!p.sub) throw new Error("google profile failed");
    return {sub:p.sub,name:p.name||"Googleユーザー",email:p.email||""};
  }
  if (provider === "line") {
    const form = new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:redirect,client_id:env.LINE_CLIENT_ID,client_secret:env.LINE_CLIENT_SECRET});
    const tok = await fetch("https://api.line.me/oauth2/v2.1/token", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form}).then(r=>r.json());
    if (!tok.id_token) throw new Error("line token failed");
    const verify = new URLSearchParams({id_token:tok.id_token,client_id:env.LINE_CLIENT_ID,nonce});
    const p = await fetch("https://api.line.me/oauth2/v2.1/verify", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:verify}).then(r=>r.json());
    if (!p.sub) throw new Error("line profile failed");
    return {sub:p.sub,name:p.name||"LINEユーザー",email:p.email||""};
  }
  throw new Error("unsupported provider");
}
// Only the OAuth callback form body. Ordinary large learning saves are separate.
function oauthBodyError(status){const error=new Error('invalid_oauth_body');error.oauthBodyStatus=status;return error;}
async function readBoundedOAuthForm(request,{limit=16384,timeoutMs=10000}={}){
 if(!Number.isSafeInteger(limit)||limit<1||limit>1048576||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw oauthBodyError(500);
 const discard=()=>{if(request.body&&!request.body.locked)void request.body.cancel().catch(()=>{});};
 const type=(request.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
 if(type!=='application/x-www-form-urlencoded'){discard();throw oauthBodyError(415);}
 const declared=request.headers.get('Content-Length');
 if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared)))){discard();throw oauthBodyError(400);}
 if(declared!==null&&Number(declared)>limit){discard();throw oauthBodyError(413);}
 if(!request.body)throw oauthBodyError(400);
 const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
 let timer;
 const cancel=()=>{void reader.cancel().catch(()=>{});};
 try{
  const read=async()=>{
   let bytes=0,text='';
   while(true){
    const part=await reader.read();if(part.done)break;
    if(!(part.value instanceof Uint8Array))throw oauthBodyError(400);
    bytes+=part.value.byteLength;
    if(bytes>limit){cancel();throw oauthBodyError(413);}
    try{text+=decoder.decode(part.value,{stream:true});}catch(_){cancel();throw oauthBodyError(400);}
   }
   try{return text+decoder.decode();}catch(_){throw oauthBodyError(400);}
  };
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(oauthBodyError(408));cancel();},timeoutMs);});
  const text=await Promise.race([read(),deadline]);
  const form=new URLSearchParams(text);
  if(['state','code'].some(key=>form.getAll(key).length>1))throw oauthBodyError(400);
  return form;
 }finally{
  clearTimeout(timer);
  try{reader.releaseLock();}catch(_){}
 }
}

async function oauthCallback(request, env, provider) {
  let data;
  try {
    data = request.method === "POST" ? await readBoundedOAuthForm(request) : new URL(request.url).searchParams;
  } catch (error) {
    return json({error:"invalid oauth body"}, [400,408,413,415].includes(error.oauthBodyStatus) ? error.oauthBodyStatus : 400);
  }
  const state = data.get("state") || "", code = data.get("code") || "";
  let rec = null;
  try { rec = JSON.parse((await authGet(env, "oauth:" + state)) || "null"); } catch (e) {}
  if (!rec || rec.provider !== provider || !code) return json({error:"invalid oauth callback"},400);
  await authDelete(env, "oauth:" + state);
  try {
    const p = await oauthClaims(provider, code, request, env, rec.nonce);
    const ikey = "identity:" + provider + ":" + p.sub;
    let uid = await authGet(env, ikey);
    if (rec.mode === "link") {
      const legacy = await authGet(env, "legacy:" + rec.ticket);
      if (!legacy) throw new Error("連携の有効時間が切れました");
      if (uid && uid !== legacy) throw new Error("このアカウントは別の利用者と連携済みです");
      uid = legacy; await authPut(env, ikey, uid); await authDelete(env, "legacy:" + rec.ticket);
    } else if (rec.mode === "login" && !uid) {
      throw new Error("アカウントがありません。アカウント作成から進んでください");
    } else if (!uid) {
      uid = "x_" + randomToken(15).replace(/[-_]/g, ""); await authPut(env, ikey, uid);
    }
    const knownName = uid === "u1" ? "なお" : uid === "u2" ? "りらん" : p.name;
    const user = {id:uid,name:knownName,provider};
    await authPut(env, "user:" + uid, JSON.stringify(user));
    const session = await issueSession(env, uid, knownName, provider);
    if (!session) return Response.redirect(rec.back + "#auth_error=" + encodeURIComponent("ほかの端末で使用中です。そちらでログアウトするか、画面を閉じて3分後にもう一度試してください。"),302);
    // fragmentはPages/CDN/アクセスログへ送信されないため、セッションをURLログから守れる。
    return Response.redirect(rec.back + "#auth=" + encodeURIComponent(session), 302);
  } catch (e) {
    const safeMessage = /^(アカウントがありません|連携の有効時間が切れました|このアカウントは別の利用者と連携済みです)/.test(String(e && e.message)) ? e.message : "ログインできませんでした。少し待ってからもう一度試してください。";
    return Response.redirect(rec.back + "#auth_error=" + encodeURIComponent(safeMessage), 302);
  }
}
async function legacyStart(request, env) {
  if (!env.PIN_PEPPER || !env.LEGACY_NAO_PIN_HASH || !env.LEGACY_RIRAN_PIN_HASH) return serviceUnavailable();
  let b; try { b = await requestJson(request, 8192); } catch (e) { return invalidBody(e); }
  if (!(await verifyTurnstile(request, env, b && b.turnstile, "legacy_login"))) return json({error:"本人確認に失敗しました。もう一度やり直してね"},403);
  const pin = String((b&&b.pin)||"");
  const ipKey = await opaqueKey(request.headers.get("CF-Connecting-IP") || "unknown");
  const failKey = "legacy-fail:"+ipKey;
  if (!(await reservePinAttempt(env, failKey))) return json({error:"まちがいが多すぎます。15分待ってね"},429);
  // PIN原文はCloudflareにも保存しない。秘密のpepperで署名した検証値だけを照合する。
  const verifier = await keyedDigest(pin, env.PIN_PEPPER);
  const uid = constantEqual(verifier, env.LEGACY_NAO_PIN_HASH) ? "u1" : constantEqual(verifier, env.LEGACY_RIRAN_PIN_HASH) ? "u2" : "";
  if (!uid) {
    return json({error:"パスコードがちがうよ"},401);
  }
  await authDelete(env, failKey);
  const ticket = randomToken(24);
  await authPut(env, "legacy:"+ticket, uid, {expirationTtl:600});
  return json({ticket,name:uid==="u1"?"なお":"りらん"});
}
async function legacyLogin(request, env) {
  let b; try { b = await requestJson(request, 8192); } catch (e) { return invalidBody(e); }
  const ticket = String((b&&b.ticket)||"");
  const uid = ticket ? await authGet(env, "legacy:"+ticket) : "";
  if (!uid) return json({error:"確認の有効時間が切れました。もう一度パスコードを入れてね"},400);
  await authDelete(env, "legacy:"+ticket);
  const name = uid === "u1" ? "なお" : "りらん";
  const session = await issueSession(env, uid, name, "pin");
  if (!session) return activeSessionResponse();
  await authPut(env, "user:"+uid,JSON.stringify({id:uid,name,provider:"pin"}));
  return json({session,user:{id:uid,name,provider:"pin"}});
}

/* ---------------- 📰 ニュース ----------------
   サーバーが作るのは「たね（seed）」だけ。
   ニュースの文そのものはアプリの中にあるので、
   ・オンライン → サーバーのたねで、その回だけの本当にランダムなニュース（2人とも同じものが読める）
   ・オフライン → 日付と時間帯から決まるニュース
   どちらでも必ず読めるようになっている。 */

// 日本時間で「何日の・どの時間帯か」を出す（0=朝刊7時 / 1=昼版12時 / 2=夕刊18時）
function slotInfoJST(now) {
  const d = new Date((now || Date.now()) + 9 * 3600 * 1000); // UTC+9 にずらして getUTC* で読む
  let y = d.getUTCFullYear(), mo = d.getUTCMonth(), da = d.getUTCDate();
  const h = d.getUTCHours();
  let slot;
  if (h < 7) {
    const p = new Date(Date.UTC(y, mo, da - 1)); // 朝7時前はまだ「前の日の夕刊」
    y = p.getUTCFullYear(); mo = p.getUTCMonth(); da = p.getUTCDate();
    slot = 2;
  } else if (h < 12) slot = 0;
  else if (h < 18) slot = 1;
  else slot = 2;
  return { day: `${y}-${mo + 1}-${da}`, slot };
}

function newSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

async function loadNews(env) {
  try {
    const raw = await env.BOARD.get("news");
    const d = raw ? JSON.parse(raw) : null;
    if (d && typeof d === "object") {
      return { current: d.current || null, history: Array.isArray(d.history) ? d.history : [] };
    }
  } catch (e) { /* 壊れていたら作りなおす */ }
  return { current: null, history: [] };
}

// いまの時間帯のたねを用意する。すでにその回のたねがあれば作りなおさない
async function publishNews(env) {
  const info = slotInfoJST();
  const data = await loadNews(env);
  if (data.current && data.current.day === info.day && data.current.slot === info.slot) return data;
  const rec = { day: info.day, slot: info.slot, seed: newSeed(), at: Date.now() };
  // 過去100回ぶん（＝約33日）のたねを残す。株価は直近90回のたねから計算するので、
  // これだけ残しておけば、あとから来た人も同じ株価を計算できる（2人の相場がずれない）
  const history = [].concat(data.current ? [data.current] : [], data.history).slice(0, 100);
  const next = { current: rec, history };
  await env.BOARD.put("news", JSON.stringify(next));
  return next;
}

/* ---------------- ⚔️ 対戦ボード ---------------- */
// 点数が小さいほど良いゲーム（秒・ミリ秒・秒差）
const LOWER_IS_BETTER = { kuku: true, reaction: true, stopClock: true };

async function boardGet(env) {
  const data = (await env.BOARD.get("versusBoard")) || "{}";
  return new Response(data, {
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function boardPost(request, env, sessionUser) {
  let incoming;
  try {
    incoming = await request.json();
  } catch (e) {
    return json({ error: "bad json" }, 400);
  }
  if (!incoming || typeof incoming !== "object") return json({ error: "bad body" }, 400);

  let current = {};
  try {
    current = JSON.parse((await env.BOARD.get("versusBoard")) || "{}");
  } catch (e) {
    current = {};
  }

  // ゲームごと・人ごとに「良い方の記録」を残す
  for (const game of Object.keys(incoming)) {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(game) || ["__proto__","constructor","prototype"].includes(game)) continue;
    const users = incoming[game];
    if (!users || typeof users !== "object") continue;
    current[game] = current[game] || {};
    for (const uid of Object.keys(users)) {
      if (uid !== sessionUser) continue;
      const rec = users[uid];
      if (!rec || typeof rec.score !== "number" || !isFinite(rec.score)) continue;
      const now = current[game][uid];
      const lower = !!LOWER_IS_BETTER[game];
      const live = ["money","salary","credit","jobday","drill","lastLogin"].includes(game);
      const at = Math.min(Date.now(), Math.max(0, Number(rec.at) || 0));
      const better = !now || (live ? at > (Number(now.at) || 0) : (lower ? rec.score < now.score : rec.score > now.score));
      if (better) current[game][uid] = { score: rec.score, at: at || Date.now() };
    }
  }

  await env.BOARD.put("versusBoard", JSON.stringify(current));
  return json(current);
}

// 📝 のびログ定期テストの提出答案と、なおが行う結果公開。
// 答案の比較取得は owner(u1) だけ。りらんは自分や相手の答案をAPIから読み戻せない。
const EXAM_RELEASE_AT = {
  "nobi-teiki-01-sugaku": Date.parse("2026-08-30T06:00:00Z"),
  "nobi-teiki-01-eigo": Date.parse("2026-08-30T06:00:00Z"),
  "nobi-teiki-01-kokugo": Date.parse("2026-08-30T06:00:00Z"),
  "nobi-teiki-01-rika": Date.parse("2026-08-31T06:00:00Z"),
  "nobi-teiki-01-shakai": Date.parse("2026-08-31T06:00:00Z"),
};
const examIdOk = (id) => Object.prototype.hasOwnProperty.call(EXAM_RELEASE_AT, id);
async function examReleased(env, id) {
  return examIdOk(id) && (await env.BOARD.get("scheduled-exam-release:" + id)) === "1";
}

const SEPT_BANK = {
  "A": [
    {
      "subject": "社会",
      "questions": [
        {
          "id": "A-0-1",
          "text": "西暦1600年は何世紀か。数字だけ入力しなさい。",
          "answer": "16",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "A-0-2",
          "text": "猿人・原人・新人が現れた順として正しいものを選びなさい。",
          "answer": "猿人 → 原人 → 新人",
          "source": "IMG_3120／古代文明・歴史ワークp4〜5",
          "choices": [
            "猿人 → 原人 → 新人",
            "新人 → 原人 → 猿人",
            "原人 → 猿人 → 新人",
            "猿人 → 新人 → 原人"
          ]
        },
        {
          "id": "A-0-3",
          "text": "アジアの沿岸部で、外国企業を受け入れるため税金などで優遇する地域を何というか。漢字4字で答えなさい。",
          "answer": "経済特区",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "A-0-4",
          "text": "南アジアで夏に海から陸へ吹く季節風が強まると、一般に雨が多くなる。最も適切な理由を選びなさい。",
          "answer": "海上の湿った空気が運ばれるため",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "海上の湿った空気が運ばれるため",
            "陸上の乾いた空気が運ばれるため",
            "太陽が西から昇るため",
            "海水がすべて凍るため"
          ]
        },
        {
          "id": "A-0-5",
          "text": "東南アジアの大農園で、パーム油の原料として栽培される植物を答えなさい。",
          "answer": "アブラヤシ",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "alts": [
            "あぶらやし",
            "油やし",
            "油ヤシ"
          ]
        },
        {
          "id": "A-0-6",
          "text": "ナイル川の流域で発達し、象形文字が使われた古代文明を答えなさい。",
          "answer": "エジプト文明",
          "source": "IMG_3120／古代文明・歴史ワークp4〜5"
        },
        {
          "id": "A-0-7",
          "text": "夏の降水量が少なく冬に雨が多い南ヨーロッパの地域で、気候を生かして栽培される組合せを選びなさい。",
          "answer": "オリーブ・ぶどう",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "稲・天然ゴム",
            "オリーブ・ぶどう",
            "カカオ・バナナ",
            "茶・油やし"
          ]
        },
        {
          "id": "A-0-8",
          "text": "EU域内の多くの国で使われる共通通貨の名称を答えなさい。",
          "answer": "ユーロ",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "A-0-9",
          "text": "ある国の肉類の食料自給率は120％である。この値から直接読み取れることを選びなさい。",
          "answer": "国内消費量を上回る量を国内で生産している",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "肉類を全く輸入していない",
            "国内消費量を上回る量を国内で生産している",
            "国民全員が肉を120g食べる",
            "農家の数が前年より20％増えた"
          ]
        },
        {
          "id": "A-0-10",
          "text": "北ヨーロッパで、氷河が削った谷に海水が入り込んでできた細長い入り江を何というか。",
          "answer": "フィヨルド",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "alts": [
            "フィヨールド"
          ]
        }
      ]
    },
    {
      "subject": "国語",
      "questions": [
        {
          "id": "A-1-1",
          "text": "「静かな／森で／小鳥が／美しく／鳴く。」の主語を、区切った文節の形で書き抜きなさい。",
          "answer": "小鳥が",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "A-1-2",
          "text": "「弟は／新しい／本を／図書館で／借りた。」の述語を書き抜きなさい。句点は不要。",
          "answer": "借りた",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "A-1-3",
          "text": "「白い／雲が／ゆっくり／流れる。」で「白い」が直接修飾する文節を選びなさい。",
          "answer": "雲が",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "白い",
            "雲が",
            "ゆっくり",
            "流れる"
          ]
        },
        {
          "id": "A-1-4",
          "text": "「雨が降った。しかし、試合は続いた。」の「しかし」の働きを選びなさい。",
          "answer": "接続語",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "主語",
            "述語",
            "接続語",
            "独立語"
          ]
        },
        {
          "id": "A-1-5",
          "text": "「ねえ、明日の集合時刻を教えて。」の「ねえ」の文の成分を答えなさい。",
          "answer": "独立語",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "A-1-6",
          "text": "「川岸」の「岸」の部首を、部首名で答えなさい。",
          "answer": "やま",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "alts": [
            "山",
            "やまかんむり"
          ]
        },
        {
          "id": "A-1-7",
          "text": "「森林を保護する」の「保護」の読みをひらがなで書きなさい。",
          "answer": "ほご",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "A-1-8",
          "text": "【独自の説明文】森の落ち葉が分解されると、鉄と結び付く物質ができる。結び付いた鉄は川を通じて海に届き、植物プランクトンに利用される。植物プランクトンは貝などの餌になる。\nこの説明から分かる森と海の関係として最も適切なものを選びなさい。",
          "answer": "森の変化が海の生き物の育ち方に関わる",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "海の生き物は全て落ち葉を直接食べる",
            "森の変化が海の生き物の育ち方に関わる",
            "鉄があれば海の生き物は餌を必要としない",
            "川は森と海を切り離す"
          ]
        },
        {
          "id": "A-1-9",
          "text": "前問の説明文で、鉄を利用し、貝などの餌にもなるものを本文中から書き抜きなさい。",
          "answer": "植物プランクトン",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "A-1-10",
          "text": "【案内】観察会は9時集合。小雨なら実施、大雨なら中止。弁当と筆記用具を持参。\n案内から必ず正しいといえるものを選びなさい。",
          "answer": "小雨の場合も集合時刻は9時である",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "雨が少しでも降れば中止になる",
            "弁当は会場で必ず配られる",
            "大雨でも室内で実施する",
            "小雨の場合も集合時刻は9時である"
          ]
        }
      ]
    },
    {
      "subject": "理科",
      "questions": [
        {
          "id": "A-2-1",
          "text": "クジラとコウモリに共通し、哺乳類に分類する根拠となる特徴を選びなさい。",
          "answer": "子に乳を与えて育てる",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "水中に卵を産む",
            "一生えらで呼吸する",
            "子に乳を与えて育てる",
            "体が羽毛でおおわれる"
          ]
        },
        {
          "id": "A-2-2",
          "text": "カエルの成体は肺のほか、体のどこでも呼吸するか。漢字2字で答えなさい。",
          "answer": "皮膚",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "A-2-3",
          "text": "イカとアサリの内臓をおおう、軟体動物に共通する膜を何というか。",
          "answer": "外とう膜",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "alts": [
            "外套膜",
            "がいとうまく"
          ]
        },
        {
          "id": "A-2-4",
          "text": "エビとバッタに共通するが、イカにはない特徴を選びなさい。",
          "answer": "体やあしに節がある",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "背骨がある",
            "体やあしに節がある",
            "外とう膜がある",
            "羽毛がある"
          ]
        },
        {
          "id": "A-2-5",
          "text": "「銅でできた針金」のうち、材料による区別である「物質」の名称を答えなさい。",
          "answer": "銅",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "A-2-6",
          "text": "砂糖・食塩・デンプンのうち、水にほとんど溶けず、加熱すると焦げて炭になるものを答えなさい。",
          "answer": "デンプン",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "alts": [
            "でんぷん",
            "澱粉"
          ]
        },
        {
          "id": "A-2-7",
          "text": "金属に共通する性質として正しくないものを選びなさい。",
          "answer": "全て磁石に付く",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "電気を通す",
            "磨くと光沢が出る",
            "熱をよく伝える",
            "全て磁石に付く"
          ]
        },
        {
          "id": "A-2-8",
          "text": "水面が35.0cm³のメスシリンダーに固体を完全に沈めると43.0cm³になった。固体の質量は21.6g。密度は何g/cm³か。数値のみ。",
          "answer": "2.7",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "A-2-9",
          "text": "密度2.7g/cm³の金属を、すき間なく10cm³集めた。質量は何gか。数値のみ。",
          "answer": "27",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "A-2-10",
          "text": "密度0.92g/cm³の物体を、密度1.00g/cm³の水に入れた。溶けず、水を吸わないときのようすを選びなさい。",
          "answer": "浮く",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "浮く",
            "必ず底に沈む",
            "必ず水と同じ密度になる",
            "必ず気体になる"
          ]
        }
      ]
    },
    {
      "subject": "英語",
      "questions": [
        {
          "id": "A-3-1",
          "text": "「あなたは音楽が好きですか。」(　) you like music? に入る語を選びなさい。",
          "answer": "Do",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "Are",
            "Is",
            "Do",
            "Am"
          ]
        },
        {
          "id": "A-3-2",
          "text": "「私は理科が得意ではありません。」I (　) not good at science. 空所に1語を入力しなさい。",
          "answer": "am",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-3",
          "text": "「私は日曜日にはテニスをしません。」次の語を全て使って英文を書きなさい。I / do / not / play / tennis / on / Sundays",
          "answer": "I do not play tennis on Sundays.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-4",
          "text": "「これはあなたのかばんですか。」に当たる英文を選びなさい。",
          "answer": "Is this your bag?",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "Do this your bag?",
            "Is this your bag?",
            "Are this your bag?",
            "This is you bag?"
          ]
        },
        {
          "id": "A-3-5",
          "text": "「私は上手に泳げます。」I can (　) well. 空所に「泳ぐ」を表す1語を入力しなさい。",
          "answer": "swim",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-6",
          "text": "Can you play the guitar? に「いいえ、できません」と3語で答えなさい。短縮形を使うこと。",
          "answer": "No, I can't.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-7",
          "text": "「私はネコを2匹飼っています。」I have two (　). 空所に1語を入力しなさい。",
          "answer": "cats",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-8",
          "text": "【英文】I am Miki. I am thirteen. I like soccer, but I cannot play it well. I play the piano every day.\n本文に合う内容を選びなさい。",
          "answer": "ミキはサッカーが好きだが、上手にはできない",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "ミキは毎日サッカーをする",
            "ミキはピアノを弾けない",
            "ミキはサッカーが好きだが、上手にはできない",
            "ミキは12歳である"
          ]
        },
        {
          "id": "A-3-9",
          "text": "前問の英文の it が指すものを、英語1語で書きなさい。",
          "answer": "soccer",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "A-3-10",
          "text": "「私の名前はユイです。」を表すときの正しい語順を選びなさい。",
          "answer": "My name is Yui.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "My is name Yui.",
            "I name is Yui.",
            "My name is Yui.",
            "Name my Yui is."
          ]
        }
      ]
    },
    {
      "subject": "数学",
      "questions": [
        {
          "id": "A-4-1",
          "text": "−8−(−3)×4 を計算しなさい。",
          "answer": "4",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "A-4-2",
          "text": "−3² と (−3)² の値の組として正しいものを選びなさい。",
          "answer": "−9 と 9",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "9 と 9",
            "−9 と −9",
            "−9 と 9",
            "9 と −9"
          ]
        },
        {
          "id": "A-4-3",
          "text": "180を素因数分解すると 2²×3²×□ となる。□に入る素数を答えなさい。",
          "answer": "5",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "A-4-4",
          "text": "3(2x−5)−2(x+4) を計算し、同類項をまとめなさい。",
          "answer": "4x-23",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "A-4-5",
          "text": "5a−{2a−(3−a)} を計算し、同類項をまとめなさい。",
          "answer": "2a+3",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "A-4-6",
          "text": "a=−2のとき、3a²−4a の値を求めなさい。",
          "answer": "20",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "A-4-7",
          "text": "1個a円の品物を3個買い、1000円を出した。おつりを表す式を選びなさい。",
          "answer": "1000−3a",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "3a−1000",
            "1000−3a",
            "1000a−3",
            "(1000−a)×3"
          ]
        },
        {
          "id": "A-4-8",
          "text": "1辺がx cmの正方形の周の長さを表す式を選びなさい。",
          "answer": "4x cm",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "x² cm",
            "2x cm",
            "4x cm",
            "x+4 cm"
          ]
        },
        {
          "id": "A-4-9",
          "text": "(6x−9)÷3−(x−5) を計算し、同類項をまとめなさい。",
          "answer": "x+2",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "A-4-10",
          "text": "時速a kmで30分歩いた道のりを、km単位で表す式を選びなさい。",
          "answer": "a/2 km",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "30a km",
            "2a km",
            "a/30 km",
            "a/2 km"
          ]
        }
      ]
    }
  ],
  "B": [
    {
      "subject": "社会",
      "questions": [
        {
          "id": "B-0-1",
          "text": "西暦1701年は何世紀か。数字だけ入力しなさい。",
          "answer": "18",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "B-0-2",
          "text": "打製石器を主に用いた時代の後、磨製石器や土器を用い、農耕・牧畜を始めた時代を選びなさい。",
          "answer": "新石器時代",
          "source": "IMG_3120／古代文明・歴史ワークp4〜5",
          "choices": [
            "旧石器時代",
            "新石器時代",
            "中世",
            "近世"
          ]
        },
        {
          "id": "B-0-3",
          "text": "季節によって向きが変わり、南アジアの雨季・乾季に大きく関わる風を漢字3字で答えなさい。",
          "answer": "季節風",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "B-0-4",
          "text": "中国の沿岸部に外国企業の工場が集まった理由として適切なものを選びなさい。",
          "answer": "経済特区で外国企業を受け入れたため",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "全ての港を閉鎖したため",
            "経済特区で外国企業を受け入れたため",
            "国内で農業が禁止されたため",
            "沿岸部には労働者がいないため"
          ]
        },
        {
          "id": "B-0-5",
          "text": "東南アジアなどで、輸出用の商品作物を大規模に栽培する農園を何というか。",
          "answer": "プランテーション",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "B-0-6",
          "text": "チグリス川とユーフラテス川の流域で発達し、くさび形文字が使われた古代文明を答えなさい。",
          "answer": "メソポタミア文明",
          "source": "IMG_3120／古代文明・歴史ワークp4〜5"
        },
        {
          "id": "B-0-7",
          "text": "地中海沿岸の都市で、夏の降水量が冬よりかなり少ない。この気候の特徴として正しいものを選びなさい。",
          "answer": "夏に乾燥する",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "夏に乾燥する",
            "一年中凍結する",
            "夏だけ雪が降る",
            "毎日同じ量の雨が降る"
          ]
        },
        {
          "id": "B-0-8",
          "text": "ヨーロッパ連合の略称をアルファベット2字で答えなさい。",
          "answer": "EU",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        },
        {
          "id": "B-0-9",
          "text": "ある国の小麦の食料自給率は80％である。この値から直接読み取れることを選びなさい。",
          "answer": "国内生産量は国内消費量より少ない",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43",
          "choices": [
            "国民の80％が農家である",
            "輸出が一切できない",
            "国内生産量は国内消費量より少ない",
            "小麦の値段が20％下がった"
          ]
        },
        {
          "id": "B-0-10",
          "text": "EUの多くの国で共通通貨が導入されると、旅行時に不要になることがある手続きは何か。「お金を別の通貨に交換すること」を漢字2字で答えなさい。",
          "answer": "両替",
          "source": "IMG_3119・3124・3127／歴史p2〜5・地理p30〜43"
        }
      ]
    },
    {
      "subject": "国語",
      "questions": [
        {
          "id": "B-1-1",
          "text": "「夕方に／強い／風が／急に／吹いた。」の主語を、区切った文節の形で書き抜きなさい。",
          "answer": "風が",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-2",
          "text": "「姉は／昨日／図書館で／資料を／調べた。」の述語を書き抜きなさい。句点は不要。",
          "answer": "調べた",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-3",
          "text": "「遠くの／山が／はっきり／見える。」で「はっきり」が直接修飾する文節を選びなさい。",
          "answer": "見える",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "遠くの",
            "山が",
            "はっきり",
            "見える"
          ]
        },
        {
          "id": "B-1-4",
          "text": "「資料が足りない。だから、図書館で調べよう。」の「だから」の働きを選びなさい。",
          "answer": "接続語",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "主語",
            "連体修飾語",
            "接続語",
            "独立語"
          ]
        },
        {
          "id": "B-1-5",
          "text": "「はい、私が説明します。」の「はい」の文の成分を答えなさい。",
          "answer": "独立語",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-6",
          "text": "「草原」の「草」の部首を、部首名で答えなさい。",
          "answer": "くさかんむり",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-7",
          "text": "「川を観察する」の「観察」の読みをひらがなで書きなさい。",
          "answer": "かんさつ",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-8",
          "text": "【独自の説明文】森で生まれた物質は鉄と結び付き、鉄を海まで運ぶ助けをする。その鉄を植物プランクトンが利用し、それを貝が食べる。このように、離れた場所の環境どうしもつながっている。\n筆者が最も伝えたいことを選びなさい。",
          "answer": "離れた森と海も物質の移動で関係し合う",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "離れた森と海も物質の移動で関係し合う",
            "貝は森に住まなければ育たない",
            "海の鉄は全て植物プランクトンが作る",
            "森と海は遠いので影響し合わない"
          ]
        },
        {
          "id": "B-1-9",
          "text": "前問の説明文の「その鉄」を運ぶ助けをするものを、本文から「森で」で始まる8字で書き抜きなさい。",
          "answer": "森で生まれた物質",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）"
        },
        {
          "id": "B-1-10",
          "text": "【案内】見学会は10時開始。受付は9時40分から。雨天も実施。上履きを持参。\n案内に合う行動を選びなさい。",
          "answer": "上履きを用意し、9時40分以降に受付する",
          "source": "IMG_3145・3148／森と海の関係・文の成分（独自の短文）",
          "choices": [
            "雨なら連絡を見ずに欠席する",
            "上履きを用意し、9時40分以降に受付する",
            "10時40分に開始だと考える",
            "受付は開始後だけだと考える"
          ]
        }
      ]
    },
    {
      "subject": "理科",
      "questions": [
        {
          "id": "B-2-1",
          "text": "ペンギンとスズメを、飛べるかどうかによらず鳥類に分類できる特徴を選びなさい。",
          "answer": "体が羽毛でおおわれる",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "子に乳を与える",
            "体が羽毛でおおわれる",
            "外とう膜がある",
            "一生えらで呼吸する"
          ]
        },
        {
          "id": "B-2-2",
          "text": "オタマジャクシは皮膚のほか、主に何で呼吸するか。ひらがな2字で答えなさい。",
          "answer": "えら",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "B-2-3",
          "text": "節足動物の体の外側をおおい、体を支える硬いつくりを何というか。",
          "answer": "外骨格",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "alts": [
            "がいこっかく"
          ]
        },
        {
          "id": "B-2-4",
          "text": "クモとカブトムシに共通するが、アサリにはない特徴を選びなさい。",
          "answer": "体やあしに節がある",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "体やあしに節がある",
            "内臓が外とう膜でおおわれる",
            "背骨がある",
            "必ず6本のあしをもつ"
          ]
        },
        {
          "id": "B-2-5",
          "text": "「アルミニウムでできた空き缶」のうち、材料による区別である「物質」の名称を答えなさい。",
          "answer": "アルミニウム",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "alts": [
            "アルミ"
          ]
        },
        {
          "id": "B-2-6",
          "text": "砂糖・食塩・デンプンのうち、水に溶け、加熱しても炭にならないものを答えなさい。",
          "answer": "食塩",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "alts": [
            "しょくえん"
          ]
        },
        {
          "id": "B-2-7",
          "text": "銅と鉄を比べた説明で正しいものを選びなさい。",
          "answer": "どちらも電気を通すが、銅は磁石に付かない",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "銅は金属ではない",
            "どちらも電気を通さない",
            "どちらも電気を通すが、銅は磁石に付かない",
            "鉄だけが磨くと光沢をもつ"
          ]
        },
        {
          "id": "B-2-8",
          "text": "水面が42.0cm³のメスシリンダーに固体を完全に沈めると47.0cm³になった。固体の質量は39.5g。密度は何g/cm³か。数値のみ。",
          "answer": "7.9",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "B-2-9",
          "text": "密度0.80g/cm³の液体25cm³の質量は何gか。数値のみ。",
          "answer": "20",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度"
        },
        {
          "id": "B-2-10",
          "text": "密度0.92g/cm³の物体を、密度0.79g/cm³の液体に入れた。溶けず、液体を吸わないときのようすを選びなさい。",
          "answer": "沈む",
          "source": "IMG_3080・3082・3102・3103／動物の分類・物質・密度",
          "choices": [
            "必ず浮く",
            "沈む",
            "必ず液体と同じ密度になる",
            "必ず蒸発する"
          ]
        }
      ]
    },
    {
      "subject": "英語",
      "questions": [
        {
          "id": "B-3-1",
          "text": "「あなたは英語を勉強しますか。」(　) you study English? に入る語を選びなさい。",
          "answer": "Do",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "Is",
            "Do",
            "Are",
            "Am"
          ]
        },
        {
          "id": "B-3-2",
          "text": "「私はスポーツが得意ではありません。」I (　) not good at sports. 空所に1語を入力しなさい。",
          "answer": "am",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-3",
          "text": "「私は土曜日にはテレビを見ません。」次の語を全て使って英文を書きなさい。I / do / not / watch / TV / on / Saturdays",
          "answer": "I do not watch TV on Saturdays.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-4",
          "text": "「あれはあなたの学校ですか。」に当たる英文を選びなさい。",
          "answer": "Is that your school?",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "Are that your school?",
            "Do that your school?",
            "That is you school?",
            "Is that your school?"
          ]
        },
        {
          "id": "B-3-5",
          "text": "「私は上手に走れます。」I can (　) well. 空所に「走る」を表す1語を入力しなさい。",
          "answer": "run",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-6",
          "text": "Can you play the piano? に「はい、できます」と3語で答えなさい。",
          "answer": "Yes, I can.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-7",
          "text": "「私はイヌを2匹飼っています。」I have two (　). 空所に1語を入力しなさい。",
          "answer": "dogs",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-8",
          "text": "【英文】I am Kota. I am twelve. I like music, but I cannot play the guitar. I read books every day.\n本文に合う内容を選びなさい。",
          "answer": "コウタは音楽が好きだが、ギターは弾けない",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "コウタは13歳である",
            "コウタは毎日ギターを弾く",
            "コウタは音楽が好きだが、ギターは弾けない",
            "コウタは本を読まない"
          ]
        },
        {
          "id": "B-3-9",
          "text": "前問の英文から、コウタが毎日読むものを英語1語で書き抜きなさい。",
          "answer": "books",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介"
        },
        {
          "id": "B-3-10",
          "text": "「私は千葉出身です。」を表すときの正しい語順を選びなさい。",
          "answer": "I am from Chiba.",
          "source": "IMG_3129・3131／be動詞・一般動詞・can・自己紹介",
          "choices": [
            "I from am Chiba.",
            "I am Chiba from.",
            "I am from Chiba.",
            "Am I from Chiba."
          ]
        }
      ]
    },
    {
      "subject": "数学",
      "questions": [
        {
          "id": "B-4-1",
          "text": "−12−(−4)×5 を計算しなさい。",
          "answer": "8",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "B-4-2",
          "text": "−4² と (−4)² の値の組として正しいものを選びなさい。",
          "answer": "−16 と 16",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "−16 と 16",
            "16 と −16",
            "16 と 16",
            "−16 と −16"
          ]
        },
        {
          "id": "B-4-3",
          "text": "252を素因数分解すると 2²×3²×□ となる。□に入る素数を答えなさい。",
          "answer": "7",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "B-4-4",
          "text": "4(2x−3)−3(x+5) を計算し、同類項をまとめなさい。",
          "answer": "5x-27",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "B-4-5",
          "text": "6a−{3a−(5−a)} を計算し、同類項をまとめなさい。",
          "answer": "2a+5",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "B-4-6",
          "text": "a=−3のとき、2a²−3a の値を求めなさい。",
          "answer": "27",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）"
        },
        {
          "id": "B-4-7",
          "text": "1冊b円のノートを4冊買い、2000円を出した。おつりを表す式を選びなさい。",
          "answer": "2000−4b",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "4b−2000",
            "(2000−b)×4",
            "2000−4b",
            "2000b−4"
          ]
        },
        {
          "id": "B-4-8",
          "text": "縦がx cm、横が5cmの長方形の周の長さを表す式を選びなさい。",
          "answer": "2x+10 cm",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "5x cm",
            "x+5 cm",
            "2x+5 cm",
            "2x+10 cm"
          ]
        },
        {
          "id": "B-4-9",
          "text": "(8x−12)÷4−(x−7) を計算し、同類項をまとめなさい。",
          "answer": "x+4",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "mode": "linear"
        },
        {
          "id": "B-4-10",
          "text": "時速b kmで20分歩いた道のりを、km単位で表す式を選びなさい。",
          "answer": "b/3 km",
          "source": "範囲表S__13754372.jpg／1章の復習・文字の式p60〜83（写真未提供部分は範囲表から独自作成）",
          "choices": [
            "20b km",
            "b/3 km",
            "3b km",
            "b/20 km"
          ]
        }
      ]
    }
  ]
};
// September 13 exam: private question bank, server-clock windows, durable own answers.
const SEPT_START = Date.parse('2026-09-13T20:00:00+09:00');
const SEPT_END = SEPT_START + 75*60000;
const SEPT_CLOSE = Date.parse('2026-09-17T00:00:00+09:00');
const SEPT_ID = 'grade1-20260913';
function septForm(uid) { return uid === 'u1' ? 'A' : 'B'; }
function septKey(uid, part) { return 'nobi-test:'+SEPT_ID+':'+uid+':'+part; }
function septNorm(value, subject) {
  let s=String(value??'').normalize('NFKC').trim().replace(/[−―]/g,'-').replace(/[’‘]/g,"'");
  if(subject==='英語') return s.toLowerCase().replace(/[.,?!]/g,'').replace(/\s+/g,' ').trim();
  return s.replace(/\s/g,'').replace(/[。．]$/,'');
}
function septLinear(value) {
  const s=septNorm(value,'数学').replace(/\*/g,'');
  // Only a fully simplified, one-variable linear expression; never evaluate user code.
  if(!/^[+-]?(?:\d*[ax]|\d+)(?:[+-](?:\d*[ax]|\d+))?$/.test(s)) return null;
  const out={a:0,x:0,n:0};
  for(const t of s.match(/[+-]?[^+-]+/g)||[]) {
    const v=t.match(/[ax]$/); if(v) { const c=t.slice(0,-1);out[v[0]]+=c===''||c==='+'?1:c==='-'?-1:Number(c); }
    else out.n+=Number(t);
  }
  return out;
}
function septCorrect(q, answer, subject) {
  const got=septNorm(answer,subject); if(!got) return false;
  if(q.mode==='linear') { const a=septLinear(got),b=septLinear(q.answer);return !!a&&a.a===b.a&&a.x===b.x&&a.n===b.n; }
  const accepted=[q.answer,...(q.alts||[])];
  if(subject!=='英語' && /^[-+]?\d+(\.\d+)?$/.test(q.answer) && /^[-+]?\d+(\.\d+)?$/.test(got)) return Number(got)===Number(q.answer);
  return accepted.some(a=>septNorm(a,subject)===got);
}
async function septRows(env, uid) {
  const keys=Array.from({length:6},(_,i)=>septKey(uid,i===5?'joined':i));
  const rows=await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k IN (?,?,?,?,?,?)').bind(...keys).all();
  const map=new Map((rows.results||[]).map(r=>[r.k,JSON.parse(r.v)]));
  return {joined:map.has(septKey(uid,'joined')),parts:keys.slice(0,5).map(k=>map.get(k)||null)};
}
function septScores(uid, rows) {
  return SEPT_BANK[septForm(uid)].map((p,i)=>({subject:p.subject,score:p.questions.reduce((s,q,j)=>s+(septCorrect(q,rows.parts[i]?.answers?.[j]||'',p.subject)?10:0),0)}));
}
async function septResult(env, uid, rows, attempt=0) {
  if(!rows.joined) return null;
  const k=septKey(uid,'result');
  const prior=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind(k).first();
  if(prior)return JSON.parse(prior.v);
  const scores=septScores(uid,rows),form=septForm(uid);
  const result={version:1,form,at:SEPT_END,scores,total:scores.reduce((s,p)=>s+p.score,0),
    review:SEPT_BANK[form].map((p,i)=>({subject:p.subject,questions:p.questions.map((q,j)=>({text:q.text,answer:q.answer,userAnswer:rows.parts[i]?.answers?.[j]||'',correct:septCorrect(q,rows.parts[i]?.answers?.[j]||'',p.subject)}))}))};
  const guard=rows.parts.map(()=>"COALESCE((SELECT json_extract(v,'$.seq') FROM auth_kv WHERE k=?),0)=?").join(' AND ');
  const revisions=rows.parts.flatMap((p,i)=>[septKey(uid,i),p?.seq||0]);
  await env.AUTH_DB.prepare('INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE '+guard+' ON CONFLICT(k) DO NOTHING').bind(k,JSON.stringify(result),...revisions).run();
  const saved=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind(k).first();
  if(saved)return JSON.parse(saved.v);
  if(attempt>=2)throw new Error('exam finalization conflict');
  return septResult(env,uid,await septRows(env,uid),attempt+1);
}
async function septemberTest(request, env, session) {
  if(!['u1','u2'].includes(session.uid)) return json({error:'forbidden'},403);
  if(!env.AUTH_DB) return serviceUnavailable();
  const now=Date.now(), uid=session.uid, form=septForm(uid), bank=SEPT_BANK[form];
  const current=now>=SEPT_START&&now<SEPT_END?Math.floor((now-SEPT_START)/900000):-1;
  if(request.method==='POST') {
    let b;try {b=await requestJson(request,16384);}catch(e){return invalidBody(e);}
    if(!b||typeof b!=='object'||Array.isArray(b)) return json({error:'bad_body'},400);
    if(b.action==='join') {
      if(now<SEPT_START-900000||now>=SEPT_END) return json({error:'outside_window',now},403);
      await env.AUTH_DB.prepare('INSERT INTO auth_kv (k,v,expires_at) VALUES (?,?,0) ON CONFLICT(k) DO NOTHING')
        .bind(septKey(uid,'joined'),JSON.stringify({at:now,form,version:1})).run();
      return json({ok:true,now});
    }
    if(b.action!=='save'||!Number.isInteger(b.part)||b.part<0||b.part>4||!Number.isSafeInteger(b.seq)||b.seq<1||b.seq>1000000||typeof b.final!=='boolean'||!Array.isArray(b.answers)||b.answers.length!==10||b.answers.some(a=>typeof a!=='string'||a.length>300)) return json({error:'bad_body'},400);
    if(b.part!==current) return json({error:'outside_window',now},403);
    const own=await septRows(env,uid);if(!own.joined)return json({error:'not_joined'},403);
    const previous=own.parts[b.part];
    if(previous?.final || (previous && previous.seq>=b.seq)) {
      if(previous.seq===b.seq && previous.final===b.final && JSON.stringify(previous.answers)===JSON.stringify(b.answers)) return json({ok:true,seq:previous.seq,final:previous.final,now});
      return json({error:'locked_or_stale',now},409);
    }
    const rec={answers:b.answers,seq:b.seq,final:b.final,at:now,form,version:1};
    if(Date.now()>=SEPT_START+(b.part+1)*900000)return json({error:'outside_window',now:Date.now()},403);
    const saved=await env.AUTH_DB.prepare("INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE NOT EXISTS(SELECT 1 FROM auth_kv WHERE k=?) ON CONFLICT(k) DO UPDATE SET v=excluded.v WHERE json_extract(auth_kv.v,'$.final')=0 AND json_extract(auth_kv.v,'$.seq') < json_extract(excluded.v,'$.seq') AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k=?) RETURNING k")
      .bind(septKey(uid,b.part),JSON.stringify(rec),septKey(uid,'result'),septKey(uid,'result')).first();
    return saved?json({ok:true,seq:b.seq,final:b.final,now}):json({error:'locked_or_stale',now},409);
  }
  if(request.method!=='GET')return json({error:'method_not_allowed'},405);
  const own=await septRows(env,uid), review=new URL(request.url).searchParams.get('review')==='1';
  const out={id:SEPT_ID,form,now,start:SEPT_START,end:SEPT_END,close:SEPT_CLOSE,current,joined:own.joined,
    parts:bank.map((p,i)=>({subject:p.subject,start:SEPT_START+i*900000,end:SEPT_START+(i+1)*900000,seq:own.parts[i]?.seq||0,final:!!own.parts[i]?.final,saved:own.parts[i]?.at||null,answered:(own.parts[i]?.answers||[]).filter(a=>a.trim()).length})),
    released:now>=SEPT_END,expired:now>=SEPT_CLOSE};
  if(current>=0&&own.joined)out.active={subject:bank[current].subject,answers:own.parts[current]?.answers||Array(10).fill(''),questions:bank[current].questions.map(({id,text,choices})=>({id,text,...(choices?{choices}: {})}))};
  if(now>=SEPT_END) {
    const result=await septResult(env,uid,own);
    if(result){out.scores=result.scores;out.total=result.total;}
    const otherUid=uid==='u1'?'u2':'u1',other=await septRows(env,otherUid),otherResult=await septResult(env,otherUid,other);
    out.other=otherResult?{total:otherResult.total}:null;
    if(review&&result)out.review=result.review;
  }
  return json(out);
}

// September review PDFs: authenticated, question-only, no learner answers.
const SEPT_REVIEW_PDF = {"u1": "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiswIDE2IDAgUiAvRjIrMSAyMCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQ29udGVudHMgMjQgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgMjUgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgMjYgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNiAwIG9iago8PAovQ29udGVudHMgMjcgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNyAwIG9iago8PAovQ29udGVudHMgMjggMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ29udGVudHMgMjkgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKOSAwIG9iago8PAovQ29udGVudHMgMzAgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL0NvbnRlbnRzIDMxIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdIC9QYXJlbnQgMjMgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFu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IDYzOCA2ODggNTg5IAogIDU1MiA2ODkgNzI4IDI5MyA1MzUgNjQ2IDU0MyA4MTIgNzIzIDc0MiAKICA2MzMgNzQyIDYzNSA1OTYgNTk5IDcyMSA1NzUgODc4IDU3MyA1MzEgCiAgNjAzIDMzOCAzOTIgMzM4IDU1NSA1NTkgNjA2IDU2MyA2MTggNTEwIAogIDYyMCA1NTQgMzI1IDU2NCA2MDcgMjc1IDI3NSA1NTIgMjg0IDkyNiAKICA2MTAgNjA2IDYyMCA2MjAgMzg4IDQ2OCAzNzcgNjA3IDUyMSA4MDIgCiAgNDk4IDUyMSA0NzUgMzM4IDI3MCAzMzggNTU1IDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAg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MTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDQxMSAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCA1NTUgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCA0MTEgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCBdCj4+CmVuZG9iagoyMSAwIG9iago8PAovUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDIzIDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMjIgMCBvYmoKPDwKL0F1dGhvciAoXDM3NlwzNzcwbjBzMFwzNTUwXDI2MCkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDkxMzIzMzkxMSswOScwMCcpIC9DcmVhdG9yIChhbm9ueW1vdXMpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDkxMzIzMzkxMSswOScwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0ICh1bnNwZWNpZmllZCkgL1RpdGxlIChcMzc2XDM3NzBuMHMwXDM1NTBcMjYwXDAwMCBfXDI1MVwxNzdcMzIyXDAwMDNcMDAwNVVPXDAwMCBcMDAwQSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iagoyMyAwIG9iago8PAovQ291bnQgMTAgL0tpZHMgWyAzIDAgUiA0IDAgUiA1IDAgUiA2IDAgUiA3IDAgUiA4IDAgUiA5IDAgUiAxMCAwIFIgMTEgMCBSIDEyIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKMjQgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTE3MQo+PgpzdHJlYW0KR2F0VTI5OTBgQCUpMSZrYURoNXAyWHIkVionaldZPl8ha3NpX1RwbWw2PShFNU9kQE80TSc5SidYbVJtLWgvX1xCNGppWnBfRWdZR1lJQUg1MkV0KFdETTt1OWdxTkNxW19yWUlfXjlvVSo9PDwzVUluMzhbI0FIOVU5Xz9oRUJxKTVRa1BYSi50c0tOUFVsci8kRTxVcksiPThxOnAuL0ZedDpvJWJORDw/LUtgODFSN0JsUj1xPTo4Jl1eNC5jJktgKyJBM09mbVFdazVfdEtaTCQ2XkpeR2xcPStpdSR1TlNAZ1hscj5KbEFGOGxCW0hxXEReTVRhTzRIQCQyV2JJRWVvO0hfPGsuIW0sJClfRD1iMj0wJT9qK0NSYU5pJTlgWS1QYEpUOnIwJjprWkQrOWFvbiIrX2hxUW9yPm9aSHQkaWQuN1w/JnFEPz9SZ05cZjFkXVdIaHVoKEU5OS89XSNERCJBXyVRa3QyQ0NWImwjKnJCOF9aYzU6K0tBQy9gS0F1YyE3VTdPR2dGWUVeSywqXWk5ZHBLMyZCXC4uPVY2a2BzTiomcWsnN1o+RUIhKzxnKDNTc3JmdTFGdE1dP3IlPmpFKV0sPipPNWBMNXBAIlkkNW5QVjY6UzVgZltuakVmTnNMNlF1IlcwQEIyX202RGU0cTZEbWtmJVRVUy8kX1pUOGRcK3I4JShDKilsYWEqWDxSWFg2aEBEZ1VENWgsPU8rWyNLXGA5P0dhJl4xOjwjRXFCaXIjQD5kVUAqVFJgY1UuXGJyMkJQaFsxSyNCcDBmNyw8YWhkXSxdUSQkLCtITzI5JF02Y0IrYDMiTnEkaVVbYExrWUE5aUxNanFnQydHME5UTFZNZCREKGs7ZEg7V2VFOFRAT2tJYz4kWi1FVzlkPVVfS2VEOnA+VVxOXTdbTFlPZVpHbTlWKGlARUwhXEM1ZFw9ck91bSdLWGZpN0lQP10rbkVVTk5FOkpyTVRfdEFhVUpWVUxZO1ReblBQND8wPDE1XyhKUkoxOi9OMFwqN2k7PTMiXzMjWFU3NFMpWl48JENQX24pRChZIT05dEdxNCIocztRJkJtbG1GcFdxP01qczRSJ1ZgM2JGI1ZQRjRPcVstM3NGXFs1SS9VazFbT0QoV05zclo9aUtJIjMyUVkjTk0vMTJcPTM9OVw2L2E/TjxPYSdiRSZSRD9ZbTE9byJtZmJEWyIsJU00Y1hpPzpOODFJPEEmQDhEWjUwYWZbX1FXPkRROStEOmJtWjpPNkw1SC1JRUxxZGI6W0tWS2o7J0Znam86Yl1OLGdXdDw5bmI/PmNkITclRHQ/YDxTYEVuZ0VoSjRjW085W2BQVScscTN1Xk8rQmooU3BwSChORE04LXNRPG40WC9cVEctUVg0PG06M3JKPW9OaSdSJFFBQTBkT21uZjEzSydtZW81YT88ayNkITZfISsjPk1NcWlHRiVOLlhSZTo6UDdcW0VNK1BxJFZIR0leUTsnMyw5aUkkYFNDYSddPiFJcnVIdSlRaWJPLGElP1ZlQzZlKm1UO19LY2R+PmVuZHN0cmVhbQplbmRvYmoKMjUgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggOTk0Cj4+CnN0cmVhbQpHYXRtOjk5N1JWJSkySTtqTEJgaTomSVE5LD1pMVkvalF0LGAqanJXQkdWIVNzKy9La3FBPlQ2W0Q3X2BqLzI/WmY4aFJaK2xdIWhwXGxuIz0mWlZXU08wJilJMUFocCQuSVhKMmcmNHVENiQyRSwpPkNwNDZab0xNWEA2QnBZTUVMOUZ1ZTA2bSlpWU9NXUBCWyRAIShfWG9FUmNpOnA5LSNeJDZpVystJ0Z1IWtjInIyJC42LEhLTlVMWkQqVjw3IVEmIWAtOGtXWXFqK04tZT42TTBOWlZga1IrK2olLFRmQTFLJlw0dUNXcXE1dVs0QChzIUxfR0c6J1I+PylVUlQpYTY2OjNPVyM4WDJZUSJJKkZWZl0oZ0VPVk5WR15qYHJgSTpjX29gUGZmK1ZgRW84LT0uN1lXb244NllGY0JmUkNoWEA6LThnUmxJJUtPQFJbN1VbcjdCQWhqJkNMQTlhS1lmTmUnISpPJE1AJykiL25VL2s9PGpvMDxaRW1dVW1pKDJfbWRyMUFwT0VScXFjI249WTFTUlNhdC8iTEpCL2gsdGtqTkA7JiM4MyovNmpiP3NGWSk0TGclSlU3KSNNdEozKUQ3SGIpXS9zKj1USThbKjRnWiwrX28tRy1Ycl5oUiwsZzVSWm9TLV9tVkRSVVwjLjhgR1A5YDs1R2A0PS4vUms2NW90NEdrM2NhSEpsOFhkM19BWGxVNiswKz1PZlBBNlY4LlUmQFRkXDktJFdmQ0RWNjk3LjNsbWZgQzUlNFQhYmhrJ1ZpWUxEXG1JSE0hX1ErMzE4QjBOVmctX3QoLyhFdEtZOUkxNUVfOmBvTGRrQE80ZWojSXUhYCRJViMvRFUoS2NeZkBBOWdWPlw/SElXUSQtPC0yJ11DMHBLNFpoNldjVWJWR3I/N2FjWSJfPWlOb1BmSHJkRzFYJlIpbWNXIlc7MUcqVioxRyshb0IzTVw0PWswJWdXay5cJmdJJiJyMiwqMj5sSDhwPU5NJTNAZCx0KlZuWDM5OGkzVkVqN1lKRzVUSHVbNT5QRExfMUUjOl0lUkhqQVE4RF1aWjdiT2orQi5EWE5yZHJuZXE2WVRtYVM0bUwkSE1LalBnTVE1QUZuLD43NTRKPFxoTCI1Y3EsXkBrNFJEZFJrdUs+MDxfPDE2PD0lcms0aSEvQi43blpsNSZPR3AqWHBUZG1DaEMxO2JEMyVwUFliRjZuciZqI2BzOXU1V1NhUSMmSEp0a1hgTFInXzkkX1QhI0clQHM7KnU6VW45WTQqbD1XWScvYTVPVVZfWCQuNT5ANlRDIU0kVnNHbH4+ZW5kc3RyZWFtCmVuZG9iagoyNiAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMTA0Cj4+CnN0cmVhbQpHYiEjXDk1aTw2JkFJPS9SIS9RW29mUiU8OCEmNi8oTFc6U0VNcyFHWzdLZmUmJ1UhJ2EtTCJYPSZDOVRFXGtoa2hiOyZdSUgpKjVRT2hhO1JsZmZpbWJJSl5FLkRqI2JsUlMqRnMjUFA+cG1zbDlQJkMiLWIkXk9SSjlzVyxiOWlXY2I4JVolbC1yY2FePnVQN1swJCsvRmBNc2J0R1BDbCNzOTBgRC5rYllSZmEnZyo9S1YrWG9gVS4hUCVtO0IxNkkhayN1WidNIydMIkNDb25qb1w5Sy4uTyJEIVRNXVU1UF0ubSokViNERjRyNUFRITVyT2U1KStAbmc8UTdwSU9rSEtSPD91Nk1vUzU/aWFPUUBpbzctakpmVmRKJWksQkdvLT0mUEBSJS9UMlFWPDs9T21bL1ZCWi5FSVNIZiNwazdNYz5mQU04WlVpcVUsK0pTa3VBXixxKU9GJW9sbFMpVWoxMEhFQlRVKVVfSSNtVHEzJjJwJTtFb1k+ZGRVQVQuYEE9Rm1IJixwYT9taENJLV1XM09yXDBrLExVJDBxJVcsPCZUKidyK1RlNFw/dUJiayMuUC5YZElVKytwJyZrNz9DUC9nTTZjWktlUyMxX2ZocSRnZGEpXF9JRTpaJWJHPmJdWC1OQDpzYSViNmtLWm0pPy90PHREQzUoIl1OK0YoX0Ama1leaWwqKmE3aF8zRVZUPmh0aS84ISJQTGQmLVNWXGZdYXBIZj5dMV5UIzxjPzZoYmAhXUdvSDIySS1MIWA1JVhTWVNsJGFeWV5WP0kwT1JBN3JpVGFqXiFhTXM9R1M4Ry8/QEBnX19QIXFiW3JwJV43RElLSnRYNGZdUjBsNDBpWkJNY0RoYk5ERGpMZkIkc1hbUWpvOidEb11ALDAnJDphQEByWW09Iz9MLTByaDJoSy8wPzs0XFNSJi5kOWBGVFciUDAmVDVoZSRCaFFuS0BLTnE4WDJCRkhhWVRoRkdscGk1VjZrIjB0c1A1PT8pLS1HRFtIS0BBbmRxM2A/M2FOcyxYSiY7RE5pYSczaTU2V15jOkg6NCE7LEAhJEtWI0BBbS1sUzo8VVZpUylaTCZtVkZQUGI0ZilGUzcoZEBTOVhKWDRRPi8uR21qcWtTJlxLU0dJRUg6ZnBpQExrMjxOXiRgOSU7XT1RNjZYRiMtdEQyUz8xZVg0QkhuKWQ5YWBYb1VWWGZlRDBFUlosUHAzTFZgTCFCVCNVT0VjZ0M2dTVCYjtMKDNDUXJLNy43akguY0JNLkArYlxdZFdEYV90L2pmXlQxPS8hVTw6RmtSQV87Jk5KbTopQGApb1JnRjU5V01kI2ExZCQ/InQ/R2ROQTRQMmVaKnFOUjtXKyNHdWYrIiwvWzNLXT1yOU5jdDdYYyFpXykrZVNqYkhTPjhyNjRgMixaNE1vcWZ1Rm4rLEE+NWFeKU4ycyJMdE4wRF1JWmk7fj5lbmRzdHJlYW0KZW5kb2JqCjI3IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE0MTYKPj4Kc3RyZWFtCkdiIi8oOTlVJkslKTJKPm4xQ2w2b1wsSUVHOitZaCxzVk9tIURGUGlXVCgtXk9Abm87LmYnKyI4QEpDVTFcL0JfUSxEc1FHO1MuLC1YMEJJZ0RTMFZRaTpASihqITVCKFFZLCw/b0RxXlVSJy1kXFR0UHJwcHF0U00raFIwQ2k0SkVTRmAhb0YyQCJMR0lIJ2AqbCVsJyYuZCkzbjssL01aWj4wRD8qakBNQ3NJNC9AZ2swW2BCKkYnSl9WI0cnU0lsMmsvJUJMJFpbZj4kLWUnLCZUaC0wVmpSc19BM2E5XG5HN1paITpZPFw/ZXU2cjViTEpjJVo8YjsnQzFmYENeN2QvbCVvWSIvS2pLcUAxKmlgQmBCbWtRajQ8JGQhRSw8P2FdLmBeTWk7cFhSWVtrLFc7VDxaUlMqbydtVkVLcDIxS3NXKyVtdFg8JGN1NXJoJFlcXy9Jajw8VFJxTVNcXltpSEpxdGEuZHNhRFphaU4mUlZtcCFqXFE6TWV1PkslKGFTUj5mKSZKPjZxPWNaTC4hIzBETyEjRGhkZlE4YjcvZFVCdDczamVoUyMoJkdOM0FEN3MicjpZZTtGYCMnWWwvOUxqUlJHMzFFJXAqNmJBdGtLaDJ1WGFEUEY6c1wzcFprJF1KMExeci1XYlBAbTVwRmUtVG4iZHEodUQtNmc8bzRSWjAnaT4ibk5ZWVJQPyIxckhhOllmYyxhT1E6QmVbRjlETVA8PEA8R1kpPUVAIWckJzouLStfaCEiVG1dVSIrUi9FTFRTQz9zXG5uWCtHVkRRWCYrJUQzPkxFTSgqWXEkTlgnIWFQVWhsKC1EcGErP2U1Xy1rIjIiYzkqSjxzXjxNXyw8V2lbYl5pRjdQKTE5Pic1I29aV0k4YG1mbWpSJ2NjPTphPjs9akxOKC9qTSRTJ24oUy5sVDslL0dqanM6bVN1Kj1vJidJSmtGT2M+b0RhVTVXKl0kW0IsMiRKVHA/SEhDQzJYWVBPZztCLCxgOmZFYD4xcDY7W1dvZV5HNFJmMiImYjFiNVAiSnU1aT1MWWwqL1w4NF9CQyssLG03bGR0ZjRJM2lgcENXbVA9NyYhPlVtZycxO3A7TnNIYHMmYFdMXkZBST9CN19eLVQqRyM0JFFsY14pM0ssNmRma2BuJlVmOmEkVV8+TWljPGdLZURkaEwnS0QhMWxCJFhvYGpLV1lrVjsuWDUlY08sQDI7WEVZSUFdPTFkXXJVZEc5LyNFIkNSOVlPQktqTF0jTVw8QTFyRDs8OlpyTy4tZ2NALTRWOCVDUl03bC4lPEtsMTlXZipVZ3JDUm4oI20xJTEmdSxnIjdmIVtdSUU6ckEoXiRhXFwpRyQmcmk5WihIcipkQjpsRiYkaTlBcnRlWEFZUG9FdD4ySENlRi5ESTYlMStkQF5gVzJVZic/ZGUuOWtZX3Fba2liVmg5TzIhREBIcS1lNVAiSzNnMGpfTzlzPjE9JF82WSVfdXBBcVtEKWQ3UmJwXEdBcyVmLkZtYSRtTTFYSVRgY2wtRFojYDhSM0FuT0tgcVMhWFNmNktiajgwRS1ocXBZOWY/NVR1TFo7NyI3O3FbMTUlOlNQNUYjQWZTNGtecllGSydMWGQ4bF5IVElmYD5JX3FhSS9WSTBYUGBub21mSlRIZiZyZihWUGg9LXJbbC8wLFRQXEYrUV1OaU0lN0Z1SUEsXVw+bFkoU1ZPcWZwSCtHKCozP0VqcioxMytlQCZDaDwoM1EwPlNBLEZbOSxsSHNtbXIrTzNZP00vV2tKcDBgYVZZMmE7JzgoVD45P1NMbCRQMSFmdEVmSnVhUUsuPCgjV0BuaCQzP1koZkc0ST1vS0xXLElmMFQxLjtWWUxgMWtXU01+PmVuZHN0cmVhbQplbmRvYmoKMjggMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTIxMgo+PgpzdHJlYW0KR2F1YFQ5OVtnWSUpMW4rcHFVPGhSQi8iOWVSOipiIXQ1OEpUR083YCRePTApcXQ5UUNBMSxYLT8kVmJIX2ZpW2knJ2tgKnF0ampDKSwhMUFzLUZbN1kwRzVNJTstWkpxLm8jPG4nMWNqXE5dS0dcdVQsTTJxYXBuRGw+JGdWQ1JOI0poO0JdKD1rTl01UmpdPEM0VFFhUUIzWTFxOSU2R0IpXioiMDpnJFYuMVkhW2smS2xVXVA/KlpbZzYpJi0mdUBDJTdlOVVkQlFGOT8mYT5ba2htaExBSGEvKjNgK05xJWdNTkZhJ1gqX1RSYnJybFo3QVNbJC5eaF9JPl80RyNEKCVhMSkra2U2aTptLVlULWEhQSZiWFplLEwkOSJKZCFsQmckWFMySSJcOFVZR19hciY0IWBjRFpnPEJmKDo7ND9QWWd0NmZVZkhWKzpLJUhOPGgiNCI1MEcma2tpVW0+VFQibVxjN1toYSo8XlYsZUdeZTIyVkdZaFZuMWtQOUwvJVIsaTEtQmsiM2onJkJiN0NRYEAkWDJaalREXScsJlw6Ij9PdVxOLihkYkUxdD9ZcVhsUzFVIyE/NklIWCFRMGVjZmk/LDBfNEZWaF5YO3RUYEZHVStnNiQiTDY4QHQmUTBWY2lbODQkdWVgYzAxXV1IU19nLDkqbHNtNDdrZF9bMUApRVRqZ288VzFoZE9OWXJQT1AxbCN0Wj90J1ZzJEthMG5mOkcqaSo8UVNNWjs7Jm8oOD42I0ZuRUdnWCNXYUlXOUpra2IkJj4hX04pKUBeKz9KK3FkR0AuMyg0LFFUQnIjcSUnL0ZDcC4xMi4ua2UxPy9VcihQZ3U2LU1RLiknRl8/JFQkQ05tYFMmdVQ4N0olLnJkW1tFa2FuXm5bKWUnQGonZyNLS0xFJWhYNmREUC5pJj5eRERFXEU4ZmJmUHRHQEJlP0pnQC4objkkST9MdWxGL1BXWDA7UjwtYHJOOTtAalQ2WkY/WyQ4Yl9GakxIQiNCYkArZSkpIiw9NlQkbFVIdVAyMGlpQCVsZ2FYSmEvN2dzO1c/bi1BJlNGIk9uZV5Ob3MzJlo1TXA0XDkoVyYxPT1NJVkkNkpwXF5RST5JPGZlUFlzL21dLmZvV3MsRWNMJTZcOCE+W208XTRxLktdZTMlVFxAMydkdVBzTEs4WmJKR2ovcmY/ZypkKyRGSWhNRVw+UmVPTWY1bUlAUjEpImM0Mj1rLSQ3O1VuOTViRWYra3FAJypaSGtfIT5BKDQjWiRYNHRpLGdmKmQ/UGFxXm9oYz5OSDEnKk5PJ15ALElrSC9WRytVcF41JCtDUXFvb1RnPUMmbXBbWzU0aFFQVmZibS5vMlkiSWMpP1w8XCU8My5uTG5BWTtiLkImTXMoTzlfTyRHN2hnTiZ1XzxWNzUyVGdNa0kpMF0qUVY/bU5PQCpBJU4jQidoJF9EJ01HQihiYFBULCVyQGYxQExBZiRXLSdoJ1xyM01kJUpmSWUnckVSYDE3KVwqYScucT8uN1NISFNaKFdwWGI4aig1I1AmR10hVHRXSG5IOD1OTHBcI1EzaGY7X1VJX1RJIVlRcSVhRDZoM011Wl9mOFRYLX4+ZW5kc3RyZWFtCmVuZG9iagoyOSAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCA5ODkKPj4Kc3RyZWFtCkdhdTBDOTY4VDolKTFuK3BySHFsWzllIzNvRSRoYSFBOVZNMEc+ajIuJColOl5sQE1xOCRcXCVbZDYlLDQqM3VQZiEuQ2ZaTGdRbmNLYl9gczBFKnJtXUc5bCIpcmQuRm1hY2FHLHJbT3JpNEBnLXNOKkZrSzBoWUY9NXFyUSJZTmxrSWllWW1tLitXODsxJjMtKWE0MCVEOGd1XiQvUT5oPE5TS2ZKLyptcWYzWjhTZ0NHc0c1SVIsLVdlXFhcMEdYWC1uZzI6bDV0b2ByTjppZU82JSQ9KDNKJzE7Jy01OkZON2E7ODV0QWNxdEJCIzk3SCI9UCQ7WmthLG5gSTY9RStcJ2NiVEwlLi1cREpkSyQ4TEs9JHFGaypEP1lPQ1dBXVRcWG5xPVNUIlVTcSZgOCxoNypiSV1ZQCJFcUYzbUZxWzZcSVA+a0snWzdRaGw/YkBYMl5TZDFvWHNmPFpNLDVWY1g1YTgpNi9pM0QoJUVrQXA+NyJxISpzTUZGOlUkNXQ+TWRyYygmMWEnLDZIKHBvaExgPkk6QElwSVxrXmxwbT5WbmNRZEZYQV5EZSVfcj8nblVXZy4zQ1EhTmFfPFVyVTJPVzg6c2ByblYsQFl1ciNgZGEiI2ZVbWFULU1IQk4wYFldKVxtYCs3JFNeXSo/Q21bUi9qJC4+OTJidSo3PSE1K1JDVHFjWyMjanFPVFkxP2pMSXRPSExnUm4lTSIuOEo2LHBPJCxzQDtnKWcvMz1HREVQOSYmdGx0cj5xYmhfW0VTSW1GLEtHODtTQj48ZFg0WmgwbHQ2UTFAOiohKURdU2E3L1cnKGAjYCVBb3RRI146VmY6cUtgb2EvRmZSYipZZG08RylEIVFZL0YtTFc6NiFiKWc4TipgXUZlWTsqcmpHX0cmQzNfRnI9IkgyaFIwNlhoQFItO0g9LUBcZSleMmInMHImZlZfYDNcLXVHSSdHcVdTQGEkZUBdNlAuXUZHPSttZ2pdZ1Q+JUQhMWZSXVBkQW9YOT9RXC9jcnBPQmtEYVtvSHEpPEYtUTZrKy1IYkwmR1E4ZEdOYFohIVQzZiI5O2crLCUyRyhEUUk5S0ZuQHA3TmJuY3FlLjxlaS9TVV5LWytJS1A9LTxhTz9ObDRcZkpncFRjWSdFJCo4ak9MPFQkPWUyImVtKG5aOSg8azlxZyFyLWEwSFVzI0JPZ3RQZzY6Tm40JC0pRGhoSCxLLyhyQUg1N3RIOFgtVCxSI2RGa0kqIVsrSU0/VkYkRz9nVkReZ007KDNRI3EsSUNKKl5jbFkmSl5LRmg1I09ES1QkaX4+ZW5kc3RyZWFtCmVuZG9iagozMCAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMzUyCj4+CnN0cmVhbQpHYXRVM2hlc0dtJSI+dCtKcmFWKT5VMzMzSHIhMmNEKzAhSkBCRzx1KGA5RjQyPV10YVNgQCl1SW02aVpTXjVEXFJbNGtLSCJXJDQsazMqLiU+bUEycipTOl5dVT9cITAsY1thciVpImIpanBYNDVMMWovWUVQdEAwTi8sRz5McF83cGwtKHE8KU5DIVRwNFxqNEdcZE9APGpnUlNsakU1aFJuOjxvPW5gNW51NktwaDhvOiVOZisnVWEyPGY9MDtkWT9gJEBGbWxxISZZTmNdO2BnNHFPMSsiSSckS0g7IVFuZDVzLlNHOCNDNiRBKEhQZzQhUFVkZjZFRShiP0I9R008N2xibVFhYmxcY1xCT3BNJlddK04lPmlUU0JCPyJqaUdlOlIvXTJOLCdpSzNoIjw/OFFzbnRiPkJncHBoLGhoXTw2QmAlcC8lbSNudFBnQSpnUUE1cllKXjNAbklFV1RSajxIJjNvL0MtN15NUCVFa2tAWVZXM1oibEA6PFRXK0tJaCZQMmhPIj1hVFZDYGU2JFNWYFpXWlI6MSsqaS4nZTVuX3Flbm1jW0EuaWIrSSZkL11bQkliTVs8QXAiPWhnXFciPUM5THVVXWZGNWpSTWduN0B0M3I7JFwvJ24+aHRzJ190YTdraV40M3BsV25dRSRyWUYoTm8rbkNqb1FhZFIiQTBzJGlUa2lZMWNrK0s1Q2I5RC5SRklqRTUkbldrQzRRZmMiPCtDSlFTKSZwREdqQS9CV3NQTyolSz1fWT1uMVJaTDJVVTFfWjszVkFFWkchJmRMV1BwIlo4TyUybFI7SDRfU2NTWmExbl1uV2ZONGhWPWpDUC9uKmEiJC5EZDFITC4iVDpDLWcqaDFTL2tcbyZUTDwnJVAnP2daViguayU4LGNFbT0nLCZFVikiaGZhQTowKy1oT0lpRDgvdFxJTz8tJ0Uma0JcLUw6OEZpOyEqTWhSU1dNb1AscnEzRi8qLTsiWiNWW2AyUSVzNSlQNzlbZFhhJUEsWGE9XCc0WSJfVStmSGBVLlJoWUxsbCIsYnFSUjZeJnBxcChhcCNHYFBXcjBRNkpLRUdUYiZDQSwkQnIsMGhXSCkiNGY8VFE9ZFQ5SGd0SExIWWM0N29TVXA6akVAdV1GP2B1YS0vc3FMYkAzRFcwPzQib2IsVTosSGZ0JXJQbXNacVxCcWBZXXMjNEBCJk9KZypcb3AqTjBkPSVDWy0jKis+Ty5RamUrKzZabjRVLiw7Xl0jXkJwOWw8citYVyInJGY6YFRzJjgoR0c7Oj1VTFsrbjI2ZEtSVkBjX2RsRyE2aGovUU9UNUs4MyYqYmNuUD45dEFsUF09anI+OU5SQFhVUWRFaFFVUjxbc2xWcnUuIyIyNj4pP2cmNUcmWCFVXS5xaWtbclRfUytMKjFOY1pKMFRaN05VMF4wLS9oYlFjajpALENJKVtvO2NIN2ZrZ0RmQldfIXRdaiVbL0YhdEwpPTcnVC1oNyU6ciEuVkJlRmA4cUVFcnQpPEtjWDgqYnFSPyNPZk08UGFrIT5uQDQjTj8/c0Q4KzczdTdBRl5MXjFtJW0mRVEtX0xbPG5OZGo8YCknLS5SIjVPT0tXPVxYY1A+ZDpGamtCVEc7Q2wmWnBsNDcmM2hJIWovMVZjbW47PEA1OTEhSlFDMUszZjdmS1dzI1FGNT1xblFCcG0oRDI3Nig9ZWI5Jms0IW0+UjhCO1ZoUUE2XzdeRUM2JE9eLlVpQkJcNjQpT2RGS3F0LFd1YllHZUVJKzpIbWQ2bVJbUD9hVSF+PmVuZHN0cmVhbQplbmRvYmoKMzEgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTA0Ngo+PgpzdHJlYW0KR2IhU2toL0NkcyUiSV9RaVB1RCcvb2REV0k2cDw6MWw0QExiJC0vSzo7REV1U0NrajVJdWl1bV4jI21DbVIrWGtQQlVwMGZZOUMxNCNtXCc1P0BlOy9jaFAmRTpoOyk3OytsOVYzN0tzJTU0MyZhKSpeXEskJCZkMCVnbDBuampJITFzLEhhMjkpcEVNZG1uR2NPcz9TQSdHbzAzQmksWS5sOiU+cWkzQj5IdUl0J0JbSSRNLW0jK21KZzFobio2PC5DLmxtcEAzUklhQlNkJHAuYGtbTlMpJ0FEViZEclFIVjo/W243K3U6WzVISFluWVpBWlFaM3RKKzpGcU9Ya1VbK01CXF5EWHBTKWBrJk9JTDFjWzNbLDdSc1hHJiZUOlNBXFVnTFRyKE1fb0s0U0NQQVEzQl4uWkRJJThxIVNEL1Y1cUI/bDssLy51YVAmK10vWXAua0g+Y0VSaGQoa2AqQilWPHBHLW5bQCpHUlZtIU1tcGJIVjUrS2gtU3QjVUE5cVpoMDpKaVwkT2tOPDAoJk5UcmJWJU9BWXNYQmIhQz0oM0w4dV4zc1dmLSs1cGdXRTxDXkE1SGBwalohPUo2Y1Ina0AycEY2IVo+RFBfZmpPP15uKTIxXVNrcGghKHMpTGVPQEUmb1xKPzwzX1ZyXWA7WSJdNGFtJko3OSQ2KGNQT2shdD5OJGglPXFGc1RoR21dYydxUyk6IjZGL2tOXHJBXyRYIjhRL2RnIVlgYTw6P1BVTm0vbHNNPzNjJGtrYk9EbWRWI3BsbWxDa0o1IVIhbDd0ayJyK1NGcE4yIUw9WTxqJ1ssTSc6P1Y3SGhHIVVmRTFjIk9oJ0BeQmNvS0tJR0guKDZHcF1IQVppYCxKNU5EXio7OnE5WFEjKEo2YWhAOmNJSWUvPShJLEhVcil1STchOj0yJDFMM3NAVW1wXGc8X21pcS0+b2BXXS9TMU5hIXVXKVIvJkRoTEFnWmddVmA4OFBTPEkoYmZvZnAxQElBOFdnOWYmMFg0cnVRMUxhQk43WVBLUj1zaVNaKDdGOWYvRjw3OTdcQFlAbSRZKy1YIVQyKyYzWzlMW1E/NkdFQDRNTmosJGVWSiNwVVNvOjEqJiMyL0JgSF0pciNMMjVGcURZQFhpPlxkcFMwOXUpYzEmLD5ULlFwRGQmWUlQQztJRloxZUBKOSpxV1NjX1lGKmUrQi5zMiFGYjFmIjJdQk0xYSRIJkJvazBSTjI2MFRPX28lbik3KixATnRhJ0Q4PDRsZjlbR2l1QG9fTG03OGNeP2xTQE5AOCdZRi9BVzdxNF5JOSxeTVROMXEySWwoSmRjVFVXYXIwV2UxdSElZ20nLFtIL1xcQ11MVGdMOWFPW08pLi9qOkJLXGs+fj5lbmRzdHJlYW0KZW5kb2JqCjMyIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDk1OQo+PgpzdHJlYW0KR2IhU2s5OTBgQCUpMSZrYURvP3BaXF1kR2pNMWRBaTUsWWJAakckVSI6MC40aS4raXByLS5LUW80VmkiZzc/dTlqYzhzJUI5Mlo7UmxZJ0BqNztzI11lUVxxRjhPTisjQTNhPyotR2VIcFpCYElhTG5RWE0raGo4JS83JUBESWIqWD9FZSFaUyNnYFYrRyhkX19CTjszVFAyWDliY0A5UF43NCojczRBTGkibmtlNUQqa1BdOmZnR2ZDX0plIjxyXVdEWTxoITY+R0dVdEUpKSIrV183PDYjJ1cnW1ZGPWBKQG1gWmhHcGVdXyM1RVQuWUBJWE8ramQmS1FlZUJBXDk2SVZHLCZRNkYiUVY+JzstImkiO1ZlZTVGVzdEXz4qNFVRPy8/cFJxSTUhPytSQHNdQi1sX1ksJS91OEd1dDNpRi8vU2RnWlRgUVI/YWBjPXNjLCopY1pRNllVMm8qTl5DOSQ1ZCVOZGxgSzYkM2xEWkRCWiloPV5kclxHbkg+dUAnTCkjVk1VVCI0P2dpYW81JG5scG9hRz9FJW1tVkJeUWhaXj9VSy5hYGJMISpBYUMmSTJDNkhoKWRkRC1MMmdVJGRqPWJgMzVUMUhXIlh1Yy5aSEhRVzVwLDVrKyVbUiNSZUtiJjQvXCVVIz5ILiMnJVQxJmVmST5QJSo0XyZkYVwpTWQ5SyoxI0lRQS1WWFMkaWc0QS1NLGFIKEB1dC5ySSdeTUI5Lz5QV20uV3NPbitvJ0I7dV1bWURoWiQ9MiZiNVFpM1tiRklET21iWm40XEBYO0A3ZmEnPzJCIjxMOE1EQksvJWg1PlFIJmdjI19fbFZ0QShdJGFEWCNPRlFlVkE7cnBTLFtXS0NCJCd1JEdLSzs/MVhjdGI+TWZEKWBkSz1jJSQsWWpNYDtgPz8qYmZfY207bEFRTkRHNVZZREcxWT5ERzYxUlxoVjAjXTVjNFI2XTQhRlstaUx1KGIwLltCbFM4RFdgc1osKVZRJi4zT1RSPlEjOTlWaUA/cWdGTEondERuOF1eW0hkdDQyPWpQdT1LV2hlRGFNZFRRX1JnQjlAXXQhZjhQYHMpRExlXjA/O3IiSEdMSD1DOWQzKlFdbjdELytQNlYsMEYuPFtabmRGIjtyWj9Maz1kc1I2QlwmJV0lJGdYdVw4XEZSOnFHWjFCaDM2IyVRNjo/OCItS1hrIypPVS1raU9jWVssTHRwJmBWYEU6SypHSmo5QmNgVnRAdDMwW1BUTUpJXkouRG4lcGI0VG1Kfj5lbmRzdHJlYW0KZW5kb2JqCjMzIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDEwODYKPj4Kc3RyZWFtCkdhdUhLOWxKYz8lKSlPPmtkR1I6Ki9VSTpxbVpaMjBBQnArRztDb2UhT2NFMiMmSydnNUNdSVNKJkg/JkckM0ZJLjpcM14nTVVnPzdWVmpobkBebjNvdCIpVlttaDYzaCVzWSQtSW9lLkRuOmgwUyRcR08yJl1KPWkxNGkzPTFtbCcqVlhHdFhVUFpCKzpHR1YoPD5FczI1QjlVWCIyX0s9NUQldWhxa3U1biJWaiM0ZCQ7MFpGWiE4ZHQ9cGNsRFpBMUhAXS4lLSIxYjNMNF86VkYpV0gwRzxSV1BaYWIsSCVFVUVxUj1KJ0JuOU8rS0FjTllaa2hNZCRZYykzPS1HWChSITFUJ1MoM0ReNEA9XUlWY0ZqK1cjJW5eOUNMKGZRNTRfYnBZNVw4WUxYWERzaixOMG1sOGtmaFo7RjQ7MGEsZGNdXElTK21MTDlJaW1FYGhtV3VdZS4tSUg0YSYoQEpTP05Obm9jXVRWP29dSSNMJGZIVERqIUpbcEdiODRXZkw7MlkrRWQ0Xzs9OD9GWi0/XEtsaDlSPUFGWGxSLDdKRmAnWDo4VEFzQnBGS1NUQVNvSSNiWV0qMl0uYiU/KT1VOWZZSERHZ0wvalxAPzo6amIwOnJGXlxmPnRFXWpMWyEuWjM+J28oUyhBJCpaXCJsQ00yMD9bbDtpdWInSVcnTTtfOTZDbSlOOS9FdGtNOSJ1ciRDSl1BIjhYRT8vPE1JKlVcNTBdOjYqLTZXMVE+TUNobCxvRi91aUFXbzdKc2ZKXVNhbDpZbE5lQyoxdExKbWFzNClyZmFUaGw7X0ZiLVlKVUVocXJrNkNKW3JLaTRSO0oxT3RBa1ElcjJVQS1INGVTayJCJDNCZCNRXEU0I1JyZSkyYDZcWk9LTDIialxUTFNXNEUkbVBca25taUpjNVRyP1dxXlA2W2FcREI8ZSYyKzVQISFaPm0sZE42P3NTbCQ6cClKQTouRlxcUDM3KEQoMkVYcml1am8mYjVtcVhSa2klcyxKOS1PPEgzJnUmKWA2QEs3PCc0TjZMVFkmXHFMbzk/X2RUbCxmSzpRakhEaWshbTFQZGdbS3Mxb0omSGtuJy1dJUFCPCFMOVMsKFtabGY9Q3Rocyg/WS9JbkRAWj9gNj1SSiZZUjJGb3I4QVlWaGEhXG4mTyNcQDJAJCQ2cTo/bytbXTA3V11lWD8wR1pPSUtTYUtucTInJWQxJlEzW2pCbTpYJkRETmM4Lz1pQyxRIVZDLiltWUdtNFNwR208KFkhSnVoLG8qZFtMaypgMCVXZj86R1txUUBIYGZQUyZnNVNxJkhEXyVDQDE3Ii9KJCI8SnJZUzsuT2dNTyg5M0xqa1ooQTtAMDp0Y1A/Wy5CLy87biQuNF4tKj5qT0loUy1AMlY2YWdiSmNHYExXPWtNYT1ab1srVmFXcjt1XEcmInF+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDM0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTE4IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKMDAwMDAwMDQyNiAwMDAwMCBuIAowMDAwMDAwNjI3IDAwMDAwIG4gCjAwMDAwMDA4MjggMDAwMDAgbiAKMDAwMDAwMTAyOSAwMDAwMCBuIAowMDAwMDAxMjMwIDAwMDAwIG4gCjAwMDAwMDE0MzEgMDAwMDAgbiAKMDAwMDAwMTYzMiAwMDAwMCBuIAowMDAwMDAxODM0IDAwMDAwIG4gCjAwMDAwMDIwMzYgMDAwMDAgbiAKMDAwMDAwMjIzOCAwMDAwMCBuIAowMDAwMDAzNzMxIDAwMDAwIG4gCjAwMDAwMzcwODQgMDAwMDAgbiAKMDAwMDAzNzMxMyAwMDAwMCBuIAowMDAwMDM4NzU1IDAwMDAwIG4gCjAwMDAwMzk4ODYgMDAwMDAgbiAKMDAwMDA2ODYxNyAwMDAwMCBuIAowMDAwMDY4ODQ2IDAwMDAwIG4gCjAwMDAwNjk4ODcgMDAwMDAgbiAKMDAwMDA2OTk1NyAwMDAwMCBuIAowMDAwMDcwMjg2IDAwMDAwIG4gCjAwMDAwNzA0MDQgMDAwMDAgbiAKMDAwMDA3MTY2NyAwMDAwMCBuIAowMDAwMDcyNzUyIDAwMDAwIG4gCjAwMDAwNzM5NDggMDAwMDAgbiAKMDAwMDA3NTQ1NiAwMDAwMCBuIAowMDAwMDc2NzYwIDAwMDAwIG4gCjAwMDAwNzc4NDAgMDAwMDAgbiAKMDAwMDA3OTI4NCAwMDAwMCBuIAowMDAwMDgwNDIyIDAwMDAwIG4gCjAwMDAwODE0NzIgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8NWE5ZTRhYzVlZDE2MDAxNDBmMjAxNWJjMjQ4NmRmOTM+PDVhOWU0YWM1ZWQxNjAwMTQwZjIwMTViYzI0ODZkZjkzPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyAyMiAwIFIKL1Jvb3QgMjEgMCBSCi9TaXplIDM0Cj4+CnN0YXJ0eHJlZgo4MjY1MAolJUVPRgo=", "u2": "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiswIDE2IDAgUiAvRjIrMSAyMCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQ29udGVudHMgMjQgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgMjUgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNSAwIG9iago8PAovQ29udGVudHMgMjYgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNiAwIG9iago8PAovQ29udGVudHMgMjcgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNyAwIG9iago8PAovQ29udGVudHMgMjggMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKOCAwIG9iago8PAovQ29udGVudHMgMjkgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKOSAwIG9iago8PAovQ29udGVudHMgMzAgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL1BhcmVudCAyMyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL0NvbnRlbnRzIDMxIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdIC9QYXJlbnQgMjMgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFu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MCAyMjQgMzIzIDQ3NCA1NTUgNTU1IDkyMSA2ODAgMjc4IAogIDMzOCAzMzggNDY3IDU1NSAyNzggMzQ3IDI3OCAzOTIgNTU1IDU1NSAKICA1NTUgNTU1IDU1NSA1NTUgNTU1IDU1NSA1NTUgNTU1IDI3OCAyNzggCiAgNTU1IDU1NSA1NTUgNDc0IDk0NiA2MDggNjU3IDYzOCA2ODggNTg5IAogIDU1MiA2ODkgNzI4IDI5MyA1MzUgNjQ2IDU0MyA4MTIgNzIzIDc0MiAKICA2MzMgNzQyIDYzNSA1OTYgNTk5IDcyMSA1NzUgODc4IDU3MyA1MzEgCiAgNjAzIDMzOCAzOTIgMzM4IDU1NSA1NTkgNjA2IDU2MyA2MTggNTEwIAogIDYyMCA1NTQgMzI1IDU2NCA2MDcgMjc1IDI3NSA1NTIgMjg0IDkyNiAKICA2MTAgNjA2IDYyMCA2MjAgMzg4IDQ2OCAzNzcgNjA3IDUyMSA4MDIgCiAgNDk4IDUyMSA0NzUgMzM4IDI3MCAzMzggNTU1IDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAw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MDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDQxMSAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgCiAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgNTU1IDQxMSAKICAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIDEwMDAgMTAwMCAxMDAwIAogIDEwMDAgMTAwMCAxMDAwIDEwMDAgXQo+PgplbmRvYmoKMjEgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyAyMyAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjIyIDAgb2JqCjw8Ci9BdXRob3IgKFwzNzZcMzc3MG4wczBcMzU1MFwyNjApIC9DcmVhdGlvbkRhdGUgKEQ6MjAyNjA5MTMyMzM5MTErMDknMDAnKSAvQ3JlYXRvciAoYW5vbnltb3VzKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNjA5MTMyMzM5MTErMDknMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIFwob3BlbnNvdXJjZVwpKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAoXDM3NlwzNzcwbjBzMFwzNTUwXDI2MFwwMDAgX1wyNTFcMTc3XDMyMlwwMDAzXDAwMDVVT1wwMDAgXDAwMEIpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKMjMgMCBvYmoKPDwKL0NvdW50IDEwIC9LaWRzIFsgMyAwIFIgNCAwIFIgNSAwIFIgNiAwIFIgNyAwIFIgOCAwIFIgOSAwIFIgMTAgMCBSIDExIDAgUiAxMiAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjI0IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDEyMzEKPj4Kc3RyZWFtCkdhdFUyXzJkOy8lKSlOZ0ZQTzZSLEVcNU9cSFlUT2wpIWU+W1FrPzJVZF9PbStUOz0taF1udSotXzIsc1A5IlU6Z0VbazA1I0VwXWomYzBZZG48OlRjS1k5PCxvJyM3OlQ7dV1sMjRLVkdbQm1QJHJhTD5BUE0+KD1OXkFfZFYxM2xDYGFePi9lRVJeYCNvZkMrQzFcK2JVNExoVj1TJ1lyN3VqNHBZSENiMENoQnBLJVBkXkNNMFU8NHUiPTUkQGlKKyEwbVMsKWwpKmYsPExWZyJAN0o8J1RxOlZyNUVDUko3PyEoJV47UmxNLTszSjw6L29SY2EjZTRrRHMrUlhRLW5aPWU0LEdcdXAwJjdjNSdEJ3MoYChXJ1hSTTZdbUhTK2csJSklMUI8OjswJUMqTGQyWWBPOihnMyVLXXA0QGR0KFhiSkwvUmk5KGdyL1YjSVBbTTdBZUJTKXQ4ISFDMVAoPDpoLkowOSwnbnErZUskKTRhdSVsPGRNQ2Q2cyhmcyxdXTE5UVNhYmFvUUk+Y180LScyYC0mWFtdW0Q2PDNLXVU5NyJuNEJiVHAuZzRyTFtGLzJZWGcpdSdgcCp1NVpmN2VvNlEtLzVfWkdobFlkJSdSJEctWVcuVFtEI1tbTylrbyZLPDg7TDwvND1oY0xmXCJRIz5lYWhGYE5WZElaUlp0M3EpbkwkW01zRF8tSzZnZiw/RWA1OmwtNmBANFpUJTVGQkdmVkJkOjZyTjBwaTghVklHdGJUSWxNW0AuJ0RvJm9UMChYOScwXjpEaiVHdFdMIkNaIVJxKUlsRGkiXGwjdGBPKGJeTCxGSz9KMl08aG1JKlZmQyFeKVVdZE8/YDRuJjlNKE4yNFBVMyk3czB0UD5xbGdYO1dsMj1KYT9eOi5oVVY6QWQ6WWlhOjFmYDgmJSgyV1tdSFwva0N1LUppWzEnPz8zdDg0Pj4vR2FiQDwtWk4+YiozQD86ai1wQVRuY0pqOS9uMVZvT2Y3KEZCYz8/RFUsL0dEVyMzK2JnJF0lUF9wVUQwTUI7bk1mcENFZCUuM29dV2JuZWdeRzQ7UzkyOixXN2ReTCMrOmwuIV8nUU5gJSVGQi4lPyRjOGYoN2dUJ1ImQFVbJ141T2FtblE+PCRZQissXm9xVHVZVEI/IilKcWA0RV9hVSk7dUBAdEdcIU4kOSFCRCdAXWoiIjEqWzEoIUAqIjhYTzFRWmZrUXNoTz4jK0VWQFROTjxFMV5vY3MiM2s6U25gZ09ZbyNhNEkvJV8haSxcSjZQM3MwXUZFKydyUWs7PEovV1NfOVtdbk0jUGdHXmV0RCpcdVoncVkwZC9JaWorWj4sSDI2Wi0lTT9LLT9hTjs7RmZjbz9QJihISDhpcCwrZnNoViI5J042UXVpZFh0aUdEIkRRTypWMGdOOmJsSk0wQSdhQy4hJUI6cyM1LVlEaEMuJEc0K2pbZ2VhO01FIUxYdW1WJU90ZkNYWVY4bT1kNig+UFZTYXJQc15dOUBJYms3MywvTFFbX1JuTytTSVg1I14zQjRFR2ZDRSZoN2BTbys2NDRQayhDODomUj1WTjZBZicpSUprMXEzLHArTl1qP2IqKiUyTE4+Ym8+VG00PjVlXD1sJ0Vufj5lbmRzdHJlYW0KZW5kb2JqCjI1IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDkxNQo+PgpzdHJlYW0KR2F0VTJhYz1rKSZBQDZXSHQ4P3BZMEJfRSw2OFQ1NWBVc2ROISdGWitNbigiR1wmczAmKUhJZjBzLW1EUz51PitYc0tiUW5ZPltUaUEkI18uR1ZWNzVUSFk+SltGI19JMTVTQSVkVlY8PFBvQG85VFFGPVtvZ2FpYkhdZDhSVVtUSzZOaitwSy1XdSdCRz5tVnJjT1RXTD9ac3RmSyNpTXAvckJOLT1FJEk+QlpyYShFPSZVIjxxayw3K0AkcUYtdUFUQGM/N2Jea2UmZl9ZailEP2VsMERPUywnZUZdc1ZgPXQ2by0wPnBpOCNwTyhxK1VIQzZBVl11az5KUTFiKUgxUnEpLTE2TXJVWUc1KFBERFgsZlJKPVY4OS8jOFciKEo3MEtASGxEXXVjJj9JMG8mOFI0PTkhWGxAMkMxbnNGckM4c0AzUT9qRihWNDpaM3RjbEhBNCIsLDhwSXVyWG5rLidCJC43QzFHbT9ma3VfP25FWjlsNzZaNGJJV15yRDE+aEovQi8yPUJlPSI8Py1aL1VUIWNALy1Vb0dnNW9CRC4oYTYhRE5pMUFvOEg0VDt0TmEmbEc2PEAtMWtTXFdpTCxXYV9SJz5eQkZYbFlwNiQ5OSYvYikmSTVJckxETUJbbUEzQF1zWlU5WyUicl5UaDFkVy10Xk5mQ3RvbCUxTEVAIiFMN15oYkhtKWBXNWJGVTx1dC9JWGY5LVNOUGciMmctUjM4WC1YMVtgZ1hCJUQnX2l0SmBEXE8ubzRnTiglIU40bWFSR29XOzRqME40LEVEQzFocDEhXjIhKTJvUD0qZUpSPkVbUyJZJi1vJEdNXiciWEU3TG5MWHRCQVV0NEJcJStUZ3MpbFlbJz9WPjFIWjhRbE9iKnMlXFVzZGEmSV1DUS09PiheZE5VcCUwSE9ORWhTNGJYb2ovaGJkQD1PM0JSXnBlaCg8P0hEblFhNChCbyJyM1M8ZG8pIktCZVlVXWpncTRgJlpsZSpnXz9ENkNXdTxiaVcqPV5DXFBOVjItPThNZEtUPi1rQjw+IjtuM1s+b0RnWCopWCc8YGNDS1smUm42UmdqO11nYjtCKS8oTFchWyVHbCNabUddRWFkJ04wcD5BRyhwOEpNNWppck1uKC9GTjM9Yys8ZUwsWWJDIk4vZCk+QF5yQilqcE80V19aQjdjVFZpamtvJkFFQjpoOFpxWzgqcShJJX4+ZW5kc3RyZWFtCmVuZG9iagoyNiAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxNDYwCj4+CnN0cmVhbQpHYiE7ZDk5XEVuJSkxbisobWA1LyVWMEN0Tlk8SEEkblBZblloUjN0Zzs/a2o3SjBJXHM4UlRwZ0laXTwvVCNFQCVucj1mZU9mWzFROVhcdGkmbEY+cjRkYCNtZTVSVklMW3VcNDhlTTVtJVpaP2w8WUpsXGZVLjMwdFBjLTQkOmxSRShzQ2g1Nz4xZkhaZU0iVEUtbTI3XGwvWyRvQmAmJ0tmYTVJSTdTcFxcaj8nZkpzSG1saztJYG1aO0IxQTRGV0tqX2MmKlArazQhIW1AQWY8KDV0bVVxImszNzBjZlhKYTxKQiFQbUhMXlRuYiNLYjJRbkYnXkhwUS5kP3FaIz5NUHBsM1hfZXFla11nayFLXGctOGpGOUFrUD1rUyo+JD8xaTcyaGBvXVddTSYzTFBDLV9CUjpvSzwsbnQlLCsjYFBOLWcxQTJvLShITl84Ky5ZOl1pKEspI0FYNi8tdFNwYjgrSVAjcT91L0FXW2Y1YCRWOXNuOy1HMzlEJUhDXVg5Y2pwP0ZVO05HLzFiNmFcaWxxWyNqN25fVFk6bzc7cmIsWXMnRFFbbyVEVUApc2wzTWwzLjI9ZWFFSClJWU0oRV1BVSk+aUxvLjxoRT4/O3BUZ0dtIT8wQ0x1RmkhS1wjdUZQQlU6YkQsQ11bNipMazxobFBHU04tYGpoWTQlLGtdYVFRX3UlJkhTKF5YOixNVyk9XE1kZG9kZiYhdW0qYGdGR2ojZCM8QmJSVHFFPkZwcl89JXNKai8za0FOaE86KlFzKTY0Qj9ha0pTM05kNlB0KSxpPjFbTGVKNDJvb0tbWm8pLUE0UWBNQkUqV11DcCM9V2VCWUMhSFlTbWEoPUdVRC90S2hwSVQkPmB0bHFXY1skY1UvaUZaRiszZy9LTXVMPU5SX3UlKWBWTWI9VzI5PU5tb01KUlFMcHNwIUM8PmldLSRsQD9xWjFvLlF0UVM+Ty5BVlFZYkloPzpQajJaWFcwMnJbMUovcTQ3Rz1kVmMyR0A/bUJKbEUiS2knUSRhVU83bkFgUWcnOGBnZyYnaVslIVAhRXI7XEA0MlY+VTxXNGZhMykrbj8mM2csVjxoVFY6OGsncGpFLDE2SSo8XHNMN2VuQ1l1LGFiZDZaWDZSOC1yNko9XW1ZUzJVMFZJPCY2M2RBTFUkX00sVzZgMmUkWkA+Ll1ESCkkYmgoLlIyP2NUXStVZFA1MlxkM1shP1hENjQqX19sZCFMITJmXkU9SCphY3A3bGQrNGprSWZhZFcob3B1WWdeRzQ7aygsbFknYXMjLj1aRSREJDdjbkkxJHRmdXM9N3FmMVM2aiE4aEQhWksmaHU0bkEyUDpqKVkwZ1srcUEwLVpFOU4xMW1IZTsvSyowSyFAM0gnOkNxVTZONCpHXVdVQ2JkaGwyLyVKQihlcjxoNyRtN2pmck1FMz10cDRkRGoxPCI4ZHUyY1RPNlIxKjw7WUNWKDwjJypvKDhGJXJTcURVSHVyZ3IoUUNbdWdPS1U/MWNDUG9jKEwjazhGSTIoPnNbS15mRWdEWG1WTFdKTEk+OCtdUkQsJC5nNHRQXHUra0M6NlIxJ2cvV2wxWHM9TiVeZUNUOypucmlLPzknLFlSXF1WSmBMMFJeST5rLCEnWEE3ciNHQiJSPWwjNUlXYF1sMzplWWdbPkY/UVwtbm1pXmZmRkYmVztkNVxTRjczVzMlVmNPJ3BPRDklL1gjUHJvKT8rak0iN2ZFZCM+N19WaSpSSD0/anEqSCQiSWRrVVU1THBgS1E7cEk/cDg6aFwlWUdSLGBuVUtrMWwmUC9JXDM1OEdFRDQlXzYnZlhWa0c8WG4wMyVbbTBlLTAhV2kiIjMqJSxcNCVqJm1cOnRkMVZRcUVGazgqKmlbYW4oMTBaayZLZ2dnWGFNLDZYJS5Cbzo+VnRcbVFWaDVDQCl+PmVuZHN0cmVhbQplbmRvYmoKMjcgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggOTAyCj4+CnN0cmVhbQpHYXUwQjk1aTxGJSkxbitiY3VcX05wWkAxLCpiZUk9cnJBcWFEaUw5LmZodUs4RlpXaWZVZzJwZ1lJXmQnalxAaS1LRURucW0tclQ/QEg7XltzUjtAI0J0RnElYVlbQipKPz5caVFmK1MpSGhqJDIkRE5WRWwyNCxpW1wvJ1xlZmVPSGEzKV42cjhQKUpkQDkmT1tQcHBmOVBZPERZVz1KUVZYa2JNQDhkJzMlZCo3MyFgKGZQIVpdUFZpXW1EYCJBcSNOaEE/bW09VzxuTEdwO1dVLjolTmpUTENzTnI4ImZUSydsL0M8cFYnajsyXk1nZXAzcCMwVzI5YVZiQ1FFLmFfdEJSY0hfTjcjVS5bT2E7IjxIInBmSWs5RSRhNmcwJ148TldmMSE2SzYlJ0BrN2wxOkQvaUEiaDFXIzlAV0RYLjloJVYvZkhXRkMqX189OzpYRG0vJEpAQW9WI0ttNWhlbC9bK2YmbjpFZDhCRzQ1Y0ErSEJZXj5KLj0qNE1DSEBOVj8vN24+cUg6OXRwJUlDNSk3U0hEZzhUPDtuVV44VDlxKkJJSEEyaFl0Z1pFXnRhW0s2Om1pLy4sa2R1UyVEYzcpK1NjYWkjWz5BQUQsQThHXVZQaC4xTHUpUXVAUHE7NDYqMW1SWyZwa3A8PU4rR11XcWNUQGs9IlEpaUxiZldEYHJRMFNfUiteTVNFWD9RWlwqLF5pUTAhOmExbzVfZWNYQ11CSWdiMCFnViZeaUQ7X20lR106XEZeTk9cSEMmITtBIk1gN21BaFUmblRuaVZDTTZKTT0ySW9DS2s3Uixnby03c184bigqJzsxS2tiWyVrYWRtLSw5JTAiaE5gOUIvc14sLVkwNl00XSxuJGdvUDBBWWIxJFhoJ1BBWEksXG1EYWhkcEJrUW5LQEtOcTQrYDIyMyVCZHJWSjZeLURBSi1gSXA5Oy1ZbTxuPUVQVltCT21tUzE7I0BhSSwkXTVzZll0RltHR21NNDQrKjU1QU5DJywhdFAyNURwI2VCbTU0OysmWTcnL2ZFXTlbcC1dT2c3I0ZXVS5JUyhebTRnLkQrO0YncF1OQEtKcGkiTilaJiguWC4+aV41WlhnUT5FNnEyV2ZsaGBxNWZpLzYtLEgmXXQrUE5oZ3FwRlgqUicnODVqJ19iOUhIR003SixuJ1pqNzpZNUxIMStkNCN+PmVuZHN0cmVhbQplbmRvYmoKMjggMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTMxNAo+PgpzdHJlYW0KR2IhI1w5NjFiJCUpMjI2bi1oR28zalo0P2JNTUAlbkAzRmdMM0lrWGcmX1JXcnIzI0BwOmVzU2dRNWl1QiYlJ0RYXFo3WillVV5PPmwmcl0yV2lsNSonXFBiSlFcS1xrQSt1T08zTjtHYFYzWmtsRmdtX1JgMV8+X0BiW15aNTc/NkhhcEg2bkgqJTxiT1pvYUpRRzc6UzxaMjFET1xVKFphYiZrNDMjV1VEc0Q/OzFpWDg4ZG1qaDo2cSo1R05mP1RISSsmREhubS5CLV1rSHUzQShjTUciV15dXmkuRCdDaHQhKkUjcVFZY0ZhTDgtTWZwQXMtKl5RckptQyxaVUxSQy0zYVQjbk1eLFVQV1dPSiJUYWBsYS8sPz5CR0NRNkdgRT5QY05wTFFJQ2RxbTJFX25lNz5QW09nWnFIQTs7VjFCbCFqcDw/cGVeMVYjNFA6aSE2XFFNWF5xTmk3SnUlWV9kRkRTRi1SVidgNms3X24zV0hvbDJzKyxXV3FpOD0jMS5ST0RrWzgtNSRRQWtOLUBrLzVRJT4jO1krXXFQYTZmOylFaExEVW9QMjtzNzRNaFVYRlZFX1JVQ0M/Z1R1ZSVuVk88SmNgUWlGJzZKKU9SU2dEUzBvckRQQm1pXDNwWmticlUmcT9zbl9AYWgrNyY9c15LKys+W1dbM3JNalRNcz1ndF1gUT1pL1x0aG0iUVMzW1poMnJpL1IwTTNlUyc3KGxFcW4qKmN1dSEpLkhjQGs4Nih0MmdYRFQqZEM9YCdtKUksOE9bbmQnPiYjVV49K3JxQ11JOjEoaixnQUlJSExHT0JtRm0qPmcyTzMwRkpqbFVEKWRxTjlYXGYxMF9vO09yP0owTSFwWzY/QW8yNVFPTSwmOEVUckVbPC8wSlB1MlFcZ14ndVJTWlRWMiwycmJuWzB0YSE7VENTMDE7SDFrcFskN09IPEIiJGh1MWJTXShGUE1JXGxaVjdjI2IsczpVWW43OjolM3BNS11INypmTFc0NVkjRTFcMy0zTF1FU3MiSkcoa2dUQSMrVEpOIUheW21rYkxxak4+WCtkaD9gZnNgRiheUlNkZkFnXTlFO0wwMGVtcmFeWj4nXW01b1RqTEJQb1NPcmNmdV42QUhYcWJIUWBrVz89bkMhdCtPKWJWUik8KGM3R3A7cFM1XnFeP14xRjcsWVtFPjlhR09oSjNWdU8zNHA6ZCpeakYzSDZwK0g4az4kb0t1PC9tZi5JRSdbPFRRQkZvSi9EcDJTcVNxJzplbSdjQC1aQztBJzhZXSptYlEqQDY3RDVySFF0ME1fbENsLkBRQzFTJ1Qrcl1ZWScpYyUtVCZEXTN0a2JKODdnWFdGY0ZrPUltdV9RLl0iLlZdZkxgc1RzJGhWTTcsMFdCbnVPMiVsPz9FUlw9RjdkKlNfVFlbPU4ibVxnbnBiPFZhKXNOQE5GJyMuND1bR3UrJC1UIl5JdEFoXyZHQGRsb3FSa1JPYVVZKjJsQnM1J1FuJj1uJjxyK2BAW18zVjFrYVMyNnVPNkUrc04nNSJfPygrZHReSkU5QywubHVsQUJRUlBPUSY7dCEnTVRvZlBqKT50WWZVYGBMcWAsTlZfQmVqNjpxXGdeZlFxU25IPkJzYWEuaT9bMj1cOWc1JHArM2N0PW8kbXFyP0wsKSo8Y09HOG80PjVcL0dmQlNlPDo5Rl9XWGEpOjlQWFQwSEo7W1hUJDRJLXIuOFJdNUtkWUpbL34+ZW5kc3RyZWFtCmVuZG9iagoyOSAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMDY1Cj4+CnN0cmVhbQpHYXUwQzk1aVE9JSkyVT8jakErIyEqPm1fYWhBTzs+XXM5NVVVUC1hZWVDSixALDpfVWdJRy0zLEFmY1QjaEQ2dS9XMV1iOSZEI0wtcXVxRHMtRlwkYzhwK0VmSS1qJV0yWmYjOjNCQF9VVFU+P1BEOzJzKUpyS2BUb2xSUFNlL3FvOjFLPzNYVVIuXEF1UmUqOEJrJ0BRN1NlQGNlL0VOXWlYJTNEPHFpM0o6MDU3ailhcTpAQ0k8ajBTXXVpSmlabWRQImhKb2coYEgqcSJtRlJTJVksIkkpdE06QmBsJGNecjs+S29UREg/XzxpMko1SE5EQVlfTCdMSDNlPnNJKzU3ZF8mQCg4Sz0zU0NPND01YlRSOjZfLCxuQFpodDpfKjlaTGpeQiclUWNXWnAiUjlPPjYjKFx1Vl4jZ1BgPFFeYCFFJVteJDkiPigyLHE2TSVfOzApWTZFLUBFOWlpREc1V1ZXODZLUSFFP1RMSj48NUBlW21wLnMpaDNuSVNGIkNRMy1Za2IlViNfbmVBSEEiT2JFQ3BRcS5CSjkhP1xNYURELzNDQVA1LCFSIkBMLHUiMCU7XlZbIXNYUkAiTGo1bSRqZFdYR1ohYHRxQlJJbiUzLFVEaGteUE5rTWg2JFsrbVZGJyVBW0JAbUAzZEFcaGtVXiIyOzY4KlA9M0hJUSlSN1NSa09HPT5EXF0lcEZpYVsqTGROJjZUPktYbE4ndV1WXzpRZEcrc3JZRDhCUSFWPnVmM2hCVjVTVEM3cj4mIyVBN0VNTGwxRTRsPSJsRXM4WCVEY2NNQj1qKWZyJHBhc1tjMFk4bzcnTy9PbjYzJUVvJk41KkdYVU07LjsnNk1cbj5SUyxNKUhwVGElK1NCby9RXV5oQGE6LEVfPV8xMTJgNVE9Jm1OVXVdNGMiLTAyWyVWbTRjTj1iTyE8Y2k+NC1HQ2dSQFZpVzpTNCh1WytgZUQyaWZbb1ZAYU5kUWc7Sy1sRF9dMEUpNClyO0RERmBVanRTUE02Y05YQFZia1VyLj4oPCo6MlMoJShRVDBmJzhhaWk1InAuJV0tRUFcYmkjUFIxL1stUl9uOCJKSGF1Kz0nXW86QztFQ0UxJVFSNyJTUTBqKlYuPUdsIyVTVzUwRFdAN20nKmsvT3VPNTduRXMxRDEjblwjOl5VQyk+KC5KR2lhMEMyZHRyc0dAPjotTyd1blkhOVtdOEA6JE5BW1UyRHNfaipBRktTIUNzSE9FSk5yRzNfOUspSVFSJT00V1VMTi9HSkpAPClFPUBQcyMjbFhdZWRIJTZRIkgxJyltKV5aLzJAXjRZQGtCL1QxLGprbldEZFhhaTI8bV0jOm8kNWY0Z2dDRk5TSEpcYWcmaUJuXzgyVjdyT21xaUI7VG1ETEZnTmw1dFQpNTc3fj5lbmRzdHJlYW0KZW5kb2JqCjMwIDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDEyMzIKPj4Kc3RyZWFtCkdiIWtzOWxDXCImQUBQOVF0JC8yWiJOdXM0XVFrO00kcE9ILCwjUjUoNmZHJiRdJztZYmgyZlRHMmw6c0VNQVNiPWcoIVtDcWtCT0NWZk1cbE1wTidec2EmP15VLkFcZzxYLzRtQFxrMDBBOzxcRCclc14vLj1na2FXcDxmcEkjbVctQjEvaylJcDwkMnJgdTBII0ExOyxgXHNnU3UzKmxyPGhyMGdVVWYmVVlMMlU6Nm9QcVtqVyxnVWs2VzAuQ2tRJTY8N1BKQTk0SF4yN3NtWTBOblE3SD1WRUUubVgibG5YITovPlMsX2IwbypyOCkzcVU1UUtrV1dlVT9LRWArcFhBJUA6YUFQakx1ay0xX0Q5JCs4cVBqJ0pMb11DVSMmIjI1ZnVQLFpvMkhDZ3IqTF9pQGk6bEpZPl5HWV8+WUBXJ19RQmYiKEBQNVJYazUkZjJxJGxqMjRyJjEwUVZXP0g4U0RgLHFJMzQ5N1s9WXJVMG9ENDFEbjdPUkFSUS0wNUYobzNTTm8xcjdUdXVLZGdsSylmS3RiQ0poayg3Lj1gMiMxalpsQ1xZNzdcViRzVWBISmpSL1FOOVo1MyxSOEhiNi9rMypRQCxnW0tUOzdsMmpUIXQxTTBRPCZOYFxJcEdgNXA6PFFOP01MLW9EMzNGQSpXIUdDW1lTMGheVF9hMlppOU1vIUhMLlZYaSReMHQ7VnUqSD9hVFVsXSpGaWp0OjRCYDFZYzZdRWlPY09QK0FaVDJyXWVsIixTMTguMV9RY0ojPCkwOE9vTk9kT2NLY0w1Y1IlXFp0ZkA8PV9yZT5JaC4hSjs7S20xb3M6SVFKUC8oXWA7UGIzOCZdLEIuVFMwTz5AWV1RKnFZZzkjTmpXbW0mJltWKz9cUCxvcylENSgqPT1lbz5APGhwdCM7cWFHSUArNkNaImZiZVJlPCYvYU1qdDY3ST9TPVw4LFAjXDNwRzRqW3Q/cFJPMyNIYURFVjBnUzttL3A1JXNRa1QxKypbJEdWVlswL1hob2UkYDw6YnNDWUYpaVN1OmY0dEE4QVtBVUEvQWE8YGNOIjg0I2BxWzdwMyZWQUFNYEcxRT5HUWNKbms5X1tfYThUYFszU142Y0tFI0c1Jls3QWsvIUlTTmhNQCEub0pUaHNlS1JLJy5WLTpdOztuSzZKJy5sZCo8SkkqVCNcalI2WmxWNm9COiRHajJMVCdJPlFRNV9NOTsrLldNLnQ6Xi5KUl9tLjhsRidAQldVVCRrQUlVaz5cUVVWLFhRJCJETT1zZiY8NiEvQCc5OEhKTWpgJFB1NUFQbmlXPGxDL2o7cFdfdDZaZk1WQEl0InE3bTdvcW03SEkyYj9aKmZcOmxwUDMjViVwcmclbDFbUTg0XlgwNyJqXUo9TXU4VipZakxFT18rYilgK1U3UiZsSDZTQGhRN2JxR1UtPVg8UjMscEdyPGNxcGx1P3UzV2w3QT1RUSJZbXFoNVJiby83NT5kWFQ2cjBiLGo7NSpHQiciJ1JScTNAYVl0WFNAdUY7LyQwTlNtN0xsdGpORzdbPiYicVpxb3I9Wis3PDclUHFuOyUwcm8rJGhIcDUpWjciVyxOXlxzMkovLlMjLXIzRiozOihQbF5wQEZhK34+ZW5kc3RyZWFtCmVuZG9iagozMSAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMDI0Cj4+CnN0cmVhbQpHYiEjWjlsSk44JkFANy5iY3E+OWcxKjM+LFlqVSk8SXQ9VzJjYDkiLSpVJjpVRl0mMnMjazo6a0A3cWE8UTFmOlZCJWFpSC9uRkFFQVQtQmxMOSMzLUcjX29gRzgyOkMlQE9yYnEyWkhkXTVyb0goQzcpOTtPQyM9XnJhQmEsSEBtWFElcz9XRFhZUzBFXFg4IzpqMz1ec2JuZjAkZTgmU0wyXF5jMF1yLGJDKjQtZnAkVVtvOS1wXy5fNmBvI3A5WyIvTyJdLCFaSyd0W1lMT1gjLGdgKG9lQ1gqcjsiRTBnXk9ASW1FaDsxPUpMMkgzbCUycyFTM3I/MFM7TSwlSEFsZmUnJUcwQ1FeXVRVKzEyPTFXLTokWmIoLigzKDVJZystT2NWLmlqM0NUJkgmP1QnSVdJPVZePnFBK0BjaDQ/YWg6R1JqNig2a1RbUGolMihSVjlwZHUhdTJZUD9yNFpWSTc5KEk+dHQ0bi9QWFEpSENpUyZnOEBqZzxdWjxRPERWOldHPzAoazNmS1YpImg8RT9ddVAldDMsN2Z0UnIiOUs6UEciPT5BKTZHYV44VylXblxDS05MX3JyYjFySTFxTHQ2YWNAWU1jJ0VQdTBTLlg6QFFXQmgsRHQpbGkwIjtPVTFcLkEiZ11fY0FNOkosaDxsJlcnTGsyaDxWWihrTGE/S1NsblxXQTIwcDM/NitoOStPNmgxPXNqKSVeJThvbSVRIVg9TFdOJzBITmVEblJhVSErcFNZQHRBQUdLWkllOjtQYT5RRmhRTkRlLUBdaFVNMT00LmstOihOZlVrTy9fcWtaZT1kMkZ1PVc+amR0bytlT2lrc25VPT9hbTtmWWc7TE1YOCpwQ2Y2K1YyckpVT2khOWRKXiZbaDY5RT4iVkpIaChFXVtrNGJNK0dPMUBbbWF1NjhcNjtfQCVUZUZIbSRUZkUzLzgnQzNYUVhsTk1JVE1DWlc0JVdrST1OWG87WWZWb0ImO0BjRl1tUmtRUE5kW29ISTRfZCtzb1MzXjlpLk9fP3UrOW9qNlJlaSdvYkhYOipYRGZjTmVCZl5OOmIzRUluakNSKlEkcGZBI0c2OChUPWQtbShTOGRnNi5hbEsnTFxcYkJiRScuSjlpWUJgTmVRKzIjaGo1PUZBcG0iYzFlIz9VaG5LTW1rVm1wMDFURW1UXSxuby5CQTNoZGFBUDNVZ0FTI00rZ15FXXVWSS9yMmxsXmlyQWFNR0FkQDZfb2ZHazpyaFFoYmdTQTxgWEwuQlNWJFJILTtqXkw1WVFgMSRGTzhSITA9I2RyUFtEcDlDIm40ZEdiNUdLTCIwQmlSLyU/ZkdrbWkxbElANUhRWVlVQX4+ZW5kc3RyZWFtCmVuZG9iagozMiAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxMDk0Cj4+CnN0cmVhbQpHYiFTa2JIQjtKJkRjTSJdUFAsVllpZkZCJFQ7JmYySmRtcixHRCtNK09sO1BYIixAZ0clUFJSZD9pKihYQ3NLWWA6aEVGTikqMV1CPDZKZHImbS5aRjInTlc/VEkvXmxvbD1YL1hiRTZvNWBJKFxCQE8lOVA7Yz4qYjZTUGFbamRkQCszaVNAJygoRTBiYmllKEB0dTlgSCwnTW1eSGcmYFUnMSVqcG8zXEVoRDpCJHBZQCtGblFmT2JaXk5LMDRVaG5kLjY+MDsmQkFbI3JuaXNKOSlVYEQtVGFCPlcxYCFTL0xDWDVnQzsrX2orJF8hKF1ESz5BSixDN0NzdTZAVGROZl9Da09jWkQvS0FTSlklKzhEMV43QGtuOEtIZiktcVpdKlR0cVllbUtTMksocylfOjxgRC8oNGU6aGhdMlpHR19xWytxLSRfLUA9KiIpb3MzVk5SXF9AK19XNytQXE9wcGYzM1MiXFd1Rk4wai5mYm89ST9gP1QyWDUzbXJYR1lzJSJgVmQwLT9TPiNaLyo5YDlgc1xXU1ExJC8pM2E4PGNbMG1ILUYiSkFJK2VpK2ldcE0lP2FSYS0vJy0hR3AhcV1ULDFHLjotIVBxKU41Vk9GOzIub2NTOkxPRU1bIiFcQEpjUDI8cmgxaU49TU9iNVlrK3UwMVlUSW1jLj5HNUYwRE1BY25LWHI1O2wzRCVBKixGJzhkJDM1YkVKPFE0QW9ONHItNGxobV03VTNTTSk/VUVzakwlVShLcSlVTylzYkExSnFMN0QxQzZTPExUbVlEdGlBbldGZzZoQGo2SXMwL3JUSk5GViMhRCJNXyx0NHQwODg+QSxdRFVcTk1eMmNkanNDSGEjYj9ON2NkUWVvOUVqWy9DPnJoW1c4IS00KkojcDlAYyteWkIlQmdCdGhTcGw5al47SDhCcEA4OW1kVFQuJEppWz8tZyI/bylePStMLT8qNFhBVkRKKW1bbCc0XiZSYld1ZHItKzZHOmFPUmgxci8zZlFjPixQPSY7aSRYVm0pRGFFXTVFPGVGMiJubGonWyMrI15iWUhwO0ZzcmczUGszJTh0PyhFQUxWT2xfbFZLZFBQSyQ7S0crS2RRIlonVW1CW0toYnJiSFpDTEprOz1wdTZkP1EwVDFVRVw6QydqK0ppO1cnYGRJLVdVPHJOSG1OV01pZV1RK25eS0BEO25eMTtYPm5zN2BXKkteNzl0PVgsK0M5Q2sjL2shS2htIXBYVihjbWhdcFlqR1VgO2MtUDheMjg9Zk4iVGE2YD5RKVBcZGVBZVUrIzwrZlpRUzpycy9AXSU0PzluI2JHL0NjXV04Tjxub0VackduMlBiOD5tWUBfQiQ2cWpuRT1tVFJFS24wW2I7YlwmTWc3JSY7OElOT3JRIz1HIUk8P15tR2tLdWhxXXBCYjciM2hIYiFqPiIqcGJtWy9+PmVuZHN0cmVhbQplbmRvYmoKMzMgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggOTY2Cj4+CnN0cmVhbQpHYiFTazlsSk44JkFANy5wcGQudUM8cWsrakI7bCJFJTEtLiZlXkgwZDRRJyVxIlslNVNTXCNDRFY1dDc5ZiclO28+XWhSTT0kOEBjZnRKTVNNQmtDRjgqcnQ3cVZZSzM5ZUN1NUZBcTclZGdELSdldD5QWmVdJThoNGMzbVoiM0lZYyIqci8mOzIyLm5XM2EtJSpkSlRFZHFULTVLcmlHV1VDXEFiNGUxQVJ1KWdKMF9ISldNLWVAdW4jN204QHRIWGAtQUAkLyouaTYnN3JZVTZHPCU5L1gxNTgtVlcrIXQtYzJzQTUraFlvKSdBcEI+VC5aJFFMLCUxLjRrM0xZZ19BbzMpJTcjNjsmKiJbcFJ0WGJgYD9Da1dSSzdYXUFZVUlwOWZuajg4TWRnLTJGXV9hcztVX2syKUo6XG9vWV1gPytPTmkmO1c0XWglNClYcUhePFU9XzowaEFFQDlQTzlZZU0rM2lPTig4UGNIRm8xS2xMS1VKXztUKy1mLiNRNEQ8W05NP1hVZG90ZCwjNS8tSzdHITtBUSctaFtra0ZxK2NTSlUmJCtRX0RlNlE+bUMrbVpyaiVYImVsWXVqNzVXJGJcIWVxNTc2akImYFpLaTlpSG9FOVlUJS4wJVJwciRocTpzWi1vJlMvZCFnKVUtJnBWJEhHWnVIL0ZUJV9hJVlNKSNjSDJrVHVmUy49c3FxPUFkMGknazZiJSw5bypvSkJwcTMjdDcpdVNlWUlvNSgncDJeXEZFbjhDXlhyYDopUGRsI2JiUkdZUmg7XUVjOnEvQkhINyNUKSlYL0pMaG0hQ3BvTCNCdWJGNCZuNjAhWk5ia09eVi08M0ArSTNGOCpLczFmWW4kcSwiXGA0STprOC1xYSonVypxNHVYazhuSlpASlQwMWUqcGlAYGFgYE5SZ2RlO2NeXXFuJUdqLz1naGwvIztlYD8rSD5NYWZhVltlI2EsRS1jNzI6PEhJZFs/cFNWVW40c2stS2VRW3BQQVttNV1XQ1gkRXFCTS9cQ08xQVFQXERMakolQUJnWXNNcDNsOEY7RSN0bjNjPSdaND9BO1tqbGhnISdqKCc2ZmtVSitGOl5NYjdnR2FgWWBcU0ppOTI8TWIwX0FKYjFgcExdSWRXLERiUy1KRV02P3NwKz9xZl9dN0FNcyNDO1RNU01TT2dYcTlaNydRZlAzdDovVWNQNiNTX29OW0FbIVJASzg6XFlOSCE4cGJZLGReQE5iY1tETD1iWUxFI0UhTi9kR0dsZSw5ST1KKW8vfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAzNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExOCAwMDAwMCBuIAowMDAwMDAwMjI1IDAwMDAwIG4gCjAwMDAwMDA0MjYgMDAwMDAgbiAKMDAwMDAwMDYyNyAwMDAwMCBuIAowMDAwMDAwODI4IDAwMDAwIG4gCjAwMDAwMDEwMjkgMDAwMDAgbiAKMDAwMDAwMTIzMCAwMDAwMCBuIAowMDAwMDAxNDMxIDAwMDAwIG4gCjAwMDAwMDE2MzIgMDAwMDAgbiAKMDAwMDAwMTgzNCAwMDAwMCBuIAowMDAwMDAyMDM2IDAwMDAwIG4gCjAwMDAwMDIyMzggMDAwMDAgbiAKMDAwMDAwMzcyOCAwMDAwMCBuIAowMDAwMDM3MjM0IDAwMDAwIG4gCjAwMDAwMzc0NjMgMDAwMDAgbiAKMDAwMDAzODkwNSAwMDAwMCBuIAowMDAwMDQwMDQxIDAwMDAwIG4gCjAwMDAwNjg3MDYgMDAwMDAgbiAKMDAwMDA2ODkzNSAwMDAwMCBuIAowMDAwMDY5OTgxIDAwMDAwIG4gCjAwMDAwNzAwNTEgMDAwMDAgbiAKMDAwMDA3MDM4MCAwMDAwMCBuIAowMDAwMDcwNDk4IDAwMDAwIG4gCjAwMDAwNzE4MjEgMDAwMDAgbiAKMDAwMDA3MjgyNyAwMDAwMCBuIAowMDAwMDc0Mzc5IDAwMDAwIG4gCjAwMDAwNzUzNzIgMDAwMDAgbiAKMDAwMDA3Njc3OCAwMDAwMCBuIAowMDAwMDc3OTM1IDAwMDAwIG4gCjAwMDAwNzkyNTkgMDAwMDAgbiAKMDAwMDA4MDM3NSAwMDAwMCBuIAowMDAwMDgxNTYxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPGVkNDAwZWYzOGNmMGQzZDZhMWI4OTI0ZjUzNTc2MjRlPjxlZDQwMGVmMzhjZjBkM2Q2YTFiODkyNGY1MzU3NjI0ZT5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gMjIgMCBSCi9Sb290IDIxIDAgUgovU2l6ZSAzNAo+PgpzdGFydHhyZWYKODI2MTgKJSVFT0YK"};
function septReviewPdf(session) {
  if(!["u1","u2"].includes(session.uid))return json({error:"not available"},403);
  const data=SEPT_REVIEW_PDF[session.uid];
  if(!data)return json({error:'not available'},403);
  const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:{...CORS,'Content-Type':'application/pdf','Content-Disposition':'inline; filename="nobilog-review-35.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}

// Immutable, authenticated migration archives. Main records are never replaced by an archive upload.
async function recordArchiveApi(request,env,session){
  const archiveDigest=async raw=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');
  const prefix='record-archive:'+session.uid+':';
  const load=async id=>{
    const base=prefix+id,rows=(await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<?').bind(base,base+'\uffff').all()).results||[];
    const manifest=rows.find(x=>x.k===base);if(!manifest)return null;
    const m=JSON.parse(manifest.v),parts=new Map(rows.map(x=>[x.k,x.v]));let raw='';
    for(let i=0;i<m.parts;i++){const p=parts.get(base+':'+i);if(typeof p!=='string')throw new Error('incomplete archive');raw+=p;}
    if(await archiveDigest(raw)!==id)throw new Error('archive checksum');
    return {...JSON.parse(raw),at:m.at};
  };
  if(request.method==='GET'){
    const id=new URL(request.url).searchParams.get('id');
    if(id){if(!/^[a-f0-9]{64}$/.test(id))return json({error:'bad id'},400);const saved=await load(id);return saved?json(saved):json({error:'not found'},404);}
    const rows=(await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<? AND length(k)=?').bind(prefix,prefix+'\uffff',prefix.length+64).all()).results||[];
    return json({items:rows.filter(x=>/^[a-f0-9]{64}$/.test(x.k.slice(prefix.length))).map(x=>({id:x.k.slice(prefix.length),at:JSON.parse(x.v).at})).sort((a,b)=>b.at-a.at)});
  }
  if(request.method!=='POST')return json({error:'method not allowed'},405);
  let body;try{body=await requestJson(request,20000000);}catch(e){return invalidBody(e);}
  const names=new Set(['appData','wrongNotes','ekStats','ekSeenReading','motiDaily','hwActivity','hwSelf','gameState','money','money.bak','money.bak2','money.bakDay','moneyResets','flowerLog','examDone','examReviewDone','examWrong','examMistakes','examHistory','examResume','examCertificates','preferences','loginDays','noticeRead','releaseSeen','noticeArchive']);
  if(!body?.keys||typeof body.keys!=='object'||Array.isArray(body.keys)||!['device','backup','conflict'].includes(body.source))return json({error:'bad archive'},400);
  const keys=Object.create(null);
  for(const k of Object.keys(body.keys).sort()){
    if(!k.startsWith(session.uid+':'))return unauthorized();
    const part=k.slice(session.uid.length+1);
    if(!names.has(part)&&!/^(drill|schoolTestScope|schoolWorkbookDone|exam):[a-zA-Z0-9_-]{1,100}$/.test(part)&&!/^september2026:draft:[0-4]$/.test(part))return json({error:'unsupported record'},400);
    if(typeof body.keys[k]!=='string')return json({error:'bad record'},400);keys[k]=body.keys[k];
  }
  const raw=JSON.stringify({keys,source:body.source}),id=await archiveDigest(raw),base=prefix+id;
  const bytes=enc.encode(raw),decoder=new TextDecoder(),parts=[];
  for(let i=0;i<bytes.length;i+=600000)parts.push(decoder.decode(bytes.subarray(i,i+600000),{stream:i+600000<bytes.length}));
  const at=Date.now(),stmts=parts.map((part,i)=>env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING').bind(base+':'+i,part));
  stmts.push(env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING').bind(base,JSON.stringify({at,parts:parts.length})));
  await env.AUTH_DB.batch(stmts);
  const saved=await load(id);if(!saved||!cloudKeysEqual(saved.keys,keys))throw new Error('archive verification');
  return json({ok:true,id});
}

async function loginDaysApi(request,env,session) {
  if(!['GET','POST'].includes(request.method))return json({error:'method not allowed'},405);
  const prefix='login-day:'+session.uid+':';
  if(request.method==='POST'){
    const now=Date.now(),d=new Date(now+9*60*60*1000),day=d.getUTCFullYear()+'-'+(d.getUTCMonth()+1)+'-'+d.getUTCDate();
    await env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING').bind(prefix+day,String(now)).run();
  }
  const rows=await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<?').bind(prefix,prefix+'\uffff').all(),days={};
  for(const row of rows.results||[])if(Number.isFinite(Number(row.v)))days[row.k.slice(prefix.length)]=Number(row.v);
  return json({days});
}

const SCHOOL_CALENDAR = {"year":"2026年度","leadDays":5,"events":[{"id":"school-2026-09-01-1","date":"2026-9-1","title":"2学期始業式","summary":true,"remind":false},{"id":"school-2026-09-02-1","date":"2026-9-2","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-03-1","date":"2026-9-3","title":"避難訓練（不審者）","summary":false,"remind":false},{"id":"school-2026-09-04-1","date":"2026-9-4","title":"専門部","summary":false,"remind":false},{"id":"school-2026-09-09-1","date":"2026-9-9","title":"代表委員会","summary":false,"remind":false},{"id":"school-2026-09-11-1","date":"2026-9-11","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-14-1","date":"2026-9-14","title":"職員会議","summary":false,"remind":false},{"id":"school-2026-09-15-1","date":"2026-9-15","title":"定期テスト","summary":true,"remind":true},{"id":"school-2026-09-15-2","date":"2026-9-15","title":"学級演説","summary":false,"remind":false},{"id":"school-2026-09-16-1","date":"2026-9-16","title":"定期テスト","summary":false,"remind":true},{"id":"school-2026-09-16-2","date":"2026-9-16","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-17-1","date":"2026-9-17","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-18-1","date":"2026-9-18","title":"立会演説会","summary":false,"remind":false},{"id":"school-2026-09-21-1","date":"2026-9-21","title":"敬老の日","summary":false,"remind":false},{"id":"school-2026-09-22-1","date":"2026-9-22","title":"休日","summary":false,"remind":false},{"id":"school-2026-09-23-1","date":"2026-9-23","title":"秋分の日","summary":false,"remind":false},{"id":"school-2026-09-24-1","date":"2026-9-24","title":"立会演説会・選挙","summary":false,"remind":false},{"id":"school-2026-09-24-2","date":"2026-9-24","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-25-1","date":"2026-9-25","title":"英検","summary":true,"remind":true},{"id":"school-2026-09-28-1","date":"2026-9-28","title":"3年三者面談","summary":false,"remind":false},{"id":"school-2026-09-29-1","date":"2026-9-29","title":"3年三者面談","summary":false,"remind":false},{"id":"school-2026-09-30-1","date":"2026-9-30","title":"選管","summary":false,"remind":false},{"id":"school-2026-09-30-2","date":"2026-9-30","title":"3年三者面談","summary":false,"remind":false},{"id":"school-2026-10-01-1","date":"2026-10-1","title":"3年三者面談","summary":false,"remind":false},{"id":"school-2026-10-02-1","date":"2026-10-2","title":"3年三者面談","summary":false,"remind":false},{"id":"school-2026-10-03-1","date":"2026-10-3","title":"構内美化作業","summary":true,"remind":false},{"id":"school-2026-10-04-1","date":"2026-10-4","title":"構内美化作業予備日","summary":false,"remind":false},{"id":"school-2026-10-05-1","date":"2026-10-5","title":"任命式","summary":false,"remind":false},{"id":"school-2026-10-06-1","date":"2026-10-6","title":"3年確認テスト","summary":false,"remind":false},{"id":"school-2026-10-09-1","date":"2026-10-9","title":"全校集会・表彰式・前期通知表配布","summary":false,"remind":false},{"id":"school-2026-10-12-1","date":"2026-10-12","title":"スポーツの日","summary":false,"remind":false},{"id":"school-2026-10-13-1","date":"2026-10-13","title":"市一斉登校時避難訓練","summary":true,"remind":true},{"id":"school-2026-10-14-1","date":"2026-10-14","title":"1年安房再発見","summary":true,"remind":false},{"id":"school-2026-10-14-2","date":"2026-10-14","title":"2年職業体験","summary":false,"remind":false},{"id":"school-2026-10-14-3","date":"2026-10-14","title":"3年修学旅行","summary":false,"remind":false},{"id":"school-2026-10-15-1","date":"2026-10-15","title":"1年安房再発見","summary":true,"remind":false},{"id":"school-2026-10-15-2","date":"2026-10-15","title":"2年職業体験","summary":false,"remind":false},{"id":"school-2026-10-15-3","date":"2026-10-15","title":"3年修学旅行","summary":false,"remind":false},{"id":"school-2026-10-16-1","date":"2026-10-16","title":"1年安房再発見","summary":true,"remind":false},{"id":"school-2026-10-16-2","date":"2026-10-16","title":"2年職業体験","summary":false,"remind":false},{"id":"school-2026-10-16-3","date":"2026-10-16","title":"3年修学旅行","summary":false,"remind":false},{"id":"school-2026-10-19-1","date":"2026-10-19","title":"職員会議","summary":false,"remind":false},{"id":"school-2026-10-23-1","date":"2026-10-23","title":"専門部","summary":false,"remind":false},{"id":"school-2026-10-28-1","date":"2026-10-28","title":"代表委員会","summary":false,"remind":false},{"id":"school-2026-10-30-1","date":"2026-10-30","title":"文化祭","summary":true,"remind":true},{"id":"school-2026-11-03-1","date":"2026-11-3","title":"文化の日","summary":false,"remind":false},{"id":"school-2026-11-04-1","date":"2026-11-4","title":"一斉研","summary":true,"remind":false},{"id":"school-2026-11-06-1","date":"2026-11-6","title":"漢検","summary":false,"remind":false},{"id":"school-2026-11-13-1","date":"2026-11-13","title":"数検","summary":false,"remind":false},{"id":"school-2026-11-16-1","date":"2026-11-16","title":"職員会議","summary":false,"remind":false},{"id":"school-2026-11-20-1","date":"2026-11-20","title":"専門部","summary":false,"remind":false},{"id":"school-2026-11-24-1","date":"2026-11-24","title":"定期テスト","summary":true,"remind":true},{"id":"school-2026-11-25-1","date":"2026-11-25","title":"定期テスト","summary":true,"remind":true},{"id":"school-2026-11-27-1","date":"2026-11-27","title":"生徒集会・表彰式","summary":false,"remind":false},{"id":"school-2026-12-01-1","date":"2026-12-1","title":"三者面談","summary":false,"remind":false},{"id":"school-2026-12-02-1","date":"2026-12-2","title":"三者面談","summary":false,"remind":false},{"id":"school-2026-12-03-1","date":"2026-12-3","title":"三者面談","summary":false,"remind":false},{"id":"school-2026-12-04-1","date":"2026-12-4","title":"三者面談","summary":false,"remind":false},{"id":"school-2026-12-07-1","date":"2026-12-7","title":"三者面談","summary":false,"remind":false},{"id":"school-2026-12-11-1","date":"2026-12-11","title":"フリー参加・家庭教育学級","summary":false,"remind":false},{"id":"school-2026-12-14-1","date":"2026-12-14","title":"職員会議","summary":false,"remind":false},{"id":"school-2026-12-15-1","date":"2026-12-15","title":"確認テスト","summary":true,"remind":true},{"id":"school-2026-12-16-1","date":"2026-12-16","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2026-12-18-1","date":"2026-12-18","title":"専門部","summary":false,"remind":false},{"id":"school-2026-12-22-1","date":"2026-12-22","title":"代表委員会","summary":false,"remind":false},{"id":"school-2026-12-23-1","date":"2026-12-23","title":"2学期終業式","summary":true,"remind":false},{"id":"school-2026-12-23-2","date":"2026-12-23","title":"表彰式","summary":false,"remind":false},{"id":"school-2027-01-07-1","date":"2027-1-7","title":"3学期始業式","summary":true,"remind":false},{"id":"school-2027-01-07-2","date":"2027-1-7","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2027-01-08-1","date":"2027-1-8","title":"給食開始","summary":false,"remind":false},{"id":"school-2027-01-10-1","date":"2027-1-10","title":"成人の日","summary":false,"remind":false},{"id":"school-2027-01-13-1","date":"2027-1-13","title":"予餞会","summary":false,"remind":false},{"id":"school-2027-01-15-1","date":"2027-1-15","title":"英検","summary":true,"remind":true},{"id":"school-2027-01-18-1","date":"2027-1-18","title":"職員会議","summary":false,"remind":false},{"id":"school-2027-01-20-1","date":"2027-1-20","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2027-01-22-1","date":"2027-1-22","title":"専門部","summary":false,"remind":false},{"id":"school-2027-01-22-2","date":"2027-1-22","title":"漢検","summary":false,"remind":false},{"id":"school-2027-01-27-1","date":"2027-1-27","title":"代表委員会","summary":false,"remind":false},{"id":"school-2027-01-27-2","date":"2027-1-27","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2027-01-28-1","date":"2027-1-28","title":"入学説明会（小学6年生）","summary":false,"remind":false},{"id":"school-2027-01-29-1","date":"2027-1-29","title":"生徒集会・表彰式","summary":false,"remind":false},{"id":"school-2027-02-03-1","date":"2027-2-3","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2027-02-05-1","date":"2027-2-5","title":"一斉研","summary":false,"remind":false},{"id":"school-2027-02-10-1","date":"2027-2-10","title":"予餞会実行委員","summary":false,"remind":false},{"id":"school-2027-02-11-1","date":"2027-2-11","title":"建国記念の日","summary":false,"remind":false},{"id":"school-2027-02-12-1","date":"2027-2-12","title":"専門部","summary":false,"remind":false},{"id":"school-2027-02-15-1","date":"2027-2-15","title":"職員会議","summary":false,"remind":false},{"id":"school-2027-02-16-1","date":"2027-2-16","title":"定期テスト","summary":true,"remind":true},{"id":"school-2027-02-17-1","date":"2027-2-17","title":"定期テスト","summary":true,"remind":true},{"id":"school-2027-02-17-2","date":"2027-2-17","title":"予餞会リハ内容確認","summary":false,"remind":false},{"id":"school-2027-02-19-1","date":"2027-2-19","title":"代表委員会","summary":false,"remind":false},{"id":"school-2027-02-20-1","date":"2027-2-20","title":"フラワーマーチ","summary":true,"remind":false},{"id":"school-2027-02-22-1","date":"2027-2-22","title":"フラワーマーチ代休","summary":false,"remind":false},{"id":"school-2027-02-23-1","date":"2027-2-23","title":"天皇誕生日","summary":false,"remind":false},{"id":"school-2027-02-24-1","date":"2027-2-24","title":"予餞会リハ","summary":false,"remind":false},{"id":"school-2027-02-25-1","date":"2027-2-25","title":"予餞会前日準備","summary":false,"remind":false},{"id":"school-2027-02-26-1","date":"2027-2-26","title":"予餞会本番","summary":true,"remind":false},{"id":"school-2027-03-01-1","date":"2027-3-1","title":"確認テスト","summary":true,"remind":true},{"id":"school-2027-03-08-1","date":"2027-3-8","title":"卒業式予行練習・表彰式","summary":false,"remind":false},{"id":"school-2027-03-09-1","date":"2027-3-9","title":"卒業式","summary":true,"remind":false},{"id":"school-2027-03-12-1","date":"2027-3-12","title":"専門部","summary":false,"remind":false},{"id":"school-2027-03-15-1","date":"2027-3-15","title":"学年末PTA","summary":false,"remind":false},{"id":"school-2027-03-18-1","date":"2027-3-18","title":"代表委員会","summary":false,"remind":false},{"id":"school-2027-03-23-1","date":"2027-3-23","title":"給食終了","summary":false,"remind":false},{"id":"school-2027-03-24-1","date":"2027-3-24","title":"修了式・表彰式・離任式","summary":true,"remind":false}],"holidays":["2026-9-6","2026-9-12","2026-9-13","2026-9-19","2026-9-20","2026-9-21","2026-9-22","2026-9-23","2026-9-26","2026-9-27","2026-10-3","2026-10-4","2026-10-10","2026-10-11","2026-10-12","2026-10-17","2026-10-18","2026-10-24","2026-10-25","2026-10-31","2026-11-1","2026-11-3","2026-11-7","2026-11-8","2026-11-21","2026-11-22","2026-11-23","2026-11-28","2026-11-29","2026-12-5","2026-12-6","2026-12-12","2026-12-13","2026-12-19","2026-12-20","2026-12-24","2026-12-25","2026-12-26","2026-12-27","2026-12-28","2026-12-29","2026-12-30","2026-12-31","2027-1-1","2027-1-2","2027-1-3","2027-1-4","2027-1-5","2027-1-6","2027-1-9","2027-1-10","2027-1-16","2027-1-17","2027-1-23","2027-1-24","2027-1-30","2027-1-31","2027-2-6","2027-2-7","2027-2-11","2027-2-21","2027-2-22","2027-2-23","2027-2-27","2027-2-28","2027-3-6","2027-3-7","2027-3-13","2027-3-14","2027-3-20","2027-3-21","2027-3-22","2027-3-25","2027-3-26","2027-3-27","2027-3-28","2027-3-29","2027-3-30","2027-3-31"],"springBreak":{"start":"2027-3-25","end":null},"pending":["春休みの4月の終了日","成人の日の1月10日表記"]};

function schoolReminderItems(uid, now = Date.now()) {
  if (uid !== 'u1') return [];
  return SCHOOL_CALENDAR.events.filter(e => e.remind).map(e => {
    const [y,m,d]=e.date.split('-').map(Number);
    const at=Date.UTC(y,m-1,d-SCHOOL_CALENDAR.leadDays,7-9);
    return {id:'school-reminder:'+e.id,at,title:'行事の詳細を入力してください',body:`${m}月${d}日「${e.title}」の持ち物や時間などを確認して入力してください。`,category:'study',schoolEventId:e.id};
  }).filter(n => n.at <= now);
}
async function schoolCalendarReminders(env, sendToDevice=false) {
  if (!env.AUTH_DB) throw new Error('calendar store unavailable');
  const prefix='school-calendar-reminder:',due=schoolReminderItems('u1'),now=Date.now();
  const rows=await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<?').bind(prefix,prefix+'\uffff').all();
  const existing=new Map((rows.results||[]).map(r=>[r.k,JSON.parse(r.v)]));
  const missing=due.filter(n=>!existing.has(prefix+n.schoolEventId));
  if(missing.length) {
    await env.AUTH_DB.batch(missing.map(n=>env.AUTH_DB.prepare('INSERT INTO auth_kv (k,v,expires_at) VALUES (?,?,0) ON CONFLICT(k) DO NOTHING').bind(prefix+n.schoolEventId,JSON.stringify({...n,dueAt:n.at,at:now}))));
    if(sendToDevice&&env.NOTICE_VAPID_JWK){
      const fresh=missing.filter(n=>n.at>=now-86400000).map(n=>({...n,at:now}));
      if(fresh.length){const {pushSendToUser}=await import('./web-push.js');await pushSendToUser(env,'u1',fresh);}
    }
    const saved=await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<?').bind(prefix,prefix+'\uffff').all();
    return (saved.results||[]).map(r=>JSON.parse(r.v));
  }
  return [...existing.values()];
}
async function schoolCalendarApi(request, env, session) {
  if (!['u1','u2'].includes(session.uid)) return unauthorized();
  if (!env.AUTH_DB) return serviceUnavailable();
  const prefix='school-calendar-detail:';
  if (request.method === 'GET') {
    const rows=await env.AUTH_DB.prepare('SELECT k,v FROM auth_kv WHERE k>=? AND k<?').bind(prefix,prefix+'\uffff').all();
    const details={};
    for (const row of rows.results||[]) {
      const id=row.k.slice(prefix.length);
      if (SCHOOL_CALENDAR.events.some(e=>e.id===id)) details[id]=JSON.parse(row.v);
    }
    return json({events:SCHOOL_CALENDAR.events,holidays:SCHOOL_CALENDAR.holidays,details,notices:session.uid==='u1'?await schoolCalendarReminders(env):[],leadDays:SCHOOL_CALENDAR.leadDays,now:Date.now()});
  }
  if (request.method !== 'POST') return json({error:'method not allowed'},405);
  if (session.uid !== 'u1') return json({error:'owner only'},403);
  let b;try { b=await requestJson(request,24000); } catch(e) { return invalidBody(e); }
  if (!b || typeof b!=='object' || Array.isArray(b) || Object.keys(b).some(k=>!['id','text','version'].includes(k)) || !SCHOOL_CALENDAR.events.some(e=>e.id===b.id) || typeof b.text!=='string' || b.text.length>4000 || !Number.isSafeInteger(b.version) || b.version<0 || b.version>=Number.MAX_SAFE_INTEGER) return json({error:'bad body'},400);
  const detail={text:b.text.trim(),version:b.version+1,updatedAt:Date.now(),updatedBy:session.uid};
  const row=await env.AUTH_DB.prepare("INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE ?=0 OR EXISTS (SELECT 1 FROM auth_kv WHERE k=?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0 WHERE CAST(json_extract(auth_kv.v,'$.version') AS INTEGER)=? RETURNING v")
    .bind(prefix+b.id,JSON.stringify(detail),b.version,prefix+b.id,b.version).first();
  if (!row) return json({error:'conflict'},409);
  return json({ok:true,id:b.id,detail:JSON.parse(row.v)});
}

// User-confirmed school results. Separate from the September practice-exam scores.
const SEPTEMBER_SCHOOL_RESULT={id:'school-2026-09',name:'第2回（9月）',s:{国語:34,数学:84,英語:87,理科:51,社会:47},c:'',source:'user-confirmed',confirmedDate:'2026-09-20'};
async function schoolResultsApi(request,env,session){
  if(!['u1','u2'].includes(session.uid))return unauthorized();
  if(request.method!=='GET')return json({error:'method not allowed'},405);
  if(!env.AUTH_DB)return serviceUnavailable();
  const key='school-result:u1:2026-09';
  await env.AUTH_DB.prepare('INSERT INTO auth_kv (k,v,expires_at) VALUES (?,?,0) ON CONFLICT(k) DO NOTHING').bind(key,JSON.stringify(SEPTEMBER_SCHOOL_RESULT)).run();
  const row=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first();
  if(!row)return serviceUnavailable();
  const result=JSON.parse(row.v),total=['国語','数学','英語','理科','社会'].reduce((n,k)=>n+result.s[k],0);
  const peerRow=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('school-result:u2:2026-09').first();
  const peer=peerRow?JSON.parse(peerRow.v):null;
  const peerTotal=peer?['国語','数学','英語','理科','社会'].reduce((n,k)=>n+peer.s[k],0):0;
  return json({records:{u1:{teiki:[session.uid==='u1'?result:{id:result.id,name:result.name,total}]},u2:{teiki:peer?[session.uid==='u2'?peer:{id:peer.id,name:peer.name,total:peerTotal}]:[]}}});
}

export default {
  // 毎日 朝7時・昼12時・夕方18時（日本時間）に自動で走る
  async scheduled(event, env, ctx) {
    ctx.waitUntil(publishNews(env));
    ctx.waitUntil(schoolCalendarReminders(env,true));
  },

  async fetch(request, env, ctx) {
    try {
    if (!originAllowed(request, env)) return json({error:"origin not allowed"},403);
    // ブラウザの事前確認（プリフライト）に答える
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url0 = new URL(request.url);
    const path = url0.pathname.replace(/\/+$/, "");
    if(path.startsWith('/problem-pdf/')) {
      const { publicProblemPdf } = await import('./problem-share.mjs');
      return await publicProblemPdf(request,env,path.slice(13));
    }
    if (path === "/auth/start" && request.method === "GET") return await oauthStart(request, env);
    if (path === "/auth/legacy" && request.method === "POST") return await legacyStart(request, env);
    if (path === "/auth/legacy/login" && request.method === "POST") return await legacyLogin(request, env);
    const cb = path.match(/^\/auth\/callback\/(google|line)$/);
    if (cb && (request.method === "GET" || request.method === "POST")) return await oauthCallback(request, env, cb[1]);
    const session = await readSession(request, env);
    if (!session) return unauthorized();
    const family = session.uid === "u1" || session.uid === "u2";
    if (path === "/auth/logout" && request.method === "POST") {
      await authDelete(env, "session:" + session.token);
      await releaseActiveSession(env, session.uid, session.token);
      return json({ok:true});
    }
    if (!(await claimActiveSession(env, session.uid, session.token))) return activeSessionResponse();
    if(['/admin/report','/admin/submissions'].includes(path)){const {reportsRoute}=await import('./admin-reports.mjs');return scopedApiResponse(await reportsRoute(request,env,session),env);}
    if(['/learning-presence','/learning-health','/admin/health'].includes(path)){const {monitorRoute}=await import('./admin-monitor.mjs');return scopedApiResponse(await monitorRoute(request,env,session),env);}
    if(['/admin/profiles','/admin/workspace','/admin/vocabulary','/admin/alerts'].includes(path)){
      const {workspaceRoute}=await import('./admin-workspace.mjs');
      return scopedApiResponse(await workspaceRoute(request,env,session,{snapshot:uid=>cloudSnapshotGet(env,uid)}),env);
    }
    if(path==='/learning-time'||path==='/learning-time-start'){
      const {learningTimeRoute}=await import('./learning-time.mjs');
      return scopedApiResponse(await learningTimeRoute(request,env,session,{owner:await opaqueKey(session.token)}),env);
    }
    if(path==='/material-records'||path==='/material-progress'||path==='/material-stats'||path==='/material-review'||path==='/material-daily'||path==='/material-rewards'||path==='/material-diary'||path==='/material-speed'||path==='/material-marks'){
      const {materialRecordsRoute}=await import('./material-records.mjs');
      return await materialRecordsRoute(request,env,session,{json,requestJson,invalidBody,owner:await opaqueKey(session.token)});
    }
    if(path==='/material-explain'||path==='/material-hint'||path==='/material-ai-status'||path==='/material-judge'||path==='/material-similar'||path==='/material-generate'||path==='/material-generated'){
      // Gemini学習補助。GEMINI_ENABLEDとキーがある確認版だけで動き、本番では「使えません」を返す。
      const {geminiTutorRoute}=await import('./gemini-tutor.mjs');
      return await geminiTutorRoute(request,env,session,{json,requestJson,invalidBody,owner:await opaqueKey(session.token)});
    }
    if(path === '/problem-share') {
      const { problemShareRoute } = await import('./problem-share.mjs');
      return scopedApiResponse(await problemShareRoute(request,env,session),env);
    }
    if(path==='/textbook-annotations'){
      const {textbookAnnotationsRoute}=await import('./textbook-annotations.mjs');
      return scopedApiResponse(await textbookAnnotationsRoute(request,env,session),env);
    }
    if(path==='/learning-notes'||path==='/learning-chat'||path==='/learning-review'||path==='/learning-plan'||path==='/learning-note-analysis'||path==='/learning-note-analysis-job'){
      const {learningAssistantRoute}=await import('./learning-assistant.mjs');
      return scopedApiResponse(await learningAssistantRoute(request,env,session,{owner:await opaqueKey(session.token)}),env);
    }
    if(path==='/avatar'||path==='/avatar-image'||path==='/photos'||path==='/avatar-generate'||path==='/avatar-generations'){
      // 🖼 アイコン・のびログで撮った写真・アイコン生成の受付（2026-10-12）。読めるのは本人のものだけ
      const {profilePhotosRoute}=await import('./profile-photos.mjs');
      return scopedApiResponse(await profilePhotosRoute(request,env,session,{owner:await opaqueKey(session.token)}),env);
    }
    if(path==='/learning-images'||path==='/learning-image'){
      const {learningImagesRoute}=await import('./learning-images.mjs');
      return scopedApiResponse(await learningImagesRoute(request,env,session),env);
    }
    if(path==='/messages'||path==='/explain-requests'||path==='/admin/messages'||path==='/admin/explain-requests'){
      // ✉️ メッセージ（2026-10-10）：なおから・なおへの解説依頼。書くのは u1、読むのは本人。届いたらプッシュで知らせる
      const {messagesRoute}=await import('./messages.mjs');
      const response=await messagesRoute(request,env,session);
      if(request.method==='POST'&&response.ok&&env.NOTICE_VAPID_JWK&&ctx?.waitUntil){
        const {notify}=await response.clone().json();
        if(notify&&notify.uid){const {pushSendToUser}=await import('./web-push.js');ctx.waitUntil(pushSendToUser(env,notify.uid,[{id:notify.id,category:'other',title:notify.title,body:notify.body,at:Date.now()}]));}
      }
      return scopedApiResponse(response,env);
    }
    if(path==='/plan'||path==='/admin/plans'){
      // 💳 サブスク：確認版の仮ルール（2026-10-09）。SUBSCRIPTION_PREVIEW='1' の確認版だけ。本番では「仮ルールなし」を返す
      const {planRoute}=await import('./plans.mjs');
      return scopedApiResponse(await planRoute(request,env,session),env);
    }
    if(path==='/newspaper'){
      // 📰 のびログ新聞（2026-10-09）：書いて配るのは u1、読むのは家族。配った号はプッシュで知らせる
      const {newspaperRoute}=await import('./admin.mjs');
      const response=await newspaperRoute(request,env,session);
      if(request.method==='POST'&&response.status===201&&env.NOTICE_VAPID_JWK&&ctx?.waitUntil){
        const {notify,item}=await response.clone().json();
        if(notify){const {pushSendToUser}=await import('./web-push.js');for(const to of ['u1','u2'])ctx.waitUntil(pushSendToUser(env,to,[{id:'np-'+item.id,category:'other',title:notify.title,body:notify.body,at:item.publishAt}]));}
      }
      return scopedApiResponse(response,env);
    }
    if(path==='/material-flags'){
      // 🚫 問題の一時停止（2026-10-09）：読むのは家族、つけ外しは u1 だけ
      const {flagsRoute}=await import('./admin.mjs');const {default:bank}=await import('./material-bank.mjs');
      return scopedApiResponse(await flagsRoute(request,env,session,{units:bank.units}),env);
    }
    if(path==='/admin/overview'||path==='/admin/activity'){
      // 🌳 管理画面 v1（2026-10-09）：u1だけ。集計と活動の種類・時刻だけを返す（答えの文章は返さない）
      const {adminRoute}=await import('./admin.mjs');
      return scopedApiResponse(await adminRoute(request,env,session),env);
    }
    if(path === '/eiken-submit'||path === '/assignments') {
      // 📮 配布物・提出・返却（2026-10-07）。作る・返すは なお（u1）だけ、提出は本人だけ。通知は既存の端末通知で送る
      const { assignmentsRoute } = await import('./assignments.mjs');
      const response=path==='/eiken-submit'?await (await import('./admin-eiken.mjs')).eikenSubmitRoute(request,env,session):await assignmentsRoute(request,env,session,{});
      if(request.method==='POST'&&response.ok&&env.NOTICE_VAPID_JWK&&ctx?.waitUntil){
        const {notify}=await response.clone().json();
        if(notify&&(await import('./admin-workspace.mjs')).profilesFor(env).some(p=>p.uid===notify.uid)){
          const {pushSendToUser}=await import('./web-push.js');
          ctx.waitUntil(pushSendToUser(env,notify.uid,[{id:notify.id,category:'other',title:notify.title,body:notify.body,at:notify.at}]));
        }
      }
      return scopedApiResponse(response,env);
    }
    if(path === '/achievements') {
      const { achievementsRoute } = await import('./achievements.mjs');
      const response=await achievementsRoute(request,env,session);
      if(request.method==='POST'&&response.ok&&env.NOTICE_VAPID_JWK&&ctx?.waitUntil){
        const {item}=await response.clone().json();
        if(item&&['pending','approved','rejected'].includes(item.status)){
          const {pushSendToUser}=await import('./web-push.js');
          const uid=item.status==='pending'?'u1':item.uid;
          const title=item.status==='pending'?'実績の確認依頼':item.status==='approved'?'実績が承認されました':'実績の確認結果';
          ctx.waitUntil(pushSendToUser(env,uid,[{id:'achievement-'+item.status+':'+item.id,category:'other',title,body:item.entry.title+'の確認状況が更新されました。',at:item.reviewedAt||item.at}]));
        }
      }
      return scopedApiResponse(response,env);
    }
    if (path === "/push") {
      if (!family) return unauthorized();
      const { pushRoute } = await import('./web-push.js');
      return await pushRoute(request, env, session);
    }
    if (path === "/auth/me" && request.method === "GET") {
      return json({user:{id:session.uid,name:session.name,provider:session.provider},leaseSeconds:ACTIVE_LEASE_MS/1000});
    }
    if (path === "/auth/heartbeat" && request.method === "POST") return json({ok:true,leaseSeconds:ACTIVE_LEASE_MS/1000});

    if (path === "/school-results") return await schoolResultsApi(request,env,session);
    if (path === "/school-calendar") return await schoolCalendarApi(request,env,session);

    if (path === "/login-days") return await loginDaysApi(request,env,session);

    if (path === "/september-review-pdf") {
      if(request.method!=="GET")return json({error:"method not allowed"},405);
      return septReviewPdf(session);
    }

    if (path === "/september-test") return await septemberTest(request, env, session);

    // 📰 ニュースのたね（cron が動いていなくても、開いた時点で正しい回のたねが作られる）
    if (path === "/news") {
      if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: CORS });
      const data = await publishNews(env);
      data.now = Date.now();   // ★サーバーの「いまの時こく」。アプリはこれで端末の時計のずれを直す
      return json(data);
    }

    // 📦 きろくの引っこし（前のアプリで POST してもらった6桁番号→新しいアプリで GET して取りこむ）
    //   ・POST /transfer  … 本文(記録まるごと)を保存して 6桁の番号を返す（1時間で自動で消える）
    //   ・GET  /transfer?code=NNNNNN … その番号の記録を返す
    if (path === "/transfer") {
      if (!family) return unauthorized();
      if (request.method === "POST") {
        const body = await request.text();
        if (!body || body.length > 20000000) return json({ error: "bad body" }, 400);
        // かぶりにくい6桁の番号を作る
        let code = "";
        for (let i = 0; i < 5; i++) {
          const candidate = randomSixDigitCode();
          if (!(await env.BOARD.get("xfer:" + candidate))) { code = candidate; break; }
        }
        if (!code) return json({ error: "try again" }, 503);
        await env.BOARD.put("xfer:" + code, JSON.stringify({uid:session.uid,data:body}), { expirationTtl: 3600 }); // 1時間で消える
        return json({ code });
      }
      if (request.method === "GET") {
        const code = (new URL(request.url).searchParams.get("code") || "").replace(/\D/g, "");
        if (!code) return json({ error: "no code" }, 400);
        const blob = await env.BOARD.get("xfer:" + code);
        if (blob == null) return json({ error: "not found" }, 404);
        let rec; try { rec = JSON.parse(blob); } catch (e) { return json({error:"expired transfer format"},410); }
        if (!rec || rec.uid !== session.uid || typeof rec.data !== "string") return unauthorized();
        await env.BOARD.delete("xfer:" + code); // 本人が1回取り込んだら無効化
        return new Response(rec.data, { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // 💾 きろくのクラウド保存（どの端末でも同じ記録になる／消えても戻る）
    //   GET  /save?user=u1            … その人の記録をまるごと返す
    //   POST /save {user, v, at, keys}… 保存する。v（保存番号）が今より小さいときは受けつけない
    if (path === '/record-archive') return await recordArchiveApi(request,env,session);
    if (path === "/save") {
      if (request.method === "GET") {
        const user = (new URL(request.url).searchParams.get("user") || "").replace(/[^a-z0-9_]/gi, "");
        if (!user || user !== session.uid) return unauthorized();
        try { const {recordOpen} = await import('./admin.mjs'); await recordOpen(env, user); } catch (e) {}  // アプリを開いた記録（30分に1回まで）
        const rec = await cloudSnapshotGet(env, user);
        return json(rec || {v:0,keys:null});
      }
      if (request.method === "POST") {
        let body;
        try { body = await requestJson(request, 20000000); } catch (e) { return invalidBody(e); }
        const user = String((body && body.user) || "").replace(/[^a-z0-9_]/gi, "");
        if (!user || user !== session.uid) return unauthorized();
        // 接続テスト専用。保存データや保存番号には一切触れない。
        if (body && body.probe === true) return json({ ok: true, probe: true });
        return await cloudSnapshotPut(env, session, body);
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    if (path === "/exam-control") {
      if (!family) return unauthorized();
      if (request.method === "GET") {
        const released = {};
        for (const id of Object.keys(EXAM_RELEASE_AT)) released[id] = await examReleased(env, id);
        return json({ released, now: Date.now() });
      }
      if (request.method === "POST") {
        if (session.uid !== "u1") return unauthorized();
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
        const id = String((body && body.examId) || "");
        if (!examIdOk(id)) return json({ error: "bad exam" }, 400);
        if (Date.now() < EXAM_RELEASE_AT[id]) return json({ error: "too early" }, 403);
        await env.BOARD.put("scheduled-exam-release:" + id, "1");
        return json({ ok: true, examId: id, released: true });
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    if (path === "/exam-submissions") {
      if (!family) return unauthorized();
      if (request.method === "POST") {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
        const id = String((body && body.examId) || "");
        const user = String((body && body.user) || "");
        const answers = body && body.answers;
        if (user !== session.uid) return unauthorized();
        if (!examIdOk(id) || !Array.isArray(answers) || answers.length !== 25) return json({ error: "bad body" }, 400);
        if (answers.some((a) => typeof a !== "string" || a.length > 2000)) return json({ error: "bad answers" }, 400);
        const key = "scheduled-exam-submission:" + id + ":" + session.uid;
        if (await env.BOARD.get(key)) return json({ ok: true, already: true });
        const rec = { examId: id, user: session.uid, answers, at: Number(body.at) || Date.now(), min: Math.max(0, Math.min(180, Number(body.min) || 0)) };
        await env.BOARD.put(key, JSON.stringify(rec));
        return json({ ok: true });
      }
      if (request.method === "GET") {
        if (session.uid !== "u1") return unauthorized();
        const id = new URL(request.url).searchParams.get("exam") || "";
        if (!examIdOk(id)) return json({ error: "bad exam" }, 400);
        if (!(await examReleased(env, id))) return json({ error: "not released" }, 403);
        const submissions = [];
        for (const uid of ["u1", "u2"]) {
          const raw = await env.BOARD.get("scheduled-exam-submission:" + id + ":" + uid);
          if (raw) { try { submissions.push(JSON.parse(raw)); } catch (e) {} }
        }
        return json({ submissions });
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // 💬 DM（なお ⇄ りらん の1対1チャット）
    //   GET  /chat                  … {msgs:[…], read:{u1,u2}, now} を返す
    //   POST /chat            {user, text, kind}  … 1つ送る（kind: 't'=文字 / 's'=スタンプ）
    //   POST /chat?edit=<id>  {user, text}        … 自分のを書きなおす
    //   POST /chat?del=<id>   {user}              … 自分のを消す
    //   POST /chat?read       {user}              … 「ここまで読んだ」を記録する（既読マーク用）
    //   ★1つのキー("chat")にまとめて入れて、読むのは1回で済ませる（KVの読み取り回数をおさえるため）
    if (path === "/chat") {
      if (!family) return unauthorized();
      const CHAT_MAX = 300;      // 残す件数（古いものから消える）
      const TEXT_MAX = 1000;     // 1つの長さの上限

      const loadChat = async () => {
        try {
          const d = JSON.parse((await env.BOARD.get("chat")) || "null");
          if (d && typeof d === "object") {
            return { msgs: Array.isArray(d.msgs) ? d.msgs : [], read: d.read && typeof d.read === "object" ? d.read : {} };
          }
        } catch (e) { /* 壊れていたら作りなおす */ }
        return { msgs: [], read: {} };
      };

      if (request.method === "GET") {
        const d = await loadChat();
        d.now = Date.now();
        return json(d);
      }

      if (request.method === "POST") {
        let b;
        try { b = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
        const user = String((b && b.user) || "").replace(/[^a-z0-9_]/gi, "");
        if (!user || user !== session.uid) return unauthorized();

        const q = new URL(request.url).searchParams;
        const d = await loadChat();

        if (q.has("read")) {
          d.read[user] = Date.now();
        } else if (q.get("del")) {
          const id = q.get("del");
          // 自分が送ったものだけ消せる（人のは消せない）
          d.msgs = d.msgs.filter((m) => !(m.id === id && m.u === user));
        } else if (q.get("edit")) {
          const id = q.get("edit");
          const text = String((b && b.text) || "").slice(0, TEXT_MAX);
          if (!text.trim()) return json({ error: "empty" }, 400);
          const m = d.msgs.find((m) => m.id === id && m.u === user); // 自分のだけ書きなおせる
          if (!m) return json({ error: "not found" }, 404);
          m.t = text;
          m.ed = Date.now();     // 「編集ずみ」の目じるし
        } else {
          const text = String((b && b.text) || "").slice(0, TEXT_MAX);
          if (!text.trim()) return json({ error: "empty" }, 400);
          d.msgs.push({
            id: String(Date.now()) + "-" + randomToken(9),
            u: user,
            k: b.kind === "s" ? "s" : "t",
            t: text,
            at: Date.now(),
          });
          if (d.msgs.length > CHAT_MAX) d.msgs = d.msgs.slice(-CHAT_MAX);
        }

        await env.BOARD.put("chat", JSON.stringify(d));
        d.now = Date.now();
        return json(d);
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // 📝 オンラインテスト（なおが作って出す → 2人が受ける → 解答が集まる）
    //   POST /tests            … テストを1つ保存（{title, limit, items[], files[]}）
    //   GET  /tests            … テストの一覧（中身つき）
    //   POST /tests?del=<id>   … そのテストと解答をぜんぶ消す
    //   POST /answers          … 解答を1人ぶん保存（{testId, user, name, answers[]}）
    //   GET  /answers?test=<id>… そのテストの解答をぜんぶ取る（testを省くと全部）
    if (path === "/tests") {
      if (!family) return unauthorized();
      if (request.method === "GET") {
        const idxRaw = (await env.BOARD.get("otestIndex")) || "[]";
        let idx = [];
        try { idx = JSON.parse(idxRaw) || []; } catch (e) { idx = []; }
        const out = [];
        for (const id of idx.slice(0, 40)) {
          const blob = await env.BOARD.get("otest:" + id);
          if (blob) { try { out.push(JSON.parse(blob)); } catch (e) {} }
        }
        return json({ tests: out });
      }
      if (request.method === "POST") {
        if (session.uid !== "u1") return unauthorized();
        const del = new URL(request.url).searchParams.get("del");
        if (del) {
          let idx = [];
          try { idx = JSON.parse((await env.BOARD.get("otestIndex")) || "[]") || []; } catch (e) { idx = []; }
          idx = idx.filter((x) => x !== del);
          await env.BOARD.put("otestIndex", JSON.stringify(idx));
          await env.BOARD.delete("otest:" + del);
          let ai = [];
          try { ai = JSON.parse((await env.BOARD.get("oansIndex")) || "[]") || []; } catch (e) { ai = []; }
          for (const k of ai.filter((k) => k.indexOf(del + "|") === 0)) await env.BOARD.delete("oans:" + k);
          await env.BOARD.put("oansIndex", JSON.stringify(ai.filter((k) => k.indexOf(del + "|") !== 0)));
          return json({ ok: true });
        }
        let t;
        try { t = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
        if (!t || typeof t !== "object" || !t.title) return json({ error: "bad body" }, 400);
        const id = t.id || String(Date.now()) + "-" + randomToken(9);
        t.id = id;
        t.at = t.at || Date.now();
        const body = JSON.stringify(t);
        if (body.length > 12000000) return json({ error: "too big" }, 413);
        await env.BOARD.put("otest:" + id, body);
        let idx = [];
        try { idx = JSON.parse((await env.BOARD.get("otestIndex")) || "[]") || []; } catch (e) { idx = []; }
        idx = [id].concat(idx.filter((x) => x !== id)).slice(0, 40);
        await env.BOARD.put("otestIndex", JSON.stringify(idx));
        return json({ ok: true, id });
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    if (path === "/answers") {
      if (!family) return unauthorized();
      if (request.method === "GET") {
        const tid = new URL(request.url).searchParams.get("test") || "";
        let ai = [];
        try { ai = JSON.parse((await env.BOARD.get("oansIndex")) || "[]") || []; } catch (e) { ai = []; }
        const keys = tid ? ai.filter((k) => k.indexOf(tid + "|") === 0) : ai;
        const out = [];
        for (const k of keys.slice(0, 100)) {
          const blob = await env.BOARD.get("oans:" + k);
          if (blob) { try { out.push(JSON.parse(blob)); } catch (e) {} }
        }
        return json({ answers: out });
      }
      if (request.method === "POST") {
        let a;
        try { a = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
        if (!a || !a.testId || !a.user) return json({ error: "bad body" }, 400);
        if (a.user !== session.uid) return unauthorized();
        const key = a.testId + "|" + a.user;
        a.at = a.at || Date.now();
        await env.BOARD.put("oans:" + key, JSON.stringify(a));
        let ai = [];
        try { ai = JSON.parse((await env.BOARD.get("oansIndex")) || "[]") || []; } catch (e) { ai = []; }
        ai = [key].concat(ai.filter((x) => x !== key)).slice(0, 300);
        await env.BOARD.put("oansIndex", JSON.stringify(ai));
        return json({ ok: true });
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // ⚔️ 対戦ボード
    if (path !== "") return json({error:"not found"},404);
    if (!family) return unauthorized();
    if (request.method === "GET") return await boardGet(env);
    if (request.method === "POST") return await boardPost(request, env, session.uid);

    return new Response("Method Not Allowed", { status: 405, headers: CORS });
    } catch (e) {
      // 認証・保存障害で秘密値や内部エラーを返さず、古いデータにも切り替えない。
      return serviceUnavailable();
    }
  },
};
