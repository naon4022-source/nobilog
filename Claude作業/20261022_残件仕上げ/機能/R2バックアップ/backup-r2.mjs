// R2 への毎日の暗号化バックアップ（2026-10-22 Claude・候補。本番のバケット作成・鍵登録・cron 登録はしていない）
// ・中身：渡された exporters（{name, rows()}）の行を JSON Lines にまとめ、AES-256-GCM で暗号化して R2 に1日1個置く。
// ・鍵：env.BACKUP_KEY（32バイトを base64）。値はコード・ログ・オブジェクトに入れない。鍵がなければ何もしない。
// ・世代：backups/<YYYY-MM-DD>.enc（日本時間の日付）。同じ日はもう一度作らない（二重作成なし）。古い世代を消すのは keepDays を明示したときだけ。
// ・復元：restorePlan は「下書き」だけ。復号して SHA-256 を確かめ、行を返す。本物の DB へ書き戻す処理は入れていない（人の確認が要る）。
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=u=>btoa(String.fromCharCode(...u)),unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function key(env,usage){if(!env||typeof env.BACKUP_KEY!=='string')return null;let raw;try{raw=unb64(env.BACKUP_KEY);}catch{return null;}if(raw.length!==32)return null;return crypto.subtle.importKey('raw',raw,'AES-GCM',false,[usage]);}
// 決めたルール（2026-10-22 ユーザー「適当に決めておいて」）：毎日の分は30日、各月1日の分は12か月残す。
export const POLICY=Object.freeze({keepDays:30,keepMonths:12,cronUtc:'0 18 * * *'});   // 日本時間 午前3時
export function jstDay(ms){return new Date(ms+9*3600000).toISOString().slice(0,10);}
export async function runBackup(env,bucket,exporters,{now=Date.now(),keepDays=null,keepMonths=0}={}){
 const k=await key(env,'encrypt');if(!k||!bucket)return {status:'skipped',reason:'鍵または保存先がありません'};
 const day=jstDay(now),name='backups/'+day+'.enc';
 if(await bucket.head(name))return {status:'exists',name};   // 同じ日は作り直さない
 const lines=[];const counts={};
 for(const ex of exporters){counts[ex.name]=0;for await(const row of ex.rows()){lines.push(JSON.stringify({t:ex.name,r:row}));counts[ex.name]++;}}
 const plain=enc.encode(lines.join('\n')),iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(name)},k,plain));
 const meta={v:1,iv:b64(iv),sha256:await sha256(plain),bytes:plain.length,counts,at:now};
 await bucket.put(name,cipher,{customMetadata:{meta:JSON.stringify(meta)}});
 let removed=[];
 if(Number.isInteger(keepDays)&&keepDays>=7){   // 7日より短くはしない
  const listed=await bucket.list({prefix:'backups/'});const keep=new Set();for(let i=0;i<keepDays;i++)keep.add('backups/'+jstDay(now-i*86400000)+'.enc');
  const ym=jstDay(now).slice(0,7).split('-').map(Number);for(let i=0;i<(Number.isInteger(keepMonths)&&keepMonths>0?keepMonths:0);i++){const t=ym[0]*12+(ym[1]-1)-i;keep.add('backups/'+Math.floor(t/12)+'-'+String(t%12+1).padStart(2,'0')+'-01.enc');}
  for(const o of listed.objects)if(/^backups\/\d{4}-\d{2}-\d{2}\.enc$/.test(o.key)&&!keep.has(o.key)){await bucket.delete(o.key);removed.push(o.key);}
 }
 return {status:'created',name,counts,bytes:plain.length,removed};
}
export async function restorePlan(env,bucket,name){
 const k=await key(env,'decrypt');if(!k)return {ok:false,reason:'鍵がありません'};
 const obj=await bucket.get(name);if(!obj)return {ok:false,reason:'その日のバックアップはありません'};
 let meta;try{meta=JSON.parse(obj.customMetadata.meta);}catch{return {ok:false,reason:'情報が読めません'};}
 let plain;try{plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(meta.iv),additionalData:enc.encode(name)},k,new Uint8Array(await obj.arrayBuffer())));}catch{return {ok:false,reason:'復号できません（鍵がちがうか、こわれています）'};}
 if(await sha256(plain)!==meta.sha256)return {ok:false,reason:'中身が一致しません'};
 const rows=dec.decode(plain).split('\n').filter(Boolean).map(l=>JSON.parse(l));
 return {ok:true,name,counts:meta.counts,rows,draftOnly:true};   // 書き戻しは人が確認してから（このコードではしない）
}
