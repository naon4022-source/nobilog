import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import story from './story-catalog.mjs';
import {ownClearHistory} from './party-store.mjs';
import {readCampaignProgress} from './progress-store.mjs';
import {readHistoryPage} from './history-store.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),a={uid:'synthetic_a',owner:'owner_a'},b={uid:'synthetic_b',owner:'owner_b'};
for(const s of [a,b])db.seed('active-session:'+s.uid,s.owner,10000);
try{
 assert.deepEqual(await readCampaignProgress(db,a,()=>1000),{completedStageIds:[]});
 function receipt(stageId,roomId,at){db.seed('coop-story-clear:'+a.uid+':'+roomId,JSON.stringify({version:1,roomId,stageId,at,companions:[],presentMembers:[{uid:a.uid,name:'旅人A'}]}),0);}
 for(const stage of story.stages)receipt(stage.id,'initial_'+stage.id,1000+stage.number);
 for(let i=0;i<51;i++)receipt('story_01','replay_'+i,2000);
 assert.equal((await ownClearHistory(db,a,3000)).length,50);
 assert.equal((await ownClearHistory(db,a,3000)).every(x=>x.stageId==='story_01'),true,'latest history no longer contains other chapters');
 assert.deepEqual((await readCampaignProgress(db,a,()=>3000)).completedStageIds,story.stages.map(x=>x.id),'all chapter unlocks survive 51 early-stage replays');
 assert.deepEqual(await readCampaignProgress(db,b,()=>3000),{completedStageIds:[]},'peer progress is never included');
 const page1=await readHistoryPage(db,a,'',()=>3000),page2=await readHistoryPage(db,a,page1.next,()=>3000);
 assert.equal(page1.items.length,50);assert.equal(page2.items.length,13);assert.equal(page2.next,null);
 assert.equal(new Set([...page1.items,...page2.items].map(x=>x.roomId)).size,63,'all older companion records remain reachable, including tied timestamps');
 assert.deepEqual(await readHistoryPage(db,b,'',()=>3000),{items:[],next:null});
 await assert.rejects(()=>readHistoryPage(db,a,'other_owner:cursor',()=>3000),/history_cursor/);
 let calls=0;await assert.rejects(()=>readCampaignProgress(db,a,()=>{if(++calls===2)db.seed('active-session:'+a.uid,'replacement',10000);return 3000;}),/active_session/);
 calls=0;await assert.rejects(()=>readCampaignProgress(db,b,()=>++calls===1?3000:10000),/active_session/);
 await assert.rejects(()=>readHistoryPage(db,a,'',()=>3000),/active_session/);
 assert.equal(db.keys().filter(k=>k.startsWith('material-attempt:')).length,0);
}finally{db.close();}
console.log('Campaign progress/history: all 12 unlocks survive 51 replays; 63 companion receipts paginate with tied timestamps, peer/cursor isolation, fresh-clock expiry and revocation, no ordinary attempts passed.');
