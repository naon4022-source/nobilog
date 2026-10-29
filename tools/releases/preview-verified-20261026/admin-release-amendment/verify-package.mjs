import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url);
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const stage=process.argv.includes('--stage')?JSON.parse(await readFile(new URL('stage.json',here))).stage:path.resolve(root.pathname);
const config=JSON.parse(await readFile(path.join(stage,'preview/wrangler.jsonc')));
assert.equal(config.main,'build/verified-preview-entry.mjs');
const {default:preview}=await import(pathToFileURL(path.join(stage,'preview',config.main)));
const db=new D1SQLite(),origin='https://fixture.test',encoder=new TextEncoder(),pepper='synthetic-preview-package-key';
const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const hash=async text=>Buffer.from(await crypto.subtle.sign('HMAC',key,encoder.encode(text))).toString('base64url');
const plans=['free','mini','standard','pro','unlimit'],hashes={};
for(const [i,plan]of plans.entries())hashes['p_'+plan]=await hash('p_'+plan+'|'+String(2100+i));
let checks=0,external=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const env={APP_ORIGIN:origin,AUTH_DB:db,BOARD:{get:async()=>null,put:async()=>{}},ASSETS:{fetch:async()=>new Response('synthetic asset')},PREVIEW_PIN_PEPPER:pepper,PREVIEW_PIN_HASH:await hash('2468'),PREVIEW_PLAN_PEPPER:pepper,PREVIEW_PLAN_HASHES:JSON.stringify(hashes),PREVIEW_PLAN_ACCOUNTS:'1',SUBSCRIPTION_PREVIEW:'1',PLAN_CREDITS_V2:'1',GEMINI_ENABLED:'0',OPENAI_ENABLED:'0'};
const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{external++;throw Error('external network forbidden');};
try{
 const page=await readFile(path.join(stage,'preview/build/assets/index.html'),'utf8');
 const backend=await readFile(path.join(stage,'preview/build/backend.mjs'),'utf8');
 ok(page.includes('id="preview-admin-disabled"'),'paused admin cannot open from the app entry');
 ok(!page.includes('src="/admin-studio.js"'),'paused admin studio is not loaded');
 ok(page.includes('src="/admin.js"')&&page.includes('href="/admin.css"'),'shared newspaper implementation and styling retained');
 ok(!page.includes('src="/coop-story-entry.js"'),'unfinished V3 entry excluded');
 ok(!backend.includes("import('./coop-story.mjs')"),'unfinished V3 code is not bundled');
 for(const book of ['math1','kokugo1','english1','science1','geography','history']){
  const original=JSON.parse(await readFile(new URL('site-assets/textbook-book-'+book+'.json',root)));
  const expected=structuredClone(original);
  const gate=value=>{if(Array.isArray(value)){value.forEach(gate);return;}if(!value||typeof value!=='object')return;if(book!=='math1'&&value.t==='media'&&value.kind==='video'&&value.id!=='G-C2-S1-VP')value.src=null;Object.values(value).forEach(gate);};
  gate(expected);
  assert.deepEqual(JSON.parse(await readFile(path.join(stage,'preview/build/assets/textbook-book-'+book+'.json'))),expected,'only unreviewed video sources are gated; all text/questions/answers/diagrams retained '+book);checks++;
 }
 ok((await preview.fetch(new Request(origin+'/api/coop-story/meta'),env,{})).status===401,'API still requires preview authentication');
 for(const [i,plan]of plans.entries()){
  const uid='p_'+plan;
  const login=await preview.fetch(new Request(origin+'/preview-login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded','CF-Connecting-IP':'192.0.2.'+(i+1)},body:new URLSearchParams({profile:uid,password:String(2100+i)})}),env,{});
  ok(login.status===303,'synthetic profile login '+plan);
  const cookie=login.headers.get('Set-Cookie')?.split(';')[0];ok(!!cookie,'private cookie present');
  const get=p=>preview.fetch(new Request(origin+'/api'+p,{headers:{Cookie:cookie}}),env,{});
  const me=await get('/auth/me');ok(me.status===200&&(await me.json()).user.id===uid,'authenticated profile retained');
  const response=await get('/plan'),status=await response.json();ok(response.status===200&&status.plan===plan,'actual server plan '+plan);
  for(const [feature,rank]of [['hints',1],['planning',2],['chat',3],['notes',3],['annotations',3],['weakness',3],['fullExplanation',4],['nao',4]])ok(status.features[feature]===(i>=rank),'server feature boundary '+plan+' '+feature);
  const review=await get('/learning-review');ok(review.status===(i>=3?200:403),'direct paid endpoint preserves plan lock');
  ok((await get('/coop-story/meta')).status===404,'unfinished V3 cannot be entered directly');
  ok((await get('/newspaper')).status===200,'normal newspaper reading retained for '+plan);
 }
 const operator=await preview.fetch(new Request(origin+'/preview-login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded','CF-Connecting-IP':'192.0.2.99'},body:new URLSearchParams({profile:'u1',password:'2468'})}),env,{});
 ok(operator.status===303,'synthetic existing operator identity still logs in');
 const operatorCookie=operator.headers.get('Set-Cookie')?.split(';')[0];
 for(const p of ['/admin/workspace','/admin/profiles','/admin/health'])ok((await preview.fetch(new Request(origin+'/api'+p,{headers:{Cookie:operatorCookie}}),env,{})).status===404,'paused admin API blocked even for owner');
 for(const p of ['/admin-nao','/preview-account-setup','/preview-plan-setup'])ok((await preview.fetch(new Request(origin+p,{headers:{Cookie:operatorCookie}}),env,{})).status===404,'paused setup/entry route blocked');
 ok(external===0,'no provider or external API used');
 ok(!db.keys().some(k=>/^(material-history:|record:|openai-operation:)/.test(k)),'no learning/grading/provider operations created');
 const result={status:'passed',checks,scope:'Actual dedicated preview wrapper and built Worker, five isolated plan logins, server feature matrix/direct paid endpoint locks, V3 entry/API exclusion. Synthetic SQLite and credentials only; no deployment or real account data.',externalRequests:external};
 await writeFile(new URL(process.argv.includes('--stage')?'stage-package-admin-result.json':'package-result.json',here),JSON.stringify(result,null,2)+'\n');
 console.log('Verified preview package:',checks,'isolated account/plan/lock checks passed');
}finally{globalThis.fetch=originalFetch;db.close();}
