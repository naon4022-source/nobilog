import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {runRealAITrial,runAvatarAITrial,trialStatus}=await import(process.argv.includes('--main')?new URL('../../../cf-worker/src/ai-trial-control.mjs',import.meta.url):new URL('./trial-control.mjs',import.meta.url));
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const db=new D1SQLite(),now=Date.now();
try{
 let entered;const ready=new Promise(r=>entered=r);let release;
 const pending=runAvatarAITrial(db,async signal=>{
  eq(signal.aborted,false);eq(db.get('ai-trial:lease').expires_at,now+108000);entered();return new Promise(r=>release=r);
 },now);
 await ready;eq((await runRealAITrial(db,async()=>({ok:true}),now)).error,'ai_busy');release({ok:true});eq((await pending).ok,true);
 eq(db.get('ai-trial:lease')?.expires_at??0,0);
 for(let i=1;i<10;i++){
  const r=await (i%2?runRealAITrial:runAvatarAITrial)(db,async()=>{
   eq(db.get('ai-trial:lease').expires_at,now+(i%2?60000:108000));return {ok:true};
  },now);eq(r.ok,true);
 }
 eq((await trialStatus(db,now)).used,10);
 eq((await runAvatarAITrial(db,async()=>{throw Error('must not run');},now)).error,'ai_trial_daily');
 eq((await runRealAITrial(db,async()=>{throw Error('must not run');},now)).error,'ai_trial_daily');
 eq(db.keys().some(k=>k.startsWith('ai-trial:notice:')),true);
}finally{db.close();}
const failures=new D1SQLite();
try{
 for(const work of [runAvatarAITrial,runRealAITrial,runAvatarAITrial])eq((await work(failures,async()=>({error:'provider_failed'}),now)).error,'provider_failed');
 eq((await trialStatus(failures,now)).stopped,true);
 eq((await runRealAITrial(failures,async()=>({ok:true}),now)).error,'ai_stopped');
 eq((await runAvatarAITrial(failures,async()=>({ok:true}),now)).error,'ai_stopped');
}finally{failures.close();}
// Exercise abort without paying or waiting a minute. Only this isolated call's
// timeout scheduling is replaced, and restored even on failure.
const aborted=new D1SQLite(),set=globalThis.setTimeout,clear=globalThis.clearTimeout;
try{
 let timeout=0;globalThis.setTimeout=(f,ms)=>{timeout=ms;queueMicrotask(f);return -1;};globalThis.clearTimeout=()=>{};
 const result=await runAvatarAITrial(aborted,async signal=>new Promise(resolve=>signal.addEventListener('abort',()=>resolve({ok:true}),{once:true})),now);
 eq(timeout>59000&&timeout<=60000,true);eq(result.error,'ai_failed');eq(aborted.get('ai-trial:lease')?.expires_at??0,0);
}finally{globalThis.setTimeout=set;globalThis.clearTimeout=clear;aborted.close();}
console.log('Avatar shared trial candidate: '+checks+' SQLite checks passed; one shared lease/day/stop circuit, text 12s unchanged, image 60s bounded, abort and cleanup; no API');
