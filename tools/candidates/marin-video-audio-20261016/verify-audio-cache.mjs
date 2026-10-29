import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createAudioCache} from './audio-cache.mjs';
import {create} from './transport.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
function wave(size=8000){
 const b=new Uint8Array(44+size),v=new DataView(b.buffer),tag=(i,s)=>{for(let j=0;j<s.length;j++)b[i+j]=s.charCodeAt(j);};
 tag(0,'RIFF');v.setUint32(4,b.length-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,size,true);
 for(let i=44;i<b.length;i+=2)v.setInt16(i,Math.round(2000*Math.sin(i/10)),true);return b;
}
const db=new D1SQLite();
try{
 const a=createAudioCache(db),b=createAudioCache(db),hash='a'.repeat(64),audio=wave(600000);
 eq(await a.receipt(hash),null);
 const claim=await a.claim(hash);eq(claim.created,true);eq((await b.claim(hash)).created,false);eq((await b.receipt(hash)).state,'pending');
 eq(await b.commit(hash,'wrong-token',audio),false);eq(await a.commit(hash,claim.token,audio),true);
 const restored=await createAudioCache(db).receipt(hash);eq(restored.bytes,audio);eq(restored.chunks,3);eq(restored.info.seconds,37.5);
 eq(await b.commit(hash,claim.token,wave()),false);eq(await b.uncertain(hash,claim.token),false);eq((await b.receipt(hash)).audioSha256,restored.audioSha256);
 restored.bytes[0]=0;eq((await b.receipt(hash)).bytes[0],82);
 const failed='b'.repeat(64),pending=await a.claim(failed);db.failBatchAt=1;
 await assert.rejects(a.commit(failed,pending.token,audio));checks++;db.failBatchAt=-1;
 eq((await b.receipt(failed)).state,'pending');eq(db.keys().some(k=>k.startsWith('textbook-speech:'+failed+':')),false);
 eq(await b.uncertain(failed,pending.token),true);eq((await a.claim(failed)).state,'uncertain');eq(await a.commit(failed,pending.token,audio),false);
 db.seed('textbook-speech:'+hash+':1','AAAA',0);await assert.rejects(b.receipt(hash));checks++;
 await assert.rejects(a.claim('../outside'));checks++;
}finally{db.close();}
// Real transport + SQLite journal, only synthetic PCM and fake credentials/fetch.
const db2=new D1SQLite();
try{
 const plan=JSON.parse(await readFile(new URL('../../../教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/音声共有/Marin固定_20261014/音声生成ジョブ_20261016.json',import.meta.url),'utf8'));
 const [hash,body]=Object.entries(plan.requests)[0];let calls=0,reserves=0,lose=true;
 const make=()=>{const cache=createAudioCache(db2);return create({instructions:body.instructions,authorize:async()=>true,lookup:async()=>body,receipt:key=>cache.receipt(key),getKey:async()=>'synthetic-only',
  reserve:async key=>{reserves++;const row=await cache.claim(key);return {ok:row.created,id:row.token};},
  commit:async result=>{const done=await cache.commit(result.requestSha256,result.leaseId,result.bytes);if(lose){lose=false;throw Error('synthetic lost persistence reply');}return done;},
  uncertain:({requestSha256,leaseId})=>cache.uncertain(requestSha256,leaseId),
  fetchImpl:async()=>{calls++;return new Response(wave(),{headers:{'Content-Type':'audio/wav'}});}});};
 eq((await make().generate(hash)).ok,false);eq(calls,1);
 const restored=await make().generate(hash);eq(restored.ok,true);eq(restored.cached,true);eq(calls,1);eq(reserves,1);
}finally{db2.close();}
console.log(`Speech cache candidate: ${checks} checks passed; actual isolated SQLite, multi-chunk byte equality, checkpoint, immutable completion, batch rollback, persistent unknown stop and lost-save restart replay; synthetic PCM/fetch only, not connected to shared billing or trial gates`);
