// Read-only pagination over the owner's persistent clear receipts.
export async function readHistoryPage(db,s,cursor='',clock=()=>Date.now()){
 if(typeof s?.uid!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(s.uid)||typeof s.owner!=='string'||!s.owner)throw Error('session_guard');
 if(typeof cursor!=='string'||(cursor&&!/^\d{13}:[A-Za-z0-9_-]{1,80}$/.test(cursor)))throw Error('history_cursor');
 const now=clock();if(!Number.isSafeInteger(now)||now<0)throw Error('session_guard');
 const prefix='coop-story-clear:'+s.uid+':',ordering="(printf('%013d',CAST(json_extract(v,'$.at') AS INTEGER))||':'||json_extract(v,'$.roomId'))";
 const rows=(await db.prepare('SELECT v FROM auth_kv WHERE k>=? AND k<? AND EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?)'+(cursor?' AND '+ordering+'<?':'')+" ORDER BY CAST(json_extract(v,'$.at') AS INTEGER) DESC,k DESC LIMIT 51").bind(prefix,prefix+'\uffff','active-session:'+s.uid,s.owner,now,...(cursor?[cursor]:[])).all()).results||[];
 const fresh=clock();if(!Number.isSafeInteger(fresh)||fresh<now)throw Error('invalid_server_time');
 if(!await db.prepare('SELECT v FROM auth_kv WHERE k=? AND v=? AND expires_at>?').bind('active-session:'+s.uid,s.owner,fresh).first('v'))throw Error('active_session');
 const items=rows.slice(0,50).map(row=>{
  const x=JSON.parse(row.v);
  if(x.version!==1||!/^[A-Za-z0-9_-]{1,80}$/.test(x.roomId||'')||!/^story_\d{2}$/.test(x.stageId||'')||!Number.isSafeInteger(x.at)||x.at<0||!Array.isArray(x.companions)||!Array.isArray(x.presentMembers))throw Error('history_store');
  return {roomId:x.roomId,stageId:x.stageId,at:x.at,companions:x.companions.map(p=>p.name),presentAtClear:x.presentMembers.filter(p=>p.uid!==s.uid).map(p=>p.name)};
 });
 const last=items.at(-1);return {items,next:rows.length>50?String(last.at).padStart(13,'0')+':'+last.roomId:null};
}
