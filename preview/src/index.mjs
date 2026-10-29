import app from '../build/backend.mjs';
import { pushBroadcastRelease } from '../build/web-push.js';

const COOKIE = '__Host-nobilog-preview';
const encoder = new TextEncoder();
const LEASE = 180000;
const PLAN_NAMES=Object.freeze({p_free:'Free 確認版',p_mini:'Mini 確認版',p_standard:'Standard 確認版',p_pro:'Pro 確認版',p_unlimit:'UNLIMIT 確認版'});
const MAIN_ORIGIN = 'https://nobilog.pages.dev';
const loginPage = (message = '', next = false, automatic = false) => new Response(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>のびログ 確認版</title><style>body{margin:0;background:#f4f5f7;color:#24313b;font:16px system-ui;display:grid;min-height:100vh;place-items:center}main{box-sizing:border-box;width:min(420px,92vw);padding:30px;background:white;border-radius:24px;box-shadow:0 8px 30px #0001}h1{font-size:24px}label{display:block;margin:22px 0 8px}input,button,select{box-sizing:border-box;width:100%;font:inherit;padding:14px;border-radius:14px;border:1px solid #aeb8bf}button{margin-top:14px;background:#334857;color:white}p{line-height:1.7}small{color:#65727c}a{color:#334857}.msg:not(:empty){padding:12px 14px;border-radius:14px;background:#fff1f0;border:1px solid #f0b4b0;color:#9b2c2c;font-weight:700}</style><main><h1>🌱 のびログ 確認版</h1><p>アカウント：確認版<br><small>記録は確認版専用のサーバーに保存します。</small></p>${next==='admin'?'<p><b>🌳 なお専用の管理室</b><br>なお本人のパスワードでログインしてください。</p>':next?'<p><b>4プランのパスワード設定</b><br><small>通常の確認版のパスワードでログインすると、設定画面に戻ります。</small></p>':''}<form method="post" action="/preview-login">${next?'<input type="hidden" name="profile" value="u1"><input type="hidden" name="next" value="'+(next==='admin'?'admin':'plan-setup')+'">':automatic?'<p><small>入力したパスワードに対応するプランで開きます。</small></p>':'<label for="profile">確認するプラン</label><select id="profile" name="profile"><option value="u1">なお（管理者・確認版）</option><option value="u2">りらん</option><option value="p_free">f1 · Free</option><option value="p_mini">Mini</option><option value="p_standard">Standard</option><option value="p_pro">Pro</option><option value="p_unlimit">UNLIMIT</option></select>'}<label for="password">パスワード</label><input id="password" name="password" type="password" ${automatic?'inputmode="text" minlength="2" maxlength="64" autocapitalize="none" spellcheck="false"':'inputmode="text" minlength="4" maxlength="64" pattern="[A-Za-z0-9_-]{4,64}"'} autocomplete="current-password" required><button>確認版にログイン</button></form><p role="status" class="msg">${message}</p><p><a href="https://nobilog.pages.dev/">通常ののびログへ戻る</a></p></main></html>`, {headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
const reply = (error, status) => Response.json({error}, {status, headers:{'Cache-Control':'no-store'}});
function base64url(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
async function digest(value, pepper) {
    const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    return base64url(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
}
function equal(a,b) {
    const x=encoder.encode(a),y=encoder.encode(b);let diff=x.length^y.length;
    for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);
    return diff===0;
}
async function limitedBody(request) {
    if(Number(request.headers.get('Content-Length'))>1024||!request.body)throw new Error('body');
    const reader=request.body.getReader(),parts=[];let size=0;
    try {
        while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new Error('body');}parts.push(value);}
    }finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
async function reserveAttempt(db,key,limit) {
    const now=Date.now();
    const row=await db.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,'1',?) ON CONFLICT(k) DO UPDATE SET v=CAST(CASE WHEN expires_at<=? THEN 1 ELSE CAST(v AS INTEGER)+1 END AS TEXT),expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END WHERE expires_at<=? OR CAST(v AS INTEGER)<? RETURNING v").bind(key,now+900000,now,now,now,limit).first();
    return !!row;
}
// 正しいパスワードで入れたときは、その回の試行を数えない（失敗だけを15分の上限に数える）。
async function releaseAttempt(db,key) {
    await db.prepare("UPDATE auth_kv SET v=CAST(MAX(0,CAST(v AS INTEGER)-1) AS TEXT) WHERE k=?").bind(key).run();
}
async function cookieSession(request,env) {
    const raw=request.headers.get('Cookie')||'';
    const token=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    if(!token||!/^[-_A-Za-z0-9]{43}$/.test(token)||!env.AUTH_DB)return null;
    const row=await env.AUTH_DB.prepare('SELECT v,expires_at FROM auth_kv WHERE k=?').bind('session:'+token).first();
    if(!row||row.expires_at<=Date.now())return null;
    const session=JSON.parse(row.v);
    return (session.uid==='u1'||(env.PREVIEW_PLAN_ACCOUNTS==='1'&&(session.uid==='u2'||Object.hasOwn(PLAN_NAMES,session.uid))))&&session.provider==='preview'?token:null;
}
async function login(request,env,handoff=false) {
    if(!env.PREVIEW_PIN_PEPPER||!env.PREVIEW_PIN_HASH||!env.AUTH_DB)return reply('preview_not_configured',503);
    if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return reply('bad_content_type',415);
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    const attemptKey='preview-attempt:'+await digest(ip,env.PREVIEW_PIN_PEPPER);
    if(!await reserveAttempt(env.AUTH_DB,attemptKey,5)||!await reserveAttempt(env.AUTH_DB,'preview-attempt:global',20))return loginPage('試行回数が多いため、15分後にもう一度試してください。',false,!!env.PREVIEW_ACCESS_CODES);
    const fields=new URLSearchParams(await limitedBody(request));
    const password=fields.get('password')||'';
    let uid=fields.get('profile')||'u1';const next=fields.get('next'), automatic=!!env.PREVIEW_ACCESS_CODES;
    if([...fields.keys()].some(k=>!['password','profile','next'].includes(k))||fields.getAll('password').length!==1||fields.getAll('profile').length>1||fields.getAll('next').length>1||(next!==null&&(!['plan-setup','admin'].includes(next)||uid!=='u1'||handoff))||(automatic?!/^[-_A-Za-z0-9]{2,64}$/.test(password):uid==='u1'?!/^\d{4}$/.test(password):! /^(?:\d{4}|[-_A-Za-z0-9]{8,64})$/.test(password)))return loginPage('入力を確認してください。',next==='admin'?'admin':next==='plan-setup',automatic);
    if(password==='0028'&&!handoff)return adminEntry(request,env);
    let valid=false;
    if(automatic){
        let access;try{access=JSON.parse(env.PREVIEW_ACCESS_CODES);}catch(_){return reply('preview_not_configured',503);}
        if(typeof access.pepper!=='string'||access.pepper.length<16||!access.hashes||typeof access.hashes!=='object'||['u1','p_mini','p_standard','p_pro','p_unlimit'].some(id=>!/^[-_A-Za-z0-9]{43}$/.test(access.hashes[id]||'')))return reply('preview_not_configured',503);
        const matches=[];
        for(const candidate of ['u1',...(env.PREVIEW_PLAN_ACCOUNTS==='1'?['u2',...Object.keys(PLAN_NAMES)]:[])]){
            const hash=access.hashes[candidate],custom=candidate!=='u1'?await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('preview-account-pin:'+candidate).first('v'):null;
            if(custom?equal(await digest('preview-account:v1:'+candidate+':'+password,env.PREVIEW_PIN_PEPPER),custom):typeof hash==='string'&&equal(await digest('access:v1:'+candidate+':'+password,access.pepper),hash))matches.push(candidate);
        }
        if(matches.length===1&&(!fields.has('profile')||fields.get('profile')===matches[0])&&(!next||matches[0]==='u1')){uid=matches[0];valid=true;}
    }
    else if(uid==='u1')valid=equal(await digest(password,env.PREVIEW_PIN_PEPPER),env.PREVIEW_PIN_HASH);
    else if(!handoff&&env.PREVIEW_PLAN_ACCOUNTS==='1'&&Object.hasOwn(PLAN_NAMES,uid)){
        // 4プランの番号は /preview-plan-setup で なお（u1）が設定した検証値だけで照合する（原文は保存しない）
        const saved=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind(planPinKey(uid)).first('v');
        if(saved)valid=equal(await planPinDigest(uid,password,env),saved);
        else if(env.PREVIEW_PLAN_PEPPER&&env.PREVIEW_PLAN_HASHES){
            let hashes;try{hashes=JSON.parse(env.PREVIEW_PLAN_HASHES);}catch(_){return reply('preview_not_configured',503);}
            valid=typeof hashes[uid]==='string'&&equal(await digest(uid+'|'+password,env.PREVIEW_PLAN_PEPPER),hashes[uid]);
        }
    }
    if(!automatic&&uid!=='u1'&&env.PREVIEW_PLAN_ACCOUNTS==='1'&&(uid==='u2'||Object.hasOwn(PLAN_NAMES,uid))){const saved=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('preview-account-pin:'+uid).first('v');if(saved&&(!next||uid==='u1'))valid=equal(await digest('preview-account:v1:'+uid+':'+password,env.PREVIEW_PIN_PEPPER),saved);}
    if(!valid)return loginPage(uid==='u1'?'パスワードがちがいます。もう一度入力してください。':'プランのパスワードがちがうか、まだ設定されていません。',next==='admin'?'admin':next==='plan-setup',automatic);
    await releaseAttempt(env.AUTH_DB,attemptKey);await releaseAttempt(env.AUTH_DB,'preview-attempt:global');
    if(handoff) {
        const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);const ticket=base64url(bytes);
        await env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?)').bind('preview-handoff:'+ticket,JSON.stringify({origin:MAIN_ORIGIN,uid}),Date.now()+60000).run();
        return Response.json({ticket},{headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':MAIN_ORIGIN,'Vary':'Origin'}});
    }
    return await openSession(env,uid,next==='plan-setup'?'/preview-plan-setup':next==='admin'?'/#admin-nao':'/');
}
async function openSession(env,uid='u1',location='/') {
    if(uid!=='u1'&&!(env.PREVIEW_PLAN_ACCOUNTS==='1'&&(uid==='u2'||Object.hasOwn(PLAN_NAMES,uid))))return reply('invalid_profile',403);
    const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);const token=base64url(bytes),now=Date.now();
    const owner=base64url(await crypto.subtle.digest('SHA-256',encoder.encode(token)));
    // パスワードを入れ直した端末が使用権を引き継ぐ。前の端末は次の通信で「別の端末で使用中」になり、画面を止める
    // （記録は消さない）。パスワードなしで使用権を奪うことはできない（API側の確認は変えない）。
    const lease=await env.AUTH_DB.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=excluded.expires_at RETURNING v").bind('active-session:'+uid,owner,now+LEASE).first();
    if(!lease)return loginPage('ログインを完了できませんでした。もう一度お試しください。');
    try {
        await env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?)').bind('session:'+token,JSON.stringify({uid,name:uid==='u2'?'りらん（確認版）':PLAN_NAMES[uid]||(env.PREVIEW_ACCESS_CODES?'なお（管理者・確認版）':'確認版'),provider:'preview',iat:now}),now+604800000).run();
    }catch(e){await env.AUTH_DB.prepare('DELETE FROM auth_kv WHERE k=? AND v=?').bind('active-session:'+uid,owner).run();throw e;}
    return new Response(null,{status:303,headers:{Location:location, 'Cache-Control':'no-store','Set-Cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800`}});
}

// 入口は公開された経路。権限は既存の HttpOnly セッションと使用権だけで決める。
async function adminEntry(request,env){
 if(!['GET','POST'].includes(request.method))return reply('method_not_allowed',405);
 const s=await setupSession(request,env);
 if(s.state==='login')return loginPage('管理室へ入るには、なお本人としてログインしてください。','admin',!!env.PREVIEW_ACCESS_CODES);
 if(s.state!=='ok')return reply('forbidden',403);
 return new Response(null,{status:303,headers:{Location:'/#admin-nao','Cache-Control':'no-store'}});
}
// 確認版の独立した学習者アカウント。パスワードの原文は保存・表示しない。
async function accountSetup(request,env){
 const s=await setupSession(request,env);
 if(s.state==='login')return new Response(null,{status:303,headers:{Location:'/preview-login?next=admin','Cache-Control':'no-store'}});
 if(s.state!=='ok'||env.PREVIEW_PLAN_ACCOUNTS!=='1')return reply('forbidden',403);
 const entries=[['u2','りらん'],['p_free','f1 · Free'],['p_mini','m1 · Mini'],['p_standard','s1 · Standard'],['p_pro','p1 · Pro'],['p_unlimit','u1 · UNLIMIT']];
 let message='';
 if(request.method==='POST'){
  if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return reply('bad_content_type',415);
  const fields=new URLSearchParams(await limitedBody(request)),uid=fields.get('uid'),password=fields.get('password'),again=fields.get('confirm');
  if([...fields.keys()].length!==3||!entries.some(e=>e[0]===uid)||typeof password!=='string'||!/^[-_A-Za-z0-9]{8,64}$/.test(password)||password!==again||password==='0028')return reply('invalid_body',400);
  if(equal(await digest(password,env.PREVIEW_PIN_PEPPER),env.PREVIEW_PIN_HASH))return reply('duplicate_password',409);
  for(const [other] of entries)if(other!==uid){const hash=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('preview-account-pin:'+other).first('v');if(hash&&equal(await digest('preview-account:v1:'+other+':'+password,env.PREVIEW_PIN_PEPPER),hash))return reply('duplicate_password',409);}
  if(env.PREVIEW_ACCESS_CODES){let codes;try{codes=JSON.parse(env.PREVIEW_ACCESS_CODES);}catch(_){return reply('preview_not_configured',503);}for(const other of ['u1',...entries.map(e=>e[0])])if(other!==uid&&typeof codes.hashes?.[other]==='string'&&equal(await digest('access:v1:'+other+':'+password,codes.pepper),codes.hashes[other]))return reply('duplicate_password',409);}
  const hash=await digest('preview-account:v1:'+uid+':'+password,env.PREVIEW_PIN_PEPPER),now=Date.now();
  await env.AUTH_DB.batch([env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('preview-account-pin:'+uid,hash),env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('preview-account-meta:'+uid,JSON.stringify({uid,at:now,by:'u1'})),env.AUTH_DB.prepare("DELETE FROM auth_kv WHERE k>=? AND k<? AND json_extract(v,'$.uid')=?").bind('session:','session:\uffff',uid),env.AUTH_DB.prepare('DELETE FROM auth_kv WHERE k=?').bind('active-session:'+uid)]);
  message='確認版アカウントを設定しました。以前のログインは無効になりました。成績・答案・契約は他のアカウントからコピーしていません。';
 }else if(request.method!=='GET')return reply('method_not_allowed',405);
 return setupShell('<h1>🌳 確認版アカウントの作成・設定</h1><p>なおの管理権限は変更しません。アカウントごとに違うパスワードを設定してください。既存の学習記録は保持します。変更すると対象アカウントの以前のログインは無効になります。</p><p>'+message+'</p><form method="post" action="/preview-account-setup"><label>対象<select name="uid">'+entries.map(([uid,label])=>'<option value="'+uid+'">'+label+'</option>').join('')+'</select></label><label>パスワード（英数字・ハイフン・下線、8〜64文字）<input name="password" type="password" minlength="8" maxlength="64" autocomplete="new-password" required></label><label>確認<input name="confirm" type="password" minlength="8" maxlength="64" autocomplete="new-password" required></label><button>このアカウントを設定</button></form><p><a href="/#admin-nao">管理室に戻る</a></p>');
}

// 🔐 4プランのパスワード設定（Claude・2026-10-10）：ブラウザで開く。通常確認版の u1 で、今の使用権を持つ端末だけ。
// 番号の原文は保存・表示・ログしない。サーバーには「plan-pin:v1:<UID>:<番号>」のHMAC検証値だけを4件まとめて保存する（1件でも失敗したら全部取り消し）。
const PLAN_FIELDS=Object.freeze({p_mini:['mini','Mini','月500円・ヒントと短い解説 月30回'],p_standard:['standard','Standard','月1,000円・AI 月150回・学習予定の遅れの調整'],p_pro:['pro','Pro','月1,500円・AI 月300回・AI相談・まとめノートなど'],p_unlimit:['unlimit','UNLIMIT','月2,000円・月の上限なし（1日1,000回まで）・なおへの解説依頼']});
const planPinKey=uid=>'preview-profile-pin:'+uid;
const planPinDigest=(uid,pin,env)=>digest('plan-pin:v1:'+uid+':'+pin,env.PREVIEW_PIN_PEPPER);
// Referrer-Policy は same-origin（no-referrer だとブラウザがフォーム送信の Origin を null にして、正しい送信も断られる）
const SETUP_HEADERS={'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin','X-Robots-Tag':'noindex, noarchive','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setupStyle='body{margin:0;background:#f4f5f7;color:#24313b;font:16px system-ui;line-height:1.7}main{box-sizing:border-box;width:min(760px,100%);margin:0 auto;padding:24px 16px 48px}h1{font-size:24px;margin:8px 0}.card{background:#fff;border-radius:20px;box-shadow:0 6px 24px #0001;padding:18px;margin:14px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}fieldset{border:1px solid #d5dce1;border-radius:16px;margin:0;padding:12px 14px}legend{font-weight:700;padding:0 6px}label{display:block;margin:8px 0 4px;font-size:15px}input{box-sizing:border-box;width:100%;font:inherit;font-size:20px;letter-spacing:.3em;padding:10px 12px;border-radius:12px;border:1px solid #aeb8bf}button,.link{display:inline-block;box-sizing:border-box;font:inherit;padding:14px 18px;border-radius:14px;border:0;background:#334857;color:#fff;font-weight:700;text-decoration:none;margin-top:14px}button{width:100%}small,.m{color:#5b6872}.ok{padding:12px 14px;border-radius:14px;background:#eefaf1;border:1px solid #9fd8ae;color:#1e6b34;font-weight:700}.err{padding:12px 14px;border-radius:14px;background:#fff1f0;border:1px solid #f0b4b0;color:#9b2c2c;font-weight:700}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 4px;border-bottom:1px solid #e5e9ec;font-size:15px}';
function setupShell(body,status=200){return new Response(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>4プランのパスワード設定</title><style>${setupStyle}</style><main>${body}</main></html>`,{status,headers:SETUP_HEADERS});}
const jst=t=>{const d=new Date(t+9*3600000);return d.getUTCFullYear()+'/'+(d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
async function setupPage(env,token,{message='',error='',status=200}={}){
    const meta=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('preview-profile-pin-meta').first('v');
    let at=null;try{at=meta?JSON.parse(meta).at:null;}catch(_){at=null;}
    const rows=[];for(const uid of Object.keys(PLAN_FIELDS)){const set=!!await env.AUTH_DB.prepare('SELECT 1 AS x FROM auth_kv WHERE k=?').bind(planPinKey(uid)).first('x');rows.push(`<tr><th scope="row">${PLAN_FIELDS[uid][1]}</th><td>${set?'設定済み':'まだ設定していません'}</td></tr>`);}
    const csrf=await digest('plan-setup-csrf:'+token,env.PREVIEW_PIN_PEPPER);
    const fields=Object.entries(PLAN_FIELDS).map(([uid,[f,label,desc]])=>`<fieldset><legend>${label}</legend><small>${desc}</small><label for="${f}">4桁の番号</label><input id="${f}" name="${f}" type="password" inputmode="numeric" minlength="4" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" required><label for="${f}_confirm">もう一度（確認）</label><input id="${f}_confirm" name="${f}_confirm" type="password" inputmode="numeric" minlength="4" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" required></fieldset>`).join('');
    return setupShell(`<h1>🔐 4プランのパスワード設定</h1><p class="m">確認版で Mini・Standard・Pro・UNLIMIT を試すときの番号です。4つとも別の番号にし、通常の確認版と同じ番号は使えません。番号はサーバーに「照合用の値」だけを保存し、この画面にも記録にも残しません。</p>${message?`<p class="ok" role="status">${escapeHtml(message)}</p>`:''}${error?`<p class="err" role="alert">${escapeHtml(error)}</p>`:''}<section class="card"><h2 style="font-size:18px;margin:0 0 6px">いまの設定</h2><table>${rows.join('')}</table><p class="m">最後に保存：${at?escapeHtml(jst(at)):'まだありません'}</p></section><form method="post" action="/preview-plan-setup" class="card" autocomplete="off"><input type="hidden" name="csrf" value="${csrf}"><div class="grid">${fields}</div><p class="m">4つまとめて保存します。1つでも保存できなかったときは、どれも変わりません。保存すると、前の番号は使えなくなります。</p><button>4つまとめて保存する</button></form><p><a class="link" href="/">確認版に戻る</a></p>`,status);
}
// 通常確認版 u1 のセッションで、その端末が今の使用権（active-session）を持っているか。期限切れの使用権だけは取り戻す（API側と同じ）。
async function setupSession(request,env){
    const token=await cookieSession(request,env);if(!token)return {state:'login'};
    const row=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind('session:'+token).first('v');
    let uid=null;try{uid=JSON.parse(row).uid;}catch(_){return {state:'login'};}
    if(uid!=='u1')return {state:'forbidden'};
    const owner=base64url(await crypto.subtle.digest('SHA-256',encoder.encode(token))),now=Date.now();
    const lease=await env.AUTH_DB.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=excluded.expires_at WHERE auth_kv.expires_at<=? OR auth_kv.v=excluded.v RETURNING v").bind('active-session:u1',owner,now+LEASE,now).first('v');
    return lease===owner?{state:'ok',token}:{state:'busy'};
}
async function planSetup(request,env){
    if(!env.PREVIEW_PIN_PEPPER||!env.PREVIEW_PIN_HASH||!env.AUTH_DB||env.PREVIEW_PLAN_ACCOUNTS!=='1')return setupShell('<h1>4プランのパスワード設定</h1><p class="err">この確認版では4プランを使っていません。</p>',503);
    if(!['GET','POST'].includes(request.method))return reply('method_not_allowed',405);
    if(env.PREVIEW_ACCESS_CODES)return request.method==='GET'?setupShell('<h1>確認版のプラン</h1><p>パスワードに対応するプランで開く方式になりました。この設定画面で4桁の番号を登録する必要はありません。</p><p><a class="link" href="/preview-login">確認版にログイン</a></p>'):reply('fixed_preview_access',409);
    const s=await setupSession(request,env);
    if(s.state==='login')return request.method==='GET'?new Response(null,{status:303,headers:{Location:'/preview-login?next=plan-setup','Cache-Control':'no-store'}}):reply('unauthorized',401);
    if(s.state==='forbidden')return setupShell('<h1>4プランのパスワード設定</h1><p class="err">この画面は、通常の確認版（管理者）でログインしたときだけ使えます。</p><p><a class="link" href="/">確認版に戻る</a></p>',403);
    if(s.state==='busy')return setupShell('<h1>4プランのパスワード設定</h1><p class="err">別の端末で確認版を使用中です。この端末で使うには、もう一度ログインしてください。</p><p><a class="link" href="/preview-login?next=plan-setup">ログインしなおす</a></p>',409);
    const url=new URL(request.url);
    if(request.method==='GET')return await setupPage(env,s.token,{message:url.searchParams.get('saved')==='1'?'4プランのパスワードを保存しました。番号はこの画面に残していません。':''});
    if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return reply('bad_content_type',415);
    if(!await reserveAttempt(env.AUTH_DB,'preview-setup:u1',10))return await setupPage(env,s.token,{error:'保存を試した回数が多いため、15分後にもう一度試してください。',status:429});
    let fields;try{fields=new URLSearchParams(await limitedBody(request));}catch(_){return await setupPage(env,s.token,{error:'入力を確認してください。',status:400});}
    const names=['csrf',...Object.values(PLAN_FIELDS).flatMap(([f])=>[f,f+'_confirm'])];
    if([...fields.keys()].length!==names.length||names.some(n=>fields.getAll(n).length!==1))return await setupPage(env,s.token,{error:'入力を確認してください。',status:400});
    if(!equal(fields.get('csrf'),await digest('plan-setup-csrf:'+s.token,env.PREVIEW_PIN_PEPPER)))return await setupPage(env,s.token,{error:'画面の有効期限が切れました。開きなおしてから入力してください。',status:403});
    const pins={};
    for(const [uid,[f,label]] of Object.entries(PLAN_FIELDS)){
        const a=fields.get(f),b=fields.get(f+'_confirm');
        if(!/^\d{4}$/.test(a)||!/^\d{4}$/.test(b))return await setupPage(env,s.token,{error:label+'：4桁の数字を入力してください。',status:400});
        if(!equal(a,b))return await setupPage(env,s.token,{error:label+'：確認用の番号が一致しません。',status:400});
        pins[uid]=a;
    }
    if(new Set(Object.values(pins)).size!==4)return await setupPage(env,s.token,{error:'4つのプランには、それぞれ別の番号を設定してください。',status:400});
    for(const pin of Object.values(pins))if(equal(await digest(pin,env.PREVIEW_PIN_PEPPER),env.PREVIEW_PIN_HASH))return await setupPage(env,s.token,{error:'通常の確認版と同じ番号は使えません。',status:400});
    const now=Date.now(),db=env.AUTH_DB,statements=[];
    for(const [uid,pin] of Object.entries(pins))statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0').bind(planPinKey(uid),await planPinDigest(uid,pin,env)));
    statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('preview-profile-pin-meta',JSON.stringify({at:now,by:'u1'})));
    try{await db.batch(statements);}catch(_){return await setupPage(env,s.token,{error:'保存できませんでした。どの番号も変わっていません。もう一度試してください。',status:503});}
    await releaseAttempt(db,'preview-setup:u1');
    return new Response(null,{status:303,headers:{Location:'/preview-plan-setup?saved=1','Cache-Control':'no-store'}});
}

export default {
    async scheduled(event,env,ctx) {
        app.scheduled(event,env,ctx);
        ctx.waitUntil(pushBroadcastRelease(env,{version:env.PREVIEW_RELEASE_VERSION,body:'確認版を更新しました。タップして変更内容を確認できます。',at:Date.now()}));
    },
    async fetch(request,env,ctx) {
        try {
            const url=new URL(request.url);
            const isApi=url.pathname==='/api'||url.pathname.startsWith('/api/');
            const path=url.pathname==='/api'?'/':isApi?url.pathname.slice(4):url.pathname;
            if(url.origin!==env.APP_ORIGIN)return reply('wrong_environment',403);
            const origin=request.headers.get('Origin');
            if(url.pathname==='/preview-password'&&origin===MAIN_ORIGIN&&request.method==='POST') {
                const response=await login(request,env,true),headers=new Headers(response.headers);
                headers.set('Access-Control-Allow-Origin',MAIN_ORIGIN);headers.set('Vary','Origin');
                return new Response(response.body,{status:response.status,headers});
            }
            if(url.pathname==='/preview-enter'&&origin===MAIN_ORIGIN&&request.method==='POST') {
                if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return reply('bad_content_type',415);
                const fields=new URLSearchParams(await limitedBody(request)),ticket=fields.get('ticket')||'';
                if([...fields.keys()].length!==1||!/^[-_A-Za-z0-9]{43}$/.test(ticket))return reply('invalid_ticket',401);
                const row=await env.AUTH_DB.prepare('DELETE FROM auth_kv WHERE k=? AND expires_at>? RETURNING v').bind('preview-handoff:'+ticket,Date.now()).first();
                if(!row)return reply('invalid_ticket',401);
                let entry;try{entry=JSON.parse(row.v);}catch(_){entry=row.v===MAIN_ORIGIN?{origin:MAIN_ORIGIN,uid:'u1'}:null;}
                if(!entry||entry.origin!==MAIN_ORIGIN)return reply('invalid_ticket',401);
                return await openSession(env,entry.uid);
            }
            if((origin&&origin!==url.origin)||(!['GET','HEAD'].includes(request.method)&&origin!==url.origin))return reply('origin_rejected',403);
            if(url.pathname==='/admin-nao')return await adminEntry(request,env);
            if(url.pathname==='/preview-account-setup')return await accountSetup(request,env);
            if(url.pathname==='/preview-login')return request.method==='GET'?loginPage('',url.searchParams.get('next')==='admin'?'admin':url.searchParams.get('next')==='plan-setup',!!env.PREVIEW_ACCESS_CODES):request.method==='POST'?await login(request,env):reply('method_not_allowed',405);
            if(url.pathname==='/preview-plan-setup')return await planSetup(request,env);
            if(url.pathname.startsWith('/problem-pdf/')) {
                return await app.fetch(request,env,ctx);
            }
            if(['/icon-192.png','/favicon-64.png','/manifest.json','/admin-icon-192.png','/admin-icon-512.png','/admin-favicon-64.png','/admin-apple-touch-icon.png','/admin-manifest.webmanifest'].includes(url.pathname)&&['GET','HEAD'].includes(request.method))return await env.ASSETS.fetch(request);
            const token=await cookieSession(request,env);
            if(!token)return url.pathname==='/'?loginPage():reply('unauthorized',401);
            if(/^\/auth\/(start|legacy|callback)/.test(path))return reply('preview_login_only',403);
            if(['/school-results','/september-test','/september-review-pdf'].includes(path))return reply('not_available_in_preview',503);
            if(isApi) {
                const headers=new Headers(request.headers);headers.set('Authorization','Bearer '+token);
                const backendUrl=new URL(url);backendUrl.pathname=path;
                const response=await app.fetch(new Request(backendUrl,new Request(request,{headers})),env,ctx);
                if(path==='/push'&&response.ok&&env.NOTICE_VAPID_JWK&&ctx?.waitUntil)ctx.waitUntil(pushBroadcastRelease(env,{version:env.PREVIEW_RELEASE_VERSION,body:'確認版を更新しました。タップして変更内容を確認できます。',at:Date.now()}));
                const safeHeaders=new Headers(response.headers);safeHeaders.delete('Access-Control-Allow-Origin');
                if(path==='/auth/logout'&&response.ok)safeHeaders.set('Set-Cookie',`${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`);
                return new Response(response.body,{status:response.status,headers:safeHeaders});
            }
            if(!['GET','HEAD'].includes(request.method))return reply('method_not_allowed',405);
            const asset=await env.ASSETS.fetch(request),headers=new Headers(asset.headers);
            headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, noarchive');headers.set('Referrer-Policy','no-referrer');
            return new Response(asset.body,{status:asset.status,headers});
        }catch(e){return reply('temporarily_unavailable',503);}
    }
};
