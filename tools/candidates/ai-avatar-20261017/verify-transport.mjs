import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
const {avatarRequest,generateAvatar,AVATAR_MODEL,AVATAR_RESERVATION_MICROYEN}=await import(process.argv.includes('--main')?new URL('../../../cf-worker/src/openai-avatar-transport.mjs',import.meta.url):new URL('./transport.mjs',import.meta.url));
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_API_KEY:'synthetic-only'};
const rawImage=await canonicalImage({width:1024,height:1024,data:deflateSync(Buffer.alloc(1024*1024*4,255)).toString('base64')});
const image=await canonicalImage({width:384,height:384,data:deflateSync(Buffer.alloc(384*384*4,255)).toString('base64')});
const intro='青が好きで、猫と本が好きです。';
for(const bad of ['',null,'x'.repeat(601),'person@example.test','https://example.test','090-1234-5678','sk-proj-'+'x'.repeat(30),'a\u0000b']){assert.throws(()=>avatarRequest(bad));checks++;}
const body=avatarRequest(intro);eq(body.model,AVATAR_MODEL);eq(body.n,1);eq(body.size,'1024x1024');eq(body.quality,'low');eq(body.output_format,'png');eq(Object.hasOwn(body,'tools'),false);
async function scenario(kind,change={}){
 let calls=0,reserved=false,allowed=true;const urls=[],controller=new AbortController();
 const options={signal:controller.signal,authorized:async()=>allowed,reserve:async amount=>{eq(calls,0);eq(amount,AVATAR_RESERVATION_MICROYEN);reserved=true;return kind!=='budget';},fetcher:async(url,opts)=>{
  calls++;urls.push(url);eq(reserved,true);eq(opts.redirect,'error');eq(opts.headers.Authorization,'Bearer synthetic-only');
  if(kind==='input-session-loss'&&calls===1)allowed=false;
  if(kind==='output-session-loss'&&calls===2)allowed=false;
  if(kind==='abort'&&calls===2)controller.abort();
  if(url.endsWith('moderations'))return Response.json(kind==='no-verdict'?{}:{results:[{flagged:kind==='input-blocked'&&calls===1||kind==='output-blocked'&&calls===3}]});
  eq(url,'https://api.openai.com/v1/images/generations');eq(JSON.parse(opts.body),body);
  if(kind==='network')throw Error('provider and secret details must never escape');
  if(kind==='status')return Response.json({error:{message:'sensitive provider detail'}},{status:403});
  if(kind==='large')return new Response('{}',{headers:{'Content-Length':String(7*1024*1024)}});
  if(kind==='invalid-json')return new Response('not-json');
  if(kind==='url')return Response.json({data:[{url:'https://outside.invalid/image'}]});
  if(kind==='many')return Response.json({data:[{b64_json:rawImage.png},{b64_json:rawImage.png}]});
  if(kind==='bad-png')return Response.json({data:[{b64_json:btoa('not a PNG')}]});
  if(kind==='wrong-size')return Response.json({data:[{b64_json:image.png}]});
  return Response.json({created:123,data:[{b64_json:rawImage.png,revised_prompt:'never expose provider prompt'}]});
 }};
 const result=await generateAvatar({...env,...change},intro,options);eq(JSON.stringify(result).includes('synthetic-only'),false);eq(JSON.stringify(result).includes('sensitive provider detail'),false);eq(JSON.stringify(result).includes('revised_prompt'),false);
 return {result,calls,urls};
}
for(const change of [{OPENAI_ENABLED:'0'},{OPENAI_AVATAR_READY:'0'},{OPENAI_BILLING_READY:'0'},{OPENAI_API_KEY:''},{GEMINI_ENABLED:'1'}]){const r=await scenario('normal',change);eq(r.result.error,'generator_not_ready');eq(r.calls,0);}
const good=await scenario('normal');eq(good.calls,3);eq(good.result.real,true);eq(good.result.image.id,image.id);eq(good.result.reservedMicroYen,AVATAR_RESERVATION_MICROYEN);
for(const [kind,error,calls] of [['budget','ai_budget',0],['input-blocked','content_blocked',1],['no-verdict','safety_unavailable',1],['input-session-loss','session_changed',1],['output-session-loss','session_changed',2],['output-blocked','content_blocked',3],['abort','provider_failed',2],['network','provider_failed',2],['status','provider_failed',2],['large','provider_failed',2],['invalid-json','provider_failed',2],['url','provider_failed',2],['many','provider_failed',2],['bad-png','provider_failed',2],['wrong-size','provider_failed',2]]){
 const r=await scenario(kind);eq(r.result.error,error);eq(r.calls,calls);eq(Object.hasOwn(r.result,'image'),false);
}
console.log('Avatar transport candidate: '+checks+' checks passed; fixed one-image request, reserve before HTTP, input/output moderation, session loss, abort, response limits, invalid PNG/URL rejection, private error handling; fake provider only');
