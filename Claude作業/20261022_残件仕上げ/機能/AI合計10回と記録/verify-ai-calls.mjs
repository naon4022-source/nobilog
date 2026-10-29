// 合計10回・全記録・Claude 接続の確認（本物の鍵・本物の通信は使わない。にせの fetch と隔離 SQLite）
import {createRequire} from 'node:module';
import {runRealAITrial} from '../../../../cf-worker/src/ai-trial-control.mjs';
import {loggedCall,callLog} from './ai-call-log.mjs';
import {anthropicMessage} from './anthropic-transport.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
const now=Date.UTC(2026,9,22,3),date='2026-10-22',db=new D1SQLite();
// にせの Anthropic
const KEY='test-only-key';let hits=0;
const fakeFetch=async(url,init)=>{hits++;ok(url==='https://api.anthropic.com/v1/messages'&&init.redirect==='error'&&init.headers['x-api-key']===KEY&&init.headers['anthropic-version']==='2023-06-01','request shape');const body=JSON.parse(init.body);
 const resp={type:'message',model:body.model,content:[{type:'text',text:'ヒント：まず両辺に3をたそう。'}],usage:{input_tokens:120,output_tokens:30},stop_reason:'end_turn'};
 return new Response(JSON.stringify(resp),{status:200});};
const claude=signal=>anthropicMessage({apiKey:KEY,model:'claude-haiku-5-5',messages:[{role:'user',content:'2x-3=5 のヒント'}],signal,fetchImpl:fakeFetch});
const openaiFake=async()=>({text:'ok',usage:{input_tokens:10,output_tokens:5}});
// Claude 6回＋ChatGPT 4回＝10回、11回目はどちらでも送らない
for(let i=0;i<6;i++){const r=await loggedCall(db,{provider:'anthropic',model:'claude-haiku-5-5',purpose:'hint',uid:'u1'},claude,{now,run:runRealAITrial});ok(r.text&&r.usage.input_tokens===120,'claude call '+(i+1));}
for(let i=0;i<4;i++){const r=await loggedCall(db,{provider:'openai',model:'gpt-6-luna',purpose:'hint',uid:'u2'},openaiFake,{now,run:runRealAITrial});ok(r.text==='ok','openai call '+(i+1));}
const h=hits;const r11=await loggedCall(db,{provider:'anthropic',model:'claude-haiku-5-5',purpose:'hint',uid:'u1'},claude,{now,run:runRealAITrial});
ok(r11.error==='ai_trial_daily'&&hits===h,'11th call (combined) is not sent');
const log=await callLog(db,date);
ok(log.length===11,'every call recorded ('+log.length+')');
ok(log.filter(x=>x.outcome==='success').length===10&&log.filter(x=>x.outcome==='unsent').length===1,'10 success + 1 unsent');
ok(log.filter(x=>x.provider==='anthropic').length===7&&log.filter(x=>x.provider==='openai').length===4,'provider recorded');
const raw=JSON.stringify((await db.prepare("SELECT v FROM auth_kv WHERE k LIKE 'ai-log:%'").all()).results);
ok(!raw.includes('ヒント')&&!raw.includes('2x-3')&&!raw.includes(KEY),'no prompt, answer or key in the log');
ok(log.filter(x=>x.provider==='anthropic'&&x.outcome==='success').every(x=>x.usage&&x.usage.input===120),'token counts kept for cost checks');
// 送ったあと結果が返らない（途中で止まった）→ unknown として残る（無料扱いにしない）
const db2=new D1SQLite();
await loggedCall(db2,{provider:'anthropic',model:'claude-haiku-5-5',purpose:'hint',uid:'u1'},async()=>{throw new Error('crash');},{now,run:async(d,w)=>{await w(new AbortController().signal);}}).catch(()=>{});
ok((await callLog(db2,date))[0].outcome==='unknown','sent but no result → unknown');
// 失敗の記録
const db3=new D1SQLite();const bad=async(url,init)=>{hits++;return new Response('{"error":{"message":"secret detail"}}',{status:500});};
const rf=await loggedCall(db3,{provider:'anthropic',model:'claude-haiku-5-5',purpose:'hint',uid:'u1'},s=>anthropicMessage({apiKey:KEY,model:'claude-haiku-5-5',messages:[{role:'user',content:'x'}],signal:s,fetchImpl:bad}),{now,run:runRealAITrial});
ok(rf.error==='ai_provider_down'&&!JSON.stringify(rf).includes('secret detail'),'provider error mapped, body not echoed');
const lf=(await callLog(db3,date))[0];ok(lf.outcome==='failed'&&lf.reason==='ai_provider_down','failure recorded with reason code');
// 使えないモデル・おかしな入力は送らない
ok((await loggedCall(db3,{provider:'anthropic',model:'claude-opus-5-5',purpose:'hint',uid:'u1'},claude,{now,run:runRealAITrial})).error==='ai_model_not_allowed','model allowlist');
ok((await anthropicMessage({apiKey:'',model:'claude-haiku-5-5',messages:[{role:'user',content:'x'}],fetchImpl:fakeFetch})).error==='ai_not_configured','no key → not configured, no request');
const big=async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(70*1024));c.close();}}),{status:200});
ok((await anthropicMessage({apiKey:KEY,model:'claude-haiku-5-5',messages:[{role:'user',content:'x'}],fetchImpl:big})).error==='ai_response_too_large','64KB response cap');
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f);process.exit(f?1:0);
