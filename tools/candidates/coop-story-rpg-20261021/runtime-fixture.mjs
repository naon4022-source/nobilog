// Isolated native-RPC fixture only; no app auth, user records or bindings.
import {CoopStoryEvents} from './invalidation-do.mjs';
export {CoopStoryEvents};
const slots=new Set(['one','two','three']);
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(env.FIXTURE_ONLY!=='true'||!['localhost','127.0.0.1'].includes(url.hostname))return new Response(null,{status:404});
 const slot=request.headers.get('X-Fixture-Slot');
 if(!slots.has(slot))return new Response(null,{status:403});
 const events=env.COOP_STORY_EVENTS.getByName('synthetic-room-only');
 if(url.pathname==='/watch'&&request.method==='GET')return new Response(await events.watch(),{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store'}});
 if(url.pathname==='/invalidate'&&request.method==='POST'&&slot==='one')return Response.json(await events.invalidate(7));
 return new Response(null,{status:404});
}};
