import {noteContent} from './note-content.mjs';
const ID=/^[a-zA-Z0-9_-]{8,64}$/;
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
// Must be called from serveStudyAI's buildSpec callback, after consent,
// entitlement, session and trial gates. Never accepts client note contents.
export async function capturedNote(db,uid,requestId,selection){
 if(!db||!UID.test(uid)||typeof requestId!=='string'||!ID.test(requestId)||!selection||Object.keys(selection).sort().join(',')!=='noteId,revision'||typeof selection.noteId!=='string'||!ID.test(selection.noteId)||!Number.isSafeInteger(selection.revision)||selection.revision<1)throw Error('invalid_note_selection');
 const key='openai-note-context:'+uid+':'+requestId;
 const read=async()=>{
  const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key).first('v');
  if(!raw)return null;
  if(raw.length>14000)throw Error('invalid_note_context');
  const saved=JSON.parse(raw);
  if(saved.version!==1||saved.id!==selection.noteId||saved.revision!==selection.revision)throw Error('note_context_conflict');
  noteContent(saved);return saved;
 };
 const prior=await read();if(prior)return prior;
 const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind('learning-note:'+uid+':'+selection.noteId).first('v');
 if(!raw)throw Error('note_not_found');
 const source=JSON.parse(raw);
 if(source.id!==selection.noteId||source.revision!==selection.revision)throw Error('note_revision_conflict');
 const saved={version:1,id:source.id,revision:source.revision,title:source.title,text:source.text,images:source.images||[]};
 noteContent(saved);
 const prefix='openai-note-context:'+uid+':';
 await db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE (SELECT COUNT(*) FROM auth_kv WHERE k>=? AND k<?)<10000 ON CONFLICT(k) DO NOTHING').bind(key,JSON.stringify(saved),prefix,prefix+'\uffff').run();
 const result=await read();if(!result)throw Error('note_context_unavailable');return result;
}
