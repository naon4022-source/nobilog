import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {generateOwnedVision} from './generate.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite();let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 const data=Buffer.from(await new Response(new Blob([new Uint8Array([1,2,3,255])]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()).toString('base64');
 const image=await canonicalImage({width:1,height:1,data});db.seed('learning-image:p_pro:'+image.id,JSON.stringify(image));
 const env={AUTH_DB:db,OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_API_KEY:'synthetic',OPENAI_BILLING_READY:'1',OPENAI_TOKEN_COUNT_READY:'1',OPENAI_VISION_READY:'1'};
 const content={instructions:'Explain only the visible exercise, as answer JSON.',input:'Synthetic question.',maxOutputTokens:1024};
 const setup=()=>{
  const state={paths:[],events:[],flags:0,mode:'normal'};
  const options={signal:new AbortController().signal,authorize:async()=>true,screenBeforeUpload:async()=>{state.events.push('screen');return true;},reservePreflight:async()=>{state.events.push('preflight');return true;},reserveGeneration:async amount=>{state.events.push('budget');assert.ok(amount>0);return true;},startGeneration:async()=>{state.events.push('start');return true;},fetcher:async(url,request)=>{
   const path=url.split('/v1/')[1];state.paths.push(path);state.events.push(path);const b=JSON.parse(request.body);
   if(path==='responses/input_tokens')return Response.json({object:'response.input_tokens',input_tokens:1200});
   if(path==='moderations'){
    state.flags++;if(state.flags===1){eq(b.input[1].type,'image_url');eq(b.input[1].image_url.url.startsWith('data:image/png;base64,'),true);}
    return Response.json({results:state.mode==='missingVerdict'?[]:[{flagged:state.mode==='inputBlocked'&&state.flags===1||state.mode==='outputBlocked'&&state.flags===2}]});
   }
   eq(b.model,'gpt-6.1-sol');eq(b.store,false);eq(b.service_tier,'default');
   if(state.mode==='networkLoss')throw Error('SECRET_PROVIDER_DETAIL');
   return Response.json({status:'completed',model:state.mode==='wrongModel'?'gpt-6-luna':b.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:state.mode==='privateAnswer'?'{"answer":"email synthetic@example.test"}':'{"answer":"Check the visible number line first."}'}]}],usage:{input_tokens:state.mode==='overUsage'?50000:1200,output_tokens:20}});
  }};
  return {state,options,run:(e=env)=>generateOwnedVision(e,'p_pro','pro',content,[image.id],options)};
 };
 let t=setup(),r=await t.run();eq(r.real,true);eq(r.model,'gpt-6.1-sol');eq(t.state.paths,['responses/input_tokens','moderations','responses','moderations']);eq(t.state.events.indexOf('screen')<t.state.events.indexOf('responses/input_tokens'),true);eq(t.state.events.indexOf('budget')<t.state.events.indexOf('responses'),true);
 t=setup();eq((await t.run({...env,OPENAI_VISION_READY:'0'})).error,'provider_not_ready');eq(t.state.paths.length,0);
 t=setup();t.options.screenBeforeUpload=async()=>false;eq((await t.run()).error,'content_blocked');eq(t.state.paths.length,0);
 t=setup();t.options.reserveGeneration=async()=>false;eq((await t.run()).error,'ai_budget');eq(t.state.paths,['responses/input_tokens']);
 t=setup();t.options.startGeneration=async()=>false;eq((await t.run()).error,'request_outcome_unknown');eq(t.state.paths.includes('responses'),false);
 for(const [mode,error] of [['inputBlocked','content_blocked'],['outputBlocked','content_blocked'],['missingVerdict','safety_unavailable'],['wrongModel','provider_failed'],['overUsage','provider_failed'],['privateAnswer','provider_failed'],['networkLoss','provider_failed']]){
  t=setup();t.state.mode=mode;r=await t.run();eq(r.error,error);eq(JSON.stringify(r).includes('SECRET_PROVIDER_DETAIL'),false);if(['inputBlocked','missingVerdict'].includes(mode))eq(t.state.paths.includes('responses'),false);
 }
 console.log(`Vision generation candidate: ${n} checks passed; local screen before upload, exact count, moderation, paid CAS, Sol, usage bounds, private/refused output and sanitized loss`);
}finally{db.close();}
