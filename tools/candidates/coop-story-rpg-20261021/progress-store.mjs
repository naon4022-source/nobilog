import story from './story-catalog.mjs';
// Progress is independent of the latest-50 history window. Replaying an early
// stage must not hide chapters already cleared with other companions.
export async function readCampaignProgress(db,s,clock=()=>Date.now()){
 const now=clock();
 if(typeof s?.uid!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(s.uid)||typeof s.owner!=='string'||!s.owner||!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
 const prefix='coop-story-clear:'+s.uid+':';
 const rows=(await db.prepare("SELECT DISTINCT json_extract(v,'$.stageId') stageId FROM auth_kv WHERE k>=? AND k<? AND json_extract(v,'$.version')=1 AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)").bind(prefix,prefix+'\uffff','active-session:'+s.uid,s.owner,now).all()).results||[];
 const fresh=clock();if(!Number.isSafeInteger(fresh)||fresh<now)throw Error('invalid_server_time');
 if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+s.uid,s.owner,fresh).first('v'))throw Error('active_session');
 const completed=new Set(rows.map(x=>x.stageId));
 return {completedStageIds:story.stages.filter(x=>completed.has(x.id)).map(x=>x.id)};
}
