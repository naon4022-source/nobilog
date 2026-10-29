// 生徒が実際に書きそうな答え（別解・まぎらわしい誤答）を、本物の採点エンジンで採点して期待どおりか確かめる（Claude・2026-10-14）。
// 使い方：node probe_tokkun.cjs probes/tokkun-social-1-geo-asia.json [...]
// probes ファイル：{"unit":"tokkun-....json","cases":[{"n":問題番号(1から),"input":"答え","expect":true/false,"why":"理由"}]}
// 問題文の先頭も "head" に入れておき、問題の順番が変わったときに取りちがえないようにする。
const fs=require('fs'),path=require('path');
const engine=require(path.resolve(__dirname,'../実装/material-engine.js'));
let fail=0,total=0;
for(const f of process.argv.slice(2)){
 const P=JSON.parse(fs.readFileSync(path.resolve(f),'utf8'));
 const u=JSON.parse(fs.readFileSync(path.resolve(__dirname,P.unit),'utf8'));let bad=[];
 for(const c of P.cases){
  total++;
  const q=u.questions[c.n-1];
  if(!q||!q.prompt.startsWith(c.head)){bad.push(`#${c.n} 問題が見つからない（${c.head}）`);continue;}
  const r=engine.grade(q,c.input);
  if(!!r.correct!==c.expect)bad.push(`#${c.n} 「${c.input}」→ ${r.correct?'正解':'不正解'}（期待：${c.expect?'正解':'不正解'}・${c.why||''}）`);
 }
 console.log(path.basename(P.unit),'確認',P.cases.length,'件',bad.length?'❌ '+bad.length:'✅ 期待どおり');for(const x of bad)console.log('   ',x);
 if(bad.length)fail++;
}
console.log('合計',total,'件');process.exit(fail?1:0);
