// 💳 サブスク：確認版の仮ルール（Claude・2026-10-09）。env.SUBSCRIPTION_PREVIEW==='1' の確認版だけで動く。本番では何もしない。
// 実契約・金額・回数の確定値には使わない（なおが決めるまで未適用）。画面には「確認版の仮ルール」と出す。
// 仮ルール：更新日＝開始日から1か月ごと（31日始まりは月末）・日本時間0時／上は即時・下は次の更新日から／期限後7日は猶予、8日目からFree／回数は繰り越さない。
import {MODELS,readiness} from './openai-policy.mjs';
import {creditPolicyOn,creditStatus,chargeCredits,refundCredits} from './subscription-credits.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export const PLANS={free:{label:'Free',ai:0,rank:0,yen:0,historyDays:1},mini:{label:'Mini',ai:30,rank:1,yen:500,historyDays:7},standard:{label:'Student',ai:150,rank:2,yen:1000,historyDays:21},pro:{label:'Pro',ai:300,rank:3,yen:1500,historyDays:31},unlimit:{label:'UNLIMIT',ai:null,rank:4,yen:2000,historyDays:1096}};
export const PREVIEW_PROFILES=Object.freeze({p_free:'free',p_mini:'mini',p_standard:'standard',p_pro:'pro',p_unlimit:'unlimit'});
const FAMILY=['u1','u2'],DAY=86400000,JST=9*3600000,GRACE=7*DAY;
const people=env=>env.PREVIEW_PLAN_ACCOUNTS==='1'?[...FAMILY,...Object.keys(PREVIEW_PROFILES)]:FAMILY;
export const subscriptionOn=env=>!!env&&env.SUBSCRIPTION_PREVIEW==='1';
const REASONS=['支払い確認（なお）','運営者','初回設定','確認版のテスト'];
const on=subscriptionOn;
const jstDate=t=>new Date(t+JST);
const midnight=(y,m,d)=>Date.UTC(y,m,d)-JST;
// 開始日から数えて、now を含む期間の始まりと終わり（暦の月ごと・月末そろえ）
export function period(start,now){
 const s=jstDate(start),day=s.getUTCDate();let y=s.getUTCFullYear(),m=s.getUTCMonth();
 const at=(yy,mm)=>{const last=new Date(Date.UTC(yy,mm+1,0)).getUTCDate();return midnight(yy,mm,Math.min(day,last));};
 let from=at(y,m);if(now<from)return {from,to:at(y,m+1)};
 for(let i=0;i<1200;i++){const to=at(y,m+1);if(now<to)return {from,to};from=to;m++;if(m>11){m=0;y++;}}
 return {from,to:from+30*DAY};
}
async function current(db,uid,now){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan:'+uid).first('v');
 const rowValue=raw?JSON.parse(raw):null;let row=rowValue;
 if(!row)return {plan:'free',state:'none',row:null};
 if(!PLANS[row.plan]||!Number.isSafeInteger(row.start)||(row.end!==null&&!Number.isSafeInteger(row.end)))throw Error('invalid contract');
 if(row.next&&PLANS[row.next.plan]&&now>=row.next.from)row={...row,plan:row.next.plan,start:row.next.start,end:row.next.end,next:null};
 let plan=row.plan,state='active';
 if(now<row.start)return {plan:'free',state:'before',row};
 if(row.end!==null&&now>=row.end){state=now<row.end+GRACE?'grace':'expired';if(state==='expired')plan='free';}
 return {plan,state,row};
}
async function usage(db,uid,from){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan-quota:'+uid+':'+from).first('v');
 if(raw){const v=JSON.parse(raw);if(!Number.isSafeInteger(v.n)||v.n<0||!Number.isSafeInteger(v.daily)||v.daily<0)throw Error('invalid usage');return v;}
 return {n:Number(await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('plan-ai:'+uid+':'+from).first('v'))||0,day:null,daily:0};
}
export async function initializePreviewPlan(env,uid,now=Date.now()){
 if(!on(env)||!env.AUTH_DB||!people(env).includes(uid))return;
 const plan=PREVIEW_PROFILES[uid]||(uid==='u1'?'unlimit':'free');
 const start=Math.floor((now+JST)/DAY)*DAY-JST;
 await env.AUTH_DB.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING').bind('plan:'+uid,JSON.stringify({plan,start,end:plan==='free'||uid==='u1'?null:start+365*DAY,next:null,revision:1,initializedAt:now,reason:PREVIEW_PROFILES[uid]?'確認版のテスト':uid==='u1'?'運営者':'初回設定'})).run();
}
// 活動履歴（回答の履歴）を画面に出す期間（2026-10-10）。見せる範囲を決めるだけで、回答・成績・ノートは消さない。
// Mini 1週間・Standard 3週間・Pro 暦で1か月・UNLIMIT 3年。Free と契約の仕組みがない人は今までどおり制限なし
export function historyWindow(plan,now){
 const d=new Date(now+JST),y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate(),rest=now+JST-Date.UTC(y,m,day);
 const back=(yy,mm)=>{if(mm<0){mm+=12;yy--;}const last=new Date(Date.UTC(yy,mm+1,0)).getUTCDate();return Date.UTC(yy,mm,Math.min(day,last))+rest-JST;};
 if(plan==='mini')return {from:now-7*DAY,label:'1週間'};
 if(plan==='standard')return {from:now-21*DAY,label:'3週間'};
 if(plan==='pro')return {from:back(y,m-1),label:'1か月'};
 if(plan==='unlimit')return {from:back(y-3,m),label:'3年'};
 return null;
}
export function planFeatures(plan){const rank=PLANS[plan]?.rank??0;return {hints:rank>=1,planning:rank>=2,chat:rank>=3,workbook:rank>=3,notes:rank>=3,annotations:rank>=3,weakness:rank>=3,fullExplanation:rank>=4,voice:rank>=4,aiAvatar:rank>=4,nao:rank>=4,archive:rank>=4};}
export async function planStatus(env,uid,now=Date.now()){
 if(!on(env)||!env.AUTH_DB||!people(env).includes(uid))return {provisional:false};
 await initializePreviewPlan(env,uid,now);
 const db=env.AUTH_DB,c=await current(db,uid,now),p=PLANS[c.plan];
 const per=c.row&&c.state!=='before'?period(c.row.anchor??c.row.start,now):null;
 const u=per?await usage(db,uid,per.from):{n:0,daily:0,day:null},n=u.n;
 const dailyUsed=u.day===Math.floor((now+JST)/DAY)?u.daily:0,dailyLimit=p.ai===null?1000:p.ai;
 const credits=creditPolicyOn(env)?await creditStatus(db,uid,c.plan,now):null;
 return {provisional:true,plan:c.plan,label:p.label,state:c.state,start:c.row?.start??null,end:c.row?.end??null,graceUntil:c.row?.end!=null?c.row.end+GRACE:null,next:c.row?.next||null,
  periodFrom:per?.from??null,renewAt:per?.to??null,aiLimit:p.ai,aiUsed:n,aiLeft:p.ai===null?null:Math.max(0,p.ai-n),dailyLimit,dailyUsed,dailyLeft:Math.max(0,dailyLimit-dailyUsed),yen:p.yen,historyDays:p.historyDays,features:planFeatures(c.plan),revision:c.row?.revision||0,initializedAt:c.row?.initializedAt||null,
  model:c.plan==='free'?null:c.plan==='unlimit'?MODELS.sol:MODELS.luna,
  advancedModel:['pro','unlimit'].includes(c.plan)?MODELS.sol:null,
  modelStatus:c.plan==='free'?'AI対象外':readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1'?'OpenAI試験利用（全体で1日10回まで）':'OpenAI接続準備中（実通信は停止中）',
  providerConfigured:readiness(env)&&env.OPENAI_BILLING_READY==='1'&&env.GEMINI_ENABLED!=='1',
  ...(credits?{...credits,aiLimit:c.plan==='unlimit'?null:credits.dailyLimit,aiUsed:credits.dailyUsed,aiLeft:c.plan==='unlimit'?null:credits.dailyLeft,quotaPeriod:'day'}:{})};
}
// AIを1回使ってよいか（確認版だけ）。よければ数を1つ増やす。本番ではいつも true（今までどおり）
export async function planUse(env,db,uid,now=Date.now(),receipt=null,units=2){
 if(!on(env))return true;
 if(!people(env).includes(uid))return false;
 await initializePreviewPlan(env,uid,now);
 const c=await current(db,uid,now),p=PLANS[c.plan];if(p.ai===0)return false;
 if(creditPolicyOn(env))return chargeCredits(db,uid,c.plan,now,receipt,units);
 const per=period(c.row.anchor??c.row.start,now),key='plan-quota:'+uid+':'+per.from,day=Math.floor((now+JST)/DAY),old=await usage(db,uid,per.from),limit=p.ai??1000000000,dailyLimit=p.ai??1000;
 const daily=old.day===day?old.daily:0;
 const r=await db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?, ?, ? WHERE ?<? AND ?<? ON CONFLICT(k) DO UPDATE SET v=json_object('n',CAST(json_extract(auth_kv.v,'$.n') AS INTEGER)+1,'day',?,'daily',CASE WHEN json_extract(auth_kv.v,'$.day')=? THEN CAST(json_extract(auth_kv.v,'$.daily') AS INTEGER)+1 ELSE 1 END) WHERE CAST(json_extract(auth_kv.v,'$.n') AS INTEGER)<? AND (CASE WHEN json_extract(auth_kv.v,'$.day')=? THEN CAST(json_extract(auth_kv.v,'$.daily') AS INTEGER) ELSE 0 END)<? RETURNING v").bind(key,JSON.stringify({n:old.n+1,day,daily:daily+1}),per.to+400*DAY,old.n,limit,daily,dailyLimit,day,day,limit,day,dailyLimit).first('v');
 const allowed=r!==null&&r!==undefined;
 if(allowed&&receipt){receipt.key=key;receipt.day=day;}
 return allowed;
}
// 利用者の回数だけ戻す。外部API費用の予約とは別。内部の失敗経路から一度だけ呼ぶ。
export async function planRefund(env,db,uid,chargedAt,receipt=null){
 if(!on(env)||!people(env).includes(uid))return;
 if(receipt?.key?.startsWith('plan-credit-day:'))return refundCredits(db,uid,receipt);
 if(creditPolicyOn(env)&&!receipt)throw Error('credit refund needs receipt');
 let key=receipt?.key,day=receipt?.day;
 if(!key){const c=await current(db,uid,chargedAt);if(!c.row)return;key='plan-quota:'+uid+':'+period(c.row.anchor??c.row.start,chargedAt).from;day=Math.floor((chargedAt+JST)/DAY);}
 if(!key.startsWith('plan-quota:'+uid+':')||!Number.isSafeInteger(day))throw Error('invalid refund');
 await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.n',MAX(0,CAST(json_extract(v,'$.n') AS INTEGER)-1),'$.daily',CASE WHEN json_extract(v,'$.day')=? THEN MAX(0,CAST(json_extract(v,'$.daily') AS INTEGER)-1) ELSE json_extract(v,'$.daily') END) WHERE k=?").bind(day,key).run();
}
export async function planAllows(env,uid,feature,now=Date.now()){if(!on(env))return true;const s=await planStatus(env,uid,now);return !!s.provisional&&!!s.features?.[feature];}
export async function planStoreMockChat(env,db,uid,now,key,pending,result,units=2){
 if(!on(env)||db!==env.AUTH_DB||!people(env).includes(uid))return false;
 const prefix='learning-chat:'+uid+':';
 if(typeof key!=='string'||!key.startsWith(prefix)||!/^[a-zA-Z0-9_-]{8,64}$/.test(key.slice(prefix.length))||typeof pending!=='string'||typeof result!=='string'||pending.length>16000||result.length>20000)throw Error('invalid chat commit');
 const before=JSON.parse(pending),after=JSON.parse(result);
 if(before.state!=='pending'||after.state!=='done'||after.mock!==true||before.id!==key.slice(prefix.length)||after.id!==before.id||before.text!==after.text||JSON.stringify(before.images||[])!==JSON.stringify(after.images||[])||typeof before.claim!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(before.claim)||Object.hasOwn(after,'claim')||!Number.isSafeInteger(now))throw Error('invalid chat commit');
 await initializePreviewPlan(env,uid,now);
 const c=await current(db,uid,now),p=PLANS[c.plan];if(p.ai===0)return false;
 if(creditPolicyOn(env))return chargeCredits(db,uid,c.plan,now,null,units,{key,pending,result});
 const per=period(c.row.anchor??c.row.start,now),quota='plan-quota:'+uid+':'+per.from,day=Math.floor((now+JST)/DAY),old=await usage(db,uid,per.from),limit=p.ai??1000000000,dailyLimit=p.ai??1000,daily=old.day===day?old.daily:0;
 const next=JSON.stringify({n:old.n+1,day,daily:daily+1,lastOperation:before.claim});
 const results=await db.batch([
  db.prepare("INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,? WHERE ?<? AND ?<? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) ON CONFLICT(k) DO UPDATE SET v=json_object('n',CAST(json_extract(auth_kv.v,'$.n') AS INTEGER)+1,'day',?,'daily',CASE WHEN json_extract(auth_kv.v,'$.day')=? THEN CAST(json_extract(auth_kv.v,'$.daily') AS INTEGER)+1 ELSE 1 END,'lastOperation',?) WHERE CAST(json_extract(auth_kv.v,'$.n') AS INTEGER)<? AND (CASE WHEN json_extract(auth_kv.v,'$.day')=? THEN CAST(json_extract(auth_kv.v,'$.daily') AS INTEGER) ELSE 0 END)<? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)").bind(quota,next,per.to+400*DAY,old.n,limit,daily,dailyLimit,key,pending,day,day,before.claim,limit,day,dailyLimit,key,pending),
  db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND v=? AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.lastOperation')=?)").bind(result,key,pending,quota,before.claim)
 ]);
 return results[1]?.meta?.changes===1;
}
export async function planRoute(request,env,session){
 if(!session||typeof session.uid!=='string'||!session.uid)return reply({error:'unauthorized'},401);
 const url=new URL(request.url),uid=session.uid,now=Date.now();
 if(url.pathname==='/plan'){if(request.method!=='GET'||url.search)return reply({error:'bad request'},400);return reply(await planStatus(env,uid,now));}
 if(url.pathname!=='/admin/plans')return reply({error:'not_found'},404);
 if(!on(env))return reply({error:'not_found'},404);
 if(uid!=='u1')return reply({error:'forbidden'},403);
 const db=env.AUTH_DB;if(!db)return reply({error:'unavailable'},503);
 if(request.method==='GET'){
  if(url.search)return reply({error:'invalid_query'},400);
  const members=[];for(const u of people(env))members.push({uid:u,...await planStatus(env,u,now)});
  const logs=((await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k DESC LIMIT 100').bind('plan-log:','plan-log:￿').all()).results||[]).map(r=>{try{return JSON.parse(r.v);}catch(_){return null;}}).filter(Boolean);
  return reply({now,people:members,logs,reasons:REASONS});
 }
 if(request.method!=='POST')return reply({error:'method not allowed'},405);
 const origin=request.headers.get('Origin');if(env.APP_ORIGIN&&origin!==env.APP_ORIGIN)return reply({error:'origin'},403);
 if(!/^application\/json\b/.test(request.headers.get('Content-Type')||''))return reply({error:'content_type'},415);
 let b;try{const t=await request.text();if(t.length>1000)throw 0;b=JSON.parse(t);}catch(_){return reply({error:'invalid_body'},400);}
 const keys=b&&typeof b==='object'&&!Array.isArray(b)?Object.keys(b).sort().join(','):'';
 if(keys!=='end,plan,reason,start,uid'||!people(env).includes(b.uid)||!PLANS[b.plan]||!REASONS.includes(b.reason)||!Number.isSafeInteger(b.start)||!Number.isSafeInteger(b.end)||b.end<=b.start||b.end-b.start>400*DAY||b.start<now-400*DAY||b.start>now+400*DAY)return reply({error:'invalid_body'},400);
 const before=await current(db,b.uid,now);let row;
 // 下のプランへ：今の契約が有効なら次の更新日から。上のプラン・期限後・初回はすぐ
 if(before.row&&before.state==='active'&&PLANS[b.plan].rank<PLANS[before.plan].rank){const per=period(before.row.start,now);row={...before.row,next:{plan:b.plan,from:per.to,start:b.start,end:b.end}};}
 else row={...before.row,plan:b.plan,start:b.start,end:b.end,anchor:before.row&&before.state==='active'?before.row.anchor??before.row.start:b.start,next:null};
 row.revision=(before.row?.revision||0)+1;
 const log={by:'admin（なお）',uid:b.uid,from:before.plan,to:b.plan,start:b.start,end:b.end,at:now,reason:b.reason,applies:row.next?row.next.from:Math.max(now,b.start)};
 const rand=[...crypto.getRandomValues(new Uint8Array(6))].map(x=>x.toString(16).padStart(2,'0')).join('');
 await db.batch([db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('plan:'+b.uid,JSON.stringify(row)),
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0)').bind('plan-log:'+String(now).padStart(15,'0')+':'+rand,JSON.stringify(log))]);
 return reply({ok:true,log,status:await planStatus(env,b.uid,now)});
}
