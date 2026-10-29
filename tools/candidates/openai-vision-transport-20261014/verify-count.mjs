import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {countOwnedVision} from './count.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite();let n=0,calls=0,reserved=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 const bytes=new Uint8Array(await new Response(new Blob([new Uint8Array([1,2,3,255])]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
 const image=await canonicalImage({width:1,height:1,data:Buffer.from(bytes).toString('base64')});
 db.seed('learning-image:p_pro:'+image.id,JSON.stringify(image));
 const env={AUTH_DB:db,OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_API_KEY:'synthetic',OPENAI_BILLING_READY:'1',OPENAI_TOKEN_COUNT_READY:'1'};
 const content={instructions:'Explain visible learning material only.',input:'Synthetic exercise.',maxOutputTokens:1024};
 const options={signal:new AbortController().signal,authorize:async()=>true,screenBeforeUpload:async()=>true,reservePreflight:async()=>{reserved++;return true;},fetcher:async(url,request)=>{calls++;eq(url,'https://api.openai.com/v1/responses/input_tokens');eq(request.redirect,'error');const body=JSON.parse(request.body);eq(body.model,'gpt-6.1-sol');eq(Object.hasOwn(body,'tools'),false);eq(body.input[0].content[1].image_url.startsWith('data:image/png;base64,'),true);return Response.json({object:'response.input_tokens',input_tokens:1200});}};
 const run=(e=env,o=options,uid='p_pro',plan='pro',ids=[image.id])=>countOwnedVision(e,uid,plan,content,ids,o);
 eq((await run()).inputUpperBound,1264);eq(calls,1);eq(reserved,1);
 eq((await run({...env,OPENAI_TOKEN_COUNT_READY:'0'})).error,'provider_not_ready');eq(calls,1);
 eq((await run(env,{...options,authorize:async()=>false})).error,'not_authorized');eq(calls,1);
 eq((await run(env,{...options,reservePreflight:async()=>false})).error,'ai_budget');eq(calls,1);
 eq((await run(env,options,'p_unlimit','unlimit')).error,'image_count_unavailable');eq(calls,1);
 eq((await run(env,options,'p_pro','standard')).error,'image_count_unavailable');eq(calls,1);
 for(const input_tokens of [32000,-1,'1200']){eq((await run(env,{...options,fetcher:async()=>Response.json({object:'response.input_tokens',input_tokens})})).error,'image_count_unavailable');}
 eq((await run(env,{...options,fetcher:async()=>new Response('x'.repeat(4097))})).error,'image_count_unavailable');
 eq((await run(env,{...options,fetcher:async()=>new Response('secret-body',{status:403})})).error,'image_count_unavailable');
 const stopped=new AbortController();stopped.abort();eq((await run(env,{...options,signal:stopped.signal})).error,'control_unavailable');
 let gates=0;eq((await run(env,{...options,authorize:async()=>++gates<2})).error,'not_authorized');eq(calls,1);
 console.log(`Vision count candidate: ${n} checks passed; owner-only PNG, Sol policy, preflight budget/approval, fixed endpoint, bounded response, no real API`);
}finally{db.close();}
