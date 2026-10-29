import assert from 'node:assert/strict';
const source=process.argv.includes('--main')?'../../../cf-worker/src/openai-avatar-transport.mjs':'./transport.mjs';
const {generateAvatar}=await import(source);
const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_AVATAR_READY:'1',OPENAI_API_KEY:'synthetic-only'};
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
// Authorization can change in the last guard between input moderation and
// the actual generation call. A denied guard has issued no paid request.
for(const stopAt of [1,2,3,4]){
 let guards=0,calls=[];
 const result=await generateAvatar(env,'青い猫と本',{signal:new AbortController().signal,reserve:async()=>true,authorized:async()=>++guards!==stopAt,fetcher:async url=>{calls.push(url);return Response.json({results:[{flagged:false}]});}});
 eq(result.error,'session_changed');eq(result.requestIssued,false);eq(calls.filter(x=>x.endsWith('/generations')).length,0);
}
let calls=[];
const lost=await generateAvatar(env,'青い猫と本',{signal:new AbortController().signal,reserve:async()=>true,authorized:async()=>true,fetcher:async url=>{calls.push(url);if(url.endsWith('/moderations'))return Response.json({results:[{flagged:false}]});throw Error('Synthetic generation acknowledgement lost');}});
eq(lost.error,'provider_failed');eq(lost.requestIssued,true);eq(calls.filter(x=>x.endsWith('/generations')).length,1);
console.log('Avatar last-guard reservation: '+n+' checks passed; four pre-send authorization gates never mark generation issued, actual generation network failure stays issued; no network');
