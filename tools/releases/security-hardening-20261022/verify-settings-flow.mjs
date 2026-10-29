import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import {createHmac} from 'node:crypto';
import worker from './candidate/cf-worker/src/index.js';
const H=new URL('./',import.meta.url),require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=createServer(async(req,res)=>{const name=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const b=await readFile(new URL('candidate/pages/'+name,H));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript;charset=utf-8':name.endsWith('.html')?'text/html;charset=utf-8':'application/json');res.end(b);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const app='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true}),originalFetch=globalThis.fetch;let checks=0;
const ok=(v,m)=>{assert(v,m);checks++;};await mkdir(new URL('screens/',H),{recursive:true});
try{for(const uid of ['u1','u2','u4'])for(const width of [390,1440]){
 const db=new D1SQLite(),kv=new Map(),token='synthetic-current-'+uid,env={AUTH_DB:db,BOARD:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},ALLOW_LOCAL_ORIGIN:'1',APP_ORIGIN:'https://nobilog.pages.dev',PIN_PEPPER:'synthetic-pepper',TURNSTILE_SECRET:'synthetic-turnstile',GOOGLE_CLIENT_ID:'synthetic-client',GOOGLE_CLIENT_SECRET:'synthetic-secret'};
 for(const[id,key]of [['u1','NAO'],['u2','RIRAN'],['u4','SOUTA']])env['LEGACY_'+key+'_PIN_HASH']=createHmac('sha256',env.PIN_PEPPER).update(id===uid?'0000':'synthetic-other-'+id).digest('base64url');
 db.seed('session:'+token,JSON.stringify({uid,name:'Synthetic',provider:'pin'}),Date.now()+3600000);db.seed('identity:google:old-'+uid,uid);
 const other=['u1','u2','u4'].filter(id=>id!==uid);for(const id of other)db.seed('cloud-save:'+id,'synthetic-protected-'+id);
 globalThis.fetch=async url=>{if(String(url).includes('/siteverify'))return Response.json({success:true,hostname:'nobilog.pages.dev',action:'legacy_login',challenge_ts:new Date().toISOString()});if(String(url).includes('/token'))return Response.json({access_token:'synthetic-access'});if(String(url).includes('/userinfo'))return Response.json({sub:'new-'+uid,name:'Synthetic'});throw Error('unexpected external dependency');};
 const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'});page.setDefaultTimeout(20000);let chooser=null;const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.addInitScript(()=>{window.turnstile={render:(sel,options)=>{window.tsOptions=options;return 'synthetic';},reset(){}};});
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.hostname==='127.0.0.1')return route.continue();if(u.hostname==='accounts.google.com'){chooser=new URL(u);return route.fulfill({status:200,contentType:'text/html;charset=utf-8',body:'<h1>合成Google選択</h1>'});}if(!u.hostname.endsWith('workers.dev'))return route.abort();
 const response=await worker.fetch(new Request(req.url(),{method:req.method(),headers:await req.allHeaders(),...(['GET','HEAD'].includes(req.method())?{}:{body:req.postData()||''})}),env,{waitUntil:p=>p.catch(()=>{})});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});});
 try{
 await page.goto(app+'/',{waitUntil:'load'});await page.evaluate(async({uid,token})=>{pwaIsApp=()=>true;recordStorage.setItem(AUTH_KEY,token);await completeLogin({...APP_USERS.find(u=>u.id===uid),provider:'pin',googleLinked:true});switchView('settings');},{uid,token});
 await page.getByText('Googleと連携済みです。',{exact:true}).waitFor();ok(true,'own connected state '+uid+' '+width);
 await page.evaluate(()=>{noticeToastsClear();document.getElementById('confetti-layer')?.classList.remove('on');});
 await page.locator('#google-account-settings').scrollIntoViewIfNeeded();
 await page.screenshot({path:new URL('screens/settings-'+uid+'-'+width+'.png',H).pathname});
 await page.getByRole('button',{name:'Googleとの連携を解除する',exact:true}).click();await page.locator('#login-overlay.on').waitFor();
 ok(db.get('identity:google:old-'+uid).v===uid,'not unlinked before fresh verification');
 await page.locator('#login-pin').fill('0000');await page.waitForFunction(()=>!!window.tsOptions);await page.evaluate(()=>tsOptions.callback('synthetic-unlink-proof-'+Date.now()));await page.getByRole('button',{name:'本人確認して解除する',exact:true}).click();
 await page.getByText('Googleは未連携です。',{exact:true}).waitFor();ok(db.get('identity:google:old-'+uid).v==='','only verified unlink changes binding');ok(await page.evaluate(()=>currentUserId)===uid,'same user after unlink');
 await page.getByRole('button',{name:'Googleアカウントと連携する',exact:true}).click();await page.locator('#login-pin').fill('0000');await page.evaluate(()=>tsOptions.callback('synthetic-link-proof-'+Date.now()));await page.getByRole('button',{name:'本人確認してGoogleへ進む',exact:true}).click();
 await page.getByRole('heading',{name:'合成Google選択',exact:true}).waitFor();ok(!!chooser,'official chooser reached');ok(!chooser.href.includes(token)&&!chooser.href.includes('0000'),'no PIN/session in Google URL');
 const state=chooser.searchParams.get('state');const response=await worker.fetch(new Request('https://synthetic.test/auth/callback/google?state='+state+'&code=synthetic-code',{headers:{Origin:env.APP_ORIGIN}}),env,{});ok(response.status===302&&response.headers.get('location').endsWith('#google_link=ok'),'callback completes existing-user binding');
 {const rows=(await db.prepare("SELECT k,v FROM auth_kv WHERE k>='identity:google:' AND k<'identity:google:\uffff'").all()).results;ok(rows.some(r=>/^identity:google:h1:/.test(r.k)&&r.v===uid)&&!rows.some(r=>r.k.includes('new-'+uid)),'correct Google bound to existing user (ID stored only hashed)');}   // 2026-10-22：GoogleのIDは鍵をかけた形で保存
 await page.goto(app+'/#google_link=ok',{waitUntil:'load'});await page.waitForFunction(()=>serverBootReady&&!authLeaseBlocked);await page.evaluate(()=>switchView('settings'));await page.getByText('Googleと連携済みです。',{exact:true}).waitFor();ok(true,'linked state restored from server');
 for(const id of other)ok(db.get('cloud-save:'+id).v==='synthetic-protected-'+id,'other learning record preserved');
 ok(errors.length===0,'no page errors '+errors.join(' / '));console.log('Settings flow passed',uid,width);
 }catch(e){console.log('Flow failure',uid,width,await page.locator('#login-err').textContent().catch(()=>''));throw e;}finally{await page.close();db.close();}
}
await writeFile(new URL('settings-flow-result.json',H),JSON.stringify({status:'passed',checks,users:['u1','u2','u4'],widths:[390,1440],scope:'actual public HTML + Worker/SQLite; fake Turnstile and Google; no real data'},null,2)+'\n');console.log('Google settings full isolated flow:',checks,'checks passed');
}finally{globalThis.fetch=originalFetch;await browser.close();server.close();}
