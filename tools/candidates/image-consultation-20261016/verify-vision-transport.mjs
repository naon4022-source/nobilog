import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {prepareVision} from '../../../cf-worker/src/openai-vision.mjs';
import {chatResponse} from '../../../cf-worker/src/openai-chat-content.mjs';
import {generateVision,visionCeiling} from '../../../cf-worker/src/openai-vision-transport.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),uid='p_pro',env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only'};
const compressed=new Uint8Array(await new Response(new Blob([new Uint8Array([0,0,255,255])]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
const image=await canonicalImage({width:1,height:1,data:Buffer.from(compressed).toString('base64')});db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 const prepared=await prepareVision(db,uid,'pro',{instructions:'Explain the visible learning question. Return answer JSON.',input:'Synthetic question.',maxOutputTokens:1024},[image.id]);
 async function run(options={}){
  const calls=[],controller=new AbortController();let reserved=0;
  if(options.aborted)controller.abort();
  const fetcher=async(url,request)=>{
   const body=JSON.parse(request.body);calls.push({url,body,redirect:request.redirect});
   if(options.failAt===calls.length)throw Error('private key detail must not be returned');
   if(url.endsWith('moderations'))return Response.json(options.missingSafety?{}:{results:[{flagged:options.flagAt===calls.length}]});
   if(url.endsWith('responses/input_tokens')){if(options.abortAfterCount)controller.abort();return Response.json(options.count||{object:'response.input_tokens',input_tokens:300});}
   if(options.billing)return Response.json({error:{code:'insufficient_quota'}},{status:429});
   return Response.json({status:options.incomplete?'incomplete':'completed',model:options.badModel?'wrong-model':body.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"Synthetic clear explanation."}'}]}],usage:{input_tokens:options.overInput?365:300,output_tokens:options.overOutput?1025:20}});
  };
  const policy=structuredClone(prepared);options.patch?.(policy);
  const result=await generateVision(options.disabled?{}:env,policy,{fetcher,reserve:async amount=>{reserved++;eq(amount,visionCeiling(prepared));return options.budget!==false;},validate:options.badAnswer?()=>{throw Error('schema');}:chatResponse,signal:controller.signal,authorized:async()=>options.authorized!==false&&!(options.loseAfterCount&&calls.length>=2)});
  return {result,calls,reserved};
 }
 let r=await run();eq(r.result.real,true);eq(r.result.model,'gpt-6.1-sol');eq(r.calls.map(c=>new URL(c.url).pathname),['/v1/moderations','/v1/responses/input_tokens','/v1/responses','/v1/moderations']);
 eq(r.calls[0].body.input[1].type,'image_url');eq(r.calls[0].body.input[1].image_url.url.startsWith('data:image/png;base64,'),true);eq(r.calls.every(c=>c.redirect==='error'),true);eq(r.result.countedInputTokens,300);eq(r.result.value.answer,'Synthetic clear explanation.');eq(r.result.reservedMicroYen,visionCeiling(prepared));
 for(const options of [{disabled:true},{authorized:false},{aborted:true},{budget:false},{patch:p=>p.body.tools=[]},{patch:p=>p.body.model='gpt-6-luna'},{patch:p=>p.body.input[0].content[1].image_url='https://example.test/private.png'},{patch:p=>p.countBody.instructions='different'}]){r=await run(options);eq(r.calls.length,0);eq(Object.hasOwn(r.result,'value'),false);}
 r=await run({flagAt:1});eq(r.result.error,'content_blocked');eq(r.calls.length,1);
 for(const count of [{object:'wrong',input_tokens:300},{object:'response.input_tokens',input_tokens:31937},{object:'response.input_tokens',input_tokens:-1}]){r=await run({count});eq(r.calls.length,2);eq(r.result.error,'provider_failed');}
 for(const options of [{failAt:1},{failAt:2},{failAt:3},{failAt:4},{missingSafety:true},{incomplete:true},{badModel:true},{overInput:true},{overOutput:true},{badAnswer:true},{flagAt:4},{abortAfterCount:true},{loseAfterCount:true}]){
  r=await run(options);eq(Object.hasOwn(r.result,'value'),false);eq(JSON.stringify(r.result).includes('private'),false);eq(!!r.result.error,true);
  if(options.loseAfterCount)eq(r.calls.length,2);
 }
 r=await run({billing:true});eq(r.result.error,'billing_not_ready');eq(r.result.retrySafe,true);eq(r.calls.length,3);
 console.log('Vision transport candidate: '+n+' checks passed; canonical synthetic image, multimodal safety, exact input count, reservation before calls, strict model/usage/output, abort/owner loss and fixed errors; fake fetch only');
}finally{db.close();}
