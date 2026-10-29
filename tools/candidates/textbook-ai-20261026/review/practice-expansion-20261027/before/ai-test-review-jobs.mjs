// Durable state for owned review jobs. No provider call, queue message, grading
// or implicit credit reservation is performed by this module.
import {completedTestData,readCompletedTest} from './ai-test-session.mjs';
import {testReviewAccess,testReviewCreditSnapshot} from './ai-test-review-credits.mjs';
import {buildTestReviewChunks,testReviewDigest} from './ai-test-review-content.mjs';
import {parseTestReviewReply,testReviewModel} from './ai-test-review-format.mjs';
const UID=/^(?:u[124]|p_(?:free|mini|standard|pro|unlimit))$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,HASH=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9_-]{8,64}$/;
const LEASE_MS=90000,MAX_BYTES=250000;
const codes=new Set(['ai_busy','ai_trial_daily','ai_stopped','provider_not_ready','ai_budget','ai_consent_required','session_changed','plan_changed','content_changed','provider_failed','billing_not_ready','request_outcome_unknown','save_failed','enqueue_pending']);
const exact=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(','),copy=v=>JSON.parse(JSON.stringify(v)),fail=code=>{throw Error(code);};
const qid=v=>typeof v==='string'&&!!v.trim()&&v.length<=160&&!/[\x00-\x1f\x7f<>]/.test(v),time=v=>Number.isSafeInteger(v)&&v>=0;
const key=(uid,id)=>{if(!UID.test(uid)||!UUID.test(id))fail('invalid_review_job');return 'ai-test-review-job:'+uid+':'+id;};
const manifest=chunks=>chunks.map(({id,digest,questionIds,practices})=>({id,digest,questionIds,practices}));
function checkIdentity(env,uid,owner,now){if(!env.AUTH_DB||!UID.test(uid)||(uid.startsWith('p_')&&env.PREVIEW_PLAN_ACCOUNTS!=='1')||typeof owner!=='string'||!owner||owner.length>128||!time(now))fail('invalid_review_identity');}
const active=async(db,uid,owner,at)=>!!await db.prepare('SELECT 1 AS x FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+uid,owner,at).first('x');
async function rights(env,uid,owner,at){
 const access=await testReviewAccess(env,uid,{owner,now:at}),raw=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=? AND (expires_at=0 OR expires_at>?)').bind('openai-access:'+uid,at).first('v');
 let consent;try{consent=JSON.parse(raw);}catch{fail('ai_consent_required');}
 if(consent?.version!=='2026-10-14'||consent.approved!==true||!['13-17','adult'].includes(consent.ageBand)||consent.ageBand==='13-17'&&consent.guardianConsent!==true)fail('ai_consent_required');
 return {plan:access.plan,model:access.model,guard:{sql:access.guard.sql+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=? AND (expires_at=0 OR expires_at>?))',values:[...access.guard.values,'openai-access:'+uid,raw,at]}};
}
async function decode(raw,uid,id){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)fail('invalid_review_job');
 let row;try{row=JSON.parse(raw);}catch{fail('invalid_review_job');}
 if(!exact(row,['version','id','uid','requestId','at','updatedAt','sourceFingerprint','manifestSha256','plan','model','total','owner','receipt','chunks','state','code','lease','completedAt'])||row.version!==1||row.uid!==uid||row.id!==id||!ID.test(row.requestId)||!time(row.at)||!time(row.updatedAt)||row.updatedAt<row.at||!HASH.test(row.sourceFingerprint)||!HASH.test(row.manifestSha256)||!['pro','unlimit'].includes(row.plan)||row.model!==testReviewModel(row.plan)||!Number.isSafeInteger(row.total)||row.total<1||row.total>500||typeof row.owner!=='string'||!row.owner||row.owner.length>128||!['queued','running','paused','unknown','done'].includes(row.state)||!(row.code===null||codes.has(row.code))||!exact(row.receipt,['key','token'])||row.receipt.key!=='ai-test-review-credit:'+uid+':'+id||!UUID.test(row.receipt.token)||!Array.isArray(row.chunks)||row.chunks.length<1||row.chunks.length>128)fail('invalid_review_job');
 const questions=new Set(),ids=new Set();
 for(const chunk of row.chunks){
  if(!exact(chunk,['id','digest','questionIds','practices','done'])||!HASH.test(chunk.id)||!HASH.test(chunk.digest)||ids.has(chunk.id)||typeof chunk.done!=='boolean'||!Array.isArray(chunk.questionIds)||chunk.questionIds.length<1||chunk.questionIds.length>15||!Array.isArray(chunk.practices)||chunk.practices.length!==chunk.questionIds.length)fail('invalid_review_job');
  ids.add(chunk.id);
  for(const [i,q] of chunk.questionIds.entries()){
   const p=chunk.practices[i];if(!qid(q)||questions.has(q)||!exact(p,['questionId','ids'])||p.questionId!==q||!Array.isArray(p.ids)||p.ids.length>3||p.ids.some(x=>!ID.test(x))||new Set(p.ids).size!==p.ids.length)fail('invalid_review_job');questions.add(q);
  }
 }
 if(questions.size!==row.total||typeof row.requestId!=='string'||row.manifestSha256!==await testReviewDigest(JSON.stringify(manifest(row.chunks)))||(row.state==='done')!==row.chunks.every(c=>c.done)||!(row.completedAt===null||time(row.completedAt)&&row.completedAt>=row.at)||((row.state==='done')!==(row.completedAt!==null))||(['running','done'].includes(row.state)?row.code!==null:row.state==='queued'?![null,'ai_busy','ai_trial_daily'].includes(row.code):!codes.has(row.code))||(row.state==='unknown'&&row.code!=='request_outcome_unknown'))fail('invalid_review_job');
 if(row.lease!==null&&(!exact(row.lease,['token','until'])||!UUID.test(row.lease.token)||!time(row.lease.until)||row.lease.until<=row.updatedAt||row.lease.until-row.updatedAt>LEASE_MS)||((row.state==='running')!==(row.lease!==null)))fail('invalid_review_job');
 return row;
}
export async function readTestReviewJob(db,uid,id){
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=? AND expires_at=0').bind(key(uid,id)).first('v');return raw===null?null:{raw,row:await decode(raw,uid,id)};
}
export function publicTestReviewJob(row){return {id:row.id,state:row.state,code:row.code,total:row.total,completed:row.chunks.filter(c=>c.done).reduce((n,c)=>n+c.questionIds.length,0),credits:100,createdAt:row.at,completedAt:row.completedAt};}
function requireReceipt(snapshot,row){
 if(!snapshot||snapshot.key!==row.receipt.key||snapshot.row.token!==row.receipt.token||snapshot.row.state!=='charged'||snapshot.row.fingerprint!==row.sourceFingerprint||snapshot.row.plan!==row.plan||snapshot.row.model!==row.model)fail('review_receipt_changed');
}
export async function openTestReviewJob(env,uid,proof,reservation,{owner,requestId,now=Date.now()}={}){
 checkIdentity(env,uid,owner,now);if(typeof requestId!=='string'||!ID.test(requestId))fail('invalid_review_request');
 const source=completedTestData(proof,uid),began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began),first=await rights(env,uid,owner,clock());
 const compiled=await buildTestReviewChunks(proof,uid,first.plan),chunks=compiled.chunks.map(c=>({...manifest([c])[0],done:false})),manifestSha256=await testReviewDigest(JSON.stringify(manifest(chunks))),db=env.AUTH_DB,k=key(uid,source.session.id),prior=await readTestReviewJob(db,uid,source.session.id);
 const row={version:1,id:source.session.id,uid,requestId,at:now,updatedAt:now,sourceFingerprint:source.fingerprint,manifestSha256,plan:first.plan,model:first.model,total:compiled.total,owner,receipt:copy(reservation?.receipt||{}),chunks,state:'queued',code:null,lease:null,completedAt:null};
 const credit=await testReviewCreditSnapshot(db,uid,row.id);requireReceipt(credit,row);
 if(prior){
  const old=prior.row;if(old.sourceFingerprint!==row.sourceFingerprint)fail('id_conflict');if(old.plan!==row.plan||old.model!==row.model)fail('plan_changed');if(old.manifestSha256!==manifestSha256)fail('content_changed');
  if(old.state==='done'||old.state==='running'&&old.lease.until>clock()){const confirmed=await rights(env,uid,owner,clock());if(confirmed.plan!==old.plan||confirmed.model!==old.model)fail('plan_changed');return {job:publicTestReviewJob(old),cached:true};}
  if(old.receipt.token!==row.receipt.token&&old.chunks.some(c=>c.done))fail('review_receipt_changed');
  row.at=old.at;row.requestId=old.requestId;row.chunks=copy(old.chunks);
 }
 const fresh=await rights(env,uid,owner,clock());if(fresh.plan!==row.plan||fresh.model!==row.model)fail('plan_changed');
 row.updatedAt=clock();const raw=JSON.stringify(row);await decode(raw,uid,row.id);
 const creditGuard='EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?)',values=[...fresh.guard.values,credit.key,credit.raw];
 if(prior)await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+fresh.guard.sql+' AND '+creditGuard+' RETURNING v').bind(raw,k,prior.raw,...values).first('v');
 else await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+fresh.guard.sql+' AND '+creditGuard+' ON CONFLICT(k) DO NOTHING RETURNING v').bind(k,raw,...values).first('v');
 const confirmed=await rights(env,uid,owner,clock());if(confirmed.plan!==row.plan||confirmed.model!==row.model)fail('plan_changed');
 const saved=await readTestReviewJob(db,uid,row.id);if(!saved)fail('review_job_unavailable');if(saved.row.sourceFingerprint!==row.sourceFingerprint||saved.row.manifestSha256!==manifestSha256)fail('id_conflict');
 return {job:publicTestReviewJob(saved.row),cached:saved.raw!==raw||!!prior};
}
export async function claimTestReviewJob(env,uid,id,{now=Date.now()}={}){
 const saved=await readTestReviewJob(env.AUTH_DB,uid,id);if(!saved)return null;const old=saved.row;
 if(!['queued','running'].includes(old.state)||old.lease&&old.lease.until>now)return null;
 const r=await rights(env,uid,old.owner,now);if(r.plan!==old.plan||r.model!==old.model)fail('plan_changed');
 const credit=await testReviewCreditSnapshot(env.AUTH_DB,uid,id);requireReceipt(credit,old);
 const lease={token:crypto.randomUUID(),until:now+LEASE_MS},next={...old,state:'running',code:null,lease,updatedAt:now},raw=JSON.stringify(next);await decode(raw,uid,id);
 const changed=await env.AUTH_DB.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+r.guard.sql+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) RETURNING v').bind(raw,key(uid,id),saved.raw,...r.guard.values,credit.key,credit.raw).first('v');
 return changed?{token:lease.token,job:publicTestReviewJob(next)}:null;
}
function parseCompletedOperation(raw,chunk,model){
 let op;try{op=JSON.parse(raw);}catch{fail('review_result_unavailable');}
 if(op?.state!=='done'||op.digest!==chunk.digest||op.pricing?.model!==model||!UUID.test(op.token||''))fail('review_result_unavailable');
 const items=parseTestReviewReply(JSON.stringify(op.value),{questionIds:chunk.questionIds,practiceIdsByQuestion:new Map(chunk.practices.map(p=>[p.questionId,p.ids]))});return {op,items};
}
export async function completeTestReviewChunk(env,uid,id,index,token,{now=Date.now()}={}){
 if(!UUID.test(token||'')||!Number.isSafeInteger(index)||index<0)fail('invalid_review_job');
 const saved=await readTestReviewJob(env.AUTH_DB,uid,id);if(!saved)return false;const old=saved.row,chunk=old.chunks[index];
 if(!chunk||old.lease?.token!==token||old.lease.until<=now||old.state!=='running')return false;
 if(chunk.done)return true;
 const r=await rights(env,uid,old.owner,now);if(r.plan!==old.plan||r.model!==old.model)fail('plan_changed');
 const credit=await testReviewCreditSnapshot(env.AUTH_DB,uid,id);requireReceipt(credit,old);
 const opKey='openai-operation:'+uid+':'+chunk.id,opRaw=await env.AUTH_DB.prepare('SELECT v FROM auth_kv WHERE k=?').bind(opKey).first('v'),{op}=parseCompletedOperation(opRaw,chunk,old.model);
 if(!credit.row.operations.some(o=>o.id===chunk.id&&o.token===op.token&&o.digest===chunk.digest))fail('review_operation_unlinked');
 const chunks=old.chunks.map((c,i)=>i===index?{...c,done:true}:c),done=chunks.every(c=>c.done),next={...old,chunks,updatedAt:now,...(done?{state:'done',completedAt:now,lease:null}:{})},raw=JSON.stringify(next);await decode(raw,uid,id);
 return !!await env.AUTH_DB.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? AND '+r.guard.sql+' AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) AND EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND v=?) RETURNING v').bind(raw,key(uid,id),saved.raw,...r.guard.values,credit.key,credit.raw,opKey,opRaw).first('v');
}
export async function pauseTestReviewJob(db,uid,id,token,code,{now=Date.now()}={}){
 if(!UUID.test(token||'')||!codes.has(code)||!time(now))fail('invalid_review_job');
 const saved=await readTestReviewJob(db,uid,id);if(!saved||saved.row.lease?.token!==token||saved.row.state!=='running')return false;
 const next={...saved.row,updatedAt:now,state:code==='request_outcome_unknown'?'unknown':'paused',code,lease:null};await decode(JSON.stringify(next),uid,id);
 // Only non-content metadata may be stopped even after the old owner expires.
 return !!await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? RETURNING v').bind(JSON.stringify(next),key(uid,id),saved.raw).first('v');
}
export async function testReviewJobAccess(env,uid,{owner,now=Date.now()}={}){
 checkIdentity(env,uid,owner,now);return rights(env,uid,owner,now);
}
export async function requeueTestReviewJob(db,uid,id,token,{code=null,now=Date.now()}={}){
 if(!UUID.test(token||'')||![null,'ai_busy','ai_trial_daily'].includes(code)||!time(now))fail('invalid_review_job');
 const saved=await readTestReviewJob(db,uid,id);if(!saved||saved.row.state!=='running'||saved.row.lease?.token!==token)return false;
 const next={...saved.row,updatedAt:now,state:'queued',code,lease:null};await decode(JSON.stringify(next),uid,id);
 return !!await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? RETURNING v').bind(JSON.stringify(next),key(uid,id),saved.raw).first('v');
}
// A queue worker can stop/wait metadata before claiming when consent, owner,
// provider readiness or the global daily allowance no longer permits work.
// It cannot touch a live worker's state or any content/credits.
export async function deferUnclaimedTestReviewJob(db,uid,id,code,{now=Date.now()}={}){
 if(!codes.has(code)||!time(now))fail('invalid_review_job');const saved=await readTestReviewJob(db,uid,id);
 if(!saved||!['queued','running'].includes(saved.row.state)||saved.row.lease&&saved.row.lease.until>now)return false;
 const state=['ai_busy','ai_trial_daily'].includes(code)?'queued':code==='request_outcome_unknown'?'unknown':'paused';
 const next={...saved.row,updatedAt:now,state,code,lease:null};await decode(JSON.stringify(next),uid,id);
 return !!await db.prepare('UPDATE auth_kv SET v=? WHERE k=? AND v=? RETURNING v').bind(JSON.stringify(next),key(uid,id),saved.raw).first('v');
}
export async function finishedTestReviewResult(env,uid,id,{owner,now=Date.now()}={}){
 checkIdentity(env,uid,owner,now);const db=env.AUTH_DB,began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 if(!await active(db,uid,owner,clock()))fail('session_changed');
 const saved=await readTestReviewJob(db,uid,id);if(!saved)return null;
 if(saved.row.state!=='done'){if(!await active(db,uid,owner,clock()))fail('session_changed');return {job:publicTestReviewJob(saved.row)};}
 const source=completedTestData(await readCompletedTest(env,uid,id,{owner,now:clock()}),uid);if(source.fingerprint!==saved.row.sourceFingerprint)fail('content_changed');
 const items=[];for(const chunk of saved.row.chunks){const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('openai-operation:'+uid+':'+chunk.id).first('v');items.push(...parseCompletedOperation(raw,chunk,saved.row.model).items);}
 if(!await active(db,uid,owner,clock()))fail('session_changed');
 // No plan/provider/consent requirement and no charge on saved result reads.
 return {job:publicTestReviewJob(saved.row),items,questions:source.session.questions.map(s=>({id:s.question.id,prompt:s.question.prompt,answer:s.question.answer,explanation:s.question.explanation||''}))};
}
export async function listTestReviewJobs(env,uid,{owner,now=Date.now()}={}){
 checkIdentity(env,uid,owner,now);const db=env.AUTH_DB,began=performance.now(),clock=()=>now+Math.ceil(performance.now()-began);
 if(!await active(db,uid,owner,clock()))fail('session_changed');
 const prefix='ai-test-review-job:'+uid+':',rows=(await db.prepare("SELECT k,v FROM auth_kv WHERE k>=? AND k<? AND expires_at=0 ORDER BY CAST(json_extract(v,'$.at') AS INTEGER) DESC,k DESC LIMIT 20").bind(prefix,prefix+'\uffff').all()).results||[];
 const jobs=[];for(const saved of rows)jobs.push(publicTestReviewJob(await decode(saved.v,uid,saved.k.slice(prefix.length))));
 if(!await active(db,uid,owner,clock()))fail('session_changed');return {jobs};
}
