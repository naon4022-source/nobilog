// 2026-10-22 サーバー強化の検証：1つのIPからの回数制限（ログインの入口20回/分・全体600回/分）、localhost の許可を本番で閉じる、古い版のURLを閉じる。
// 偽の制限部品・合成のデータベースだけを使う。本物のサーバー・本物のアカウントには通信しない。
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';
import worker from './candidate/cf-worker/src/index.js';
import {resetGuardMemory} from './candidate/cf-worker/src/guard.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
function limiter(limit){const n=new Map();return {keys:n,async limit({key}){const c=(n.get(key)||0)+1;n.set(key,c);return {success:c<=limit};}};}
function env(extra={}){resetGuardMemory();const db=new D1SQLite(),kv=new Map();return {AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},APP_ORIGIN:'https://nobilog.pages.dev',...extra};}
const call=(e,path,{ip='203.0.113.5',origin='https://nobilog.pages.dev',method='GET',body}={})=>worker.fetch(new Request('https://synthetic.test'+path,{method,headers:{Origin:origin,'CF-Connecting-IP':ip,'Content-Type':'application/json'},body}),e);
// ログイン開始は1分に20回まで（同じIP）。21回目から429。ほかのIPは止めない
{const e=env({RL_AUTH:limiter(20),RL_ALL:limiter(600)});let last;
 for(let i=0;i<20;i++){last=await call(e,'/auth/start?provider=google&mode=login');ok(last.status!==429,'auth start '+(i+1)+' allowed');}
 last=await call(e,'/auth/start?provider=google&mode=login');ok(last.status===429,'21st auth start from the same IP is refused');ok(last.headers.get('Retry-After')==='60','tells when to retry');
 ok((await last.json()).error==='too_many_requests','clear error');
 ok((await call(e,'/auth/start?provider=google&mode=login',{ip:'198.51.100.7'})).status!==429,'another IP is not affected');
 ok((await call(e,'/auth/me')).status===401,'normal requests from the limited IP still work (only the login entry is limited)');

}
// 全体は1分に600回まで
{const e=env({RL_ALL:limiter(600)});let s=0;for(let i=0;i<600;i++)if((await call(e,'/news')).status===429)s++;ok(s===0,'600 requests per minute allowed');ok((await call(e,'/news')).status===429,'601st request from the same IP is refused');}
// Cloudflareの部品がなくても、メモリでの数えで止まる（ログイン入口20回/分）
{const e=env();let last;for(let i=0;i<21;i++)last=await call(e,'/auth/start?provider=google&mode=login',{ip:'192.0.2.44'});ok(last.status===429,'memory limiter stops the 21st login-entry call without Cloudflare bindings');}
// 制限の部品がない・こわれているときは、止めずに今までどおり（サービスを止めない）
{const e=env();ok((await call(e,'/auth/me')).status===401,'works without limiter bindings');
 const broken={limit:async()=>{throw Error('limiter down');}};const e2=env({RL_AUTH:broken,RL_ALL:broken});ok((await call(e2,'/auth/me')).status===401,'a failing limiter does not block');}
// localhost からの呼び出しは本番では403、開発用の設定のときだけ許す
{const e=env();ok((await call(e,'/auth/me',{origin:'http://localhost:8080'})).status===403,'localhost origin refused in production');
 ok((await call(e,'/auth/me',{origin:'http://127.0.0.1:5173'})).status===403,'127.0.0.1 origin refused in production');
 ok((await call(e,'/auth/me',{origin:'https://evil.invalid'})).status===403,'foreign origin refused');
 ok((await call(e,'/auth/me')).status===401,'the app origin still reaches the API');
 ok((await call(env({ALLOW_LOCAL_ORIGIN:'1'}),'/auth/me',{origin:'http://localhost:8080'})).status===401,'localhost allowed only with the development flag');}
// 設定：古い版のURLを閉じる・制限の部品を正しく設定
{const t=(await readFile(new URL('candidate/cf-worker/wrangler.jsonc',import.meta.url),'utf8')).replace(/^\s*\/\/.*$/gm,'');const c=JSON.parse(t);
 ok(c.preview_urls===false,'old version preview URLs are closed');ok(c.workers_dev===true,'the app URL stays the same');
 const rl=Object.fromEntries((c.ratelimits||[]).map(r=>[r.name,r]));ok(rl.RL_AUTH?.simple.limit===20&&rl.RL_AUTH.simple.period===60,'login entry limit 20/min');ok(rl.RL_ALL?.simple.limit===600&&rl.RL_ALL.simple.period===60,'overall limit 600/min');
 ok(rl.RL_AUTH.namespace_id!==rl.RL_ALL.namespace_id,'separate counters');
 ok(!c.vars.ALLOW_LOCAL_ORIGIN,'production config does not allow localhost');}
// のびログ・ガード：変な呼び出し・存在しない場所・種類・大きさ・ブロック・ヘッダー・CORS・記録
{const e=env({RL_ATTACK:limiter(5),RL_SCAN:limiter(30),RL_ALL:limiter(600)});
 for(const p of ['/../../etc/passwd','/.env','/wp-admin/install.php','/save?x=<script>alert(1)</script>','/news?q=1%20union%20select%201','/news?f=%2e%2e%2f%2e%2e%2fetc'])ok((await call(e,p)).status===403,'attack pattern refused: '+p);
 const r=await call(e,'/.git/config');ok(r.status===403,'6th attack from the same IP');ok((await call(e,'/news')).status===403,'that IP is now blocked for normal requests too');
 const ev=e.AUTH_DB.prepare("SELECT v FROM auth_kv WHERE k>='guard-event:' AND k<'guard-event:￿'");const rows=(await ev.all()).results;ok(rows.length===1,'one block event recorded (no write flood)');
 ok(!JSON.stringify(rows).includes('203.0.113.5'),'the raw IP is never stored');
 ok((await call(e,'/news',{ip:'198.51.100.9'})).status===401,'other IPs keep working');
 let n=0;for(let i=0;i<31;i++)if((await call(e,'/no-such-'+i,{ip:'198.51.100.20'})).status===404)n++;ok(n===31,'unknown paths are 404');ok((await call(e,'/news',{ip:'198.51.100.20'})).status===403,'scanning many unknown paths blocks the IP');}
{const e=env();
 for(const m of ['PUT','DELETE','PATCH'])ok((await call(e,'/save',{method:m})).status===405,m+' refused');
 const big=await worker.fetch(new Request('https://synthetic.test/save',{method:'POST',headers:{Origin:'https://nobilog.pages.dev','Content-Length':'30000000','Content-Type':'application/json'},body:'{}'}),e);ok(big.status===413,'too large refused before reading');
 const r=await call(e,'/auth/me');for(const [h,v] of [['x-content-type-options','nosniff'],['x-frame-options','DENY'],['referrer-policy','no-referrer']])ok(r.headers.get(h)===v,h);
 ok(r.headers.get('strict-transport-security')?.includes('max-age=31536000'),'HSTS');ok(r.headers.get('content-security-policy')?.includes("default-src 'none'"),'API responses cannot run as pages');
 ok(r.headers.get('access-control-allow-origin')==='https://nobilog.pages.dev','CORS allows only the real app (not *)');
 const o=await call(e,'/auth/me',{method:'OPTIONS'});ok(o.status===204&&o.headers.get('access-control-allow-origin')==='https://nobilog.pages.dev','preflight also limited to the app');
 ok((await call(e,'',{})).status===401,'root board path still reaches the app logic');}
// /guard/status はなお（u1）だけ
{const e=env();e.AUTH_DB.seed('session:t-u1',JSON.stringify({uid:'u1',name:'S',provider:'pin'}),Date.now()+3600000);e.AUTH_DB.seed('session:t-u2',JSON.stringify({uid:'u2',name:'S',provider:'pin'}),Date.now()+3600000);
 const g=(t)=>worker.fetch(new Request('https://synthetic.test/guard/status',{headers:{Origin:'https://nobilog.pages.dev','CF-Connecting-IP':'203.0.113.5',Authorization:'Bearer '+t}}),e);
 ok((await g('t-u1')).status===200,'u1 can read guard status');ok((await g('t-u2')).status===403,'u2 cannot');ok((await g('nope')).status===401,'no session cannot');}
// Google：メールアドレスはもらわない。IDは鍵をかけた形で保存し、前の形の人はログイン時に移す
{const e=env({PIN_PEPPER:'synthetic-pepper',GOOGLE_CLIENT_ID:'cid',GOOGLE_CLIENT_SECRET:'sec'});const of=globalThis.fetch;
 try{
  const start=await call(e,'/auth/start?provider=google&mode=login');const loc=start.headers.get('location')||'';ok(start.status===302&&new URL(loc).searchParams.get('scope')==='openid profile','Google is asked only for openid profile (no email)');
  const state=new URL(loc).searchParams.get('state');e.AUTH_DB.seed('identity:google:sub-raw-123','u1');
  globalThis.fetch=async url=>{if(String(url).includes('/token'))return Response.json({access_token:'synthetic-only'});if(String(url).includes('/userinfo'))return Response.json({sub:'sub-raw-123',name:'X',email:'leak@example.com'});throw Error('unexpected '+url);};
  const cb=await call(e,'/auth/callback/google?state='+encodeURIComponent(state)+'&code=c');ok(cb.status===302&&(cb.headers.get('location')||'').includes('#auth='),'old-format linked user still logs in');
  const all=JSON.stringify((await e.AUTH_DB.prepare("SELECT k,v FROM auth_kv").all()).results);
  ok(!all.includes('sub-raw-123'),'the raw Google ID is no longer stored anywhere');ok(!all.includes('leak@example.com'),'the email address is never stored');
  ok(/identity:google:h1:/.test(all),'the hashed identity key is stored');
 }finally{globalThis.fetch=of;}}
console.log('Server hardening (のびログ・ガード): '+checks+' checks passed; attack patterns/scan/flood blocking with hashed IP records, method/size limits, security headers, CORS app-only, u1-only status, Google email not requested and IDs hashed with migration, per-IP limits (login entry 20/min, all 600/min, other IPs unaffected, fail-open), localhost origin closed in production, preview URLs off; synthetic only');
