// Guarded read-only quiz adapter. It never creates ordinary attempts or rewards.
// loadOwnWords is a server helper for the caller's saved snapshot, not request data.
import {materialPool,wordPool} from './eligible-pool.mjs';
import {createWordChallenge,publicWordChallenge,gradeWordChallenge} from './word-challenges.mjs';
const subjects=new Set(['国語','数学','英語','理科','社会']);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x);
const active='EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)';
function guard(s,now){
 if(!id(s?.uid)||typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
 return ['active-session:'+s.uid,s.owner,now];
}
async function lease(db,s,now){
 if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind(...guard(s,now)).first('v'))throw Error('active_session');
}
export async function readEligibleMaterials(db,s,units,now){
 const prefix='material-attempt:'+s.uid+':';
 const rows=(await db.prepare("SELECT DISTINCT json_extract(v,'$.unitId') unitId,json_extract(v,'$.questionId') questionId,json_extract(v,'$.mode') mode FROM auth_kv WHERE k>=? AND k<? AND json_extract(v,'$.result.correct')=1 AND "+active).bind(prefix,prefix+'\uffff',...guard(s,now)).all()).results||[];
 await lease(db,s,now);
 return materialPool({ownerUid:s.uid,recordOwnerUid:s.uid,units,records:rows.map(r=>({...r,result:{correct:true}}))});
}

export function createQuizService({db,bank,engine,wordBank,loadOwnWords,randomUint32=()=>crypto.getRandomValues(new Uint32Array(1))[0],makeId=()=>crypto.randomUUID().replace(/-/g,'')}){
 if(!db||!Array.isArray(bank?.units)||!Array.isArray(wordBank?.grades)||typeof engine?.grade!=='function'||typeof engine.validateUnit!=='function'||typeof loadOwnWords!=='function')throw Error('quiz_configuration');
 // The existing validator decides which current authored units are playable.
 const units=bank.units.filter(u=>u.status==='ready'&&subjects.has(u.subject)&&engine.validateUnit(u,{sources:bank.sources}).length===0);
 const index=new Map(units.map(u=>[u.id,u]));
 function randomIndex(length){const n=randomUint32();if(!Number.isInteger(n)||n<0||n>0xffffffff||length<1)throw Error('quiz_random');return n%length;}
 async function ownedWords(s,now){
  guard(s,now);await lease(db,s,now);
  const saved=await loadOwnWords(s,now);
  if(saved?.ownerUid!==s.uid)throw Error('pool_owner');
  await lease(db,s,now);
  return {ownerUid:s.uid,recordOwnerUid:saved.ownerUid,snapshot:saved.snapshot,bank:wordBank};
 }
 async function candidates(s,now){
  const material=await readEligibleMaterials(db,s,units,now);
  const words=await ownedWords(s,now);
  return {material,words,all:[...material,...wordPool(words)]};
 }
 async function resolve(s,q,now){
  if(!q||q.ownerUid!==s.uid)throw Error('quiz_owner');
  if(q.kind==='word')return {words:await ownedWords(s,now)};
  if(q.kind!=='material'||!id(q.unitId)||!id(q.questionId)||!['study','test'].includes(q.mode))throw Error('quiz_descriptor');
  const pool=await readEligibleMaterials(db,s,units,now);
  if(!pool.some(p=>p.unitId===q.unitId&&p.questionId===q.questionId&&p.mode===q.mode))throw Error('question_not_eligible');
  const unit=index.get(q.unitId),question=(q.mode==='test'?unit.tests:unit.questions).find(x=>x.id===q.questionId);
  return {unit,question};
 }
 return Object.freeze({
  async choose(s,now){
   const {words,all}=await candidates(s,now);
   if(!all.length)return null;
   // Balance available subjects first; a large word list must not crowd out
   // the learner's previously-correct mathematics/science/Japanese/social work.
   const available=[...new Set(all.map(x=>x.subject))];
   const selectedSubject=available[randomIndex(available.length)];
   const group=all.filter(x=>x.subject===selectedSubject);
   const chosen=group[randomIndex(group.length)],suffix=makeId();
   if(typeof suffix!=='string'||!/^[A-Za-z0-9_-]{16,60}$/.test(suffix))throw Error('quiz_id');
   if(chosen.kind==='word')return createWordChallenge(words,{wordId:chosen.wordId,challengeId:'wc_'+suffix,randomUint32:randomIndex(0x100000000)});
   return {kind:'material',ownerUid:s.uid,challengeId:'mc_'+suffix,unitId:chosen.unitId,mode:chosen.mode,questionId:chosen.questionId};
  },
  async project(s,q,now){
   const resolved=await resolve(s,q,now);
   if(q.kind==='word')return publicWordChallenge(resolved.words,q);
   return {challengeId:q.challengeId,kind:'material',subject:resolved.unit.subject,prompt:resolved.question.prompt};
  },
  async grade(s,q,answer,now){
   if(typeof answer!=='string'||answer.length>4000)throw Error('quiz_answer');
   const resolved=await resolve(s,q,now);
   if(q.kind==='word')return gradeWordChallenge(resolved.words,q,answer);
   const result=engine.grade(resolved.question,answer);
   return {correct:result.correct===true,near:result.near===true,empty:answer.trim()===''};
  }
 });
}
