// Immutable own-image conversation snapshots. Existing text snapshots are
// neither rewritten nor regraded. PNG payloads stay in their immutable owner
// records; snapshots pin the exact prepared body hash and policy digest.
import {textbookChatHistory} from '../../../cf-worker/src/textbook-ai-history.mjs';
import {textbookReference,textbookChatReply} from '../../../cf-worker/src/textbook-ai-chat-content.mjs';
import {chatContent} from '../../../cf-worker/src/openai-chat-content.mjs';
import {textbookVisionRequest,prepareTextbookVision,historicalTextbookVisionParts} from './textbook-vision-input.mjs';
const UID=/^(u[124]|p_(free|mini|standard|pro|unlimit))$/,HASH=/^[a-f0-9]{64}$/;
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const keys=(v,list)=>!!v&&!Array.isArray(v)&&typeof v==='object'&&Object.keys(v).sort().join(',')===list;
const fail=code=>{throw Error(code||'vision_context_unavailable');};
const prefixFor=uid=>{if(typeof uid!=='string'||!UID.test(uid))fail();return 'textbook-ai-vision-context:'+uid+':';};
export async function visionOperationId(body){const r=textbookVisionRequest(body);return sha('textbook-image:'+r.book+':'+r.anchor+':'+r.id);}
function rowShape(row,request){
 if(!keys(row,'at,bodySha256,context,fingerprint,history,plan,policy,policyDigest,request,version')||row.version!==1||!['pro','unlimit'].includes(row.plan)||!Number.isSafeInteger(row.at)||row.at<0||![row.bodySha256,row.fingerprint,row.policyDigest].every(s=>typeof s==='string'&&HASH.test(s)))fail();
 const r=textbookVisionRequest(row.request),ref=textbookReference(row.context);
 if(JSON.stringify(r)!==JSON.stringify(request)||ref.book!==r.book||ref.anchor!==r.anchor||ref.annotationSignature!==r.annotationSignature||ref.contextSha256!==r.contextSha256||ref.kind!=='fig')fail('id_conflict');
 chatContent({text:r.text},row.history);
 const p=row.policy,parts=p?.input?.[0]?.content;
 if(!keys(p,'input,instructions,max_output_tokens,model,reasoning,service_tier,store,text')||p.model!==(row.plan==='pro'?'gpt-6-luna':'gpt-6.1-sol')||p.store!==false||p.service_tier!=='default'||p.max_output_tokens!==1024||typeof p.instructions!=='string'||!p.instructions.trim()||p.instructions.length>12000||JSON.stringify(p.reasoning)!=='{"effort":"low"}'||JSON.stringify(p.text)!=='{"format":{"type":"json_object"}}'||!Array.isArray(p.input)||p.input.length!==1||!keys(p.input[0],'content,role')||p.input[0].role!=='user'||!Array.isArray(parts)||parts.length!==r.images.length+1||!keys(parts[0],'text,type')||parts[0].type!=='input_text'||typeof parts[0].text!=='string'||parts[0].text.length>12000)fail();
 if(parts.slice(1).some((part,i)=>!keys(part,'imageId,type')||part.type!=='owned_textbook_image'||part.imageId!==r.images[i]))fail();
 let content;try{content=JSON.parse(parts[0].text);}catch(_){fail();}
 const expected={task:'textbook-vision-study',learnerInput:r.text,reference:ref,...(row.history.length?{conversation:row.history}:{})};
 if(JSON.stringify(content)!==JSON.stringify(expected))fail();
 return row;
}
export async function restoredTextbookVision(db,uid,row,body,{imageCache}={}){
 const request=textbookVisionRequest(body);rowShape(row,request);
 if(row.fingerprint!==await sha(JSON.stringify(request)))fail('id_conflict');
 const images=await historicalTextbookVisionParts(db,uid,request,row.context,{cache:imageCache}),responseBody=structuredClone(row.policy);
 responseBody.input[0].content=[responseBody.input[0].content[0],...images];
 if(row.bodySha256!==await sha(JSON.stringify(responseBody))||row.policyDigest!==await sha(JSON.stringify({request,body:responseBody})))fail();
 return {plan:row.plan,body:responseBody,countBody:{model:responseBody.model,instructions:responseBody.instructions,input:responseBody.input,text:responseBody.text},imageCount:images.length,reference:row.context,requestDigest:row.policyDigest,historical:true};
}
export async function completedVisionChat(db,uid,snapshot,operation,{imageCache}={}){
 const restored=await restoredTextbookVision(db,uid,snapshot,snapshot.request,{imageCache}),p=operation?.visionPricing;
 if(operation?.state!=='done'||operation.digest!==snapshot.policyDigest||operation.visionBillable!==true||operation.visionCreditState!=='charged'||operation.visionReceipt?.version!==1||!['plan','textbook'].includes(operation.visionReceipt.kind)||!keys(p,'bodySha256,ceilingMicroYen,creditMode,imageCount,kind,model,settlement,version')||p.kind!=='textbook-vision'||p.creditMode!=='required'||p.version!==1||p.model!==restored.body.model||p.imageCount!==snapshot.request.images.length||p.bodySha256!==snapshot.bodySha256||p.settlement!=='hold-preflight-and-generation'||!Number.isSafeInteger(operation.amount)||operation.amount<1||p.ceilingMicroYen!==operation.amount)fail('invalid_vision_history');
 return {id:snapshot.request.id,book:snapshot.context.book,anchor:snapshot.context.anchor,text:snapshot.request.text,images:[...snapshot.request.images],answer:textbookChatReply(JSON.stringify(operation.value)).answer,context:snapshot.context,model:restored.body.model,at:snapshot.at,real:true,mock:false,state:'done'};
}
export async function textbookVisionHistory(db,uid,{book,anchor,id},limit=30){
 prefixFor(uid);if(!Number.isSafeInteger(limit)||limit<1||limit>30)fail();
 const dummy=textbookVisionRequest({book,anchor,id:id||'history_query',text:'履歴',images:['0'.repeat(64)],annotationSignature:'0'.repeat(64),contextSha256:'0'.repeat(64)}),prefix=prefixFor(uid),opPrefix='openai-operation:'+uid+':';
 if(id){
  const key=await visionOperationId(dummy),raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(prefix+key).first('v');
  if(!raw)return {state:'not_found'};if(raw.length>48000)fail();
  const snapshot=JSON.parse(raw);if(snapshot.request?.id!==id||snapshot.context?.book!==book||snapshot.context?.anchor!==anchor)fail();
  const journal=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(opPrefix+key).first('v');
  if(!journal)return {state:'not_started'};
  const operation=JSON.parse(journal);
  if(operation.digest!==snapshot.policyDigest)fail();
  if(operation.state==='done')return {state:'done',item:await completedVisionChat(db,uid,snapshot,operation)};
  await restoredTextbookVision(db,uid,snapshot,snapshot.request);
  if(!['reserved','started','rejected'].includes(operation.state))fail();
  return {state:operation.state==='started'?'unknown':operation.state};
 }
 const rows=(await db.prepare("SELECT c.v AS snapshot,o.v AS operation FROM auth_kv c JOIN auth_kv o ON o.k=?||substr(c.k,?) WHERE c.k>=? AND c.k<? AND json_valid(c.v) AND json_valid(o.v) AND json_extract(c.v,'$.context.book')=? AND json_extract(c.v,'$.context.anchor')=? AND json_extract(o.v,'$.state')='done' ORDER BY CAST(json_extract(c.v,'$.at') AS INTEGER) DESC,c.k DESC LIMIT ?").bind(opPrefix,prefix.length+1,prefix,prefix+'\uffff',book,anchor,limit).all()).results||[];
 // Request-local immutable image cache: repeated use of one figure in thirty
 // messages performs one owned-row read/decode, never a cross-account cache.
 const items=[],imageCache=new Map();for(const row of rows){if(row.snapshot.length>48000)fail();items.unshift(await completedVisionChat(db,uid,JSON.parse(row.snapshot),JSON.parse(row.operation),{imageCache}));}
 return {items};
}
export async function capturedTextbookVision(db,uid,body,{plan,env,readContext,now,guard,operationExists=false}){
 const request=textbookVisionRequest(body),prefix=prefixFor(uid),key=prefix+await visionOperationId(request);
 if(!['pro','unlimit'].includes(plan)||!Number.isSafeInteger(now)||now<0||typeof guard!=='function'||typeof readContext!=='function')fail();
 const prior=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
 if(prior){if(prior.length>48000)fail();const snapshot=JSON.parse(prior);return {snapshot,prepared:await restoredTextbookVision(db,uid,snapshot,request)};}
 if(operationExists)fail();
 const context=textbookReference(await readContext(env,{book:request.book,anchor:request.anchor,annotationSignature:request.annotationSignature,contextSha256:request.contextSha256}));
 if(context.kind!=='fig')fail('figure_required');
 const legacy=(await textbookChatHistory(db,uid,{book:request.book,anchor:request.anchor})).items,vision=(await textbookVisionHistory(db,uid,{book:request.book,anchor:request.anchor},6)).items;
 const candidates=[...legacy,...vision].sort((a,b)=>b.at-a.at||b.id.localeCompare(a.id)),history=[];
 for(const row of candidates.slice(0,6)){
  if(row.book!==request.book||row.anchor!==request.anchor||row.real!==true||row.mock!==false||typeof row.text!=='string')fail();
  const pair={text:row.text.slice(0,1000),answer:textbookChatReply(JSON.stringify({answer:row.answer})).answer.slice(0,1000)};
  if(JSON.stringify([pair,...history]).length>6000)break;history.unshift(pair);
 }
 const prepared=await prepareTextbookVision(db,uid,plan,request,context,history),policy=structuredClone(prepared.body);
 const frozenHistory=JSON.parse(prepared.body.input[0].content[0].text).conversation||[];
 policy.input[0].content=[policy.input[0].content[0],...request.images.map(imageId=>({type:'owned_textbook_image',imageId}))];
 const snapshot={version:1,request,fingerprint:await sha(JSON.stringify(request)),plan,context,history:frozenHistory,policy,policyDigest:prepared.requestDigest,bodySha256:await sha(JSON.stringify(prepared.body)),at:now};
 rowShape(snapshot,request);const serialized=JSON.stringify(snapshot);if(serialized.length>48000)fail();
 const g=guard();if(!g?.sql||!Array.isArray(g.values))fail();
 const saved=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+g.sql+' AND (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<1000 ON CONFLICT(k) DO NOTHING RETURNING v').bind(key,serialized,...g.values,prefix,prefix+'\uffff').first('v');
 const actual=saved||await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');if(!actual||actual.length>48000)fail();
 const stored=JSON.parse(actual);return {snapshot:stored,prepared:await restoredTextbookVision(db,uid,stored,request)};
}
