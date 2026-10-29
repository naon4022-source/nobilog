import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicTextbookContextReader} from '../../../cf-worker/src/textbook-ai-context.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';

const ROOT=new URL('../../../',import.meta.url),env={APP_ORIGIN:'https://fixture.test'},assets=new Map();
for(const [book,entry] of Object.entries(TEXTBOOK_AI_CONTEXTS))assets.set(book,await readFile(new URL('site-assets'+entry.src,ROOT)));
const selection=(book='math1',row=0)=>({book,anchor:JSON.parse(assets.get(book)).contexts[row].anchor,annotationSignature:TEXTBOOK_AI_CONTEXTS[book].annotationSignature});
const response=book=>new Response(assets.get(book),{headers:{'Content-Type':'application/json'}});
let checks=0,calls=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const read=publicTextbookContextReader({fetcher:async request=>{
 calls++;
 ok(request.method==='GET'&&request.redirect==='error'&&request.cache==='no-store','public fetch has bounded fixed request policy');
 ok([...request.headers.keys()].sort().join(',')==='accept,cache-control','no credentials, identity headers, or cookies forwarded');
 const book=Object.keys(TEXTBOOK_AI_CONTEXTS).find(b=>request.url===env.APP_ORIGIN+TEXTBOOK_AI_CONTEXTS[b].src);
 ok(!!book,'only fixed manifest URLs are fetched');return response(book);
}});
for(const book of Object.keys(TEXTBOOK_AI_CONTEXTS)){
 const row=JSON.parse(assets.get(book)).contexts[0],a=await read(env,selection(book));
 ok(a.quote===row.quote&&a.anchor===row.anchor&&a.page===row.page,'exact '+book+' public source selected');
 ok(a.contextSha256===TEXTBOOK_AI_CONTEXTS[book].sha256&&a.sourceSha256===TEXTBOOK_AI_CONTEXTS[book].sourceSha256,'both '+book+' file identities bound');
 ok(Object.isFrozen(a),'returned public '+book+' record is immutable');
 await read(env,{...selection(book),contextSha256:a.contextSha256});
}
ok(calls===6,'only six public catalogs fetched; subsequent selections reuse immutable public data');
await assert.rejects(()=>read(env,{...selection(),anchor:'f'.repeat(64)}),/context_not_found/);checks++;
let forbiddenFetches=0;
const closed=publicTextbookContextReader({fetcher:async()=>{forbiddenFetches++;throw Error('unexpected_fetch');}});
for(const s of [null,{...selection(),book:'__proto__'},{...selection(),book:'../math1'},{...selection(),url:'https://attacker.invalid/'},{...selection(),anchor:'not-an-anchor'},{...selection(),annotationSignature:''}]){await assert.rejects(()=>closed(env,s),/invalid_context/);checks++;}
for(const s of [{...selection(),annotationSignature:'0'.repeat(64)},{...selection(),contextSha256:'0'.repeat(64)}]){await assert.rejects(()=>closed(env,s),/context_changed/);checks++;}
for(const APP_ORIGIN of [undefined,'http://fixture.test','https://fixture.test/','https://fixture.test/path','https://name:password@fixture.test']){await assert.rejects(()=>closed({APP_ORIGIN},selection()),/context_unavailable/);checks++;}
ok(forbiddenFetches===0,'invalid identity, stale book, hostile selection, or origin never starts a fetch');
let concurrentCalls=0;
const together=publicTextbookContextReader({fetcher:async()=>{concurrentCalls++;await Promise.resolve();return response('math1');}});
const pair=await Promise.all([together(env,selection()),together(env,selection('math1',1))]);
ok(concurrentCalls===1&&pair[0].anchor!==pair[1].anchor,'concurrent public selections share one catalog without mixing excerpts');
let retried=0;
const retry=publicTextbookContextReader({fetcher:async()=>++retried===1?new Response(Buffer.concat([assets.get('math1'),Buffer.from(' ')]),{headers:{'Content-Type':'application/json'}}):response('math1')});
await assert.rejects(()=>retry(env,selection()),/context_changed/);checks++;
ok((await retry(env,selection())).book==='math1'&&retried===2,'failed SHA fetch evicted; explicit retry can recover');

let cancelled=0;
function stream(body){return new ReadableStream({start(c){c.enqueue(body);},cancel(){cancelled++;}});}
const badResponses=[
 ()=>new Response(stream(new Uint8Array([1])),{status:503,headers:{'Content-Type':'application/json'}}),
 ()=>new Response(stream(new Uint8Array([1])),{headers:{'Content-Type':'text/html'}}),
 ()=>new Response(stream(new Uint8Array([1])),{headers:{'Content-Type':'application/json','Content-Length':'2000001'}}),
 ()=>new Response(stream(new Uint8Array([1])),{headers:{'Content-Type':'application/json','Content-Length':'1e3'}}),
 ()=>new Response(stream(new Uint8Array(2000001)),{headers:{'Content-Type':'application/json'}}),
 ()=>{const r=new Response(stream(new Uint8Array([1])),{headers:{'Content-Type':'application/json'}});Object.defineProperty(r,'redirected',{value:true});return r;},
 ()=>{const r=new Response(stream(new Uint8Array([1])),{headers:{'Content-Type':'application/json'}});Object.defineProperty(r,'url',{value:'https://attacker.invalid/replaced.json'});return r;},
];
for(const make of badResponses){const readBad=publicTextbookContextReader({fetcher:async()=>make()});await assert.rejects(()=>readBad(env,selection()),/context_unavailable/);checks++;}
ok(cancelled===badResponses.length,'rejected status/type/size/redirect bodies are cancelled');
let timeoutCalls=0;
const timed=publicTextbookContextReader({timeoutMs:15,fetcher:async request=>{
 if(++timeoutCalls>1)return response('math1');
 return new Promise((resolve,reject)=>request.signal.addEventListener('abort',()=>reject(Error('fixture_aborted')),{once:true}));
}});
await assert.rejects(()=>timed(env,selection()),/fixture_aborted/);checks++;
ok((await timed(env,selection())).book==='math1'&&timeoutCalls===2,'source timeout aborts and clears the public cache entry');
let bodyCalls=0;
const bodyTimed=publicTextbookContextReader({timeoutMs:15,fetcher:async request=>{
 if(++bodyCalls>1)return response('math1');
 return new Response(new ReadableStream({start(controller){request.signal.addEventListener('abort',()=>controller.error(Error('fixture_body_aborted')),{once:true});}}),{headers:{'Content-Type':'application/json'}});
}});
await assert.rejects(()=>bodyTimed(env,selection()),/fixture_body_aborted/);checks++;
ok((await bodyTimed(env,selection())).book==='math1'&&bodyCalls===2,'source body timeout aborts and permits later recovery');
console.log(JSON.stringify({status:'passed',checks,publicCatalogFetches:calls,scope:'actual generated six-book catalogs; fixed URLs/SHA/source signatures, header isolation, bounds, public-only cache, failed fetch and timeout recovery; no private data or provider calls; endpoint/UI still unimplemented'},null,2));
