// Internal D1 adapter candidate. No HTTP, credentials, provider calls or activation.
import {inspectWave} from './transport.mjs';
const CHUNK=256*1024,MAX=20*1024*1024,HASH=/^[a-f0-9]{64}$/;
const key=hash=>{if(!HASH.test(hash))throw Error('invalid speech hash');return 'textbook-speech:'+hash;};
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
function encode(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
function decode(s){if(typeof s!=='string'||s.length>Math.ceil(CHUNK/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('invalid audio chunk');const text=atob(s);return Uint8Array.from(text,c=>c.charCodeAt(0));}
export function createAudioCache(db){
 if(!db?.prepare||!db?.batch)throw Error('missing cache storage');
 async function manifest(hash){const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key(hash)).first('v');if(raw===null)return null;if(typeof raw!=='string'||raw.length>2000)throw Error('invalid audio receipt');const row=JSON.parse(raw);if(row?.requestSha256!==hash||!['pending','uncertain','complete'].includes(row.state)||typeof row.token!=='string')throw Error('invalid audio receipt');return row;}
 return Object.freeze({
  async claim(hash){
   const row={requestSha256:hash,state:'pending',token:crypto.randomUUID()};
   const inserted=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING RETURNING v').bind(key(hash),JSON.stringify(row)).first('v');
   if(inserted!==null)return {created:true,token:row.token};
   return {created:false,state:(await manifest(hash))?.state||'uncertain'};
  },
  async receipt(hash){
   const row=await manifest(hash);if(!row||row.state!=='complete')return row;
   if(!HASH.test(row.audioSha256)||!Number.isSafeInteger(row.length)||row.length<44||row.length>MAX||row.chunks!==Math.ceil(row.length/CHUNK))throw Error('invalid audio manifest');
   const bytes=new Uint8Array(row.length);let offset=0;
   for(let i=0;i<row.chunks;i++){
    const raw=await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(key(hash)+':'+i).first('v');
    const part=decode(raw),expected=Math.min(CHUNK,row.length-offset);if(part.length!==expected)throw Error('missing or changed audio chunk');bytes.set(part,offset);offset+=part.length;
   }
   if(await digest(bytes)!==row.audioSha256)throw Error('cached audio checksum changed');
   return {...row,bytes,info:inspectWave(bytes)};
  },
  async commit(hash,token,bytes){
   const row=await manifest(hash);if(!row||row.state!=='pending'||row.token!==token)return false;
   const info=inspectWave(bytes),audioSha256=await digest(bytes),count=Math.ceil(bytes.length/CHUNK),base=key(hash);
   const condition="EXISTS(SELECT 1 FROM auth_kv WHERE k=? AND json_extract(v,'$.state')='pending' AND json_extract(v,'$.token')=?)";
   const statements=[];
   for(let i=0;i<count;i++)statements.push(db.prepare('INSERT INTO auth_kv(k,v,expires_at) SELECT ?,?,0 WHERE '+condition+' ON CONFLICT(k) DO NOTHING').bind(base+':'+i,encode(bytes.subarray(i*CHUNK,(i+1)*CHUNK)),base,token));
   const complete={...row,state:'complete',audioSha256,length:bytes.length,chunks:count,info};
   statements.push(db.prepare("UPDATE auth_kv SET v=? WHERE k=? AND json_extract(v,'$.state')='pending' AND json_extract(v,'$.token')=? AND "+Array.from({length:count},(_,i)=>'EXISTS(SELECT 1 FROM auth_kv WHERE k=?)').join(' AND ')+' RETURNING v').bind(JSON.stringify(complete),base,token,...Array.from({length:count},(_,i)=>base+':'+i)));
   const result=await db.batch(statements);
   return result.at(-1)?.meta?.changes===1;
  },
  async uncertain(hash,token){return !!await db.prepare("UPDATE auth_kv SET v=json_set(v,'$.state','uncertain') WHERE k=? AND json_extract(v,'$.state')='pending' AND json_extract(v,'$.token')=? RETURNING v").bind(key(hash),token).first('v');}
 });
}
