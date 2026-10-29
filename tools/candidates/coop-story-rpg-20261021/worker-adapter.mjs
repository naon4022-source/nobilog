// V3 integration adapter. The main Worker must authenticate and claim the
// existing active session before calling this; no public RPC endpoint exists.
import {createCoopRouter} from './route.mjs';
import {createOwnedWordReader} from './owned-word-reader.mjs';
const routes=new WeakMap();
export function createWorkerAdapter({bank,engine,wordBank,snapshot}){
 if(typeof snapshot!=='function')throw Error('coop_worker_configuration');
 return async function coopStoryRoute(request,env,session,helpers){
  if(!env?.AUTH_DB||!env?.COOP_STORY_EVENTS)return helpers.json({error:'coop_unavailable'},503);
  // Cache immutable authored-bank validation and binding adapters, never a
  // request, session, answer, inventory, or other user's mutable data.
  let entry=routes.get(env);
  if(!entry||entry.bank!==bank||entry.engine!==engine||entry.wordBank!==wordBank||entry.snapshot!==snapshot){
   const appOrigin=new URL(env.APP_ORIGIN||'https://nobilog.pages.dev').origin;
   const stub=id=>env.COOP_STORY_EVENTS.get(env.COOP_STORY_EVENTS.idFromName(id));
   const router=createCoopRouter({
    db:env.AUTH_DB,bank,engine,wordBank,
    authorize:async(_request,verified)=>typeof verified?.uid==='string'&&typeof verified?.name==='string',
    checkOrigin:r=>r.headers.get('Origin')===appOrigin,
    displayName:s=>s.name.replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,24)||'旅人',
    loadOwnWords:createOwnedWordReader({db:env.AUTH_DB,snapshot:uid=>snapshot(env,uid)}),
    watch:id=>stub(id).watch(),notify:(id,revision)=>stub(id).invalidate(revision)
   });
   entry={bank,engine,wordBank,snapshot,router};routes.set(env,entry);
  }
  return entry.router(request,session,helpers);
 };
}
