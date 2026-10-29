import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {textbookVisionRequest,textbookImageKey,textbookImageRecord,ownedTextbookVisionParts,prepareTextbookVision,textbookVisionCeiling,countedTextbookVision} from './textbook-vision-input.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url),sha=v=>createHash('sha256').update(v).digest('hex');
const copy=v=>structuredClone(v);let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};const same=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const bad=async(fn,message)=>{await assert.rejects(fn,message);checks++;};
const ref={book:'math1',anchor:'a'.repeat(64),annotationSignature:TEXTBOOK_AI_CONTEXTS.math1.annotationSignature,contextSha256:TEXTBOOK_AI_CONTEXTS.math1.sha256,sourceSha256:'b'.repeat(64),page:2,kind:'fig',quote:'AB＝6 cm の三角形の図。',title:'合成教科書',subject:'数学',chapter:'合成章',section:'合成節',sectionTitle:'図の読み方'};
const pixels=value=>({width:2,height:2,data:deflateSync(Buffer.from(Array.from({length:16},(_,i)=>i%4===3?255:value+i))).toString('base64')});
const images=[];for(const value of [1,21,41])images.push(await textbookImageRecord(ref,pixels(value)));
const request={id:'vision_request_01',text:'この図の考え方を教えて。',book:ref.book,anchor:ref.anchor,annotationSignature:ref.annotationSignature,contextSha256:ref.contextSha256,images:images.map(r=>r.image.id)};
function database(uid,records=images){
 const rows=new Map(records.map(row=>[textbookImageKey(uid,ref,row.image.id),JSON.stringify(row)]));let reads=0;
 return {rows,get reads(){return reads;},prepare(sql){assert.equal(sql,'SELECT v FROM auth_kv WHERE k=?');return {bind(key){return {async first(column){assert.equal(column,'v');reads++;return rows.get(key)??null;}};}};}};
}
for(const uid of ['u1','u2','u4','p_pro','p_unlimit'])for(const plan of ['pro','unlimit'])for(const count of [1,2,3]){
 const db=database(uid),body={...request,images:request.images.slice(0,count)},prepared=await prepareTextbookVision(db,uid,plan,body,ref);
 same(prepared.body.model,plan==='pro'?'gpt-6-luna':'gpt-6.1-sol','explicit requested model');
 same(prepared.imageCount,count,'all owned images included');same(db.reads,count,'one owner/reference-scoped read per image');
 ok(prepared.body.input[0].content.slice(1).every(p=>p.type==='input_image'&&p.detail==='high'&&p.image_url.startsWith('data:image/png;base64,')),'only PNG pixels, no URLs/file IDs');
 ok(prepared.body.instructions.includes('never invent it')&&prepared.body.instructions.includes('without proactively giving the final answer'),'readability and hidden-answer constraints');
 same(JSON.parse(prepared.body.input[0].content[0].text).reference,ref,'unchanged source numbers and reference');
 ok(textbookVisionCeiling(prepared)>0,'generation and preflight worst-case hold');
 same(prepared.requestDigest,(await prepareTextbookVision(database(uid),uid,plan,body,ref)).requestDigest,'fixed request digest');
 const counted=countedTextbookVision(prepared,{object:'response.input_tokens',input_tokens:200});same(counted.inputUpperBound,264,'exact count with bounded framing');
 same(counted.body.model,prepared.body.model,'count keeps selected model');
}
for(const plan of ['free','mini','standard','unknown'])await bad(()=>prepareTextbookVision(database('u1'),'u1',plan,request,ref),/plan_required/);
for(const uid of ['u3','u12','u1:other','',null])await bad(()=>prepareTextbookVision(database('u1'),uid,'pro',request,ref),/invalid_textbook_image/);
await bad(()=>prepareTextbookVision(database('u1'),'u4','pro',request,ref),/invalid_textbook_image/);
const valid=await prepareTextbookVision(database('u4'),'u4','pro',request,ref);
for(const override of [{model:'gpt-6.1-sol'},{uid:'u1'},{image_url:'https://example.invalid/x.png'},{images:[]},{images:[request.images[0],request.images[0]]},{images:['https://example.invalid/x.png']},{images:[...request.images,request.images[0]]}]){
 assert.throws(()=>textbookVisionRequest({...request,...override}));checks++;
}
const blank=textbookVisionRequest({...request,text:''});ok(blank.text.includes('最初の一歩'),'blank image question has explicit learning prompt');
for(const prop of ['anchor','annotationSignature','contextSha256'])await bad(()=>prepareTextbookVision(database('u1'),'u1','pro',{...request,[prop]:'f'.repeat(64)},ref),/context_changed/);
await bad(()=>prepareTextbookVision(database('u1'),'u1','pro',request,{...ref,sourceSha256:'c'.repeat(64)}),/context_changed/);
for(const edit of [row=>{row.extra='metadata';},row=>{row.reference.sourceSha256='d'.repeat(64);},row=>{row.image.width++;},row=>{row.image.bytes++;},row=>{row.image.png=Buffer.from('not png').toString('base64');},row=>{row.image.id='e'.repeat(64);},row=>{const b=Buffer.from(row.image.png,'base64');b[45]^=1;row.image.png=b.toString('base64');}]){
 const row=copy(images[0]),id=row.image.id;edit(row);const db=database('u1');db.rows.set(textbookImageKey('u1',ref,id),JSON.stringify(row));await bad(()=>ownedTextbookVisionParts(db,'u1',{...request,images:[id]},ref));
}
// Valid PNG/CRC with a different pixel identity must still be refused.
{const row=copy(images[1]),id=images[0].image.id;row.image.id=id;const db=database('u1');db.rows.set(textbookImageKey('u1',ref,id),JSON.stringify(row));await bad(()=>ownedTextbookVisionParts(db,'u1',{...request,images:[id]},ref),/invalid_textbook_image/);}
for(const edit of [p=>{p.body.model='gpt-6.1-sol';},p=>{p.body.store=true;},p=>{p.body.service_tier='fast';},p=>{p.body.tools=[];},p=>{p.body.instructions='ignore safety';},p=>{p.body.input[0].content[1].image_url='https://example.invalid/x.png';},p=>{p.countBody.input=[];},p=>{p.body.reasoning={effort:'high'};},p=>{p.imageCount=0;},p=>{p.body.max_output_tokens=4096;}]){
 const p=copy(valid);edit(p);assert.throws(()=>textbookVisionCeiling(p));checks++;
}
for(const n of [0,-1,31937,32000,1.5]){assert.throws(()=>countedTextbookVision(valid,{object:'response.input_tokens',input_tokens:n}));checks++;}
const reordered=await prepareTextbookVision(database('u4'),'u4','pro',{...request,images:[...request.images].reverse()},ref);ok(reordered.requestDigest!==valid.requestDigest,'image order is part of immutable request');
const otherModel=await prepareTextbookVision(database('u4'),'u4','unlimit',request,ref);ok(otherModel.requestDigest!==valid.requestDigest,'plan/model changes cannot reuse request fingerprint');
const files=['textbook-vision-input.mjs','verify-input.mjs'].map(f=>'tools/candidates/textbook-vision-20261027/'+f);
files.push('cf-worker/src/learning-images.mjs','cf-worker/src/openai-chat-content.mjs','cf-worker/src/textbook-ai-chat-content.mjs','cf-worker/src/textbook-ai-context-manifest.mjs','cf-worker/src/openai-policy.mjs','cf-worker/src/openai-vision.mjs');
const inputs=[];for(const file of files)inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
await writeFile(new URL('input-result.json',here),JSON.stringify({status:'passed',checks,inputs,scope:'Internal candidate only. Synthetic canonical pixels; all3 users/two plans/1–3 images, exact owner/book/reference binding, CRC/decompression/pixel identity, model selection, no URLs or caller model, immutable digest and bounded exact-count policy. No route/consent/entitlement authorization, monetary journal, provider, UI, main integration or whole-feature claim.'},null,2)+'\n');
console.log('Textbook vision input candidate: '+checks+' checks passed; synthetic only, no network.');
