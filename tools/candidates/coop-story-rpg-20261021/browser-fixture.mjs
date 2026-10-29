// Test-only local server. Synthetic identities + in-memory SQLite + local
// workerd notifications. No production auth, cloud store or secret is opened.
import {createServer} from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import engine from '../../../cf-worker/src/material-engine.cjs';
import {createCoopRouter} from './route.mjs';
import {createOwnedWordReader} from './owned-word-reader.mjs';
export async function startBrowserFixture(){
 const here=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js');
 const cache=path.join(os.homedir(),'.npm/_npx'),packages=fs.readdirSync(cache).map(d=>path.join(cache,d,'node_modules/wrangler/package.json')).filter(p=>fs.existsSync(p)).map(file=>({file,version:JSON.parse(fs.readFileSync(file)).version})).sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
 const runtimeRequire=createRequire(packages[0].file),{Miniflare,Log,LogLevel}=runtimeRequire('miniflare'),{build}=runtimeRequire('esbuild');
 const bundled=await build({entryPoints:[path.join(here,'browser-events-fixture.mjs')],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']});
 let outbound=0;const workerName='nobi-coop-browser-fixture';
 const native=new Miniflare({cf:false,telemetry:{enabled:false},unsafeEnableSharedStorage:false,log:new Log(LogLevel.ERROR),workers:[{config:{name:workerName,compatibilityDate:'2026-10-19',manifest:{mainModule:'fixture.mjs',modules:{'fixture.mjs':{type:'esm',contents:bundled.outputFiles[0].text}}},env:{FIXTURE_ONLY:{type:'text',value:'true'},COOP_STORY_EVENTS:{type:'durable-object',worker:workerName,exportName:'CoopStoryEvents'}},exports:{CoopStoryEvents:{type:'durable-object',storage:'sqlite'}}},dev:{unsafeRegisterWorker:false,outboundService:{type:'fetcher',handler:()=>{outbound++;return new Response(null,{status:403});}}}}]});
 const db=new D1SQLite(),sessions=Object.fromEntries(['a','b','c'].map((slot,index)=>[slot,{uid:'browser_fixture_'+slot,owner:'fixture_owner_'+slot,name:'旅人'+String.fromCharCode(65+index)}]));
 for(const s of Object.values(sessions))db.seed('active-session:'+s.uid,s.owner,Date.now()+3600000);
 const stats={outbound:()=>outbound,requests:0,tapDrops:0,purchaseDrops:0,tapWrites:[],purchaseWrites:[],errors:[],notified:[]};
 async function eventCall(roomId,revision){
  const url=new URL(revision===undefined?'http://localhost/watch':'http://localhost/invalidate');url.searchParams.set('roomId',roomId);
  return native.dispatchFetch(url,{headers:{'X-Fixture-Bridge':'synthetic'},...(revision===undefined?{}:{method:'POST',body:JSON.stringify({revision})})});
 }
 let challenge=0,dropTap=true,dropPurchases=2;
 const route=createCoopRouter({db,engine,bank:{units:[],sources:[]},wordBank:{grades:[{id:'5',words:[{id:'apple',w:'apple',ja:['りんご']}]}]},clock:()=>Date.now(),authorize:async()=>true,checkOrigin:r=>r.headers.get('Origin')==='http://127.0.0.1:'+server.address().port,displayName:s=>s.name,randomUint32:()=>0,makeId:()=> 'fixture_question_'+String(++challenge).padStart(10,'0'),loadOwnWords:createOwnedWordReader({db,clock:()=>Date.now(),snapshot:async uid=>({v:1,keys:{[uid+':eikenVocab']:JSON.stringify({v:1,words:{apple:{c:1}}})}})}),watch:async roomId=>{const r=await eventCall(roomId);if(!r.ok)throw Error('fixture_native_watch');return r.body;},notify:async(roomId,revision)=>{const r=await eventCall(roomId,revision);if(!r.ok)throw Error('fixture_native_notify');stats.notified.push(await r.json());}});
 const assets=Object.fromEntries(['view.css','view.mjs','view-dom.mjs','client-actions.mjs','game-controller.mjs','live-refresh.mjs'].map(n=>['/'+n,fs.readFileSync(path.join(here,n))]));
 assets['/coop-story-entry.js']=fs.readFileSync(path.join(here,'app-entry.js'));
 assets['/coop-story.css']=assets['/view.css'];
 assets['/coop-story-client.mjs']=Buffer.from("import {mountCoopGame as mount} from '/game-controller.mjs';export const mountCoopGame=(...args)=>(window.game=mount(...args));");
 assets['/vertical-fractions.js']=fs.readFileSync(path.resolve(here,'../../../site-assets/vertical-fractions.js'));
 function html(slot){return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:system-ui;margin:0;color:#172d28;background:#fcfdfb}</style><main id="coop-story-host"></main><script src="/vertical-fractions.js"></script><script>
 window.ownerCurrent=true;window.serverBootReady=true;window.authLeaseBlocked=false;
 window.cloudIdentity=()=>({uid:'browser_fixture_${slot}'});window.cloudSame=who=>window.ownerCurrent&&who.uid==='browser_fixture_${slot}';
 window.isTrial=()=>false;window.vbHeaders=()=>({'X-Fixture-Slot':'${slot}'});window.cloudUrl=path=>location.origin+path;
 </script><script src="/coop-story-entry.js"></script><script type="module">
 await window.NobiCoopEntry.start();window.fixtureReady=true;
 </script>`;}
 const server=createServer(async(req,res)=>{
  try{
   stats.requests++;const origin='http://127.0.0.1:'+server.address().port,url=new URL(req.url,origin);
   if(Object.hasOwn(assets,url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.css')?'text/css':'text/javascript');res.end(assets[url.pathname]);return;}
   const entry=/^\/fixture\/([abc])$/.exec(url.pathname);if(entry){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html(entry[1]));return;}
   if(!url.pathname.startsWith('/coop-story/')){res.writeHead(404);res.end();return;}
   const slot=req.headers['x-fixture-slot'],s=sessions[slot];if(!s){res.writeHead(401);res.end();return;}
   let bytes=0,body='';for await(const part of req){bytes+=part.length;if(bytes>16384){res.writeHead(413);res.end();return;}body+=part.toString('utf8');}
   const method=req.method,headers=new Headers(req.headers);if(!headers.has('Origin'))headers.set('Origin',origin);
   const request=new Request(url,{method,headers,...(['GET','HEAD'].includes(method)?{}:{body})});
   const response=await route(request,s,{owner:s.owner,json:(value,status=200)=>Response.json(value,{status}),requestJson:async(r,limit)=>{const text=await r.text();if(Buffer.byteLength(text)>limit)throw new RangeError('fixture size');return JSON.parse(text);},invalidBody:e=>Response.json({error:e instanceof RangeError?'too_big':'bad_json'},{status:e instanceof RangeError?413:400})});
   const action=url.pathname.slice('/coop-story/'.length);
   if(action==='tap'){stats.tapWrites.push({slot,...JSON.parse(body)});if(response.ok&&slot==='a'&&dropTap){dropTap=false;stats.tapDrops++;req.socket.destroy();return;}}
   if(action==='purchase'){stats.purchaseWrites.push({slot,...JSON.parse(body)});if(response.ok&&slot==='a'&&dropPurchases>0){dropPurchases--;stats.purchaseDrops++;res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'synthetic_post_commit_response_failure'}));return;}}
   res.writeHead(response.status,Object.fromEntries(response.headers));
   if(response.headers.get('Content-Type')?.startsWith('text/event-stream')){
    res.flushHeaders();const reader=response.body.getReader();res.on('close',()=>{void reader.cancel().catch(()=>{});});
    try{while(!res.destroyed){const {done,value}=await reader.read();if(done)break;if(!res.write(Buffer.from(value)))await new Promise(resolve=>{res.once('drain',resolve);res.once('close',resolve);});}}catch(_){}finally{void reader.cancel().catch(()=>{});res.end();}
   }else res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){stats.errors.push(error.message);if(!res.headersSent)res.writeHead(500);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:'http://127.0.0.1:'+server.address().port,stats,db,sessions,
  revoke(slot){const s=sessions[slot];db.seed('active-session:'+s.uid,'replaced_fixture_owner',Date.now()+3600000);},
  async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await native.dispose();db.close();}
 };
}
