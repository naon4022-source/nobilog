import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
import {unlinkGoogle,googleStatus} from './google-account.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
for(const uid of ['u1','u2','u4']){
 const db=new D1SQLite(),now=10000,token='synthetic-current',ticket='synthetic-proof',ownerHash='synthetic-owner',operationId='synthetic-operation-'+uid;
 for(const user of ['u1','u2','u4']){db.seed('identity:google:synthetic-'+user,user);db.seed('identity:line:synthetic-'+user,user);db.seed('cloud-save:'+user,'synthetic-learning-'+user);db.seed('session:google-'+user,JSON.stringify({uid:user,provider:'google'}),now+10000);db.seed('legacy:proof-'+user,user,now+10000);}
 const seed=()=>{db.seed('session:'+token,JSON.stringify({uid,provider:'pin'}),now+10000);db.seed('legacy:'+ticket,uid,now+10000);db.seed('active-session:'+uid,ownerHash,now+10000);};seed();
 ok((await googleStatus(db,{uid},now)).linked,'own link status '+uid);
 const before=JSON.stringify(db.db.prepare('SELECT * FROM auth_kv ORDER BY k').all());
 ok((await unlinkGoogle(db,{uid,token},{ticket:'wrong',ownerHash,operationId,now})).status===403,'bad proof refused '+uid);
 ok(JSON.stringify(db.db.prepare('SELECT * FROM auth_kv ORDER BY k').all())===before,'rejected request has no changes '+uid);
 db.failBatchAt=3;let failed=false;try{await unlinkGoogle(db,{uid,token},{ticket,ownerHash,operationId,now});}catch{failed=true;}
 ok(failed&&JSON.stringify(db.db.prepare('SELECT * FROM auth_kv ORDER BY k').all())===before,'failed transaction rolls back all changes '+uid);db.failBatchAt=-1;
 db.beforeBatch=()=>db.seed('active-session:'+uid,'other-owner',now+10000);
 ok((await unlinkGoogle(db,{uid,token},{ticket,ownerHash,operationId,now})).status===403,'lease changed before commit refused '+uid);db.beforeBatch=null;seed();
 const result=await unlinkGoogle(db,{uid,token},{ticket,ownerHash,operationId,now});ok(result.status===200&&!result.linked,'own unlink succeeds '+uid);
 ok(db.get('identity:google:synthetic-'+uid).v===''&&db.get('session:google-'+uid).v==='','own Google identity and old session revoked '+uid);
 ok(db.get('session:'+token).v.includes('pin'),'current verified session retained '+uid);
 for(const user of ['u1','u2','u4']){
  ok(db.get('cloud-save:'+user).v==='synthetic-learning-'+user,'learning data unchanged '+user);
  ok(db.get('identity:line:synthetic-'+user).v===user,'LINE unchanged '+user);
  if(user!==uid)ok(db.get('identity:google:synthetic-'+user).v===user,'other Google identity unchanged '+user);
 }
 ok(!(await googleStatus(db,{uid},now)).linked,'status now unlinked '+uid);
 db.seed('identity:google:synthetic-new-'+uid,uid);
 ok((await unlinkGoogle(db,{uid,token},{ticket,ownerHash,operationId,now})).status===403,'spent proof cannot repeat '+uid);
 ok(db.get('identity:google:synthetic-new-'+uid).v===uid,'old retry preserves later relinking '+uid);
 db.close();
}
await writeFile(new URL('account-result.json',import.meta.url),JSON.stringify({status:'passed',checks,scope:'candidate SQL in real in-memory SQLite; three synthetic users; not deployed or integrated'},null,2)+'\n');
console.log('Google account management candidate:',checks,'isolated checks passed');
