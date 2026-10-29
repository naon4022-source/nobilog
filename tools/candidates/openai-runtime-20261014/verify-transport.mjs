import assert from 'node:assert/strict';
import {generate} from './openai-transport.mjs';
const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_API_KEY:'synthetic-not-a-real-key'};
const content={instructions:'Study only.',input:'Synthetic exercise.',maxOutputTokens:512};
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
async function run({settings=env,plan='unlimit',failAt=0,flagAt=0,missingSafety=false,status='completed',badUsage=false,refusal=false,invalid=false,budget=true,abort=false}={}){
 const calls=[],controller=new AbortController();if(abort)controller.abort();let reserved=0;
 const fetcher=async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body),redirect:opts.redirect});if(calls.length===failAt)throw Error('sensitive failure never returned');if(url.endsWith('moderations'))return Response.json(missingSafety?{}:{results:[{flagged:calls.length===flagAt}]});return Response.json({status,model:calls.at(-1).body.model,output:[{type:'message',role:'assistant',content:[refusal?{type:'refusal',refusal:'No'}:{type:'output_text',text:'{"reason":"synthetic"}'}]}],usage:{input_tokens:100,output_tokens:badUsage?900:20}});};
 const result=await generate(settings,plan,'chat',content,{fetcher,reserve:async()=>{reserved++;return budget;},validate:x=>{if(invalid)throw Error('schema');return JSON.parse(x);},signal:controller.signal});return {result,calls,reserved};
}
let r=await run();eq(r.result.real,true);eq(r.result.model,'gpt-6.1-sol');eq(r.calls.length,3);eq(r.reserved,1);eq(r.calls[1].body.store,false);eq(r.calls.every(c=>c.redirect==='error'),true);
r=await run({plan:'pro'});eq(r.result.model,'gpt-6-luna');
r=await run({settings:{}});eq(r.result.error,'provider_not_ready');eq(r.calls.length,0);
r=await run({budget:false});eq(r.result.error,'ai_budget');eq(r.calls.length,0);
r=await run({flagAt:1});eq(r.result.error,'content_blocked');eq(r.calls.length,1);
r=await run({flagAt:3});eq(r.result.error,'content_blocked');eq(Object.hasOwn(r.result,'value'),false);
r=await run({missingSafety:true});eq(r.result.error,'safety_unavailable');eq(r.calls.length,1);
for(const args of [{failAt:1},{failAt:2},{failAt:3},{status:'incomplete'},{badUsage:true},{refusal:true},{invalid:true}]){r=await run(args);eq(r.result.error,'provider_failed');eq(Object.hasOwn(r.result,'value'),false);eq(JSON.stringify(r.result).includes('sensitive'),false);}
r=await run({abort:true});eq(r.calls.length,0);eq(r.reserved,0);
// A lying provider usage report must not exceed the amount reserved locally.
let calls=0;
const overUsage=await generate(env,'unlimit','chat',content,{
 signal:new AbortController().signal,reserve:async()=>true,validate:JSON.parse,
 fetcher:async(url,opts)=>{
  calls++;
  if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
  return Response.json({status:'completed',model:JSON.parse(opts.body).model,
   output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"reason":"synthetic"}'}]}],
   usage:{input_tokens:32001,output_tokens:20}});
 }
});
eq(overUsage.error,'provider_failed');eq(Object.hasOwn(overUsage,'value'),false);eq(calls,2);
// Never parse or return error bodies. Release their streams instead.
let cancelled=false;
const httpFailure=await generate(env,'unlimit','chat',content,{
 signal:new AbortController().signal,reserve:async()=>true,validate:JSON.parse,
 fetcher:async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}),{status:429})
});
eq(httpFailure.error,'provider_failed');eq(cancelled,true);
// Overlarge successful bodies are also cancelled before any result is exposed.
cancelled=false;
const oversized=await generate(env,'unlimit','chat',content,{
 signal:new AbortController().signal,reserve:async()=>true,validate:JSON.parse,
 fetcher:async()=>new Response(new ReadableStream({
  start(c){c.enqueue(new Uint8Array(65537));},cancel(){cancelled=true;}
 }))
});
eq(oversized.error,'provider_failed');eq(cancelled,true);
let streamCancelled=false;
const timeoutController=new AbortController();
const timer=setTimeout(()=>timeoutController.abort(),25);
const begin=performance.now();
const stalled=await generate(env,'unlimit','chat',content,{
 signal:timeoutController.signal,reserve:async()=>true,validate:JSON.parse,
 fetcher:async()=>new Response(new ReadableStream({
  start(c){c.enqueue(new TextEncoder().encode('{'));},cancel(){streamCancelled=true;}
 }))
});
clearTimeout(timer);
eq(stalled.error,'provider_failed');eq(streamCancelled,true);eq(performance.now()-begin<1000,true);
console.log(`OpenAI transport: ${count} isolated checks passed; synthetic fetch only, no live API`);
