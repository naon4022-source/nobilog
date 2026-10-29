// Runtime adapter for the existing cloudSnapshotGet(env, uid) helper. This module
// is not a tool to inspect a real user's saved data. Tests use synthetic objects.
export function createOwnedWordReader({db,snapshot,clock=()=>Date.now()}){
 if(!db||typeof snapshot!=='function'||typeof clock!=='function')throw Error('word_reader_configuration');
 async function lease(s){
  const now=clock();
  if(typeof s?.uid!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(s.uid)||typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
  if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+s.uid,s.owner,now).first('v'))throw Error('active_session');
 }
 return async function loadOwnWords(s){
  await lease(s);
  const saved=await snapshot(s.uid);
  // A snapshot read may cross an asynchronous save or a session replacement.
  // Recheck using a fresh server clock, not the timestamp from before the read.
  await lease(s);
  if(saved===null)return {ownerUid:s.uid,snapshot:null};
  if(!saved||!Number.isSafeInteger(saved.v)||saved.v<1||!saved.keys||typeof saved.keys!=='object'||Array.isArray(saved.keys)||Object.entries(saved.keys).some(([key,value])=>!key.startsWith(s.uid+':')||typeof value!=='string'))throw Error('word_snapshot_invalid');
  const key=s.uid+':eikenVocab';
  if(!Object.prototype.hasOwnProperty.call(saved.keys,key))return {ownerUid:s.uid,snapshot:null};
  const raw=saved.keys[key];
  if(raw.length>2000000)throw Error('word_snapshot_invalid');
  let words;try{words=JSON.parse(raw);}catch(_){throw Error('word_snapshot_invalid');}
  if(!words||words.v!==1||!words.words||typeof words.words!=='object'||Array.isArray(words.words))throw Error('word_snapshot_invalid');
  // No notes, calendar, money or peer records leave this adapter.
  return {ownerUid:s.uid,snapshot:words};
 };
}
