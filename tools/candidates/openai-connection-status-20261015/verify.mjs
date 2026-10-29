import assert from 'node:assert/strict';
import {connectionStatus} from './status.mjs';
const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
const trial={limit:10,used:0,stopped:false};let n=0;
function check(patch,approved,t,reason){const r=connectionStatus({...env,...patch},approved,t);assert.equal(r.reason,reason);assert.equal(r.ready,reason==='ready');assert.ok(!JSON.stringify(r).includes('synthetic-only'));n+=3;return r;}
check({},true,trial,'ready');
check({OPENAI_ENABLED:'0'},true,trial,'disabled');
check({GEMINI_ENABLED:'1'},true,trial,'provider_conflict');
for(const flag of ['OPENAI_TRIAL_ONLY','OPENAI_SAFETY_READY','OPENAI_TERMS_READY','OPENAI_API_KEY'])check({[flag]:''},true,trial,'setup_required');
check({OPENAI_BILLING_READY:'0'},true,trial,'billing_required');
check({},false,trial,'consent_required');
check({},'true',trial,'consent_required');
for(const cap of ['0','801','1000','-1','NaN'])check({OPENAI_MONTHLY_LIMIT_YEN:cap},true,trial,'controls_unavailable');
for(const t of [null,{...trial,used:-1},{...trial,used:NaN},{...trial,limit:5000},{...trial,used:11}])check({},true,t,'controls_unavailable');
check({},true,{...trial,stopped:true},'stopped');
const exhausted=check({},true,{...trial,used:10},'daily_limit');assert.equal(exhausted.trialLeft,0);n++;
const partial=check({},true,{...trial,used:7},'ready');assert.equal(partial.trialLeft,3);assert.equal(partial.monthlyLimitYen,800);n+=2;
console.log(`OpenAI connection status: ${n} checks passed; no secrets, network or activation`);
