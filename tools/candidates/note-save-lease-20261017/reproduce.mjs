import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {learningAssistantRoute} from '../../../cf-worker/src/learning-assistant.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
for(const mode of ['create','update']){
 const db=new D1SQLite(),uid='p_pro',owner='old-synthetic-owner',now=Date.now(),origin='https://synthetic.invalid';
 try{
  db.seed('active-session:'+uid,owner,now+600000);db.seed('plan:'+uid,JSON.stringify({plan:'pro',start:now-1000,end:null,next:null,revision:1}));
  if(mode==='update')db.seed('learning-note:'+uid+':note_fixture',JSON.stringify({id:'note_fixture',title:'保存済み',text:'元の本文',images:[],revision:1,updatedAt:now-1}));
  const prepare=db.prepare.bind(db);let revoked=false;
  db.prepare=sql=>{
   const statement=prepare(sql);
   if((mode==='create'&&sql.includes('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE ?=0'))||(mode==='update'&&sql.includes("UPDATE auth_kv SET v=? WHERE k=? AND CAST(json_extract(v,'$.revision')"))){
    const bind=statement.bind;statement.bind=(...args)=>{const bound=bind(...args),first=bound.first;bound.first=async key=>{db.seed('active-session:'+uid,'new-synthetic-owner',now+600000);revoked=true;return first.call(bound,key);};return bound;};
   }
   return statement;
  };
  const body={id:'note_fixture',revision:mode==='update'?1:0,title:'遅れて届いた保存',text:'旧セッションの本文'};
  const request=new Request(origin+'/learning-notes',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const response=await learningAssistantRoute(request,{AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1'},{uid},{owner});
  assert.equal(revoked,true);assert.equal(response.status,200);assert.equal(JSON.parse(db.get('learning-note:'+uid+':note_fixture').v).text,body.text);
  console.log('REPRODUCED '+mode+': old in-flight owner can save after lease changes; synthetic SQLite only; this is a remaining defect, not a successful protection test');
 }finally{db.close();}
}
