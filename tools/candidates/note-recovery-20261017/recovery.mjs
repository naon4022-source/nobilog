// Read only verified completed operations. Never retry a provider request here.
import {extendedNoteContent,extendedNoteResponse} from '../../../cf-worker/src/openai-note-extended-content.mjs';
import {prepareNoteReview} from '../../../cf-worker/src/openai-note-extended-transport.mjs';
import {requestBody,MODELS} from '../../../cf-worker/src/openai-policy.mjs';
const ID=/^[a-zA-Z0-9_-]{8,64}$/,UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
async function digest(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');}
export async function completedNoteResult(db,uid,id){
 if(!db||!UID.test(uid)||!ID.test(id))throw Error('invalid_note_result');
 const contextKey='openai-note-context:'+uid+':'+id;
 const contextRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(contextKey).first('v');
 if(!contextRaw)return null;if(contextRaw.length>28000)throw Error('invalid_note_context');
 const context=JSON.parse(contextRaw);if(context.version!==1)throw Error('invalid_note_context');
 const spec=extendedNoteContent(context),recordKey='learning-note-analysis:'+uid+':'+id;
 const recordRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(recordKey).first('v');
 if(recordRaw){
  if(recordRaw.length>14000)throw Error('invalid_note_result');
  const item=JSON.parse(recordRaw);
  if(item.id!==id||item.noteId!==context.id||item.revision!==context.revision||item.real!==true||![MODELS.luna,MODELS.sol].includes(item.model))throw Error('invalid_note_result');
  extendedNoteResponse(JSON.stringify(item.analysis),context);
  return {item,recordRaw,recordKey,contextKey,contextRaw};
 }
 const operationKey='openai-operation:'+uid+':'+id;
 const operationRaw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(operationKey).first('v');
 if(!operationRaw)return null;if(operationRaw.length>14000)throw Error('invalid_note_operation');
 const operation=JSON.parse(operationRaw);
 if(operation.state!=='done')return null;
 if(typeof operation.digest!=='string'||!/^[a-f0-9]{64}$/.test(operation.digest))throw Error('invalid_note_operation');
 // Reconstruct the original fixed note request from its immutable snapshot,
 // not from the current editor or a client-provided prompt/model.
 const body=spec.noteExact===true?(await prepareNoteReview(db,uid,'pro',context)).body:requestBody('pro','note-analysis',spec.content).body;
 if(await digest(JSON.stringify(body))!==operation.digest)throw Error('note_operation_mismatch');
 const analysis=extendedNoteResponse(JSON.stringify(operation.value),context);
 const item={id,noteId:context.id,revision:context.revision,analysis,model:body.model,real:true};
 return {item,recordRaw:JSON.stringify(item),recordKey,contextKey,contextRaw,operationKey,operationRaw};
}
export async function commitCompletedNote(db,uid,owner,job,proof,now){
 if(!UID.test(uid)||typeof owner!=='string'||!owner||!job||!ID.test(job.id)||job.id!==proof?.item?.id||job.noteId!==proof.item.noteId||job.revision!==proof.item.revision||job.state!=='pending'||!Number.isSafeInteger(now))return false;
 const jobKey='learning-note-job:'+uid+':'+job.noteId,expected=JSON.stringify(job),done=JSON.stringify({...job,state:'done'});
 const guards='EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)'+(proof.operationKey?' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)':'');
 const args=['active-session:'+uid,owner,now,jobKey,expected,proof.contextKey,proof.contextRaw,...(proof.operationKey?[proof.operationKey,proof.operationRaw]:[])];
 const rows=await db.batch([
  db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+guards+' ON CONFLICT(k) DO NOTHING').bind(proof.recordKey,proof.recordRaw,...args),
  db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+guards+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)').bind(done,jobKey,expected,...args,proof.recordKey,proof.recordRaw)
 ]);
 if(rows[1]?.meta?.changes===1)return true;
 // Two tabs may finish the same metadata commit. Accept only the same
 // completed value, snapshot and still-active owner; never a newer job.
 const active=await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,now).first('x');
 if(!active)return false;
 const latestJob=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(jobKey).first('v');
 const latestRecord=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(proof.recordKey).first('v');
 const latestContext=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(proof.contextKey).first('v');
 return latestJob===done&&latestRecord===proof.recordRaw&&latestContext===proof.contextRaw;
}
