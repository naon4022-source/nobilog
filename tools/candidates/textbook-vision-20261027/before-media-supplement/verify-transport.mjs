import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {chatResponse} from '../../../cf-worker/src/openai-chat-content.mjs';
import {textbookImageRecord,textbookImageKey,prepareTextbookVision,textbookVisionCeiling} from './textbook-vision-input.mjs';
import {generateTextbookVision} from './textbook-vision-transport.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const ref={book:'math1',anchor:'a'.repeat(64),annotationSignature:TEXTBOOK_AI_CONTEXTS.math1.annotationSignature,contextSha256:TEXTBOOK_AI_CONTEXTS.math1.sha256,sourceSha256:'b'.repeat(64),page:2,kind:'fig',quote:'AB＝6 cm の三角形。',title:'合成教科書',subject:'数学',chapter:'合成章',section:'合成節',sectionTitle:'図'};
const image=await textbookImageRecord(ref,{width:2,height:2,data:deflateSync(Buffer.from([0,0,0,255,255,255,255,255,0,0,0,255,255,255,255,255])).toString('base64')});
const request={id:'vision_transport_01',text:'図の見方を教えて。',book:ref.book,anchor:ref.anchor,annotationSignature:ref.annotationSignature,contextSha256:ref.contextSha256,images:[image.image.id]};
const db={prepare(sql){assert.equal(sql,'SELECT v FROM auth_kv WHERE k=?');return {bind(key){return {async first(){return key===textbookImageKey('u4',ref,image.image.id)?JSON.stringify(image):null;}};}};}};
const envFor=()=>({OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',GEMINI_ENABLED:'0',OPENAI_API_KEY:'fixture-only-not-a-real-key'});
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};const same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
async function run({plan='pro',edit,modify,networkFailure,denyReserve=false,ownerLostAfter,disableAfter,abortAfter,mutateDuringReserve}={}){
 const env=envFor(),prepared=await prepareTextbookVision(db,'u4',plan,request,ref),controller=new AbortController(),calls=[],holds=[];let authorized=true;
 if(edit)edit(prepared);
 const fetcher=async(url,options)=>{
  const body=JSON.parse(options.body),stage=url.endsWith('/moderations')?(Array.isArray(body.input)?'moderation-input':'moderation-output'):url.endsWith('/input_tokens')?'count':'generation';
  calls.push({stage,body});if(networkFailure===stage)throw Error('synthetic lost HTTP reply');
  let value=stage.startsWith('moderation')?{results:[{flagged:false}]}:stage==='count'?{object:'response.input_tokens',input_tokens:200}:{status:'completed',model:body.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({answer:'まず、図に書かれたAB＝6 cmを確認しよう。'})}]}],usage:{input_tokens:200,output_tokens:40}};
  if(modify)value=modify(stage,value)||value;
  if(ownerLostAfter===stage)authorized=false;
  if(disableAfter===stage)env.OPENAI_ENABLED='0';
  if(abortAfter===stage)controller.abort();
  return Response.json(value);
 };
 const result=await generateTextbookVision(env,prepared,{fetcher,signal:controller.signal,authorized:async()=>authorized,validate:chatResponse,reserve:async amount=>{holds.push(amount);if(mutateDuringReserve)mutateDuringReserve(prepared);return !denyReserve;}});
 return {result,calls,holds,prepared};
}
for(const plan of ['pro','unlimit']){
 const f=await run({plan});ok(f.result.real===true,'successful synthetic multimodal result');same(f.result.model,plan==='pro'?'gpt-6-luna':'gpt-6.1-sol','requested model retained');same(f.calls.map(c=>c.stage),['moderation-input','count','generation','moderation-output'],'one count and one generation, both moderated');same(f.holds,[textbookVisionCeiling(f.prepared)],'combined ceiling held before HTTP');
 same(f.calls[1].body.input,f.calls[2].body.input,'same counted and generated images/text');ok(f.calls[2].body.input[0].content[1].image_url.startsWith('data:image/png;base64,'),'owned canonical PNG only');ok(!JSON.stringify(f.calls[2].body).includes('"u4"'),'no account identity in model input');same(f.result.billingTier,'default','actual tier checked');
}
{const f=await run({denyReserve:true});same(f.result.error,'ai_budget','budget refusal');same(f.calls.length,0,'no HTTP before reservation');}
for(const field of ['OPENAI_ENABLED','OPENAI_TRIAL_ONLY','OPENAI_SAFETY_READY','OPENAI_TERMS_READY','OPENAI_BILLING_READY']){
 const env=envFor();env[field]='0';const prepared=await prepareTextbookVision(db,'u4','pro',request,ref);let calls=0;const result=await generateTextbookVision(env,prepared,{fetcher:()=>calls++});same(result.error,'provider_not_ready','all flags required');same(calls,0,'no disabled provider dispatch');
}
{const env=envFor();env.GEMINI_ENABLED='1';same((await generateTextbookVision(env,{})).error,'provider_not_ready','Gemini cannot be enabled alongside candidate');}
{same((await generateTextbookVision(envFor(),{})).error,'control_unavailable','no uncontrolled network defaults');}
for(const stage of ['moderation-input','count','generation']){
 const f=await run({ownerLostAfter:stage});ok(f.result.error==='session_changed','revocation after '+stage);same(f.result.billableRequestIssued,stage!=='moderation-input','billable flag tracks actual count/generation only');ok(f.calls.filter(c=>c.stage==='generation').length<=(stage==='generation'?1:0),'no later generation after revocation');
}
{const f=await run({disableAfter:'moderation-input'});same(f.result.error,'provider_not_ready','disable checked between HTTP calls');same(f.result.billableRequestIssued,false,'no paid call after disable');}
for(const stage of ['count','generation']){
 const f=await run({networkFailure:stage});same(f.result.billableRequestIssued,true,'unknown external outcome stays billable');same(f.calls.filter(c=>c.stage===stage).length,1,'no automatic HTTP retry');ok(!f.result.real,'unknown does not become success');
}
{const f=await run({abortAfter:'count'});ok(!!f.result.error&&f.result.billableRequestIssued,'abort retains count uncertainty');same(f.calls.filter(c=>c.stage==='generation').length,0,'abort before generation stops it');}
for(const count of [0,31937,'200']){
 const f=await run({modify:(stage,value)=>stage==='count'?{...value,input_tokens:count}:value});ok(!!f.result.error&&f.result.billableRequestIssued,'bad token count refused with hold');same(f.calls.filter(c=>c.stage==='generation').length,0,'invalid count never generates');
}
for(const change of [raw=>raw.model='gpt-6.1-sol',raw=>raw.service_tier='fast',raw=>raw.usage.input_tokens=265,raw=>raw.usage.output_tokens=1025,raw=>raw.output[0].content[0].text='{"answer":"<script>bad</script>"}',raw=>raw.output[0].content[0].type='refusal']){
 const f=await run({modify:(stage,value)=>{if(stage==='generation')change(value);return value;}});ok(!!f.result.error&&f.result.billableRequestIssued&&f.result.responseAccepted,'invalid response cannot settle or become a successful answer');
}
{const f=await run({modify:(stage,value)=>stage==='moderation-output'?{results:[{flagged:true}]}:value});same(f.result.error,'content_blocked','unsafe output rejected');ok(f.result.billableRequestIssued,'unsafe paid reply remains held');}
{const f=await run({mutateDuringReserve:prepared=>{prepared.body.model='gpt-6.1-sol';prepared.body.input[0].content[1].image_url='https://example.invalid/not-used.png';}});same(f.calls[2].body.model,'gpt-6-luna','caller mutation cannot change captured model');ok(f.calls[2].body.input[0].content[1].image_url.startsWith('data:image/png;base64,'),'caller mutation cannot substitute an external URL');}
const inputs=[];for(const file of ['tools/candidates/textbook-vision-20261027/textbook-vision-input.mjs','tools/candidates/textbook-vision-20261027/textbook-vision-transport.mjs','tools/candidates/textbook-vision-20261027/verify-transport.mjs','cf-worker/src/openai-transport.mjs','cf-worker/src/openai-policy.mjs','cf-worker/src/openai-vision.mjs'])inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
await writeFile(new URL('transport-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Internal candidate only. LUNA/SOL exact models, mandatory combined preflight/generation hold, all HTTP guards, input/output moderation, identical count/generation input, token/tier/schema constraints, abort/revocation, no network retry or unsafe refund promise. Fake fetch only. Durable operation/credits/consent/entitlement/route/UI integration still required.'},null,2)+'\n');
console.log('Textbook vision transport candidate: '+checks+' checks passed; fake HTTP only.');
