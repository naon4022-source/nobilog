// パスワード変更の準備コードの確認（にせの値・メモリのストアだけ。本物のPIN・pepper・検証値は使わない）
import {createHmac,timingSafeEqual} from 'node:crypto';
import {createPasswordChange,passwordChangeEnabled,validNewPin} from './password-change.mjs';
let n=0,f=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('❌',m);}};
const PEPPER='test-only-pepper';const kd=async(v,s)=>createHmac('sha256',s).update(String(v)).digest('base64url');
const ce=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const legacy={u1:await kd('2468',PEPPER),u2:await kd('1357',PEPPER),u4:await kd('8642',PEPPER)};
let t=1_000_000;const map=new Map(),writes=[];
const store={get:async k=>map.get(k)??null,put:async(k,v)=>{writes.push(k);map.set(k,v);},cas:async(k,exp,v)=>{if((map.get(k)??null)!==exp)return false;writes.push(k);map.set(k,v);return true;}};
const pc=createPasswordChange({store,keyedDigest:kd,constantEqual:ce,legacyVerifier:uid=>legacy[uid]||'',now:()=>t});
const ON={PASSWORD_CHANGE_ENABLED:'1',PASSWORD_CHANGE_ADMIN_READY:'1',PIN_PEPPER:PEPPER};
// 1. 使えない状態：フラグがそろうまで何もしない
for(const env of [{},{PASSWORD_CHANGE_ENABLED:'1',PIN_PEPPER:PEPPER},{PASSWORD_CHANGE_ADMIN_READY:'1',PIN_PEPPER:PEPPER},{PASSWORD_CHANGE_ENABLED:'1',PASSWORD_CHANGE_ADMIN_READY:'1'}]){
 const r=await pc.handle({current:'2468',next:'5791',rev:0},env,{uid:'u1'});ok(r.status===503,'disabled until both flags and pepper: '+JSON.stringify(env));}
ok(writes.length===0&&map.size===0,'disabled state writes nothing');
ok(!passwordChangeEnabled({})&&passwordChangeEnabled(ON),'enabled check');
// 2. 入力の検査
for(const [p,good] of [['5791',true],['12345678',false],['0000',false],['9876',false],['123',false],['123456789',false],['abcd',false],['50731',true]])ok(!validNewPin(p)===good,'new pin rule '+p);
// 3. 本人以外・体験版は使えない
ok((await pc.handle({current:'2468',next:'5791',rev:0},ON,{uid:'u3'})).status===403,'trial u3 refused');
ok((await pc.handle({current:'2468',next:'5791',rev:0},ON,{uid:'x_abc'})).status===403,'new account refused');
ok((await pc.handle({current:'2468',next:'5791',rev:0},ON,null)).status===403,'no session refused');
// 4. 変更：今のパスワード（Secretsの形）で確認 → 新しい検証値だけ保存
const r=await pc.handle({current:'2468',next:'5791',rev:0},ON,{uid:'u1'});ok(r.status===200&&r.body.rev===1,'change succeeds');
const saved=map.get('pin-override:u1');ok(saved&&!saved.includes('5791')&&!saved.includes('2468'),'raw PIN never stored');ok(!JSON.stringify(r.body).includes('5791'),'response has no PIN');
ok((await pc.verify('u1','5791',ON)).ok&&!(await pc.verify('u1','2468',ON)).ok,'new PIN works, old PIN no longer');
ok((await pc.verify('u2','1357',ON)).ok,'other person unchanged');
// 5. 古い版番号・同時変更
ok((await pc.handle({current:'5791',next:'2580',rev:0},ON,{uid:'u1'})).status===409,'stale rev refused');
const a=pc.handle({current:'5791',next:'2580',rev:1},ON,{uid:'u1'}),b=pc.handle({current:'5791',next:'3691',rev:1},ON,{uid:'u1'});const [ra,rb]=await Promise.all([a,b]);
ok([ra.status,rb.status].sort().join()==='200,409','two parallel changes: one wins, one conflicts');
// 6. まちがいの制限
const before=map.get('pin-override:u2');for(let i=0;i<5;i++)await pc.handle({current:'0000',next:'5791',rev:0},ON,{uid:'u2'});
ok((await pc.handle({current:'1357',next:'5791',rev:0},ON,{uid:'u2'})).status===429,'locked after 5 wrong tries even with the right PIN');
t+=15*60*1000+1;ok((await pc.handle({current:'1357',next:'5791',rev:0},ON,{uid:'u2'})).status===200,'unlocked after 15 minutes');ok(before===undefined,'u2 had no override before');
ok((await pc.handle({current:'1357',next:'1357',rev:0},ON,{uid:'u4'})).status===400,'same as current refused');
console.log('チェック '+n+'件　✅ '+(n-f)+'　❌ '+f);process.exit(f?1:0);
