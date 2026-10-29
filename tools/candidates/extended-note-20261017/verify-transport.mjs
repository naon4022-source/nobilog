import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const {prepareNoteReview,noteReviewCeiling,generateNoteReview}=await import(process.argv.includes('--main')?'../../../cf-worker/src/openai-note-extended-transport.mjs':'./transport.mjs');
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const db=new D1SQLite(),uid='p_pro',ids=[];
const env={OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only'};
for(let i=0;i<3;i++){const image=await canonicalImage({width:1,height:1,data:deflateSync(Buffer.from([i*70,0,0,255])).toString('base64')});ids.push(image.id);db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));}
const text='学び'.repeat(6000),note={id:'note_fixture',revision:1,title:'まとめ',text,images:[]};
const base={summary:'記録した考えを確かめよう。',strengths:['自分の言葉で書いています。'],checks:[{quote:'学び',reason:'具体例を確かめよう。',nextStep:'一つ例を挙げよう。'}],practice:[]};
try{
 for(const plan of ['free','mini','standard']){await assert.rejects(()=>prepareNoteReview(db,uid,plan,note));checks++;}
 await assert.rejects(()=>prepareNoteReview(db,uid,'pro',{...note,text:'短いノート'}));checks++;
 await assert.rejects(()=>prepareNoteReview(db,'p_unlimit','unlimit',{...note,images:ids}));checks++;
 for(const n of [0,1,3]){
  const source={...note,images:ids.slice(0,n)},prepared=await prepareNoteReview(db,uid,'pro',source);
  eq(prepared.body.model,'gpt-6.1-sol');eq(prepared.body.store,false);eq(prepared.body.service_tier,'default');eq(prepared.body.max_output_tokens,2048);eq(prepared.imageCount,n);
  const encoded=n?prepared.body.input[0].content[0].text:prepared.body.input;
  eq(JSON.parse(encoded).note.text,text);eq(JSON.parse(encoded).attachedImageCount,n);eq(encoded.includes(ids[0]),false);eq(noteReviewCeiling(prepared),36098000);
  const value=n?{...base,imageChecks:ids.slice(0,n).map((_,image)=>({image,readable:false,observation:'文字を判読できません。',reason:'式を確認できません。',nextStep:'明るい場所で撮り直そう。'}))}:base;
  const controller=new AbortController();let calls=0,held=false;
  const r=await generateNoteReview(env,prepared,{signal:controller.signal,authorized:async()=>true,reserve:async amount=>{eq(calls,0);eq(amount,36098000);held=true;return true;},fetcher:async(url,opts)=>{
   calls++;eq(held,true);eq(opts.headers.Authorization,'Bearer synthetic-only');eq(opts.redirect,'error');
   const body=JSON.parse(opts.body);
   if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
   if(url.endsWith('input_tokens')){eq(body,prepared.countBody);return Response.json({object:'response.input_tokens',input_tokens:13000});}
   eq(url,'https://api.openai.com/v1/responses');eq(body,prepared.body);
   return Response.json({status:'completed',model:body.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:13000,output_tokens:300}});
  }});
  eq(r.real,true);eq(r.value,value);eq(calls,4);eq(r.reservedMicroYen,36098000);
 }
 const prepared=await prepareNoteReview(db,uid,'pro',{...note,images:ids});
 for(const change of [{body:{...prepared.body,model:'choose-me'}},{body:{...prepared.body,max_output_tokens:4096}},{body:{...prepared.body,tools:[]}},{body:{...prepared.body,store:true}},{imageCount:4},{countBody:{...prepared.countBody,input:'different'}}]){assert.throws(()=>noteReviewCeiling({...prepared,...change}));checks++;}
 for(const kind of ['budget','input-blocked','input-owner-loss','count-owner-loss','bad-count','bad-model','bad-usage','wrong-tier','answer-leak-field','output-blocked','abort','network']){
  let calls=0,allowed=true;const controller=new AbortController();
  const r=await generateNoteReview(env,prepared,{signal:controller.signal,authorized:async()=>allowed,reserve:async()=>kind!=='budget',fetcher:async(url,opts)=>{
   calls++;if(kind==='network'&&calls===3)throw Error('untrusted provider details');
   if(kind==='input-owner-loss'&&calls===1)allowed=false;if(kind==='count-owner-loss'&&calls===2)allowed=false;if(kind==='abort'&&calls===3)controller.abort();
   if(url.endsWith('moderations'))return Response.json({results:[{flagged:kind==='input-blocked'&&calls===1||kind==='output-blocked'&&calls===4}]});
   if(url.endsWith('input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:kind==='bad-count'?32000:1000});
   const value={...base,imageChecks:ids.map((_,image)=>({image,readable:false,observation:'確認できません。',reason:'文字が小さいためです。',nextStep:'大きく撮り直そう。'})),...(kind==='answer-leak-field'?{model:'not allowed'}:{})};
   return Response.json({status:'completed',model:kind==='bad-model'?'wrong-model':JSON.parse(opts.body).model,service_tier:kind==='wrong-tier'?'priority':'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:kind==='bad-usage'?30000:1000,output_tokens:100}});
  }});
  eq(!!r.error,true);eq(Object.hasOwn(r,'value'),false);eq(JSON.stringify(r).includes('untrusted provider details'),false);
  const expected={budget:0,'input-blocked':1,'input-owner-loss':1,'count-owner-loss':2,'bad-count':2,'output-blocked':4}[kind]??3;eq(calls,expected);
 }
 eq(db.keys().filter(k=>!k.startsWith('learning-image:')),[]);
}finally{db.close();}
console.log('Extended note transport candidate: '+checks+' checks passed; whole 12000 chars, 0/1/3 owned images, Sol policy, exact count and separate preflight reservation, guards per HTTP, schema/usage/tier/abort/privacy rejection; no live API');
