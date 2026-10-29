import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {completePricedOperation} from '../../../cf-worker/src/openai-priced-operation.mjs';
import {textbookImageRecord,textbookImageKey,prepareTextbookVision,textbookVisionCeiling} from './textbook-vision-input.mjs';
import {runTextbookVisionOperation} from './textbook-vision-operation.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url),dbs=[],now=Date.UTC(2026,9,27),id='vision_operation_01';let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;},same=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const ref={book:'math1',anchor:'a'.repeat(64),annotationSignature:TEXTBOOK_AI_CONTEXTS.math1.annotationSignature,contextSha256:TEXTBOOK_AI_CONTEXTS.math1.sha256,sourceSha256:TEXTBOOK_AI_CONTEXTS.math1.sourceSha256,page:2,kind:'fig',quote:'AB＝6 cm の三角形。',title:'合成教科書',subject:'数学',chapter:'合成章',section:'合成節',sectionTitle:'図'};
const image=await textbookImageRecord(ref,{width:2,height:2,data:deflateSync(Buffer.from([0,0,0,255,255,255,255,255,0,0,0,255,255,255,255,255])).toString('base64')});
const request={id,text:'図の読み方を教えて。',book:ref.book,anchor:ref.anchor,annotationSignature:ref.annotationSignature,contextSha256:ref.contextSha256,images:[image.image.id]};
const operationKey=uid=>'openai-operation:'+uid+':'+id;
const fixture=async({uid='u4',plan='pro'}={})=>{
 const db=new D1SQLite();dbs.push(db);db.seed(textbookImageKey(uid,ref,image.image.id),JSON.stringify(image));db.seed('fixture-original-grades','do-not-change');
 const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',GEMINI_ENABLED:'0',OPENAI_API_KEY:'fixture-only-not-a-real-key'};
 const prepared=await prepareTextbookVision(db,uid,plan,request,ref),signal=new AbortController(),calls=[];let authorize=true,failAt=null,blockAt=null,afterStage=null;
 const row=()=>JSON.parse(db.get(operationKey(uid))?.v||'null'),budget=()=>Number(db.get('openai-budget:2026-10')?.v||0);
 const fetcher=async(url,options)=>{
  const body=JSON.parse(options.body),stage=url.endsWith('/input_tokens')?'count':url.endsWith('/responses')?'generation':Array.isArray(body.input)?'moderation-input':'moderation-output';
  calls.push(stage);
  if(stage==='count'||stage==='generation'){same(row().state,'started','durable operation starts before paid HTTP');same(row().visionBillable,true,'durable issuance checkpoint before paid HTTP');same(budget(),textbookVisionCeiling(prepared),'full combined hold before paid HTTP');}
  if(stage===failAt)throw Error('synthetic response loss');
  const result=stage.startsWith('moderation')?{results:[{flagged:stage===blockAt}]}:stage==='count'?{object:'response.input_tokens',input_tokens:200}:{status:'completed',model:body.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({answer:'まず図のAB＝6 cmを確認しよう。'})}]}],usage:{input_tokens:200,output_tokens:40}};
  if(afterStage)await afterStage(stage,result);
  return Response.json(result);
 };
 const run=(extra={})=>runTextbookVisionOperation(db,env,uid,id,prepared,{fetcher,signal:signal.signal,authorized:async()=>authorize,now,...extra});
 return {db,env,uid,prepared,signal,calls,row,budget,run,deny:()=>authorize=false,allow:()=>authorize=true,fail:stage=>failAt=stage,block:stage=>blockAt=stage,after:fn=>afterStage=fn};
};
try{
 for(const uid of ['u1','u2','u4','p_pro','p_unlimit'])for(const plan of ['pro','unlimit']){
  const f=await fixture({uid,plan}),answer=await f.run();ok(answer.real&&!answer.cached,'first execution completes');same(f.row().state,'done','done receipt durable');ok(f.row().visionPricing.kind==='textbook-vision'&&!Object.hasOwn(f.row(),'pricing'),'separate typed price rejects text settlement');same(f.calls,['moderation-input','count','generation','moderation-output'],'one count and generation');
  const budget=f.budget(),calls=f.calls.length,saved=f.db.get(operationKey(uid)).v,cached=await f.run();ok(cached.real&&cached.cached,'lost response recovered from done receipt');same(cached.value,answer.value,'same validated educational reply');same(f.calls.length,calls,'recovery does not call provider');same(f.budget(),budget,'replay does not reserve twice');same(f.db.get(operationKey(uid)).v,saved,'cached read does not mutate receipt');same(f.db.get('fixture-original-grades').v,'do-not-change','original grades preserved');
  same(await completePricedOperation(f.db,uid,id,f.row().token,answer),false,'text-only settlement cannot release image compound hold');same(f.budget(),budget,'no invented preflight refund');
  f.deny();same((await f.run()).error,'session_changed','cached result still needs caller authorization');same(f.calls.length,calls,'denied cache causes no HTTP');
 }
 for(const stage of ['moderation-input','count','generation','moderation-output']){
  const f=await fixture();f.fail(stage);const result=await f.run(),count=f.calls.length;
  if(stage==='moderation-input'){
   ok(result.uncharged,'proven pre-count failure releases money once');same(f.row().state,'rejected','rejection durable');same(f.budget(),0,'atomic unissued release');f.fail(null);ok((await f.run()).real,'explicit retry may replace rejected same digest');same(f.budget(),textbookVisionCeiling(f.prepared),'retry holds exactly once');
  }else{
   ok(!result.uncharged&&!!result.error,'uncertain paid call is not free');same(f.row().state,'started','unknown remains started');same(f.row().visionBillable,true,'issued checkpoint remains durable');same(f.budget(),textbookVisionCeiling(f.prepared),'unknown full hold');same((await f.run()).error,'outcome_unknown','restart cannot retry issued count/generation');same(f.calls.length,count,'no provider replay after unknown');
  }
 }
 for(const stage of ['moderation-input','moderation-output']){
  const f=await fixture();f.block(stage);const result=await f.run();same(result.error,'content_blocked','unsafe input/output blocked');same(f.row().state,stage==='moderation-input'?'rejected':'started','only pre-count refusal released');same(f.budget(),stage==='moderation-input'?0:textbookVisionCeiling(f.prepared),'post-generation safety failure keeps hold');
 }
 {const f=await fixture();f.after(stage=>{if(stage==='moderation-input')f.deny();});const r=await f.run();ok(r.uncharged,'owner lost before count safely releases');same(f.calls,['moderation-input'],'no paid call after revocation');}
 {const f=await fixture();f.after(stage=>{if(stage==='count')f.signal.abort();});const r=await f.run();ok(r.error&&!r.uncharged,'abort after count retains uncertain hold');same(f.calls,['moderation-input','count'],'abort blocks generation');same(f.row().state,'started','restart cannot infer no spend');}
 {const f=await fixture();const [a,b]=await Promise.all([f.run(),f.run()]);same(f.calls.filter(x=>x==='count').length,1,'concurrent duplicate counts once');same(f.calls.filter(x=>x==='generation').length,1,'concurrent duplicate generates once');ok(a.real||b.real,'one concurrent runner completes');same(f.budget(),textbookVisionCeiling(f.prepared),'one concurrent money reservation');}
 {const f=await fixture();f.env.OPENAI_MONTHLY_LIMIT_YEN='1';same((await f.run()).error,'invalid_operation','insufficient configured ceiling prevents reservation');same(f.calls.length,0,'insufficient budget has no HTTP');}
 {const f=await fixture();f.env.OPENAI_ENABLED='0';same((await f.run()).error,'provider_not_ready','disabled remains off');same(f.db.keys().filter(k=>k.startsWith('openai-')).length,0,'disabled creates no operation or budget');}
 {const f=await fixture();await f.run();f.prepared.requestDigest='c'.repeat(64);same((await f.run()).error,'id_conflict','same ID different request rejected');same(f.calls.filter(x=>x==='generation').length,1,'digest conflict never sends');}
 {const f=await fixture();await f.run();f.prepared.body.input[0].content[0].text+=' changed';f.prepared.countBody.input=f.prepared.body.input;same((await f.run()).error,'operation_invalid','same digest cannot swap pinned body');same(f.calls.filter(x=>x==='generation').length,1,'body mismatch never sends');}
 {const f=await fixture();f.after(stage=>{if(stage==='moderation-input'){const r=f.row();delete r.visionPricing;f.db.seed(operationKey(f.uid),JSON.stringify(r));}});const result=await f.run();same(result.error,'outcome_unknown','corrupt pricing cannot authorize paid HTTP');same(f.calls,['moderation-input'],'lost pin closes gate');same(f.budget(),textbookVisionCeiling(f.prepared),'corrupt journal never implies safe refund');}
 {const f=await fixture();f.db.failBatchAt=1;const result=await f.run();same(result.error,'operation_unavailable','reservation transaction failure safe error');same(f.calls.length,0,'no HTTP after failed reserve');same(f.budget(),0,'transaction rollback leaves no money counter');same(f.row(),null,'transaction rollback leaves no receipt');}
 {const f=await fixture();f.after(stage=>{if(stage==='moderation-input')f.db.failBatchAt=1;});f.block('moderation-input');const result=await f.run();same(result.error,'outcome_unknown','release transaction failure does not claim refund');same(f.row().state,'started','failed release transaction rolls back');same(f.budget(),textbookVisionCeiling(f.prepared),'failed release retains hold');same(f.row().visionBillable,false,'durable unissued fact preserved for later controlled recovery');}
 {const f=await fixture();await f.run();const r=f.row();r.visionPricing.kind='chat';f.db.seed(operationKey(f.uid),JSON.stringify(r));same((await f.run()).error,'operation_invalid','wrong operation kind cannot return stored answer');}
 {const f=await fixture();f.after(stage=>{if(stage==='moderation-output')f.deny();});const r=await f.run();ok(r.error&&!r.value,'owner revoked after paid answer cannot read it');same(f.row().state,'started','revoked output not finalized');same(f.budget(),textbookVisionCeiling(f.prepared),'revoked paid result remains held');}
 {const f=await fixture();const prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{
  const original=prepare(sql);if(!sql.includes("'$.visionBillable',json('true')"))return original;
  return {bind(...args){const statement=original.bind(...args);return {async first(column){await statement.first(column);throw Error('synthetic crash after durable issuance, before HTTP');}};}};
 };const r=await f.run();ok(r.error&&!r.uncharged,'crash after issuance checkpoint not refunded');same(f.calls,['moderation-input'],'crash test sends no actual count');same(f.row().visionBillable,true,'checkpoint survives process failure');f.db.prepare=prepare;same((await f.run()).error,'outcome_unknown','restart cannot know whether earlier process sent HTTP');same(f.budget(),textbookVisionCeiling(f.prepared),'conservative crash hold retained');}
 {const f=await fixture();const prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{
  const original=prepare(sql);if(!sql.includes("'$.state','done'"))return original;
  return {bind(...args){const statement=original.bind(...args);return {async first(column){await statement.first(column);throw Error('synthetic response loss after durable result save');}};}};
 };same((await f.run()).error,'outcome_unknown','lost completion response is not fabricated success');same(f.row().state,'done','saved result survives response loss');f.db.prepare=prepare;const r=await f.run();ok(r.cached&&r.real,'restart recovers completed receipt');same(f.calls.filter(x=>x==='generation').length,1,'completion loss never generates twice');}
 {const f=await fixture();await f.run();const r=f.row();r.value={answer:'<script>unsafe</script>'};f.db.seed(operationKey(f.uid),JSON.stringify(r));const answer=await f.run();ok(answer.error&&!answer.value,'invalid stored output never returned');same(f.calls.filter(x=>x==='generation').length,1,'corrupt stored output does not trigger new paid request');}
 {const f=await fixture();await f.run();const other='u1';f.db.seed(textbookImageKey(other,ref,image.image.id),JSON.stringify(image));const second=await prepareTextbookVision(f.db,other,'pro',request,ref),seen=[];
  const result=await runTextbookVisionOperation(f.db,f.env,other,id,second,{signal:new AbortController().signal,authorized:async()=>true,now,fetcher:async(url,options)=>{
   const b=JSON.parse(options.body);seen.push(url);return Response.json(url.endsWith('/moderations')?{results:[{flagged:false}]}:url.endsWith('/input_tokens')?{object:'response.input_tokens',input_tokens:200}:{status:'completed',model:b.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"図の長さの表示を確認しよう。"}'}]}],usage:{input_tokens:200,output_tokens:40}});
  }});ok(result.real&&!result.cached,'same request ID for different owner has separate receipt');same(f.budget(),textbookVisionCeiling(f.prepared)*2,'owners still share one monthly money ceiling');same(seen.length,4,'other owner not served first owner result');ok(f.db.get(operationKey('u1'))&&f.db.get(operationKey('u4')),'owned journals separated');}
 const inputs=[];for(const file of ['tools/candidates/textbook-vision-20261027/textbook-vision-operation.mjs','tools/candidates/textbook-vision-20261027/verify-operation.mjs','tools/candidates/textbook-vision-20261027/textbook-vision-input.mjs','tools/candidates/textbook-vision-20261027/textbook-vision-transport.mjs','cf-worker/src/openai-receipts.mjs','cf-worker/src/openai-priced-operation.mjs','cf-worker/src/openai-policy.mjs','.claude/verify/d1-sqlite.js'])inputs.push({file,sha256:createHash('sha256').update(await readFile(new URL(file,root))).digest('hex')});
 await writeFile(new URL('operation-current-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Candidate typed monetary journal, actual in-memory SQLite and fake HTTP. No provider, actual learner data, trusted route, daily trial/plan-credit integration, or UI. Count/generation issuance pinned before HTTP; unknowns held, only proven unissued money released, successful preflight ceiling retained, text-only settlement rejects image operations. Credit-hook behavior is verified separately.'},null,2)+'\n');console.log('Textbook vision operation candidate: '+checks+' checks passed; synthetic SQLite/HTTP only.');
}finally{for(const db of dbs)db.close();}
