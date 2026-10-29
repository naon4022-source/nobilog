// Candidate: consumes only caller-owned records fetched by a guarded server
// repository. This is not an authorization boundary or a browser-write API.
// It never writes/regrades ordinary learning history.
const subjects=new Set(['国語','数学','英語','理科','社会']);
const key=(unitId,mode,questionId)=>JSON.stringify([unitId,mode,questionId]);
export function materialPool({ownerUid,recordOwnerUid,records,units}){
 if(typeof ownerUid!=='string'||!ownerUid||ownerUid!==recordOwnerUid)throw Error('pool_owner');
 if(!Array.isArray(records)||!Array.isArray(units))throw Error('pool_input');
 const catalog=new Map();
 for(const unit of units){
  if(unit.status!=='ready'||!subjects.has(unit.subject))continue;
  for(const mode of ['study','test'])for(const q of (mode==='test'?unit.tests:unit.questions)||[]){
   if(q.type==='reading')continue;
   catalog.set(key(unit.id,mode,q.id),{kind:'material',unitId:unit.id,mode,questionId:q.id,subject:unit.subject});
  }
 }
 const chosen=new Map();
 for(const record of records){
  if(record?.result?.correct!==true||!['study','test'].includes(record.mode))continue;
  const k=key(record.unitId,record.mode,record.questionId),entry=catalog.get(k);
  if(entry)chosen.set(k,entry);
 }
 return [...chosen.values()];
}

// Historical word counts are legacy saved learning records, not immutable
// server-graded attempts. Fetch the snapshot for the authenticated owner only;
// keep that provenance explicit instead of claiming server-graded evidence.
export function wordPool({ownerUid,recordOwnerUid,snapshot,bank}){
 if(typeof ownerUid!=='string'||!ownerUid||ownerUid!==recordOwnerUid)throw Error('pool_owner');
 if(!snapshot||snapshot.v!==1||!snapshot.words||typeof snapshot.words!=='object'||Array.isArray(snapshot.words))return [];
 if(!bank||!Array.isArray(bank.grades))throw Error('pool_bank');
 const chosen=new Map();
 for(const grade of bank.grades)for(const word of grade.words||[]){
  const count=snapshot.words[word.id]?.c;
  if(!Number.isSafeInteger(count)||count<1)continue;
  chosen.set(word.id,{kind:'word',wordId:word.id,subject:'英語',grade:grade.id,provenance:'owner_saved_correct_count',direction:null});
 }
 return [...chosen.values()];
}

// Cross-account async results must be discarded even if the old request
// finishes later. This small generation token is for candidate invalidation;
// the server still rechecks ownership on every protected read/write.
export function createPoolGeneration(){
 let owner='',generation=0;
 return Object.freeze({
  changeOwner(uid){owner=typeof uid==='string'?uid:'';generation++;return {owner,generation};},
  invalidateAfterSave(uid,success){if(success===true&&uid===owner){generation++;return {owner,generation};}return null;},
  token(){return {owner,generation};},
  current(token){return Boolean(owner)&&token?.owner===owner&&token?.generation===generation;}
 });
}
