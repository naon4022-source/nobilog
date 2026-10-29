'use strict';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function create({same,ready,request}){
 if(typeof same!=='function'||typeof ready!=='function'||typeof request!=='function')throw Error('invalid bridge');
 function own(){if(!same()||!ready())throw Error('保存への接続を確認してください。');}
 async function post(path,body){
  own();const result=await request(path,structuredClone(body));own();
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('保存応答を確認できません。');return result;
 }
 async function start(body){
  if(!body||Object.keys(body).join(',')!=='id'||!UUID.test(body.id||''))throw Error('invalid start');
  const response=await post('/learning-time-start',body),s=response.session;
  if(!s||s.id!==body.id||!Number.isSafeInteger(s.startedAt)||s.startedAt<0||!Number.isSafeInteger(response.serverTime)||response.serverTime<s.startedAt)throw Error('invalid start receipt');
  return {session:{id:s.id,startedAt:s.startedAt},serverTime:response.serverTime};
 }
 async function send(body){
  if(!body||Object.keys(body).sort().join(',')!=='id,sessionId,spans'||!UUID.test(body.id||'')||!UUID.test(body.sessionId||'')||!Array.isArray(body.spans)||body.spans.length<1||body.spans.length>60)throw Error('invalid chunk');
  for(const s of body.spans)if(!s||Object.keys(s).sort().join(',')!=='activity,endOffset,startOffset'||typeof s.activity!=='string'||!s.activity||s.activity.length>160||!Number.isSafeInteger(s.startOffset)||s.startOffset<0||!Number.isSafeInteger(s.endOffset)||s.endOffset<=s.startOffset||s.endOffset-s.startOffset>5000||s.endOffset>4*3600000)throw Error('invalid span');
  const response=await post('/learning-time',body);
  if(response.id!==body.id||!Number.isSafeInteger(response.acceptedAt)||response.acceptedAt<0)throw Error('invalid save receipt');
  return {id:response.id,acceptedAt:response.acceptedAt};
 }
 return Object.freeze({start,send});
}
module.exports={create};
