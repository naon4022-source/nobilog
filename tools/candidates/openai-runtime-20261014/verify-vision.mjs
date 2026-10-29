import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {canonicalImage} from '../../../cf-worker/src/learning-images.mjs';
import {ownedVisionInput,prepareVision,countedVision} from './openai-vision.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},fail=async f=>{await assert.rejects(f);n++;};
const stream=new Blob([new Uint8Array([255,0,0,255])]).stream().pipeThrough(new CompressionStream('deflate'));
const bytes=new Uint8Array(await new Response(stream).arrayBuffer()),image=await canonicalImage({width:1,height:1,data:Buffer.from(bytes).toString('base64')});
const db=new D1SQLite(),uid='p_pro',content={instructions:'Explain only the visible learning content. Return answer JSON.',input:'Synthetic exercise image.',maxOutputTokens:1024};
try{
 db.seed('learning-image:'+uid+':'+image.id,JSON.stringify(image));
 const v=await prepareVision(db,uid,'pro',content,[image.id]);
 eq(v.body.model,'gpt-6.1-sol');eq(v.body.store,false);eq(v.imageCount,1);eq(v.body.input[0].role,'user');
 eq(v.body.input[0].content[1].detail,'high');eq(v.body.input[0].content[1].image_url.startsWith('data:image/png;base64,'),true);
 eq(Object.hasOwn(v.body,'tools'),false);eq(Object.hasOwn(v.body,'previous_response_id'),false);
 eq((await prepareVision(db,uid,'unlimit',content,[image.id])).body.model,'gpt-6.1-sol');
 await fail(()=>prepareVision(db,uid,'mini',content,[image.id]));await fail(()=>prepareVision(db,uid,'standard',content,[image.id]));
 await fail(()=>ownedVisionInput(db,'p_unlimit',[image.id]));await fail(()=>ownedVisionInput(db,uid,[image.id,image.id]));
 await fail(()=>ownedVisionInput(db,uid,['https://example.test/image.png']));await fail(()=>ownedVisionInput(db,uid,[]));
 const counted=countedVision(v,{object:'response.input_tokens',input_tokens:1229});
 eq(counted.inputUpperBound,1293);eq(counted.reservation,1293*500+1024*2000);
 counted.body.input[0].content[1].detail='low';eq(v.body.input[0].content[1].detail,'high');
 for(const value of [-1,0,31937,NaN,Infinity,'1229']){assert.throws(()=>countedVision(v,{object:'response.input_tokens',input_tokens:value}));n++;}
 assert.throws(()=>countedVision(v,{object:'wrong',input_tokens:1229}));n++;
 for(const patch of [{width:2},{bytes:image.bytes+1},{png:'https://example.test/image.png'},{caption:'extra metadata'}]){
  db.seed('learning-image:'+uid+':'+image.id,JSON.stringify({...image,...patch}));
  await fail(()=>ownedVisionInput(db,uid,[image.id]));
 }
 const corrupted=Buffer.from(image.png,'base64');corrupted[corrupted.length-1]^=1;
 db.seed('learning-image:'+uid+':'+image.id,JSON.stringify({...image,png:corrupted.toString('base64')}));
 await fail(()=>ownedVisionInput(db,uid,[image.id]));
}finally{db.close();}
console.log(`OpenAI vision preparation: ${n} isolated checks passed; canonical synthetic PNG, owner-only, Sol policy, exact-count reservation, no API`);
