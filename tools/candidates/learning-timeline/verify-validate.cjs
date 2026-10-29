'use strict';
const assert=require('node:assert/strict'),{validate}=require('./validate.cjs');let checks=0;
const id='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002';
const body={id,sessionId:sid,activity:'textbook:math1',startOffset:1000,endOffset:2000};
const context={session:{id:sid,startedAt:100000},now:103000,catalog:[{id:'textbook:math1',subject:'数学',kind:'textbook'},{id:'question:m1',subject:'数学',kind:'question'}]};
function bad(b,c=context){assert.throws(()=>validate(b,c));checks++;}
assert.deepEqual(validate(body,context),{id,sessionId:sid,activity:'textbook:math1',subject:'数学',kind:'textbook',start:101000,end:102000,acceptedAt:103000});checks++;
bad({...body,uid:'someone'});bad({...body,subject:'英語'});bad({...body,start:0});bad({...body,answer:'秘密の回答'});
bad({...body,sessionId:id});bad({...body,id:'bad'});bad({...body,activity:'textbook:missing'});
bad({...body,startOffset:-1});bad({...body,endOffset:1000});bad({...body,endOffset:7000});bad({...body,startOffset:1.5});bad({...body,endOffset:NaN});
bad(body,{...context,now:101000});bad(body,{...context,now:100000+7*86400000+1});bad(body,{...context,session:null});
assert.equal(validate(body,{...context,now:100000+86400000}).start,101000);checks++;
const saved=validate({...body,activity:'question:m1'},context);assert.equal(saved.kind,'question');checks++;
const before=JSON.stringify({body,context});validate(body,context);assert.equal(JSON.stringify({body,context}),before);checks++;
console.log('Timeline validation candidate: '+checks+' checks passed; server-anchored offsets, unknown fields/activities, expiry, no identity/answer input, immutable payload; no network');
