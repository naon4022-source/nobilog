// Local harness bridge only. Never a production entry or authentication path.
import {CoopStoryEvents} from './invalidation-do.mjs';
export {CoopStoryEvents};
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(env.FIXTURE_ONLY!=='true'||!['localhost','127.0.0.1'].includes(url.hostname)||request.headers.get('X-Fixture-Bridge')!=='synthetic')return new Response(null,{status:404});
 const roomId=url.searchParams.get('roomId');if(!/^[A-Za-z0-9_-]{1,80}$/.test(roomId||''))return new Response(null,{status:400});
 const events=env.COOP_STORY_EVENTS.getByName(roomId);
 if(url.pathname==='/watch'&&request.method==='GET')return new Response(await events.watch(),{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store'}});
 if(url.pathname==='/invalidate'&&request.method==='POST'){
  const text=await request.text();if(text.length>100)return new Response(null,{status:413});
  const revision=JSON.parse(text).revision;if(!Number.isSafeInteger(revision)||revision<1)return new Response(null,{status:400});return Response.json(await events.invalidate(revision));
 }
 return new Response(null,{status:404});
}};
