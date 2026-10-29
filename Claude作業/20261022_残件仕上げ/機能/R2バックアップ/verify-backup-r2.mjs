// R2 バックアップ候補の確認（合成の行・メモリのにせ R2 だけ。本物のデータ・鍵・バケットは使わない）
import {runBackup,restorePlan,jstDay} from './backup-r2.mjs';
let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
const fakeR2=()=>{const m=new Map();return {m,head:async k=>m.has(k)?{}:null,put:async(k,v,o)=>{m.set(k,{v:new Uint8Array(v),meta:o.customMetadata});},get:async k=>{const x=m.get(k);return x&&{customMetadata:x.meta,arrayBuffer:async()=>x.v.buffer.slice(0)};},list:async({prefix})=>({objects:[...m.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}),delete:async k=>{m.delete(k);}};};
const keyB64=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),env={BACKUP_KEY:keyB64};
const rows=[{uid:'synthetic-1',k:'appData',v:'{"score":10}'},{uid:'synthetic-2',k:'appData',v:'{"score":20,"memo":"にほんご"}'}];
const ex=[{name:'board',rows:async function*(){yield*rows;}},{name:'records',rows:async function*(){yield {id:'a1',correct:true};}}];
const r2=fakeR2();const day0=Date.UTC(2026,9,22,0,0);
ok((await runBackup({},r2,ex,{now:day0})).status==='skipped'&&r2.m.size===0,'no key → nothing written');
ok((await runBackup({BACKUP_KEY:'short'},r2,ex,{now:day0})).status==='skipped','bad key → nothing written');
const a=await runBackup(env,r2,ex,{now:day0});ok(a.status==='created'&&a.name==='backups/'+jstDay(day0)+'.enc','created one object for the JST day');
const stored=Buffer.from(r2.m.get(a.name).v).toString('utf8');ok(!stored.includes('synthetic-1')&&!stored.includes('score')&&!stored.includes(keyB64),'stored bytes are encrypted, no key inside');
ok(!JSON.stringify(r2.m.get(a.name).meta).includes('synthetic'),'metadata has counts only, no row content');
ok((await runBackup(env,r2,ex,{now:day0+3600000})).status==='exists'&&r2.m.size===1,'same day is not created twice');
const p=await restorePlan(env,r2,a.name);ok(p.ok&&p.draftOnly&&p.rows.length===3&&p.rows[1].r.v.includes('にほんご'),'restore draft returns the exact rows');
ok(!(await restorePlan({BACKUP_KEY:Buffer.from(new Uint8Array(32)).toString('base64')},r2,a.name)).ok,'wrong key cannot decrypt');
const x=r2.m.get(a.name);x.v[5]^=1;ok(!(await restorePlan(env,r2,a.name)).ok,'tampered backup is rejected');x.v[5]^=1;
// 中身の取りかえ（別の日の名前で使い回す）も見つける
r2.m.set('backups/2026-01-01.enc',r2.m.get(a.name));ok(!(await restorePlan(env,r2,'backups/2026-01-01.enc')).ok,'object moved to another name is rejected');r2.m.delete('backups/2026-01-01.enc');
// 世代：keepDays を明示したときだけ古いものを外す。7日未満は無視
for(let d=1;d<=10;d++)await runBackup(env,r2,ex,{now:day0+d*86400000});ok(r2.m.size===11,'without keepDays nothing is deleted ('+r2.m.size+')');
const g=await runBackup(env,r2,ex,{now:day0+11*86400000,keepDays:3});ok(g.removed.length===0&&r2.m.size===12,'keepDays below 7 is ignored');
const h=await runBackup(env,r2,ex,{now:day0+12*86400000,keepDays:7});ok(r2.m.size===7&&h.removed.length===6,'keeps the latest 7 days when asked');
ok((await restorePlan(env,r2,'backups/'+jstDay(day0+12*86400000)+'.enc')).ok,'latest restorable');
// 月1回の分を残す（30日＋12か月）
{const r3=fakeR2();const base=Date.UTC(2026,0,1)-9*3600000;for(let d=0;d<400;d++)await runBackup(env,r3,ex,{now:base+d*86400000,keepDays:30,keepMonths:12});
 const keys=[...r3.m.keys()];const firsts=keys.filter(k=>/-01\.enc$/.test(k));ok(firsts.length>=12&&firsts.length<=13,'keeps 12 first-of-month backups ('+firsts.length+')');ok(keys.length<=30+12,'total stays bounded ('+keys.length+')');}
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f);process.exit(f?1:0);
